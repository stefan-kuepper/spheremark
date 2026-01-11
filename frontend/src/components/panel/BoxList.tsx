import { useMemo } from 'react';
import { useAnnotations } from '../../hooks';
import { BoxItem } from './BoxItem';
import type { BoundingBox } from '../../types';

const DEFAULT_SUGGESTIONS = [
  'traffic_sign',
  'person',
  'vehicle',
  'building',
  'tree',
  'street_light',
  'sign',
  'car',
  'bicycle',
  'motorcycle',
];

interface BoxListProps {
  onFocusBox: (box: BoundingBox) => void;
}

export function BoxList({ onFocusBox }: BoxListProps) {
  const { boxes, selectedBoxId } = useAnnotations();

  const suggestions = useMemo(() => {
    const existingLabels = boxes
      .map((box) => box.label)
      .filter((label) => label && !DEFAULT_SUGGESTIONS.includes(label));
    return [...new Set([...DEFAULT_SUGGESTIONS, ...existingLabels])];
  }, [boxes]);

  if (boxes.length === 0) {
    return (
      <div id="empty-state">
        <p>No bounding boxes yet</p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
          Switch to Draw mode to create one
        </p>
      </div>
    );
  }

  return (
    <div id="box-list">
      {boxes.map((box) => (
        <BoxItem
          key={box.id}
          box={box}
          isSelected={box.id === selectedBoxId}
          suggestions={suggestions}
          onFocus={onFocusBox}
        />
      ))}
    </div>
  );
}
