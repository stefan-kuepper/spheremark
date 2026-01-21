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
  GeoCoordinate,
  BoundingBox,
} from '../types';

const MIN_BOX_SIZE_DEG = 7.2; // ~2% of 360 for azimuth, ~4% of 180 for altitude
const MAX_BOX_WIDTH_DEG = 180; // Max width in degrees (50% of full range)

interface InteractionContextValue {
  drawState: DrawState;
  resizeState: ResizeState;
  hoverState: HoverState;
  middleMousePressed: boolean;
  controlsEnabled: boolean;
  startDraw: (geo: GeoCoordinate) => void;
  updateDraw: (geo: GeoCoordinate) => void;
  finishDraw: () => { geoMin: GeoCoordinate; geoMax: GeoCoordinate } | null;
  cancelDraw: () => void;
  startResize: (
    boxId: string | number,
    handleType: HandleType,
    originalBox: Pick<BoundingBox, 'geoMin' | 'geoMax'>
  ) => void;
  updateResize: (
    geo: GeoCoordinate,
    currentBox: Pick<BoundingBox, 'geoMin' | 'geoMax'>
  ) => { geoMin: GeoCoordinate; geoMax: GeoCoordinate } | null;
  finishResize: () => void;
  cancelResize: () => { geoMin: GeoCoordinate; geoMax: GeoCoordinate } | null;
  setMiddleMousePressed: (pressed: boolean) => void;
  setHoveredBox: (boxId: string | number | null) => void;
}

const initialDrawState: DrawState = {
  isDrawing: false,
  startGeo: null,
  currentGeo: null,
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
  const [controlsEnabled, setControlsEnabled] = useState(true);

  const startDraw = useCallback((geo: GeoCoordinate) => {
    setDrawState({
      isDrawing: true,
      startGeo: { ...geo },
      currentGeo: { ...geo },
    });
    setControlsEnabled(false);
  }, []);

  const updateDraw = useCallback((geo: GeoCoordinate) => {
    setDrawState((prev) => {
      if (!prev.isDrawing || !prev.startGeo) return prev;

      // Clamp geographic coordinates
      const clampedGeo = {
        azimuth: Math.max(0, Math.min(360, geo.azimuth)),
        altitude: Math.max(-90, Math.min(90, geo.altitude)),
      };

      // Prevent wrapping - constrain width to max degrees
      let currentAz = clampedGeo.azimuth;
      const startAz = prev.startGeo.azimuth;
      const deltaAz = currentAz - startAz;

      if (Math.abs(deltaAz) > MAX_BOX_WIDTH_DEG) {
        currentAz = startAz + Math.sign(deltaAz) * MAX_BOX_WIDTH_DEG;
      }

      return {
        ...prev,
        currentGeo: { azimuth: currentAz, altitude: clampedGeo.altitude },
      };
    });
  }, []);

  const finishDraw = useCallback((): { geoMin: GeoCoordinate; geoMax: GeoCoordinate } | null => {
    const { startGeo, currentGeo } = drawState;

    setDrawState(initialDrawState);
    setControlsEnabled(true);

    if (!startGeo || !currentGeo) return null;

    const geoMin = {
      azimuth: Math.min(startGeo.azimuth, currentGeo.azimuth),
      altitude: Math.min(startGeo.altitude, currentGeo.altitude),
    };
    const geoMax = {
      azimuth: Math.max(startGeo.azimuth, currentGeo.azimuth),
      altitude: Math.max(startGeo.altitude, currentGeo.altitude),
    };

    // Check minimum size
    if (
      geoMax.azimuth - geoMin.azimuth < MIN_BOX_SIZE_DEG ||
      geoMax.altitude - geoMin.altitude < MIN_BOX_SIZE_DEG
    ) {
      return null;
    }

    return { geoMin, geoMax };
  }, [drawState]);

  const cancelDraw = useCallback(() => {
    setDrawState(initialDrawState);
    setControlsEnabled(true);
  }, []);

  const startResize = useCallback(
    (
      boxId: string | number,
      handleType: HandleType,
      originalBox: Pick<BoundingBox, 'geoMin' | 'geoMax'>
    ) => {
      setResizeState({
        isResizing: true,
        boxId,
        handleType,
        originalBox: {
          geoMin: { ...originalBox.geoMin },
          geoMax: { ...originalBox.geoMax },
        },
      });
      setControlsEnabled(false);
    },
    []
  );

  const updateResize = useCallback(
    (
      geo: GeoCoordinate,
      currentBox: Pick<BoundingBox, 'geoMin' | 'geoMax'>
    ): { geoMin: GeoCoordinate; geoMax: GeoCoordinate } | null => {
      if (!resizeState.isResizing || !resizeState.handleType) return null;

      const clampedGeo = {
        azimuth: Math.max(0, Math.min(360, geo.azimuth)),
        altitude: Math.max(-90, Math.min(90, geo.altitude)),
      };

      const newGeoMin = { ...currentBox.geoMin };
      const newGeoMax = { ...currentBox.geoMax };

      switch (resizeState.handleType) {
        case 'top-left':
          newGeoMin.azimuth = Math.min(clampedGeo.azimuth, newGeoMax.azimuth - MIN_BOX_SIZE_DEG);
          newGeoMax.altitude = Math.max(clampedGeo.altitude, newGeoMin.altitude + MIN_BOX_SIZE_DEG);
          break;
        case 'top-right':
          newGeoMax.azimuth = Math.max(clampedGeo.azimuth, newGeoMin.azimuth + MIN_BOX_SIZE_DEG);
          newGeoMax.altitude = Math.max(clampedGeo.altitude, newGeoMin.altitude + MIN_BOX_SIZE_DEG);
          break;
        case 'bottom-left':
          newGeoMin.azimuth = Math.min(clampedGeo.azimuth, newGeoMax.azimuth - MIN_BOX_SIZE_DEG);
          newGeoMin.altitude = Math.min(clampedGeo.altitude, newGeoMax.altitude - MIN_BOX_SIZE_DEG);
          break;
        case 'bottom-right':
          newGeoMax.azimuth = Math.max(clampedGeo.azimuth, newGeoMin.azimuth + MIN_BOX_SIZE_DEG);
          newGeoMin.altitude = Math.min(clampedGeo.altitude, newGeoMax.altitude - MIN_BOX_SIZE_DEG);
          break;
      }

      return { geoMin: newGeoMin, geoMax: newGeoMax };
    },
    [resizeState.isResizing, resizeState.handleType]
  );

  const finishResize = useCallback(() => {
    setResizeState(initialResizeState);
    setControlsEnabled(true);
  }, []);

  const cancelResize = useCallback((): { geoMin: GeoCoordinate; geoMax: GeoCoordinate } | null => {
    const original = resizeState.originalBox;
    setResizeState(initialResizeState);
    setControlsEnabled(true);
    return original;
  }, [resizeState.originalBox]);

  const setMiddleMousePressed = useCallback((pressed: boolean) => {
    setMiddleMousePressedState(pressed);
  }, []);

  const setHoveredBox = useCallback((boxId: string | number | null) => {
    setHoverState({ hoveredBoxId: boxId });
  }, []);

  // Cancel drawing and resizing when middle mouse is pressed (to allow orbiting)
  useEffect(() => {
    if (middleMousePressed) {
      setDrawState(initialDrawState);
      setResizeState(initialResizeState);
      setControlsEnabled(true);
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
