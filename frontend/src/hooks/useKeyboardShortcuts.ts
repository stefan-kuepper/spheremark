import { useEffect, useCallback } from 'react';
import { useInteraction } from './useInteraction';
import { useAnnotations } from './useAnnotations';
import { InteractionMode } from '../types';

interface UseKeyboardShortcutsOptions {
  onLabelEdit?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { mode, setMode, cancelDraw, cancelResize, drawState, resizeState } =
    useInteraction();
  const { selectedBoxId, deleteBox, updateBox } = useAnnotations();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case 'Escape':
          if (drawState.isDrawing) {
            cancelDraw();
          } else if (resizeState.isResizing) {
            const original = cancelResize();
            if (original && resizeState.boxId !== null) {
              updateBox(resizeState.boxId, original.uvMin, original.uvMax);
            }
          } else if (mode !== InteractionMode.VIEW) {
            setMode(InteractionMode.VIEW);
          }
          break;

        case 'd':
        case 'D':
          if (!drawState.isDrawing && !resizeState.isResizing) {
            setMode(InteractionMode.DRAW);
          }
          break;

        case 'e':
        case 'E':
          if (!drawState.isDrawing && !resizeState.isResizing) {
            setMode(InteractionMode.EDIT);
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (
            mode === InteractionMode.EDIT &&
            selectedBoxId !== null &&
            !resizeState.isResizing
          ) {
            deleteBox(selectedBoxId);
          }
          break;

        case 'l':
        case 'L':
          if (mode === InteractionMode.EDIT && selectedBoxId !== null) {
            options.onLabelEdit?.();
          }
          break;
      }
    },
    [
      mode,
      setMode,
      cancelDraw,
      cancelResize,
      drawState.isDrawing,
      resizeState.isResizing,
      resizeState.boxId,
      selectedBoxId,
      deleteBox,
      updateBox,
      options,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
