export const mockImagesResponse = {
  images: [
    {
      id: 1,
      filename: '3840px-Blue_Marble_2002.jpg',
      path: '/home/stefan/Projekte/spheremark/frontend/test-images/3840px-Blue_Marble_2002.jpg',
      width: 3840,
      height: 1920,
      annotation_count: 2,
      thumbnail_url: '/api/images/1/thumbnail',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      filename: 'test-panorama-2.jpg',
      path: '/path/to/test-panorama-2.jpg',
      width: 4096,
      height: 2048,
      annotation_count: 0,
      thumbnail_url: '/api/images/2/thumbnail',
      created_at: '2024-01-02T00:00:00Z',
    },
  ],
};

export const mockEmptyImagesResponse = {
  images: [],
};

export const mockImageResponse = {
  id: 1,
  filename: '3840px-Blue_Marble_2002.jpg',
  path: '/home/stefan/Projekte/spheremark/frontend/test-images/3840px-Blue_Marble_2002.jpg',
  width: 3840,
  height: 1920,
  annotation_count: 2,
  thumbnail_url: '/api/images/1/thumbnail',
  created_at: '2024-01-01T00:00:00Z',
};