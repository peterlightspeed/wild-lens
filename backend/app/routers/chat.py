from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.dependencies import get_optional_user
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import ai_chat
from app.services.rate_limit import check_and_increment

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _rate_limit_identity(request: Request, user: User | None) -> tuple[str, int]:
    """Logged-in users are rate-limited per account; guests per IP (not per
    session_id, since that's client-chosen and trivially reset)."""
    if user:
        return f"user:{user.id}", settings.USER_DAILY_CHAT_LIMIT
    client_ip = request.client.host if request.client else "unknown"
    return f"guest:{client_ip}", settings.GUEST_DAILY_CHAT_LIMIT


@router.post("", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    request: Request,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    identity, limit = _rate_limit_identity(request, current_user)
    allowed, remaining = check_and_increment(identity, limit)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "You've reached today's chat limit."
                + ("" if current_user else " Sign in for a higher daily limit.")
            ),
        )

    history = [{"role": t.role, "content": t.content} for t in payload.history]
    history.append({"role": "user", "content": payload.message})

    try:
        reply, provider_name = ai_chat.get_chat_response(history)
    except ai_chat.AllProvidersFailedError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The chat assistant is temporarily unavailable — please try again shortly.",
        )

    db.add(ChatMessage(
        user_id=current_user.id if current_user else None,
        session_id=payload.session_id,
        role="user",
        content=payload.message,
    ))
    db.add(ChatMessage(
        user_id=current_user.id if current_user else None,
        session_id=payload.session_id,
        role="assistant",
        content=reply,
        provider=provider_name,
    ))
    db.commit()

    return ChatResponse(reply=reply, session_id=payload.session_id, remaining_today=remaining)
