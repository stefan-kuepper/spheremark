import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { BoxList } from '@/components/panel/BoxList';
import type { BoundingBox } from '@/types';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusBox?: (box: BoundingBox) => void;
}

export function RightSidebar({ isOpen, onClose, onFocusBox }: RightSidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0">
      <div className="h-12 px-4 flex items-center justify-between border-b border-border">
        <span className="font-semibold text-sm">Annotations</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <BoxList onFocusBox={onFocusBox ?? (() => {})} />
      </ScrollArea>
    </aside>
  );
}
