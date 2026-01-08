/**
 * DrawInteraction - Handles drawing new bounding boxes
 */

import { BoundingBox3D } from '../BoundingBox3D.js';

export class DrawInteraction {
    constructor(scene) {
        this.scene = scene;
        this.isDrawing = false;
        this.startUV = null;
        this.currentUV = null;
        this.previewBox = null;
    }

    start(startUV) {
        this.isDrawing = true;
        this.startUV = startUV;
        this.currentUV = { ...startUV };

        this.previewBox = new BoundingBox3D(
            this.scene,
            this.startUV,
            this.currentUV,
            "#ffffff",
        );
    }

    update(currentUV) {
        if (!this.isDrawing) return;

        this.currentUV = currentUV;

        const uvMin = {
            u: Math.min(this.startUV.u, this.currentUV.u),
            v: Math.min(this.startUV.v, this.currentUV.v),
        };
        const uvMax = {
            u: Math.max(this.startUV.u, this.currentUV.u),
            v: Math.max(this.startUV.v, this.currentUV.v),
        };

        // Clamp to prevent wrapping visualization
        // If box would wrap (width > 0.5), clamp to boundaries
        if (uvMax.u - uvMin.u > 0.5) {
            // Clamp to whichever side is closer to start point
            if (this.startUV.u < 0.5) {
                uvMax.u = 1.0;
            } else {
                uvMin.u = 0.0;
            }
        }

        this.previewBox.updateGeometry(uvMin, uvMax);
    }

    finish() {
        if (!this.isDrawing) return null;

        const uvMin = {
            u: Math.min(this.startUV.u, this.currentUV.u),
            v: Math.min(this.startUV.v, this.currentUV.v),
        };
        const uvMax = {
            u: Math.max(this.startUV.u, this.currentUV.u),
            v: Math.max(this.startUV.v, this.currentUV.v),
        };

        // Check if box wraps around the U boundary (0/1 edge)
        // If the box is wider than 0.5 in U space, it's likely wrapping
        const uWidth = uvMax.u - uvMin.u;
        if (uWidth > 0.5) {
            alert(
                "Bounding boxes cannot wrap around the panorama edge. Please draw boxes within the visible area.",
            );
            this.cancel();
            return null;
        }

        const minSize = 0.02;
        if (
            uvMax.u - uvMin.u < minSize ||
            uvMax.v - uvMin.v < minSize
        ) {
            this.cancel();
            return null;
        }

        this.previewBox.dispose();
        this.previewBox = null;
        this.isDrawing = false;
        this.startUV = null;
        this.currentUV = null;

        return { uvMin, uvMax };
    }

    cancel() {
        if (this.previewBox) {
            this.previewBox.dispose();
            this.previewBox = null;
        }
        this.isDrawing = false;
        this.startUV = null;
        this.currentUV = null;
    }
}
