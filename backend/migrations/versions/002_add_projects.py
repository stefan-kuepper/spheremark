"""Add multi-project support with label schemas."""

import sqlite3
import os


def upgrade(conn: sqlite3.Connection) -> None:
    """Apply migration to add projects and label schemas."""
    cursor = conn.cursor()

    # 1. Create projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            images_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)")

    # 2. Create label_schemas table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS label_schemas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            label_name TEXT NOT NULL,
            color TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            UNIQUE(project_id, label_name)
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_label_schemas_project_id
        ON label_schemas(project_id)
    """)

    # 3. Check if there are existing images to migrate
    cursor.execute("SELECT COUNT(*) FROM images")
    image_count = cursor.fetchone()[0]

    default_project_id = None
    if image_count > 0:
        # Get directory from first image's filepath
        cursor.execute("SELECT filepath FROM images LIMIT 1")
        row = cursor.fetchone()
        if row:
            default_path = os.path.dirname(row[0]) or "./data"
        else:
            default_path = "./data"

        # Create a default project for existing images
        cursor.execute(
            """
            INSERT INTO projects (name, description, images_path)
            VALUES (?, ?, ?)
        """,
            ("Imported Project", "Auto-created from existing data", default_path),
        )
        default_project_id = cursor.lastrowid

        # Extract unique labels from existing annotations for label schema
        cursor.execute("SELECT DISTINCT label FROM annotations WHERE label IS NOT NULL")
        labels = cursor.fetchall()
        for i, (label,) in enumerate(labels):
            cursor.execute(
                """
                INSERT INTO label_schemas (project_id, label_name, sort_order)
                VALUES (?, ?, ?)
            """,
                (default_project_id, label, i),
            )

    # 4. Recreate images table with project_id
    # SQLite requires table recreation to modify constraints
    cursor.execute("""
        CREATE TABLE images_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            thumbnail_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    """)

    # Copy data with default project_id
    if default_project_id:
        cursor.execute(f"""
            INSERT INTO images_new (
                id, project_id, filename, filepath, width, height,
                thumbnail_path, created_at
            )
            SELECT
                id, {default_project_id}, filename, filepath, width, height,
                thumbnail_path, created_at
            FROM images
        """)

    cursor.execute("DROP TABLE images")
    cursor.execute("ALTER TABLE images_new RENAME TO images")

    # 5. Create indexes for images
    cursor.execute("""
        CREATE UNIQUE INDEX idx_images_project_filename
        ON images(project_id, filename)
    """)
    cursor.execute("""
        CREATE INDEX idx_images_project_id
        ON images(project_id)
    """)

    conn.commit()
