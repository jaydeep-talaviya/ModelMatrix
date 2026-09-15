import pytest

from app.core.catalog import (
    MODEL_CATALOG,
    catalog_specs,
    infer_spec,
    is_non_text_openai,
    models_for_provider,
)
from app.schemas.selection import ProviderId


def test_infer_spec_effort_heuristics():
    cases = [
        # provider, model id, expected supports_effort
        (ProviderId.OPENAI, "gpt-4o-mini", False),
        (ProviderId.OPENAI, "o3-mini", True),
        (ProviderId.OPENAI, "gpt-5", True),
        (ProviderId.OPENAI, "gpt-4.1", False),
        (ProviderId.GEMINI, "gemini-2.0-flash", False),
        (ProviderId.GEMINI, "gemini-2.5-flash", True),
        (ProviderId.GEMINI, "gemini-3.6-flash", True),
        (ProviderId.ANTHROPIC, "claude-3-5-haiku", False),
        (ProviderId.ANTHROPIC, "claude-3-5-sonnet", True),
        (ProviderId.ANTHROPIC, "claude-sonnet-4-5", True),
    ]
    for provider, model_id, expected in cases:
        spec = infer_spec(provider, model_id)
        assert spec.supports_effort is expected, f"{model_id}: {spec.supports_effort}"
        assert spec.supports_structured_output is True
        assert spec.display_name  # humanized regardless of origin


def test_get_model_returns_inferred_spec_for_unknown_id():
    from app.core.catalog import get_model

    spec = get_model(ProviderId.GEMINI, "gemini-3.6-flash")
    assert spec.id == "gemini-3.6-flash"
    assert spec.supports_effort is True


def test_get_model_still_rejects_cross_provider_static_id():
    from app.core.catalog import get_model

    with pytest.raises(ValueError):
        get_model(ProviderId.GEMINI, "gpt-4o")


def test_is_non_text_openai_filters_special_models():
    for model_id in (
        "text-embedding-3-large",
        "whisper-1",
        "dall-e-3",
        "tts-1",
        "text-davinci-003",
    ):
        assert is_non_text_openai(model_id) is True
    assert is_non_text_openai("gpt-5") is False
    assert is_non_text_openai("o3-mini") is False


def test_catalog_specs_prefers_exact_entries_and_infers_rest():
    specs = catalog_specs(
        ProviderId.GEMINI,
        ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-2.5-flash"],
    )
    assert len(specs) == 2  # duplicates dropped
    by_id = {s.id: s for s in specs}
    assert by_id["gemini-2.5-flash"].display_name == "Gemini 2.5 Flash"  # static wins
    assert by_id["gemini-3.6-flash"].supports_effort is True  # inferred


def test_catalog_specs_falls_back_to_static_when_empty():
    assert catalog_specs(ProviderId.OPENAI, []) == models_for_provider(ProviderId.OPENAI)
    assert catalog_specs(ProviderId.OPENAI, ["-delete-me"])  # unknown-but-present survives


def test_static_catalog_has_expected_coverage():
    assert any(s.id == "gpt-4o-mini" for s in MODEL_CATALOG)
    assert any(s.id == "gemini-2.5-flash" for s in MODEL_CATALOG)