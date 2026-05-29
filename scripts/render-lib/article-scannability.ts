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

// ─── Text-Node-Only Replacement ───────────────────────────────────────────────

/**
 * Apply a regex replacement only to text segments of an HTML string, leaving
 * tag markup (attributes, tag names) untouched. The HTML is split into text
 * segments and tag segments by matching complete tags; the replacement is
 * applied only to the text parts.
 */
function replaceInTextNodes(
  html: string,
  pattern: RegExp,
  replacer: (substring: string, ...args: string[]) => string,
): string {
  // Split html into alternating text/tag segments. Tags include the full
  // `<…>` (including attributes), everything else is text content.
  const TAG_SPLIT_RE = /(<[^>]*>)/g;
  const parts = html.split(TAG_SPLIT_RE);
  for (let i = 0; i < parts.length; i++) {
    // Odd-indexed segments are tags; even-indexed are text nodes.
    if (i % 2 === 0) {
      parts[i] = parts[i].replace(pattern, replacer as (...a: unknown[]) => string);
    }
  }
  return parts.join('');
}

// ─── Confidence Chip Transform ────────────────────────────────────────────────

/**
 * Detect standalone confidence labels (HIGH, MEDIUM, LOW) in text nodes of
 * the rendered HTML and wrap them in styled chip spans.
 *
 * Matching is whole-word and case-insensitive. An Admiralty code in
 * parentheses immediately following the label (e.g. `"HIGH (A2)"`) is
 * permitted but **not** required — the lookahead is optional, so any
 * standalone occurrence is wrapped regardless of surrounding context.
 *
 * Replacements are applied only to text nodes (not inside tag attributes)
 * to avoid corrupting heading IDs, hrefs, or other attribute values.
 */
export function transformConfidenceChips(html: string): string {
  return replaceInTextNodes(
    html,
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
 *
 * Replacements are applied only to text nodes to avoid corrupting attribute
 * values that may contain matching patterns.
 */
export function transformAdmiraltyBadges(html: string): string {
  return replaceInTextNodes(
    html,
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
 *
 * Replacements are applied only to text nodes to avoid corrupting attribute
 * values.
 */
export function transformTimelineIndicators(html: string): string {
  return replaceInTextNodes(
    html,
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
 * Reading-depth layers used to group TOC entries, mirroring the layered
 * intelligence-product structure: a fast top-line read (`quick`/L1), the core
 * analytical lenses (`analysis`/L2), and the specialist deep-dive / appendix
 * material (`intelligence`/L3). The layer is rendered as a compact badge so
 * readers can navigate by depth, and as a `data-layer` attribute for styling.
 */
type TocLayer = 'quick' | 'analysis' | 'intelligence';

const LAYER_BADGE: Record<TocLayer, string> = {
  quick: 'L1',
  analysis: 'L2',
  intelligence: 'L3',
};

/**
 * Short localized names for each reading-depth layer. Used for the accessible
 * `aria-label`/`title` on the layer badge so the cryptic `L1`/`L2`/`L3` codes
 * carry meaning in every supported language. English is the fallback.
 */
const LAYER_NAME_I18N: Record<TocLayer, Partial<Record<Language, string>>> = {
  quick: {
    en: 'Quick read', sv: 'Snabbläsning', da: 'Hurtig læsning', no: 'Hurtiglesing',
    fi: 'Pikaluku', de: 'Kurzüberblick', fr: 'Lecture rapide', es: 'Lectura rápida',
    nl: 'Snel lezen', ar: 'قراءة سريعة', he: 'קריאה מהירה', ja: 'クイックリード',
    ko: '빠른 읽기', zh: '快速阅读',
  },
  analysis: {
    en: 'Analysis', sv: 'Analys', da: 'Analyse', no: 'Analyse', fi: 'Analyysi',
    de: 'Analyse', fr: 'Analyse', es: 'Análisis', nl: 'Analyse', ar: 'تحليل',
    he: 'ניתוח', ja: '分析', ko: '분석', zh: '分析',
  },
  intelligence: {
    en: 'Deep dive', sv: 'Fördjupning', da: 'Dybdegående', no: 'Fordypning',
    fi: 'Syväluotaus', de: 'Vertiefung', fr: 'Analyse approfondie', es: 'Análisis profundo',
    nl: 'Verdieping', ar: 'تحليل معمق', he: 'צלילה לעומק', ja: '詳細分析',
    ko: '심층 분석', zh: '深入分析',
  },
};

/**
 * Canonical section → emoji icon and reading-depth layer map, keyed by the
 * **normalized slug** (heading `id` with the `rm-` prefix and any trailing
 * `-<n>` de-duplication suffix removed). Section `id`s are stable across all
 * 14 languages (assigned from the canonical English scaffold), so this map
 * gives every TOC entry a meaningful icon and layer regardless of the article
 * language — even when the heading text itself is translated.
 */
const SECTION_META: Record<string, { icon: string; layer: TocLayer }> = {
  // ── Phase A — Lead & headline judgments (L1 quick read) ──────────────
  'executive-brief': { icon: '📋', layer: 'quick' },
  'what-happened': { icon: '📰', layer: 'quick' },
  'why-it-matters': { icon: '🎯', layer: 'quick' },
  'key-findings': { icon: '🔑', layer: 'quick' },
  'key-takeaways': { icon: '🔑', layer: 'quick' },
  'synthesis-summary': { icon: '🔗', layer: 'quick' },
  'thematic-synthesis': { icon: '🔗', layer: 'quick' },
  'integrated-intelligence-picture': { icon: '🧠', layer: 'quick' },
  'intelligence-assessment': { icon: '🧠', layer: 'quick' },
  'key-judgments': { icon: '⚖️', layer: 'quick' },
  'key-judgements': { icon: '⚖️', layer: 'quick' },
  'reader-guide': { icon: '🧭', layer: 'quick' },
  // ── Phase B/C — Evidence, actors & political arithmetic (L2) ─────────
  'significance-scoring': { icon: '⭐', layer: 'analysis' },
  'significance': { icon: '⭐', layer: 'analysis' },
  'significance-assessment': { icon: '⭐', layer: 'analysis' },
  'political-significance': { icon: '⭐', layer: 'analysis' },
  'electoral-significance': { icon: '⭐', layer: 'analysis' },
  'per-document-intelligence': { icon: '📄', layer: 'analysis' },
  'document-summary': { icon: '📄', layer: 'analysis' },
  'document-metadata': { icon: '📄', layer: 'analysis' },
  'key-provisions': { icon: '📑', layer: 'analysis' },
  'stakeholder-perspectives': { icon: '👥', layer: 'analysis' },
  'stakeholder-impact': { icon: '👥', layer: 'analysis' },
  'key-actors': { icon: '🎭', layer: 'analysis' },
  'coalition-mathematics': { icon: '🤝', layer: 'analysis' },
  'voter-segmentation': { icon: '🗳️', layer: 'analysis' },
  // ── Phase D — Forward trajectory (L2) ────────────────────────────────
  'forward-indicators': { icon: '🔭', layer: 'analysis' },
  'top-forward-trigger': { icon: '🔭', layer: 'analysis' },
  'scenario-analysis': { icon: '🔮', layer: 'analysis' },
  'election-2026-analysis': { icon: '🗳️', layer: 'analysis' },
  'election-cycle-analysis': { icon: '🗳️', layer: 'analysis' },
  'cycle-trajectory': { icon: '📈', layer: 'analysis' },
  'parliamentary-season': { icon: '📅', layer: 'analysis' },
  // ── Phase E — Risk, threat & strategic posture (L2/L3) ───────────────
  'risk-assessment': { icon: '⚠️', layer: 'analysis' },
  'risk-register': { icon: '⚠️', layer: 'analysis' },
  'sensitivity-analysis': { icon: '🎚️', layer: 'analysis' },
  'swot-analysis': { icon: '📊', layer: 'analysis' },
  'quantitative-swot': { icon: '📊', layer: 'analysis' },
  'threat-analysis': { icon: '🛡️', layer: 'intelligence' },
  'political-stride-assessment': { icon: '🛡️', layer: 'intelligence' },
  'wildcards--black-swans': { icon: '🦢', layer: 'intelligence' },
  'wildcards-blackswans': { icon: '🦢', layer: 'intelligence' },
  'pestle-analysis': { icon: '🌍', layer: 'intelligence' },
  // ── Phase F — Context & narrative environment (L3) ───────────────────
  'historical-parallels': { icon: '📜', layer: 'intelligence' },
  'comparative-international': { icon: '🌐', layer: 'intelligence' },
  'implementation-feasibility': { icon: '🏗️', layer: 'intelligence' },
  'media-framing-analysis': { icon: '📡', layer: 'intelligence' },
  // ── Phase G — Critique (L3) ──────────────────────────────────────────
  'devils-advocate': { icon: '😈', layer: 'intelligence' },
  // ── Phase H — Audit appendix & deep dives (L3) ───────────────────────
  'deep-dive-classification-results': { icon: '🗂️', layer: 'intelligence' },
  'classification-results': { icon: '🗂️', layer: 'intelligence' },
  'political-classification': { icon: '🗂️', layer: 'intelligence' },
  'deep-dive-cross-reference-map': { icon: '🔗', layer: 'intelligence' },
  'cross-reference-map': { icon: '🔗', layer: 'intelligence' },
  'cross-references': { icon: '🔗', layer: 'intelligence' },
  'deep-dive-methodology--limitations': { icon: '🔬', layer: 'intelligence' },
  'methodology-reflection': { icon: '🔬', layer: 'intelligence' },
  'deep-dive-data-download-manifest': { icon: '📥', layer: 'intelligence' },
  'data-download-manifest': { icon: '📥', layer: 'intelligence' },
  'full-text-fetch-outcomes': { icon: '📃', layer: 'intelligence' },
  'analysis-artifact-coverage-report': { icon: '✅', layer: 'intelligence' },
  'source-assessment': { icon: '📚', layer: 'intelligence' },
  'sources': { icon: '📚', layer: 'intelligence' },
};

/**
 * Keyword → icon/layer fallbacks applied when a slug is not in
 * {@link SECTION_META} (e.g. dynamic per-document or per-theme headings such
 * as `theme-3-...`). Ordered most-specific first; the first matching keyword
 * wins. Keyed on substrings of the normalized slug, so they remain effective
 * even for numbered or suffixed variants.
 */
const SECTION_KEYWORD_FALLBACKS: ReadonlyArray<readonly [RegExp, { icon: string; layer: TocLayer }]> = [
  [/deep-dive/, { icon: '🔬', layer: 'intelligence' }],
  [/threat|stride/, { icon: '🛡️', layer: 'intelligence' }],
  [/risk/, { icon: '⚠️', layer: 'analysis' }],
  [/scenario|wildcard|black-swan/, { icon: '🔮', layer: 'intelligence' }],
  [/swot|strength|weakness|opportunit/, { icon: '📊', layer: 'analysis' }],
  [/election|electoral|vote|voter/, { icon: '🗳️', layer: 'analysis' }],
  [/coalition/, { icon: '🤝', layer: 'analysis' }],
  [/stakeholder|actor/, { icon: '👥', layer: 'analysis' }],
  [/forward|indicator|trigger/, { icon: '🔭', layer: 'analysis' }],
  [/significance|score/, { icon: '⭐', layer: 'analysis' }],
  [/media|framing|narrative/, { icon: '📡', layer: 'intelligence' }],
  [/histor/, { icon: '📜', layer: 'intelligence' }],
  [/comparativ|international/, { icon: '🌐', layer: 'intelligence' }],
  [/feasibil|implementation/, { icon: '🏗️', layer: 'intelligence' }],
  [/methodolog|limitation/, { icon: '🔬', layer: 'intelligence' }],
  [/manifest|download/, { icon: '📥', layer: 'intelligence' }],
  [/source|reference/, { icon: '📚', layer: 'intelligence' }],
  [/theme|document|provision|dok/, { icon: '📄', layer: 'analysis' }],
  [/summary|synthesis|brief|finding|judgment|judgement/, { icon: '🔑', layer: 'quick' }],
];

/** Default icon/layer for sections that match neither the map nor a keyword. */
const SECTION_META_DEFAULT: { icon: string; layer: TocLayer } = { icon: '📌', layer: 'analysis' };

/**
 * Normalize a heading `id` to its canonical slug by stripping the `rm-`
 * prefix and any trailing `-<digits>` de-duplication suffix appended by the
 * slug generator (e.g. `rm-risk-assessment-7` → `risk-assessment`).
 */
function normalizeSlug(id: string): string {
  return id.replace(/^rm-/, '').replace(/-\d+$/, '');
}

/** Resolve the icon + reading-depth layer for a heading `id`. */
function sectionMetaForId(id: string): { icon: string; layer: TocLayer } {
  const slug = normalizeSlug(id);
  const direct = SECTION_META[slug];
  if (direct) return direct;
  for (const [pattern, meta] of SECTION_KEYWORD_FALLBACKS) {
    if (pattern.test(slug)) return meta;
  }
  return SECTION_META_DEFAULT;
}

/**
 * Generate a sticky sidebar table of contents from H2 headings.
 *
 * The TOC is rendered as a collapsible `<details>` (open on desktop, easily
 * collapsed on mobile) inside an `<aside>` so it can sit in a sticky left
 * column next to the article body. Each entry carries a semantic icon and a
 * reading-depth layer badge (L1 quick / L2 analysis / L3 deep dive) derived
 * from the language-stable section `id`, giving readers a fast visual map of
 * the article in any of the 14 supported languages.
 *
 * Returns an empty string for very short articles (fewer than two H2s).
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

  const tocTitle = TOC_TITLE_I18N[lang] ?? TOC_TITLE_I18N['en']!;

  const items = entries
    .map((e) => {
      const { icon, layer } = sectionMetaForId(e.id);
      const layerName = LAYER_NAME_I18N[layer][lang] ?? LAYER_NAME_I18N[layer]['en']!;
      const badge = LAYER_BADGE[layer];
      return `<li data-layer="${layer}"><a href="#${escapeHtml(e.id)}">` +
        `<span class="rm-toc-icon" aria-hidden="true">${icon}</span> ` +
        `<span class="rm-toc-text">${escapeHtml(e.text)}</span>` +
        `<span class="rm-toc-layer rm-toc-layer--${layer}" title="${escapeHtml(layerName)}" aria-label="${escapeHtml(layerName)}">${badge}</span>` +
        `</a></li>`;
    })
    .join('\n');

  return `<aside class="rm-article-toc-container" aria-labelledby="rm-article-toc-heading">
<details class="rm-article-toc-details" open>
<summary class="rm-article-toc-summary" id="rm-article-toc-heading"><span class="rm-toc-summary-icon" aria-hidden="true">📑</span> ${escapeHtml(tocTitle)}</summary>
<nav class="rm-article-toc" aria-label="${escapeHtml(tocTitle)}">
<ol class="rm-article-toc-list">
${items}
</ol>
</nav>
</details>
</aside>`;
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
 *
 * Inline transforms (confidence → admiralty → timeline) are applied first.
 * Progressive disclosure is deliberately **excluded** here because it wraps
 * `<h2>` sections in `<details>` wrappers — if `splitBodyAtSecondH2()` runs
 * after this transform it may split inside a wrapper, producing malformed
 * HTML. Callers should apply {@link transformProgressiveDisclosure} to the
 * "rest" chunk **after** splitting.
 *
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

  const tocHtml = generateArticleToc(transformed, lang);
  const methodologyFooterHtml = renderMethodologyFooter(lang);

  return { transformedBody: transformed, tocHtml, methodologyFooterHtml };
}
