from fastapi import APIRouter, HTTPException
from typing import List

from backend.services.annotation_service import AnnotationService
from backend.models import (
    AnnotationCreate,
    AnnotationCreateRequest,
    AnnotationUpdate,
    AnnotationResponse,
)

router = APIRouter(prefix="/api", tags=["annotations"])


@router.get("/images/{image_id}/annotations", response_model=List[AnnotationResponse])
async def get_annotations_for_image(image_id: int):
    """Get all annotations for a specific image."""
    service = AnnotationService()
    return service.get_annotations_for_image(image_id)


@router.post(
    "/images/{image_id}/annotations", response_model=AnnotationResponse, status_code=201
)
async def create_annotation(image_id: int, annotation_req: AnnotationCreateRequest):
    """Create a new annotation for an image."""
    # Construct the full annotation object with image_id from path
    annotation = AnnotationCreate(
        image_id=image_id,
        label=annotation_req.label,
        uv_min_u=annotation_req.uv_min_u,
        uv_min_v=annotation_req.uv_min_v,
        uv_max_u=annotation_req.uv_max_u,
        uv_max_v=annotation_req.uv_max_v,
        color=annotation_req.color,
    )

    service = AnnotationService()
    try:
        return service.create_annotation(annotation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/annotations/{annotation_id}", response_model=AnnotationResponse)
async def get_annotation(annotation_id: int):
    """Get a specific annotation by ID."""
    service = AnnotationService()
    annotation = service.get_annotation(annotation_id)

    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    return annotation


@router.put("/annotations/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(annotation_id: int, update: AnnotationUpdate):
    """Update an existing annotation."""
    service = AnnotationService()
    annotation = service.update_annotation(annotation_id, update)

    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    return annotation


@router.delete("/annotations/{annotation_id}", status_code=204)
async def delete_annotation(annotation_id: int):
    """Delete an annotation."""
    service = AnnotationService()
    success = service.delete_annotation(annotation_id)

    if not success:
        raise HTTPException(status_code=404, detail="Annotation not found")

    return None


@router.get("/annotations", response_model=List[AnnotationResponse])
async def get_all_annotations():
    """Get all annotations across all images."""
    service = AnnotationService()
    return service.get_all_annotations()
