# FastAPI Application Entry Point
# YouTube Channel Agent Backend

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db
from app.api import (
    routes_auth,
    routes_channels,
    routes_research,
    routes_ideas,
    routes_scripts,
    routes_media,
    routes_publishing,
    routes_budget,
    routes_analytics,
    routes_comments
)

# Initialize application
app = FastAPI(
    title=settings.APP_NAME,
    description="Private backend agent for YouTube Shorts channel management and production",
    version="1.0.0"
)

# Allow CORS for React development dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database table creation and realistic sample data seeding on startup
@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
def health_check():
    """Simple status check."""
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}

# Include all API route controllers
app.include_router(routes_auth.router, prefix="/api")
app.include_router(routes_channels.router, prefix="/api")
app.include_router(routes_research.router, prefix="/api")
app.include_router(routes_ideas.router, prefix="/api")
app.include_router(routes_scripts.router, prefix="/api")
app.include_router(routes_media.router, prefix="/api")
app.include_router(routes_publishing.router, prefix="/api")
app.include_router(routes_budget.router, prefix="/api")
app.include_router(routes_analytics.router, prefix="/api")
app.include_router(routes_comments.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
