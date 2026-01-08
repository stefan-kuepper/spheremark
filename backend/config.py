import yaml
from pathlib import Path
from typing import Optional
from pydantic import BaseModel


class ServerConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000


class ImagesConfig(BaseModel):
    remote_path: str
    allowed_extensions: list[str] = [".jpg", ".jpeg", ".png"]


class ThumbnailsConfig(BaseModel):
    max_width: int = 256
    quality: int = 85


class DatabaseConfig(BaseModel):
    path: str = "data/annotations.db"


class ExportConfig(BaseModel):
    default_format: str = "coco"
    coordinate_precision: int = 6


class Config(BaseModel):
    server: ServerConfig
    images: ImagesConfig
    thumbnails: ThumbnailsConfig
    database: DatabaseConfig
    export: ExportConfig


_config: Optional[Config] = None


def load_config(config_path: str = "config.yaml") -> Config:
    """Load configuration from YAML file."""
    global _config

    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    with open(config_file, "r") as f:
        config_data = yaml.safe_load(f)

    _config = Config(**config_data)
    return _config


def get_config() -> Config:
    """Get the global configuration instance."""
    if _config is None:
        raise RuntimeError("Configuration not loaded. Call load_config() first.")
    return _config
