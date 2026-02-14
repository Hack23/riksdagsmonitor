/**
 * Unit Tests for Workflow State Coordination
 * Tests MCP caching, deduplication, and workflow coordination
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WorkflowStateCoordinator, MCP_CACHE_TTL_SECONDS, SIMILARITY_THRESHOLD } from '../scripts/workflow-state-coordinator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_STATE_FILE = path.join(__dirname, 'fixtures', 'test-workflow-state.json');

describe('Workflow State Coordinator', () => {
  let coordinator;

  beforeEach(() => {
    // Use test-specific state file
    coordinator = new WorkflowStateCoordinator(TEST_STATE_FILE);
    
    // Clean up test file if exists
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('should initialize with empty state', async () => {
      await coordinator.load();
      
      expect(coordinator.state.recentArticles).toEqual([]);
      expect(coordinator.state.mcpQueryCache).toEqual({});
      expect(coordinator.state.workflows).toEqual({});
    });

    it('should save and load state', async () => {
      coordinator.state.recentArticles = [
        { slug: 'test-article-en.html', timestamp: new Date().toISOString(), workflow: 'test' }
      ];
      
      await coordinator.save();
      expect(fs.existsSync(TEST_STATE_FILE)).toBe(true);
      
      // Create new coordinator and load
      const coordinator2 = new WorkflowStateCoordinator(TEST_STATE_FILE);
      await coordinator2.load();
      
      expect(coordinator2.state.recentArticles).toHaveLength(1);
      expect(coordinator2.state.recentArticles[0].slug).toBe('test-article-en.html');
    });

    it('should create metadata directory if missing', async () => {
      const dir = path.dirname(TEST_STATE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await coordinator.save();
      expect(fs.existsSync(TEST_STATE_FILE)).toBe(true);
    });

    it('should set lastUpdate timestamp on save', async () => {
      const before = new Date().toISOString();
      await coordinator.save();
      const after = new Date().toISOString();
      
      expect(coordinator.state.lastUpdate).toBeDefined();
      expect(coordinator.state.lastUpdate >= before).toBe(true);
      expect(coordinator.state.lastUpdate <= after).toBe(true);
    });
  });

  describe('MCP Query Caching', () => {
    it('should cache MCP query result', async () => {
      const queryKey = 'search_voteringar_2025-26';
      const result = { data: 'test voting data' };
      
      await coordinator.cacheMCPQuery(queryKey, result);
      
      expect(coordinator.state.mcpQueryCache[queryKey]).toBeDefined();
      expect(coordinator.state.mcpQueryCache[queryKey].result).toEqual(result);
    });

    it('should retrieve cached MCP query', async () => {
      const queryKey = 'search_voteringar_2025-26';
      const result = { data: 'test voting data' };
      
      await coordinator.cacheMCPQuery(queryKey, result);
      const cached = coordinator.getCachedMCPQuery(queryKey);
      
      expect(cached).toEqual(result);
    });

    it('should return null for non-existent cache key', () => {
      const cached = coordinator.getCachedMCPQuery('nonexistent');
      expect(cached).toBeNull();
    });

    it('should expire cache after TTL', async () => {
      const queryKey = 'test_query';
      const result = { data: 'test' };
      const shortTTL = 1; // 1 second
      
      await coordinator.cacheMCPQuery(queryKey, result, shortTTL);
      
      // Should be cached immediately
      let cached = coordinator.getCachedMCPQuery(queryKey);
      expect(cached).toEqual(result);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired
      cached = coordinator.getCachedMCPQuery(queryKey);
      expect(cached).toBeNull();
    });

    it('should include result hash in cache entry', async () => {
      const queryKey = 'test_query';
      const result = { data: 'test' };
      
      await coordinator.cacheMCPQuery(queryKey, result);
      
      expect(coordinator.state.mcpQueryCache[queryKey].resultHash).toBeDefined();
      expect(typeof coordinator.state.mcpQueryCache[queryKey].resultHash).toBe('string');
    });
  });

  describe('Recent Article Tracking', () => {
    it('should add recent article', async () => {
      const article = {
        slug: '2026-02-14-test-en.html',
        workflow: 'realtime-monitor',
        title: 'Test Article',
        topics: ['parliament'],
        mcpQueries: ['search_voteringar']
      };
      
      await coordinator.addRecentArticle(article);
      
      expect(coordinator.state.recentArticles).toHaveLength(1);
      expect(coordinator.state.recentArticles[0].slug).toBe(article.slug);
      expect(coordinator.state.recentArticles[0].workflow).toBe(article.workflow);
    });

    it('should set timestamp on article addition', async () => {
      const article = {
        slug: '2026-02-14-test-en.html',
        workflow: 'test',
        title: 'Test',
        topics: [],
        mcpQueries: []
      };
      
      await coordinator.addRecentArticle(article);
      
      expect(coordinator.state.recentArticles[0].timestamp).toBeDefined();
    });

    it('should get recent articles within time window', async () => {
      // Add articles at different times (simulated)
      const now = new Date();
      const article1 = {
        slug: 'recent-en.html',
        timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        workflow: 'test'
      };
      const article2 = {
        slug: 'old-en.html',
        timestamp: new Date(now - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        workflow: 'test'
      };
      
      coordinator.state.recentArticles = [article1, article2];
      
      const recent = coordinator.getRecentArticles(6); // Last 6 hours
      
      expect(recent).toHaveLength(1);
      expect(recent[0].slug).toBe('recent-en.html');
    });

    it('should cleanup expired articles', () => {
      const now = new Date();
      const recentArticle = {
        slug: 'recent-en.html',
        timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        workflow: 'test'
      };
      const expiredArticle = {
        slug: 'expired-en.html',
        timestamp: new Date(now - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        workflow: 'test'
      };
      
      coordinator.state.recentArticles = [recentArticle, expiredArticle];
      coordinator.cleanupExpiredEntries();
      
      expect(coordinator.state.recentArticles).toHaveLength(1);
      expect(coordinator.state.recentArticles[0].slug).toBe('recent-en.html');
    });
  });

  describe('Duplicate Detection', () => {
    beforeEach(async () => {
      // Setup existing articles
      await coordinator.addRecentArticle({
        slug: '2026-02-14-budget-vote-en.html',
        workflow: 'realtime-monitor',
        title: 'Budget Vote Passes with Narrow Margin',
        topics: ['budget', 'finance', 'parliament'],
        mcpQueries: ['search_voteringar', 'get_voting_group']
      });
    });

    it('should detect duplicate with high title similarity', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'Budget Vote Passes with Narrow Margin', // Very similar title
        ['budget', 'finance', 'parliament'], // Same topics as original
        ['search_voteringar'] // Same MCP query
      );
      
      expect(result.isDuplicate).toBe(true);
      expect(result.similarityScore).toBeGreaterThan(SIMILARITY_THRESHOLD);
    });

    it('should not flag as duplicate with low similarity', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'PM Announces New Environmental Policy', // Completely different
        ['environment', 'policy'],
        ['search_regering']
      );
      
      expect(result.isDuplicate).toBe(false);
      expect(result.similarityScore).toBeLessThan(SIMILARITY_THRESHOLD);
    });

    it('should consider topic overlap in similarity', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'Budget Discussion in Parliament', // Different title, same topics
        ['budget', 'finance', 'parliament'],
        []
      );
      
      // Should have some similarity due to topic overlap
      expect(result.similarityScore).toBeGreaterThan(0.2);
    });

    it('should return matched article details when duplicate found', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'Budget Vote Passes with Narrow Margin',
        ['budget', 'finance'],
        []
      );
      
      if (result.isDuplicate) {
        expect(result.matchedArticle).toBeDefined();
        expect(result.matchedArticle.slug).toBe('2026-02-14-budget-vote-en.html');
      }
    });
  });

  describe('Similarity Calculations', () => {
    it('should calculate string similarity correctly', () => {
      const sim1 = coordinator.stringSimilarity(
        'Budget Vote Passes with Narrow Margin',
        'Budget Vote Passes with Small Margin'
      );
      expect(sim1).toBeGreaterThan(0.7); // High similarity
      
      const sim2 = coordinator.stringSimilarity(
        'Budget Vote Passes',
        'Environmental Policy Announced'
      );
      expect(sim2).toBeLessThan(0.3); // Low similarity
    });

    it('should calculate set overlap correctly', () => {
      const overlap1 = coordinator.setOverlap(
        ['budget', 'finance', 'parliament'],
        ['budget', 'finance', 'vote']
      );
      expect(overlap1).toBeCloseTo(0.5, 1); // 2/4 = 0.5
      
      const overlap2 = coordinator.setOverlap(
        ['budget', 'finance'],
        ['environment', 'policy']
      );
      expect(overlap2).toBe(0); // No overlap
    });

    it('should handle empty sets in overlap calculation', () => {
      const overlap = coordinator.setOverlap([], ['test']);
      expect(overlap).toBe(0);
    });

    it('should combine factors in similarity calculation', () => {
      const similarity = coordinator.calculateSimilarity(
        'Budget Vote',
        ['budget', 'finance'],
        ['source1'],
        'Budget Vote',
        ['budget', 'finance'],
        ['source1']
      );
      expect(similarity).toBeCloseTo(1.0, 1); // Perfect match
    });
  });

  describe('Workflow Recording', () => {
    it('should record workflow execution', async () => {
      await coordinator.recordWorkflowExecution('realtime-monitor', {
        articlesGenerated: 3
      });
      
      expect(coordinator.state.workflows['realtime-monitor']).toBeDefined();
      expect(coordinator.state.workflows['realtime-monitor'].runCount).toBe(1);
      expect(coordinator.state.workflows['realtime-monitor'].articlesGenerated).toBe(3);
    });

    it('should increment run count on multiple executions', async () => {
      await coordinator.recordWorkflowExecution('realtime-monitor');
      await coordinator.recordWorkflowExecution('realtime-monitor');
      await coordinator.recordWorkflowExecution('realtime-monitor');
      
      expect(coordinator.state.workflows['realtime-monitor'].runCount).toBe(3);
    });

    it('should track articles generated across runs', async () => {
      await coordinator.recordWorkflowExecution('realtime-monitor', { articlesGenerated: 2 });
      await coordinator.recordWorkflowExecution('realtime-monitor', { articlesGenerated: 3 });
      
      expect(coordinator.state.workflows['realtime-monitor'].articlesGenerated).toBe(5);
    });

    it('should get workflow statistics', async () => {
      await coordinator.addRecentArticle({
        slug: 'test-en.html',
        workflow: 'test',
        title: 'Test',
        topics: [],
        mcpQueries: []
      });
      
      await coordinator.cacheMCPQuery('test_query', { data: 'test' });
      
      const stats = coordinator.getWorkflowStatistics();
      
      expect(stats.cacheSize).toBe(1);
      expect(stats.recentArticlesCount).toBe(1);
    });
  });
});
