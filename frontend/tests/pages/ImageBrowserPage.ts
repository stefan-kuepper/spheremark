import { Page, Locator } from '@playwright/test';

export class ImageBrowserPage {
  readonly page: Page;
  readonly imageGrid: Locator;
  readonly imageThumbnails: Locator;
  readonly scanButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.imageGrid = page.locator('[data-testid="image-grid"]');
    this.imageThumbnails = page.locator('[data-testid^="image-card-"]');
    this.scanButton = page.locator('[data-testid="scan-images-button"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
  }

  async navigate() {
    await this.page.goto('/');
  }

  async waitForImages() {
    await this.imageGrid.waitFor({ state: 'visible' });
  }

  async getImageCount() {
    return await this.imageThumbnails.count();
  }

  async clickImage(index: number) {
    await this.imageThumbnails.nth(index).click();
  }

  async clickScanButton() {
    await this.scanButton.click();
  }

  async hasEmptyState() {
    return await this.emptyState.isVisible();
  }
}