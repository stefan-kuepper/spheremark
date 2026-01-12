"""Initial database schema."""

import sqlite3


def upgrade(conn: sqlite3.Connection) -> None:
    """Apply initial schema migration."""
    cursor = conn.cursor()

    # Images table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL UNIQUE,
            filepath TEXT NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            thumbnail_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Annotations table (stored as UV coordinates)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS annotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER NOT NULL,
            label TEXT,
            uv_min_u REAL NOT NULL,
            uv_min_v REAL NOT NULL,
            uv_max_u REAL NOT NULL,
            uv_max_v REAL NOT NULL,
            color TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
        )
    """)

    # Create index for faster lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_annotations_image_id
        ON annotations(image_id)
    """)

    conn.commit()
