import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.species import Species
from app.schemas.species import SpeciesListResponse, SpeciesOut

router = APIRouter(prefix="/api/species", tags=["encyclopedia"])


def _to_out(s: Species) -> SpeciesOut:
    return SpeciesOut(
        id=s.id, name=s.name, scientific_name=s.scientific_name, category=s.category,
        conservation_status=s.conservation_status, class_name=s.class_name, family=s.family,
        lifespan=s.lifespan, size=s.size, weight=s.weight, diet_type=s.diet_type,
        habitat=s.habitat, diet_text=s.diet_text, conservation_text=s.conservation_text,
        facts=json.loads(s.facts), image_url=s.image_url,
    )


@router.get("", response_model=SpeciesListResponse)
def list_species(
    q: str | None = Query(None, description="Search by name or scientific name"),
    category: str | None = Query(None),
    sort: str = Query("az", pattern="^(az|za|status)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(6, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(Species)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter((Species.name.ilike(like)) | (Species.scientific_name.ilike(like)))
    if category and category != "all":
        query = query.filter(Species.category == category)

    total = query.count()
    if sort == "az":
        query = query.order_by(Species.name.asc())
    elif sort == "za":
        query = query.order_by(Species.name.desc())

    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return SpeciesListResponse(total=total, page=page, per_page=per_page, items=[_to_out(i) for i in items])


@router.get("/{species_id}", response_model=SpeciesOut)
def get_species(species_id: str, db: Session = Depends(get_db)):
    s = db.get(Species, species_id)
    if not s:
        raise HTTPException(status_code=404, detail="Species not found")
    return _to_out(s)
