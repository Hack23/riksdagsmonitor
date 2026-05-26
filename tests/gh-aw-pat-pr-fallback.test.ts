/**
 * Tests for `scripts/gh-aw-pat-pr-fallback.sh`.
 *
 * Exercises the four documented scenarios in dry-run mode (no remote pushes,
 * no `gh pr create` calls):
 *
 *   1. Primary path — bundle + manifest present.
 *   2. Primary path — bundle only (branch derived from bundle).
 *   3. Secondary path — `session not found` + dirty workspace + aw-*.patch.
 *   4. No-op — nothing to recover.
 *
 * The script is driven via `bash` with a sandbox `/tmp/gh-aw/` produced fresh
 * for each scenario inside the test temp dir, so suites are hermetic.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'gh-aw-pat-pr-fallback.sh');

type RunResult = {
  status: number;
  stdout: string;
  stderr: string;
  audit: string;
};

interface RunOptions {
  ghAwDir: string;
  hostRepoDir: string;
  env?: Record<string, string>;
  /** When true, do not set GH_AW_PAT_FALLBACK_MANIFEST so the script's
   *  built-in auto-probe of /tmp/gh-aw/agent/aw-fallback.json (and the
   *  legacy /tmp/gh-aw/aw-fallback.json) is exercised. */
  skipManifestOverride?: boolean;
}

function runScript(opts: RunOptions): RunResult {
  const auditPath = path.join(opts.ghAwDir, 'fallback-events.jsonl');
  const summaryPath = path.join(opts.ghAwDir, 'step-summary.md');
  fs.writeFileSync(summaryPath, '');
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    ...opts.env,
    // Per-test sandbox of the auto-probe paths so the script never reads or
    // writes the real `/tmp/gh-aw/...` shared by every test.
    GH_AW_PAT_FALLBACK_MANIFEST_PRIMARY: path.join(opts.ghAwDir, 'agent', 'aw-fallback.json'),
    GH_AW_PAT_FALLBACK_MANIFEST_LEGACY: path.join(opts.ghAwDir, 'aw-fallback.json'),
    GH_AW_PAT_FALLBACK_STDIO_LOG: path.join(opts.ghAwDir, 'agent-stdio.log'),
    GH_AW_PAT_FALLBACK_AUDIT_LOG: auditPath,
    GH_AW_PAT_FALLBACK_SAFEOUTPUTS_FILE: path.join(opts.ghAwDir, 'safeoutputs.jsonl'),
    GH_AW_PAT_FALLBACK_DRY_RUN: '1',
    GH_AW_PAT_PR_FALLBACK_TOKEN: 'ghp_dummytoken_for_dryrun',
    GITHUB_REPOSITORY: opts.env?.GITHUB_REPOSITORY ?? 'Hack23/riksdagsmonitor',
    GITHUB_SERVER_URL: 'https://github.com',
    GITHUB_RUN_ID: '999',
    GITHUB_STEP_SUMMARY: summaryPath,
    DEFAULT_BRANCH: 'main',
  };
  // Most scenarios exercise the historical aw-fallback.bundle path. Tests can
  // provide GH_AW_PAT_FALLBACK_BUNDLE explicitly to cover alternate bundle names.
  if (!opts.env?.GH_AW_PAT_FALLBACK_BUNDLE) {
    env.GH_AW_PAT_FALLBACK_BUNDLE = path.join(opts.ghAwDir, 'aw-fallback.bundle');
  }
  if (!opts.skipManifestOverride) {
    env.GH_AW_PAT_FALLBACK_MANIFEST = path.join(opts.ghAwDir, 'aw-fallback.json');
  }
  const result = spawnSync('bash', [SCRIPT], {
    cwd: opts.hostRepoDir,
    env,
    encoding: 'utf8',
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout,
    stderr: result.stderr,
    audit: fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf8') : '',
  };
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

/**
 * Build a host-side checkout (mimics `actions/checkout@v6 ref: main`).
 */
function makeHostRepo(rootTmp: string): string {
  const dir = path.join(rootTmp, 'host');
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q', '-b', 'main']);
  git(dir, ['config', 'user.email', 'test@example.invalid']);
  git(dir, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(dir, 'README.md'), '# host\n');
  git(dir, ['add', '.']);
  git(dir, ['commit', '-q', '-m', 'initial']);
  return dir;
}

/**
 * Build a sandbox-side bundle for a fictitious news commit, returning paths
 * suitable for /tmp/gh-aw/aw-fallback.{bundle,json}.
 */
function makeBundleHandoff(
  rootTmp: string,
  hostRepoDir: string,
  branch: string,
): { bundlePath: string; manifest: Record<string, unknown>; headSha: string; parentSha: string } {
  const sandbox = path.join(rootTmp, 'sandbox');
  fs.mkdirSync(sandbox, { recursive: true });
  // Clone host as base.
  execFileSync('git', ['clone', '-q', hostRepoDir, sandbox]);
  git(sandbox, ['config', 'user.email', 'agent@example.invalid']);
  git(sandbox, ['config', 'user.name', 'Agent']);
  const parentSha = git(sandbox, ['rev-parse', 'HEAD']).trim();
  git(sandbox, ['checkout', '-q', '-b', branch]);
  const dir = path.join(sandbox, 'analysis', 'daily', '2026-04-28', 'week-in-review');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'article.md'), '# Sample Headline\n\nBody.\n');
  fs.writeFileSync(path.join(dir, 'synthesis-summary.md'), 'sum\n');
  git(sandbox, ['add', '.']);
  git(sandbox, ['commit', '-q', '-m', 'news: sample']);
  const headSha = git(sandbox, ['rev-parse', 'HEAD']).trim();
  const bundlePath = path.join(rootTmp, 'aw-fallback.bundle');
  execFileSync('git', ['bundle', 'create', bundlePath, branch, '--not', 'main'], { cwd: sandbox });
  const manifest = {
    branch,
    head_sha: headSha,
    parent_sha: parentSha,
    slug: 'week-in-review',
    today: '2026-04-28',
    analysis_dir: 'analysis/daily/2026-04-28/week-in-review',
    article_md_path: 'analysis/daily/2026-04-28/week-in-review/article.md',
    title: 'Sample Headline',
    body_summary: 'Sandbox commit produced for week-in-review on 2026-04-28.',
    gate_result: 'GREEN',
    protected_paths: ['.github/', 'package.json'],
    generated_at: new Date().toISOString(),
  };
  return { bundlePath, manifest, headSha, parentSha };
}

let rootTmp: string;

beforeEach(() => {
  rootTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-aw-pat-fallback-'));
});

afterEach(() => {
  fs.rmSync(rootTmp, { recursive: true, force: true });
});

describe('gh-aw-pat-pr-fallback.sh', () => {
  it('script is executable and bash-syntax clean (and shellcheck-clean if available)', () => {
    const stat = fs.statSync(SCRIPT);
    // owner-execute bit
    expect(stat.mode & 0o100).toBe(0o100);
    // bash -n syntax check
    const r = spawnSync('bash', ['-n', SCRIPT], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    // Run shellcheck if installed (CI image has it pre-installed); skip
    // silently if not so the suite stays portable.
    const shellcheckProbe = spawnSync('shellcheck', ['--version'], { encoding: 'utf8' });
    if (shellcheckProbe.status === 0) {
      const sc = spawnSync('shellcheck', [SCRIPT], { encoding: 'utf8' });
      if (sc.status !== 0) {
        throw new Error(`shellcheck reported issues:\n${sc.stdout}\n${sc.stderr}`);
      }
    }
  });

  it('scenario 1: primary path with bundle + manifest succeeds (dry run)', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    const branch = 'news/2026-04-28-week-in-review-run-999';
    const handoff = makeBundleHandoff(rootTmp, hostRepoDir, branch);
    fs.copyFileSync(handoff.bundlePath, path.join(ghAwDir, 'aw-fallback.bundle'));
    fs.writeFileSync(path.join(ghAwDir, 'aw-fallback.json'), JSON.stringify(handoff.manifest));
    // Empty safeoutputs.jsonl — agent never created the PR.
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');

    const result = runScript({ ghAwDir, hostRepoDir });
    expect(result.status).toBe(0);
    expect(result.audit).toMatch(/"event":"primary_start"/);
    expect(result.audit).toMatch(/"event":"dry_run_success"/);
    expect(result.audit).toMatch(/"message":"primary path"/);
    expect(result.audit).toMatch(new RegExp(`"branch":"${branch}"`));
  });

  it('scenario 1b: auto-probes manifest at agent/aw-fallback.json (current contract location)', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(path.join(ghAwDir, 'agent'), { recursive: true });
    const branch = 'news/2026-04-28-week-in-review-run-autoprobe';
    const handoff = makeBundleHandoff(rootTmp, hostRepoDir, branch);
    fs.copyFileSync(handoff.bundlePath, path.join(ghAwDir, 'aw-fallback.bundle'));
    // Write manifest ONLY at the new contract location — no env override.
    fs.writeFileSync(
      path.join(ghAwDir, 'agent', 'aw-fallback.json'),
      JSON.stringify(handoff.manifest),
    );
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');

    const result = runScript({ ghAwDir, hostRepoDir, skipManifestOverride: true });
    expect(result.status).toBe(0);
    expect(result.audit).toMatch(/"event":"primary_start"/);
    expect(result.audit).toMatch(/"event":"dry_run_success"/);
    expect(result.audit).toMatch(new RegExp(`"branch":"${branch}"`));
  });

  it('scenario 2: primary path with bundle only derives branch from bundle', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    const branch = 'news/2026-04-28-week-in-review-run-bundleonly';
    const handoff = makeBundleHandoff(rootTmp, hostRepoDir, branch);
    fs.copyFileSync(handoff.bundlePath, path.join(ghAwDir, 'aw-fallback.bundle'));
    // No manifest!
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');

    const result = runScript({ ghAwDir, hostRepoDir });
    expect(result.status).toBe(0);
    expect(result.audit).toMatch(/"event":"primary_start"/);
    expect(result.audit).toMatch(/"event":"dry_run_success"/);
    // Bundle-derived branch must surface in the audit.
    expect(result.audit).toMatch(new RegExp(`"branch":"${branch}"`));
  });

  it('scenario 3: secondary path on session-not-found + dirty workspace', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    // Dirty the workspace to simulate the legacy path.
    const dirtyDir = path.join(hostRepoDir, 'analysis', 'daily', '2026-04-28', 'week-in-review');
    fs.mkdirSync(dirtyDir, { recursive: true });
    fs.writeFileSync(path.join(dirtyDir, 'synthesis-summary.md'), 'sum\n');
    fs.writeFileSync(path.join(dirtyDir, 'article.md'), '# Sample\n');
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    fs.writeFileSync(path.join(ghAwDir, 'agent-stdio.log'), 'some output\nMCP error: session not found\nmore\n');
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');

    const result = runScript({
      ghAwDir,
      hostRepoDir,
      env: { GH_AW_PAT_FALLBACK_SLUG: 'week-in-review' },
    });
    expect(result.status).toBe(0);
    expect(result.audit).toMatch(/"event":"secondary_start"/);
    expect(result.audit).toMatch(/"event":"dry_run_success"/);
    expect(result.audit).toMatch(/"message":"secondary path"/);
  });

  it('scenario 4: no-op when no handoff and no session-not-found marker', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');
    // No bundle, no manifest, no patch, no stdio session-not-found.

    const result = runScript({ ghAwDir, hostRepoDir });
    expect(result.status).toBe(0);
    expect(result.audit).toMatch(/"event":"noop"/);
    expect(result.audit).not.toMatch(/"event":"primary_/);
    expect(result.audit).not.toMatch(/"event":"secondary_/);
  });

  it('skip when safeoutputs already created the PR', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    // safeoutputs *did* create the PR — fallback must skip.
    fs.writeFileSync(
      path.join(ghAwDir, 'safeoutputs.jsonl'),
      '{"type":"create_pull_request","title":"📰 Foo","body":"x"}\n',
    );
    const branch = 'news/2026-04-28-week-in-review-run-skip';
    const handoff = makeBundleHandoff(rootTmp, hostRepoDir, branch);
    // Even with a bundle present, the skip MUST win.
    fs.copyFileSync(handoff.bundlePath, path.join(ghAwDir, 'aw-fallback.bundle'));
    fs.writeFileSync(path.join(ghAwDir, 'aw-fallback.json'), JSON.stringify(handoff.manifest));

    const result = runScript({
      ghAwDir,
      hostRepoDir,
      env: { GH_AW_PAT_FALLBACK_TRIGGER_CONCLUSION: 'success' },
    });
    expect(result.status).toBe(0);
    expect(result.audit).toMatch(/"event":"skip"/);
    expect(result.audit).not.toMatch(/"event":"primary_start"/);
  });

  it('recovers failed safeoutputs aw-main bundle instead of treating the request as success', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    const sandbox = path.join(rootTmp, 'sandbox-aw-main');
    fs.mkdirSync(sandbox, { recursive: true });
    execFileSync('git', ['clone', '-q', hostRepoDir, sandbox]);
    git(sandbox, ['config', 'user.email', 'agent@example.invalid']);
    git(sandbox, ['config', 'user.name', 'Agent']);
    const dir = path.join(sandbox, 'analysis', 'daily', '2026-05-08', 'committee-reports');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'article.md'), '# Committee Report\n\nBody.\n');
    git(sandbox, ['add', '.']);
    git(sandbox, ['commit', '-q', '-m', 'news: committee report']);
    const bundlePath = path.join(rootTmp, 'aw-main.bundle');
    execFileSync('git', ['bundle', 'create', bundlePath, 'main'], { cwd: sandbox });
    fs.copyFileSync(bundlePath, path.join(ghAwDir, 'aw-main.bundle'));
    fs.writeFileSync(
      path.join(ghAwDir, 'safeoutputs.jsonl'),
      '{"type":"create_pull_request","title":"📰 Committee Reports — 2026-05-08","body":"x"}\n',
    );

    const result = runScript({
      ghAwDir,
      hostRepoDir,
      env: {
        GH_AW_PAT_FALLBACK_SLUG: 'committee-reports',
        GH_AW_PAT_FALLBACK_BUNDLE: path.join(ghAwDir, 'aw-main.bundle'),
        GH_AW_PAT_FALLBACK_SOURCE_RUN_ID: '25537084240',
        GH_AW_PAT_FALLBACK_TRIGGER_CONCLUSION: 'failure',
        TODAY: '2026-05-08',
      },
    });
    expect(result.status).toBe(0);
    expect(result.audit).toMatch(/"event":"primary_start"/);
    expect(result.audit).toMatch(/safeoutputs aw-main bundle ref renamed for recovery/);
    expect(result.audit).toMatch(/"branch":"news\/2026-05-08-committee-reports-run-25537084240"/);
    expect(result.audit).not.toMatch(/"event":"skip"/);
  });

  it('fails non-zero when manifest is malformed JSON', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    const branch = 'news/2026-04-28-week-in-review-run-badjson';
    const handoff = makeBundleHandoff(rootTmp, hostRepoDir, branch);
    fs.copyFileSync(handoff.bundlePath, path.join(ghAwDir, 'aw-fallback.bundle'));
    fs.writeFileSync(path.join(ghAwDir, 'aw-fallback.json'), '{not-json');
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');

    const result = runScript({ ghAwDir, hostRepoDir });
    expect(result.status).not.toBe(0);
    expect(result.audit).toMatch(/"event":"error"/);
  });

  it('refuses to push when recovered branch equals the default branch', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    // Build a bundle whose actual head IS `main`. The script must refuse to
    // force-push it to origin/main even though the manifest agrees.
    const sandbox = path.join(rootTmp, 'sandbox-main');
    fs.mkdirSync(sandbox, { recursive: true });
    execFileSync('git', ['clone', '-q', hostRepoDir, sandbox]);
    git(sandbox, ['config', 'user.email', 'a@a']);
    git(sandbox, ['config', 'user.name', 'a']);
    // Add a benign commit on main itself.
    fs.writeFileSync(path.join(sandbox, 'EVIL.md'), 'tamper\n');
    git(sandbox, ['add', '.']);
    git(sandbox, ['commit', '-q', '-m', 'rogue main commit']);
    const bundlePath = path.join(rootTmp, 'aw-fallback-main.bundle');
    // `git bundle create … main` would have no upstream to compare with —
    // bundle the single tip ref directly.
    execFileSync('git', ['bundle', 'create', bundlePath, 'main'], { cwd: sandbox });
    fs.copyFileSync(bundlePath, path.join(ghAwDir, 'aw-fallback.bundle'));
    fs.writeFileSync(
      path.join(ghAwDir, 'aw-fallback.json'),
      JSON.stringify({
        branch: 'main',
        head_sha: git(sandbox, ['rev-parse', 'HEAD']).trim(),
        parent_sha: git(sandbox, ['rev-parse', 'HEAD~1']).trim(),
        slug: 'rogue',
        today: '2026-04-28',
        title: 'Rogue',
      }),
    );
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');

    const result = runScript({ ghAwDir, hostRepoDir });
    expect(result.status).not.toBe(0);
    expect(result.audit).toMatch(/refusing to push to protected branch/);
    expect(result.audit).not.toMatch(/"event":"primary_created"/);
    expect(result.audit).not.toMatch(/"event":"dry_run_success"/);
  });

  it('refuses to push when recovered commit modifies protected paths', () => {
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    // Build a bundle whose commit touches .github/ — must be rejected.
    const sandbox = path.join(rootTmp, 'sandbox-bad');
    fs.mkdirSync(sandbox, { recursive: true });
    execFileSync('git', ['clone', '-q', hostRepoDir, sandbox]);
    git(sandbox, ['config', 'user.email', 'a@a']);
    git(sandbox, ['config', 'user.name', 'a']);
    const branch = 'news/2026-04-28-bad-paths';
    git(sandbox, ['checkout', '-q', '-b', branch]);
    fs.mkdirSync(path.join(sandbox, '.github', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(sandbox, '.github', 'workflows', 'evil.yml'), 'name: evil\n');
    git(sandbox, ['add', '.']);
    git(sandbox, ['commit', '-q', '-m', 'tamper']);
    const bundlePath = path.join(rootTmp, 'aw-fallback-bad.bundle');
    execFileSync('git', ['bundle', 'create', bundlePath, branch, '--not', 'main'], { cwd: sandbox });
    fs.copyFileSync(bundlePath, path.join(ghAwDir, 'aw-fallback.bundle'));
    fs.writeFileSync(
      path.join(ghAwDir, 'aw-fallback.json'),
      JSON.stringify({
        branch,
        head_sha: git(sandbox, ['rev-parse', 'HEAD']).trim(),
        parent_sha: git(sandbox, ['rev-parse', 'HEAD~1']).trim(),
        slug: 'bad-paths',
        today: '2026-04-28',
        title: 'Bad',
      }),
    );
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');

    const result = runScript({ ghAwDir, hostRepoDir });
    expect(result.status).not.toBe(0);
    expect(result.audit).toMatch(/recovered commit touches protected paths/);
    expect(result.audit).not.toMatch(/"event":"primary_created"/);
  });

  it('preflight: exits as a no-op when safeoutputs primary path already opened the PR at recovered SHA', () => {
    // This guards Finding 3: previously the fallback always pushed and then
    // `gh pr edit`-clobbered the safeoutputs-authored title/body. Now the
    // script `gh pr list`s for the recovered branch BEFORE pushing; if a PR
    // already exists with headRefOid === recovered_sha, the script exits 0
    // without pushing or editing.
    const hostRepoDir = makeHostRepo(rootTmp);
    const ghAwDir = path.join(rootTmp, 'gh-aw');
    fs.mkdirSync(ghAwDir, { recursive: true });
    const branch = 'news/2026-04-28-week-in-review-run-preflight';
    const handoff = makeBundleHandoff(rootTmp, hostRepoDir, branch);
    fs.copyFileSync(handoff.bundlePath, path.join(ghAwDir, 'aw-fallback.bundle'));
    fs.writeFileSync(path.join(ghAwDir, 'aw-fallback.json'), JSON.stringify(handoff.manifest));
    // safeoutputs.jsonl is empty so the skip-when-PR-already-created branch
    // does NOT take effect — the script must reach the preflight `gh pr list`
    // call to detect that safeoutputs nevertheless succeeded.
    fs.writeFileSync(path.join(ghAwDir, 'safeoutputs.jsonl'), '');

    // PATH shim: fake `gh` that returns a PR whose headRefOid equals the
    // recovered SHA. Real `git` is symlinked in alongside it so the rest of
    // the script (rev-parse, bundle verify, etc.) functions normally.
    const shimDir = path.join(rootTmp, 'shim');
    fs.mkdirSync(shimDir, { recursive: true });
    const ghShim = path.join(shimDir, 'gh');
    fs.writeFileSync(
      ghShim,
      `#!/usr/bin/env bash\n` +
        `# Fake gh: handle the preflight \`gh pr list\` call and \`gh auth status\`.\n` +
        `if [ "$1" = "auth" ] && [ "$2" = "status" ]; then\n` +
        `  echo "fake gh: authenticated"; exit 0\n` +
        `fi\n` +
        `if [ "$1" = "pr" ] && [ "$2" = "list" ]; then\n` +
        `  printf '{"number":4242,"url":"https://github.com/Hack23/riksdagsmonitor/pull/4242","headRefOid":"${handoff.headSha}"}\\n'\n` +
        `  exit 0\n` +
        `fi\n` +
        `echo "fake gh: unexpected args $*" >&2; exit 99\n`,
    );
    fs.chmodSync(ghShim, 0o755);
    const realGit = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim();
    fs.symlinkSync(realGit, path.join(shimDir, 'git'));

    // Inline spawnSync (the shared runScript helper hardcodes DRY_RUN=1;
    // we need DRY_RUN=0 here so the preflight check is reached).
    const auditPath = path.join(ghAwDir, 'fallback-events.jsonl');
    const summaryPath = path.join(ghAwDir, 'step-summary.md');
    fs.writeFileSync(summaryPath, '');
    const r = spawnSync('bash', [SCRIPT], {
      cwd: hostRepoDir,
      env: {
        PATH: `${shimDir}:${process.env.PATH}`,
        HOME: process.env.HOME,
        GH_AW_PAT_FALLBACK_MANIFEST_PRIMARY: path.join(ghAwDir, 'agent', 'aw-fallback.json'),
        GH_AW_PAT_FALLBACK_MANIFEST_LEGACY: path.join(ghAwDir, 'aw-fallback.json'),
        GH_AW_PAT_FALLBACK_STDIO_LOG: path.join(ghAwDir, 'agent-stdio.log'),
        GH_AW_PAT_FALLBACK_AUDIT_LOG: auditPath,
        GH_AW_PAT_FALLBACK_SAFEOUTPUTS_FILE: path.join(ghAwDir, 'safeoutputs.jsonl'),
        GH_AW_PAT_FALLBACK_MANIFEST: path.join(ghAwDir, 'aw-fallback.json'),
        GH_AW_PAT_FALLBACK_BUNDLE: path.join(ghAwDir, 'aw-fallback.bundle'),
        GH_AW_PAT_FALLBACK_DRY_RUN: '0',
        GH_AW_PAT_PR_FALLBACK_TOKEN: 'ghp_dummytoken_for_test',
        GITHUB_REPOSITORY: 'Hack23/riksdagsmonitor',
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '999',
        GITHUB_STEP_SUMMARY: summaryPath,
        DEFAULT_BRANCH: 'main',
      },
      encoding: 'utf8',
    });
    const audit = fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf8') : '';

    expect(r.status, `stderr was:\n${r.stderr}\naudit:\n${audit}`).toBe(0);
    expect(audit).toMatch(/"event":"primary_start"/);
    expect(audit).toMatch(/"event":"primary_noop_safeoutputs_succeeded"/);
    expect(audit).toMatch(/"pr":4242/);
    expect(audit).toMatch(new RegExp(`"head_sha":"${handoff.headSha}"`));
    // Crucially: must NOT have reached the push or edit paths.
    expect(audit).not.toMatch(/"event":"primary_created"/);
    expect(audit).not.toMatch(/"event":"primary_updated"/);
    expect(audit).not.toMatch(/"event":"dry_run_success"/);
  });
});
