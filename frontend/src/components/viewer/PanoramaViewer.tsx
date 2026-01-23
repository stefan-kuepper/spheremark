import { Suspense, useRef, useCallback, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PanoramaSphere } from '../../viewer/PanoramaSphere';
import { CameraController, type CameraControllerHandle } from '../../viewer/CameraController';
import { BoundingBoxMesh } from '../../viewer/BoundingBox';
import { BoxHandles } from '../../viewer/BoxHandles';
import { DrawPreview } from '../../viewer/DrawPreview';
import { useAnnotations, useInteraction, useKeyboardShortcuts } from '../../hooks';
import { SidePanel } from '../layout/SidePanel';
import { ProjectSidebar } from '../layout/ProjectSidebar';
import { ModeIndicator } from '../layout/ModeIndicator';
import { SaveStatus } from '../layout/SaveStatus';
import { ExportDialog } from '../dialogs/ExportDialog';
import { uvToGeo } from '../../utils/coordinates';

import type { BoundingBox, GeoCoordinate, HandleType } from '../../types';
import { SELECTED_COLOR } from '../../utils/colors';

interface DragHandlerProps {
  onPointerMove: (geo: GeoCoordinate) => void;
  onPointerUp: (geo: GeoCoordinate) => void;
  isActive: boolean;
}

const SPHERE_RADIUS = 500;
const helperSphere = new THREE.Mesh(
  new THREE.SphereGeometry(SPHERE_RADIUS, 60, 30),
  new THREE.MeshBasicMaterial()
);
helperSphere.rotation.set(0, Math.PI, 0);
helperSphere.updateMatrixWorld();

function DragHandler({ onPointerMove, onPointerUp, isActive }: DragHandlerProps) {
  const { camera, gl } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());

  useEffect(() => {
    if (!isActive) return;

    const raycaster = raycasterRef.current;
    const canvas = gl.domElement;

    const getGeoFromScreenCoords = (clientX: number, clientY: number): GeoCoordinate | null => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObject(helperSphere);

      if (intersects.length > 0 && intersects[0].uv) {
        const u = intersects[0].uv.x;
        const v = 1 - intersects[0].uv.y;
        return uvToGeo(u, v);
      }
      return null;
    };

    const handleWindowPointerMove = (e: PointerEvent) => {
      const geo = getGeoFromScreenCoords(e.clientX, e.clientY);
      if (geo) onPointerMove(geo);
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      const geo = getGeoFromScreenCoords(e.clientX, e.clientY);
      if (geo) onPointerUp(geo);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [isActive, camera, gl, onPointerMove, onPointerUp]);

  return null;
}

export function PanoramaViewer() {
  const cameraRef = useRef<CameraControllerHandle>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const {
    boxes,
    selectedBoxId,
    selectBox,
    createBox,
    updateBox,
    getBoxAtGeo,
    getSelectedBox,
  } = useAnnotations();

  const {
    drawState,
    resizeState,
    hoverState,
    middleMousePressed,
    setMiddleMousePressed,
    setHoveredBox,
    startDraw,
    updateDraw,
    finishDraw,
    startResize,
    updateResize,
    finishResize,
  } = useInteraction();

  useKeyboardShortcuts();

  useEffect(() => {
    const canvas = document.querySelector('.canvas-container canvas');
    if (!canvas) return;

    const handleMouseDown = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      if (mouseEvent.button === 1) {
        mouseEvent.preventDefault();
        setMiddleMousePressed(true);
      }
    };

    const handleMouseUp = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      if (mouseEvent.button === 1) {
        setMiddleMousePressed(false);
      }
    };

    const handlePointerLeave = () => {
      setHoveredBox(null);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [setMiddleMousePressed, setHoveredBox]);

  const handleFocusBox = useCallback((box: BoundingBox) => {
    cameraRef.current?.focusOnBox(box);
  }, []);

  const handlePointerDown = useCallback(
    (geo: GeoCoordinate) => {
      if (middleMousePressed) return;

      const box = getBoxAtGeo(geo);
      if (box) {
        selectBox(box.id);
      } else {
        startDraw(geo);
      }
    },
    [middleMousePressed, getBoxAtGeo, selectBox, startDraw]
  );

  const handlePointerMove = useCallback(
    (geo: GeoCoordinate) => {
      const box = getBoxAtGeo(geo);
      setHoveredBox(box?.id ?? null);

      if (drawState.isDrawing) {
        updateDraw(geo);
      } else if (resizeState.isResizing) {
        const currentBox = getSelectedBox();
        if (currentBox) {
          const newCoords = updateResize(geo, currentBox);
          if (newCoords && resizeState.boxId !== null) {
            updateBox(resizeState.boxId, newCoords.geoMin, newCoords.geoMax);
          }
        }
      }
    },
    [drawState.isDrawing, resizeState.isResizing, resizeState.boxId, updateDraw, updateResize, getSelectedBox, updateBox, getBoxAtGeo, setHoveredBox]
  );

  const handlePointerUp = useCallback(
    async (_geo: GeoCoordinate) => {
      if (drawState.isDrawing) {
        const result = finishDraw();
        if (result) {
          await createBox(result.geoMin, result.geoMax);
        }
      } else if (resizeState.isResizing) {
        finishResize();
      }
    },
    [drawState.isDrawing, resizeState.isResizing, finishDraw, finishResize, createBox]
  );

  const handleResizeStart = useCallback(
    (boxId: string | number, handleType: HandleType) => {
      const box = boxes.find((b) => b.id === boxId);
      if (box) {
        startResize(boxId, handleType, box);
      }
    },
    [boxes, startResize]
  );

  const canvasCursor = middleMousePressed
    ? 'grab'
    : hoverState.hoveredBoxId !== null
      ? 'pointer'
      : 'crosshair';

  const boxIdToShowHandles = hoverState.hoveredBoxId ?? selectedBoxId;
  const boxToShowHandles = boxIdToShowHandles
    ? boxes.find((b) => b.id === boxIdToShowHandles)
    : null;

  return (
    <>
      <div className="canvas-container fixed inset-0 w-full h-full" style={{ cursor: canvasCursor }}>
        <Canvas
          camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 0.1] }}
          gl={{ antialias: false }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = 'srgb';
          }}
        >
          <Suspense fallback={null}>
            <PanoramaSphere
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          </Suspense>

          <CameraController ref={cameraRef} />

          {boxes.map((box) => (
            <BoundingBoxMesh
              key={box.id}
              geoMin={box.geoMin}
              geoMax={box.geoMax}
              color={box.id === selectedBoxId ? SELECTED_COLOR : box.color}
            />
          ))}

          {boxToShowHandles && (
            <BoxHandles
              box={boxToShowHandles}
              onDragStart={handleResizeStart}
            />
          )}

          {drawState.isDrawing && drawState.startGeo && drawState.currentGeo && (
            <DrawPreview
              startGeo={drawState.startGeo}
              currentGeo={drawState.currentGeo}
            />
          )}

          <DragHandler
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            isActive={drawState.isDrawing || resizeState.isResizing}
          />
        </Canvas>
      </div>

      <ProjectSidebar onExportClick={() => setExportDialogOpen(true)} />
      <SidePanel onFocusBox={handleFocusBox} />
      <ModeIndicator />
      <SaveStatus />
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
    </>
  );
}
