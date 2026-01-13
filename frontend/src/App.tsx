import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProjectProvider } from './contexts/ProjectContext';
import { ImageProvider } from './contexts/ImageContext';
import { AnnotationProvider } from './contexts/AnnotationContext';
import { InteractionProvider } from './contexts/InteractionContext';
import { ProjectBrowser } from './components/browser/ProjectBrowser';
import { ImageBrowser } from './components/browser/ImageBrowser';
import { ImageViewer } from './components/viewer/ImageViewer';

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <ProjectProvider>
          <ImageProvider>
            <AnnotationProvider>
              <InteractionProvider>
                <Routes>
                  <Route path="/" element={<ProjectBrowser />} />
                  <Route path="/projects/:projectId" element={<ImageBrowser />} />
                  <Route path="/projects/:projectId/images/:imageId" element={<ImageViewer />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </InteractionProvider>
            </AnnotationProvider>
          </ImageProvider>
        </ProjectProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}
