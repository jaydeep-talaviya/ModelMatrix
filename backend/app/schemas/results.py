from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator

from app.schemas.experiment import ExperimentConfig


class Usage(BaseModel):
    """Normalized token usage reported by a provider."""

    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None
    raw: dict[str, Any] | None = None


class ExperimentResult(BaseModel):
    """Outcome of running one ExperimentConfig against its provider API."""

    config: ExperimentConfig
    config_id: str = ""
    status: str = "success"  # "success" | "error"
    response: str | None = None
    usage: Usage = Field(default_factory=Usage)
    error: str | None = None
    duration_ms: int | None = None

    @model_validator(mode="after")
    def _fill_config_id(self) -> ExperimentResult:
        if not self.config_id:
            self.config_id = self.config.id
        return self

    @property
    def succeeded(self) -> bool:
        return self.status == "success"