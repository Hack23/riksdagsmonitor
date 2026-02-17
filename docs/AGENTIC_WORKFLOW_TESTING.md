# Agentic Workflow Testing Guide

> Comprehensive testing strategy for GitHub Agentic Workflows to prevent failures and ensure quality

**Document Classification:** 🟢 Public  
**Last Updated:** 2026-02-17  
**Owner:** Hack23 AB  
**Review Cycle:** Quarterly

## 📋 Overview

This document describes the testing strategy for agentic workflows in riksdagsmonitor, specifically designed to prevent failures like the News Article Generator issue (#259).

## 🎯 Purpose

Agentic workflows are complex autonomous systems that must:
- ✅ Always call safe output tools (`safeoutputs___create_pull_request` or `safeoutputs___noop`)
- ✅ Handle MCP server timeouts and cold starts gracefully
- ✅ Properly configure network access and tools
- ✅ Document error handling and recovery procedures
- ✅ Generate proper output artifacts (`agent_output.json`)

**Failure to meet these requirements results in workflow failures that are difficult to debug.**

## 🧪 Test Suite

### Location
```
tests/agentic-workflow-validation.test.js
```

### Coverage
- **94 comprehensive tests** covering all aspects of agentic workflow validation
- **100% passing rate** required before deployment
- **Automated execution** in CI/CD pipeline

### Test Categories

#### 1. Workflow File Structure (15 tests)
Validates the YAML frontmatter and structure of workflow markdown files:

```javascript
// Tests verify:
- YAML frontmatter exists and is valid
- timeout-minutes is configured
- permissions are properly set
- safe-outputs configuration exists
- engine configuration is complete (id: copilot, model)
```

**Why**: Incomplete frontmatter causes workflow compilation failures or runtime errors.

#### 2. Safe Output Requirements Documentation (18 tests)
Ensures workflows document the critical safe output requirement:

```javascript
// Tests verify:
- "CRITICAL REQUIREMENTS" section exists
- safeoutputs___create_pull_request is documented
- safeoutputs___noop is documented
- Workflow failure warnings are present
- Guidance on when to use PR vs noop
- Safe output as final step instruction
```

**Why**: Missing safe output calls cause workflows to fail with no `agent_output.json`, resulting in conclusion job failures.

#### 3. MCP Server Configuration (12 tests)
Validates MCP (Model Context Protocol) server setup:

```javascript
// Tests verify:
- riksdag-regering MCP server is configured
- Server URL (https://riksdag-regering-ai.onrender.com/mcp)
- Playwright tools configuration
- Bash tools configuration
```

**Why**: Misconfigured MCP servers prevent agents from accessing required data and tools.

#### 4. Network Configuration (9 tests)
Ensures proper network access configuration:

```javascript
// Tests verify:
- network.allowed configuration exists
- riksdag-regering-ai.onrender.com is whitelisted
- data.riksdagen.se is whitelisted
- www.riksdagen.se is whitelisted
```

**Why**: Missing network configuration blocks HTTP requests, causing MCP tool calls to fail.

#### 5. Error Handling Documentation (9 tests)
Validates error recovery procedures are documented:

```javascript
// Tests verify:
- MCP timeout handling documented
- MCP unavailable scenarios documented
- Noop usage on errors documented
```

**Why**: Undocumented error handling leads to agent failures with unclear recovery paths.

#### 6. Tool Usage Instructions (5 tests)
Ensures proper documentation of MCP tool usage:

```javascript
// Tests verify:
- riksdag-regering MCP tools documented
- Warm-up sequence (get_sync_status) documented
- Cross-referencing strategy documented
- Translation requirements documented
- Playwright validation documented
```

**Why**: Missing tool documentation leads to incorrect usage patterns and workflow failures.

#### 7. Workflow Lock File Generation (12 tests)
Validates compiled lock files are up to date:

```javascript
// Tests verify:
- Lock files (.lock.yml) exist
- Lock files have valid YAML structure
- Activation, agent, conclusion jobs are present
- safe_outputs job is configured
```

**Why**: Outdated lock files cause runtime errors when workflow behavior diverges from markdown source.

#### 8. Compilation Requirements (2 tests)
Ensures compilation workflow is configured:

```javascript
// Tests verify:
- compile-agentic-workflows.yml exists
- Compilation triggers on .md file changes
```

**Why**: Without automatic compilation, lock files become stale after workflow markdown updates.

#### 9. Safe Output Call Detection (5 tests)
Validates safe output call patterns in agent execution:

```javascript
// Tests verify:
- Detection of safeoutputs___create_pull_request calls
- Detection of missing safe output calls
- agent_output.json creation validation
- Conclusion job error handling
- GitHub issue creation on failure
```

**Why**: Detecting missing safe output calls early prevents workflow failures and aids debugging.

#### 10. Regression Prevention (5 tests)
Ensures critical standards are maintained:

```javascript
// Tests verify:
- All workflows have safe output documentation
- Minimum required sections are present
- Lock files are synchronized
- Common failure scenarios documented
```

**Why**: Prevents recurring issues by enforcing standards across all agentic workflows.

## 🚀 Running Tests

### Prerequisites
```bash
npm ci --prefer-offline --no-audit
```

### Run All Agentic Workflow Tests
```bash
npm test -- tests/agentic-workflow-validation.test.js
```

### Run Specific Test Suite
```bash
npm test -- tests/agentic-workflow-validation.test.js -t "Safe Output Requirements"
```

### Watch Mode (Development)
```bash
npm run test:watch -- tests/agentic-workflow-validation.test.js
```

### Generate Coverage Report
```bash
npm run test:coverage -- tests/agentic-workflow-validation.test.js
```

## ✅ Expected Results

### Successful Test Run
```
 Test Files  1 passed (1)
      Tests  94 passed (94)
   Duration  ~500ms
```

### Test Failure
If tests fail, review the error output:

```bash
# Example failure output
FAIL tests/agentic-workflow-validation.test.js > Safe Output Requirements > should mention safeoutputs___create_pull_request tool
AssertionError: expected 'news-article-generator.md' to contain 'safeoutputs___create_pull_request'
```

**Action**: Update the workflow markdown file to include required documentation.

## 🔍 Debugging Workflow Failures

### Step 1: Check Safe Output Call
The most common failure is missing safe output calls. Check agent logs for:

```
safeoutputs___create_pull_request
safeoutputs___noop
```

If neither appears, the agent failed to call a safe output tool.

### Step 2: Verify agent_output.json
Check if the agent produced output:

```bash
# In GitHub Actions artifacts
ls -la /tmp/gh-aw/safeoutputs/agent_output.json
```

If missing, the conclusion job will fail with:
```
Error reading agent output file: ENOENT: no such file or directory
```

### Step 3: Review MCP Gateway Logs
Check for MCP connectivity issues:

```bash
# Look for MCP server startup
grep "Successfully connected to MCP server" logs

# Look for tool registration
grep "Registered tool: riksdag-regering" logs
```

### Step 4: Check Network Firewall Logs
Verify network access was properly configured:

```bash
# In GitHub Actions step summary
# Look for "Firewall Activity" section
# Should show allowed requests to riksdag-regering-ai.onrender.com
```

## 🛡️ Prevention Strategy

### Pre-Deployment Checklist
Before deploying a new agentic workflow:

- [ ] Run `npm test -- tests/agentic-workflow-validation.test.js`
- [ ] Ensure all 94 tests pass
- [ ] Review workflow markdown for safe output documentation
- [ ] Test workflow in non-production environment
- [ ] Verify MCP server connectivity
- [ ] Check network configuration
- [ ] Validate lock file is up to date

### CI/CD Integration
Add to `.github/workflows/javascript-testing.yml`:

```yaml
- name: Run Agentic Workflow Validation Tests
  run: npm test -- tests/agentic-workflow-validation.test.js
```

This ensures tests run on every PR and push to main.

## 📚 Related Documentation

- [News Article Generator Workflow](../.github/workflows/news-article-generator.md) - Main workflow file
- [News Realtime Monitor Workflow](../.github/workflows/news-realtime-monitor.md) - Real-time monitoring workflow
- [News Evening Analysis Workflow](../.github/workflows/news-evening-analysis.md) - Evening analysis workflow
- [Compile Agentic Workflows](../.github/workflows/compile-agentic-workflows.yml) - Lock file compiler
- [GitHub Agentic Workflows Skills](../.github/skills/gh-aw-*/) - Comprehensive gh-aw documentation

## 🎯 Success Criteria

A workflow is considered test-compliant when:

1. ✅ All 94 validation tests pass
2. ✅ Lock file is up to date
3. ✅ Safe output requirements documented
4. ✅ MCP configuration complete
5. ✅ Network access properly configured
6. ✅ Error handling documented
7. ✅ Tool usage documented
8. ✅ Compilation workflow configured

## 🔄 Maintenance

### Weekly
- [ ] Run test suite
- [ ] Review any new workflow failures
- [ ] Update tests if new patterns emerge

### Monthly
- [ ] Review test coverage
- [ ] Add tests for new failure scenarios
- [ ] Update documentation

### Quarterly
- [ ] Comprehensive test suite review
- [ ] Update test strategy
- [ ] Review with development team

## 📝 Test Development Guidelines

When adding new tests:

1. **Descriptive Test Names**: Use clear, action-oriented names
   ```javascript
   it('should document when to use create_pull_request vs noop', () => {
   ```

2. **Focused Assertions**: Test one concept per test
   ```javascript
   expect(workflowContent).toContain('safeoutputs___create_pull_request');
   ```

3. **Helpful Error Messages**: Provide context in assertions
   ```javascript
   expect(hasWarning).toBe(true, 'Workflow must warn about failures');
   ```

4. **DRY Principle**: Use `beforeAll` for shared setup
   ```javascript
   beforeAll(() => {
     workflowContent = readFileSync(workflowPath, 'utf-8');
   });
   ```

5. **Parameterized Tests**: Test all workflows consistently
   ```javascript
   AGENTIC_WORKFLOWS.forEach(workflowFile => {
     describe(`${workflowFile}`, () => {
       // Tests for each workflow
     });
   });
   ```

## 🐛 Known Issues

### Issue #259: News Article Generator Failure
**Root Cause**: Agent failed to call safe output tool, resulting in missing `agent_output.json`

**Prevention**: Tests now validate safe output documentation and detect missing calls

**Resolution**: Comprehensive test suite created (94 tests, all passing)

## 🤝 Contributing

When contributing to agentic workflows:

1. **Run Tests First**: Always run test suite before changes
2. **Update Tests**: Add tests for new requirements
3. **Document Changes**: Update workflow markdown
4. **Recompile**: Run `compile-agentic-workflows.yml`
5. **Verify**: Ensure all tests pass after changes

## 📞 Support

For test-related issues:

1. Check [GitHub Issues](https://github.com/Hack23/riksdagsmonitor/issues) for similar problems
2. Review [Agentic Workflow Skills](../.github/skills/gh-aw-*/) for guidance
3. Create new issue with test failure output if needed

---

**Last Updated**: 2026-02-17  
**Test Suite Version**: 1.0  
**Test Count**: 94  
**Pass Rate**: 100%

