import { ImageProvider } from './contexts/ImageContext';
import { AnnotationProvider } from './contexts/AnnotationContext';
import { InteractionProvider } from './contexts/InteractionContext';
import { ImageBrowser } from './components/browser/ImageBrowser';
import { PanoramaViewer } from './components/viewer/PanoramaViewer';
import { useImages } from './hooks/useImages';

function AppContent() {
  const { currentImageId } = useImages();

  if (!currentImageId) {
    return <ImageBrowser />;
  }

  return <PanoramaViewer />;
}

export default function App() {
  return (
    <ImageProvider>
      <AnnotationProvider>
        <InteractionProvider>
          <AppContent />
        </InteractionProvider>
      </AnnotationProvider>
    </ImageProvider>
  );
}
