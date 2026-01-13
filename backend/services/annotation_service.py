from typing import Optional, List
from datetime import datetime

from backend.database import get_db
from backend.models import AnnotationCreate, AnnotationUpdate, AnnotationResponse


class AnnotationService:
    """Service for managing annotations."""

    def __init__(self):
        self.db = get_db()

    def create_annotation(self, annotation: AnnotationCreate) -> AnnotationResponse:
        """Create a new annotation."""
        cursor = self.db.execute(
            """
            INSERT INTO annotations (
                image_id, label, uv_min_u, uv_min_v, uv_max_u, uv_max_v, color
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                annotation.image_id,
                annotation.label,
                annotation.uv_min_u,
                annotation.uv_min_v,
                annotation.uv_max_u,
                annotation.uv_max_v,
                annotation.color,
            ),
        )

        annotation_id = cursor.lastrowid
        return self.get_annotation(annotation_id)

    def get_annotation(self, annotation_id: int) -> Optional[AnnotationResponse]:
        """Get annotation by ID."""
        row = self.db.fetchone(
            "SELECT * FROM annotations WHERE id = ?", (annotation_id,)
        )

        if not row:
            return None

        return AnnotationResponse(
            id=row["id"],
            image_id=row["image_id"],
            label=row["label"],
            uv_min_u=row["uv_min_u"],
            uv_min_v=row["uv_min_v"],
            uv_max_u=row["uv_max_u"],
            uv_max_v=row["uv_max_v"],
            color=row["color"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def get_annotations_for_image(self, image_id: int) -> List[AnnotationResponse]:
        """Get all annotations for a specific image."""
        rows = self.db.fetchall(
            "SELECT * FROM annotations WHERE image_id = ? ORDER BY created_at",
            (image_id,),
        )

        return [
            AnnotationResponse(
                id=row["id"],
                image_id=row["image_id"],
                label=row["label"],
                uv_min_u=row["uv_min_u"],
                uv_min_v=row["uv_min_v"],
                uv_max_u=row["uv_max_u"],
                uv_max_v=row["uv_max_v"],
                color=row["color"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
            for row in rows
        ]

    def get_all_annotations(self) -> List[AnnotationResponse]:
        """Get all annotations across all images."""
        rows = self.db.fetchall(
            "SELECT * FROM annotations ORDER BY image_id, created_at"
        )

        return [
            AnnotationResponse(
                id=row["id"],
                image_id=row["image_id"],
                label=row["label"],
                uv_min_u=row["uv_min_u"],
                uv_min_v=row["uv_min_v"],
                uv_max_u=row["uv_max_u"],
                uv_max_v=row["uv_max_v"],
                color=row["color"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
            for row in rows
        ]

    def update_annotation(
        self, annotation_id: int, update: AnnotationUpdate
    ) -> Optional[AnnotationResponse]:
        """Update an existing annotation."""
        # Get current annotation
        current = self.get_annotation(annotation_id)
        if not current:
            return None

        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []

        if update.label is not None:
            update_fields.append("label = ?")
            update_values.append(update.label)

        if update.uv_min_u is not None:
            update_fields.append("uv_min_u = ?")
            update_values.append(update.uv_min_u)

        if update.uv_min_v is not None:
            update_fields.append("uv_min_v = ?")
            update_values.append(update.uv_min_v)

        if update.uv_max_u is not None:
            update_fields.append("uv_max_u = ?")
            update_values.append(update.uv_max_u)

        if update.uv_max_v is not None:
            update_fields.append("uv_max_v = ?")
            update_values.append(update.uv_max_v)

        if update.color is not None:
            update_fields.append("color = ?")
            update_values.append(update.color)

        if not update_fields:
            return current

        # Always update the updated_at timestamp
        update_fields.append("updated_at = CURRENT_TIMESTAMP")

        query = f"UPDATE annotations SET {', '.join(update_fields)} WHERE id = ?"
        update_values.append(annotation_id)

        self.db.execute(query, tuple(update_values))

        return self.get_annotation(annotation_id)

    def delete_annotation(self, annotation_id: int) -> bool:
        """Delete an annotation."""
        cursor = self.db.execute(
            "DELETE FROM annotations WHERE id = ?", (annotation_id,)
        )

        return cursor.rowcount > 0

    def delete_annotations_for_image(self, image_id: int) -> int:
        """Delete all annotations for a specific image. Returns count of deleted annotations."""
        cursor = self.db.execute(
            "DELETE FROM annotations WHERE image_id = ?", (image_id,)
        )

        return cursor.rowcount
