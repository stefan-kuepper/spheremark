import { Page } from '@playwright/test';

export class CanvasUtils {
  static async simulateMouseDrag(
    page: Page,
    canvasSelector: string,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) {
    const canvas = page.locator(canvasSelector);
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found or not visible');
    }

    const startX = canvasBox.x + start.x;
    const startY = canvasBox.y + start.y;
    const endX = canvasBox.x + end.x;
    const endY = canvasBox.y + end.y;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
  }

  static async getCanvasCenter(page: Page, canvasSelector: string) {
    const canvas = page.locator(canvasSelector);
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found or not visible');
    }

    return {
      x: canvasBox.x + canvasBox.width / 2,
      y: canvasBox.y + canvasBox.height / 2,
    };
  }

  static async clickCanvasPoint(
    page: Page,
    canvasSelector: string,
    point: { x: number; y: number }
  ) {
    const canvas = page.locator(canvasSelector);
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found or not visible');
    }

    const clickX = canvasBox.x + point.x;
    const clickY = canvasBox.y + point.y;

    await page.mouse.click(clickX, clickY);
  }

  static async waitForCanvasReady(page: Page, canvasSelector: string, timeout = 10000) {
    const canvas = page.locator(canvasSelector);
    await canvas.waitFor({ state: 'visible', timeout });
    
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox || canvasBox.width === 0 || canvasBox.height === 0) {
      throw new Error('Canvas not properly initialized');
    }
  }
}