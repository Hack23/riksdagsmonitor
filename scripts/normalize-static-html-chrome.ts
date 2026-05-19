/**
 * @module normalize-static-html-chrome
 * @description Entry point for the static-HTML chrome normalizer.
 *
 * The implementation has been split into focused modules under
 * `scripts/normalize-static-html-chrome/`:
 *
 * - `constants.ts`  — shared constants and types
 * - `paths.ts`      — filesystem / suffix helpers
 * - `targets.ts`    — page enumerators (legacy + modern)
 * - `chrome/`       — legacy chrome fragments (stylesheet, language-bar,
 *                     primary-nav, footer, hero, theme-toggle, language-switcher)
 * - `news/`         — legacy news article header + article-type helpers
 * - `modern/`       — modern `rm-site-header` migration
 * - `cli.ts`        — orchestrator with the three normalization passes
 *
 * This entry file is intentionally minimal so it remains a stable executable
 * referenced from `package.json` while letting the `cli` module own the
 * imperative side-effects.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { runAllPasses, printSummary } from './normalize-static-html-chrome/cli.js';

printSummary(runAllPasses());
