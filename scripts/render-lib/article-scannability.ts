/**
 * @module Infrastructure/RenderLib/ArticleScannability
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Post-processing transforms for article visual scannability
 *
 * @description
 * Pure HTML-string transforms applied to the rendered article body HTML
 * **after** the rehype-sanitize pipeline has run. These transforms add
 * styled inline elements (confidence chips, Admiralty badges, timeline
 * indicators) and structural wrappers (progressive disclosure, in-article
 * TOC) without requiring changes to the sanitiser allow-list — since they
 * operate on the final HTML output, not on raw markdown.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import { escapeHtml, decodeHtmlEntities } from '../html-utils.js';

// ─── Heading Text Extraction ──────────────────────────────────────────────────

/** Matches a single complete HTML tag. */
const HTML_TAG_RE = /<[^>]*>/g;

/**
 * Remove HTML tags from a string, applying the substitution repeatedly until
 * the result stabilises.
 *
 * A single pass of {@link HTML_TAG_RE} can leave behind markup when tags
 * overlap (e.g. `"<scr<a>ipt>"` collapses to `"<script>"` after one pass).
 * Iterating until no further tags are removed prevents such reconstitution,
 * addressing the incomplete-multi-character-sanitization class of issues.
 */
function stripHtmlTags(value: string): string {
  let current = value;
  let previous: string;
  do {
    previous = current;
    current = current.replace(HTML_TAG_RE, '');
  } while (current !== previous);
  return current;
}

/**
 * Extract human-readable plain text from a heading's inner HTML.
 *
 * HTML entities are decoded **first** so that any encoded markup (e.g.
 * `&lt;script&gt;`) is normalised, then tags are stripped repeatedly until the
 * result is stable. Performing the strip as the final step ensures decoding
 * cannot reintroduce un-stripped markup. Re-insertion into HTML contexts (TOC
 * links, disclosure summaries) MUST still go through {@link escapeHtml} so that
 * any residual angle bracket left by an incomplete tag (e.g. a trailing
 * `<script` with no closing `>`) is neutralised.
 */
function headingPlainText(innerHtml: string): string {
  return stripHtmlTags(decodeHtmlEntities(innerHtml)).trim();
}

// ─── Admiralty Code Lookup ────────────────────────────────────────────────────

/**
 * NATO/Admiralty source reliability ratings (A–F) and information
 * credibility ratings (1–6).
 */
const SOURCE_RELIABILITY: Record<string, string> = {
  A: 'Completely reliable',
  B: 'Usually reliable',
  C: 'Fairly reliable',
  D: 'Not usually reliable',
  E: 'Unreliable',
  F: 'Reliability cannot be judged',
};

const INFO_CREDIBILITY: Record<string, string> = {
  '1': 'Confirmed by other sources',
  '2': 'Probably true',
  '3': 'Possibly true',
  '4': 'Doubtful',
  '5': 'Improbable',
  '6': 'Truth cannot be judged',
};

/**
 * Build an accessible tooltip string for an Admiralty code (e.g. "A2").
 */
function admiraltyTooltip(code: string): string {
  const letter = code[0].toUpperCase();
  const digit = code[1];
  const src = SOURCE_RELIABILITY[letter] ?? 'Unknown reliability';
  const info = INFO_CREDIBILITY[digit] ?? 'Unknown credibility';
  return `${src}; ${info}`;
}

// ─── Confidence Chip Transform ────────────────────────────────────────────────

/**
 * Detect standalone confidence labels (HIGH, MEDIUM, LOW) anywhere in the
 * rendered text and wrap them in styled chip spans.
 *
 * Matching is whole-word and case-insensitive. An Admiralty code in
 * parentheses immediately following the label (e.g. `"HIGH (A2)"`) is
 * permitted but **not** required — the lookahead is optional, so any
 * standalone occurrence is wrapped regardless of surrounding context.
 *
 * Because matching is context-free, this transform must only run on
 * intelligence article bodies where HIGH/MEDIUM/LOW denote confidence
 * ratings, not on arbitrary prose.
 */
export function transformConfidenceChips(html: string): string {
  // Match standalone "HIGH", "MEDIUM", "LOW" (whole-word, case-insensitive),
  // optionally trailed by parenthetical Admiralty notation like "(B2)".
  return html.replace(
    /\b(HIGH|MEDIUM|LOW)\b(?=\s*(?:\([A-F][1-6]\))?)/gi,
    (match) => {
      const level = match.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';
      const cssClass = `rm-confidence rm-confidence--${level.toLowerCase()}`;
      return `<span class="${cssClass}" role="img" aria-label="Confidence: ${level}">${match}</span>`;
    },
  );
}

// ─── Admiralty Code Transform ─────────────────────────────────────────────────

/**
 * Detect Admiralty codes like "(A2)", "(B3)", "(C1)" in parentheses and
 * wrap them in styled badge spans with descriptive tooltips.
 */
export function transformAdmiraltyBadges(html: string): string {
  return html.replace(
    /\(([A-F][1-6])\)/g,
    (_match, code: string) => {
      const tooltip = admiraltyTooltip(code);
      return `(<span class="rm-admiralty" title="${tooltip}" role="img" aria-label="Admiralty code ${code}: ${tooltip}">${code}</span>)`;
    },
  );
}

// ─── Timeline Indicator Transform ─────────────────────────────────────────────

/**
 * Detect timeline markers like "T+7d", "T+30d", "T+90d" and wrap them
 * in styled timeline indicator spans with human-readable labels.
 */
export function transformTimelineIndicators(html: string): string {
  return html.replace(
    /\bT\+(\d+)d\b/g,
    (_match, days: string) => {
      const n = parseInt(days, 10);
      let urgency: string;
      let label: string;
      if (n <= 7) {
        urgency = 'urgent';
        label = `Next ${n} days`;
      } else if (n <= 30) {
        urgency = 'near';
        label = `Next ${n} days`;
      } else {
        urgency = 'horizon';
        label = `Next ${n} days`;
      }
      return `<span class="rm-timeline rm-timeline--${urgency}" aria-label="${label}">T+${days}d</span>`;
    },
  );
}

// ─── Progressive Disclosure ───────────────────────────────────────────────────

/**
 * Section headings (H2) that should be wrapped in progressive disclosure
 * `<details>` elements (collapsed by default). These are deep-dive
 * sections that serve specialist readers.
 */
const PROGRESSIVE_DISCLOSURE_HEADINGS: readonly RegExp[] = [
  /Document\s+Analysis/i,
  /Intelligence\s+Notes?/i,
  /Methodology\s+Transparency/i,
  /Detailed\s+Analysis/i,
  /Technical\s+Assessment/i,
  /Source\s+Evaluation/i,
  /Dokumentanalys/i,
  /Underrättelse(?:anteckningar|noter)/i,
  /Metodologisk\s+transparens/i,
];

/**
 * Wrap deep-dive H2 sections in `<details class="rm-disclosure">` elements.
 * Each section runs from its H2 heading to (but not including) the next H2.
 */
export function transformProgressiveDisclosure(html: string): string {
  // Collect every H2 heading with its position in the ORIGINAL html in a single
  // pass. Boundaries are resolved against this immutable snapshot — the previous
  // implementation mutated the output while reusing original-html indices and
  // re-scanned the mutated string, which duplicated content and produced
  // malformed nesting (and a large output-size blow-up) when several
  // consecutive headings matched.
  const h2Regex = /<h2([^>]*)>([\s\S]*?)<\/h2>/gi;
  const headings: Array<{ fullH2: string; title: string; start: number; end: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = h2Regex.exec(html)) !== null) {
    headings.push({
      fullH2: m[0],
      title: headingPlainText(m[2]),
      start: m.index,
      end: m.index + m[0].length,
    });
  }

  if (headings.length === 0) return html;

  // Assemble the result once, advancing a cursor monotonically through the
  // original html. A disclosing section spans from its H2 to the next H2's
  // start (or end of document); since headings are ordered and the cursor only
  // ever jumps forward to a later heading start, sections never overlap.
  let result = '';
  let cursor = 0;
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const shouldDisclose = PROGRESSIVE_DISCLOSURE_HEADINGS.some((re) => re.test(heading.title));
    if (!shouldDisclose) continue;

    const sectionEnd = i + 1 < headings.length ? headings[i + 1].start : html.length;
    result += html.slice(cursor, heading.start);
    const sectionContent = html.slice(heading.end, sectionEnd);
    result += `<details class="rm-disclosure"><summary>${escapeHtml(heading.title)}</summary><div class="rm-disclosure-content">${heading.fullH2}${sectionContent}</div></details>`;
    cursor = sectionEnd;
  }
  result += html.slice(cursor);

  return result;
}

// ─── In-Article TOC Generation ────────────────────────────────────────────────

const TOC_TITLE_I18N: Partial<Record<Language, string>> = {
  en: 'Contents',
  sv: 'Innehåll',
  da: 'Indhold',
  no: 'Innhold',
  fi: 'Sisältö',
  de: 'Inhalt',
  fr: 'Sommaire',
  es: 'Contenido',
  nl: 'Inhoud',
  ar: 'المحتويات',
  he: 'תוכן',
  ja: '目次',
  ko: '목차',
  zh: '目录',
};

/**
 * Generate a sticky in-article table of contents from H2 headings.
 * Returns an HTML string for the TOC nav element.
 */
export function generateArticleToc(bodyHtml: string, lang: Language): string {
  const headingRegex = /<h2[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h2>/gi;
  const entries: Array<{ id: string; text: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(bodyHtml)) !== null) {
    const id = match[1];
    const text = headingPlainText(match[2]);
    if (id && text) {
      entries.push({ id, text });
    }
  }

  if (entries.length < 2) return ''; // Don't show TOC for very short articles

  const tocTitle = TOC_TITLE_I18N[lang] ?? 'Contents';
  const items = entries
    .map((e) => `<li><a href="#${escapeHtml(e.id)}">${escapeHtml(e.text)}</a></li>`)
    .join('\n');

  return `<nav class="rm-article-toc" aria-label="${tocTitle}">
<p class="rm-article-toc-title">${tocTitle}</p>
<ol>
${items}
</ol>
</nav>`;
}

// ─── Methodology Footer ───────────────────────────────────────────────────────

const METHODOLOGY_I18N: Partial<Record<Language, {
  title: string;
  confidenceLabel: string;
  confidenceDesc: string;
  admiraltyLabel: string;
  admiraltyDesc: string;
  sourcesLabel: string;
  sourcesDesc: string;
  freshnessLabel: string;
  freshnessDesc: string;
}>> = {
  en: {
    title: 'Assessment Methodology',
    confidenceLabel: 'Confidence Levels',
    confidenceDesc: 'HIGH = multiple independent sources confirm; MEDIUM = credible sources partially corroborate; LOW = single source or unverified.',
    admiraltyLabel: 'Admiralty Code',
    admiraltyDesc: 'NATO standard: Source reliability (A–F) × Information credibility (1–6). A1 = completely reliable, confirmed. F6 = cannot be judged.',
    sourcesLabel: 'Source Verification',
    sourcesDesc: 'Claims are drawn primarily from official Swedish government publications (Riksdagen, Regeringen) and other public datasets, accessed via public APIs.',
    freshnessLabel: 'Data Freshness',
    freshnessDesc: 'Analysis is generated from recently retrieved data, typically within 24 hours of the publication timestamp.',
  },
  sv: {
    title: 'Bedömningsmetodik',
    confidenceLabel: 'Konfidensnivåer',
    confidenceDesc: 'HIGH = flera oberoende källor bekräftar; MEDIUM = trovärdiga källor stöder delvis; LOW = enstaka källa eller overifierat.',
    admiraltyLabel: 'Amiralitetskod',
    admiraltyDesc: 'NATO-standard: Källtillförlitlighet (A–F) × Informationstrovärdighet (1–6). A1 = helt tillförlitlig, bekräftad. F6 = kan ej bedömas.',
    sourcesLabel: 'Källverifiering',
    sourcesDesc: 'Påståenden bygger huvudsakligen på officiella svenska myndighetspublikationer (Riksdagen, Regeringen) och andra offentliga dataset, åtkomliga via offentliga API:er.',
    freshnessLabel: 'Dataaktualitet',
    freshnessDesc: 'Analysen genereras från nyligen hämtad data, vanligtvis inom 24 timmar från publiceringstidsstämpeln.',
  },
};

/**
 * Render a standardized methodology transparency footer for articles.
 */
export function renderMethodologyFooter(lang: Language): string {
  const i18n = METHODOLOGY_I18N[lang] ?? METHODOLOGY_I18N['en']!;
  return `<aside class="rm-methodology-footer" aria-label="${i18n.title}">
<h3>${i18n.title}</h3>
<dl>
<dt>${i18n.confidenceLabel}</dt>
<dd>${i18n.confidenceDesc}</dd>
<dt>${i18n.admiraltyLabel}</dt>
<dd>${i18n.admiraltyDesc}</dd>
<dt>${i18n.sourcesLabel}</dt>
<dd>${i18n.sourcesDesc}</dd>
<dt>${i18n.freshnessLabel}</dt>
<dd>${i18n.freshnessDesc}</dd>
</dl>
</aside>`;
}

// ─── Combined Transform ───────────────────────────────────────────────────────

/**
 * Apply all scannability transforms to the rendered article body HTML.
 * Order: confidence → admiralty → timeline → progressive disclosure.
 * TOC and methodology footer are returned separately for template placement.
 */
export function applyScannabilityTransforms(bodyHtml: string, lang: Language): {
  readonly transformedBody: string;
  readonly tocHtml: string;
  readonly methodologyFooterHtml: string;
} {
  let transformed = bodyHtml;
  transformed = transformConfidenceChips(transformed);
  transformed = transformAdmiraltyBadges(transformed);
  transformed = transformTimelineIndicators(transformed);
  transformed = transformProgressiveDisclosure(transformed);

  const tocHtml = generateArticleToc(transformed, lang);
  const methodologyFooterHtml = renderMethodologyFooter(lang);

  return { transformedBody: transformed, tocHtml, methodologyFooterHtml };
}
