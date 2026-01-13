import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { projects as projectsApi } from '../api';
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  LabelSchema,
  LabelSchemaCreate,
  LabelSchemaUpdate,
} from '../types';

interface ProjectContextValue {
  projects: Project[];
  currentProjectId: number | null;
  currentProject: Project | null;
  labelSchema: LabelSchema[];
  isLoading: boolean;
  error: string | null;

  // Project management
  loadProjects: () => Promise<void>;
  selectProject: (projectId: number) => void;
  clearProject: () => void;
  createProject: (data: ProjectCreate) => Promise<Project>;
  updateProject: (projectId: number, data: ProjectUpdate) => Promise<void>;
  deleteProject: (projectId: number) => Promise<void>;

  // Label schema management
  loadLabelSchema: (projectId: number) => Promise<void>;
  addLabel: (data: LabelSchemaCreate) => Promise<LabelSchema>;
  updateLabel: (labelId: number, data: LabelSchemaUpdate) => Promise<void>;
  deleteLabel: (labelId: number) => Promise<void>;
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

  // Project management
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

  const selectProject = useCallback((projectId: number) => {
    setCurrentProjectId(projectId);
  }, []);

  const clearProject = useCallback(() => {
    setCurrentProjectId(null);
    setLabelSchema([]);
  }, []);

  const createProject = useCallback(
    async (data: ProjectCreate): Promise<Project> => {
      const project = await projectsApi.create(data);
      await loadProjects();
      return project;
    },
    [loadProjects]
  );

  const updateProject = useCallback(
    async (projectId: number, data: ProjectUpdate) => {
      await projectsApi.update(projectId, data);
      await loadProjects();
    },
    [loadProjects]
  );

  const deleteProject = useCallback(
    async (projectId: number) => {
      await projectsApi.delete(projectId);
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setLabelSchema([]);
      }
      await loadProjects();
    },
    [currentProjectId, loadProjects]
  );

  // Label schema management
  const loadLabelSchema = useCallback(async (projectId: number) => {
    try {
      const data = await projectsApi.getLabels(projectId);
      setLabelSchema(data);
    } catch (err) {
      console.error('Failed to load label schema:', err);
      setLabelSchema([]);
    }
  }, []);

  const addLabel = useCallback(
    async (data: LabelSchemaCreate): Promise<LabelSchema> => {
      if (!currentProjectId) {
        throw new Error('No project selected');
      }
      const label = await projectsApi.addLabel(currentProjectId, data);
      await loadLabelSchema(currentProjectId);
      return label;
    },
    [currentProjectId, loadLabelSchema]
  );

  const updateLabel = useCallback(
    async (labelId: number, data: LabelSchemaUpdate) => {
      if (!currentProjectId) {
        throw new Error('No project selected');
      }
      await projectsApi.updateLabel(currentProjectId, labelId, data);
      await loadLabelSchema(currentProjectId);
    },
    [currentProjectId, loadLabelSchema]
  );

  const deleteLabel = useCallback(
    async (labelId: number) => {
      if (!currentProjectId) {
        throw new Error('No project selected');
      }
      await projectsApi.deleteLabel(currentProjectId, labelId);
      await loadLabelSchema(currentProjectId);
    },
    [currentProjectId, loadLabelSchema]
  );

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
    clearProject,
    createProject,
    updateProject,
    deleteProject,
    loadLabelSchema,
    addLabel,
    updateLabel,
    deleteLabel,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjects(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
