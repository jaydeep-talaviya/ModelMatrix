from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class ProviderId(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"


class EffortLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class StructuredOutputFormat(str, Enum):
    CSV = "csv"
    PYDANTIC = "pydantic"


class StructuredOutputSelection(BaseModel):
    enabled: bool = False
    format: StructuredOutputFormat | None = None

    @model_validator(mode="after")
    def _require_format_when_enabled(self) -> StructuredOutputSelection:
        if self.enabled and self.format is None:
            raise ValueError("format is required when structured output is enabled")
        if not self.enabled and self.format is not None:
            raise ValueError("format must be null when structured output is disabled")
        return self


class ModelSelection(BaseModel):
    model_id: str
    efforts: list[EffortLevel] = Field(default_factory=list)
    structured: list[StructuredOutputSelection] = Field(default_factory=list)

    @field_validator("model_id")
    @classmethod
    def _model_id_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("model_id must not be blank")
        return value


class ProviderSelection(BaseModel):
    provider: ProviderId
    models: list[ModelSelection] = Field(default_factory=list)


class ExperimentRequest(BaseModel):
    prompt: str = Field(min_length=1)
    providers: list[ProviderSelection] = Field(default_factory=list)

    @field_validator("prompt")
    @classmethod
    def _prompt_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("prompt must not be blank")
        return value