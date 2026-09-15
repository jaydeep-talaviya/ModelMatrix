from __future__ import annotations

from app.schemas.experiment import ExperimentConfig
from app.schemas.selection import ExperimentRequest, ProviderSelection


def build_experiments(request: ExperimentRequest) -> list[ExperimentConfig]:
    """Expand the user's tree selections into one ExperimentConfig per leaf.

    Ordering follows the tree: provider → model → effort. Each model runs with
    plain text output unless structured_output is enabled (then JSON). Duplicate
    leaves are dropped.
    """
    configs: list[ExperimentConfig] = []
    seen: set[str] = set()

    for provider in request.providers:
        for model in provider.models:
            for effort in model.efforts:
                cfg = ExperimentConfig(
                    provider=provider.provider,
                    model_id=model.model_id,
                    effort=effort,
                    structured_output=model.structured,
                )
                if cfg.id in seen:
                    continue
                seen.add(cfg.id)
                configs.append(cfg)

    return configs


def summarize(provider: ProviderSelection) -> str:
    models = ", ".join(m.model_id for m in provider.models)
    return f"{provider.provider.value}: [{models}]"