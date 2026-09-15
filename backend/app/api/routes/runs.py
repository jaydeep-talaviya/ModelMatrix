from fastapi import APIRouter, HTTPException

from app.core.labels import PROVIDER_DISPLAY
from app.core.model_discovery import live_models
from app.core.runner import run_experiments
from app.providers.registry import get_adapter
from app.schemas.options import ModelOption, OptionsResponse, ProviderOption
from app.schemas.run import RunResult
from app.schemas.selection import EffortLevel, ExperimentRequest, ProviderId

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
async def options() -> OptionsResponse:
    providers: list[ProviderOption] = []
    for provider in ProviderId:
        adapter = get_adapter(provider)
        models = [
            ModelOption(
                id=m.id,
                display_name=m.display_name,
                supports_effort=m.supports_effort,
                supports_structured_output=m.supports_structured_output,
                context_window=m.context_window,
                max_output_tokens=m.max_output_tokens,
            )
            for m in await live_models(provider)
        ]
        providers.append(
            ProviderOption(
                id=provider,
                display_name=PROVIDER_DISPLAY[provider],
                configured=adapter.is_configured(),
                via=getattr(adapter, "configured_via", None),
                models=models,
                efforts=[e for e in EffortLevel],
            )
        )
    return OptionsResponse(providers=providers)