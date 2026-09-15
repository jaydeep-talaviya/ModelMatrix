from __future__ import annotations

from google import genai
from google.genai import types

from app.core.catalog import get_model
from app.core.structured_schemas import pydantic_json_schema
from app.providers.base import ApiKeyError, ProviderAdapter
from app.providers.puter import PuterFallbackMixin
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import Usage

EFFORT_TO_THINKING_BUDGET: dict[str, int] = {
    "low": 0,
    "medium": 1024,
    "high": 8192,
}


class GeminiAdapter(PuterFallbackMixin, ProviderAdapter):
    provider = "gemini"

    def _client(self) -> genai.Client:
        self._require_key()
        api_key = self._settings.gemini_api_key
        if not api_key:
            raise ApiKeyError("gemini API key is not configured")
        return genai.Client(api_key=api_key)

    async def list_models(self) -> list[str]:
        if self.uses_puter():
            return await self._puter_models()
        if not self._settings.has_provider_key(self.provider):
            return []
        try:
            models = []
            listing = await self._client().aio.models.list(
                config=types.ListModelsConfig(page_size=1000)
            )
            for model in listing.page:
                name = getattr(model, "name") or ""
                if name.startswith("models/"):
                    name = name[len("models/"):]
                if not name:
                    continue
                if not (name.startswith("gemini-") or name.startswith("learnlm-")):
                    continue
                models.append(name)
        except Exception:
            return []
        return models

    def _build_config(self, config: ExperimentConfig, prompt: str) -> tuple[str, str, types.GenerateContentConfig]:
        spec = get_model(config.provider, config.model_id)
        mime: str | None = None
        schema: dict | None = None

        if config.structured_output:
            mime = "application/json"
            schema = pydantic_json_schema()

        gen_config = types.GenerateContentConfig(response_mime_type=mime, response_schema=schema)

        if spec.supports_effort:
            budget = EFFORT_TO_THINKING_BUDGET.get(config.effort.value)
            if budget:
                gen_config.thinking_config = types.ThinkingConfig(thinking_budget=budget)

        return config.model_id, prompt, gen_config

    async def _execute(self, config: ExperimentConfig, prompt: str) -> tuple[str, Usage]:
        if self.uses_puter():
            return await self._run_via_puter(config, prompt)
        client = self._client()
        model, user_prompt, gen_config = self._build_config(config, prompt)

        resp = await client.aio.models.generate_content(
            model=model,
            contents=user_prompt,
            config=gen_config,
        )

        text = (getattr(resp, "text", None) or "").strip()
        usage = Usage()
        if resp.usage_metadata:
            meta = resp.usage_metadata
            usage = Usage(
                input_tokens=meta.prompt_token_count,
                output_tokens=meta.candidates_token_count,
                total_tokens=meta.total_token_count,
                raw=meta.model_dump() if hasattr(meta, "model_dump") else None,
            )
        return text, usage