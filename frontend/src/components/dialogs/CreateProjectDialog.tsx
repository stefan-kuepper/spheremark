import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks';

interface CreateProjectDialogProps {
  onClose: () => void;
}

export function CreateProjectDialog({ onClose }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const { createProject, selectProject } = useProjects();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imagesPath, setImagesPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!imagesPath.trim()) {
      setError('Images path is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        images_path: imagesPath.trim(),
      });

      selectProject(project.id);
      navigate(`/projects/${project.id}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick}>
      <div className="dialog">
        <div className="dialog-header">
          <h2>Create New Project</h2>
          <button className="dialog-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-content">
            <div className="form-group">
              <label htmlFor="project-name">Project Name *</label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Panorama Project"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="project-description">Description</label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="images-path">Images Path *</label>
              <input
                id="images-path"
                type="text"
                value={imagesPath}
                onChange={(e) => setImagesPath(e.target.value)}
                placeholder="/path/to/panorama/images"
              />
              <p className="form-hint">
                Server-side path to the directory containing panoramic images
              </p>
            </div>

            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="dialog-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
