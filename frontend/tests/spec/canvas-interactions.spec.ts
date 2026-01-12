import { test, expect } from '@playwright/test';
import { PanoramaViewerPage } from '../pages/PanoramaViewerPage';
import { CanvasUtils } from '../utils/canvas-utils';
import { setupApiMocks } from '../fixtures/api-mocks';

test.describe('Canvas Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/viewer/1');
  });

  test('should render canvas with proper dimensions', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.waitForCanvas();
    const dimensions = await viewer.getCanvasDimensions();
    
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
    expect(dimensions.width).toBeGreaterThan(dimensions.height * 1.5);
  });

  test('should handle mouse drag for box drawing', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.waitForCanvas();
    await viewer.selectMode('draw');
    
    const canvasDimensions = await viewer.getCanvasDimensions();
    const start = { x: canvasDimensions.width * 0.2, y: canvasDimensions.height * 0.2 };
    const end = { x: canvasDimensions.width * 0.8, y: canvasDimensions.height * 0.8 };
    
    await CanvasUtils.simulateMouseDrag(page, 'canvas', start, end);
    
    const annotationCount = await viewer.getAnnotationCount();
    expect(annotationCount).toBeGreaterThan(0);
  });

  test('should select box on canvas click', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.waitForCanvas();
    await viewer.selectMode('edit');
    
    const canvasCenter = await CanvasUtils.getCanvasCenter(page, 'canvas');
    const clickPoint = { x: canvasCenter.x * 0.5, y: canvasCenter.y * 0.5 };
    
    await CanvasUtils.clickCanvasPoint(page, 'canvas', clickPoint);
    
    const selectedBox = page.locator('[data-testid="bounding-box"].selected');
    await expect(selectedBox).toBeVisible();
  });

  test('should resize box with handles', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.waitForCanvas();
    await viewer.selectMode('edit');
    
    const canvasCenter = await CanvasUtils.getCanvasCenter(page, 'canvas');
    await CanvasUtils.clickCanvasPoint(page, 'canvas', { x: canvasCenter.x * 0.5, y: canvasCenter.y * 0.5 });
    
    const resizeHandle = page.locator('[data-testid="resize-handle"]').first();
    await expect(resizeHandle).toBeVisible();
    
    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).toBeTruthy();
    
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
      await page.mouse.up();
    }
    
    const updatedBox = page.locator('[data-testid="bounding-box"]').first();
    await expect(updatedBox).toBeVisible();
  });

  test('should maintain coordinate mapping between UV and spherical', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.waitForCanvas();
    await viewer.selectMode('draw');
    
    const canvasDimensions = await viewer.getCanvasDimensions();
    const start = { x: canvasDimensions.width * 0.25, y: canvasDimensions.height * 0.25 };
    const end = { x: canvasDimensions.width * 0.75, y: canvasDimensions.height * 0.75 };
    
    await viewer.drawBoundingBox(start, end);
    
    const coordinateDisplay = page.locator('[data-testid="coordinate-display"]');
    await expect(coordinateDisplay).toBeVisible();
    
    const coordinates = await coordinateDisplay.textContent();
    expect(coordinates).toMatch(/uv_min_u.*0\.25/);
    expect(coordinates).toMatch(/uv_min_v.*0\.25/);
    expect(coordinates).toMatch(/uv_max_u.*0\.75/);
    expect(coordinates).toMatch(/uv_max_v.*0\.75/);
  });

  test('should handle invalid coordinate inputs', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    
    await viewer.waitForCanvas();
    await viewer.selectMode('edit');
    await viewer.clickAnnotation(0);
    
    const coordinateInput = page.locator('[data-testid="coordinate-input"]').first();
    await coordinateInput.fill('2.0');
    await coordinateInput.press('Enter');
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('invalid');
    expect(errorText).toContain('coordinate');
  });
});