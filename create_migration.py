#!/usr/bin/env python3
"""Helper script to create new migration files."""

import sys
from pathlib import Path


def create_migration(description: str) -> None:
    """Create a new migration file with the given description."""
    migrations_dir = Path("backend/migrations/versions")

    # Get existing migration numbers
    migration_files = []
    for file_path in migrations_dir.glob("*.py"):
        if file_path.name != "__init__.py":
            migration_files.append(file_path.stem)

    # Find next migration number
    if migration_files:
        migration_numbers = [int(f.split("_")[0]) for f in migration_files]
        next_number = max(migration_numbers) + 1
    else:
        next_number = 1

    # Create migration filename
    safe_description = description.lower().replace(" ", "_").replace("-", "_")
    filename = f"{next_number:03d}_{safe_description}.py"
    filepath = migrations_dir / filename

    # Create migration template
    template = f'''"""Migration: {description}."""

import sqlite3


def upgrade(conn: sqlite3.Connection) -> None:
    """Apply migration."""
    cursor = conn.cursor()
    
    # TODO: Implement migration logic
    # Example: cursor.execute("ALTER TABLE images ADD COLUMN new_column TEXT")
    
    conn.commit()
'''

    filepath.write_text(template)
    print(f"Created migration: {filename}")
    print(f"Location: {filepath}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print('Usage: python create_migration.py "Migration description"')
        sys.exit(1)

    create_migration(sys.argv[1])
