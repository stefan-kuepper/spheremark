import pytest
import sqlite3
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

from backend.migrations.migration_manager import MigrationManager
from tests.test_migration_helpers import (
    create_test_database,
    cleanup_test_database,
    get_table_schema,
    get_table_names,
    table_exists,
    index_exists,
    AddColumnMigration,
    CreateTableMigration,
)


class TestMigrationManager:
    """Test the MigrationManager class."""

    def test_initialization(self):
        """Test MigrationManager initialization."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)
            assert manager.db_path == Path(tmp.name)
            assert manager.migrations_dir.name == "versions"

    def test_ensure_migrations_table(self):
        """Test creation of migrations table."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with sqlite3.connect(tmp.name) as conn:
                # Table should not exist initially
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
                )
                assert cursor.fetchone() is None

                # Create table
                manager.ensure_migrations_table(conn)

                # Table should now exist
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
                )
                assert cursor.fetchone() is not None

                # Table should have correct schema
                cursor.execute("PRAGMA table_info(migrations)")
                columns = {row[1]: row[2] for row in cursor.fetchall()}
                assert "id" in columns
                assert "version" in columns
                assert "applied_at" in columns

    def test_get_applied_migrations_empty(self):
        """Test getting applied migrations from empty database."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with sqlite3.connect(tmp.name) as conn:
                manager.ensure_migrations_table(conn)
                applied = manager.get_applied_migrations(conn)
                assert applied == []

    def test_get_applied_migrations_with_data(self):
        """Test getting applied migrations with data."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with sqlite3.connect(tmp.name) as conn:
                manager.ensure_migrations_table(conn)

                # Insert test migrations
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO migrations (version) VALUES (?)", ("001_test",)
                )
                cursor.execute(
                    "INSERT INTO migrations (version) VALUES (?)", ("002_test",)
                )
                conn.commit()

                applied = manager.get_applied_migrations(conn)
                assert applied == ["001_test", "002_test"]

    def test_mark_migration_applied(self):
        """Test marking a migration as applied."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with sqlite3.connect(tmp.name) as conn:
                manager.ensure_migrations_table(conn)

                # Mark migration applied
                manager.mark_migration_applied(conn, "001_test")

                # Verify it was recorded
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT version FROM migrations WHERE version = ?", ("001_test",)
                )
                result = cursor.fetchone()
                assert result is not None
                assert result[0] == "001_test"

    def test_get_available_migrations(self):
        """Test getting available migration files."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            # Mock the migrations directory
            with patch.object(manager, "migrations_dir") as mock_dir:
                mock_dir.glob.return_value = [
                    Path("001_initial_schema.py"),
                    Path("002_add_column.py"),
                    Path("003_another_migration.py"),
                    Path("__init__.py"),  # Should be filtered out
                ]

                migrations = manager.get_available_migrations()
                assert migrations == [
                    "001_initial_schema",
                    "002_add_column",
                    "003_another_migration",
                ]

    def test_get_available_migrations_sorted(self):
        """Test that migrations are sorted by numeric prefix."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with patch.object(manager, "migrations_dir") as mock_dir:
                # Provide files in random order
                mock_dir.glob.return_value = [
                    Path("003_another_migration.py"),
                    Path("001_initial_schema.py"),
                    Path("002_add_column.py"),
                ]

                migrations = manager.get_available_migrations()
                # Should be sorted by numeric prefix
                assert migrations == [
                    "001_initial_schema",
                    "002_add_column",
                    "003_another_migration",
                ]

    def test_load_migration_module(self):
        """Test loading a migration module."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            # Mock importlib to avoid actual imports
            with patch(
                "backend.migrations.migration_manager.importlib"
            ) as mock_importlib:
                mock_module = MagicMock()
                mock_importlib.import_module.return_value = mock_module

                module = manager.load_migration_module("001_initial_schema")

                mock_importlib.import_module.assert_called_once_with(
                    "backend.migrations.versions.001_initial_schema"
                )
                assert module == mock_module

    def test_get_current_version_empty(self):
        """Test getting current version from empty database."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            version = manager.get_current_version()
            assert version is None

    def test_get_current_version_with_migrations(self):
        """Test getting current version with applied migrations."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with sqlite3.connect(tmp.name) as conn:
                manager.ensure_migrations_table(conn)

                # Insert test migrations
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO migrations (version) VALUES (?)", ("001_test",)
                )
                cursor.execute(
                    "INSERT INTO migrations (version) VALUES (?)", ("002_test",)
                )
                conn.commit()

            version = manager.get_current_version()
            assert version == "002_test"

    def test_get_pending_migrations(self):
        """Test getting pending migrations."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            # Mock available migrations
            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = ["001_test", "002_test", "003_test"]

                # Mock applied migrations
                with patch.object(manager, "get_applied_migrations") as mock_applied:
                    mock_applied.return_value = ["001_test"]

                    pending = manager.get_pending_migrations()
                    assert pending == ["002_test", "003_test"]

    def test_get_pending_migrations_all_applied(self):
        """Test getting pending migrations when all are applied."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = ["001_test", "002_test"]

                with patch.object(manager, "get_applied_migrations") as mock_applied:
                    mock_applied.return_value = ["001_test", "002_test"]

                    pending = manager.get_pending_migrations()
                    assert pending == []


class TestMigrationApplication:
    """Test migration application scenarios."""

    def test_apply_migrations_empty_db(self):
        """Test applying migrations to empty database."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            # Mock available migrations with a simple test migration
            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = ["001_test_migration"]

                # Mock the migration module
                with patch.object(manager, "load_migration_module") as mock_load:
                    mock_module = MagicMock()
                    mock_module.upgrade = MagicMock()
                    mock_load.return_value = mock_module

                    # Apply migrations
                    applied = manager.apply_migrations()

                    # Verify
                    assert applied == ["001_test_migration"]
                    mock_module.upgrade.assert_called_once()

                    # Check that migration was recorded
                    with sqlite3.connect(tmp.name) as conn:
                        cursor = conn.cursor()
                        cursor.execute("SELECT version FROM migrations")
                        versions = [row[0] for row in cursor.fetchall()]
                        assert versions == ["001_test_migration"]

    def test_apply_migrations_already_applied(self):
        """Test applying migrations when already up to date."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            # Mock available migrations
            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = ["001_test_migration"]

                # Mock applied migrations to return same list
                with patch.object(manager, "get_applied_migrations") as mock_applied:
                    mock_applied.return_value = ["001_test_migration"]

                    # Mock load_migration_module to ensure it's not called
                    with patch.object(manager, "load_migration_module") as mock_load:
                        applied = manager.apply_migrations()

                        # Verify
                        assert applied == []
                        mock_load.assert_not_called()

    def test_apply_migrations_multiple(self):
        """Test applying multiple migrations in order."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            # Mock available migrations
            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = ["001_first", "002_second", "003_third"]

                # Mock applied migrations (none initially)
                with patch.object(manager, "get_applied_migrations") as mock_applied:
                    mock_applied.return_value = []

                    # Mock migration modules
                    with patch.object(manager, "load_migration_module") as mock_load:
                        modules = []
                        for i in range(3):
                            module = MagicMock()
                            module.upgrade = MagicMock()
                            modules.append(module)

                        mock_load.side_effect = modules

                        # Apply migrations
                        applied = manager.apply_migrations()

                        # Verify
                        assert applied == ["001_first", "002_second", "003_third"]
                        assert mock_load.call_count == 3

                        # Check order of calls
                        calls = mock_load.call_args_list
                        assert calls[0][0][0] == "001_first"
                        assert calls[1][0][0] == "002_second"
                        assert calls[2][0][0] == "003_third"

                        # All upgrade functions should have been called
                        for module in modules:
                            module.upgrade.assert_called_once()

    def test_apply_migrations_missing_upgrade_function(self):
        """Test applying migration without upgrade function raises error."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = ["001_broken_migration"]

                with patch.object(manager, "load_migration_module") as mock_load:
                    mock_module = MagicMock()
                    # hasattr returns True even for None, so we need to remove the attribute
                    del mock_module.upgrade
                    mock_load.return_value = mock_module

                    # Should raise ValueError
                    with pytest.raises(ValueError, match="has no upgrade function"):
                        manager.apply_migrations()

    def test_apply_migrations_with_sql_error(self):
        """Test applying migration that raises SQL error."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = ["001_error_migration"]

                with patch.object(manager, "load_migration_module") as mock_load:
                    mock_module = MagicMock()

                    def raise_sql_error(conn):
                        cursor = conn.cursor()
                        cursor.execute("INVALID SQL STATEMENT")

                    mock_module.upgrade = raise_sql_error
                    mock_load.return_value = mock_module

                    # Should raise sqlite3.Error
                    with pytest.raises(sqlite3.Error):
                        manager.apply_migrations()

    def test_apply_migrations_partial_failure(self):
        """Test scenario where some migrations succeed and one fails."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = [
                    "001_success",
                    "002_failure",
                    "003_should_not_run",
                ]

                call_count = 0

                def mock_upgrade(conn):
                    nonlocal call_count
                    call_count += 1
                    if call_count == 2:  # Second migration fails
                        raise sqlite3.Error("Migration failed")
                    # First migration succeeds

                with patch.object(manager, "load_migration_module") as mock_load:
                    mock_module = MagicMock()
                    mock_module.upgrade = mock_upgrade
                    mock_load.return_value = mock_module

                    # Should raise error on second migration
                    with pytest.raises(sqlite3.Error, match="Migration failed"):
                        manager.apply_migrations()

                    # Only first migration should have been attempted
                    assert call_count == 2  # 1 success + 1 failure

                    # Check that only first migration was recorded
                    with sqlite3.connect(tmp.name) as conn:
                        manager.ensure_migrations_table(conn)
                        applied = manager.get_applied_migrations(conn)
                        assert applied == ["001_success"]  # Only first one applied

    def test_get_pending_migrations_with_gap(self):
        """Test getting pending migrations when there's a gap in applied migrations."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = [
                    "001_first",
                    "002_second",
                    "003_third",
                    "004_fourth",
                ]

                with patch.object(manager, "get_applied_migrations") as mock_applied:
                    # Simulate gap: 001 and 003 applied, 002 and 004 pending
                    mock_applied.return_value = ["001_first", "003_third"]

                    pending = manager.get_pending_migrations()
                    # Should return all migrations not applied, including those with gaps
                    assert pending == ["002_second", "004_fourth"]

    def test_migration_version_validation(self):
        """Test that migration versions are validated."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            # Test with invalid version format (no underscore)
            with patch.object(manager, "migrations_dir") as mock_dir:
                mock_dir.glob.return_value = [
                    Path("invalid_version.py"),  # No underscore
                    Path("001_valid.py"),
                ]

                # Should raise ValueError when sorting
                with pytest.raises(ValueError):
                    manager.get_available_migrations()

    def test_migration_idempotency_with_mocks(self):
        """Test that applying the same migration twice returns empty list."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            with patch.object(manager, "get_available_migrations") as mock_available:
                mock_available.return_value = ["001_test_migration"]

                with patch.object(manager, "load_migration_module") as mock_load:
                    mock_module = MagicMock()
                    mock_module.upgrade = MagicMock()
                    mock_load.return_value = mock_module

                    # Apply migration first time
                    first_result = manager.apply_migrations()
                    assert first_result == ["001_test_migration"]

                    # Apply migration second time - should be empty
                    second_result = manager.apply_migrations()
                    assert second_result == []

                    # Upgrade function should only be called once
                    assert mock_module.upgrade.call_count == 1


class TestMigrationIntegration:
    """Integration tests for migrations."""

    def test_initial_migration_creates_tables(self):
        """Test that the initial migration creates the correct tables."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            # Create a manager with the real migrations directory
            manager = MigrationManager(tmp.name)

            # Apply migrations
            applied = manager.apply_migrations()

            # Check that migration was applied
            assert len(applied) > 0

            # Verify tables were created
            with sqlite3.connect(tmp.name) as conn:
                cursor = conn.cursor()

                # Check images table
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='images'"
                )
                assert cursor.fetchone() is not None

                # Check annotations table
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='annotations'"
                )
                assert cursor.fetchone() is not None

                # Check migrations table
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
                )
                assert cursor.fetchone() is not None

                # Check that migration was recorded
                cursor.execute("SELECT version FROM migrations")
                versions = [row[0] for row in cursor.fetchall()]
                assert "001_initial_schema" in versions

    def test_migration_idempotency(self):
        """Test that applying migrations twice doesn't cause issues."""
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            manager = MigrationManager(tmp.name)

            # Apply migrations first time
            applied1 = manager.apply_migrations()
            assert len(applied1) > 0

            # Apply migrations second time
            applied2 = manager.apply_migrations()
            assert applied2 == []  # Should be empty - already applied

            # Verify tables still exist
            with sqlite3.connect(tmp.name) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [row[0] for row in cursor.fetchall()]
                assert "images" in tables
                assert "annotations" in tables
                assert "migrations" in tables


class TestMigrationUpDownOperations:
    """Tests for migration up/down operations."""

    def test_create_table_migration_upgrade(self):
        """Test creating a table via migration upgrade."""
        db_path = create_test_database()
        try:
            with sqlite3.connect(db_path) as conn:
                # Apply upgrade
                CreateTableMigration.upgrade(conn)

                # Verify table was created
                assert table_exists(conn, "test_table")

                # Verify table schema
                schema = get_table_schema(conn, "test_table")
                column_names = [col["name"] for col in schema]
                assert "id" in column_names
                assert "name" in column_names
                assert "value" in column_names
                assert "created_at" in column_names

                # Verify index was created
                assert index_exists(conn, "idx_test_table_name")

        finally:
            cleanup_test_database(db_path)

    def test_create_table_migration_downgrade(self):
        """Test dropping a table via migration downgrade."""
        db_path = create_test_database()
        try:
            with sqlite3.connect(db_path) as conn:
                # First create the table
                CreateTableMigration.upgrade(conn)
                assert table_exists(conn, "test_table")
                assert index_exists(conn, "idx_test_table_name")

                # Apply downgrade
                CreateTableMigration.downgrade(conn)

                # Verify table and index were dropped
                assert not table_exists(conn, "test_table")
                assert not index_exists(conn, "idx_test_table_name")

        finally:
            cleanup_test_database(db_path)

    def test_add_column_migration_upgrade(self):
        """Test adding a column via migration upgrade."""
        db_path = create_test_database()
        try:
            with sqlite3.connect(db_path) as conn:
                # First create images table (simulating initial schema)
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE images (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        filename TEXT NOT NULL UNIQUE,
                        filepath TEXT NOT NULL,
                        width INTEGER NOT NULL,
                        height INTEGER NOT NULL,
                        thumbnail_path TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()

                # Apply column addition upgrade
                AddColumnMigration.upgrade(conn)

                # Verify column was added
                schema = get_table_schema(conn, "images")
                column_names = [col["name"] for col in schema]
                assert "test_column" in column_names

                # Find the test_column
                test_col = next(col for col in schema if col["name"] == "test_column")
                assert test_col["type"] == "TEXT"
                assert test_col["default"] == "'test'"

        finally:
            cleanup_test_database(db_path)

    def test_add_column_migration_downgrade(self):
        """Test removing a column via migration downgrade."""
        db_path = create_test_database()
        try:
            with sqlite3.connect(db_path) as conn:
                # Create table with the column
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE images (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        filename TEXT NOT NULL UNIQUE,
                        filepath TEXT NOT NULL,
                        width INTEGER NOT NULL,
                        height INTEGER NOT NULL,
                        thumbnail_path TEXT,
                        test_column TEXT DEFAULT 'test',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()

                # Add some test data
                cursor.execute(
                    """
                    INSERT INTO images (filename, filepath, width, height, thumbnail_path, test_column)
                    VALUES (?, ?, ?, ?, ?, ?)
                """,
                    (
                        "test.jpg",
                        "/path/test.jpg",
                        100,
                        100,
                        "/thumb/test.jpg",
                        "original_value",
                    ),
                )
                conn.commit()

                # Apply downgrade
                AddColumnMigration.downgrade(conn)

                # Verify column was removed
                schema = get_table_schema(conn, "images")
                column_names = [col["name"] for col in schema]
                assert "test_column" not in column_names

                # Verify data was preserved (excluding removed column)
                cursor.execute("SELECT * FROM images")
                row = cursor.fetchone()
                assert row[1] == "test.jpg"  # filename
                assert row[2] == "/path/test.jpg"  # filepath
                assert row[3] == 100  # width
                assert row[4] == 100  # height
                assert row[5] == "/thumb/test.jpg"  # thumbnail_path
                # Note: test_column should be gone

        finally:
            cleanup_test_database(db_path)

    def test_migration_roundtrip(self):
        """Test full migration upgrade/downgrade roundtrip."""
        db_path = create_test_database()
        try:
            with sqlite3.connect(db_path) as conn:
                # Initial state: create images table
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE images (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        filename TEXT NOT NULL UNIQUE,
                        filepath TEXT NOT NULL,
                        width INTEGER NOT NULL,
                        height INTEGER NOT NULL,
                        thumbnail_path TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()

                # Record initial schema
                initial_schema = get_table_schema(conn, "images")
                initial_columns = [col["name"] for col in initial_schema]

                # Apply upgrade (add column)
                AddColumnMigration.upgrade(conn)

                # Verify upgrade worked
                upgraded_schema = get_table_schema(conn, "images")
                upgraded_columns = [col["name"] for col in upgraded_schema]
                assert len(upgraded_columns) == len(initial_columns) + 1
                assert "test_column" in upgraded_columns

                # Apply downgrade (remove column)
                AddColumnMigration.downgrade(conn)

                # Verify downgrade worked (back to initial state)
                final_schema = get_table_schema(conn, "images")
                final_columns = [col["name"] for col in final_schema]
                assert final_columns == initial_columns

        finally:
            cleanup_test_database(db_path)


class TestDatabaseMigrationIntegration:
    """Tests for database integration with migrations."""

    @pytest.fixture
    def reset_db_instance(self):
        """Reset global database instance for testing."""
        import backend.database

        original = backend.database._db
        backend.database._db = None
        yield
        backend.database._db = original

    def test_database_init_applies_migrations(self):
        """Test that Database initialization applies migrations."""
        from backend.database import Database

        db_path = create_test_database()
        try:
            # Mock MigrationManager to track calls
            with patch("backend.database.MigrationManager") as MockManager:
                mock_manager = MagicMock()
                mock_manager.apply_migrations.return_value = ["001_initial_schema"]
                MockManager.return_value = mock_manager

                # Initialize database
                db = Database(db_path)

                # Verify MigrationManager was called
                MockManager.assert_called_once_with(db_path)
                mock_manager.apply_migrations.assert_called_once()

        finally:
            cleanup_test_database(db_path)

    def test_database_connection_after_migrations(self):
        """Test that database connections work after migrations."""
        from backend.database import Database

        db_path = create_test_database()
        try:
            # Create database (will apply migrations)
            db = Database(db_path)

            # Test connection
            with db.get_connection() as conn:
                cursor = conn.cursor()

                # Should be able to query migrations table
                cursor.execute("SELECT version FROM migrations")
                versions = [row[0] for row in cursor.fetchall()]
                assert "001_initial_schema" in versions

                # Should be able to query images table
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='images'"
                )
                assert cursor.fetchone() is not None

        finally:
            cleanup_test_database(db_path)

    def test_database_execute_after_migrations(self):
        """Test database execute method works after migrations."""
        from backend.database import Database

        db_path = create_test_database()
        try:
            db = Database(db_path)

            # Test execute method
            cursor = db.execute(
                "INSERT INTO images (filename, filepath, width, height) VALUES (?, ?, ?, ?)",
                ("test.jpg", "/path/test.jpg", 100, 100),
            )

            # Verify insertion
            assert cursor.lastrowid is not None

            # Test fetch methods
            row = db.fetchone("SELECT * FROM images WHERE filename = ?", ("test.jpg",))
            assert row is not None
            assert row["filename"] == "test.jpg"
            assert row["width"] == 100

            rows = db.fetchall("SELECT * FROM images")
            assert len(rows) == 1
            assert rows[0]["filename"] == "test.jpg"

        finally:
            cleanup_test_database(db_path)

    def test_global_database_instance(self):
        """Test global database instance management."""
        from backend.database import init_database, get_db

        db_path = create_test_database()
        try:
            # Initialize database
            db = init_database(db_path)
            assert db is not None

            # Get global instance
            global_db = get_db()
            assert global_db is db

            # Test that operations work
            with global_db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [row[0] for row in cursor.fetchall()]
                assert "migrations" in tables

        finally:
            cleanup_test_database(db_path)

    def test_database_not_initialized_error(self, reset_db_instance):
        """Test error when database is not initialized."""
        from backend.database import get_db

        # Should raise RuntimeError
        with pytest.raises(RuntimeError, match="Database not initialized"):
            get_db()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
