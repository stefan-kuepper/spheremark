import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProjects } from '../../hooks';
import { ProjectGrid } from './ProjectGrid';
import { CreateProjectDialog } from '../dialogs/CreateProjectDialog';
import { Button } from '@/components/ui/button';

export function ProjectBrowser() {
  const { projects, isLoading, error, loadProjects } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 p-8 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-[100] max-w-[90vw] max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-card-foreground">SphereMark</h1>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Select a project or create a new one
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Loading projects...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadProjects}>Retry</Button>
        </div>
      )}

      {!isLoading && !error && <ProjectGrid projects={projects} />}

      {showCreateDialog && (
        <CreateProjectDialog onClose={() => setShowCreateDialog(false)} />
      )}
    </div>
  );
}
