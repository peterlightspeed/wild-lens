from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_optional_user
from app.models.identification import Identification
from app.models.user import User
from app.schemas.identification import IdentificationResult
from app.services import ai_vision

router = APIRouter(prefix="/api/identify", tags=["identify"])


@router.post("", response_model=IdentificationResult)
async def identify_photo(
    file: UploadFile = File(...),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    image_bytes = await file.read()
    result = ai_vision.identify(image_bytes)

    if current_user:
        db.add(Identification(
            user_id=current_user.id,
            image_url="",
            predicted_species=result.predicted_species,
            scientific_name=result.scientific_name,
            confidence=result.confidence,
        ))
        db.commit()

    return result
