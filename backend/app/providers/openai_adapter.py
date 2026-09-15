from __future__ import annotations

from openai import AsyncOpenAI

from app.core.catalog import get_model
from app.core.structured_schemas import csv_suffix, pydantic_json_schema
from app.providers.base import ApiKeyError, ProviderAdapter
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import Usage
from app.schemas.selection import StructuredOutputFormat


class OpenAIAdapter(ProviderAdapter):
    provider = "openai"

    def _client(self) -> AsyncOpenAI:
        self._require_key()
        api_key = self._settings.openai_api_key
        if not api_key:
            raise ApiKeyError("openai API key is not configured")
        return AsyncOpenAI(api_key=api_key)

    def _build_kwargs(self, config: ExperimentConfig, prompt: str) -> tuple[str, dict]:
        spec = get_model(config.provider, config.model_id)
        messages = [{"role": "user", "content": prompt}]
        kwargs: dict = {"model": config.model_id, "messages": messages}

        if config.structured_output:
            if config.format == StructuredOutputFormat.PYDANTIC:
                kwargs["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "result",
                        "schema": pydantic_json_schema(),
                        "strict": True,
                    },
                }
            else:  # csv
                messages[0] = {"role": "user", "content": prompt + csv_suffix()}

        if spec.supports_effort:
            kwargs["reasoning_effort"] = config.effort.value

        return config.model_id, kwargs

    async def _execute(self, config: ExperimentConfig, prompt: str) -> tuple[str, Usage]:
        client = self._client()
        model, kwargs = self._build_kwargs(config, prompt)
        resp = await client.chat.completions.create(**kwargs)

        text = (resp.choices[0].message.content or "").strip() if resp.choices else ""
        usage = Usage()
        if resp.usage:
            usage = Usage(
                input_tokens=resp.usage.prompt_tokens,
                output_tokens=resp.usage.completion_tokens,
                total_tokens=resp.usage.total_tokens,
                raw=resp.usage.model_dump() if hasattr(resp.usage, "model_dump") else None,
            )
        return text, usage