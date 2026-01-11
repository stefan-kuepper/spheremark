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
import type { BoundingBox, UVCoordinate, SaveStatus } from '../types';

interface AnnotationContextValue {
  boxes: BoundingBox[];
  selectedBoxId: string | number | null;
  saveStatus: SaveStatus;
  loadAnnotations: () => Promise<void>;
  createBox: (uvMin: UVCoordinate, uvMax: UVCoordinate) => Promise<BoundingBox>;
  updateBox: (
    boxId: string | number,
    uvMin: UVCoordinate,
    uvMax: UVCoordinate
  ) => Promise<void>;
  updateBoxLabel: (boxId: string | number, label: string) => Promise<void>;
  deleteBox: (boxId: string | number) => Promise<void>;
  selectBox: (boxId: string | number | null) => void;
  getBoxAtUV: (uv: UVCoordinate) => BoundingBox | null;
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
        uvMin: {
          u: annotation.uv_min_u,
          v: annotation.uv_min_v,
        },
        uvMax: {
          u: annotation.uv_max_u,
          v: annotation.uv_max_v,
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
    async (uvMin: UVCoordinate, uvMax: UVCoordinate): Promise<BoundingBox> => {
      if (!currentImageId) {
        throw new Error('No image selected');
      }

      const color = generateRandomColor();
      const localId = `local-${nextLocalId}`;
      setNextLocalId((prev) => prev + 1);

      const newBox: BoundingBox = {
        id: localId,
        serverId: null,
        uvMin: { ...uvMin },
        uvMax: { ...uvMax },
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
          uv_min_u: newBox.uvMin.u,
          uv_min_v: newBox.uvMin.v,
          uv_max_u: newBox.uvMax.u,
          uv_max_v: newBox.uvMax.v,
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
      uvMin: UVCoordinate,
      uvMax: UVCoordinate
    ): Promise<void> => {
      setBoxes((prev) =>
        prev.map((box) =>
          box.id === boxId ? { ...box, uvMin: { ...uvMin }, uvMax: { ...uvMax } } : box
        )
      );

      const box = boxes.find((b) => b.id === boxId);
      if (box?.serverId) {
        try {
          setSaveStatus('saving');
          await annotationsApi.update(box.serverId, {
            label: box.label,
            uv_min_u: uvMin.u,
            uv_min_v: uvMin.v,
            uv_max_u: uvMax.u,
            uv_max_v: uvMax.v,
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
            uv_min_u: box.uvMin.u,
            uv_min_v: box.uvMin.v,
            uv_max_u: box.uvMax.u,
            uv_max_v: box.uvMax.v,
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

  const getBoxAtUV = useCallback(
    (uv: UVCoordinate): BoundingBox | null => {
      for (const box of boxes) {
        if (
          uv.u >= box.uvMin.u &&
          uv.u <= box.uvMax.u &&
          uv.v >= box.uvMin.v &&
          uv.v <= box.uvMax.v
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
    getBoxAtUV,
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
