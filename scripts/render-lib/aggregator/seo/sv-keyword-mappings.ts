/**
 * @module Infrastructure/RenderLib/Aggregator/Seo/SvKeywordMappings
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Swedish institutional keyword expansion tables
 *
 * @description
 * Two static tables that expand the universal-entity keyword stream with
 * SERP-friendly synonyms specific to the Swedish institutional landscape:
 *
 *  1. {@link AGENCY_ACRONYM_MAP} — bidirectional full-name ↔ acronym table
 *     for the high-value Swedish agencies that appear in briefs. The
 *     full name (Försäkringskassan) is the natural lemma in prose, but
 *     end-users frequently search by acronym (FK), so emitting both forms
 *     widens our SERP surface. Both directions are emitted: if the brief
 *     mentions only "Försäkringskassan", the keyword stream gets both
 *     "Försäkringskassan" and "FK"; if the brief mentions only "FK",
 *     both still surface.
 *
 *  2. {@link COMMITTEE_DOMAIN_MAP} — committee code → policy-domain word
 *     mapping. Riksdag committee codes (JuU, FiU, AU, …) are highly
 *     specific identifiers but are opaque to non-Swedish-speaking
 *     readers and SERP crawlers. Pairing each code with its policy
 *     domain ("JuU" + "Justice") gives multilingual SERPs a topic
 *     handle without sacrificing the precise admin identifier.
 *
 * Both tables are **pure data** — no side effects, no I/O. The expansion
 * is wired into the keyword pipeline via {@link buildArticleKeywords}
 * in `article-seo.ts`, which takes the flattened brief-entity array and
 * returns an extended array with synonyms appended **after** the original
 * entities so the relative priority order is preserved (more specific
 * signal first).
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../../types/language.js';

/**
 * Bidirectional mapping between Swedish agency canonical names and their
 * commonly used acronyms. Used to widen the keyword set so a brief that
 * mentions only "Försäkringskassan" still surfaces "FK" on SERP queries
 * (and vice versa).
 *
 * Ordering reflects rough volume of brief appearances (most-mentioned
 * first) — useful for the eventual cap if the keyword budget tightens.
 */
export const AGENCY_ACRONYM_MAP: ReadonlyArray<readonly [string, string]> = [
  ['Försäkringskassan', 'FK'],
  ['Skatteverket', 'SKV'],
  ['Polismyndigheten', 'POM'],
  ['Migrationsverket', 'MIG'],
  ['Säkerhetspolisen', 'SÄPO'],
  ['Trafikverket', 'TRV'],
  ['Arbetsförmedlingen', 'AF'],
  ['Tullverket', 'TUL'],
  ['Kriminalvården', 'KRIM'],
  ['Domstolsverket', 'DV'],
  ['Pensionsmyndigheten', 'PM'],
  ['Kronofogdemyndigheten', 'KFM'],
  ['Konsumentverket', 'KOV'],
  ['Naturvårdsverket', 'NV'],
  ['Energimyndigheten', 'STEM'],
] as const;

/**
 * Build the lookup map (lowercased key → canonical pair) once at module
 * load. Both directions are present so a lookup with either the full
 * name or the acronym returns the other form.
 */
const AGENCY_LOOKUP: ReadonlyMap<string, readonly [string, string]> = (() => {
  const m = new Map<string, readonly [string, string]>();
  for (const pair of AGENCY_ACRONYM_MAP) {
    m.set(pair[0].toLowerCase(), pair);
    m.set(pair[1].toLowerCase(), pair);
  }
  return m;
})();

/**
 * For each known agency canonical form or acronym mentioned in `entities`,
 * emit the corresponding alternate form. Used to expand the keyword stream
 * so both prose-form and short-form searches resolve the same article.
 *
 * The output preserves input order and never duplicates an entity that's
 * already in the input set.
 *
 * @example
 *   expandAgencyAcronyms(['Försäkringskassan', 'reform'])
 *   // → ['FK']  (input already has the full form; emit acronym only)
 */
export function expandAgencyAcronyms(entities: readonly string[]): string[] {
  const seen = new Set(entities.map((e) => e.toLowerCase()));
  const out: string[] = [];
  for (const entity of entities) {
    const pair = AGENCY_LOOKUP.get(entity.toLowerCase());
    if (!pair) continue;
    // Emit whichever side of the pair is NOT already in the entity set.
    const altForm = pair[0].toLowerCase() === entity.toLowerCase() ? pair[1] : pair[0];
    if (!seen.has(altForm.toLowerCase())) {
      out.push(altForm);
      seen.add(altForm.toLowerCase());
    }
  }
  return out;
}

/**
 * Per-language policy-domain word for each Riksdag committee code. The
 * value is the canonical lemma in that language (lowercased or proper
 * noun as natural for that script).
 *
 * Source: each row corresponds to one of `RIKSDAG_COMMITTEE_CODES` in
 * `brief-extractor.ts`. The domain word is the English-language category
 * label used by the Riksdag's own metadata for that committee's remit.
 *
 * NOTE: For CJK / RTL languages, the lemma is in the target script so it
 * actually matches local searches; for Latin scripts, we use the natural
 * lemma in that language. Empty string means "no localized form, fall
 * back to English" — currently empty only where the translation would be
 * a transliteration with no SEO value.
 */
export const COMMITTEE_DOMAIN_MAP: Readonly<Record<string, Readonly<Record<Language, string>>>> = {
  AU: { en: 'Labour Market', sv: 'arbetsmarknad', da: 'arbejdsmarked', no: 'arbeidsmarked', fi: 'työmarkkinat', de: 'Arbeitsmarkt', fr: 'marché du travail', es: 'mercado laboral', nl: 'arbeidsmarkt', ar: 'سوق العمل', he: 'שוק העבודה', ja: '労働市場', ko: '노동시장', zh: '劳动市场' },
  CU: { en: 'Civil Affairs', sv: 'civilrätt', da: 'civilret', no: 'sivilrett', fi: 'siviiliasiat', de: 'Zivilrecht', fr: 'affaires civiles', es: 'asuntos civiles', nl: 'burgerzaken', ar: 'الشؤون المدنية', he: 'ענייני אזרח', ja: '市民問題', ko: '시민 문제', zh: '民事事务' },
  EU: { en: 'European Affairs', sv: 'EU-frågor', da: 'EU-anliggender', no: 'EU-saker', fi: 'EU-asiat', de: 'EU-Angelegenheiten', fr: 'affaires européennes', es: 'asuntos europeos', nl: 'EU-zaken', ar: 'الشؤون الأوروبية', he: 'ענייני האיחוד האירופי', ja: '欧州問題', ko: '유럽 문제', zh: '欧盟事务' },
  FiU: { en: 'Finance', sv: 'finans', da: 'finans', no: 'finans', fi: 'rahoitus', de: 'Finanzen', fr: 'finances', es: 'finanzas', nl: 'financiën', ar: 'المالية', he: 'כספים', ja: '財政', ko: '재정', zh: '财政' },
  FöU: { en: 'Defence', sv: 'försvar', da: 'forsvar', no: 'forsvar', fi: 'puolustus', de: 'Verteidigung', fr: 'défense', es: 'defensa', nl: 'defensie', ar: 'الدفاع', he: 'הגנה', ja: '防衛', ko: '국방', zh: '国防' },
  JuU: { en: 'Justice', sv: 'rättsväsen', da: 'retsvæsen', no: 'rettsvesen', fi: 'oikeuslaitos', de: 'Justiz', fr: 'justice', es: 'justicia', nl: 'justitie', ar: 'العدل', he: 'משפט', ja: '司法', ko: '사법', zh: '司法' },
  KU: { en: 'Constitution', sv: 'konstitution', da: 'forfatning', no: 'konstitusjon', fi: 'perustuslaki', de: 'Verfassung', fr: 'constitution', es: 'constitución', nl: 'grondwet', ar: 'الدستور', he: 'חוקה', ja: '憲法', ko: '헌법', zh: '宪法' },
  KrU: { en: 'Culture', sv: 'kultur', da: 'kultur', no: 'kultur', fi: 'kulttuuri', de: 'Kultur', fr: 'culture', es: 'cultura', nl: 'cultuur', ar: 'الثقافة', he: 'תרבות', ja: '文化', ko: '문화', zh: '文化' },
  MJU: { en: 'Environment', sv: 'miljö', da: 'miljø', no: 'miljø', fi: 'ympäristö', de: 'Umwelt', fr: 'environnement', es: 'medio ambiente', nl: 'milieu', ar: 'البيئة', he: 'סביבה', ja: '環境', ko: '환경', zh: '环境' },
  NU: { en: 'Industry', sv: 'näringsliv', da: 'erhvervsliv', no: 'næringsliv', fi: 'elinkeinoelämä', de: 'Wirtschaft', fr: 'industrie', es: 'industria', nl: 'industrie', ar: 'الصناعة', he: 'תעשייה', ja: '産業', ko: '산업', zh: '工业' },
  RU: { en: 'Procedural', sv: 'riksdagsförvaltning', da: 'forvaltning', no: 'forvaltning', fi: 'menettely', de: 'Verfahren', fr: 'procédure', es: 'procedimiento', nl: 'procedure', ar: 'الإجراءات', he: 'נוהל', ja: '手続き', ko: '절차', zh: '程序' },
  SfU: { en: 'Social Insurance', sv: 'socialförsäkring', da: 'socialforsikring', no: 'trygd', fi: 'sosiaaliturva', de: 'Sozialversicherung', fr: 'assurance sociale', es: 'seguridad social', nl: 'sociale verzekering', ar: 'التأمين الاجتماعي', he: 'ביטוח לאומי', ja: '社会保険', ko: '사회보험', zh: '社会保险' },
  SkU: { en: 'Taxation', sv: 'skatt', da: 'skat', no: 'skatt', fi: 'verotus', de: 'Steuern', fr: 'fiscalité', es: 'fiscalidad', nl: 'belasting', ar: 'الضرائب', he: 'מיסוי', ja: '税制', ko: '조세', zh: '税收' },
  SoU: { en: 'Social Affairs', sv: 'socialfrågor', da: 'socialanliggender', no: 'sosialsaker', fi: 'sosiaaliasiat', de: 'Soziales', fr: 'affaires sociales', es: 'asuntos sociales', nl: 'sociale zaken', ar: 'الشؤون الاجتماعية', he: 'רווחה', ja: '社会問題', ko: '사회 문제', zh: '社会事务' },
  TU: { en: 'Transport', sv: 'trafik', da: 'transport', no: 'transport', fi: 'liikenne', de: 'Verkehr', fr: 'transport', es: 'transporte', nl: 'verkeer', ar: 'النقل', he: 'תחבורה', ja: '交通', ko: '교통', zh: '交通' },
  UU: { en: 'Foreign Affairs', sv: 'utrikes', da: 'udenrigsanliggender', no: 'utenriks', fi: 'ulkoasiat', de: 'Auswärtiges', fr: 'affaires étrangères', es: 'asuntos exteriores', nl: 'buitenlandse zaken', ar: 'الشؤون الخارجية', he: 'חוץ', ja: '外務', ko: '외무', zh: '外交' },
  UbU: { en: 'Education', sv: 'utbildning', da: 'uddannelse', no: 'utdanning', fi: 'koulutus', de: 'Bildung', fr: 'éducation', es: 'educación', nl: 'onderwijs', ar: 'التعليم', he: 'חינוך', ja: '教育', ko: '교육', zh: '教育' },
  UFöU: { en: 'Foreign Defence', sv: 'utrikes- och försvar', da: 'udenrigs og forsvar', no: 'utenriks og forsvar', fi: 'ulko- ja puolustus', de: 'Außen- und Verteidigungspolitik', fr: 'défense étrangère', es: 'defensa exterior', nl: 'buitenlandse defensie', ar: 'الدفاع الخارجي', he: 'הגנה חוץ', ja: '外交防衛', ko: '외교 국방', zh: '外交国防' },
};

/**
 * For each committee code in `codes`, emit the domain word in the
 * target language. Codes that aren't in the map (or whose domain word
 * is empty for that language) are silently skipped.
 *
 * Output is de-duplicated and preserves input order.
 */
export function expandCommitteeDomains(codes: readonly string[], lang: Language): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const code of codes) {
    const row = COMMITTEE_DOMAIN_MAP[code];
    if (!row) continue;
    const domain = row[lang];
    if (!domain) continue;
    const key = domain.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(domain);
  }
  return out;
}
