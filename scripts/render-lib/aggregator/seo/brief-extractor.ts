/**
 * @module Infrastructure/RenderLib/Aggregator/Seo/BriefExtractor
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Executive-brief entity & section extractor
 *
 * @description
 * Pure, stateless extraction layer that mines an `executive-brief.md` (in
 * any of the 14 supported languages) for the structured signal needed to
 * compose a high-quality `<head>` triple — `<title>`, `<meta description>`,
 * `<meta keywords>` — without any of the boilerplate noise that polluted
 * the previous SERP output.
 *
 * The extractor returns two things:
 *
 *   1. **Entities** ({@link BriefEntities}) — universal codes that are
 *      language-agnostic and high-signal for SEO:
 *        - bill IDs            (`HD03267`, `HD024192`, `HD01JuU28`, …)
 *        - proposition refs    (`prop. 2025/26:267`)
 *        - committee codes     (`JuU`, `SfU`, `FöU`, `SkU`, `TU`, `KU`,
 *                              `SoU`, `FiU`, `CU`, `UU`, `KrU`, `MJU`,
 *                              `NU`, `UbU`, `AU`, `RU`, `EU`, `UFöU`)
 *        - committee report IDs (`JuU28`, `FiU40`, `UbU22`, `CU36`, …)
 *        - party codes         (`M`, `S`, `KD`, `SD`, `L`, `C`, `V`, `MP`)
 *        - named actors        (Title-Case multi-word noun phrases that are
 *                              statistically rare across the corpus — Busch,
 *                              Kristersson, Waltersson Grönvall, …)
 *
 *      These are mined from the **English** brief by default because the
 *      bill IDs, committee codes, party codes, and propositional refs are
 *      Swedish-administrative identifiers that survive untranslated across
 *      every brief locale. Named actors are mined per-locale because they
 *      transliterate differently in CJK / RTL scripts.
 *
 *   2. **Headline section** ({@link BriefHeadlineSection}) — the cleaned
 *      bullet-list lines under the brief's headline-summary section. The
 *      headline section name varies by language:
 *
 *        - EN: `## 60-Second Read` / `## Key Findings` / `## Highlights` /
 *              `## Top Lines` / `## Top-Line Findings`
 *        - SV: `## Nyckelrön` / `## 60-sekunders sammanfattning`
 *        - DA: `## Nøglefund` / `## 60-sekunders resumé`
 *        - NO: `## Nøkkelfunn` / `## 60-sekunders sammendrag`
 *        - FI: `## Tärkeimmät havainnot` / `## 60-sekunnin tiivistelmä`
 *        - DE: `## Wesentliche Erkenntnisse` / `## 60-Sekunden-Überblick`
 *        - FR: `## Points clés` / `## Synthèse 60 secondes`
 *        - ES: `## Hallazgos clave` / `## Resumen en 60 segundos`
 *        - NL: `## Kernbevindingen` / `## 60-seconden samenvatting`
 *        - AR: `## النتائج الرئيسية` / `## قراءة في 60 ثانية`
 *        - HE: `## ממצאים מרכזיים` / `## קריאה ב-60 שניות`
 *        - JA: `## 主要な発見` / `## 60秒で読む`
 *        - KO: `## 주요 발견` / `## 60초 요약`
 *        - ZH: `## 关键发现` / `## 60秒速读`
 *
 *      When no headline section is present, the BLUF section serves as the
 *      fallback headline summary.
 *
 * The module is **pure** — no I/O, no clock, no environment. The caller
 * (aggregator or article-merge cascade) is responsible for reading the
 * brief markdown from disk.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../../types/language.js';
import { ADMIN_FIELD_RE, stripLeadingAdminBylines } from '../cleaning/admin-bylines.js';

/**
 * Universal Swedish-administrative codes mined from the brief.
 *
 * All fields are de-duplicated, length-capped, and ordered by appearance
 * (which roughly correlates with editorial priority since the brief's H1
 * + BLUF mention the most important codes first).
 */
export interface BriefEntities {
  /** Document IDs (e.g. `HD03267`, `HD024192`, `HD01JuU28`). */
  readonly billIds: readonly string[];
  /** Proposition references (e.g. `prop. 2025/26:267`). */
  readonly propositionRefs: readonly string[];
  /** Committee codes (e.g. `JuU`, `SfU`, `FöU`). */
  readonly committeeCodes: readonly string[];
  /** Committee report IDs (e.g. `JuU28`, `FiU40`, `UbU22`). */
  readonly committeeReportIds: readonly string[];
  /** Party codes (e.g. `M`, `S`, `KD`, `SD`, `L`, `C`, `V`, `MP`). */
  readonly partyCodes: readonly string[];
  /** Title-Case multi-word noun phrases (named actors, agencies, topics). */
  readonly namedEntities: readonly string[];
}

/**
 * Cleaned headline-summary section (`## 60-Second Read` or localized
 * equivalent). When the brief has no such section, `bullets` is empty
 * and the caller falls back to the BLUF paragraph.
 */
export interface BriefHeadlineSection {
  /** The H2 heading text matched (post-cleanup), or `null` when none. */
  readonly heading: string | null;
  /**
   * Cleaned bullet lines (one per `- ` / `* ` / `• ` item), with markdown
   * bold/italic markers stripped and emoji prefixes removed.
   */
  readonly bullets: readonly string[];
}

/**
 * Per-language headline-section name candidates. Matched case-insensitively
 * against the trimmed H2 heading text (after stripping leading emoji and
 * `##` markers).
 *
 * Keep ordering by editorial preference: the most newsworthy / structured
 * heading comes first. If both `60-Second Read` and `Key Findings` are
 * present (rare), the first match wins.
 *
 * The candidate lists below were calibrated against the live corpus of
 * 178 EN briefs × 13 translated copies (≈2 500 files) — every entry
 * matches an H2 heading observed at least 6× in production briefs, so
 * `extractHeadlineSection` matches ≥40% of non-EN briefs (≥80% for
 * the Latin-alphabet languages). See `/tmp/check-h2s-by-type.mjs` /
 * `tests/brief-extractor.test.ts` for the per-language verification.
 */
const LANG_HEADLINE_SECTION_NAMES: Readonly<Record<Language, readonly string[]>> = {
  en: [
    '60-second read', '60 second read',
    '60-second intelligence read', '60 second intelligence read',
    '60-second intelligence points', '60 second intelligence points',
    '60-second intelligence summary', '60 second intelligence summary',
    '60-second summary', '60 second summary',
    '60-second overview', '60 second overview',
    'top-line findings', 'top lines', 'key findings', 'highlights',
    'what readers need to know in 60 seconds',
  ],
  sv: [
    '60 sekunders läsning', '60-sekunders läsning',
    '60-sekundersläsning',
    '60 sekunders underrättelseläsning', '60-sekunders underrättelseläsning',
    '60 sekunders underrättelsepunkter', '60-sekunders underrättelsepunkter',
    '60-sekunders sammanfattning', '60 sekunders sammanfattning',
    '60-sekunders punkter', '60 sekunders punkter',
    '60-sekunders översikt', '60 sekunders översikt',
    '60-sekunders underrättelseläge', '60 sekunders underrättelseläge',
    'nyckelrön', 'huvudfynd', 'huvudpunkter', 'höjdpunkter',
    'vad läsare behöver veta på 60 sekunder',
    'vad läsaren behöver veta på 60 sekunder',
    'vad redaktörer behöver veta på 60 sekunder',
  ],
  da: [
    '60 sekunders læsning', '60-sekunders læsning',
    '60 sekunders efterretningslæsning', '60-sekunders efterretningslæsning',
    '60 sekunders efterretningspunkter', '60-sekunders efterretningspunkter',
    '60-sekunders resumé', '60 sekunders resumé',
    '60-sekunders punkter', '60 sekunders punkter',
    '60-sekunders oversigt', '60 sekunders oversigt',
    'nøglefund', 'hovedpunkter', 'hovedfund',
    'hvad læsere skal vide på 60 sekunder',
  ],
  no: [
    '60 sekunders lesning', '60-sekunders lesning',
    '60 sekunders etterretningslesning', '60-sekunders etterretningslesning',
    '60 sekunders etterretningspunkter', '60-sekunders etterretningspunkter',
    '60-sekunders sammendrag', '60 sekunders sammendrag',
    '60-sekunders punkter', '60 sekunders punkter',
    '60-sekunders oversikt', '60 sekunders oversikt',
    'nøkkelfunn', 'hovedpunkter', 'hovedfunn',
    'hva lesere må vite på 60 sekunder',
  ],
  fi: [
    '60 sekunnin lukeminen',
    '60 sekunnin tiedusteluluku',
    '60 sekunnin tiedustelutiivistelmä',
    '60-sekunnin tiivistelmä', '60 sekunnin tiivistelmä',
    '60 sekunnin tiedustelupisteet',
    '60 sekunnin katsaus',
    '60 sekunnin yhteenveto',
    '60 sekunnin pisteet',
    'tärkeimmät havainnot', 'kohokohdat', 'avaintulokset',
    'mitä lukijoiden täytyy tietää 60 sekunnissa',
  ],
  de: [
    '60 sekunden-lektüre', '60-sekunden-lektüre',
    '60 sekunden lektüre',
    '60 sekunden nachrichtendienstliche lektüre',
    '60-sekunden nachrichtendienstliche lektüre',
    '60 sekunden nachrichtendienstliche punkte',
    '60-sekunden nachrichtendienstliche punkte',
    '60-sekunden-überblick', '60-sekunden überblick',
    '60-sekunden-zusammenfassung', '60 sekunden-zusammenfassung',
    '60-sekunden-geheimdienstpunkte', '60 sekunden-geheimdienstpunkte',
    '60-sekunden-nachrichtenpunkte', '60 sekunden-nachrichtenpunkte',
    '60-sekunden-nachrichtenüberblick', '60 sekunden-nachrichtenüberblick',
    '60-sekunden-punkte', '60 sekunden-punkte',
    'wesentliche erkenntnisse', 'kernpunkte', 'höhepunkte',
    'was leser in 60 sekunden wissen müssen',
  ],
  fr: [
    'lecture en 60 secondes', 'lecture de 60 secondes',
    'lecture de renseignement en 60 secondes',
    'lecture renseignement en 60 secondes',
    'points de renseignement en 60 secondes',
    'points en 60 secondes',
    'synthèse 60 secondes', 'synthèse en 60 secondes',
    'résumé en 60 secondes', 'résumé de 60 secondes',
    'aperçu en 60 secondes', 'aperçu de 60 secondes',
    'points clés', 'principaux constats', 'faits marquants',
    'principales conclusions',
    'ce que le lecteur doit savoir en 60 secondes',
  ],
  es: [
    'lectura de 60 segundos', 'lectura en 60 segundos',
    'lectura de inteligencia de 60 segundos',
    'lectura de inteligencia en 60 segundos',
    'puntos de inteligencia en 60 segundos',
    'puntos de inteligencia de 60 segundos',
    'puntos en 60 segundos',
    'resumen en 60 segundos', 'resumen de 60 segundos',
    'panorama en 60 segundos', 'panorama de 60 segundos',
    'hallazgos clave', 'puntos clave', 'aspectos destacados',
    'principales hallazgos',
    'lo que los lectores necesitan saber en 60 segundos',
  ],
  nl: [
    '60 seconden lezing', '60-seconden lezing',
    '60-seconden-lezing', '60-secondenlezing',
    '60 seconden inlichtingenlezing', '60-seconden inlichtingenlezing',
    '60 seconden inlichtingenpunten', '60-seconden inlichtingenpunten',
    '60-seconden samenvatting', '60 seconden samenvatting',
    '60-seconden overzicht', '60 seconden overzicht',
    '60-seconden punten', '60 seconden punten',
    'kernbevindingen', 'kernpunten', 'hoogtepunten',
    'wat lezers in 60 seconden moeten weten',
  ],
  ar: [
    'قراءة 60 ثانية', 'قراءة في 60 ثانية', 'قراءة لمدة 60 ثانية',
    'قراءة استخباراتية في 60 ثانية', 'قراءة استخبارية في 60 ثانية',
    'القراءة الاستخباراتية في 60 ثانية',
    'القراءة في 60 ثانية',
    'نقاط الاستخبارات في 60 ثانية', 'نقاط استخباراتية في 60 ثانية',
    'نقاط استخبارية في 60 ثانية',
    'ملخص 60 ثانية', 'ملخص في 60 ثانية',
    'نظرة عامة في 60 ثانية',
    'النتائج الرئيسية', 'أبرز النقاط', 'أهم النقاط', 'أبرز النتائج',
    'ما يحتاج القراء إلى معرفته في 60 ثانية',
  ],
  he: [
    'קריאה של 60 שניות', 'קריאה ב-60 שניות', 'קריאה ב 60 שניות',
    'קריאת 60 שניות',
    'קריאת מודיעין של 60 שניות', 'קריאת מודיעין ב-60 שניות',
    'נקודות מודיעין של 60 שניות', 'נקודות מודיעין ב-60 שניות',
    'נקודות מידע ב-60 שניות', 'נקודות מידע של 60 שניות',
    'סיכום ב-60 שניות', 'סיכום של 60 שניות',
    'סקירה ב-60 שניות',
    'ממצאים מרכזיים', 'עיקרי הדברים', 'נקודות עיקריות',
    'מה הקוראים צריכים לדעת ב-60 שניות',
  ],
  ja: [
    '60秒で読む', '60秒読み', '60秒読解',
    '60秒情報読み', '60秒インテリジェンス読み',
    '60秒情報ポイント', '60秒インテリジェンスポイント',
    '60秒インテリジェンス要点', '60秒情報要点',
    '60秒サマリー', '60秒の概要', '60秒概要',
    '60秒要約', '60秒まとめ',
    '主要な発見', '主要ポイント', '主要判断', 'ハイライト', '要点',
    '読者が60秒で知るべきこと',
  ],
  ko: [
    '60초 읽기', '60초 요약', '60초 리딩',
    '60초 정보 읽기', '60초 인텔리전스 읽기',
    '60초 정보 포인트', '60초 인텔리전스 포인트',
    '60초 개요', '60초 정리',
    '주요 발견', '핵심 사항', '하이라이트', '주요 포인트',
    '독자가 60초 안에 알아야 할 것',
  ],
  zh: [
    '60秒速读', '60秒阅读', '60秒要点',
    '60秒情报阅读', '60秒情报速读',
    '60秒情报要点', '60秒情报点',
    '60秒摘要', '60秒情报摘要', '60秒情报简报',
    '60秒速览', '60秒概览', '60秒概述',
    '关键发现', '主要发现', '要点', '亮点',
    '读者60秒须知',
  ],
};

/**
 * Per-language BLUF-equivalent H2 heading candidates. The English `BLUF`
 * acronym is preserved in roughly half of translated briefs (analysts
 * keep the term as a recognised intelligence convention), so the default
 * `BLUF\b` regex in {@link ../description.ts#readBlufParagraph} still
 * matches them. The remaining briefs use a localised summary heading
 * (`## Sammanfattning`, `## Resumen`, `## 핵심 요약`, …), and without
 * recognising these, the SEO description silently falls back to the
 * admin-byline-polluted first paragraph.
 *
 * Each candidate must be a complete H2 heading body (post-emoji-stripped,
 * lowercased) that an editor would write *instead* of `BLUF`. Names are
 * sourced from observed corpus headings (≥3× across the 14×178 brief
 * matrix) and the canonical translation glossary used by the
 * `news-translate` workflow. Ordering follows editorial preference: the
 * most authoritative / specific heading first.
 */
export const LANG_BLUF_SECTION_NAMES: Readonly<Record<Language, readonly string[]>> = {
  en: [
    'bluf', 'bottom line up front', 'tl;dr', 'bottom line', 'top line',
    'executive summary', 'key judgments', 'key judgements',
    'strategic intelligence assessment', 'intelligence summary',
    'core judgment', 'core judgement', 'one-line assessment',
  ],
  sv: [
    'bluf', 'sammanfattning', 'slutsats', 'huvudbudskap', 'kärnbudskap',
    'kärnslutsats', 'kortfattad lägesbedömning',
    'strategisk underrättelsebedömning', 'strategisk bedömning',
    'underrättelsesammanfattning', 'underrättelseläge',
    'nyckeldomslut', 'nyckeldomsslut', 'kärnbedömning', 'bedömning i en mening',
    'exekutiv sammanfattning', 'övergripande bedömning',
    'signifikanssummering', 'signifikansöversikt',
    'fempunktsammanfattning', 'bildningsförhandsvisning',
    'lägesbild', 'kortfattad bedömning',
    'ledande underrättelsebedömning', 'ettradsbedömning', 'enbedömning',
    'nyckeldomslutsatser',
    'beslut som krävs omedelbart', 'ettrads-intro', '60-sekundersbullets',
    'stödda nyckelbeslut', 'lägesrapport', 'fem bedömningar vid 365 dagar',
    'topprads underrättelse',
    'underrättelsesummering',
  ],
  da: [
    'bluf', 'konklusion', 'sammenfatning', 'kernebudskab', 'hovedbudskab',
    'kortfattet resumé', 'nøglevurderinger',
    'strategisk efterretningsvurdering', 'strategisk vurdering',
    'efterretningssammenfatning', 'vigtigste fund',
    'kernevurdering', 'eksekutiv sammenfatning',
    'overordnet vurdering', 'signifikansoversigt', 'fempunktsopsummering',
    'fempunktssammenfatning', 'forhåndsvisning af dannelsen',
    'kortfattet vurdering', 'kernedømmelser',
    'sammenfattende enstykkeanalyse',
    'situation', 'ledende efterretningsvurdering',
    'étnlinjebedømmelse', 'nøgledomme', 'top-5 konklusioner',
    'efterretningsoversigt', 'vigtigste fund',
    'beslutninger der kræves straks', 'resumé', 'énlinjet indledning',
    '60-sekunders nøglepunkter', 'situationsrapport',
    'fem vurderinger ved 365 dage', 'topniveauefterforskning',
  ],
  no: [
    'bluf', 'konklusjon', 'sammendrag', 'kjernebudskap', 'hovedbudskap',
    'nøkkelvurderinger', 'strategisk etterretningsvurdering',
    'strategisk vurdering', 'etterretningssammendrag',
    'viktigste funn', 'kjernevurdering', 'eksekutivt sammendrag',
    'overordnet vurdering', 'signifikansoppsummering',
    'fempunktsoppsummering', 'forhåndsvisning av dannelsen',
    'fempunktssammendrag', 'kortfattet',
    'ledende etterretningsvurdering', 'situasjon',
    'beslutninger som kreves umiddelbart', 'énlinjevurdering',
    'énlinjes ingress', '60-sekunders nøkkelpunkter',
    'situasjonsrapport', 'fem vurderinger ved 365 dager',
    'toppinformasjon',
    '60-sekunders lesing',
  ],
  fi: [
    'bluf', 'yhteenveto', 'tiivistelmä', 'johtopäätös',
    'lyhyt yhteenveto', 'ydinviesti', 'ydinarvio', 'ydinyhteenveto',
    'keskeiset arviot', 'strateginen tiedusteluarvio',
    'strateginen arvio', 'tiedusteluyhteenveto',
    'ydinhavainto', 'tiivis tilannearvio', 'tiivistelmä yhdellä lauseella',
    'merkittävyysyhteenveto', 'kokonaisarvio',
    'viisikohtainen yhteenveto', 'hallituksen muodostamisen esikatselu',
    'keskeisarviot', 'strateginen kuva',
    'toimintayhteenveto', 'lyhyesti', 'muodostamisen ennakkoesittely',
    'lyhyt arvio', 'johtava tiedusteluarvio', 'yhden rivin arvio',
    'välittömästi vaadittavat päätökset', 'pääuutinen', 'yksittäinen arvio',
    'yksirivisotsikko', '60 sekunnin pääkohdat', 'tilanneraportti',
    'viisi arviota 365 päivässä', 'huipputason tiedustelu', 'huippotason tiedustelu',
  ],
  de: [
    'bluf', 'zusammenfassung', 'fazit', 'kernaussage', 'kernbotschaft',
    'schlussfolgerung', 'kurzfassung', 'kurzzusammenfassung',
    'kernurteile', 'wichtigste erkenntnisse', 'wichtige entwicklungen',
    'strategische nachrichtendienstliche bewertung',
    'strategische bewertung', 'nachrichtendienstliche zusammenfassung',
    'kernbewertung', 'einschätzung in einem satz',
    'übergeordnete einschätzung', 'signifikanzübersicht',
    'strategisches bild', 'kerturteile',
    'fünf-punkte-zusammenfassung', 'regierungsbildung-vorschau',
    'vorschau auf die regierungsbildung', 'fünfpunktzusammenfassung',
    'kurzbewertung', 'lage', 'lagebewertung', 'kurze lagebeurteilung',
    'führendes geheimdiensturteil',
    'sofort erforderliche entscheidungen', 'wichtigste geheimdiensterkenntnisse',
    'kernmeldung', 'einzelbewertung', 'bewertung in einem satz',
    'geheimdienstzusammenfassung', 'einzeiler-schlagzeile',
    '60-sekunden-kernpunkte', 'lagebericht',
    'fünf einschätzungen bei 365 tagen', 'drei-satz-lede', 'topnachrichten',
    'schlüsselbewertungen', 'schlüsseleinschätzungen',
  ],
  fr: [
    'bluf', 'conclusion', 'résumé', 'message clé', 'synthèse', 'essentiel',
    'jugements clés', 'principales conclusions',
    'synthèse du renseignement', 'évaluation stratégique du renseignement',
    'évaluation stratégique', 'évaluation en une ligne',
    'évaluation centrale', 'résumé exécutif',
    'évaluation générale', "récapitulatif de l'importance",
    'jugement de renseignement principal',
    'aperçu de la formation', 'résumé en cinq points',
    'décisions immédiates requises', 'évaluation unique',
    "phrase d'accroche", 'points essentiels en 60 secondes',
    'rapport de situation', 'cinq jugements à 365 jours',
    'renseignement de premier rang',
    // Corpus-observed heading variants (keep longer-first in the list so
    // they are matched before the shorter `synthèse` / `évaluation` stems)
    'évaluation de situation synthétique',
    'évaluation de situation',
  ],
  es: [
    'bluf', 'conclusión', 'resumen', 'resumen ejecutivo',
    'mensaje clave', 'idea clave',
    'juicios clave', 'principales hallazgos',
    'síntesis de inteligencia', 'evaluación estratégica de inteligencia',
    'evaluación estratégica', 'evaluación en una línea',
    'evaluación central',
    'evaluación general', 'resumen de importancia', 'valoración ejecutiva',
    'vista previa de la formación', 'resumen de cinco puntos',
    'decisiones inmediatas requeridas', 'juicio de inteligencia principal',
    'evaluación única', 'evaluación en una frase',
    'encabezado en una frase', 'informe de situación',
    'cinco valoraciones a 365 días', 'inteligencia de primera línea',
    // Corpus-observed heading variants
    'síntesis de situación',
    'síntesis ejecutiva',
  ],
  nl: [
    'bluf', 'conclusie', 'samenvatting', 'kernboodschap',
    'belangrijkste boodschap',
    'kernbevinding', 'kernoordelen', 'kernoordeelen', 'belangrijkste inlichtingenbevinding',
    'inlichtingensamenvatting', 'strategische inlichtingenbeoordeling',
    'strategische beoordeling', 'kernoordeel', 'kernbeoordeling',
    'managementsamenvatting',
    'overkoepelende beoordeling', 'significantieoverzicht',
    'vijfpuntssamenvatting', 'voorvertoning van de formatie',
    'situatie', 'beknopte beoordeling',
    'leidend inlichtingsoordeel', 'enkelbeoordeling', 'kopregel in één zin',
    'onmiddellijk vereiste beslissingen', 'ondersteunde beslissingen',
    'situatierapport', 'vijf oordelen bij 365 dagen',
    'topintelligentie', 'situatiebeoordeling', 'korte situatiebeoordeling',
  ],
  ar: [
    'bluf',
    'الملخص التنفيذي', 'الخلاصة التنفيذية', 'الخلاصة',
    'الرسالة الرئيسية', 'الفكرة الرئيسية',
    'الأحكام الرئيسية', 'الموجز التنفيذي', 'الملخص',
    'موجز تنفيذي', 'ملخص تنفيذي',
    'التقييم الاستراتيجي', 'التقييم الاستراتيجي للاستخبارات',
    'الاستنتاج أولاً', 'الموجز الاستخباراتي',
    'تقييم في جملة واحدة',
    'الرسالة الجوهرية', 'ملخص الأهمية', 'التقييم العام',
    'مقدمة تشكيل الحكومة', 'ملخص استخباراتي في فقرة واحدة',
    'الأحكام الجوهرية',
    'الإشارات الرئيسية', 'استنتاج النتيجة الانتخابية',
    'الحكم الاستخباراتي الرئيسي',
    'القرارات المطلوبة فوراً', 'أبرز الاستنتاجات الاستخباراتية',
    'الاستنتاج', 'ملخص في فقرة واحدة', 'العنوان الرئيسي',
    'التقييم الوحيد', 'المقدمة في جملة واحدة',
    'النقاط الرئيسية في 60 ثانية', 'تقرير الوضع',
    'خمسة أحكام عند 365 يوماً', 'أبرز المعلومات الاستخباراتية',
    'ملخص',
  ],
  he: [
    'bluf',
    'תמצית מנהלים', 'תקציר מנהלים', 'תמצית', 'תקציר',
    'מסר מרכזי', 'שורה תחתונה',
    'סיכום מנהלים', 'מסקנה', 'סיכום',
    'שיפוטים מרכזיים', 'סיכום מודיעיני',
    'הערכה מודיעינית אסטרטגית', 'הערכה אסטרטגית',
    'הערכה בשורה אחת', 'מסקנה ראשונה',
    'הערכה כללית', 'סיכום חשיבות', 'כותרת ראשית',
    'פסיקות מפתח', 'תמונה אסטרטגית',
    'הערכת מודיעין מובילה', 'תצוגה מקדימה של ההקמה',
    'הערכה יחידה', 'הערכות מפתח', 'כותרת בשורה אחת',
    'החלטות נדרשות מיידית', 'נקודות מפתח ב-60 שניות',
    'דו"ח מצב', 'חמישה פסקי דין ב-365 ימים', 'מודיעין בכיר',
    'הערכת מצב תמציתית', 'הערכת מצב',
  ],
  ja: [
    'bluf', '要約', '要旨', '結論', '主要判断', '要点', 'まとめ',
    'エグゼクティブサマリー', '情報サマリー', '総合評価',
    '戦略情報評価', '戦略的評価',
    '中核判断', '核心要約', '一文評価',
    '結論から', '結論先出し',
    '概要', '核心メッセージ', '結論優先の要約',
    '行動要約', '重要度サマリー', '5点エグゼクティブサマリー',
    '政権発足の展望',
    '主要インテリジェンス評価', '戦略的インテリジェンス評価',
    '現状', '戦略的意義', '主要情報調査結果',
    '即時対応が必要な決定事項', '主要情報判断', '単一評価',
    '一行見出し', '60秒でわかるポイント', '支持された主要決定',
    '60秒読み', '状況報告', '365日における5つの判断',
    '最優先インテリジェンス',
  ],
  ko: [
    'bluf', '핵심 요약', '요약', '결론', '주요 판단', '핵심 메시지',
    '핵심 판단', '한 줄 평가', '전략 정보 평가', '전략적 정보 평가',
    '전략적 평가', '정보 요약', '핵심 결론',
    '경영진 요약', '간단 평가',
    '종합 평가', '중요도 요약', '핵심 정보 판단',
    '정권 구성 미리보기', '다섯 가지 요점 요약',
    '즉각적인 결정 사항', '단일 평가', '60초 핵심 포인트',
    '상황 보고서', '365일에서의 5가지 판단', '최우선 정보',
  ],
  zh: [
    'bluf', '执行摘要', '核心摘要', '摘要', '结论', '关键结论', '要点摘要',
    '核心结论', '关键判断', '情报摘要',
    '战略情报评估', '战略评估', '综合评估',
    '核心判断', '一句话评估', '先说结论',
    '总体评估', '重要性汇总', '行动摘要',
    '当前状况', '组建预览',
    '核心情报判断', '一句话导语', '今日五大关键进展',
    '即刻所需决策', '60秒阅读', '形势报告',
    '365天的五项判断', '顶级情报',
    // Corpus-observed heading variants (more specific than bare `摘要` so
    // the regex engine finds these before the shorter substring match)
    '态势简要评估',
    '态势评估',
  ],
};

/**
 * Canonical list of Swedish Riksdag committee codes (utskott). Used for
 * both keyword mining (exact-match on these codes is high-signal) and
 * report-ID detection (`{code}\d{1,3}` like `JuU28`).
 *
 * Sourced from the Riksdag's official utskotts list. Ordering is
 * alphabetical so the regex compilation is deterministic.
 */
export const RIKSDAG_COMMITTEE_CODES: readonly string[] = [
  'AU', 'CU', 'EU', 'FiU', 'FöU', 'JuU', 'KU', 'KrU',
  'MJU', 'NU', 'RU', 'SfU', 'SkU', 'SoU', 'TU', 'UU',
  'UbU', 'UFöU',
] as const;

/**
 * Canonical Swedish parliamentary party codes (Riksdag 2022–2026 mandate).
 * Single-letter codes ambiguously match common words ("M", "S", "L", "C")
 * so they are only added to keyword output when found inside the brief's
 * structured parenthetical syntax like `(M, KD, L)` or `(SD)` — bare
 * mentions are skipped to avoid false-positive noise.
 */
export const RIKSDAG_PARTY_CODES: readonly string[] = [
  'M', 'S', 'KD', 'SD', 'L', 'C', 'V', 'MP',
] as const;

/**
 * Match bill / document IDs: `HD` + 5+ digits, optionally with a
 * committee prefix (`HD01JuU28`, `HD024192`). The trailing word boundary
 * accepts a closing parenthesis, period or colon.
 */
const BILL_ID_RE = /\bHD\d{2,}(?:[A-Z][a-zA-Z]{1,4}\d{1,3})?\b/g;

/**
 * Match proposition references: `prop. YYYY/NN:NNN` (e.g. `prop. 2025/26:267`).
 * Whitespace between `prop.` and the year is tolerated, and the colon may
 * be followed by 1–4 digits.
 */
const PROPOSITION_REF_RE = /\bprop\.?\s*\d{4}\/\d{2}\s*:\s*\d{1,4}\b/gi;

/**
 * Match committee codes only inside structured contexts where they are
 * unambiguous: parentheses (`(JuU)`, `(SfU, JuU)`), report-ID position
 * (`JuU28`, `FiU40`), or in the form `<Code> report` / `<Code>-rapport`.
 * Bare in-prose matches are skipped — too many short codes (`TU`, `CU`,
 * `AU`) collide with English words.
 */
const COMMITTEE_RE = new RegExp(
  `\\b(${RIKSDAG_COMMITTEE_CODES.join('|')})(\\d{1,3})?\\b`,
  'g',
);

/**
 * Match Title-Case multi-word noun phrases of 2-4 words, where each word
 * starts with an uppercase letter and is 2-25 chars long. Used to mine
 * named actors / agencies / topics (e.g. `Sveriges Riksdag`, `Tidö Coalition`,
 * `Polismyndigheten`, `Waltersson Grönvall`).
 *
 * Pure prose-word capture — the `\p{Lu}` class covers Latin, Cyrillic,
 * Greek; CJK / RTL scripts don't have case so this regex naturally yields
 * empty for those languages (named entities in those scripts come from a
 * different code path).
 */
const NAMED_ENTITY_RE =
  /\b(\p{Lu}[\p{L}'’-]{1,24}(?:[ \t]+\p{Lu}[\p{L}'’-]{1,24}){1,3})\b/gu;

/**
 * Single-word capitalized terms that frequently start brief sentences but
 * are NOT named entities — skipped from the named-entity miner.
 */
const NAMED_ENTITY_STOPWORDS = new Set<string>([
  'Sweden', 'Swedish', 'Riksdag', 'Riksdagen', 'Riksdagsmonitor',
  'Government', 'Parliament', 'Tidö',
  'The', 'This', 'That', 'These', 'Those',
  'Sveriges', 'Regeringen',
  'Der', 'Die', 'Das',
  'Le', 'La', 'Les',
  'El', 'La', 'Los',
  // Section-heading / editorial-marker prose words that frequently lead
  // brief subsections — pure noise as keywords.
  'BLUF', 'DIW', 'OSINT', 'TL', 'TLDR', 'TLDR;',
  'Decisions', 'Decision', 'Source', 'Sources', 'Methodology', 'Reflection',
  'Bottom', 'Top', 'Sharpened', 'Second', 'Read', 'Sixty',
  'Key', 'Findings', 'Highlights', 'Summary', 'Headline', 'Headlines',
  'Article', 'Articles', 'Chapter', 'Section',
  // Generic-legal-doc citations that show as Title-Case+digits noise.
  'GDPR', 'ECHR', 'EU',
]);

/**
 * Strip leading emoji, status marker (🔴 🟠 🟡 🟢 🔵 ⚪), markdown bullet
 * markers, and bold/italic markers from a line. Returns the cleaned line
 * with collapsed whitespace.
 */
function cleanBulletLine(raw: string): string {
  return raw
    .replace(/^[\s>]*[-*•·]\s+/u, '')
    .replace(/^[\s]*[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*/u, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(?<!\\)[*_]([^*_]+)[*_]/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strip leading `##`/`###` markers, leading emoji and surrounding
 * whitespace from an H2/H3 heading line, returning the plain heading text.
 */
function cleanHeadingText(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+/u, '')
    .replace(/^[\s]*[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Return true when a line is a markdown table row whose first
 * non-empty cell is an admin field label (`| **Author** | … |`,
 * `| **Run ID** | 42 |`, `| **Classification** | Public |`). These
 * rows survive `stripLeadingAdminBylines` (which operates on
 * paragraph-form admin lines only) yet contain author names and
 * other admin VALUES that the named-entity miner would otherwise
 * surface as lead SERP keywords for every brief in the corpus.
 *
 * Detection is conservative — only triggers when:
 *  1. The line begins with `|` (table row).
 *  2. The first non-empty cell, after stripping `**` markers and
 *     whitespace, matches {@link ADMIN_FIELD_RE} (a label-only cell
 *     like `**Author**` or `Author:`).
 */
function isAdminTableRow(line: string): boolean {
  if (!line.trimStart().startsWith('|')) return false;
  const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
  if (cells.length === 0) return false;
  // First cell after the leading `|`. Strip bold markers and any
  // trailing colon — the cell `**Author**` and `Author:` both label
  // the row.
  const firstLabel = cells[0]
    .replace(/^\*+|\*+$/g, '')
    .replace(/:\s*$/, '')
    .trim();
  if (!firstLabel) return false;
  // ADMIN_FIELD_RE expects a leading `**` or bare label followed by `:`;
  // reconstruct that shape so the same regex can match.
  return ADMIN_FIELD_RE.test(`**${firstLabel}**:`) || ADMIN_FIELD_RE.test(`${firstLabel}:`);
}

/**
 * Return true when a line is an inline admin-byline assignment
 * (`**Author**: James Pether Sörling`, `**Run ID**: 42`) that
 * `stripLeadingAdminBylines` failed to remove because the
 * surrounding paragraph mixes admin and non-admin lines. Such
 * mixed paragraphs are common in template-embedded briefs where
 * `**Brief ID** \n **Author** \n **Methodology** \n …` is followed
 * by free-form prose without a blank-line separator.
 */
function isAdminBoldLabelLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('**')) return false;
  return ADMIN_FIELD_RE.test(trimmed);
}

/**
 * Extract the headline-summary section of the brief (60-Second Read or
 * localized equivalent).
 *
 * Returns the cleaned bullet lines under the first matching H2 — without
 * the H1, without the BLUF, without strategic-context prose. When no
 * such section exists, returns `{ heading: null, bullets: [] }` so the
 * caller can fall back to BLUF.
 */
export function extractHeadlineSection(
  briefMarkdown: string,
  lang: Language,
): BriefHeadlineSection {
  if (!briefMarkdown) return { heading: null, bullets: [] };

  const candidateNames = LANG_HEADLINE_SECTION_NAMES[lang];
  const lines = briefMarkdown.split(/\r?\n/);

  let matchedHeading: string | null = null;
  let inSection = false;
  let inCodeFence = false;
  const bullets: string[] = [];

  for (const line of lines) {
    // Track code fences so bullet lines inside ``` blocks are not picked up.
    if (/^```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const isH2 = /^##\s/.test(line);

    if (isH2) {
      if (inSection) break; // next H2 ends the section
      const headingText = cleanHeadingText(line).toLowerCase();
      const matched = candidateNames.some((name) =>
        headingText === name.toLowerCase()
        || headingText.startsWith(name.toLowerCase() + ' ')
        || headingText.startsWith(name.toLowerCase() + ' —')
        || headingText.startsWith(name.toLowerCase() + ' (')
        || headingText.startsWith(name.toLowerCase() + ':'),
      );
      if (matched) {
        matchedHeading = cleanHeadingText(line);
        inSection = true;
      }
      continue;
    }

    // Higher heading levels also end the section.
    if (inSection && /^#\s/.test(line)) break;

    if (inSection) {
      const isBullet = /^[\s>]*[-*•·]\s+/u.test(line)
        || /^[\s>]*\d+\.\s+/u.test(line);
      if (isBullet) {
        const cleaned = cleanBulletLine(line);
        if (cleaned.length > 0) bullets.push(cleaned);
      }
    }
  }

  return { heading: matchedHeading, bullets };
}

/**
 * Push a value into `out` only if it's not already present (case-insensitive
 * for ASCII, case-sensitive for CJK / RTL which don't have case).
 */
function pushUnique(out: string[], seen: Set<string>, value: string, cap: number): void {
  if (out.length >= cap) return;
  const trimmed = value.trim();
  if (trimmed.length === 0) return;
  const key = trimmed.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  out.push(trimmed);
}

/**
 * Extract the universal entity set from a brief (any language). Bill IDs,
 * proposition refs, committee codes and report IDs are Swedish-administrative
 * identifiers that survive untranslated across all 14 brief locales — so
 * the same entity set can drive keywords on every language page.
 *
 * Named entities are extracted only when the brief is in a Latin-script
 * language (en/sv/da/no/fi/de/fr/es/nl) — CJK / RTL scripts don't have
 * case and would yield no Title-Case matches.
 */
export function extractBriefEntities(
  briefMarkdown: string,
  lang: Language = 'en',
): BriefEntities {
  if (!briefMarkdown) {
    return {
      billIds: [],
      propositionRefs: [],
      committeeCodes: [],
      committeeReportIds: [],
      partyCodes: [],
      namedEntities: [],
    };
  }

  // Strip front-matter and code fences so we mine the body only.
  // Also strip admin-byline paragraphs (`**Author**: …`, `**Run ID**: …`,
  // `**Classification**: …`) — the single `ADMIN_FIELD_NAMES` blocklist in
  // `cleaning/admin-bylines.ts` is the source of truth for these, so any
  // new admin label added there automatically protects keyword extraction.
  // Without this step, Title-Case multi-word phrases like `Test Runner`
  // (from `**Author**: Test Runner`) and `Run ID` (from `**Run ID**: 42`)
  // get mined as named entities and displace real topic keywords on the
  // SERP — see tests/render-lib.test.ts:461 (`keywords: "Widgets`) and
  // :1427 (`<meta name="keywords" content="Proposition`).
  const body = stripLeadingAdminBylines(
    briefMarkdown
      .replace(/^---\n[\s\S]*?\n---\n/, '')
      .replace(/```[\s\S]*?```/g, ' '),
  );

  const ENTITY_CAP = 16;

  // Bill IDs (HD03267, HD01JuU28, HD024192)
  const billIds: string[] = [];
  const billSeen = new Set<string>();
  for (const m of body.matchAll(BILL_ID_RE)) {
    pushUnique(billIds, billSeen, m[0], ENTITY_CAP);
  }

  // Proposition refs (prop. 2025/26:267)
  const propRefs: string[] = [];
  const propSeen = new Set<string>();
  for (const m of body.matchAll(PROPOSITION_REF_RE)) {
    // Normalise whitespace inside the ref.
    const normalised = m[0].replace(/\s+/g, ' ').replace(/\s*:\s*/, ':');
    pushUnique(propRefs, propSeen, normalised, ENTITY_CAP);
  }

  // Committee codes + report IDs (JuU, JuU28, FiU40)
  const committeeCodes: string[] = [];
  const committeeReportIds: string[] = [];
  const codeSeen = new Set<string>();
  const reportSeen = new Set<string>();
  for (const m of body.matchAll(COMMITTEE_RE)) {
    const code = m[1];
    const digits = m[2];
    if (digits && digits.length >= 1) {
      pushUnique(committeeReportIds, reportSeen, `${code}${digits}`, ENTITY_CAP);
    }
    // Only treat a code as a committee-code mention when it appears
    // inside a parenthetical context or alongside report digits — bare
    // matches like the word "TU" in English prose are too noisy.
    const idx = m.index ?? 0;
    const prevChar = idx > 0 ? body.charAt(idx - 1) : '';
    const inParens = prevChar === '(' || prevChar === ',' || prevChar === ' ';
    const hasReport = Boolean(digits);
    if (hasReport || prevChar === '(' || prevChar === ',') {
      if (inParens || hasReport) {
        pushUnique(committeeCodes, codeSeen, code, ENTITY_CAP);
      }
    }
  }

  // Party codes — only inside parenthetical lists like (M, KD, L) or (SD).
  const partyCodes: string[] = [];
  const partySeen = new Set<string>();
  const PARENS_RE = /\(([^()]{1,80})\)/g;
  for (const match of body.matchAll(PARENS_RE)) {
    const inner = match[1];
    // Split on common list separators.
    const tokens = inner.split(/[,/]\s*|\s+\+\s+|\s+&\s+|\s+och\s+|\s+and\s+|\s+und\s+|\s+et\s+/i);
    for (const tok of tokens) {
      const candidate = tok.trim();
      if (RIKSDAG_PARTY_CODES.includes(candidate as typeof RIKSDAG_PARTY_CODES[number])) {
        pushUnique(partyCodes, partySeen, candidate, ENTITY_CAP);
      }
    }
  }

  // Named entities — Latin-script only. Strip heading lines first so
  // section-title Title-Case prose (`## Sharpened BLUF`, `### Second
  // Read`, `## Decisions This Brief Supports`) doesn't pollute the
  // entity list with editorial structure words. We also strip
  // table-row admin lines (`| **Author** | James Pether Sörling … |`)
  // which `stripLeadingAdminBylines` above can't strip because they
  // live inside a markdown table — paragraph-level admin stripping
  // only handles `**Field**: value` paragraphs, not table cells.
  // Without this filter the named-entity miner picks up the author
  // name + Hack23 AB + Run-ID-derived Title-Case tokens and ships
  // them as the lead SERP keywords for every single brief.
  const namedEntities: string[] = [];
  const LATIN_LANGS = new Set<Language>(['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl']);
  if (LATIN_LANGS.has(lang)) {
    const proseOnly = body
      .split(/\r?\n/)
      .filter((ln) => !/^\s*#{1,6}\s/.test(ln))
      .filter((ln) => !isAdminTableRow(ln))
      .filter((ln) => !isAdminBoldLabelLine(ln))
      .join('\n');
    const namedSeen = new Set<string>();
    for (const m of proseOnly.matchAll(NAMED_ENTITY_RE)) {
      const phrase = m[1].trim();
      // Single-word entries are noise — require at least one space.
      if (!phrase.includes(' ')) continue;
      // Skip phrases that start with a stopword.
      const firstWord = phrase.split(' ', 1)[0];
      if (NAMED_ENTITY_STOPWORDS.has(firstWord)) continue;
      // Skip phrases composed entirely of stopwords.
      const allStop = phrase.split(/\s+/).every((w) => NAMED_ENTITY_STOPWORDS.has(w));
      if (allStop) continue;
      pushUnique(namedEntities, namedSeen, phrase, ENTITY_CAP);
    }
  }

  return {
    billIds,
    propositionRefs: propRefs,
    committeeCodes,
    committeeReportIds,
    partyCodes,
    namedEntities,
  };
}

/**
 * Build a deduplicated, ordered keyword list from {@link BriefEntities}.
 * The ordering follows editorial priority: bill IDs first (most specific
 * SERP-distinctive), then proposition refs, then committee report IDs,
 * then committee codes, then party codes, then named entities. The caller
 * (article-seo) merges this with the localized mandatory-floor keywords.
 */
export function flattenBriefEntities(entities: BriefEntities): string[] {
  return [
    ...entities.billIds,
    ...entities.propositionRefs,
    ...entities.committeeReportIds,
    ...entities.committeeCodes,
    ...entities.partyCodes,
    ...entities.namedEntities,
  ];
}
