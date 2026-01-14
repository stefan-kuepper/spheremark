import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks';

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
    <div className="project-card" onClick={handleClick}>
      <div className="project-icon">
        <span>&#128193;</span>
      </div>
      <div className="project-info">
        <h3 className="project-name" title={name}>
          {name}
        </h3>
        {description && (
          <p className="project-description" title={description}>
            {description}
          </p>
        )}
        <div className="project-stats">
          <span className="stat">
            {imageCount} image{imageCount !== 1 ? 's' : ''}
          </span>
          <span className="stat">
            {annotationCount} annotation{annotationCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
