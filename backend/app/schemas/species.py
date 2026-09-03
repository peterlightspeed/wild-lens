from pydantic import BaseModel, ConfigDict


class SpeciesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    scientific_name: str
    category: str
    conservation_status: str
    class_name: str
    family: str
    lifespan: str
    size: str
    weight: str
    diet_type: str
    habitat: str
    diet_text: str
    conservation_text: str
    facts: list[str]
    image_url: str | None = None


class SpeciesListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    items: list[SpeciesOut]
