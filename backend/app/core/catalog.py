from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.selection import ProviderId


@dataclass(frozen=True)
class ModelSpec:
    id: str
    display_name: str
    provider: ProviderId
    supports_effort: bool
    supports_structured_output: bool
    context_window: int | None = None
    max_output_tokens: int | None = None


MODEL_CATALOG: tuple[ModelSpec, ...] = (
    # OpenAI
    ModelSpec("gpt-4o", "GPT-4o", ProviderId.OPENAI, False, True, 128_000, 16_384),
    ModelSpec("gpt-4o-mini", "GPT-4o mini", ProviderId.OPENAI, False, True, 128_000, 16_384),
    ModelSpec("o3-mini", "o3 mini", ProviderId.OPENAI, True, True, 200_000, 100_000),
    # Gemini
    ModelSpec("gemini-2.0-flash", "Gemini 2.0 Flash", ProviderId.GEMINI, False, True, 1_048_576, 8_192),
    ModelSpec("gemini-2.5-flash", "Gemini 2.5 Flash", ProviderId.GEMINI, True, True, 1_048_576, 65_536),
    ModelSpec("gemini-2.5-pro", "Gemini 2.5 Pro", ProviderId.GEMINI, True, True, 1_048_576, 65_536),
    # Anthropic
    ModelSpec("claude-3-5-sonnet", "Claude 3.5 Sonnet", ProviderId.ANTHROPIC, False, True, 200_000, 8_192),
    ModelSpec("claude-3-5-haiku", "Claude 3.5 Haiku", ProviderId.ANTHROPIC, False, True, 200_000, 8_192),
)


def get_model(provider: ProviderId, model_id: str) -> ModelSpec:
    for spec in MODEL_CATALOG:
        if spec.id == model_id:
            if spec.provider != provider:
                raise ValueError(
                    f"model '{model_id}' does not belong to provider '{provider.value}'"
                )
            return spec
    return infer_spec(provider, model_id)


def models_for_provider(provider: ProviderId) -> list[ModelSpec]:
    return [spec for spec in MODEL_CATALOG if spec.provider == provider]


# --- Heuristics for models discovered live from the provider APIs ------------

_OPENAI_EFFORT_RE = re.compile(r"^(o\d+|gpt-5(\.[0-9]+)?)")
_GEMINI_EFFORT_RE = re.compile(r"^gemini-(2\.[5-9]|3\.|4\.)")
_OPENAI_NON_TEXT_RE = re.compile(
    r"(embedding|whisper|tts|speech|transcribe|translate|dall|moderation|"
    r"realtime|image|audio|davinci|babbage|curie|ada|gpt-3)",
    re.IGNORECASE,
)


def _humanize(model_id: str) -> str:
    return model_id.replace("-", " ").replace("_", " ").strip().title()


def infer_spec(provider: ProviderId, model_id: str) -> ModelSpec:
    """Build a ModelSpec for an id we've never seen before.

    Capability guesses are best-effort; exact entries in MODEL_CATALOG always
    take precedence (see ``catalog_specs``).
    """
    if provider == ProviderId.OPENAI:
        supports_effort = bool(_OPENAI_EFFORT_RE.match(model_id))
    elif provider == ProviderId.GEMINI:
        supports_effort = bool(_GEMINI_EFFORT_RE.match(model_id))
    else:  # anthropic
        supports_effort = "sonnet" in model_id or "opus" in model_id

    return ModelSpec(
        id=model_id,
        display_name=_humanize(model_id),
        provider=provider,
        supports_effort=supports_effort,
        supports_structured_output=True,
        context_window=_guess_context_window(provider, model_id),
        max_output_tokens=_guess_max_output(provider, model_id),
    )


def _guess_context_window(provider: ProviderId, model_id: str) -> int | None:
    if provider == ProviderId.OPENAI:
        if "mini" in model_id:
            return 128_000
        return 200_000
    if provider == ProviderId.GEMINI:
        return 1_048_576
    if "haiku" in model_id:
        return 200_000
    return 200_000


def _guess_max_output(provider: ProviderId, model_id: str) -> int | None:
    if provider == ProviderId.OPENAI:
        if "mini" in model_id:
            return 16_384
        return 100_000
    if provider == ProviderId.GEMINI:
        if re.match(r"^gemini-2\.0", model_id):
            return 8_192
        return 65_536
    return 8_192


def is_non_text_openai(model_id: str) -> bool:
    return bool(_OPENAI_NON_TEXT_RE.search(model_id))


def catalog_specs(provider: ProviderId, model_ids: list[str]) -> list[ModelSpec]:
    """Map discovered model ids to specs, preferring exact catalog entries.

    Falls back to the static catalog when discovery returned nothing.
    """
    static = {spec.id: spec for spec in models_for_provider(provider)}
    specs: list[ModelSpec] = []
    seen: set[str] = set()
    for model_id in model_ids:
        if model_id in seen:
            continue
        seen.add(model_id)
        if model_id in static:
            specs.append(static[model_id])
        else:
            specs.append(infer_spec(provider, model_id))

    if not specs:
        return models_for_provider(provider)
    return specs