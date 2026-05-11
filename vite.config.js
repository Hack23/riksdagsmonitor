/**
 * Vite Configuration for Riksdagsmonitor
 * 
 * Static HTML/CSS site with multi-language support
 * Deployed to CloudFront with SRI hash generation
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { createLogger, defineConfig } from 'vite';
import sri from 'vite-plugin-sri-gen';
import { fileURLToPath } from 'node:url';
import staticPagesPlugin from './scripts/vite-plugin-static-pages.js';
import swBuildIdPlugin from './scripts/vite-plugin-sw-build-id.js';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * Custom Vite logger that suppresses the `vite:build-html` advisory
 * warning emitted for legacy translated articles that load Chart.js as a
 * classic UMD script via `<script src="../js/lib/chart.umd.4.4.1.js">`
 * and `<script src="../js/chart-init.js">`.
 *
 * Vite's HTML transformer prints "<script src="…"> in "/news/…html"
 * can't be bundled without type=\"module\" attribute" because it cannot
 * rewrite a classic-script `src` into a hashed `/assets/…` import. That
 * is intentional: chart.umd is a UMD bundle that exposes `window.Chart`,
 * and chart-init.js is a classic module that consumes it. Both are
 * deployed verbatim to S3 by `.github/workflows/deploy-s3.yml` and are
 * intentionally trusted by the platform (per the "trust S3 / CloudFront"
 * classification — no SRI required on first-party JS, see commit
 * "trust S3/CloudFront — drop SRI on first-party JS").
 *
 * Suppressing only this exact message keeps every other Vite warning
 * visible. Other Vite logging (errors, info, debug) is left untouched.
 */
const VITE_BUILD_HTML_BUNDLE_WARNING_RE =
  /can't be bundled without type="module" attribute/;
function createSuppressingLogger() {
  const base = createLogger();
  return {
    ...base,
    warn(msg, opts) {
      if (typeof msg === 'string' && VITE_BUILD_HTML_BUNDLE_WARNING_RE.test(msg)) {
        return;
      }
      base.warn(msg, opts);
    },
    warnOnce(msg, opts) {
      if (typeof msg === 'string' && VITE_BUILD_HTML_BUNDLE_WARNING_RE.test(msg)) {
        return;
      }
      base.warnOnce(msg, opts);
    },
  };
}

export default defineConfig({
  // Base configuration
  root: '.',
  base: '/',

  // Suppress only the `vite:build-html` "can't be bundled without
  // type=module" warning for legacy chart.umd/chart-init UMD scripts.
  customLogger: createSuppressingLogger(),
  
  // Server configuration for local development
  server: {
    port: 8080,
    host: '0.0.0.0',
    strictPort: true,
    open: true
  },
  
  // Preview server (production build preview)
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,

    // Generate the Vite manifest so `static-pages-emit` can resolve
    // the hashed `styles.css` filename without scanning `dist/assets/`.
    manifest: true,

    // Generate source maps for debugging
    sourcemap: true,
    
    // Code splitting configuration
    rollupOptions: {
      input: {
        // Main language homepages
        main: './index.html',
        ar: './index_ar.html',
        da: './index_da.html',
        de: './index_de.html',
        es: './index_es.html',
        fi: './index_fi.html',
        fr: './index_fr.html',
        he: './index_he.html',
        ja: './index_ja.html',
        ko: './index_ko.html',
        nl: './index_nl.html',
        no: './index_no.html',
        sv: './index_sv.html',
        zh: './index_zh.html',
        // Sitemaps, political-intelligence, news/index_* and the
        // ~3 500 news/* article pages are emitted by the
        // `static-pages-emit` plugin (see scripts/vite-plugin-
        // static-pages.js). They are pure static HTML with no
        // module scripts; routing them through Rollup just to
        // rewrite a single `styles.css` href bloated the module
        // graph to 4 250+ entries and OOM'd the `rendering chunks`
        // phase at the default ~4 GB Node heap (release run
        // 25133177267, PR #2117). The plugin handles the rewrite
        // (with SHA-384 SRI on the CSS link) at O(n) time and
        // O(largest-page) memory.
        // Additional pages
        'politician-dashboard': './politician-dashboard.html',
        'politician-dashboard_sv': './politician-dashboard_sv.html',
        'politician-dashboard_da': './politician-dashboard_da.html',
        'politician-dashboard_no': './politician-dashboard_no.html',
        'politician-dashboard_fi': './politician-dashboard_fi.html',
        'politician-dashboard_de': './politician-dashboard_de.html',
        'politician-dashboard_fr': './politician-dashboard_fr.html',
        'politician-dashboard_es': './politician-dashboard_es.html',
        'politician-dashboard_nl': './politician-dashboard_nl.html',
        'politician-dashboard_ar': './politician-dashboard_ar.html',
        'politician-dashboard_he': './politician-dashboard_he.html',
        'politician-dashboard_ja': './politician-dashboard_ja.html',
        'politician-dashboard_ko': './politician-dashboard_ko.html',
        'politician-dashboard_zh': './politician-dashboard_zh.html',
        // Dashboard pages (real <script type="module"> entries)
        'dashboard/index': './dashboard/index.html',
        'dashboard/index_sv': './dashboard/index_sv.html',
        'dashboard/index_da': './dashboard/index_da.html',
        'dashboard/index_no': './dashboard/index_no.html',
        'dashboard/index_fi': './dashboard/index_fi.html',
        'dashboard/index_de': './dashboard/index_de.html',
        'dashboard/index_fr': './dashboard/index_fr.html',
        'dashboard/index_es': './dashboard/index_es.html',
        'dashboard/index_nl': './dashboard/index_nl.html',
        'dashboard/index_ar': './dashboard/index_ar.html',
        'dashboard/index_he': './dashboard/index_he.html',
        'dashboard/index_ja': './dashboard/index_ja.html',
        'dashboard/index_ko': './dashboard/index_ko.html',
        'dashboard/index_zh': './dashboard/index_zh.html',
      },
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks(id) {
          if (id.includes('chart.js') || id.includes('chartjs-plugin-annotation')) {
            return 'chart';
          }
          if (id.includes('/node_modules/d3') || id.includes('/node_modules/d3-')) {
            return 'd3';
          }
          if (id.includes('papaparse')) {
            return 'papa';
          }
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
        
        // JS file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    
    // Minification (use Vite default: esbuild)
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger']
    },
    
    // CSS options
    cssMinify: true,
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb - inline small assets as base64
    
    // Performance budgets
    chunkSizeWarningLimit: 1000 // 1000kb warning
  },
  
  // Plugins
  plugins: [
    // Generate Subresource Integrity (SRI) hashes for security.
    // Skip:
    //   - Google Fonts (no CORS for SRI verification).
    //   - First-party JavaScript and TypeScript output. Per the
    //     "trust S3 / CloudFront" platform classification, first-party
    //     JS/TS is delivered from infrastructure we control end-to-end
    //     and does not require SRI verification. This also keeps the
    //     `vite:build-html` warnings around chart.umd / chart-init quiet
    //     because SRI rewriting is no longer attempted on those tags.
    sri({
      algorithm: 'sha384',
      skipResources: [
        'https://fonts.googleapis.com/*',
        'https://fonts.gstatic.com/*',
        '*.js',
        '*.mjs',
        '*.ts',
        '/js/*',
        '/js/**',
        '/assets/js/*',
        '/assets/js/**'
      ]
    }),

    // Emit the ~3 540 static HTML pages (news articles, news/index_*,
    // sitemap_*, political-intelligence_*) outside Rollup's module
    // graph. See scripts/vite-plugin-static-pages.js for the full
    // root-cause analysis — short version: routing them through
    // rollupOptions.input bloated the graph past the 4 GB Node heap.
    staticPagesPlugin({
      projectRoot,
      outDir: 'dist',
      pageSets: [
        {
          label: 'news-articles',
          sources: [{ path: 'news', recurse: true }],
        },
        {
          label: 'sitemaps',
          sources: [
            { path: 'sitemap.html' },
            { path: 'sitemap_sv.html' },
            { path: 'sitemap_da.html' },
            { path: 'sitemap_no.html' },
            { path: 'sitemap_fi.html' },
            { path: 'sitemap_de.html' },
            { path: 'sitemap_fr.html' },
            { path: 'sitemap_es.html' },
            { path: 'sitemap_nl.html' },
            { path: 'sitemap_ar.html' },
            { path: 'sitemap_he.html' },
            { path: 'sitemap_ja.html' },
            { path: 'sitemap_ko.html' },
            { path: 'sitemap_zh.html' },
          ],
        },
        {
          label: 'political-intelligence',
          sources: [
            { path: 'political-intelligence.html' },
            { path: 'political-intelligence_sv.html' },
            { path: 'political-intelligence_da.html' },
            { path: 'political-intelligence_no.html' },
            { path: 'political-intelligence_fi.html' },
            { path: 'political-intelligence_de.html' },
            { path: 'political-intelligence_fr.html' },
            { path: 'political-intelligence_es.html' },
            { path: 'political-intelligence_nl.html' },
            { path: 'political-intelligence_ar.html' },
            { path: 'political-intelligence_he.html' },
            { path: 'political-intelligence_ja.html' },
            { path: 'political-intelligence_ko.html' },
            { path: 'political-intelligence_zh.html' },
          ],
        },
        {
          // The 9 specialised political-intelligence dashboard pages
          // (parties, anomaly-detection, network-analysis, voting-cohesion,
          // momentum, coalitions, seasonal-patterns, pre-election, ministers,
          // risk, election-cycle, committees) × 14 languages = 126 files,
          // emitted by scripts/build-dashboard-pages.py.
          //
          // They inherit `<script type="module" src="/src/browser/main.ts">`
          // from index.html, so staticPagesPlugin rewrites that tag to the
          // hashed `/assets/js/main-<hash>.js` bundle (see MODULE_SCRIPT_RE
          // in scripts/vite-plugin-static-pages.js). Without this rewrite,
          // S3/CloudFront serves /src/browser/main.ts as index.html
          // (text/html) → the browser silently rejects loading HTML as a
          // JS module → dashboards render empty (no charts, no data).
          //
          // Without this entry vite preview returned 404 for /dashboards/*.html
          // (every Cypress assertion in cypress/e2e/dashboards.cy.js failed —
          // 1 passing / 20 failing in run 25549240331).
          label: 'dashboards',
          sources: [{ path: 'dashboards', recurse: false }],
        },
      ],
    }),

    // Substitute `__BUILD_ID__` in `public/sw.js` with a per-build
    // unique identifier (commit SHA → git rev-parse → timestamp) and
    // emit `dist/sw.js`. See scripts/vite-plugin-sw-build-id.js.
    // Runs after staticPagesPlugin so dist/ exists.
    swBuildIdPlugin({ projectRoot, outDir: 'dist' })
  ],
  
  // Optimizations
  optimizeDeps: {
    include: ['chart.js', 'chartjs-plugin-annotation', 'd3']
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  }
});
