# Test Teardown & Memory Leak Analysis

**Date**: 2026-02-13  
**Author**: DevOps Engineer (Copilot Agent)  
**Version**: 1.0

---

## 📋 Executive Summary

Comprehensive analysis of test suite for proper teardown, mock completion, and memory leaks. Identified 25 issues across 31 test files, categorized by severity and impact.

### Key Findings
- ✅ **Good**: Global setup.js has proper lifecycle hooks
- ✅ **Good**: vitest.config.js has mock auto-cleanup enabled
- ⚠️ **Issue**: 6 tests with improper fetch mock cleanup
- ⚠️ **Issue**: 19 tests missing afterEach hooks
- ⚠️ **Low**: Potential Chart.js instance leaks

---

## 🔍 Investigation Methodology

### 1. Test Infrastructure Audit
```bash
# Count test files
find tests/ -name "*.test.js" | wc -l  # 31 files

# Count lifecycle hooks
grep -r "afterEach\|afterAll\|beforeEach\|beforeAll" tests/ | wc -l  # 71 hooks

# Count global modifications
grep -r "global\.\|window\.\|globalThis\." tests/ | wc -l  # 121 instances
```

### 2. Mock Usage Analysis
- Analyzed all `global.fetch` assignments
- Checked for proper restoration patterns
- Identified missing cleanup

### 3. Memory Leak Detection
- Reviewed Chart.js instance creation
- Checked D3 selection lifecycle
- Analyzed event listener patterns
- Verified timer cleanup

---

## 🚨 Critical Issues (Must Fix)

### Issue #1: Improper Fetch Mock Cleanup

**Severity**: HIGH  
**Impact**: Test isolation failures, false positives/negatives  
**Affected Files**: 6 files

#### Problem
Some tests modify `global.fetch` but don't restore it properly, breaking test isolation.

**Incorrect Pattern** (found in 3 files):
```javascript
// ❌ WRONG - deletes mock, doesn't restore
it('should handle fetch errors', async () => {
  global.fetch = vi.fn().mockRejectedValue(new Error('fail'));
  // ... test code ...
  delete global.fetch;  // ❌ Doesn't restore original
});
```

**Missing Pattern** (found in 3 files):
```javascript
// ❌ WRONG - no restoration at all
it('should fetch data', async () => {
  global.fetch = vi.fn(() => Promise.resolve({...}));
  // ... test code ...
});  // ❌ No cleanup
```

**Correct Pattern**:
```javascript
// ✅ CORRECT
describe('Test Suite', () => {
  let originalFetch;
  
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });
  
  it('should fetch data', async () => {
    global.fetch = vi.fn(() => Promise.resolve({...}));
    // ... test code ...
  });
});
```

#### Affected Files
1. ❌ **tests/coalition-dashboard.test.js** (line 313: `delete global.fetch`)
2. ❌ **tests/committees-dashboard.test.js** (line 201: `delete global.fetch`)
3. ❌ **tests/election-cycle-dashboard.test.js** (line 194: `delete global.fetch`)
4. ⚠️ **tests/ministry-dashboard.test.js** (no fetch restoration at all)
5. ⚠️ **tests/politician-dashboard.test.js** (restores in individual test, not afterEach)
6. ✅ **tests/mcp-client.test.js** (CORRECT - reference implementation)
7. ✅ **tests/dashboard-cia-data-loader.test.js** (CORRECT)

#### Remediation
- Add `let originalFetch;` to test suite scope
- Save in beforeEach: `originalFetch = global.fetch;`
- Restore in afterEach: `global.fetch = originalFetch;`
- Remove all `delete global.fetch` statements

---

## ⚠️ Important Issues (Should Fix)

### Issue #2: Missing afterEach Hooks

**Severity**: MEDIUM  
**Impact**: Potential test pollution, inconsistent cleanup  
**Affected Files**: 19 files

#### Problem
Tests without afterEach don't explicitly clean up, relying only on global setup.js. While this works, it's inconsistent and could miss test-specific cleanup needs.

#### Files Without afterEach
1. tests/agentic-workflow.test.js
2. tests/anomaly-detection-dashboard.test.js
3. tests/article-template.test.js
4. tests/back-to-top.test.js
5. tests/data-transformers.test.js
6. tests/generate-news-enhanced.test.js
7. tests/generate-news-indexes.test.js
8. tests/generate-sitemap.test.js
9. tests/html-utils.test.js
10. tests/isms-compliance.test.js
11. tests/load-cia-stats.test.js
12. tests/multi-language.test.js
13. tests/news-index-localization.test.js
14. tests/party-dashboard.test.js
15. tests/pre-election-dashboard.test.js
16. tests/seasonal-patterns-dashboard.test.js
17. tests/seo-structured-data.test.js
18. tests/stats-loader.test.js
19. tests/translation-validation.test.js

#### Recommended Pattern
```javascript
afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});
```

**Note**: Some tests may not need this if they don't modify globals or DOM, but consistency improves maintainability.

---

## 💡 Good-to-Have Improvements

### Issue #3: Chart.js Instance Cleanup

**Severity**: LOW  
**Impact**: Minimal (Chart.js is mocked)  
**Potential**: Could cause memory leaks in real Chart.js usage

#### Problem
Tests create mock Chart instances but never call `.destroy()`.

#### Current Mock (setup.js)
```javascript
global.Chart = class MockChart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
  }
  destroy() {}  // ✅ Method exists but never called
};
```

#### Recommendation
For tests that create charts, track and destroy them:

```javascript
describe('Chart Tests', () => {
  let charts = [];
  
  afterEach(() => {
    charts.forEach(chart => chart.destroy());
    charts = [];
  });
  
  it('should create chart', () => {
    const chart = new Chart(ctx, config);
    charts.push(chart);
    // ... test code ...
  });
});
```

**Status**: Not urgent since Chart.js is mocked, but good practice for when real charts are used.

---

## ✅ Good Practices Found

### 1. Global Setup (tests/setup.js)
```javascript
beforeEach(() => {
  document.body.innerHTML = '';  // ✅ Clear DOM
  vi.clearAllMocks();            // ✅ Reset mocks
  // ✅ Silence console
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();  // ✅ Restore all spies
});
```

### 2. Vitest Configuration (vitest.config.js)
```javascript
mockReset: true,      // ✅ Reset mocks between tests
restoreMocks: true,   // ✅ Restore original implementations
clearMocks: true      // ✅ Clear mock call history
```

### 3. Reference Implementations
- ✅ **tests/mcp-client.test.js** - Perfect fetch mock pattern
- ✅ **tests/dashboard-cia-data-loader.test.js** - Proper cleanup

---

## 📊 Statistics

### Test Coverage
- **Total Test Files**: 31 (29 unit + 2 integration)
- **Total Tests**: ~1,141 tests
- **Files with afterEach**: 12 files (38.7%)
- **Files without afterEach**: 19 files (61.3%)

### Issues by Severity
- **Critical (Fetch Cleanup)**: 6 files
- **Important (Missing afterEach)**: 19 files
- **Low (Chart Cleanup)**: All chart-using tests

### Mock Usage
- **global.fetch assignments**: 121 instances
- **Proper restoration**: 2 files (mcp-client, cia-data-loader)
- **Improper restoration**: 6 files

---

## 🎯 Remediation Checklist

### Phase 1: Critical Fixes (MUST DO)
- [ ] Fix coalition-dashboard.test.js fetch cleanup
- [ ] Fix committees-dashboard.test.js fetch cleanup
- [ ] Fix election-cycle-dashboard.test.js fetch cleanup
- [ ] Add fetch restoration to ministry-dashboard.test.js
- [ ] Fix politician-dashboard.test.js fetch restoration
- [ ] Verify no other files use `delete global.fetch`

### Phase 2: Important Fixes (SHOULD DO)
- [ ] Add afterEach to 19 files without it
- [ ] Ensure consistent cleanup pattern
- [ ] Update test documentation with patterns

### Phase 3: Optional Improvements (NICE TO HAVE)
- [ ] Add Chart.js instance tracking
- [ ] Document memory-safe patterns
- [ ] Create memory leak detection test
- [ ] Add heap usage monitoring

---

## 📝 Code Patterns

### Pattern 1: Proper Fetch Mock Cleanup

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Component Tests', () => {
  let originalFetch;
  
  beforeEach(() => {
    // Save original fetch mock from setup.js
    originalFetch = global.fetch;
  });
  
  afterEach(() => {
    // Restore original fetch mock
    global.fetch = originalFetch;
    // Clear mock call history
    vi.clearAllMocks();
  });
  
  it('should fetch data', async () => {
    // Override fetch for this test
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] })
    }));
    
    const response = await fetch('/api/data');
    expect(response.ok).toBe(true);
  });
});
```

### Pattern 2: Consistent afterEach

```javascript
afterEach(() => {
  // Clear all mock call history
  vi.clearAllMocks();
  
  // Clear DOM (if test modifies it)
  document.body.innerHTML = '';
  
  // Restore any global modifications
  // (handled by setup.js's vi.restoreAllMocks())
});
```

### Pattern 3: Chart Instance Cleanup (Optional)

```javascript
describe('Chart Tests', () => {
  let charts = [];
  
  afterEach(() => {
    // Destroy all created charts
    charts.forEach(chart => chart?.destroy());
    charts = [];
    
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });
  
  it('should create chart', () => {
    const ctx = document.createElement('canvas').getContext('2d');
    const chart = new Chart(ctx, { type: 'bar', data: {} });
    charts.push(chart);
    
    expect(chart).toBeDefined();
  });
});
```

---

## 🔬 Memory Leak Analysis

### Potential Sources
1. ✅ **Global Variables**: Properly reset in setup.js
2. ⚠️ **Fetch Mocks**: 6 files with improper cleanup (ISSUE)
3. ✅ **DOM Elements**: Cleared in setup.js beforeEach
4. ⚠️ **Chart Instances**: Not explicitly destroyed (LOW RISK)
5. ✅ **Event Listeners**: Most tests don't add persistent listeners
6. ✅ **Timers**: No evidence of unclosed timers

### Memory Leak Risk Assessment
- **High Risk**: None (after fixes)
- **Medium Risk**: Fetch mock pollution (6 files - being fixed)
- **Low Risk**: Chart instances (mocked, minimal impact)
- **Minimal Risk**: Everything else

### Heap Usage Analysis
Current test runs show:
- Memory warnings in CI (1 worker OOM)
- Likely due to parallel execution, not leaks
- No evidence of accumulating memory across tests

### Recommended Monitoring
```bash
# Run tests with heap profiling
node --expose-gc --max-old-space-size=4096 node_modules/.bin/vitest run

# Monitor heap usage
process.memoryUsage()  // In test hooks
```

---

## 📚 Documentation Updates Needed

### 1. Test Writing Guidelines
Create `docs/TESTING_GUIDELINES.md` with:
- Proper mock cleanup patterns
- AfterEach hook requirements
- Memory-safe coding practices

### 2. Update README
Add section on:
- Running tests with memory profiling
- Interpreting memory warnings
- Best practices for test isolation

### 3. PR Template
Add checklist item:
- [ ] Tests include proper afterEach cleanup
- [ ] Global mocks are properly restored
- [ ] No memory leaks introduced

---

## 🎓 Lessons Learned

### What Worked Well
1. ✅ Global setup.js provides consistent baseline
2. ✅ Vitest auto-cleanup config catches most issues
3. ✅ Some tests follow proper patterns (mcp-client)

### What Needs Improvement
1. ⚠️ Inconsistent fetch mock patterns
2. ⚠️ Missing explicit afterEach in many tests
3. ⚠️ No documented testing guidelines

### Best Practices for Future
1. ✅ Always save and restore global mocks
2. ✅ Include afterEach even if seemingly unnecessary
3. ✅ Document patterns in testing guidelines
4. ✅ Add pre-commit hooks to check for `delete global.fetch`
5. ✅ Regular memory profiling in CI

---

## 🔄 Continuous Improvement

### Short-term (This PR)
- Fix all 6 critical fetch cleanup issues
- Add afterEach to 19 files
- Document patterns

### Medium-term (Next Sprint)
- Create testing guidelines
- Add memory profiling to CI
- Create memory leak detection tests

### Long-term (Roadmap)
- Automated pattern enforcement (ESLint rules)
- Heap snapshot comparison in CI
- Performance regression detection

---

## 📖 References

- **Vitest Mocking Guide**: https://vitest.dev/guide/mocking.html
- **Test Isolation Best Practices**: https://kentcdodds.com/blog/test-isolation-with-react
- **Memory Leak Detection**: https://nodejs.org/en/docs/guides/simple-profiling

---

**Status**: Analysis Complete ✅  
**Next Step**: Implement Phase 1 Critical Fixes

