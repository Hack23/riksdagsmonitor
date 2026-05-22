/**
 * @file no-external-cdn.test.ts
 * @description CI guard ensuring no runtime JavaScript or rendered HTML
 *              article loads code from an external CDN. Riksdagsmonitor
 *              serves all JavaScript from its own S3/CloudFront origin
 *              (`riksdagsmonitor.com`) — third-party script-src is forbidden
 *              by `SECURITY_ARCHITECTURE.md` and `THREAT_MODEL.md` and
 *              prevents the platform from inheriting CDN compromise risk
 *              (CIS Controls v8.1 §16.11, ISO 27001:2022 A.8.28).
 *
 *              The guard scans:
 *                - `js/` runtime JavaScript (`.js`, `.mjs`, `.cjs`)
 *                - `news/` rendered HTML articles
 *
 *              Auto-generated and vendored assets are explicitly excluded
 *              (the `js/lib/mermaid/` tree is copied verbatim from the
 *              pinned `mermaid` devDependency and is allowed to contain
 *              comments referencing upstream URLs).
 *
 * @see js/lib/mermaid-init.mjs
 * @see scripts/copy-vendor-mermaid.ts
 * @see SECURITY_ARCHITECTURE.md
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const REPO_ROOT = resolve(process.cwd());

/**
 * Hosts that, if found in a runtime JavaScript or rendered HTML asset
 * served from `riksdagsmonitor.com`, indicate a regression to an external
 * CDN dependency. Each pattern is a literal lowercase substring that must
 * not appear in any value of an HTML attribute (`src`, `href`, `import`)
 * or in any `import`/`fetch` call inside JS.
 */
const FORBIDDEN_HOSTS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'esm.sh',
  'cdn.skypack.dev',
  'ajax.googleapis.com',
] as const;

/**
 * File or directory paths (relative to the repository root) that the guard
 * intentionally skips. These contain either upstream documentation,
 * vendored third-party code (which legitimately references its origin in
 * comments), or generated typedoc HTML that mirrors historical source.
 */
const EXCLUDED_PATHS = [
  // Vendored Mermaid copy — contents come from npm; comments may reference
  // the upstream package URL. Loader is checked separately below.
  join('js', 'lib', 'mermaid') + sep,
  // Generated TypeDoc API reference HTML — mirrors source comments, not a
  // runtime asset served as part of articles.
  join('docs', 'api') + sep,
];

async function walk(dir: string, exts: readonly string[]): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    const st = await stat(full);
    if (st.isDirectory()) {
      out.push(...(await walk(full, exts)));
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

function isExcluded(path: string): boolean {
  const rel = path.startsWith(REPO_ROOT) ? path.slice(REPO_ROOT.length + 1) : path;
  return EXCLUDED_PATHS.some((p) => rel.startsWith(p));
}

async function findForbidden(files: string[]): Promise<Array<{ file: string; host: string; line: string }>> {
  const hits: Array<{ file: string; host: string; line: string }> = [];
  const filtered = files.filter((f) => !isExcluded(f));

  // Process files in parallel batches to avoid timeout on large directories.
  const BATCH_SIZE = 100;
  for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
    const batch = filtered.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (f) => {
        const text = await readFile(f, 'utf8');
        const lower = text.toLowerCase();
        const fileHits: Array<{ file: string; host: string; line: string }> = [];
        for (const host of FORBIDDEN_HOSTS) {
          if (!lower.includes(host)) continue;
          const lines = text.split(/\r?\n/);
          const offending = lines.find((l) => l.toLowerCase().includes(host)) ?? '';
          fileHits.push({ file: f.slice(REPO_ROOT.length + 1), host, line: offending.trim().slice(0, 200) });
        }
        return fileHits;
      }),
    );
    hits.push(...results.flat());
  }
  return hits;
}

describe('no external CDN in runtime JavaScript', () => {
  it('no js runtime file loads code from an external CDN host', async () => {
    const files = await walk(join(REPO_ROOT, 'js'), ['.js', '.mjs', '.cjs']);
    const hits = await findForbidden(files);
    if (hits.length > 0) {
      const summary = hits
        .map((h) => `  - ${h.file} → ${h.host}\n      ${h.line}`)
        .join('\n');
      throw new Error(
        `External CDN reference found in runtime JS — Riksdagsmonitor must serve all\n` +
          `JavaScript from its own S3/CloudFront origin. Vendor the dependency under\n` +
          `js/lib/<name>/ via a copy-vendor-* script and import it relatively.\n${summary}`,
      );
    }
    expect(hits).toEqual([]);
  });

  it('mermaid-init.mjs imports Mermaid from the vendored same-origin path', async () => {
    const loader = join(REPO_ROOT, 'js', 'lib', 'mermaid-init.mjs');
    const text = await readFile(loader, 'utf8');
    expect(text, 'mermaid loader should reference the local vendored path').toContain(
      './mermaid/mermaid.esm.min.mjs',
    );
    expect(text, 'mermaid loader must not reference any external CDN host').not.toMatch(
      /cdn\.jsdelivr|cdnjs\.cloudflare|unpkg\.com|esm\.sh|skypack/i,
    );
  });
});

describe('no external CDN in rendered news articles', () => {
  it('no rendered news article references an external CDN host', async () => {
    const files = await walk(join(REPO_ROOT, 'news'), ['.html']);
    if (files.length === 0) {
      // Articles haven't been rendered yet in this checkout — nothing to assert.
      return;
    }
    const hits = await findForbidden(files);
    if (hits.length > 0) {
      const summary = hits
        .map((h) => `  - ${h.file} → ${h.host}\n      ${h.line}`)
        .join('\n');
      throw new Error(
        `External CDN reference found in a rendered article. The article renderer\n` +
          `(scripts/render-lib/chrome.ts) must only emit script/href URLs that resolve\n` +
          `against the same S3/CloudFront origin.\n${summary}`,
      );
    }
    expect(hits).toEqual([]);
  }, 60_000);
});
