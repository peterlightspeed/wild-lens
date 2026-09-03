from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.saved_item import SavedItem
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(payload: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/saved/{item_type}/{item_id}", status_code=201)
def save_item(item_type: str, item_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(SavedItem).filter_by(user_id=current_user.id, item_type=item_type, item_id=item_id).first()
    if not exists:
        db.add(SavedItem(user_id=current_user.id, item_type=item_type, item_id=item_id))
        db.commit()
    return {"saved": True}


@router.delete("/me/saved/{item_type}/{item_id}", status_code=204)
def unsave_item(item_type: str, item_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(SavedItem).filter_by(user_id=current_user.id, item_type=item_type, item_id=item_id).delete()
    db.commit()
    return None


@router.get("/me/saved")
def list_saved(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(SavedItem).filter_by(user_id=current_user.id).all()
    return [{"item_type": i.item_type, "item_id": i.item_id} for i in items]
