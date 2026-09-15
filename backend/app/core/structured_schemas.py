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

CSV_INSTRUCTION = (
    "\n\nRespond as CSV with a header row and exactly one data row. "
    "Columns: summary, answer, key_details. "
    "Quote fields with double quotes when they contain commas or newlines. "
    "key_details must be semicolon-separated. No markdown, no extra text."
)


def pydantic_json_schema() -> dict[str, object]:
    return PYDANTIC_SCHEMA


def csv_suffix() -> str:
    return CSV_INSTRUCTION