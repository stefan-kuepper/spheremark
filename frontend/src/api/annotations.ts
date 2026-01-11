import { apiFetch } from './client';
import type { AnnotationResponse, AnnotationCreate, AnnotationUpdate } from '../types';

export const annotations = {
  async listForImage(imageId: number): Promise<AnnotationResponse[]> {
    return apiFetch<AnnotationResponse[]>(`/api/images/${imageId}/annotations`);
  },

  async create(imageId: number, data: AnnotationCreate): Promise<AnnotationResponse> {
    return apiFetch<AnnotationResponse>(`/api/images/${imageId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(annotationId: number, data: AnnotationUpdate): Promise<AnnotationResponse> {
    return apiFetch<AnnotationResponse>(`/api/annotations/${annotationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(annotationId: number): Promise<void> {
    return apiFetch<void>(`/api/annotations/${annotationId}`, {
      method: 'DELETE',
    });
  },

  async listAll(): Promise<AnnotationResponse[]> {
    return apiFetch<AnnotationResponse[]>('/api/annotations');
  },
};
