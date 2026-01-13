from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from backend.services.image_service import ImageService
from backend.models import ImageListResponse, ImageResponse, ScanResult

router = APIRouter(prefix="/api/images", tags=["images"])


@router.get("", response_model=list[ImageListResponse])
async def list_images():
    """List all images with annotation counts."""
    service = ImageService()
    return service.list_images()


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(image_id: int):
    """Get image details by ID."""
    service = ImageService()
    image = service.get_image(image_id)

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    return image


@router.get("/{image_id}/file")
async def get_image_file(image_id: int):
    """Serve the full resolution image file."""
    service = ImageService()
    file_path = service.get_image_file_path(image_id)

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")

    return FileResponse(
        file_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/{image_id}/thumbnail")
async def get_thumbnail(image_id: int):
    """Serve the thumbnail image."""
    service = ImageService()
    thumbnail_path = service.get_thumbnail_path(image_id)

    if not thumbnail_path or not thumbnail_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    return FileResponse(
        thumbnail_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.post("/scan", response_model=ScanResult)
async def scan_images():
    """Scan remote directory for new images."""
    service = ImageService()
    return service.scan_images()
