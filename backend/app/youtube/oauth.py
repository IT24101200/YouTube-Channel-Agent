# Google OAuth 2.0 helper for YouTube Data API
# Implements Build Plan Section 4, 13, 19

import os
import json
import base64
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from app.core.config import settings

# 1. Simple Token Encryption at rest (Build Plan Section 19)
_SECRET_KEY = os.getenv("TOKEN_ENCRYPTION_KEY", "u1B7sQjY3f0ZkF8r6VwM5lNp4xTc2hDg9aKeJ1vLi7E=")
# Ensure key is valid 32 url-safe base64-encoded bytes
try:
    _cipher = Fernet(_SECRET_KEY.encode() if len(_SECRET_KEY) == 44 else Fernet.generate_key())
except Exception:
    _cipher = Fernet(Fernet.generate_key())

def encrypt_token(token: str) -> str:
    """Encrypt OAuth token before storing in database."""
    if not token:
        return ""
    return _cipher.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt OAuth token from database."""
    if not encrypted_token:
        return ""
    try:
        return _cipher.decrypt(encrypted_token.encode()).decode()
    except Exception:
        return ""

# Scopes needed for YouTube uploads and channel metadata
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly"
]

def get_oauth_authorization_url() -> Dict[str, Any]:
    """
    Generate the Google OAuth consent URL.
    If Google credentials are not yet added in .env, returns simulated mode
    so students can test channel connection immediately without getting blocked.
    """
    client_id = settings.GOOGLE_OAUTH_CLIENT_ID
    client_secret = settings.GOOGLE_OAUTH_CLIENT_SECRET

    if not client_id or not client_secret:
        return {
            "configured": False,
            "auth_url": None,
            "message": "Google OAuth credentials not configured in .env. Use Demo Connect to test Phase 4 immediately."
        }

    from google_auth_oauthlib.flow import Flow
    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=YOUTUBE_SCOPES,
        redirect_uri=settings.OAUTH_REDIRECT_URI
    )
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    return {
        "configured": True,
        "auth_url": auth_url,
        "state": state
    }
