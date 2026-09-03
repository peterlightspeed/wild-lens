"""
Vision orchestrator for POST /api/identify — same fallback-chain pattern as
ai_chat.py. See providers/vision_providers.py for the adapters themselves.

To go to a single paid, fine-tuned model later: write one adapter
implementing VisionProvider and set VISION_PROVIDER_CHAIN = [YourAdapter()].
app/routers/identify.py only calls identify() below and never changes.
"""
from __future__ import annotations

import logging

from app.schemas.identification import IdentificationResult
from app.services.providers.base import ProviderError
from app.services.providers.vision_providers import (
    GeminiVisionProvider,
    GroqVisionProvider,
    MockVisionProvider,
)

logger = logging.getLogger("wildlens.ai_vision")

# Order matters — first success wins. MockVisionProvider is last so the app
# runs end-to-end with zero API keys configured, exactly like before.
VISION_PROVIDER_CHAIN = [
    GroqVisionProvider(),
    GeminiVisionProvider(),
    MockVisionProvider(),
]


class AllVisionProvidersFailedError(Exception):
    pass


def identify(image_bytes: bytes) -> IdentificationResult:
    for provider in VISION_PROVIDER_CHAIN:
        try:
            result = provider.identify(image_bytes)
            logger.info("identify served by provider=%s", provider.name)
            return result
        except ProviderError as e:
            logger.warning("provider=%s failed, falling through: %s", provider.name, e)
            continue

    # MockVisionProvider never raises, so in practice this is unreachable —
    # kept as a safety net in case the chain is edited to drop the mock.
    raise AllVisionProvidersFailedError("Every configured vision provider failed")
