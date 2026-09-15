from __future__ import annotations

from openai import AsyncOpenAI

from app.core.catalog import get_model, is_non_text_openai
from app.core.structured_schemas import openai_json_schema
from app.providers.base import ApiKeyError, ProviderAdapter
from app.providers.puter import PuterFallbackMixin
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import Usage


class OpenAIAdapter(PuterFallbackMixin, ProviderAdapter):
    provider = "openai"

    def _client(self) -> AsyncOpenAI:
        self._require_key()
        api_key = self._settings.openai_api_key
        if not api_key:
            raise ApiKeyError("openai API key is not configured")
        return AsyncOpenAI(api_key=api_key)

    async def list_models(self) -> list[str]:
        if self.uses_puter():
            return await self._puter_models()
        if not self._settings.has_provider_key(self.provider):
            return []
        try:
            resp = await self._client().models.list()
        except Exception:
            return []
        return [m.id for m in resp.data if m.id and not is_non_text_openai(m.id)]

    def _build_kwargs(self, config: ExperimentConfig, prompt: str) -> dict:
        spec = get_model(config.provider, config.model_id)
        messages = [{"role": "user", "content": prompt}]
        kwargs: dict = {"model": config.model_id, "messages": messages}

        if config.structured_output:
            kwargs["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": "result",
                    "schema": openai_json_schema(),
                    "strict": True,
                },
            }

        if spec.supports_effort:
            kwargs["reasoning_effort"] = config.effort.value

        return kwargs

    async def _execute(self, config: ExperimentConfig, prompt: str) -> tuple[str, Usage]:
        if self.uses_puter():
            return await self._run_via_puter(config, prompt)
        client = self._client()
        kwargs = self._build_kwargs(config, prompt)
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