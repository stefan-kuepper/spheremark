import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScanSearch } from 'lucide-react';
import { useImages, useProjects } from '../../hooks';
import { ProjectSidebar } from '../layout/ProjectSidebar';
import { ExportDialog } from '../dialogs/ExportDialog';
import { Button } from '@/components/ui/button';

const LAST_IMAGE_KEY = 'spheremark_last_image';

function getLastImageId(projectId: number): number | null {
  try {
    const stored = localStorage.getItem(LAST_IMAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data[projectId] || null;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

export function saveLastImageId(projectId: number, imageId: number): void {
  try {
    const stored = localStorage.getItem(LAST_IMAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[projectId] = imageId;
    localStorage.setItem(LAST_IMAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

export function ProjectViewer() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { selectProject, currentProjectId } = useProjects();
  const { images, isLoading, isScanning, scanImages } = useImages();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const numericProjectId = projectId ? parseInt(projectId, 10) : null;

  // Ensure project is selected
  useEffect(() => {
    if (numericProjectId && numericProjectId !== currentProjectId) {
      selectProject(numericProjectId);
    }
  }, [numericProjectId, currentProjectId, selectProject]);

  // Redirect to appropriate image once images are loaded
  useEffect(() => {
    if (isLoading || !numericProjectId) return;

    if (images.length > 0) {
      // Check for last viewed image
      const lastImageId = getLastImageId(numericProjectId);
      const targetImage = lastImageId
        ? images.find((img) => img.id === lastImageId)
        : null;

      const imageId = targetImage ? targetImage.id : images[0].id;
      navigate(`/projects/${numericProjectId}/images/${imageId}`, { replace: true });
    }
    // If no images, stay on this route and show empty state with sidebar
  }, [images, isLoading, numericProjectId, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  // Empty state - show sidebar and empty canvas
  if (images.length === 0) {
    return (
      <>
        <div className="fixed inset-0 bg-muted/30 flex items-center justify-center">
          <div className="text-center p-8 bg-white/95 rounded-xl shadow-lg max-w-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              No Images Yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Scan for panoramic images to start annotating.
            </p>
            <Button
              onClick={() => scanImages()}
              disabled={isScanning}
            >
              <ScanSearch className="h-4 w-4 mr-2" />
              {isScanning ? 'Scanning...' : 'Scan for Images'}
            </Button>
          </div>
        </div>
        <ProjectSidebar onExportClick={() => setExportDialogOpen(true)} />
        <ExportDialog
          isOpen={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
        />
      </>
    );
  }

  // This shouldn't render as we redirect above, but just in case
  return null;
}
