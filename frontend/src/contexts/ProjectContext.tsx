import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { projects as projectsApi } from '../api';
import type { Project, LabelSchema } from '../types';

interface ProjectContextValue {
  projects: Project[];
  currentProjectId: number | null;
  currentProject: Project | null;
  labelSchema: LabelSchema[];
  isLoading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  selectProject: (projectId: number | null) => void;
  createProject: (name: string, description: string, imagesPath: string) => Promise<Project>;
  deleteProject: (projectId: number) => Promise<void>;
  loadLabelSchema: (projectId: number) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [labelSchema, setLabelSchema] = useState<LabelSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProject = currentProjectId
    ? projects.find((p) => p.id === currentProjectId) ?? null
    : null;

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectProject = useCallback((projectId: number | null) => {
    setCurrentProjectId(projectId);
  }, []);

  const createProject = useCallback(async (name: string, description: string, imagesPath: string): Promise<Project> => {
    const project = await projectsApi.create({ name, description, images_path: imagesPath });
    setProjects((prev) => [...prev, project]);
    return project;
  }, []);

  const deleteProject = useCallback(async (projectId: number) => {
    await projectsApi.delete(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
    }
  }, [currentProjectId]);

  const loadLabelSchema = useCallback(async (projectId: number) => {
    try {
      const labels = await projectsApi.getLabels(projectId);
      setLabelSchema(labels);
    } catch (err) {
      console.error('Failed to load label schema:', err);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load label schema when project changes
  useEffect(() => {
    if (currentProjectId) {
      loadLabelSchema(currentProjectId);
    } else {
      setLabelSchema([]);
    }
  }, [currentProjectId, loadLabelSchema]);

  const value: ProjectContextValue = {
    projects,
    currentProjectId,
    currentProject,
    labelSchema,
    isLoading,
    error,
    loadProjects,
    selectProject,
    createProject,
    deleteProject,
    loadLabelSchema,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
