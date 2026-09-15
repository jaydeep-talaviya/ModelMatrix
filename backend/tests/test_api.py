from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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