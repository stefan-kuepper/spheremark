import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks';

export function ProjectBrowser() {
  const navigate = useNavigate();
  const { projects, isLoading, error, loadProjects, selectProject } = useProjects();

  useEffect(() => {
    selectProject(null);
  }, [selectProject]);

  const handleSelectProject = (projectId: number) => {
    selectProject(projectId);
    navigate(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={loadProjects}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Projects</h1>
        <p className="text-muted-foreground mb-8">Select a project to view and annotate images</p>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className="p-6 border rounded-lg cursor-pointer hover:border-primary transition-colors bg-card"
              >
                <h2 className="text-lg font-semibold mb-2">{project.name}</h2>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                )}
                <div className="text-sm text-muted-foreground">
                  {project.image_count} images · {project.annotation_count} annotations
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
