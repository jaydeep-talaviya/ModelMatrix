from app.schemas.selection import EffortLevel, ProviderId

PROVIDER_DISPLAY: dict[ProviderId, str] = {
    ProviderId.OPENAI: "OpenAI",
    ProviderId.GEMINI: "Gemini",
    ProviderId.ANTHROPIC: "Anthropic",
}

EFFORT_DISPLAY: dict[EffortLevel, str] = {
    EffortLevel.LOW: "Low",
    EffortLevel.MEDIUM: "Medium",
    EffortLevel.HIGH: "High",
}