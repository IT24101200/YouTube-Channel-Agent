# Base provider interfaces for Text, Image, and TTS models

from abc import ABC, abstractmethod
from typing import Dict, Any, List

class TextModelProvider(ABC):
    @abstractmethod
    def generate_script(self, topic: str, angle: str, brief: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured script draft with narration, claims, and scenes."""
        pass

    @abstractmethod
    def verify_claims(self, script_text: str, claims: List[Dict[str, Any]], sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Verify factual claims against evidence sources."""
        pass

class ImageModelProvider(ABC):
    @abstractmethod
    def generate_image(self, prompt: str, aspect_ratio: str = "9:16") -> bytes:
        """Generate vertical illustration image bytes."""
        pass

class TTSModelProvider(ABC):
    @abstractmethod
    def generate_speech(self, text: str, voice_name: str = "en-US-Neural2-F") -> bytes:
        """Generate spoken narration audio bytes."""
        pass
