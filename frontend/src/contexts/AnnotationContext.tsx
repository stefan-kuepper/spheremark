import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { annotations as annotationsApi } from '../api';
import { useImages } from './ImageContext';
import { generateRandomColor } from '../utils/colors';
import type { BoundingBox, GeoCoordinate, SaveStatus } from '../types';

interface AnnotationContextValue {
  boxes: BoundingBox[];
  selectedBoxId: string | number | null;
  saveStatus: SaveStatus;
  loadAnnotations: () => Promise<void>;
  createBox: (geoMin: GeoCoordinate, geoMax: GeoCoordinate) => Promise<BoundingBox>;
  updateBox: (
    boxId: string | number,
    geoMin: GeoCoordinate,
    geoMax: GeoCoordinate
  ) => Promise<void>;
  updateBoxLabel: (boxId: string | number, label: string) => Promise<void>;
  deleteBox: (boxId: string | number) => Promise<void>;
  selectBox: (boxId: string | number | null) => void;
  getBoxAtGeo: (geo: GeoCoordinate) => BoundingBox | null;
  clearAnnotations: () => void;
  getSelectedBox: () => BoundingBox | null;
}

const AnnotationContext = createContext<AnnotationContextValue | null>(null);

interface AnnotationProviderProps {
  children: ReactNode;
}

export function AnnotationProvider({ children }: AnnotationProviderProps) {
  const { currentImageId } = useImages();
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [nextLocalId, setNextLocalId] = useState(0);

  const loadAnnotations = useCallback(async () => {
    if (!currentImageId) return;

    try {
      const data = await annotationsApi.listForImage(currentImageId);
      const loadedBoxes: BoundingBox[] = data.map((annotation) => ({
        id: annotation.id,
        serverId: annotation.id,
        geoMin: {
          azimuth: annotation.az_min,
          altitude: annotation.alt_min,
        },
        geoMax: {
          azimuth: annotation.az_max,
          altitude: annotation.alt_max,
        },
        label: annotation.label || '',
        color: annotation.color || generateRandomColor(),
        createdAt: new Date(annotation.created_at).getTime(),
      }));
      setBoxes(loadedBoxes);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  }, [currentImageId]);

  const createBox = useCallback(
    async (geoMin: GeoCoordinate, geoMax: GeoCoordinate): Promise<BoundingBox> => {
      if (!currentImageId) {
        throw new Error('No image selected');
      }

      const color = generateRandomColor();
      const localId = `local-${nextLocalId}`;
      setNextLocalId((prev) => prev + 1);

      const newBox: BoundingBox = {
        id: localId,
        serverId: null,
        geoMin: { ...geoMin },
        geoMax: { ...geoMax },
        label: '',
        color,
        createdAt: Date.now(),
      };

      setBoxes((prev) => [...prev, newBox]);

      // Save to server
      try {
        setSaveStatus('saving');
        const savedAnnotation = await annotationsApi.create(currentImageId, {
          label: newBox.label,
          az_min: newBox.geoMin.azimuth,
          alt_min: newBox.geoMin.altitude,
          az_max: newBox.geoMax.azimuth,
          alt_max: newBox.geoMax.altitude,
          color: newBox.color,
        });

        // Update box with server ID
        setBoxes((prev) =>
          prev.map((box) =>
            box.id === localId
              ? { ...box, id: savedAnnotation.id, serverId: savedAnnotation.id }
              : box
          )
        );

        setSaveStatus('saved');
        return { ...newBox, id: savedAnnotation.id, serverId: savedAnnotation.id };
      } catch (error) {
        console.error('Failed to save annotation:', error);
        setSaveStatus('error');
        return newBox;
      }
    },
    [currentImageId, nextLocalId]
  );

  const updateBox = useCallback(
    async (
      boxId: string | number,
      geoMin: GeoCoordinate,
      geoMax: GeoCoordinate
    ): Promise<void> => {
      setBoxes((prev) =>
        prev.map((box) =>
          box.id === boxId ? { ...box, geoMin: { ...geoMin }, geoMax: { ...geoMax } } : box
        )
      );

      const box = boxes.find((b) => b.id === boxId);
      if (box?.serverId) {
        try {
          setSaveStatus('saving');
          await annotationsApi.update(box.serverId, {
            label: box.label,
            az_min: geoMin.azimuth,
            alt_min: geoMin.altitude,
            az_max: geoMax.azimuth,
            alt_max: geoMax.altitude,
            color: box.color,
          });
          setSaveStatus('saved');
        } catch (error) {
          console.error('Failed to update annotation:', error);
          setSaveStatus('error');
        }
      }
    },
    [boxes]
  );

  const updateBoxLabel = useCallback(
    async (boxId: string | number, label: string): Promise<void> => {
      setBoxes((prev) =>
        prev.map((box) => (box.id === boxId ? { ...box, label } : box))
      );

      const box = boxes.find((b) => b.id === boxId);
      if (box?.serverId) {
        try {
          setSaveStatus('saving');
          await annotationsApi.update(box.serverId, {
            label,
            az_min: box.geoMin.azimuth,
            alt_min: box.geoMin.altitude,
            az_max: box.geoMax.azimuth,
            alt_max: box.geoMax.altitude,
            color: box.color,
          });
          setSaveStatus('saved');
        } catch (error) {
          console.error('Failed to update annotation label:', error);
          setSaveStatus('error');
        }
      }
    },
    [boxes]
  );

  const deleteBox = useCallback(
    async (boxId: string | number): Promise<void> => {
      const box = boxes.find((b) => b.id === boxId);

      if (box?.serverId) {
        try {
          setSaveStatus('saving');
          await annotationsApi.delete(box.serverId);
          setSaveStatus('saved');
        } catch (error) {
          console.error('Failed to delete annotation:', error);
          setSaveStatus('error');
          return;
        }
      }

      setBoxes((prev) => prev.filter((b) => b.id !== boxId));

      if (selectedBoxId === boxId) {
        setSelectedBoxId(null);
      }
    },
    [boxes, selectedBoxId]
  );

  const selectBox = useCallback((boxId: string | number | null) => {
    setSelectedBoxId(boxId);
  }, []);

  const getBoxAtGeo = useCallback(
    (geo: GeoCoordinate): BoundingBox | null => {
      for (const box of boxes) {
        if (
          geo.azimuth >= box.geoMin.azimuth &&
          geo.azimuth <= box.geoMax.azimuth &&
          geo.altitude >= box.geoMin.altitude &&
          geo.altitude <= box.geoMax.altitude
        ) {
          return box;
        }
      }
      return null;
    },
    [boxes]
  );

  const clearAnnotations = useCallback(() => {
    setBoxes([]);
    setSelectedBoxId(null);
    setNextLocalId(0);
  }, []);

  const getSelectedBox = useCallback((): BoundingBox | null => {
    if (selectedBoxId === null) return null;
    return boxes.find((b) => b.id === selectedBoxId) ?? null;
  }, [boxes, selectedBoxId]);

  // Load annotations when image changes
  useEffect(() => {
    if (currentImageId) {
      loadAnnotations();
    } else {
      clearAnnotations();
    }
  }, [currentImageId, loadAnnotations, clearAnnotations]);

  // Auto-hide save status after delay
  useEffect(() => {
    if (saveStatus === 'saved' || saveStatus === 'error') {
      const timeout = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [saveStatus]);

  const value: AnnotationContextValue = {
    boxes,
    selectedBoxId,
    saveStatus,
    loadAnnotations,
    createBox,
    updateBox,
    updateBoxLabel,
    deleteBox,
    selectBox,
    getBoxAtGeo,
    clearAnnotations,
    getSelectedBox,
  };

  return (
    <AnnotationContext.Provider value={value}>{children}</AnnotationContext.Provider>
  );
}

export function useAnnotations(): AnnotationContextValue {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error('useAnnotations must be used within an AnnotationProvider');
  }
  return context;
}
