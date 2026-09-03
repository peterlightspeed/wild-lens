"""
Provider-agnostic interfaces for AI calls.

Anything that talks to a third-party AI API (chat, vision, generation)
implements one of these Protocols. Routers and services never import a
specific provider directly — they only see `ChatProvider` / `VisionProvider`
and iterate over a chain of them. This is what makes swapping providers (or
collapsing the whole chain down to one paid, fine-tuned model later) a
config change instead of a code change — see `PROVIDER_CHAIN` in
`ai_chat.py` and `VISION_PROVIDER_CHAIN` in `ai_vision.py`.
"""
from __future__ import annotations

from typing import Protocol


class ProviderError(Exception):
    """Raised by a provider adapter on timeout, rate-limit, or API error.

    The orchestrator catches exactly this (and its subclasses) and falls
    through to the next provider in the chain. Anything else (a bug in our
    own code) is allowed to propagate and fail loudly.
    """


class ProviderRateLimited(ProviderError):
    """The provider's own rate limit was hit — try the next provider."""


class ProviderTimeout(ProviderError):
    """The provider took too long to respond."""


class ChatProvider(Protocol):
    """One backend that can turn a message history into a reply."""

    name: str

    def send(self, messages: list[dict]) -> str:
        """`messages` is a list of {"role": "user"|"assistant"|"system", "content": str}.
        Returns the assistant's reply text. Raises ProviderError on failure.
        """
        ...


class VisionProvider(Protocol):
    """One backend that can identify a species from an image."""

    name: str

    def identify(self, image_bytes: bytes) -> "IdentificationResult":
        ...
