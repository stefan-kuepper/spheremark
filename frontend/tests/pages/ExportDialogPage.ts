import { Page, Locator } from '@playwright/test';

export class ExportDialogPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly formatSelect: Locator;
  readonly scopeSelect: Locator;
  readonly exportButton: Locator;
  readonly cancelButton: Locator;
  readonly downloadLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[data-testid="export-dialog"]');
    this.formatSelect = page.locator('[data-testid="format-coco-radio"]');
    this.scopeSelect = page.locator('[data-testid="scope-current-radio"]');
    this.exportButton = page.locator('[data-testid="download-export-button"]');
    this.cancelButton = page.locator('[data-testid="cancel-export-button"]');
    this.downloadLink = page.locator('[data-testid="download-link"]');
  }

  async waitForDialog() {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async selectFormat(format: 'coco' | 'yolo') {
    const radioSelector = format === 'coco' ? '[data-testid="format-coco-radio"]' : '[data-testid="format-yolo-radio"]';
    await this.page.locator(radioSelector).click();
  }

  async selectScope(scope: 'current' | 'all') {
    const radioSelector = scope === 'current' ? '[data-testid="scope-current-radio"]' : '[data-testid="scope-all-radio"]';
    await this.page.locator(radioSelector).click();
  }

  async clickExport() {
    await this.exportButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async hasDownloadLink() {
    return await this.downloadLink.isVisible();
  }

  async getDownloadUrl() {
    return await this.downloadLink.getAttribute('href');
  }
}