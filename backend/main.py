from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import load_config
from backend.database import init_database
from backend.routes import annotations, projects


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
    title="SphereMark API",
    description="Backend API for SphereMark - Annotate panoramic images with spherical bounding boxes",
    version="1.0.0",
    lifespan=lifespan,
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
app.include_router(projects.router)  # New project-scoped routes
app.include_router(annotations.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "SphereMark API", "version": "1.0.0", "docs": "/docs"}


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
        reload=True,
    )
