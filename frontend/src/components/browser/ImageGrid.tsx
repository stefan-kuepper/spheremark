import { ImageCard } from './ImageCard';
import type { ImageData } from '../../types';

interface ImageGridProps {
  images: ImageData[];
}

export function ImageGrid({ images }: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div id="empty-state" className="browser-empty">
        <p>No images found</p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
          Click "Scan for Images" to discover panoramic images
        </p>
      </div>
    );
  }

  return (
    <div id="image-grid">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          id={image.id}
          filename={image.filename}
          annotationCount={image.annotation_count}
        />
      ))}
    </div>
  );
}
