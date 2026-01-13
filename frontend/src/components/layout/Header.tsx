import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelLeft, PanelRight, Download, Home } from 'lucide-react';
import { useProjects, useImages } from '@/hooks';

interface HeaderProps {
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  showLeftToggle?: boolean;
  showRightToggle?: boolean;
  leftSidebarOpen?: boolean;
  rightSidebarOpen?: boolean;
  onExportClick?: () => void;
}

export function Header({
  onToggleLeftSidebar,
  onToggleRightSidebar,
  showLeftToggle,
  showRightToggle,
  leftSidebarOpen,
  rightSidebarOpen,
  onExportClick,
}: HeaderProps) {
  const { projectId, imageId } = useParams();
  const navigate = useNavigate();
  const { currentProject } = useProjects();
  const { currentImage } = useImages();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
      {/* Logo */}
      <div
        className="font-bold text-lg cursor-pointer flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        onClick={() => navigate('/')}
      >
        <Home className="h-5 w-5" />
        <span>SphereMark</span>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => navigate('/')}
            >
              Projects
            </BreadcrumbLink>
          </BreadcrumbItem>

          {projectId && currentProject && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {imageId ? (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => navigate(`/projects/${projectId}`)}
                  >
                    {currentProject.name}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{currentProject.name}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}

          {imageId && currentImage && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentImage.filename}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Toolbar Actions */}
      <div className="flex items-center gap-1">
        {showLeftToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={leftSidebarOpen ? 'secondary' : 'ghost'}
                size="icon"
                onClick={onToggleLeftSidebar}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Images Panel</TooltipContent>
          </Tooltip>
        )}

        {onExportClick && imageId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onExportClick}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Annotations</TooltipContent>
          </Tooltip>
        )}

        {showRightToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={rightSidebarOpen ? 'secondary' : 'ghost'}
                size="icon"
                onClick={onToggleRightSidebar}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Annotations Panel</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
