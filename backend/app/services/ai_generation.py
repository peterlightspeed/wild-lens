from app.schemas.generation import GenerateImageRequest, ImageToVideoRequest


def generate_image(payload: GenerateImageRequest) -> dict:
    return {"status": "queued", "result_url": None, "message": "Wire up an image-generation provider here."}


def remove_background(image_url: str) -> dict:
    return {"status": "queued", "result_url": None, "message": "Wire up a background-removal provider here."}


def upscale(image_url: str, scale: int = 4) -> dict:
    return {"status": "queued", "result_url": None, "message": "Wire up an upscaling provider here."}


def image_to_video(payload: ImageToVideoRequest) -> dict:
    return {"status": "queued", "result_url": None, "message": "Wire up an image-to-video provider here."}
