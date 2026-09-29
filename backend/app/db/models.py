# Database models for YouTube Channel Agent
# Implements tables specified in Build Plan Section 12

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Owner(Base):
    """Owner account record for local dashboard authentication."""
    __tablename__ = "owners"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    login_subject = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, default="Channel Owner")
    created_at = Column(DateTime, default=datetime.utcnow)

    channels = relationship("Channel", back_populates="owner")

class Channel(Base):
    """Single channel management record."""
    __tablename__ = "channels"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("owners.id"), nullable=False)
    youtube_channel_id = Column(String, default="UC_DEMO_CHANNEL_001")
    name_snapshot = Column(String, default="ClearTech Minute")
    timezone = Column(String, default="Asia/Colombo")
    
    # Operating mode: 'manual', 'draft', 'approved_queue', 'bounded_auto'
    mode = Column(String, default="draft")
    
    # Concrete Pause flags (Build Plan Section 6 & 19)
    pause_production = Column(Boolean, default=False)
    pause_publishing = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("Owner", back_populates="channels")
    briefs = relationship("ChannelBrief", back_populates="channel")
    ideas = relationship("Idea", back_populates="channel")
    publishing_jobs = relationship("PublishingJob", back_populates="channel")

class ChannelBrief(Base):
    """The channel strategy and guidelines (Build Plan Section 4)."""
    __tablename__ = "channel_briefs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    channel_id = Column(String, ForeignKey("channels.id"), nullable=False)
    version = Column(Integer, default=1)
    name = Column(String, default="ClearTech Minute")
    handle = Column(String, default="@ClearTechMinute")
    viewer_promise = Column(String, default="One useful technology idea, explained clearly in about a minute.")
    audience = Column(String, default="technology_beginners")
    language = Column(String, default="en")
    pillars = Column(JSON, default=list)  # e.g. ["Everyday Tech", "AI Basics", "Practical Digital Safety"]
    style_guidelines = Column(Text, default="Clear, friendly, non-intimidating, high-contrast visuals, 35-60s duration.")
    effective_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("Channel", back_populates="briefs")

class ResearchRun(Base):
    """Topic or niche research results with evidence (Build Plan Section 3)."""
    __tablename__ = "research_runs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    channel_id = Column(String, ForeignKey("channels.id"), nullable=True)
    status = Column(String, default="completed")  # running, completed, failed
    query_topic = Column(String, nullable=False)
    findings = Column(JSON, default=dict)
    limitations = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    evidence_items = relationship("EvidenceItem", back_populates="research_run")

class EvidenceItem(Base):
    """Factual evidence supporting research and video claims."""
    __tablename__ = "evidence_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    research_run_id = Column(String, ForeignKey("research_runs.id"), nullable=True)
    source_url = Column(String, nullable=False)
    title = Column(String, nullable=False)
    publisher = Column(String, default="")
    short_extract = Column(Text, nullable=False)
    retrieved_at = Column(DateTime, default=datetime.utcnow)

    research_run = relationship("ResearchRun", back_populates="evidence_items")

class Idea(Base):
    """Video concept board (Build Plan Section 7)."""
    __tablename__ = "ideas"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    channel_id = Column(String, ForeignKey("channels.id"), nullable=False)
    pillar = Column(String, default="Everyday Tech")
    question = Column(String, nullable=False)  # The viewer question
    original_angle = Column(Text, default="")
    status = Column(String, default="new")  # new, researched, scripted, produced, published
    editorial_fit_score = Column(Integer, default=85)  # 0-100 rubric score
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("Channel", back_populates="ideas")
    scripts = relationship("Script", back_populates="idea")
    video_versions = relationship("VideoVersion", back_populates="idea")

class Script(Base):
    """Script draft with narration, claims, and scene breakdown."""
    __tablename__ = "scripts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    idea_id = Column(String, ForeignKey("ideas.id"), nullable=False)
    version = Column(Integer, default=1)
    learning_goal = Column(String, default="")
    title_options = Column(JSON, default=list)
    narration = Column(Text, nullable=False)
    scenes = Column(JSON, default=list)  # list of {scene_id, narration_segment, visual_brief, on_screen_text, duration}
    claims = Column(JSON, default=list)  # list of {claim_id, text, source_ids, verification_status}
    verification_status = Column(String, default="pending")  # pending, verified, rejected
    owner_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    idea = relationship("Idea", back_populates="scripts")
    assets = relationship("Asset", back_populates="script")
    video_versions = relationship("VideoVersion", back_populates="script")

class Asset(Base):
    """Generated or uploaded media asset (images, audio narration, clips)."""
    __tablename__ = "assets"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    script_id = Column(String, ForeignKey("scripts.id"), nullable=True)
    asset_type = Column(String, nullable=False)  # 'image', 'audio', 'video', 'caption'
    provider = Column(String, default="gemini")
    model = Column(String, default="")
    rights_basis = Column(String, default="ai_generated_original")
    file_path = Column(String, nullable=False)
    checksum = Column(String, default="")
    scene_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    script = relationship("Script", back_populates="assets")

class VideoVersion(Base):
    """Rendered video version tied to exact script and asset hashes."""
    __tablename__ = "video_versions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    idea_id = Column(String, ForeignKey("ideas.id"), nullable=False)
    script_id = Column(String, ForeignKey("scripts.id"), nullable=False)
    version = Column(Integer, default=1)
    final_hash = Column(String, default="")
    duration_seconds = Column(Float, default=45.0)
    quality_status = Column(String, default="ready")  # 'rendering', 'ready', 'failed'
    video_file_path = Column(String, default="")
    manifest = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    idea = relationship("Idea", back_populates="video_versions")
    script = relationship("Script", back_populates="video_versions")
    approvals = relationship("Approval", back_populates="video_version")
    publishing_jobs = relationship("PublishingJob", back_populates="video_version")

class Approval(Base):
    """Exact version approval binding (Build Plan Section 6)."""
    __tablename__ = "approvals"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    video_version_id = Column(String, ForeignKey("video_versions.id"), nullable=False)
    approved_payload_hash = Column(String, nullable=False)
    owner_id = Column(String, nullable=False)
    approved_at = Column(DateTime, default=datetime.utcnow)
    scope = Column(String, default="single_upload")
    is_active = Column(Boolean, default=True)  # invalidated if script/video modified

    video_version = relationship("VideoVersion", back_populates="approvals")

class PublishingJob(Base):
    """Queue and record of YouTube upload and schedule operations."""
    __tablename__ = "publishing_jobs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    channel_id = Column(String, ForeignKey("channels.id"), nullable=False)
    video_version_id = Column(String, ForeignKey("video_versions.id"), nullable=False)
    scheduled_publish_time = Column(DateTime, nullable=True)
    state = Column(String, default="draft")  # draft, approved, scheduled, published, failed, cancelled
    idempotency_key = Column(String, unique=True, default=generate_uuid)
    remote_video_id = Column(String, default="")
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    channel = relationship("Channel", back_populates="publishing_jobs")
    video_version = relationship("VideoVersion", back_populates="publishing_jobs")

class UsageLedger(Base):
    """Cost tracking ledger for API operations (Build Plan Section 10)."""
    __tablename__ = "usage_ledger"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    provider = Column(String, default="gemini")
    operation = Column(String, nullable=False)  # 'script_generation', 'image_generation', 'tts'
    reserved_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    """Security and action audit logs (Build Plan Section 19)."""
    __tablename__ = "audit_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    actor = Column(String, default="owner")
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

class Comment(Base):
    """Viewer comments and proposed AI replies (Build Plan Section 5 & 12)."""
    __tablename__ = "comments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    remote_comment_id = Column(String, unique=True, default=generate_uuid)
    video_id = Column(String, default="")
    video_title = Column(String, default="")
    author_display_name = Column(String, default="Viewer")
    text_snapshot = Column(Text, nullable=False)
    proposed_reply = Column(Text, default="")
    moderation_state = Column(String, default="pending_review")  # pending_review, approved_reply, sent, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

class AnalyticsReport(Base):
    """Native YouTube analytics snapshot reports (Build Plan Section 12 & 17)."""
    __tablename__ = "analytics_reports"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    channel_id = Column(String, nullable=False)
    requested_range = Column(String, default="last_28_days")
    available_range = Column(String, default="last_28_days")
    report_type = Column(String, default="native_overview")
    native_metrics = Column(JSON, default=dict)
    retrieved_at = Column(DateTime, default=datetime.utcnow)

