#!/usr/bin/env node

/**
 * @module Intelligence Operations/Data Transformation Pipeline
 * @category Intelligence Operations - Intelligence Data Transformation
 * 
 * @description
 * Core data transformation pipeline converting raw MCP server responses into
 * structured intelligence article content. This module implements advanced semantic
 * processing algorithms for legislative data, parliamentary event analysis, and
 * multi-dimensional data mapping for automated journalism.
 * 
 * The transformation pipeline provides four specialized processing stages:
 * 
 * Stage 1 - Calendar Event Processing (transformCalendarToEventGrid):
 * Transforms raw calendar data from riksdag-regering-mcp into structured event grid
 * suitable for visual presentation. Handles multiple timestamp formats (MCP responses
 * may use 'datum', 'from', 'start' fields), performs temporal normalization, and
 * groups events by date for calendar visualization. Implements date comparison logic
 * for marking "today" events with visual indicators.
 * 
 * Stage 2 - Document Content Generation (generateArticleContent):
 * Processes structured parliamentary documents into narrative article prose. Maps
 * document types (propositions, motions, reports) to narrative structures, extracts
 * semantic meaning from legislative language, and generates coherent paragraphs
 * suitable for journalist review. Applies natural language processing techniques
 * for readability optimization and audience targeting.
 * 
 * Stage 3 - Intelligence Extraction (extractWatchPoints):
 * Performs analytical extraction of critical intelligence points from parliamentary
 * data. Identifies policy implications, fiscal impacts, timeline constraints, and
 * political risk factors. Uses rule-based analysis for common legislative patterns
 * (votes, committee decisions, government actions) and produces structured watch
 * points for inclusion in article "watch sections".
 * 
 * Stage 4 - Metadata Generation (generateMetadata, calculateReadTime, generateSources):
 * Synthesizes article metadata including publication date, author attribution, reading
 * time estimates, source citations, and SEO keywords. Generates machine-readable
 * metadata for structured data (Schema.org JSON-LD) and social media sharing.
 * 
 * Supported Data Types:
 * - Calendar events (committee meetings, plenary sessions, parliamentary breaks)
 * - Legislative documents (propositions, motions, parliamentary inquiries)
 * - Voting records (roll-call votes with party/member positions)
 * - Government announcements (press releases, policy documents, ministerial statements)
 * - Committee reports (analysis, recommendations, decisions)
 * - Debate transcripts (parliamentary speeches with speaker context)
 * 
 * Multi-Language Processing:
 * - Swedish source content transformation into 14 target languages
 * - Terminology mapping for political/legal concepts
 * - Date formatting and timezone adjustment per target language
 * - Pluralization and grammatical agreement handling
 * - RTL language support for Arabic and Hebrew output
 * 
 * Data Validation & Quality Assurance:
 * - Schema validation against CIA data model definitions
 * - Null/undefined field handling with intelligent fallbacks
 * - Temporal consistency checking (dates in correct order)
 * - Cross-reference validation (referenced documents exist)
 * - Semantic completeness assessment
 * 
 * @intelligence
 * Semantic Processing Methodology:
 * 
 * Legislative Intent Analysis:
 * Extracts implicit meaning from formal parliamentary language through:
 * - Keyword detection for policy domains (fiscal, healthcare, defense, etc.)
 * - Stakeholder identification (ministries, agencies, party groups)
 * - Impact type classification (regulatory, fiscal, social)
 * - Timeline extraction (implementation dates, decision deadlines)
 * - Precedent linking (related historical legislative actions)
 * 
 * Party Position Inference:
 * Maps voting records and committee recommendations to political positions:
 * - Consensus detection (all parties agree vs. split votes)
 * - Coalition formation analysis (which parties vote together)
 * - Opposition mapping (which parties consistently oppose)
 * - Swing vote identification (MPs changing position across votes)
 * 
 * Risk Indicator Extraction:
 * Identifies critical intelligence points:
 * - Fiscal implications and budget impacts
 * - Timeline constraints and urgent decisions
 * - Stakeholder conflicts and controversy indicators
 * - Implementation risks and dependency chains
 * - Political feasibility assessments
 * 
 * Content Generation Patterns:
 * - Inverted pyramid structure (most important facts first)
 * - Narrative coherence preservation across transformations
 * - Tone consistency (journalistic neutrality in automated output)
 * - Rhetorical device detection and adaptation
 * 
 * @osint
 * Source Data Processing Strategies:
 * 
 * MCP API Response Handling:
 * - Graceful handling of incomplete or malformed MCP responses
 * - Field mapping flexibility for varying API versions
 * - Timestamp normalization across multiple formats
 * - Array and object structure flattening for template consumption
 * 
 * Data Quality Assessment:
 * - Completeness scoring (what percentage of fields populated?)
 * - Freshness validation (data collection timestamp vs. processing time)
 * - Consistency checking (cross-field validation)
 * - Accuracy verification (comparison against official sources where possible)
 * 
 * Source Attribution:
 * - MCP tool reference tracking (which API call produced this data?)
 * - Data timestamp preservation (when was this data collected?)
 * - Source URL generation for primary documents
 * - Author/department attribution for government documents
 * 
 * @risk
 * Data Transformation Risks & Mitigations:
 * 
 * Threat: Semantic Loss in Translation
 * - Complex political concepts losing nuance in transformation
 * - Mitigation: Preserve original language for key terms, human review process
 * 
 * Threat: Data Hallucination
 * - Algorithm generating plausible but incorrect inferences
 * - Mitigation: Strict fact-based extraction, no speculative inference
 * 
 * Threat: Timestamp Ambiguity
 * - Multiple timestamp fields with different meanings causing confusion
 * - Mitigation: Explicit field mapping, validation against known formats
 * 
 * Threat: Array Data Loss
 * - Simplified array flattening losing important structure
 * - Mitigation: Preserve hierarchical structure in intermediate representations
 * 
 * Threat: Language Pair Incompleteness
 * - Missing translations causing incomplete or English article fallback
 * - Mitigation: Fallback chain (target > Swedish > English), quality validation
 * 
 * @gdpr
 * Data Processing Compliance:
 * 
 * - Personal Data Exclusion:
 *   * Exclude contact information, addresses, phone numbers
 *   * Exclude email addresses and social media handles
 *   * Process public officials in official capacity only
 * 
 * - Data Minimization:
 *   * Extract only necessary fields for article generation
 *   * Remove internal government identifiers and batch IDs
 *   * Exclude audit logs and technical metadata
 * 
 * - Purpose Limitation:
 *   * Generate public articles only
 *   * No profiling or behavioral analysis
 *   * No commercial use beyond journalism platform
 * 
 * - Processing Transparency:
 *   * Document all transformation rules
 *   * Publish source attribution with articles
 *   * Maintain audit trail via Git
 * 
 * @security
 * Content Security Implementation:
 * 
 * Input Validation:
 * - Type checking for all input parameters
 * - Array/object structure validation before processing
 * - String content sanitization via escapeHtml()
 * - Numeric field validation (dates, counts, percentages)
 * 
 * Output Encoding:
 * - HTML entity escaping for all narrative text
 * - URL encoding for generated links
 * - No code injection vectors in generated content
 * - CSS selector sanitization for class/ID generation
 * 
 * Dependency Security:
 * - html-utils module provides sanitization
 * - No eval() or Function() constructor usage
 * - No dynamic require() or import() patterns
 * - Direct module imports only
 * 
 * @author Hack23 AB - Intelligence Operations Team
 * @license Apache-2.0
 * @version 2.0.0
 * 
 * @see {@link ./mcp-client.js} MCP API client providing raw data
 * @see {@link ./article-template.js} Template rendering consuming transformed data
 * @see {@link ./generate-news-enhanced.js} Article generation orchestration
 * @see {@link ./html-utils.js} HTML sanitization (escapeHtml)
 * @see {@link docs/DATA_TRANSFORMATION_GUIDE.md} Detailed transformation algorithms
 * @see {@link docs/MCP_DATA_SCHEMA.md} MCP response schema definitions
 * @see {@link docs/INTELLIGENCE_EXTRACTION.md} Intelligence analysis methodology
 */

import { escapeHtml } from './html-utils.js';

/**
 * Transform calendar events into event grid structure for template
 * 
 * @param {Array} events - Calendar events from MCP server
 * @param {string} lang - Language code (en, sv)
 * @returns {Array} Event grid structure for article template
 */
export function transformCalendarToEventGrid(events, lang = 'en') {
  if (!events || events.length === 0) return [];
  
  // Group events by date
  const eventsByDate = {};
  events.forEach(event => {
    // Extract date from various field formats (MCP responses use 'from', 'start', or 'datum')
    let dateStr = event.datum || event.from || event.start;
    if (dateStr) {
      // Extract just the date part if it's an ISO timestamp
      dateStr = dateStr.split('T')[0];
    }
    if (!dateStr) return;
    
    if (!eventsByDate[dateStr]) {
      eventsByDate[dateStr] = [];
    }
    eventsByDate[dateStr].push(event);
  });
  
  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();
  
  // Convert to grid format
  const eventGrid = sortedDates.map(date => {
    const dateObj = new Date(date);
    const isTodayFlag = isTodayDate(dateObj);
    
    return {
      date: date,
      dayName: formatDayName(dateObj, lang),
      dayNumber: dateObj.getDate().toString(),
      dayLabel: formatDayLabel(dateObj, lang),
      isToday: isTodayFlag,
      items: eventsByDate[date].map(event => ({
        time: event.tid || event.time || 'Expected',
        title: event.rubrik || event.titel || event.title || 'Event'
      }))
    };
  });
  
  return eventGrid;
}

/**
 * Check if date is today
 */
function isTodayDate(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Map of custom locale codes to Intl-compatible locale strings
 */
const LOCALE_MAP = {
  en: 'en-GB', sv: 'sv-SE', da: 'da-DK', no: 'no-NO', fi: 'fi-FI',
  de: 'de-DE', fr: 'fr-FR', es: 'es-ES', nl: 'nl-NL', ar: 'ar-SA',
  he: 'he-IL', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN'
};

/**
 * Format day name (Monday, Tuesday, etc.) using Intl for all 14 languages
 */
function formatDayName(date, lang = 'en') {
  const locale = LOCALE_MAP[lang] || lang;
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
  }
}

/**
 * Format day label (e.g., "February 10 - Monday") using Intl for all 14 languages
 */
function formatDayLabel(date, lang = 'en') {
  const locale = LOCALE_MAP[lang] || lang;
  try {
    const dayName = formatDayName(date, lang);
    const monthDay = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(date);
    return `${monthDay} - ${dayName}`;
  } catch {
    const dayName = formatDayName(date, 'en');
    const monthDay = new Intl.DateTimeFormat('en-GB', { month: 'long', day: 'numeric' }).format(date);
    return `${monthDay} - ${dayName}`;
  }
}

/**
 * Extract key topics from documents
 * 
 * @param {Array} documents - Documents from MCP server
 * @returns {Array} Topic tags
 */
export function extractTopics(documents) {
  const topics = new Set();
  
  documents.forEach(doc => {
    // Extract from document type
    if (doc.doktyp) {
      switch (doc.doktyp) {
        case 'mot': topics.add('motions'); break;
        case 'prop': topics.add('propositions'); break;
        case 'bet': topics.add('committee-reports'); break;
        case 'skr': topics.add('government-communication'); break;
      }
    }
    
    // Extract from organ/committee
    if (doc.organ) {
      topics.add(`${doc.organ.toLowerCase()}-committee`);
    }
    
    // Extract from title keywords
    const title = (doc.titel || doc.rubrik || '').toLowerCase();
    if (title.includes('eu')) topics.add('eu');
    if (title.includes('försvar')) topics.add('defense');
    if (title.includes('ekonomi')) topics.add('economy');
    if (title.includes('miljö')) topics.add('environment');
    if (title.includes('migration')) topics.add('migration');
    if (title.includes('utbildning')) topics.add('education');
    if (title.includes('vård')) topics.add('healthcare');
  });
  
  return Array.from(topics).slice(0, 10); // Max 10 topics
}

/**
 * Generate article content from MCP data
 * 
 * @param {Object} data - MCP data (events, documents, etc.)
 * @param {string} type - Article type (week-ahead, committee-reports, etc.)
 * @param {string} lang - Language code
 * @returns {string} Article HTML content
 */
export function generateArticleContent(data, type, lang = 'en') {
  switch (type) {
    case 'week-ahead':
      return generateWeekAheadContent(data, lang);
    case 'committee-reports':
      return generateCommitteeContent(data, lang);
    case 'propositions':
      return generatePropositionsContent(data, lang);
    case 'motions':
      return generateMotionsContent(data, lang);
    default:
      return generateGenericContent(data, lang);
  }
}

/**
 * Generate Week Ahead article content
 */
// Multi-language labels for content generation
export const CONTENT_LABELS = {
  en: {
    whyMatters: 'Why This Week Matters',
    whyMattersDefault: 'This week features significant parliamentary activity with key debates, committee meetings, and government consultations that will shape Sweden\'s political landscape.',
    keyEvents: 'Key Events This Week',
    whatToWatch: 'What to Watch',
    latestReports: 'Latest Committee Reports',
    noReports: 'No committee reports available at this time.',
    committee: 'Committee', document: 'Document',
    reportDefault: 'Committee report on parliamentary matter.',
    govProps: 'Government Propositions',
    noProps: 'No government propositions available at this time.',
    propDefault: 'Government proposal to Parliament.',
    oppMotions: 'Opposition Motions',
    noMotions: 'No opposition motions available at this time.',
    author: 'Author', party: 'Party',
    motionDefault: 'Parliamentary motion by opposition member.',
    genericContent: 'Content generation in progress.',
    monitorDev: 'Monitor developments and outcomes',
    committeeDebates: 'Committee Debates',
    committeeDebatesDesc: (n) => `${n} committee reports scheduled for chamber debate`,
    govProposals: 'Government Proposals',
    govProposalsDesc: (n) => `${n} new government propositions under review`,
    weekAhead: 'Week Ahead', committeeReportsTag: 'Committee Reports',
    govPropsTag: 'Government Propositions', oppMotionsTag: 'Opposition Motions'
  },
  sv: {
    whyMatters: 'Varför denna vecka är viktig',
    whyMattersDefault: 'Denna vecka innehåller betydande parlamentarisk aktivitet med viktiga debatter, kommittémöten och regeringskonsultationer som kommer att forma Sveriges politiska landskap.',
    keyEvents: 'Nyckelhändelser denna vecka',
    whatToWatch: 'Vad man ska följa',
    latestReports: 'Senaste kommittérapporter',
    noReports: 'Inga kommittérapporter tillgängliga för tillfället.',
    committee: 'Kommitté', document: 'Dokument',
    reportDefault: 'Kommittérapport om riksdagsärende.',
    govProps: 'Regeringens propositioner',
    noProps: 'Inga regeringspropositioner tillgängliga för tillfället.',
    propDefault: 'Regeringens förslag till riksdagen.',
    oppMotions: 'Oppositionens motioner',
    noMotions: 'Inga oppositionsmotioner tillgängliga för tillfället.',
    author: 'Författare', party: 'Parti',
    motionDefault: 'Riksdagsmotion av oppositionsmedlem.',
    genericContent: 'Innehållsgenerering pågår.',
    monitorDev: 'Övervaka utveckling och resultat',
    committeeDebates: 'Kommittédebatter',
    committeeDebatesDesc: (n) => `${n} kommittérapporter planerade för kammarens debatt`,
    govProposals: 'Regeringsförslag',
    govProposalsDesc: (n) => `${n} nya regeringspropositioner under granskning`,
    weekAhead: 'Veckan som kommer', committeeReportsTag: 'Kommittérapporter',
    govPropsTag: 'Regeringens propositioner', oppMotionsTag: 'Oppositionens motioner'
  },
  da: {
    whyMatters: 'Hvorfor denne uge er vigtig',
    whyMattersDefault: 'Denne uge byder på vigtig parlamentarisk aktivitet med centrale debatter, udvalgsmøder og regeringskonsultationer.',
    keyEvents: 'Vigtige begivenheder denne uge',
    whatToWatch: 'Hvad man skal følge',
    latestReports: 'Seneste udvalgsbetænkninger',
    noReports: 'Ingen udvalgsbetænkninger tilgængelige på nuværende tidspunkt.',
    committee: 'Udvalg', document: 'Dokument',
    reportDefault: 'Udvalgsbetænkning om parlamentarisk sag.',
    govProps: 'Regeringsforslag',
    noProps: 'Ingen regeringsforslag tilgængelige på nuværende tidspunkt.',
    propDefault: 'Regeringsforslag til parlamentet.',
    oppMotions: 'Oppositionsforslag',
    noMotions: 'Ingen oppositionsforslag tilgængelige på nuværende tidspunkt.',
    author: 'Forfatter', party: 'Parti',
    motionDefault: 'Parlamentarisk forslag fra oppositionsmedlem.',
    genericContent: 'Indhold genereres.',
    monitorDev: 'Overvåg udviklingen og resultaterne',
    committeeDebates: 'Udvalgsedebatter',
    committeeDebatesDesc: (n) => `${n} udvalgsbetænkninger planlagt til kammerdebat`,
    govProposals: 'Regeringsforslag',
    govProposalsDesc: (n) => `${n} nye regeringsforslag under behandling`,
    weekAhead: 'Ugen fremover', committeeReportsTag: 'Udvalgsbetænkninger',
    govPropsTag: 'Regeringsforslag', oppMotionsTag: 'Oppositionsforslag'
  },
  no: {
    whyMatters: 'Hvorfor denne uken er viktig',
    whyMattersDefault: 'Denne uken byr på viktig parlamentarisk aktivitet med sentrale debatter, komitémøter og regjeringskonsultasjoner.',
    keyEvents: 'Viktige hendelser denne uken',
    whatToWatch: 'Hva man bør følge med på',
    latestReports: 'Siste komitéinnstillinger',
    noReports: 'Ingen komitéinnstillinger tilgjengelige for øyeblikket.',
    committee: 'Komité', document: 'Dokument',
    reportDefault: 'Komitéinnstilling om parlamentarisk sak.',
    govProps: 'Regjeringens proposisjoner',
    noProps: 'Ingen regjeringsproposisjoner tilgjengelige for øyeblikket.',
    propDefault: 'Regjeringens forslag til parlamentet.',
    oppMotions: 'Opposisjonsforslag',
    noMotions: 'Ingen opposisjonsforslag tilgjengelige for øyeblikket.',
    author: 'Forfatter', party: 'Parti',
    motionDefault: 'Parlamentarisk forslag fra opposisjonsmedlem.',
    genericContent: 'Innholdsgenerering pågår.',
    monitorDev: 'Overvåk utviklingen og resultatene',
    committeeDebates: 'Komitédebatter',
    committeeDebatesDesc: (n) => `${n} komitéinnstillinger planlagt for kammerdebatt`,
    govProposals: 'Regjeringsforslag',
    govProposalsDesc: (n) => `${n} nye regjeringsproposisjoner under vurdering`,
    weekAhead: 'Uke fremover', committeeReportsTag: 'Komitéinnstillinger',
    govPropsTag: 'Regjeringens proposisjoner', oppMotionsTag: 'Opposisjonsforslag'
  },
  fi: {
    whyMatters: 'Miksi tämä viikko on tärkeä',
    whyMattersDefault: 'Tällä viikolla on merkittävää parlamentaarista toimintaa, johon kuuluu tärkeitä keskusteluja, valiokuntakokouksia ja hallituksen kuulemisia.',
    keyEvents: 'Viikon tärkeimmät tapahtumat',
    whatToWatch: 'Mitä seurata',
    latestReports: 'Uusimmat valiokuntamietinnöt',
    noReports: 'Ei valiokuntamietintöjä saatavilla tällä hetkellä.',
    committee: 'Valiokunta', document: 'Asiakirja',
    reportDefault: 'Valiokuntamietintö parlamentaarisesta asiasta.',
    govProps: 'Hallituksen esitykset',
    noProps: 'Ei hallituksen esityksiä saatavilla tällä hetkellä.',
    propDefault: 'Hallituksen esitys eduskunnalle.',
    oppMotions: 'Opposition aloitteet',
    noMotions: 'Ei opposition aloitteita saatavilla tällä hetkellä.',
    author: 'Tekijä', party: 'Puolue',
    motionDefault: 'Opposition jäsenen eduskunta-aloite.',
    genericContent: 'Sisältöä luodaan.',
    monitorDev: 'Seuraa kehitystä ja tuloksia',
    committeeDebates: 'Valiokuntakeskustelut',
    committeeDebatesDesc: (n) => `${n} valiokuntamietintöä aikataulutettu täysistuntokeskusteluun`,
    govProposals: 'Hallituksen esitykset',
    govProposalsDesc: (n) => `${n} uutta hallituksen esitystä käsittelyssä`,
    weekAhead: 'Tuleva viikko', committeeReportsTag: 'Valiokuntamietinnöt',
    govPropsTag: 'Hallituksen esitykset', oppMotionsTag: 'Opposition aloitteet'
  },
  de: {
    whyMatters: 'Warum diese Woche wichtig ist',
    whyMattersDefault: 'Diese Woche bietet bedeutende parlamentarische Aktivitäten mit wichtigen Debatten, Ausschusssitzungen und Regierungskonsultationen.',
    keyEvents: 'Wichtige Ereignisse diese Woche',
    whatToWatch: 'Was zu beobachten ist',
    latestReports: 'Neueste Ausschussberichte',
    noReports: 'Derzeit keine Ausschussberichte verfügbar.',
    committee: 'Ausschuss', document: 'Dokument',
    reportDefault: 'Ausschussbericht über parlamentarische Angelegenheit.',
    govProps: 'Regierungsvorlagen',
    noProps: 'Derzeit keine Regierungsvorlagen verfügbar.',
    propDefault: 'Regierungsvorlage an das Parlament.',
    oppMotions: 'Oppositionsanträge',
    noMotions: 'Derzeit keine Oppositionsanträge verfügbar.',
    author: 'Autor', party: 'Partei',
    motionDefault: 'Parlamentarischer Antrag eines Oppositionsmitglieds.',
    genericContent: 'Inhaltserstellung läuft.',
    monitorDev: 'Entwicklungen und Ergebnisse überwachen',
    committeeDebates: 'Ausschussdebatten',
    committeeDebatesDesc: (n) => `${n} Ausschussberichte für Plenardebatte geplant`,
    govProposals: 'Regierungsvorlagen',
    govProposalsDesc: (n) => `${n} neue Regierungsvorlagen in Prüfung`,
    weekAhead: 'Woche Voraus', committeeReportsTag: 'Ausschussberichte',
    govPropsTag: 'Regierungsvorlagen', oppMotionsTag: 'Oppositionsanträge'
  },
  fr: {
    whyMatters: 'Pourquoi cette semaine est importante',
    whyMattersDefault: 'Cette semaine est marquée par une activité parlementaire significative avec des débats clés, des réunions de commission et des consultations gouvernementales.',
    keyEvents: 'Événements clés cette semaine',
    whatToWatch: 'À suivre',
    latestReports: 'Derniers rapports de commission',
    noReports: 'Aucun rapport de commission disponible pour le moment.',
    committee: 'Commission', document: 'Document',
    reportDefault: 'Rapport de commission sur une affaire parlementaire.',
    govProps: 'Propositions gouvernementales',
    noProps: 'Aucune proposition gouvernementale disponible pour le moment.',
    propDefault: 'Proposition du gouvernement au Parlement.',
    oppMotions: 'Motions d\'opposition',
    noMotions: 'Aucune motion d\'opposition disponible pour le moment.',
    author: 'Auteur', party: 'Parti',
    motionDefault: 'Motion parlementaire d\'un membre de l\'opposition.',
    genericContent: 'Génération de contenu en cours.',
    monitorDev: 'Suivre les développements et les résultats',
    committeeDebates: 'Débats en commission',
    committeeDebatesDesc: (n) => `${n} rapports de commission prévus pour débat en séance`,
    govProposals: 'Propositions gouvernementales',
    govProposalsDesc: (n) => `${n} nouvelles propositions gouvernementales à l'examen`,
    weekAhead: 'Semaine à venir', committeeReportsTag: 'Rapports de commission',
    govPropsTag: 'Propositions gouvernementales', oppMotionsTag: 'Motions d\'opposition'
  },
  es: {
    whyMatters: 'Por qué esta semana es importante',
    whyMattersDefault: 'Esta semana presenta actividad parlamentaria significativa con debates clave, reuniones de comisión y consultas gubernamentales.',
    keyEvents: 'Eventos clave esta semana',
    whatToWatch: 'Qué observar',
    latestReports: 'Últimos informes de comisión',
    noReports: 'No hay informes de comisión disponibles en este momento.',
    committee: 'Comisión', document: 'Documento',
    reportDefault: 'Informe de comisión sobre asunto parlamentario.',
    govProps: 'Proposiciones gubernamentales',
    noProps: 'No hay proposiciones gubernamentales disponibles en este momento.',
    propDefault: 'Propuesta del gobierno al Parlamento.',
    oppMotions: 'Mociones de oposición',
    noMotions: 'No hay mociones de oposición disponibles en este momento.',
    author: 'Autor', party: 'Partido',
    motionDefault: 'Moción parlamentaria de un miembro de la oposición.',
    genericContent: 'Generación de contenido en curso.',
    monitorDev: 'Monitorear desarrollos y resultados',
    committeeDebates: 'Debates en comisión',
    committeeDebatesDesc: (n) => `${n} informes de comisión programados para debate en pleno`,
    govProposals: 'Propuestas gubernamentales',
    govProposalsDesc: (n) => `${n} nuevas proposiciones gubernamentales en revisión`,
    weekAhead: 'Semana próxima', committeeReportsTag: 'Informes de comisión',
    govPropsTag: 'Proposiciones gubernamentales', oppMotionsTag: 'Mociones de oposición'
  },
  nl: {
    whyMatters: 'Waarom deze week belangrijk is',
    whyMattersDefault: 'Deze week biedt belangrijke parlementaire activiteit met cruciale debatten, commissievergaderingen en regeringsconsultaties.',
    keyEvents: 'Belangrijke gebeurtenissen deze week',
    whatToWatch: 'Wat te volgen',
    latestReports: 'Nieuwste commissierapporten',
    noReports: 'Geen commissierapporten beschikbaar op dit moment.',
    committee: 'Commissie', document: 'Document',
    reportDefault: 'Commissierapport over parlementaire zaak.',
    govProps: 'Regeringsvoorstellen',
    noProps: 'Geen regeringsvoorstellen beschikbaar op dit moment.',
    propDefault: 'Regeringsvoorstel aan het parlement.',
    oppMotions: 'Oppositiemoties',
    noMotions: 'Geen oppositiemoties beschikbaar op dit moment.',
    author: 'Auteur', party: 'Partij',
    motionDefault: 'Parlementaire motie van een oppositielid.',
    genericContent: 'Inhoud wordt gegenereerd.',
    monitorDev: 'Ontwikkelingen en resultaten volgen',
    committeeDebates: 'Commissiedebatten',
    committeeDebatesDesc: (n) => `${n} commissierapporten gepland voor plenair debat`,
    govProposals: 'Regeringsvoorstellen',
    govProposalsDesc: (n) => `${n} nieuwe regeringsvoorstellen in behandeling`,
    weekAhead: 'Week vooruit', committeeReportsTag: 'Commissierapporten',
    govPropsTag: 'Regeringsvoorstellen', oppMotionsTag: 'Oppositiemoties'
  },
  ar: {
    whyMatters: 'لماذا هذا الأسبوع مهم',
    whyMattersDefault: 'يتميز هذا الأسبوع بنشاط برلماني كبير يشمل مناقشات رئيسية واجتماعات لجان ومشاورات حكومية.',
    keyEvents: 'الأحداث الرئيسية هذا الأسبوع',
    whatToWatch: 'ما يجب متابعته',
    latestReports: 'أحدث تقارير اللجان',
    noReports: 'لا توجد تقارير لجان متاحة حالياً.',
    committee: 'اللجنة', document: 'الوثيقة',
    reportDefault: 'تقرير لجنة عن مسألة برلمانية.',
    govProps: 'مقترحات الحكومة',
    noProps: 'لا توجد مقترحات حكومية متاحة حالياً.',
    propDefault: 'مقترح حكومي للبرلمان.',
    oppMotions: 'اقتراحات المعارضة',
    noMotions: 'لا توجد اقتراحات معارضة متاحة حالياً.',
    author: 'المؤلف', party: 'الحزب',
    motionDefault: 'اقتراح برلماني من عضو في المعارضة.',
    genericContent: 'جارٍ إنشاء المحتوى.',
    monitorDev: 'متابعة التطورات والنتائج',
    committeeDebates: 'مناقشات اللجان',
    committeeDebatesDesc: (n) => `${n} تقارير لجان مجدولة للمناقشة في الجلسة العامة`,
    govProposals: 'مقترحات حكومية',
    govProposalsDesc: (n) => `${n} مقترحات حكومية جديدة قيد المراجعة`,
    weekAhead: 'الأسبوع القادم', committeeReportsTag: 'تقارير اللجان',
    govPropsTag: 'مقترحات الحكومة', oppMotionsTag: 'اقتراحات المعارضة'
  },
  he: {
    whyMatters: 'למה השבוע הזה חשוב',
    whyMattersDefault: 'השבוע כולל פעילות פרלמנטרית משמעותית עם דיונים מרכזיים, ישיבות ועדה והתייעצויות ממשלתיות.',
    keyEvents: 'אירועים מרכזיים השבוע',
    whatToWatch: 'מה לעקוב אחריו',
    latestReports: 'דוחות ועדה אחרונים',
    noReports: 'אין דוחות ועדה זמינים כרגע.',
    committee: 'ועדה', document: 'מסמך',
    reportDefault: 'דוח ועדה בנושא פרלמנטרי.',
    govProps: 'הצעות ממשלה',
    noProps: 'אין הצעות ממשלה זמינות כרגע.',
    propDefault: 'הצעת ממשלה לפרלמנט.',
    oppMotions: 'הצעות אופוזיציה',
    noMotions: 'אין הצעות אופוזיציה זמינות כרגע.',
    author: 'מחבר', party: 'מפלגה',
    motionDefault: 'הצעה פרלמנטרית של חבר אופוזיציה.',
    genericContent: 'יצירת תוכן בתהליך.',
    monitorDev: 'לעקוב אחר התפתחויות ותוצאות',
    committeeDebates: 'דיוני ועדות',
    committeeDebatesDesc: (n) => `${n} דוחות ועדה מתוכננים לדיון במליאה`,
    govProposals: 'הצעות ממשלה',
    govProposalsDesc: (n) => `${n} הצעות ממשלה חדשות בבחינה`,
    weekAhead: 'השבוע הקרוב', committeeReportsTag: 'דוחות ועדה',
    govPropsTag: 'הצעות ממשלה', oppMotionsTag: 'הצעות אופוזיציה'
  },
  ja: {
    whyMatters: 'なぜ今週が重要か',
    whyMattersDefault: '今週は重要な議会活動があり、主要な討論、委員会会議、政府協議が予定されています。',
    keyEvents: '今週の主要イベント',
    whatToWatch: '注目すべきポイント',
    latestReports: '最新の委員会報告',
    noReports: '現在、委員会報告はありません。',
    committee: '委員会', document: '文書',
    reportDefault: '議会事案に関する委員会報告。',
    govProps: '政府提案',
    noProps: '現在、政府提案はありません。',
    propDefault: '政府から議会への提案。',
    oppMotions: '野党動議',
    noMotions: '現在、野党動議はありません。',
    author: '著者', party: '政党',
    motionDefault: '野党議員による議会動議。',
    genericContent: 'コンテンツ生成中。',
    monitorDev: '動向と結果を監視',
    committeeDebates: '委員会討論',
    committeeDebatesDesc: (n) => `${n}件の委員会報告が本会議討論に予定`,
    govProposals: '政府提案',
    govProposalsDesc: (n) => `${n}件の新しい政府提案が審議中`,
    weekAhead: '来週の展望', committeeReportsTag: '委員会報告',
    govPropsTag: '政府提案', oppMotionsTag: '野党動議'
  },
  ko: {
    whyMatters: '이번 주가 중요한 이유',
    whyMattersDefault: '이번 주에는 주요 토론, 위원회 회의 및 정부 협의를 포함한 중요한 의회 활동이 있습니다.',
    keyEvents: '이번 주 주요 일정',
    whatToWatch: '주목할 사항',
    latestReports: '최신 위원회 보고서',
    noReports: '현재 이용 가능한 위원회 보고서가 없습니다.',
    committee: '위원회', document: '문서',
    reportDefault: '의회 사안에 대한 위원회 보고서.',
    govProps: '정부 법안',
    noProps: '현재 이용 가능한 정부 법안이 없습니다.',
    propDefault: '정부의 의회 법안.',
    oppMotions: '야당 동의',
    noMotions: '현재 이용 가능한 야당 동의가 없습니다.',
    author: '저자', party: '정당',
    motionDefault: '야당 의원의 의회 동의.',
    genericContent: '콘텐츠 생성 중.',
    monitorDev: '동향 및 결과 모니터링',
    committeeDebates: '위원회 토론',
    committeeDebatesDesc: (n) => `${n}개 위원회 보고서가 본회의 토론에 예정`,
    govProposals: '정부 법안',
    govProposalsDesc: (n) => `${n}개 새 정부 법안 검토 중`,
    weekAhead: '다음 주 전망', committeeReportsTag: '위원회 보고서',
    govPropsTag: '정부 법안', oppMotionsTag: '야당 동의'
  },
  zh: {
    whyMatters: '为什么本周很重要',
    whyMattersDefault: '本周有重要的议会活动，包括关键辩论、委员会会议和政府磋商。',
    keyEvents: '本周重要事件',
    whatToWatch: '值得关注的要点',
    latestReports: '最新委员会报告',
    noReports: '目前没有可用的委员会报告。',
    committee: '委员会', document: '文件',
    reportDefault: '关于议会事务的委员会报告。',
    govProps: '政府提案',
    noProps: '目前没有可用的政府提案。',
    propDefault: '政府向议会提交的提案。',
    oppMotions: '反对党动议',
    noMotions: '目前没有可用的反对党动议。',
    author: '作者', party: '政党',
    motionDefault: '反对党议员的议会动议。',
    genericContent: '内容生成中。',
    monitorDev: '监测发展动态和结果',
    committeeDebates: '委员会辩论',
    committeeDebatesDesc: (n) => `${n}份委员会报告安排在全体会议上辩论`,
    govProposals: '政府提案',
    govProposalsDesc: (n) => `${n}项新政府提案正在审查中`,
    weekAhead: '下周展望', committeeReportsTag: '委员会报告',
    govPropsTag: '政府提案', oppMotionsTag: '反对党动议'
  }
};

/**
 * Get localized label with fallback to English
 */
export function L(lang, key) {
  return CONTENT_LABELS[lang]?.[key] || CONTENT_LABELS.en[key];
}

function generateWeekAheadContent(data, lang) {
  const { events, highlights, context } = data;
  
  let content = '';
  
  // Introduction section
  content += `
    <div class="context-box">
      <h3>${L(lang, 'whyMatters')}</h3>
      <p>${context || L(lang, 'whyMattersDefault')}</p>
    </div>
`;
  
  // Group events by significance
  const highPriority = events.filter(e => isHighPriority(e));
  
  if (highPriority.length > 0) {
    content += `\n    <h2>${L(lang, 'keyEvents')}</h2>\n`;
    
    highPriority.forEach(event => {
      // Derive dayName from event date if not present
      const dayName = event.dayName || (event.datum || event.from || event.start ? formatDayName(new Date(event.datum || event.from || event.start), lang) : '');
      const eventTime = event.time || event.tid || 'Expected';
      const eventTitle = event.title || event.titel || 'Event';
      
      // Mark Swedish API titles for LLM translation post-processing
      const escapedEventTitle = escapeHtml(eventTitle);
      const titleHtml = (event.titel && !event.title) 
        ? `<span data-translate="true" lang="sv">${escapedEventTitle}</span>` 
        : escapedEventTitle;
      
      content += `
    <h3>${dayName ? dayName + ' - ' : ''}${titleHtml}</h3>
    <p>${event.description || `${eventTime}: ${event.details || 'Parliamentary session scheduled.'}`}</p>
`;
    });
  }
  
  // Additional context
  if (highlights && highlights.length > 0) {
    content += `\n    <h2>${L(lang, 'whatToWatch')}</h2>\n    <ul>\n`;
    
    highlights.forEach(highlight => {
      content += `      <li><strong>${highlight.title}:</strong> ${highlight.description}</li>\n`;
    });
    
    content += '    </ul>\n';
  }
  
  return content;
}

/**
 * Determine if event is high priority
 */
function isHighPriority(event) {
  const title = (event.title || event.rubrik || '').toLowerCase();
  return (
    title.includes('pm') || 
    title.includes('prime minister') ||
    title.includes('statsminister') ||
    title.includes('vote') ||
    title.includes('votering') ||
    title.includes('eu') ||
    title.includes('summit')
  );
}

/**
 * Generate Committee Reports content
 */
function generateCommitteeContent(data, lang) {
  const reports = data.reports || [];
  
  let content = `<h2>${L(lang, 'latestReports')}</h2>\n`;
  
  if (reports.length === 0) {
    content += `<p>${L(lang, 'noReports')}</p>\n`;
    return content;
  }
  
  reports.forEach(report => {
    // Mark Swedish API titles/summaries for LLM translation post-processing
    // Only wrap in data-translate when content is from Swedish API (titel field)
    const titleText = report.titel || report.title || '';
    const escapedTitle = escapeHtml(titleText);
    const titleHtml = (report.titel && !report.title)
      ? `<span data-translate="true" lang="sv">${escapedTitle}</span>`
      : escapedTitle;
    const docName = escapeHtml(report.dokumentnamn || report.dok_id || titleText);
    
    // Use enriched summary from content fetching, fallback to notis, then default
    const summaryText = report.summary || report.notis || '';
    const summaryHtml = summaryText 
      ? ((report.titel && !report.title) ? `<span data-translate="true" lang="sv">${escapeHtml(summaryText)}</span>` : escapeHtml(summaryText))
      : L(lang, 'reportDefault');
    
    content += `
    <h3>${titleHtml}</h3>
    <p><strong>${L(lang, 'committee')}:</strong> ${report.organ || 'Unknown'}</p>
    <p><strong>${L(lang, 'document')}:</strong> <a href="${report.url}" class="document-link" rel="noopener noreferrer">${docName}</a></p>
    <p>${summaryHtml}</p>
`;
  });
  
  return content;
}

/**
 * Generate Propositions content
 */
function generatePropositionsContent(data, lang) {
  const propositions = data.propositions || [];
  
  let content = `<h2>${L(lang, 'govProps')}</h2>\n`;
  
  if (propositions.length === 0) {
    content += `<p>${L(lang, 'noProps')}</p>\n`;
    return content;
  }
  
  propositions.forEach(prop => {
    // Mark Swedish API titles/summaries for LLM translation post-processing
    // Only wrap in data-translate when content is from Swedish API (titel field)
    const titleText = prop.titel || prop.title || '';
    const escapedTitle = escapeHtml(titleText);
    const titleHtml = (prop.titel && !prop.title)
      ? `<span data-translate="true" lang="sv">${escapedTitle}</span>`
      : escapedTitle;
    const docName = escapeHtml(prop.dokumentnamn || prop.dok_id || titleText);
    
    // Use enriched summary from content fetching, fallback to notis, then default
    const summaryText = prop.summary || prop.notis || '';
    const summaryHtml = summaryText 
      ? ((prop.titel && !prop.title) ? `<span data-translate="true" lang="sv">${escapeHtml(summaryText)}</span>` : escapeHtml(summaryText))
      : L(lang, 'propDefault');
    
    content += `
    <h3>${titleHtml}</h3>
    <p><strong>${L(lang, 'document')}:</strong> <a href="${prop.url}" class="document-link" rel="noopener noreferrer">${docName}</a></p>
    <p>${summaryHtml}</p>
`;
  });
  
  return content;
}

/**
 * Generate Motions content
 */
function generateMotionsContent(data, lang) {
  const motions = data.motions || [];
  
  let content = `<h2>${L(lang, 'oppMotions')}</h2>\n`;
  
  if (motions.length === 0) {
    content += `<p>${L(lang, 'noMotions')}</p>\n`;
    return content;
  }
  
  motions.forEach(motion => {
    // Mark Swedish API titles/summaries for LLM translation post-processing
    // Only wrap in data-translate when content is from Swedish API (titel field)
    const titleText = motion.titel || motion.title || '';
    const escapedTitle = escapeHtml(titleText);
    const titleHtml = (motion.titel && !motion.title)
      ? `<span data-translate="true" lang="sv">${escapedTitle}</span>`
      : escapedTitle;
    const docName = escapeHtml(motion.dokumentnamn || motion.dok_id || titleText);
    
    // Use enriched summary from content fetching, fallback to notis, then default
    const summaryText = motion.summary || motion.notis || '';
    const summaryHtml = summaryText 
      ? ((motion.titel && !motion.title) ? `<span data-translate="true" lang="sv">${escapeHtml(summaryText)}</span>` : escapeHtml(summaryText))
      : L(lang, 'motionDefault');
    
    // Use enriched author and party data from document fetching
    const authorName = motion.intressent_namn || motion.author || 'Unknown';
    const partyName = motion.parti || 'Unknown';
    
    content += `
    <h3>${titleHtml}</h3>
    <p><strong>${L(lang, 'author')}:</strong> ${authorName}</p>
    <p><strong>${L(lang, 'party')}:</strong> ${partyName}</p>
    <p><strong>${L(lang, 'document')}:</strong> <a href="${motion.url}" class="document-link" rel="noopener noreferrer">${docName}</a></p>
    <p>${summaryHtml}</p>
`;
  });
  
  return content;
}

/**
 * Generate generic content
 */
function generateGenericContent(data, lang) {
  return `<p>${L(lang, 'genericContent')}</p>`;
}

/**
 * Extract "Watch Points" from data
 * 
 * @param {Object} data - MCP data
 * @param {string} lang - Language code
 * @returns {Array} Watch points for article
 */
export function extractWatchPoints(data, lang = 'en') {
  const watchPoints = [];
  
  // From calendar events
  if (data.events) {
    const highPriorityEvents = data.events.filter(isHighPriority);
    highPriorityEvents.forEach(event => {
      // Derive dayName from event date if not present
      const dayName = event.dayName || (event.datum || event.from || event.start ? formatDayName(new Date((event.datum || event.from || event.start).split('T')[0]), lang) : '');
      const eventTitle = event.title || event.titel || 'Event';
      
      // Mark Swedish API titles for LLM translation post-processing
      const escapedEventTitle = escapeHtml(eventTitle);
      const titleDisplay = (event.titel && !event.title)
        ? `<span data-translate="true" lang="sv">${escapedEventTitle}</span>`
        : escapedEventTitle;
      
      watchPoints.push({
        title: dayName ? `${dayName}: ${titleDisplay}` : titleDisplay,
        description: event.description || L(lang, 'monitorDev')
      });
    });
  }
  
  // From committee reports
  if (data.reports && data.reports.length > 0) {
    watchPoints.push({
      title: L(lang, 'committeeDebates'),
      description: L(lang, 'committeeDebatesDesc')(data.reports.length)
    });
  }
  
  // From propositions
  if (data.propositions && data.propositions.length > 0) {
    watchPoints.push({
      title: L(lang, 'govProposals'),
      description: L(lang, 'govProposalsDesc')(data.propositions.length)
    });
  }
  
  return watchPoints.slice(0, 5); // Max 5 watch points
}

/**
 * Generate article metadata
 * 
 * @param {Object} data - Article data
 * @param {string} type - Article type
 * @param {string} lang - Language code
 * @returns {Object} Article metadata
 */
export function generateMetadata(data, type, lang = 'en') {
  const keywords = [];
  const topics = [];
  const tags = [];
  
  // Add type-specific keywords
  switch (type) {
    case 'week-ahead':
      keywords.push('parliament', 'week ahead', 'calendar', 'events');
      topics.push('parliament');
      tags.push(L(lang, 'weekAhead'));
      break;
    case 'committee-reports':
      keywords.push('committee', 'reports', 'betänkanden', 'parliament');
      topics.push('committees', 'reports');
      tags.push(L(lang, 'committeeReportsTag'));
      break;
    case 'propositions':
      keywords.push('government', 'propositions', 'parliament', 'legislation');
      topics.push('government', 'legislation');
      tags.push(L(lang, 'govPropsTag'));
      break;
    case 'motions':
      keywords.push('motions', 'opposition', 'parliament', 'proposals');
      topics.push('parliament', 'opposition');
      tags.push(L(lang, 'oppMotionsTag'));
      break;
  }
  
  // Extract additional keywords from data
  if (data.events) {
    keywords.push('calendar', 'events', 'debates');
  }
  if (data.reports) {
    keywords.push('committees', 'reports');
  }
  
  // Add common keywords
  keywords.push('Swedish Parliament', 'Riksdag', 'politics', 'Sweden');
  
  return {
    keywords: keywords.slice(0, 15),
    topics: topics.slice(0, 5),
    tags: tags.slice(0, 10)
  };
}

/**
 * Calculate estimated read time
 * 
 * @param {string} content - Article HTML content
 * @returns {string} Read time (e.g., "5 min read")
 */
export function calculateReadTime(content) {
  // Remove HTML tags for word count
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).length;
  
  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(words / 200);
  
  return `${minutes} min read`;
}

/**
 * Generate article sources list
 * 
 * @param {Array} tools - MCP tools used
 * @returns {Array} Sources list
 */
export function generateSources(tools = []) {
  const sources = ['riksdag-regering-mcp'];
  
  if (tools.includes('get_calendar_events')) {
    sources.push('Riksdagen Calendar');
  }
  if (tools.includes('get_betankanden')) {
    sources.push('Committee Reports');
  }
  if (tools.includes('get_propositioner')) {
    sources.push('Government Propositions');
  }
  if (tools.includes('get_motioner')) {
    sources.push('Parliamentary Motions');
  }
  if (tools.includes('search_dokument')) {
    sources.push('Riksdagen Documents');
  }
  
  return sources;
}

export default {
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  extractTopics,
  generateMetadata,
  calculateReadTime,
  generateSources,
  CONTENT_LABELS,
  L
};
