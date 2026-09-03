from pydantic import BaseModel


class IdentificationResult(BaseModel):
    predicted_species: str
    scientific_name: str
    confidence: float
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
