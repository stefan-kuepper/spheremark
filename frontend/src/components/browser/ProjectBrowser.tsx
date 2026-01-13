import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <AppLayout>
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground mt-1">
                Select a project to view and annotate images
              </p>
            </div>
            <Button variant="outline" onClick={loadProjects} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="text-destructive text-center py-8">{error}</div>
          )}

          {!isLoading && !error && projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create a project to get started.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectProject(project.id)}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Folder className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {project.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {project.image_count} images · {project.annotation_count} annotations
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
