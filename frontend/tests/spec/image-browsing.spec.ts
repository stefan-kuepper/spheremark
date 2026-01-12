import { test, expect } from '@playwright/test';
import { ImageBrowserPage } from '../pages/ImageBrowserPage';
import { setupApiMocks } from '../fixtures/api-mocks';

test.describe('Image Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should display image grid with thumbnails', async ({ page }) => {
    const imageBrowser = new ImageBrowserPage(page);
    
    await imageBrowser.navigate();
    await imageBrowser.waitForImages();
    
    const imageCount = await imageBrowser.getImageCount();
    expect(imageCount).toBeGreaterThan(0);
    
    await expect(imageBrowser.imageGrid).toBeVisible();
  });

  test('should navigate to panorama viewer when clicking image', async ({ page }) => {
    const imageBrowser = new ImageBrowserPage(page);
    
    await imageBrowser.navigate();
    await imageBrowser.waitForImages();
    
    await imageBrowser.clickImage(0);
    
    // Wait for panorama viewer to load (canvas should be visible)
    await expect(page.locator('[data-testid="canvas-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="three-canvas"]')).toBeVisible();
  });

  test('should handle empty state when no images', async ({ page }) => {
    // Clear existing routes for this test
    await page.unroute('**/api/images');
    
    await page.route('**/api/images', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    const imageBrowser = new ImageBrowserPage(page);
    await imageBrowser.navigate();
    
    const hasEmptyState = await imageBrowser.hasEmptyState();
    expect(hasEmptyState).toBeTruthy();
  });

  test('should scan for images when clicking scan button', async ({ page }) => {
    const imageBrowser = new ImageBrowserPage(page);
    
    await imageBrowser.navigate();
    await imageBrowser.waitForImages();
    
    let scanRequestMade = false;
    await page.route('**/api/images/scan', async (route) => {
      scanRequestMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Scan completed' }),
      });
    });
    
    await imageBrowser.clickScanButton();
    
    expect(scanRequestMade).toBeTruthy();
  });

  test('should display image metadata', async ({ page }) => {
    const imageBrowser = new ImageBrowserPage(page);
    
    await imageBrowser.navigate();
    await imageBrowser.waitForImages();
    
    const imageCount = await imageBrowser.getImageCount();
    expect(imageCount).toBeGreaterThan(0);
    
    const imageInfo = page.locator('[data-testid="image-info-1"]');
    await expect(imageInfo).toBeVisible();
    
    const filename = await imageInfo.locator('.image-name').textContent();
    expect(filename).toContain('test-panorama');
    
    const annotationCount = await imageInfo.locator('.annotation-count').textContent();
    expect(annotationCount).toMatch(/\d+ annotation/);
  });
});