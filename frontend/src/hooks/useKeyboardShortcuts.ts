import { useEffect, useCallback } from 'react';
import { useInteraction } from './useInteraction';
import { useAnnotations } from './useAnnotations';


interface UseKeyboardShortcutsOptions {
  onLabelEdit?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { cancelDraw, cancelResize, drawState, resizeState } = useInteraction();
  const { selectedBoxId, deleteBox, updateBox, selectBox } = useAnnotations();

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
           } else if (selectedBoxId !== null) {
             selectBox(null);
           }
           break;

         case 'Delete':
         case 'Backspace':
           if (selectedBoxId !== null && !drawState.isDrawing && !resizeState.isResizing) {
             deleteBox(selectedBoxId);
           }
           break;

         case 'l':
         case 'L':
           if (selectedBoxId !== null) {
             options.onLabelEdit?.();
           }
           break;
       }
    },
     [
       cancelDraw,
       cancelResize,
       drawState.isDrawing,
       resizeState.isResizing,
       resizeState.boxId,
       selectedBoxId,
       deleteBox,
       updateBox,
       selectBox,
       options,
     ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
