import { useRef, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useImages, useInteraction } from '../hooks';
import { InteractionMode } from '../types';
import type { ThreeEvent } from '@react-three/fiber';
import type { UVCoordinate } from '../types';

interface PanoramaSphereProps {
  onPointerDown?: (uv: UVCoordinate) => void;
  onPointerMove?: (uv: UVCoordinate) => void;
  onPointerUp?: (uv: UVCoordinate) => void;
}

export function PanoramaSphere({
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: PanoramaSphereProps) {
  const { currentImageId, getImageFileUrl } = useImages();
  const { mode, drawState, resizeState } = useInteraction();
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

  const getUVFromEvent = (event: ThreeEvent<PointerEvent>): UVCoordinate | null => {
    if (!event.uv) return null;
    return {
      u: event.uv.x,
      v: 1 - event.uv.y, // Invert V axis
    };
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (mode === InteractionMode.VIEW) return;
    event.stopPropagation();
    const uv = getUVFromEvent(event);
    if (uv) onPointerDown?.(uv);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!drawState.isDrawing && !resizeState.isResizing) return;
    event.stopPropagation();
    const uv = getUVFromEvent(event);
    if (uv) onPointerMove?.(uv);
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!drawState.isDrawing && !resizeState.isResizing) return;
    event.stopPropagation();
    const uv = getUVFromEvent(event);
    if (uv) onPointerUp?.(uv);
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
