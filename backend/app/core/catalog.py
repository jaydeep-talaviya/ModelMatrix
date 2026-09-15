from __future__ import annotations

from dataclasses import dataclass

from app.schemas.selection import ProviderId


@dataclass(frozen=True)
class ModelSpec:
    id: str
    display_name: str
    provider: ProviderId
    supports_effort: bool
    supports_structured_output: bool


MODEL_CATALOG: tuple[ModelSpec, ...] = (
    # OpenAI
    ModelSpec("gpt-4o", "GPT-4o", ProviderId.OPENAI, False, True),
    ModelSpec("gpt-4o-mini", "GPT-4o mini", ProviderId.OPENAI, False, True),
    ModelSpec("o3-mini", "o3 mini", ProviderId.OPENAI, True, True),
    # Gemini
    ModelSpec("gemini-2.0-flash", "Gemini 2.0 Flash", ProviderId.GEMINI, False, True),
    ModelSpec("gemini-2.5-flash", "Gemini 2.5 Flash", ProviderId.GEMINI, True, True),
    ModelSpec("gemini-2.5-pro", "Gemini 2.5 Pro", ProviderId.GEMINI, True, True),
    # Anthropic
    ModelSpec("claude-3-5-sonnet", "Claude 3.5 Sonnet", ProviderId.ANTHROPIC, False, True),
    ModelSpec("claude-3-5-haiku", "Claude 3.5 Haiku", ProviderId.ANTHROPIC, False, True),
)


def get_model(provider: ProviderId, model_id: str) -> ModelSpec:
    for spec in MODEL_CATALOG:
        if spec.id == model_id:
            if spec.provider != provider:
                raise ValueError(
                    f"model '{model_id}' does not belong to provider '{provider.value}'"
                )
            return spec
    raise ValueError(f"unknown model '{model_id}' for provider '{provider.value}'")


def models_for_provider(provider: ProviderId) -> list[ModelSpec]:
    return [spec for spec in MODEL_CATALOG if spec.provider == provider]