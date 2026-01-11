import { useImages } from '../../hooks';
import { ImageGrid } from './ImageGrid';

export function ImageBrowser() {
  const { images, isLoading, isScanning, error, scanImages, loadImages } = useImages();

  return (
    <div id="image-browser">
      <div className="browser-header">
        <h1>SphereMark</h1>
        <p>Select a panoramic image to label</p>
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

      {!isLoading && !error && <ImageGrid images={images} />}
    </div>
  );
}
