import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { generateBoxPoints } from '../utils/coordinates';
import type { UVCoordinate } from '../types';

interface DrawPreviewProps {
  startUV: UVCoordinate;
  currentUV: UVCoordinate;
}

export function DrawPreview({ startUV, currentUV }: DrawPreviewProps) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const uvMin = {
    u: Math.min(startUV.u, currentUV.u),
    v: Math.min(startUV.v, currentUV.v),
  };
  const uvMax = {
    u: Math.max(startUV.u, currentUV.u),
    v: Math.max(startUV.v, currentUV.v),
  };

  const points = useMemo(() => {
    return generateBoxPoints(uvMin, uvMax);
  }, [uvMin.u, uvMin.v, uvMax.u, uvMax.v]);

  // Update geometry when points change
  useEffect(() => {
    if (geometryRef.current) {
      const positionAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
      if (positionAttr) {
        positionAttr.array = points;
        positionAttr.needsUpdate = true;
      }
    }
  }, [points]);

  return (
    <lineLoop renderOrder={1}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" depthTest={false} linewidth={2} />
    </lineLoop>
  );
}
