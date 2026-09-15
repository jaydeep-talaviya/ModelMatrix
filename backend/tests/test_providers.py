import pytest

from app.core.catalog import get_model, models_for_provider, ModelSpec
from app.core.structured_schemas import pydantic_json_schema
from app.providers.base import ProviderAdapter
from app.providers.openai_adapter import OpenAIAdapter
from app.providers.gemini_adapter import GeminiAdapter
from app.providers.anthropic_adapter import AnthropicAdapter
from app.providers.registry import get_adapter
from app.schemas.experiment import ExperimentConfig
from app.schemas.results import ExperimentResult, Usage
from app.schemas.selection import ProviderId
from app.schemas.results import Usage as _Usage

ADAPTER_BY_PROVIDER = {
    ProviderId.OPENAI: OpenAIAdapter,
    ProviderId.GEMINI: GeminiAdapter,
    ProviderId.ANTHROPIC: AnthropicAdapter,
}


def test_catalog_returns_models_per_provider():
    for provider in ProviderId:
        models = models_for_provider(provider)
        assert models, f"no models for {provider}"
        assert all(isinstance(m, ModelSpec) for m in models)
        assert all(m.provider == provider for m in models)


def test_get_model_checks_provider_ownership():
    with pytest.raises(ValueError):
        get_model(ProviderId.GEMINI, "gpt-4o")


def test_registry_returns_right_adapter_class():
    for provider, adapter_cls in ADAPTER_BY_PROVIDER.items():
        adapter = get_adapter(provider)
        assert isinstance(adapter, adapter_cls)


def test_adapters_not_configured_without_keys():
    for provider in ProviderId:
        assert get_adapter(provider).is_configured() is False


def test_structured_schemas_shape():
    schema = pydantic_json_schema()
    assert schema["type"] == "object"
    assert "summary" in schema["properties"]
    assert "answer" in schema["properties"]
    assert schema["required"] == ["summary", "answer", "key_details"]


def test_usage_model_defaults():
    u = Usage()
    assert u.input_tokens is None
    assert u.output_tokens is None
    assert u.total_tokens is None


def test_result_auto_fills_config_id():
    cfg = ExperimentConfig(
        provider="openai", model_id="gpt-4o", effort="low", structured_output=False
    )
    result = ExperimentResult(
        config=cfg,
        status="success",
        response="Redis is an in-memory store.",
        usage=Usage(input_tokens=10, output_tokens=80, total_tokens=90),
    )
    assert result.config_id == cfg.id
    assert result.succeeded is True


class _FakeAdapter(ProviderAdapter):
    provider = "openai"

    def __init__(self, settings, outcome):
        super().__init__(settings)
        self._outcome = outcome

    def is_configured(self):
        return True

    async def _execute(self, config, prompt):
        if isinstance(self._outcome, Exception):
            raise self._outcome
        text, usage = self._outcome
        return text, usage


def _cfg(structured=False):
    return ExperimentConfig(
        provider="openai", model_id="gpt-4o", effort="low", structured_output=structured
    )


@pytest.mark.asyncio
async def test_run_returns_success_result():
    adapter = _FakeAdapter(
        __import__("app.config", fromlist=["settings"]).settings,
        ("hello", Usage(input_tokens=1, output_tokens=2, total_tokens=3)),
    )
    result = await adapter.run(_cfg(), "Hi")
    assert result.status == "success"
    assert result.response == "hello"
    assert result.usage.total_tokens == 3
    assert result.error is None
    assert result.duration_ms is not None


@pytest.mark.asyncio
async def test_run_captures_exception_as_error():
    adapter = _FakeAdapter(
        __import__("app.config", fromlist=["settings"]).settings,
        RuntimeError("boom"),
    )
    result = await adapter.run(_cfg(), "Hi")
    assert result.status == "error"
    assert result.response is None
    assert "boom" in result.error


@pytest.mark.asyncio
async def test_run_reports_missing_api_key():
    from app.config import settings
    from app.providers.registry import get_adapter

    adapter = get_adapter(ProviderId.OPENAI)
    assert isinstance(adapter, OpenAIAdapter)
    result = await adapter.run(_cfg(), "Hi")
    assert result.status == "error"
    assert "API key is not configured" in result.error


from app.providers.registry import get_adapter as _get_adapter  # noqa: E402


def test_openai_structured_mapping():
    adapter = _get_adapter(ProviderId.OPENAI)
    kwargs = adapter._build_kwargs(_cfg(structured=True), "P")
    rf = kwargs["response_format"]
    assert rf["type"] == "json_schema"
    assert rf["json_schema"]["name"] == "result"
    assert "reasoning_effort" not in kwargs  # gpt-4o does not support effort


def test_openai_plain_leaves_prompt_unchanged():
    adapter = _get_adapter(ProviderId.OPENAI)
    kwargs = adapter._build_kwargs(_cfg(structured=False), "P")
    assert "response_format" not in kwargs
    assert kwargs["messages"][0]["content"] == "P"


def test_openai_effort_mapping_on_supported_model():
    adapter = _get_adapter(ProviderId.OPENAI)
    kwargs = adapter._build_kwargs(_config("openai", "o3-mini", effort="high"), "P")
    assert kwargs["reasoning_effort"] == "high"


def test_gemini_structured_mapping():
    adapter = _get_adapter(ProviderId.GEMINI)
    _, _, cfg = adapter._build_config(_config("gemini", "gemini-2.0-flash", structured=True), "P")
    assert cfg.response_mime_type == "application/json"
    assert cfg.response_schema["type"] == "object"
    assert cfg.thinking_config is None


def test_gemini_plain_leaves_prompt_unchanged():
    adapter = _get_adapter(ProviderId.GEMINI)
    _, prompt, cfg = adapter._build_config(_config("gemini", "gemini-2.0-flash", structured=False), "P")
    assert prompt == "P"
    assert cfg.response_mime_type is None
    assert cfg.response_schema is None


def test_gemini_effort_maps_to_thinking_budget():
    adapter = _get_adapter(ProviderId.GEMINI)
    _, _, cfg = adapter._build_config(_config("gemini", "gemini-2.5-pro", effort="high"), "P")
    assert cfg.thinking_config is not None
    assert cfg.thinking_config.thinking_budget == 8192


def test_anthropic_structured_mapping():
    adapter = _get_adapter(ProviderId.ANTHROPIC)
    params = adapter._build_params(_config("anthropic", "claude-3-5-sonnet", structured=True), "P")
    assert params["tool_choice"] == {"type": "tool", "name": "emit_result"}
    assert params["tools"][0]["name"] == "emit_result"


def test_anthropic_plain_leaves_prompt_unchanged():
    adapter = _get_adapter(ProviderId.ANTHROPIC)
    params = adapter._build_params(_config("anthropic", "claude-3-5-sonnet", structured=False), "P")
    assert "tools" not in params
    assert params["messages"][0]["content"] == "P"


# --- Puter fallback -----------------------------------------------------------


class _FakeSettings:
    puter_auth_token = "token"
    provider_using_puter = ""

    def __init__(self, keys):
        self._keys = keys

    def has_provider_key(self, provider_id):
        return provider_id in self._keys

    @property
    def puter_providers(self):
        return {
            p.strip().lower()
            for p in (self.provider_using_puter or "").split(",")
            if p.strip()
        }


def test_puter_used_when_key_missing():
    adapter = OpenAIAdapter(_FakeSettings(["gemini"]))
    assert adapter.uses_puter() is True
    assert adapter.is_configured() is True
    assert adapter.configured_via == "puter"


def test_puter_not_used_without_token():
    settings = _FakeSettings(["gemini"])
    settings.puter_auth_token = None
    assert OpenAIAdapter(settings).uses_puter() is False


def test_puter_selected_via_provider_using_puter():
    settings = _FakeSettings(["openai"])
    settings.provider_using_puter = "openai"
    adapter = OpenAIAdapter(settings)
    assert adapter.uses_puter() is True
    assert adapter.configured_via == "puter"


def test_native_used_when_key_present_and_not_routed():
    settings = _FakeSettings(["openai"])
    adapter = OpenAIAdapter(settings)
    assert adapter.uses_puter() is False
    assert adapter.configured_via == "native"


def test_puter_aliases_strip_vendor_prefix():
    adapter = OpenAIAdapter(_FakeSettings([]))
    assert adapter._puter_model_id(_config("openai", "openai:openai/gpt-5.6-luna")) == "gpt-5.6-luna"


def test_puter_parse_plain_openai_shape():
    result = {
        "message": {"role": "assistant", "content": " OK "},
        "usage": {"prompt_tokens": 13, "completion_tokens": 1, "cached_tokens": 0},
        "finish_reason": "stop",
    }
    text, usage = OpenAIAdapter._parse_puter_result(result, usage_cls=_Usage)
    assert text == "OK"
    assert usage.input_tokens == 13
    assert usage.output_tokens == 1
    assert usage.total_tokens == 14


def test_puter_parse_claude_blocks():
    result = {
        "message": {"role": "assistant", "content": [{"type": "text", "text": "hi"}]},
        "usage": {"input_tokens": 7, "output_tokens": 3},
    }
    text, usage = OpenAIAdapter._parse_puter_result(result, usage_cls=_Usage)
    assert text == "hi"
    assert usage.input_tokens == 7
    assert usage.output_tokens == 3


def test_puter_parse_tool_call_structured():
    result = {
        "message": {
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": "call_1",
                    "type": "function",
                    "function": {"name": "emit_result", "arguments": '{"answer": "x"}'},
                }
            ],
        },
        "usage": {"prompt_tokens": 52, "completion_tokens": 14},
        "finish_reason": "tool_calls",
    }
    text, usage = OpenAIAdapter._parse_puter_result(result, usage_cls=_Usage)
    assert '"answer": "x"' in text
    assert usage.total_tokens == 66


def _config(provider, model, effort="low", structured=False):
    return ExperimentConfig(
        provider=provider,
        model_id=model,
        effort=effort,
        structured_output=structured,
    )