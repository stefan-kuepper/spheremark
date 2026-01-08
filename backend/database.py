import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Optional


class Database:
    """SQLite database manager for panoramic image annotations."""

    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initialize database with schema if not exists."""
        with self.get_connection() as conn:
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

    @contextmanager
    def get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def execute(self, query: str, params: tuple = ()):
        """Execute a single query and return cursor."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor

    def fetchone(self, query: str, params: tuple = ()):
        """Fetch a single row."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchone()

    def fetchall(self, query: str, params: tuple = ()):
        """Fetch all rows."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()


# Global database instance
_db: Optional[Database] = None


def init_database(db_path: str):
    """Initialize the global database instance."""
    global _db
    _db = Database(db_path)
    return _db


def get_db() -> Database:
    """Get the global database instance."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return _db
