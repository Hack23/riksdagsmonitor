/**
 * @module shared/theme-init
 * @description Centralised loader for the inline anti-flash theme-init
 * bootstrap.  The bootstrap is kept in `js/theme-init.js` as the canonical
 * source; all HTML generators (article template, news-indexes template,
 * any future root-page generator) inline its minified body via this
 * helper so every page ships identical bytes.
 *
 * The bootstrap must be inlined (not loaded via `<script src>`) to avoid
 * a FOUC window while the external request resolves.  Inlining is the
 * only way to set `data-theme` synchronously before first paint.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Strip comments + compress whitespace to keep the inline payload small.
 * Removes:
 *   - JSDoc `/** ... * /` blocks
 *   - Single-line `// ...` comments
 *   - `/* ... * /` inline block comments
 *   - Leading indentation and multiple blank lines
 * The resulting IIFE remains functionally identical.
 */
function minifyBootstrap(src: string): string {
  return src
    // strip JSDoc / block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // strip line comments (but only those at line start to avoid breaking URL-like fragments)
    .replace(/^\s*\/\/.*$/gm, '')
    // collapse whitespace between tokens
    .replace(/\s+/g, ' ')
    // tighten around punctuation
    .replace(/\s*([;{}(),=!<>+\-*/])\s*/g, '$1')
    .trim();
}

function loadBootstrap(): string {
  try {
    const path = join(__dirname, '..', '..', 'js', 'theme-init.js');
    const raw = readFileSync(path, 'utf-8');
    return minifyBootstrap(raw);
  } catch {
    return "(function(){var key='riksdagsmonitor-theme';var t=null;try{t=localStorage.getItem(key);}catch(e){}if(t!=='dark'&&t!=='light'){if(t!==null){try{localStorage.removeItem(key);}catch(e){}}t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}());";
  }
}

/**
 * Minified, single-line IIFE sourced from `js/theme-init.js`.
 * Safe to embed inside a `<script>…</script>` tag directly.
 */
export const THEME_INIT_INLINE: string = loadBootstrap();

/**
 * Ready-to-inject `<script>` tag containing the inline theme bootstrap.
 * Use in template literals, e.g.:
 *
 * ```ts
 * html += THEME_INIT_SCRIPT_TAG;
 * ```
 */
export const THEME_INIT_SCRIPT_TAG: string = `<script>${THEME_INIT_INLINE}</script>`;
