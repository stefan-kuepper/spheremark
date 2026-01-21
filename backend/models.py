from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# Project Models
# =============================================================================


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    images_path: str


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    images_path: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    images_path: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(ProjectBase):
    id: int
    images_path: str
    image_count: int = 0
    annotation_count: int = 0
    created_at: datetime


# =============================================================================
# Label Schema Models
# =============================================================================


class LabelSchemaBase(BaseModel):
    label_name: str
    color: Optional[str] = None
    sort_order: int = 0


class LabelSchemaCreate(LabelSchemaBase):
    pass


class LabelSchemaUpdate(BaseModel):
    label_name: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None


class LabelSchemaResponse(LabelSchemaBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Image Models
# =============================================================================


class ImageBase(BaseModel):
    filename: str
    filepath: str
    width: int
    height: int


class ImageCreate(ImageBase):
    project_id: int
    thumbnail_path: Optional[str] = None


class ImageResponse(ImageBase):
    id: int
    project_id: int
    thumbnail_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ImageListResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    width: int
    height: int
    thumbnail_path: Optional[str] = None
    annotation_count: int = 0


# =============================================================================
# Annotation Models
# =============================================================================


class AnnotationBase(BaseModel):
    label: Optional[str] = None
    az_min: float = Field(..., ge=0.0, le=360.0)
    alt_min: float = Field(..., ge=-90.0, le=90.0)
    az_max: float = Field(..., ge=0.0, le=360.0)
    alt_max: float = Field(..., ge=-90.0, le=90.0)
    color: Optional[str] = None

    @field_validator("az_max")
    @classmethod
    def validate_azimuth_range(cls, v, info):
        if "az_min" in info.data and v <= info.data["az_min"]:
            raise ValueError("az_max must be greater than az_min")
        return v

    @field_validator("alt_min")
    @classmethod
    def validate_altitude_range(cls, v, info):
        if "alt_max" in info.data and v >= info.data["alt_max"]:
            raise ValueError("alt_min must be less than alt_max")
        return v


class AnnotationCreateRequest(AnnotationBase):
    """Request model for creating annotations (no image_id needed in body)."""

    pass


class AnnotationCreate(AnnotationBase):
    """Internal model with image_id for service layer."""

    image_id: int


class AnnotationUpdate(BaseModel):
    label: Optional[str] = None
    az_min: Optional[float] = Field(None, ge=0.0, le=360.0)
    alt_min: Optional[float] = Field(None, ge=-90.0, le=90.0)
    az_max: Optional[float] = Field(None, ge=0.0, le=360.0)
    alt_max: Optional[float] = Field(None, ge=-90.0, le=90.0)
    color: Optional[str] = None


class AnnotationResponse(AnnotationBase):
    id: int
    image_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScanResult(BaseModel):
    scanned: int
    added: int
    skipped: int
    errors: list[str] = []
