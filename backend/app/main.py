from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, chat, community, encyclopedia, identify, studio, users

app = FastAPI(
    title=settings.APP_NAME,
    description="WildLens API — AI identification, encyclopedia, community sightings, and creative studio.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(encyclopedia.router)
app.include_router(identify.router)
app.include_router(community.router)
app.include_router(studio.router)
app.include_router(chat.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


@app.get("/", tags=["meta"])
def root():
    return {"name": settings.APP_NAME, "docs": "/docs"}
