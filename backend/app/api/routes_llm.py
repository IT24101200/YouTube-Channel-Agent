# LLM Status and Diagnostics API routes
# Provides health check and model inspection for local Ollama and Gemini

from fastapi import APIRouter
from app.core.config import settings
from app.providers.factory import get_text_provider
from app.providers.ollama_provider import OllamaTextProvider

router = APIRouter(prefix="/llm", tags=["LLM"])

@router.get("/status")
def get_llm_status():
    """
    Get current LLM provider configuration and local connectivity status.
    """
    provider_name = (settings.LLM_PROVIDER or "ollama").strip().lower()
    
    ollama = OllamaTextProvider(
        base_url=settings.OLLAMA_BASE_URL,
        model=settings.OLLAMA_MODEL
    )
    is_connected = ollama.is_available()
    installed_models = ollama.get_installed_models() if is_connected else []

    return {
        "provider": provider_name,
        "model": settings.OLLAMA_MODEL if provider_name == "ollama" else settings.TEXT_MODEL_ID,
        "base_url": settings.OLLAMA_BASE_URL,
        "is_connected": is_connected,
        "installed_models": installed_models,
        "cost_per_script": "$0.00 (Local Hardware)" if provider_name == "ollama" else "$0.005 (Cloud API)",
        "cost_mode": "free_local" if provider_name == "ollama" else "cloud_metered"
    }

@router.post("/test")
def test_llm_generation():
    """
    Perform a quick lightweight test generation with the active text provider.
    """
    provider = get_text_provider()
    try:
        reply = provider.draft_comment_reply(
            comment_text="Is this channel using local AI?",
            video_title="Local Ollama Test",
            custom_instructions="Respond in one friendly sentence."
        )
        return {
            "success": True,
            "provider": settings.LLM_PROVIDER,
            "model": settings.OLLAMA_MODEL if settings.LLM_PROVIDER == "ollama" else settings.TEXT_MODEL_ID,
            "sample_response": reply
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
