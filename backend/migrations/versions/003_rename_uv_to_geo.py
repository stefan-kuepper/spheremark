"""Rename UV coordinates to geographic (azimuth/altitude) coordinates."""

import sqlite3


def upgrade(conn: sqlite3.Connection) -> None:
    """Rename UV coordinate columns to geographic and convert data."""
    cursor = conn.cursor()

    # SQLite requires table recreation to rename columns
    # Create new annotations table with geographic coordinate columns
    cursor.execute("""
        CREATE TABLE annotations_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER NOT NULL,
            label TEXT,
            az_min REAL NOT NULL,
            alt_min REAL NOT NULL,
            az_max REAL NOT NULL,
            alt_max REAL NOT NULL,
            color TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
        )
    """)

    # Copy and convert data from old table
    # UV to Geographic conversion:
    # azimuth = u * 360
    # altitude = 90 - (v * 180)
    #
    # Note: uv_min_v (top) -> higher altitude (alt_max)
    #       uv_max_v (bottom) -> lower altitude (alt_min)
    cursor.execute("""
        INSERT INTO annotations_new (
            id, image_id, label,
            az_min, alt_min, az_max, alt_max,
            color, created_at, updated_at
        )
        SELECT
            id, image_id, label,
            uv_min_u * 360.0,
            90.0 - (uv_max_v * 180.0),
            uv_max_u * 360.0,
            90.0 - (uv_min_v * 180.0),
            color, created_at, updated_at
        FROM annotations
    """)

    # Drop old table and rename new one
    cursor.execute("DROP TABLE annotations")
    cursor.execute("ALTER TABLE annotations_new RENAME TO annotations")

    # Recreate index
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_annotations_image_id
        ON annotations(image_id)
    """)

    conn.commit()
