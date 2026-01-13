import { useNavigate, useParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImages } from '@/hooks';

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const { projectId, imageId } = useParams();
  const navigate = useNavigate();
  const { images, getThumbnailUrl } = useImages();

  if (!isOpen) return null;

  const handleImageClick = (id: number) => {
    navigate(`/projects/${projectId}/images/${id}`);
  };

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
      <div className="h-12 px-4 flex items-center justify-between border-b border-border">
        <span className="font-semibold text-sm">Images</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {images.map((image) => {
            const isSelected = image.id === Number(imageId);
            return (
              <button
                key={image.id}
                onClick={() => handleImageClick(image.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                <img
                  src={getThumbnailUrl(image.id)}
                  alt={image.filename}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{image.filename}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {image.annotation_count} annotations
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
