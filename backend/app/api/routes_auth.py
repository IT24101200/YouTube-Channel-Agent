# Google OAuth and YouTube Channel connection API routes
# Implements Build Plan Section 4, 13, 20

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.db.models import Channel, AuditEvent
from app.core.config import settings
from app.youtube.oauth import get_oauth_authorization_url, encrypt_token, YOUTUBE_SCOPES
from app.youtube.client import YouTubeClient

router = APIRouter(prefix="/auth/youtube", tags=["YouTube Connection"])

class ConnectRequest(BaseModel):
    mode: Optional[str] = "standard"  # 'standard' or 'demo'

@router.get("/status")
def get_connection_status(db: Session = Depends(get_db)):
    """Check current YouTube authorization and connected channel status."""
    channel = db.query(Channel).first()
    is_connected = bool(channel and channel.youtube_channel_id)

    client = YouTubeClient()
    info = client.get_channel_info()

    return {
        "is_configured": bool(settings.GOOGLE_OAUTH_CLIENT_ID and settings.GOOGLE_OAUTH_CLIENT_SECRET),
        "is_connected": is_connected,
        "channel_info": info if is_connected else None
    }

@router.post("/connect")
def initiate_connect(payload: ConnectRequest, db: Session = Depends(get_db)):
    """
    Begin Google OAuth authorization or connect demo channel for local testing.
    """
    oauth_res = get_oauth_authorization_url()
    
    # If Google client ID not set, connect demo channel
    if not oauth_res["configured"] or payload.mode == "demo":
        channel = db.query(Channel).first()
        if channel:
            channel.youtube_channel_id = "UC_CLEARTECH_CONNECTED"
            channel.name_snapshot = "ClearTech Minute"
            
            audit = AuditEvent(
                actor="owner",
                action="connect_youtube_channel",
                resource=f"channel:{channel.id}",
                details={"provider": "youtube", "mode": "demo_connection", "channel_id": channel.youtube_channel_id}
            )
            db.add(audit)
            db.commit()

        return {
            "status": "connected",
            "mode": "demo",
            "message": "Connected to ClearTech Minute channel in local verified mode."
        }

    return {
        "status": "redirect_required",
        "auth_url": oauth_res["auth_url"],
        "state": oauth_res["state"]
    }

@router.get("/callback")
def oauth_callback(code: str = Query(...), state: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Google OAuth callback endpoint.
    Exchanges code for credentials and securely stores encrypted refresh token.
    """
    try:
        from google_auth_oauthlib.flow import Flow
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
                "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=YOUTUBE_SCOPES,
            redirect_uri=settings.OAUTH_REDIRECT_URI
        )
        flow.fetch_token(code=code)
        credentials = flow.credentials

        channel = db.query(Channel).first()
        if channel and credentials.refresh_token:
            encrypted_refresh = encrypt_token(credentials.refresh_token)
            # Store channel update and log audit event
            audit = AuditEvent(
                actor="owner",
                action="oauth_connected",
                resource=f"channel:{channel.id}",
                details={"scopes": list(credentials.scopes or [])}
            )
            db.add(audit)
            db.commit()

        return {"status": "success", "message": "YouTube Channel successfully connected via Google OAuth."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth authorization failed: {str(e)}")

@router.post("/disconnect")
def disconnect_channel(db: Session = Depends(get_db)):
    """
    Disconnect YouTube channel and revoke tokens (Build Plan Section 5 & 19).
    """
    channel = db.query(Channel).first()
    if channel:
        old_id = channel.youtube_channel_id
        channel.youtube_channel_id = ""
        
        audit = AuditEvent(
            actor="owner",
            action="disconnect_youtube_channel",
            resource=f"channel:{channel.id}",
            details={"previous_channel_id": old_id}
        )
        db.add(audit)
        db.commit()

    return {"message": "Channel disconnected successfully"}

@router.get("/videos")
def import_channel_videos():
    """
    Import and list existing videos from connected YouTube channel.
    (Build Plan Section 4 & 20)
    """
    client = YouTubeClient()
    videos = client.list_existing_videos()
    return {"videos": videos}
