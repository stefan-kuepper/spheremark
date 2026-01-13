import { apiFetch, getApiUrl } from './client';
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  LabelSchema,
  LabelSchemaCreate,
  LabelSchemaUpdate,
} from '../types/project';
import type { ImageData, ScanResult } from '../types';

export const projects = {
  // Project CRUD
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

  async update(projectId: number, data: ProjectUpdate): Promise<Project> {
    return apiFetch<Project>(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(projectId: number): Promise<void> {
    return apiFetch<void>(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  // Label Schema
  async getLabels(projectId: number): Promise<LabelSchema[]> {
    return apiFetch<LabelSchema[]>(`/api/projects/${projectId}/labels`);
  },

  async addLabel(projectId: number, data: LabelSchemaCreate): Promise<LabelSchema> {
    return apiFetch<LabelSchema>(`/api/projects/${projectId}/labels`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLabel(
    projectId: number,
    labelId: number,
    data: LabelSchemaUpdate
  ): Promise<LabelSchema> {
    return apiFetch<LabelSchema>(`/api/projects/${projectId}/labels/${labelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteLabel(projectId: number, labelId: number): Promise<void> {
    return apiFetch<void>(`/api/projects/${projectId}/labels/${labelId}`, {
      method: 'DELETE',
    });
  },

  // Project Images
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

  // Project Exports
  getCocoExportUrl(projectId: number): string {
    return getApiUrl(`/api/projects/${projectId}/export/coco`);
  },

  getYoloExportUrl(projectId: number): string {
    return getApiUrl(`/api/projects/${projectId}/export/yolo`);
  },
};
