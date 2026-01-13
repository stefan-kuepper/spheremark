import importlib
import sqlite3
from pathlib import Path
from typing import List, Optional


class MigrationManager:
    """Simple migration manager for SQLite database."""

    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.migrations_dir = Path(__file__).parent / "versions"

    def ensure_migrations_table(self, conn: sqlite3.Connection) -> None:
        """Create migrations table if it doesn't exist."""
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY,
                version TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

    def get_applied_migrations(self, conn: sqlite3.Connection) -> List[str]:
        """Get list of applied migration versions."""
        cursor = conn.cursor()
        cursor.execute("SELECT version FROM migrations ORDER BY id")
        return [row[0] for row in cursor.fetchall()]

    def mark_migration_applied(self, conn: sqlite3.Connection, version: str) -> None:
        """Record that a migration has been applied."""
        cursor = conn.cursor()
        cursor.execute("INSERT INTO migrations (version) VALUES (?)", (version,))
        conn.commit()

    def get_available_migrations(self) -> List[str]:
        """Get list of available migration files in order."""
        migration_files = []
        for file_path in self.migrations_dir.glob("*.py"):
            if file_path.name != "__init__.py":
                migration_files.append(file_path.stem)

        # Sort by numeric prefix
        migration_files.sort(key=lambda x: int(x.split("_")[0]))
        return migration_files

    def load_migration_module(self, version: str):
        """Load migration module by version name."""
        module_name = f"backend.migrations.versions.{version}"
        return importlib.import_module(module_name)

    def apply_migrations(self) -> List[str]:
        """Apply all pending migrations."""
        applied = []

        with sqlite3.connect(str(self.db_path)) as conn:
            conn.row_factory = sqlite3.Row
            self.ensure_migrations_table(conn)
            applied_migrations = self.get_applied_migrations(conn)

            for version in self.get_available_migrations():
                if version not in applied_migrations:
                    print(f"Applying migration: {version}")

                    module = self.load_migration_module(version)

                    # Find and call upgrade function
                    if hasattr(module, "upgrade"):
                        module.upgrade(conn)
                        self.mark_migration_applied(conn, version)
                        applied.append(version)
                    else:
                        raise ValueError(f"Migration {version} has no upgrade function")

            if not applied:
                print("Database is up to date")

        return applied

    def get_current_version(self) -> Optional[str]:
        """Get the latest applied migration version."""
        with sqlite3.connect(str(self.db_path)) as conn:
            conn.row_factory = sqlite3.Row
            self.ensure_migrations_table(conn)
            applied = self.get_applied_migrations(conn)
            return applied[-1] if applied else None

    def get_pending_migrations(self) -> List[str]:
        """Get list of migrations that haven't been applied."""
        with sqlite3.connect(str(self.db_path)) as conn:
            conn.row_factory = sqlite3.Row
            self.ensure_migrations_table(conn)
            applied = self.get_applied_migrations(conn)
            available = self.get_available_migrations()
            return [m for m in available if m not in applied]
