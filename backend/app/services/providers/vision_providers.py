"""
Vision provider adapters — identical shape to chat_providers.py, but for
`POST /api/identify`. Each adapter sends the uploaded image to a
multimodal model and asks it to return strict JSON matching
`IdentificationResult`, then validates that JSON with Pydantic.

Same rules as chat_providers.py: no hard-coded keys, short timeout, raises
ProviderError subclasses on any failure so the orchestrator in ai_vision.py
moves on to the next provider (or the mock, last).
"""
from __future__ import annotations

import base64
import json

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.identification import IdentificationResult
from app.services.providers.base import ProviderError, ProviderRateLimited, ProviderTimeout

REQUEST_TIMEOUT = 20.0  # vision calls run slower than text — give them more room

_PROMPT = (
    "You are a wildlife identification expert. Identify the single most likely "
    "species in this photo. Respond with ONLY a JSON object (no markdown fences, "
    "no prose) with exactly these keys: predicted_species (string), "
    "scientific_name (string), confidence (number 0-100), class_name (taxonomic "
    "class, e.g. Mammalia), family (string), lifespan (string), size (string), "
    "weight (string), diet_type (string, e.g. Carnivore/Herbivore/Omnivore), "
    "habitat (string, 1-2 sentences), diet_text (string, 1-2 sentences), "
    "conservation_text (string, 1 sentence), facts (array of exactly 3 short "
    "interesting fact strings)."
)


def _parse_json_result(raw_text: str, provider_name: str) -> IdentificationResult:
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text[4:] if text.lower().startswith("json") else text
    try:
        payload = json.loads(text)
        return IdentificationResult(**payload)
    except (json.JSONDecodeError, ValidationError) as e:
        raise ProviderError(f"{provider_name}: could not parse identification JSON") from e


class GroqVisionProvider:
    """Groq's vision-capable Llama model, OpenAI-compatible endpoint."""

    name = "groq-vision"
    _URL = "https://api.groq.com/openai/v1/chat/completions"
    _MODEL = "llama-3.2-11b-vision-preview"

    def identify(self, image_bytes: bytes) -> IdentificationResult:
        if not settings.GROQ_API_KEY:
            raise ProviderError(f"{self.name}: no API key configured")
        b64 = base64.b64encode(image_bytes).decode()
        try:
            resp = httpx.post(
                self._URL,
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={
                    "model": self._MODEL,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": _PROMPT},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                        ],
                    }],
                    "temperature": 0.2,
                    "max_tokens": 700,
                },
                timeout=REQUEST_TIMEOUT,
            )
        except httpx.TimeoutException as e:
            raise ProviderTimeout(f"{self.name}: timed out") from e
        except httpx.HTTPError as e:
            raise ProviderError(f"{self.name}: {e}") from e
        if resp.status_code == 429:
            raise ProviderRateLimited(f"{self.name}: rate limited")
        if resp.status_code >= 400:
            raise ProviderError(f"{self.name}: HTTP {resp.status_code}")
        data = resp.json()
        try:
            raw_text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise ProviderError(f"{self.name}: unexpected response shape") from e
        return _parse_json_result(raw_text, self.name)


class GeminiVisionProvider:
    """Gemini 1.5 Flash — multimodal, same key as GeminiChatProvider."""

    name = "gemini-vision"
    _MODEL = "gemini-1.5-flash"

    def identify(self, image_bytes: bytes) -> IdentificationResult:
        if not settings.GEMINI_API_KEY:
            raise ProviderError(f"{self.name}: no API key configured")
        b64 = base64.b64encode(image_bytes).decode()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._MODEL}:generateContent"
        try:
            resp = httpx.post(
                url,
                params={"key": settings.GEMINI_API_KEY},
                json={"contents": [{"parts": [
                    {"text": _PROMPT},
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64}},
                ]}]},
                timeout=REQUEST_TIMEOUT,
            )
        except httpx.TimeoutException as e:
            raise ProviderTimeout(f"{self.name}: timed out") from e
        except httpx.HTTPError as e:
            raise ProviderError(f"{self.name}: {e}") from e
        if resp.status_code == 429:
            raise ProviderRateLimited(f"{self.name}: rate limited")
        if resp.status_code >= 400:
            raise ProviderError(f"{self.name}: HTTP {resp.status_code}")
        data = resp.json()
        try:
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise ProviderError(f"{self.name}: unexpected response shape") from e
        return _parse_json_result(raw_text, self.name)


class MockVisionProvider:
    """The original mock — random pick from a small fixed set. Always last
    in the chain so local dev and demos keep working with zero API keys."""

    name = "mock"

    _RESULTS: list[IdentificationResult] = [
        IdentificationResult(
            predicted_species="Red Fox", scientific_name="Vulpes vulpes", confidence=96.4,
            class_name="Mammalia", family="Canidae", lifespan="3-6 years (wild)",
            size="45-90 cm body length", weight="3.6-6.8 kg", diet_type="Omnivore",
            habitat="Forests, grasslands, mountains, and increasingly urban edges across the Northern Hemisphere.",
            diet_text="Opportunistic — small mammals, birds, insects, fruit, and human food scraps.",
            facts=["Can hear a watch ticking 40 metres away.", "Uses Earth's magnetic field to judge pounce distance.", "Has over 40 distinct vocalisations."],
            conservation_text="Population stable and expanding into urban habitats worldwide.",
        ),
        IdentificationResult(
            predicted_species="White-tailed Deer", scientific_name="Odocoileus virginianus", confidence=97.1,
            class_name="Mammalia", family="Cervidae", lifespan="6-14 years (wild)",
            size="95-220 cm body length", weight="34-136 kg", diet_type="Herbivore",
            habitat="Forest edges, meadows, and agricultural land across the Americas.",
            diet_text="Browses leaves, twigs, fruit, nuts, and agricultural crops seasonally.",
            facts=["Raises its tail as a white flag to warn the herd.", "Fawns are scent-free at birth.", "Antlers regrow annually."],
            conservation_text="Abundant across most of its range.",
        ),
        IdentificationResult(
            predicted_species="Snow Leopard", scientific_name="Panthera uncia", confidence=92.8,
            class_name="Mammalia", family="Felidae", lifespan="15-18 years (wild)",
            size="75-150 cm body length", weight="22-55 kg", diet_type="Carnivore",
            habitat="High-altitude alpine zones of Central and South Asia, 3,000-4,500 m elevation.",
            diet_text="Preys on blue sheep, ibex, and marmots across steep mountain terrain.",
            facts=["Cannot roar — makes a chuff-like call instead.", "Tail can equal body length.", "Can leap up to 15 metres."],
            conservation_text="Fewer than 10,000 mature individuals remain in the wild.",
        ),
    ]

    def identify(self, image_bytes: bytes) -> IdentificationResult:
        import random
        return random.choice(self._RESULTS)
