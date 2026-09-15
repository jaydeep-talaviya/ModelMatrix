from __future__ import annotations

from pydantic import BaseModel, model_validator

from app.core.labels import EFFORT_DISPLAY, PROVIDER_DISPLAY
from app.schemas.selection import EffortLevel, ProviderId


class ExperimentConfig(BaseModel):
    """A single leaf of the configuration tree: one concrete combination to test.

    ``structured_output`` is a plain flag: when True the provider is asked to
    return a JSON object matching the shared schema, otherwise plain text.
    """

    provider: ProviderId
    model_id: str
    effort: EffortLevel
    structured_output: bool = False
    id: str = ""

    @model_validator(mode="after")
    def _assign_id(self) -> ExperimentConfig:
        if not self.id:
            self.id = self._make_id()
        return self

    def _make_id(self) -> str:
        structure = "structured" if self.structured_output else "plain"
        return f"{self.provider.value}__{self.model_id}__{self.effort.value}__{structure}"

    @property
    def display_path(self) -> str:
        provider = PROVIDER_DISPLAY[self.provider]
        effort = EFFORT_DISPLAY[self.effort]
        structure = "structured (JSON)" if self.structured_output else "no structure"
        return f"{provider} → {self.model_id} → {effort} → {structure}"

    def structure_label(self) -> str:
        return "Structured Output (JSON)" if self.structured_output else "No Structured Output"