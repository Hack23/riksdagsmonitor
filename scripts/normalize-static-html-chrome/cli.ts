/**
 * @module normalize-static-html-chrome/cli
 * @description Top-level entry that performs the three normalization passes:
 *  1. Legacy chrome + SEO uplift for static landing pages.
 *  2. Legacy news chrome + article-type class normalization for `news/*.html`.
 *  3. Modern `rm-site-header` migration for the static landing pages.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { enhanceStaticPageHead } from '../static-pages-seo-head.js';
import { ROOT_DIR } from './constants.js';
import { walkHtmlFiles, pathPrefix } from './paths.js';
import { targets, modernTargets } from './targets.js';
import { ensureStylesheet, normalizeApiLinks } from './chrome/stylesheet.js';
import { replaceFooter } from './chrome/footer.js';
import { ensureLanguageSwitcher } from './chrome/language-switcher.js';
import { replaceHero } from './chrome/hero.js';
import { langFromNewsFile } from './news/language-from-file.js';
import { ensureLegacyArticleTypeClass } from './news/article-type.js';
import { addNewsHeaderLinks, addNewsQuickLinks } from './news/quick-links.js';
import { normalizeLegacyNewsChrome } from './news/legacy-header.js';
import { migrateToModernChrome } from './modern/migrate.js';

interface PassResults {
  readonly changed: number;
  readonly newsChanged: number;
  readonly modernChanged: number;
}

/** Pass 1 — legacy chrome + SEO uplift for static landing pages. */
function runLegacyChromePass(): number {
  let changed = 0;
  for (const target of targets()) {
    const absolute = path.join(ROOT_DIR, target.file);
    if (!fs.existsSync(absolute)) continue;
    const prefix = pathPrefix(target.file);
    const before = fs.readFileSync(absolute, 'utf8');

    // SEO `<head>` enhancement — runs FOR ALL static landing pages
    // regardless of whether the legacy chrome guard below short-circuits.
    // Pure / idempotent so re-running is safe. See
    // `scripts/static-pages-seo-head.ts` for the rationale.
    const seoEnhanced = enhanceStaticPageHead({
      html: before,
      lang: target.lang,
      family: target.family,
    });
    if (seoEnhanced !== before) {
      fs.writeFileSync(absolute, seoEnhanced, 'utf8');
      changed++;
    }

    // Skip the legacy chrome pass entirely for pages that have already been
    // migrated to the modern `rm-site-header` shape — otherwise the legacy
    // pass re-injects `site-header-nav` / `site-language-switcher` on every
    // re-run of the prebuild chain.
    if (/class="rm-site-header"/.test(seoEnhanced)) continue;
    let after = ensureStylesheet(seoEnhanced, prefix);
    after = normalizeApiLinks(after);
    after = replaceFooter(after, prefix, target.family, target.lang);
    after = ensureLanguageSwitcher(after, prefix, target.family, target.lang);
    if (target.family === 'home') {
      after = replaceHero(after, target.lang);
    }
    if (after !== seoEnhanced) {
      fs.writeFileSync(absolute, after, 'utf8');
      changed++;
    }
  }
  return changed;
}

/** Pass 2 — legacy news chrome + article-type class normalization. */
function runLegacyNewsPass(): number {
  let newsChanged = 0;
  for (const absolute of walkHtmlFiles(path.join(ROOT_DIR, 'news'))) {
    const rel = path.relative(ROOT_DIR, absolute);
    const lang = langFromNewsFile(rel);
    if (!lang) continue;
    const before = fs.readFileSync(absolute, 'utf8');
    let after = normalizeApiLinks(before);
    if (!after.includes('class="rm-site-footer"')) {
      after = normalizeLegacyNewsChrome(addNewsHeaderLinks(addNewsQuickLinks(after, lang), lang), lang);
      after = ensureLegacyArticleTypeClass(after, rel);
    }
    if (after !== before) {
      fs.writeFileSync(absolute, after, 'utf8');
      newsChanged++;
    }
  }
  return newsChanged;
}

/**
 * Pass 3 — Modern chrome migration for static landing pages.
 *
 * All static landing pages (root index*, dashboard/index*, politician-
 * dashboard*, dashboards/<slug>*) historically carried the legacy
 * `<header>` shape produced by `primaryNav()` / `languageBar()`.
 * Generated article and political-intelligence pages have since moved
 * to the unified modern chrome built by `buildHeaderHtml()` in
 * `scripts/render-lib/chrome/header.ts`. This pass upgrades the static
 * pages in-place so the two surfaces stay visually and structurally
 * identical.
 *
 * The migration is strictly idempotent: pages that already contain
 * `class="rm-site-header"` are skipped, so re-running the prebuild step
 * after a successful run is a no-op.
 */
function runModernChromePass(): number {
  let modernChanged = 0;
  for (const target of modernTargets()) {
    const absolute = path.join(ROOT_DIR, target.file);
    if (!fs.existsSync(absolute)) continue;
    const before = fs.readFileSync(absolute, 'utf8');
    let after = migrateToModernChrome(before, target);
    // Defensive: downstream prebuild steps (backfill-translated-chrome,
    // ensureLanguageSwitcher legacy pass) may re-inject the legacy navs
    // into a page that already has modern chrome. Strip them whenever a
    // page already carries `rm-site-header`.
    if (/class="rm-site-header"/.test(after)) {
      after = after.replace(/<nav\s+class="site-header-nav"[\s\S]*?<\/nav>/gi, '');
      after = after.replace(/<nav\s+class="language-switcher site-language-switcher"[\s\S]*?<\/nav>/gi, '');
    }
    if (after !== before) {
      fs.writeFileSync(absolute, after, 'utf8');
      modernChanged++;
    }
  }
  return modernChanged;
}

/**
 * Run all three normalization passes in sequence. Each pass writes results
 * to disk; the returned `PassResults` is purely informational and is printed
 * to stdout by the CLI wrapper.
 */
export function runAllPasses(): PassResults {
  const changed = runLegacyChromePass();
  const newsChanged = runLegacyNewsPass();
  const modernChanged = runModernChromePass();
  return { changed, newsChanged, modernChanged };
}

/** Print the user-facing single-line summary of the run. */
export function printSummary({ changed, newsChanged, modernChanged }: PassResults): void {
  console.log(
    `Normalized static HTML chrome for ${changed} page(s), legacy news links for ${newsChanged} page(s), modernized chrome for ${modernChanged} page(s).`,
  );
}
