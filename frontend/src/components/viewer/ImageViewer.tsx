import { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects, useImages } from '@/hooks';
import { AppLayout } from '@/components/layout/AppLayout';
import { PanoramaCanvas } from './PanoramaCanvas';
import type { BoundingBox } from '@/types';
import type { CameraControllerHandle } from '@/viewer/CameraController';

export function ImageViewer() {
  const { projectId, imageId } = useParams();
  const { selectProject } = useProjects();
  const { selectImage } = useImages();
  const cameraRef = useRef<CameraControllerHandle>(null);

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

  const handleFocusBox = useCallback((box: BoundingBox) => {
    cameraRef.current?.focusOnBox(box);
  }, []);

  return (
    <AppLayout showLeftSidebar showRightSidebar onFocusBox={handleFocusBox}>
      <PanoramaCanvas cameraRef={cameraRef} />
    </AppLayout>
  );
}
