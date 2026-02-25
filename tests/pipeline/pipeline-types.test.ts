/**
 * Unit Tests for Pipeline Types and Interfaces
 *
 * Tests the ContentPipeline contract, PipelineResult shape, and related type utilities.
 */

import { describe, it, expect } from 'vitest';
import type {
  ContentPipeline,
  PipelineOptions,
  PipelineResult,
  PipelineStage,
  OrchestratorConfig,
  OrchestratorResult,
} from '../../scripts/pipeline/types.js';

// ---------------------------------------------------------------------------
// Minimal ContentPipeline implementation used across tests
// ---------------------------------------------------------------------------

class SuccessPipeline implements ContentPipeline {
  readonly name = 'test-success';

  async run(options?: PipelineOptions): Promise<PipelineResult> {
    const langs = options?.languages ?? ['en'];
    return {
      success: true,
      files: langs.length,
      durationMs: 1,
      warnings: [],
      degraded: false,
    };
  }
}

class FailurePipeline implements ContentPipeline {
  readonly name = 'test-failure';

  async run(_options?: PipelineOptions): Promise<PipelineResult> {
    return {
      success: false,
      error: 'simulated failure',
      files: 0,
      warnings: ['fetch stage returned empty data'],
      degraded: true,
    };
  }
}

class DegradedPipeline implements ContentPipeline {
  readonly name = 'test-degraded';

  async run(options?: PipelineOptions): Promise<PipelineResult> {
    const langs = options?.languages ?? ['en'];
    return {
      success: true,
      files: langs.length,
      warnings: ['MCP returned no data — using fallback'],
      degraded: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContentPipeline interface contract', () => {
  it('SuccessPipeline satisfies ContentPipeline interface', async () => {
    const pipeline: ContentPipeline = new SuccessPipeline();
    expect(pipeline.name).toBe('test-success');
    const result = await pipeline.run();
    expect(result.success).toBe(true);
  });

  it('FailurePipeline returns success=false with error message', async () => {
    const pipeline: ContentPipeline = new FailurePipeline();
    const result = await pipeline.run();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });

  it('DegradedPipeline reports degraded=true with warnings', async () => {
    const pipeline: ContentPipeline = new DegradedPipeline();
    const result = await pipeline.run({ languages: ['en', 'sv'] });
    expect(result.success).toBe(true);
    expect(result.degraded).toBe(true);
    expect(result.warnings).toBeDefined();
    expect((result.warnings ?? []).length).toBeGreaterThan(0);
  });

  it('pipeline result files count matches language list length', async () => {
    const pipeline = new SuccessPipeline();
    const result = await pipeline.run({ languages: ['en', 'sv', 'de'] });
    expect(result.files).toBe(3);
  });
});

describe('PipelineStage type values', () => {
  it('all stage names are valid string literals', () => {
    const stages: PipelineStage[] = ['fetch', 'transform', 'generate', 'validate', 'write'];
    expect(stages).toHaveLength(5);
    for (const stage of stages) {
      expect(typeof stage).toBe('string');
    }
  });
});

describe('OrchestratorConfig shape', () => {
  it('accepts pipelines array and optional parallel flag', () => {
    const config: OrchestratorConfig = {
      pipelines: [new SuccessPipeline(), new FailurePipeline()],
      parallel: false,
      defaultOptions: { languages: ['en'] },
    };
    expect(config.pipelines).toHaveLength(2);
    expect(config.parallel).toBe(false);
  });
});

describe('OrchestratorResult shape', () => {
  it('has expected top-level fields', () => {
    const result: OrchestratorResult = {
      allSucceeded: true,
      totalFiles: 4,
      results: {},
      warnings: [],
      durationMs: 42,
    };
    expect(result.allSucceeded).toBe(true);
    expect(result.totalFiles).toBe(4);
    expect(result.durationMs).toBe(42);
  });
});
