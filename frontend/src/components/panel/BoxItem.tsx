import { useState } from 'react';
import { Focus, Pencil, Trash2 } from 'lucide-react';
import { useAnnotations } from '../../hooks';
import { LabelEditor } from './LabelEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BoundingBox } from '../../types';

interface BoxItemProps {
  box: BoundingBox;
  isSelected: boolean;
  suggestions: string[];
  onFocus: (box: BoundingBox) => void;
}

export function BoxItem({ box, isSelected, suggestions, onFocus }: BoxItemProps) {
  const { selectBox, deleteBox, updateBoxLabel } = useAnnotations();
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  const handleClick = () => {
    selectBox(box.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBox(box.id);
  };

  const handleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus(box);
  };

  const handleEditLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingLabel(true);
  };

  const handleSaveLabel = (label: string) => {
    updateBoxLabel(box.id, label);
    setIsEditingLabel(false);
  };

  const handleCancelLabel = () => {
    setIsEditingLabel(false);
  };

  const widthDeg = (box.geoMax.azimuth - box.geoMin.azimuth).toFixed(1);
  const heightDeg = (box.geoMax.altitude - box.geoMin.altitude).toFixed(1);

  return (
    <div
      className={cn(
        'p-4 border-b border-border cursor-pointer transition-colors border-l-4',
        isSelected
          ? 'bg-primary/10 border-l-primary'
          : 'border-l-transparent hover:bg-primary/5'
      )}
      onClick={handleClick}
      style={{ borderLeftColor: isSelected ? undefined : box.color }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: box.color }}
        />
        <span className="font-semibold text-sm text-card-foreground">
          Box #{box.id}
        </span>
      </div>

      <div className="mb-2">
        {isEditingLabel ? (
          <LabelEditor
            value={box.label}
            onSave={handleSaveLabel}
            onCancel={handleCancelLabel}
            suggestions={suggestions}
          />
        ) : (
          <span
            className={cn(
              'inline-block px-2 py-1 bg-muted rounded text-sm cursor-pointer border border-transparent hover:bg-muted/80 min-w-[120px]',
              !box.label && 'text-muted-foreground italic'
            )}
            onClick={handleEditLabel}
            title="Click to edit label"
          >
            {box.label || '(no label)'}
          </span>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          Az: {box.geoMin.azimuth.toFixed(1)}° - {box.geoMax.azimuth.toFixed(1)}°
        </div>
        <div>
          Alt: {box.geoMin.altitude.toFixed(1)}° - {box.geoMax.altitude.toFixed(1)}°
        </div>
        <div>Size: {widthDeg}° x {heightDeg}°</div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFocus}
          title="Focus on box"
        >
          <Focus className="h-3 w-3" />
          Focus
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditLabel}
          title="Edit label (L)"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          title="Delete box (Delete)"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}
