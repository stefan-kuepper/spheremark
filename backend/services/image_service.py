from pathlib import Path
from typing import Optional

from PIL import Image

from backend.config import get_config
from backend.database import get_db
from backend.models import ImageListResponse, ImageResponse, ScanResult

# Disable decompression bomb warning for large panoramic images
Image.MAX_IMAGE_PIXELS = None


class ImageService:
    """Service for managing panoramic images."""

    def __init__(self):
        self.db = get_db()
        self.config = get_config()

    def scan_images(self, project_id: int) -> ScanResult:
        """Scan project's image directory for new images and add to database."""
        result = ScanResult(scanned=0, added=0, skipped=0, errors=[])

        # Get project's images_path
        project = self.db.fetchone(
            "SELECT images_path FROM projects WHERE id = ?", (project_id,)
        )

        if not project:
            result.errors.append(f"Project {project_id} not found")
            return result

        remote_path = Path(project["images_path"])
        if not remote_path.exists():
            result.errors.append(f"Remote path does not exist: {remote_path}")
            return result

        allowed_exts = tuple(self.config.images.allowed_extensions)

        for image_path in remote_path.iterdir():
            if not image_path.is_file():
                continue

            if image_path.suffix.lower() not in allowed_exts:
                continue

            result.scanned += 1

            try:
                # Check if already in database for this project
                existing = self.db.fetchone(
                    "SELECT id FROM images WHERE project_id = ? AND filename = ?",
                    (project_id, image_path.name),
                )

                if existing:
                    result.skipped += 1
                    continue

                # Open image to get dimensions
                with Image.open(image_path) as img:
                    width, height = img.size

                # Generate thumbnail
                thumbnail_path = self._generate_thumbnail(image_path, project_id)

                # Add to database
                self.db.execute(
                    """
                    INSERT INTO images (project_id, filename, filepath, width, height, thumbnail_path)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        project_id,
                        image_path.name,
                        str(image_path),
                        width,
                        height,
                        thumbnail_path,
                    ),
                )

                result.added += 1

            except Exception as e:
                result.errors.append(f"{image_path.name}: {str(e)}")

        return result

    def _generate_thumbnail(self, image_path: Path, project_id: int) -> str:
        """Generate thumbnail for an image."""
        # Use project-specific thumbnail directory
        thumbnails_dir = Path(f"data/thumbnails/project_{project_id}")
        thumbnails_dir.mkdir(parents=True, exist_ok=True)

        thumbnail_filename = f"thumb_{image_path.stem}.jpg"
        thumbnail_path = thumbnails_dir / thumbnail_filename

        with Image.open(image_path) as img:
            # Calculate thumbnail size maintaining aspect ratio
            max_width = self.config.thumbnails.max_width
            aspect_ratio = img.height / img.width
            thumbnail_size = (max_width, int(max_width * aspect_ratio))

            # Create thumbnail
            img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
            img.convert("RGB").save(
                thumbnail_path, "JPEG", quality=self.config.thumbnails.quality
            )

        return str(thumbnail_path)

    def list_images(self, project_id: int) -> list[ImageListResponse]:
        """List all images in a project with annotation counts."""
        rows = self.db.fetchall(
            """
            SELECT
                i.id,
                i.project_id,
                i.filename,
                i.width,
                i.height,
                i.thumbnail_path,
                COUNT(a.id) as annotation_count
            FROM images i
            LEFT JOIN annotations a ON i.id = a.image_id
            WHERE i.project_id = ?
            GROUP BY i.id
            ORDER BY i.created_at DESC
            """,
            (project_id,),
        )

        return [
            ImageListResponse(
                id=row["id"],
                project_id=row["project_id"],
                filename=row["filename"],
                width=row["width"],
                height=row["height"],
                thumbnail_path=row["thumbnail_path"],
                annotation_count=row["annotation_count"],
            )
            for row in rows
        ]

    def get_image(self, image_id: int) -> Optional[ImageResponse]:
        """Get image by ID."""
        row = self.db.fetchone("SELECT * FROM images WHERE id = ?", (image_id,))

        if not row:
            return None

        return ImageResponse(
            id=row["id"],
            project_id=row["project_id"],
            filename=row["filename"],
            filepath=row["filepath"],
            width=row["width"],
            height=row["height"],
            thumbnail_path=row["thumbnail_path"],
            created_at=row["created_at"],
        )

    def validate_image_in_project(self, project_id: int, image_id: int) -> bool:
        """Validate that an image belongs to a project."""
        row = self.db.fetchone(
            "SELECT id FROM images WHERE id = ? AND project_id = ?",
            (image_id, project_id),
        )
        return row is not None

    def get_image_file_path(self, image_id: int) -> Optional[Path]:
        """Get file path for an image."""
        row = self.db.fetchone("SELECT filepath FROM images WHERE id = ?", (image_id,))

        if not row:
            return None

        return Path(row["filepath"])

    def get_thumbnail_path(self, image_id: int) -> Optional[Path]:
        """Get thumbnail path for an image."""
        row = self.db.fetchone(
            "SELECT thumbnail_path FROM images WHERE id = ?", (image_id,)
        )

        if not row or not row["thumbnail_path"]:
            return None

        return Path(row["thumbnail_path"])
