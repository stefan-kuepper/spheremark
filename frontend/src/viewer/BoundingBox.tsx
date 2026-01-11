import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { generateBoxPoints } from '../utils/coordinates';
import type { UVCoordinate } from '../types';

interface BoundingBoxMeshProps {
  uvMin: UVCoordinate;
  uvMax: UVCoordinate;
  color: string;
}

export function BoundingBoxMesh({ uvMin, uvMax, color }: BoundingBoxMeshProps) {
  const lineRef = useRef<THREE.LineLoop>(null);

  const points = useMemo(() => {
    return generateBoxPoints(uvMin, uvMax);
  }, [uvMin, uvMax]);

  // Update color when it changes
  useEffect(() => {
    if (lineRef.current) {
      (lineRef.current.material as THREE.LineBasicMaterial).color.set(color);
    }
  }, [color]);

  return (
    <lineLoop ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} depthTest={false} linewidth={2} />
    </lineLoop>
  );
}
