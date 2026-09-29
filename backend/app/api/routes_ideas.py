# Ideas Board API routes
# Implements Build Plan Section 7 and 13

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.db.models import Idea, Channel

router = APIRouter(prefix="/ideas", tags=["Ideas"])

class IdeaCreateRequest(BaseModel):
    question: str
    pillar: Optional[str] = "Everyday Tech"
    original_angle: Optional[str] = ""
    editorial_fit_score: Optional[int] = 85

class IdeaUpdateRequest(BaseModel):
    question: Optional[str] = None
    pillar: Optional[str] = None
    original_angle: Optional[str] = None
    status: Optional[str] = None
    editorial_fit_score: Optional[int] = None

@router.get("")
def list_ideas(db: Session = Depends(get_db)):
    """List all ideas with their pillar, status, and scores."""
    ideas = db.query(Idea).order_by(Idea.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "pillar": i.pillar,
            "question": i.question,
            "original_angle": i.original_angle,
            "status": i.status,
            "editorial_fit_score": i.editorial_fit_score,
            "created_at": i.created_at
        }
        for i in ideas
    ]

@router.post("")
def create_idea(payload: IdeaCreateRequest, db: Session = Depends(get_db)):
    """Create a new video idea on the board."""
    channel = db.query(Channel).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    # Check for duplicate question
    existing = db.query(Idea).filter(Idea.question.ilike(payload.question.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="An idea with this question already exists!")

    idea = Idea(
        channel_id=channel.id,
        pillar=payload.pillar,
        question=payload.question,
        original_angle=payload.original_angle,
        editorial_fit_score=payload.editorial_fit_score or 85,
        status="new"
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)

    return {"message": "Idea added to board", "idea": {"id": idea.id, "question": idea.question}}

@router.patch("/{id}")
def update_idea(id: str, payload: IdeaUpdateRequest, db: Session = Depends(get_db)):
    """Update idea status, pillar, angle, or score."""
    idea = db.query(Idea).filter(Idea.id == id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    if payload.question is not None:
        idea.question = payload.question
    if payload.pillar is not None:
        idea.pillar = payload.pillar
    if payload.original_angle is not None:
        idea.original_angle = payload.original_angle
    if payload.status is not None:
        idea.status = payload.status
    if payload.editorial_fit_score is not None:
        idea.editorial_fit_score = payload.editorial_fit_score

    db.commit()
    return {"message": "Idea updated", "id": idea.id, "status": idea.status}

@router.delete("/{id}")
def delete_idea(id: str, db: Session = Depends(get_db)):
    """Delete an idea from the board."""
    idea = db.query(Idea).filter(Idea.id == id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    db.delete(idea)
    db.commit()
    return {"message": "Idea deleted successfully"}
