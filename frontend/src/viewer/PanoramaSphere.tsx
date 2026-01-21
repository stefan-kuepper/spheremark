import { useRef, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useImages, useInteraction } from '../hooks';
import { uvToGeo } from '../utils/coordinates';
import type { ThreeEvent } from '@react-three/fiber';
import type { GeoCoordinate } from '../types';

interface PanoramaSphereProps {
  onPointerDown?: (geo: GeoCoordinate) => void;
  onPointerMove?: (geo: GeoCoordinate) => void;
  onPointerUp?: (geo: GeoCoordinate) => void;
}

export function PanoramaSphere({
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: PanoramaSphereProps) {
  const { currentImageId, getImageFileUrl } = useImages();
  const { drawState, resizeState, middleMousePressed } = useInteraction();
  const meshRef = useRef<THREE.Mesh>(null);

  const textureUrl = currentImageId ? getImageFileUrl(currentImageId) : null;

  // Load texture conditionally
  const texture = useLoader(
    THREE.TextureLoader,
    textureUrl || '/placeholder.png',
    undefined,
    () => {} // Error handler - silent fail for placeholder
  );

  useEffect(() => {
    if (texture && textureUrl) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture, textureUrl]);

  const getGeoFromEvent = (event: ThreeEvent<PointerEvent>): GeoCoordinate | null => {
    if (!event.uv) return null;
    // Convert Three.js UV to geographic coordinates
    const u = event.uv.x;
    const v = 1 - event.uv.y; // Invert V axis
    return uvToGeo(u, v);
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    // Only handle left mouse clicks (button 0)
    if (event.button !== 0) return;
    // Ignore if middle mouse is pressed (orbiting)
    if (middleMousePressed) return;
    event.stopPropagation();
    const geo = getGeoFromEvent(event);
    if (geo) onPointerDown?.(geo);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const geo = getGeoFromEvent(event);
    if (geo) onPointerMove?.(geo);
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    // Only handle left mouse button
    if (event.button !== 0) return;
    if (!drawState.isDrawing && !resizeState.isResizing) return;
    event.stopPropagation();
    const geo = getGeoFromEvent(event);
    if (geo) onPointerUp?.(geo);
  };

  if (!textureUrl) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      rotation={[0, Math.PI, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <sphereGeometry args={[500, 60, 30]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}
