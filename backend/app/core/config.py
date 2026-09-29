# Configuration settings for YouTube Channel Agent
# Student-friendly configuration loading using standard python os.getenv

import os
from dotenv import load_dotenv

# Load .env file from project root or current directory
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
load_dotenv(env_path)

class Settings:
    # Application settings
    APP_NAME: str = os.getenv("APP_NAME", "YouTube Channel Agent")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Storage settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    MEDIA_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/media"))
    
    # Owner & Channel Security
    OWNER_LOGIN_SUBJECT: str = os.getenv("OWNER_LOGIN_SUBJECT", "ayeshmantha@local")
    ALLOWED_CHANNEL_ID: str = os.getenv("ALLOWED_CHANNEL_ID", "UC_DEMO_CHANNEL_001")
    
    # Model API keys & models
    GENAI_API_KEY: str = os.getenv("GENAI_API_KEY", "")
    TEXT_MODEL_ID: str = os.getenv("TEXT_MODEL_ID", "gemini-3.8-flash")
    IMAGE_MODEL_ID: str = os.getenv("IMAGE_MODEL_ID", "gemini-3.1-flash-lite-image")
    TTS_MODEL_ID: str = os.getenv("TTS_MODEL_ID", "gemini-3.8-flash-tts")
    
    # YouTube OAuth settings
    GOOGLE_OAUTH_CLIENT_ID: str = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
    GOOGLE_OAUTH_CLIENT_SECRET: str = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
    OAUTH_REDIRECT_URI: str = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/api/auth/youtube/callback")
    
    # Budget Controls (defaults from Build Plan Section 10)
    API_MONTHLY_LIMIT: float = float(os.getenv("API_MONTHLY_LIMIT", "30.0"))
    API_DAILY_LIMIT: float = float(os.getenv("API_DAILY_LIMIT", "3.0"))
    PER_VIDEO_LIMIT: float = float(os.getenv("PER_VIDEO_LIMIT", "1.0"))
    
    # Operating mode
    DEFAULT_OPERATING_MODE: str = os.getenv("DEFAULT_OPERATING_MODE", "draft")
    PUBLIC_PUBLISHING_ENABLED: bool = os.getenv("PUBLIC_PUBLISHING_ENABLED", "False").lower() == "true"

settings = Settings()

# Ensure media directory exists
os.makedirs(settings.MEDIA_DIR, exist_ok=True)
