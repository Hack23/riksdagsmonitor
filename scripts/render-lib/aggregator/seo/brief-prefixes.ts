/**
 * @module Infrastructure/RenderLib/Aggregator/Seo/BriefPrefixes
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Per-language Executive-Brief title prefix dictionary
 *
 * @description
 * Per-`seo-metadata-contract.md` §2, the executive-brief H1 boilerplate
 * prefix (`Executive Brief — `, `Intelligence Brief — `, …) must be
 * stripped from the SERP `<title>` so the headline reads as a story, not
 * a template label. The original `cleanArticleTitle` stripper at
 * `title.ts §70` was English-only, which caused the
 * `executive-brief_<lang>.md` translations to ship the *translated*
 * boilerplate prefix verbatim — `Exekutiv sammanfattning — Sverige
 * antar AI-ansiktsigenkänningslag …` in Swedish,
 * `Zusammenfassung — Schweden verabschiedet …` in German, etc.
 *
 * Audit 2026-05-25 of `news/index_{sv,de,fr,es,nl,…}.html` confirmed
 * 50+ live SV/DE/FR/ES/NL cards shipped the untranslated boilerplate
 * prefix in the index card title. This dictionary supplies the
 * translated prefix forms so the same strip logic runs in every locale.
 *
 * The dictionary is keyed by {@link Language} (BCP-47 primary subtag) and
 * each entry holds an array of *canonical* prefix forms in that
 * language. The forms are concatenated into a single alternation regex
 * by `buildPrefixStripRegex` so the strip is O(1) per H1.
 *
 * To add a new prefix form:
 *  1. Add the canonical form to the relevant language array below.
 *  2. Add a regression test in
 *     `tests/render-lib/aggregator/seo/brief-prefixes.test.ts` (or
 *     `tests/article-seo-title-truncation.test.ts`) with the live
 *     leaking H1 from `analysis/daily/<date>/<subfolder>/executive-brief_<lang>.md`.
 *  3. Do **not** add `Executive Brief` (English) here — keep the EN
 *     fallback list in {@link ./title.ts} so unilingual tooling still
 *     strips the canonical EN form even when no language is passed.
 *
 * Each entry must be a literal string (escaped by
 * `buildPrefixStripRegex`); regex syntax in entries is intentionally
 * unsupported so editors cannot accidentally widen the strip to real
 * prose words.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../../types/language.js';

/**
 * Per-language executive-brief title prefix forms. Matched
 * case-insensitively against the start of the H1, followed by a
 * separator (` — `, ` – `, ` - `, `: `) before the actual headline.
 *
 * **Curation principle**: only include prefixes that are
 *
 *  - boilerplate scaffolding (`Executive Brief`, not `Sweden's Riksdag`)
 *  - high-frequency (seen in ≥ 2 distinct briefs in the live corpus)
 *  - unambiguous in the target language (no risk of stripping a real
 *    headline that happens to start with the same word — e.g. "Brief"
 *    alone is not safe in EN because "Brief amid …" reads as adjective).
 *
 * The English list lives in `title.ts` (kept there so unilingual
 * callers / tests don't have to import the dictionary). Entries here
 * are the *translations* of those English forms plus any language-
 * specific scaffolding labels that have been observed in the corpus.
 */
export const BRIEF_TITLE_PREFIXES: Readonly<Record<Language, readonly string[]>> = {
  en: [
    'Executive Brief',
    'Intelligence Brief',
    'Intelligence Assessment',
    'Realtime Monitor',
    'Riksdag Realtime Monitor',
    'Daily Brief',
    'BLUF',
    'TL;DR',
    'Top Line',
    'Bottom Line',
    'Political Intelligence',
  ],
  sv: [
    'Exekutiv sammanfattning',
    'Exekutivt sammandrag',
    'Underrättelsesammanfattning',
    'Underrättelsebrief',
    'Underrättelsebedömning',
    'Underrättelseanalys',
    'Realtidsmonitor',
    'Riksdagens realtidsmonitor',
    'Daglig sammanfattning',
    'Daglig brief',
    'Politisk underrättelse',
    'Politisk underrättelseanalys',
    'Sammanfattning',
  ],
  da: [
    'Resumé',
    'Eksekutivt resumé',
    'Efterretningsresumé',
    'Efterretningsbrief',
    'Efterretningsvurdering',
    'Realtidsmonitor',
    'Daglig brief',
    'Politisk efterretning',
  ],
  no: [
    'Sammendrag',
    'Eksekutivt sammendrag',
    'Etterretningssammendrag',
    'Etterretningsbrief',
    'Etterretningsvurdering',
    'Sanntidsmonitor',
    'Daglig brief',
    'Politisk etterretning',
  ],
  fi: [
    'Tiivistelmä',
    'Tiedustelutiivistelmä',
    'Tiedusteluarvio',
    'Reaaliaikainen monitori',
    'Päivittäinen tiivistelmä',
    'Poliittinen tiedustelu',
  ],
  de: [
    'Executive Summary',
    'Zusammenfassung',
    'Kurzfassung',
    'Lagebericht',
    'Geheimdienstbriefing',
    'Geheimdienst-Briefing',
    'Geheimdienstbewertung',
    'Echtzeit-Monitor',
    'Echtzeitmonitor',
    'Tagesbriefing',
    'Tages-Briefing',
    'Politische Aufklärung',
    'Politisches Lagebild',
  ],
  fr: [
    'Résumé exécutif',
    'Note de synthèse',
    'Synthèse exécutive',
    'Note exécutive',
    'Briefing de renseignement',
    'Briefing renseignement',
    'Évaluation de renseignement',
    'Evaluation de renseignement',
    'Moniteur en temps réel',
    'Briefing quotidien',
    'Renseignement politique',
    'Note de renseignement',
  ],
  es: [
    'Resumen ejecutivo',
    'Informe ejecutivo',
    'Resumen de inteligencia',
    'Informe de inteligencia',
    'Evaluación de inteligencia',
    'Monitor en tiempo real',
    'Informe diario',
    'Inteligencia política',
  ],
  nl: [
    'Samenvatting',
    'Beleidssamenvatting',
    'Executive samenvatting',
    'Inlichtingenbriefing',
    'Inlichtingenbeoordeling',
    'Realtime monitor',
    'Dagelijkse briefing',
    'Politieke inlichtingen',
  ],
  ar: [
    'ملخص تنفيذي',
    'الموجز التنفيذي',
    'موجز استخباراتي',
    'موجز الاستخبارات',
    'تقييم استخباراتي',
    'مرصد في الوقت الحقيقي',
    'الموجز اليومي',
    'الاستخبارات السياسية',
  ],
  he: [
    'תקציר מנהלים',
    'תקציר ביצועי',
    'תדרוך מודיעיני',
    'הערכה מודיעינית',
    'מסכם יומי',
    'מוניטור בזמן אמת',
    'מודיעין פוליטי',
  ],
  ja: [
    'エグゼクティブブリーフ',
    'エグゼクティブ・ブリーフ',
    'エグゼクティブサマリー',
    'エグゼクティブ・サマリー',
    '情報概要',
    'インテリジェンスブリーフ',
    'インテリジェンス・ブリーフ',
    'リアルタイムモニター',
    '日次ブリーフ',
    '政治インテリジェンス',
  ],
  ko: [
    '경영진 브리프',
    '경영 요약',
    '정보 브리프',
    '정보 평가',
    '실시간 모니터',
    '일일 브리프',
    '정치 정보',
  ],
  zh: [
    '执行摘要',
    '行政摘要',
    '情报简报',
    '情报评估',
    '实时监测',
    '每日简报',
    '政治情报',
  ],
};

/**
 * Escape characters with regex-special meaning so dictionary entries can
 * be inserted into an alternation literally. Conservative: escapes all
 * ASCII regex metacharacters; non-ASCII characters (CJK, RTL, etc.) are
 * left untouched because they have no regex semantics.
 */
function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a `RegExp` that matches any of `lang`'s prefix forms followed by
 * a separator. The match is anchored to the start of the string,
 * case-insensitive, and the separator alternation is `—` / `–` / `-` /
 * `:` with optional surrounding whitespace — matching the same set of
 * separators that the EN prefix strip in `title.ts §70` accepts.
 *
 * Returns `null` when the language has no entries (so callers can skip
 * the replace step).
 *
 * The compiled regex is cached per-language in
 * {@link PREFIX_REGEX_CACHE}. `cleanArticleTitle` runs O(thousands of
 * times) per full multi-language build, so the cache replaces a
 * per-call sort + `new RegExp` (and the implicit literal-array
 * allocation from the spread) with an `O(1)` Map lookup after the
 * first call per language.
 *
 * The dictionary is frozen (typed `Readonly`) so we can safely cache by
 * `Language` key without worrying about runtime mutation invalidating
 * a previously compiled pattern.
 *
 * Exported for testability.
 */
const PREFIX_REGEX_CACHE = new Map<Language, RegExp | null>();

export function buildPrefixStripRegex(lang: Language): RegExp | null {
  const cached = PREFIX_REGEX_CACHE.get(lang);
  if (cached !== undefined) return cached;

  const entries = BRIEF_TITLE_PREFIXES[lang];
  if (!entries || entries.length === 0) {
    PREFIX_REGEX_CACHE.set(lang, null);
    return null;
  }
  // Sort by length (descending) so longer compound prefixes are matched
  // before their shorter substrings (e.g. `Riksdag Realtime Monitor`
  // must match before `Realtime Monitor`, otherwise the longer form
  // leaves `Riksdag — ` as a leading fragment).
  const sorted = [...entries].sort((a, b) => b.length - a.length);
  const alternation = sorted.map(escapeRegex).join('|');
  const re = new RegExp(`^(?:${alternation})\\s*[—–\\-:]\\s*`, 'i');
  PREFIX_REGEX_CACHE.set(lang, re);
  return re;
}

/**
 * Reset the per-language regex cache. Exported for tests that mutate
 * the dictionary at runtime (production callers should never need
 * this — the dictionary is module-level constant data).
 */
export function _resetPrefixRegexCacheForTests(): void {
  PREFIX_REGEX_CACHE.clear();
}

/**
 * Strip a leading executive-brief prefix from `text` for the given
 * language. When `lang` is omitted or has no dictionary entry, returns
 * the text unchanged. The EN prefix list lives in `title.ts` and is
 * applied separately; this function complements (does not replace) the
 * EN-only strip in {@link ./title.ts}.
 *
 * Pure function — no side effects, no allocations beyond the regex.
 */
export function stripBriefPrefix(text: string, lang: Language): string {
  const re = buildPrefixStripRegex(lang);
  if (!re) return text;
  return text.replace(re, '');
}
