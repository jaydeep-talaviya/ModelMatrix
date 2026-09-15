from fastapi.testclient import TestClient

from app.main import app
from app.providers import registry as registry_mod
from app.schemas.selection import ProviderId

client = TestClient(app)


class _StubAdapter:
    def __init__(self, configured: bool, model_ids: list[str]):
        self._configured = configured
        self._model_ids = model_ids

    def is_configured(self):
        return self._configured

    async def list_models(self):
        return self._model_ids


def _set_registry(adapters_by_id: dict[str, _StubAdapter]) -> None:
    registry_mod._REGISTRY = adapters_by_id


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_options_endpoint_shape():
    r = client.get("/api/options")
    assert r.status_code == 200
    data = r.json()
    provider_ids = {p["id"] for p in data["providers"]}
    assert provider_ids == {"openai", "gemini", "anthropic"}
    for provider in data["providers"]:
        assert provider["display_name"]
        assert provider["models"], f"no models for {provider['id']}"
        assert provider["efforts"] == ["low", "medium", "high"]
        assert "configured" in provider and provider["configured"] is False


def test_options_endpoint_reflects_live_models():
    _set_registry(
        {
            "openai": _StubAdapter(True, ["gpt-4o-mini", "gpt-5"]),
            "gemini": _StubAdapter(True, ["gemini-3.6-flash", "gemini-2.5-flash"]),
            "anthropic": _StubAdapter(False, []),
        }
    )
    r = client.get("/api/options")
    assert r.status_code == 200
    data = r.json()
    by_id = {p["id"]: p for p in data["providers"]}

    openai_ids = {m["id"] for m in by_id["openai"]["models"]}
    assert openai_ids == {"gpt-4o-mini", "gpt-5"}
    assert by_id["openai"]["configured"] is True
    gpt5 = next(m for m in by_id["openai"]["models"] if m["id"] == "gpt-5")
    assert gpt5["supports_effort"] is True

    gemini_ids = {m["id"] for m in by_id["gemini"]["models"]}
    assert gemini_ids == {"gemini-3.6-flash", "gemini-2.5-flash"}
    flash = next(m for m in by_id["gemini"]["models"] if m["id"] == "gemini-3.6-flash")
    assert flash["supports_effort"] is True

    # unconfigured provider falls back to the static catalog
    anthropic_ids = {m["id"] for m in by_id["anthropic"]["models"]}
    assert by_id["anthropic"]["configured"] is False
    assert "claude-3-5-sonnet" in anthropic_ids


def test_runs_endpoint_returns_error_results_without_keys():
    payload = {
        "prompt": "Hello, what is Redis?",
        "providers": [
            {
                "provider": "openai",
                "models": [
                    {
                        "model_id": "gpt-4o",
                        "efforts": ["low"],
                        "structured": False,
                    }
                ],
            }
        ],
    }
    r = client.post("/api/runs", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert len(data["configs"]) == 1
    assert len(data["results"]) == 1
    result = data["results"][0]
    assert result["status"] == "error"
    assert "API key is not configured" in result["error"]
    assert result["config_id"] == "openai__gpt-4o__low__plain"


def test_runs_endpoint_rejects_no_providers():
    r = client.post("/api/runs", json={"prompt": "hi", "providers": []})
    assert r.status_code == 422


def test_runs_endpoint_rejects_blank_prompt():
    r = client.post(
        "/api/runs",
        json={"prompt": "   ", "providers": [{"provider": "openai", "models": []}]},
    )
    assert r.status_code == 422