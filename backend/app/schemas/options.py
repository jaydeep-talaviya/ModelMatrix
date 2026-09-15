from __future__ import annotations

from pydantic import BaseModel

from app.schemas.selection import EffortLevel, ProviderId


class ModelOption(BaseModel):
    id: str
    display_name: str
    supports_effort: bool
    supports_structured_output: bool


class ProviderOption(BaseModel):
    id: ProviderId
    display_name: str
    configured: bool
    models: list[ModelOption]
    efforts: list[EffortLevel]


class OptionsResponse(BaseModel):
    providers: list[ProviderOption]