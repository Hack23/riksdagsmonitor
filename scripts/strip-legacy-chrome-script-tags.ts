/**
 * @module Infrastructure/PostProcess/StripLegacyChromeScriptTags
 * @category Build pipeline / chrome alignment
 *
 * Sweep committed HTML for legacy static `<script src="…js/theme-toggle.js">`
 * and `<script src="…js/back-to-top.js">` tags and replace them with the
 * modern dynamic-inject block emitted by `scripts/render-lib/chrome.ts`.
 *
 * ## Why
 *
 * Pre-translated articles, the hand-authored landing pages (`index*.html`,
 * `dashboard/index*.html`, `politician-dashboard*.html`) and other legacy
 * HTML wired the theme-toggle / back-to-top runtimes via classic
 * `<script src="..." defer>` tags at the end of `<body>`. The current
 * `chrome.ts` instead injects those scripts dynamically from the footer
 * (so Vite's HTML transformer never sees them and never tries to bundle /
 * hash them under `/assets/`).
 *
 * Two problems result from leaving the legacy tags in place:
 *
 *  1. **Vite build noise.** Vite/Rollup logs ~3,500 warnings per build of
 *     the form `<script src="../js/theme-toggle.js"> in "/news/…html"
 *     can't be bundled without type="module" attribute`. The build still
 *     succeeds, but the noise drowns out genuine plugin-timing diagnostics
 *     and adds CI log volume.
 *  2. **Dual-mechanism risk.** If the chrome injector is ever extended
 *     (e.g. to add another bootstrap), pages that still use static tags
 *     would silently miss the new wiring.
 *
 * `js/lib/mermaid-init.mjs` is safe to inject everywhere: the loader
 * early-returns when there are no `pre.mermaid` blocks on the page, so
 * non-article pages pay only a tiny cost (one `import.meta` resolve and
 * an empty `querySelectorAll`) before bailing out.
 *
 * ## Idempotency
 *
 * The script is fully idempotent:
 *  - Pages that already contain the modern inject block (matched by the
 *    string `function inject(src, isModule)`) are skipped.
 *  - Pages that have neither static tags nor the inject block are skipped.
 *  - Pages that have only the static tags get them stripped and the
 *    modern inject block appended right before `</body>`.
 *
 * ## Scope
 *
 * - `news/*.html` — generated articles (translated variants pre-rendered
 *   from an older `chrome.ts` revision).
 * - `index*.html` — hand-authored homepage in 14 languages.
 * - `dashboard/index*.html` — CIA dashboard entry pages in 14 languages.
 * - `politician-dashboard*.html` — politician detail dashboards in 14
 *   languages.
 *
 * Auto-generated test/coverage HTML under `docs/coverage/**`,
 * `docs/test-results/**` and `node_modules/**` is intentionally excluded.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Modern dynamic-inject block. Mirrors the trailing block emitted by
 * `scripts/render-lib/chrome.ts` so swept pages are byte-aligned with
 * freshly-rendered ones. Indentation chosen to match the typical
 * `</footer>` indent observed in the legacy pages — purely cosmetic.
 */
const INJECT_BLOCK = `    <!-- Mermaid + back-to-top + theme toggle bootstrap.
         Imperatively assembled so Vite's HTML transformer does not try to
         bundle / hash / re-emit the underlying modules. -->
    <script>
      (function () {
        function inject(src, isModule) {
          var s = document.createElement('script');
          if (isModule) s.type = 'module';
          else s.defer = true;
          s.src = src;
          document.head.appendChild(s);
        }
        inject('/js/lib/mermaid-init.mjs', true);
        inject('/js/back-to-top.js', true);
        inject('/js/theme-toggle.js', false);
      })();
    </script>
`;

/**
 * Inline anti-flash theme bootstrap. Byte-identical to the snippet
 * emitted in `<head>` by `scripts/render-lib/chrome.ts`'s
 * `renderChromeHead`. Replaces the legacy external
 * `<script src="…js/theme-init.js"></script>` tag, which Vite cannot
 * bundle and which adds a network round-trip that the inline version
 * eliminates. Synchronous execution before first paint is preserved.
 */
const INLINE_THEME_INIT = `<script>(function(){var k='riksdagsmonitor-theme';var t=null;try{t=localStorage.getItem(k);}catch(e){}if(t!=='dark'&&t!=='light'){if(t!==null){try{localStorage.removeItem(k);}catch(e){}}t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}());</script>`;

/**
 * Match every legacy variant we have observed for theme-toggle.js /
 * back-to-top.js (the two scripts hooked up by the chrome footer
 * inject block):
 *
 *  - `<script src="../js/back-to-top.js" defer></script>`
 *  - `<script src="../js/back-to-top.js"></script>`
 *  - `<script type="module" src="../js/back-to-top.js"></script>`
 *  - `<script src="js/back-to-top.js" defer></script>`           (root pages)
 *  - `<script src="../js/theme-toggle.js" defer></script>`
 *  - `<script src="js/theme-toggle.js" defer></script>`           (root pages)
 *
 * Anchored on the bare-filename suffix `js/(theme-toggle|back-to-top).js`
 * with optional `../` prefix and any attribute order. The match also
 * consumes a trailing newline + leading whitespace so the resulting HTML
 * does not accumulate blank lines after repeated sweeps.
 */
const LEGACY_TAG_RE =
  /^[ \t]*<script\b[^>]*\bsrc="(?:\.\.\/)?js\/(?:theme-toggle|back-to-top)\.js"[^>]*>\s*<\/script>\r?\n?/gim;

/**
 * Match the legacy external anti-flash tag. Examples:
 *
 *  - `<script src="../js/theme-init.js"></script>`
 *  - `<script src="js/theme-init.js" defer></script>`
 *
 * Replaced with the inline `INLINE_THEME_INIT` snippet. We deliberately
 * preserve any leading indentation so the inline replacement keeps the
 * same column as the original tag.
 */
const LEGACY_THEME_INIT_RE =
  /<script\b[^>]*\bsrc="(?:\.\.\/)?js\/theme-init\.js"[^>]*>\s*<\/script>/gi;

const INJECT_MARKER = 'function inject(src, isModule)';

interface SweepStats {
  scanned: number;
  alreadyModern: number;
  noChromeScripts: number;
  patched: number;
  themeInitInlined: number;
  sriStripped: number;
  patchedFiles: string[];
}

/**
 * Match `integrity="…"` and `crossorigin[="…"]` attributes inside a
 * `<script>` tag that points at a first-party JS path. Per the
 * "trust S3 / CloudFront" platform classification we deliberately do
 * not require SRI on first-party JavaScript / TypeScript output, so
 * any such attributes that crept into committed HTML (e.g. from an
 * older `vite-plugin-sri-gen` configuration that did not skip JS) are
 * stripped here.
 *
 * The pattern matches a whole `<script …src="…js/…"…>` opening tag,
 * captures the attribute soup, removes the two attributes from the
 * captured slice, and re-emits the tag.
 *
 * Examples handled:
 *   <script src="../js/lib/chart.umd.4.4.1.js" integrity="sha384-…" crossorigin="anonymous"></script>
 *   <script integrity="sha384-…" src="../js/chart-init.js" crossorigin></script>
 *   <script src="/js/back-to-top.js" crossorigin="use-credentials"></script>
 */
const FIRST_PARTY_JS_SCRIPT_TAG_RE =
  /<script\b([^>]*\bsrc="(?:\.\.\/|\/)?js\/[^"]+\.m?js"[^>]*)>/gi;
const SRI_ATTR_RE = /\s+integrity="[^"]*"/gi;
const CROSSORIGIN_ATTR_RE = /\s+crossorigin(?:="[^"]*")?/gi;

/**
 * Files to sweep, expressed as `(directory, filenameMatcher)` pairs.
 * Each pair is resolved against `ROOT_DIR`. Recursion into subdirectories
 * is intentional only for `news/` (flat structure today; future-proofed
 * if a YYYY/MM/ layout ever lands).
 */
interface SweepTarget {
  readonly dir: string;
  readonly match: (filename: string) => boolean;
  readonly recursive?: boolean;
}

const TARGETS: readonly SweepTarget[] = [
  // Generated news articles + indexes.
  { dir: 'news', match: (f) => f.endsWith('.html'), recursive: true },
  // Hand-authored top-level homepage in 14 languages (`index.html`,
  // `index_sv.html`, `index_ar.html`, …) and political-intelligence
  // landing pages. We DO NOT sweep arbitrary `*.html` at the root because
  // generated artifacts (`sitemap.html`, `political-intelligence.html`,
  // …) already carry the modern inject block; the explicit allowlist
  // makes it impossible to accidentally rewrite `404.html` or similar.
  {
    dir: '.',
    match: (f) =>
      /^(?:index|politician-dashboard)(?:_[a-z]{2,3})?\.html$/.test(f),
  },
  // CIA dashboard entry pages.
  {
    dir: 'dashboard',
    match: (f) => /^index(?:_[a-z]{2,3})?\.html$/.test(f),
  },
];

function* walk(dir: string, recursive: boolean): IterableIterator<string> {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) yield* walk(full, recursive);
      continue;
    }
    if (entry.isFile()) yield full;
  }
}

function processFile(file: string, stats: SweepStats): void {
  const original = fs.readFileSync(file, 'utf8');
  let html = original;
  let modified = false;

  // Step 0: strip `integrity="…"` and `crossorigin[="…"]` from any
  // `<script>` tag pointing at a first-party JS path. SRI on first-party
  // JS is no longer required (deliveries are trusted via S3/CloudFront),
  // and stale SRI hashes embedded in committed HTML would block legitimate
  // updates. Done first so the subsequent steps see clean tags.
  html = html.replace(FIRST_PARTY_JS_SCRIPT_TAG_RE, (match, attrs) => {
    let cleaned: string = attrs;
    let hadSri = false;
    if (SRI_ATTR_RE.test(cleaned)) {
      hadSri = true;
      cleaned = cleaned.replace(SRI_ATTR_RE, '');
    }
    if (CROSSORIGIN_ATTR_RE.test(cleaned)) {
      hadSri = true;
      cleaned = cleaned.replace(CROSSORIGIN_ATTR_RE, '');
    }
    SRI_ATTR_RE.lastIndex = 0;
    CROSSORIGIN_ATTR_RE.lastIndex = 0;
    if (hadSri) {
      stats.sriStripped++;
      modified = true;
      return `<script${cleaned}>`;
    }
    return match;
  });
  FIRST_PARTY_JS_SCRIPT_TAG_RE.lastIndex = 0;

  // Step 1: replace the external anti-flash tag with the inline bootstrap.
  // This is independent of the chrome injector — even pages that already
  // have the modern inject block can still be carrying the external
  // theme-init tag (the inject block does NOT include theme-init because
  // the inline anti-flash needs to run before first paint, which the
  // dynamic injector cannot guarantee).
  if (LEGACY_THEME_INIT_RE.test(html)) {
    LEGACY_THEME_INIT_RE.lastIndex = 0;
    html = html.replace(LEGACY_THEME_INIT_RE, INLINE_THEME_INIT);
    stats.themeInitInlined++;
    modified = true;
  }
  LEGACY_THEME_INIT_RE.lastIndex = 0;

  // Step 2: replace the legacy `<script src="…/(theme-toggle|back-to-top).js">`
  // tag pair with the modern dynamic-inject footer block — but only if
  // the page does not already contain the inject block.
  if (!html.includes(INJECT_MARKER) && LEGACY_TAG_RE.test(html)) {
    LEGACY_TAG_RE.lastIndex = 0;
    html = html.replace(LEGACY_TAG_RE, '');
    const bodyClose = /<\/body\s*>/i;
    if (bodyClose.test(html)) {
      html = html.replace(bodyClose, `${INJECT_BLOCK}  </body>`);
    } else {
      html = `${html}\n${INJECT_BLOCK}`;
    }
    stats.patched++;
    modified = true;
  } else if (html.includes(INJECT_MARKER)) {
    stats.alreadyModern++;
  } else {
    stats.noChromeScripts++;
  }
  LEGACY_TAG_RE.lastIndex = 0;

  if (modified) {
    fs.writeFileSync(file, html, 'utf8');
    stats.patchedFiles.push(path.relative(ROOT_DIR, file));
  }
}

function main(): void {
  const stats: SweepStats = {
    scanned: 0,
    alreadyModern: 0,
    noChromeScripts: 0,
    patched: 0,
    themeInitInlined: 0,
    sriStripped: 0,
    patchedFiles: [],
  };

  for (const target of TARGETS) {
    const absDir = path.join(ROOT_DIR, target.dir);
    for (const file of walk(absDir, target.recursive ?? false)) {
      const filename = path.basename(file);
      if (!target.match(filename)) continue;
      stats.scanned++;
      try {
        processFile(file, stats);
      } catch (err) {
        console.error(`❌ Failed to process ${path.relative(ROOT_DIR, file)}:`, err);
        process.exitCode = 1;
      }
    }
  }

  console.log(
    `Stripped legacy chrome script tags: ` +
      `scanned=${stats.scanned} ` +
      `patched=${stats.patched} ` +
      `themeInitInlined=${stats.themeInitInlined} ` +
      `sriStripped=${stats.sriStripped} ` +
      `alreadyModern=${stats.alreadyModern} ` +
      `noChromeScripts=${stats.noChromeScripts}`,
  );
  if (process.env.STRIP_LEGACY_VERBOSE === '1' && stats.patchedFiles.length) {
    for (const f of stats.patchedFiles.slice(0, 50)) console.log('  patched:', f);
    if (stats.patchedFiles.length > 50) {
      console.log(`  …and ${stats.patchedFiles.length - 50} more`);
    }
  }
}

main();

