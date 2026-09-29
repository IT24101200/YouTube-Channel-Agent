# Media composer for vertical Shorts (Build Plan Section 16)
# Combines scene images, narration audio, and captions

import os
import subprocess
import shutil
import hashlib
from typing import List, Dict, Any

class VideoComposer:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        # Check if ffmpeg is available
        self.ffmpeg_path = shutil.which("ffmpeg")

    def assemble_short(
        self,
        video_id: str,
        scenes: List[Dict[str, Any]],
        image_paths: List[str],
        audio_path: str,
        title: str
    ) -> Dict[str, Any]:
        """
        Assemble the vertical 1080x1920 video.
        Returns dictionary with file paths, final hash, duration, and status.
        """
        total_duration = sum(s.get("target_duration_seconds", 8) for s in scenes)
        output_mp4 = os.path.join(self.output_dir, f"{video_id}.mp4")
        manifest_path = os.path.join(self.output_dir, f"{video_id}_manifest.json")
        vtt_path = os.path.join(self.output_dir, f"{video_id}_captions.vtt")

        # Generate WebVTT subtitle file
        vtt_content = ["WEBVTT\n"]
        elapsed = 0.0
        for i, scene in enumerate(scenes):
            dur = float(scene.get("target_duration_seconds", 8))
            start_str = self._format_vtt_time(elapsed)
            end_str = self._format_vtt_time(elapsed + dur)
            text = scene.get("on_screen_text", scene.get("narration_segment", ""))
            vtt_content.append(f"{i+1}\n{start_str} --> {end_str}\n{text}\n")
            elapsed += dur

        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(vtt_content))

        # Check if ffmpeg is installed
        if self.ffmpeg_path and image_paths and os.path.exists(image_paths[0]):
            try:
                # If we have ffmpeg, build a concat slideshow with narration
                # Create concat demuxer file
                concat_file = os.path.join(self.output_dir, f"{video_id}_concat.txt")
                with open(concat_file, "w", encoding="utf-8") as f:
                    for i, img_path in enumerate(image_paths):
                        dur = scenes[i].get("target_duration_seconds", 8) if i < len(scenes) else 8
                        # Replace backslashes for ffmpeg concat
                        safe_path = img_path.replace("\\", "/")
                        f.write(f"file '{safe_path}'\n")
                        f.write(f"duration {dur}\n")
                    # Last image repeated once for ffmpeg concat rule
                    if image_paths:
                        f.write(f"file '{image_paths[-1].replace(chr(92), '/')}'\n")

                cmd = [
                    self.ffmpeg_path,
                    "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", concat_file,
                    "-i", audio_path,
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
                    "-c:v", "libx264",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-shortest",
                    output_mp4
                ]
                subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            except Exception as e:
                print(f"[VideoComposer] FFmpeg execution error: {e}. Preserving individual assets.")

        # Compute deterministic final hash
        hasher = hashlib.sha256()
        hasher.update(title.encode("utf-8"))
        for p in image_paths:
            if os.path.exists(p):
                with open(p, "rb") as f:
                    hasher.update(f.read()[:1024])
        final_hash = hasher.hexdigest()[:16]

        manifest = {
            "video_id": video_id,
            "title": title,
            "duration_seconds": total_duration,
            "final_hash": final_hash,
            "scenes_count": len(scenes),
            "captions_vtt": vtt_path,
            "audio_file": audio_path,
            "image_files": image_paths,
            "output_mp4": output_mp4 if os.path.exists(output_mp4) else None
        }

        return {
            "final_hash": final_hash,
            "duration_seconds": total_duration,
            "output_file": output_mp4 if os.path.exists(output_mp4) else (image_paths[0] if image_paths else ""),
            "vtt_file": vtt_path,
            "manifest": manifest
        }

    def _format_vtt_time(self, seconds: float) -> str:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        return f"{mins:02d}:{secs:02d}.{millis:03d}"
