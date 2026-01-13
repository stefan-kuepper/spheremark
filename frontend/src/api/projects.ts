import { apiFetch, getApiUrl } from './client';
import type { Project, ProjectCreate, LabelSchema } from '../types/project';
import type { ImageData, ScanResult } from '../types';

export const projects = {
  async list(): Promise<Project[]> {
    return apiFetch<Project[]>('/api/projects');
  },

  async get(projectId: number): Promise<Project> {
    return apiFetch<Project>(`/api/projects/${projectId}`);
  },

  async create(data: ProjectCreate): Promise<Project> {
    return apiFetch<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(projectId: number, data: Partial<ProjectCreate>): Promise<Project> {
    return apiFetch<Project>(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(projectId: number): Promise<void> {
    await apiFetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  // Project images
  async listImages(projectId: number): Promise<ImageData[]> {
    return apiFetch<ImageData[]>(`/api/projects/${projectId}/images`);
  },

  async getImage(projectId: number, imageId: number): Promise<ImageData> {
    return apiFetch<ImageData>(`/api/projects/${projectId}/images/${imageId}`);
  },

  getImageFileUrl(projectId: number, imageId: number): string {
    return getApiUrl(`/api/projects/${projectId}/images/${imageId}/file`);
  },

  getThumbnailUrl(projectId: number, imageId: number): string {
    return getApiUrl(`/api/projects/${projectId}/images/${imageId}/thumbnail`);
  },

  async scanImages(projectId: number): Promise<ScanResult> {
    return apiFetch<ScanResult>(`/api/projects/${projectId}/scan`, {
      method: 'POST',
    });
  },

  // Label schema
  async getLabels(projectId: number): Promise<LabelSchema[]> {
    return apiFetch<LabelSchema[]>(`/api/projects/${projectId}/labels`);
  },

  async addLabel(projectId: number, data: { label_name: string; color?: string }): Promise<LabelSchema> {
    return apiFetch<LabelSchema>(`/api/projects/${projectId}/labels`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLabel(projectId: number, labelId: number, data: { label_name?: string; color?: string }): Promise<LabelSchema> {
    return apiFetch<LabelSchema>(`/api/projects/${projectId}/labels/${labelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteLabel(projectId: number, labelId: number): Promise<void> {
    await apiFetch(`/api/projects/${projectId}/labels/${labelId}`, {
      method: 'DELETE',
    });
  },
};
