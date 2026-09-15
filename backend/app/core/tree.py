from __future__ import annotations

from app.schemas.experiment import ExperimentConfig
from app.schemas.selection import (
    ExperimentRequest,
    ProviderSelection,
    StructuredOutputSelection,
)


def build_experiments(request: ExperimentRequest) -> list[ExperimentConfig]:
    """Expand the user's tree selections into one ExperimentConfig per leaf.

    Ordering follows the tree: provider → model → effort → structured option.
    If a model has no structured selections, it defaults to "no structured
    output" so a run is still produced. Duplicate leaves are dropped.
    """
    configs: list[ExperimentConfig] = []
    seen: set[str] = set()

    for provider in request.providers:
        for model in provider.models:
            structured_choices = list(model.structured) or [
                StructuredOutputSelection(enabled=False)
            ]
            for effort in model.efforts:
                for choice in structured_choices:
                    cfg = ExperimentConfig(
                        provider=provider.provider,
                        model_id=model.model_id,
                        effort=effort,
                        structured_output=choice.enabled,
                        format=choice.format if choice.enabled else None,
                    )
                    if cfg.id in seen:
                        continue
                    seen.add(cfg.id)
                    configs.append(cfg)

    return configs


def summarize(provider: ProviderSelection) -> str:
    models = ", ".join(m.model_id for m in provider.models)
    return f"{provider.provider.value}: [{models}]"