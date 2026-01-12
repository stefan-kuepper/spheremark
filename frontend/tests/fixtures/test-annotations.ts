export const mockAnnotationsResponse = {
  annotations: [
    {
      id: 1,
      image_id: 1,
      label: 'Test Object 1',
      uv_min_u: 0.25,
      uv_min_v: 0.25,
      uv_max_u: 0.75,
      uv_max_v: 0.75,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      image_id: 1,
      label: 'Test Object 2',
      uv_min_u: 0.1,
      uv_min_v: 0.1,
      uv_max_u: 0.3,
      uv_max_v: 0.3,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
};

export const mockEmptyAnnotationsResponse = {
  annotations: [],
};

export const mockAnnotationResponse = {
  id: 1,
  image_id: 1,
  label: 'Test Object 1',
  uv_min_u: 0.25,
  uv_min_v: 0.25,
  uv_max_u: 0.75,
  uv_max_v: 0.75,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockCreateAnnotationRequest = {
  label: 'New Test Object',
  uv_min_u: 0.4,
  uv_min_v: 0.4,
  uv_max_u: 0.6,
  uv_max_v: 0.6,
};

export const mockUpdateAnnotationRequest = {
  label: 'Updated Test Object',
  uv_min_u: 0.35,
  uv_min_v: 0.35,
  uv_max_u: 0.65,
  uv_max_v: 0.65,
};