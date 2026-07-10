/**
 * Contract test: every news-*.md agentic workflow must forward
 * `secrets.IMF_SDMX_SUBSCRIPTION_KEY` to the `news-prewarm` composite
 * action so the IMF Data SDMX API key reaches:
 *
 *   1. `scripts/check-imf-connectivity.ts` (Probe 3, IFS via SDMX 3.0)
 *   2. The agent's `bash:` tool inside `Execute GitHub Copilot CLI`
 *      (via `awf --env-all` after the composite action exports the key
 *      to `$GITHUB_ENV`)
 *
 * Without this forwarding every SDMX 3.0/2.1 `/data/...` request returns
 * HTTP 401/403 from the IMF Azure APIM gateway and the connectivity
 * report records `status: degraded` with reason
 * `sdmx-subscription-key-not-configured` (per
 * `tests/imf-connectivity.test.ts`).
 *
 * The contract is enforced on the source `.md` files, not the generated
 * `.lock.yml` files — recompiling via `gh aw compile` reproduces the
 * `with:` block verbatim into each lock file.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const WORKFLOWS_DIR = join(process.cwd(), '.github', 'workflows');

function listNewsWorkflowSources(): string[] {
  return readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.startsWith('news-') && f.endsWith('.md'))
    .map((f) => join(WORKFLOWS_DIR, f));
}

describe('news-*.md IMF SDMX subscription key forwarding', () => {
  const sources = listNewsWorkflowSources();

  it('discovers all 14 news workflow sources', () => {
    expect(sources.length).toBe(14);
  });

  it.each(sources.map((s) => [basename(s), s]))(
    '%s forwards secrets.IMF_SDMX_SUBSCRIPTION_KEY to news-prewarm composite action',
    (_basename, path) => {
      const content = readFileSync(path, 'utf8');

      // 1. The workflow must reference the local news-prewarm composite
      //    action and keep it unpinned so it always resolves to the latest
      //    version in this repository.
      expect(content).toMatch(/uses:\s*(?:\.\/)?\.github\/actions\/news-prewarm/);

      // 2. Immediately after that `uses:` line the workflow must declare a
      //    `with:` block forwarding the IMF SDMX subscription key from
      //    `secrets.IMF_SDMX_SUBSCRIPTION_KEY`. This is the exact contract
      //    that the news-prewarm action's `imf-sdmx-subscription-key` input
      //    expects (see `.github/actions/news-prewarm/action.yml`).
      const pattern =
        /uses:\s*(?:\.\/)?\.github\/actions\/news-prewarm\s*\n\s*with:\s*\n\s*imf-sdmx-subscription-key:\s*\$\{\{\s*secrets\.IMF_SDMX_SUBSCRIPTION_KEY\s*\}\}/;
      expect(content).toMatch(pattern);
    },
  );
});

describe('news-prewarm composite action declares the IMF SDMX subscription key input', () => {
  it('exposes an `imf-sdmx-subscription-key` input AND exports it to $GITHUB_ENV', () => {
    const path = join(WORKFLOWS_DIR, '..', 'actions', 'news-prewarm', 'action.yml');
    const content = readFileSync(path, 'utf8');

    // Input declared at the YAML inputs: layer.
    expect(content).toMatch(/^\s{2}imf-sdmx-subscription-key:/m);

    // The export step must appear before the IMF pre-flight step so the env
    // var is in scope when scripts/check-imf-connectivity.ts runs.
    const exportIdx = content.indexOf('Export IMF SDMX subscription key to job environment');
    const preflightIdx = content.indexOf('IMF connectivity pre-flight');
    expect(exportIdx).toBeGreaterThan(0);
    expect(preflightIdx).toBeGreaterThan(0);
    expect(exportIdx).toBeLessThan(preflightIdx);

    // The export must publish IMF_SDMX_SUBSCRIPTION_KEY to $GITHUB_ENV
    // (downstream `awf --env-all` then forwards it to the agent container).
    expect(content).toMatch(/IMF_SDMX_SUBSCRIPTION_KEY<<GH_AW_IMF_KEY_EOF/);
    expect(content).toMatch(/>>\s*"\$GITHUB_ENV"/);

    // Defence-in-depth: the secret must be masked in workflow logs.
    expect(content).toMatch(/::add-mask::\$\{IMF_KEY\}/);
  });

  it('does not embed `${{ ... }}` template expressions referencing `secrets` or other unsupported contexts', () => {
    // Composite action manifests are template-evaluated by the runner, but
    // `secrets`, `env`, and `vars` contexts are NOT available inside an
    // `action.yml` (only `inputs`, `github`, `runner`, `job`, `steps`,
    // `matrix`, `strategy`, `hashFiles()`). Embedding `${{ secrets.* }}`
    // anywhere in the manifest — including inside multi-line `description:`
    // blocks or shell `run:` comments — causes the action loader to fail
    // with: `Unrecognized named-value: 'secrets'`. Reference value docs
    // for inputs/comments by their bare name (e.g. `secrets.FOO`) instead.
    const path = join(WORKFLOWS_DIR, '..', 'actions', 'news-prewarm', 'action.yml');
    const content = readFileSync(path, 'utf8');
    const forbidden = content.match(/\$\{\{\s*(secrets|env|vars)\.[^}]*\}\}/g);
    expect(forbidden, `composite action references unsupported context: ${forbidden?.join(', ')}`).toBeNull();
  });
});
