/**
 * Unit Tests for PipelineOrchestrator
 *
 * Tests sequential and parallel execution, error isolation,
 * graceful degradation, and result aggregation.
 */

import { describe, it, expect, vi } from 'vitest';
import { PipelineOrchestrator } from '../../scripts/pipeline/orchestrator.js';
import type { ContentPipeline, PipelineOptions, PipelineResult } from '../../scripts/pipeline/types.js';

// ---------------------------------------------------------------------------
// Test pipeline implementations
// ---------------------------------------------------------------------------

function makeSuccessPipeline(name: string, files = 2): ContentPipeline {
  return {
    name,
    async run(_opts?: PipelineOptions): Promise<PipelineResult> {
      return { success: true, files, warnings: [] };
    },
  };
}

function makeFailurePipeline(name: string): ContentPipeline {
  return {
    name,
    async run(_opts?: PipelineOptions): Promise<PipelineResult> {
      return { success: false, error: `${name} failed`, files: 0, warnings: [] };
    },
  };
}

function makeThrowingPipeline(name: string): ContentPipeline {
  return {
    name,
    async run(_opts?: PipelineOptions): Promise<PipelineResult> {
      throw new Error(`${name} threw unexpectedly`);
    },
  };
}

function makeDegradedPipeline(name: string): ContentPipeline {
  return {
    name,
    async run(opts?: PipelineOptions): Promise<PipelineResult> {
      const langs = opts?.languages ?? ['en'];
      return {
        success: true,
        files: langs.length,
        warnings: ['MCP returned empty data — degraded mode'],
        degraded: true,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Sequential mode
// ---------------------------------------------------------------------------

describe('PipelineOrchestrator — sequential mode', () => {
  it('returns allSucceeded=true when all pipelines succeed', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeSuccessPipeline('a', 2), makeSuccessPipeline('b', 3)],
    });
    const result = await orchestrator.run();
    expect(result.allSucceeded).toBe(true);
    expect(result.totalFiles).toBe(5);
  });

  it('returns allSucceeded=false when any pipeline fails', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeSuccessPipeline('a'), makeFailurePipeline('b')],
    });
    const result = await orchestrator.run();
    expect(result.allSucceeded).toBe(false);
    expect(result.results['b']?.success).toBe(false);
    expect(result.results['a']?.success).toBe(true);
  });

  it('isolates failures — other pipelines still run', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [
        makeFailurePipeline('first'),
        makeSuccessPipeline('second', 4),
      ],
    });
    const result = await orchestrator.run();
    expect(result.results['first']?.success).toBe(false);
    expect(result.results['second']?.success).toBe(true);
    expect(result.totalFiles).toBe(4);
  });

  it('catches unexpected throws and wraps in failed result', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeThrowingPipeline('boom')],
    });
    const result = await orchestrator.run();
    expect(result.allSucceeded).toBe(false);
    expect(result.results['boom']?.success).toBe(false);
    expect(result.results['boom']?.error).toContain('boom threw unexpectedly');
  });

  it('collects warnings from degraded pipelines', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeDegradedPipeline('degraded')],
    });
    const result = await orchestrator.run({ languages: ['en', 'sv'] });
    expect(result.allSucceeded).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.results['degraded']?.degraded).toBe(true);
  });

  it('records total durationMs', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeSuccessPipeline('a')],
    });
    const result = await orchestrator.run();
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('forwards defaultOptions to each pipeline', async () => {
    const spy = vi.fn(async (_opts?: PipelineOptions): Promise<PipelineResult> => ({
      success: true,
      files: 1,
    }));
    const spyPipeline: ContentPipeline = { name: 'spy', run: spy };
    const orchestrator = new PipelineOrchestrator({
      pipelines: [spyPipeline],
      defaultOptions: { languages: ['en', 'sv'] },
    });
    await orchestrator.run();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ languages: ['en', 'sv'] }));
  });

  it('merges overrideOptions on top of defaultOptions', async () => {
    const spy = vi.fn(async (_opts?: PipelineOptions): Promise<PipelineResult> => ({
      success: true,
      files: 1,
    }));
    const spyPipeline: ContentPipeline = { name: 'spy2', run: spy };
    const orchestrator = new PipelineOrchestrator({
      pipelines: [spyPipeline],
      defaultOptions: { languages: ['en'] },
    });
    await orchestrator.run({ languages: ['de', 'fr'] });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ languages: ['de', 'fr'] }));
  });
});

// ---------------------------------------------------------------------------
// Parallel mode
// ---------------------------------------------------------------------------

describe('PipelineOrchestrator — parallel mode', () => {
  it('runs pipelines in parallel and returns combined result', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeSuccessPipeline('p1', 1), makeSuccessPipeline('p2', 2), makeSuccessPipeline('p3', 3)],
      parallel: true,
    });
    const result = await orchestrator.run();
    expect(result.allSucceeded).toBe(true);
    expect(result.totalFiles).toBe(6);
  });

  it('isolates parallel failures — other pipelines still succeed', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeSuccessPipeline('ok', 5), makeFailurePipeline('bad')],
      parallel: true,
    });
    const result = await orchestrator.run();
    expect(result.allSucceeded).toBe(false);
    expect(result.results['ok']?.success).toBe(true);
    expect(result.results['bad']?.success).toBe(false);
    expect(result.totalFiles).toBe(5);
  });

  it('handles throwing pipeline in parallel mode', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeThrowingPipeline('explosive')],
      parallel: true,
    });
    const result = await orchestrator.run();
    expect(result.allSucceeded).toBe(false);
    expect(result.results['explosive']?.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('PipelineOrchestrator — edge cases', () => {
  it('handles empty pipeline list gracefully', async () => {
    const orchestrator = new PipelineOrchestrator({ pipelines: [] });
    const result = await orchestrator.run();
    expect(result.allSucceeded).toBe(true);
    expect(result.totalFiles).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });
});
