import { useNavigate } from 'react-router-dom';
import { useImages } from '../../hooks';

interface ImageCardProps {
  id: number;
  filename: string;
  annotationCount: number;
}

export function ImageCard({ id, filename, annotationCount }: ImageCardProps) {
  const { getThumbnailUrl } = useImages();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/image/${id}`);
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
