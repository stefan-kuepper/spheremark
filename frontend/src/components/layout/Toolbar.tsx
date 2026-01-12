import { useState } from 'react';
import { useImages, useInteraction } from '../../hooks';
import { InteractionMode } from '../../types';

interface ToolbarProps {
  onExportClick: () => void;
}

export function Toolbar({ onExportClick }: ToolbarProps) {
  const { clearImage } = useImages();
  const { mode, setMode } = useInteraction();
  const [panelVisible, setPanelVisible] = useState(true);

  const handleTogglePanel = () => {
    setPanelVisible(!panelVisible);
    // Dispatch custom event for SidePanel to listen to
    window.dispatchEvent(
      new CustomEvent('togglePanel', { detail: { visible: !panelVisible } })
    );
  };

  return (
    <div id="toolbar" data-testid="toolbar">
      <button
        className={`mode-button ${mode === InteractionMode.VIEW ? 'active' : ''}`}
        onClick={() => setMode(InteractionMode.VIEW)}
        title="View Mode (ESC)"
        data-testid="view-mode-button"
      >
        <span>&#x1f441;&#xfe0f;</span>
      </button>
      <button
        className={`mode-button ${mode === InteractionMode.DRAW ? 'active' : ''}`}
        onClick={() => setMode(InteractionMode.DRAW)}
        title="Draw Mode (D)"
        data-testid="draw-mode-button"
      >
        <span>&#x270f;&#xfe0f;</span>
      </button>
      <button
        className={`mode-button ${mode === InteractionMode.EDIT ? 'active' : ''}`}
        onClick={() => setMode(InteractionMode.EDIT)}
        title="Edit Mode (E)"
        data-testid="edit-mode-button"
      >
        <span>&#x270b;</span>
      </button>

      <div className="toolbar-divider"></div>

      <button
        className="icon-button"
        onClick={clearImage}
        title="Back to Image Browser"
        data-testid="back-button"
      >
        <span>&#x2b05;&#xfe0f;</span>
      </button>

      <button
        className="icon-button"
        onClick={handleTogglePanel}
        title="Toggle Panel"
        data-testid="toggle-panel-button"
      >
        <span>&#x1f4cb;</span>
      </button>

      <button className="icon-button" onClick={onExportClick} title="Export Boxes" data-testid="export-button">
        <span>&#x1f4be;</span>
      </button>
    </div>
  );
}
