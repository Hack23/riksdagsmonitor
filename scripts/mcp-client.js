#!/usr/bin/env node

/**
 * MCP Client for riksdag-regering-mcp Server
 * 
 * JSON-RPC 2.0 client for accessing Swedish Parliament and Government data
 * via the riksdag-regering-mcp server (32 specialized tools).
 * 
 * Server: https://riksdag-regering-ai.onrender.com/mcp
 * Protocol: JSON-RPC 2.0 (https://www.jsonrpc.org/specification)
 * Tools: 32 tools for Swedish political data (Riksdag, Regering, MPs, votes, documents)
 * 
 * MCP Protocol:
 *   - POST to /mcp endpoint (not /mcp/tools/{tool})
 *   - JSON-RPC 2.0 format with method: 'tools/call'
 *   - Tool names: 'riksdag-regering--{tool}' (e.g., 'riksdag-regering--get_calendar_events')
 * 
 * Usage:
 *   import { MCPClient } from './mcp-client.js';
 *   const client = new MCPClient();
 *   const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
 * 
 * Error Handling:
 *   - Automatic retries on network errors (max 3 attempts with exponential backoff)
 *   - Fallback from prefixed to non-prefixed tool names
 *   - Detailed error messages with troubleshooting hints
 */

const DEFAULT_MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://riksdag-regering-ai.onrender.com/mcp';
const DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// JSON-RPC 2.0 request ID counter
let jsonRpcId = 1;

/**
 * MCP Client Class
 */
export class MCPClient {
  constructor(config = {}) {
    // Support both object config and string URL for backwards compatibility
    if (typeof config === 'string') {
      this.baseURL = config;
      this.timeout = DEFAULT_REQUEST_TIMEOUT;
      this.maxRetries = DEFAULT_MAX_RETRIES;
    } else {
      this.baseURL = config.baseURL || config.serverUrl || DEFAULT_MCP_SERVER_URL;
      this.timeout = config.timeout || DEFAULT_REQUEST_TIMEOUT;
      this.maxRetries = config.maxRetries || DEFAULT_MAX_RETRIES;
    }
    
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Make HTTP request to MCP server using JSON-RPC 2.0 protocol
   * 
   * @param {string} tool - Tool name (e.g., 'get_calendar_events')
   * @param {Object} params - Tool parameters
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} Tool response
   */
  async request(tool, params = {}, retryCount = 0) {
    // Validate tool name to prevent path traversal
    if (!tool || typeof tool !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(tool)) {
      throw new Error(`Invalid tool name: ${tool}. Tool names must contain only alphanumeric characters, hyphens, and underscores.`);
    }
    
    // Only count the initial request, not retries
    if (retryCount === 0) {
      this.requestCount++;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      // MCP uses JSON-RPC 2.0 protocol
      // Call the tool using tools/call method
      // Try with server prefix first (riksdag-regering--tool_name)
      // If that fails with "tool not found", try without prefix
      const toolName = tool.includes('--') ? tool : `riksdag-regering--${tool}`;
      
      const jsonRpcRequest = {
        jsonrpc: '2.0',
        id: jsonRpcId++,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      };
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonRpcRequest),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Provide more detailed error information
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (e) {
          // Ignore if we can't read the body
        }
        throw new Error(`MCP server error: ${response.status} ${response.statusText}${errorBody ? ' - ' + errorBody : ''}`);
      }
      
      const jsonRpcResponse = await response.json();
      
      // Check for JSON-RPC error
      if (jsonRpcResponse.error) {
        const errorMsg = jsonRpcResponse.error.message || JSON.stringify(jsonRpcResponse.error);
        
        // If tool not found and we used prefix, try without prefix
        if (errorMsg.includes('not found') && toolName.includes('--') && retryCount === 0) {
          console.warn(`⚠️ Tool not found with prefix, retrying without prefix...`);
          // Recursive call without prefix
          return this.request(tool.replace(/^.*--/, ''), params, retryCount);
        }
        
        throw new Error(`MCP tool error: ${errorMsg}`);
      }
      
      // Extract result from JSON-RPC response
      return jsonRpcResponse.result || {};
      
    } catch (error) {
      // Retry on network errors (case-insensitive check)
      // maxRetries represents total attempts, so we retry until retryCount reaches maxRetries - 1
      const errorMsg = error.message ? error.message.toLowerCase() : '';
      if (retryCount < this.maxRetries - 1 && (
        error.name === 'AbortError' || 
        errorMsg.includes('network') ||
        errorMsg.includes('econnrefused')
      )) {
        console.warn(`⚠️ Request failed, retrying (${retryCount + 1}/${this.maxRetries - 1})...`);
        await this.sleep(RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
        return this.request(tool, params, retryCount + 1);
      }
      
      // Only increment error count on final failure (not retries)
      this.errorCount++;
      
      throw new Error(`MCP request failed: ${error.message}`);
    }
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch calendar events (upcoming parliamentary activity)
   * 
   * @param {string} from - Start date (YYYY-MM-DD)
   * @param {string} tom - End date (YYYY-MM-DD)
   * @param {string} org - Optional: Organ filter (e.g., 'kammaren', 'uu', 'fiu')
   * @param {string} akt - Optional: Activity type
   * @returns {Promise<Array>} Calendar events
   */
  async fetchCalendarEvents(from, tom, org = null, akt = null) {
    const params = { from, tom };
    if (org) params.org = org;
    if (akt) params.akt = akt;
    
    const response = await this.request('get_calendar_events', params);
    return response.events || [];
  }

  /**
   * Fetch latest committee reports (betänkanden)
   * 
   * @param {number} limit - Number of reports to fetch
   * @param {string} rm - Optional: Riksmöte (e.g., '2025/26')
   * @param {string} organ - Optional: Committee filter
   * @returns {Promise<Array>} Committee reports
   */
  async fetchCommitteeReports(limit = 10, rm = null, organ = null) {
    const params = { limit };
    if (rm) params.rm = rm;
    if (organ) params.organ = organ;
    
    const response = await this.request('get_betankanden', params);
    return response.reports || [];
  }

  /**
   * Fetch latest government propositions
   * 
   * @param {number} limit - Number of propositions to fetch
   * @param {string} rm - Optional: Riksmöte
   * @returns {Promise<Array>} Propositions
   */
  async fetchPropositions(limit = 10, rm = null) {
    const params = { limit };
    if (rm) params.rm = rm;
    
    const response = await this.request('get_propositioner', params);
    return response.propositions || [];
  }

  /**
   * Fetch latest opposition motions
   * 
   * @param {number} limit - Number of motions to fetch
   * @param {string} rm - Optional: Riksmöte
   * @returns {Promise<Array>} Motions
   */
  async fetchMotions(limit = 10, rm = null) {
    const params = { limit };
    if (rm) params.rm = rm;
    
    const response = await this.request('get_motioner', params);
    return response.motions || [];
  }

  /**
   * Search riksdag documents
   * 
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.sok - Search query
   * @param {string} searchParams.doktyp - Document type (mot, prop, bet, etc.)
   * @param {string} searchParams.rm - Riksmöte
   * @param {string} searchParams.from_date - From date
   * @param {string} searchParams.to_date - To date
   * @param {number} searchParams.limit - Result limit
   * @returns {Promise<Array>} Documents
   */
  async searchDocuments(searchParams) {
    const response = await this.request('search_dokument', searchParams);
    return response.documents || [];
  }

  /**
   * Search speeches/debates (anföranden)
   * 
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.sok - Search query
   * @param {string} searchParams.rm - Riksmöte
   * @param {string} searchParams.talare - Speaker name
   * @param {string} searchParams.parti - Party
   * @param {number} searchParams.limit - Result limit
   * @returns {Promise<Array>} Speeches
   */
  async searchSpeeches(searchParams) {
    const response = await this.request('search_anforanden', searchParams);
    return response.speeches || [];
  }

  /**
   * Fetch MPs (ledamöter)
   * 
   * @param {Object} filters - Optional filters
   * @param {string} filters.parti - Party filter
   * @param {string} filters.valkrets - Electoral district
   * @param {string} filters.status - Status filter
   * @param {number} filters.limit - Result limit
   * @returns {Promise<Array>} MPs
   */
  async fetchMPs(filters = {}) {
    const response = await this.request('search_ledamoter', filters);
    return response.mps || [];
  }

  /**
   * Fetch voting records
   * 
   * @param {Object} filters - Filter parameters
   * @param {string} filters.rm - Riksmöte
   * @param {string} filters.bet - Document reference
   * @param {string} filters.punkt - Voting point
   * @returns {Promise<Array>} Voting records
   */
  async fetchVotingRecords(filters) {
    const response = await this.request('search_voteringar', filters);
    return response.votes || [];
  }

  /**
   * Fetch government documents (pressmeddelanden, SOU, etc.)
   * 
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.type - Document type
   * @param {string} searchParams.title - Title search
   * @param {string} searchParams.dateFrom - From date
   * @param {string} searchParams.dateTo - To date
   * @param {number} searchParams.limit - Result limit
   * @returns {Promise<Array>} Government documents
   */
  async fetchGovernmentDocuments(searchParams) {
    const response = await this.request('search_regering', searchParams);
    return response.documents || [];
  }

  /**
   * Get request statistics
   * 
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      successRate: this.requestCount > 0 
        ? Math.round((this.requestCount - this.errorCount) / this.requestCount * 100) + '%'
        : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.requestCount = 0;
    this.errorCount = 0;
  }
}

/**
 * Singleton instance for convenience
 */
let defaultClient = null;

export function getDefaultClient() {
  if (!defaultClient) {
    defaultClient = new MCPClient();
  }
  return defaultClient;
}

/**
 * Convenience functions using default client
 */
export async function fetchCalendarEvents(...args) {
  return getDefaultClient().fetchCalendarEvents(...args);
}

export async function fetchCommitteeReports(...args) {
  return getDefaultClient().fetchCommitteeReports(...args);
}

export async function fetchPropositions(...args) {
  return getDefaultClient().fetchPropositions(...args);
}

export async function fetchMotions(...args) {
  return getDefaultClient().fetchMotions(...args);
}

export async function searchDocuments(...args) {
  return getDefaultClient().searchDocuments(...args);
}

export async function searchSpeeches(...args) {
  return getDefaultClient().searchSpeeches(...args);
}

export async function fetchMPs(...args) {
  return getDefaultClient().fetchMPs(...args);
}

export async function fetchVotingRecords(...args) {
  return getDefaultClient().fetchVotingRecords(...args);
}

export async function fetchGovernmentDocuments(...args) {
  return getDefaultClient().fetchGovernmentDocuments(...args);
}

export default MCPClient;
