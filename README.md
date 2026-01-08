# Panoramic Image Labeling Tool

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

**Phase 2: Annotation Backend** - PENDING
**Phase 3: Frontend Modularization** - PENDING
**Phase 4: New UI Features** - PENDING
**Phase 5: Testing & Deployment** - PENDING

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+ (for frontend, Phase 3+)
- Access to panoramic images directory

### Installation

1. Clone or navigate to the project directory:
```bash
cd /home/stefan/Projekte/pano_labeler
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure the application:
Edit `config.yaml` to set your panoramic images directory:
```yaml
images:
  remote_path: "/path/to/your/panoramas"  # Update this path
```

### Running the Server

```bash
python -m backend.main
```

The server will start on `http://0.0.0.0:8000`

Access the API documentation at `http://localhost:8000/docs`

## API Endpoints (Phase 1)

### Images

- `GET /api/images` - List all images with annotation counts
- `GET /api/images/{id}` - Get image details
- `GET /api/images/{id}/file` - Serve full resolution image
- `GET /api/images/{id}/thumbnail` - Serve thumbnail
- `POST /api/images/scan` - Scan remote directory for new images

### Health

- `GET /` - API information
- `GET /health` - Health check

## Testing Phase 1

1. Start the server:
```bash
python -m backend.main
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

5. Access API documentation:
Open `http://localhost:8000/docs` in your browser

## Project Structure

```
pano_labeler/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration loader
│   ├── database.py          # SQLite database
│   ├── models.py            # Pydantic models
│   ├── services/
│   │   └── image_service.py # Image operations
│   ├── routes/
│   │   └── images.py        # Image endpoints
│   └── utils/               # Utilities (Phase 2+)
├── data/
│   ├── annotations.db       # SQLite database (created at runtime)
│   └── thumbnails/          # Generated thumbnails
├── frontend/                # Frontend (Phase 3+)
├── config.yaml              # Configuration
├── requirements.txt         # Python dependencies
└── README.md               # This file
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
