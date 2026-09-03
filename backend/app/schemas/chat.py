from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    # Recent turns the client already has, oldest first. Kept short by the
    # frontend (last ~10 turns) — we're stateless server-side per request,
    # this is just conversational context, not a full history fetch.
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)
    session_id: str = Field(min_length=1, max_length=64)


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    remaining_today: int
