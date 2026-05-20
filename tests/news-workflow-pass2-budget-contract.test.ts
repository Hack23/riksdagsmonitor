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
    // Canonical literals enforced by .github/prompts/05-analysis-gate.md:
    //   - `Pass-2 status: executed in full` (with colon, NOT a table cell)
    //   - heading `^## Re-run log` (no emoji, no parenthetical)
    //   - `run_id=<digits>` / `attempt=<digits>` WITHOUT backticks
    expect(template).toContain('Pass-2 status: executed in full');
    expect(template).toMatch(/^## Re-run log\s*$/m);
    expect(template).toContain('run_id=$GITHUB_RUN_ID');
    expect(template).toContain('attempt=$GITHUB_RUN_ATTEMPT');
    expect(template).not.toContain('run_id=`$GITHUB_RUN_ID`');
    expect(template).not.toContain('## 🔁 Re-run log');
  });

  it('time-budget self-monitoring helper is defined in 01 and consumed by 02/03/04/05/06', () => {
    // The helper anchor `/tmp/gh-aw/agent-start.epoch` is defined in
    // 01-bash-and-shell-safety.md §Time-budget self-monitoring. Every prompt
    // module that executes a major phase MUST either reference `agent_minute`
    // (the operational clock) or the anchor file path so the agent has
    // a concrete time signal at the phase transition.
    const safety = read('.github/prompts/01-bash-and-shell-safety.md');
    expect(safety).toContain('## Time-budget self-monitoring');
    expect(safety).toContain('/tmp/gh-aw/agent-start.epoch');
    expect(safety).toContain('agent_minute');

    const contract = read('.github/prompts/00-base-contract.md');
    expect(contract).toContain('Phase budget');
    expect(contract).toContain('agent_minute');

    for (const f of [
      '.github/prompts/02-mcp-access.md',
      '.github/prompts/03-data-download.md',
      '.github/prompts/04-analysis-pipeline.md',
      '.github/prompts/05-analysis-gate.md',
      '.github/prompts/06-article-generation.md',
    ]) {
      const src = read(f);
      expect(src, `${f} must reference agent_minute or the time-budget anchor`).toMatch(
        /agent_minute|agent-start\.epoch|Time-budget self-monitoring/,
      );
    }
  });

  it('early-scaffold marker is mandated in 03-data-download.md', () => {
    // Closes the no-op #1 hole: an MCP-from-start failure must still produce
    // a non-empty diff because the scaffold manifest is written BEFORE the
    // first MCP call. See .github/prompts/07-commit-and-pr.md §No-op policy #1.
    const download = read('.github/prompts/03-data-download.md');
    expect(download).toContain('## Early-scaffold marker');
    expect(download).toMatch(/before.*first MCP call/i);
    expect(download).toContain('data-download-manifest.md');

    const commit = read('.github/prompts/07-commit-and-pr.md');
    // No-op condition #1 now requires BOTH the scaffold write to have failed
    // AND MCP to be unreachable — narrower than the old "MCP unreachable" alone.
    expect(commit).toMatch(/scaffold[- ]write.*failed/i);
  });
});
