import { useState, useEffect } from 'react';
import { useImages } from '@/hooks';
import { exports as exportsApi } from '@/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Copy, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'coco' | 'yolo';
type ExportScope = 'current' | 'all';

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { currentImageId } = useImages();
  const [format, setFormat] = useState<ExportFormat>('coco');
  const [scope, setScope] = useState<ExportScope>('current');
  const [preview, setPreview] = useState<string>('Select options to see preview...');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadPreview = async () => {
      setIsLoading(true);
      try {
        let data;
        if (format === 'coco') {
          data =
            scope === 'current' && currentImageId
              ? await exportsApi.exportCocoImage(currentImageId)
              : await exportsApi.exportCoco();
        } else {
          data =
            scope === 'current' && currentImageId
              ? await exportsApi.exportYoloImage(currentImageId)
              : await exportsApi.exportYolo();
        }
        setPreview(JSON.stringify(data, null, 2));
      } catch (error) {
        setPreview(`Error loading preview: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [isOpen, format, scope, currentImageId]);

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations_${format}_${scope === 'current' ? currentImageId : 'all'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Annotations</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={cn(
                  'p-3 rounded-md border text-left transition-colors',
                  format === 'coco'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                )}
                onClick={() => setFormat('coco')}
              >
                <div className="font-medium">COCO Format</div>
                <div className="text-xs text-muted-foreground">
                  Standard COCO format with spherical coordinates
                </div>
              </button>
              <button
                className={cn(
                  'p-3 rounded-md border text-left transition-colors',
                  format === 'yolo'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                )}
                onClick={() => setFormat('yolo')}
              >
                <div className="font-medium">YOLO Format</div>
                <div className="text-xs text-muted-foreground">
                  YOLO format with spherical coordinates
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={cn(
                  'p-3 rounded-md border text-left transition-colors',
                  scope === 'current'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                )}
                onClick={() => setScope('current')}
              >
                <div className="font-medium">Current Image Only</div>
              </button>
              <button
                className={cn(
                  'p-3 rounded-md border text-left transition-colors',
                  scope === 'all'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                )}
                onClick={() => setScope('all')}
              >
                <div className="font-medium">All Images</div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <ScrollArea className="h-64 rounded-md border bg-muted/50">
              <pre className="p-4 text-xs font-mono">
                {isLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  preview
                )}
              </pre>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
