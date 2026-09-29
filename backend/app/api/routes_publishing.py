# Publishing and Scheduling API routes
# Implements Build Plan Section 4, 6, 14, 20

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.db.database import get_db
from app.db.models import PublishingJob, VideoVersion, Approval, Channel, AuditEvent, Script
from app.youtube.client import YouTubeClient

router = APIRouter(prefix="/publishing", tags=["Publishing"])

class SchedulePublishRequest(BaseModel):
    video_version_id: str
    scheduled_publish_time: Optional[datetime] = None

@router.get("/jobs")
def list_publishing_jobs(db: Session = Depends(get_db)):
    """List publishing calendar queue and upload history."""
    jobs = db.query(PublishingJob).order_by(PublishingJob.created_at.desc()).all()
    results = []
    for j in jobs:
        version = db.query(VideoVersion).filter(VideoVersion.id == j.video_version_id).first()
        results.append({
            "id": j.id,
            "channel_id": j.channel_id,
            "video_version_id": j.video_version_id,
            "video_title": version.manifest.get("title", "Untitled Short") if version and version.manifest else "Short Video",
            "scheduled_publish_time": j.scheduled_publish_time,
            "state": j.state,
            "remote_video_id": j.remote_video_id,
            "studio_url": f"https://studio.youtube.com/video/{j.remote_video_id}/edit" if j.remote_video_id else None,
            "created_at": j.created_at
        })
    return results

@router.post("/jobs")
def schedule_video_publish(payload: SchedulePublishRequest, db: Session = Depends(get_db)):
    """
    Schedule an approved video for upload/publishing.
    Verifies that publishing is not paused and that video version has an ACTIVE approval.
    """
    channel = db.query(Channel).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    if channel.pause_publishing:
        raise HTTPException(status_code=400, detail="Publishing is currently paused by owner!")

    version = db.query(VideoVersion).filter(VideoVersion.id == payload.video_version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Video version not found")

    # Verify active approval binding (Build Plan Section 6)
    approval = db.query(Approval).filter(
        Approval.video_version_id == version.id,
        Approval.is_active == True,
        Approval.approved_payload_hash == version.final_hash
    ).first()
    
    if not approval:
        raise HTTPException(status_code=400, detail="Cannot publish: Video version is not approved or hash changed!")

    job = PublishingJob(
        channel_id=channel.id,
        video_version_id=version.id,
        scheduled_publish_time=payload.scheduled_publish_time or datetime.utcnow(),
        state="scheduled" if payload.scheduled_publish_time else "ready_for_upload"
    )
    db.add(job)

    audit = AuditEvent(
        actor="owner",
        action="schedule_video_publish",
        resource=f"publishing_job:{job.id}",
        details={"video_version_id": version.id, "scheduled_at": str(job.scheduled_publish_time)}
    )
    db.add(audit)
    db.commit()
    db.refresh(job)

    return {"message": "Video successfully queued for publishing", "job_id": job.id, "state": job.state}

@router.post("/jobs/{id}/upload-private")
def upload_private_video(id: str, db: Session = Depends(get_db)):
    """
    Upload an approved video as Private to YouTube (Build Plan Section 14 & 20).
    Exit condition for Phase 4: Authorized test uploads once and appears with Studio link.
    """
    job = db.query(PublishingJob).filter(PublishingJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Publishing job not found")

    channel = db.query(Channel).first()
    if channel and channel.pause_publishing:
        raise HTTPException(status_code=400, detail="Publishing is currently paused by owner!")

    version = db.query(VideoVersion).filter(VideoVersion.id == job.video_version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Video version not found")

    # Verify approval
    approval = db.query(Approval).filter(
        Approval.video_version_id == version.id,
        Approval.is_active == True,
        Approval.approved_payload_hash == version.final_hash
    ).first()
    if not approval:
        raise HTTPException(status_code=400, detail="Video version must be approved before upload!")

    script = db.query(Script).filter(Script.id == version.script_id).first()
    title = version.manifest.get("title", "ClearTech Minute Short")
    description = (
        f"{title}\n\n"
        f"Learning Goal: {script.learning_goal if script else ''}\n\n"
        f"Created with ClearTech Minute AI Channel Agent.\n#Shorts #TechExplained"
    )

    client = YouTubeClient()
    upload_result = client.upload_private_video(
        file_path=version.video_file_path or version.manifest.get("captions_vtt", ""),
        title=title,
        description=description
    )

    job.state = "uploaded_private"
    job.remote_video_id = upload_result["remote_video_id"]

    audit = AuditEvent(
        actor="owner",
        action="upload_private_video",
        resource=f"publishing_job:{job.id}",
        details={
            "remote_video_id": job.remote_video_id,
            "privacy": "private",
            "studio_url": upload_result["studio_url"]
        }
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Video successfully uploaded to YouTube as Private",
        "remote_video_id": job.remote_video_id,
        "studio_url": upload_result["studio_url"],
        "state": job.state
    }

@router.post("/jobs/{id}/cancel")
def cancel_publishing_job(id: str, db: Session = Depends(get_db)):
    """Cancel a scheduled release locally (Build Plan Section 6)."""
    job = db.query(PublishingJob).filter(PublishingJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Publishing job not found")

    job.state = "cancelled"

    audit = AuditEvent(
        actor="owner",
        action="cancel_publishing_job",
        resource=f"publishing_job:{job.id}",
        details={"reason": "Owner cancelled release"}
    )
    db.add(audit)
    db.commit()

    return {"message": "Publishing job cancelled", "job_id": job.id, "state": job.state}
