import pytest

from app.core.model_discovery import clear_model_cache
from app.providers.anthropic_adapter import AnthropicAdapter
from app.providers.gemini_adapter import GeminiAdapter
from app.providers.openai_adapter import OpenAIAdapter
from app.providers import registry as registry_mod
from app.schemas.selection import ProviderId


def _no_key_settings():
    from app.config import Settings

    return Settings(
        openai_api_key=None,
        gemini_api_key=None,
        anthropic_api_key=None,
        puter_auth_token=None,
        puter_route="",
    )


@pytest.fixture(autouse=True)
def no_provider_keys():
    """Run every test against a keyless registry, regardless of backend/.env."""
    settings = _no_key_settings()
    registry_mod._REGISTRY = {
        ProviderId.OPENAI.value: OpenAIAdapter(settings),
        ProviderId.GEMINI.value: GeminiAdapter(settings),
        ProviderId.ANTHROPIC.value: AnthropicAdapter(settings),
    }
    clear_model_cache()
    yield
    registry_mod._REGISTRY = None
    clear_model_cache()