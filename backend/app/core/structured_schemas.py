from __future__ import annotations

_SCHEMA: dict[str, object] = {
    "type": "object",
    "properties": {
        "summary": {"type": "string", "description": "One-sentence summary of the answer."},
        "answer": {"type": "string", "description": "Direct, complete answer to the prompt."},
        "key_details": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Bullet-style key points from the answer.",
        },
    },
    "required": ["summary", "answer", "key_details"],
}


def _base_schema() -> dict[str, object]:
    return {k: v for k, v in _SCHEMA.items()}


def pydantic_json_schema() -> dict[str, object]:
    """Shared JSON schema (Anthropic tools, Gemini response_schema).

    Deliberately without ``additionalProperties``: Gemini's response_schema
    rejects unknown fields such as ``additional_properties``.
    """
    return _base_schema()


def openai_json_schema() -> dict[str, object]:
    """Strict-mode JSON schema for OpenAI ``json_schema`` structured output."""
    schema = _base_schema()
    schema["additionalProperties"] = False
    return schema