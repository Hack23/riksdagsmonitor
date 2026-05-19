/**
 * @module normalize-static-html-chrome/chrome/hero
 * @description Localize the home-page hero block.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { chromeStrings } from '../../render-lib/chrome-i18n.js';
import { themeToggleButton } from './theme-toggle.js';

/**
 * Inject the localized hero block into a static landing page. Only home
 * pages (`index_*.html`) carry this block — dashboard and politician
 * variants have their own hero structures left untouched.
 */
export function replaceHero(html: string, lang: Language): string {
  const cs = chromeStrings(lang);
  let next = html;

  next = next.replace(
    /<button\s+id="theme-toggle"[\s\S]*?<\/button>/i,
    themeToggleButton(cs),
  );

  next = next.replace(
    /(<span\s+class="h1-subtitle">)[\s\S]*?(<\/span>)/i,
    `$1${cs.heroSubtitle}$2`,
  );

  next = next.replace(
    /(<p\s+class="tagline">)[\s\S]*?(<\/p>)/i,
    `$1${cs.heroTagline}$2`,
  );

  next = next.replace(
    /<div\s+class="election-countdown">[\s\S]*?<\/div>/i,
    `<div class="election-countdown">
<h2>${cs.electionCountdownLabel} <span id="countdown">${cs.electionDateLong}</span></h2>
<p>${cs.electionDateLong}</p>
</div>`,
  );

  const STAT_LABELS: Record<string, { label: string; icon: string }> = {
    'stat-historical-persons':    { label: cs.heroStatPoliticians, icon: '👥' },
    'stat-against-proposals':     { label: cs.heroStatBallots,     icon: '🗳️' },
    'stat-total-documents':       { label: cs.heroStatDocuments,   icon: '📄' },
    'stat-government-proposals':  { label: cs.heroStatBills,       icon: '📜' },
    'stat-committee-decisions':   { label: cs.heroStatDecisions,   icon: '🏛️' },
  };
  for (const [statId, { label, icon }] of Object.entries(STAT_LABELS)) {
    const escaped = statId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `(<span\\s+class="number"\\s+data-stat-id="${escaped}">[\\s\\S]*?<\\/span>\\s*)[\\s\\S]*?(<\\/div>)`,
      'i',
    );
    next = next.replace(re, `$1<span class="label"><span aria-hidden="true">${icon}</span> ${label}</span>\n$2`);
  }

  return next;
}
