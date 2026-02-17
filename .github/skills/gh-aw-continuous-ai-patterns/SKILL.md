---
name: GitHub Agentic Workflows Continuous AI Patterns
description: Comprehensive guide for continuous AI workflows including triage, review, maintenance, monitoring, scheduling strategies, event-driven automation, human-in-the-loop patterns, and feedback loops
license: Apache-2.0
version: 1.0.0
last_updated: 2026-02-17
tags:
  - github-agentic-workflows
  - continuous-ai
  - workflow-patterns
  - automation
  - triage
  - code-review
  - maintenance
  - monitoring
  - scheduling
  - event-driven
  - human-in-the-loop
  - feedback-loops
---

# 🔄 GitHub Agentic Workflows Continuous AI Patterns

## 📋 Overview

This skill provides comprehensive patterns for implementing Continuous AI workflows with GitHub Agentic Workflows. Continuous AI extends CI/CD principles to AI-powered automation, enabling agents to continuously triage issues, review code, maintain repositories, and monitor systems with minimal human intervention.

### What is Continuous AI?

**Continuous AI** is the practice of deploying AI agents that run continuously or on regular schedules to perform repetitive tasks, monitor systems, and maintain code quality without manual intervention:

- **Continuous Triage**: Automatically label, prioritize, and route issues and PRs
- **Continuous Review**: Automated code reviews on every PR
- **Continuous Maintenance**: Dependency updates, security patches, code refactoring
- **Continuous Monitoring**: System health, performance metrics, security alerts
- **Feedback Loops**: Learn from outcomes and improve over time

### Why Continuous AI?

Traditional CI/CD focuses on build, test, and deploy. Continuous AI extends this to intelligent automation:

- ✅ **24/7 Operation**: Agents work around the clock
- ✅ **Instant Response**: No waiting for human availability
- ✅ **Consistency**: Same quality standards applied every time
- ✅ **Scalability**: Handle thousands of issues, PRs, and alerts
- ✅ **Cost Efficiency**: Reduce manual work and accelerate development
- ✅ **Knowledge Retention**: Agents learn from history and feedback

---

## 🎯 Continuous AI Concept

### The Continuous AI Loop

```
┌─────────────────────────────────────────────────────────────┐
│                   CONTINUOUS AI LOOP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. OBSERVE                                                │
│      └─> Events (issues, PRs, commits, alerts)             │
│                                                             │
│   2. ANALYZE                                                │
│      └─> Context, patterns, history                        │
│                                                             │
│   3. DECIDE                                                 │
│      └─> Determine action (or escalate to human)           │
│                                                             │
│   4. ACT                                                    │
│      └─> Execute action (label, review, fix)               │
│                                                             │
│   5. LEARN                                                  │
│      └─> Collect feedback, update models                   │
│                                                             │
│   6. REPEAT                                                 │
│      └─> Back to OBSERVE                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Continuous AI Principles

1. **Autonomy**: Agents make decisions independently within defined boundaries
2. **Observability**: All actions are logged and auditable
3. **Reversibility**: Actions can be undone if incorrect
4. **Human Oversight**: Critical decisions require human approval
5. **Continuous Learning**: Agents improve from feedback
6. **Graceful Degradation**: Fall back to safer behavior on uncertainty

---

## 🏷️ Continuous Triage Pattern

### Automatic Issue Labeling and Prioritization

```yaml
# .github/workflows/continuous-triage.yml
name: Continuous Issue Triage
on:
  issues:
    types: [opened, edited]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

permissions:
  issues: write
  contents: read

jobs:
  triage-issues:
    runs-on: ubuntu-latest
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@v2
        with:
          egress-policy: audit
      
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Triage New Issues
        uses: github/copilot-agent@v1
        with:
          agent: triage-agent
          task: |
            Analyze and triage all issues:
            1. Classify by type (bug, feature, docs, security)
            2. Assign priority (P0-critical, P1-high, P2-medium, P3-low)
            3. Apply relevant labels
            4. Detect duplicates
            5. Auto-assign to appropriate team/person
            6. Add to project board
            
            For security issues:
            - Label as 'security'
            - Set priority to P0
            - Assign to security team
            - Create private security advisory if needed
            
            For bugs with reproduction steps:
            - Label as 'bug'
            - Add 'reproduction-provided' label
            - Higher priority than bugs without reproduction
            
            For feature requests:
            - Label as 'enhancement'
            - Check if duplicate of existing feature request
            - Assign to product team for review
      
      - name: Comment on Triaged Issues
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --body "🤖 Issue automatically triaged by AI agent"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Triage Agent Implementation

```yaml
# .github/agents/triage-agent.yaml
---
name: triage-agent
description: Automatically triage issues and PRs
tools:
  - github-issue_read
  - github-issue_write
  - github-search_issues
  - github-projects_write
---

You are an expert issue triage agent. Your goal is to efficiently categorize, prioritize, and route issues to the appropriate teams.

## Classification Rules

### Issue Types
- **bug**: Runtime errors, crashes, incorrect behavior
- **enhancement**: New features or improvements
- **documentation**: Docs updates, typos, missing examples
- **security**: Vulnerabilities, CVEs, security concerns
- **performance**: Slow code, memory leaks, optimization
- **refactor**: Code cleanup, technical debt
- **ci**: CI/CD issues, workflow problems
- **dependencies**: Dependency updates, conflicts

### Priority Levels
- **P0-critical**: System down, data loss, security breach
- **P1-high**: Major functionality broken, security issue
- **P2-medium**: Feature broken, workaround exists
- **P3-low**: Minor bug, cosmetic issue, nice-to-have

### Priority Decision Matrix
```
┌──────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Type / Impact    │ Critical │   High   │  Medium  │   Low    │
├──────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Security         │    P0    │    P0    │    P1    │    P2    │
│ Bug (prod)       │    P0    │    P1    │    P2    │    P3    │
│ Bug (dev)        │    P1    │    P2    │    P3    │    P3    │
│ Enhancement      │    P1    │    P2    │    P3    │    P3    │
│ Documentation    │    P2    │    P3    │    P3    │    P3    │
│ Refactor         │    P2    │    P3    │    P3    │    P3    │
└──────────────────┴──────────┴──────────┴──────────┴──────────┘
```

## Triage Steps

1. **Read issue content**: Title, description, labels, comments
2. **Classify**: Determine issue type based on content
3. **Assess impact**: Production vs. dev, users affected
4. **Assign priority**: Use decision matrix
5. **Apply labels**: Type + priority + additional context labels
6. **Detect duplicates**: Search for similar issues
7. **Assign owner**: Route to appropriate team or person
8. **Add to project**: Place in correct project board column

## Special Handling

### Security Issues
- Immediately label as 'security'
- Set priority to P0 or P1
- Assign to security team
- If vulnerability disclosure, create security advisory
- Do NOT comment sensitive details publicly

### Duplicates
- Search for similar issues using keywords
- If found, comment with link and close as duplicate
- Transfer conversation to original issue

### Invalid Issues
- Missing reproduction steps for bugs → Request more info
- Spam or off-topic → Close with explanation
- Question (not issue) → Convert to discussion

## Examples

### Example 1: Security Issue
```
Issue: "SQL Injection in user login"
Classification: security
Priority: P0-critical
Labels: security, bug, P0-critical
Assigned: security-team
Action: Create security advisory
```

### Example 2: Feature Request
```
Issue: "Add dark mode support"
Classification: enhancement
Priority: P2-medium
Labels: enhancement, ui, P2-medium
Assigned: frontend-team
Action: Add to backlog project
```

### Example 3: Bug with Reproduction
```
Issue: "App crashes when clicking save button"
Classification: bug
Priority: P1-high (production impact)
Labels: bug, P1-high, reproduction-provided
Assigned: backend-team
Action: Add to current sprint
```
```

### Intelligent Duplicate Detection

```javascript
// duplicate-detector.js
class DuplicateDetector {
  constructor(github) {
    this.github = github;
  }
  
  async findDuplicates(issue) {
    // Extract keywords from title and body
    const keywords = this.extractKeywords(issue.title + ' ' + issue.body);
    
    // Search for similar issues
    const searchQuery = `repo:${issue.repository} is:issue ${keywords.join(' OR ')}`;
    
    const { data: searchResults } = await this.github.search.issuesAndPullRequests({
      q: searchQuery,
      per_page: 10,
    });
    
    const candidates = searchResults.items.filter(
      item => item.number !== issue.number
    );
    
    // Calculate similarity scores
    const scored = candidates.map(candidate => ({
      issue: candidate,
      score: this.calculateSimilarity(issue, candidate),
    }));
    
    // Filter by similarity threshold
    const duplicates = scored.filter(s => s.score > 0.7);
    
    return duplicates.sort((a, b) => b.score - a.score);
  }
  
  extractKeywords(text) {
    // Remove common words
    const stopwords = new Set([
      'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for',
      'is', 'was', 'are', 'were', 'be', 'been',
    ]);
    
    // Tokenize and filter
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.has(word));
    
    // Get unique words
    return [...new Set(words)];
  }
  
  calculateSimilarity(issue1, issue2) {
    // Title similarity (weighted 60%)
    const titleSim = this.jaccardSimilarity(
      issue1.title.toLowerCase(),
      issue2.title.toLowerCase()
    );
    
    // Body similarity (weighted 40%)
    const bodySim = this.jaccardSimilarity(
      issue1.body.toLowerCase(),
      issue2.body.toLowerCase()
    );
    
    // Label similarity (bonus)
    const labelSim = this.labelSimilarity(
      issue1.labels,
      issue2.labels
    );
    
    return (titleSim * 0.6 + bodySim * 0.4) * (1 + labelSim * 0.1);
  }
  
  jaccardSimilarity(str1, str2) {
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
  
  labelSimilarity(labels1, labels2) {
    const set1 = new Set(labels1.map(l => l.name));
    const set2 = new Set(labels2.map(l => l.name));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}
```

---

## 👀 Continuous Review Pattern

### Automated Code Review on Every PR

```yaml
# .github/workflows/continuous-review.yml
name: Continuous Code Review
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@v2
        with:
          egress-policy: audit
      
      - name: Checkout PR
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      
      - name: AI Code Review
        uses: github/copilot-agent@v1
        with:
          agent: code-reviewer
          task: |
            Review pull request #${{ github.event.pull_request.number }}:
            
            1. Code Quality:
               - Check for code smells
               - Identify potential bugs
               - Suggest improvements
            
            2. Security:
               - Look for security vulnerabilities
               - Check for hardcoded secrets
               - Validate input sanitization
            
            3. Performance:
               - Identify inefficient algorithms
               - Check for memory leaks
               - Suggest optimizations
            
            4. Best Practices:
               - Ensure consistent style
               - Check error handling
               - Validate test coverage
            
            5. Documentation:
               - Verify docstrings
               - Check README updates
               - Ensure CHANGELOG entry
            
            Provide specific, actionable feedback with code examples.
      
      - name: Post Review Comments
        uses: github/copilot-agent@v1
        with:
          agent: comment-poster
          task: |
            Post review comments on PR #${{ github.event.pull_request.number }}
            using the feedback from the code review.
            
            Use line-specific comments for code issues.
            Use general comment for overall feedback.
```

### Progressive Review Pattern

```javascript
// progressive-review.js
class ProgressiveReviewer {
  constructor() {
    this.levels = [
      {
        name: 'quick-scan',
        timeout: 30,
        checks: [
          'syntax-errors',
          'obvious-bugs',
          'security-critical',
        ],
      },
      {
        name: 'standard-review',
        timeout: 120,
        checks: [
          'code-quality',
          'performance',
          'best-practices',
          'security',
        ],
      },
      {
        name: 'deep-analysis',
        timeout: 300,
        checks: [
          'architecture',
          'design-patterns',
          'edge-cases',
          'maintainability',
        ],
      },
    ];
  }
  
  async reviewPR(pr) {
    const findings = [];
    
    for (const level of this.levels) {
      console.log(`Running ${level.name}...`);
      
      try {
        const levelFindings = await this.runLevel(level, pr);
        findings.push(...levelFindings);
        
        // Stop if critical issues found
        if (this.hasCriticalIssues(levelFindings)) {
          console.log('Critical issues found, stopping review');
          break;
        }
      } catch (error) {
        console.error(`Level ${level.name} failed:`, error);
        break;
      }
    }
    
    return this.consolidateFindings(findings);
  }
  
  async runLevel(level, pr) {
    const findings = [];
    
    for (const check of level.checks) {
      const checkFindings = await this.runCheck(check, pr);
      findings.push(...checkFindings);
    }
    
    return findings;
  }
  
  async runCheck(check, pr) {
    // Implement specific check logic
    switch (check) {
      case 'syntax-errors':
        return this.checkSyntax(pr);
      case 'security-critical':
        return this.checkSecurity(pr);
      case 'code-quality':
        return this.checkQuality(pr);
      default:
        return [];
    }
  }
  
  hasCriticalIssues(findings) {
    return findings.some(f => f.severity === 'critical');
  }
  
  consolidateFindings(findings) {
    // Remove duplicates, prioritize by severity
    const seen = new Set();
    const unique = [];
    
    const sorted = findings.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    for (const finding of sorted) {
      const key = `${finding.file}:${finding.line}:${finding.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(finding);
      }
    }
    
    return unique;
  }
}
```

---

## 🔧 Continuous Maintenance Pattern

### Automated Dependency Updates

```yaml
# .github/workflows/continuous-maintenance.yml
name: Continuous Maintenance
on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  update-dependencies:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Check for Dependency Updates
        id: updates
        run: |
          npm outdated --json > outdated.json || true
          
          # Filter to security updates and minor/patch versions
          jq '[.[] | select(.wanted != .current)]' outdated.json > updates.json
      
      - name: AI-Powered Update Decision
        uses: github/copilot-agent@v1
        with:
          agent: maintenance-agent
          task: |
            Analyze dependency updates in updates.json:
            
            For each update:
            1. Read CHANGELOG to understand changes
            2. Assess breaking change risk
            3. Check for known issues
            4. Prioritize security updates
            
            Create a plan:
            - Group compatible updates
            - Separate breaking changes
            - Schedule rollout (immediate vs. gradual)
            
            Generate PRs for approved updates.
      
      - name: Create Update PRs
        run: |
          # Agent creates PRs for approved updates
          copilot-cli execute --agent maintenance-agent \
            --task "Create PRs for approved dependency updates"
```

### Automated Code Refactoring

```yaml
# .github/workflows/refactor-bot.yml
name: Refactor Bot
on:
  schedule:
    - cron: '0 3 * * 0'  # Every Sunday at 3 AM

jobs:
  identify-refactoring-opportunities:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Run Static Analysis
        run: |
          # Find code smells
          npx jscpd src/ --format json > duplication.json
          
          # Find complex functions
          npx complexity-report src/ --format json > complexity.json
          
          # Find test coverage gaps
          npm test -- --coverage --json > coverage.json
      
      - name: AI Refactoring Analysis
        uses: github/copilot-agent@v1
        with:
          agent: refactor-agent
          task: |
            Analyze codebase for refactoring opportunities:
            
            1. Code Duplication (duplication.json):
               - Find duplicated code blocks
               - Suggest extraction to functions/modules
            
            2. Complexity (complexity.json):
               - Identify complex functions (CC > 10)
               - Suggest simplification strategies
            
            3. Test Coverage (coverage.json):
               - Find uncovered code
               - Suggest test cases
            
            4. Architectural Issues:
               - God classes (> 500 lines)
               - Long methods (> 50 lines)
               - Deep nesting (> 4 levels)
            
            Create issues for top 5 refactoring opportunities.
            For simple refactorings, create automated PRs.
```

---

## 📊 Continuous Monitoring Pattern

### System Health Monitoring

```yaml
# .github/workflows/continuous-monitoring.yml
name: Continuous Monitoring
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes

permissions:
  issues: write

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Production Health
        id: health
        run: |
          # Health check endpoints
          curl -f https://api.example.com/health > health.json
          
          # Performance metrics
          curl -f https://api.example.com/metrics > metrics.json
          
          # Error rates
          curl -f https://api.example.com/errors > errors.json
      
      - name: AI Anomaly Detection
        uses: github/copilot-agent@v1
        with:
          agent: monitoring-agent
          task: |
            Analyze system health data:
            
            1. Health Status (health.json):
               - Check all services are UP
               - Verify response times < 200ms
               - Check resource usage < 80%
            
            2. Performance Metrics (metrics.json):
               - Compare to historical baseline
               - Detect anomalies (> 2 std dev)
               - Identify trends
            
            3. Error Rates (errors.json):
               - Check error rate < 1%
               - Identify error spike patterns
               - Correlate with recent deployments
            
            If issues detected:
            - Create incident issue
            - Notify on-call engineer
            - Suggest remediation actions
            
            If trends detected:
            - Create warning issue
            - Provide trend analysis
            - Recommend preventive actions
```

### Anomaly Detection Algorithm

```javascript
// anomaly-detector.js
class AnomalyDetector {
  constructor(historicalData) {
    this.historicalData = historicalData;
    this.baseline = this.calculateBaseline();
  }
  
  calculateBaseline() {
    const values = this.historicalData.map(d => d.value);
    
    return {
      mean: this.mean(values),
      stdDev: this.standardDeviation(values),
      median: this.median(values),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    };
  }
  
  detectAnomalies(currentData) {
    const anomalies = [];
    
    for (const point of currentData) {
      const zScore = (point.value - this.baseline.mean) / this.baseline.stdDev;
      
      if (Math.abs(zScore) > 3) {
        // More than 3 standard deviations
        anomalies.push({
          metric: point.metric,
          value: point.value,
          baseline: this.baseline.mean,
          zScore,
          severity: Math.abs(zScore) > 5 ? 'critical' : 'high',
          timestamp: point.timestamp,
        });
      } else if (Math.abs(zScore) > 2) {
        // More than 2 standard deviations
        anomalies.push({
          metric: point.metric,
          value: point.value,
          baseline: this.baseline.mean,
          zScore,
          severity: 'medium',
          timestamp: point.timestamp,
        });
      }
    }
    
    return anomalies;
  }
  
  detectTrends(timeSeriesData, windowSize = 24) {
    const trends = [];
    
    for (let i = windowSize; i < timeSeriesData.length; i++) {
      const window = timeSeriesData.slice(i - windowSize, i);
      const values = window.map(d => d.value);
      
      // Linear regression
      const { slope, r2 } = this.linearRegression(values);
      
      // Significant trend if r² > 0.7 and |slope| > threshold
      if (r2 > 0.7 && Math.abs(slope) > 0.1) {
        trends.push({
          metric: timeSeriesData[i].metric,
          direction: slope > 0 ? 'increasing' : 'decreasing',
          slope,
          r2,
          strength: r2,
          timestamp: timeSeriesData[i].timestamp,
        });
      }
    }
    
    return trends;
  }
  
  mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  standardDeviation(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }
  
  median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
  
  linearRegression(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R²
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - ssRes / ssTot;
    
    return { slope, intercept, r2 };
  }
}
```

---

## ⏰ Scheduling Strategies

### Cron-Based Scheduling

```yaml
on:
  schedule:
    # Daily at 2 AM UTC
    - cron: '0 2 * * *'
    
    # Every hour
    - cron: '0 * * * *'
    
    # Every 15 minutes
    - cron: '*/15 * * * *'
    
    # Monday-Friday at 9 AM
    - cron: '0 9 * * 1-5'
    
    # First day of month
    - cron: '0 0 1 * *'
```

### Adaptive Scheduling

```javascript
// adaptive-scheduler.js
class AdaptiveScheduler {
  constructor() {
    this.metrics = {
      issueRate: 0,
      prRate: 0,
      errorRate: 0,
    };
  }
  
  calculateOptimalInterval() {
    // Base intervals (in minutes)
    const baseIntervals = {
      triage: 360,      // 6 hours
      review: 60,       // 1 hour
      monitoring: 15,   // 15 minutes
    };
    
    // Adjust based on activity
    const activityMultiplier = this.calculateActivityMultiplier();
    
    return {
      triage: Math.max(30, baseIntervals.triage / activityMultiplier),
      review: Math.max(15, baseIntervals.review / activityMultiplier),
      monitoring: Math.max(5, baseIntervals.monitoring / activityMultiplier),
    };
  }
  
  calculateActivityMultiplier() {
    // Higher activity → shorter intervals
    const issueScore = Math.log(this.metrics.issueRate + 1);
    const prScore = Math.log(this.metrics.prRate + 1);
    const errorScore = Math.log(this.metrics.errorRate + 1) * 2;
    
    return 1 + (issueScore + prScore + errorScore) / 10;
  }
  
  updateMetrics(newMetrics) {
    // Exponential moving average
    const alpha = 0.3;
    
    this.metrics.issueRate =
      alpha * newMetrics.issueRate + (1 - alpha) * this.metrics.issueRate;
    this.metrics.prRate =
      alpha * newMetrics.prRate + (1 - alpha) * this.metrics.prRate;
    this.metrics.errorRate =
      alpha * newMetrics.errorRate + (1 - alpha) * this.metrics.errorRate;
  }
}
```

---

## 🎛️ Event-Driven Automation

### GitHub Events

```yaml
on:
  # Issue events
  issues:
    types:
      - opened
      - edited
      - labeled
      - assigned
  
  # PR events
  pull_request:
    types:
      - opened
      - synchronize
      - reopened
      - ready_for_review
  
  # PR review events
  pull_request_review:
    types:
      - submitted
  
  # Comment events
  issue_comment:
    types:
      - created
  
  # Push events
  push:
    branches:
      - main
      - 'release/**'
  
  # Release events
  release:
    types:
      - published
  
  # Workflow run events
  workflow_run:
    workflows:
      - CI
    types:
      - completed
```

### Event-Driven Agent Dispatch

```javascript
// event-dispatcher.js
class EventDispatcher {
  constructor(agents) {
    this.agents = agents;
    this.eventHandlers = new Map();
    
    this.registerHandlers();
  }
  
  registerHandlers() {
    // Issue events
    this.on('issues.opened', async (event) => {
      await this.agents.triage.handleNewIssue(event.issue);
      await this.agents.duplicate.checkDuplicate(event.issue);
    });
    
    // PR events
    this.on('pull_request.opened', async (event) => {
      await this.agents.review.reviewPR(event.pull_request);
      await this.agents.test.triggerTests(event.pull_request);
    });
    
    this.on('pull_request.synchronize', async (event) => {
      await this.agents.review.reviewChanges(event.pull_request);
    });
    
    // Security events
    this.on('security_advisory.published', async (event) => {
      await this.agents.security.handleAdvisory(event.advisory);
      await this.agents.maintenance.checkDependencies(event.advisory);
    });
    
    // Workflow events
    this.on('workflow_run.completed', async (event) => {
      if (event.workflow_run.conclusion === 'failure') {
        await this.agents.incident.handleFailure(event.workflow_run);
      }
    });
  }
  
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType).push(handler);
  }
  
  async dispatch(event) {
    const eventType = `${event.type}.${event.action}`;
    const handlers = this.eventHandlers.get(eventType) || [];
    
    console.log(`Dispatching event: ${eventType}`);
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Handler failed for ${eventType}:`, error);
      }
    }
  }
}
```

---

## 👤 Human-in-the-Loop Patterns

### Approval Gates

```yaml
# .github/workflows/critical-change.yml
name: Critical Change with Approval
on:
  workflow_dispatch:
    inputs:
      change_description:
        description: 'What change to make'
        required: true

jobs:
  analyze-change:
    runs-on: ubuntu-latest
    steps:
      - name: AI Analysis
        id: analysis
        uses: github/copilot-agent@v1
        with:
          agent: change-analyzer
          task: |
            Analyze the proposed change: "${{ inputs.change_description }}"
            
            Provide:
            1. Impact assessment
            2. Risk level (low/medium/high/critical)
            3. Affected systems
            4. Rollback plan
            5. Recommendation (approve/reject/modify)
      
      - name: Upload Analysis
        uses: actions/upload-artifact@v4
        with:
          name: change-analysis
          path: analysis.json
  
  human-approval:
    needs: analyze-change
    runs-on: ubuntu-latest
    environment:
      name: production-approval
      required-reviewers: 2
    steps:
      - name: Download Analysis
        uses: actions/download-artifact@v4
        with:
          name: change-analysis
      
      - name: Display Analysis
        run: cat analysis.json
      
      - name: Wait for Approval
        run: echo "Waiting for human approval..."
  
  execute-change:
    needs: human-approval
    runs-on: ubuntu-latest
    steps:
      - name: Execute Change
        uses: github/copilot-agent@v1
        with:
          agent: change-executor
          task: |
            Execute the approved change: "${{ inputs.change_description }}"
            Follow the plan from the analysis.
```

### Feedback Collection

```yaml
# .github/workflows/collect-feedback.yml
name: Collect Agent Feedback
on:
  issue_comment:
    types: [created]

jobs:
  check-feedback:
    if: contains(github.event.comment.body, '@agent-feedback')
    runs-on: ubuntu-latest
    steps:
      - name: Parse Feedback
        id: feedback
        run: |
          # Extract feedback sentiment
          if [[ "${{ github.event.comment.body }}" =~ "👍" ]]; then
            echo "sentiment=positive" >> $GITHUB_OUTPUT
          elif [[ "${{ github.event.comment.body }}" =~ "👎" ]]; then
            echo "sentiment=negative" >> $GITHUB_OUTPUT
          else
            echo "sentiment=neutral" >> $GITHUB_OUTPUT
          fi
      
      - name: Store Feedback
        run: |
          # Store feedback for model training
          cat << EOF > feedback.json
          {
            "issue": ${{ github.event.issue.number }},
            "comment": ${{ github.event.comment.id }},
            "sentiment": "${{ steps.feedback.outputs.sentiment }}",
            "text": "${{ github.event.comment.body }}",
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          }
          EOF
          
          # Upload to feedback dataset
          curl -X POST https://feedback-api.example.com/collect \
            -H "Content-Type: application/json" \
            -d @feedback.json
```

---

## 🔁 Feedback Loops

### Performance Feedback

```javascript
// feedback-collector.js
class FeedbackCollector {
  constructor() {
    this.metrics = {
      accuracy: [],
      latency: [],
      satisfaction: [],
    };
  }
  
  async collectFeedback(agentAction) {
    const feedback = {
      actionId: agentAction.id,
      timestamp: new Date().toISOString(),
      agent: agentAction.agent,
      action: agentAction.action,
      outcome: await this.measureOutcome(agentAction),
    };
    
    // Store feedback
    await this.storeFeedback(feedback);
    
    // Update metrics
    this.updateMetrics(feedback);
    
    // Trigger retraining if needed
    if (this.shouldRetrain()) {
      await this.triggerRetraining();
    }
    
    return feedback;
  }
  
  async measureOutcome(agentAction) {
    switch (agentAction.action) {
      case 'triage':
        return this.measureTriageOutcome(agentAction);
      case 'review':
        return this.measureReviewOutcome(agentAction);
      default:
        return null;
    }
  }
  
  async measureTriageOutcome(action) {
    // Check if labels were manually changed
    const issue = await this.getIssue(action.issueNumber);
    const initialLabels = new Set(action.appliedLabels);
    const currentLabels = new Set(issue.labels.map(l => l.name));
    
    // Calculate accuracy
    const correctLabels = [...currentLabels].filter(l => initialLabels.has(l));
    const accuracy = correctLabels.length / initialLabels.size;
    
    return {
      accuracy,
      manualChanges: initialLabels.size - correctLabels.length,
    };
  }
  
  async measureReviewOutcome(action) {
    // Check if review comments were helpful
    const pr = await this.getPR(action.prNumber);
    const reviewComments = action.comments;
    
    let helpful = 0;
    let unhelpful = 0;
    
    for (const comment of reviewComments) {
      const reactions = await this.getReactions(comment.id);
      helpful += reactions['+1'] || 0;
      unhelpful += reactions['-1'] || 0;
    }
    
    const satisfaction = helpful / (helpful + unhelpful + 1);
    
    return {
      satisfaction,
      helpful,
      unhelpful,
    };
  }
  
  updateMetrics(feedback) {
    if (feedback.outcome?.accuracy !== undefined) {
      this.metrics.accuracy.push(feedback.outcome.accuracy);
    }
    
    if (feedback.outcome?.satisfaction !== undefined) {
      this.metrics.satisfaction.push(feedback.outcome.satisfaction);
    }
    
    // Keep only last 1000 data points
    for (const key in this.metrics) {
      if (this.metrics[key].length > 1000) {
        this.metrics[key] = this.metrics[key].slice(-1000);
      }
    }
  }
  
  shouldRetrain() {
    // Retrain if accuracy drops below threshold
    const recentAccuracy = this.metrics.accuracy.slice(-100);
    const avgAccuracy =
      recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;
    
    return avgAccuracy < 0.7;
  }
  
  async triggerRetraining() {
    console.log('🔄 Triggering model retraining...');
    
    // Trigger retraining workflow
    await this.github.actions.createWorkflowDispatch({
      owner: 'org',
      repo: 'repo',
      workflow_id: 'retrain-model.yml',
      ref: 'main',
      inputs: {
        reason: 'accuracy_drop',
        metrics: JSON.stringify(this.getMetricsSummary()),
      },
    });
  }
  
  getMetricsSummary() {
    return {
      accuracy: {
        mean: this.mean(this.metrics.accuracy),
        stdDev: this.stdDev(this.metrics.accuracy),
      },
      satisfaction: {
        mean: this.mean(this.metrics.satisfaction),
        stdDev: this.stdDev(this.metrics.satisfaction),
      },
    };
  }
  
  mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  stdDev(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }
}
```

---

## 🎓 Related Skills

- **gh-aw-security-architecture**: Security for continuous AI
- **gh-aw-mcp-configuration**: MCP server configuration
- **gh-aw-tools-ecosystem**: Available tools for agents
- **github-actions-workflows**: CI/CD workflows

---

## 📚 References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Copilot Agents](https://docs.github.com/en/copilot/concepts/agents)
- [Continuous Integration/Delivery](https://martinfowler.com/articles/continuousIntegration.html)
- [DevOps Patterns](https://www.devops-research.com/research.html)

---

## ✅ Remember

- [ ] Design agents for continuous operation (24/7)
- [ ] Implement progressive review levels (quick → deep)
- [ ] Use adaptive scheduling based on activity
- [ ] Set up event-driven agent dispatch
- [ ] Add human approval gates for critical actions
- [ ] Collect feedback on agent performance
- [ ] Monitor agent metrics (accuracy, latency, satisfaction)
- [ ] Implement graceful degradation and fallbacks
- [ ] Log all agent actions for audit
- [ ] Use circuit breakers to prevent runaway agents
- [ ] Implement duplicate detection for issues/PRs
- [ ] Set up anomaly detection for monitoring
- [ ] Create feedback loops for continuous learning
- [ ] Schedule retraining based on performance metrics
- [ ] Document agent decision logic

---

**Last Updated**: 2026-02-17  
**Version**: 1.0.0  
**License**: Apache-2.0
