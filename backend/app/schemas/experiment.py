from __future__ import annotations

from pydantic import BaseModel, model_validator

from app.core.labels import EFFORT_DISPLAY, PROVIDER_DISPLAY
from app.schemas.selection import EffortLevel, ProviderId, StructuredOutputFormat


class ExperimentConfig(BaseModel):
    """A single leaf of the configuration tree: one concrete combination to test."""

    provider: ProviderId
    model_id: str
    effort: EffortLevel
    structured_output: bool = False
    format: StructuredOutputFormat | None = None
    id: str = ""

    @model_validator(mode="after")
    def _validate_and_assign_id(self) -> ExperimentConfig:
        if self.structured_output and self.format is None:
            raise ValueError(
                "format is required when structured_output is enabled"
            )
        if not self.structured_output and self.format is not None:
            raise ValueError(
                "format must be null when structured_output is disabled"
            )
        if not self.id:
            self.id = self._make_id()
        return self

    def _make_id(self) -> str:
        structure = self.format.value if self.structured_output else "plain"
        return f"{self.provider.value}__{self.model_id}__{self.effort.value}__{structure}"

    @property
    def display_path(self) -> str:
        provider = PROVIDER_DISPLAY[self.provider]
        effort = EFFORT_DISPLAY[self.effort]
        structure = self.format.value if self.structured_output else "no structure"
        return f"{provider} → {self.model_id} → {effort} → {structure}"

    def structure_label(self) -> str:
        if not self.structured_output:
            return "No Structured Output"
        return self.format.value.title() if self.format else "Structured Output"