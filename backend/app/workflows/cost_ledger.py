# Cost tracking and budget reservation system
# Implements Build Plan Section 10

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import UsageLedger
from app.core.config import settings

# Published base rates (Build Plan Section 10)
ESTIMATED_RATES = {
    "script_generation": 0.005,      # Gemini 3.8 Flash text
    "claim_verification": 0.003,     # Gemini 3.8 Flash text check
    "image_generation": 0.0336,      # Nano Banana 2 Lite 1k image
    "tts_narration": 0.015,          # Gemini 3.8 Flash TTS per short video
    "video_render": 0.000            # Local FFmpeg compute is free
}

def get_current_spend(db: Session) -> dict:
    """Calculate total month and daily actual spend plus active reservations."""
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    day_start = datetime(now.year, now.month, now.day)
    
    # Month actual spend
    month_actual = db.query(func.sum(UsageLedger.actual_cost)).filter(
        UsageLedger.created_at >= month_start
    ).scalar() or 0.0

    # Day actual spend
    day_actual = db.query(func.sum(UsageLedger.actual_cost)).filter(
        UsageLedger.created_at >= day_start
    ).scalar() or 0.0

    # Active reservations (where actual_cost is 0 but reserved_cost > 0 from the last 1 hour)
    one_hour_ago = now - timedelta(hours=1)
    active_reservations = db.query(func.sum(UsageLedger.reserved_cost)).filter(
        UsageLedger.created_at >= one_hour_ago,
        UsageLedger.actual_cost == 0.0
    ).scalar() or 0.0

    return {
        "monthly_actual": round(month_actual, 4),
        "monthly_reserved": round(active_reservations, 4),
        "monthly_total": round(month_actual + active_reservations, 4),
        "monthly_limit": settings.API_MONTHLY_LIMIT,
        "daily_actual": round(day_actual, 4),
        "daily_limit": settings.API_DAILY_LIMIT,
        "per_video_limit": settings.PER_VIDEO_LIMIT,
        "remaining_monthly": max(0.0, round(settings.API_MONTHLY_LIMIT - (month_actual + active_reservations), 4))
    }

def reserve_budget(db: Session, operation: str, details: dict = None) -> UsageLedger:
    """
    Check budget limits and create an open cost reservation record before API calls.
    Raises ValueError if the operation would exceed configured budget.
    """
    rate = ESTIMATED_RATES.get(operation, 0.01)
    spend = get_current_spend(db)

    # Check daily and monthly caps
    if spend["monthly_total"] + rate > settings.API_MONTHLY_LIMIT:
        raise ValueError(f"Monthly budget cap exceeded (${settings.API_MONTHLY_LIMIT:.2f}). Operation blocked.")
    
    if spend["daily_actual"] + rate > settings.API_DAILY_LIMIT:
        raise ValueError(f"Daily budget cap exceeded (${settings.API_DAILY_LIMIT:.2f}). Operation blocked.")

    # Create ledger record
    reservation = UsageLedger(
        provider="gemini",
        operation=operation,
        reserved_cost=rate,
        actual_cost=0.0,
        currency="USD",
        details=details or {}
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation

def reconcile_budget(db: Session, reservation_id: str, actual_cost: float = None):
    """Update reservation with the actual final cost reported by provider."""
    entry = db.query(UsageLedger).filter(UsageLedger.id == reservation_id).first()
    if entry:
        entry.actual_cost = actual_cost if actual_cost is not None else entry.reserved_cost
        db.commit()
