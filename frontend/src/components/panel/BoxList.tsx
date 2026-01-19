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
      <div className="py-8 px-6 text-center text-muted-foreground">
        <p>No bounding boxes yet</p>
        <p className="text-sm mt-2">
          Switch to Draw mode to create one
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
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
