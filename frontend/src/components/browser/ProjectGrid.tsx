import { ProjectCard } from './ProjectCard';
import type { Project } from '../../types';

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div id="empty-state">
        <p>No projects yet. Create your first project to get started!</p>
      </div>
    );
  }

  return (
    <div className="project-grid">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          name={project.name}
          description={project.description}
          imageCount={project.image_count}
          annotationCount={project.annotation_count}
        />
      ))}
    </div>
  );
}
