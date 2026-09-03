import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SightingCreate(BaseModel):
    species_name: str
    location: str
    caption: str | None = None
    image_url: str


class SightingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    species_name: str
    location: str
    caption: str | None
    image_url: str
    is_verified: bool
    likes: int = 0
    comments: int = 0
    created_at: datetime


class CommentCreate(BaseModel):
    body: str


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    body: str
    created_at: datetime
