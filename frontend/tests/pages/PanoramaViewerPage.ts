import { Page, Locator } from '@playwright/test';

export class PanoramaViewerPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly viewModeButton: Locator;
  readonly drawModeButton: Locator;
  readonly editModeButton: Locator;
  readonly annotationList: Locator;
  readonly annotationItems: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('canvas').first();
    this.viewModeButton = page.locator('[data-testid="view-mode-button"]');
    this.drawModeButton = page.locator('[data-testid="draw-mode-button"]');
    this.editModeButton = page.locator('[data-testid="edit-mode-button"]');
    this.annotationList = page.locator('[data-testid="box-list"]');
    this.annotationItems = page.locator('[data-testid^="box-item-"]');
    this.exportButton = page.locator('[data-testid="export-button"]');
  }

  async waitForCanvas() {
    // Wait for canvas to be attached to DOM and have non-zero dimensions
    await this.canvas.waitFor({ state: 'attached' });
    // Check if canvas has dimensions
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
  }

  async selectMode(mode: 'view' | 'draw' | 'edit') {
    switch (mode) {
      case 'view':
        await this.viewModeButton.click();
        break;
      case 'draw':
        await this.drawModeButton.click();
        break;
      case 'edit':
        await this.editModeButton.click();
        break;
    }
  }

  async drawBoundingBox(start: { x: number; y: number }, end: { x: number; y: number }) {
    await this.canvas.click({ position: start });
    await this.page.mouse.down();
    await this.page.mouse.move(end.x, end.y);
    await this.page.mouse.up();
  }

  async getAnnotationCount() {
    return await this.annotationItems.count();
  }

  async clickAnnotation(index: number) {
    await this.annotationItems.nth(index).click();
  }

  async clickExportButton() {
    await this.exportButton.click();
  }

  async getCanvasDimensions() {
    const boundingBox = await this.canvas.boundingBox();
    return {
      width: boundingBox?.width || 0,
      height: boundingBox?.height || 0,
      x: boundingBox?.x || 0,
      y: boundingBox?.y || 0,
    };
  }
}