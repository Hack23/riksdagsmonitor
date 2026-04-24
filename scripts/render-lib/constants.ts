/**
 * @module Infrastructure/RenderLib/Constants
 * @name Article-pipeline constants — public URLs + filesystem layout
 *
 * Leaf module with zero runtime dependencies (only `path` + `url`). Split
 * out from `./index.ts` so tests and other scripts can consume the URL
 * and filesystem constants without pulling in the full `unified` /
 * `remark` / `rehype` rendering pipeline.
 *
 * All existing consumers continue to work because `./index.ts` re-exports
 * everything declared here.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from '../types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Canonical production origin. Used for every absolute URL in `<head>`. */
export const BASE_URL = 'https://riksdagsmonitor.com';

/** GitHub blob prefix for deep-linking directly at the committed file. */
export const GITHUB_BLOB = 'https://github.com/Hack23/riksdagsmonitor/blob/main';

/** GitHub tree prefix for linking at a directory. */
export const GITHUB_TREE = 'https://github.com/Hack23/riksdagsmonitor/tree/main';

/** Repository root (../../ from this file). */
export const ROOT_DIR = path.join(__dirname, '..', '..');

/** `analysis/` directory — all analysis artefacts live under here. */
export const ANALYSIS_DIR = path.join(ROOT_DIR, 'analysis');

/** `analysis/methodologies/`. */
export const METHODOLOGIES_DIR = path.join(ANALYSIS_DIR, 'methodologies');

/** `analysis/templates/`. */
export const TEMPLATES_DIR = path.join(ANALYSIS_DIR, 'templates');

/** `analysis/daily/` — `$DATE/$SUBFOLDER` subtree. */
export const DAILY_DIR = path.join(ANALYSIS_DIR, 'daily');

/**
 * Canonical, ordered list of every supported UI language. Order matches
 * the hreflang cohort in `renderChromeHead` and the language-switcher in
 * `buildChrome`; keep `en` first (used as `x-default`) and `sv` second
 * (domestic default for the target audience).
 */
export const LANGUAGES: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
] as const;
