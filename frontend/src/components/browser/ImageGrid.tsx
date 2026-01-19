import { ImageCard } from './ImageCard';
import type { ImageData } from '../../types';

interface ImageGridProps {
  images: ImageData[];
}

export function ImageGrid({ images }: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="py-8 px-6 text-center text-muted-foreground">
        <p>No images found</p>
        <p className="text-sm mt-2">
          Click "Scan for Images" to discover panoramic images
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mt-6">
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
