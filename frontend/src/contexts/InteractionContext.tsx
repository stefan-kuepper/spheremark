import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  DrawState,
  ResizeState,
  HoverState,
  HandleType,
  UVCoordinate,
  BoundingBox,
} from '../types';

const MIN_BOX_SIZE = 0.02;
const MAX_BOX_WIDTH = 0.5;

interface InteractionContextValue {
  drawState: DrawState;
  resizeState: ResizeState;
  hoverState: HoverState;
  middleMousePressed: boolean;
  controlsEnabled: boolean;
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
  setMiddleMousePressed: (pressed: boolean) => void;
  setHoveredBox: (boxId: string | number | null) => void;
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

const initialHoverState: HoverState = {
  hoveredBoxId: null,
};

const InteractionContext = createContext<InteractionContextValue | null>(null);

interface InteractionProviderProps {
  children: ReactNode;
}

export function InteractionProvider({ children }: InteractionProviderProps) {
  const [drawState, setDrawState] = useState<DrawState>(initialDrawState);
  const [resizeState, setResizeState] = useState<ResizeState>(initialResizeState);
  const [hoverState, setHoverState] = useState<HoverState>(initialHoverState);
  const [middleMousePressed, setMiddleMousePressedState] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState(false);

  const startDraw = useCallback((uv: UVCoordinate) => {
    setDrawState({
      isDrawing: true,
      startUV: { ...uv },
      currentUV: { ...uv },
    });
    setControlsEnabled(false);
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
    setControlsEnabled(middleMousePressed);

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
  }, [drawState, middleMousePressed]);

  const cancelDraw = useCallback(() => {
    setDrawState(initialDrawState);
    setControlsEnabled(middleMousePressed);
  }, [middleMousePressed]);

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
    setControlsEnabled(middleMousePressed);
  }, [middleMousePressed]);

  const cancelResize = useCallback((): { uvMin: UVCoordinate; uvMax: UVCoordinate } | null => {
    const original = resizeState.originalBox;
    setResizeState(initialResizeState);
    setControlsEnabled(middleMousePressed);
    return original;
  }, [resizeState.originalBox, middleMousePressed]);

  const setMiddleMousePressed = useCallback((pressed: boolean) => {
    setMiddleMousePressedState(pressed);
  }, []);

  const setHoveredBox = useCallback((boxId: string | number | null) => {
    setHoverState({ hoveredBoxId: boxId });
  }, []);

  useEffect(() => {
    setControlsEnabled(middleMousePressed);
    // Cancel drawing and resizing when middle mouse is pressed
    if (middleMousePressed) {
      setDrawState(initialDrawState);
      setResizeState(initialResizeState);
    }
  }, [middleMousePressed]);

  const value: InteractionContextValue = {
    drawState,
    resizeState,
    hoverState,
    middleMousePressed,
    controlsEnabled,
    startDraw,
    updateDraw,
    finishDraw,
    cancelDraw,
    startResize,
    updateResize,
    finishResize,
    cancelResize,
    setMiddleMousePressed,
    setHoveredBox,
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
