import { useNavigate } from 'react-router-dom';
import { useImages, useProjects } from '../../hooks';
import { Card, CardContent } from '@/components/ui/card';

interface ImageCardProps {
  id: number;
  filename: string;
  annotationCount: number;
}

export function ImageCard({ id, filename, annotationCount }: ImageCardProps) {
  const { getThumbnailUrl, selectImage } = useImages();
  const { currentProjectId } = useProjects();
  const navigate = useNavigate();

  const handleClick = () => {
    selectImage(id);
    navigate(`/projects/${currentProjectId}/images/${id}`);
  };

  return (
    <Card
      className="cursor-pointer hover:border-primary hover:-translate-y-0.5 hover:shadow-md overflow-hidden"
      onClick={handleClick}
    >
      <div className="w-full h-[150px] overflow-hidden">
        <img
          src={getThumbnailUrl(id)}
          alt={filename}
          loading="lazy"
          className="w-full h-full object-cover block"
        />
      </div>
      <CardContent className="p-3">
        <p className="text-sm font-medium text-card-foreground truncate" title={filename}>
          {filename}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {annotationCount} annotation{annotationCount !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
