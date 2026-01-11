import { useInteraction } from '../../hooks';
import { InteractionMode } from '../../types';

const MODE_CONFIG = {
  [InteractionMode.VIEW]: {
    text: 'View Mode',
    hint: 'Use OrbitControls to explore',
  },
  [InteractionMode.DRAW]: {
    text: 'Draw Mode',
    hint: 'Click and drag to draw a bounding box',
  },
  [InteractionMode.EDIT]: {
    text: 'Edit Mode',
    hint: 'Click a box to select, drag handles to resize',
  },
};

export function ModeIndicator() {
  const { mode } = useInteraction();
  const config = MODE_CONFIG[mode];

  return (
    <div id="mode-indicator">
      <span id="mode-text">{config.text}</span>
      <span id="mode-hint">{config.hint}</span>
    </div>
  );
}
