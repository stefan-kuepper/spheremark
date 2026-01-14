import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useImages, useProjects } from '../../hooks';
import { PanoramaViewer } from './PanoramaViewer';

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

  // Select project from route param
  useEffect(() => {
    if (projectIdNum !== null) {
      selectProject(projectIdNum);
    }
  }, [projectIdNum, selectProject]);

  // Select image from route param
  useEffect(() => {
    if (imageId !== null && imageExists) {
      selectImage(imageId);
    }
  }, [imageId, imageExists, selectImage]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (imageId === null || !imageExists) {
    return (
      <div className="error-page">
        <h2>Image not found</h2>
        <p>The requested image does not exist.</p>
        <Link to={projectIdNum ? `/projects/${projectIdNum}` : '/'}>
          Back to Image Browser
        </Link>
      </div>
    );
  }

  return <PanoramaViewer />;
}
