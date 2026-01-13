import { useImages } from '../../hooks';

interface ImageCardProps {
  id: number;
  filename: string;
  annotationCount: number;
  onSelect?: (imageId: number) => void;
}

export function ImageCard({ id, filename, annotationCount, onSelect }: ImageCardProps) {
  const { getThumbnailUrl } = useImages();

  const handleClick = () => {
    onSelect?.(id);
  };

  return (
    <div className="image-card" onClick={handleClick}>
      <div className="image-thumbnail">
        <img src={getThumbnailUrl(id)} alt={filename} loading="lazy" />
      </div>
      <div className="image-info">
        <p className="image-name" title={filename}>
          {filename}
        </p>
        <p className="annotation-count">
          {annotationCount} annotation{annotationCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
