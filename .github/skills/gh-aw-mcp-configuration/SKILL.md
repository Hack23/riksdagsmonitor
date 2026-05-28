---
name: GitHub Agentic Workflows MCP Configuration
description: Comprehensive guide for MCP (Model Context Protocol) server setup, transport protocols, configuration validation, lifecycle management, tool discovery, and error handling patterns
license: Apache-2.0
version: 2.0.1
last_updated: 2026-04-13
tags:
  - github-agentic-workflows
  - mcp
  - model-context-protocol
  - server-configuration
  - transport-protocols
  - tool-discovery
  - lifecycle-management
  - error-handling
  - stdio
  - http
  - sse
---

# 🔌 GitHub Agentic Workflows MCP Configuration


## 🔴 AI FIRST Quality Principle

> **Apply the AI FIRST principle: never accept first-pass quality. Minimum 2 iterations. Read all output, improve every section. No shortcuts.**

## 📋 Overview

This skill provides comprehensive guidance for configuring Model Context Protocol (MCP) servers in GitHub Agentic Workflows. MCP enables AI agents to interact with external tools and data sources through a standardized protocol. Understanding MCP configuration is essential for building powerful, extensible agentic workflows.

### What is Model Context Protocol (MCP)?

**Model Context Protocol (MCP)** is a standardized protocol for connecting AI models to external tools, data sources, and services:

- **Standardized Interface**: Consistent API for tool registration, discovery, and invocation
- **Multiple Transports**: Support for stdio, HTTP, and Server-Sent Events (SSE)
- **Tool Discovery**: Dynamic tool registration and capability discovery
- **Type Safety**: JSON Schema validation for tool inputs and outputs
- **Lifecycle Management**: Server startup, health checks, graceful shutdown
- **Error Handling**: Structured error responses and retry mechanisms

### Why Use MCP Servers?

MCP servers provide several benefits for agentic workflows:

- ✅ **Extensibility**: Add new tools without modifying agent code
- ✅ **Reusability**: Share MCP servers across multiple agents and projects
- ✅ **Isolation**: Run tools in separate processes for security and stability
- ✅ **Standardization**: Use community-maintained MCP servers
- ✅ **Polyglot**: Write servers in any language (Node.js, Python, Go, Rust)
- ✅ **Discoverability**: Agents automatically discover available tools

---

## 🏗️ MCP Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Copilot Agent                     │
│                  (AI Model + Orchestration)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ Tool Calls
                       │ (JSON-RPC 2.0)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     MCP Client Runtime                      │
│              (Tool Discovery & Invocation)                  │
└─┬──────────────────┬──────────────────┬────────────────────┘
  │ stdio            │ HTTP             │ SSE
  ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Filesystem   │  │  GitHub API  │  │   Database   │
│ MCP Server   │  │  MCP Server  │  │  MCP Server  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Configuration File Structure

MCP servers are configured in `.github/copilot-mcp.json`:

```json
{
  "$schema": "https://github.com/modelcontextprotocol/schema/v1",
  "mcpServers": {
    "server-name": {
      "type": "local",
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      },
      "tools": ["*"]
    }
  }
}
```

---

## 🚀 MCP Server Setup Patterns

### Pattern 1: Local stdio Server

**Use case**: File system operations, git commands, local tools.

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "local",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/runner/work/myrepo/myrepo"
      ],
      "env": {},
      "tools": ["*"]
    }
  }
}
```

**Implementation** (Node.js):

```javascript
// filesystem-mcp-server.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';
import path from 'path';

class FileSystemMCPServer {
  constructor(rootPath) {
    this.rootPath = path.resolve(rootPath);
    this.server = new Server({
      name: 'filesystem',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });
    
    this.setupTools();
  }
  
  setupTools() {
    // Register read_file tool
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'read_file',
          description: 'Read contents of a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path relative to root',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_file',
          description: 'Write contents to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'list_directory',
          description: 'List files in a directory',
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
    
    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'read_file':
          return this.readFile(args.path);
        case 'write_file':
          return this.writeFile(args.path, args.content);
        case 'list_directory':
          return this.listDirectory(args.path);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }
  
  validatePath(filePath) {
    const resolved = path.resolve(this.rootPath, filePath);
    if (!resolved.startsWith(this.rootPath)) {
      throw new Error('Path outside root directory');
    }
    return resolved;
  }
  
  async readFile(filePath) {
    const validated = this.validatePath(filePath);
    const content = await fs.readFile(validated, 'utf8');
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }
  
  async writeFile(filePath, content) {
    const validated = this.validatePath(filePath);
    await fs.writeFile(validated, content, 'utf8');
    return {
      content: [
        {
          type: 'text',
          text: `File written successfully: ${filePath}`,
        },
      ],
    };
  }
  
  async listDirectory(dirPath) {
    const validated = this.validatePath(dirPath);
    const entries = await fs.readdir(validated, { withFileTypes: true });
    
    const files = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(files, null, 2),
        },
      ],
    };
  }
  
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Filesystem MCP server started');
  }
}

// Start server
const rootPath = process.argv[2] || process.cwd();
const server = new FileSystemMCPServer(rootPath);
server.start().catch(console.error);
```

**Usage**:

```bash
# Start server
npx -y @modelcontextprotocol/server-filesystem /workspace

# Server communicates via stdin/stdout
# Input (JSON-RPC request):
{"jsonrpc":"2.0","id":1,"method":"tools/list"}

# Output (JSON-RPC response):
{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}
```

### Pattern 2: HTTP Server

**Use case**: Remote services, APIs, databases.

```json
{
  "mcpServers": {
    "github-api": {
      "type": "http",
      "url": "https://mcp.github.com/v1",
      "headers": {
        "Authorization": "Bearer ${{ secrets.GITHUB_TOKEN }}"
      },
      "tools": ["*"]
    }
  }
}
```

**Implementation** (Node.js with Express):

```javascript
// github-api-mcp-server.js
import express from 'express';
import { Octokit } from '@octokit/rest';

const app = express();
app.use(express.json());

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// MCP endpoint: List tools
app.post('/mcp/tools/list', async (req, res) => {
  res.json({
    tools: [
      {
        name: 'github_create_issue',
        description: 'Create a GitHub issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
          },
          required: ['owner', 'repo', 'title'],
        },
      },
      {
        name: 'github_list_issues',
        description: 'List GitHub issues',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            state: { type: 'string', enum: ['open', 'closed', 'all'] },
          },
          required: ['owner', 'repo'],
        },
      },
    ],
  });
});

// MCP endpoint: Call tool
app.post('/mcp/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body;
  
  try {
    switch (name) {
      case 'github_create_issue': {
        const { data } = await octokit.issues.create({
          owner: args.owner,
          repo: args.repo,
          title: args.title,
          body: args.body,
        });
        
        res.json({
          content: [
            {
              type: 'text',
              text: `Issue created: ${data.html_url}`,
            },
          ],
        });
        break;
      }
      
      case 'github_list_issues': {
        const { data } = await octokit.issues.listForRepo({
          owner: args.owner,
          repo: args.repo,
          state: args.state || 'open',
        });
        
        res.json({
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        });
        break;
      }
      
      default:
        res.status(404).json({ error: 'Tool not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GitHub API MCP server listening on port ${PORT}`);
});
```

### Pattern 3: Server-Sent Events (SSE)

**Use case**: Real-time updates, streaming data, webhooks.

```json
{
  "mcpServers": {
    "realtime-monitor": {
      "type": "sse",
      "url": "https://monitor.example.com/events",
      "headers": {
        "Authorization": "Bearer ${{ secrets.API_TOKEN }}"
      },
      "tools": ["*"]
    }
  }
}
```

**Implementation** (Node.js with SSE):

```javascript
// realtime-monitor-mcp-server.js
import express from 'express';

const app = express();

const clients = new Set();

// SSE endpoint
app.get('/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Add client
  clients.add(res);
  
  // Send initial connection event
  res.write(`event: connected\ndata: {"status":"connected"}\n\n`);
  
  // Remove client on disconnect
  req.on('close', () => {
    clients.delete(res);
  });
});

// Function to broadcast events to all clients
function broadcastEvent(eventType, data) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  
  for (const client of clients) {
    client.write(message);
  }
}

// Tool: Subscribe to repository events
app.post('/mcp/tools/call', express.json(), (req, res) => {
  const { name, arguments: args } = req.body;
  
  if (name === 'subscribe_repo_events') {
    // Simulate subscription
    const subscription = {
      repo: args.repo,
      events: args.events,
    };
    
    // Broadcast to SSE clients
    broadcastEvent('tool_result', {
      name: 'subscribe_repo_events',
      result: `Subscribed to ${args.repo}`,
    });
    
    res.json({
      content: [
        {
          type: 'text',
          text: `Subscribed to events for ${args.repo}`,
        },
      ],
    });
  } else {
    res.status(404).json({ error: 'Tool not found' });
  }
});

// Simulate events (for demo)
setInterval(() => {
  broadcastEvent('repo_event', {
    type: 'push',
    repo: 'owner/repo',
    timestamp: new Date().toISOString(),
  });
}, 5000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Realtime monitor MCP server on port ${PORT}`);
});
```

---

## 🔌 Transport Protocols

### stdio Transport

**Characteristics**:
- Process-to-process communication via stdin/stdout
- Lowest latency
- Best for local tools
- Automatic lifecycle management

**Advantages**:
- ✅ Simple to implement
- ✅ No network overhead
- ✅ Automatic process cleanup
- ✅ Secure (no network exposure)

**Disadvantages**:
- ❌ Single client per server instance
- ❌ No remote access
- ❌ Requires process spawning

**Configuration**:

```json
{
  "mcpServers": {
    "local-tool": {
      "type": "local",
      "command": "node",
      "args": ["server.js"],
      "env": {
        "NODE_ENV": "production"
      },
      "tools": ["*"]
    }
  }
}
```

### HTTP Transport

**Characteristics**:
- RESTful JSON-RPC over HTTP/HTTPS
- Stateless request/response
- Can be load balanced
- Supports authentication

**Advantages**:
- ✅ Remote server support
- ✅ Multiple concurrent clients
- ✅ Standard HTTP infrastructure
- ✅ Load balancing and scaling

**Disadvantages**:
- ❌ Higher latency
- ❌ Requires authentication
- ❌ Network security considerations

**Configuration**:

```json
{
  "mcpServers": {
    "remote-api": {
      "type": "http",
      "url": "https://api.example.com/mcp/v1",
      "headers": {
        "Authorization": "Bearer ${MCP_API_TOKEN}",
        "X-API-Version": "1.0"
      },
      "timeout": 30000,
      "retries": 3,
      "tools": ["*"]
    }
  }
}
```

### Server-Sent Events (SSE) Transport

**Characteristics**:
- One-way server-to-client streaming
- Real-time event notifications
- Automatic reconnection
- HTTP-based

**Advantages**:
- ✅ Real-time updates
- ✅ Efficient for event streams
- ✅ Automatic reconnection
- ✅ Works through firewalls

**Disadvantages**:
- ❌ One-way only (server → client)
- ❌ Requires persistent connection
- ❌ Browser compatibility (not relevant for agents)

**Configuration**:

```json
{
  "mcpServers": {
    "event-stream": {
      "type": "sse",
      "url": "https://events.example.com/stream",
      "headers": {
        "Authorization": "Bearer ${EVENT_TOKEN}"
      },
      "reconnect": true,
      "reconnectDelay": 5000,
      "tools": ["*"]
    }
  }
}
```

---

## ✅ Configuration Validation

### Schema Validation

```javascript
// validate-mcp-config.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const mcpConfigSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    mcpServers: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9_-]+$': {
          oneOf: [
            {
              // Local stdio server
              type: 'object',
              properties: {
                type: { const: 'local' },
                command: { type: 'string', minLength: 1 },
                args: { type: 'array', items: { type: 'string' } },
                env: {
                  type: 'object',
                  patternProperties: {
                    '^[A-Z_][A-Z0-9_]*$': { type: 'string' },
                  },
                },
                tools: {
                  oneOf: [
                    { type: 'array', items: { type: 'string' } },
                    { type: 'array', items: { const: '*' }, maxItems: 1 },
                  ],
                },
              },
              required: ['type', 'command'],
              additionalProperties: false,
            },
            {
              // HTTP server
              type: 'object',
              properties: {
                type: { const: 'http' },
                url: { type: 'string', format: 'uri' },
                headers: {
                  type: 'object',
                  patternProperties: {
                    '^[A-Za-z0-9-]+$': { type: 'string' },
                  },
                },
                timeout: { type: 'integer', minimum: 1000 },
                retries: { type: 'integer', minimum: 0 },
                tools: {
                  oneOf: [
                    { type: 'array', items: { type: 'string' } },
                    { type: 'array', items: { const: '*' }, maxItems: 1 },
                  ],
                },
              },
              required: ['type', 'url'],
              additionalProperties: false,
            },
            {
              // SSE server
              type: 'object',
              properties: {
                type: { const: 'sse' },
                url: { type: 'string', format: 'uri' },
                headers: {
                  type: 'object',
                  patternProperties: {
                    '^[A-Za-z0-9-]+$': { type: 'string' },
                  },
                },
                reconnect: { type: 'boolean' },
                reconnectDelay: { type: 'integer', minimum: 100 },
                tools: {
                  oneOf: [
                    { type: 'array', items: { type: 'string' } },
                    { type: 'array', items: { const: '*' }, maxItems: 1 },
                  ],
                },
              },
              required: ['type', 'url'],
              additionalProperties: false,
            },
          ],
        },
      },
    },
  },
  required: ['mcpServers'],
  additionalProperties: false,
};

const validate = ajv.compile(mcpConfigSchema);

export function validateMCPConfig(config) {
  const valid = validate(config);
  
  if (!valid) {
    const errors = validate.errors.map(err => ({
      path: err.instancePath,
      message: err.message,
      params: err.params,
    }));
    
    throw new Error(
      `MCP configuration validation failed:\n${JSON.stringify(errors, null, 2)}`
    );
  }
  
  return true;
}

// Usage
import fs from 'fs';

const config = JSON.parse(
  fs.readFileSync('.github/copilot-mcp.json', 'utf8')
);

try {
  validateMCPConfig(config);
  console.log('✅ MCP configuration is valid');
} catch (error) {
  console.error('❌ Validation error:', error.message);
  process.exit(1);
}
```

### Runtime Validation

```javascript
// runtime-validator.js
class MCPConfigValidator {
  constructor(config) {
    this.config = config;
  }
  
  async validateAll() {
    const errors = [];
    
    for (const [name, server] of Object.entries(this.config.mcpServers)) {
      try {
        await this.validateServer(name, server);
      } catch (error) {
        errors.push({
          server: name,
          error: error.message,
        });
      }
    }
    
    if (errors.length > 0) {
      throw new Error(
        `MCP server validation failed:\n${JSON.stringify(errors, null, 2)}`
      );
    }
    
    return true;
  }
  
  async validateServer(name, server) {
    switch (server.type) {
      case 'local':
        await this.validateLocalServer(name, server);
        break;
      case 'http':
        await this.validateHTTPServer(name, server);
        break;
      case 'sse':
        await this.validateSSEServer(name, server);
        break;
      default:
        throw new Error(`Unknown server type: ${server.type}`);
    }
  }
  
  async validateLocalServer(name, server) {
    // Check if command exists
    const { execSync } = require('child_process');
    
    try {
      execSync(`command -v ${server.command}`, { stdio: 'ignore' });
    } catch (error) {
      throw new Error(`Command not found: ${server.command}`);
    }
    
    // Validate environment variables
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        if (value.includes('${') && value.includes('}')) {
          const envVar = value.match(/\$\{([^}]+)\}/)[1];
          if (!process.env[envVar]) {
            throw new Error(`Environment variable not set: ${envVar}`);
          }
        }
      }
    }
  }
  
  async validateHTTPServer(name, server) {
    // Health check
    try {
      const response = await fetch(`${server.url}/health`, {
        headers: server.headers || {},
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Cannot connect to HTTP server: ${error.message}`);
    }
  }
  
  async validateSSEServer(name, server) {
    // Test SSE connection
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(server.url, {
        headers: server.headers || {},
      });
      
      const timeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('SSE connection timeout'));
      }, 5000);
      
      eventSource.addEventListener('connected', () => {
        clearTimeout(timeout);
        eventSource.close();
        resolve();
      });
      
      eventSource.onerror = (error) => {
        clearTimeout(timeout);
        eventSource.close();
        reject(new Error(`SSE connection error: ${error.message}`));
      };
    });
  }
}

// Usage
const validator = new MCPConfigValidator(config);
await validator.validateAll();
```

---

## 🔄 Server Lifecycle Management

### Startup Sequence

```javascript
// mcp-lifecycle-manager.js
class MCPLifecycleManager {
  constructor(config) {
    this.config = config;
    this.servers = new Map();
    this.health = new Map();
  }
  
  async startAll() {
    console.log('🚀 Starting MCP servers...');
    
    const promises = Object.entries(this.config.mcpServers).map(
      async ([name, server]) => {
        try {
          await this.startServer(name, server);
          console.log(`✅ Started: ${name}`);
        } catch (error) {
          console.error(`❌ Failed to start ${name}:`, error.message);
          throw error;
        }
      }
    );
    
    await Promise.all(promises);
    console.log('✅ All MCP servers started');
  }
  
  async startServer(name, config) {
    switch (config.type) {
      case 'local':
        return this.startLocalServer(name, config);
      case 'http':
        return this.startHTTPClient(name, config);
      case 'sse':
        return this.startSSEClient(name, config);
      default:
        throw new Error(`Unknown server type: ${config.type}`);
    }
  }
  
  async startLocalServer(name, config) {
    const { spawn } = require('child_process');
    
    // Spawn process
    const process = spawn(config.command, config.args || [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...config.env },
    });
    
    // Wait for server to be ready
    await this.waitForReady(process);
    
    this.servers.set(name, { type: 'local', process });
    this.health.set(name, 'healthy');
    
    // Monitor health
    this.monitorHealth(name, process);
  }
  
  async waitForReady(process, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, timeout);
      
      process.stderr.once('data', (data) => {
        const message = data.toString();
        if (message.includes('started') || message.includes('listening')) {
          clearTimeout(timer);
          resolve();
        }
      });
      
      process.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      
      process.once('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`Process exited with code ${code}`));
      });
    });
  }
  
  monitorHealth(name, process) {
    // Monitor process health
    process.on('exit', (code) => {
      console.error(`❌ Server ${name} exited with code ${code}`);
      this.health.set(name, 'unhealthy');
      
      // Auto-restart
      if (code !== 0) {
        console.log(`🔄 Restarting ${name}...`);
        setTimeout(() => {
          this.restartServer(name);
        }, 5000);
      }
    });
    
    process.on('error', (error) => {
      console.error(`❌ Server ${name} error:`, error.message);
      this.health.set(name, 'unhealthy');
    });
    
    // Periodic health check
    setInterval(async () => {
      const healthy = await this.checkHealth(name);
      this.health.set(name, healthy ? 'healthy' : 'unhealthy');
    }, 30000); // Every 30 seconds
  }
  
  async checkHealth(name) {
    const server = this.servers.get(name);
    if (!server) return false;
    
    switch (server.type) {
      case 'local':
        // Check if process is running
        return !server.process.killed;
      
      case 'http':
        // HTTP health check
        try {
          const response = await fetch(`${server.url}/health`, {
            signal: AbortSignal.timeout(5000),
          });
          return response.ok;
        } catch (error) {
          return false;
        }
      
      case 'sse':
        // Check SSE connection
        return server.connected;
      
      default:
        return false;
    }
  }
  
  async restartServer(name) {
    const config = this.config.mcpServers[name];
    
    // Stop existing server
    await this.stopServer(name);
    
    // Start new instance
    await this.startServer(name, config);
  }
  
  async stopServer(name) {
    const server = this.servers.get(name);
    if (!server) return;
    
    switch (server.type) {
      case 'local':
        server.process.kill('SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            server.process.kill('SIGKILL');
            resolve();
          }, 5000);
          
          server.process.once('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
        break;
      
      case 'http':
      case 'sse':
        // Close connections
        if (server.connection) {
          server.connection.close();
        }
        break;
    }
    
    this.servers.delete(name);
    this.health.delete(name);
  }
  
  async stopAll() {
    console.log('🛑 Stopping MCP servers...');
    
    const promises = Array.from(this.servers.keys()).map(
      async (name) => {
        try {
          await this.stopServer(name);
          console.log(`✅ Stopped: ${name}`);
        } catch (error) {
          console.error(`❌ Failed to stop ${name}:`, error.message);
        }
      }
    );
    
    await Promise.all(promises);
    console.log('✅ All MCP servers stopped');
  }
  
  getHealthStatus() {
    const status = {};
    for (const [name, health] of this.health) {
      status[name] = health;
    }
    return status;
  }
}

// Usage
const manager = new MCPLifecycleManager(config);

// Start all servers
await manager.startAll();

// Check health
console.log('Health status:', manager.getHealthStatus());

// Graceful shutdown
process.on('SIGTERM', async () => {
  await manager.stopAll();
  process.exit(0);
});
```

---

## 🔍 Tool Discovery and Registration

### Dynamic Tool Discovery

```javascript
// tool-discovery.js
class MCPToolDiscovery {
  constructor(servers) {
    this.servers = servers;
    this.tools = new Map();
  }
  
  async discoverAll() {
    console.log('🔍 Discovering MCP tools...');
    
    for (const [serverName, server] of this.servers) {
      try {
        const tools = await this.discoverTools(serverName, server);
        
        for (const tool of tools) {
          this.registerTool(serverName, tool);
        }
        
        console.log(`✅ Discovered ${tools.length} tools from ${serverName}`);
      } catch (error) {
        console.error(`❌ Failed to discover tools from ${serverName}:`, error.message);
      }
    }
    
    console.log(`✅ Total tools discovered: ${this.tools.size}`);
  }
  
  async discoverTools(serverName, server) {
    switch (server.type) {
      case 'local':
        return this.discoverLocalTools(server);
      case 'http':
        return this.discoverHTTPTools(server);
      case 'sse':
        return this.discoverSSETools(server);
      default:
        throw new Error(`Unknown server type: ${server.type}`);
    }
  }
  
  async discoverLocalTools(server) {
    // Send tools/list request via stdio
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      };
      
      server.process.stdin.write(JSON.stringify(request) + '\n');
      
      server.process.stdout.once('data', (data) => {
        const response = JSON.parse(data.toString());
        
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result.tools);
        }
      });
      
      setTimeout(() => {
        reject(new Error('Tool discovery timeout'));
      }, 5000);
    });
  }
  
  async discoverHTTPTools(server) {
    const response = await fetch(`${server.url}/tools/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...server.headers,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      }),
    });
    
    const result = await response.json();
    return result.result.tools;
  }
  
  registerTool(serverName, tool) {
    const fullName = `${serverName}.${tool.name}`;
    
    this.tools.set(fullName, {
      server: serverName,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    });
  }
  
  getTool(fullName) {
    return this.tools.get(fullName);
  }
  
  listTools(filter = null) {
    const toolList = Array.from(this.tools.values());
    
    if (filter) {
      return toolList.filter(tool => 
        tool.name.includes(filter) || 
        tool.description.includes(filter)
      );
    }
    
    return toolList;
  }
  
  async invokeTool(fullName, args) {
    const tool = this.getTool(fullName);
    if (!tool) {
      throw new Error(`Tool not found: ${fullName}`);
    }
    
    // Validate input
    this.validateInput(tool.inputSchema, args);
    
    // Get server
    const server = this.servers.get(tool.server);
    
    // Invoke tool
    return this.invokeToolOnServer(server, tool.name, args);
  }
  
  validateInput(schema, input) {
    const Ajv = require('ajv');
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    
    if (!validate(input)) {
      throw new Error(
        `Invalid tool input: ${JSON.stringify(validate.errors)}`
      );
    }
  }
  
  async invokeToolOnServer(server, toolName, args) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };
    
    switch (server.type) {
      case 'local': {
        return new Promise((resolve, reject) => {
          server.process.stdin.write(JSON.stringify(request) + '\n');
          
          server.process.stdout.once('data', (data) => {
            const response = JSON.parse(data.toString());
            
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          });
          
          setTimeout(() => {
            reject(new Error('Tool invocation timeout'));
          }, 30000);
        });
      }
      
      case 'http': {
        const response = await fetch(`${server.url}/tools/call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...server.headers,
          },
          body: JSON.stringify(request),
        });
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        return result.result;
      }
      
      default:
        throw new Error(`Unsupported server type: ${server.type}`);
    }
  }
}

// Usage
const discovery = new MCPToolDiscovery(manager.servers);

// Discover all tools
await discovery.discoverAll();

// List tools
console.log('Available tools:', discovery.listTools());

// Invoke tool
const result = await discovery.invokeTool('filesystem.read_file', {
  path: 'src/index.js',
});

console.log('Tool result:', result);
```

---

## ⚠️ Error Handling Patterns

### Retry with Exponential Backoff

```javascript
// retry-handler.js
class RetryHandler {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }
  
  async execute(fn, context = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (this.isNonRetryable(error)) {
          throw error;
        }
        
        if (attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.warn(
            `Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(
      `Max retries (${this.maxRetries}) exceeded. Last error: ${lastError.message}`
    );
  }
  
  isNonRetryable(error) {
    // Don't retry validation errors, auth errors, etc.
    return (
      error.message.includes('validation') ||
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden') ||
      error.message.includes('not found')
    );
  }
  
  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * this.baseDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30s
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const retry = new RetryHandler();

const result = await retry.execute(async () => {
  return await discovery.invokeTool('github.create_issue', {
    owner: 'user',
    repo: 'repo',
    title: 'Bug report',
  });
});
```

### Circuit Breaker

```javascript
// circuit-breaker.js
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000, resetTimeout = 300000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        // Try half-open state
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  async executeWithTimeout(fn) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), this.timeout)
      ),
    ]);
  }
  
  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      console.log('Circuit breaker entering CLOSED state');
      this.state = 'CLOSED';
    }
  }
  
  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      console.error('🔴 Circuit breaker tripped - entering OPEN state');
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailureTime,
    };
  }
}

// Usage
const breaker = new CircuitBreaker();

try {
  const result = await breaker.execute(async () => {
    return await fetch('https://api.example.com/data');
  });
} catch (error) {
  console.error('Request failed:', error.message);
  console.log('Circuit breaker state:', breaker.getState());
}
```

### Graceful Degradation

```javascript
// graceful-degradation.js
class GracefulDegradation {
  constructor(primaryFn, fallbackFn) {
    this.primaryFn = primaryFn;
    this.fallbackFn = fallbackFn;
    this.primaryFailures = 0;
    this.useFallback = false;
  }
  
  async execute(...args) {
    if (this.useFallback) {
      return this.executeFallback(...args);
    }
    
    try {
      const result = await this.primaryFn(...args);
      this.primaryFailures = 0;
      return result;
    } catch (error) {
      this.primaryFailures++;
      
      console.warn(
        `Primary function failed (${this.primaryFailures} times): ${error.message}`
      );
      
      if (this.primaryFailures >= 3) {
        console.warn('Switching to fallback function');
        this.useFallback = true;
      }
      
      return this.executeFallback(...args);
    }
  }
  
  async executeFallback(...args) {
    try {
      return await this.fallbackFn(...args);
    } catch (error) {
      throw new Error(
        `Both primary and fallback functions failed: ${error.message}`
      );
    }
  }
  
  reset() {
    this.primaryFailures = 0;
    this.useFallback = false;
  }
}

// Usage
const toolInvoker = new GracefulDegradation(
  // Primary: Use MCP server
  async (toolName, args) => {
    return await discovery.invokeTool(toolName, args);
  },
  // Fallback: Use direct API
  async (toolName, args) => {
    console.warn('Using fallback implementation');
    return await directAPICall(toolName, args);
  }
);

const result = await toolInvoker.execute('github.create_issue', {
  owner: 'user',
  repo: 'repo',
  title: 'Bug',
});
```

---

## 🔐 Security Considerations

### Authentication

```json
{
  "mcpServers": {
    "secure-api": {
      "type": "http",
      "url": "https://api.example.com/mcp/v1",
      "headers": {
        "Authorization": "Bearer ${MCP_API_TOKEN}",
        "X-API-Key": "${API_KEY}"
      },
      "tools": ["*"]
    }
  }
}
```

### TLS/SSL

```javascript
// tls-config.js
import https from 'https';
import fs from 'fs';

const tlsOptions = {
  ca: fs.readFileSync('ca-cert.pem'),
  cert: fs.readFileSync('client-cert.pem'),
  key: fs.readFileSync('client-key.pem'),
  rejectUnauthorized: true,
  minVersion: 'TLSv1.3',
};

const agent = new https.Agent(tlsOptions);

// Use with fetch
const response = await fetch('https://secure-mcp.example.com', {
  agent,
});
```

### Input Validation

```javascript
// Always validate tool inputs
function validateToolInput(schema, input) {
  const Ajv = require('ajv');
  const ajv = new Ajv({ allErrors: true });
  
  const validate = ajv.compile(schema);
  
  if (!validate(input)) {
    const errors = validate.errors.map(err => ({
      path: err.instancePath,
      message: err.message,
    }));
    
    throw new Error(
      `Invalid tool input:\n${JSON.stringify(errors, null, 2)}`
    );
  }
}
```

---

## 🎓 Related Skills

- **gh-aw-security-architecture**: Security for MCP servers
- **gh-aw-tools-ecosystem**: Available MCP tools
- **gh-aw-safe-outputs**: Output sanitization
- **github-actions-workflows**: CI/CD integration

---

## 🆕 MCP in Agentic Workflows (v0.68.1)

MCP servers extend agent capabilities through standardized tool interfaces. In gh-aw, the MCP Gateway runs inside the agent container, routing requests to Docker-hosted MCP servers.

Key patterns:
- **stdio transport** — Local MCP servers communicating via stdin/stdout
- **HTTP transport** — Remote MCP servers (e.g., `https://api.githubcopilot.com/mcp/insiders`)
- **SSE transport** — Server-sent events for streaming responses

Configure via a top-level `mcp-servers` key in workflow frontmatter (repo-level definitions go in `.github/copilot-mcp.json`):

```markdown
---
mcp-servers:
  github-mcp:
    url: https://api.githubcopilot.com/mcp/insiders
  custom:
    command: npx
    args: ["-y", "@my/mcp-server"]
tools:
  github:
    toolsets: [issues]
---
```

## 🔍 MCP Server Inspection (v0.68.1)

Use the `gh aw mcp inspect` command to analyze and debug MCP servers configured in agentic workflows:

### Inspection Commands

```bash
# List all workflows with MCP configurations
gh aw mcp inspect

# Inspect MCP servers in a specific workflow
gh aw mcp inspect news-propositions

# Filter to a specific MCP server
gh aw mcp inspect news-propositions --server riksdag-regering

# Show detailed information about a specific tool (requires --server)
gh aw mcp inspect news-propositions --server riksdag-regering --tool search_dokument
```

### What `--tool` Flag Provides

The `--tool` flag provides detailed information about a specific tool, including:
- **Tool name, title, and description**
- **Input schema and parameters** (JSON Schema)
- **Whether the tool is allowed** in the workflow configuration
- **Annotations and additional metadata**

**Note**: The `--tool` flag requires the `--server` flag to specify which MCP server contains the tool.

### riksdagsmonitor MCP Server Configuration

All agentic workflows in this repository configure 3 custom MCP servers:

```yaml
mcp-servers:
  riksdag-regering:
    url: https://riksdag-regering-ai.onrender.com/mcp
    allowed: ["*"]
  scb:
    container: "node:26-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
    allowed: ["*"]
  world-bank:
    container: "node:26-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "worldbank-mcp@1.0.1"]
    allowed: ["*"]
```

### Copilot Agent MCP Configuration (`.github/copilot-mcp.json`)

For Copilot coding agent sessions (not agentic workflows), MCP servers are configured in `.github/copilot-mcp.json`:

```json
{
  "mcpServers": {
    "riksdag-regering": { "type": "http", "url": "..." },
    "scb": { "type": "local", "command": "npx", "args": [...] },
    "world-bank": { "type": "local", "command": "npx", "args": [...] },
    "github": { "type": "http", "url": "https://api.githubcopilot.com/mcp/insiders" },
    "filesystem": { "type": "local", "command": "mcp-server-filesystem" },
    "memory": { "type": "local", "command": "mcp-server-memory" },
    "sequential-thinking": { "type": "local", "command": "mcp-server-sequential-thinking" },
    "playwright": { "type": "local", "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }
  }
}
```

## 📚 References

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

---

## ✅ Remember

- [ ] Validate MCP configuration with JSON Schema
- [ ] Use appropriate transport protocol (stdio/HTTP/SSE)
- [ ] Implement proper lifecycle management (startup, health, shutdown)
- [ ] Discover tools dynamically at runtime
- [ ] Validate tool inputs against schemas
- [ ] Handle errors gracefully with retries and circuit breakers
- [ ] Implement fallback mechanisms
- [ ] Secure MCP servers with authentication and TLS
- [ ] Monitor server health continuously
- [ ] Log all MCP operations for audit
- [ ] Test MCP servers in isolation before integration
- [ ] Document custom MCP servers thoroughly
- [ ] Version MCP server APIs
- [ ] Implement graceful degradation
- [ ] Use timeout for all MCP operations
- [ ] **Prefer `repo-memory:` and `cache-memory:` over `@modelcontextprotocol/server-memory`** — gh-aw native tools are persistent across runs; generic MCP memory is ephemeral per process
- [ ] **Skip `@modelcontextprotocol/server-sequential-thinking`** — modern LLMs (Claude Opus 4.8, GPT-5) have native CoT; it wastes context tokens

---

**Last Updated**: 2026-04-02  
**Version**: 2.0.0  
**License**: Apache-2.0


---

## 🔗 Integration with Riksdagsmonitor agentic workflows

This gh-aw skill is applied by the 11 agentic news workflows in `.github/workflows/news-*.md`. Their domain contract (analysis-artifact product, gate, article contract) lives in:

- [`.github/prompts/README.md`](../../prompts/README.md) — module catalogue, import rules, AI-FIRST 2-pass rule.
- [`analysis/methodologies/ai-driven-analysis-guide.md`](../../../analysis/methodologies/ai-driven-analysis-guide.md) + [`analysis/templates/`](../../../analysis/templates/) — 9 core / 14 Tier-C artifacts.
- [`05-analysis-gate.md`](../../prompts/05-analysis-gate.md) — the single blocking gate before any article content is written.

**Upstream gh-aw docs** (v0.69.3): [abridged](https://github.github.com/gh-aw/llms-small.txt) · [complete](https://github.github.com/gh-aw/llms-full.txt) · [agentic-workflows blog series](https://github.github.com/gh-aw/_llms-txt/agentic-workflows.txt) · [source repo](https://github.com/github/gh-aw) · [GitHub CLI manual](https://cli.github.com/manual/).


---

## 🌐 IMF Integration is Intentionally Non-MCP (CLI Pattern)

> **Effective:** 2026-04-24

### Why IMF is a CLI, not an MCP server

The IMF integration in Riksdagsmonitor is delivered as a **TypeScript CLI** (`tsx scripts/imf-fetch.ts`), not as an MCP server. This is a conscious architectural decision documented here to prevent future contributors from "fixing" the omission:

1. **No upstream MCP server exists** for IMF data (as of 2026-04-24)
2. **Two endpoints to unify** — IMF Datamapper REST and IMF SDMX 3.0; CLI wraps both behind one interface
3. **Vintage discipline requires deterministic logic** — vintage labelling, supersedes-chain, SHA-256 pinning are easier to express in TypeScript than MCP tool descriptors
4. **Cache is filesystem-native** — `analysis/imf/` + `analysis/daily/*/economic-data.json` are git-tracked artefacts; MCP servers would add an indirection layer

### MCP servers in `.github/copilot-mcp.json`

| Server | Coverage |
|---|---|
| `riksdag-regering-mcp` | Swedish parliamentary primary source |
| `scb-mcp` | Swedish national statistics (PxWeb v2) |
| `worldbank-mcp` | Governance (WGI), environment, social residue **only** — never economic context (use IMF CLI) |

### Calling IMF from agentic workflows

```yaml
# In a news-*.md workflow:
tools:
  bash: true              # required for `tsx scripts/imf-fetch.ts ...`
network:
  allowed:
    - www.imf.org           # Datamapper REST
    - api.imf.org   # SDMX 3.0
```

See [`analysis/imf/agentic-integration.md`](../../../analysis/imf/agentic-integration.md) for the seven-step integration contract.
