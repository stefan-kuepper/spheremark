### Migration System
- **Automatic**: Migrations run automatically on server startup
- **Sequential**: Migration files named `001_*.py`, `002_*.py`, etc.
- **Forward-only**: No rollback support (by design)
- **Version tracking**: Applied migrations stored in `migrations` table

### Creating Migrations
```bash
# Create new migration file
python create_migration.py "Add new column to images"

# Edit the generated migration file
# backend/migrations/versions/002_add_new_column_to_images.py
```

### Migration File Structure
```python
"""Migration: Add new column to images."""

import sqlite3

def upgrade(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    
    # SQL to execute
    cursor.execute("ALTER TABLE images ADD COLUMN new_column TEXT")
    
    conn.commit()
```

### Common Migration Patterns
1. **Add column**: `ALTER TABLE table_name ADD COLUMN column_name TYPE`
2. **Create table**: `CREATE TABLE IF NOT EXISTS ...`
3. **Create index**: `CREATE INDEX IF NOT EXISTS ...`
4. **Modify data**: `UPDATE table_name SET column = value WHERE condition`

### Important Notes
- Use `IF NOT EXISTS` for table/index creation to handle existing databases
- SQLite has limited ALTER TABLE support (can only ADD COLUMN)
- For complex schema changes, create new table and copy data
- Test migrations with existing data before deployment
