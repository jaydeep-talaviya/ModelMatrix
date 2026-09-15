from app.core.tree import build_experiments
from app.schemas.experiment import ExperimentConfig
from app.schemas.selection import ExperimentRequest


def make_request(providers):
    return ExperimentRequest(prompt="Hello, what is Redis?", providers=providers)


def test_single_branch_products():
    request = make_request(
        [
            {
                "provider": "openai",
                "models": [
                    {
                        "model_id": "gpt-4o",
                        "efforts": ["low", "high"],
                        "structured": False,
                    }
                ],
            }
        ]
    )
    configs = build_experiments(request)
    assert len(configs) == 2
    assert all(isinstance(c, ExperimentConfig) for c in configs)
    assert len({c.id for c in configs}) == 2
    assert all(c.structured_output is False for c in configs)


def test_structured_flag_yields_structured_leaf():
    request = make_request(
        [
            {
                "provider": "gemini",
                "models": [
                    {
                        "model_id": "gemini-2.5-flash",
                        "efforts": ["medium"],
                        "structured": True,
                    }
                ],
            }
        ]
    )
    configs = build_experiments(request)
    assert len(configs) == 1
    assert configs[0].structured_output is True
    assert configs[0].id == "gemini__gemini-2.5-flash__medium__structured"


def test_full_requirement_example():
    request = make_request(
        [
            {
                "provider": "openai",
                "models": [
                    {
                        "model_id": "gpt-4o",
                        "efforts": ["low", "high"],
                        "structured": True,
                    },
                    {
                        "model_id": "gpt-4o-mini",
                        "efforts": ["low", "high"],
                        "structured": False,
                    },
                ],
            }
        ]
    )
    configs = build_experiments(request)
    assert len(configs) == 4
    ids = [c.id for c in configs]
    assert "openai__gpt-4o__low__structured" in ids
    assert "openai__gpt-4o__high__structured" in ids
    assert "openai__gpt-4o-mini__low__plain" in ids
    assert "openai__gpt-4o-mini__high__plain" in ids


def test_empty_efforts_produce_no_leaves():
    request = make_request(
        [
            {
                "provider": "openai",
                "models": [{"model_id": "gpt-4o", "efforts": [], "structured": False}],
            }
        ]
    )
    assert build_experiments(request) == []


def test_structured_flag_defaults_to_false():
    request = make_request(
        [
            {
                "provider": "gemini",
                "models": [{"model_id": "gemini-2.0-flash", "efforts": ["medium"]}],
            }
        ]
    )
    configs = build_experiments(request)
    assert len(configs) == 1
    assert configs[0].structured_output is False
    assert configs[0].id == "gemini__gemini-2.0-flash__medium__plain"


def test_multi_provider_order():
    request = make_request(
        [
            {
                "provider": "openai",
                "models": [{"model_id": "gpt-4o", "efforts": ["low"]}],
            },
            {
                "provider": "gemini",
                "models": [{"model_id": "gemini-2.0-flash", "efforts": ["low"]}],
            },
        ]
    )
    configs = build_experiments(request)
    assert [c.provider.value for c in configs] == ["openai", "gemini"]


def test_display_path():
    cfg = ExperimentConfig(
        provider="openai",
        model_id="gpt-4o",
        effort="low",
        structured_output=True,
    )
    assert cfg.display_path == "OpenAI → gpt-4o → Low → structured (JSON)"
    assert cfg.structure_label() == "Structured Output (JSON)"

    plain = ExperimentConfig(
        provider="openai",
        model_id="gpt-4o",
        effort="low",
        structured_output=False,
    )
    assert plain.display_path == "OpenAI → gpt-4o → Low → no structure"
    assert plain.structure_label() == "No Structured Output"