import uuid as uuid_lib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token, create_refresh_token, decode_token,
    hash_password, verify_password,
)
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _issue_tokens(user: User) -> TokenResponse:
    sub = str(user.id)
    return TokenResponse(access_token=create_access_token(sub), refresh_token=create_refresh_token(sub))


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_tokens(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been disabled")
    return _issue_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    try:
        user_id = uuid_lib.UUID(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return _issue_tokens(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
