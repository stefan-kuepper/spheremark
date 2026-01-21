import type { GeoCoordinate, BoundingBox } from './annotation';

export type HandleType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface DrawState {
  isDrawing: boolean;
  startGeo: GeoCoordinate | null;
  currentGeo: GeoCoordinate | null;
}

export interface ResizeState {
  isResizing: boolean;
  boxId: string | number | null;
  handleType: HandleType | null;
  originalBox: Pick<BoundingBox, 'geoMin' | 'geoMax'> | null;
}

export interface HoverState {
  hoveredBoxId: string | number | null;
}
