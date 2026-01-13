"""Helper functions for migration testing."""

import sqlite3
import tempfile
from pathlib import Path
from typing import List, Dict, Any


def create_test_database() -> str:
    """Create a temporary test database file."""
    temp_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    temp_file.close()
    return temp_file.name


def cleanup_test_database(db_path: str) -> None:
    """Clean up test database file."""
    path = Path(db_path)
    if path.exists():
        path.unlink()


def get_table_schema(conn: sqlite3.Connection, table_name: str) -> List[Dict[str, Any]]:
    """Get schema information for a table."""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = []
    for row in cursor.fetchall():
        columns.append(
            {
                "cid": row[0],
                "name": row[1],
                "type": row[2],
                "notnull": row[3],
                "default": row[4],
                "pk": row[5],
            }
        )
    return columns


def get_table_names(conn: sqlite3.Connection) -> List[str]:
    """Get list of all table names in database."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    return [row[0] for row in cursor.fetchall()]


def get_index_names(conn: sqlite3.Connection) -> List[str]:
    """Get list of all index names in database."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
    return [row[0] for row in cursor.fetchall()]


def table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    """Check if a table exists."""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,)
    )
    return cursor.fetchone() is not None


def index_exists(conn: sqlite3.Connection, index_name: str) -> bool:
    """Check if an index exists."""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='index' AND name=?", (index_name,)
    )
    return cursor.fetchone() is not None


def count_rows(conn: sqlite3.Connection, table_name: str) -> int:
    """Count rows in a table."""
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    return cursor.fetchone()[0]


def execute_sql(conn: sqlite3.Connection, sql: str, params: tuple = ()) -> None:
    """Execute SQL statement."""
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()


class TestMigration:
    """Base class for test migrations."""

    @staticmethod
    def upgrade(conn: sqlite3.Connection) -> None:
        """Apply migration upgrade."""
        raise NotImplementedError("Subclasses must implement upgrade method")

    @staticmethod
    def downgrade(conn: sqlite3.Connection) -> None:
        """Apply migration downgrade."""
        raise NotImplementedError("Subclasses must implement downgrade method")


class AddColumnMigration(TestMigration):
    """Test migration that adds a column."""

    @staticmethod
    def upgrade(conn: sqlite3.Connection) -> None:
        cursor = conn.cursor()
        cursor.execute("""
            ALTER TABLE images ADD COLUMN test_column TEXT DEFAULT 'test'
        """)
        conn.commit()

    @staticmethod
    def downgrade(conn: sqlite3.Connection) -> None:
        # SQLite doesn't support DROP COLUMN directly, so we create a new table
        cursor = conn.cursor()

        # Create new table without the column
        cursor.execute("""
            CREATE TABLE images_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL UNIQUE,
                filepath TEXT NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                thumbnail_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Copy data (excluding the dropped column)
        cursor.execute("""
            INSERT INTO images_new (id, filename, filepath, width, height, thumbnail_path, created_at)
            SELECT id, filename, filepath, width, height, thumbnail_path, created_at
            FROM images
        """)

        # Drop old table and rename new one
        cursor.execute("DROP TABLE images")
        cursor.execute("ALTER TABLE images_new RENAME TO images")

        conn.commit()


class CreateTableMigration(TestMigration):
    """Test migration that creates a new table."""

    @staticmethod
    def upgrade(conn: sqlite3.Connection) -> None:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE test_table (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                value INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create an index
        cursor.execute("""
            CREATE INDEX idx_test_table_name ON test_table(name)
        """)

        conn.commit()

    @staticmethod
    def downgrade(conn: sqlite3.Connection) -> None:
        cursor = conn.cursor()
        cursor.execute("DROP INDEX IF EXISTS idx_test_table_name")
        cursor.execute("DROP TABLE IF EXISTS test_table")
        conn.commit()
