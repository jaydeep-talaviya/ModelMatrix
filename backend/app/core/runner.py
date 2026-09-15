from __future__ import annotations

import asyncio

from app.core.tree import build_experiments
from app.providers.registry import get_adapter
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import ExperimentResult
from app.schemas.run import RunResult
from app.schemas.selection import ExperimentRequest

DEFAULT_MAX_CONCURRENCY = 12

# Per-provider caps: providers are rate-limited independently, so a slow
# provider must not starve the others. These sit inside the global cap above.
PROVIDER_MAX_CONCURRENCY = {
    "openai": 5,
    "gemini": 5,
    "anthropic": 3,
}


async def run_experiments(
    request: ExperimentRequest,
    max_concurrency: int = DEFAULT_MAX_CONCURRENCY,
) -> RunResult:
    """Expand the request into leaf configs and run every one against its provider.

    Runs concurrently (async I/O): a global cap on total in-flight calls plus a
    per-provider cap so one slow/limited provider doesn't block the others.
    Failures on any branch are captured into an ExperimentResult with status
    "error" without aborting the other branches.
    """
    configs = build_experiments(request)
    global_semaphore = asyncio.Semaphore(max_concurrency)
    provider_semaphores = {
        provider: asyncio.Semaphore(limit)
        for provider, limit in PROVIDER_MAX_CONCURRENCY.items()
    }

    async def run_one(config: ExperimentConfig) -> ExperimentResult:
        adapter = get_adapter(config.provider)
        provider_semaphore = provider_semaphores.get(
            config.provider.value, global_semaphore
        )
        async with global_semaphore, provider_semaphore:
            return await adapter.run(config, request.prompt)

    results = await asyncio.gather(*(run_one(config) for config in configs))
    return RunResult(prompt=request.prompt, configs=configs, results=list(results))