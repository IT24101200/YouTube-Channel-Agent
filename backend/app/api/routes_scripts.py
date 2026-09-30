# Script generation, editing, and claim verification API routes
# Implements Build Plan Section 7, 8, 15

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.db.database import get_db
from app.db.models import Script, Idea, Channel, ChannelBrief, EvidenceItem, Approval
from app.providers.factory import get_text_provider
from app.workflows.cost_ledger import reserve_budget, reconcile_budget

router = APIRouter(tags=["Scripts"])

class ScriptUpdateRequest(BaseModel):
    learning_goal: Optional[str] = None
    title_options: Optional[List[str]] = None
    narration: Optional[str] = None
    scenes: Optional[List[Dict[str, Any]]] = None

@router.get("/ideas/{idea_id}/script")
def get_script_for_idea(idea_id: str, db: Session = Depends(get_db)):
    """Fetch the latest script draft for a given idea."""
    script = db.query(Script).filter(Script.idea_id == idea_id).order_by(Script.version.desc()).first()
    if not script:
        return {"script": None}
    return {"script": _format_script(script)}

@router.get("/scripts/{id}")
def get_script_by_id(id: str, db: Session = Depends(get_db)):
    """Fetch script details by ID."""
    script = db.query(Script).filter(Script.id == id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return {"script": _format_script(script)}

@router.post("/ideas/{idea_id}/draft")
def generate_script_draft(idea_id: str, db: Session = Depends(get_db)):
    """
    Generate an evidence-backed script draft.
    Reserves cost and creates structured 4-scene contract.
    """
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    channel = db.query(Channel).first()
    if channel and channel.pause_production:
        raise HTTPException(status_code=400, detail="Production is currently paused by owner!")

    brief = db.query(ChannelBrief).filter(ChannelBrief.channel_id == idea.channel_id).first()
    brief_data = {
        "name": brief.name if brief else "ClearTech Minute",
        "audience": brief.audience if brief else "technology_beginners",
        "language": brief.language if brief else "en"
    }

    # Reserve budget for script generation
    reservation = reserve_budget(db, "script_generation", {"idea_id": idea_id})

    try:
        provider = get_text_provider()
        draft = provider.generate_script(
            topic=idea.question,
            angle=idea.original_angle,
            brief=brief_data
        )

        # Get existing version number
        latest_ver = db.query(Script).filter(Script.idea_id == idea_id).count()

        # Ensure narration is always a string
        narr = draft.get("narration", "")
        if isinstance(narr, dict):
            narr_str = " ".join(str(v) for v in narr.values())
        elif isinstance(narr, list):
            narr_str = " ".join(str(v) for v in narr)
        else:
            narr_str = str(narr)

        script = Script(
            idea_id=idea.id,
            version=latest_ver + 1,
            learning_goal=str(draft.get("learning_goal", "")),
            title_options=draft.get("title_options", [idea.question]),
            narration=narr_str,
            scenes=draft.get("scenes", []),
            claims=draft.get("claims", []),
            verification_status="pending",
            owner_edited=False
        )
        db.add(script)
        
        # Update idea status
        idea.status = "scripted"
        db.commit()
        db.refresh(script)

        # Reconcile budget (0.00 for local Ollama, 0.005 for cloud)
        from app.core.config import settings
        actual_cost = 0.0 if settings.LLM_PROVIDER == "ollama" else 0.005
        reconcile_budget(db, reservation.id, actual_cost)

        return {"message": f"Script generated successfully via {settings.LLM_PROVIDER.upper()}", "script": _format_script(script)}

    except Exception as e:
        db.rollback()
        try:
            reconcile_budget(db, reservation.id, 0.0)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/scripts/{id}")
def update_script(id: str, payload: ScriptUpdateRequest, db: Session = Depends(get_db)):
    """
    Save owner edits to script.
    Critical Rule: Invalidate any previous approval binding (Build Plan Section 6).
    """
    script = db.query(Script).filter(Script.id == id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    if payload.learning_goal is not None:
        script.learning_goal = payload.learning_goal
    if payload.title_options is not None:
        script.title_options = payload.title_options
    if payload.narration is not None:
        script.narration = payload.narration
    if payload.scenes is not None:
        script.scenes = payload.scenes

    script.owner_edited = True
    
    # Invalidate existing approvals for video versions tied to this script
    approvals = db.query(Approval).join(Script.video_versions).filter(Script.id == id).all()
    for a in approvals:
        a.is_active = False

    db.commit()
    return {"message": "Script updated. Existing approvals invalidated for safety.", "script": _format_script(script)}

@router.post("/scripts/{id}/verify")
def verify_script_claims(id: str, db: Session = Depends(get_db)):
    """Fact check claims against evidence sources (Build Plan Section 7)."""
    script = db.query(Script).filter(Script.id == id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    sources = db.query(EvidenceItem).all()
    source_list = [{"id": s.id, "title": s.title, "extract": s.short_extract} for s in sources]

    provider = get_text_provider()
    verified_claims = provider.verify_claims(
        script_text=script.narration,
        claims=script.claims or [],
        sources=source_list
    )

    script.claims = verified_claims
    script.verification_status = "verified"
    db.commit()

    return {"message": "Claims verified", "verification_status": script.verification_status, "claims": script.claims}

def _format_script(script: Script) -> Dict[str, Any]:
    return {
        "id": script.id,
        "idea_id": script.idea_id,
        "version": script.version,
        "learning_goal": script.learning_goal,
        "title_options": script.title_options or [],
        "narration": script.narration,
        "scenes": script.scenes or [],
        "claims": script.claims or [],
        "verification_status": script.verification_status,
        "owner_edited": script.owner_edited,
        "created_at": script.created_at
    }
