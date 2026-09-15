from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass

from app.core.catalog import ModelSpec, catalog_specs, models_for_provider
from app.providers.registry import get_adapter
from app.schemas.selection import ProviderId

CACHE_TTL_S = 900
LIST_TIMEOUT_S = 15


@dataclass
class _CacheEntry:
    specs: list[ModelSpec]
    fetched_at: float


_cache: dict[ProviderId, _CacheEntry] = {}


def clear_model_cache(provider: ProviderId | None = None) -> None:
    if provider is None:
        _cache.clear()
    else:
        _cache.pop(provider, None)


async def live_models(provider: ProviderId) -> list[ModelSpec]:
    """Model specs for a provider, from its live listing (cached).

    Falls back to the static catalog when the provider has no key, the listing
    call fails, or nothing usable comes back.
    """
    now = time.monotonic()
    entry = _cache.get(provider)
    if entry and now - entry.fetched_at < CACHE_TTL_S:
        return entry.specs

    adapter = get_adapter(provider)
    model_ids: list[str] = []
    if adapter.is_configured():
        try:
            model_ids = sorted(await asyncio.wait_for(adapter.list_models(), LIST_TIMEOUT_S))
        except Exception:
            model_ids = []

    specs = catalog_specs(provider, model_ids)
    _cache[provider] = _CacheEntry(specs, now)
    return specs


def static_models(provider: ProviderId) -> list[ModelSpec]:
    return models_for_provider(provider)