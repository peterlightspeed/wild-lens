"""
Chat provider adapters.

Each adapter wraps one provider's HTTP API behind the shared `ChatProvider`
interface (`send(messages) -> str`). All of them:

  - read their API key from `settings` (env var), never hard-coded
  - raise `ProviderError` (or a subclass) on any failure so the orchestrator
    in `ai_chat.py` can fall through to the next provider
  - use a short timeout so one slow/dead provider doesn't stall the chain

Verify current free-tier limits/pricing yourself before relying on these in
production — they change often. As of when this was written:
  - Groq: generous free tier, very fast inference, Llama/Mixtral models.
  - Google Gemini API: free tier via AI Studio API keys (aistudio.google.com).
  - OpenRouter: routes to a rotating set of free-tier models (":free" suffix).

None of these are called unless their API key env var is set — an adapter
with no key configured raises immediately so the chain skips it without
wasting a network round trip.
"""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.services.providers.base import ProviderError, ProviderRateLimited, ProviderTimeout

REQUEST_TIMEOUT = 12.0  # seconds — keep short; we have other providers to fall back to


def _require_key(key: str, provider_name: str) -> None:
    if not key:
        raise ProviderError(f"{provider_name}: no API key configured")


def _raise_for_status(resp: httpx.Response, provider_name: str) -> None:
    if resp.status_code == 429:
        raise ProviderRateLimited(f"{provider_name}: rate limited")
    if resp.status_code >= 400:
        raise ProviderError(f"{provider_name}: HTTP {resp.status_code} — {resp.text[:200]}")


class GroqChatProvider:
    """Groq's OpenAI-compatible chat completions endpoint."""

    name = "groq"
    _URL = "https://api.groq.com/openai/v1/chat/completions"
    _MODEL = "llama-3.1-8b-instant"

    def send(self, messages: list[dict]) -> str:
        _require_key(settings.GROQ_API_KEY, self.name)
        try:
            resp = httpx.post(
                self._URL,
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={"model": self._MODEL, "messages": messages, "temperature": 0.6, "max_tokens": 600},
                timeout=REQUEST_TIMEOUT,
            )
        except httpx.TimeoutException as e:
            raise ProviderTimeout(f"{self.name}: timed out") from e
        except httpx.HTTPError as e:
            raise ProviderError(f"{self.name}: {e}") from e
        _raise_for_status(resp, self.name)
        data = resp.json()
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError) as e:
            raise ProviderError(f"{self.name}: unexpected response shape") from e


class GeminiChatProvider:
    """Google Gemini API (AI Studio free-tier key)."""

    name = "gemini"
    _MODEL = "gemini-1.5-flash"

    def send(self, messages: list[dict]) -> str:
        _require_key(settings.GEMINI_API_KEY, self.name)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._MODEL}:generateContent"
        system = "\n".join(m["content"] for m in messages if m["role"] == "system")
        contents = [
            {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
            for m in messages
            if m["role"] != "system"
        ]
        payload: dict = {"contents": contents}
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}
        try:
            resp = httpx.post(
                url,
                params={"key": settings.GEMINI_API_KEY},
                json=payload,
                timeout=REQUEST_TIMEOUT,
            )
        except httpx.TimeoutException as e:
            raise ProviderTimeout(f"{self.name}: timed out") from e
        except httpx.HTTPError as e:
            raise ProviderError(f"{self.name}: {e}") from e
        _raise_for_status(resp, self.name)
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError) as e:
            raise ProviderError(f"{self.name}: unexpected response shape") from e


class OpenRouterChatProvider:
    """OpenRouter, pinned to a free (":free") model so it costs nothing."""

    name = "openrouter"
    _URL = "https://openrouter.ai/api/v1/chat/completions"
    _MODEL = "meta-llama/llama-3.1-8b-instruct:free"

    def send(self, messages: list[dict]) -> str:
        _require_key(settings.OPENROUTER_API_KEY, self.name)
        try:
            resp = httpx.post(
                self._URL,
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "HTTP-Referer": "https://wildlens.app",
                    "X-Title": "WildLens",
                },
                json={"model": self._MODEL, "messages": messages, "temperature": 0.6, "max_tokens": 600},
                timeout=REQUEST_TIMEOUT,
            )
        except httpx.TimeoutException as e:
            raise ProviderTimeout(f"{self.name}: timed out") from e
        except httpx.HTTPError as e:
            raise ProviderError(f"{self.name}: {e}") from e
        _raise_for_status(resp, self.name)
        data = resp.json()
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError) as e:
            raise ProviderError(f"{self.name}: unexpected response shape") from e


class MockChatProvider:
    """Always succeeds — keeps local dev working with zero API keys configured.

    This is intentionally last in the default chain (see PROVIDER_CHAIN in
    ai_chat.py) so real providers are always preferred once their keys are set.
    Remove it from the chain for production if you'd rather surface a hard
    error than a canned reply when every real provider fails.
    """

    name = "mock"

    def send(self, messages: list[dict]) -> str:
        last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        return (
            "I'm running in demo mode right now (no AI provider key is configured on the "
            "backend yet), so I can't really answer \"" + last_user[:120] + "\". "
            "Once a provider key is set in backend/.env, I'll answer for real — see "
            "backend/README.md."
        )
