#!/usr/bin/env node

/**
 * Workflow State Coordinator
 * 
 * Manages coordination between multiple news generation workflows to prevent
 * duplicate work and improve efficiency:
 * - news-realtime-monitor.md (2x daily)
 * - news-evening-analysis.md (daily)
 * - news-article-generator.md (various schedules)
 * 
 * Features:
 * - MCP query caching (2-hour TTL)
 * - Similarity-based article deduplication (>70% threshold)
 * - Recent article tracking (last 6 hours)
 * - Workflow coordination metadata
 * 
 * Usage:
 *   import { WorkflowStateCoordinator } from './workflow-state-coordinator.js';
 *   const coordinator = new WorkflowStateCoordinator();
 *   await coordinator.load();
 *   const isDuplicate = await coordinator.checkDuplicateArticle(title, topics);
 * 
 * @see Issue #150 (News Realtime Monitor Enhancement)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, '..', 'news', 'metadata', 'workflow-state.json');
const MCP_CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const RECENT_ARTICLE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const SIMILARITY_THRESHOLD = 0.70; // 70% similarity triggers deduplication

/**
 * Workflow State Coordinator
 */
export class WorkflowStateCoordinator {
  constructor(stateFilePath = STATE_FILE) {
    this.stateFilePath = stateFilePath;
    this.state = {
      lastUpdate: null,
      recentArticles: [],
      mcpQueryCache: {},
      workflows: {}
    };
  }

  /**
   * Load state from disk
   */
  async load() {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const content = fs.readFileSync(this.stateFilePath, 'utf-8');
        this.state = JSON.parse(content);
        this.cleanupExpiredEntries();
      } else {
        // Initialize empty state
        await this.save();
      }
    } catch (error) {
      console.warn('Warning: Could not load workflow state:', error.message);
      // Continue with empty state
    }
  }

  /**
   * Save state to disk
   */
  async save() {
    try {
      const dir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      this.state.lastUpdate = new Date().toISOString();
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving workflow state:', error.message);
      throw error;
    }
  }

  /**
   * Clean up expired cache entries and old articles
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    
    // Clean MCP cache using per-entry TTL (default: 2 hours)
    Object.keys(this.state.mcpQueryCache).forEach(key => {
      const entry = this.state.mcpQueryCache[key];
      const entryTime = new Date(entry.timestamp).getTime();
      const effectiveTtlSeconds =
        typeof entry.ttl === 'number' && entry.ttl > 0
          ? entry.ttl
          : MCP_CACHE_TTL_SECONDS;
      if (now - entryTime > effectiveTtlSeconds * 1000) {
        delete this.state.mcpQueryCache[key];
      }
    });
    
    // Clean recent articles (6-hour TTL)
    this.state.recentArticles = this.state.recentArticles.filter(article => {
      const articleTime = new Date(article.timestamp).getTime();
      return (now - articleTime) <= RECENT_ARTICLE_TTL_SECONDS * 1000;
    });
  }

  /**
   * Cache MCP query result
   * 
   * @param {string} queryKey - Unique identifier for the query
   * @param {any} result - Query result to cache
   * @param {number} ttl - Time to live in seconds (default: 2 hours)
   */
  async cacheMCPQuery(queryKey, result, ttl = MCP_CACHE_TTL_SECONDS) {
    const resultHash = this.hashObject(result);
    
    this.state.mcpQueryCache[queryKey] = {
      timestamp: new Date().toISOString(),
      ttl,
      resultHash,
      result
    };
    
    await this.save();
  }

  /**
   * Get cached MCP query result
   * 
   * @param {string} queryKey - Unique identifier for the query
   * @returns {any|null} Cached result or null if expired/missing
   */
  getCachedMCPQuery(queryKey) {
    this.cleanupExpiredEntries();
    
    const entry = this.state.mcpQueryCache[queryKey];
    if (!entry) return null;
    
    const now = Date.now();
    const entryTime = new Date(entry.timestamp).getTime();
    
    // Use per-entry TTL with fallback to default constant
    const effectiveTtlSeconds =
      typeof entry.ttl === 'number' && entry.ttl > 0
        ? entry.ttl
        : MCP_CACHE_TTL_SECONDS;
    
    if (now - entryTime > effectiveTtlSeconds * 1000) {
      delete this.state.mcpQueryCache[queryKey];
      return null;
    }
    
    return entry.result;
  }

  /**
   * Add recent article to tracking
   * 
   * @param {Object} article - Article metadata
   */
  async addRecentArticle(article) {
    const articleEntry = {
      slug: article.slug,
      timestamp: new Date().toISOString(),
      workflow: article.workflow || 'unknown',
      title: article.title,
      topics: article.topics || [],
      mcpQueries: article.mcpQueries || []
    };
    
    this.state.recentArticles.push(articleEntry);
    await this.save();
  }

  /**
   * Check if article is duplicate based on similarity
   * 
   * @param {string} title - Article title
   * @param {string[]} topics - Article topics
   * @param {string[]} mcpQueries - MCP query keys used for this article
   * @returns {Object} { isDuplicate: boolean, matchedArticle: Object|null, similarityScore: number }
   */
  async checkDuplicateArticle(title, topics = [], mcpQueries = []) {
    this.cleanupExpiredEntries();
    
    let maxSimilarity = 0;
    let matchedArticle = null;
    
    for (const recentArticle of this.state.recentArticles) {
      const similarity = this.calculateSimilarity(
        title,
        topics,
        mcpQueries,
        recentArticle.title,
        recentArticle.topics,
        recentArticle.mcpQueries
      );
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        matchedArticle = recentArticle;
      }
    }
    
    const isDuplicate = maxSimilarity >= SIMILARITY_THRESHOLD;
    
    return {
      isDuplicate,
      matchedArticle: isDuplicate ? matchedArticle : null,
      similarityScore: maxSimilarity
    };
  }

  /**
   * Calculate similarity between two articles
   * 
   * Uses weighted combination of:
   * - Title similarity (50%)
   * - Topic overlap (30%)
   * - MCP query overlap (20%)
   * 
   * @returns {number} Similarity score 0.0-1.0
   */
  calculateSimilarity(title1, topics1, mcpQueries1, title2, topics2, mcpQueries2) {
    const titleSim = this.stringSimilarity(title1, title2);
    const topicSim = this.setOverlap(topics1, topics2);
    const sourceSim = this.setOverlap(mcpQueries1, mcpQueries2);
    
    return (titleSim * 0.5) + (topicSim * 0.3) + (sourceSim * 0.2);
  }

  /**
   * Calculate string similarity using Jaccard similarity of word sets
   * 
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity 0.0-1.0
   */
  stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    return this.setOverlap([...words1], [...words2]);
  }

  /**
   * Calculate set overlap (Jaccard similarity)
   * 
   * @param {Array} set1 - First set
   * @param {Array} set2 - Second set
   * @returns {number} Overlap 0.0-1.0
   */
  setOverlap(set1, set2) {
    if (!set1 || !set2 || set1.length === 0 || set2.length === 0) return 0;
    
    const s1 = new Set(set1.map(x => String(x).toLowerCase()));
    const s2 = new Set(set2.map(x => String(x).toLowerCase()));
    
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    
    return intersection.size / union.size;
  }

  /**
   * Hash object for cache comparison
   * 
   * @param {any} obj - Object to hash
   * @returns {string} SHA-256 hash
   */
  hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Record workflow execution
   * 
   * @param {string} workflowName - Name of workflow
   * @param {Object} metadata - Execution metadata
   */
  async recordWorkflowExecution(workflowName, metadata = {}) {
    if (!this.state.workflows[workflowName]) {
      this.state.workflows[workflowName] = {
        lastRun: null,
        runCount: 0,
        articlesGenerated: 0
      };
    }
    
    this.state.workflows[workflowName].lastRun = new Date().toISOString();
    this.state.workflows[workflowName].runCount++;
    
    if (metadata.articlesGenerated) {
      this.state.workflows[workflowName].articlesGenerated += metadata.articlesGenerated;
    }
    
    await this.save();
  }

  /**
   * Get recent articles from last N hours
   * 
   * @param {number} hours - Hours to look back
   * @returns {Array} Recent articles
   */
  getRecentArticles(hours = 6) {
    this.cleanupExpiredEntries();
    
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.state.recentArticles.filter(article => {
      return new Date(article.timestamp) >= cutoff;
    });
  }

  /**
   * Get workflow statistics
   * 
   * @returns {Object} Statistics by workflow
   */
  getWorkflowStatistics() {
    return {
      ...this.state.workflows,
      cacheSize: Object.keys(this.state.mcpQueryCache).length,
      recentArticlesCount: this.state.recentArticles.length
    };
  }
}

// Export for direct usage
export {
  MCP_CACHE_TTL_SECONDS,
  RECENT_ARTICLE_TTL_SECONDS,
  SIMILARITY_THRESHOLD
};
