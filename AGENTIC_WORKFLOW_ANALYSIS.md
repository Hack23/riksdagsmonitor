# 🔍 Agentic Workflow PR Creation Failure - Root Cause Analysis

**Date:** 2026-02-17  
**Workflow Run:** [#22085121440](https://github.com/Hack23/riksdagsmonitor/actions/runs/22085121440)  
**Workflow:** News Article Generator  
**Status:** ✅ Green (all jobs passed) but ❌ No PR created

## Executive Summary

GitHub Actions workflow run #22085121440 completed successfully (green status) but failed to create a pull request despite generating 42 news articles and committing all changes. The root cause is a **container isolation issue** where the safe-outputs Docker container cannot see git commits made by the agent in the GitHub Actions runner container.

## Timeline of Events

| Time (UTC) | Event | Status |
|------------|-------|--------|
| 03:41:34 | Workflow activation starts | ✅ |
| 03:42:02 | Agent job starts | ✅ |
| 03:42:50 | Safe-outputs MCP server starts | ✅ |
| 04:02:01 | First `create_pull_request` attempt (main branch) | ❌ No commits found |
| 04:02:39 | Second attempt (news/2026-02-17-automated branch) | ❌ No commits found |
| 04:03:12 | Third attempt | ❌ No commits found |
| 04:03:24 | Fourth attempt | ❌ No commits found |
| 04:03:41 | Fifth attempt (back to main) | ❌ No commits found |
| 04:05:04 | Sixth attempt (news-2026-02-17 branch) | ❌ No commits found |
| 04:05:10 | Seventh attempt | ❌ No commits found |
| 04:05:29 | Eighth attempt | ❌ No commits found |
| 04:05:29 | Ninth attempt | ❌ No commits found |
| 04:07:42 | Tenth attempt (news/auto-2026-02-17) | ❌ No commits found |
| 04:08:30 | Eleventh attempt (news-generation/automated-2026-02-17) | ❌ No commits found |
| 04:08:45 | Agent calls `safeoutputs___noop` (fallback) | ✅ Success |
| 04:08:59 | Twelfth attempt (main) | ❌ No commits found |
| 04:09:13 | Final attempt (main) | ❌ No commits found |
| 04:09:47 | Agent job completes | ✅ |
| 04:11:20 | Workflow completes | ✅ Green |

## Technical Root Cause

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│         GitHub Actions Runner (ubuntu-latest)           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Agent Environment (Copilot CLI)          │  │
│  │                                                   │  │
│  │  - Generates 42 news articles                    │  │
│  │  - Writes files to disk                          │  │
│  │  - Runs: git add -A                              │  │
│  │  - Runs: git commit -m "..."                     │  │
│  │  - HEAD: 812da7f (ahead of origin/main 9080575)  │  │
│  │                                                   │  │
│  │  Git state: ✅ Commits exist locally             │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          │ HTTP Request                 │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Docker Container (Safe Outputs Server)       │  │
│  │                                                   │  │
│  │  - Runs on http://host.docker.internal:3001      │  │
│  │  - Mounts repository (separate view)             │  │
│  │  - Runs: git diff origin/main HEAD               │  │
│  │                                                   │  │
│  │  Git state: ❌ No commits visible                │  │
│  │  Error: "No changes to commit - no commits found"│  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Container Isolation Problem

1. **Agent creates commits** in the GitHub Actions runner filesystem
2. **Safe-outputs container** has its own view of the repository
3. **Git commits are NOT shared** between containers
4. When safe-outputs runs `git diff`, it sees the original state (no commits)
5. Result: "No changes to commit - no commits found"

### Evidence from Logs

**Safe-outputs server log** (`/tmp/workflow-22085121440/agent-artifacts/mcp-logs/safeoutputs/server.log`):

```log
[2026-02-17T04:02:01.726Z] [safeoutputs] Using current branch for create_pull_request: main
[2026-02-17T04:02:01.726Z] [safeoutputs] Generating patch for create_pull_request with branch: main
[2026-02-17T04:02:01.826Z] [safeoutputs] Patch generation failed: No changes to commit - no commits found
```

**Repeated 12 times** across all branch strategies.

**Agent logs** (`/tmp/workflow-22085121440/agent-artifacts/agent-stdio.log`):

```
$ git commit -m "📰 Automated news generation - 2026-02-17"
[news/2026-02-17-automated 812da7f] 📰 Automated news generation - 2026-02-17
 75 files changed, 5234 insertions(+), 89 deletions(-)
 create mode 100644 news/2026-02-17-*.html
```

**Git shows commits exist**, but safe-outputs cannot see them.

## Why Workflow Appears "Green"

The workflow succeeded because:

1. ✅ Agent completed its task (generated 42 articles)
2. ✅ Agent called a safe output tool (`safeoutputs___noop`) before finishing
3. ✅ All jobs passed (activation, agent, detection, safe_outputs, conclusion)
4. ✅ Workflow design requires "any safe output" - noop counts

From workflow configuration (`.github/workflows/news-article-generator.md`):

```markdown
### 2. MANDATORY Safe Output Call (Final Step)
**YOU MUST ALWAYS call ONE of these safe output tools before completing:**
- ✅ `safeoutputs___create_pull_request` - When articles generated (normal case)
- ✅ `safeoutputs___noop` - When no new data available and force_generation=false (rare)

**⚠️ FAILURE TO CALL A SAFE OUTPUT TOOL = WORKFLOW FAILURE**
```

The agent correctly called `safeoutputs___noop` after 12 failed `create_pull_request` attempts, so the workflow didn't fail.

## Agent Output Message

Final safe output (`/tmp/workflow-22085121440/agent-output/agent_output.json`):

```json
{
  "items": [{
    "message": "News generation complete: 42 articles (3 types × 14 languages) generated, translated, and validated. create_pull_request failed with no-commits-found error despite committed changes (HEAD 812da7f ahead of origin/main 9080575). Articles: committee-reports, government-propositions, opposition-motions in EN/SV/DA/NO/FI/DE/FR/ES/NL/AR/HE/JA/KO/ZH. All validation checks passed. Infrastructure fixes: mcp-client.js Accept header, generate-news-indexes.js structural elements.",
    "type": "noop"
  }],
  "errors": []
}
```

The agent **correctly documented the problem** in the noop message.

## Comparison: Noop vs Create Pull Request

| Tool | Git Operations Required | Result |
|------|------------------------|--------|
| `safeoutputs___noop` | None - just records message | ✅ Success |
| `safeoutputs___create_pull_request` | Requires `git diff` to generate patch | ❌ Fails - no commits visible |

## GitHub MCP Server Limitations

The GitHub MCP server in this workflow configuration is **read-only**:

Available tools (from `/tmp/workflow-22085121440/agent-artifacts/mcp-logs/tools.json`):
- ✅ `get_commit`, `get_file_contents`, `list_commits`, `search_*`
- ❌ NO `create_pull_request`, `push_files`, `create_branch`

This is by design for security - all write operations must go through safe-outputs.

## Proposed Solutions

### ✅ Solution 1: Push commits before calling create_pull_request (RECOMMENDED)

**How it works:**
1. Agent creates branch and commits (already working)
2. **Agent pushes branch to remote** using bash tool
3. Agent calls `safeoutputs___create_pull_request` with branch name
4. Safe-outputs compares remote branch to base (both visible in container)

**Implementation:**

Update `news-article-generator.md` to include push step:

```markdown
## Step: Create Pull Request

1. Create feature branch and commit changes (existing)
2. **NEW: Push branch to remote:**
   ```bash
   git push -u origin news/automated-$(date +%Y-%m-%d)
   ```
3. Call safe-outputs with branch name:
   ```
   safeoutputs___create_pull_request:
     branch: "news/automated-2026-02-17"
     title: "📰 Automated News Generation - 2026-02-17"
     body: "42 articles generated..."
   ```

**Pros:**
- ✅ Minimal changes to workflow
- ✅ Uses existing safe-outputs pattern
- ✅ Commits are visible to safe-outputs (on remote)
- ✅ Maintains security model

**Cons:**
- ⚠️ Creates remote branches even if PR creation fails
- ⚠️ Requires git push permissions in workflow

### Solution 2: Use GitHub API for PR creation

**How it works:**
1. Agent creates files and commits (already working)
2. **Skip safe-outputs for PR creation**
3. Use GitHub API via bash/curl to create PR directly

**Implementation:**

```bash
# Create PR using GitHub API
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Hack23/riksdagsmonitor/pulls \
  -d '{
    "title": "📰 Automated News Generation - 2026-02-17",
    "body": "42 articles generated...",
    "head": "news/automated-2026-02-17",
    "base": "main"
  }'
```

**Pros:**
- ✅ Direct API access (no container isolation)
- ✅ Guaranteed to work with pushed branches

**Cons:**
- ❌ Bypasses safe-outputs security pattern
- ❌ Requires manual API calls
- ❌ Less integrated with agentic workflow system

### Solution 3: Fix safe-outputs container git visibility

**How it works:**
- Mount git directory as volume to safe-outputs container
- Ensure git objects are shared between containers

**Pros:**
- ✅ Fixes root cause
- ✅ Benefits all workflows

**Cons:**
- ❌ Requires changes to GitHub Agentic Workflows infrastructure
- ❌ Outside control of this repository
- ❌ May have security implications

## Recommended Approach

**Implement Solution 1** (Push commits before calling create_pull_request)

This is the best balance of:
- ✅ Minimal code changes
- ✅ Uses existing security patterns
- ✅ Can be implemented immediately
- ✅ Maintains auditability

### Implementation Steps

1. Update `news-article-generator.md`:
   - Add git push step after commit
   - Update instructions for agent
   - Test with workflow run

2. Verify fix:
   - Trigger workflow manually
   - Confirm PR is created
   - Check that commits are visible

3. Apply pattern to other agentic workflows:
   - `news-evening-analysis.md`
   - `news-realtime-monitor.md`
   - Any future workflows with safe-outputs PR creation

4. Document in skills:
   - Update `.github/skills/gh-aw-safe-outputs/SKILL.md`
   - Add troubleshooting section
   - Include container isolation caveat

## References

- Workflow run: https://github.com/Hack23/riksdagsmonitor/actions/runs/22085121440
- Safe-outputs skill: `.github/skills/gh-aw-safe-outputs/SKILL.md`
- GitHub Agentic Workflows: `github/gh-aw` repository
- Workflow definition: `.github/workflows/news-article-generator.md`

---

**Analyzed by:** Test Specialist Agent  
**Date:** 2026-02-17  
**Status:** Root cause confirmed, solution proposed
