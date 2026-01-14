export interface ImageData {
  id: number;
  project_id: number;
  filename: string;
  path: string;
  width: number;
  height: number;
  annotation_count: number;
  created_at: string;
}

export interface ScanResult {
  scanned: number;
  added: number;
  skipped: number;
  errors: string[];
}
