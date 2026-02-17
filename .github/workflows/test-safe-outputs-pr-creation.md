---
name: Test Safe Outputs PR Creation
description: Test workflow to verify safe-outputs create_pull_request works with git push workaround
strict: false
on:
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

timeout-minutes: 5

safe-outputs:
  create-pull-request: {}
  noop: {}

steps:
  - name: Setup Node.js
    uses: actions/setup-node@6044e13b5dc448c55e2357c09f80417699197238 # v6.2.0
    with:
      node-version: '24'

engine:
  id: copilot
  model: claude-opus-4.6
---

# 🧪 Test Safe Outputs PR Creation

You are a test agent verifying the safe-outputs `create_pull_request` tool works correctly.

## Your Task

1. **Create a test file**
   ```bash
   echo "# Safe Outputs Test" > TEST_SAFE_OUTPUTS_$(date +%Y%m%d_%H%M%S).md
   echo "" >> TEST_SAFE_OUTPUTS_*.md
   echo "This file tests safe-outputs PR creation." >> TEST_SAFE_OUTPUTS_*.md
   echo "" >> TEST_SAFE_OUTPUTS_*.md
   echo "- Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> TEST_SAFE_OUTPUTS_*.md
   echo "- Workflow run: $GITHUB_RUN_ID" >> TEST_SAFE_OUTPUTS_*.md
   ```

2. **Configure git**
   ```bash
   git config user.name "github-actions[bot]"
   git config user.email "github-actions[bot]@users.noreply.github.com"
   ```

3. **Create branch and commit** (WITHOUT pushing)
   ```bash
   git checkout -b test/safe-outputs-$(date +%Y%m%d-%H%M%S)
   git add TEST_SAFE_OUTPUTS_*.md
   git commit -m "test: verify safe-outputs PR creation"
   
   # Verify commit exists
   git log --oneline -1
   git status
   ```

4. **Test 1: Try create_pull_request WITHOUT git push** (EXPECTED TO FAIL)
   
   Call `safeoutputs___create_pull_request` with:
   ```json
   {
     "title": "🧪 Test Safe Outputs (NO PUSH)",
     "body": "Testing safe-outputs without git push - expect failure",
     "labels": ["test", "safe-outputs-bug"]
   }
   ```
   
   **Expected result:** "No changes to commit - no commits found" error

5. **Test 2: Push commits then try create_pull_request** (EXPECTED TO SUCCEED)
   
   ```bash
   # Push branch to remote
   git push -u origin $(git branch --show-current)
   
   # Verify push succeeded
   git log --oneline -1
   ```
   
   Call `safeoutputs___create_pull_request` with:
   ```json
   {
     "title": "🧪 Test Safe Outputs (WITH PUSH)",
     "body": "Testing safe-outputs WITH git push - expect success\n\n## Test Results\n- Branch pushed to remote ✅\n- Commits visible in container ✅\n- PR creation should work ✅",
     "labels": ["test", "safe-outputs-fix"]
   }
   ```
   
   **Expected result:** PR created successfully

6. **Report results**
   
   If Test 1 failed as expected AND Test 2 succeeded:
   - ✅ Workaround confirmed working
   - Document in agent output
   
   If Test 2 also failed:
   - ❌ Bug persists even with git push
   - Use `safeoutputs___noop` to report failure

## CRITICAL: Always call a safe output tool

You MUST call ONE of these before completing:
- `safeoutputs___create_pull_request` (if Test 2 succeeds)
- `safeoutputs___noop` (if both tests fail)

## Expected Behavior

**Test 1 (no push):** Should fail with "no-commits-found"  
**Test 2 (with push):** Should succeed and create PR

This confirms:
- Container isolation issue exists
- Git push workaround resolves the issue
- Future workflows should push before calling create_pull_request
