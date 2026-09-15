import asyncio

import pytest

from app.core.runner import run_experiments
from app.providers.base import ProviderAdapter
from app.schemas.results import Usage
from app.schemas.selection import ExperimentRequest


class _OkayAdapter(ProviderAdapter):
    provider = "openai"

    def is_configured(self):
        return True

    async def _execute(self, config, prompt):
        return f"ok-{config.model_id}", Usage(
            input_tokens=5, output_tokens=10, total_tokens=15
        )


class _FlakyAdapter(ProviderAdapter):
    provider = "gemini"

    def is_configured(self):
        return True

    async def _execute(self, config, prompt):
        raise RuntimeError("rate limit")


def _patch_registry(monkeypatch, adapters_by_provider):
    import app.core.runner as runner_mod

    def get_adapter(provider):
        return adapters_by_provider[provider.value]

    monkeypatch.setattr(runner_mod, "get_adapter", get_adapter)


def test_run_experiments_runs_all_branches(monkeypatch):
    request = ExperimentRequest(
        prompt="Hello, what is Redis?",
        providers=[
            {
                "provider": "openai",
                "models": [
                    {
                        "model_id": "gpt-4o",
                        "efforts": ["low", "high"],
                        "structured": True,
                    }
                ],
            }
        ],
    )
    _patch_registry(monkeypatch, {"openai": _OkayAdapter(None)})
    result = asyncio.run(run_experiments(request))
    assert len(result.configs) == 2
    assert len(result.results) == 2
    assert result.succeeded_count == 2
    assert result.total_tokens == 30
    assert all(r.usage.output_tokens == 10 for r in result.results)


def test_run_experiments_errors_do_not_abort_others(monkeypatch):
    request = ExperimentRequest(
        prompt="Hi",
        providers=[
            {"provider": "openai", "models": [{"model_id": "gpt-4o", "efforts": ["low"]}]},
            {
                "provider": "gemini",
                "models": [{"model_id": "gemini-2.0-flash", "efforts": ["low"]}],
            },
        ],
    )
    _patch_registry(
        monkeypatch,
        {"openai": _OkayAdapter(None), "gemini": _FlakyAdapter(None)},
    )
    result = asyncio.run(run_experiments(request))
    assert result.succeeded_count == 1
    assert result.failed_count == 1
    failed = next(r for r in result.results if not r.succeeded)
    assert failed.error is not None