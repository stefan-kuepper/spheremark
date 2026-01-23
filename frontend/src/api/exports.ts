import { apiFetch } from './client';

// COCO export response type
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

export const exports = {
  async exportCoco(projectId: number): Promise<CocoExport> {
    return apiFetch<CocoExport>(`/api/projects/${projectId}/export/coco`);
  },

  async exportCocoImage(projectId: number, imageId: number): Promise<CocoExport> {
    return apiFetch<CocoExport>(`/api/projects/${projectId}/export/coco/${imageId}`);
  },
};
