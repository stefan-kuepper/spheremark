# Frontend Testing Plan with Playwright

## 1. Goals
- Ensure reliable user workflows (image browsing → annotation → export)
- Catch regressions in UI interactions and API integrations
- Provide automated testing for CI/CD pipeline
- Enable testing of Three.js canvas interactions (drawing, selection, editing)
- Support both development feedback and production validation

## 2. Test Types & Scope

### Primary: End-to-End (E2E) Tests
- **Focus**: Complete user flows with mocked API responses
- **Advantages**: Tests real user interactions, canvas events, and full integration
- **Tools**: Playwright Test with Chromium (extensible to Firefox/WebKit)

### Secondary: Component Tests (Future Phase)
- **Focus**: Isolated React components (Toolbar, SidePanel, ExportDialog)
- **Advantages**: Faster feedback, better isolation, easier debugging
- **Tools**: `@playwright/experimental-ct-react` (component testing)

### Test Scope Priority:
1. **Critical Paths**: Image browsing, annotation creation/editing, export flow
2. **Canvas Interactions**: Drawing boxes, selecting, resizing via handles
3. **UI Components**: Toolbar modes, side panel actions, error states
4. **API Integration**: Success/error responses, loading states

## 3. Setup Steps

### Dependencies (`frontend/package.json`):
```json
"devDependencies": {
  "@playwright/test": "^1.40.0",
  "@playwright/experimental-ct-react": "^1.40.0"
}
```

### Configuration Files:
1. **Playwright Config** (`playwright.config.ts`):
   - Base URL: `http://localhost:3000`
   - Test directory: `frontend/tests`
   - Browsers: Chromium (default), optional Firefox/WebKit
   - Viewport: 1280x720 (desktop focus)
   - Trace: `on-first-retry` for CI debugging

2. **Environment Variables** (`.env.test`):
   - `VITE_API_URL=http://localhost:8000` (or mocked endpoint)
   - Test-specific configuration

### Scripts (`frontend/package.json`):
```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug",
  "test:ct": "playwright test -c playwright-ct.config.ts",
  "test:ci": "playwright test --reporter=html"
}
```

## 4. Test Structure

```
frontend/tests/
├── fixtures/           # Test data and helpers
│   ├── test-images.ts  # Mock image data
│   ├── test-annotations.ts
│   └── api-mocks.ts    # API response mocks
├── pages/             # Page Object Models
│   ├── ImageBrowserPage.ts
│   ├── PanoramaViewerPage.ts
│   └── ExportDialogPage.ts
├── spec/              # Test suites
│   ├── image-browsing.spec.ts
│   ├── annotation-workflow.spec.ts
│   ├── canvas-interactions.spec.ts
│   └── export-flow.spec.ts
└── utils/
    ├── canvas-utils.ts # Canvas interaction helpers
    └── assertions.ts   # Custom assertions
```

### Page Object Model Example:
```typescript
// frontend/tests/pages/PanoramaViewerPage.ts
export class PanoramaViewerPage {
  constructor(private page: Page) {}
  
  async drawBoundingBox(start: {x: number, y: number}, end: {x: number, y: number}) {
    const canvas = this.page.locator('canvas');
    await canvas.click({ position: start });
    await this.page.mouse.down();
    await this.page.mouse.move(end.x, end.y);
    await this.page.mouse.up();
  }
  
  async selectMode(mode: 'view' | 'draw' | 'edit') {
    await this.page.getByRole('button', { name: mode }).click();
  }
}
```

## 5. Key Test Scenarios

### 5.1 Image Browsing Flow
- Scan for images (POST `/api/images/scan`)
- Display image grid with thumbnails
- Select image → transition to viewer
- Empty state handling

### 5.2 Annotation Workflow
- **Draw mode**: Click-drag on canvas creates box
- **Edit mode**: Select box, resize handles, update label
- **Delete**: Remove box via side panel
- **Auto-save**: Verify API calls on changes

### 5.3 Canvas Interactions
- **Drawing**: Mouse drag coordinates → box creation
- **Selection**: Click on box → visual feedback
- **Resizing**: Drag handles → box dimensions update
- **Coordinate mapping**: UV ↔ spherical conversion validation

### 5.4 Export Flow
- Open export dialog, select format (COCO/YOLO)
- Choose scope (single image/all images)
- Download file verification
- Error handling for empty annotations

### 5.5 Error States & Edge Cases
- Network failures during API calls
- Invalid coordinate inputs
- Empty image directory
- Large image loading performance

## 6. Mocking Strategy

### API Response Mocking:
```typescript
// frontend/tests/fixtures/api-mocks.ts
export const mockImagesResponse = {
  images: [
    { id: 1, filename: 'test-pano.jpg', width: 8192, height: 4096 }
  ]
};

// In test setup
await page.route('**/api/images', route => route.fulfill({
  status: 200,
  body: JSON.stringify(mockImagesResponse)
}));
```

### HAR File Recording (for complex flows):
- Record real API interactions once
- Replay from HAR files for consistent testing
- Update when API contract changes

### Canvas Mocking:
- Use `page.evaluate()` to inject test data into Three.js scene
- Mock WebGL context for unit-style canvas tests
- Use `page.mouse` API for precise interaction simulation

## 7. CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/playwright.yml`):
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Run Playwright tests
        run: cd frontend && npm run test:ci
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

### CI Optimization:
- Parallel test execution
- Cached Playwright browser binaries
- Test result reporting to GitHub
- Screenshot on failure

## 8. Running Tests Locally

```bash
# Install dependencies
cd frontend
npm install

# Install Playwright browsers
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run with UI mode (debugging)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/spec/image-browsing.spec.ts
```

## 9. Implementation Order

### Phase 1: Foundation (Week 1)
- Install Playwright dependencies
- Configure basic setup (playwright.config.ts)
- Create test infrastructure (fixtures, page objects)
- Implement basic image browsing tests

### Phase 2: Core Workflows (Week 2)
- Annotation creation/editing tests
- Canvas interaction helpers
- API mocking for all endpoints
- Export flow tests

### Phase 3: Polish & CI (Week 3)
- Error state testing
- Cross-browser compatibility (optional)
- CI pipeline setup
- Performance benchmarks

### Phase 4: Component Tests (Future)
- Evaluate need for component testing
- Set up `@playwright/experimental-ct-react`
- Test isolated UI components

## 10. Success Metrics
- **Coverage**: 80%+ of critical user flows
- **Reliability**: <5% flaky test rate
- **Speed**: E2E suite runs <5 minutes in CI
- **Maintenance**: Clear page objects, minimal test duplication

## References & Best Practices
- Playwright Documentation: `/microsoft/playwright`
- Three.js testing: Canvas interaction via `page.mouse` API
- React component testing: `@playwright/experimental-ct-react`
- Mocking strategy: HAR files + route interception

