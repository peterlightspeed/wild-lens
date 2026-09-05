from typing import Optional
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Species(Base):
    __tablename__ = "species"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    scientific_name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    conservation_status: Mapped[str] = mapped_column(String(40), nullable=False)
    class_name: Mapped[str] = mapped_column(String(80), nullable=False)
    family: Mapped[str] = mapped_column(String(80), nullable=False)
    lifespan: Mapped[str] = mapped_column(String(120), nullable=False)
    size: Mapped[str] = mapped_column(String(120), nullable=False)
    weight: Mapped[str] = mapped_column(String(120), nullable=False)
    diet_type: Mapped[str] = mapped_column(String(80), nullable=False)
    habitat: Mapped[str] = mapped_column(Text, nullable=False)
    diet_text: Mapped[str] = mapped_column(Text, nullable=False)
    conservation_text: Mapped[str] = mapped_column(Text, nullable=False)
    facts: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
