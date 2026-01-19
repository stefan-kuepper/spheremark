import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PanelRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolbarProps {
  onExportClick: () => void;
}

export function Toolbar({ onExportClick }: ToolbarProps) {
  const navigate = useNavigate();
  const [panelVisible, setPanelVisible] = useState(true);

  const handleTogglePanel = () => {
    setPanelVisible(!panelVisible);
    window.dispatchEvent(
      new CustomEvent('togglePanel', { detail: { visible: !panelVisible } })
    );
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white/95 p-2 rounded-lg shadow-lg flex gap-2 items-center z-[60]">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate('/')}
        title="Back to Image Browser"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleTogglePanel}
        title="Toggle Panel"
      >
        <PanelRight className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onExportClick}
        title="Export Boxes"
      >
        <Download className="h-5 w-5" />
      </Button>
    </div>
  );
}
