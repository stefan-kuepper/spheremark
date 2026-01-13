"""Project management routes."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from backend.models import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    LabelSchemaCreate,
    LabelSchemaUpdate,
    LabelSchemaResponse,
    ImageListResponse,
    ImageResponse,
    ScanResult,
)
from backend.services.project_service import ProjectService
from backend.services.image_service import ImageService
from backend.services.export_service import ExportService

router = APIRouter(prefix="/api/projects", tags=["projects"])


# =============================================================================
# Project CRUD
# =============================================================================


@router.get("", response_model=list[ProjectListResponse])
async def list_projects():
    """List all projects with image and annotation counts."""
    service = ProjectService()
    return service.list_projects()


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(project: ProjectCreate):
    """Create a new project."""
    service = ProjectService()
    return service.create_project(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int):
    """Get project details by ID."""
    service = ProjectService()
    project = service.get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: int, update: ProjectUpdate):
    """Update a project."""
    service = ProjectService()
    project = service.update_project(project_id, update)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: int):
    """Delete a project and all associated data."""
    service = ProjectService()
    deleted = service.delete_project(project_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")

    return None


# =============================================================================
# Label Schema Management
# =============================================================================


@router.get("/{project_id}/labels", response_model=list[LabelSchemaResponse])
async def get_label_schema(project_id: int):
    """Get all labels for a project."""
    project_service = ProjectService()

    # Verify project exists
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    return project_service.get_label_schema(project_id)


@router.post(
    "/{project_id}/labels", response_model=LabelSchemaResponse, status_code=201
)
async def add_label(project_id: int, label: LabelSchemaCreate):
    """Add a label to a project's schema."""
    service = ProjectService()
    result = service.add_label(project_id, label)

    if not result:
        raise HTTPException(status_code=404, detail="Project not found")

    return result


@router.put("/{project_id}/labels/{label_id}", response_model=LabelSchemaResponse)
async def update_label(project_id: int, label_id: int, update: LabelSchemaUpdate):
    """Update a label in a project's schema."""
    service = ProjectService()

    # Verify project exists
    if not service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    result = service.update_label(label_id, update)

    if not result:
        raise HTTPException(status_code=404, detail="Label not found")

    return result


@router.delete("/{project_id}/labels/{label_id}", status_code=204)
async def delete_label(project_id: int, label_id: int):
    """Delete a label from a project's schema."""
    service = ProjectService()

    # Verify project exists
    if not service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    deleted = service.delete_label(label_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Label not found")

    return None


# =============================================================================
# Project Images
# =============================================================================


@router.post("/{project_id}/scan", response_model=ScanResult)
async def scan_project_images(project_id: int):
    """Scan project's image directory for new images."""
    project_service = ProjectService()

    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    image_service = ImageService()
    return image_service.scan_images(project_id)


@router.get("/{project_id}/images", response_model=list[ImageListResponse])
async def list_project_images(project_id: int):
    """List all images in a project with annotation counts."""
    project_service = ProjectService()

    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    image_service = ImageService()
    return image_service.list_images(project_id)


@router.get("/{project_id}/images/{image_id}", response_model=ImageResponse)
async def get_project_image(project_id: int, image_id: int):
    """Get image details by ID."""
    image_service = ImageService()

    if not image_service.validate_image_in_project(project_id, image_id):
        raise HTTPException(
            status_code=404, detail="Image not found in this project"
        )

    image = image_service.get_image(image_id)
    return image


@router.get("/{project_id}/images/{image_id}/file")
async def get_project_image_file(project_id: int, image_id: int):
    """Serve the full resolution image file."""
    image_service = ImageService()

    if not image_service.validate_image_in_project(project_id, image_id):
        raise HTTPException(
            status_code=404, detail="Image not found in this project"
        )

    file_path = image_service.get_image_file_path(image_id)

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")

    return FileResponse(
        file_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/{project_id}/images/{image_id}/thumbnail")
async def get_project_image_thumbnail(project_id: int, image_id: int):
    """Serve the thumbnail image."""
    image_service = ImageService()

    if not image_service.validate_image_in_project(project_id, image_id):
        raise HTTPException(
            status_code=404, detail="Image not found in this project"
        )

    thumbnail_path = image_service.get_thumbnail_path(image_id)

    if not thumbnail_path or not thumbnail_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    return FileResponse(
        thumbnail_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


# =============================================================================
# Project Exports
# =============================================================================


@router.get("/{project_id}/export/coco")
async def export_project_coco(project_id: int):
    """Export all project annotations in COCO format."""
    project_service = ProjectService()

    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    export_service = ExportService()
    try:
        coco_data = export_service.export_coco(project_id)
        return JSONResponse(content=coco_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/export/coco/{image_id}")
async def export_project_image_coco(project_id: int, image_id: int):
    """Export annotations for a specific image in COCO format."""
    export_service = ExportService()
    try:
        coco_data = export_service.export_coco(project_id, image_id=image_id)
        return JSONResponse(content=coco_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/export/yolo")
async def export_project_yolo(project_id: int):
    """Export all project annotations in YOLO format."""
    project_service = ProjectService()

    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    export_service = ExportService()
    try:
        yolo_data = export_service.export_yolo(project_id)
        return JSONResponse(content=yolo_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/export/yolo/{image_id}")
async def export_project_image_yolo(project_id: int, image_id: int):
    """Export annotations for a specific image in YOLO format."""
    export_service = ExportService()
    try:
        yolo_data = export_service.export_yolo(project_id, image_id=image_id)
        return JSONResponse(content=yolo_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
