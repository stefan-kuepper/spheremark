import type { UVCoordinate, BoundingBox } from './annotation';

export enum InteractionMode {
  VIEW = 'view',
  DRAW = 'draw',
  EDIT = 'edit',
}

export type HandleType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface DrawState {
  isDrawing: boolean;
  startUV: UVCoordinate | null;
  currentUV: UVCoordinate | null;
}

export interface ResizeState {
  isResizing: boolean;
  boxId: string | number | null;
  handleType: HandleType | null;
  originalBox: Pick<BoundingBox, 'uvMin' | 'uvMax'> | null;
}
