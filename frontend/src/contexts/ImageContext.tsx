import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { images as imagesApi } from '../api';
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
  selectImage: (imageId: number) => void;
  clearImage: () => void;
  getImageFileUrl: (imageId: number) => string;
  getThumbnailUrl: (imageId: number) => string;
}

const ImageContext = createContext<ImageContextValue | null>(null);

interface ImageProviderProps {
  children: ReactNode;
}

export function ImageProvider({ children }: ImageProviderProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentImage = currentImageId
    ? images.find((img) => img.id === currentImageId) ?? null
    : null;

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await imagesApi.list();
      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
      console.error('Failed to load images:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scanImages = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      await imagesApi.scan();
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan images');
      console.error('Failed to scan images:', err);
    } finally {
      setIsScanning(false);
    }
  }, [loadImages]);

  const selectImage = useCallback((imageId: number) => {
    setCurrentImageId(imageId);
  }, []);

  const clearImage = useCallback(() => {
    setCurrentImageId(null);
  }, []);

  const getImageFileUrl = useCallback((imageId: number) => {
    return imagesApi.getFileUrl(imageId);
  }, []);

  const getThumbnailUrl = useCallback((imageId: number) => {
    return imagesApi.getThumbnailUrl(imageId);
  }, []);

  // Load images on mount
  useEffect(() => {
    loadImages();
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
