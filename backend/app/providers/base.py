from __future__ import annotations

import time
from abc import ABC, abstractmethod

from app.config import Settings
from app.core.catalog import get_model
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import ExperimentResult, Usage


class AdapterError(RuntimeError):
    """Raised when an adapter fails for a user-facing reason."""


class ApiKeyError(AdapterError):
    """Raised when the provider API key is missing from configuration."""


class ProviderAdapter(ABC):
    """Base class for provider adapters.

    Subclasses implement ``_execute`` (the vendor-specific call) and the base
    ``run`` handles validation, timing, and converting failures into an
    ``ExperimentResult`` with status "error".
    """

    provider: str

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def is_configured(self) -> bool:
        return self._settings.has_provider_key(self.provider)

    def _require_key(self) -> None:
        if not self.is_configured():
            raise ApiKeyError(
                f"{self.provider} API key is not configured. "
                "Add it to backend/.env and restart the server."
            )

    def validate(self, config: ExperimentConfig) -> None:
        spec = get_model(config.provider, config.model_id)
        if config.structured_output and not spec.supports_structured_output:
            raise AdapterError(
                f"model '{config.model_id}' does not support structured output"
            )

    async def run(self, config: ExperimentConfig, prompt: str) -> ExperimentResult:
        self.validate(config)
        start = time.monotonic()
        try:
            response_text, usage = await self._execute(config, prompt)
            status, error = "success", None
        except AdapterError as exc:
            response_text, usage = None, Usage()
            status, error = "error", str(exc)
        except Exception as exc:  # noqa: BLE001 - normalize any provider failure
            response_text, usage = None, Usage()
            status, error = "error", f"{type(exc).__name__}: {exc}"
        duration_ms = int((time.monotonic() - start) * 1000)
        return ExperimentResult(
            config=config,
            status=status,
            response=response_text,
            usage=usage,
            error=error,
            duration_ms=duration_ms,
        )

    @abstractmethod
    async def _execute(self, config: ExperimentConfig, prompt: str) -> tuple[str, Usage]:
        """Run the prompt with config's parameters; return (response, usage)."""