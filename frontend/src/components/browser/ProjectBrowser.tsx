import { useState } from 'react';
import { useProjects } from '../../hooks';
import { ProjectGrid } from './ProjectGrid';
import { CreateProjectDialog } from '../dialogs/CreateProjectDialog';

export function ProjectBrowser() {
  const { projects, isLoading, error, loadProjects } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div id="project-browser">
      <div className="browser-header">
        <h1>SphereMark</h1>
        <p>Select a project or create a new one</p>
        <div className="browser-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateDialog(true)}
          >
            <span>+</span> New Project
          </button>
        </div>
      </div>

      {isLoading && (
        <div id="loading-state">
          <p>Loading projects...</p>
        </div>
      )}

      {error && (
        <div id="error-state">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadProjects}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && <ProjectGrid projects={projects} />}

      {showCreateDialog && (
        <CreateProjectDialog onClose={() => setShowCreateDialog(false)} />
      )}
    </div>
  );
}
