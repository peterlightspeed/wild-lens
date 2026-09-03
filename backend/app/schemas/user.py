import uuid
from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: str | None = None
    studio_credits: int


class UserUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
