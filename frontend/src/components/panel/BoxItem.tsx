import { useState } from 'react';
import { useAnnotations } from '@/hooks';
import { LabelEditor } from './LabelEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Focus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BoundingBox } from '@/types';

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

  const width = ((box.uvMax.u - box.uvMin.u) * 100).toFixed(1);
  const height = ((box.uvMax.v - box.uvMin.v) * 100).toFixed(1);

  return (
    <div
      className={cn(
        'p-3 cursor-pointer transition-colors border-l-4',
        isSelected ? 'bg-accent' : 'hover:bg-accent/50'
      )}
      style={{ borderLeftColor: box.color }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: box.color }}
        />
        <span className="font-semibold text-sm">Box #{box.id}</span>
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
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
            onClick={handleEditLabel}
          >
            {box.label || '(no label)'}
          </Badge>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
        <div>
          UV: ({box.uvMin.u.toFixed(3)}, {box.uvMin.v.toFixed(3)}) - (
          {box.uvMax.u.toFixed(3)}, {box.uvMax.v.toFixed(3)})
        </div>
        <div>Size: {width}% x {height}%</div>
      </div>

      <div className="flex gap-1">
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleFocus}>
          <Focus className="h-3 w-3 mr-1" />
          Focus
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleEditLabel}>
          <Pencil className="h-3 w-3 mr-1" />
          Label
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
