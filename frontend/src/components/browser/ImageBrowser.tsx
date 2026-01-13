import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects, useImages } from '@/hooks';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ImageBrowser() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectProject, currentProject } = useProjects();
  const { images, isLoading, isScanning, error, scanImages, loadImages, getThumbnailUrl } = useImages();

  useEffect(() => {
    if (projectId) {
      selectProject(Number(projectId));
    }
  }, [projectId, selectProject]);

  const handleImageSelect = (imageId: number) => {
    navigate(`/projects/${projectId}/images/${imageId}`);
  };

  return (
    <AppLayout>
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">{currentProject?.name || 'Images'}</h1>
              <p className="text-muted-foreground mt-1">
                Select a panoramic image to annotate
              </p>
            </div>
            <Button onClick={scanImages} disabled={isScanning}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isScanning && 'animate-spin')} />
              {isScanning ? 'Scanning...' : 'Scan for Images'}
            </Button>
          </div>

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading images...
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={loadImages}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && images.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No images found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Scan for Images" to discover panoramic images
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <Card
                key={image.id}
                className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
                onClick={() => handleImageSelect(image.id)}
              >
                <div className="aspect-video bg-muted">
                  <img
                    src={getThumbnailUrl(image.id)}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate" title={image.filename}>
                    {image.filename}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {image.annotation_count} annotations
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
