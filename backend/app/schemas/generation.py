import uuid
from pydantic import BaseModel


class GenerateImageRequest(BaseModel):
    prompt: str
    negative_prompt: str | None = None
    aspect_ratio: str = "1:1"
    model: str = "wildlens-diffusion-v3"
    seed: int | None = None


class ImageToVideoRequest(BaseModel):
    source_image_url: str
    motion: str = "zoomin"
    motion_strength: int = 60
    duration_seconds: int = 5


class GenerationOut(BaseModel):
    id: uuid.UUID
    kind: str
    status: str
    result_url: str | None = None
