import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useImages, useProjects } from '../../hooks';
import { ImageGrid } from './ImageGrid';
import { Button } from '@/components/ui/button';

export function ImageBrowser() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, selectProject, clearProject } = useProjects();
  const { images, isLoading, isScanning, error, scanImages, loadImages, lastScanResult } =
    useImages();

  useEffect(() => {
    if (projectId) {
      selectProject(parseInt(projectId, 10));
    }
  }, [projectId, selectProject]);

  const handleBack = () => {
    clearProject();
    navigate('/');
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 p-8 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-[100] max-w-[90vw] max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
        <h1 className="text-3xl font-bold mb-2 text-card-foreground">
          {currentProject?.name || 'Loading...'}
        </h1>
        {currentProject?.description && (
          <p className="text-muted-foreground leading-relaxed mb-4">
            {currentProject.description}
          </p>
        )}
        {!currentProject?.description && (
          <p className="text-muted-foreground leading-relaxed mb-4">
            Select a panoramic image to label
          </p>
        )}
        <div className="flex gap-2 justify-center mt-4">
          <Button onClick={scanImages} disabled={isScanning}>
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan for Images'}
          </Button>
        </div>
        {lastScanResult && (
          <p className="text-sm text-muted-foreground mt-4">
            Found {lastScanResult.added} new image{lastScanResult.added !== 1 ? 's' : ''}{' '}
            ({lastScanResult.skipped} already imported)
          </p>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Loading images...</p>
        </div>
      )}

      {isScanning && (
        <div className="text-center py-8 text-primary font-medium">
          <p>Scanning for images...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadImages}>Retry</Button>
        </div>
      )}

      {!isLoading && !error && <ImageGrid images={images} />}
    </div>
  );
}
