from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "LLM Parameter Comparison"
    debug: bool = False
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    anthropic_api_key: str | None = None
    puter_auth_token: str | None = None
    # Comma-separated providers to force through Puter even when their own key
    # is set (e.g. a key with no credits): "openai,anthropic".
    puter_route: str = ""

    def has_provider_key(self, provider_id: str) -> bool:
        return bool(getattr(self, f"{provider_id}_api_key", None))

    @property
    def puter_route_providers(self) -> set[str]:
        return {p.strip().lower() for p in (self.puter_route or "").split(",") if p.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()