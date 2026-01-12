import { mockImagesResponse, mockEmptyImagesResponse, mockImageResponse } from './test-images';
import { mockAnnotationsResponse, mockEmptyAnnotationsResponse, mockAnnotationResponse, mockCreateAnnotationRequest, mockUpdateAnnotationRequest } from './test-annotations';

export const apiMocks = {
  images: {
    list: mockImagesResponse,
    empty: mockEmptyImagesResponse,
    single: mockImageResponse,
  },
  annotations: {
    list: mockAnnotationsResponse,
    empty: mockEmptyAnnotationsResponse,
    single: mockAnnotationResponse,
    create: mockCreateAnnotationRequest,
    update: mockUpdateAnnotationRequest,
  },
};

export const setupApiMocks = async (page: any) => {
  await page.route('**/api/images', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiMocks.images.list.images),
    });
  });

  await page.route('**/api/images/1', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiMocks.images.single),
    });
  });

  await page.route('**/api/images/1/annotations', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiMocks.annotations.list.annotations),
    });
  });

  await page.route('**/api/images/1/annotations/1', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiMocks.annotations.single),
    });
  });

  await page.route('**/api/images/scan', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Scan completed' }),
    });
  });

  // Mock image file endpoint - serve the test Blue Marble image
  await page.route('**/api/images/1/file', async (route: any) => {
    const imagePath = '/home/stefan/Projekte/spheremark/frontend/test-images/3840px-Blue_Marble_2002.jpg';
    await route.fulfill({
      status: 200,
      contentType: 'image/jpeg',
      path: imagePath,
    });
  });

  // Mock thumbnail endpoint
  await page.route('**/api/images/1/thumbnail', async (route: any) => {
    const imagePath = '/home/stefan/Projekte/spheremark/frontend/test-images/3840px-Blue_Marble_2002.jpg';
    await route.fulfill({
      status: 200,
      contentType: 'image/jpeg',
      path: imagePath,
    });
  });

  await page.route('**/api/export/coco', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
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
};