/**
 * BoundingBoxManager - Manages bounding boxes with server synchronization
 * Handles creation, selection, deletion, and auto-save to backend
 */

import { BoundingBox3D, uvTo3D } from '../viewer/BoundingBox3D.js';
import { BoxHandle } from '../viewer/BoxHandle.js';
import { annotations } from '../api/client.js';

export class BoundingBoxManager {
    constructor(scene, imageId, onSaveStatusChange) {
        this.scene = scene;
        this.imageId = imageId;
        this.onSaveStatusChange = onSaveStatusChange || (() => {});
        this.boxes = [];
        this.selectedBoxId = null;
        this.nextLocalId = 0;
        this.onResizeStart = null;
    }

    /**
     * Load existing annotations from server
     */
    async loadAnnotations() {
        try {
            const annotationsData = await annotations.listForImage(this.imageId);

            for (const annotation of annotationsData) {
                const box = {
                    id: annotation.id,
                    serverId: annotation.id,
                    uvMin: {
                        u: annotation.uv_min_u,
                        v: annotation.uv_min_v,
                    },
                    uvMax: {
                        u: annotation.uv_max_u,
                        v: annotation.uv_max_v,
                    },
                    label: annotation.label || '',
                    color: annotation.color || this.generateRandomColor(),
                    visual: null,
                    handles: [],
                    createdAt: new Date(annotation.created_at).getTime(),
                };

                box.visual = new BoundingBox3D(
                    this.scene,
                    box.uvMin,
                    box.uvMax,
                    box.color,
                );

                this.boxes.push(box);
            }

            this.updateUI();
        } catch (error) {
            console.error('Failed to load annotations:', error);
            throw error;
        }
    }

    /**
     * Create a new bounding box
     */
    async createBox(uvMin, uvMax) {
        const color = this.generateRandomColor();

        // Create box locally first
        const box = {
            id: `local-${this.nextLocalId++}`,
            serverId: null,
            uvMin: { ...uvMin },
            uvMax: { ...uvMax },
            label: '',
            color: color,
            visual: null,
            handles: [],
            createdAt: Date.now(),
        };

        box.visual = new BoundingBox3D(
            this.scene,
            box.uvMin,
            box.uvMax,
            box.color,
        );

        this.boxes.push(box);
        this.updateUI();

        // Save to server
        try {
            this.onSaveStatusChange('saving');
            const savedAnnotation = await annotations.create(this.imageId, {
                label: box.label,
                uv_min_u: box.uvMin.u,
                uv_min_v: box.uvMin.v,
                uv_max_u: box.uvMax.u,
                uv_max_v: box.uvMax.v,
                color: box.color,
            });

            // Update box with server ID
            box.serverId = savedAnnotation.id;
            box.id = savedAnnotation.id;

            this.onSaveStatusChange('saved');
        } catch (error) {
            console.error('Failed to save annotation:', error);
            this.onSaveStatusChange('error');
        }

        return box;
    }

    /**
     * Select a box
     */
    selectBox(boxId) {
        if (this.selectedBoxId !== null) {
            this.hideHandles(this.selectedBoxId);
            const prevBox = this.boxes.find(
                (b) => b.id == this.selectedBoxId,
            );
            if (prevBox) {
                prevBox.visual.setColor(prevBox.color);
            }
        }

        this.selectedBoxId = boxId;

        if (boxId !== null) {
            this.showHandles(boxId);
            const box = this.boxes.find((b) => b.id == boxId);
            if (box) {
                box.visual.setColor("#00ff00"); // Highlight selected
            }
        }

        this.updateUI();
    }

    /**
     * Delete a box
     */
    async deleteBox(boxId) {
        const index = this.boxes.findIndex((b) => b.id == boxId);
        if (index === -1) return;

        const box = this.boxes[index];

        // Delete from server if it has a server ID
        if (box.serverId) {
            try {
                this.onSaveStatusChange('saving');
                await annotations.delete(box.serverId);
                this.onSaveStatusChange('saved');
            } catch (error) {
                console.error('Failed to delete annotation:', error);
                this.onSaveStatusChange('error');
                return; // Don't remove locally if server delete failed
            }
        }

        box.visual.dispose();
        this.hideHandles(boxId);

        this.boxes.splice(index, 1);

        if (this.selectedBoxId === boxId) {
            this.selectedBoxId = null;
        }

        this.updateUI();
    }

    /**
     * Update a box
     */
    async updateBox(boxId, uvMin, uvMax) {
        const box = this.boxes.find((b) => b.id == boxId);
        if (!box) return;

        box.uvMin = { ...uvMin };
        box.uvMax = { ...uvMax };
        box.visual.updateGeometry(uvMin, uvMax);

        this.updateHandlePositions(boxId);
        this.updateUI();

        // Save to server if it has a server ID
        if (box.serverId) {
            try {
                this.onSaveStatusChange('saving');
                await annotations.update(box.serverId, {
                    label: box.label,
                    uv_min_u: box.uvMin.u,
                    uv_min_v: box.uvMin.v,
                    uv_max_u: box.uvMax.u,
                    uv_max_v: box.uvMax.v,
                    color: box.color,
                });
                this.onSaveStatusChange('saved');
            } catch (error) {
                console.error('Failed to update annotation:', error);
                this.onSaveStatusChange('error');
            }
        }
    }

    /**
     * Update box label
     */
    async updateBoxLabel(boxId, label) {
        const box = this.boxes.find((b) => b.id == boxId);
        if (!box) return;

        box.label = label;
        this.updateUI();

        // Save to server if it has a server ID
        if (box.serverId) {
            try {
                this.onSaveStatusChange('saving');
                await annotations.update(box.serverId, {
                    label: box.label,
                    uv_min_u: box.uvMin.u,
                    uv_min_v: box.uvMin.v,
                    uv_max_u: box.uvMax.u,
                    uv_max_v: box.uvMax.v,
                    color: box.color,
                });
                this.onSaveStatusChange('saved');
            } catch (error) {
                console.error('Failed to update annotation label:', error);
                this.onSaveStatusChange('error');
            }
        }
    }

    /**
     * Show resize handles for a box
     */
    showHandles(boxId) {
        const box = this.boxes.find((b) => b.id == boxId);
        if (!box) return;

        const corners = [
            {
                type: "top-left",
                uv: { u: box.uvMin.u, v: box.uvMin.v },
            },
            {
                type: "top-right",
                uv: { u: box.uvMax.u, v: box.uvMin.v },
            },
            {
                type: "bottom-left",
                uv: { u: box.uvMin.u, v: box.uvMax.v },
            },
            {
                type: "bottom-right",
                uv: { u: box.uvMax.u, v: box.uvMax.v },
            },
        ];

        box.handles = corners.map((corner) => {
            const pos3D = uvTo3D(corner.uv.u, corner.uv.v);
            return new BoxHandle(
                this.scene,
                pos3D,
                corner.type,
                boxId,
                (id, type) => {
                    if (this.onResizeStart) {
                        this.onResizeStart(id, type);
                    }
                },
            );
        });
    }

    /**
     * Hide resize handles for a box
     */
    hideHandles(boxId) {
        const box = this.boxes.find((b) => b.id == boxId);
        if (!box) return;

        box.handles.forEach((handle) => handle.dispose());
        box.handles = [];
    }

    /**
     * Update handle positions (after resize)
     */
    updateHandlePositions(boxId) {
        this.hideHandles(boxId);
        this.showHandles(boxId);
    }

    /**
     * Generate a random color for a box
     */
    generateRandomColor() {
        const colors = [
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#ffff00",
            "#ff00ff",
            "#00ffff",
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Find box at UV coordinates
     */
    getBoxAtUV(uv) {
        for (const box of this.boxes) {
            if (
                uv.u >= box.uvMin.u &&
                uv.u <= box.uvMax.u &&
                uv.v >= box.uvMin.v &&
                uv.v <= box.uvMax.v
            ) {
                return box;
            }
        }
        return null;
    }

    /**
     * Update UI (to be implemented in main.js)
     */
    updateUI() {
        if (this.onUIUpdate) {
            this.onUIUpdate(this.boxes, this.selectedBoxId);
        }
    }

    /**
     * Set UI update callback
     */
    setUIUpdateCallback(callback) {
        this.onUIUpdate = callback;
    }

    /**
     * Set resize start callback
     */
    setResizeStartCallback(callback) {
        this.onResizeStart = callback;
    }
}
