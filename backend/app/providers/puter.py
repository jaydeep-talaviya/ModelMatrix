from __future__ import annotations

import json
import re

import httpx

from app.core.structured_schemas import pydantic_json_schema
from app.providers.base import AdapterError, ApiKeyError

# Free accounts are not allowed to hit Puter's OpenAI/Anthropic-compatible
# gateways (/puterai/*) - they return 402 `subscription_required`. The same
# models ARE available to free accounts through the internal driver endpoint,
# which backs puter.ai.chat() and bills against the free monthly credit.
PUTER_DRIVERS_URL = "https://api.puter.com/drivers/call"

# Chat driver Puter routes on: interface=puter-chat-completion, driver=ai-chat.
_PUTER_CHAT_DRIVER = "ai-chat"

# The driver's `list` method returns ids as "<vendor>:<vendor>/<model>", e.g.
# "openai:openai/gpt-4o-mini". Bare ids ("gpt-4o-mini", "claude-sonnet-4-6",
# "gemini-3.7-flash") are accepted too.
_VENDOR_BY_PROVIDER = {
    "openai": "openai",
    "gemini": "google",
    "anthropic": "anthropic",
}

_ID_PREFIX_RE = re.compile(r"^[A-Za-z0-9-]+:[A-Za-z0-9-]+/")

# Catalog ids Puter doesn't serve directly; map to the nearest available model.
PUTER_MODEL_ALIASES: dict[str, str] = {
    "claude-3-5-sonnet": "claude-sonnet-4-6",
    "claude-3-5-haiku": "claude-haiku-4-5",
    "gemini-2.0-flash": "gemini-2.5-flash",
}

_PUTER_TIMEOUT_S = 120.0


def _strip_vendor_prefix(model_id: str) -> str:
    return _ID_PREFIX_RE.sub("", model_id)


class PuterFallbackMixin:
    """Route a provider through Puter's free-tier chat driver.

    Activates when the provider's own API key isn't set but a Puter auth token
    is present, or when the provider is listed in PUTER_ROUTE (which forces the
    route even for providers whose key is set but has no credits).
    """

    def uses_puter(self) -> bool:
        if not self._settings.puter_auth_token:
            return False
        if self.provider in self._settings.puter_route_providers:
            return True
        return not self._settings.has_provider_key(self.provider)

    def is_configured(self) -> bool:
        return self._settings.has_provider_key(self.provider) or self.uses_puter()

    @property
    def configured_via(self) -> str | None:
        if self.uses_puter():
            return "puter"
        if self._settings.has_provider_key(self.provider):
            return "native"
        return None

    def _puter_headers(self) -> dict[str, str]:
        token = self._settings.puter_auth_token
        if not token:
            raise ApiKeyError(
                "Puter auth token is not configured. "
                "Set PUTER_AUTH_TOKEN in backend/.env and restart the server."
            )
        return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    async def _call_driver(self, method: str, args: dict) -> dict:
        payload = {
            "interface": "puter-chat-completion",
            "driver": _PUTER_CHAT_DRIVER,
            "method": method,
            "test_mode": False,
            "args": args,
        }
        async with httpx.AsyncClient(timeout=_PUTER_TIMEOUT_S) as client:
            resp = await client.post(
                PUTER_DRIVERS_URL, json=payload, headers=self._puter_headers()
            )
        body = resp.json()
        code = body.get("code")
        message = body.get("message") or body.get("error")
        if body.get("success") is False or code or message or resp.status_code >= 400:
            detail = message or code or f"HTTP {resp.status_code}"
            raise AdapterError(detail)
        return body

    async def _puter_models(self) -> list[str]:
        """Model ids Puter serves for this provider (from the ai-chat driver)."""
        vendor = _VENDOR_BY_PROVIDER[self.provider]
        body = await self._call_driver("list", {})
        prefix = f"{vendor}:{vendor}/"
        models: list[str] = []
        for raw in body.get("result") or []:
            if not isinstance(raw, str) or not raw.startswith(prefix):
                continue
            models.append(_strip_vendor_prefix(raw))
        return sorted(set(models))

    def _puter_model_id(self, config) -> str:
        model_id = _strip_vendor_prefix(config.model_id)
        return PUTER_MODEL_ALIASES.get(model_id, model_id)

    async def _run_via_puter(self, config, prompt):  # noqa: ANN001
        from app.schemas.results import Usage

        from app.core.catalog import get_model

        spec = get_model(config.provider, config.model_id)
        args: dict = {
            "messages": [{"role": "user", "content": prompt}],
            "model": self._puter_model_id(config),
            "stream": False,
            "normalize": True,
        }

        if spec.supports_effort and config.effort:
            args["reasoning_effort"] = config.effort.value

        if config.structured_output:
            args["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": "emit_result",
                        "description": "Emit the structured answer to the prompt.",
                        "parameters": pydantic_json_schema(),
                    },
                }
            ]
            args["tool_choice"] = {"type": "function", "name": "emit_result"}

        body = await self._call_driver("complete", args)
        result = body.get("result") or {}
        return self._parse_puter_result(result, usage_cls=Usage)

    @staticmethod
    def _parse_puter_result(result: dict, usage_cls):  # noqa: ANN001
        usage_raw = result.get("usage") or {}
        input_tokens = usage_raw.get("prompt_tokens") or usage_raw.get("input_tokens")
        output_tokens = usage_raw.get("completion_tokens") or usage_raw.get("output_tokens")
        total = None
        if input_tokens is not None or output_tokens is not None:
            total = (input_tokens or 0) + (output_tokens or 0)
        usage = usage_cls(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total,
            raw=usage_raw if usage_raw else None,
        )

        message = result.get("message") or {}
        tool_calls = message.get("tool_calls") or []
        if tool_calls:
            arguments = (tool_calls[0].get("function") or {}).get("arguments")
            try:
                text = json.dumps(json.loads(arguments or "{}"), indent=2)
            except json.JSONDecodeError:
                text = arguments or "{}"
        else:
            content = message.get("content")
            if isinstance(content, list):
                text = "\n".join(
                    block.get("text", "")
                    for block in content
                    if isinstance(block, dict) and block.get("type") == "text"
                ).strip()
            elif isinstance(content, str):
                text = content.strip()
            else:
                text = ""
        return text, usage