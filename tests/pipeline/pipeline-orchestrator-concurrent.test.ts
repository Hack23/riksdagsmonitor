/**
 * Concurrent Pipeline Orchestrator Tests
 *
 * Tests PipelineOrchestrator in parallel mode with concurrent execution,
 * timing verification, error isolation in parallel, and high-concurrency
 * scenarios.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { PipelineOrchestrator } from '../../scripts/pipeline/orchestrator.js';
import type { ContentPipeline, PipelineOptions, PipelineResult } from '../../scripts/pipeline/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDelayedPipeline(name: string, delayMs: number, files = 1): ContentPipeline {
  return {
    name,
    async run(_opts?: PipelineOptions): Promise<PipelineResult> {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return { success: true, files, warnings: [] };
    },
  };
}

function makeDelayedFailurePipeline(name: string, delayMs: number): ContentPipeline {
  return {
    name,
    async run(_opts?: PipelineOptions): Promise<PipelineResult> {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return { success: false, error: `${name} failed after delay`, files: 0, warnings: [] };
    },
  };
}

function makeDelayedThrowPipeline(name: string, delayMs: number): ContentPipeline {
  return {
    name,
    async run(_opts?: PipelineOptions): Promise<PipelineResult> {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      throw new Error(`${name} crashed after ${delayMs}ms`);
    },
  };
}

function makeOptionRecordingPipeline(name: string, recorder: Map<string, PipelineOptions>): ContentPipeline {
  return {
    name,
    async run(opts?: PipelineOptions): Promise<PipelineResult> {
      recorder.set(name, { ...opts });
      return { success: true, files: 1, warnings: [] };
    },
  };
}

// ---------------------------------------------------------------------------
// Concurrent execution tests
// ---------------------------------------------------------------------------

describe('PipelineOrchestrator — concurrent execution', () => {
  it('runs pipelines concurrently in parallel mode (faster than sequential)', async () => {
    // Use identical delays so the sequential sum is predictable
    const delayMs = 50;
    const pipelines = [
      makeDelayedPipeline('a', delayMs, 2),
      makeDelayedPipeline('b', delayMs, 3),
      makeDelayedPipeline('c', delayMs, 1),
    ];
    const sequentialSum = pipelines.length * delayMs; // 150ms

    const startTime = Date.now();
    const orchestrator = new PipelineOrchestrator({ pipelines, parallel: true });
    const result = await orchestrator.run();
    const elapsed = Date.now() - startTime;

    expect(result.allSucceeded).toBe(true);
    expect(result.totalFiles).toBe(6);
    // Parallel execution should complete significantly faster than the
    // sequential sum.  We use a generous 80% margin to avoid CI flakiness.
    expect(elapsed).toBeLessThan(sequentialSum * 0.8);
  });

  it('isolates concurrent failures from concurrent successes', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [
        makeDelayedPipeline('ok1', 10, 3),
        makeDelayedFailurePipeline('fail1', 20),
        makeDelayedPipeline('ok2', 15, 2),
        makeDelayedFailurePipeline('fail2', 5),
      ],
      parallel: true,
    });
    const result = await orchestrator.run();

    expect(result.allSucceeded).toBe(false);
    expect(result.results['ok1']?.success).toBe(true);
    expect(result.results['ok2']?.success).toBe(true);
    expect(result.results['fail1']?.success).toBe(false);
    expect(result.results['fail2']?.success).toBe(false);
    expect(result.totalFiles).toBe(5);
  });

  it('catches concurrent throws via Promise.allSettled', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [
        makeDelayedThrowPipeline('crasher', 10),
        makeDelayedPipeline('survivor', 20, 4),
      ],
      parallel: true,
    });
    const result = await orchestrator.run();

    expect(result.allSucceeded).toBe(false);
    expect(result.results['crasher']?.success).toBe(false);
    expect(result.results['crasher']?.error).toContain('crashed after 10ms');
    expect(result.results['survivor']?.success).toBe(true);
    expect(result.totalFiles).toBe(4);
  });

  it('handles all pipelines throwing concurrently', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [
        makeDelayedThrowPipeline('crash1', 5),
        makeDelayedThrowPipeline('crash2', 10),
        makeDelayedThrowPipeline('crash3', 15),
      ],
      parallel: true,
    });
    const result = await orchestrator.run();

    expect(result.allSucceeded).toBe(false);
    expect(result.totalFiles).toBe(0);
    expect(Object.keys(result.results)).toHaveLength(3);
    for (const name of ['crash1', 'crash2', 'crash3']) {
      expect(result.results[name]?.success).toBe(false);
    }
  });

  it('records durationMs on each pipeline result', async () => {
    const orchestrator = new PipelineOrchestrator({
      pipelines: [
        makeDelayedPipeline('timed1', 20),
        makeDelayedPipeline('timed2', 40),
      ],
      parallel: true,
    });
    const result = await orchestrator.run();

    expect(result.results['timed1']?.durationMs).toBeDefined();
    expect(result.results['timed1']!.durationMs!).toBeGreaterThanOrEqual(0);
    expect(result.results['timed2']?.durationMs).toBeDefined();
    expect(result.results['timed2']!.durationMs!).toBeGreaterThanOrEqual(0);
  });

  it('passes merged options to all concurrent pipelines', async () => {
    const recorder = new Map<string, PipelineOptions>();
    const orchestrator = new PipelineOrchestrator({
      pipelines: [
        makeOptionRecordingPipeline('r1', recorder),
        makeOptionRecordingPipeline('r2', recorder),
        makeOptionRecordingPipeline('r3', recorder),
      ],
      parallel: true,
      defaultOptions: { languages: ['en', 'sv'] },
    });
    await orchestrator.run({ allowDegradedContent: true });

    for (const name of ['r1', 'r2', 'r3']) {
      const opts = recorder.get(name);
      expect(opts).toBeDefined();
      expect(opts!.languages).toEqual(['en', 'sv']);
      expect(opts!.allowDegradedContent).toBe(true);
    }
  });

  it('handles high-concurrency (10+ pipelines) without issues', async () => {
    const pipelines: ContentPipeline[] = Array.from({ length: 15 }, (_, i) =>
      makeDelayedPipeline(`pipe-${i}`, 5 + i, 1)
    );
    const orchestrator = new PipelineOrchestrator({ pipelines, parallel: true });
    const result = await orchestrator.run();

    expect(result.allSucceeded).toBe(true);
    expect(result.totalFiles).toBe(15);
    expect(Object.keys(result.results)).toHaveLength(15);
  });

  it('collects warnings from multiple concurrent degraded pipelines', async () => {
    const makeDegraded = (name: string): ContentPipeline => ({
      name,
      async run(): Promise<PipelineResult> {
        return { success: true, files: 1, warnings: [`${name} degraded`], degraded: true };
      },
    });

    const orchestrator = new PipelineOrchestrator({
      pipelines: [makeDegraded('d1'), makeDegraded('d2'), makeDegraded('d3')],
      parallel: true,
    });
    const result = await orchestrator.run();

    expect(result.allSucceeded).toBe(true);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings).toContain('d1 degraded');
    expect(result.warnings).toContain('d2 degraded');
    expect(result.warnings).toContain('d3 degraded');
  });

  it('sequential mode runs pipelines one at a time (order preserved)', async () => {
    const callOrder: string[] = [];

    const makeOrderTracker = (name: string, delayMs: number): ContentPipeline => ({
      name,
      async run(): Promise<PipelineResult> {
        callOrder.push(`${name}-start`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        callOrder.push(`${name}-end`);
        return { success: true, files: 1, warnings: [] };
      },
    });

    const orchestrator = new PipelineOrchestrator({
      pipelines: [
        makeOrderTracker('first', 10),
        makeOrderTracker('second', 10),
        makeOrderTracker('third', 10),
      ],
      parallel: false,
    });
    await orchestrator.run();

    // Sequential: first-start, first-end, second-start, second-end, third-start, third-end
    expect(callOrder).toEqual([
      'first-start', 'first-end',
      'second-start', 'second-end',
      'third-start', 'third-end',
    ]);
  });

  it('empty parallel run returns allSucceeded=true', async () => {
    const orchestrator = new PipelineOrchestrator({ pipelines: [], parallel: true });
    const result = await orchestrator.run();
    expect(result.allSucceeded).toBe(true);
    expect(result.totalFiles).toBe(0);
  });
});
