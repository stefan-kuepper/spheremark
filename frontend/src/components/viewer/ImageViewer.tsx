import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useImages } from '../../hooks';
import { PanoramaViewer } from './PanoramaViewer';

export function ImageViewer() {
  const { id } = useParams<{ id: string }>();
  const { images, isLoading, selectImage } = useImages();

  const imageId = id ? parseInt(id, 10) : null;
  const imageExists = imageId !== null && images.some((img) => img.id === imageId);

  useEffect(() => {
    if (imageId !== null && imageExists) {
      selectImage(imageId);
    }
  }, [imageId, imageExists, selectImage]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (imageId === null || !imageExists) {
    return (
      <div className="error-page">
        <h2>Image not found</h2>
        <p>The requested image does not exist.</p>
        <Link to="/">Back to Image Browser</Link>
      </div>
    );
  }

  return <PanoramaViewer />;
}
