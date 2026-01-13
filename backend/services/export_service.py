from typing import Optional, List, Dict, Any
from datetime import datetime
from collections import defaultdict

from backend.database import get_db
from backend.config import get_config
from backend.utils.coordinates import uv_bbox_to_spherical
from backend.services.annotation_service import AnnotationService
from backend.services.image_service import ImageService


class ExportService:
    """Service for exporting annotations in various formats."""

    def __init__(self):
        self.db = get_db()
        self.config = get_config()
        self.annotation_service = AnnotationService()
        self.image_service = ImageService()

    def export_coco(self, image_id: Optional[int] = None) -> dict:
        """
        Export annotations in COCO format with spherical coordinates.

        Args:
            image_id: Optional image ID to export only one image

        Returns:
            COCO format dictionary
        """
        precision = self.config.export.coordinate_precision

        # Get images
        if image_id:
            image = self.image_service.get_image(image_id)
            if not image:
                raise ValueError(f"Image {image_id} not found")
            images = [image]
        else:
            images = self.image_service.list_images()

        # Build COCO structure
        coco_output = {
            "info": {
                "description": "SphereMark - Panoramic Image Annotations",
                "version": "1.0",
                "year": datetime.now().year,
                "date_created": datetime.now().isoformat(),
                "coordinate_system": "spherical",
                "contributor": "SphereMark",
            },
            "images": [],
            "annotations": [],
            "categories": [],
        }

        # Collect all unique labels
        label_to_id = {}
        next_category_id = 1

        annotation_id_counter = 1

        for img in images:
            # Add image to COCO
            coco_output["images"].append(
                {
                    "id": img.id,
                    "file_name": img.filename,
                    "width": img.width,
                    "height": img.height,
                    "projection": "equirectangular",
                }
            )

            # Get annotations for this image
            annotations = self.annotation_service.get_annotations_for_image(img.id)

            for ann in annotations:
                # Register label as category
                label = ann.label or "unlabeled"
                if label not in label_to_id:
                    label_to_id[label] = next_category_id
                    next_category_id += 1

                # Convert UV to spherical
                spherical = uv_bbox_to_spherical(
                    ann.uv_min_u, ann.uv_min_v, ann.uv_max_u, ann.uv_max_v
                )

                # Round values to specified precision
                for key in spherical:
                    spherical[key] = round(spherical[key], precision)

                # Add annotation to COCO
                coco_output["annotations"].append(
                    {
                        "id": annotation_id_counter,
                        "image_id": img.id,
                        "category_id": label_to_id[label],
                        "bbox_spherical": spherical,
                        "bbox_uv": {
                            "u_min": round(ann.uv_min_u, precision),
                            "v_min": round(ann.uv_min_v, precision),
                            "u_max": round(ann.uv_max_u, precision),
                            "v_max": round(ann.uv_max_v, precision),
                        },
                        "color": ann.color,
                    }
                )

                annotation_id_counter += 1

        # Add categories
        for label, cat_id in sorted(label_to_id.items(), key=lambda x: x[1]):
            coco_output["categories"].append(
                {"id": cat_id, "name": label, "supercategory": "object"}
            )

        return coco_output

    def export_yolo(self, image_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Export annotations in YOLO format with spherical coordinates.

        YOLO format per image:
        <class_id> <phi_center> <theta_center> <phi_width> <theta_height>

        All values normalized to [0, 1] range.

        Args:
            image_id: Optional image ID to export only one image

        Returns:
            Dictionary with 'files' (image_name -> annotation lines) and 'classes' (class names)
        """
        precision = self.config.export.coordinate_precision

        # Get images
        if image_id:
            image = self.image_service.get_image(image_id)
            if not image:
                raise ValueError(f"Image {image_id} not found")
            images = [image]
        else:
            images = self.image_service.list_images()

        # Collect all unique labels
        label_to_id = {}
        next_class_id = 0

        yolo_output = {"files": {}, "classes": []}

        for img in images:
            lines = []

            # Get annotations for this image
            annotations = self.annotation_service.get_annotations_for_image(img.id)

            for ann in annotations:
                # Register label as class
                label = ann.label or "unlabeled"
                if label not in label_to_id:
                    label_to_id[label] = next_class_id
                    next_class_id += 1

                class_id = label_to_id[label]

                # Convert UV to spherical
                spherical = uv_bbox_to_spherical(
                    ann.uv_min_u, ann.uv_min_v, ann.uv_max_u, ann.uv_max_v
                )

                # Calculate center and dimensions in spherical space
                import math

                phi_center = (spherical["phi_min"] + spherical["phi_max"]) / 2
                theta_center = (spherical["theta_min"] + spherical["theta_max"]) / 2
                phi_width = spherical["phi_max"] - spherical["phi_min"]
                theta_height = spherical["theta_max"] - spherical["theta_min"]

                # Normalize to [0, 1] range for YOLO
                # phi: [-π, π] → [0, 1]
                phi_center_norm = (phi_center + math.pi) / (2 * math.pi)
                phi_width_norm = phi_width / (2 * math.pi)

                # theta: [0, π] → [0, 1]
                theta_center_norm = theta_center / math.pi
                theta_height_norm = theta_height / math.pi

                # Format YOLO line
                line = f"{class_id} {phi_center_norm:.{precision}f} {theta_center_norm:.{precision}f} {phi_width_norm:.{precision}f} {theta_height_norm:.{precision}f}"
                lines.append(line)

            # Store lines for this image
            yolo_output["files"][img.filename] = "\n".join(lines) if lines else ""

        # Add class names in order
        yolo_output["classes"] = [
            label for label, _ in sorted(label_to_id.items(), key=lambda x: x[1])
        ]

        return yolo_output
