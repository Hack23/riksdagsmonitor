/**
 * Lightweight Mermaid loader — static-site safe, served from our own origin.
 *
 * Imports the ESM build from `js/lib/mermaid/` (vendored from the pinned
 * `mermaid` devDependency by `scripts/copy-vendor-mermaid.ts` during
 * `prebuild`) and renders every `<pre class="mermaid">` block on the page.
 * Kept out of the critical rendering path (module-deferred + idle-callback)
 * so articles remain fast to first paint.
 *
 * CSP note: by serving Mermaid from the same S3/CloudFront origin as the
 * articles, `riksdagsmonitor.com`'s CSP can use `script-src 'self'` for
 * scripts and no third-party CDN allowlist entry is required. The local
 * copy is also covered by `vite-plugin-sri-gen` for Subresource Integrity.
 *
 * The relative URL resolves against this loader's own URL — when the page
 * imports `/js/lib/mermaid-init.mjs`, this becomes
 * `/js/lib/mermaid/mermaid.esm.min.mjs`.
 */

const MERMAID_ESM = new URL('./mermaid/mermaid.esm.min.mjs', import.meta.url).href;

async function boot() {
  const blocks = document.querySelectorAll('pre.mermaid');
  if (!blocks.length) return;
  try {
    const mod = await import(/* webpackIgnore: true */ MERMAID_ESM);
    const mermaid = mod.default || mod;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#00d9ff',
        primaryTextColor: '#e0e0e0',
        primaryBorderColor: '#00d9ff',
        lineColor: '#ff006e',
        secondaryColor: '#1a1e3d',
        tertiaryColor: '#0a0e27',
        background: '#0a0e27',
      },
      securityLevel: 'strict',
      flowchart: { htmlLabels: false, useMaxWidth: true },
      sequence: { useMaxWidth: true },
    });
    // Convert <pre class="mermaid">TEXT</pre> → <div class="mermaid">TEXT</div>
    // because mermaid looks for element.textContent and expects a div wrapper.
    const diagramNodes = [];
    for (const pre of blocks) {
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = pre.textContent || '';
      pre.replaceWith(div);
      diagramNodes.push(div);
    }
    await mermaid.run({ nodes: diagramNodes });
  } catch (err) {
    console.warn('[mermaid-init] Failed to load Mermaid:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    'requestIdleCallback' in window ? requestIdleCallback(boot) : setTimeout(boot, 200);
  }, { once: true });
} else {
  'requestIdleCallback' in window ? requestIdleCallback(boot) : setTimeout(boot, 200);
}
