/**
 * SphereMark - Main Application Entry Point
 */

import { PanoramaScene } from './viewer/scene.js';
import { BoundingBoxManager } from './managers/BoundingBoxManager.js';
import { DrawInteraction } from './viewer/interactions/DrawInteraction.js';
import { ResizeInteraction } from './viewer/interactions/ResizeInteraction.js';
import { images } from './api/client.js';

// Interaction modes
const InteractionMode = {
    VIEW: "view",
    DRAW: "draw",
    EDIT: "edit",
};

// Application state
let currentMode = InteractionMode.VIEW;
let panoramaScene = null;
let boxManager = null;
let drawInteraction = null;
let resizeInteraction = null;
let currentImageId = null;

// UI Elements
const imageBrowser = document.getElementById('image-browser');
const imageGrid = document.getElementById('image-grid');
const loadingState = document.getElementById('loading-state');
const scanningState = document.getElementById('scanning-state');
const errorState = document.getElementById('error-state');
const toolbar = document.getElementById('toolbar');
const sidePanel = document.getElementById('side-panel');
const modeIndicator = document.getElementById('mode-indicator');
const saveStatus = document.getElementById('save-status');

/**
 * Initialize the application
 */
async function init() {
    // Initialize scene
    const container = document.getElementById('canvas-container');
    panoramaScene = new PanoramaScene(container);

    // Load images
    await loadImageBrowser();

    // Setup event listeners
    setupEventListeners();
}

/**
 * Load and display image browser
 */
async function loadImageBrowser() {
    try {
        loadingState.classList.remove('hidden');
        scanningState.classList.add('hidden');
        errorState.classList.add('hidden');
        imageGrid.innerHTML = '';

        const imageList = await images.list();

        if (imageList.length === 0) {
            imageGrid.innerHTML = '<p style="text-align: center; color: #666;">No images found. Click "Scan for Images" to search for panoramic images in the configured directory.</p>';
        } else {
            imageList.forEach(image => {
                const card = createImageCard(image);
                imageGrid.appendChild(card);
            });
        }

        loadingState.classList.add('hidden');
    } catch (error) {
        console.error('Failed to load images:', error);
        loadingState.classList.add('hidden');
        scanningState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
}

/**
 * Scan for new images
 */
async function scanForImages() {
    try {
        // Disable scan button and show scanning state
        const scanButton = document.getElementById('scan-button');
        scanButton.disabled = true;

        scanningState.classList.remove('hidden');
        errorState.classList.add('hidden');
        imageGrid.innerHTML = '';

        const result = await images.scan();

        console.log('Scan complete:', result);

        scanningState.classList.add('hidden');
        scanButton.disabled = false;

        // Reload image list
        await loadImageBrowser();
    } catch (error) {
        console.error('Failed to scan for images:', error);
        scanningState.classList.add('hidden');
        errorState.classList.remove('hidden');

        const scanButton = document.getElementById('scan-button');
        scanButton.disabled = false;

        alert('Failed to scan for images. Please check the server configuration and image directory path.');
    }
}

/**
 * Create an image card element
 */
function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.dataset.imageId = image.id;

    const img = document.createElement('img');
    img.src = images.getThumbnailUrl(image.id);
    img.alt = image.filename;

    const info = document.createElement('div');
    info.className = 'image-card-info';

    const title = document.createElement('h3');
    title.textContent = image.filename;
    title.title = image.filename;

    const meta = document.createElement('p');
    meta.textContent = `${image.annotation_count || 0} annotations`;

    info.appendChild(title);
    info.appendChild(meta);
    card.appendChild(img);
    card.appendChild(info);

    card.addEventListener('click', () => loadImage(image.id));

    return card;
}

/**
 * Load an image into the viewer
 */
async function loadImage(imageId) {
    try {
        currentImageId = imageId;

        // Hide browser, show viewer UI
        imageBrowser.classList.add('hidden');
        toolbar.classList.remove('hidden');
        sidePanel.classList.remove('hidden');
        modeIndicator.classList.remove('hidden');

        // Load image texture
        const imageUrl = images.getFileUrl(imageId);
        await panoramaScene.loadTexture(imageUrl);

        // Initialize interactions
        drawInteraction = new DrawInteraction(panoramaScene.scene);
        resizeInteraction = new ResizeInteraction(panoramaScene.controls);

        // Initialize box manager
        boxManager = new BoundingBoxManager(
            panoramaScene.scene,
            imageId,
            updateSaveStatus
        );

        boxManager.setUIUpdateCallback(renderSidePanel);
        boxManager.setResizeStartCallback((boxId, handleType) => {
            const box = boxManager.boxes.find(b => b.id == boxId);
            if (box) {
                resizeInteraction.start(boxId, handleType, box);
            }
        });

        // Load existing annotations
        await boxManager.loadAnnotations();

        // Set initial mode
        setMode(InteractionMode.VIEW);

    } catch (error) {
        console.error('Failed to load image:', error);
        alert('Failed to load image. Please try again.');
        backToBrowser();
    }
}

/**
 * Return to image browser
 */
function backToBrowser() {
    // Clean up
    if (boxManager) {
        boxManager.boxes.forEach(box => {
            box.visual.dispose();
            boxManager.hideHandles(box.id);
        });
        boxManager = null;
    }

    currentImageId = null;

    // Show browser, hide viewer UI
    imageBrowser.classList.remove('hidden');
    toolbar.classList.add('hidden');
    sidePanel.classList.add('hidden');
    modeIndicator.classList.add('hidden');
    saveStatus.classList.add('hidden');

    // Reload image list
    loadImageBrowser();
}

/**
 * Set interaction mode
 */
function setMode(mode) {
    currentMode = mode;

    // Update UI
    document
        .querySelectorAll(".mode-button")
        .forEach((btn) => btn.classList.remove("active"));
    document.getElementById(`mode-${mode}`).classList.add("active");

    // Update mode indicator
    const modeTexts = {
        view: {
            text: "View Mode",
            hint: "Use OrbitControls to explore",
        },
        draw: {
            text: "Draw Mode",
            hint: "Click and drag to create box",
        },
        edit: {
            text: "Edit Mode",
            hint: "Click box to select, drag handles to resize",
        },
    };

    document.getElementById("mode-text").textContent =
        modeTexts[mode].text;
    document.getElementById("mode-hint").textContent =
        modeTexts[mode].hint;

    // Reset interactions
    if (mode === InteractionMode.VIEW && boxManager) {
        boxManager.selectBox(null);
        panoramaScene.controls.enabled = true;
    }

    // Update cursor
    updateCursor();
}

/**
 * Update cursor based on mode
 */
function updateCursor() {
    let cursor = "default";

    switch (currentMode) {
        case InteractionMode.VIEW:
            cursor = "grab";
            break;
        case InteractionMode.DRAW:
            cursor = "crosshair";
            break;
        case InteractionMode.EDIT:
            cursor = "pointer";
            break;
    }

    panoramaScene.renderer.domElement.style.cursor = cursor;
}

/**
 * Update save status indicator
 */
function updateSaveStatus(status) {
    saveStatus.classList.remove('hidden', 'saving', 'error');

    const texts = {
        saving: 'Saving...',
        saved: 'Saved',
        error: 'Save failed',
    };

    document.getElementById('save-text').textContent = texts[status] || status;

    if (status === 'saving') {
        saveStatus.classList.add('saving');
    } else if (status === 'error') {
        saveStatus.classList.add('error');
    }

    saveStatus.classList.remove('hidden');

    // Auto-hide after 2 seconds for saved/error
    if (status !== 'saving') {
        setTimeout(() => {
            saveStatus.classList.add('hidden');
        }, 2000);
    }
}

/**
 * Render side panel with box list
 */
function renderSidePanel(boxes, selectedId) {
    const boxList = document.getElementById("box-list");
    const emptyState = document.getElementById("empty-state");

    if (boxes.length === 0) {
        boxList.innerHTML = "";
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    boxList.innerHTML = boxes
        .map(
            (box) => `
        <div class="box-item ${box.id === selectedId ? "selected" : ""}" data-box-id="${box.id}">
            <div class="box-info">
                <strong>Box #${box.id}</strong>
                ${box.label ? `<div>Label: ${box.label}</div>` : ''}
            </div>

            <div class="box-info">
                UV: (${box.uvMin.u.toFixed(3)}, ${box.uvMin.v.toFixed(3)}) to
                     (${box.uvMax.u.toFixed(3)}, ${box.uvMax.v.toFixed(3)})
            </div>

            <div class="box-info">
                Size: ${((box.uvMax.u - box.uvMin.u) * 100).toFixed(1)}% ×
                      ${((box.uvMax.v - box.uvMin.v) * 100).toFixed(1)}%
            </div>

            <div class="box-actions">
                <button class="btn btn-sm btn-primary focus-btn" data-box-id="${box.id}">
                    Focus
                </button>
                <button class="btn btn-sm btn-danger delete-btn" data-box-id="${box.id}">
                    Delete
                </button>
            </div>
        </div>
    `,
        )
        .join("");

    // Add event listeners
    document.querySelectorAll(".box-item").forEach((item) => {
        item.addEventListener("click", (e) => {
            if (!e.target.classList.contains("btn")) {
                const boxId = item.dataset.boxId;
                boxManager.selectBox(boxId);
                setMode(InteractionMode.EDIT);
            }
        });
    });

    document.querySelectorAll(".focus-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            focusBox(btn.dataset.boxId);
        });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteBox(btn.dataset.boxId);
        });
    });
}

/**
 * Focus camera on a box
 */
function focusBox(boxId) {
    const box = boxManager.boxes.find((b) => b.id == boxId);
    if (!box) return;

    panoramaScene.focusOnBox(box);
    boxManager.selectBox(boxId);
    setMode(InteractionMode.EDIT);
}

/**
 * Delete a box
 */
function deleteBox(boxId) {
    if (confirm("Delete this bounding box?")) {
        boxManager.deleteBox(boxId);
    }
}

/**
 * Export boxes (placeholder)
 */
function exportBoxes() {
    alert('Export functionality will be implemented in Phase 4');
}

/**
 * Canvas event handlers
 */
function onCanvasMouseDown(event) {
    if (!boxManager) return;

    if (currentMode === InteractionMode.DRAW) {
        const sphereHit = panoramaScene.raycastSphere(event);
        if (sphereHit) {
            panoramaScene.controls.enabled = false;
            const uv = panoramaScene.uvFromIntersection(sphereHit);
            drawInteraction.start(uv);
        }
    } else if (currentMode === InteractionMode.EDIT) {
        const sphereHit = panoramaScene.raycastSphere(event);
        if (sphereHit) {
            const hitUV = panoramaScene.uvFromIntersection(sphereHit);
            const box = boxManager.getBoxAtUV(hitUV);
            if (box) {
                boxManager.selectBox(box.id);
            } else {
                boxManager.selectBox(null);
            }
        }
    }
}

function onCanvasMouseMove(event) {
    if (!boxManager) return;

    if (drawInteraction && drawInteraction.isDrawing) {
        const sphereHit = panoramaScene.raycastSphere(event);
        if (sphereHit) {
            const uv = panoramaScene.uvFromIntersection(sphereHit);
            drawInteraction.update(uv);
        }
    }

    if (resizeInteraction && resizeInteraction.isResizing) {
        const sphereHit = panoramaScene.raycastSphere(event);
        if (sphereHit) {
            const uv = panoramaScene.uvFromIntersection(sphereHit);
            const box = boxManager.boxes.find(b => b.id == resizeInteraction.boxId);
            if (box) {
                const newCoords = resizeInteraction.update(uv, box);
                if (newCoords) {
                    boxManager.updateBox(resizeInteraction.boxId, newCoords.uvMin, newCoords.uvMax);
                }
            }
        }
    }
}

function onCanvasMouseUp(event) {
    if (!boxManager) return;

    if (drawInteraction && drawInteraction.isDrawing) {
        const result = drawInteraction.finish();
        if (result) {
            boxManager.createBox(result.uvMin, result.uvMax);
        }
        panoramaScene.controls.enabled = true;
    }

    if (resizeInteraction && resizeInteraction.isResizing) {
        resizeInteraction.finish();
    }
}

function onKeyDown(event) {
    switch (event.key) {
        case "Escape":
            setMode(InteractionMode.VIEW);
            if (drawInteraction) drawInteraction.cancel();
            if (resizeInteraction) {
                const restored = resizeInteraction.cancel();
                if (restored && boxManager) {
                    boxManager.updateBox(
                        resizeInteraction.boxId,
                        restored.uvMin,
                        restored.uvMax
                    );
                }
            }
            if (boxManager) boxManager.selectBox(null);
            break;

        case "d":
        case "D":
            if (!event.ctrlKey && !event.metaKey && boxManager) {
                setMode(InteractionMode.DRAW);
            }
            break;

        case "e":
        case "E":
            if (!event.ctrlKey && !event.metaKey && boxManager) {
                setMode(InteractionMode.EDIT);
            }
            break;

        case "Delete":
        case "Backspace":
            if (boxManager && boxManager.selectedBoxId !== null) {
                deleteBox(boxManager.selectedBoxId);
            }
            break;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Toolbar buttons
    document.getElementById("mode-view").addEventListener("click", () => {
        setMode(InteractionMode.VIEW);
    });

    document.getElementById("mode-draw").addEventListener("click", () => {
        setMode(InteractionMode.DRAW);
    });

    document.getElementById("mode-edit").addEventListener("click", () => {
        setMode(InteractionMode.EDIT);
    });

    document.getElementById("back-to-browser").addEventListener("click", () => {
        backToBrowser();
    });

    document.getElementById("toggle-panel").addEventListener("click", () => {
        sidePanel.classList.toggle("hidden");
    });

    document.getElementById("close-panel").addEventListener("click", () => {
        sidePanel.classList.add("hidden");
    });

    document.getElementById("export-boxes").addEventListener("click", () => {
        exportBoxes();
    });

    document.getElementById("retry-button").addEventListener("click", () => {
        loadImageBrowser();
    });

    document.getElementById("scan-button").addEventListener("click", () => {
        scanForImages();
    });

    // Keyboard events
    document.addEventListener("keydown", onKeyDown);

    // Canvas mouse events (delayed to ensure renderer is ready)
    setTimeout(() => {
        if (panoramaScene && panoramaScene.renderer && panoramaScene.renderer.domElement) {
            panoramaScene.renderer.domElement.addEventListener(
                "mousedown",
                onCanvasMouseDown,
            );
            panoramaScene.renderer.domElement.addEventListener(
                "mousemove",
                onCanvasMouseMove,
            );
            panoramaScene.renderer.domElement.addEventListener(
                "mouseup",
                onCanvasMouseUp,
            );
        }
    }, 100);
}

// Initialize app on load
init();
