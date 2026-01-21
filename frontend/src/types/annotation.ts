export interface GeoCoordinate {
  azimuth: number; // 0-360 degrees (0=north)
  altitude: number; // -90 to 90 degrees (0=horizon)
}

export interface BoundingBox {
  id: number | string; // Server ID or "local-N" for unsaved boxes
  serverId: number | null;
  geoMin: GeoCoordinate; // min azimuth, min altitude
  geoMax: GeoCoordinate; // max azimuth, max altitude
  label: string;
  color: string;
  createdAt: number;
}

export interface AnnotationResponse {
  id: number;
  image_id: number;
  label: string | null;
  az_min: number;
  alt_min: number;
  az_max: number;
  alt_max: number;
  color: string;
  created_at: string;
}

export interface AnnotationCreate {
  label: string;
  az_min: number;
  alt_min: number;
  az_max: number;
  alt_max: number;
  color: string;
}

export interface AnnotationUpdate {
  label: string;
  az_min: number;
  alt_min: number;
  az_max: number;
  alt_max: number;
  color: string;
}
