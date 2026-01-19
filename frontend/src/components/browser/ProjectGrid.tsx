import { ProjectCard } from './ProjectCard';
import type { Project } from '../../types';

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="py-8 px-6 text-center text-muted-foreground">
        <p>No projects yet. Create your first project to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 mt-6">
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
