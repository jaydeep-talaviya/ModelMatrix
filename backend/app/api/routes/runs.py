from fastapi import APIRouter, HTTPException

from app.core.labels import PROVIDER_DISPLAY
from app.core.catalog import models_for_provider
from app.core.runner import run_experiments
from app.providers.registry import get_adapter
from app.schemas.options import ModelOption, OptionsResponse, ProviderOption
from app.schemas.run import RunResult
from app.schemas.selection import (
    EffortLevel,
    ExperimentRequest,
    ProviderId,
    StructuredOutputFormat,
)

router = APIRouter(tags=["runs"])


@router.post("/runs", response_model=RunResult)
async def execute(request: ExperimentRequest) -> RunResult:
    if not request.providers:
        raise HTTPException(
            status_code=422,
            detail="select at least one provider and model to run an experiment",
        )
    return await run_experiments(request)


@router.get("/options", response_model=OptionsResponse)
def options() -> OptionsResponse:
    providers: list[ProviderOption] = []
    for provider in ProviderId:
        adapter = get_adapter(provider)
        models = [
            ModelOption(
                id=m.id,
                display_name=m.display_name,
                supports_effort=m.supports_effort,
                supports_structured_output=m.supports_structured_output,
            )
            for m in models_for_provider(provider)
        ]
        providers.append(
            ProviderOption(
                id=provider,
                display_name=PROVIDER_DISPLAY[provider],
                configured=adapter.is_configured(),
                models=models,
                efforts=[e for e in EffortLevel],
                structured_output_formats=[f for f in StructuredOutputFormat],
            )
        )
    return OptionsResponse(providers=providers)