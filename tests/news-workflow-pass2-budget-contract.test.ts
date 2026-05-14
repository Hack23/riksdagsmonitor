import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

describe('agentic news workflow pass-2 and budget contracts', () => {
  it('realtime monitor is scheduled for the 15:30 UTC catch-up window', () => {
    const src = read('.github/workflows/news-realtime-monitor.md');
    expect(src).toContain("cron: '30 15 * * 1-5'");
  });

  it('election-cycle and year-ahead workflows use sonnet throughput model', () => {
    const election = read('.github/workflows/news-election-cycle.md');
    const yearAhead = read('.github/workflows/news-year-ahead.md');
    expect(election).toContain('model: claude-sonnet-4.6');
    expect(yearAhead).toContain('model: claude-sonnet-4.6');
    expect(election).not.toContain('model: claude-opus-4.7');
    expect(yearAhead).not.toContain('model: claude-opus-4.7');
  });

  it('analysis gate requires explicit full pass-2 declaration and canonical rerun schema fields', () => {
    const gate = read('.github/prompts/05-analysis-gate.md');
    expect(gate).toContain('Pass-2 status: executed in full');
    expect(gate).toContain('new dok_ids');
    expect(gate).toContain('artifacts extended');
    expect(gate).toContain('flags closed');
    expect(gate).toContain('vintage refresh');
    expect(gate).toContain('run_id');
    expect(gate).toContain('attempt');
  });

  it('methodology-reflection template exposes canonical Pass-2 and Re-run log slots', () => {
    const template = read('analysis/templates/methodology-reflection.md');
    expect(template).toContain('| **Pass-2 status** | `executed in full`');
    expect(template).toContain('## 🔁 Re-run log (improvement-mode only)');
    expect(template).toContain('run_id=`$GITHUB_RUN_ID`');
    expect(template).toContain('attempt=`$GITHUB_RUN_ATTEMPT`');
  });
});
