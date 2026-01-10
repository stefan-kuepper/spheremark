# SphereMark - Agent Guide

This guide provides essential information for agentic coding assistants working on the SphereMark project.

## Project Overview

SphereMark is a web-based tool for annotating panoramic images with spherical bounding boxes. The project consists of:
- **Backend**: FastAPI server (Python 3.10+) with SQLite database
- **Frontend**: Three.js viewer (ES6 modules) built with Vite
- **Package Management**: `uv` for Python, `npm` for Node.js

## Development Commands

### Backend

```bash
# Install Python dependencies
uv sync

# Run the development server
uv run python -m backend.main

# Run coordinate conversion tests
uv run python test_coordinates.py

# Run a specific Python file
uv run python path/to/script.py
```

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database & Setup

```bash
# Initialize database (happens automatically on server start)
uv run python -m backend.main

# Scan for images via API
curl -X POST http://localhost:8000/api/images/scan
```

## Code Style Guidelines

### Python (Backend)

#### Imports
- Use absolute imports within the `backend` package
- Group imports: standard library, third-party, local
- Follow this order:
  ```python
  import math
  from pathlib import Path
  from typing import Optional
  
  from fastapi import FastAPI
  from pydantic import BaseModel
  
  from backend.config import load_config
  from backend.models import ImageResponse
  ```

#### Naming Conventions
- **Variables/functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private members**: `_leading_underscore`
- **Database fields**: `snake_case` matching column names

#### Type Annotations
- Always use type hints for function parameters and return values
- Use `Optional[T]` for nullable values
- Use `list[T]`, `dict[K, V]` instead of `List`, `Dict`
- Example:
  ```python
  def get_image(image_id: int) -> Optional[ImageResponse]:
      """Get image by ID."""
      pass
  ```

#### Pydantic Models
- Define models in `backend/models.py`
- Use `Field` for validation constraints
- Include `field_validator` methods where needed
- Set `from_attributes = True` for response models
- Example:
  ```python
  class AnnotationBase(BaseModel):
      label: Optional[str] = None
      uv_min_u: float = Field(..., ge=0.0, le=1.0)
      uv_min_v: float = Field(..., ge=0.0, le=1.0)
  ```

#### Error Handling
- Use specific exception types where possible
- Return `None` for "not found" cases rather than raising exceptions
- Log errors with context: `logger.error(f"Failed to {action}: {error}")`
- Use try/except blocks for external operations (file I/O, database)

#### Database Access
- Use the database wrapper from `backend.database`
- Write parameterized SQL queries to prevent injection
- Fetch results as dictionaries using `fetchone()`, `fetchall()`
- Example:
  ```python
  row = db.fetchone("SELECT * FROM images WHERE id = ?", (image_id,))
  ```

#### Service Layer Pattern
- Business logic belongs in `backend/services/`
- Services handle database operations and business rules
- Routes (`backend/routes/`) handle HTTP concerns only
- Services return Pydantic models or raise exceptions

### JavaScript (Frontend)

#### Module Structure
- Use ES6 modules with named exports
- One class/component per file
- Import Three.js modules individually
- Example:
  ```javascript
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  
  export class PanoramaScene {
      // class implementation
  }
  ```

#### Naming Conventions
- **Variables/functions**: `camelCase`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private members**: `_leadingUnderscore`
- **Event handlers**: `onEventName` (e.g., `onCanvasClick`)

#### API Client Pattern
- Centralized API client in `frontend/src/api/client.js`
- Use async/await for all API calls
- Handle errors with try/catch blocks
- Return appropriate data or throw errors
- Example:
  ```javascript
  async function createAnnotation(imageId, data) {
      const response = await apiFetch(`/api/images/${imageId}/annotations`, {
          method: 'POST',
          body: JSON.stringify(data),
      });
      return response.json();
  }
  ```

#### Three.js Conventions
- Create scene components in `frontend/src/viewer/`
- Use `dispose()` method to clean up Three.js resources
- Separate geometry, materials, and scene graph management
- Raycasting for interaction handling

#### DOM Manipulation
- Cache DOM element references at initialization
- Use event delegation where appropriate
- Update UI state via class toggling (`classList.add/remove`)
- Keep business logic separate from UI updates

#### Error Handling
- Use console.error for debugging: `console.error('Failed to load:', error)`
- Show user-friendly error messages via UI
- Handle network errors gracefully with retry options

## Project Structure

```
spheremark/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration loader (Pydantic)
│   ├── database.py          # SQLite database wrapper
│   ├── models.py            # Pydantic models for requests/responses
│   ├── services/            # Business logic layer
│   │   ├── image_service.py
│   │   ├── annotation_service.py
│   │   └── export_service.py
│   ├── routes/              # HTTP endpoint handlers
│   │   ├── images.py
│   │   ├── annotations.py
│   │   └── export.py
│   └── utils/               # Utility functions
│       └── coordinates.py   # UV ↔ spherical coordinate conversion
├── frontend/
│   ├── src/
│   │   ├── main.js          # Application entry point
│   │   ├── api/
│   │   │   └── client.js    # Backend API client
│   │   ├── viewer/          # Three.js scene and components
│   │   │   ├── scene.js
│   │   │   ├── BoundingBox3D.js
│   │   │   ├── BoxHandle.js
│   │   │   └── interactions/ # User interaction handlers
│   │   └── managers/        # State management
│   │       └── BoundingBoxManager.js
│   ├── styles/              # CSS styles (currently inline in HTML)
│   ├── index.html           # HTML entry point
│   └── vite.config.js       # Vite configuration
├── data/                    # Runtime data (database, thumbnails)
├── config.yaml             # Application configuration
├── pyproject.toml          # Python project metadata
├── test_coordinates.py     # Coordinate conversion tests
└── README.md              # Project documentation
```

## Development Workflow

### Setup
1. Ensure Python 3.10+ and Node.js 18+ are installed
2. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
3. Install dependencies: `uv sync` and `cd frontend && npm install`
4. Configure `config.yaml` with your panoramic images directory
5. Start backend: `uv run python -m backend.main`
6. Start frontend: `cd frontend && npm run dev`

### Testing
- Run coordinate conversion tests: `uv run python test_coordinates.py`
- Test API endpoints via Swagger UI: `http://localhost:8000/docs`
- Manual frontend testing: Open `http://localhost:3000`

### Adding New Features

#### Backend Changes
1. Define Pydantic models in `backend/models.py` if needed
2. Create service methods in `backend/services/`
3. Add route handlers in `backend/routes/`
4. Update `backend/main.py` to include new routers
5. Test with curl or Swagger UI

#### Frontend Changes
1. Create new Three.js components in `frontend/src/viewer/`
2. Add API methods in `frontend/src/api/client.js` if needed
3. Update `frontend/src/main.js` for UI integration
4. Test in browser with hot reload

#### Database Changes
1. Create migration SQL in a new file
2. Update schema in `backend/database.py`
3. Test with existing data

### Common Tasks

#### Adding a New API Endpoint
1. Add route handler in appropriate `backend/routes/` file
2. Add corresponding service method
3. Update API client in `frontend/src/api/client.js`
4. Test with curl: `curl http://localhost:8000/api/endpoint`

#### Creating a New Three.js Component
1. Create file in `frontend/src/viewer/`
2. Export class with `dispose()` method
3. Import in `frontend/src/main.js`
4. Add to scene and clean up properly

#### Handling Image Operations
- Use `Pillow` for image processing in Python
- Generate thumbnails to `data/thumbnails/`
- Serve images via FastAPI static files or endpoints
- Handle large panoramic images (disable decompression bomb warning)

## Configuration

### Backend Configuration (`config.yaml`)
```yaml
server:
  host: "0.0.0.0"
  port: 8000

images:
  remote_path: "/path/to/panoramas"  # REQUIRED: Update this!
  allowed_extensions: [".jpg", ".jpeg", ".png"]

thumbnails:
  max_width: 256
  quality: 85

database:
  path: "data/annotations.db"

export:
  default_format: "coco"
  coordinate_precision: 6
```

### Frontend Configuration
- API URL: Set via `VITE_API_URL` environment variable or defaults to `http://localhost:8000`
- Vite config: `frontend/vite.config.js`

## Troubleshooting

### Common Issues

**"Remote path does not exist"**
- Update `images.remote_path` in `config.yaml` to a valid directory

**Database not initialized**
- Ensure `data/` directory exists and is writable
- Server automatically initializes database on startup

**Frontend can't connect to backend**
- Check CORS settings in `backend/main.py`
- Ensure backend is running on port 8000
- Verify `VITE_API_URL` matches backend URL

**Large image loading fails**
- Disabled decompression bomb warning in `backend/services/image_service.py`
- Ensure sufficient memory for panoramic images

## Coordinate Systems

Understanding coordinate systems is critical for this project:

### UV Coordinates (Storage)
- **U**: 0.0 (left) → 1.0 (right) - Longitude
- **V**: 0.0 (top) → 1.0 (bottom) - Latitude
- Used for database storage and rendering

### Spherical Coordinates (Export)
- **Phi (φ)**: Longitude, [-π, π] radians
- **Theta (θ)**: Latitude, [0, π] radians
- Used for COCO/YOLO export

Conversion functions are in `backend/utils/coordinates.py`.

## Agent Notes

- This project uses modern Python and JavaScript patterns
- Follow existing conventions in each language
- Test changes thoroughly, especially coordinate conversions
- Consider performance for panoramic image operations
- Maintain separation between backend services and frontend UI
- Use the existing API client pattern for new endpoints