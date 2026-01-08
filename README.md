# SphereMark

A web-based tool for annotating panoramic images with spherical bounding boxes. Built with FastAPI (backend) and Three.js (frontend).

## Features

- Load panoramic images from remote LAN storage
- Create 3D bounding boxes on equirectangular panoramas
- Store annotations with UV coordinates
- Export annotations in COCO and YOLO formats with spherical coordinates
- Single-user LAN deployment

## Project Status

**Phase 1: Backend Foundation** ✓ COMPLETED
- FastAPI server with CORS
- SQLite database for images and annotations
- Image scanning and thumbnail generation
- REST API endpoints for images

**Phase 2: Annotation Backend** ✓ COMPLETED
- Full CRUD for annotations
- UV ↔ spherical coordinate conversion
- COCO format export with spherical coordinates
- YOLO format export
- Coordinate conversion tests verified

**Phase 3: Frontend Modularization** ✓ COMPLETED
- Vite project setup with ES6 modules
- Three.js viewer with scene management
- API client for backend communication
- Bounding box manager with auto-save
- Image browser UI
- Draw and edit interactions
- Modular architecture (viewer, interactions, managers)

**Phase 4: New UI Features** - PENDING
**Phase 5: Testing & Deployment** - PENDING

## Setup

### Prerequisites

- Python 3.10+
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer (10-100x faster than pip)
- Node.js 18+ (for frontend, Phase 3+)
- Access to panoramic images directory

> **Why uv?** This project uses uv for Python package management because it's significantly faster than pip, handles virtual environments automatically, and provides better dependency resolution.

### Installation

1. Clone or navigate to the project directory:
```bash
cd /home/stefan/Projekte/spheremark
```

2. Install uv (if not already installed):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

3. Install dependencies:
```bash
uv sync
```

4. Configure the application:
Edit `config.yaml` to set your panoramic images directory:
```yaml
images:
  remote_path: "/path/to/your/panoramas"  # Update this path
```

### Running the Application

**Backend Server:**

```bash
uv run python -m backend.main
```

The server will start on `http://0.0.0.0:8000`

Access the API documentation at `http://localhost:8000/docs`

**Frontend (Phase 3+):**

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

3. Build for production:
```bash
npm run build
```

The built files will be in `frontend/dist/`

## API Endpoints

### Images

- `GET /api/images` - List all images with annotation counts
- `GET /api/images/{id}` - Get image details
- `GET /api/images/{id}/file` - Serve full resolution image
- `GET /api/images/{id}/thumbnail` - Serve thumbnail
- `POST /api/images/scan` - Scan remote directory for new images

### Annotations (Phase 2)

- `GET /api/images/{id}/annotations` - Get all annotations for an image
- `POST /api/images/{id}/annotations` - Create annotation for an image
- `GET /api/annotations/{id}` - Get specific annotation by ID
- `PUT /api/annotations/{id}` - Update annotation
- `DELETE /api/annotations/{id}` - Delete annotation
- `GET /api/annotations` - Get all annotations (all images)

### Export (Phase 2)

- `GET /api/export/coco` - Export all annotations in COCO format
- `GET /api/export/coco/{image_id}` - Export single image in COCO format
- `GET /api/export/yolo` - Export all annotations in YOLO format
- `GET /api/export/yolo/{image_id}` - Export single image in YOLO format
- `GET /api/export/yolo/{image_id}/txt` - Download YOLO .txt file
- `GET /api/export/yolo/classes.txt` - Download YOLO classes.txt

### Health

- `GET /` - API information
- `GET /health` - Health check

## Testing

### Phase 1: Images

1. Start the server:
```bash
uv run python -m backend.main
```

2. Scan for images (replace with actual path in config.yaml):
```bash
curl -X POST http://localhost:8000/api/images/scan
```

3. List images:
```bash
curl http://localhost:8000/api/images
```

4. View an image thumbnail (replace {id} with actual image ID):
```bash
curl http://localhost:8000/api/images/1/thumbnail --output thumb.jpg
```

### Phase 2: Annotations & Export

1. Create an annotation:
```bash
curl -X POST http://localhost:8000/api/images/1/annotations \
  -H "Content-Type: application/json" \
  -d '{
    "label": "traffic_sign",
    "uv_min_u": 0.25,
    "uv_min_v": 0.25,
    "uv_max_u": 0.75,
    "uv_max_v": 0.75,
    "color": "#ff0000"
  }'
```

2. Get annotations for an image:
```bash
curl http://localhost:8000/api/images/1/annotations
```

3. Export to COCO format:
```bash
curl http://localhost:8000/api/export/coco -o annotations.json
```

4. Export to YOLO format:
```bash
curl http://localhost:8000/api/export/yolo
```

5. Test coordinate conversions:
```bash
uv run python test_coordinates.py
```

### Interactive API Documentation

Open `http://localhost:8000/docs` in your browser to test all endpoints interactively.

### Phase 3: Frontend Usage

1. **Start the backend server** (see above)

2. **Scan for images:**
```bash
curl -X POST http://localhost:8000/api/images/scan
```

3. **Start the frontend:**
```bash
cd frontend
npm run dev
```

4. **Open the application:**
Navigate to `http://localhost:3000` in your browser

5. **Workflow:**
   - Select an image from the browser
   - Use toolbar to switch modes:
     - **View Mode (👁️)**: Navigate the panorama
     - **Draw Mode (✏️)**: Click and drag to create bounding boxes
     - **Edit Mode (✋)**: Select and resize boxes
   - Keyboard shortcuts:
     - `ESC`: Switch to View mode
     - `D`: Switch to Draw mode
     - `E`: Switch to Edit mode
     - `Delete/Backspace`: Delete selected box
   - Annotations auto-save to the database
   - Use side panel to view, focus, and delete boxes

## Project Structure

```
spheremark/
├── backend/
│   ├── main.py                       # FastAPI application
│   ├── config.py                     # Configuration loader
│   ├── database.py                   # SQLite database
│   ├── models.py                     # Pydantic models
│   ├── services/
│   │   ├── image_service.py          # Image operations
│   │   ├── annotation_service.py     # Annotation CRUD (Phase 2)
│   │   └── export_service.py         # COCO/YOLO export (Phase 2)
│   ├── routes/
│   │   ├── images.py                 # Image endpoints
│   │   ├── annotations.py            # Annotation endpoints (Phase 2)
│   │   └── export.py                 # Export endpoints (Phase 2)
│   └── utils/
│       └── coordinates.py            # UV ↔ spherical conversion (Phase 2)
├── data/
│   ├── annotations.db                # SQLite database (created at runtime)
│   └── thumbnails/                   # Generated thumbnails
├── frontend/                         # Frontend (Phase 3+)
│   ├── src/
│   │   ├── main.js                   # Application entry point
│   │   ├── api/
│   │   │   └── client.js             # Backend API client
│   │   ├── viewer/
│   │   │   ├── scene.js              # Three.js scene setup
│   │   │   ├── BoundingBox3D.js      # Box rendering
│   │   │   ├── BoxHandle.js          # Resize handles
│   │   │   └── interactions/
│   │   │       ├── DrawInteraction.js    # Box creation
│   │   │       └── ResizeInteraction.js  # Box editing
│   │   └── managers/
│   │       └── BoundingBoxManager.js # Box lifecycle + server sync
│   ├── styles/
│   │   └── main.css                  # Application styles
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Node dependencies
│   └── vite.config.js                # Vite configuration
├── config.yaml                       # Configuration
├── pyproject.toml                    # Python project metadata & dependencies
├── test_coordinates.py               # Coordinate conversion tests (Phase 2)
└── README.md                         # This file
```

## Database Schema

### Images Table
- `id` - Primary key
- `filename` - Image filename
- `filepath` - Full path to image
- `width` - Image width in pixels
- `height` - Image height in pixels
- `thumbnail_path` - Path to generated thumbnail
- `created_at` - Timestamp

### Annotations Table (Phase 2+)
- `id` - Primary key
- `image_id` - Foreign key to images
- `label` - Category label
- `uv_min_u`, `uv_min_v` - Minimum UV coordinates (0.0-1.0)
- `uv_max_u`, `uv_max_v` - Maximum UV coordinates (0.0-1.0)
- `color` - Display color
- `created_at`, `updated_at` - Timestamps

## Coordinate Systems

### UV Coordinates (Storage)
- **U**: 0.0 (left) → 1.0 (right) - Longitude
- **V**: 0.0 (top) → 1.0 (bottom) - Latitude
- Used for database and rendering

### Spherical Coordinates (Export)
- **Phi (φ)**: Longitude, [-π, π] radians
- **Theta (θ)**: Latitude, [0, π] radians
- Used for COCO/YOLO export (Phase 2+)

## Configuration

Edit `config.yaml`:

```yaml
server:
  host: "0.0.0.0"
  port: 8000

images:
  remote_path: "/mnt/panoramas"  # Update to your path
  allowed_extensions: [".jpg", ".jpeg", ".png"]

thumbnails:
  max_width: 256
  quality: 85

database:
  path: "data/annotations.db"
```

## Next Steps

After Phase 1 completion:
- **Phase 2**: Implement annotation CRUD endpoints and export functionality
- **Phase 3**: Create frontend with Three.js viewer
- **Phase 4**: Add UI for browsing, labeling, and exporting
- **Phase 5**: Deploy on LAN with production configuration

## Troubleshooting

### "Remote path does not exist"
Update `images.remote_path` in `config.yaml` to point to your panoramic images directory.

### "Configuration not loaded"
Ensure `config.yaml` exists in the project root directory.

### Port already in use
Change the port in `config.yaml`:
```yaml
server:
  port: 8001  # Use a different port
```

## License

Internal project - no license specified.
