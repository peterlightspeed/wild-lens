"""
Simple daily rate limiter, used to cap chat messages per day — a lower cap
for guests than for logged-in users, since every message is a real API call
to a (free-tier, but still finite) provider.

Uses Redis (already provisioned in docker-compose.yml / REDIS_URL) when
reachable, with an in-memory dict fallback so local dev without Redis
running still works — same "fail gracefully" philosophy as the rest of the
backend. The in-memory fallback is per-process and resets on restart; that's
fine for dev, but run Redis in any real deployment so limits are shared
across workers.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

import redis

from app.core.config import settings

_redis_client: redis.Redis | None = None
_redis_checked = False
_memory_store: dict[str, tuple[int, int]] = {}  # key -> (count, day_epoch)


def _get_redis() -> redis.Redis | None:
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    try:
        client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.5, socket_timeout=0.5)
        client.ping()
        _redis_client = client
    except redis.RedisError:
        _redis_client = None
    return _redis_client


def _today_epoch_day() -> int:
    return int(datetime.now(timezone.utc).timestamp() // 86400)


def check_and_increment(identity: str, daily_limit: int) -> tuple[bool, int]:
    """Returns (allowed, remaining_after_this_call). Increments unconditionally
    when allowed; does not increment when already over the limit."""
    key = f"wl:chat:rl:{identity}"
    day = _today_epoch_day()
    client = _get_redis()

    if client is not None:
        try:
            redis_key = f"{key}:{day}"
            count = client.incr(redis_key)
            if count == 1:
                client.expire(redis_key, 90000)  # a little over 24h, covers clock skew
            if count > daily_limit:
                return False, 0
            return True, daily_limit - count
        except redis.RedisError:
            pass  # fall through to in-memory

    count, stored_day = _memory_store.get(key, (0, day))
    if stored_day != day:
        count = 0
    if count >= daily_limit:
        return False, 0
    count += 1
    _memory_store[key] = (count, day)
    return True, daily_limit - count
