import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ToolbarProps {
  onExportClick: () => void;
}

export function Toolbar({ onExportClick }: ToolbarProps) {
  const navigate = useNavigate();
  const [panelVisible, setPanelVisible] = useState(true);

  const handleTogglePanel = () => {
    setPanelVisible(!panelVisible);
    // Dispatch custom event for SidePanel to listen to
    window.dispatchEvent(
      new CustomEvent('togglePanel', { detail: { visible: !panelVisible } })
    );
  };

  return (
    <div id="toolbar">


      <button
        className="icon-button"
        onClick={() => navigate('/')}
        title="Back to Image Browser"
      >
        <span>&#x2b05;&#xfe0f;</span>
      </button>

      <button
        className="icon-button"
        onClick={handleTogglePanel}
        title="Toggle Panel"
      >
        <span>&#x1f4cb;</span>
      </button>

      <button className="icon-button" onClick={onExportClick} title="Export Boxes">
        <span>&#x1f4be;</span>
      </button>
    </div>
  );
}
