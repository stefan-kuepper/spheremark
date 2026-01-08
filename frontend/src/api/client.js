/**
 * API Client for SphereMark Backend
 * Handles all communication with the FastAPI server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

/**
 * Image API
 */
export const images = {
    /**
     * List all images
     */
    async list() {
        const response = await apiFetch('/api/images');
        return response.json();
    },

    /**
     * Get image by ID
     */
    async get(imageId) {
        const response = await apiFetch(`/api/images/${imageId}`);
        return response.json();
    },

    /**
     * Get image file URL
     */
    getFileUrl(imageId) {
        return `${API_BASE_URL}/api/images/${imageId}/file`;
    },

    /**
     * Get thumbnail URL
     */
    getThumbnailUrl(imageId) {
        return `${API_BASE_URL}/api/images/${imageId}/thumbnail`;
    },

    /**
     * Scan for new images
     */
    async scan() {
        const response = await apiFetch('/api/images/scan', {
            method: 'POST',
        });
        return response.json();
    },
};

/**
 * Annotation API
 */
export const annotations = {
    /**
     * Get all annotations for an image
     */
    async listForImage(imageId) {
        const response = await apiFetch(`/api/images/${imageId}/annotations`);
        return response.json();
    },

    /**
     * Create annotation for an image
     */
    async create(imageId, data) {
        const response = await apiFetch(`/api/images/${imageId}/annotations`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.json();
    },

    /**
     * Update annotation
     */
    async update(annotationId, data) {
        const response = await apiFetch(`/api/annotations/${annotationId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.json();
    },

    /**
     * Delete annotation
     */
    async delete(annotationId) {
        await apiFetch(`/api/annotations/${annotationId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Get all annotations (all images)
     */
    async listAll() {
        const response = await apiFetch('/api/annotations');
        return response.json();
    },
};

/**
 * Export API
 */
export const exports = {
    /**
     * Export all annotations in COCO format
     */
    async exportCoco() {
        const response = await apiFetch('/api/export/coco');
        return response.json();
    },

    /**
     * Export single image in COCO format
     */
    async exportCocoImage(imageId) {
        const response = await apiFetch(`/api/export/coco/${imageId}`);
        return response.json();
    },

    /**
     * Export all annotations in YOLO format
     */
    async exportYolo() {
        const response = await apiFetch('/api/export/yolo');
        return response.json();
    },

    /**
     * Export single image in YOLO format
     */
    async exportYoloImage(imageId) {
        const response = await apiFetch(`/api/export/yolo/${imageId}`);
        return response.json();
    },

    /**
     * Download YOLO text file for an image
     */
    getYoloTxtUrl(imageId) {
        return `${API_BASE_URL}/api/export/yolo/${imageId}/txt`;
    },

    /**
     * Download YOLO classes.txt
     */
    getYoloClassesUrl() {
        return `${API_BASE_URL}/api/export/yolo/classes.txt`;
    },
};

export default {
    images,
    annotations,
    exports,
};
