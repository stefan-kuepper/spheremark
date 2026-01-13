import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useImages, useProjects } from '../../hooks';
import { ImageGrid } from './ImageGrid';

export function ImageBrowser() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, selectProject, clearProject } = useProjects();
  const { images, isLoading, isScanning, error, scanImages, loadImages, lastScanResult } =
    useImages();

  // Select project from route param
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
    <div id="image-browser">
      <div className="browser-header">
        <button className="btn btn-back" onClick={handleBack}>
          &larr; Back to Projects
        </button>
        <h1>{currentProject?.name || 'Loading...'}</h1>
        {currentProject?.description && <p>{currentProject.description}</p>}
        {!currentProject?.description && (
          <p>Select a panoramic image to label</p>
        )}
        <div className="browser-actions">
          <button
            className="btn btn-primary"
            onClick={scanImages}
            disabled={isScanning}
          >
            <span>&#x1f504;</span> {isScanning ? 'Scanning...' : 'Scan for Images'}
          </button>
        </div>
        {lastScanResult && (
          <p className="scan-result">
            Found {lastScanResult.added} new image{lastScanResult.added !== 1 ? 's' : ''}{' '}
            ({lastScanResult.skipped} already imported)
          </p>
        )}
      </div>

      {isLoading && (
        <div id="loading-state">
          <p>Loading images...</p>
        </div>
      )}

      {isScanning && (
        <div id="scanning-state">
          <p>Scanning for images...</p>
        </div>
      )}

      {error && (
        <div id="error-state">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadImages}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && <ImageGrid images={images} />}
    </div>
  );
}
