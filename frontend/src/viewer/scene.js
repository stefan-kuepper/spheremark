/**
 * Scene Setup - Three.js scene initialization and utilities
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export class PanoramaScene {
    constructor(containerElement) {
        this.container = containerElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.labelRenderer = null;
        this.controls = null;
        this.sphere = null;
        this.material = null;
        this.currentTexture = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
        );
        this.camera.position.set(0, 0, 0.1);

        // Create WebGL renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        // Create CSS2D label renderer for handles
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = "absolute";
        this.labelRenderer.domElement.style.top = "0";
        this.labelRenderer.domElement.style.pointerEvents = "none";
        this.container.appendChild(this.labelRenderer.domElement);

        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(500, 60, 30);

        // Create material (without texture initially)
        this.material = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
        });

        // Create sphere mesh
        this.sphere = new THREE.Mesh(geometry, this.material);
        this.sphere.rotation.y = Math.PI;
        this.scene.add(this.sphere);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = -0.5;
        this.controls.enableZoom = false; // Disable default zoom, we'll use FOV-based zoom
        this.controls.enablePan = false;

        // Custom zoom with FOV (Field of View)
        this.renderer.domElement.addEventListener("wheel", (e) => this.onMouseWheel(e));

        // Handle window resize
        window.addEventListener("resize", () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    /**
     * Load texture from URL
     */
    async loadTexture(imageUrl) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                imageUrl,
                (texture) => {
                    // Dispose old texture if it exists
                    if (this.currentTexture) {
                        this.currentTexture.dispose();
                    }

                    // Configure texture
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;

                    // Apply texture to material
                    this.material.map = texture;
                    this.material.needsUpdate = true;
                    this.currentTexture = texture;

                    resolve();
                },
                undefined,
                (error) => {
                    console.error("Error loading texture:", error);
                    reject(error);
                },
            );
        });
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        if (this.labelRenderer) {
            this.labelRenderer.render(this.scene, this.camera);
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.labelRenderer) {
            this.labelRenderer.setSize(
                window.innerWidth,
                window.innerHeight,
            );
        }
    }

    /**
     * Handle mouse wheel for FOV-based zoom
     */
    onMouseWheel(event) {
        event.preventDefault();

        const zoomSpeed = 0.05;
        const minFOV = 20;
        const maxFOV = 100;

        // Adjust FOV based on wheel delta
        this.camera.fov += event.deltaY * zoomSpeed;

        // Clamp FOV to min/max values
        this.camera.fov = Math.max(minFOV, Math.min(maxFOV, this.camera.fov));

        // Update camera projection matrix
        this.camera.updateProjectionMatrix();
    }

    /**
     * Update mouse coordinates from event
     */
    updateMouseCoords(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    /**
     * Raycast against sphere
     */
    raycastSphere(event) {
        this.updateMouseCoords(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.sphere);
        return intersects.length > 0 ? intersects[0] : null;
    }

    /**
     * Get UV from intersection
     */
    uvFromIntersection(intersection) {
        return {
            u: intersection.uv.x,
            v: 1 - intersection.uv.y, // Invert V axis so up is up
        };
    }

    /**
     * Focus camera on a bounding box
     */
    focusOnBox(box) {
        // Calculate box center in UV space
        const centerU = (box.uvMin.u + box.uvMax.u) / 2;
        const centerV = (box.uvMin.v + box.uvMax.v) / 2;

        // Convert to spherical coordinates (accounting for sphere rotation)
        const phi = centerU * Math.PI * 2 - Math.PI / 2;
        const theta = centerV * Math.PI;

        // Position camera to look at this point from inside the sphere
        // Camera stays at origin area, we just rotate the view
        const distance = 0.1; // Keep camera near center
        this.camera.position.x = distance * Math.sin(theta) * Math.sin(phi);
        this.camera.position.y = -distance * Math.cos(theta);
        this.camera.position.z = distance * Math.sin(theta) * Math.cos(phi);

        // Ensure controls target stays at origin (sphere center)
        this.controls.target.set(0, 0, 0);

        // Zoom in by reducing FOV based on box size
        const boxSizeU = box.uvMax.u - box.uvMin.u;
        const boxSizeV = box.uvMax.v - box.uvMin.v;
        const avgBoxSize = (boxSizeU + boxSizeV) / 2;

        // Smaller boxes need more zoom (smaller FOV)
        // FOV range: 20-75 degrees
        const targetFOV = Math.max(20, Math.min(75, avgBoxSize * 500));
        this.camera.fov = targetFOV;
        this.camera.updateProjectionMatrix();

        this.controls.update();
    }
}
