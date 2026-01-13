import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { cn } from '@/lib/utils';
import type { BoundingBox } from '@/types';

interface AppLayoutProps {
  children: ReactNode;
  showLeftSidebar?: boolean;
  showRightSidebar?: boolean;
  onFocusBox?: (box: BoundingBox) => void;
}

export function AppLayout({
  children,
  showLeftSidebar = false,
  showRightSidebar = false,
  onFocusBox,
}: AppLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        onToggleLeftSidebar={() => setLeftOpen(!leftOpen)}
        onToggleRightSidebar={() => setRightOpen(!rightOpen)}
        showLeftToggle={showLeftSidebar}
        showRightToggle={showRightSidebar}
        leftSidebarOpen={leftOpen}
        rightSidebarOpen={rightOpen}
        onExportClick={() => setExportDialogOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {showLeftSidebar && (
          <LeftSidebar isOpen={leftOpen} onClose={() => setLeftOpen(false)} />
        )}

        <main
          className={cn(
            'flex-1 relative transition-all duration-300 overflow-hidden'
          )}
        >
          {children}
        </main>

        {showRightSidebar && (
          <RightSidebar
            isOpen={rightOpen}
            onClose={() => setRightOpen(false)}
            onFocusBox={onFocusBox}
          />
        )}
      </div>

      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
    </div>
  );
}
