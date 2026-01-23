import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BoxList } from '../panel/BoxList';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BoundingBox } from '../../types';

interface SidePanelProps {
  onFocusBox: (box: BoundingBox) => void;
}

export function SidePanel({ onFocusBox }: SidePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="fixed top-0 right-0 h-screen z-50 flex flex-col">
        <Button
          variant="secondary"
          size="icon"
          className="m-2 h-10 w-10 bg-white/95 shadow-md hover:bg-white"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 w-80 h-screen bg-white/95 shadow-[-2px_0_10px_rgba(0,0,0,0.1)] z-50 flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-card-foreground">Bounding Boxes</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(true)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <BoxList onFocusBox={onFocusBox} />
      </ScrollArea>
    </div>
  );
}
