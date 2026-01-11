export interface ImageData {
  id: number;
  filename: string;
  path: string;
  width: number;
  height: number;
  annotation_count: number;
  created_at: string;
}

export interface ScanResult {
  new_images: number;
  total_images: number;
}
