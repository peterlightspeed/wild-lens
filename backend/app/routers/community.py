from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.sighting import Sighting, SightingComment, SightingLike
from app.models.user import User
from app.schemas.sighting import CommentCreate, CommentOut, SightingCreate, SightingOut

router = APIRouter(prefix="/api/sightings", tags=["community"])


def _to_out(s: Sighting, db: Session) -> SightingOut:
    likes = db.query(func.count(SightingLike.id)).filter(SightingLike.sighting_id == s.id).scalar() or 0
    comments = db.query(func.count(SightingComment.id)).filter(SightingComment.sighting_id == s.id).scalar() or 0
    return SightingOut(
        id=s.id, user_id=s.user_id, species_name=s.species_name, location=s.location,
        caption=s.caption, image_url=s.image_url, is_verified=s.is_verified,
        likes=likes, comments=comments, created_at=s.created_at,
    )


@router.get("", response_model=list[SightingOut])
def list_sightings(
    verified_only: bool = Query(False),
    sort: str = Query("recent", pattern="^(recent|liked|commented)$"),
    db: Session = Depends(get_db),
    _guest_ok: User | None = Depends(get_optional_user),
):
    query = db.query(Sighting)
    if verified_only:
        query = query.filter(Sighting.is_verified.is_(True))
    query = query.order_by(Sighting.created_at.desc())
    results = [_to_out(s, db) for s in query.all()]
    if sort == "liked":
        results.sort(key=lambda r: r.likes, reverse=True)
    elif sort == "commented":
        results.sort(key=lambda r: r.comments, reverse=True)
    return results


@router.post("", response_model=SightingOut, status_code=201)
def create_sighting(payload: SightingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sighting = Sighting(user_id=current_user.id, **payload.model_dump())
    db.add(sighting)
    db.commit()
    db.refresh(sighting)
    return _to_out(sighting, db)


@router.post("/{sighting_id}/like", status_code=204)
def like_sighting(sighting_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(SightingLike).filter_by(sighting_id=sighting_id, user_id=current_user.id).first()
    if exists:
        db.delete(exists)
    else:
        db.add(SightingLike(sighting_id=sighting_id, user_id=current_user.id))
    db.commit()
    return None


@router.get("/{sighting_id}/comments", response_model=list[CommentOut])
def list_comments(sighting_id: str, db: Session = Depends(get_db)):
    return db.query(SightingComment).filter_by(sighting_id=sighting_id).order_by(SightingComment.created_at.asc()).all()


@router.post("/{sighting_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(sighting_id: str, payload: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Sighting, sighting_id):
        raise HTTPException(status_code=404, detail="Sighting not found")
    comment = SightingComment(sighting_id=sighting_id, user_id=current_user.id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
