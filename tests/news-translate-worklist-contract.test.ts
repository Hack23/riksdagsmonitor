/**
 * Contract test for the `news-translate` worklist step.
 *
 * Why this exists:
 * - The agent runs inside an AWF container that mounts only
 *   `${RUNNER_TEMP}/gh-aw` and `${GITHUB_WORKSPACE}` from the runner. Files
 *   written to `/tmp/...` on the runner are NOT visible to the agent's bash
 *   sandbox, and step outputs (`steps.X.outputs.Y`) are never propagated
 *   into the sandbox at all.
 * - The fix moves the worklist file under `${GITHUB_WORKSPACE}` and writes
 *   every output to `$GITHUB_ENV` so `awf --env-all` forwards them.
 *
 * This test guards against accidental regressions to either path (the
 * `/tmp/...` writes silently break the agent without failing CI).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const TRANSLATE_MD = readFileSync(
  join(REPO_ROOT, ".github/workflows/news-translate.md"),
  "utf8",
);
const TRANSLATE_LOCK = readFileSync(
  join(REPO_ROOT, ".github/workflows/news-translate.lock.yml"),
  "utf8",
);
const BASE_CONTRACT = readFileSync(
  join(REPO_ROOT, ".github/prompts/00-base-contract.md"),
  "utf8",
);
const GITIGNORE = readFileSync(join(REPO_ROOT, ".gitignore"), "utf8");

describe("news-translate worklist propagation to agent sandbox", () => {
  it("never writes the worklist file to /tmp (runner-only, invisible to AWF container)", () => {
    expect(TRANSLATE_MD).not.toMatch(/\/tmp\/exec-brief-worklist\.txt/);
    expect(TRANSLATE_LOCK).not.toMatch(/\/tmp\/exec-brief-worklist\.txt/);
  });

  it("writes the worklist file under ${GITHUB_WORKSPACE} so AWF --add-dir exposes it", () => {
    // Path must use GITHUB_WORKSPACE so the agent can `cat` it.
    expect(TRANSLATE_MD).toMatch(
      /WORKLIST_FILE="\$\{GITHUB_WORKSPACE\}\/\.exec-brief-worklist\.txt"/,
    );
    expect(TRANSLATE_LOCK).toMatch(
      /WORKLIST_FILE=\\"\$\{GITHUB_WORKSPACE\}\/\.exec-brief-worklist\.txt\\"/,
    );
  });

  it("writes TRANSLATION_WORKLIST and friends to $GITHUB_ENV (not only $GITHUB_OUTPUT)", () => {
    // The source markdown must emit each canonical env var into $GITHUB_ENV.
    // Step outputs alone never reach the agent — only env vars do.
    const required = [
      "TRANSLATION_WORKLIST",
      "TRANSLATION_LANGS",
      "MAX_BRIEFS",
      "MAX_BRIEFS_RESOLVED",
      "MISSING_COUNT",
      "DRIFT_COUNT",
      "EXEC_BRIEF_WORKLIST_FILE",
    ];
    for (const name of required) {
      // The emit_bundle helper writes each name once to $GITHUB_OUTPUT and
      // once to $GITHUB_ENV; both branches must mention it.
      const matches = TRANSLATE_MD.match(new RegExp(`echo "${name}=`, "g"));
      expect(matches, `expected ${name} echo to appear in worklist step`).toBeTruthy();
      // At least 2 occurrences (one for $GITHUB_OUTPUT, one for $GITHUB_ENV).
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    }
    // Confirm both sink targets are present.
    expect(TRANSLATE_MD).toMatch(/} >> "\$GITHUB_OUTPUT"/);
    expect(TRANSLATE_MD).toMatch(/} >> "\$GITHUB_ENV"/);
  });

  it("agent prompt body reads env vars, not unreachable step outputs", () => {
    // The agent has no access to `steps.X.outputs.Y`. Any reference to those
    // expressions in the agent prompt body is a silent contract violation:
    // the agent reads the text literally and falls back to ad-hoc behavior.
    const promptBodyStart = TRANSLATE_MD.indexOf("# 🌐 News Translate");
    expect(promptBodyStart).toBeGreaterThan(0);
    const promptBody = TRANSLATE_MD.slice(promptBodyStart);
    expect(
      promptBody,
      "agent prompt must not reference steps.worklist.outputs.* (unreachable from sandbox)",
    ).not.toMatch(/steps\.worklist\.outputs\./);
    // It must read the canonical env vars instead.
    expect(promptBody).toMatch(/\$TRANSLATION_WORKLIST/);
    expect(promptBody).toMatch(/\$TRANSLATION_LANGS/);
    expect(promptBody).toMatch(/\$EXEC_BRIEF_WORKLIST_FILE/);
  });

  it("base contract documents the news-translate runtime env vars", () => {
    // The runtime input contract module is the agent's single source of
    // truth for what's exported into its sandbox; it must mention every new
    // worklist env var so agents reading the contract know they exist.
    expect(BASE_CONTRACT).toMatch(/`TRANSLATION_WORKLIST`/);
    expect(BASE_CONTRACT).toMatch(/`TRANSLATION_LANGS`/);
    expect(BASE_CONTRACT).toMatch(/`EXEC_BRIEF_WORKLIST_FILE`/);
    expect(BASE_CONTRACT).toMatch(/`MISSING_COUNT`/);
    expect(BASE_CONTRACT).toMatch(/`DRIFT_COUNT`/);
  });

  it(".gitignore excludes the workspace-scoped worklist file", () => {
    // The file is regenerated each run; it must never be committed.
    expect(GITIGNORE).toMatch(/^\.exec-brief-worklist\.txt$/m);
  });

  it("emit_bundle is used in every exit path of the worklist step (no leaked OUTPUT-only writes)", () => {
    // Each exit must go through emit_bundle so the env-var contract is
    // honoured even on the empty-worklist and missing-directory paths.
    // The legacy `echo "TRANSLATION_WORKLIST=" >> "$GITHUB_OUTPUT"` pattern
    // (no $GITHUB_ENV write) must be gone.
    const legacyEmptyMatches = TRANSLATE_MD.match(
      /echo "TRANSLATION_WORKLIST=" >> "\$GITHUB_OUTPUT"/g,
    );
    expect(legacyEmptyMatches).toBeNull();
  });

  it("caps the per-run language batch via max_langs (effective-token control)", () => {
    // Run #26641603577 aborted with a 429 weighted-effective-token error
    // because all 13 languages of one source were translated in a single
    // Copilot session — but the dominant cost was the fixed per-turn tool
    // schema (github toolsets:[all] + three data-MCP servers) re-sent every
    // turn, not the language count itself. With that dead-weight surface
    // stripped (the agent only uses bash/edit/safe-outputs), a full
    // 13-language source fits under the cap, so the default returns to 13.
    // The builder must still expose a max_langs input, resolve it, and
    // truncate the still-needed languages to it before emitting
    // TRANSLATION_LANGS.
    // 1. workflow_dispatch input exists.
    expect(TRANSLATE_MD).toMatch(/max_langs:/);
    expect(TRANSLATE_LOCK).toMatch(/max_langs:/);
    // 2. The builder forwards the input into the step env and resolves it.
    expect(TRANSLATE_MD).toMatch(
      /MAX_LANGS_INPUT:\s*\$\{\{\s*github\.event\.inputs\.max_langs\s*\}\}/,
    );
    expect(TRANSLATE_MD).toMatch(/MAX_LANGS="\$\{MAX_LANGS_INPUT:-13\}"/);
    // 3. The capped batch (RUN_LANGS) — not the full requested $LANGS — is
    //    what gets emitted as the run's TRANSLATION_LANGS.
    expect(TRANSLATE_MD).toMatch(/RUN_LANG_LIST\b/);
    expect(TRANSLATE_MD).toMatch(/-ge "\$MAX_LANGS"/);
    expect(TRANSLATE_MD).toMatch(/emit_bundle "\$WORKLIST_JOINED" "\$RUN_LANGS"/);
  });

  it("scopes the agent's validator calls to the per-run language batch", () => {
    // When languages are capped, the validator must only check the run's
    // batch (--lang "$TRANSLATION_LANGS"), otherwise deferred languages are
    // reported as missing and the agent re-reads them, defeating the cap.
    const promptBodyStart = TRANSLATE_MD.indexOf("# 🌐 News Translate");
    const promptBody = TRANSLATE_MD.slice(promptBodyStart);
    const validatorCalls = promptBody.match(
      /validate-executive-brief-translations\.ts --source <source>/g,
    );
    expect(validatorCalls).not.toBeNull();
    // Every `--source <source>` validator call in the agent body must carry
    // the --lang "$TRANSLATION_LANGS" scope.
    const scopedCalls = promptBody.match(
      /validate-executive-brief-translations\.ts --source <source> --lang "\$TRANSLATION_LANGS"/g,
    );
    expect(scopedCalls?.length).toBe(validatorCalls?.length);
  });
});
