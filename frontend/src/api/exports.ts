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
  async exportCoco(projectId: number): Promise<CocoExport> {
    return apiFetch<CocoExport>(`/api/projects/${projectId}/export/coco`);
  },

  async exportCocoImage(projectId: number, imageId: number): Promise<CocoExport> {
    return apiFetch<CocoExport>(`/api/projects/${projectId}/export/coco/${imageId}`);
  },

  async exportYolo(projectId: number): Promise<YoloExport> {
    return apiFetch<YoloExport>(`/api/projects/${projectId}/export/yolo`);
  },

  async exportYoloImage(projectId: number, imageId: number): Promise<YoloExport> {
    return apiFetch<YoloExport>(`/api/projects/${projectId}/export/yolo/${imageId}`);
  },

  getYoloTxtUrl(projectId: number, imageId: number): string {
    return getApiUrl(`/api/projects/${projectId}/export/yolo/${imageId}/txt`);
  },

  getYoloClassesUrl(projectId: number): string {
    return getApiUrl(`/api/projects/${projectId}/export/yolo/classes.txt`);
  },
};
