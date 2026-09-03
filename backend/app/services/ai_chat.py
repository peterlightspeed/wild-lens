"""
Chat orchestrator — tries each provider in PROVIDER_CHAIN in order, falling
through on any ProviderError until one succeeds.

To swap the whole app over to a single paid, animal-fine-tuned model later,
write one new adapter class implementing `ChatProvider` (see
providers/base.py) and change PROVIDER_CHAIN to `[YourFineTunedProvider()]`.
Nothing in app/routers/chat.py, app/schemas/chat.py, or the frontend needs
to change — they only ever see `get_chat_response()`.
"""
from __future__ import annotations

import logging

from app.services.providers.base import ProviderError
from app.services.providers.chat_providers import (
    GeminiChatProvider,
    GroqChatProvider,
    MockChatProvider,
    OpenRouterChatProvider,
)

logger = logging.getLogger("wildlens.ai_chat")

SYSTEM_PROMPT = (
    "You are the WildLens Assistant, a friendly wildlife and nature expert built "
    "into the WildLens app. Answer questions about animals, plants, habitats, "
    "identification tips, conservation, and outdoor safety. Keep answers concise "
    "(2-4 short paragraphs max) and conversational. If asked something entirely "
    "unrelated to nature or the WildLens app, gently steer back to wildlife topics. "
    "If a question is safety-critical (e.g. 'is this snake venomous'), be clear "
    "about the uncertainty of identifying anything from a text description alone."
)

# Order matters — each is tried in turn until one succeeds. Swap, reorder, or
# collapse this list without touching anything else in the codebase.
PROVIDER_CHAIN = [
    GroqChatProvider(),
    GeminiChatProvider(),
    OpenRouterChatProvider(),
    MockChatProvider(),  # always succeeds — remove for prod if a hard error is preferred
]


class AllProvidersFailedError(Exception):
    pass


def get_chat_response(history: list[dict]) -> tuple[str, str]:
    """`history` is a list of {"role": "user"|"assistant", "content": str},
    oldest first, NOT including the system prompt (added here).
    Returns (reply_text, provider_name_that_served_it).
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}, *history]

    for provider in PROVIDER_CHAIN:
        try:
            reply = provider.send(messages)
            logger.info("chat served by provider=%s", provider.name)
            return reply, provider.name
        except ProviderError as e:
            logger.warning("provider=%s failed, falling through: %s", provider.name, e)
            continue

    raise AllProvidersFailedError("Every configured chat provider failed")
