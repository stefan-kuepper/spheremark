# SphereMark - Implementation Plan

## Overview
Transform the POC at `../treejs_pano_test` into a production web-based labeling tool with:
- **Client**: Browser-based Three.js viewer (adapted from POC)
- **Server**: FastAPI backend serving images from remote LAN storage
- **Storage**: SQLite database for annotations with spherical coordinate export
- **Target**: Single user in LAN, no authentication needed

## Architecture

```
Browser (Three.js) ←→ FastAPI Server ←→ SQLite DB
                            ↓
                    Remote LAN Images (/mnt/panoramas)
```

## Technology Stack

### Backend
- **FastAPI** (Python) - REST API server
- **SQLite** - Annotation storage
- **Pillow** - Image processing & thumbnails
- **NumPy** - Coordinate transformations
- **uv** - Fast Python package manager and runner

### Frontend
- **Vite** - Build system
- **Three.js r170** - 3D rendering (from POC)
- **Vanilla JS** - No framework, modularized from POC

## Directory Structure

```
/home/stefan/Projekte/spheremark/
├── backend/
│   ├── main.py                          # FastAPI entry, CORS, routes
│   ├── config.py                        # Config management
│   ├── database.py                      # SQLite schema & connection
│   ├── models.py                        # Pydantic models
│   ├── services/
│   │   ├── image_service.py            # Image scanning, thumbnails
│   │   ├── annotation_service.py       # CRUD for annotations
│   │   └── export_service.py           # COCO/YOLO export
│   ├── routes/
│   │   ├── images.py                   # Image endpoints
│   │   ├── annotations.py              # Annotation endpoints
│   │   └── export.py                   # Export endpoints
│   └── utils/
│       └── coordinates.py              # UV ↔ spherical conversion
│
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.js                     # Entry point
│   │   ├── api/
│   │   │   └── client.js               # REST API client
│   │   ├── viewer/
│   │   │   ├── scene.js                # Three.js setup (from POC)
│   │   │   ├── BoundingBox3D.js        # (from POC)
│   │   │   ├── BoxHandle.js            # (from POC)
│   │   │   └── interactions/
│   │   │       ├── DrawInteraction.js  # (from POC)
│   │   │       └── ResizeInteraction.js # (from POC)
│   │   ├── ui/
│   │   │   ├── ImageBrowser.js         # NEW: Image selection grid
│   │   │   ├── Toolbar.js              # (adapted from POC)
│   │   │   └── SidePanel.js            # (adapted from POC)
│   │   └── managers/
│   │       └── BoundingBoxManager.js   # (adapted from POC)
│   ├── styles/
│   │   └── main.css
│   └── package.json
│
├── data/                                # Runtime-created
│   ├── thumbnails/
│   └── annotations.db
│
├── config.yaml                          # Server configuration
├── pyproject.toml                       # Python project & dependencies (uv)
└── README.md
```

## Data Models

### Database Schema (SQLite)

```sql
-- Images
CREATE TABLE images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    filepath TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    thumbnail_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Annotations (stored as UV coordinates)
CREATE TABLE annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    label TEXT,
    uv_min_u REAL NOT NULL,      -- 0.0 to 1.0
    uv_min_v REAL NOT NULL,      -- 0.0 to 1.0
    uv_max_u REAL NOT NULL,      -- 0.0 to 1.0
    uv_max_v REAL NOT NULL,      -- 0.0 to 1.0
    color TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);

CREATE INDEX idx_annotations_image_id ON annotations(image_id);
```

## Coordinate Systems

### Storage: UV Coordinates
- **U**: 0.0 (left) → 1.0 (right) - Longitude
- **V**: 0.0 (top) → 1.0 (bottom) - Latitude
- Used for database storage and Three.js rendering
- Natural for equirectangular images

### Export: Spherical Coordinates
- **Phi (φ)**: Longitude, [-π, π] radians
- **Theta (θ)**: Latitude, [0, π] radians
- Used for COCO/YOLO export
- Essential for perspective-corrected object extraction

### Conversion Functions (backend/utils/coordinates.py)

```python
def uv_to_spherical(u, v):
    """Convert UV to spherical angles."""
    phi = (u * 2 * π) - π      # U [0,1] → φ [-π, π]
    theta = v * π               # V [0,1] → θ [0, π]
    return phi, theta

def spherical_to_uv(phi, theta):
    """Convert spherical to UV."""
    u = (phi + π) / (2 * π)
    v = theta / π
    return u, v
```

## Export Format: COCO-style Panoramic

```json
{
  "info": {
    "description": "Panoramic Image Annotations",
    "version": "1.0",
    "coordinate_system": "spherical"
  },
  "images": [
    {
      "id": 1,
      "file_name": "pano_001.jpg",
      "width": 8192,
      "height": 4096,
      "projection": "equirectangular"
    }
  ],
  "annotations": [
    {
      "id": 1,
      "image_id": 1,
      "category_id": 1,
      "bbox_spherical": {
        "phi_min": -0.785,
        "theta_min": 1.047,
        "phi_max": 0.524,
        "theta_max": 1.571
      },
      "bbox_uv": {
        "u_min": 0.25,
        "v_min": 0.33,
        "u_max": 0.58,
        "v_max": 0.50
      }
    }
  ],
  "categories": [
    {"id": 1, "name": "traffic_sign", "supercategory": "street_object"}
  ]
}
```

## REST API Endpoints

### Images
```
GET    /api/images                  # List all images
GET    /api/images/{id}             # Get image details
GET    /api/images/{id}/file        # Serve full image
GET    /api/images/{id}/thumbnail   # Serve thumbnail
POST   /api/images/scan             # Scan remote dir for new images
```

### Annotations
```
GET    /api/images/{id}/annotations        # Get all for image
POST   /api/images/{id}/annotations        # Create annotation
PUT    /api/annotations/{id}               # Update annotation
DELETE /api/annotations/{id}               # Delete annotation
```

### Export
```
GET    /api/export/coco               # Export all (COCO format)
GET    /api/export/coco/{image_id}    # Export single image
GET    /api/export/yolo               # Export all (YOLO format)
GET    /api/export/yolo/{image_id}    # Export single image
```

## POC Adaptation Strategy

### Keep from POC (../treejs_pano_test/index.html)
1. **Three.js scene setup**
   - Inverted sphere (500 unit radius)
   - OrbitControls with FOV zoom
   - CSS2DRenderer for handles
   - Lines 1-200 (scene initialization)

2. **Interaction modes**
   - View, Draw, Edit modes
   - DrawInteraction class (lines ~800-1000)
   - ResizeInteraction class (lines ~1000-1200)

3. **BoundingBox3D rendering**
   - LineLoop with 20 segments per edge
   - Corner handles with CSS2D
   - Lines ~400-700

4. **Coordinate utilities**
   - uvTo3D(), raycastSphere() functions
   - Lines ~100-200

5. **Keyboard shortcuts**
   - ESC, D, E, Delete
   - Lines ~1500-1600

### Modify from POC
1. **Image loading**: Replace file upload with API fetch
2. **Thumbnails**: Fetch from server instead of Canvas generation
3. **Persistence**: Auto-save to server on create/update/delete
4. **Box storage**: Sync with server database instead of in-memory only

### Add New Features
1. **Image browser**: Grid view with thumbnails, annotation counts
2. **Label management**: Add/edit category labels, dropdown UI
3. **Save status indicator**: "Saving..." / "Saved" / "Error"
4. **Export dialog**: Format selection (COCO/YOLO), preview

## Implementation Phases

### Phase 1: Backend Foundation ✓ COMPLETED
**Goal**: Working API serving images and thumbnails

**Tasks**:
1. ✓ Create project structure
2. ✓ Set up FastAPI with CORS
3. ✓ Implement database schema
4. ✓ Create image service (scan directory, generate thumbnails)
5. ✓ Implement image endpoints
6. ✓ Configure uv for fast Python package management
7. Test with sample panoramas from LAN

**Critical files**:
- `backend/main.py` - FastAPI app setup
- `backend/database.py` - SQLite schema
- `backend/services/image_service.py` - Image scanning & thumbnails
- `backend/routes/images.py` - Image endpoints
- `pyproject.toml` - Python dependencies (managed by uv)

**Setup**:
```bash
# Install dependencies (creates venv automatically)
uv sync

# Run the server
uv run python -m backend.main
```

**Verification**: Can list images, view thumbnails via API

---

### Phase 2: Annotation Backend ✓ COMPLETED
**Goal**: Full CRUD for annotations with coordinate conversion

**Tasks**:
1. ✓ Create annotation service
2. ✓ Implement annotation endpoints
3. ✓ Add UV coordinate validation
4. ✓ Implement coordinate conversion (UV ↔ spherical)
5. ✓ Create export service (COCO format)
6. ✓ Add YOLO format support
7. ✓ Unit test coordinate conversions (all tests pass)

**Critical files**:
- `backend/services/annotation_service.py` - Annotation CRUD
- `backend/utils/coordinates.py` - Conversion functions
- `backend/services/export_service.py` - COCO/YOLO generation
- `backend/routes/annotations.py` - Annotation endpoints
- `backend/routes/export.py` - Export endpoints
- `test_coordinates.py` - Coordinate conversion tests

**Verification**: ✓ Can create/update/delete annotations, export to COCO/YOLO, coordinate conversions verified

---

### Phase 3: Frontend Modularization
**Goal**: POC code refactored into modules with API integration

**Tasks**:
1. Set up Vite project
2. Extract POC code into ES6 modules:
   - Scene setup → `viewer/scene.js`
   - BoundingBox3D → `viewer/BoundingBox3D.js`
   - Interactions → `viewer/interactions/`
   - Manager → `managers/BoundingBoxManager.js`
3. Create API client (`api/client.js`)
4. Replace file upload with API image loading
5. Implement auto-save on annotation changes
6. Test all POC features still work

**Critical files**:
- `frontend/src/main.js` - Entry point
- `frontend/src/api/client.js` - API wrapper
- `frontend/src/viewer/scene.js` - Three.js setup
- `frontend/src/managers/BoundingBoxManager.js` - Box lifecycle + server sync
- `frontend/package.json` - Dependencies (Vite, Three.js r170)

**Verification**: Can load image from server, create box, see it saved to DB

---

### Phase 4: New UI Features
**Goal**: Image browser, labels, export dialog

**Tasks**:
1. Create image browser component (grid with thumbnails)
2. Implement label management (dropdown, autocomplete)
3. Add export dialog (format selection, preview)
4. Add save status indicator
5. Enhance keyboard shortcuts
6. Polish UI/UX (loading states, error handling)

**Critical files**:
- `frontend/src/ui/ImageBrowser.js` - Image selection
- `frontend/src/ui/LabelManager.js` - Label UI
- `frontend/src/ui/ExportDialog.js` - Export options
- `frontend/styles/main.css` - Styling

**Verification**: Can browse images, assign labels, export with UI

---

### Phase 5: Testing & Deployment
**Goal**: Production-ready system running on LAN

**Tasks**:
1. End-to-end testing with real panoramas
2. Test with large images (8K+) and many boxes (50+)
3. Cross-browser testing
4. Write README with setup instructions
5. Create config.yaml for LAN deployment
6. Set up systemd service or Docker container
7. Mount remote image storage (NFS/SMB)
8. Final bug fixes and polish

**Deliverables**:
- Deployed application accessible on LAN
- Documentation for setup and usage
- Remote image directory mounted and working

**Verification**: Full workflow from image scan to export works reliably

## Configuration (config.yaml)

```yaml
server:
  host: "0.0.0.0"
  port: 8000

images:
  remote_path: "/mnt/panoramas"
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

## Key Design Decisions

1. **Store UV, export spherical**: Simplifies storage and rendering, converts only on export
2. **SQLite database**: No setup required, sufficient for single user, easy backup
3. **Auto-save**: Modern UX, prevents data loss, fast on LAN
4. **Server-side thumbnails**: Faster, consistent, reduces browser memory
5. **No wrapping support initially**: Keep POC limitation, can add later
6. **Modular frontend**: Easier to maintain than single file, keeps POC logic intact

## Known Limitations

1. Bounding boxes cannot cross UV boundary (0/1 wrap-around)
2. Minimum box size: 2% of panorama dimensions
3. Single user only (no concurrent editing)
4. Desktop-focused (mobile support not prioritized)

## Dependencies

### Backend (pyproject.toml)
```toml
[project]
dependencies = [
    "fastapi==0.104.1",
    "uvicorn[standard]==0.24.0",
    "pillow==10.1.0",
    "numpy==1.26.2",
    "pydantic==2.5.0",
    "python-multipart==0.0.6",
    "pyyaml==6.0.1",
]
```

**Installation**: `uv sync`

### Frontend (package.json)
```json
{
  "dependencies": {
    "three": "0.170.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

## Critical Files Summary

**Backend (9 files)**:
1. `backend/main.py` - Application entry, routing
2. `backend/database.py` - Schema and connection
3. `backend/config.py` - Configuration loader
4. `backend/models.py` - Pydantic models
5. `backend/services/image_service.py` - Image operations
6. `backend/services/annotation_service.py` - Annotation CRUD
7. `backend/services/export_service.py` - COCO/YOLO export
8. `backend/utils/coordinates.py` - Coordinate conversion
9. `backend/routes/{images,annotations,export}.py` - API endpoints

**Frontend (11 files)**:
1. `frontend/index.html` - Main HTML
2. `frontend/src/main.js` - Entry point
3. `frontend/src/api/client.js` - API wrapper
4. `frontend/src/viewer/scene.js` - Three.js setup
5. `frontend/src/viewer/BoundingBox3D.js` - Box rendering
6. `frontend/src/viewer/BoxHandle.js` - Handle rendering
7. `frontend/src/viewer/interactions/DrawInteraction.js` - Box creation
8. `frontend/src/viewer/interactions/ResizeInteraction.js` - Box editing
9. `frontend/src/managers/BoundingBoxManager.js` - Lifecycle & sync
10. `frontend/src/ui/ImageBrowser.js` - Image selection
11. `frontend/package.json` - Dependencies

**Configuration (2 files)**:
1. `config.yaml` - Server configuration
2. `pyproject.toml` - Python project metadata and dependencies (uv)

## Success Criteria

- ✓ Load panoramic images from remote LAN storage
- ✓ Create spherical bounding boxes with drag interaction
- ✓ Resize and delete boxes
- ✓ Assign category labels to boxes
- ✓ Auto-save annotations to database
- ✓ Export annotations in COCO format with spherical coordinates
- ✓ Export annotations in YOLO format
- ✓ Browse multiple images with thumbnails
- ✓ Coordinate conversion accuracy verified
- ✓ Works with 8K+ panoramas smoothly
- ✓ Accessible from LAN on port 8000
