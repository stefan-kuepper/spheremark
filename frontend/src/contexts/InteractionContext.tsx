import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  InteractionMode,
  DrawState,
  ResizeState,
  HandleType,
  UVCoordinate,
  BoundingBox,
} from '../types';
import { InteractionMode as Mode } from '../types';

const MIN_BOX_SIZE = 0.02;
const MAX_BOX_WIDTH = 0.5;

interface InteractionContextValue {
  mode: InteractionMode;
  drawState: DrawState;
  resizeState: ResizeState;
  controlsEnabled: boolean;
  setMode: (mode: InteractionMode) => void;
  startDraw: (uv: UVCoordinate) => void;
  updateDraw: (uv: UVCoordinate) => void;
  finishDraw: () => { uvMin: UVCoordinate; uvMax: UVCoordinate } | null;
  cancelDraw: () => void;
  startResize: (
    boxId: string | number,
    handleType: HandleType,
    originalBox: Pick<BoundingBox, 'uvMin' | 'uvMax'>
  ) => void;
  updateResize: (
    uv: UVCoordinate,
    currentBox: Pick<BoundingBox, 'uvMin' | 'uvMax'>
  ) => { uvMin: UVCoordinate; uvMax: UVCoordinate } | null;
  finishResize: () => void;
  cancelResize: () => { uvMin: UVCoordinate; uvMax: UVCoordinate } | null;
}

const initialDrawState: DrawState = {
  isDrawing: false,
  startUV: null,
  currentUV: null,
};

const initialResizeState: ResizeState = {
  isResizing: false,
  boxId: null,
  handleType: null,
  originalBox: null,
};

const InteractionContext = createContext<InteractionContextValue | null>(null);

interface InteractionProviderProps {
  children: ReactNode;
}

export function InteractionProvider({ children }: InteractionProviderProps) {
  const [mode, setModeState] = useState<InteractionMode>(Mode.VIEW);
  const [drawState, setDrawState] = useState<DrawState>(initialDrawState);
  const [resizeState, setResizeState] = useState<ResizeState>(initialResizeState);
  const [controlsEnabled, setControlsEnabled] = useState(true);

  const setMode = useCallback((newMode: InteractionMode) => {
    setModeState(newMode);
    setControlsEnabled(newMode === Mode.VIEW);
    // Cancel any active interactions
    setDrawState(initialDrawState);
    setResizeState(initialResizeState);
  }, []);

  const startDraw = useCallback((uv: UVCoordinate) => {
    setDrawState({
      isDrawing: true,
      startUV: { ...uv },
      currentUV: { ...uv },
    });
  }, []);

  const updateDraw = useCallback((uv: UVCoordinate) => {
    setDrawState((prev) => {
      if (!prev.isDrawing || !prev.startUV) return prev;

      // Clamp UV coordinates
      const clampedUV = {
        u: Math.max(0, Math.min(1, uv.u)),
        v: Math.max(0, Math.min(1, uv.v)),
      };

      // Prevent wrapping - constrain width to max 0.5
      let currentU = clampedUV.u;
      const startU = prev.startUV.u;
      const deltaU = currentU - startU;

      if (Math.abs(deltaU) > MAX_BOX_WIDTH) {
        currentU = startU + Math.sign(deltaU) * MAX_BOX_WIDTH;
      }

      return {
        ...prev,
        currentUV: { u: currentU, v: clampedUV.v },
      };
    });
  }, []);

  const finishDraw = useCallback((): { uvMin: UVCoordinate; uvMax: UVCoordinate } | null => {
    const { startUV, currentUV } = drawState;

    setDrawState(initialDrawState);

    if (!startUV || !currentUV) return null;

    const uvMin = {
      u: Math.min(startUV.u, currentUV.u),
      v: Math.min(startUV.v, currentUV.v),
    };
    const uvMax = {
      u: Math.max(startUV.u, currentUV.u),
      v: Math.max(startUV.v, currentUV.v),
    };

    // Check minimum size
    if (uvMax.u - uvMin.u < MIN_BOX_SIZE || uvMax.v - uvMin.v < MIN_BOX_SIZE) {
      return null;
    }

    return { uvMin, uvMax };
  }, [drawState]);

  const cancelDraw = useCallback(() => {
    setDrawState(initialDrawState);
  }, []);

  const startResize = useCallback(
    (
      boxId: string | number,
      handleType: HandleType,
      originalBox: Pick<BoundingBox, 'uvMin' | 'uvMax'>
    ) => {
      setResizeState({
        isResizing: true,
        boxId,
        handleType,
        originalBox: {
          uvMin: { ...originalBox.uvMin },
          uvMax: { ...originalBox.uvMax },
        },
      });
      setControlsEnabled(false);
    },
    []
  );

  const updateResize = useCallback(
    (
      uv: UVCoordinate,
      currentBox: Pick<BoundingBox, 'uvMin' | 'uvMax'>
    ): { uvMin: UVCoordinate; uvMax: UVCoordinate } | null => {
      if (!resizeState.isResizing || !resizeState.handleType) return null;

      const clampedUV = {
        u: Math.max(0, Math.min(1, uv.u)),
        v: Math.max(0, Math.min(1, uv.v)),
      };

      const newUvMin = { ...currentBox.uvMin };
      const newUvMax = { ...currentBox.uvMax };

      switch (resizeState.handleType) {
        case 'top-left':
          newUvMin.u = Math.min(clampedUV.u, newUvMax.u - MIN_BOX_SIZE);
          newUvMin.v = Math.min(clampedUV.v, newUvMax.v - MIN_BOX_SIZE);
          break;
        case 'top-right':
          newUvMax.u = Math.max(clampedUV.u, newUvMin.u + MIN_BOX_SIZE);
          newUvMin.v = Math.min(clampedUV.v, newUvMax.v - MIN_BOX_SIZE);
          break;
        case 'bottom-left':
          newUvMin.u = Math.min(clampedUV.u, newUvMax.u - MIN_BOX_SIZE);
          newUvMax.v = Math.max(clampedUV.v, newUvMin.v + MIN_BOX_SIZE);
          break;
        case 'bottom-right':
          newUvMax.u = Math.max(clampedUV.u, newUvMin.u + MIN_BOX_SIZE);
          newUvMax.v = Math.max(clampedUV.v, newUvMin.v + MIN_BOX_SIZE);
          break;
      }

      return { uvMin: newUvMin, uvMax: newUvMax };
    },
    [resizeState.isResizing, resizeState.handleType]
  );

  const finishResize = useCallback(() => {
    setResizeState(initialResizeState);
    setControlsEnabled(mode === Mode.VIEW);
  }, [mode]);

  const cancelResize = useCallback((): { uvMin: UVCoordinate; uvMax: UVCoordinate } | null => {
    const original = resizeState.originalBox;
    setResizeState(initialResizeState);
    setControlsEnabled(mode === Mode.VIEW);
    return original;
  }, [resizeState.originalBox, mode]);

  const value: InteractionContextValue = {
    mode,
    drawState,
    resizeState,
    controlsEnabled,
    setMode,
    startDraw,
    updateDraw,
    finishDraw,
    cancelDraw,
    startResize,
    updateResize,
    finishResize,
    cancelResize,
  };

  return (
    <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>
  );
}

export function useInteraction(): InteractionContextValue {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error('useInteraction must be used within an InteractionProvider');
  }
  return context;
}
