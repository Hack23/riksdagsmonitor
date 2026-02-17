---
name: GitHub Agentic Workflows Tools Ecosystem
description: Comprehensive guide for all available tools including GitHub, file operations, web, bash, playwright, tool capabilities and limitations, integration patterns, custom tool development, security considerations, and usage examples
license: Apache-2.0
version: 1.0.0
last_updated: 2026-02-17
tags:
  - github-agentic-workflows
  - tools
  - github-tools
  - file-operations
  - web-tools
  - bash
  - playwright
  - browser-automation
  - custom-tools
  - tool-security
  - integration-patterns
---

# 🛠️ GitHub Agentic Workflows Tools Ecosystem

## 📋 Overview

This skill provides a comprehensive guide to all tools available in GitHub Agentic Workflows. Understanding the tools ecosystem is critical for building effective AI agents that can interact with code, GitHub APIs, browsers, and external services.

### What is the Tools Ecosystem?

The **Tools Ecosystem** is the collection of capabilities that AI agents can invoke to perform actions:

- **GitHub Tools**: Interact with repositories, issues, PRs, workflows
- **File Operations**: Read, write, edit files in repositories
- **Web Tools**: Fetch web pages, make HTTP requests, search the web
- **Bash Tools**: Execute shell commands, run scripts
- **Playwright Tools**: Automate browsers, take screenshots, interact with web UIs
- **Memory Tools**: Store and retrieve knowledge across sessions
- **Custom Tools**: Develop domain-specific tools via MCP servers

### Why Master the Tools Ecosystem?

Effective agents require deep knowledge of available tools:

- ✅ **Capability Awareness**: Know what's possible
- ✅ **Tool Selection**: Choose the right tool for each task
- ✅ **Efficient Workflows**: Combine tools effectively
- ✅ **Security**: Understand tool limitations and risks
- ✅ **Error Handling**: Handle tool failures gracefully
- ✅ **Extensibility**: Build custom tools when needed

---

## 🐙 GitHub Tools

### Repository Operations

#### View Files and Directories

```javascript
// github-get_file_contents
await github.getFileContents({
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  path: 'src/index.js',
  ref: 'main',
});

// List directory
await github.getFileContents({
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  path: 'src/',
});
```

#### Get Repository Tree

```javascript
// github-get_repository_tree
await github.getRepositoryTree({
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  tree_sha: 'main',
  recursive: true,
  path_filter: 'src/',
});
```

### Issue Operations

```javascript
// Create issue
await github.issueWrite({
  method: 'create',
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  title: 'Bug: Application crashes',
  body: 'Description here...',
  labels: ['bug', 'P1-high'],
  assignees: ['developer1'],
});

// Search issues
await github.searchIssues({
  query: 'repo:Hack23/riksdagsmonitor is:open label:bug',
  sort: 'created',
  order: 'desc',
});
```

### Pull Request Operations

```javascript
// Create PR
await github.createPullRequest({
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  title: 'feat: Add dark mode',
  body: 'Implementation details...',
  head: 'feature/dark-mode',
  base: 'main',
});

// Get PR diff
await github.pullRequestRead({
  method: 'get_diff',
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  pullNumber: 456,
});

// Code review
await github.pullRequestReviewWrite({
  method: 'create',
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  pullNumber: 456,
  body: 'LGTM!',
  event: 'APPROVE',
});
```

### GitHub Actions

```javascript
// List workflows
await github.actionsList({
  method: 'list_workflows',
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
});

// Trigger workflow
await github.actionsRunTrigger({
  method: 'run_workflow',
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  workflow_id: 'deploy.yml',
  ref: 'main',
  inputs: { environment: 'production' },
});

// Get job logs
await github.getJobLogs({
  owner: 'Hack23',
  repo: 'riksdagsmonitor',
  job_id: 98765432,
  return_content: true,
  tail_lines: 500,
});
```

---

## 📁 File Operations

### Read Files

```javascript
// Read entire file
const content = await filesystem.readTextFile({
  path: '/workspace/src/index.js',
});

// Read first 50 lines
const header = await filesystem.readTextFile({
  path: '/workspace/README.md',
  head: 50,
});

// Read last 100 lines
const logs = await filesystem.readTextFile({
  path: '/workspace/app.log',
  tail: 100,
});

// Read multiple files
const files = await filesystem.readMultipleFiles({
  paths: ['file1.js', 'file2.js', 'file3.js'],
});
```

### Write and Edit Files

```javascript
// Create or overwrite file
await filesystem.writeFile({
  path: '/workspace/output.txt',
  content: 'File content...',
});

// Edit file (line-based)
await filesystem.editFile({
  path: '/workspace/src/index.js',
  edits: [
    {
      oldText: 'const oldVar = 123;',
      newText: 'const newVar = 456;',
    },
  ],
});
```

### Directory Operations

```javascript
// List directory
const entries = await filesystem.listDirectory({
  path: '/workspace/src',
});

// List with sizes
const entriesWithSizes = await filesystem.listDirectoryWithSizes({
  path: '/workspace/dist',
  sortBy: 'size',
});

// Get directory tree
const tree = await filesystem.directoryTree({
  path: '/workspace',
  excludePatterns: ['node_modules/**', '.git/**'],
});

// Create directory
await filesystem.createDirectory({
  path: '/workspace/new-dir',
});

// Search files
const jsFiles = await filesystem.searchFiles({
  path: '/workspace',
  pattern: '**/*.js',
});
```

---

## 🌐 Web Tools

### AI-Powered Web Search

```javascript
// Web search with AI-generated answer
const result = await web.search({
  query: 'What are the latest features in React 19?',
});

// Returns:
// {
//   answer: 'AI-generated answer with citations...',
//   sources: [...]
// }
```

### HTTP Requests (via bash)

```bash
# GET request
curl -s https://api.github.com/repos/Hack23/riksdagsmonitor | jq .

# POST request
curl -s -X POST https://api.example.com/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'

# With authentication
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/data
```

---

## 💻 Bash Tools

### Execute Commands

```javascript
// Synchronous
const result = await bash({
  command: 'npm test',
  mode: 'sync',
  initial_wait: 60,
});

// Async
await bash({
  command: 'npm run build',
  mode: 'async',
  shellId: 'build-session',
});

// Read output
await read_bash({
  shellId: 'build-session',
  delay: 30,
});

// Detached (persistent)
await bash({
  command: 'npm run dev',
  mode: 'async',
  detach: true,
});
```

### Common Patterns

```bash
# Code analysis
eslint src/ --format json > report.json
npm audit --json > audit.json

# Git operations
git --no-pager status
git --no-pager diff
git add . && git commit -m "feat: New feature"

# Build and test
npm ci
npm run lint
npm test
npm run build
```

---

## 🌐 Playwright Tools

### Browser Navigation

```javascript
// Navigate
await playwright.browserNavigate({
  url: 'https://riksdagsmonitor.pages.dev',
});

// Capture accessibility snapshot
const snapshot = await playwright.browserSnapshot();
```

### Page Interaction

```javascript
// Click element
await playwright.browserClick({
  ref: '[2]',
  element: 'Button',
});

// Type text
await playwright.browserType({
  ref: '[5]',
  element: 'Search input',
  text: 'query',
  submit: true,
});

// Fill form
await playwright.browserFillForm({
  fields: [
    { ref: '[10]', name: 'username', type: 'textbox', value: 'user' },
    { ref: '[11]', name: 'password', type: 'textbox', value: 'pass' },
  ],
});
```

### Screenshots

```javascript
// Full page screenshot
await playwright.browserTakeScreenshot({
  filename: 'page.png',
  fullPage: true,
});

// Element screenshot
await playwright.browserTakeScreenshot({
  ref: '[4]',
  element: 'Article',
  filename: 'article.png',
});
```

---

## 🧠 Memory Tools

### Knowledge Graph

```javascript
// Create entities
await memory.createEntities({
  entities: [
    {
      name: 'Riksdagsmonitor',
      entityType: 'project',
      observations: ['Static website', 'GitHub Pages'],
    },
  ],
});

// Create relationships
await memory.createRelations({
  relations: [
    {
      from: 'Riksdagsmonitor',
      to: 'GitHub Pages',
      relationType: 'uses',
    },
  ],
});

// Search knowledge
const results = await memory.searchNodes({
  query: 'Swedish Parliament',
});

// Read graph
const graph = await memory.readGraph();
```

---

## 🔧 Custom Tool Development

### Create MCP Server

```javascript
// custom-mcp-server.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

class CustomMCPServer {
  constructor() {
    this.server = new Server({
      name: 'custom-tools',
      version: '1.0.0',
    }, {
      capabilities: { tools: {} },
    });
    
    this.setupTools();
  }
  
  setupTools() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'analyze_code',
          description: 'Analyze code quality',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
            },
            required: ['path'],
          },
        },
      ],
    }));
    
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'analyze_code') {
        return this.analyzeCode(args);
      }
      
      throw new Error(`Unknown tool: ${name}`);
    });
  }
  
  async analyzeCode(args) {
    // Implementation
    return {
      content: [
        { type: 'text', text: 'Analysis results...' },
      ],
    };
  }
  
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new CustomMCPServer();
server.start();
```

### Register in Configuration

```json
{
  "mcpServers": {
    "custom-tools": {
      "type": "local",
      "command": "node",
      "args": ["custom-mcp-server.js"],
      "tools": ["*"]
    }
  }
}
```

---

## 🔒 Security Considerations

### Input Validation

```javascript
// Validate tool inputs
function validateInput(tool, args) {
  const Ajv = require('ajv');
  const ajv = new Ajv();
  
  const schema = getToolSchema(tool);
  const validate = ajv.compile(schema);
  
  if (!validate(args)) {
    throw new Error('Invalid input');
  }
}

// Sanitize paths
function sanitizePath(path) {
  if (path.includes('..')) {
    throw new Error('Path traversal not allowed');
  }
  return path;
}
```

### Rate Limiting

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  checkLimit(toolName) {
    const now = Date.now();
    const requests = this.requests.get(toolName) || [];
    
    const validRequests = requests.filter(
      time => now - time < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    validRequests.push(now);
    this.requests.set(toolName, validRequests);
  }
}
```

### Audit Logging

```javascript
class ToolAuditLogger {
  log(tool, args, result, error = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      tool,
      args: this.sanitizeArgs(args),
      result: error ? null : result,
      error: error ? error.message : null,
    };
    
    console.log(JSON.stringify(entry));
  }
  
  sanitizeArgs(args) {
    const sanitized = { ...args };
    
    for (const key in sanitized) {
      if (key.toLowerCase().includes('token')) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
```

---

## 🔗 Integration Patterns

### Sequential Chain

```javascript
async function sequentialChain(steps) {
  const results = [];
  
  for (const step of steps) {
    const result = await invokeTool(step.tool, step.args);
    results.push(result);
  }
  
  return results;
}
```

### Parallel Execution

```javascript
async function parallelExecution(tasks) {
  const promises = tasks.map(task =>
    invokeTool(task.tool, task.args)
  );
  
  return await Promise.all(promises);
}
```

### Conditional Execution

```javascript
async function conditionalExecution(condition, ifTrue, ifFalse) {
  const result = await invokeTool(condition.tool, condition.args);
  
  if (evaluateCondition(result, condition.predicate)) {
    return await invokeTool(ifTrue.tool, ifTrue.args);
  } else if (ifFalse) {
    return await invokeTool(ifFalse.tool, ifFalse.args);
  }
  
  return null;
}
```

### Error Handling

```javascript
async function retryTool(tool, args, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await invokeTool(tool, args);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 📊 Tool Capabilities Matrix

| Tool | Read | Write | Search | Execute | Browser |
|------|------|-------|--------|---------|---------|
| GitHub Issues | ✅ | ✅ | ✅ | ❌ | ❌ |
| GitHub PRs | ✅ | ✅ | ✅ | ✅ | ❌ |
| File System | ✅ | ✅ | ✅ | ❌ | ❌ |
| Bash | ✅ | ✅ | ❌ | ✅ | ❌ |
| Web | ✅ | ❌ | ✅ | ❌ | ❌ |
| Playwright | ✅ | ✅ | ❌ | ✅ | ✅ |
| Memory | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🎓 Related Skills

- **gh-aw-security-architecture**: Tool security
- **gh-aw-mcp-configuration**: Custom tools
- **gh-aw-continuous-ai-patterns**: Tool orchestration

---

## 📚 References

- [GitHub REST API](https://docs.github.com/en/rest)
- [Playwright Docs](https://playwright.dev/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)

---

## ✅ Remember

- [ ] Understand all available tools
- [ ] Choose the right tool for each task
- [ ] Validate tool inputs
- [ ] Sanitize paths and commands
- [ ] Rate limit tool invocations
- [ ] Audit log all usage
- [ ] Handle errors gracefully
- [ ] Use parallel execution when possible
- [ ] Secure sensitive parameters
- [ ] Test custom tools thoroughly
- [ ] Monitor tool performance
- [ ] Keep tools up to date

---

**Last Updated**: 2026-02-17  
**Version**: 1.0.0  
**License**: Apache-2.0
