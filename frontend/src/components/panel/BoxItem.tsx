import { useState } from 'react';
import { useAnnotations } from '../../hooks';
import { LabelEditor } from './LabelEditor';
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

  const width = ((box.uvMax.u - box.uvMin.u) * 100).toFixed(1);
  const height = ((box.uvMax.v - box.uvMin.v) * 100).toFixed(1);

  return (
    <div
      className={`box-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{ borderLeftColor: box.color }}
      data-testid={`box-item-${box.id}`}
    >
      <div className="box-header">
        <span
          className="box-color"
          style={{ backgroundColor: box.color }}
        ></span>
        <span className="box-id">Box #{box.id}</span>
      </div>

      <div className="box-label">
        {isEditingLabel ? (
          <LabelEditor
            value={box.label}
            onSave={handleSaveLabel}
            onCancel={handleCancelLabel}
            suggestions={suggestions}
          />
        ) : (
          <span
            className="label-text"
            onClick={handleEditLabel}
            title="Click to edit label"
            data-testid={`box-label-${box.id}`}
          >
            {box.label || '(no label)'}
          </span>
        )}
      </div>

      <div className="box-coords">
        <span>
          UV: ({box.uvMin.u.toFixed(3)}, {box.uvMin.v.toFixed(3)}) - (
          {box.uvMax.u.toFixed(3)}, {box.uvMax.v.toFixed(3)})
        </span>
        <span>
          Size: {width}% x {height}%
        </span>
      </div>

      <div className="box-actions">
        <button
          className="btn btn-small"
          onClick={handleFocus}
          title="Focus on box"
        >
          Focus
        </button>
        <button
          className="btn btn-small"
          onClick={handleEditLabel}
          title="Edit label (L)"
        >
          Edit Label
        </button>
        <button
          className="btn btn-small btn-danger"
          onClick={handleDelete}
          title="Delete box (Delete)"
          data-testid={`delete-box-button-${box.id}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
