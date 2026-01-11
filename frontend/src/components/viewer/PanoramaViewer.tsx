import { Suspense, useRef, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PanoramaSphere } from '../../viewer/PanoramaSphere';
import { CameraController, type CameraControllerHandle } from '../../viewer/CameraController';
import { BoundingBoxMesh } from '../../viewer/BoundingBox';
import { BoxHandles } from '../../viewer/BoxHandles';
import { DrawPreview } from '../../viewer/DrawPreview';
import { useAnnotations, useInteraction, useKeyboardShortcuts } from '../../hooks';
import { Toolbar } from '../layout/Toolbar';
import { SidePanel } from '../layout/SidePanel';
import { ModeIndicator } from '../layout/ModeIndicator';
import { SaveStatus } from '../layout/SaveStatus';
import { ExportDialog } from '../dialogs/ExportDialog';
import { InteractionMode } from '../../types';
import type { BoundingBox, UVCoordinate, HandleType } from '../../types';
import { SELECTED_COLOR } from '../../utils/colors';

export function PanoramaViewer() {
  const cameraRef = useRef<CameraControllerHandle>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const {
    boxes,
    selectedBoxId,
    selectBox,
    createBox,
    updateBox,
    getBoxAtUV,
    getSelectedBox,
  } = useAnnotations();

  const {
    mode,
    drawState,
    resizeState,
    startDraw,
    updateDraw,
    finishDraw,
    startResize,
    updateResize,
    finishResize,
  } = useInteraction();

  // Keyboard shortcuts
  useKeyboardShortcuts();

  const handleFocusBox = useCallback((box: BoundingBox) => {
    cameraRef.current?.focusOnBox(box);
  }, []);

  const handlePointerDown = useCallback(
    (uv: UVCoordinate) => {
      if (mode === InteractionMode.DRAW) {
        startDraw(uv);
      } else if (mode === InteractionMode.EDIT) {
        const box = getBoxAtUV(uv);
        selectBox(box?.id ?? null);
      }
    },
    [mode, startDraw, getBoxAtUV, selectBox]
  );

  const handlePointerMove = useCallback(
    (uv: UVCoordinate) => {
      if (drawState.isDrawing) {
        updateDraw(uv);
      } else if (resizeState.isResizing) {
        const currentBox = getSelectedBox();
        if (currentBox) {
          const newCoords = updateResize(uv, currentBox);
          if (newCoords && resizeState.boxId !== null) {
            updateBox(resizeState.boxId, newCoords.uvMin, newCoords.uvMax);
          }
        }
      }
    },
    [drawState.isDrawing, resizeState.isResizing, resizeState.boxId, updateDraw, updateResize, getSelectedBox, updateBox]
  );

  const handlePointerUp = useCallback(
    async (_uv: UVCoordinate) => {
      if (drawState.isDrawing) {
        const result = finishDraw();
        if (result) {
          await createBox(result.uvMin, result.uvMax);
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

  // Determine canvas cursor
  const canvasCursor =
    mode === InteractionMode.DRAW
      ? 'crosshair'
      : mode === InteractionMode.EDIT
        ? 'pointer'
        : 'grab';

  return (
    <>
      <div id="canvas-container" style={{ cursor: canvasCursor }}>
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

          {/* Render bounding boxes */}
          {boxes.map((box) => (
            <BoundingBoxMesh
              key={box.id}
              uvMin={box.uvMin}
              uvMax={box.uvMax}
              color={box.id === selectedBoxId ? SELECTED_COLOR : box.color}
            />
          ))}

          {/* Render handles for selected box in EDIT mode */}
          {mode === InteractionMode.EDIT && selectedBoxId !== null && (
            <BoxHandles
              box={boxes.find((b) => b.id === selectedBoxId)!}
              onDragStart={handleResizeStart}
            />
          )}

          {/* Draw preview */}
          {drawState.isDrawing && drawState.startUV && drawState.currentUV && (
            <DrawPreview
              startUV={drawState.startUV}
              currentUV={drawState.currentUV}
            />
          )}
        </Canvas>
      </div>

      <Toolbar onExportClick={() => setExportDialogOpen(true)} />
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
