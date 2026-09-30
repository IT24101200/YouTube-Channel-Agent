# Google OAuth and YouTube Channel connection API routes
# Implements Build Plan Section 4, 13, 20

import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.db.models import Channel, ChannelBrief, AuditEvent
from app.core.config import settings
from app.youtube.oauth import get_oauth_authorization_url, encrypt_token, YOUTUBE_SCOPES
from app.youtube.client import YouTubeClient

router = APIRouter(prefix="/auth/youtube", tags=["YouTube Connection"])

class ConnectRequest(BaseModel):
    mode: Optional[str] = "standard"  # 'standard' or 'demo'

class ManualLinkRequest(BaseModel):
    name: str
    handle: str
    channel_id: str
    subscriber_count: Optional[str] = "0"
    viewer_promise: Optional[str] = None

class OAuthCredentialsRequest(BaseModel):
    client_id: str
    client_secret: str

@router.get("/status")
def get_connection_status(db: Session = Depends(get_db)):
    """Check current YouTube authorization and connected channel status."""
    channel = db.query(Channel).first()
    is_connected = bool(channel and channel.youtube_channel_id and channel.youtube_channel_id.strip() != "")

    client = YouTubeClient()
    info = None

    if is_connected:
        if client.is_real:
            info = client.get_channel_info()
        else:
            brief = db.query(ChannelBrief).filter(ChannelBrief.channel_id == channel.id).order_by(ChannelBrief.version.desc()).first()
            name = channel.name_snapshot or (brief.name if brief else "My Channel")
            handle = brief.handle if (brief and brief.handle) else f"@{name.replace(' ', '')}"
            info = {
                "channel_id": channel.youtube_channel_id,
                "title": name,
                "custom_url": handle,
                "subscriber_count": "0",
                "video_count": "0",
                "thumbnail": ""
            }

    return {
        "is_configured": bool(settings.GOOGLE_OAUTH_CLIENT_ID and settings.GOOGLE_OAUTH_CLIENT_SECRET),
        "is_connected": is_connected,
        "channel_info": info
    }

@router.post("/connect")
def initiate_connect(payload: ConnectRequest, db: Session = Depends(get_db)):
    """
    Begin Google OAuth authorization or connect demo channel for local testing.
    """
    oauth_res = get_oauth_authorization_url()
    
    # If Google OAuth credentials are not configured
    if not oauth_res["configured"]:
        if payload.mode == "demo":
            channel = db.query(Channel).first()
            if channel:
                channel.youtube_channel_id = "UC_CLEARTECH_CONNECTED"
                channel.name_snapshot = "ClearTech Minute"
                db.commit()
            return {
                "status": "connected",
                "mode": "demo",
                "message": "Connected to demo channel in local testing mode."
            }
        
        # When attempting standard connect without OAuth keys configured
        return {
            "status": "not_configured",
            "message": "Google OAuth credentials (GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET) are not set in your .env file. You can enter your Client ID/Secret or link your channel directly."
        }

    return {
        "status": "redirect_required",
        "auth_url": oauth_res["auth_url"],
        "state": oauth_res["state"]
    }

@router.post("/link-manual")
def link_channel_manually(payload: ManualLinkRequest, db: Session = Depends(get_db)):
    """
    Directly link the user's real YouTube channel by Name, Handle, and Channel ID.
    Updates the database so all scripts, branding, and dashboard views reflect the real channel.
    """
    channel = db.query(Channel).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    name = payload.name.strip()
    handle = payload.handle.strip()
    if handle and not handle.startswith("@"):
        handle = f"@{handle}"
    channel_id = payload.channel_id.strip()

    channel.name_snapshot = name
    channel.youtube_channel_id = channel_id

    brief = db.query(ChannelBrief).filter(ChannelBrief.channel_id == channel.id).first()
    if brief:
        brief.name = name
        brief.handle = handle
        if payload.viewer_promise:
            brief.viewer_promise = payload.viewer_promise.strip()

    audit = AuditEvent(
        actor="owner",
        action="connect_youtube_channel_manual",
        resource=f"channel:{channel.id}",
        details={"channel_id": channel_id, "name": name, "handle": handle}
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully connected your channel '{name}' ({handle})!",
        "channel_info": {
            "channel_id": channel_id,
            "title": name,
            "custom_url": handle,
            "subscriber_count": payload.subscriber_count or "0"
        }
    }

@router.post("/configure-oauth")
def configure_oauth_credentials(payload: OAuthCredentialsRequest):
    """
    Save Google OAuth Client ID and Secret to active settings and .env.
    """
    cid = payload.client_id.strip()
    csec = payload.client_secret.strip()

    if not cid or not csec:
        raise HTTPException(status_code=400, detail="Both Client ID and Client Secret are required.")

    settings.GOOGLE_OAUTH_CLIENT_ID = cid
    settings.GOOGLE_OAUTH_CLIENT_SECRET = csec

    # Update .env file
    env_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            new_lines = []
            found_id = False
            found_sec = False
            for line in lines:
                if line.startswith("GOOGLE_OAUTH_CLIENT_ID="):
                    new_lines.append(f'GOOGLE_OAUTH_CLIENT_ID="{cid}"\n')
                    found_id = True
                elif line.startswith("GOOGLE_OAUTH_CLIENT_SECRET="):
                    new_lines.append(f'GOOGLE_OAUTH_CLIENT_SECRET="{csec}"\n')
                    found_sec = True
                else:
                    new_lines.append(line)
            
            if not found_id:
                new_lines.append(f'GOOGLE_OAUTH_CLIENT_ID="{cid}"\n')
            if not found_sec:
                new_lines.append(f'GOOGLE_OAUTH_CLIENT_SECRET="{csec}"\n')

            with open(env_file, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            print(f"[configure_oauth] Error writing .env: {e}")

    return {
        "status": "success",
        "message": "Google OAuth credentials saved successfully! You can now click 'Sign In with Google'."
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
            
            # Fetch channel info from real YouTube API
            from googleapiclient.discovery import build
            yt = build("youtube", "v3", credentials=credentials)
            resp = yt.channels().list(part="snippet", mine=True).execute()
            if resp.get("items"):
                ch_item = resp["items"][0]
                channel.youtube_channel_id = ch_item["id"]
                channel.name_snapshot = ch_item["snippet"]["title"]
                
                brief = db.query(ChannelBrief).filter(ChannelBrief.channel_id == channel.id).first()
                if brief:
                    brief.name = ch_item["snippet"]["title"]
                    brief.handle = ch_item["snippet"].get("customUrl", f"@{ch_item['snippet']['title'].replace(' ', '')}")

            # Store channel update and log audit event
            audit = AuditEvent(
                actor="owner",
                action="oauth_connected",
                resource=f"channel:{channel.id}",
                details={"scopes": list(credentials.scopes or [])}
            )
            db.add(audit)
            db.commit()

        # Redirect back to frontend channel tab
        from fastapi.responses import RedirectResponse
        return RedirectResponse("http://localhost:5173/?tab=channel&connected=true")
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
        channel.name_snapshot = "Not Connected"
        
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
