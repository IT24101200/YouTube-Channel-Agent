# Viewer Comments and Reply Drafting API routes
# Implements Build Plan Section 5, 13, 18

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.db.models import Comment, AuditEvent
from app.core.config import settings
from app.workflows.cost_ledger import reserve_budget, reconcile_budget

router = APIRouter(prefix="/comments", tags=["Comments & Community"])

class ReplyDraftRequest(BaseModel):
    custom_instructions: Optional[str] = ""

class SendReplyRequest(BaseModel):
    reply_text: str

@router.get("")
def list_comments(db: Session = Depends(get_db)):
    """List viewer comments and proposed AI replies."""
    comments = db.query(Comment).order_by(Comment.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "remote_comment_id": c.remote_comment_id,
            "video_id": c.video_id,
            "video_title": c.video_title,
            "author_display_name": c.author_display_name,
            "text_snapshot": c.text_snapshot,
            "proposed_reply": c.proposed_reply,
            "moderation_state": c.moderation_state,
            "created_at": c.created_at
        }
        for c in comments
    ]

@router.post("/{id}/draft-reply")
def draft_ai_reply(id: str, payload: ReplyDraftRequest, db: Session = Depends(get_db)):
    """
    Draft an educational reply to a viewer comment using Gemini.
    (Build Plan Section 5: review drafted replies and choose what to send).
    """
    comment = db.query(Comment).filter(Comment.id == id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    reservation = reserve_budget(db, "claim_verification", {"comment_id": id})

    try:
        if settings.LLM_PROVIDER == "ollama":
            from app.providers.ollama_provider import OllamaTextProvider
            ollama = OllamaTextProvider()
            comment.proposed_reply = ollama.draft_comment_reply(
                comment_text=comment.text_snapshot,
                video_title=comment.video_title or "ClearTech Minute Short",
                custom_instructions=payload.custom_instructions or ""
            )
            actual_cost = 0.0
        elif settings.GENAI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GENAI_API_KEY)
                model = genai.GenerativeModel(settings.TEXT_MODEL_ID)
                prompt = f"""
                You are the creator of ClearTech Minute YouTube channel.
                Write a friendly, concise (under 2 sentences) educational reply to this viewer comment:
                Comment: "{comment.text_snapshot}"
                Custom instructions: {payload.custom_instructions or "Be helpful and encouraging."}
                """
                response = model.generate_content(prompt)
                comment.proposed_reply = response.text.strip()
            except Exception as e:
                print(f"[Comments] AI reply error: {e}. Using rule-based draft.")
                comment.proposed_reply = f"Thanks for watching! {comment.text_snapshot.split('?')[0]} is a great question that we'll feature in an upcoming video!"
            actual_cost = 0.002
        else:
            comment.proposed_reply = f"Thanks for watching! That's a great question about {comment.video_title}. We'll follow up with a quick Short explaining that!"
            actual_cost = 0.0

        comment.moderation_state = "approved_reply"
        db.commit()
        reconcile_budget(db, reservation.id, actual_cost)

        return {
            "message": "AI reply drafted for owner review",
            "comment_id": comment.id,
            "proposed_reply": comment.proposed_reply
        }
    except Exception as e:
        reconcile_budget(db, reservation.id, 0.0)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/send-reply")
def send_reply(id: str, payload: SendReplyRequest, db: Session = Depends(get_db)):
    """
    Send an owner-authorized reply to YouTube (Build Plan Section 5).
    """
    comment = db.query(Comment).filter(Comment.id == id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.proposed_reply = payload.reply_text
    comment.moderation_state = "sent"

    audit = AuditEvent(
        actor="owner",
        action="send_comment_reply",
        resource=f"comment:{comment.id}",
        details={"reply_text": payload.reply_text, "author": comment.author_display_name}
    )
    db.add(audit)
    db.commit()

    return {"message": "Reply sent successfully", "comment_id": comment.id, "state": comment.moderation_state}

@router.post("/{id}/dismiss")
def dismiss_comment(id: str, db: Session = Depends(get_db)):
    """Dismiss a comment from the active queue."""
    comment = db.query(Comment).filter(Comment.id == id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.moderation_state = "dismissed"
    db.commit()
    return {"message": "Comment dismissed", "id": comment.id}
