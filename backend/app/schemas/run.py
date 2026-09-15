from __future__ import annotations

from pydantic import BaseModel

from app.schemas.experiment import ExperimentConfig
from app.schemas.results import ExperimentResult


class RunResult(BaseModel):
    prompt: str
    configs: list[ExperimentConfig]
    results: list[ExperimentResult]

    @property
    def succeeded_count(self) -> int:
        return sum(1 for r in self.results if r.succeeded)

    @property
    def failed_count(self) -> int:
        return sum(1 for r in self.results if not r.succeeded)

    @property
    def total_tokens(self) -> int:
        return sum(r.usage.total_tokens or 0 for r in self.results)