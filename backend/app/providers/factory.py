# LLM and Model Provider Factory
# Implements unified access to local Ollama or Gemini providers

from app.core.config import settings
from app.providers.base import TextModelProvider
from app.providers.ollama_provider import OllamaTextProvider
from app.providers.gemini_provider import GeminiTextProvider

def get_text_provider() -> TextModelProvider:
    """
    Returns the active text model provider based on user settings.
    Supports 'ollama' (local hardware) and 'gemini' (cloud API).
    """
    provider_name = (settings.LLM_PROVIDER or "ollama").strip().lower()

    if provider_name == "gemini":
        return GeminiTextProvider()

    # Default to Ollama local provider
    return OllamaTextProvider(
        base_url=settings.OLLAMA_BASE_URL,
        model=settings.OLLAMA_MODEL
    )
