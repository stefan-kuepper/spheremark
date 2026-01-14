"""Service for managing projects and label schemas."""

from datetime import datetime
from typing import Optional

from backend.database import get_db
from backend.models import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    LabelSchemaCreate,
    LabelSchemaUpdate,
    LabelSchemaResponse,
)


class ProjectService:
    """Service for managing projects."""

    def __init__(self):
        self.db = get_db()

    def create_project(self, project: ProjectCreate) -> ProjectResponse:
        """Create a new project."""
        cursor = self.db.execute(
            """
            INSERT INTO projects (name, description, images_path)
            VALUES (?, ?, ?)
            """,
            (project.name, project.description, project.images_path),
        )
        project_id = cursor.lastrowid

        return self.get_project(project_id)

    def get_project(self, project_id: int) -> Optional[ProjectResponse]:
        """Get a project by ID."""
        row = self.db.fetchone(
            "SELECT * FROM projects WHERE id = ?",
            (project_id,),
        )

        if not row:
            return None

        return ProjectResponse(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            images_path=row["images_path"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def list_projects(self) -> list[ProjectListResponse]:
        """List all projects with image and annotation counts."""
        rows = self.db.fetchall("""
            SELECT
                p.id,
                p.name,
                p.description,
                p.images_path,
                p.created_at,
                COUNT(DISTINCT i.id) as image_count,
                COUNT(a.id) as annotation_count
            FROM projects p
            LEFT JOIN images i ON p.id = i.project_id
            LEFT JOIN annotations a ON i.id = a.image_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)

        return [
            ProjectListResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                images_path=row["images_path"],
                image_count=row["image_count"],
                annotation_count=row["annotation_count"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    def update_project(
        self, project_id: int, update: ProjectUpdate
    ) -> Optional[ProjectResponse]:
        """Update a project."""
        # Check if project exists
        existing = self.get_project(project_id)
        if not existing:
            return None

        # Build update query dynamically based on provided fields
        updates = []
        params = []

        if update.name is not None:
            updates.append("name = ?")
            params.append(update.name)

        if update.description is not None:
            updates.append("description = ?")
            params.append(update.description)

        if update.images_path is not None:
            updates.append("images_path = ?")
            params.append(update.images_path)

        if not updates:
            return existing

        # Always update the updated_at timestamp
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(project_id)

        self.db.execute(
            f"UPDATE projects SET {', '.join(updates)} WHERE id = ?",
            tuple(params),
        )

        return self.get_project(project_id)

    def delete_project(self, project_id: int) -> bool:
        """Delete a project and all associated data."""
        # Check if project exists
        existing = self.get_project(project_id)
        if not existing:
            return False

        # Delete project (cascades to images and annotations)
        self.db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        return True

    # =========================================================================
    # Label Schema Management
    # =========================================================================

    def get_label_schema(self, project_id: int) -> list[LabelSchemaResponse]:
        """Get all labels for a project."""
        rows = self.db.fetchall(
            """
            SELECT * FROM label_schemas
            WHERE project_id = ?
            ORDER BY sort_order, label_name
            """,
            (project_id,),
        )

        return [
            LabelSchemaResponse(
                id=row["id"],
                project_id=row["project_id"],
                label_name=row["label_name"],
                color=row["color"],
                sort_order=row["sort_order"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    def add_label(
        self, project_id: int, label: LabelSchemaCreate
    ) -> Optional[LabelSchemaResponse]:
        """Add a label to a project's schema."""
        # Check if project exists
        project = self.get_project(project_id)
        if not project:
            return None

        cursor = self.db.execute(
            """
            INSERT INTO label_schemas (project_id, label_name, color, sort_order)
            VALUES (?, ?, ?, ?)
            """,
            (project_id, label.label_name, label.color, label.sort_order),
        )
        label_id = cursor.lastrowid

        return self.get_label(label_id)

    def get_label(self, label_id: int) -> Optional[LabelSchemaResponse]:
        """Get a label by ID."""
        row = self.db.fetchone(
            "SELECT * FROM label_schemas WHERE id = ?",
            (label_id,),
        )

        if not row:
            return None

        return LabelSchemaResponse(
            id=row["id"],
            project_id=row["project_id"],
            label_name=row["label_name"],
            color=row["color"],
            sort_order=row["sort_order"],
            created_at=row["created_at"],
        )

    def update_label(
        self, label_id: int, update: LabelSchemaUpdate
    ) -> Optional[LabelSchemaResponse]:
        """Update a label."""
        existing = self.get_label(label_id)
        if not existing:
            return None

        updates = []
        params = []

        if update.label_name is not None:
            updates.append("label_name = ?")
            params.append(update.label_name)

        if update.color is not None:
            updates.append("color = ?")
            params.append(update.color)

        if update.sort_order is not None:
            updates.append("sort_order = ?")
            params.append(update.sort_order)

        if not updates:
            return existing

        params.append(label_id)

        self.db.execute(
            f"UPDATE label_schemas SET {', '.join(updates)} WHERE id = ?",
            tuple(params),
        )

        return self.get_label(label_id)

    def delete_label(self, label_id: int) -> bool:
        """Delete a label from a project's schema."""
        existing = self.get_label(label_id)
        if not existing:
            return False

        self.db.execute("DELETE FROM label_schemas WHERE id = ?", (label_id,))
        return True
