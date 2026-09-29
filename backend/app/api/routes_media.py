# Media generation, rendering, and approval API routes
# Implements Build Plan Section 6, 7, 16

import os
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Script, Asset, VideoVersion, Approval, Idea, Channel
from app.core.config import settings
from app.providers.gemini_provider import GeminiImageProvider, GeminiTTSProvider
from app.media.composer import VideoComposer
from app.workflows.cost_ledger import reserve_budget, reconcile_budget

router = APIRouter(tags=["Media"])

@router.post("/scripts/{script_id}/generate-assets")
def generate_script_assets(script_id: str, db: Session = Depends(get_db)):
    """
    Generate scene illustrations and voice narration for a script.
    Checks budget reservation and saves files to local storage.
    """
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    channel = db.query(Channel).first()
    if channel and channel.pause_production:
        raise HTTPException(status_code=400, detail="Production is currently paused by owner!")

    # Check budget for images and TTS
    scenes = script.scenes or []
    image_count = len(scenes)
    reservation = reserve_budget(db, "image_generation", {"script_id": script_id, "scenes": image_count})

    img_provider = GeminiImageProvider()
    tts_provider = GeminiTTSProvider()

    saved_assets = []
    # 1. Generate Scene Images
    for i, scene in enumerate(scenes):
        prompt = scene.get("visual_brief", f"Scene {i+1} for {script.learning_goal}")
        img_bytes = img_provider.generate_image(prompt)
        
        filename = f"asset_{script.id}_scene_{i+1}.jpg"
        file_path = os.path.join(settings.MEDIA_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(img_bytes)

        checksum = hashlib.sha256(img_bytes).hexdigest()[:16]
        asset = Asset(
            script_id=script.id,
            asset_type="image",
            provider="gemini",
            model=settings.IMAGE_MODEL_ID,
            rights_basis="ai_generated_original",
            file_path=file_path,
            checksum=checksum,
            scene_index=i
        )
        db.add(asset)
        saved_assets.append(filename)

    # 2. Generate Narration Audio
    tts_bytes = tts_provider.generate_speech(script.narration)
    audio_filename = f"audio_{script.id}.wav"
    audio_path = os.path.join(settings.MEDIA_DIR, audio_filename)
    with open(audio_path, "wb") as f:
        f.write(tts_bytes)

    audio_asset = Asset(
        script_id=script.id,
        asset_type="audio",
        provider="gemini",
        model=settings.TTS_MODEL_ID,
        rights_basis="ai_generated_original",
        file_path=audio_path,
        checksum=hashlib.sha256(tts_bytes).hexdigest()[:16],
        scene_index=0
    )
    db.add(audio_asset)

    db.commit()
    reconcile_budget(db, reservation.id, 0.0336 * image_count + 0.015)

    return {
        "message": f"Generated {image_count} scene images and narration audio.",
        "assets": saved_assets,
        "audio": audio_filename
    }

@router.post("/scripts/{script_id}/render-video")
def render_video_version(script_id: str, db: Session = Depends(get_db)):
    """
    Render vertical video combining scene graphics, narration audio, and captions.
    Computes immutable final hash.
    """
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    channel = db.query(Channel).first()
    if channel and channel.pause_production:
        raise HTTPException(status_code=400, detail="Production is currently paused by owner!")

    # Find assets for this script
    assets = db.query(Asset).filter(Asset.script_id == script.id).order_by(Asset.scene_index.asc()).all()
    image_paths = [a.file_path for a in assets if a.asset_type == "image"]
    audio_assets = [a.file_path for a in assets if a.asset_type == "audio"]
    audio_path = audio_assets[0] if audio_assets else ""

    composer = VideoComposer(settings.MEDIA_DIR)
    title = (script.title_options[0] if script.title_options else "ClearTech Short")
    
    result = composer.assemble_short(
        video_id=script.id[:8],
        scenes=script.scenes or [],
        image_paths=image_paths,
        audio_path=audio_path,
        title=title
    )

    # Save VideoVersion
    version_num = db.query(VideoVersion).filter(VideoVersion.script_id == script.id).count() + 1
    video_version = VideoVersion(
        idea_id=script.idea_id,
        script_id=script.id,
        version=version_num,
        final_hash=result["final_hash"],
        duration_seconds=result["duration_seconds"],
        quality_status="ready",
        video_file_path=result["output_file"],
        manifest=result["manifest"]
    )
    db.add(video_version)

    # Update idea status
    idea = db.query(Idea).filter(Idea.id == script.idea_id).first()
    if idea:
        idea.status = "produced"

    db.commit()
    db.refresh(video_version)

    return {
        "message": "Video version rendered successfully",
        "video_version": {
            "id": video_version.id,
            "version": video_version.version,
            "final_hash": video_version.final_hash,
            "duration_seconds": video_version.duration_seconds,
            "quality_status": video_version.quality_status,
            "manifest": video_version.manifest
        }
    }

@router.get("/video-versions/{id}")
def get_video_version(id: str, db: Session = Depends(get_db)):
    """Fetch video version details and active approval binding."""
    v = db.query(VideoVersion).filter(VideoVersion.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Video version not found")

    active_approval = db.query(Approval).filter(
        Approval.video_version_id == v.id,
        Approval.is_active == True
    ).first()

    return {
        "id": v.id,
        "idea_id": v.idea_id,
        "script_id": v.script_id,
        "version": v.version,
        "final_hash": v.final_hash,
        "duration_seconds": v.duration_seconds,
        "quality_status": v.quality_status,
        "manifest": v.manifest,
        "approval": {
            "id": active_approval.id,
            "approved_at": active_approval.approved_at,
            "approved_payload_hash": active_approval.approved_payload_hash
        } if active_approval else None
    }

@router.post("/video-versions/{id}/approve")
def approve_video_version(id: str, db: Session = Depends(get_db)):
    """
    Bind approval to exact video hash and payload (Build Plan Section 6).
    """
    v = db.query(VideoVersion).filter(VideoVersion.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Video version not found")

    approval = Approval(
        video_version_id=v.id,
        approved_payload_hash=v.final_hash,
        owner_id="ayeshmantha@local",
        scope="single_upload",
        is_active=True
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    return {
        "message": "Video version successfully approved and bound to hash",
        "approval_id": approval.id,
        "approved_payload_hash": approval.approved_payload_hash
    }

@router.get("/media/files/{filename}")
def serve_media_file(filename: str):
    """Serve media files (images, audio, subtitles) for frontend playback."""
    file_path = os.path.join(settings.MEDIA_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
