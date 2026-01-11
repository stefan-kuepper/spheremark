import { useState, useEffect } from 'react';
import { useImages } from '../../hooks';
import { exports as exportsApi } from '../../api';

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
    <div id="export-dialog" className="dialog">
      <div className="dialog-overlay" onClick={onClose}></div>
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>Export Annotations</h2>
          <button className="dialog-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="dialog-body">
          <div className="export-options">
            <div className="form-group">
              <label>Export Format</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="format"
                    value="coco"
                    checked={format === 'coco'}
                    onChange={() => setFormat('coco')}
                  />
                  <span>COCO Format (JSON)</span>
                  <p className="radio-description">
                    Standard COCO format with spherical coordinates
                  </p>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="format"
                    value="yolo"
                    checked={format === 'yolo'}
                    onChange={() => setFormat('yolo')}
                  />
                  <span>YOLO Format (TXT)</span>
                  <p className="radio-description">
                    YOLO format with spherical coordinates, one .txt file per image
                  </p>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Scope</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="scope"
                    value="current"
                    checked={scope === 'current'}
                    onChange={() => setScope('current')}
                  />
                  <span>Current Image Only</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="scope"
                    value="all"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                  />
                  <span>All Images</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Preview</label>
              <div className="export-preview">
                <pre id="export-preview-content">
                  {isLoading ? 'Loading...' : preview}
                </pre>
              </div>
            </div>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleDownload}>
            Download
          </button>
          <button className="btn btn-secondary" onClick={handleCopy}>
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
