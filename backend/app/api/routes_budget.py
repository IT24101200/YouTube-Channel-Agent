# Budget and Audit operations API routes
# Implements Build Plan Section 10 and 19

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import UsageLedger, AuditEvent
from app.workflows.cost_ledger import get_current_spend

router = APIRouter(prefix="/budget", tags=["Budget & Operations"])

@router.get("/usage")
def get_budget_usage(db: Session = Depends(get_db)):
    """Fetch spending summary, limits, and active ledger entries."""
    spend = get_current_spend(db)
    
    # Recent ledger items
    ledger = db.query(UsageLedger).order_by(UsageLedger.created_at.desc()).limit(15).all()
    ledger_items = [
        {
            "id": l.id,
            "operation": l.operation,
            "reserved_cost": l.reserved_cost,
            "actual_cost": l.actual_cost,
            "details": l.details,
            "created_at": l.created_at
        }
        for l in ledger
    ]

    return {
        "summary": spend,
        "recent_ledger": ledger_items
    }

@router.get("/audit")
def get_audit_events(db: Session = Depends(get_db)):
    """Fetch security, mode change, and operational audit events."""
    events = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(20).all()
    return [
        {
            "id": e.id,
            "actor": e.actor,
            "action": e.action,
            "resource": e.resource,
            "details": e.details,
            "created_at": e.created_at
        }
        for e in events
    ]
