import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImages, useProjects } from '../../hooks';
import { cn } from '@/lib/utils';

export function ImageSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProjectId } = useProjects();
  const { images, currentImageId, getThumbnailUrl } = useImages();

  const currentIndex = images.findIndex((img) => img.id === currentImageId);

  const handleImageClick = (imageId: number) => {
    const targetProjectId = projectId || currentProjectId;
    if (targetProjectId) {
      navigate(`/projects/${targetProjectId}/images/${imageId}`);
    }
  };

  const handlePrevImage = () => {
    if (currentIndex > 0) {
      handleImageClick(images[currentIndex - 1].id);
    }
  };

  const handleNextImage = () => {
    if (currentIndex < images.length - 1) {
      handleImageClick(images[currentIndex + 1].id);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images]);

  if (collapsed) {
    return (
      <div className="fixed top-0 left-0 h-screen z-50 flex flex-col">
        <Button
          variant="secondary"
          size="icon"
          className="m-2 h-10 w-10 bg-white/95 shadow-md hover:bg-white"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-48 h-screen bg-white/95 shadow-[2px_0_10px_rgba(0,0,0,0.1)] z-50 flex flex-col">
      <div className="p-3 border-b border-border flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-card-foreground">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 p-2 border-b border-border bg-white">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handlePrevImage}
          disabled={currentIndex <= 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleNextImage}
          disabled={currentIndex >= images.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {images.map((image, index) => {
            const isCurrent = image.id === currentImageId;
            const isUpcoming = index > currentIndex;

            return (
              <button
                key={image.id}
                onClick={() => handleImageClick(image.id)}
                className={cn(
                  'w-full rounded-lg overflow-hidden border-2 transition-all hover:border-primary/50',
                  isCurrent
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent'
                )}
              >
                <div className="relative aspect-video bg-muted">
                  <img
                    src={getThumbnailUrl(image.id)}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-primary/10" />
                  )}
                  <div
                    className={cn(
                      'absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-xs truncate',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-black/60 text-white'
                    )}
                  >
                    {image.filename}
                  </div>
                  {image.annotation_count > 0 && (
                    <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {image.annotation_count}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
