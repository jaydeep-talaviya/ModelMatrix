from __future__ import annotations

import json

from anthropic import AsyncAnthropic

from app.core.catalog import get_model
from app.core.structured_schemas import pydantic_json_schema
from app.providers.base import ApiKeyError, ProviderAdapter
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import Usage

EMIT_TOOL = {
    "name": "emit_result",
    "description": "Emit the structured answer to the prompt.",
    "input_schema": pydantic_json_schema(),
}

EFFORT_TO_THINKING_BUDGET: dict[str, int] = {
    "low": 0,
    "medium": 2048,
    "high": 8192,
}


class AnthropicAdapter(ProviderAdapter):
    provider = "anthropic"

    def _client(self) -> AsyncAnthropic:
        self._require_key()
        api_key = self._settings.anthropic_api_key
        if not api_key:
            raise ApiKeyError("anthropic API key is not configured")
        return AsyncAnthropic(api_key=api_key)

    async def list_models(self) -> list[str]:
        if not self.is_configured():
            return []
        try:
            resp = await self._client().models.list()
        except Exception:
            return []
        return [m.id for m in resp.data if m.id and "claude" in m.id]

    def _build_params(self, config: ExperimentConfig, prompt: str) -> dict:
        spec = get_model(config.provider, config.model_id)
        params: dict = {
            "model": config.model_id,
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}],
        }

        if config.structured_output:
            params["tools"] = [EMIT_TOOL]
            params["tool_choice"] = {"type": "tool", "name": "emit_result"}

        if spec.supports_effort:
            budget = EFFORT_TO_THINKING_BUDGET.get(config.effort.value)
            if budget:
                params["thinking"] = {"type": "enabled", "budget_tokens": budget}

        return params

    async def _execute(self, config: ExperimentConfig, prompt: str) -> tuple[str, Usage]:
        client = self._client()
        params = self._build_params(config, prompt)
        resp = await client.messages.create(**params)

        text_parts: list[str] = []
        tool_input: dict | None = None
        for block in resp.content:
            if block.type == "text" and block.text:
                text_parts.append(block.text)
            elif block.type == "tool_use":
                tool_input = block.input
        if tool_input is not None:
            text = json.dumps(tool_input, indent=2)
        else:
            text = "\n".join(text_parts).strip()

        usage = Usage()
        if resp.usage:
            usage = Usage(
                input_tokens=resp.usage.input_tokens,
                output_tokens=resp.usage.output_tokens,
                total_tokens=(
                    (resp.usage.input_tokens or 0) + (resp.usage.output_tokens or 0)
                    or None
                ),
                raw={
                    "input_tokens": resp.usage.input_tokens,
                    "output_tokens": resp.usage.output_tokens,
                },
            )
        return text, usage