/**
 * @module data-transformers/content-generators/shared
 * @description Shared internal helpers and templates used by all content generators.
 * Contains TITLE_SUFFIX_TEMPLATES, keyword extraction, event/document matching helpers,
 * and the deep analysis section generator (5W framework).
 *
 * ⚠️ DEPRECATED FOR ANALYSIS GENERATION (v3.0, 2026-04-02):
 * Per analysis/methodologies/ai-driven-analysis-guide.md Rule 2, the following
 * functions are DEPRECATED for generating analysis content:
 * - generateDeepAnalysisSection() → Replace with AI prompt in workflow .md
 * - All *Text() template functions (govAdvantageText, oppPressureText, etc.)
 *   → Replace with AI-generated editorial analysis from actual document data
 * - renderAggregatedPestle(), renderStakeholderImpactSummary(),
 *   renderRiskAssessment(), renderImplementationAssessment()
 *   → Replace with AI prompts for framework analysis
 *
 * Their output is treated as FALLBACK STUBS. AI agents in agentic workflow .md
 * files MUST overwrite all template-generated text with genuine political intelligence.
 *
 * HTML utility functions (escapeHtml, pickLang, TITLE_SUFFIX_TEMPLATES) and
 * structural helpers remain active and are NOT deprecated.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { RawDocument, RawCalendarEvent, CIAContext } from '../types.js';
import { L, normalizePartyKey } from '../helpers.js';
import { detectPolicyDomains } from '../policy-analysis.js';

/* ── Stub types/functions for deleted analysis modules ── */
/* Per ai-driven-analysis-guide.md Rule 2: scripts must NOT generate analysis */

interface PESTLEDimensions {
  political: string[];
  economic: string[];
  social: string[];
  technological: string[];
  legal: string[];
  environmental: string[];
}

interface StakeholderDirectImpact {
  direction: 'positive' | 'negative' | 'mixed' | 'neutral';
  magnitude: 'significant' | 'moderate' | 'minor';
  summary: string;
}

interface StakeholderImpact {
  stakeholder: string;
  displayName: string;
  directImpact: StakeholderDirectImpact;
  confidence: string;
  implementationBurden: 'high' | 'medium' | 'low';
}

interface ImplementationAssessment {
  feasibility: 'high' | 'medium' | 'low';
  keyObstacles: string[];
  agenciesInvolved: string[];
  timeline: string;
  estimatedTimeline: string;
  summary: string;
}

interface DocumentAnalysis {
  pestleDimensions: PESTLEDimensions;
  stakeholderImpacts: StakeholderImpact[];
  implementationAssessment: ImplementationAssessment;
  riskAssessment: RiskAssessment[];
  [key: string]: unknown;
}

type PESTLEAnalysis = PESTLEDimensions;

interface RiskAssessment {
  type: 'political' | 'implementation' | 'public-acceptance' | 'legal' | 'financial';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface BatchAnalysisResult { results: unknown[] }

/** Stub: returns empty analysis. Real analysis is AI-driven in workflows. */
function analyzeDocumentsBatch(_docs: unknown[], _lang?: Language | string, _cia?: CIAContext): Map<string, DocumentAnalysis> {
  return new Map();
}

/** Stub: returns empty perspectives. Real analysis is AI-driven in workflows. */
function analyzeDocumentsPerspectives(_docs: unknown[], _cia?: CIAContext, _lang?: Language | string): BatchAnalysisResult {
  return { results: [] };
}

/** Localise raw Riksdag document type codes for display (singular/plural-aware, multi-language). */
export type DocTypeLocalization = {
  singular: Partial<Record<Language, string>>;
  plural: Partial<Record<Language, string>>;
};

export const DOC_TYPE_DISPLAY: Readonly<Record<string, DocTypeLocalization>> = {
  prop: {
    singular: {
      en: 'Proposition', sv: 'Proposition', da: 'Proposition', no: 'Proposisjon',
      fi: 'Hallituksen esitys', de: 'Regierungsvorlage', fr: 'Projet de loi', es: 'Proposición',
      nl: 'Wetsvoorstel', ar: 'مقترح قانون', he: 'הצעת חוק', ja: '法案', ko: '정부 제출 법안', zh: '政府法案',
    },
    plural: {
      en: 'Propositions', sv: 'Propositioner', da: 'Propositioner', no: 'Proposisjoner',
      fi: 'Hallituksen esitykset', de: 'Regierungsvorlagen', fr: 'Projets de loi', es: 'Proposiciones',
      nl: 'Wetsvoorstellen', ar: 'مقترحات قوانين', he: 'הצעות חוק', ja: '法案', ko: '정부 제출 법안', zh: '政府法案',
    },
  },
  bet: {
    singular: {
      en: 'Committee Report', sv: 'Betänkande', da: 'Udvalgsbetænkning', no: 'Komitéinnstilling',
      fi: 'Valiokunnan mietintö', de: 'Ausschussbericht', fr: 'Rapport de commission', es: 'Informe de comisión',
      nl: 'Commissieverslag', ar: 'تقرير لجنة', he: 'דוח ועדה', ja: '委員会報告書', ko: '위원회 보고서', zh: '委员会报告',
    },
    plural: {
      en: 'Committee Reports', sv: 'Betänkanden', da: 'Udvalgsbetænkninger', no: 'Komitéinnstillinger',
      fi: 'Valiokunnan mietinnöt', de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comisión',
      nl: 'Commissieverslagen', ar: 'تقارير لجان', he: 'דוחות ועדה', ja: '委員会報告書', ko: '위원회 보고서', zh: '委员会报告',
    },
  },
  mot: {
    singular: {
      en: 'Motion', sv: 'Motion', da: 'Forslag', no: 'Forslag',
      fi: 'Aloite', de: 'Antrag', fr: 'Motion', es: 'Moción',
      nl: 'Motie', ar: 'مقترح', he: 'הצעה', ja: '動議', ko: '동의안', zh: '动议',
    },
    plural: {
      en: 'Motions', sv: 'Motioner', da: 'Forslag', no: 'Forslag',
      fi: 'Aloitteet', de: 'Anträge', fr: 'Motions', es: 'Mociones',
      nl: 'Moties', ar: 'مقترحات', he: 'הצעות', ja: '動議', ko: '동의안', zh: '动议',
    },
  },
  skr: {
    singular: {
      en: 'Government Communication', sv: 'Skrivelse', da: 'Regeringsskrivelse', no: 'Regjeringsskriv',
      fi: 'Valtioneuvoston kirjelmä', de: 'Regierungsschreiben', fr: 'Communication du gouvernement', es: 'Comunicación del gobierno',
      nl: 'Regeringsmededeling', ar: 'مذكرة حكومية', he: 'מכתב ממשלתי', ja: '政府通信文書', ko: '정부 통신문', zh: '政府公文',
    },
    plural: {
      en: 'Government Communications', sv: 'Skrivelser', da: 'Regeringsskrivelser', no: 'Regjeringsskriv',
      fi: 'Valtioneuvoston kirjelmät', de: 'Regierungsschreiben', fr: 'Communications du gouvernement', es: 'Comunicaciones del gobierno',
      nl: 'Regeringsmededelingen', ar: 'مذكرات حكومية', he: 'מכתבים ממשלתיים', ja: '政府通信文書', ko: '정부 통신문', zh: '政府公文',
    },
  },
  sfs: {
    singular: {
      en: 'Law/Statute', sv: 'Lag/förordning', da: 'Lov/forordning', no: 'Lov/forordning',
      fi: 'Laki/asetus', de: 'Gesetz/Verordnung', fr: 'Loi/Règlement', es: 'Ley/Reglamento',
      nl: 'Wet/Verordening', ar: 'قانون / لائحة', he: 'חוק/תקנה', ja: '法律／条例', ko: '법률/법규', zh: '法律/法规',
    },
    plural: {
      en: 'Laws/Statutes', sv: 'Lagar/förordningar', da: 'Love/forordninger', no: 'Lover/forordninger',
      fi: 'Lait/asetukset', de: 'Gesetze/Verordnungen', fr: 'Lois/Règlements', es: 'Leyes/Reglamentos',
      nl: 'Wetten/Verordeningen', ar: 'قوانين / لوائح', he: 'חוקים/תקנות', ja: '法律／条例', ko: '법률/법규', zh: '法律/法规',
    },
  },
  fpm: {
    singular: {
      en: 'EU Position Paper', sv: 'Faktapromemoria', da: 'EU-faktanota', no: 'EU-faktanotat',
      fi: 'EU-tietomuistio', de: 'EU-Positionspapier', fr: 'Note de position UE', es: 'Documento de posición de la UE',
      nl: 'EU-positiepaper', ar: 'ورقة موقف للاتحاد الأوروبي', he: 'מסמך עמדה של האיחוד האירופי', ja: 'EUポジションペーパー', ko: 'EU 입장 문서', zh: '欧盟立场文件',
    },
    plural: {
      en: 'EU Position Papers', sv: 'Faktapromemorior', da: 'EU-faktanotaer', no: 'EU-faktanotater',
      fi: 'EU-tietomuistiot', de: 'EU-Positionspapiere', fr: 'Notes de position UE', es: 'Documentos de posición de la UE',
      nl: 'EU-positiepapers', ar: 'أوراق موقف للاتحاد الأوروبي', he: 'מסמכי עמדה של האיחוד האירופי', ja: 'EUポジションペーパー', ko: 'EU 입장 문서', zh: '欧盟立场文件',
    },
  },
  pressm: {
    singular: {
      en: 'Press Release', sv: 'Pressmeddelande', da: 'Pressemeddelelse', no: 'Pressemelding',
      fi: 'Lehdistötiedote', de: 'Pressemitteilung', fr: 'Communiqué de presse', es: 'Comunicado de prensa',
      nl: 'Persbericht', ar: 'بيان صحفي', he: 'הודעה לעיתונות', ja: 'プレスリリース', ko: '보도자료', zh: '新闻稿',
    },
    plural: {
      en: 'Press Releases', sv: 'Pressmeddelanden', da: 'Pressemeddelelser', no: 'Pressemeldinger',
      fi: 'Lehdistötiedotteet', de: 'Pressemitteilungen', fr: 'Communiqués de presse', es: 'Comunicados de prensa',
      nl: 'Persberichten', ar: 'بيانات صحفية', he: 'הודעות לעיתונות', ja: 'プレスリリース', ko: '보도자료', zh: '新闻稿',
    },
  },
  ext: {
    singular: {
      en: 'External Reference', sv: 'Extern referens', da: 'Ekstern reference', no: 'Ekstern referanse',
      fi: 'Ulkoinen viite', de: 'Externe Referenz', fr: 'Référence externe', es: 'Referencia externa',
      nl: 'Externe referentie', ar: 'مرجع خارجي', he: 'הפניה חיצונית', ja: '外部参照', ko: '외부 참조', zh: '外部参考',
    },
    plural: {
      en: 'External References', sv: 'Externa referenser', da: 'Eksterne referencer', no: 'Eksterne referanser',
      fi: 'Ulkoiset viitteet', de: 'Externe Referenzen', fr: 'Références externes', es: 'Referencias externas',
      nl: 'Externe referenties', ar: 'مراجع خارجية', he: 'הפניות חיצוניות', ja: '外部参照', ko: '외부 참조', zh: '外部参考',
    },
  },
  other: {
    singular: {
      en: 'Other Document', sv: 'Övrigt dokument', da: 'Andet dokument', no: 'Annet dokument',
      fi: 'Muu asiakirja', de: 'Sonstiges Dokument', fr: 'Autre document', es: 'Otro documento',
      nl: 'Overig document', ar: 'مستند آخر', he: 'מסמך אחר', ja: 'その他の文書', ko: '기타 문서', zh: '其他文件',
    },
    plural: {
      en: 'Other Documents', sv: 'Övriga dokument', da: 'Andre dokumenter', no: 'Andre dokumenter',
      fi: 'Muut asiakirjat', de: 'Sonstige Dokumente', fr: 'Autres documents', es: 'Otros documentos',
      nl: 'Overige documenten', ar: 'مستندات أخرى', he: 'מסמכים אחרים', ja: 'その他の文書', ko: '기타 문서', zh: '其他文件',
    },
  },
};

export function localizeDocType(code: string, lang: Language | string, count?: number): string {
  const entry = DOC_TYPE_DISPLAY[code];
  if (!entry) return code;
  const usePlural = count !== 1;
  const primary = usePlural ? entry.plural : entry.singular;
  const fallback = usePlural ? entry.singular : entry.plural;
  return primary[lang as Language] ?? primary.en ?? fallback[lang as Language] ?? fallback.en ?? code;
}

/** Per-language title-suffix templates for inverted-pyramid lede construction. */
export const TITLE_SUFFIX_TEMPLATES: Readonly<Record<string, (t: string) => string>> = {
  sv: t => ` — inklusive "${t}"`,
  da: t => ` — herunder "${t}"`,
  no: t => ` — inkludert "${t}"`,
  fi: t => ` — mukaan lukien "${t}"`,
  de: t => ` — darunter "${t}"`,
  fr: t => ` — notamment "${t}"`,
  es: t => ` — incluyendo "${t}"`,
  nl: t => ` — inclusief "${t}"`,
  ar: t => ` — بما فيها "${t}"`,
  he: t => ` — כולל "${t}"`,
  ja: t => `、「${t}」を含む`,
  ko: t => `, "${t}" 포함`,
  zh: t => `，包括"${t}"`,
};

/** Extract meaningful keywords from text for cross-reference matching (min 2 chars, captures EU, KU, etc.; splits on whitespace, hyphens, and commas) */
function extractKeywords(text: string): string[] {
  return text.toLowerCase().split(/[\s,–-]+/u).filter(w => w.length >= 2);
}

/** Find documents related to a calendar event by organ match or keyword overlap (max 3) */
export function findRelatedDocuments(event: RawCalendarEvent, documents: RawDocument[]): RawDocument[] {
  const eventOrgan = event.organ ?? '';
  const keywords = extractKeywords(event.rubrik ?? event.titel ?? event.title ?? '');
  return documents.filter(doc => {
    const docOrgan = doc.organ ?? doc.committee ?? '';
    if (eventOrgan && docOrgan && eventOrgan.toLowerCase() === docOrgan.toLowerCase()) return true;
    const docText = (doc.titel ?? doc.title ?? '').toLowerCase();
    return keywords.some(kw => docText.includes(kw));
  }).slice(0, 3);
}

/** Find written questions related to a calendar event by keyword overlap (max 3) */
export function findRelatedQuestions(event: RawCalendarEvent, questions: RawDocument[]): RawDocument[] {
  const keywords = extractKeywords(event.rubrik ?? event.titel ?? event.title ?? '');
  return questions.filter(q => {
    const qText = (q.titel ?? q.title ?? '').toLowerCase();
    return keywords.some(kw => qText.includes(kw));
  }).slice(0, 3);
}

/** Extract targeted minister name from interpellation summary "till MINISTER" header line.
 *  Strips trailing topic clauses ("om X", "angående Y", etc.) and punctuation. */
export function extractMinister(summary: string): string {
  // Use non-newline whitespace ([^\S\n]+) so we don't cross into the next line
  const m = summary.match(/\btill[^\S\n]+([^\n]+)/i);
  if (!m) return '';
  const raw = m[1].trim();
  if (!raw) return '';

  // Remove common trailing topic clauses and punctuation
  const lowerRaw = raw.toLowerCase();
  const stopPhrases = [' om ', ' angående ', ' rörande ', ' beträffande '];
  let end = raw.length;
  for (const phrase of stopPhrases) {
    const idx = lowerRaw.indexOf(phrase);
    if (idx !== -1 && idx < end) end = idx;
  }
  // Cut at terminating punctuation if it comes earlier
  const punctIdx = raw.search(/[?:;.,]/);
  if (punctIdx !== -1 && punctIdx < end) end = punctIdx;

  return raw.slice(0, end).trim();
}

// ---------------------------------------------------------------------------
// Deep Analysis Section (5W Framework)
// ---------------------------------------------------------------------------

/** Options for generating the deep analysis section */
export interface DeepAnalysisOptions {
  documents: RawDocument[];
  lang: Language | string;
  cia?: CIAContext;
  articleType: string;
  /** Extra context sentences to inject into the "Why" subsection */
  whyContext?: string;
  /**
   * Pre-computed document analyses from the AI analysis framework.
   * When provided, the deep analysis section is enriched with PESTLE
   * dimensions, stakeholder impact assessments, risk assessments, and
   * implementation feasibility data from the framework.
   *
   * Use `analyzeDocumentsForContent()` to produce this map.
   */
  frameworkAnalysis?: Map<string, DocumentAnalysis>;
  /**
   * Multi-perspective analysis from the analysis-framework (6 lenses:
   * government, opposition, citizen, economic, international, media).
   * When provided, key insights and perspective summaries are injected
   * into the deep analysis section.
   *
   * Use `analyzeDocumentsForContent()` to produce this automatically.
   */
  perspectiveAnalysis?: BatchAnalysisResult;
}

/**
 * Run the document analysis framework over a set of documents and return
 * both the per-document analysis map and the multi-perspective batch result.
 *
 * Content generators should call this once per article and pass the results
 * into `generateDeepAnalysisSection()` via the `frameworkAnalysis` and
 * `perspectiveAnalysis` options.
 *
 * Results are cached internally by the framework, so repeated calls with
 * the same documents are cheap.
 */
export function analyzeDocumentsForContent(
  docs: RawDocument[],
  lang: Language | string,
  cia?: CIAContext,
): { frameworkAnalysis: Map<string, DocumentAnalysis>; perspectiveAnalysis: BatchAnalysisResult } {
  const frameworkAnalysis = analyzeDocumentsBatch(docs, lang, cia);
  const perspectiveAnalysis = analyzeDocumentsPerspectives(docs, cia, lang);
  return { frameworkAnalysis, perspectiveAnalysis };
}

/**
 * Extract unique party names from a set of documents for "Who" analysis.
 */
function extractKeyActors(docs: RawDocument[]): { parties: Map<string, number>; authors: string[] } {
  const parties = new Map<string, number>();
  const authorSet = new Set<string>();

  for (const doc of docs) {
    const party = normalizePartyKey(doc.parti);
    if (party && party !== 'other') {
      parties.set(party, (parties.get(party) ?? 0) + 1);
    }
    const author = doc.intressent_namn || doc.author || '';
    if (author && author !== 'Unknown' && author.length > 1) {
      authorSet.add(author);
    }
  }

  return { parties, authors: Array.from(authorSet).slice(0, 8) };
}

/**
 * Aggregate policy domains across all documents for "What" analysis.
 */
function aggregateDomains(docs: RawDocument[], lang: Language | string): Map<string, number> {
  const domainCounts = new Map<string, number>();
  for (const doc of docs) {
    for (const domain of detectPolicyDomains(doc, lang)) {
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }
  }
  return domainCounts;
}

/**
 * Determine winners and losers based on document patterns and CIA context.
 */
function analyseWinnersLosers(
  docs: RawDocument[],
  cia: CIAContext | undefined,
  lang: Language | string,
): string {
  const parts: string[] = [];

  // Count government vs opposition documents
  const govDocs = docs.filter(d => d.doktyp === 'prop' || d.doktyp === 'bet' || d.doktyp === 'skr');
  const oppDocs = docs.filter(d => d.doktyp === 'mot');

  if (govDocs.length > 0 && oppDocs.length > 0) {
    const ratio = govDocs.length / Math.max(1, oppDocs.length);
    if (ratio > 2) {
      parts.push(govAdvantageText(lang, govDocs.length, oppDocs.length));
    } else if (ratio < 0.5) {
      parts.push(oppPressureText(lang, oppDocs.length));
    } else {
      parts.push(balancedText(lang));
    }
  }

  if (cia) {
    const margin = cia.coalitionStability?.majorityMargin ?? 0;
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (margin <= 3 && stability < 60) {
      parts.push(coalitionRiskText(lang, margin));
    }
  }

  return parts.join(' ') || '<!-- AI_MUST_REPLACE: winners_losers_analysis -->';
}

function govAdvantageText(lang: Language | string, gov: number, opp: number): string {
  const templates: Record<string, string> = {
    en: `The governing coalition holds the initiative with ${gov} legislative items versus ${opp} opposition motions, suggesting strong agenda control.`,
    sv: `Regeringskoalitionen håller initiativet med ${gov} lagstiftningsärenden mot ${opp} oppositionsyrkanden, vilket tyder på stark agendakontroll.`,
    da: `Regeringskoalitionen har initiativet med ${gov} lovgivningspunkter mod ${opp} oppositionsforslag.`,
    no: `Regjeringskoalisjonen holder initiativet med ${gov} lovforslag mot ${opp} opposisjonsforslag.`,
    fi: `Hallituskoalitio pitää aloitteen ${gov} lainsäädäntöasialla vastaan ${opp} opposition aloitetta.`,
    de: `Die Regierungskoalition hält die Initiative mit ${gov} Gesetzgebungspunkten gegenüber ${opp} Oppositionsanträgen.`,
    fr: `La coalition gouvernementale tient l'initiative avec ${gov} points législatifs contre ${opp} motions de l'opposition.`,
    es: `La coalición gobernante mantiene la iniciativa con ${gov} puntos legislativos frente a ${opp} mociones de la oposición.`,
    nl: `De regeringscoalitie houdt het initiatief met ${gov} wetgevingspunten versus ${opp} oppositiemoties.`,
    ar: `يحتفظ الائتلاف الحاكم بالمبادرة بـ${gov} بنداً تشريعياً مقابل ${opp} اقتراحات معارضة.`,
    he: `הקואליציה שומרת על היוזמה עם ${gov} סעיפי חקיקה מול ${opp} הצעות אופוזיציה.`,
    ja: `与党連合は${gov}の立法項目で主導権を握り、野党の${opp}動議に対して優位に立っています。`,
    ko: `여당 연합은 ${gov}건의 입법 항목으로 주도권을 유지하며, 야당의 ${opp}건 동의에 대해 우위를 보이고 있습니다.`,
    zh: `执政联盟以${gov}项立法议题保持主动权，对比反对党的${opp}项动议。`,
  };
  return templates[lang as string] ?? templates.en;
}

function oppPressureText(lang: Language | string, opp: number): string {
  const templates: Record<string, string> = {
    en: `The opposition is applying significant pressure with ${opp} motions, signalling broad dissatisfaction with government policy.`,
    sv: `Oppositionen utövar betydande tryck med ${opp} motioner, vilket signalerar brett missnöje med regeringens politik.`,
  };
  return templates[lang as string] ?? templates.en;
}

function balancedText(lang: Language | string): string {
  const templates: Record<string, string> = {
    en: 'The balance between government and opposition activity suggests a competitive legislative environment where neither side dominates.',
    sv: 'Balansen mellan regerings- och oppositionsaktivitet tyder på en konkurrensutsatt lagstiftningsmiljö.',
  };
  return templates[lang as string] ?? templates.en;
}

function coalitionRiskText(lang: Language | string, margin: number): string {
  const templates: Record<string, string> = {
    en: `With a majority margin of only ${margin} seats, the coalition faces elevated risk of legislative defeats on contested measures.`,
    sv: `Med en majoritetsmarginal på bara ${margin} mandat löper koalitionen förhöjd risk för nederlag vid omstridda omröstningar.`,
  };
  return templates[lang as string] ?? templates.en;
}

/**
 * Generate a comprehensive Deep Analysis section following the 5W framework
 * (Who, What, When, Why, Winners/Losers) plus impact, consequences, and critical
 * assessment subsections. This section is designed for highly analytical readers
 * who seek multi-perspective intelligence on parliamentary developments.
 *
 * @returns HTML string for the deep analysis section, or empty string if insufficient data
 */
export function generateDeepAnalysisSection(opts: DeepAnalysisOptions): string {
  const { documents, lang, cia, articleType, whyContext, frameworkAnalysis, perspectiveAnalysis } = opts;

  // Deep analysis requires at least 2 documents for cross-document insights
  // in standard article types. For deep-inspection articles, allow single-
  // document analysis since the whole article is dedicated to in-depth review.
  const minDocs = articleType === 'deep-inspection' ? 1 : 2;
  if (!documents || documents.length < minDocs) return '';

  const lbl = (key: string): string => {
    const val = L(lang, key);
    return typeof val === 'string' ? val : key;
  };

  const parts: string[] = [];
  parts.push(`\n    <section class="deep-analysis" aria-label="${escapeHtml(lbl('deepAnalysis'))}">`);
  parts.push(`    <h2>${escapeHtml(lbl('deepAnalysis'))}</h2>`);

  // ── WHO: Key Actors ────────────────────────────────────────────────────────
  const { parties, authors } = extractKeyActors(documents);
  if (parties.size > 0 || authors.length > 0) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWho'))}</h3>`);
    if (parties.size > 0) {
      const sortedParties = [...parties.entries()].sort((a, b) => b[1] - a[1]);
      const partyList = sortedParties
        .map(([p, count]) => `<strong>${escapeHtml(p)}</strong> (${count})`)
        .join(', ');
      parts.push(`    <p>${partyList}</p>`);
    }
    if (authors.length > 0) {
      parts.push(`    <p>${authors.map(a => escapeHtml(a)).join(', ')}</p>`);
    }
  }

  // ── WHAT: What Happened ────────────────────────────────────────────────────
  const domains = aggregateDomains(documents, lang);
  if (domains.size > 0) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhat'))}</h3>`);
    const sortedDomains = [...domains.entries()].sort((a, b) => b[1] - a[1]);
    const domainItems = sortedDomains.slice(0, 6)
      .map(([d, c]) => `${escapeHtml(d)} (${c})`)
      .join(', ');
    const docTypes = new Map<string, number>();
    for (const doc of documents) {
      const t = doc.doktyp || doc.documentType || 'other';
      docTypes.set(t, (docTypes.get(t) ?? 0) + 1);
    }
    const typeList = [...docTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${escapeHtml(localizeDocType(t, lang, c))}: ${c}`)
      .join(', ');
    parts.push(`    <p>${domainItems}</p>`);
    parts.push(`    <p><em>${typeList}</em></p>`);
  }

  // ── WHEN: Timeline & Context ───────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhen'))}</h3>`);
  const timelineContext = generateTimelineContext(documents, lang, articleType);
  parts.push(`    <p>${timelineContext}</p>`);

  // ── WHY: Why This Matters ──────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhy'))}</h3>`);
  const whyText = generateWhyAnalysis(documents, lang, cia, whyContext);
  parts.push(`    <p>${whyText}</p>`);

  // ── WINNERS & LOSERS ───────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWinners'))}</h3>`);
  const winnersText = analyseWinnersLosers(documents, cia, lang);
  parts.push(`    <p>${winnersText}</p>`);

  // ── POLITICAL IMPACT ───────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisImpact'))}</h3>`);
  const impactText = generateImpactAnalysis(documents, lang, cia);
  parts.push(`    <p>${impactText}</p>`);

  // ── ACTIONS & CONSEQUENCES ─────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisConsequences'))}</h3>`);
  const consequencesText = generateConsequencesAnalysis(documents, lang, articleType);
  parts.push(`    <p>${consequencesText}</p>`);

  // ── CRITICAL ASSESSMENT ────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisCritical'))}</h3>`);
  const criticalText = generateCriticalAssessment(documents, lang, cia);
  parts.push(`    <p>${criticalText}</p>`);

  // ── MULTIPLE PERSPECTIVES ──────────────────────────────────────────────────
  if (parties.size >= 2) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisPerspectives'))}</h3>`);
    const perspectivesText = generatePerspectivesAnalysis(documents, lang, parties);
    parts.push(`    <p>${perspectivesText}</p>`);
  }

  // ── FRAMEWORK ANALYSIS SECTIONS ────────────────────────────────────────────
  // When the document analysis framework has been run, inject its richer
  // PESTLE, stakeholder impact, risk, and implementation assessment data.
  if (frameworkAnalysis && frameworkAnalysis.size > 0) {
    const analyses = [...frameworkAnalysis.values()];

    // PESTLE Analysis — aggregate across all analysed documents
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisPestle'))}</h3>`);
    parts.push(renderAggregatedPestle(analyses, lang));

    // Stakeholder Impact — summarise stakeholder impacts from the framework
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisStakeholderImpact'))}</h3>`);
    parts.push(renderStakeholderImpactSummary(analyses, lang));

    // Risk Assessment — aggregate risk factors across documents
    const allRisks = analyses.flatMap(a => a.riskAssessment);
    if (allRisks.length > 0) {
      parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisRisk'))}</h3>`);
      parts.push(renderRiskAssessment(allRisks, lang));
    }

    // Implementation Assessment — summarise implementation feasibility
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisImplementation'))}</h3>`);
    parts.push(renderImplementationAssessment(analyses, lang));
  }

  // ── MULTI-PERSPECTIVE INSIGHTS (6 lenses) ────────────────────────────────
  // When the analysis-framework has been run, inject key insights from the
  // government, opposition, citizen, economic, international, and media lenses.
  if (perspectiveAnalysis && perspectiveAnalysis.results.length > 0) {
    const allInsights = perspectiveAnalysis.results.flatMap((r: unknown) => ((r as { keyInsights?: string[] }).keyInsights ?? []));
    if (allInsights.length > 0) {
      const uniqueInsights = [...new Set(allInsights)].slice(0, MAX_PERSPECTIVE_INSIGHTS);
      parts.push(`    <div class="perspective-insights">`);
      const insightItems = uniqueInsights.map(i => `      <li>${escapeHtml(i)}</li>`).join('\n');
      parts.push(`    <ul>\n${insightItems}\n    </ul>`);
      parts.push(`    </div>`);
    }
  }

  parts.push('    </section>\n');
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Deep Analysis subsection generators
// ---------------------------------------------------------------------------

function generateTimelineContext(docs: RawDocument[], lang: Language | string, articleType: string): string {
  const count = docs.length;
  const committees = new Set(docs.map(d => d.organ || d.committee || '').filter(Boolean));

  const prospective = articleType.includes('ahead');
  const retrospective = articleType.includes('review');

  const templates: Record<string, Record<string, string>> = {
    en: {
      prospective: `${count} items are scheduled across ${committees.size} committee${committees.size !== 1 ? 's' : ''}, creating a dense legislative calendar that demands close monitoring. Each item moves through committee review and chamber debate — timing and sequencing will determine which issues reach a vote.`,
      retrospective: `Over the review period, ${count} parliamentary actions were recorded across ${committees.size} committee${committees.size !== 1 ? 's' : ''}. The volume and distribution of activity reveals the government's priorities and the opposition's strategic responses.`,
      default: `${count} parliamentary items across ${committees.size} active committee${committees.size !== 1 ? 's' : ''} define the current legislative landscape. The pace of activity signals the political urgency driving these proceedings.`,
    },
    sv: {
      prospective: `${count} ärenden är planerade i ${committees.size} utskott, vilket skapar en tät lagstiftningskalender som kräver noggrann bevakning.`,
      retrospective: `Under granskningsperioden registrerades ${count} parlamentariska åtgärder i ${committees.size} utskott. Volymen och fördelningen avslöjar regeringens prioriteringar.`,
      default: `${count} riksdagsärenden i ${committees.size} aktiva utskott definierar det aktuella lagstiftningslandskapet.`,
    },
  };

  const langTemplates = templates[lang as string] ?? templates.en;
  const key = prospective ? 'prospective' : retrospective ? 'retrospective' : 'default';
  return langTemplates[key] ?? langTemplates.default;
}

function generateWhyAnalysis(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined, extraContext?: string): string {
  const parts: string[] = [];

  // Domain breadth signals policy ambition
  const domains = aggregateDomains(docs, lang);
  const domainCount = domains.size;
  if (domainCount >= 4) {
    parts.push(broadAgendaText(lang, domainCount));
  } else if (domainCount >= 2) {
    parts.push(focusedAgendaText(lang, domainCount));
  }

  // Coalition stability context
  if (cia) {
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (stability < 50) {
      parts.push(instabilityText(lang));
    }
  }

  if (extraContext) {
    parts.push(escapeHtml(extraContext));
  }

  if (parts.length === 0) {
    parts.push(defaultWhyText(lang));
  }

  return parts.join(' ');
}

function broadAgendaText(lang: Language | string, n: number): string {
  const templates: Record<string, string> = {
    en: `With ${n} policy domains in play, this represents a broad legislative push that will shape multiple aspects of Swedish society. The breadth of activity makes this a critical period for understanding the government's strategic direction.`,
    sv: `Med ${n} politikområden i spel representerar detta en bred lagstiftningssatsning som kommer att forma flera aspekter av det svenska samhället.`,
  };
  return templates[lang as string] ?? templates.en;
}

function focusedAgendaText(lang: Language | string, n: number): string {
  const templates: Record<string, string> = {
    en: `Activity concentrated in ${n} policy domains suggests targeted legislative priorities rather than broad reform, making each initiative particularly consequential.`,
    sv: `Aktivitet koncentrerad till ${n} politikområden tyder på riktade lagstiftningsprioriteringar snarare än bred reform.`,
  };
  return templates[lang as string] ?? templates.en;
}

function instabilityText(lang: Language | string): string {
  const templates: Record<string, string> = {
    en: 'The current coalition instability adds significant uncertainty to all legislative proceedings. Any controversial measure could become a confidence test.',
    sv: 'Den nuvarande koalitionsinstabiliteten tillför betydande osäkerhet till alla lagstiftningsförfaranden.',
  };
  return templates[lang as string] ?? templates.en;
}

function defaultWhyText(lang: Language | string): string {
  const templates: Record<string, string> = {
    en: 'These parliamentary developments carry significance for Swedish governance, reflecting ongoing policy debates and power dynamics within the Riksdag.',
    sv: 'Dessa riksdagshändelser har betydelse för svensk styrning och speglar pågående politiska debatter och maktdynamik.',
  };
  return templates[lang as string] ?? templates.en;
}

function generateImpactAnalysis(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined): string {
  const parts: string[] = [];

  const propCount = docs.filter(d => d.doktyp === 'prop').length;
  const motCount = docs.filter(d => d.doktyp === 'mot').length;
  const betCount = docs.filter(d => d.doktyp === 'bet').length;

  if (propCount > 0) {
    parts.push(propImpactText(lang, propCount));
  }
  if (betCount > 0) {
    parts.push(betImpactText(lang, betCount));
  }
  if (motCount > 0) {
    parts.push(motImpactText(lang, motCount));
  }

  if (cia) {
    const margin = cia.coalitionStability?.majorityMargin ?? 0;
    if (margin <= 5) {
      parts.push(thinMajorityImpactText(lang, margin));
    }
  }

  return parts.join(' ') || genericImpactText(lang);
}

function propImpactText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `${n} government proposition${n !== 1 ? 's' : ''} will, if adopted, directly alter Swedish law and policy, affecting citizens, businesses, and institutions.`,
    sv: `${n} regeringsproposition${n !== 1 ? 'er' : ''} kommer, om de antas, att direkt ändra svensk lag och politik.`,
  };
  return t[lang as string] ?? t.en;
}

function betImpactText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `${n} committee report${n !== 1 ? 's' : ''} represent${n === 1 ? 's' : ''} the culmination of legislative review, with recommendations that guide chamber votes.`,
    sv: `${n} betänkande${n !== 1 ? 'n' : ''} representerar kulmen av lagstiftningsöversynen.`,
  };
  return t[lang as string] ?? t.en;
}

function motImpactText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `${n} opposition motion${n !== 1 ? 's' : ''} challenge${n === 1 ? 's' : ''} the government's position, even though most motions are historically rejected; they signal future electoral battlegrounds.`,
    sv: `${n} oppositionsmotion${n !== 1 ? 'er' : ''} utmanar regeringens position och signalerar framtida valfrågor.`,
  };
  return t[lang as string] ?? t.en;
}

function thinMajorityImpactText(lang: Language | string, margin: number): string {
  const t: Record<string, string> = {
    en: `The thin majority margin of ${margin} seat${margin !== 1 ? 's' : ''} means any defection could defeat government measures, amplifying the political stakes.`,
    sv: `Den tunna majoritetsmarginal på ${margin} mandat innebär att varje avhopp kan fälla regeringens förslag.`,
  };
  return t[lang as string] ?? t.en;
}

function genericImpactText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'The legislative activity reflects the ongoing interplay between governing ambition and opposition scrutiny that characterises Swedish parliamentary democracy.',
    sv: 'Lagstiftningsaktiviteten speglar det pågående samspelet mellan regeringsambitioner och oppositionens granskning.',
  };
  return t[lang as string] ?? t.en;
}

function generateConsequencesAnalysis(docs: RawDocument[], lang: Language | string, _articleType: string): string {
  const propCount = docs.filter(d => d.doktyp === 'prop').length;
  const motCount = docs.filter(d => d.doktyp === 'mot').length;
  const parts: string[] = [];

  if (propCount > 0) {
    parts.push(propConsequencesText(lang, propCount));
  }
  if (motCount > 0) {
    parts.push(motConsequencesText(lang, motCount));
  }
  if (parts.length === 0) {
    parts.push(genericConsequencesText(lang));
  }
  return parts.join(' ');
}

function propConsequencesText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `If adopted, these ${n} proposition${n !== 1 ? 's' : ''} will trigger implementation across government agencies, requiring regulatory changes, budget allocations, and administrative adaptation. Failure to pass would signal coalition weakness and embolden the opposition.`,
    sv: `Om de antas kommer dessa ${n} proposition${n !== 1 ? 'er' : ''} att utlösa implementering i myndigheter, kräva regeländringar och budgetanpassningar.`,
  };
  return t[lang as string] ?? t.en;
}

function motConsequencesText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `The ${n} opposition motion${n !== 1 ? 's' : ''}, while likely to be rejected, establish the policy alternatives that opposition parties will champion in the next election cycle. Rejection does not diminish their strategic value as campaign ammunition.`,
    sv: `De ${n} oppositionsmotion${n !== 1 ? 'erna' : 'en'}, även om de troligen avslås, etablerar policyalternativ för nästa valcykel.`,
  };
  return t[lang as string] ?? t.en;
}

function genericConsequencesText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'The outcomes of these proceedings will cascade through committee deliberations, chamber votes, and ultimately into policy implementation — or be shelved, affecting political credibility and future legislative strategy.',
    sv: 'Resultaten av dessa ärenden kommer att kaskadgenomslag genom utskottsbehandling, kammarröstning och slutligen policyimplementering.',
  };
  return t[lang as string] ?? t.en;
}

function generateCriticalAssessment(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined): string {
  const parts: string[] = [];

  // Check for single-party dominance in motions (potential echo chamber)
  const motionParties = new Map<string, number>();
  docs.filter(d => d.doktyp === 'mot').forEach(d => {
    const p = normalizePartyKey(d.parti);
    if (p && p !== 'other') motionParties.set(p, (motionParties.get(p) ?? 0) + 1);
  });
  const totalMotions = [...motionParties.values()].reduce((a, b) => a + b, 0);
  if (motionParties.size === 1 && totalMotions > 3) {
    parts.push(singlePartyDominanceText(lang));
  }

  // Check for lack of debate data (information gap)
  const withSpeeches = docs.filter(d => d.speeches && d.speeches.length > 0).length;
  if (withSpeeches === 0 && docs.length > 3) {
    parts.push(debateAnalysisMarker());
  }

  // Thin majority risk assessment
  if (cia) {
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (stability < 40) {
      parts.push(criticalStabilityText(lang));
    }
  }

  if (parts.length === 0) {
    parts.push(defaultCriticalText(lang));
  }

  return parts.join(' ');
}

function singlePartyDominanceText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'Opposition activity is dominated by a single party, which may indicate either strategic focus or a failure of other parties to engage. Watch for whether this concentration reflects genuine policy leadership or internal opposition dysfunction.',
    sv: 'Oppositionsaktiviteten domineras av ett enda parti, vilket kan tyda på antingen strategiskt fokus eller andra partiers misslyckande att engagera sig.',
  };
  return t[lang as string] ?? t.en;
}

function debateAnalysisMarker(): string {
  return '<!-- AI_MUST_REPLACE: debate_analysis -->';
}

function criticalStabilityText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'Coalition stability has deteriorated to critical levels. The risk of a government crisis is non-trivial, and any procedural surprise could trigger a confidence vote. All legislative analysis must be read through this lens of instability.',
    sv: 'Koalitionsstabiliteten har försämrats till kritiska nivåer. Risken för en regeringskris är icke-trivial.',
  };
  return t[lang as string] ?? t.en;
}

function defaultCriticalText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'Standard parliamentary procedures are being followed, but vigilance is warranted. The gap between legislative intent and implementation often reveals the true political winners and losers. Monitor committee amendments and chamber debate quality for the full picture.',
    sv: 'Standardiserade parlamentariska förfaranden följs, men vaksamhet är motiverad. Klyftan mellan lagstiftningsavsikt och implementering avslöjar ofta de verkliga vinnarna och förlorarna.',
  };
  return t[lang as string] ?? t.en;
}

function generatePerspectivesAnalysis(docs: RawDocument[], lang: Language | string, parties: Map<string, number>): string {
  const sortedParties = [...parties.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const partyAnalyses: string[] = [];

  for (const [party, count] of sortedParties) {
    const partyDocs = docs.filter(d => normalizePartyKey(d.parti) === party);
    const partyDomains = aggregateDomains(partyDocs, lang);
    const topDomains = [...partyDomains.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([d]) => d);
    if (topDomains.length > 0) {
      partyAnalyses.push(
        `<strong>${escapeHtml(party)}</strong> (${count}): ${topDomains.map(d => escapeHtml(d)).join(', ')}`
      );
    } else {
      partyAnalyses.push(`<strong>${escapeHtml(party)}</strong> (${count})`);
    }
  }

  if (partyAnalyses.length === 0) return '';
  return partyAnalyses.join(' · ');
}

// ---------------------------------------------------------------------------
// Framework analysis section renderers
// ---------------------------------------------------------------------------

/** Max items per PESTLE dimension in aggregated display */
const MAX_PESTLE_ITEMS = 4;
/** Max stakeholder impacts shown in the summary list */
const MAX_STAKEHOLDER_IMPACTS = 7;
/** Max risk items shown in the risk assessment summary */
const MAX_RISK_ITEMS = 5;
/** Max perspective insights shown from 6-lens analysis */
const MAX_PERSPECTIVE_INSIGHTS = 5;
/** Max implementation obstacles listed */
const MAX_IMPLEMENTATION_OBSTACLES = 4;
/** Max agencies displayed in implementation assessment */
const MAX_AGENCIES_DISPLAYED = 5;

const PESTLE_LABELS: Readonly<Record<string, Record<keyof PESTLEAnalysis, string>>> = {
  en: { political: 'Political', economic: 'Economic', social: 'Social', technological: 'Technological', legal: 'Legal', environmental: 'Environmental' },
  sv: { political: 'Politisk', economic: 'Ekonomisk', social: 'Social', technological: 'Teknologisk', legal: 'Juridisk', environmental: 'Miljö' },
  da: { political: 'Politisk', economic: 'Økonomisk', social: 'Social', technological: 'Teknologisk', legal: 'Juridisk', environmental: 'Miljø' },
  no: { political: 'Politisk', economic: 'Økonomisk', social: 'Sosial', technological: 'Teknologisk', legal: 'Juridisk', environmental: 'Miljø' },
  fi: { political: 'Poliittinen', economic: 'Taloudellinen', social: 'Sosiaalinen', technological: 'Teknologinen', legal: 'Oikeudellinen', environmental: 'Ympäristö' },
  de: { political: 'Politisch', economic: 'Wirtschaftlich', social: 'Sozial', technological: 'Technologisch', legal: 'Rechtlich', environmental: 'Umwelt' },
  fr: { political: 'Politique', economic: 'Économique', social: 'Social', technological: 'Technologique', legal: 'Juridique', environmental: 'Environnemental' },
  es: { political: 'Político', economic: 'Económico', social: 'Social', technological: 'Tecnológico', legal: 'Jurídico', environmental: 'Ambiental' },
  nl: { political: 'Politiek', economic: 'Economisch', social: 'Sociaal', technological: 'Technologisch', legal: 'Juridisch', environmental: 'Milieu' },
  ar: { political: 'سياسي', economic: 'اقتصادي', social: 'اجتماعي', technological: 'تقني', legal: 'قانوني', environmental: 'بيئي' },
  he: { political: 'פוליטי', economic: 'כלכלי', social: 'חברתי', technological: 'טכנולוגי', legal: 'משפטי', environmental: 'סביבתי' },
  ja: { political: '政治', economic: '経済', social: '社会', technological: '技術', legal: '法的', environmental: '環境' },
  ko: { political: '정치', economic: '경제', social: '사회', technological: '기술', legal: '법률', environmental: '환경' },
  zh: { political: '政治', economic: '经济', social: '社会', technological: '技术', legal: '法律', environmental: '环境' },
};

const RISK_TYPE_LABELS: Readonly<Record<string, Record<RiskAssessment['type'], string>>> = {
  en: { political: 'Political', implementation: 'Implementation', 'public-acceptance': 'Public acceptance', legal: 'Legal', financial: 'Financial' },
  sv: { political: 'Politisk', implementation: 'Genomförande', 'public-acceptance': 'Offentlig acceptans', legal: 'Juridisk', financial: 'Finansiell' },
  da: { political: 'Politisk', implementation: 'Implementering', 'public-acceptance': 'Offentlig accept', legal: 'Juridisk', financial: 'Finansiel' },
  no: { political: 'Politisk', implementation: 'Implementering', 'public-acceptance': 'Offentlig aksept', legal: 'Juridisk', financial: 'Finansiell' },
  fi: { political: 'Poliittinen', implementation: 'Toteutus', 'public-acceptance': 'Julkinen hyväksyntä', legal: 'Oikeudellinen', financial: 'Taloudellinen' },
  de: { political: 'Politisch', implementation: 'Umsetzung', 'public-acceptance': 'Öffentliche Akzeptanz', legal: 'Rechtlich', financial: 'Finanziell' },
  fr: { political: 'Politique', implementation: 'Mise en œuvre', 'public-acceptance': 'Acceptation publique', legal: 'Juridique', financial: 'Financier' },
  es: { political: 'Político', implementation: 'Implementación', 'public-acceptance': 'Aceptación pública', legal: 'Jurídico', financial: 'Financiero' },
  nl: { political: 'Politiek', implementation: 'Implementatie', 'public-acceptance': 'Publieke acceptatie', legal: 'Juridisch', financial: 'Financieel' },
  ar: { political: 'سياسي', implementation: 'تنفيذي', 'public-acceptance': 'القبول العام', legal: 'قانوني', financial: 'مالي' },
  he: { political: 'פוליטי', implementation: 'יישום', 'public-acceptance': 'קבלה ציבורית', legal: 'משפטי', financial: 'פיננסי' },
  ja: { political: '政治', implementation: '実装', 'public-acceptance': '世論受容', legal: '法的', financial: '財政' },
  ko: { political: '정치', implementation: '이행', 'public-acceptance': '대중 수용성', legal: '법률', financial: '재정' },
  zh: { political: '政治', implementation: '实施', 'public-acceptance': '公众接受度', legal: '法律', financial: '财政' },
};

const LEVEL_LABELS: Readonly<Record<string, Record<'high' | 'medium' | 'low', string>>> = {
  en: { high: 'High', medium: 'Medium', low: 'Low' },
  sv: { high: 'Hög', medium: 'Medel', low: 'Låg' },
  da: { high: 'Høj', medium: 'Mellem', low: 'Lav' },
  no: { high: 'Høy', medium: 'Middels', low: 'Lav' },
  fi: { high: 'Korkea', medium: 'Keskitaso', low: 'Matala' },
  de: { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' },
  fr: { high: 'Élevé', medium: 'Moyen', low: 'Faible' },
  es: { high: 'Alto', medium: 'Medio', low: 'Bajo' },
  nl: { high: 'Hoog', medium: 'Middel', low: 'Laag' },
  ar: { high: 'مرتفع', medium: 'متوسط', low: 'منخفض' },
  he: { high: 'גבוה', medium: 'בינוני', low: 'נמוך' },
  ja: { high: '高', medium: '中', low: '低' },
  ko: { high: '높음', medium: '보통', low: '낮음' },
  zh: { high: '高', medium: '中', low: '低' },
};

const IMPLEMENTATION_LABELS: Readonly<Record<string, { feasibility: string; obstacles: string; agencies: string; noStakeholderData: string; noImplementationData: string; burden: string }>> = {
  en: { feasibility: 'Feasibility', obstacles: 'Key obstacles', agencies: 'Agencies involved', noStakeholderData: 'No stakeholder impact data available.', noImplementationData: 'No implementation data available.', burden: 'Burden' },
  sv: { feasibility: 'Genomförbarhet', obstacles: 'Viktiga hinder', agencies: 'Berörda myndigheter', noStakeholderData: 'Ingen data om intressentpåverkan tillgänglig.', noImplementationData: 'Ingen implementeringsdata tillgänglig.', burden: 'Belastning' },
  da: { feasibility: 'Gennemførlighed', obstacles: 'Vigtige hindringer', agencies: 'Involverede myndigheder', noStakeholderData: 'Ingen data om interessentpåvirkning tilgængelig.', noImplementationData: 'Ingen implementeringsdata tilgængelig.', burden: 'Byrde' },
  no: { feasibility: 'Gjennomførbarhet', obstacles: 'Viktige hindringer', agencies: 'Involverte etater', noStakeholderData: 'Ingen data om interessentpåvirkning tilgjengelig.', noImplementationData: 'Ingen implementeringsdata tilgjengelig.', burden: 'Belastning' },
  fi: { feasibility: 'Toteutettavuus', obstacles: 'Keskeiset esteet', agencies: 'Mukana olevat viranomaiset', noStakeholderData: 'Sidosryhmävaikutustietoa ei saatavilla.', noImplementationData: 'Toteutustietoa ei saatavilla.', burden: 'Rasite' },
  de: { feasibility: 'Umsetzbarkeit', obstacles: 'Wesentliche Hindernisse', agencies: 'Beteiligte Behörden', noStakeholderData: 'Keine Daten zu Stakeholder-Auswirkungen verfügbar.', noImplementationData: 'Keine Umsetzungsdaten verfügbar.', burden: 'Belastung' },
  fr: { feasibility: 'Faisabilité', obstacles: 'Obstacles clés', agencies: 'Agences impliquées', noStakeholderData: 'Aucune donnée d’impact des parties prenantes disponible.', noImplementationData: 'Aucune donnée de mise en œuvre disponible.', burden: 'Charge' },
  es: { feasibility: 'Viabilidad', obstacles: 'Obstáculos clave', agencies: 'Organismos implicados', noStakeholderData: 'No hay datos de impacto en partes interesadas.', noImplementationData: 'No hay datos de implementación disponibles.', burden: 'Carga' },
  nl: { feasibility: 'Haalbaarheid', obstacles: 'Belangrijkste obstakels', agencies: 'Betrokken instanties', noStakeholderData: 'Geen gegevens over impact op belanghebbenden beschikbaar.', noImplementationData: 'Geen implementatiegegevens beschikbaar.', burden: 'Last' },
  ar: { feasibility: 'قابلية التنفيذ', obstacles: 'العقبات الرئيسية', agencies: 'الجهات المعنية', noStakeholderData: 'لا تتوفر بيانات تأثير أصحاب المصلحة.', noImplementationData: 'لا تتوفر بيانات تنفيذ.', burden: 'العبء' },
  he: { feasibility: 'ישימות', obstacles: 'חסמים מרכזיים', agencies: 'גורמים מעורבים', noStakeholderData: 'אין נתוני השפעה על בעלי עניין.', noImplementationData: 'אין נתוני יישום.', burden: 'נטל' },
  ja: { feasibility: '実現可能性', obstacles: '主な障害', agencies: '関係機関', noStakeholderData: 'ステークホルダー影響データはありません。', noImplementationData: '実施データはありません。', burden: '負担' },
  ko: { feasibility: '실행 가능성', obstacles: '주요 장애 요인', agencies: '관여 기관', noStakeholderData: '이해관계자 영향 데이터가 없습니다.', noImplementationData: '이행 데이터가 없습니다.', burden: '부담' },
  zh: { feasibility: '可实施性', obstacles: '关键障碍', agencies: '涉及机构', noStakeholderData: '暂无利益相关方影响数据。', noImplementationData: '暂无实施数据。', burden: '负担' },
};

function localizeLevel(level: 'high' | 'medium' | 'low', lang: Language | string): string {
  return LEVEL_LABELS[lang as string]?.[level] ?? LEVEL_LABELS.en[level];
}

function localizeRiskType(type: RiskAssessment['type'], lang: Language | string): string {
  return RISK_TYPE_LABELS[lang as string]?.[type] ?? RISK_TYPE_LABELS.en[type];
}

function localizedImplementationLabels(lang: Language | string): { feasibility: string; obstacles: string; agencies: string; noStakeholderData: string; noImplementationData: string; burden: string } {
  return IMPLEMENTATION_LABELS[lang as string] ?? IMPLEMENTATION_LABELS.en;
}

/**
 * Aggregate PESTLE dimensions across multiple document analyses into a
 * deduplicated list per dimension and render as an HTML description list.
 */
function renderAggregatedPestle(analyses: DocumentAnalysis[], lang: Language | string): string {
  const merged: PESTLEAnalysis = {
    political: [], economic: [], social: [],
    technological: [], legal: [], environmental: [],
  };

  for (const a of analyses) {
    const p = a.pestleDimensions;
    merged.political.push(...p.political);
    merged.economic.push(...p.economic);
    merged.social.push(...p.social);
    merged.technological.push(...p.technological);
    merged.legal.push(...p.legal);
    merged.environmental.push(...p.environmental);
  }

  // Deduplicate per dimension
  const dedup = (arr: string[]): string[] => [...new Set(arr)].slice(0, MAX_PESTLE_ITEMS);

  const labels = PESTLE_LABELS[lang as string] ?? PESTLE_LABELS.en;
  const dims: Array<[string, string[]]> = [
    [labels.political, dedup(merged.political)],
    [labels.economic, dedup(merged.economic)],
    [labels.social, dedup(merged.social)],
    [labels.technological, dedup(merged.technological)],
    [labels.legal, dedup(merged.legal)],
    [labels.environmental, dedup(merged.environmental)],
  ];

  const items = dims
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) =>
      `      <dt><strong>${escapeHtml(label)}</strong></dt>\n      <dd>${items.map(i => escapeHtml(i)).join(' ')}</dd>`,
    )
    .join('\n');

  return `    <dl class="pestle-analysis">\n${items}\n    </dl>`;
}

/**
 * Render a summary of stakeholder impacts across all analysed documents.
 * Shows up to 7 stakeholder groups with impact direction, confidence, and burden.
 */
function renderStakeholderImpactSummary(analyses: DocumentAnalysis[], lang: Language | string): string {
  const labels = localizedImplementationLabels(lang);
  // Collect all stakeholder impacts, deduplicated by stakeholder name
  const impactMap = new Map<string, StakeholderImpact>();
  for (const a of analyses) {
    for (const impact of a.stakeholderImpacts) {
      // Keep the higher-magnitude impact per stakeholder
      const existing = impactMap.get(impact.stakeholder);
      if (!existing || magnitudeRank(impact.directImpact.magnitude) > magnitudeRank(existing.directImpact.magnitude)) {
        impactMap.set(impact.stakeholder, impact);
      }
    }
  }

  const impacts = [...impactMap.values()].slice(0, MAX_STAKEHOLDER_IMPACTS);
  if (impacts.length === 0) return `    <p>${escapeHtml(labels.noStakeholderData)}</p>`;

  const rows = impacts.map(i => {
    const directionIcon =
      i.directImpact.direction === 'positive' ? '↑'
      : i.directImpact.direction === 'negative' ? '↓'
      : i.directImpact.direction === 'mixed' ? '↕'
      : '→';
    const burdenText = localizeLevel(i.implementationBurden, lang);
    return `      <li><strong>${escapeHtml(i.displayName)}</strong>: ${directionIcon} ${escapeHtml(i.directImpact.summary)} (${escapeHtml(i.confidence)}; ${escapeHtml(labels.burden)}: ${escapeHtml(burdenText)})</li>`;
  });

  return `    <ul class="stakeholder-impact-list">\n${rows.join('\n')}\n    </ul>`;
}

/**
 * Render a risk assessment summary. Groups risks by type and keeps the
 * highest-severity risk per type.
 */
function renderRiskAssessment(risks: RiskAssessment[], lang: Language | string): string {
  // Deduplicate by type, preferring higher severity
  const byType = new Map<string, RiskAssessment>();
  for (const r of risks) {
    const key = r.type;
    const existing = byType.get(key);
    if (!existing || severityRank(r.severity) > severityRank(existing.severity)) {
      byType.set(key, r);
    }
  }

  const top = [...byType.values()].slice(0, MAX_RISK_ITEMS);
  const rows = top.map(r => {
    const icon = r.severity === 'high' ? '🔴' : r.severity === 'medium' ? '🟡' : '🟢';
    return `      <li>${icon} <strong>${escapeHtml(localizeRiskType(r.type, lang))}</strong> (${escapeHtml(localizeLevel(r.severity, lang))}): ${escapeHtml(r.description)}</li>`;
  });

  return `    <ul class="risk-assessment-list">\n${rows.join('\n')}\n    </ul>`;
}

function severityRank(s: string): number {
  return s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}

function magnitudeRank(magnitude: 'significant' | 'moderate' | 'minor'): number {
  return magnitude === 'significant' ? 3 : magnitude === 'moderate' ? 2 : 1;
}

/**
 * Render implementation assessment summary from framework analyses.
 */
function renderImplementationAssessment(analyses: DocumentAnalysis[], lang: Language | string): string {
  const labels = localizedImplementationLabels(lang);
  const assessments: ImplementationAssessment[] = analyses.map(a => a.implementationAssessment);
  if (assessments.length === 0) return `    <p>${escapeHtml(labels.noImplementationData)}</p>`;

  // Aggregate obstacles and agencies across all documents
  const allObstacles = new Set<string>();
  const allAgencies = new Set<string>();
  let highestFeasibility: ImplementationAssessment['feasibility'] = 'high';
  let selectedAssessment: ImplementationAssessment = assessments[0];

  for (const ia of assessments) {
    ia.keyObstacles.forEach(o => allObstacles.add(o));
    ia.agenciesInvolved.forEach(a => allAgencies.add(a));
    if (feasibilityRank(ia.feasibility) < feasibilityRank(highestFeasibility)) {
      highestFeasibility = ia.feasibility;
      selectedAssessment = ia;
    }
  }

  const parts: string[] = [];
  const fIcon = highestFeasibility === 'high' ? '🟢' : highestFeasibility === 'medium' ? '🟡' : '🔴';
  const timeline = selectedAssessment.estimatedTimeline;
  parts.push(`    <p>${fIcon} <strong>${escapeHtml(labels.feasibility)}:</strong> ${escapeHtml(localizeLevel(highestFeasibility, lang))}. ${escapeHtml(timeline)}</p>`);

  if (allObstacles.size > 0) {
    const obstacleList = [...allObstacles].slice(0, MAX_IMPLEMENTATION_OBSTACLES).map(o => `<li>${escapeHtml(o)}</li>`).join('');
    parts.push(`    <p><strong>${escapeHtml(labels.obstacles)}:</strong></p>\n    <ul>${obstacleList}</ul>`);
  }

  if (allAgencies.size > 0) {
    parts.push(`    <p><strong>${escapeHtml(labels.agencies)}:</strong> ${[...allAgencies].slice(0, MAX_AGENCIES_DISPLAYED).map(a => escapeHtml(a)).join(', ')}</p>`);
  }

  return parts.join('\n');
}

function feasibilityRank(f: string): number {
  return f === 'high' ? 3 : f === 'medium' ? 2 : 1;
}

/* ── Banned pattern detection ─────────────────────────────────────────────── */

/**
 * Banned content patterns that indicate low-quality boilerplate text.
 * Per SHARED_PROMPT_PATTERNS.md §BANNED Content Patterns v4.0, these
 * must never appear in production articles. AI agents MUST replace them
 * with genuine, document-specific analysis.
 */
const BANNED_PATTERNS: readonly { label: string; pattern: RegExp }[] = [
  { label: 'neutralText: "The political landscape remains fluid…"', pattern: /The political landscape remains fluid,? with both government and opposition positioning for advantage/i },
  { label: 'debateAnalysisMarker: "No chamber debate data is available…"', pattern: /No chamber debate data is available for these items,? limiting our ability/i },
  { label: 'policySignificanceTouches: "Touches on {domains}."', pattern: /Touches on [\p{L}\p{N}][\p{L}\p{N}\s,&/()-]*\./iu },
  { label: 'analysisOfNDocuments: "Analysis of N documents covering…"', pattern: /Analysis of \d+ documents covering/i },
  { label: 'policySignificanceGeneric: "Requires committee review and chamber debate…"', pattern: /Requires committee review and chamber debate/i },
  { label: 'topicInFocusSuffix: "…: {Topic} in Focus"', pattern: /:\s+\w[\w\s]*\bin Focus\b/i },
  { label: 'briefingOnFieldLabels: "Political intelligence briefing on {Field}: and {Field}:"', pattern: /Political intelligence briefing on \w+:\s+and\s+\w+:/i },
];

/**
 * Detect banned boilerplate patterns in HTML content.
 * Returns an array of human-readable labels identifying each detected
 * banned pattern, suitable for quality gate logs and error messages.
 *
 * @param html - The HTML string to scan for banned patterns
 * @returns Array of stable human-readable labels for each detected banned pattern
 */
export function detectBannedPatterns(html: string): string[] {
  const found: string[] = [];
  for (const { label, pattern } of BANNED_PATTERNS) {
    if (pattern.test(html)) {
      found.push(label);
    }
  }
  return found;
}
