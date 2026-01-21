import { Html } from '@react-three/drei';
import { geoTo3D } from '../utils/coordinates';
import type { BoundingBox, HandleType } from '../types';

interface BoxHandlesProps {
  box: BoundingBox;
  onDragStart: (boxId: string | number, handleType: HandleType) => void;
}

interface HandleProps {
  position: [number, number, number];
  type: HandleType;
  boxId: string | number;
  onDragStart: (boxId: string | number, handleType: HandleType) => void;
}

function Handle({ position, type, boxId, onDragStart }: HandleProps) {
  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onDragStart(boxId, type);
  };

  return (
    <Html position={position} style={{ pointerEvents: 'auto' }}>
      <div
        className="box-handle"
        onMouseDown={handleMouseDown}
        onPointerDown={handleMouseDown}
      />
    </Html>
  );
}

export function BoxHandles({ box, onDragStart }: BoxHandlesProps) {
  if (!box) return null;

  const corners: { type: HandleType; azimuth: number; altitude: number }[] = [
    { type: 'top-left', azimuth: box.geoMin.azimuth, altitude: box.geoMax.altitude },
    { type: 'top-right', azimuth: box.geoMax.azimuth, altitude: box.geoMax.altitude },
    { type: 'bottom-left', azimuth: box.geoMin.azimuth, altitude: box.geoMin.altitude },
    { type: 'bottom-right', azimuth: box.geoMax.azimuth, altitude: box.geoMin.altitude },
  ];

  return (
    <>
      {corners.map((corner) => {
        const pos3D = geoTo3D(corner.azimuth, corner.altitude);
        return (
          <Handle
            key={corner.type}
            position={[pos3D.x, pos3D.y, pos3D.z]}
            type={corner.type}
            boxId={box.id}
            onDragStart={onDragStart}
          />
        );
      })}
    </>
  );
}
