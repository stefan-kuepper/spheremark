import { test, expect } from '@playwright/test';
import { setupApiMocks } from '../fixtures/api-mocks';

test.describe('Debug', () => {
  test('check panorama viewer structure', async ({ page }) => {
    await setupApiMocks(page);
    
    // Navigate to image browser first
    await page.goto('/');
    
    // Wait for images to load
    await page.waitForSelector('[data-testid="image-grid"]', { state: 'visible' });
    
    // Take screenshot of image browser
    await page.screenshot({ path: 'debug-image-browser.png' });
    
    // Click first image to navigate to panorama viewer
    await page.locator('[data-testid^="image-card-"]').first().click();
    
    // Wait for panorama viewer
    await page.waitForSelector('[data-testid="toolbar"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="canvas-container"]', { state: 'visible' });
    
    // Take screenshot of panorama viewer
    await page.screenshot({ path: 'debug-panorama-viewer.png' });
    
    // Check if buttons exist
    const toolbar = page.locator('[data-testid="toolbar"]');
    const buttons = await toolbar.locator('button').all();
    console.log(`Found ${buttons.length} buttons in toolbar`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const isVisible = await button.isVisible();
      const text = await button.textContent();
      const title = await button.getAttribute('title');
      console.log(`Button ${i}: visible=${isVisible}, text="${text}", title="${title}"`);
    }
    
    // Check for specific buttons
    const viewButton = page.locator('[data-testid="view-mode-button"]');
    const drawButton = page.locator('[data-testid="draw-mode-button"]');
    const editButton = page.locator('[data-testid="edit-mode-button"]');
    
    console.log(`View button exists: ${await viewButton.count() > 0}`);
    console.log(`Draw button exists: ${await drawButton.count() > 0}`);
    console.log(`Edit button exists: ${await editButton.count() > 0}`);
    
    // Check canvas
    const canvas = page.locator('canvas').first();
    console.log(`Canvas exists: ${await canvas.count() > 0}`);
    console.log(`Canvas visible: ${await canvas.isVisible()}`);
    
    expect(true).toBe(true); // Just to have an assertion
  });
});