import { test, expect } from '@playwright/test';
import { PanoramaViewerPage } from '../pages/PanoramaViewerPage';
import { ExportDialogPage } from '../pages/ExportDialogPage';
import { setupApiMocks } from '../fixtures/api-mocks';

test.describe('Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/viewer/1');
  });

  test('should open export dialog', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    const exportDialog = new ExportDialogPage(page);
    
    await viewer.waitForCanvas();
    await viewer.clickExportButton();
    
    await exportDialog.waitForDialog();
    await expect(exportDialog.dialog).toBeVisible();
  });

  test('should select export format and scope', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    const exportDialog = new ExportDialogPage(page);
    
    await viewer.waitForCanvas();
    await viewer.clickExportButton();
    await exportDialog.waitForDialog();
    
    await exportDialog.selectFormat('coco');
    await exportDialog.selectScope('current');
    
    const formatValue = await exportDialog.formatSelect.inputValue();
    expect(formatValue).toBe('coco');
    
    const scopeValue = await exportDialog.scopeSelect.inputValue();
    expect(scopeValue).toBe('current');
  });

  test('should export annotations in COCO format', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    const exportDialog = new ExportDialogPage(page);
    
    await viewer.waitForCanvas();
    await viewer.clickExportButton();
    await exportDialog.waitForDialog();
    
    await exportDialog.selectFormat('coco');
    await exportDialog.selectScope('current');
    
    let exportRequestMade = false;
    await page.route('**/api/export/coco', async (route) => {
      exportRequestMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': 'attachment; filename="annotations_coco.json"',
        },
        body: JSON.stringify({
          annotations: [
            {
              image_id: 1,
              category_id: 1,
              bbox: [0.25, 0.25, 0.5, 0.5],
              area: 0.25,
              segmentation: [],
              iscrowd: 0,
            },
          ],
        }),
      });
    });
    
    await exportDialog.clickExport();
    
    expect(exportRequestMade).toBeTruthy();
    
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('coco');
  });

  test('should export annotations in YOLO format', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    const exportDialog = new ExportDialogPage(page);
    
    await viewer.waitForCanvas();
    await viewer.clickExportButton();
    await exportDialog.waitForDialog();
    
    await exportDialog.selectFormat('yolo');
    await exportDialog.selectScope('all');
    
    let exportRequestMade = false;
    await page.route('**/api/export/yolo', async (route) => {
      exportRequestMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        headers: {
          'Content-Disposition': 'attachment; filename="annotations_yolo.txt"',
        },
        body: '0 0.5 0.5 0.5 0.5',
      });
    });
    
    await exportDialog.clickExport();
    
    expect(exportRequestMade).toBeTruthy();
    
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('yolo');
  });

  test('should handle export errors gracefully', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    const exportDialog = new ExportDialogPage(page);
    
    await viewer.waitForCanvas();
    await viewer.clickExportButton();
    await exportDialog.waitForDialog();
    
    await exportDialog.selectFormat('coco');
    await exportDialog.selectScope('current');
    
    await page.route('**/api/export/coco', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Export failed' }),
      });
    });
    
    await exportDialog.clickExport();
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('failed');
  });

  test('should cancel export dialog', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    const exportDialog = new ExportDialogPage(page);
    
    await viewer.waitForCanvas();
    await viewer.clickExportButton();
    await exportDialog.waitForDialog();
    
    await exportDialog.clickCancel();
    
    await expect(exportDialog.dialog).not.toBeVisible();
  });

  test('should handle empty annotations export', async ({ page }) => {
    const viewer = new PanoramaViewerPage(page);
    const exportDialog = new ExportDialogPage(page);
    
    await page.route('**/api/images/1/annotations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ annotations: [] }),
      });
    });
    
    await viewer.waitForCanvas();
    await viewer.clickExportButton();
    await exportDialog.waitForDialog();
    
    await exportDialog.selectFormat('coco');
    await exportDialog.selectScope('current');
    
    await page.route('**/api/export/coco', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ annotations: [] }),
      });
    });
    
    await exportDialog.clickExport();
    
    const infoMessage = page.locator('[data-testid="info-message"]');
    await expect(infoMessage).toBeVisible();
    
    const infoText = await infoMessage.textContent();
    expect(infoText).toContain('empty');
  });
});