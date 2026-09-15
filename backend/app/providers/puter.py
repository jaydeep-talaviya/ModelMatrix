from __future__ import annotations

from openai import AsyncOpenAI

from app.providers.base import ApiKeyError

PUTER_BASE_URL = "https://api.puter.com/puterai/openai/v1/"


class PuterFallbackMixin:
    """Route a provider through Puter's OpenAI-compatible endpoint.

    Activates when the provider's own API key isn't set but a Puter auth
    token is present.
    """

    def uses_puter(self) -> bool:
        return bool(self._settings.puter_auth_token) and not self._settings.has_provider_key(
            self.provider
        )

    def is_configured(self) -> bool:
        return self._settings.has_provider_key(self.provider) or self.uses_puter()

    @property
    def configured_via(self) -> str | None:
        if self.uses_puter():
            return "puter"
        if self._settings.has_provider_key(self.provider):
            return "native"
        return None

    def _puter_client(self) -> AsyncOpenAI:
        token = self._settings.puter_auth_token
        if not token:
            raise ApiKeyError(
                "Puter auth token is not configured. "
                "Set PUTER_AUTH_TOKEN in backend/.env and restart the server."
            )
        return AsyncOpenAI(base_url=PUTER_BASE_URL, api_key=token)

    async def _run_via_puter(self, config, prompt):  # noqa: ANN001
        client = self._puter_client()
        resp = await client.chat.completions.create(
            model=config.model_id,
            messages=[{"role": "user", "content": prompt}],
        )

        from app.schemas.results import Usage

        text = (resp.choices[0].message.content or "").strip() if resp.choices else ""
        usage = Usage()
        if resp.usage:
            usage = Usage(
                input_tokens=resp.usage.prompt_tokens,
                output_tokens=resp.usage.completion_tokens,
                total_tokens=resp.usage.total_tokens,
                raw=resp.usage.model_dump() if hasattr(resp.usage, "model_dump") else None,
            )
        return text, usage