import cloudinary
import cloudinary.uploader

from app.core.config import settings

_configured = False


def _ensure_configured() -> bool:
    global _configured
    if _configured:
        return True
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        return False
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _configured = True
    return True


def upload(file_bytes: bytes, folder: str = "wildlens") -> str | None:
    if not _ensure_configured():
        return None
    result = cloudinary.uploader.upload(file_bytes, folder=folder)
    return result.get("secure_url")
