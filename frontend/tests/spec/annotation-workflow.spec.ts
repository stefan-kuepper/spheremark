import { test, expect } from '@playwright/test';
import { PanoramaViewerPage } from '../pages/PanoramaViewerPage';
import { setupApiMocks } from '../fixtures/api-mocks';
import { CanvasUtils } from '../utils/canvas-utils';

test.describe('Annotation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    // Navigate to image browser first, then click an image to get to panorama viewer
    await page.goto('/');
    // Wait for images to load
    await page.waitForSelector('[data-testid="image-grid"]', { state: 'visible' });
    // Click first image to navigate to panorama viewer
    await page.locator('[data-testid^="image-card-"]').first().click();
    // Wait for panorama viewer to load - wait for toolbar, canvas container, and side panel
    await page.waitForSelector('[data-testid="toolbar"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="canvas-container"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="side-panel"]', { state: 'visible' });
    // Give Three.js time to initialize
    await page.waitForTimeout(2000);
  });

  test('should switch to draw mode and create annotation', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    // Debug: check if buttons are visible
    const isDrawButtonVisible = await viewer.drawModeButton.isVisible();
    console.log(`Draw button visible: ${isDrawButtonVisible}`);
    
    // Canvas should already be loaded from beforeEach
    await viewer.selectMode('draw');
    
    const canvasDimensions = await viewer.getCanvasDimensions();
    const start = { x: canvasDimensions.width * 0.3, y: canvasDimensions.height * 0.3 };
    const end = { x: canvasDimensions.width * 0.7, y: canvasDimensions.height * 0.7 };
    
    await viewer.drawBoundingBox(start, end);
    
    const annotationCount = await viewer.getAnnotationCount();
    expect(annotationCount).toBeGreaterThan(0);
  });

  test('should switch to edit mode and select annotation', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.selectMode('edit');
    
    // Click on an annotation to select it
    await viewer.clickAnnotation(0);
    
    // Check that the annotation has the 'selected' class
    const selectedAnnotation = page.locator('[data-testid="box-item-1"].selected');
    await expect(selectedAnnotation).toBeVisible();
  });

  test('should update annotation label', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.selectMode('edit');
    
    // Click on the annotation label to edit it
    const labelElement = page.locator('[data-testid="box-label-1"]');
    await labelElement.click();
    
    // Fill in the label editor input
    const labelInput = page.locator('[data-testid="label-editor-input"]');
    await labelInput.fill('Updated Label');
    await labelInput.press('Enter');
    
    // Check that the label was updated
    const updatedLabel = page.locator('[data-testid="box-label-1"]');
    await expect(updatedLabel).toHaveText('Updated Label');
  });

  test('should delete annotation', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    const initialCount = await viewer.getAnnotationCount();
    expect(initialCount).toBeGreaterThan(0);
    
    await viewer.selectMode('edit');
    
    // Click delete button for the first annotation
    const deleteButton = page.locator('[data-testid="delete-box-button-1"]');
    await deleteButton.click();
    
    // Wait for annotation to be removed
    await page.waitForTimeout(500);
    
    const finalCount = await viewer.getAnnotationCount();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should auto-save annotation changes', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.waitForCanvas();
    await viewer.selectMode('draw');
    
    const canvasDimensions = await viewer.getCanvasDimensions();
    const start = { x: canvasDimensions.width * 0.4, y: canvasDimensions.height * 0.4 };
    const end = { x: canvasDimensions.width * 0.6, y: canvasDimensions.height * 0.6 };
    
    let saveRequestMade = false;
    await page.route('**/api/images/1/annotations', async (route) => {
      saveRequestMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 999,
          image_id: 1,
          label: 'New Annotation',
          uv_min_u: 0.4,
          uv_min_v: 0.4,
          uv_max_u: 0.6,
          uv_max_v: 0.6,
        }),
      });
    });
    
    await viewer.drawBoundingBox(start, end);
    
    expect(saveRequestMade).toBeTruthy();
  });
});