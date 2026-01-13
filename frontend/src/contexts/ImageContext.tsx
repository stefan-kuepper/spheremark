import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { projects as projectsApi } from '../api';
import { useProjects } from './ProjectContext';
import type { ImageData } from '../types';

interface ImageContextValue {
  images: ImageData[];
  currentImageId: number | null;
  currentImage: ImageData | null;
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
  loadImages: () => Promise<void>;
  scanImages: () => Promise<void>;
  selectImage: (imageId: number | null) => void;
  clearImage: () => void;
  getImageFileUrl: (imageId: number) => string;
  getThumbnailUrl: (imageId: number) => string;
}

const ImageContext = createContext<ImageContextValue | null>(null);

interface ImageProviderProps {
  children: ReactNode;
}

export function ImageProvider({ children }: ImageProviderProps) {
  const { currentProjectId } = useProjects();
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentImage = currentImageId
    ? images.find((img) => img.id === currentImageId) ?? null
    : null;

  const loadImages = useCallback(async () => {
    if (!currentProjectId) {
      setImages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsApi.listImages(currentProjectId);
      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
      console.error('Failed to load images:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProjectId]);

  const scanImages = useCallback(async () => {
    if (!currentProjectId) return;
    setIsScanning(true);
    setError(null);
    try {
      await projectsApi.scanImages(currentProjectId);
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan images');
      console.error('Failed to scan images:', err);
    } finally {
      setIsScanning(false);
    }
  }, [currentProjectId, loadImages]);

  const selectImage = useCallback((imageId: number | null) => {
    setCurrentImageId(imageId);
  }, []);

  const clearImage = useCallback(() => {
    setCurrentImageId(null);
  }, []);

  const getImageFileUrl = useCallback((imageId: number) => {
    if (!currentProjectId) return '';
    return projectsApi.getImageFileUrl(currentProjectId, imageId);
  }, [currentProjectId]);

  const getThumbnailUrl = useCallback((imageId: number) => {
    if (!currentProjectId) return '';
    return projectsApi.getThumbnailUrl(currentProjectId, imageId);
  }, [currentProjectId]);

  // Load images when project changes
  useEffect(() => {
    loadImages();
    setCurrentImageId(null); // Clear selected image when project changes
  }, [loadImages]);

  const value: ImageContextValue = {
    images,
    currentImageId,
    currentImage,
    isLoading,
    isScanning,
    error,
    loadImages,
    scanImages,
    selectImage,
    clearImage,
    getImageFileUrl,
    getThumbnailUrl,
  };

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>;
}

export function useImages(): ImageContextValue {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImages must be used within an ImageProvider');
  }
  return context;
}
