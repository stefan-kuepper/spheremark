import { Html } from '@react-three/drei';
import { uvTo3D } from '../utils/coordinates';
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

  const corners: { type: HandleType; u: number; v: number }[] = [
    { type: 'top-left', u: box.uvMin.u, v: box.uvMin.v },
    { type: 'top-right', u: box.uvMax.u, v: box.uvMin.v },
    { type: 'bottom-left', u: box.uvMin.u, v: box.uvMax.v },
    { type: 'bottom-right', u: box.uvMax.u, v: box.uvMax.v },
  ];

  return (
    <>
      {corners.map((corner) => {
        const pos3D = uvTo3D(corner.u, corner.v);
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
