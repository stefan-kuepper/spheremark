from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.config import load_config, get_config
from backend.database import init_database
from backend.routes import images, annotations, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    config = load_config()
    init_database(config.database.path)
    print(f"Database initialized at: {config.database.path}")
    print(f"Server starting on {config.server.host}:{config.server.port}")

    yield

    # Shutdown
    print("Server shutting down")


app = FastAPI(
    title="Panoramic Image Labeling API",
    description="Backend API for panoramic image annotation with spherical bounding boxes",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(images.router)
app.include_router(annotations.router)
app.include_router(export.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Panoramic Image Labeling API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    config = load_config()
    uvicorn.run(
        "backend.main:app",
        host=config.server.host,
        port=config.server.port,
        reload=True
    )
