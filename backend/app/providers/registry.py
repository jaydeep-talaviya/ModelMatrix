from __future__ import annotations

from app.config import settings
from app.providers.anthropic_adapter import AnthropicAdapter
from app.providers.base import ProviderAdapter
from app.providers.gemini_adapter import GeminiAdapter
from app.providers.openai_adapter import OpenAIAdapter
from app.schemas.selection import ProviderId


def build_registry() -> dict[str, ProviderAdapter]:
    return {
        ProviderId.OPENAI.value: OpenAIAdapter(settings),
        ProviderId.GEMINI.value: GeminiAdapter(settings),
        ProviderId.ANTHROPIC.value: AnthropicAdapter(settings),
    }


_REGISTRY: dict[str, ProviderAdapter] | None = None


def _ensure_registry() -> dict[str, ProviderAdapter]:
    global _REGISTRY
    if _REGISTRY is None:
        _REGISTRY = build_registry()
    return _REGISTRY


def get_adapter(provider: ProviderId) -> ProviderAdapter:
    return _ensure_registry()[provider.value]


def get_adapters() -> list[ProviderAdapter]:
    return list(_ensure_registry().values())


def configured_providers() -> list[ProviderId]:
    return [
        provider
        for provider in ProviderId
        if get_adapter(provider).is_configured()
    ]