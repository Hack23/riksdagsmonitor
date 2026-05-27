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
 *  3. The `en` key contains the canonical English prefixes so that
 *     language-aware callers using this dictionary (which iterate all
 *     languages) strip the EN forms as well. The same list is
 *     duplicated in {@link ./title.ts} for unilingual callers that
 *     don't import the full dictionary.
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
    'Beslutsunderlag',
    'Beslutsstöd',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'Underrättelsebriefing',
    'Verkställande sammanfattning',
    'Verksamhetsbriefing',
    'Verkställande resumé',
    'Underrättelserapport',
    'Kortanalys',
    'Verksamhetsöversikt',
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
    'Beslutningsunderlag',
    'Beslutningsgrundlag',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'Efterretningsbriefing',
    'Eksekutiv sammenfatning',
    'Eksekutiv resumé',
    'Efterretningsoversigt',
    'Eksekutiv briefing',
    'Kortanalyse',
    'Ledende resumé',
    'Kortfattet resumé',
    'Kortfattet orientering',
    'Eksekutiv orientering',
    'Efterretningsrapport',
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
    'Beslutningsunderlag',
    'Beslutningsgrunnlag',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'Etterretningsbriefing',
    'Utøvende sammendrag',
    'Eksekutiv sammendrag',
    'Ledersammendrag',
    'Kortfattet sammendrag',
    'Etterretningsoversikt',
    'Beslutningsnotat',
    'Kortanalyse',
    'Kortrapport',
    'Etterretningsrapport',
    'Eksekutivsammendrag',
  ],
  fi: [
    'Tiivistelmä',
    'Tiedustelutiivistelmä',
    'Tiedusteluarvio',
    'Reaaliaikainen monitori',
    'Päivittäinen tiivistelmä',
    'Poliittinen tiedustelu',
    'Päätösanalyysi',
    'Päätöstuki',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'Toimeenpaneva tiivistelmä',
    'Johdon tiivistelmä',
    'Johtava yhteenveto',
    'Tiedusteluyhteenveto',
    'Johtoryhmän tiivistelmä',
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
    'Entscheidungsunterlage',
    'Entscheidungsgrundlage',
    'Entscheidungsanalyse',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'Nachrichtenbriefing',
    'Exekutivbriefing',
    'Exekutivzusammenfassung',
    'Exekutivbericht',
    'Kurzinformation',
    'Kurzanalyse',
    'Exekutiv-Briefing',
    'Kurzübersicht',
    'Kurzbericht',
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
    "Note d'analyse décisionnelle",
    'Note décisionnelle',
    'Analyse décisionnelle',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'Synthèse de renseignement',
    'Briefing de direction',
    'Note de synthèse exécutive',
    'Synthèse',
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
    'Nota de análisis decisional',
    'Análisis decisional',
    'Nota decisional',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'Nota ejecutiva',
    'Nota de inteligencia',
    'Resumen ejecutivo de inteligencia',
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
    'Beslissingsanalyse',
    'Beslissingsondersteunend document',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'Uitvoerende samenvatting',
    'Uitvoerend briefing',
    'Uitvoerend overzicht',
    'Uitvoerende briefing',
    'Managementsamenvatting',
    'Inlichtingenbrief',
    'Inlichtingenrapport',
    'Beknopte briefing',
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
    'موجز تنفيذي',
    'تحليل القرار',
    'مذكرة تحليلية',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'الملخص التنفيذي',
    'ملخص الاستخبارات',
    'إحاطة استخباراتية',
  ],
  he: [
    'תקציר מנהלים',
    'תקציר ביצועי',
    'תדרוך מודיעיני',
    'הערכה מודיעינית',
    'מסכם יומי',
    'מוניטור בזמן אמת',
    'מודיעין פוליטי',
    'הערכת מצב תמציתית',
    'הערכת מצב',
    'ניתוח החלטות',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    'סיכום מנהלים',
    'תדריך מנהלים',
    'תדריך מודיעין',
    'תקציר מודיעיני',
    'תמצית מנהלים',
    'סיכום מקבלי החלטות',
    'סיכום מודיעיני',
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
    '意思決定分析',
    '決定分析',
    '意思決定支援',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    '情報ブリーフィング',
    'インテリジェンス・ブリーフィング',
    'インテリジェンスブリーフィング',
    'エグゼクティブ・ブリーフィング',
    '意思決定者向けエグゼクティブブリーフ',
    'インテリジェンス概要',
  ],
  ko: [
    '경영진 브리프',
    '경영 요약',
    '정보 브리프',
    '정보 평가',
    '실시간 모니터',
    '일일 브리프',
    '정치 정보',
    '의사결정 분석',
    '결정 분석',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    '집행 브리핑',
    '정보 브리핑',
    '임원 브리핑',
    '행정 브리핑',
    '집행 요약',
    '인텔리전스 브리핑',
    '임원 요약',
    '요약 보고서',
  ],
  zh: [
    '执行摘要',
    '行政摘要',
    '情报简报',
    '情报评估',
    '实时监测',
    '每日简报',
    '政治情报',
    '决策分析简报',
    '决策分析',
    '决策支持',
    // Corpus-observed additions (≥2 occurrences in analysis/daily)
    '执行简报',
    '行政简报',
    '情报概要',
    '情报摘要',
    '决策者执行简报',
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
