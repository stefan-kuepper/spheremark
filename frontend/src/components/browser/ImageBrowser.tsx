import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects, useImages } from '@/hooks';
import { ImageGrid } from './ImageGrid';

export function ImageBrowser() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectProject, currentProject } = useProjects();
  const { images, isLoading, isScanning, error, scanImages, loadImages } = useImages();

  useEffect(() => {
    if (projectId) {
      selectProject(Number(projectId));
    }
  }, [projectId, selectProject]);

  const handleImageSelect = (imageId: number) => {
    navigate(`/projects/${projectId}/images/${imageId}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div id="image-browser">
      <div className="browser-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
            title="Back to Projects"
          >
            &#x2190;
          </button>
          <div>
            <h1>{currentProject?.name || 'Images'}</h1>
            <p>Select a panoramic image to label</p>
          </div>
        </div>
        <div className="browser-actions">
          <button
            className="btn btn-primary"
            onClick={scanImages}
            disabled={isScanning}
          >
            <span>&#x1f504;</span> {isScanning ? 'Scanning...' : 'Scan for Images'}
          </button>
        </div>
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

      {!isLoading && !error && <ImageGrid images={images} onImageSelect={handleImageSelect} />}
    </div>
  );
}
