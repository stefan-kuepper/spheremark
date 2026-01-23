import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Tags,
  Download,
  Settings,
  FolderOpen,
  ScanSearch,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { useImages, useProjects } from '../../hooks';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  onExportClick: () => void;
}

export function ProjectSidebar({ onExportClick }: ProjectSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    currentProjectId,
    labelSchema,
    addLabel,
    deleteLabel,
    updateProject,
  } = useProjects();
  const {
    images,
    currentImageId,
    isScanning,
    lastScanResult,
    getThumbnailUrl,
    scanImages,
  } = useImages();

  const currentIndex = images.findIndex((img) => img.id === currentImageId);

  // Editing state for settings
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');

  // New label state
  const [newLabelName, setNewLabelName] = useState('');

  useEffect(() => {
    if (currentProject) {
      setNameValue(currentProject.name);
      setDescriptionValue(currentProject.description || '');
    }
  }, [currentProject]);

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

  const handleBackToProjects = () => {
    navigate('/');
  };

  const handleSaveProjectName = async () => {
    if (currentProjectId && nameValue.trim()) {
      await updateProject(currentProjectId, { name: nameValue.trim() });
      setEditingName(false);
    }
  };

  const handleSaveProjectDescription = async () => {
    if (currentProjectId) {
      await updateProject(currentProjectId, { description: descriptionValue.trim() || undefined });
      setEditingDescription(false);
    }
  };

  const handleAddLabel = async () => {
    if (newLabelName.trim()) {
      await addLabel({ label_name: newLabelName.trim() });
      setNewLabelName('');
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
    <div className="fixed top-0 left-0 w-56 h-screen bg-white/95 shadow-[2px_0_10px_rgba(0,0,0,0.1)] z-50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border bg-white">
        <button
          onClick={handleBackToProjects}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-card-foreground mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Projects
        </button>
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-card-foreground truncate">
            {currentProject?.name || 'Loading...'}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Images Section */}
        <CollapsibleSection
          title="Images"
          icon={<ImageIcon className="h-4 w-4" />}
          defaultExpanded={true}
        >
          <div className="space-y-3">
            {/* Scan Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => scanImages()}
              disabled={isScanning}
            >
              <ScanSearch className="h-4 w-4 mr-2" />
              {isScanning ? 'Scanning...' : 'Scan for Images'}
            </Button>

            {lastScanResult && (
              <p className="text-xs text-muted-foreground">
                Last scan: +{lastScanResult.added} added, {lastScanResult.skipped} skipped
              </p>
            )}

            {images.length > 0 && (
              <>
                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {images.length}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handlePrevImage}
                      disabled={currentIndex <= 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleNextImage}
                      disabled={currentIndex >= images.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="space-y-2">
                  {images.map((image) => {
                    const isCurrent = image.id === currentImageId;

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
              </>
            )}

            {images.length === 0 && !isScanning && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No images yet. Click "Scan for Images" to find panoramas.
              </p>
            )}
          </div>
        </CollapsibleSection>

        {/* Labels Section */}
        <CollapsibleSection
          title="Labels"
          icon={<Tags className="h-4 w-4" />}
        >
          <div className="space-y-2">
            {labelSchema.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between gap-2 p-2 rounded bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color || '#888' }}
                  />
                  <span className="text-sm text-card-foreground">{label.label_name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteLabel(label.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                placeholder="New label..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                className="h-8 text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleAddLabel}
                disabled={!newLabelName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        {/* Export Section */}
        <CollapsibleSection
          title="Export"
          icon={<Download className="h-4 w-4" />}
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onExportClick}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Annotations
          </Button>
        </CollapsibleSection>

        {/* Settings Section */}
        <CollapsibleSection
          title="Settings"
          icon={<Settings className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Project Name
              </label>
              {editingName ? (
                <div className="flex gap-1">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={handleSaveProjectName}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-sm text-left w-full p-2 rounded bg-muted/50 hover:bg-muted text-card-foreground"
                >
                  {currentProject?.name || '-'}
                </button>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Description
              </label>
              {editingDescription ? (
                <div className="space-y-1">
                  <Textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    className="text-sm min-h-[60px]"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={handleSaveProjectDescription}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingDescription(true)}
                  className="text-sm text-left w-full p-2 rounded bg-muted/50 hover:bg-muted min-h-[40px] text-card-foreground"
                >
                  {currentProject?.description || 'No description'}
                </button>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Images Path
              </label>
              <p className="text-sm p-2 rounded bg-muted/50 text-muted-foreground truncate">
                {currentProject?.images_path || '-'}
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border bg-white">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Collapse
        </Button>
      </div>
    </div>
  );
}
