import { useState, useEffect } from 'react';
import { BoxList } from '../panel/BoxList';
import type { BoundingBox } from '../../types';

interface SidePanelProps {
  onFocusBox: (box: BoundingBox) => void;
}

export function SidePanel({ onFocusBox }: SidePanelProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleToggle = (e: CustomEvent<{ visible: boolean }>) => {
      setVisible(e.detail.visible);
    };

    window.addEventListener('togglePanel', handleToggle as EventListener);
    return () => {
      window.removeEventListener('togglePanel', handleToggle as EventListener);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div id="side-panel">
      <div className="panel-header">
        <h2>Bounding Boxes</h2>
        <button
          className="icon-button"
          onClick={() => setVisible(false)}
        >
          &times;
        </button>
      </div>

      <div className="panel-content">
        <BoxList onFocusBox={onFocusBox} />
      </div>
    </div>
  );
}
