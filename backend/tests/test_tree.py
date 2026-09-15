from pydantic import ValidationError

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
                        "structured": [
                            {"enabled": False},
                            {"enabled": True, "format": "csv"},
                        ],
                    }
                ],
            }
        ]
    )
    configs = build_experiments(request)
    assert len(configs) == 4
    assert all(isinstance(c, ExperimentConfig) for c in configs)
    assert len({c.id for c in configs}) == 4


def test_full_requirement_example():
    request = make_request(
        [
            {
                "provider": "openai",
                "models": [
                    {
                        "model_id": "gpt-4o",
                        "efforts": ["low", "high"],
                        "structured": [
                            {"enabled": False},
                            {"enabled": True, "format": "csv"},
                            {"enabled": True, "format": "pydantic"},
                        ],
                    },
                    {
                        "model_id": "gpt-4o-mini",
                        "efforts": ["low", "high"],
                        "structured": [
                            {"enabled": False},
                            {"enabled": True, "format": "csv"},
                            {"enabled": True, "format": "pydantic"},
                        ],
                    },
                ],
            }
        ]
    )
    configs = build_experiments(request)
    assert len(configs) == 12
    ids = [c.id for c in configs]
    assert "openai__gpt-4o__low__plain" in ids
    assert "openai__gpt-4o__high__pydantic" in ids
    assert "openai__gpt-4o-mini__low__csv" in ids


def test_empty_efforts_produce_no_leaves():
    request = make_request(
        [
            {
                "provider": "openai",
                "models": [
                    {
                        "model_id": "gpt-4o",
                        "efforts": [],
                        "structured": [{"enabled": False}],
                    }
                ],
            }
        ]
    )
    assert build_experiments(request) == []


def test_empty_structured_defaults_to_no_structure():
    request = make_request(
        [
            {
                "provider": "gemini",
                "models": [
                    {"model_id": "gemini-2.0-flash", "efforts": ["medium"], "structured": []}
                ],
            }
        ]
    )
    configs = build_experiments(request)
    assert len(configs) == 1
    assert configs[0].structured_output is False
    assert configs[0].format is None
    assert configs[0].id == "gemini__gemini-2.0-flash__medium__plain"


def test_duplicate_leaves_are_dropped():
    request = make_request(
        [
            {
                "provider": "anthropic",
                "models": [
                    {
                        "model_id": "claude-3-5-sonnet",
                        "efforts": ["high"],
                        "structured": [
                            {"enabled": False},
                            {"enabled": False},
                        ],
                    }
                ],
            }
        ]
    )
    assert len(build_experiments(request)) == 1


def test_multi_provider_order():
    request = make_request(
        [
            {
                "provider": "openai",
                "models": [
                    {
                        "model_id": "gpt-4o",
                        "efforts": ["low"],
                        "structured": [{"enabled": False}],
                    }
                ],
            },
            {
                "provider": "gemini",
                "models": [
                    {
                        "model_id": "gemini-2.0-flash",
                        "efforts": ["low"],
                        "structured": [{"enabled": False}],
                    }
                ],
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
        format="pydantic",
    )
    assert cfg.display_path == "OpenAI → gpt-4o → Low → pydantic"
    assert cfg.structure_label() == "Pydantic"


def test_experiment_validation_requires_format_when_enabled():
    try:
        ExperimentConfig(
            provider="openai",
            model_id="gpt-4o",
            effort="low",
            structured_output=True,
            format=None,
        )
        assert False, "should have raised"
    except ValidationError:
        pass