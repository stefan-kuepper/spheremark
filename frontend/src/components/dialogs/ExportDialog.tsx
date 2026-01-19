import { useState, useEffect } from 'react';
import { useImages } from '../../hooks';
import { exports as exportsApi } from '../../api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Annotations</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Export Format</Label>
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <RadioGroupItem value="coco">
                  <span className="font-medium">COCO Format (JSON)</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Standard COCO format with spherical coordinates
                  </p>
                </RadioGroupItem>
                <RadioGroupItem value="yolo">
                  <span className="font-medium">YOLO Format (TXT)</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    YOLO format with spherical coordinates, one .txt file per image
                  </p>
                </RadioGroupItem>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Scope</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as ExportScope)}>
                <RadioGroupItem value="current">
                  <span className="font-medium">Current Image Only</span>
                </RadioGroupItem>
                <RadioGroupItem value="all">
                  <span className="font-medium">All Images</span>
                </RadioGroupItem>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Preview</Label>
              <ScrollArea className="h-[200px] rounded-md border border-border bg-muted/50 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {isLoading ? 'Loading...' : preview}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>Download</Button>
          <Button variant="secondary" onClick={handleCopy}>
            Copy to Clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
