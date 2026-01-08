/**
 * ResizeInteraction - Handles resizing existing bounding boxes
 */

export class ResizeInteraction {
    constructor(controls) {
        this.controls = controls;
        this.isResizing = false;
        this.boxId = null;
        this.handleType = null;
        this.originalBox = null;
    }

    start(boxId, handleType, originalBox) {
        this.isResizing = true;
        this.boxId = boxId;
        this.handleType = handleType;
        this.originalBox = {
            uvMin: { ...originalBox.uvMin },
            uvMax: { ...originalBox.uvMax },
        };

        this.controls.enabled = false;
    }

    update(newUV, currentBox) {
        if (!this.isResizing) return null;

        let uvMin = { ...currentBox.uvMin };
        let uvMax = { ...currentBox.uvMax };

        switch (this.handleType) {
            case "top-left":
                uvMin.u = Math.min(newUV.u, uvMax.u - 0.02);
                uvMin.v = Math.min(newUV.v, uvMax.v - 0.02);
                break;
            case "top-right":
                uvMax.u = Math.max(newUV.u, uvMin.u + 0.02);
                uvMin.v = Math.min(newUV.v, uvMax.v - 0.02);
                break;
            case "bottom-left":
                uvMin.u = Math.min(newUV.u, uvMax.u - 0.02);
                uvMax.v = Math.max(newUV.v, uvMin.v + 0.02);
                break;
            case "bottom-right":
                uvMax.u = Math.max(newUV.u, uvMin.u + 0.02);
                uvMax.v = Math.max(newUV.v, uvMin.v + 0.02);
                break;
        }

        uvMin.u = Math.max(0, Math.min(1, uvMin.u));
        uvMin.v = Math.max(0, Math.min(1, uvMin.v));
        uvMax.u = Math.max(0, Math.min(1, uvMax.u));
        uvMax.v = Math.max(0, Math.min(1, uvMax.v));

        return { uvMin, uvMax };
    }

    finish() {
        this.isResizing = false;
        this.boxId = null;
        this.handleType = null;
        this.originalBox = null;
        this.controls.enabled = true;
    }

    cancel() {
        const result = this.isResizing ? this.originalBox : null;
        this.finish();
        return result;
    }
}
