import { apiFetch, getApiUrl } from './client';
import type { ImageData, ScanResult } from '../types';

export const images = {
  async list(): Promise<ImageData[]> {
    return apiFetch<ImageData[]>('/api/images');
  },

  async get(imageId: number): Promise<ImageData> {
    return apiFetch<ImageData>(`/api/images/${imageId}`);
  },

  getFileUrl(imageId: number): string {
    return getApiUrl(`/api/images/${imageId}/file`);
  },

  getThumbnailUrl(imageId: number): string {
    return getApiUrl(`/api/images/${imageId}/thumbnail`);
  },

  async scan(): Promise<ScanResult> {
    return apiFetch<ScanResult>('/api/images/scan', {
      method: 'POST',
    });
  },
};
