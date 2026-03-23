/**
 * Unit Tests for Workflow State Coordination
 * Tests MCP caching, deduplication, workflow coordination,
 * file locks, Jaccard similarity, atomic writes, and adaptive TTL
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  WorkflowStateCoordinator,
  WorkflowLockManager,
  SIMILARITY_THRESHOLD,
  TOPIC_JACCARD_THRESHOLD,
  LOCK_TIMEOUT_MS,
  MCP_CACHE_TTL_SECONDS,
  MCP_CACHE_TTL_NON_PLENARY_SECONDS,
  jaccardTopicSimilarity,
  getAdaptiveCacheTTL,
} from '../scripts/workflow-state-coordinator.js';
import type { RecentArticleEntry, DuplicateCheckResult } from '../scripts/types/workflow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_STATE_FILE = path.join(__dirname, 'fixtures', 'test-workflow-state.json');
const TEST_LOCK_DIR = path.join(__dirname, 'fixtures', 'test-locks');

/** Input shape for addRecentArticle */
interface RecentArticleInput {
  slug: string;
  workflow: string;
  title: string;
  topics: string[];
  mcpQueries: string[];
  timestamp?: string;
}

describe('Workflow State Coordinator', () => {
  let coordinator: InstanceType<typeof WorkflowStateCoordinator>;

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
    // Clean up any leftover temp files
    const dir = path.dirname(TEST_STATE_FILE);
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (f.startsWith('test-workflow-state.json.tmp.')) {
          fs.unlinkSync(path.join(dir, f));
        }
      }
    }
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('should initialize with empty state', async () => {
      await coordinator.load();
      
      expect((coordinator as any).state.recentArticles).toEqual([]);
      expect((coordinator as any).state.mcpQueryCache).toEqual({});
      expect((coordinator as any).state.workflows).toEqual({});
    });

    it('should save and load state', async () => {
      (coordinator as any).state.recentArticles = [
        { slug: 'test-article-en.html', timestamp: new Date().toISOString(), workflow: 'test' } as RecentArticleEntry
      ];
      
      await coordinator.save();
      expect(fs.existsSync(TEST_STATE_FILE)).toBe(true);
      
      // Create new coordinator and load
      const coordinator2 = new WorkflowStateCoordinator(TEST_STATE_FILE);
      await coordinator2.load();
      
      expect((coordinator2 as any).state.recentArticles).toHaveLength(1);
      expect((coordinator2 as any).state.recentArticles[0].slug).toBe('test-article-en.html');
    });

    it('should create metadata directory if missing', async () => {
      const dir = path.dirname(TEST_STATE_FILE);
      
      // Ensure any existing test file is removed
      if (fs.existsSync(TEST_STATE_FILE)) {
        fs.unlinkSync(TEST_STATE_FILE);
      }

      // Remove the directory to simulate a missing metadata directory
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
      }

      expect(fs.existsSync(dir)).toBe(false);

      await coordinator.save();

      // save() should recreate the directory and state file
      expect(fs.existsSync(dir)).toBe(true);
      expect(fs.existsSync(TEST_STATE_FILE)).toBe(true);
    });

    it('should set lastUpdate timestamp on save', async () => {
      const before = new Date().toISOString();
      await coordinator.save();
      const after = new Date().toISOString();
      
      expect((coordinator as any).state.lastUpdate).toBeDefined();
      expect((coordinator as any).state.lastUpdate! >= before).toBe(true);
      expect((coordinator as any).state.lastUpdate! <= after).toBe(true);
    });

    it('should use atomic write (write-to-tmp + rename)', async () => {
      await coordinator.save();

      // Verify state file is valid JSON (would be corrupt if non-atomic)
      const content = fs.readFileSync(TEST_STATE_FILE, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();

      // Verify no leftover tmp files
      const dir = path.dirname(TEST_STATE_FILE);
      const tmpFiles = fs.readdirSync(dir).filter(f => f.startsWith('test-workflow-state.json.tmp.'));
      expect(tmpFiles).toHaveLength(0);
    });

    it('should initialize activeGenerations array on load', async () => {
      // Write state without activeGenerations (backward compat)
      const dir = path.dirname(TEST_STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TEST_STATE_FILE, JSON.stringify({
        lastUpdate: new Date().toISOString(),
        recentArticles: [],
        mcpQueryCache: {},
        workflows: {},
      }), 'utf-8');

      await coordinator.load();
      expect((coordinator as any).state.activeGenerations).toEqual([]);
    });
  });

  describe('MCP Query Caching', () => {
    it('should cache MCP query result', async () => {
      const queryKey = 'search_voteringar_2025-26';
      const result = { data: 'test voting data' };
      
      await coordinator.cacheMCPQuery(queryKey, result);
      
      expect((coordinator as any).state.mcpQueryCache[queryKey]).toBeDefined();
      expect((coordinator as any).state.mcpQueryCache[queryKey].result).toEqual(result);
    });

    it('should retrieve cached MCP query', async () => {
      const queryKey = 'search_voteringar_2025-26';
      const result = { data: 'test voting data' };
      
      await coordinator.cacheMCPQuery(queryKey, result);
      const cached = coordinator.getCachedMCPQuery(queryKey) as { data: string } | null;
      
      expect(cached).toEqual(result);
    });

    it('should return null for non-existent cache key', () => {
      const cached = coordinator.getCachedMCPQuery('nonexistent') as unknown;
      expect(cached).toBeNull();
    });

    it('should expire cache after TTL', async () => {
      vi.useFakeTimers();
      try {
        const queryKey = 'test_query';
        const result = { data: 'test' };
        const shortTTL = 1; // 1 second
        
        await coordinator.cacheMCPQuery(queryKey, result, shortTTL);
        
        // Should be cached immediately
        let cached = coordinator.getCachedMCPQuery(queryKey) as unknown;
        expect(cached).toEqual(result);
        
        // Advance time past TTL to trigger expiration
        await vi.advanceTimersByTimeAsync(1100);
        
        // Should be expired
        cached = coordinator.getCachedMCPQuery(queryKey) as unknown;
        expect(cached).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should include result hash in cache entry', async () => {
      const queryKey = 'test_query';
      const result = { data: 'test' };
      
      await coordinator.cacheMCPQuery(queryKey, result);
      
      expect((coordinator as any).state.mcpQueryCache[queryKey].resultHash).toBeDefined();
      expect(typeof (coordinator as any).state.mcpQueryCache[queryKey].resultHash).toBe('string');
    });

    it('should use adaptive TTL when no explicit TTL provided', async () => {
      const queryKey = 'adaptive_ttl_test';
      const result = { data: 'test' };

      await coordinator.cacheMCPQuery(queryKey, result);

      const entry = (coordinator as any).state.mcpQueryCache[queryKey];
      // TTL should be one of the two adaptive values
      expect([MCP_CACHE_TTL_SECONDS, MCP_CACHE_TTL_NON_PLENARY_SECONDS]).toContain(entry.ttl);
    });
  });

  describe('Recent Article Tracking', () => {
    it('should add recent article', async () => {
      const article: RecentArticleInput = {
        slug: '2026-02-14-test-en.html',
        workflow: 'realtime-monitor',
        title: 'Test Article',
        topics: ['parliament'],
        mcpQueries: ['search_voteringar']
      };
      
      await coordinator.addRecentArticle(article);
      
      expect((coordinator as any).state.recentArticles).toHaveLength(1);
      expect((coordinator as any).state.recentArticles[0].slug).toBe(article.slug);
      expect((coordinator as any).state.recentArticles[0].workflow).toBe(article.workflow);
    });

    it('should set timestamp on article addition', async () => {
      const article: RecentArticleInput = {
        slug: '2026-02-14-test-en.html',
        workflow: 'test',
        title: 'Test',
        topics: [],
        mcpQueries: []
      };
      
      await coordinator.addRecentArticle(article);
      
      expect((coordinator as any).state.recentArticles[0].timestamp).toBeDefined();
    });

    it('should get recent articles within time window', async () => {
      // Add articles at different times (simulated)
      const now = new Date();
      const article1: RecentArticleEntry = {
        slug: 'recent-en.html',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        workflow: 'test',
        title: '',
        topics: [],
        mcpQueries: []
      };
      const article2: RecentArticleEntry = {
        slug: 'old-en.html',
        timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        workflow: 'test',
        title: '',
        topics: [],
        mcpQueries: []
      };
      
      (coordinator as any).state.recentArticles = [article1, article2];
      
      const recent = coordinator.getRecentArticles(6) as RecentArticleEntry[]; // Last 6 hours
      
      expect(recent).toHaveLength(1);
      expect(recent[0]!.slug).toBe('recent-en.html');
    });

    it('should cleanup expired articles', () => {
      const now = new Date();
      const recentArticle: RecentArticleEntry = {
        slug: 'recent-en.html',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        workflow: 'test',
        title: '',
        topics: [],
        mcpQueries: []
      };
      const expiredArticle: RecentArticleEntry = {
        slug: 'expired-en.html',
        timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        workflow: 'test',
        title: '',
        topics: [],
        mcpQueries: []
      };
      
      (coordinator as any).state.recentArticles = [recentArticle, expiredArticle];
      coordinator.cleanupExpiredEntries();
      
      expect((coordinator as any).state.recentArticles).toHaveLength(1);
      expect((coordinator as any).state.recentArticles[0].slug).toBe('recent-en.html');
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
      ) as DuplicateCheckResult;
      
      expect(result.isDuplicate).toBe(true);
      expect(result.similarityScore).toBeGreaterThan(SIMILARITY_THRESHOLD as number);
    });

    it('should not flag as duplicate with low similarity', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'PM Announces New Environmental Policy', // Completely different
        ['environment', 'policy'],
        ['search_regering']
      ) as DuplicateCheckResult;
      
      expect(result.isDuplicate).toBe(false);
      expect(result.similarityScore).toBeLessThan(SIMILARITY_THRESHOLD as number);
    });

    it('should consider topic overlap in similarity', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'Budget Discussion in Parliament', // Different title, same topics
        ['budget', 'finance', 'parliament'],
        []
      ) as DuplicateCheckResult;
      
      // Should have some similarity due to topic overlap
      expect(result.similarityScore).toBeGreaterThan(0.2);
    });

    it('should return matched article details when duplicate found', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'Budget Vote Passes with Narrow Margin',
        ['budget', 'finance'],
        []
      ) as DuplicateCheckResult;
      
      if (result.isDuplicate) {
        expect(result.matchedArticle).toBeDefined();
        expect(result.matchedArticle!.slug).toBe('2026-02-14-budget-vote-en.html');
      }
    });

    it('should detect duplicate when combined similarity < 0.70 but topic Jaccard >= 0.5', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'Committee Report: Housing',
        ['budget', 'finance', 'housing'],
        []
      ) as DuplicateCheckResult;

      // Jaccard topics against ['budget','finance','parliament'] = 2/4 = 0.5
      // and combined similarity remains below 0.70 due to very different title/MCP queries.
      expect(result.similarityScore).toBeGreaterThanOrEqual(TOPIC_JACCARD_THRESHOLD as number);
      expect(result.similarityScore).toBeLessThan(SIMILARITY_THRESHOLD as number);
      expect(result.isDuplicate).toBe(true);
    });

    it('should not trigger Jaccard duplicate when topic overlap is low', async () => {
      const result = await coordinator.checkDuplicateArticle(
        'Completely Unrelated Story',
        ['sports', 'weather', 'culture', 'entertainment'],
        []
      ) as DuplicateCheckResult;

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('Similarity Calculations', () => {
    it('should calculate string similarity correctly', () => {
      const sim1 = coordinator.stringSimilarity(
        'Budget Vote Passes with Narrow Margin',
        'Budget Vote Passes with Small Margin'
      ) as number;
      expect(sim1).toBeGreaterThan(0.7); // High similarity
      
      const sim2 = coordinator.stringSimilarity(
        'Budget Vote Passes',
        'Environmental Policy Announced'
      ) as number;
      expect(sim2).toBeLessThan(0.3); // Low similarity
    });

    it('should calculate set overlap correctly', () => {
      const overlap1 = coordinator.setOverlap(
        ['budget', 'finance', 'parliament'],
        ['budget', 'finance', 'vote']
      ) as number;
      expect(overlap1).toBeCloseTo(0.5, 1); // 2/4 = 0.5
      
      const overlap2 = coordinator.setOverlap(
        ['budget', 'finance'],
        ['environment', 'policy']
      ) as number;
      expect(overlap2).toBe(0); // No overlap
    });

    it('should handle empty sets in overlap calculation', () => {
      const overlap = coordinator.setOverlap([], ['test']) as number;
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
      ) as number;
      expect(similarity).toBeCloseTo(1.0, 1); // Perfect match
    });
  });

  describe('Jaccard Topic Similarity', () => {
    it('should return 1.0 for identical topic sets', () => {
      expect(jaccardTopicSimilarity(
        ['budget', 'finance', 'parliament'],
        ['budget', 'finance', 'parliament'],
      )).toBeCloseTo(1.0);
    });

    it('should return 0 for completely disjoint topics', () => {
      expect(jaccardTopicSimilarity(
        ['budget', 'finance'],
        ['environment', 'policy'],
      )).toBe(0);
    });

    it('should return 0 for empty arrays', () => {
      expect(jaccardTopicSimilarity([], [])).toBe(0);
      expect(jaccardTopicSimilarity(['a'], [])).toBe(0);
      expect(jaccardTopicSimilarity([], ['a'])).toBe(0);
    });

    it('should be case-insensitive', () => {
      expect(jaccardTopicSimilarity(
        ['Budget', 'Finance'],
        ['budget', 'finance'],
      )).toBeCloseTo(1.0);
    });

    it('should compute partial overlap correctly', () => {
      // intersection = {budget, finance} = 2, union = {budget, finance, parliament, vote} = 4
      expect(jaccardTopicSimilarity(
        ['budget', 'finance', 'parliament'],
        ['budget', 'finance', 'vote'],
      )).toBeCloseTo(0.5, 1);
    });

    it('should meet threshold for same-topic articles with different titles', () => {
      // Simulates: "Committee Report: Housing" vs "Riksdag Housing Committee Analysis"
      const similarity = jaccardTopicSimilarity(
        ['housing', 'committee', 'riksdag'],
        ['housing', 'committee', 'analysis'],
      );
      // intersection=2, union=4 → 0.5 — exactly at threshold
      expect(similarity).toBeGreaterThanOrEqual(TOPIC_JACCARD_THRESHOLD as number);
    });
  });

  describe('Adaptive Cache TTL', () => {
    it('should return 2-hour TTL during Stockholm plenary hours (08-16 local)', () => {
      const plenaryDate = new Date('2026-03-23T10:00:00Z');
      expect(getAdaptiveCacheTTL(plenaryDate)).toBe(MCP_CACHE_TTL_SECONDS);
    });

    it('should return 4-hour TTL outside Stockholm plenary hours', () => {
      const eveningDate = new Date('2026-03-23T20:00:00Z');
      expect(getAdaptiveCacheTTL(eveningDate)).toBe(MCP_CACHE_TTL_NON_PLENARY_SECONDS);
    });

    it('should return 4-hour TTL for early morning UTC', () => {
      // 03:00 UTC = 04:00 CET — early morning
      const earlyDate = new Date('2026-03-23T03:00:00Z');
      expect(getAdaptiveCacheTTL(earlyDate)).toBe(MCP_CACHE_TTL_NON_PLENARY_SECONDS);
    });

    it('should return 2-hour TTL at Stockholm opening boundary (08:00 local)', () => {
      const boundaryDate = new Date('2026-03-23T07:00:00Z');
      expect(getAdaptiveCacheTTL(boundaryDate)).toBe(MCP_CACHE_TTL_SECONDS);
    });

    it('should return 2-hour TTL at Stockholm closing boundary (16:00 local)', () => {
      const boundaryDate = new Date('2026-03-23T15:00:00Z');
      expect(getAdaptiveCacheTTL(boundaryDate)).toBe(MCP_CACHE_TTL_SECONDS);
    });

    it('should honor DST by using Stockholm local hour (summer time)', () => {
      // 06:30 UTC on summer date => 08:30 CEST in Stockholm (plenary window)
      const summerDate = new Date('2026-06-15T06:30:00Z');
      expect(getAdaptiveCacheTTL(summerDate)).toBe(MCP_CACHE_TTL_SECONDS);
    });

    it('should honor DST by using Stockholm local hour (winter time)', () => {
      // 07:30 UTC on winter date => 08:30 CET in Stockholm (plenary window)
      const winterDate = new Date('2026-01-15T07:30:00Z');
      expect(getAdaptiveCacheTTL(winterDate)).toBe(MCP_CACHE_TTL_SECONDS);
    });
  });

  describe('Workflow Recording', () => {
    it('should record workflow execution', async () => {
      await coordinator.recordWorkflowExecution('realtime-monitor', {
        articlesGenerated: 3
      });
      
      expect((coordinator as any).state.workflows['realtime-monitor']).toBeDefined();
      expect((coordinator as any).state.workflows['realtime-monitor'].runCount).toBe(1);
      expect((coordinator as any).state.workflows['realtime-monitor'].articlesGenerated).toBe(3);
    });

    it('should increment run count on multiple executions', async () => {
      await coordinator.recordWorkflowExecution('realtime-monitor');
      await coordinator.recordWorkflowExecution('realtime-monitor');
      await coordinator.recordWorkflowExecution('realtime-monitor');
      
      expect((coordinator as any).state.workflows['realtime-monitor'].runCount).toBe(3);
    });

    it('should track articles generated across runs', async () => {
      await coordinator.recordWorkflowExecution('realtime-monitor', { articlesGenerated: 2 });
      await coordinator.recordWorkflowExecution('realtime-monitor', { articlesGenerated: 3 });
      
      expect((coordinator as any).state.workflows['realtime-monitor'].articlesGenerated).toBe(5);
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
      
      const stats = coordinator.getWorkflowStatistics() as { cacheSize: number; recentArticlesCount: number };
      
      expect(stats.cacheSize).toBe(1);
      expect(stats.recentArticlesCount).toBe(1);
    });
  });

  describe('Active Generations (Cross-Workflow Visibility)', () => {
    it('should register an active generation', async () => {
      await coordinator.registerActiveGeneration('wf-123', 'propositions', '2026-03-23');

      const active = coordinator.getActiveGenerations();
      expect(active).toHaveLength(1);
      expect(active[0].workflowId).toBe('wf-123');
      expect(active[0].type).toBe('propositions');
      expect(active[0].date).toBe('2026-03-23');
    });

    it('should unregister an active generation', async () => {
      await coordinator.registerActiveGeneration('wf-123', 'propositions', '2026-03-23');
      await coordinator.unregisterActiveGeneration('wf-123', 'propositions', '2026-03-23');

      expect(coordinator.getActiveGenerations()).toHaveLength(0);
    });

    it('should handle multiple concurrent active generations', async () => {
      await coordinator.registerActiveGeneration('wf-1', 'propositions', '2026-03-23');
      await coordinator.registerActiveGeneration('wf-2', 'motions', '2026-03-23');

      const active = coordinator.getActiveGenerations();
      expect(active).toHaveLength(2);
    });

    it('should only unregister the matching generation', async () => {
      await coordinator.registerActiveGeneration('wf-1', 'propositions', '2026-03-23');
      await coordinator.registerActiveGeneration('wf-2', 'motions', '2026-03-23');
      await coordinator.unregisterActiveGeneration('wf-1', 'propositions', '2026-03-23');

      const active = coordinator.getActiveGenerations();
      expect(active).toHaveLength(1);
      expect(active[0].workflowId).toBe('wf-2');
    });

    it('should not duplicate identical active generation registration', async () => {
      await coordinator.registerActiveGeneration('wf-1', 'propositions', '2026-03-23');
      await coordinator.registerActiveGeneration('wf-1', 'propositions', '2026-03-23');

      const active = coordinator.getActiveGenerations();
      expect(active).toHaveLength(1);
    });

    it('should cleanup stale active generations on registration', async () => {
      (coordinator as any).state.activeGenerations = [
        {
          workflowId: 'old',
          type: 'propositions',
          date: '2026-03-23',
          startedAt: new Date(Date.now() - (46 * 60 * 1000)).toISOString(),
        },
      ];
      await coordinator.registerActiveGeneration('wf-2', 'motions', '2026-03-23');

      const active = coordinator.getActiveGenerations();
      expect(active).toHaveLength(1);
      expect(active[0].workflowId).toBe('wf-2');
    });
  });
});

describe('Workflow Lock Manager', () => {
  let lockManager: InstanceType<typeof WorkflowLockManager>;

  beforeEach(() => {
    lockManager = new WorkflowLockManager(TEST_LOCK_DIR);
    // Clean up test lock directory
    if (fs.existsSync(TEST_LOCK_DIR)) {
      fs.rmSync(TEST_LOCK_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_LOCK_DIR)) {
      fs.rmSync(TEST_LOCK_DIR, { recursive: true, force: true });
    }
  });

  describe('Lock Acquisition', () => {
    it('should acquire a lock successfully', () => {
      const result = lockManager.acquireLock('propositions', '2026-03-23', 'wf-123');
      expect(result).toBe(true);
    });

    it('should fail to acquire an already-held lock', () => {
      lockManager.acquireLock('propositions', '2026-03-23', 'wf-123');
      const result = lockManager.acquireLock('propositions', '2026-03-23', 'wf-456');
      expect(result).toBe(false);
    });

    it('should allow acquiring locks for different types', () => {
      expect(lockManager.acquireLock('propositions', '2026-03-23', 'wf-1')).toBe(true);
      expect(lockManager.acquireLock('motions', '2026-03-23', 'wf-2')).toBe(true);
    });

    it('should allow acquiring locks for different dates', () => {
      expect(lockManager.acquireLock('propositions', '2026-03-23', 'wf-1')).toBe(true);
      expect(lockManager.acquireLock('propositions', '2026-03-24', 'wf-2')).toBe(true);
    });

    it('should write lock info.json', () => {
      lockManager.acquireLock('propositions', '2026-03-23', 'wf-123');

      const info = lockManager.getLockInfo('propositions', '2026-03-23');
      expect(info).not.toBeNull();
      expect(info!.workflowId).toBe('wf-123');
      expect(info!.acquiredAt).toBeDefined();
      expect(info!.expiresAfterMs).toBe(LOCK_TIMEOUT_MS);
    });

    it('should reclaim a stale lock', () => {
      // Manually create a stale lock
      const lockPath = path.join(TEST_LOCK_DIR, 'propositions-2026-03-23.lock');
      fs.mkdirSync(lockPath, { recursive: true });
      fs.writeFileSync(path.join(lockPath, 'info.json'), JSON.stringify({
        workflowId: 'old-wf',
        acquiredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        expiresAfterMs: LOCK_TIMEOUT_MS,
      }));

      // New workflow should reclaim the stale lock
      const result = lockManager.acquireLock('propositions', '2026-03-23', 'new-wf');
      expect(result).toBe(true);

      const info = lockManager.getLockInfo('propositions', '2026-03-23');
      expect(info!.workflowId).toBe('new-wf');
    });

    it('should throw for non-EEXIST fs errors during acquire', () => {
      const mkdirSpy = vi.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {
        const error = new Error('permission denied') as NodeJS.ErrnoException;
        error.code = 'EACCES';
        throw error;
      });

      expect(() => lockManager.acquireLock('propositions', '2026-03-23', 'wf-1')).toThrow();
      mkdirSpy.mockRestore();
    });

    it('should reject invalid lock type and prevent path traversal', () => {
      expect(() => lockManager.acquireLock('../evil', '2026-03-23', 'wf-1')).toThrow('Invalid lock type');
    });

    it('should reject invalid lock date and prevent path traversal', () => {
      expect(() => lockManager.acquireLock('propositions', '../2026-03-23', 'wf-1')).toThrow('Invalid lock date');
      expect(() => lockManager.acquireLock('propositions', '2026/03/23', 'wf-1')).toThrow('Invalid lock date');
    });
  });

  describe('Lock Release', () => {
    it('should release a held lock', () => {
      lockManager.acquireLock('propositions', '2026-03-23', 'wf-123');
      lockManager.releaseLock('propositions', '2026-03-23');

      expect(lockManager.isLocked('propositions', '2026-03-23')).toBe(false);
    });

    it('should not throw when releasing a non-existent lock', () => {
      expect(() => lockManager.releaseLock('nonexistent', '2026-03-23')).not.toThrow();
    });

    it('should allow re-acquiring after release', () => {
      lockManager.acquireLock('propositions', '2026-03-23', 'wf-1');
      lockManager.releaseLock('propositions', '2026-03-23');
      const result = lockManager.acquireLock('propositions', '2026-03-23', 'wf-2');
      expect(result).toBe(true);
    });
  });

  describe('Lock Status', () => {
    it('should report lock as held', () => {
      lockManager.acquireLock('propositions', '2026-03-23', 'wf-123');
      expect(lockManager.isLocked('propositions', '2026-03-23')).toBe(true);
    });

    it('should report lock as not held', () => {
      expect(lockManager.isLocked('propositions', '2026-03-23')).toBe(false);
    });

    it('should return null for non-existent lock info', () => {
      expect(lockManager.getLockInfo('nonexistent', '2026-03-23')).toBeNull();
    });
  });

  describe('Stale Lock Cleanup', () => {
    it('should clean up stale locks older than timeout', () => {
      // Create a stale lock manually
      const lockPath = path.join(TEST_LOCK_DIR, 'stale-2026-03-23.lock');
      fs.mkdirSync(lockPath, { recursive: true });
      fs.writeFileSync(path.join(lockPath, 'info.json'), JSON.stringify({
        workflowId: 'old-wf',
        acquiredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago (> 45 min)
        expiresAfterMs: LOCK_TIMEOUT_MS,
      }));

      const cleaned = lockManager.cleanupStaleLocks();
      expect(cleaned).toBe(1);
      expect(lockManager.isLocked('stale', '2026-03-23')).toBe(false);
    });

    it('should not clean up fresh locks', () => {
      lockManager.acquireLock('fresh', '2026-03-23', 'wf-fresh');

      const cleaned = lockManager.cleanupStaleLocks();
      expect(cleaned).toBe(0);
      expect(lockManager.isLocked('fresh', '2026-03-23')).toBe(true);
    });

    it('should clean up orphaned lock directories without info.json', () => {
      const lockPath = path.join(TEST_LOCK_DIR, 'orphan-2026-03-23.lock');
      fs.mkdirSync(lockPath, { recursive: true });
      // No info.json — orphaned

      const cleaned = lockManager.cleanupStaleLocks();
      expect(cleaned).toBe(1);
    });

    it('should return 0 when no locks exist', () => {
      expect(lockManager.cleanupStaleLocks()).toBe(0);
    });

    it('should return 0 when lock directory does not exist', () => {
      const freshManager = new WorkflowLockManager(path.join(TEST_LOCK_DIR, 'nonexistent'));
      expect(freshManager.cleanupStaleLocks()).toBe(0);
    });
  });
});
