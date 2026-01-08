/**
 * BoxHandle - CSS2D handle for resizing bounding boxes
 */

import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class BoxHandle {
    constructor(scene, position3D, type, boxId, onDragStart) {
        this.scene = scene;
        this.type = type;
        this.boxId = boxId;
        this.onDragStart = onDragStart;

        const handleDiv = document.createElement("div");
        handleDiv.className = "box-handle";

        this.label = new CSS2DObject(handleDiv);
        this.label.position.copy(position3D);
        this.scene.add(this.label);

        handleDiv.addEventListener("mousedown", (e) =>
            this.handleMouseDown(e),
        );
    }

    handleMouseDown(event) {
        event.stopPropagation();
        if (this.onDragStart) {
            this.onDragStart(this.boxId, this.type);
        }
    }

    updatePosition(position3D) {
        this.label.position.copy(position3D);
    }

    dispose() {
        this.scene.remove(this.label);
    }
}
