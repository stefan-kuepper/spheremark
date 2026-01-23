import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useImages, useProjects } from '../../hooks';
import { PanoramaViewer } from './PanoramaViewer';
import { saveLastImageId } from './ProjectViewer';

export function ImageViewer() {
  const { projectId, imageId: imageIdParam } = useParams<{
    projectId: string;
    imageId: string;
  }>();
  const { selectProject } = useProjects();
  const { images, isLoading, selectImage } = useImages();

  const projectIdNum = projectId ? parseInt(projectId, 10) : null;
  const imageId = imageIdParam ? parseInt(imageIdParam, 10) : null;
  const imageExists = imageId !== null && images.some((img) => img.id === imageId);

  useEffect(() => {
    if (projectIdNum !== null) {
      selectProject(projectIdNum);
    }
  }, [projectIdNum, selectProject]);

  useEffect(() => {
    if (imageId !== null && imageExists) {
      selectImage(imageId);
    }
  }, [imageId, imageExists, selectImage]);

  // Save last viewed image for this project
  useEffect(() => {
    if (projectIdNum !== null && imageId !== null && imageExists) {
      saveLastImageId(projectIdNum, imageId);
    }
  }, [projectIdNum, imageId, imageExists]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground text-lg">
        Loading...
      </div>
    );
  }

  if (imageId === null || !imageExists) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center text-white">
        <h2 className="text-2xl font-semibold mb-2">Image not found</h2>
        <p className="text-muted-foreground mb-4">The requested image does not exist.</p>
        <Link
          to={projectIdNum ? `/projects/${projectIdNum}` : '/'}
          className="text-primary hover:underline"
        >
          Back to Image Browser
        </Link>
      </div>
    );
  }

  return <PanoramaViewer />;
}
