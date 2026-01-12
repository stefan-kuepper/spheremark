import { useImages } from '../../hooks';

interface ImageCardProps {
  id: number;
  filename: string;
  annotationCount: number;
}

export function ImageCard({ id, filename, annotationCount }: ImageCardProps) {
  const { selectImage, getThumbnailUrl } = useImages();

  const handleClick = () => {
    selectImage(id);
  };

  return (
    <div className="image-card" onClick={handleClick} data-testid={`image-card-${id}`}>
      <div className="image-thumbnail">
        <img src={getThumbnailUrl(id)} alt={filename} loading="lazy" />
      </div>
      <div className="image-info" data-testid={`image-info-${id}`}>
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
