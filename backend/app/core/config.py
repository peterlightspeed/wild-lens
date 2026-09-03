from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ENVIRONMENT: str = "development"
    APP_NAME: str = "WildLens API"

    SECRET_KEY: str = "insecure-dev-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/wildlens"
    CORS_ORIGINS: str = "http://localhost:8080,http://127.0.0.1:8080"
    REDIS_URL: str = "redis://localhost:6379/0"

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    VISION_API_KEY: str = ""
    IMAGE_GEN_API_KEY: str = ""
    VIDEO_GEN_API_KEY: str = ""

    # Multi-provider AI fallback chain (chat + identify) — see
    # app/services/ai_chat.py, app/services/ai_vision.py, and
    # app/services/providers/. Leave any of these blank to skip that
    # provider; the chain just falls through to the next one (or the mock).
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""

    GUEST_DAILY_IDENTIFY_LIMIT: int = 5
    FREE_MONTHLY_STUDIO_CREDITS: int = 50

    # Ask WildLens chat — guests are capped lower than logged-in users since
    # every message costs a real (if free-tier) provider call.
    GUEST_DAILY_CHAT_LIMIT: int = 15
    USER_DAILY_CHAT_LIMIT: int = 100

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
