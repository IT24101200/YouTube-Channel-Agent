# Database initialization - Clean setup without dummy data
from app.db.database import engine, Base, SessionLocal
from app.db.models import (
    Owner, Channel, ChannelBrief, Idea, Script, Asset, 
    VideoVersion, Approval, PublishingJob, EvidenceItem, 
    ResearchRun, Comment, AnalyticsReport, UsageLedger, AuditEvent
)
import os
import glob
from app.core.config import settings

def init_db():
    """Create all tables and ensure default owner and channel exist."""
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Create Default Owner if none exists
        owner = db.query(Owner).first()
        if not owner:
            owner = Owner(
                login_subject=settings.OWNER_LOGIN_SUBJECT,
                display_name="Ayeshmantha"
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)

        # 2. Create Default Channel if none exists
        channel = db.query(Channel).first()
        if not channel:
            channel = Channel(
                owner_id=owner.id,
                youtube_channel_id=settings.ALLOWED_CHANNEL_ID,
                name_snapshot="ClearTech Minute",
                timezone="Asia/Colombo",
                mode="draft",
                pause_production=False,
                pause_publishing=False
            )
            db.add(channel)
            db.commit()
            db.refresh(channel)

            # 3. Create Default Channel Brief
            brief = ChannelBrief(
                channel_id=channel.id,
                name="ClearTech Minute",
                handle="@ClearTechMinute",
                viewer_promise="One useful technology idea, explained clearly in about a minute.",
                audience="technology_beginners",
                language="en",
                pillars=["Everyday Tech", "AI Basics", "Practical Digital Safety"],
                style_guidelines="Clear, friendly, non-intimidating, high-contrast visuals, 35-60s duration."
            )
            db.add(brief)
            db.commit()

    finally:
        db.close()

def wipe_all_sample_data():
    """Completely wipe all sample ideas, scripts, media assets, reports, and comments."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Delete dependent child tables first
        db.query(Approval).delete()
        db.query(PublishingJob).delete()
        db.query(VideoVersion).delete()
        db.query(Asset).delete()
        db.query(Script).delete()
        db.query(Idea).delete()
        db.query(EvidenceItem).delete()
        db.query(ResearchRun).delete()
        db.query(Comment).delete()
        db.query(AnalyticsReport).delete()
        db.query(UsageLedger).delete()
        db.query(AuditEvent).delete()
        
        # Log clean state audit event
        audit = AuditEvent(
            actor="owner",
            action="clear_all_system_data",
            resource="system",
            details={"status": "All dummy data, scripts, ideas, and sample records cleared"}
        )
        db.add(audit)
        db.commit()

        # Clean all media files in data/media directory
        if os.path.exists(settings.MEDIA_DIR):
            for file_path in glob.glob(os.path.join(settings.MEDIA_DIR, "*")):
                try:
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")

        print("[init_db] All dummy data and media files cleared successfully.")
    finally:
        db.close()
