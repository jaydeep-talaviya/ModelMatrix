from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.schemas.selection import EffortLevel, ProviderId


class ModelOption(BaseModel):
    id: str
    display_name: str
    supports_effort: bool
    supports_structured_output: bool
    context_window: int | None = None
    max_output_tokens: int | None = None


class ProviderOption(BaseModel):
    id: ProviderId
    display_name: str
    configured: bool
    via: Literal["native", "puter"] | None = None
    models: list[ModelOption]
    efforts: list[EffortLevel]


class OptionsResponse(BaseModel):
    providers: list[ProviderOption]