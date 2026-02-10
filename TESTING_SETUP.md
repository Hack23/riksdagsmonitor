# JavaScript Testing Setup - README

## ✅ Implementation Complete

This repository now has a complete JavaScript build and testing setup with Vite, Vitest, and Cypress.

## 📦 Dependencies Added

### Production Dependencies
- **chart.js** (^4.4.1) - Charting library for data visualization
- **chartjs-plugin-annotation** (^3.0.1) - Annotation plugin for Chart.js
- **d3** (^7.9.0) - Data visualization library
- **ajv** (^8.17.1) - JSON Schema validator
- **ajv-formats** (^3.0.1) - Format definitions for AJV

### Development Dependencies
- **vite** (^6.0.7) - Build tool and dev server
- **vitest** (^2.1.8) - Unit testing framework
- **@vitest/coverage-v8** (^2.1.8) - Code coverage
- **@vitest/ui** (^2.1.8) - Testing UI
- **cypress** (^13.16.1) - E2E testing framework
- **happy-dom** (^15.11.7) - DOM implementation for testing
- **vite-plugin-sri-gen** (^1.3.2) - Subresource Integrity generation
- **start-server-and-test** (^2.0.9) - Test orchestration

## 🧪 Test Results

### Unit Tests (Vitest)
- ✅ **49 tests passed** (0 failed)
- Test Files: 3 passed (3)
- Duration: 683ms

#### Test Coverage
- back-to-top.test.js: 6 tests
- party-dashboard.test.js: 18 tests
- anomaly-detection-dashboard.test.js: 25 tests

### Build Test (Vite)
- ⚠️ **Requires merge conflict resolution** in HTML files
- Configuration: Complete
- SRI plugin: Configured

### E2E Tests (Cypress)
- ⏳ **Pending**: Requires Cypress binary installation
- Test files created:
  - homepage.cy.js
  - dashboards.cy.js
  - accessibility.cy.js

## 🚀 Available Scripts

```bash
# Development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Open Cypress
npm run cypress:open

# Run Cypress headless
npm run cypress:run

# Run E2E tests (build + preview + cypress)
npm run e2e
```

## 📁 Directory Structure

```
riksdagsmonitor/
├── tests/                          # Vitest unit tests
│   ├── setup.js                   # Global test setup
│   ├── back-to-top.test.js       # Navigation tests
│   ├── party-dashboard.test.js    # Dashboard tests
│   └── anomaly-detection-dashboard.test.js
├── cypress/                        # Cypress E2E tests
│   ├── e2e/
│   │   ├── homepage.cy.js         # Homepage tests
│   │   ├── dashboards.cy.js       # Dashboard tests
│   │   └── accessibility.cy.js    # A11y tests
│   ├── support/
│   │   ├── e2e.js                 # E2E setup
│   │   └── commands.js            # Custom commands
│   └── fixtures/                   # Test data
├── vite.config.js                  # Vite configuration
├── vitest.config.js                # Vitest configuration
└── cypress.config.js               # Cypress configuration
```

## 🔧 Configuration Details

### Vite Configuration
- **Entry points**: 14 HTML files (1 per language)
- **Code splitting**: Separate chunks for Chart.js, D3.js
- **SRI**: Subresource Integrity hashes (sha384)
- **Output**: dist/ directory
- **Source maps**: Enabled
- **Minification**: Terser

### Vitest Configuration
- **Environment**: happy-dom (lightweight DOM)
- **Coverage**: v8 provider (70% lines, 70% functions, 60% branches)
- **Reporters**: verbose, html, lcov, json
- **Timeout**: 10 seconds
- **Parallel**: Multi-threaded

### Cypress Configuration
- **Base URL**: http://localhost:4173
- **Viewports**: 1280x720 (configurable)
- **Video**: Enabled
- **Screenshots**: On failure
- **Retry**: 2 attempts in CI, 0 in dev

## 🔄 CI/CD Integration

### GitHub Actions Workflow
**File**: `.github/workflows/javascript-testing.yml`

**Jobs**:
1. **unit-tests**: Vitest with coverage upload to Codecov
2. **build-test**: Vite build with artifact archiving
3. **e2e-tests**: Cypress with Chrome browser
4. **test-summary**: Aggregated results

**Triggers**:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

### Dependabot Configuration
**File**: `.github/dependabot.yml`

**Ecosystems**:
- GitHub Actions (daily)
- NPM (daily)

**Features**:
- Grouped minor/patch updates
- Separate groups for dev/prod dependencies
- PR limit: 10 per ecosystem

## 📊 Code Coverage

Coverage reports available in:
- **HTML**: `coverage/index.html`
- **LCOV**: `coverage/lcov.info`
- **JSON**: `coverage/coverage-final.json`

## ⚠️ Known Issues

1. **HTML Merge Conflicts**: Some language HTML files have merge conflict markers
   - Files: index_ar.html (lines 652, 653, 928, 947)
   - Resolution: Manual merge required before build
   
2. **Cypress Binary**: Binary download blocked in current environment
   - Workaround: `CYPRESS_INSTALL_BINARY=0 npm install`
   - E2E tests will run in CI with proper Cypress installation

3. **Script Type Attributes**: Non-module scripts in HTML
   - Warning: `<script src="..."> can't be bundled without type="module"`
   - Fix: Add `type="module"` to script tags or handle differently

## 🎯 Next Steps

1. **Resolve merge conflicts** in HTML files
2. **Add more test coverage** for remaining dashboards:
   - seasonal-patterns-dashboard.js
   - pre-election-dashboard.js
   - politician-dashboard.js
   - ministry-dashboard.js
   - election-cycle-dashboard.js
3. **Update HTML script tags** to use ES modules
4. **Run full E2E test suite** in CI
5. **Update README.md** with testing instructions

## 📚 Documentation

- [Vite Documentation](https://vite.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Cypress Documentation](https://www.cypress.io/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [D3.js Documentation](https://d3js.org/)

## 🔒 Security

- **SRI Hashes**: Subresource Integrity for all bundled assets
- **SHA Pinning**: All GitHub Actions pinned to commit SHA
- **Dependabot**: Automated dependency updates
- **No CDN**: All libraries bundled locally (deployed to CloudFront)

---

**Author**: Hack23 AB  
**License**: Apache-2.0  
**Last Updated**: 2026-02-10
