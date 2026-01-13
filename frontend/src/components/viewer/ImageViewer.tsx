import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects, useImages } from '@/hooks';
import { PanoramaViewer } from './PanoramaViewer';

export function ImageViewer() {
  const { projectId, imageId } = useParams();
  const { selectProject } = useProjects();
  const { selectImage } = useImages();

  useEffect(() => {
    if (projectId) {
      selectProject(Number(projectId));
    }
  }, [projectId, selectProject]);

  useEffect(() => {
    if (imageId) {
      selectImage(Number(imageId));
    }
  }, [imageId, selectImage]);

  return <PanoramaViewer />;
}
