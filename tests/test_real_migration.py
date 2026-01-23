"""Test the actual migration files work correctly."""

import sqlite3
import tempfile

from backend.migrations.migration_manager import MigrationManager


def test_real_migration_creates_correct_schema():
    """Test that the real initial migration creates the correct schema."""
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        manager = MigrationManager(tmp.name)

        # Apply migrations
        applied = manager.apply_migrations()

        # Should have applied the initial schema
        assert "001_initial_schema" in applied

        # Verify schema is correct
        with sqlite3.connect(tmp.name) as conn:
            cursor = conn.cursor()

            # Check images table schema
            cursor.execute("PRAGMA table_info(images)")
            image_columns = {row[1]: row[2] for row in cursor.fetchall()}

            expected_image_columns = {
                "id": "INTEGER",
                "filename": "TEXT",
                "filepath": "TEXT",
                "width": "INTEGER",
                "height": "INTEGER",
                "thumbnail_path": "TEXT",
                "created_at": "TIMESTAMP",
            }

            for col_name, col_type in expected_image_columns.items():
                assert col_name in image_columns
                # SQLite types can have modifiers, so check if type contains expected
                assert image_columns[col_name].startswith(col_type)

            # Check annotations table schema
            cursor.execute("PRAGMA table_info(annotations)")
            annotation_columns = {row[1]: row[2] for row in cursor.fetchall()}

            expected_annotation_columns = {
                "id": "INTEGER",
                "image_id": "INTEGER",
                "label": "TEXT",
                "az_min": "REAL",
                "alt_min": "REAL",
                "az_max": "REAL",
                "alt_max": "REAL",
                "color": "TEXT",
                "created_at": "TIMESTAMP",
                "updated_at": "TIMESTAMP",
            }

            for col_name, col_type in expected_annotation_columns.items():
                assert col_name in annotation_columns
                assert annotation_columns[col_name].startswith(col_type)

            # Check foreign key constraint
            cursor.execute("PRAGMA foreign_key_list(annotations)")
            foreign_keys = cursor.fetchall()
            assert len(foreign_keys) > 0

            # Check index exists
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_annotations_image_id'"
            )
            assert cursor.fetchone() is not None

            # Check migrations table was created
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
            )
            assert cursor.fetchone() is not None


def test_migration_can_insert_and_query_data():
    """Test that we can insert and query data after migration."""
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        manager = MigrationManager(tmp.name)
        manager.apply_migrations()

        with sqlite3.connect(tmp.name) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # First create a project (required for images)
            cursor.execute(
                """
                INSERT INTO projects (name, description, images_path)
                VALUES (?, ?, ?)
            """,
                ("Test Project", "Test description", "/path/to/images"),
            )
            project_id = cursor.lastrowid

            # Insert test image (now requires project_id)
            cursor.execute(
                """
                INSERT INTO images (project_id, filename, filepath, width, height, thumbnail_path)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
                (project_id, "test.jpg", "/path/test.jpg", 800, 600, "/thumb/test.jpg"),
            )
            image_id = cursor.lastrowid

            # Insert test annotation (using geographic coordinates)
            cursor.execute(
                """
                INSERT INTO annotations (image_id, label, az_min, alt_min, az_max, alt_max, color)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (image_id, "test_label", 36.0, 18.0, 108.0, 54.0, "#FF0000"),
            )
            annotation_id = cursor.lastrowid

            conn.commit()

            # Query data back
            cursor.execute("SELECT * FROM images WHERE id = ?", (image_id,))
            image_row = cursor.fetchone()
            assert image_row is not None
            assert image_row["filename"] == "test.jpg"
            assert image_row["width"] == 800
            assert image_row["height"] == 600
            assert image_row["project_id"] == project_id

            cursor.execute("SELECT * FROM annotations WHERE id = ?", (annotation_id,))
            annotation_row = cursor.fetchone()
            assert annotation_row is not None
            assert annotation_row["image_id"] == image_id
            assert annotation_row["label"] == "test_label"
            assert annotation_row["az_min"] == 36.0
            assert annotation_row["alt_min"] == 18.0
            assert annotation_row["az_max"] == 108.0
            assert annotation_row["alt_max"] == 54.0
            assert annotation_row["color"] == "#FF0000"

            # Enable foreign keys (SQLite requires this)
            cursor.execute("PRAGMA foreign_keys = ON")

            # Test foreign key constraint by trying to delete image
            cursor.execute("DELETE FROM images WHERE id = ?", (image_id,))
            conn.commit()

            # Annotation should also be deleted (CASCADE)
            cursor.execute("SELECT * FROM annotations WHERE id = ?", (annotation_id,))
            assert cursor.fetchone() is None


def test_migration_manager_methods_with_real_migrations():
    """Test migration manager methods with real migration files."""
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        manager = MigrationManager(tmp.name)

        # Get available migrations
        available = manager.get_available_migrations()
        assert len(available) > 0
        assert "001_initial_schema" in available

        # Get pending migrations (should be all available since none applied)
        pending = manager.get_pending_migrations()
        assert pending == available

        # Apply migrations
        applied = manager.apply_migrations()
        assert applied == available

        # Get current version
        current_version = manager.get_current_version()
        assert current_version == available[-1]  # Last applied migration

        # Get pending migrations again (should be empty)
        pending_after = manager.get_pending_migrations()
        assert pending_after == []

        # Get applied migrations
        with sqlite3.connect(tmp.name) as conn:
            applied_migrations = manager.get_applied_migrations(conn)
            assert applied_migrations == available


if __name__ == "__main__":
    test_real_migration_creates_correct_schema()
    print("✓ test_real_migration_creates_correct_schema passed")

    test_migration_can_insert_and_query_data()
    print("✓ test_migration_can_insert_and_query_data passed")

    test_migration_manager_methods_with_real_migrations()
    print("✓ test_migration_manager_methods_with_real_migrations passed")

    print("\nAll real migration tests passed!")
