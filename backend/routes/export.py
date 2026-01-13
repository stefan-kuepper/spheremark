from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response

from backend.services.export_service import ExportService

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/coco")
async def export_all_coco():
    """Export all annotations in COCO format with spherical coordinates."""
    service = ExportService()
    try:
        coco_data = service.export_coco()
        return JSONResponse(content=coco_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/coco/{image_id}")
async def export_image_coco(image_id: int):
    """Export annotations for a specific image in COCO format."""
    service = ExportService()
    try:
        coco_data = service.export_coco(image_id=image_id)
        return JSONResponse(content=coco_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/yolo")
async def export_all_yolo():
    """
    Export all annotations in YOLO format with spherical coordinates.

    Returns a JSON with:
    - files: Dictionary mapping image filenames to annotation text
    - classes: List of class names in order
    """
    service = ExportService()
    try:
        yolo_data = service.export_yolo()
        return JSONResponse(content=yolo_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/yolo/{image_id}")
async def export_image_yolo(image_id: int):
    """Export annotations for a specific image in YOLO format."""
    service = ExportService()
    try:
        yolo_data = service.export_yolo(image_id=image_id)
        return JSONResponse(content=yolo_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/yolo/{image_id}/txt")
async def export_image_yolo_txt(image_id: int):
    """Export annotations for a specific image as YOLO .txt file."""
    service = ExportService()
    try:
        yolo_data = service.export_yolo(image_id=image_id)

        # Get the first (and only) file content
        if not yolo_data["files"]:
            raise HTTPException(
                status_code=404, detail="No annotations found for this image"
            )

        filename = list(yolo_data["files"].keys())[0]
        content = yolo_data["files"][filename]

        # Return as plain text file
        return Response(
            content=content,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename={filename.rsplit('.', 1)[0]}.txt"
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/yolo/classes.txt")
async def export_yolo_classes():
    """Export YOLO class names as classes.txt file."""
    service = ExportService()
    try:
        yolo_data = service.export_yolo()
        content = "\n".join(yolo_data["classes"])

        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=classes.txt"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
