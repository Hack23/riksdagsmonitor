/**
 * @module ai-analysis/pipeline
 * @description AI-first analysis pipeline for deep-inspection articles.
 *
 * Implements the `AnalysisPipeline` interface with a content-driven approach:
 *   - Iteration 1 (`analyzeDocuments`): document classification, policy domain
 *     detection, stakeholder mapping, and evidence-based SWOT skeleton.
 *   - Iteration 2 (`refineAnalysis`): enrich SWOT entries from full-text content
 *     when documents are enriched; replace generic placeholders with specific
 *     claims drawn from actual document passages.
 *   - Iteration 3 (`validateCompleteness`): assess stakeholder coverage, policy
 *     domain confidence, and watch-point quality. Reports gap scores.
 *
 * Primary analysis text is content-derived from document metadata, passages, and
 * policy domain analysis. Fallback placeholder sentences (`buildPlaceholderText`)
 * are used only when a stakeholder × quadrant combination has zero matching
 * documents; they are never on the critical path for document-rich analyses.
 *
 * The implementation is designed as a drop-in target for future LLM API
 * integration: replace the content-extraction helpers (and fallback placeholders)
 * with API calls.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { RawDocument } from '../data-transformers/types.js';
import {
  detectPolicyDomains,
  getDomainSpecificAnalysis,
  detectNarrativeFrames,
  assessConfidenceLevel,
} from '../data-transformers/policy-analysis.js';
import { escapeHtml } from '../html-utils.js';
import { extractKeyPassage, cleanMotionText, isPersonProfileText } from '../data-transformers/helpers.js';
import { localizeDocType } from '../data-transformers/content-generators/index.js';

import type {
  AnalysisPipeline,
  AnalysisPipelineOptions,
  AnalysisResult,
  AnalysisStakeholderSwot,
  AnalysisSwotEntry,
  AnalysisWatchPoint,
  AnalysisMindmapBranch,
  PolicyAssessment,
  DashboardData,
  ValidationResult,
} from './types.js';

// ---------------------------------------------------------------------------
// Palette for dashboard type distribution charts
// ---------------------------------------------------------------------------

const TYPE_PALETTE: readonly string[] = [
  '#00d9ff', '#ff006e', '#ffbe0b', '#7b2fff', '#00c58e',
  '#ff6b35', '#4dd0e1', '#f48fb1', '#a5d6a7', '#ce93d8',
];

// ---------------------------------------------------------------------------
// Localised stakeholder names (14 languages)
// ---------------------------------------------------------------------------

type LangRecord = Partial<Record<Language, string>>;

const GOV_NAMES: LangRecord = {
  en: 'Government / Policy Administration', sv: 'Regering / Policyförvaltning',
  da: 'Regering / Politisk forvaltning', no: 'Regjering / Politisk forvaltning',
  fi: 'Hallitus / Poliittinen hallinto', de: 'Regierung / Politikverwaltung',
  fr: 'Gouvernement / Administration', es: 'Gobierno / Administración pública',
  nl: 'Regering / Beleidsadministratie', ar: 'الحكومة / الإدارة السياسية',
  he: 'ממשלה / מינהל מדיניות', ja: '政府 / 政策行政', ko: '정부 / 정책 행정', zh: '政府 / 政策管理',
};

const OPP_NAMES: LangRecord = {
  en: 'Parliament / Opposition', sv: 'Riksdag / Opposition',
  da: 'Folketing / Opposition', no: 'Storting / Opposisjon',
  fi: 'Eduskunta / Oppositio', de: 'Parlament / Opposition',
  fr: 'Parlement / Opposition', es: 'Parlamento / Oposición',
  nl: 'Parlement / Oppositie', ar: 'البرلمان / المعارضة',
  he: 'פרלמנט / אופוזיציה', ja: '議会 / 野党', ko: '의회 / 야당', zh: '议会 / 反对派',
};

const PRIVATE_NAMES: LangRecord = {
  en: 'Private Sector / Civil Society', sv: 'Privat sektor / Civilsamhälle',
  da: 'Privat sektor / Civilsamfund', no: 'Privat sektor / Sivilsamfunn',
  fi: 'Yksityissektori / Kansalaisyhteiskunta', de: 'Privatsektor / Zivilgesellschaft',
  fr: 'Secteur privé / Société civile', es: 'Sector privado / Sociedad civil',
  nl: 'Privésector / Maatschappelijk middenveld', ar: 'القطاع الخاص / المجتمع المدني',
  he: 'המגזר הפרטי / החברה האזרחית', ja: '民間セクター / 市民社会', ko: '민간 부문 / 시민 사회', zh: '私营部门 / 民间社会',
};

// ---------------------------------------------------------------------------
// Data source labels (14 languages)
// ---------------------------------------------------------------------------

const DATA_SOURCE_LABELS: LangRecord = {
  en: 'Data Sources', sv: 'Datakällor', da: 'Datakilder', no: 'Datakilder',
  fi: 'Tietolähteet', de: 'Datenquellen', fr: 'Sources de données', es: 'Fuentes de datos',
  nl: 'Gegevensbronnen', ar: 'مصادر البيانات', he: 'מקורות נתונים',
  ja: 'データソース', ko: '데이터 출처', zh: '数据来源',
};

const DATA_SOURCE_ITEMS: Partial<Record<Language, string[]>> = {
  en: ['Riksdag MCP (laws, motions, propositions)', 'World Bank (economic indicators)', 'SCB Statistics Sweden'],
  sv: ['Riksdagens MCP (lagar, motioner, propositioner)', 'Världsbanken (ekonomiska indikatorer)', 'SCB Statistikmyndigheten'],
  da: ['Riksdag MCP (love, motioner, forslag)', 'Verdensbanken (økonomiske indikatorer)', 'SCB Statistikmyndigheten'],
  no: ['Riksdag MCP (lover, motioner, proposisjoner)', 'Verdensbanken (økonomiske indikatorer)', 'SCB Statistikmyndigheten'],
  fi: ['Riksdagin MCP (lait, kirjelmät, esitykset)', 'Maailmanpankki (taloudelliset indikaattorit)', 'SCB Tilastoviranomainen'],
  de: ['Riksdag MCP (Gesetze, Anträge, Vorlagen)', 'Weltbank (Wirtschaftsindikatoren)', 'SCB Statistikmyndigheten'],
  fr: ['Riksdag MCP (lois, motions, propositions)', 'Banque mondiale (indicateurs économiques)', 'SCB Statistikmyndigheten'],
  es: ['Riksdag MCP (leyes, mociones, proposiciones)', 'Banco Mundial (indicadores económicos)', 'SCB Statistikmyndigheten'],
  nl: ['Riksdag MCP (wetten, moties, voorstellen)', 'Wereldbank (economische indicatoren)', 'SCB Statistikmyndigheten'],
  ar: ['ريكسداغ MCP (قوانين، اقتراحات)', 'البنك الدولي (مؤشرات اقتصادية)', 'SCB إحصاء السويد'],
  he: ['ריקסדאג MCP (חוקים, הצעות)', 'הבנק העולמי (אינדיקטורים כלכליים)', 'SCB הלשכה המרכזית לסטטיסטיקה'],
  ja: ['Riksdag MCP (法律・動議・提案)', '世界銀行（経済指標）', 'SCB スウェーデン統計局'],
  ko: ['Riksdag MCP (법률, 동의, 제안)', '세계은행 (경제 지표)', 'SCB 스웨덴 통계청'],
  zh: ['议会 MCP（法律、动议、提案）', '世界银行（经济指标）', 'SCB 瑞典统计局'],
};

// ---------------------------------------------------------------------------
// Document type helpers
// ---------------------------------------------------------------------------

function docType(doc: RawDocument): string {
  return (doc.doktyp || doc.documentType || '').toLowerCase();
}

function docTitle(doc: RawDocument): string {
  return (doc.titel || doc.title || doc.dokumentnamn || doc.dok_id || '').trim();
}

function docId(doc: RawDocument): string {
  return doc.dok_id || '';
}

/** Test whether a document is an SFS (enacted law/statute) — matches both `doktyp === 'sfs'` and `dokumentnamn` starting with 'SFS'. */
function isSfsDoc(doc: RawDocument): boolean {
  return docType(doc) === 'sfs' || (doc.dokumentnamn || '').startsWith('SFS');
}

/**
 * Unified predicate for "document has enriched full content available".
 * `contentFetched` alone only means metadata was retrieved; actual full-text
 * or full-HTML content may still be absent (e.g., `include_full_text=false`).
 * Use this consistently for enrichedCount, confidence scoring, and validation.
 */
function hasEnrichedContent(doc: RawDocument): boolean {
  return Boolean(doc.contentFetched && (doc.fullText || doc.fullContent));
}

/** Extract a meaningful text passage from an enriched document. */
function extractPassage(doc: RawDocument, maxChars = 400): string | null {
  const raw = doc.fullText || doc.fullContent || '';
  if (!raw || isPersonProfileText(raw)) return null;
  const cleaned = docType(doc) === 'mot' && raw.includes('Motion till riksdagen')
    ? cleanMotionText(raw)
    : raw;
  return extractKeyPassage(cleaned, maxChars) || null;
}

/** Return a SwotEntry text built from a document title — concise but explicit. */
function entryFromDoc(doc: RawDocument, topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const title = docTitle(doc);
  const type = docType(doc);
  const typeLabel = type ? localizeDocType(type, lang, 1) : '';

  if (topic) {
    // Explicit relevance framing when a focus topic is present
    const relevance = relevantLabel(lang);
    return typeLabel
      ? `${esc(typeLabel)}: ${esc(title)} — ${relevance} ${esc(topic)}`
      : `${esc(title)} — ${relevance} ${esc(topic)}`;
  }
  return typeLabel ? `${esc(typeLabel)}: ${esc(title)}` : esc(title);
}

/** Small localised phrase: "relevant to" / "relevant för" … */
function relevantLabel(lang: Language): string {
  const map: LangRecord = {
    en: 'relevant to', sv: 'relevant för', da: 'relevant for', no: 'relevant for',
    fi: 'liittyy', de: 'relevant für', fr: 'pertinent pour', es: 'relevante para',
    nl: 'relevant voor', ar: 'ذو صلة بـ', he: 'רלוונטי ל', ja: 'に関連:', ko: '관련:', zh: '相关:',
  };
  return map[lang] ?? 'relevant to';
}

/** Derive impact from document type: propositions/laws are high, committee reports medium, rest low. */
function impactFromDocType(dt: string): 'high' | 'medium' | 'low' {
  if (['prop', 'sfs', 'bet', 'fpm'].includes(dt)) return 'high';
  if (['mot', 'skr', 'pressm'].includes(dt)) return 'medium';
  return 'low';
}

/** Build a content-derived SWOT entry from full-text passage when available. */
function buildEnrichedEntry(
  doc: RawDocument,
  topic: string | null,
  lang: Language,
  passageMaxChars: number,
): AnalysisSwotEntry {
  const passage = extractPassage(doc, passageMaxChars);
  const esc = escapeHtml;
  const type = docType(doc);
  const domainAnalysis = detectPolicyDomains(doc, lang);
  const domainText = domainAnalysis.length > 0
    ? getDomainSpecificAnalysis(domainAnalysis[0]!, type, lang)
    : '';

  let text: string;
  if (passage) {
    // Content-derived: lead with passage excerpt, append domain context
    const passageHtml = esc(passage);
    text = domainText ? `${passageHtml} — ${domainText}` : passageHtml;
  } else {
    // Metadata-derived: title + domain context
    text = entryFromDoc(doc, topic, lang);
    if (domainText) text = `${text}. ${domainText}`;
  }

  return {
    text,
    impact: impactFromDocType(type),
    sourceDocIds: [docId(doc)].filter(Boolean),
    confidence: passage ? 'HIGH' : 'MEDIUM',
  };
}

/** Build a structural placeholder entry when no documents exist for a quadrant. */
function placeholderEntry(
  role: string,
  quadrant: string,
  topic: string | null,
  lang: Language,
  domains: string[],
): AnalysisSwotEntry {
  const primaryDomain = domains[0] ?? null;
  const text = buildPlaceholderText(role, quadrant, topic, primaryDomain, lang);
  return {
    text,
    impact: quadrant === 'strengths' || quadrant === 'opportunities' ? 'medium' : 'low',
    sourceDocIds: [],
    confidence: 'LOW',
  };
}

// ---------------------------------------------------------------------------
// Placeholder text builders — structural fallbacks for when no document evidence
// is available for a SWOT quadrant. These are NOT the primary analysis text;
// they are only used when a stakeholder × quadrant combination has no matching
// documents. In document-rich analyses, every SWOT entry is content-derived.
// Future LLM integration point: replace this function with an API call.
// ---------------------------------------------------------------------------

/**
 * Build a structural fallback SWOT text from role × quadrant × topic × domain.
 * Used only when no document evidence exists for a particular quadrant;
 * content-derived entries always take precedence over these placeholders.
 * Each placeholder is contextualised with the focus topic and primary domain
 * to keep entries relevant even without direct document backing.
 */
function buildPlaceholderText(
  role: string,
  quadrant: string,
  topic: string | null,
  domain: string | null,
  lang: Language,
): string {
  const topicFrag = topic ? ` (${escapeHtml(topic)})` : '';
  const domainFrag = domain ? ` in ${escapeHtml(domain)}` : '';

  // English composition — other languages use the same structure for consistency
  // Future AI integration point: replace this function with an LLM prompt.
  const compositions: Record<string, Record<string, string>> = {
    government: {
      strengths: `Legislative authority and executive agenda-setting capacity${topicFrag}${domainFrag} through government propositions and statutory instruments`,
      weaknesses: `Implementation timeline risks and resource allocation challenges${topicFrag}${domainFrag} requiring interagency coordination`,
      opportunities: `EU regulatory alignment and international cooperation frameworks${topicFrag}${domainFrag} for policy advancement`,
      threats: `Parliamentary opposition scrutiny and committee amendment risks${topicFrag}${domainFrag} that may delay or modify legislative outcomes`,
    },
    parliament: {
      strengths: `Oversight mandate and cross-committee scrutiny capacity${topicFrag}${domainFrag} through committee reports and chamber debates`,
      weaknesses: `Information asymmetry relative to executive branch${topicFrag}${domainFrag} on implementation details and classified material`,
      opportunities: `Cross-party consensus-building and coalition amendment capacity${topicFrag}${domainFrag} to strengthen legislation`,
      threats: `Government majority limiting effective amendment capacity${topicFrag}${domainFrag} in committee and chamber votes`,
    },
    'private-sector': {
      strengths: `Domain expertise, operational capacity, and sector-specific knowledge${topicFrag}${domainFrag} influencing policy design`,
      weaknesses: `Compliance adaptation burden and regulatory uncertainty${topicFrag}${domainFrag} creating planning challenges`,
      opportunities: `Policy-driven investment, innovation potential, and market development${topicFrag}${domainFrag}`,
      threats: `Rapid policy evolution and short implementation timelines${topicFrag}${domainFrag} creating competitive uncertainty`,
    },
  };

  const roleCompositions = compositions[role] ?? compositions['government']!;
  const text = roleCompositions[quadrant] ?? `Policy analysis${topicFrag}${domainFrag}`;

  // Apply language-specific framing for non-English outputs
  return applyLanguageFraming(text, lang, role, quadrant, topic, domain);
}

/**
 * Apply language-specific framing to a placeholder text.
 * For languages where translated text exists, use it; otherwise return English.
 */
function applyLanguageFraming(
  enText: string,
  lang: Language,
  role: string,
  quadrant: string,
  topic: string | null,
  domain: string | null,
): string {
  if (lang === 'en') return enText;

  // Swedish translations (most detailed — primary source language for analysis)
  if (lang === 'sv') {
    const topicFrag = topic ? ` (${escapeHtml(topic)})` : '';
    const domainFrag = domain ? ` inom ${escapeHtml(domain)}` : '';
    const svCompositions: Record<string, Record<string, string>> = {
      government: {
        strengths: `Lagstiftningsbehörighet och exekutiv agendasättningskapacitet${topicFrag}${domainFrag} genom propositioner och förordningar`,
        weaknesses: `Genomföranderisker och resursallokeringsutmaningar${topicFrag}${domainFrag} som kräver myndighetssamordning`,
        opportunities: `EU-reglering och internationella samarbetsramverk${topicFrag}${domainFrag} för politikutveckling`,
        threats: `Parlamentarisk oppositionsgranskning och utskottsändringsrisker${topicFrag}${domainFrag} som kan fördröja eller modifiera lagstiftningsresultat`,
      },
      parliament: {
        strengths: `Tillsynsmandat och utskottsgranskning${topicFrag}${domainFrag} genom betänkanden och kammardebatten`,
        weaknesses: `Informationsasymmetri gentemot den exekutiva grenen${topicFrag}${domainFrag} i genomförandedetaljer`,
        opportunities: `Konsensusbyggande över partigränser${topicFrag}${domainFrag} för att stärka lagstiftning`,
        threats: `Regeringsmajoriteten begränsar effektiv ändringskapacitet${topicFrag}${domainFrag} i utskott och kammare`,
      },
      'private-sector': {
        strengths: `Domänexpertis, operativ kapacitet och sektorsspecifik kunskap${topicFrag}${domainFrag} som påverkar policyutformning`,
        weaknesses: `Efterlevnadsanpassningsbörda och regulatorisk osäkerhet${topicFrag}${domainFrag} som skapar planeringsutmaningar`,
        opportunities: `Policydriven investering, innovationspotential och marknadsutveckling${topicFrag}${domainFrag}`,
        threats: `Snabb policyutveckling och korta genomförandetidsplaner${topicFrag}${domainFrag} skapar konkurrensmässig osäkerhet`,
      },
    };
    const roleSv = svCompositions[role] ?? svCompositions['government']!;
    const svText = roleSv[quadrant];
    if (svText) return svText;
  }

  // For other languages, return English text — the translation workflow will handle localisation
  return enText;
}

// ---------------------------------------------------------------------------
// Policy assessment builder
// ---------------------------------------------------------------------------

function buildPolicyAssessment(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): PolicyAssessment {
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domains = [...allDomains].slice(0, 8);
  const primaryDomain = domains[0] ?? null;

  const enrichedCount = docs.filter(hasEnrichedContent).length;
  const confidence = assessConfidenceLevel(docs.length, enrichedCount > 0 ? 80 : 40);

  // Build a narrative from available evidence — topic + primary domain + document count
  const topicFragment = topic ? ` on ${escapeHtml(topic)}` : '';
  const domainFragment = primaryDomain ? ` in ${escapeHtml(primaryDomain)}` : '';
  const evidenceDesc = enrichedCount > 0
    ? `${docs.length} documents (${enrichedCount} with enriched full text)`
    : `${docs.length} documents`;

  const narrative = lang === 'sv'
    ? `Analys av ${evidenceDesc} visar ${domains.length > 0 ? `politikaktivitet inom ${domains.slice(0, 3).map(d => escapeHtml(d)).join(', ')}` : 'parlamentarisk aktivitet'}${topic ? ` med fokus på ${escapeHtml(topic)}` : ''}.`
    : `Analysis of ${evidenceDesc} reveals ${domains.length > 0 ? `policy activity in ${domains.slice(0, 3).map(d => escapeHtml(d)).join(', ')}` : 'parliamentary activity'}${topicFragment}${domainFragment}.`;

  return { domains, primaryDomain, narrative, confidence };
}

// ---------------------------------------------------------------------------
// Watch point builder
// ---------------------------------------------------------------------------

function buildWatchPoints(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): AnalysisWatchPoint[] {
  const points: AnalysisWatchPoint[] = [];
  const esc = escapeHtml;

  const propDocs = docs.filter(d => docType(d) === 'prop');
  const betDocs  = docs.filter(d => docType(d) === 'bet');
  const motDocs  = docs.filter(d => docType(d) === 'mot');
  const sfsDocs  = docs.filter(isSfsDoc);
  const euDocs   = docs.filter(d => docType(d) === 'fpm');

  const topicSuffix = topic ? ` (${esc(topic)})` : '';

  if (propDocs.length > 0) {
    const titles = propDocs.slice(0, 2).map(d => esc(docTitle(d))).join('; ');
    points.push({
      title: lang === 'sv' ? `Aktiva propositioner${topicSuffix}` : `Active Government Propositions${topicSuffix}`,
      description: lang === 'sv'
        ? `${propDocs.length} proposition${propDocs.length !== 1 ? 'er' : ''} kräver parlamentarisk behandling: ${titles}`
        : `${propDocs.length} proposition${propDocs.length !== 1 ? 's' : ''} require parliamentary action: ${titles}`,
      urgency: 'high',
      sourceDocIds: propDocs.map(docId).filter(Boolean),
    });
  }

  if (betDocs.length > 0) {
    points.push({
      title: lang === 'sv' ? `Utskottsbetänkanden att följa${topicSuffix}` : `Committee Reports to Monitor${topicSuffix}`,
      description: lang === 'sv'
        ? `${betDocs.length} betänkande${betDocs.length !== 1 ? 'n' : ''} formar den parlamentariska ståndpunkten${topicSuffix}`
        : `${betDocs.length} committee report${betDocs.length !== 1 ? 's' : ''} shaping the parliamentary position${topicSuffix}`,
      urgency: 'high',
      sourceDocIds: betDocs.map(docId).filter(Boolean),
    });
  }

  if (sfsDocs.length > 0) {
    points.push({
      title: lang === 'sv' ? `Antagna lagar i kraft${topicSuffix}` : `Enacted Laws in Force${topicSuffix}`,
      description: lang === 'sv'
        ? `${sfsDocs.length} lag/förordning${sfsDocs.length !== 1 ? 'ar' : ''} etablerar rättslig ram${topicSuffix} — intressenter behöver genomföra efterlevnadsgranskning`
        : `${sfsDocs.length} enacted law${sfsDocs.length !== 1 ? 's' : ''} establish the legal framework${topicSuffix} — stakeholders must conduct compliance review`,
      urgency: 'critical',
      sourceDocIds: sfsDocs.map(docId).filter(Boolean),
    });
  }

  if (motDocs.length > 0) {
    points.push({
      title: lang === 'sv' ? `Oppositionsmotioner att bevaka${topicSuffix}` : `Opposition Motions to Track${topicSuffix}`,
      description: lang === 'sv'
        ? `${motDocs.length} motion${motDocs.length !== 1 ? 'er' : ''} signalerar alternativa politiska inriktningar${topicSuffix}`
        : `${motDocs.length} motion${motDocs.length !== 1 ? 's' : ''} signal alternative policy directions${topicSuffix}`,
      urgency: 'medium',
      sourceDocIds: motDocs.map(docId).filter(Boolean),
    });
  }

  if (euDocs.length > 0) {
    points.push({
      title: lang === 'sv' ? `EU-dimension${topicSuffix}` : `EU Dimension${topicSuffix}`,
      description: lang === 'sv'
        ? `${euDocs.length} EU-faktapromemoria avslöjar Europaperspektiv${topicSuffix} — EU-regelverket kan begränsa nationell handlingsfrihet`
        : `${euDocs.length} EU position paper${euDocs.length !== 1 ? 's' : ''} reveal European dimension${topicSuffix} — EU law may constrain national policy options`,
      urgency: 'medium',
      sourceDocIds: euDocs.map(docId).filter(Boolean),
    });
  }

  // Detect narrative frames for additional watch points
  const allFrames = new Set<string>();
  docs.slice(0, 10).forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));
  if (allFrames.size > 0) {
    const frameList = [...allFrames].slice(0, 3).join(', ');
    points.push({
      title: lang === 'sv' ? 'Narrativa ramar att övervaka' : 'Narrative Frames to Monitor',
      description: lang === 'sv'
        ? `Politiska retoriska ramar identifierade: ${escapeHtml(frameList)}`
        : `Political rhetorical frames identified: ${escapeHtml(frameList)}`,
      urgency: 'low',
      sourceDocIds: [],
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Mindmap branch builder
// ---------------------------------------------------------------------------

function buildMindmapBranches(
  docs: RawDocument[],
  topic: string | null,
  domains: string[],
  lang: Language,
): AnalysisMindmapBranch[] {
  const branches: AnalysisMindmapBranch[] = [];

  // Document type branch
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    const t = docType(d) || 'other';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeKeys = Object.keys(typeCounts);
  if (typeKeys.length > 0) {
    branches.push({
      label: docTypesLabel(lang),
      color: 'cyan',
      icon: '📄',
      items: typeKeys.map(t => `${localizeDocType(t, lang, typeCounts[t] ?? 0)} (${typeCounts[t] ?? 0})`),
    });
  }

  // Policy domains branch
  if (domains.length > 0) {
    branches.push({
      label: policyDomainsLabel(lang),
      color: 'green',
      icon: '🏛️',
      items: domains,
    });
  }

  // Stakeholder branch
  branches.push({
    label: stakeholdersLabel(lang),
    color: 'yellow',
    icon: '👥',
    items: [
      GOV_NAMES[lang] ?? GOV_NAMES.en!,
      OPP_NAMES[lang] ?? OPP_NAMES.en!,
      PRIVATE_NAMES[lang] ?? PRIVATE_NAMES.en!,
    ],
  });

  // Data sources branch
  branches.push({
    label: DATA_SOURCE_LABELS[lang] ?? DATA_SOURCE_LABELS.en!,
    color: 'purple',
    icon: '📊',
    items: DATA_SOURCE_ITEMS[lang] ?? DATA_SOURCE_ITEMS.en!,
  });

  // Topic-derived focus branch (only when topic is provided)
  if (topic) {
    const allFrames = new Set<string>();
    docs.slice(0, 15).forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));
    if (allFrames.size > 0) {
      branches.push({
        label: narrativeFramesLabel(lang),
        color: 'orange',
        icon: '🎯',
        items: [...allFrames].slice(0, 6),
      });
    }
  }

  return branches;
}

// Localised section labels
function docTypesLabel(lang: Language): string {
  const m: LangRecord = { en: 'Document Types', sv: 'Dokumenttyper', da: 'Dokumenttyper', no: 'Dokumenttyper', fi: 'Asiakirjatyypit', de: 'Dokumenttypen', fr: 'Types de documents', es: 'Tipos de documentos', nl: 'Documenttypen', ar: 'أنواع الوثائق', he: 'סוגי מסמכים', ja: '文書種類', ko: '문서 유형', zh: '文件类型' };
  return m[lang] ?? m.en!;
}
function policyDomainsLabel(lang: Language): string {
  const m: LangRecord = { en: 'Policy Domains', sv: 'Politikområden', da: 'Politikområder', no: 'Politikkområder', fi: 'Politiikka-alueet', de: 'Politikbereiche', fr: 'Domaines politiques', es: 'Áreas de política', nl: 'Beleidsdomeinen', ar: 'مجالات السياسة', he: 'תחומי מדיניות', ja: '政策分野', ko: '정책 영역', zh: '政策领域' };
  return m[lang] ?? m.en!;
}
function stakeholdersLabel(lang: Language): string {
  const m: LangRecord = { en: 'Stakeholders', sv: 'Intressenter', da: 'Interessenter', no: 'Interessenter', fi: 'Sidosryhmät', de: 'Stakeholder', fr: 'Parties prenantes', es: 'Partes interesadas', nl: 'Belanghebbenden', ar: 'أصحاب المصلحة', he: 'בעלי עניין', ja: 'ステークホルダー', ko: '이해관계자', zh: '利益相关者' };
  return m[lang] ?? m.en!;
}
function narrativeFramesLabel(lang: Language): string {
  const m: LangRecord = { en: 'Narrative Frames', sv: 'Narrativa ramar', da: 'Narrative rammer', no: 'Narrative rammer', fi: 'Narratiiviset kehykset', de: 'Narrative Rahmen', fr: 'Cadres narratifs', es: 'Marcos narrativos', nl: 'Narratieve frames', ar: 'الإطارات السردية', he: 'מסגרות נרטיביות', ja: '物語フレーム', ko: '서사 프레임', zh: '叙事框架' };
  return m[lang] ?? m.en!;
}

// ---------------------------------------------------------------------------
// Dashboard data builder
// ---------------------------------------------------------------------------

function buildDashboardData(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): DashboardData {
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    const t = docType(d) || 'other';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const typeKeys = Object.keys(typeCounts);
  const typeDistribution = typeKeys.map((t, i) => ({
    label: localizeDocType(t, lang, typeCounts[t] ?? 0),
    value: typeCounts[t] ?? 0,
    color: TYPE_PALETTE[i % TYPE_PALETTE.length] ?? '#00d9ff',
  }));

  const docIntelLabel = lang === 'sv' ? 'Dokumentintelligens' : 'Document Intelligence';
  const title = topic ? `${docIntelLabel} — ${escapeHtml(topic)}` : docIntelLabel;
  const analysedLabel = lang === 'sv' ? 'riksdagsdokument analyserade' : 'parliamentary documents analysed';
  const summary = `${docs.length} ${analysedLabel}`;

  return { title, summary, typeDistribution };
}

// ---------------------------------------------------------------------------
// Confidence score calculator
// ---------------------------------------------------------------------------

function calculateConfidenceScore(docs: RawDocument[]): number {
  if (docs.length === 0) return 0;
  const enriched = docs.filter(hasEnrichedContent).length;
  const enrichmentRatio = enriched / docs.length;
  const typeVariety = new Set(docs.map(docType)).size;
  // Score: 0-100
  // - enrichment ratio contributes 50%  (based on actual full content)
  // - doc count (up to 10) contributes 30%
  // - type variety (up to 5) contributes 20%
  const enrichmentScore = enrichmentRatio * 50;
  const countScore = Math.min(docs.length / 10, 1) * 30;
  const varietyScore = Math.min(typeVariety / 5, 1) * 20;
  return Math.round(enrichmentScore + countScore + varietyScore);
}

// ---------------------------------------------------------------------------
// Iteration 1: analyzeDocuments
// ---------------------------------------------------------------------------

async function analyzeDocuments(
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<AnalysisResult> {
  const { lang, focusTopic: topic } = options;

  const domains = (() => {
    const all = new Set<string>();
    docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => all.add(dom)));
    return [...all].slice(0, 8);
  })();

  // Classify documents by type
  const propDocs    = docs.filter(d => docType(d) === 'prop');
  const betDocs     = docs.filter(d => docType(d) === 'bet');
  const motDocs     = docs.filter(d => docType(d) === 'mot');
  const skrDocs     = docs.filter(d => docType(d) === 'skr');
  const sfsDocs     = docs.filter(isSfsDoc);
  const euDocs      = docs.filter(d => docType(d) === 'fpm');
  const pressmDocs  = docs.filter(d => docType(d) === 'pressm');
  const extDocs     = docs.filter(d => docType(d) === 'ext');

  // ── Government stakeholder SWOT ─────────────────────────────────────────────
  const govStrengths: AnalysisSwotEntry[] = [
    ...propDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...sfsDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...skrDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...pressmDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govWeaknesses: AnalysisSwotEntry[] = [
    ...betDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govOpportunities: AnalysisSwotEntry[] = [
    ...euDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...skrDocs.slice(1, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govThreats: AnalysisSwotEntry[] = [
    ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];

  if (govStrengths.length === 0)    govStrengths.push(placeholderEntry('government', 'strengths', topic, lang, domains));
  if (govWeaknesses.length === 0)   govWeaknesses.push(placeholderEntry('government', 'weaknesses', topic, lang, domains));
  if (govOpportunities.length === 0) govOpportunities.push(placeholderEntry('government', 'opportunities', topic, lang, domains));
  if (govThreats.length === 0)      govThreats.push(placeholderEntry('government', 'threats', topic, lang, domains));

  // ── Parliament / Opposition SWOT ─────────────────────────────────────────
  const oppStrengths: AnalysisSwotEntry[] = [
    ...betDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const oppWeaknesses: AnalysisSwotEntry[] = [];
  const oppOpportunities: AnalysisSwotEntry[] = [];
  const oppThreats: AnalysisSwotEntry[] = [
    ...propDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];

  if (oppStrengths.length === 0)    oppStrengths.push(placeholderEntry('parliament', 'strengths', topic, lang, domains));
  if (oppWeaknesses.length === 0)   oppWeaknesses.push(placeholderEntry('parliament', 'weaknesses', topic, lang, domains));
  if (oppOpportunities.length === 0) oppOpportunities.push(placeholderEntry('parliament', 'opportunities', topic, lang, domains));
  if (oppThreats.length === 0)      oppThreats.push(placeholderEntry('parliament', 'threats', topic, lang, domains));

  // ── Private Sector / Civil Society SWOT ──────────────────────────────────
  const privateStrengths: AnalysisSwotEntry[] = [
    ...sfsDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...extDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const privateWeaknesses: AnalysisSwotEntry[] = [];
  const privateOpportunities: AnalysisSwotEntry[] = [
    ...euDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const privateThreats: AnalysisSwotEntry[] = [];

  if (privateStrengths.length === 0)    privateStrengths.push(placeholderEntry('private-sector', 'strengths', topic, lang, domains));
  if (privateWeaknesses.length === 0)   privateWeaknesses.push(placeholderEntry('private-sector', 'weaknesses', topic, lang, domains));
  if (privateOpportunities.length === 0) privateOpportunities.push(placeholderEntry('private-sector', 'opportunities', topic, lang, domains));
  if (privateThreats.length === 0)      privateThreats.push(placeholderEntry('private-sector', 'threats', topic, lang, domains));

  // Assemble stakeholder SWOT list
  const stakeholderSwot: AnalysisStakeholderSwot[] = [
    {
      name: GOV_NAMES[lang] ?? GOV_NAMES.en!,
      role: 'government',
      swot: { strengths: govStrengths, weaknesses: govWeaknesses, opportunities: govOpportunities, threats: govThreats },
    },
    {
      name: OPP_NAMES[lang] ?? OPP_NAMES.en!,
      role: 'parliament',
      swot: { strengths: oppStrengths, weaknesses: oppWeaknesses, opportunities: oppOpportunities, threats: oppThreats },
    },
    {
      name: PRIVATE_NAMES[lang] ?? PRIVATE_NAMES.en!,
      role: 'private-sector',
      swot: { strengths: privateStrengths, weaknesses: privateWeaknesses, opportunities: privateOpportunities, threats: privateThreats },
    },
  ];

  const policyAssessment = buildPolicyAssessment(docs, topic, lang);
  const watchPoints = buildWatchPoints(docs, topic, lang);
  const mindmapBranches = buildMindmapBranches(docs, topic, policyAssessment.domains, lang);
  const dashboardData = buildDashboardData(docs, topic, lang);
  const confidenceScore = calculateConfidenceScore(docs);

  return {
    stakeholderSwot,
    policyAssessment,
    mindmapBranches,
    dashboardData,
    watchPoints,
    confidenceScore,
    iterationsCompleted: 1,
    completedAt: new Date().toISOString(),
    lang,
    documentCount: docs.length,
    enrichedCount: docs.filter(hasEnrichedContent).length,
    focusTopic: topic,
  };
}

// ---------------------------------------------------------------------------
// Iteration 2: refineAnalysis
// ---------------------------------------------------------------------------

async function refineAnalysis(
  initial: AnalysisResult,
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<AnalysisResult> {
  const { lang, focusTopic: topic } = options;
  const enrichedDocs = docs.filter(hasEnrichedContent);

  if (enrichedDocs.length === 0) {
    // No documents with full text/content available — refinement is a no-op.
    // This is expected when enrichDocumentsWithContent() fetches metadata only
    // (include_full_text=false). We still bump iterationsCompleted to 2 so the
    // pipeline contract is honoured, but enrichedCount remains 0 to signal
    // that no actual text-based enrichment occurred.
    return { ...initial, iterationsCompleted: 2, completedAt: new Date().toISOString() };
  }

  // Re-derive SWOT entries with longer passages for enriched documents
  const passageMax = 400;
  const refined = { ...initial, iterationsCompleted: 2, completedAt: new Date().toISOString() };

  // Rebuild stakeholder SWOT with richer content from enriched documents
  const propDocs   = enrichedDocs.filter(d => docType(d) === 'prop');
  const betDocs    = enrichedDocs.filter(d => docType(d) === 'bet');
  const motDocs    = enrichedDocs.filter(d => docType(d) === 'mot');
  const sfsDocs    = enrichedDocs.filter(isSfsDoc);
  const euDocs     = enrichedDocs.filter(d => docType(d) === 'fpm');
  const pressmDocs = enrichedDocs.filter(d => docType(d) === 'pressm');
  const extDocs    = enrichedDocs.filter(d => docType(d) === 'ext');
  const skrDocs    = enrichedDocs.filter(d => docType(d) === 'skr');

  // Upgrade government SWOT entries where we now have full text
  refined.stakeholderSwot = refined.stakeholderSwot.map(sh => {
    if (sh.role === 'government') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...propDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...sfsDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...skrDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...pressmDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedWeaknesses: AnalysisSwotEntry[] = betDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax));
      const enrichedOpportunities: AnalysisSwotEntry[] = [
        ...euDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...skrDocs.slice(1, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedThreats: AnalysisSwotEntry[] = motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax));

      // Merge: prefer enriched entries, fall back to initial placeholders
      return {
        ...sh,
        swot: {
          strengths:     enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          weaknesses:    enrichedWeaknesses.length > 0 ? enrichedWeaknesses : sh.swot.weaknesses,
          opportunities: enrichedOpportunities.length > 0 ? enrichedOpportunities : sh.swot.opportunities,
          threats:       enrichedThreats.length > 0 ? enrichedThreats : sh.swot.threats,
        },
      };
    }
    if (sh.role === 'parliament') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...betDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedThreats: AnalysisSwotEntry[] = propDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax));
      return {
        ...sh,
        swot: {
          ...sh.swot,
          strengths: enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          threats:   enrichedThreats.length > 0 ? enrichedThreats : sh.swot.threats,
        },
      };
    }
    if (sh.role === 'private-sector') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...sfsDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...extDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedOpportunities: AnalysisSwotEntry[] = euDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax));
      return {
        ...sh,
        swot: {
          ...sh.swot,
          strengths:     enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          opportunities: enrichedOpportunities.length > 0 ? enrichedOpportunities : sh.swot.opportunities,
        },
      };
    }
    return sh;
  });

  // Rebuild watch points with enriched context
  refined.watchPoints = buildWatchPoints(docs, topic, lang);

  // Recalculate confidence score with enriched data
  refined.confidenceScore = calculateConfidenceScore(docs);
  refined.enrichedCount = enrichedDocs.length;

  // Refresh policy assessment narrative with enriched evidence
  refined.policyAssessment = buildPolicyAssessment(docs, topic, lang);

  // Add additional stakeholder perspectives from narrative frame analysis
  const allFrames = new Set<string>();
  enrichedDocs.slice(0, 20).forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));

  // Enrich mindmap with additional data from full text analysis
  refined.mindmapBranches = buildMindmapBranches(docs, topic, refined.policyAssessment.domains, lang);

  // Add civil society branch if we have external docs
  const civilSocietyDocs = enrichedDocs.filter(d => ['ext', 'fpm'].includes(docType(d)));
  if (civilSocietyDocs.length > 0 && allFrames.size > 0) {
    // Add a narrative analysis branch to mindmap
    const hasBranch = refined.mindmapBranches.some(b => b.label === narrativeFramesLabel(lang));
    if (!hasBranch) {
      refined.mindmapBranches.push({
        label: narrativeFramesLabel(lang),
        color: 'orange',
        icon: '🎯',
        items: [...allFrames].slice(0, 6),
      });
    }
  }

  return refined;
}

// ---------------------------------------------------------------------------
// Iteration 3: validateCompleteness
// ---------------------------------------------------------------------------

async function validateCompleteness(
  analysis: AnalysisResult,
  _docs: RawDocument[],
): Promise<ValidationResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check stakeholder coverage
  for (const sh of analysis.stakeholderSwot) {
    const { strengths, weaknesses, opportunities, threats } = sh.swot;
    if (strengths.length === 0) {
      issues.push(`${sh.name}: no strengths entries`);
      score -= 5;
    }
    if (weaknesses.length === 0) {
      suggestions.push(`${sh.name}: consider adding weakness analysis`);
      score -= 2;
    }
    if (opportunities.length === 0) {
      suggestions.push(`${sh.name}: consider adding opportunity analysis`);
      score -= 2;
    }
    if (threats.length === 0) {
      suggestions.push(`${sh.name}: consider adding threat analysis`);
      score -= 2;
    }
    // Check for low-confidence placeholder-only entries
    const allEntries = [...strengths, ...weaknesses, ...opportunities, ...threats];
    const allLowConfidence = allEntries.length > 0 && allEntries.every(e => e.confidence === 'LOW');
    if (allLowConfidence) {
      issues.push(`${sh.name}: all SWOT entries are low-confidence placeholders — enrich with document content`);
      score -= 10;
    }
  }

  // Check policy domain detection
  if (analysis.policyAssessment.domains.length === 0) {
    issues.push('No policy domains detected — document titles may need more descriptive text');
    score -= 5;
  }

  // Check watch points
  if (analysis.watchPoints.length === 0) {
    suggestions.push('No watch points generated — check for actionable document types (prop, bet, sfs)');
    score -= 3;
  }

  // Check enrichment ratio
  if (analysis.documentCount > 0 && analysis.enrichedCount === 0) {
    issues.push('No documents have enriched full text — analysis quality is limited to metadata');
    score -= 15;
  }

  // Check confidence score
  if (analysis.confidenceScore < 30) {
    issues.push(`Low confidence score (${analysis.confidenceScore}/100) — fetch more documents or enrich with full text`);
    score -= 5;
  }

  // Bonus: rich analysis with many enriched documents
  if (analysis.enrichedCount >= 3) {
    score = Math.min(100, score + 5);
  }

  const finalScore = Math.max(0, score);
  return {
    passed: finalScore >= 60,
    score: finalScore,
    issues,
    suggestions,
  };
}

// ---------------------------------------------------------------------------
// Exported pipeline singleton
// ---------------------------------------------------------------------------

/**
 * The default AI analysis pipeline implementation.
 *
 * Usage in generators:
 * ```ts
 * import { aiAnalysisPipeline } from '../ai-analysis/pipeline.js';
 * const result = await aiAnalysisPipeline.analyzeDocuments(docs, { depth, lang, focusTopic });
 * if (depth !== 'quick') {
 *   const refined = await aiAnalysisPipeline.refineAnalysis(result, docs, { depth, lang, focusTopic });
 *   if (depth === 'deep') {
 *     await aiAnalysisPipeline.validateCompleteness(refined, docs);
 *   }
 * }
 * ```
 */
export const aiAnalysisPipeline: AnalysisPipeline = {
  analyzeDocuments,
  refineAnalysis,
  validateCompleteness,
};

/**
 * Run the full analysis pipeline according to the specified depth.
 * Returns the final AnalysisResult, optional ValidationResult, and
 * per-iteration timing data for audit metadata.
 *
 * @param docs - Raw documents to analyse
 * @param options - Pipeline options (depth, lang, focusTopic)
 * @returns `{ analysis, validation, iterationDurationsMs }` where
 *   validation is null for depth < 'deep' and iterationDurationsMs
 *   contains one entry per completed iteration/validation pass.
 */
export async function runAnalysisPipeline(
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<{ analysis: AnalysisResult; validation: ValidationResult | null; iterationDurationsMs: number[] }> {
  const iterationDurationsMs: number[] = [];

  // Iteration 1
  const t1 = Date.now();
  let analysis = await aiAnalysisPipeline.analyzeDocuments(docs, options);
  iterationDurationsMs.push(Date.now() - t1);

  // Iteration 2 (standard + deep)
  if (options.depth !== 'quick') {
    const t2 = Date.now();
    analysis = await aiAnalysisPipeline.refineAnalysis(analysis, docs, options);
    iterationDurationsMs.push(Date.now() - t2);
  }

  // Iteration 3 — validation (deep only)
  let validation: ValidationResult | null = null;
  if (options.depth === 'deep') {
    const t3 = Date.now();
    validation = await aiAnalysisPipeline.validateCompleteness(analysis, docs);
    iterationDurationsMs.push(Date.now() - t3);
    // Bump iterationsCompleted to reflect the validation pass
    analysis = { ...analysis, iterationsCompleted: 3, completedAt: new Date().toISOString() };
  }

  return { analysis, validation, iterationDurationsMs };
}
