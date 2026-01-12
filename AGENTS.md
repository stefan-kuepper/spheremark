# SphereMark - Agent Guide

Essential information for agentic coding assistants working on SphereMark, a web-based tool for annotating panoramic images with spherical bounding boxes.

## Build/Lint/Test Commands

### Backend (Python 3.10+, FastAPI, SQLite)
```bash
# Install dependencies
uv sync

# Run development server
uv run python -m backend.main

# Run single test file
uv run python test_coordinates.py
# Or run with pytest
uv run pytest tests/test_coordinates.py

# Run migration tests
uv run pytest tests/test_migrations.py
uv run pytest tests/test_real_migration.py

# Run all tests
uv run pytest tests/

# Run specific Python script
uv run python path/to/script.py
```

### Frontend (React, TypeScript, Three.js, Vite)
```bash
cd frontend

# Install dependencies
npm install

# Development server (port 3000)
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck  # or: npx tsc --noEmit

# Preview production build
npm run preview
```

### Database & Setup
```bash
# Initialize database (auto on server start)
uv run python -m backend.main

# Scan for images
curl -X POST http://localhost:8000/api/images/scan

# Create new migration
uv run python create_migration.py "Migration description"
```

## Code Style Guidelines

### Python Backend

#### Imports & Structure
```python
import math
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel

from backend.config import load_config
from backend.models import ImageResponse
```

#### Naming & Types
- **Variables/functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private**: `_leading_underscore`
- **Always use type hints**: `def get_image(image_id: int) -> Optional[ImageResponse]:`
- **Use modern types**: `list[T]`, `dict[K, V]`, `Optional[T]` for nullable

#### Pydantic Models
- Define in `backend/models.py`
- Use `Field` for validation: `uv_min_u: float = Field(..., ge=0.0, le=1.0)`
- Set `from_attributes = True` for response models

#### Error Handling & Database
- Return `None` for "not found" cases
- Log with context: `logger.error(f"Failed to {action}: {error}")`
- Use database wrapper from `backend.database`
- Parameterized SQL: `db.fetchone("SELECT * FROM images WHERE id = ?", (image_id,))`

#### Service Layer Pattern
- Business logic in `backend/services/`
- Routes (`backend/routes/`) handle HTTP only
- Services return Pydantic models or raise exceptions

### TypeScript/JavaScript Frontend

#### Module Structure
```typescript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useState } from 'react';

export class PanoramaScene {
    dispose() { /* cleanup */ }
}
```

#### Naming Conventions
- **Variables/functions**: `camelCase`
- **Classes/Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private**: `_leadingUnderscore`
- **Event handlers**: `onEventName` (e.g., `onCanvasClick`)

#### API Client Pattern
- Centralized in `frontend/src/api/client.ts`
- Use async/await with try/catch
- Handle errors gracefully with user feedback

#### Three.js Conventions
- Components in `frontend/src/viewer/`
- Always implement `dispose()` for cleanup
- Raycasting for interactions
- Separate geometry, materials, scene graph

#### TypeScript
- Enable strict mode in `tsconfig.json`
- Use interfaces for object shapes
- Avoid `any` type; use `unknown` or proper types
- React components: `FC<Props>` or explicit return types

## Project Structure
```
spheremark/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Pydantic config
│   ├── database.py          # SQLite wrapper
│   ├── models.py            # Pydantic models
│   ├── migrations/          # Database migrations
│   │   ├── migration_manager.py
│   │   └── versions/        # Migration files (001_*.py, 002_*.py, etc.)
│   ├── services/            # Business logic
│   ├── routes/              # HTTP endpoints
│   └── utils/               # Utilities
├── frontend/
│   ├── src/
│   │   ├── main.tsx         # React entry
│   │   ├── api/             # API client
│   │   ├── viewer/          # Three.js components
│   │   └── styles/
│   ├── tsconfig.json        # TypeScript config
│   └── vite.config.js       # Vite config
├── data/                    # Database, thumbnails
├── config.yaml             # App config
├── create_migration.py     # Migration creation helper
└── test_coordinates.py     # Coordinate tests
```

## Key Development Notes

### Coordinate Systems
- **UV coordinates** (storage): U [0,1] = longitude, V [0,1] = latitude
- **Spherical coordinates** (export): φ [-π,π] = longitude, θ [0,π] = latitude
- Conversion functions in `backend/utils/coordinates.py`

### Testing
- Run coordinate tests: `uv run python test_coordinates.py`
- API testing: Swagger UI at `http://localhost:8000/docs`
- Frontend: Manual testing at `http://localhost:3000`

### Common Tasks
1. **New API endpoint**: Add route → service method → update API client
2. **New Three.js component**: Create in `viewer/` with `dispose()` method
3. **Database changes**: Create migration → update schema, test with existing data

### Configuration
- Backend: `config.yaml` (set `images.remote_path` to panorama directory)
- Frontend: API URL via `VITE_API_URL` env var (defaults to `http://localhost:8000`)

## Database Migrations

see [./MIGRATIONS.md]

## Agent Requirements
- Follow existing patterns in each language
- Test coordinate conversions thoroughly
- Handle large panoramic images efficiently
- Maintain backend/frontend separation
- Use proper error handling and logging
- **Always create migrations for database schema changes**
