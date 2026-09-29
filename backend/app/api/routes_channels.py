# Channel and settings API routes
# Implements Build Plan Section 6 and Section 13

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Channel, ChannelBrief, AuditEvent

router = APIRouter(prefix="/channels", tags=["Channels"])

class ModeUpdateRequest(BaseModel):
    mode: str  # 'manual', 'draft', 'approved_queue', 'bounded_auto'

class PauseUpdateRequest(BaseModel):
    pause_production: Optional[bool] = None
    pause_publishing: Optional[bool] = None

class BriefUpdateRequest(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    viewer_promise: Optional[str] = None
    audience: Optional[str] = None
    language: Optional[str] = None
    pillars: Optional[List[str]] = None

@router.get("/current")
def get_current_channel(db: Session = Depends(get_db)):
    """Fetch the active channel and brief."""
    channel = db.query(Channel).first()
    if not channel:
        raise HTTPException(status_code=404, detail="No channel found")
    
    brief = db.query(ChannelBrief).filter(ChannelBrief.channel_id == channel.id).order_by(ChannelBrief.version.desc()).first()
    
    return {
        "channel": {
            "id": channel.id,
            "name": channel.name_snapshot,
            "youtube_channel_id": channel.youtube_channel_id,
            "timezone": channel.timezone,
            "mode": channel.mode,
            "pause_production": channel.pause_production,
            "pause_publishing": channel.pause_publishing,
            "created_at": channel.created_at
        },
        "brief": {
            "name": brief.name if brief else "ClearTech Minute",
            "handle": brief.handle if brief else "@ClearTechMinute",
            "viewer_promise": brief.viewer_promise if brief else "",
            "audience": brief.audience if brief else "technology_beginners",
            "language": brief.language if brief else "en",
            "pillars": brief.pillars if brief else [],
            "style_guidelines": brief.style_guidelines if brief else ""
        }
    }

@router.patch("/mode")
def update_channel_mode(payload: ModeUpdateRequest, db: Session = Depends(get_db)):
    """Update operating mode with audit log."""
    valid_modes = ["manual", "draft", "approved_queue", "bounded_auto"]
    if payload.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of {valid_modes}")

    channel = db.query(Channel).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    old_mode = channel.mode
    channel.mode = payload.mode

    # Record audit event
    audit = AuditEvent(
        actor="owner",
        action="change_operating_mode",
        resource=f"channel:{channel.id}",
        details={"before": old_mode, "after": payload.mode}
    )
    db.add(audit)
    db.commit()

    return {"message": "Operating mode updated", "mode": channel.mode}

@router.post("/pause")
def update_pause_flags(payload: PauseUpdateRequest, db: Session = Depends(get_db)):
    """Persist concrete production and publishing pause flags (Build Plan Section 6)."""
    channel = db.query(Channel).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    if payload.pause_production is not None:
        channel.pause_production = payload.pause_production
    if payload.pause_publishing is not None:
        channel.pause_publishing = payload.pause_publishing

    audit = AuditEvent(
        actor="owner",
        action="update_pause_flags",
        resource=f"channel:{channel.id}",
        details={
            "pause_production": channel.pause_production,
            "pause_publishing": channel.pause_publishing
        }
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Pause flags updated",
        "pause_production": channel.pause_production,
        "pause_publishing": channel.pause_publishing
    }

@router.patch("/brief")
def update_channel_brief(payload: BriefUpdateRequest, db: Session = Depends(get_db)):
    """Update channel brief parameters."""
    channel = db.query(Channel).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    brief = db.query(ChannelBrief).filter(ChannelBrief.channel_id == channel.id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    if payload.name:
        brief.name = payload.name
        channel.name_snapshot = payload.name
    if payload.handle:
        brief.handle = payload.handle
    if payload.viewer_promise:
        brief.viewer_promise = payload.viewer_promise
    if payload.audience:
        brief.audience = payload.audience
    if payload.language:
        brief.language = payload.language
    if payload.pillars is not None:
        brief.pillars = payload.pillars

    db.commit()
    return {"message": "Brief updated successfully"}

@router.post("/reset-system-data")
def reset_system_data():
    """
    Clear all dummy data, sample scripts, ideas, publishing jobs, 
    comments, reports, and generated media files across the entire system.
    """
    from app.db.init_db import wipe_all_sample_data
    wipe_all_sample_data()
    return {"message": "All sample data, ideas, scripts, and media files have been completely cleared."}

