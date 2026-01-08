/**
 * BoundingBox3D - 3D Bounding Box visualization on sphere
 * Renders a bounding box as a LineLoop with segmented edges
 */

import * as THREE from 'three';

// Convert UV coordinates to 3D position on sphere
export function uvTo3D(u, v, radius = 500) {
    // Account for sphere rotation (sphere.rotation.y = Math.PI)
    const phi = u * Math.PI * 2 - Math.PI / 2; // 0-360° longitude - 90° offset
    const theta = v * Math.PI; // 0-180° latitude

    return new THREE.Vector3(
        -radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta),
        -radius * Math.sin(theta) * Math.cos(phi),
    );
}

export class BoundingBox3D {
    constructor(scene, uvMin, uvMax, color) {
        this.scene = scene;
        this.uvMin = uvMin;
        this.uvMax = uvMax;
        this.color = color;
        this.lineObject = null;
        this.createGeometry();
    }

    createGeometry() {
        const segments = 20;
        const points = [];

        // Top edge
        for (let i = 0; i <= segments; i++) {
            const u =
                this.uvMin.u +
                (this.uvMax.u - this.uvMin.u) * (i / segments);
            points.push(uvTo3D(u, this.uvMin.v));
        }

        // Right edge
        for (let i = 1; i <= segments; i++) {
            const v =
                this.uvMin.v +
                (this.uvMax.v - this.uvMin.v) * (i / segments);
            points.push(uvTo3D(this.uvMax.u, v));
        }

        // Bottom edge
        for (let i = 1; i <= segments; i++) {
            const u =
                this.uvMax.u -
                (this.uvMax.u - this.uvMin.u) * (i / segments);
            points.push(uvTo3D(u, this.uvMax.v));
        }

        // Left edge
        for (let i = 1; i < segments; i++) {
            const v =
                this.uvMax.v -
                (this.uvMax.v - this.uvMin.v) * (i / segments);
            points.push(uvTo3D(this.uvMin.u, v));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(
            points,
        );
        const material = new THREE.LineBasicMaterial({
            color: this.color,
            linewidth: 2,
            depthTest: false,
        });

        this.lineObject = new THREE.LineLoop(geometry, material);
        this.scene.add(this.lineObject);
    }

    updateGeometry(uvMin, uvMax) {
        this.uvMin = uvMin;
        this.uvMax = uvMax;
        this.scene.remove(this.lineObject);
        this.lineObject.geometry.dispose();
        this.lineObject.material.dispose();
        this.createGeometry();
    }

    setColor(color) {
        this.color = color;
        this.lineObject.material.color.set(color);
    }

    dispose() {
        this.scene.remove(this.lineObject);
        this.lineObject.geometry.dispose();
        this.lineObject.material.dispose();
    }
}
