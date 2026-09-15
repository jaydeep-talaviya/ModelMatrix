from __future__ import annotations

from google import genai
from google.genai import types

from app.core.catalog import get_model
from app.core.structured_schemas import csv_suffix, pydantic_json_schema
from app.providers.base import ApiKeyError, ProviderAdapter
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import Usage
from app.schemas.selection import StructuredOutputFormat

EFFORT_TO_THINKING_BUDGET: dict[str, int] = {
    "low": 0,
    "medium": 1024,
    "high": 8192,
}


class GeminiAdapter(ProviderAdapter):
    provider = "gemini"

    def _client(self) -> genai.Client:
        self._require_key()
        api_key = self._settings.gemini_api_key
        if not api_key:
            raise ApiKeyError("gemini API key is not configured")
        return genai.Client(api_key=api_key)

    def _build_config(self, config: ExperimentConfig, prompt: str) -> tuple[str, str, types.GenerateContentConfig]:
        spec = get_model(config.provider, config.model_id)
        user_prompt = prompt
        schema: dict | None = None
        mime: str | None = None

        if config.structured_output:
            if config.format == StructuredOutputFormat.PYDANTIC:
                mime = "application/json"
                schema = pydantic_json_schema()
            else:  # csv
                user_prompt = prompt + csv_suffix()

        gen_config = types.GenerateContentConfig(response_mime_type=mime, response_schema=schema)

        if spec.supports_effort:
            budget = EFFORT_TO_THINKING_BUDGET.get(config.effort.value)
            if budget:
                gen_config.thinking_config = types.ThinkingConfig(thinking_budget=budget)

        return config.model_id, user_prompt, gen_config

    async def _execute(self, config: ExperimentConfig, prompt: str) -> tuple[str, Usage]:
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