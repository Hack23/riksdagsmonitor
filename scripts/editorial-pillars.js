/**
 * @module Intelligence Operations/Editorial Intelligence Framework
 * @category Intelligence Operations - Editorial Intelligence Framework
 * 
 * @description
 * Editorial intelligence framework defining the five-pillar content strategy for
 * automated news generation and evening analysis articles. This module provides
 * standardized heading structures across all 14 supported languages, enabling
 * consistent editorial organization for complex political intelligence reporting.
 * 
 * The 5 Editorial Pillars Framework:
 * 
 * Pillar 1 - Lead Story / Parliamentary Pulse:
 * The primary news peg identifying the most significant parliamentary development
 * of the day. Represents the journalist's assessment of news importance within
 * the broader political context. May be a plenary vote, committee decision,
 * government announcement, or cross-party agreement. Demands strongest analytical
 * context explaining "why this matters now" to the reader.
 * 
 * Pillar 2 - Parliamentary Pulse (Secondary):
 * Captures secondary parliamentary activities and legislative developments beyond
 * the lead story. Includes committee meetings, document submissions, procedural
 * motions, and other parliamentary events. Organized chronologically with emphasis
 * on legislative progress and institutional activity. Provides context for ongoing
 * legislative processes and parliamentary workload tracking.
 * 
 * Pillar 3 - Government Watch:
 * Dedicated focus on executive branch activities: ministerial announcements,
 * government policy documents, cabinet decisions, and regulatory actions. Tracks
 * implementation of existing policies and signals for future initiatives. Enables
 * readers to separately assess executive and legislative branches of government.
 * 
 * Pillar 4 - Opposition Dynamics:
 * Cross-party political analysis examining consensus/conflict patterns, coalition
 * signals, and opposition strategy. Tracks party positioning across multiple votes
 * and documents, identifies emerging alliances or conflicts, and assesses political
 * feasibility of government initiatives. Critical for understanding power dynamics
 * beyond simple majority/opposition binary.
 * 
 * Pillar 5 - Looking Ahead:
 * Forward-looking analysis of tomorrow's scheduled events and next week's political
 * agenda. Includes calendar previews, anticipated votes, committee meetings, and
 * known future developments. Enables proactive reader engagement and supports
 * news planning for journalists. May include expert commentary on expected outcomes.
 * 
 * Multi-Language Implementation:
 * Provides heading translations for all 14 supported languages enabling consistent
 * article structure and reader familiarity across language boundaries. Translation
 * maintains semantic meaning while adapting to language-specific idioms and
 * journalistic conventions.
 * 
 * Content Organization Patterns:
 * - Chronological ordering (for Parliamentary/Government sections)
 * - Thematic clustering (for Opposition section)
 * - Inverted importance (for Looking Ahead section)
 * - Visual hierarchy (editorial headings guide reader attention)
 * - Cross-reference links (connecting related developments across pillars)
 * 
 * @intelligence
 * Editorial Intelligence Methodology:
 * 
 * Content Curation Analysis:
 * The 5-pillar framework operationalizes editorial intelligence judgment:
 * - Newsworthiness assessment (which events meet publication threshold?)
 * - Context provision (how to explain development to diverse audiences?)
 * - Balance verification (proportional coverage of different political actors?)
 * - Narrative coherence (do events form meaningful story arc?)
 * - Reader relevance (why should target audience care about this development?)
 * 
 * Political Intelligence Assessment:
 * - Party positioning analysis (coalition signals, opposition strategy)
 * - Legislative feasibility determination (likelihood of bill passage)
 * - Risk factor identification (fiscal, political, implementation risks)
 * - Timeline tracking (deadline-driven decision pressure)
 * - Stakeholder impact analysis (who benefits/loses from this development?)
 * 
 * Narrative Structure Design:
 * - Lead story contextualization (framing development within broader issues)
 * - Fact-based reporting (separation of reporting from analysis)
 * - Multiple perspective inclusion (all major party viewpoints)
 * - Source attribution and transparency
 * - Predictive analysis (likely implications and next steps)
 * 
 * Content Strategy Integration:
 * - Coverage breadth (representation of all major political actors)
 * - Coverage depth (appropriate detail for reader comprehension)
 * - Temporal balance (historical context vs. immediate news)
 * - Geographic scope (national focus with regional implications)
 * - Topic diversity (avoiding overemphasis on single policy area)
 * 
 * @osint
 * Editorial Source Strategy:
 * 
 * Primary Source Integration:
 * - Riksdagen voting records and debate transcripts
 * - Government press releases and policy documents
 * - Committee reports and decisions
 * - Official party position statements
 * - Parliamentary calendar and scheduling documents
 * 
 * Source Verification Framework:
 * - Compare reported facts against official parliamentary records
 * - Cross-reference government announcements with Regeringen.se
 * - Validate party positions against actual voting behavior
 * - Check temporal accuracy of event descriptions
 * - Confirm attributed quotes against speech transcripts
 * 
 * Intelligence Assessment Inputs:
 * - Historical precedent (similar situations and outcomes)
 * - Party manifesto alignment (policy consistency checks)
 * - Coalition behavior patterns (predictive modeling)
 * - Expert commentary (when available from official sources)
 * - Public opinion indicators (when relevant to story)
 * 
 * @risk
 * Editorial Intelligence Risks:
 * 
 * Threat: Editorial Bias
 * - Pillar selection emphasizing certain political views
 * - Mitigation: Structured framework enforcing balanced coverage
 * 
 * Threat: False Balance
 * - Equivalent coverage of consensus vs. fringe positions
 * - Mitigation: Editorial judgment weighted by factual support
 * 
 * Threat: Importance Misjudgment
 * - Lead story selection missing major developments
 * - Mitigation: Multiple editorial review, reader engagement metrics
 * 
 * Threat: Context Deficiency
 * - Historical context missing for reader understanding
 * - Mitigation: Template-enforced context inclusion
 * 
 * Threat: Source Verification Failure
 * - Propagating unverified claims or misinformation
 * - Mitigation: Source attribution requirements, fact-checking
 * 
 * @gdpr
 * GDPR Compliance in Editorial Framework:
 * 
 * - Public Officials: Process only in official capacity
 * - Political Opinions: Article about political positions and party affiliations
 * - Personal Data Exclusion: No phone, email, addresses, family info
 * - Retention Policy: Articles kept indefinitely (cultural heritage), but no personal data
 * - Transparency: Clear source attribution for all claims
 * - Right to Erasure: Not applicable (historical parliamentary records)
 * 
 * @security
 * Editorial Framework Security:
 * 
 * - Data Integrity:
 *   * Pillar definitions stored in version control
 *   * Change tracking for editorial standard modifications
 *   * No dynamic code execution in heading definitions
 * 
 * - Localization Security:
 *   * Language codes validated (14-language whitelist)
 *   * Fallback mechanisms for missing translations
 *   * No script injection in localized text
 * 
 * - Configuration Management:
 *   * Centralized heading definitions reduce duplication
 *   * Consistent export format across all modules
 *   * Automated validation against schema definitions
 * 
 * @author Hack23 AB - Intelligence Operations Team
 * @license Apache-2.0
 * @version 2.0.0
 * 
 * @see {@link ./generate-news-enhanced.js} Article generation using pillars
 * @see {@link ./article-template.js} Template incorporating pillar structure
 * @see {@link tests/news-evening-analysis.test.js} Testing pillar integration
 * @see {@link scripts/validate-evening-analysis.js} Validation against pillar headings
 * @see {@link docs/EDITORIAL_STRATEGY.md} Editorial intelligence strategy
 * @see {@link docs/CONTENT_CURATION.md} Content curation framework
 * @see {@link docs/JOURNALISTIC_STANDARDS.md} Journalism standards and practices
 */

export const EDITORIAL_PILLAR_HEADINGS = {
  en: {
    parliamentaryPulse: 'Parliamentary Pulse',
    governmentWatch: 'Government Watch',
    oppositionDynamics: 'Opposition Dynamics',
    lookingAhead: 'Looking Ahead'
  },
  sv: {
    parliamentaryPulse: 'Riksdagspulsen',
    governmentWatch: 'Regeringsbevakning',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Vad händer imorgon'
  },
  da: {
    parliamentaryPulse: 'Parlamentarisk Puls',
    governmentWatch: 'Regeringsovervågning',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Hvad sker i morgen'
  },
  no: {
    parliamentaryPulse: 'Parlamentarisk Puls',
    governmentWatch: 'Regjeringsovervåking',
    oppositionDynamics: 'Opposisjonsdynamikk',
    lookingAhead: 'Hva skjer i morgen'
  },
  fi: {
    parliamentaryPulse: 'Parlamentaarinen Pulssi',
    governmentWatch: 'Hallituksen Valvonta',
    oppositionDynamics: 'Opposition Dynamiikka',
    lookingAhead: 'Mitä tapahtuu huomenna'
  },
  de: {
    parliamentaryPulse: 'Parlamentarischer Puls',
    governmentWatch: 'Regierungsbeobachtung',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Was passiert morgen'
  },
  fr: {
    parliamentaryPulse: 'Pouls Parlementaire',
    governmentWatch: 'Surveillance Gouvernementale',
    oppositionDynamics: 'Dynamique de l\'Opposition',
    lookingAhead: 'Ce qui se passe demain'
  },
  es: {
    parliamentaryPulse: 'Pulso Parlamentario',
    governmentWatch: 'Vigilancia Gubernamental',
    oppositionDynamics: 'Dinámica de la Oposición',
    lookingAhead: 'Qué sucede mañana'
  },
  nl: {
    parliamentaryPulse: 'Parlementaire Pols',
    governmentWatch: 'Regeringstoezicht',
    oppositionDynamics: 'Oppositiedynamiek',
    lookingAhead: 'Wat gebeurt er morgen'
  },
  ar: {
    parliamentaryPulse: 'النبض البرلماني',
    governmentWatch: 'مراقبة الحكومة',
    oppositionDynamics: 'ديناميكية المعارضة',
    lookingAhead: 'ماذا يحدث غداً'
  },
  he: {
    parliamentaryPulse: 'הדופק הפרלמנטרי',
    governmentWatch: 'מעקב אחר הממשלה',
    oppositionDynamics: 'דינמיקת האופוזיציה',
    lookingAhead: 'מה קורה מחר'
  },
  ja: {
    parliamentaryPulse: '議会の脈動',
    governmentWatch: '政府監視',
    oppositionDynamics: '野党の動き',
    lookingAhead: '明日の予定'
  },
  ko: {
    parliamentaryPulse: '의회 동향',
    governmentWatch: '정부 감시',
    oppositionDynamics: '야당 역학',
    lookingAhead: '내일 일정'
  },
  zh: {
    parliamentaryPulse: '议会脉动',
    governmentWatch: '政府监督',
    oppositionDynamics: '反对派动态',
    lookingAhead: '明天会发生什么'
  }
};

/**
 * Detect article language from HTML content
 * @param {string} html - HTML content
 * @returns {string} - Language code (fallback to 'en')
 */
export function detectArticleLanguage(html) {
  if (!html) {
    return 'en';
  }
  const match = html.match(/<html[^>]*lang="([^"]+)"/i);
  if (match && match[1]) {
    // Normalize language code: lowercase and strip region (e.g., "EN" or "no-NO" -> "en", "no")
    const primaryLang = match[1].toLowerCase().split('-')[0];
    if (EDITORIAL_PILLAR_HEADINGS[primaryLang]) {
      return primaryLang;
    }
  }
  // Fallback to English
  return 'en';
}

/**
 * Get localized heading for a pillar
 * @param {string} lang - Language code
 * @param {string} pillar - Pillar name
 * @returns {string} - Localized heading
 */
export function getLocalizedHeading(lang, pillar) {
  const headings = EDITORIAL_PILLAR_HEADINGS[lang] || EDITORIAL_PILLAR_HEADINGS.en;
  return headings[pillar];
}
