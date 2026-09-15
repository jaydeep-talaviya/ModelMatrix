from __future__ import annotations

import asyncio

from app.core.tree import build_experiments
from app.providers.registry import get_adapter
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import ExperimentResult
from app.schemas.run import RunResult
from app.schemas.selection import ExperimentRequest

DEFAULT_MAX_CONCURRENCY = 5


async def run_experiments(
    request: ExperimentRequest,
    max_concurrency: int = DEFAULT_MAX_CONCURRENCY,
) -> RunResult:
    """Expand the request into leaf configs and run every one against its provider.

    Each provider call is isolated: failures on any branch are captured into an
    ExperimentResult with status "error" without aborting the other branches.
    """
    configs = build_experiments(request)
    semaphore = asyncio.Semaphore(max_concurrency)

    async def run_one(config: ExperimentConfig) -> ExperimentResult:
        adapter = get_adapter(config.provider)
        async with semaphore:
            return await adapter.run(config, request.prompt)

    results = await asyncio.gather(*(run_one(config) for config in configs))
    return RunResult(prompt=request.prompt, configs=configs, results=list(results))