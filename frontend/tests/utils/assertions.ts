import { expect, Page } from '@playwright/test';

export class CustomAssertions {
  static async assertApiCallMade(page: Page, urlPattern: string, method = 'GET') {
    const requestPromise = page.waitForRequest(request => 
      request.url().includes(urlPattern) && request.method() === method
    );
    
    try {
      await requestPromise;
      return true;
    } catch {
      throw new Error(`Expected ${method} request to ${urlPattern} was not made`);
    }
  }

  static async assertApiResponse(page: Page, urlPattern: string, status = 200) {
    const responsePromise = page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.status() === status
    );
    
    try {
      await responsePromise;
      return true;
    } catch {
      throw new Error(`Expected ${status} response from ${urlPattern} was not received`);
    }
  }

  static async assertCanvasInteraction(page: Page, canvasSelector: string) {
    const canvas = page.locator(canvasSelector);
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    expect(canvasBox?.width).toBeGreaterThan(0);
    expect(canvasBox?.height).toBeGreaterThan(0);
  }

  static async assertElementHasClass(element: any, className: string) {
    const classAttribute = await element.getAttribute('class');
    expect(classAttribute).toContain(className);
  }

  static async assertElementIsEnabled(element: any) {
    await expect(element).toBeEnabled();
  }

  static async assertElementIsDisabled(element: any) {
    await expect(element).toBeDisabled();
  }
}