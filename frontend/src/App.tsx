import { Routes, Route } from 'react-router-dom';
import { ImageProvider } from './contexts/ImageContext';
import { AnnotationProvider } from './contexts/AnnotationContext';
import { InteractionProvider } from './contexts/InteractionContext';
import { ImageBrowser } from './components/browser/ImageBrowser';
import { ImageViewer } from './components/viewer/ImageViewer';

export default function App() {
  return (
    <ImageProvider>
      <AnnotationProvider>
        <InteractionProvider>
          <Routes>
            <Route path="/" element={<ImageBrowser />} />
            <Route path="/image/:id" element={<ImageViewer />} />
          </Routes>
        </InteractionProvider>
      </AnnotationProvider>
    </ImageProvider>
  );
}
