from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.generation import Generation
from app.models.user import User
from app.schemas.generation import GenerateImageRequest, GenerationOut, ImageToVideoRequest
from app.services import ai_generation

router = APIRouter(prefix="/api/studio", tags=["studio"])

CREDIT_COST = {"generate": 5, "bg-remove": 2, "upscale": 3, "image-to-video": 10}


def _spend_credits(user: User, kind: str, db: Session) -> None:
    cost = CREDIT_COST.get(kind, 1)
    if user.studio_credits < cost:
        raise HTTPException(status_code=402, detail="Not enough studio credits")
    user.studio_credits -= cost
    db.commit()


@router.post("/generate", response_model=GenerationOut)
def generate_image(payload: GenerateImageRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _spend_credits(current_user, "generate", db)
    result = ai_generation.generate_image(payload)
    gen = Generation(user_id=current_user.id, kind="generate", prompt=payload.prompt, status=result["status"], result_url=result["result_url"])
    db.add(gen); db.commit(); db.refresh(gen)
    return GenerationOut(id=gen.id, kind=gen.kind, status=gen.status, result_url=gen.result_url)


@router.post("/remove-background", response_model=GenerationOut)
def remove_background(image_url: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _spend_credits(current_user, "bg-remove", db)
    result = ai_generation.remove_background(image_url)
    gen = Generation(user_id=current_user.id, kind="bg-remove", source_url=image_url, status=result["status"], result_url=result["result_url"])
    db.add(gen); db.commit(); db.refresh(gen)
    return GenerationOut(id=gen.id, kind=gen.kind, status=gen.status, result_url=gen.result_url)


@router.post("/upscale", response_model=GenerationOut)
def upscale(image_url: str, scale: int = 4, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _spend_credits(current_user, "upscale", db)
    result = ai_generation.upscale(image_url, scale)
    gen = Generation(user_id=current_user.id, kind="upscale", source_url=image_url, status=result["status"], result_url=result["result_url"])
    db.add(gen); db.commit(); db.refresh(gen)
    return GenerationOut(id=gen.id, kind=gen.kind, status=gen.status, result_url=gen.result_url)


@router.post("/image-to-video", response_model=GenerationOut)
def image_to_video(payload: ImageToVideoRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _spend_credits(current_user, "image-to-video", db)
    result = ai_generation.image_to_video(payload)
    gen = Generation(user_id=current_user.id, kind="image-to-video", source_url=payload.source_image_url, status=result["status"], result_url=result["result_url"])
    db.add(gen); db.commit(); db.refresh(gen)
    return GenerationOut(id=gen.id, kind=gen.kind, status=gen.status, result_url=gen.result_url)


@router.get("/history", response_model=list[GenerationOut])
def history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    gens = db.query(Generation).filter_by(user_id=current_user.id).order_by(Generation.created_at.desc()).limit(20).all()
    return [GenerationOut(id=g.id, kind=g.kind, status=g.status, result_url=g.result_url) for g in gens]
