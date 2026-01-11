import { apiFetch, getApiUrl } from './client';

// COCO and YOLO export response types
export interface CocoExport {
  images: Array<{
    id: number;
    file_name: string;
    width: number;
    height: number;
  }>;
  annotations: Array<{
    id: number;
    image_id: number;
    category_id: number;
    spherical_bbox: {
      phi_min: number;
      phi_max: number;
      theta_min: number;
      theta_max: number;
    };
  }>;
  categories: Array<{
    id: number;
    name: string;
  }>;
}

export interface YoloExport {
  images: Array<{
    image_id: number;
    filename: string;
    annotations: string[];
  }>;
  classes: string[];
}

export const exports = {
  async exportCoco(): Promise<CocoExport> {
    return apiFetch<CocoExport>('/api/export/coco');
  },

  async exportCocoImage(imageId: number): Promise<CocoExport> {
    return apiFetch<CocoExport>(`/api/export/coco/${imageId}`);
  },

  async exportYolo(): Promise<YoloExport> {
    return apiFetch<YoloExport>('/api/export/yolo');
  },

  async exportYoloImage(imageId: number): Promise<YoloExport> {
    return apiFetch<YoloExport>(`/api/export/yolo/${imageId}`);
  },

  getYoloTxtUrl(imageId: number): string {
    return getApiUrl(`/api/export/yolo/${imageId}/txt`);
  },

  getYoloClassesUrl(): string {
    return getApiUrl('/api/export/yolo/classes.txt');
  },
};
