from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ImageBase(BaseModel):
    filename: str
    filepath: str
    width: int
    height: int


class ImageCreate(ImageBase):
    thumbnail_path: Optional[str] = None


class ImageResponse(ImageBase):
    id: int
    thumbnail_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ImageListResponse(BaseModel):
    id: int
    filename: str
    width: int
    height: int
    thumbnail_path: Optional[str] = None
    annotation_count: int = 0


class AnnotationBase(BaseModel):
    label: Optional[str] = None
    uv_min_u: float = Field(..., ge=0.0, le=1.0)
    uv_min_v: float = Field(..., ge=0.0, le=1.0)
    uv_max_u: float = Field(..., ge=0.0, le=1.0)
    uv_max_v: float = Field(..., ge=0.0, le=1.0)
    color: Optional[str] = None

    @field_validator("uv_max_u")
    @classmethod
    def validate_u_range(cls, v, info):
        if "uv_min_u" in info.data and v <= info.data["uv_min_u"]:
            raise ValueError("uv_max_u must be greater than uv_min_u")
        return v

    @field_validator("uv_max_v")
    @classmethod
    def validate_v_range(cls, v, info):
        if "uv_min_v" in info.data and v <= info.data["uv_min_v"]:
            raise ValueError("uv_max_v must be greater than uv_min_v")
        return v


class AnnotationCreateRequest(AnnotationBase):
    """Request model for creating annotations (no image_id needed in body)."""

    pass


class AnnotationCreate(AnnotationBase):
    """Internal model with image_id for service layer."""

    image_id: int


class AnnotationUpdate(BaseModel):
    label: Optional[str] = None
    uv_min_u: Optional[float] = Field(None, ge=0.0, le=1.0)
    uv_min_v: Optional[float] = Field(None, ge=0.0, le=1.0)
    uv_max_u: Optional[float] = Field(None, ge=0.0, le=1.0)
    uv_max_v: Optional[float] = Field(None, ge=0.0, le=1.0)
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
