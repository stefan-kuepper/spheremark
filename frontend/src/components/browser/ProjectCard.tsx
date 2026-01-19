import { useNavigate } from 'react-router-dom';
import { Folder } from 'lucide-react';
import { useProjects } from '../../hooks';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectCardProps {
  id: number;
  name: string;
  description: string | null;
  imageCount: number;
  annotationCount: number;
}

export function ProjectCard({
  id,
  name,
  description,
  imageCount,
  annotationCount,
}: ProjectCardProps) {
  const navigate = useNavigate();
  const { selectProject } = useProjects();

  const handleClick = () => {
    selectProject(id);
    navigate(`/projects/${id}`);
  };

  return (
    <Card
      className="cursor-pointer hover:border-primary hover:-translate-y-0.5 hover:shadow-md"
      onClick={handleClick}
    >
      <CardContent className="p-4 flex gap-4">
        <div className="text-4xl text-primary flex-shrink-0">
          <Folder className="h-10 w-10" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-card-foreground truncate"
            title={name}
          >
            {name}
          </h3>
          {description && (
            <p
              className="text-sm text-muted-foreground truncate mt-1"
              title={description}
            >
              {description}
            </p>
          )}
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>
              {imageCount} image{imageCount !== 1 ? 's' : ''}
            </span>
            <span>
              {annotationCount} annotation{annotationCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
