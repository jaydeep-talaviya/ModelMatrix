from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ProviderId(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"


class EffortLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ModelSelection(BaseModel):
    model_id: str
    efforts: list[EffortLevel] = Field(default_factory=list)
    structured: bool = False

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