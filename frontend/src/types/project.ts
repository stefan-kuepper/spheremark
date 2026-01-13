export interface Project {
  id: number;
  name: string;
  description: string | null;
  images_path: string;
  image_count: number;
  annotation_count: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  images_path: string;
}

export interface LabelSchema {
  id: number;
  project_id: number;
  label_name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
}
