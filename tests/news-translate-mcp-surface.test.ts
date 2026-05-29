/**
 * Guard test for the `news-translate` per-turn MCP / tool-schema surface.
 *
 * Why this exists:
 * - The compiled lock injects every declared MCP server + tool JSON schema into
 *   *every* model turn. The translate agent only uses bash/edit/safe-outputs —
 *   it never calls a data-MCP, a broad github toolset, web-fetch, or
 *   agentic-workflows tool. That dead-weight schema was the dominant driver of
 *   the ~3.5× weighted-token multiplier that aborted run #26641603577
 *   (27.0M weighted / 25M Copilot per-session cap) before the PR shipped.
 * - This test pins the trimmed surface so a future edit to a shared module or a
 *   copy-paste of a content-workflow frontmatter cannot silently re-introduce
 *   the heavy per-turn schema and re-break the token budget.
 *
 * Contract-locked config that is intentionally KEPT (enforced by
 * tests/network-diagnostics.test.ts and carries NO per-turn token cost —
 * network.allowed is firewall egress, safe-outputs.allowed-domains is the
 * output sanitiser, neither is re-sent per model turn):
 *   - the riksdag-regering MCP server URL,
 *   - the uniform network.allowed / safe-outputs.allowed-domains lists,
 *   - the 02-mcp-access.md import (get_sync_status health-gate prose).
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

describe("news-translate trimmed per-turn MCP/tool surface", () => {
  it("declares no scb (pxweb) data MCP server", () => {
    // The frontmatter must not declare the scb server, and the compiled lock
    // must not spawn the pxweb-mcp container in the agent's mcpServers block.
    expect(TRANSLATE_MD).not.toMatch(/^\s*scb:/m);
    expect(TRANSLATE_LOCK).not.toMatch(/pxweb-mcp/);
  });

  it("declares no world-bank data MCP server", () => {
    expect(TRANSLATE_MD).not.toMatch(/^\s*world-bank:/m);
    expect(TRANSLATE_LOCK).not.toMatch(/worldbank-mcp/);
  });

  it("does not load the full github toolset (`toolsets: [all]`)", () => {
    // The agent ships its PR via safe-outputs, independent of the github MCP
    // toolset. `toolsets: [all]` re-bills dozens of tool schemas every turn.
    expect(TRANSLATE_MD).not.toMatch(/toolsets:\s*\n\s*-\s*all/);
    // The compiler's read-only safe-outputs default must not be widened to all.
    expect(TRANSLATE_LOCK).not.toMatch(/"GITHUB_TOOLSETS":\s*"all"/);
  });

  it("keeps the injected github MCP read-only and minimal for safe-outputs", () => {
    // gh-aw auto-provisions a read-only github MCP for the create_pull_request
    // safe-output. That is fine; just assert it stays the minimal read-only set
    // and never regains write access or the `all` toolset.
    expect(TRANSLATE_LOCK).toMatch(/"GITHUB_READ_ONLY":\s*"1"/);
  });

  it("drops web-fetch and agentic-workflows tools", () => {
    expect(TRANSLATE_MD).not.toMatch(/^\s*web-fetch:/m);
    expect(TRANSLATE_MD).not.toMatch(/^\s*agentic-workflows:/m);
  });

  it("narrows the kept riksdag-regering server to the health-gate tool only", () => {
    // riksdag-regering MUST stay declared (its URL is asserted by
    // network-diagnostics.test.ts) but its per-turn tool schema is reduced from
    // the full ~32-tool surface (`allowed: ["*"]`) to a single tool.
    expect(TRANSLATE_MD).toMatch(
      /riksdag-regering:[\s\S]*?allowed:\s*\["get_sync_status"\]/,
    );
    // Broad data tools must not appear in the compiled riksdag tool list.
    expect(TRANSLATE_LOCK).not.toMatch(/"search_dokument"/);
    expect(TRANSLATE_LOCK).not.toMatch(/"get_voting_group"/);
  });

  it("keeps the contract-required riksdag-regering MCP URL", () => {
    expect(TRANSLATE_LOCK).toMatch(
      /https:\/\/riksdag-regering-ai\.onrender\.com\/mcp/,
    );
  });

  it("re-baselines max_langs default to 13 (a full source in one run)", () => {
    // The throughput cap is no longer the limiter once the per-turn surface is
    // slim, so the default returns to translating all 13 languages per run.
    expect(TRANSLATE_MD).toMatch(/MAX_LANGS="\$\{MAX_LANGS_INPUT:-13\}"/);
  });
});
