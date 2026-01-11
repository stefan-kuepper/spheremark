export interface UVCoordinate {
  u: number; // 0.0 - 1.0 (longitude)
  v: number; // 0.0 - 1.0 (latitude)
}

export interface BoundingBox {
  id: number | string; // Server ID or "local-N" for unsaved boxes
  serverId: number | null;
  uvMin: UVCoordinate;
  uvMax: UVCoordinate;
  label: string;
  color: string;
  createdAt: number;
}

export interface AnnotationResponse {
  id: number;
  image_id: number;
  label: string | null;
  uv_min_u: number;
  uv_min_v: number;
  uv_max_u: number;
  uv_max_v: number;
  color: string;
  created_at: string;
}

export interface AnnotationCreate {
  label: string;
  uv_min_u: number;
  uv_min_v: number;
  uv_max_u: number;
  uv_max_v: number;
  color: string;
}

export interface AnnotationUpdate {
  label: string;
  uv_min_u: number;
  uv_min_v: number;
  uv_max_u: number;
  uv_max_v: number;
  color: string;
}
