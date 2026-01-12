import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Optional

from backend.migrations.migration_manager import MigrationManager


class Database:
    """SQLite database manager for panoramic image annotations."""

    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initialize database with migrations."""
        migration_manager = MigrationManager(str(self.db_path))
        applied = migration_manager.apply_migrations()

        if applied:
            print(f"Applied {len(applied)} migration(s): {', '.join(applied)}")
        else:
            print("Database schema is up to date")

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
