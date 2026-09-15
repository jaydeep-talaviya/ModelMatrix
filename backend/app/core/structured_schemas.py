from __future__ import annotations

PYDANTIC_SCHEMA: dict[str, object] = {
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
    "additionalProperties": False,
}


def pydantic_json_schema() -> dict[str, object]:
    return PYDANTIC_SCHEMA