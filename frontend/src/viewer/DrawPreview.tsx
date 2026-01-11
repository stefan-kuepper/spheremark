import { useMemo } from 'react';
import { generateBoxPoints } from '../utils/coordinates';
import type { UVCoordinate } from '../types';

interface DrawPreviewProps {
  startUV: UVCoordinate;
  currentUV: UVCoordinate;
}

export function DrawPreview({ startUV, currentUV }: DrawPreviewProps) {
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

  return (
    <lineLoop>
      <bufferGeometry>
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
