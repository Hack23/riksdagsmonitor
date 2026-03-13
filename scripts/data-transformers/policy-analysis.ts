/**
 * @module data-transformers/policy-analysis
 * @description Policy domain detection and analysis for parliamentary
 * documents. Detects fiscal, defence, environmental, education, healthcare,
 * migration, EU, justice, labour, housing, transport, and trade domains
 * using keyword matching against Swedish document titles.
 *
 * Also provides confidence level assessment for intelligence analysis.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Confidence level for intelligence assessments.
 * Reflects the quality and quantity of supporting evidence.
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Assess the confidence level of an intelligence analysis based on
 * the number of corroborating evidence items and the quality of sources.
 *
 * @param evidenceCount - Number of distinct evidence items supporting the assessment
 * @param sourceQuality - Quality score of sources (0-100, higher = better)
 * @returns Confidence level classification
 */
export function assessConfidenceLevel(evidenceCount: number, sourceQuality: number): ConfidenceLevel {
  const normalizedEvidence = Math.max(0, evidenceCount);
  const normalizedQuality = Math.max(0, Math.min(100, sourceQuality));

  // HIGH: Multiple evidence items with good-quality sources
  if (normalizedEvidence >= 5 && normalizedQuality >= 70) return 'HIGH';
  if (normalizedEvidence >= 3 && normalizedQuality >= 85) return 'HIGH';

  // LOW: Very few evidence items or very poor source quality
  if (normalizedEvidence === 0) return 'LOW';
  if (normalizedEvidence <= 1 && normalizedQuality < 50) return 'LOW';
  if (normalizedQuality < 30) return 'LOW';

  // MEDIUM: everything in between
  return 'MEDIUM';
}

import { escapeHtml } from '../html-utils.js';
import type { Language } from '../types/language.js';
import type { RawDocument } from './types.js';
import { COMMITTEE_NAMES } from './constants.js';
import {
  L,
  svSpan,
  cleanMotionText,
  isPersonProfileText,
  extractKeyPassage,
  getCommitteeName,
} from './helpers.js';

// ---------------------------------------------------------------------------
// Per-language domain name translations (12 domains × 14 languages)
// English keys are used internally; localised names are returned to callers.
// ---------------------------------------------------------------------------
type DomainKey = 'fiscal' | 'defence' | 'environment' | 'education' | 'healthcare'
  | 'migration' | 'eu-foreign' | 'justice' | 'labour' | 'housing' | 'transport' | 'trade';

const DOMAIN_NAMES: Readonly<Record<DomainKey, Record<string, string>>> = {
  fiscal: {
    en: 'fiscal policy', sv: 'finanspolitik', da: 'finanspolitik', no: 'finanspolitikk',
    fi: 'finanssipolitiikka', de: 'Finanzpolitik', fr: 'politique fiscale',
    es: 'política fiscal', nl: 'begrotingsbeleid', ar: 'السياسة المالية',
    he: 'מדיניות פיסקלית', ja: '財政政策', ko: '재정 정책', zh: '财政政策',
  },
  defence: {
    en: 'defence and security policy', sv: 'försvars- och säkerhetspolitik',
    da: 'forsvars- og sikkerhedspolitik', no: 'forsvars- og sikkerhetspolitikk',
    fi: 'puolustus- ja turvallisuuspolitiikka', de: 'Verteidigungs- und Sicherheitspolitik',
    fr: 'politique de défense et de sécurité', es: 'política de defensa y seguridad',
    nl: 'defensie- en veiligheidsbeleid', ar: 'سياسة الدفاع والأمن',
    he: 'מדיניות ביטחון והגנה', ja: '防衛・安全保障政策', ko: '국방·안보 정책', zh: '国防和安全政策',
  },
  environment: {
    en: 'environmental and climate policy', sv: 'miljö- och klimatpolitik',
    da: 'miljø- og klimapolitik', no: 'miljø- og klimapolitikk',
    fi: 'ympäristö- ja ilmastopolitiikka', de: 'Umwelt- und Klimapolitik',
    fr: 'politique environnementale et climatique', es: 'política medioambiental y climática',
    nl: 'milieu- en klimaatbeleid', ar: 'سياسة البيئة والمناخ',
    he: 'מדיניות סביבה ואקלים', ja: '環境・気候政策', ko: '환경·기후 정책', zh: '环境和气候政策',
  },
  education: {
    en: 'education policy', sv: 'utbildningspolitik', da: 'uddannelsespolitik',
    no: 'utdanningspolitikk', fi: 'koulutuspolitiikka', de: 'Bildungspolitik',
    fr: 'politique éducative', es: 'política educativa', nl: 'onderwijsbeleid',
    ar: 'سياسة التعليم', he: 'מדיניות חינוך', ja: '教育政策', ko: '교육 정책', zh: '教育政策',
  },
  healthcare: {
    en: 'healthcare policy', sv: 'hälso- och sjukvårdspolitik',
    da: 'sundhedspolitik', no: 'helsepolitikk', fi: 'terveyspolitiikka',
    de: 'Gesundheitspolitik', fr: 'politique de santé', es: 'política sanitaria',
    nl: 'gezondheidsbeleid', ar: 'سياسة الرعاية الصحية', he: 'מדיניות בריאות',
    ja: '医療政策', ko: '보건 정책', zh: '医疗政策',
  },
  migration: {
    en: 'migration policy', sv: 'migrationspolitik', da: 'migrationspolitik',
    no: 'migrasjonspolitikk', fi: 'maahanmuuttopolitiikka', de: 'Migrationspolitik',
    fr: 'politique migratoire', es: 'política migratoria', nl: 'migratiebeleid',
    ar: 'سياسة الهجرة', he: 'מדיניות הגירה', ja: '移民政策', ko: '이민 정책', zh: '移民政策',
  },
  'eu-foreign': {
    en: 'EU and foreign affairs', sv: 'EU- och utrikespolitik',
    da: 'EU- og udenrigspolitik', no: 'EU- og utenrikspolitikk',
    fi: 'EU- ja ulkopolitiikka', de: 'EU- und Außenpolitik',
    fr: 'affaires européennes et étrangères', es: 'asuntos europeos y exteriores',
    nl: 'EU- en buitenlands beleid', ar: 'شؤون الاتحاد الأوروبي والخارجية',
    he: 'יחסי חוץ ואיחוד אירופי', ja: 'EU・外交政策', ko: 'EU·외교 정책', zh: '欧盟和外交事务',
  },
  justice: {
    en: 'justice policy', sv: 'rättspolitik', da: 'retspolitik',
    no: 'justispolitikk', fi: 'oikeuspolitiikka', de: 'Justizpolitik',
    fr: 'politique judiciaire', es: 'política judicial', nl: 'justitiebeleid',
    ar: 'سياسة العدالة', he: 'מדיניות משפט', ja: '司法政策', ko: '사법 정책', zh: '司法政策',
  },
  labour: {
    en: 'labour market policy', sv: 'arbetsmarknadspolitik',
    da: 'arbejdsmarkedspolitik', no: 'arbeidsmarkedspolitikk',
    fi: 'työmarkkinapolitiikka', de: 'Arbeitsmarktpolitik',
    fr: 'politique du marché du travail', es: 'política del mercado laboral',
    nl: 'arbeidsmarktbeleid', ar: 'سياسة سوق العمل', he: 'מדיניות שוק העבודה',
    ja: '労働市場政策', ko: '노동시장 정책', zh: '劳动市场政策',
  },
  housing: {
    en: 'housing policy', sv: 'bostadspolitik', da: 'boligpolitik',
    no: 'boligpolitikk', fi: 'asuntopolitiikka', de: 'Wohnungspolitik',
    fr: 'politique du logement', es: 'política de vivienda', nl: 'woningbeleid',
    ar: 'سياسة الإسكان', he: 'מדיניות דיור', ja: '住宅政策', ko: '주택 정책', zh: '住房政策',
  },
  transport: {
    en: 'transport policy', sv: 'transportpolitik', da: 'transportpolitik',
    no: 'transportpolitikk', fi: 'liikennepolitiikka', de: 'Verkehrspolitik',
    fr: 'politique des transports', es: 'política de transporte', nl: 'vervoersbeleid',
    ar: 'سياسة النقل', he: 'מדיניות תחבורה', ja: '交通政策', ko: '교통 정책', zh: '交通政策',
  },
  trade: {
    en: 'trade and industry policy', sv: 'näringspolitik',
    da: 'erhvervspolitik', no: 'næringspolitikk', fi: 'elinkeino- ja kauppapolitiikka',
    de: 'Wirtschafts- und Handelspolitik', fr: 'politique commerciale et industrielle',
    es: 'política comercial e industrial', nl: 'handels- en industriebeleid',
    ar: 'سياسة التجارة والصناعة', he: 'מדיניות מסחר ותעשייה',
    ja: '通商・産業政策', ko: '통상·산업 정책', zh: '贸易和产业政策',
  },
};

/** Resolve a localised domain name from a domain key and language. */
function domainName(key: DomainKey, lang: Language | string): string {
  return DOMAIN_NAMES[key][lang] ?? DOMAIN_NAMES[key].en;
}

/**
 * Detect policy domains from a document's title and committee code.
 * Returns a deduplicated array of localised domain strings.
 */
export function detectPolicyDomains(doc: RawDocument, lang: Language | string = 'en'): string[] {
  const title = (doc.titel || doc.title || '').toLowerCase();
  const organ = doc.organ || doc.committee || '';
  const set = new Set<string>();

  if (title.includes('skatt') || title.includes('tax') || title.includes('budget') || title.includes('finans')
      || title.includes('makrotillsyn') || title.includes('macroprudential')
      || title.includes('moms') || title.includes('mervärd') || title.includes('skattebedrägeri')
      || title.includes('e-id') || title.includes('e-legitimation') || title.includes('verklig huvudman')
      || title.includes('penningtvätt') || /\bbeneficial owner(ship)?\b/.test(title) || title.includes('fakturabedrägeri')
      || organ === 'SkU' || organ === 'FiU')
    set.add(domainName('fiscal', lang));
  if (title.includes('försvar') || title.includes('defen') || title.includes('militär') || title.includes('nato')
      || title.includes('vapen') || title.includes('beredskap') || title.includes('totalförsvar')
      || title.includes('krigsmateriel') || title.includes('säkerhetsskydd') || title.includes('preparedness')
      || title.includes('weapon')
      || organ === 'FöU')
    set.add(domainName('defence', lang));
  if (title.includes('miljö') || title.includes('klimat') || title.includes('environ') || title.includes('energi')
      || title.includes('förnybart') || title.includes('renewable') || title.includes('koldioxid')
      || title.includes('hållbar') || title.includes('sustain')
      || organ === 'MJU')
    set.add(domainName('environment', lang));
  if (title.includes('utbildning') || title.includes('educ') || title.includes('skola') || title.includes('högskola')
      || organ === 'UbU')
    set.add(domainName('education', lang));
  if (title.includes('vård') || title.includes('hälsa') || title.includes('health') || title.includes('omsorg')
      || organ === 'SoU')
    set.add(domainName('healthcare', lang));
  if (title.includes('migration') || title.includes('invandring') || title.includes('asyl') || title.includes('utlänning')
      || title.includes('uppehållstillstånd') || title.includes('medborgarskap') || title.includes('citizenship')
      || title.includes('utvisning') || title.includes('statslöshet')
      || organ === 'SfU')
    set.add(domainName('migration', lang));
  if (/\beu\b/.test(title) || title.includes('europa') || title.includes('utrik') || title.includes('foreign')
      || organ === 'UU')
    set.add(domainName('eu-foreign', lang));
  if (title.includes('brott') || title.includes('straff') || title.includes('polis') || title.includes('justice')
      || title.includes('kriminal') || organ === 'JuU')
    set.add(domainName('justice', lang));
  if (title.includes('arbetsmarknad') || title.includes('labour') || title.includes('anställning')
      || title.includes('facklig') || /\bilo\b/.test(title) || title.includes('trakasserier')
      || title.includes('kollektivavtal') || title.includes('lönediskriminering') || title.includes('harassment')
      || organ === 'AU')
    set.add(domainName('labour', lang));
  if (title.includes('bostad') || title.includes('housing') || title.includes('hyra') || title.includes('bostadsrätt')
      || title.includes('lagfart') || title.includes('fastighet')
      || organ === 'CU')
    set.add(domainName('housing', lang));
  if (title.includes('trafik') || title.includes('transport') || title.includes('järnväg') || title.includes('väg')
      || organ === 'TU')
    set.add(domainName('transport', lang));
  if (title.includes('näring') || title.includes('handel') || title.includes('trade') || title.includes('industri')
      || title.includes('företag') || title.includes('jordbruk') || title.includes('lantbruk')
      || title.includes('veterinär') || title.includes('djur') || organ === 'NU')
    set.add(domainName('trade', lang));

  return Array.from(set);
}

/**
 * Dominant political narrative frames detected in document titles.
 * These represent recurring rhetorical frames used across parties.
 */
export type NarrativeFrame =
  | 'law-and-order'
  | 'welfare-state-defence'
  | 'fiscal-responsibility'
  | 'green-transition'
  | 'national-security'
  | 'integration-challenge'
  | 'eu-sovereignty'
  | 'workers-rights';

/**
 * Detect dominant narrative frames in a document title.
 * Narrative framing reveals which rhetorical strategies are being employed
 * regardless of the specific policy domain.
 *
 * @param doc - Document to analyse
 * @returns Array of detected narrative frames (deduplicated)
 */
export function detectNarrativeFrames(doc: RawDocument): NarrativeFrame[] {
  const title = (doc.titel || doc.title || '').toLowerCase();
  const frames = new Set<NarrativeFrame>();

  // Law-and-order: crime, punishment, police
  if (title.includes('brott') || title.includes('straff') || title.includes('polis') ||
      title.includes('kriminal') || title.includes('gäng') || /\bsäker(het)?\b/.test(title))
    frames.add('law-and-order');

  // Welfare-state defence: healthcare, social services, welfare
  if (title.includes('välfärd') || title.includes('omsorg') || title.includes('social') ||
      title.includes('pension') || title.includes('bidrag') || title.includes('trygghet'))
    frames.add('welfare-state-defence');

  // Fiscal responsibility: budgets, debt, taxes
  if (title.includes('budget') || title.includes('skuld') || title.includes('bespar') ||
      title.includes('effektiv') || title.includes('kostnad') || title.includes('överskott'))
    frames.add('fiscal-responsibility');

  // Green transition: climate, environment, energy
  if (title.includes('klimat') || title.includes('hållbar') || title.includes('grön') ||
      title.includes('utsläpp') || title.includes('förnybar') || title.includes('energiomstäl'))
    frames.add('green-transition');

  // National security: defence, preparedness, NATO
  if (title.includes('försvar') || title.includes('nato') || title.includes('beredskap') ||
      title.includes('totalförsvar') || title.includes('säkerhetsskydd'))
    frames.add('national-security');

  // Integration challenge: migration, asylum, citizenship
  if (title.includes('integration') || title.includes('integrera') || title.includes('migration') || title.includes('invandring') ||
      title.includes('asyl') || title.includes('utvisning'))
    frames.add('integration-challenge');

  // EU sovereignty: EU, European, sovereignty
  if (/\beu\b/.test(title) || title.includes('europa') || title.includes('suveränitet') ||
      title.includes('direktiv') || title.includes('förordning'))
    frames.add('eu-sovereignty');

  // Workers' rights: labour, unions, wages
  if (title.includes('facklig') || title.includes('lön') || title.includes('arbetsrätt') ||
      title.includes('kollektivavtal') || title.includes('strejk'))
    frames.add('workers-rights');

  return Array.from(frames);
}

/** Per-language analysis text. `en` and `sv` are always required; other languages are optional and fall back to `en`. */
type _LangPair = { en: Record<string, string>; sv: Record<string, string> } & Partial<Record<Language, Record<string, string>>>;

/**
 * Build a reverse lookup from any localised domain name back to the English key.
 * This allows getDomainSpecificAnalysis to work with the localised strings
 * returned by detectPolicyDomains().
 */
const _LOCALISED_TO_EN: Record<string, string> = {};
for (const [, translations] of Object.entries(DOMAIN_NAMES)) {
  const enName = translations.en;
  for (const [langKey, localisedName] of Object.entries(translations)) {
    // Skip the English entry — it maps to itself and adds no new lookup value
    if (langKey === 'en') continue;
    _LOCALISED_TO_EN[localisedName] = enName;
    _LOCALISED_TO_EN[localisedName.toLowerCase()] = enName;
  }
}

/** Module-level constant — allocated once, shared across all calls. */
const DOMAIN_ANALYSES: Record<string, _LangPair> = {
    'fiscal policy': {
      en: {
        mot: 'Fiscal policy motions directly challenge the government\'s budget assumptions and signal opposition readiness to contest tax and spending priorities.',
        bet: 'The Finance Committee\'s position on fiscal matters is usually decisive — the chamber almost always follows its recommendation on budgetary questions.',
        default: 'Government fiscal proposals must clear rigorous Finance Committee scrutiny and align with Sweden\'s fiscal surplus rule, making the committee\'s verdict pivotal.'
      },
      sv: {
        mot: 'Finanspolitiska motioner utmanar direkt regeringens budgetantaganden och signalerar oppositionens beredskap att bestrida skatte- och utgiftsprioriteringar.',
        bet: 'Finansutskottets ståndpunkt i finanspolitiska frågor är i regel avgörande – kammaren följer nästan alltid utskottets rekommendation.',
        default: 'Regeringens finanspolitiska förslag måste klara finansutskottets granskning och harmonisera med överskottsmålet för att nå bifall.'
      },
      de: { default: 'Haushaltspolitische Vorschläge müssen die strenge Prüfung des Finanzausschusses bestehen und die schwedische Überschussregel einhalten.' },
      fr: { default: 'Les propositions fiscales doivent passer l\'examen rigoureux de la commission des finances et s\'aligner sur la règle d\'excédent budgétaire suédoise.' },
      es: { default: 'Las propuestas fiscales deben superar el riguroso escrutinio del comité de finanzas y alinearse con la regla de superávit fiscal sueca.' },
    },
    'defence and security policy': {
      en: {
        mot: 'Defence motions carry heightened strategic significance following Sweden\'s NATO accession, pressing the government on long-term security commitments.',
        bet: 'Committee reports on defence shape Sweden\'s military posture and NATO integration trajectory — decisions here have multi-decade consequences.',
        default: 'Defence proposals engage Sweden\'s NATO obligations and cross-party consensus-building mechanisms for national security legislation.'
      },
      sv: {
        mot: 'Försvarsrelaterade motioner har förhöjd strategisk betydelse efter Sveriges NATO-inträde och pressar regeringen om långsiktiga säkerhetsåtaganden.',
        bet: 'Utskottsbetänkanden om försvar formar Sveriges militära inriktning och NATO-integration – besluten har konsekvenser i decennier.',
        default: 'Försvarspropositioner engagerar Sveriges NATO-förpliktelser och mekanismer för brett partistöd inom säkerhetspolitiken.'
      },
      de: { default: 'Verteidigungsvorschläge berühren Schwedens NATO-Verpflichtungen und Mechanismen zur parteiübergreifenden Konsensfindung in der nationalen Sicherheitspolitik.' },
      fr: { default: 'Les propositions de défense engagent les obligations de la Suède envers l\'OTAN et les mécanismes de consensus multipartite pour la législation de sécurité nationale.' },
      es: { default: 'Las propuestas de defensa comprometen las obligaciones de Suecia con la OTAN y los mecanismos de consenso multipartidario para la legislación de seguridad nacional.' },
    },
    'environmental and climate policy': {
      en: {
        mot: 'Climate motions reflect growing parliamentary pressure for faster decarbonisation, often targeting specific industries or the pace of policy implementation.',
        bet: 'The Environment Committee\'s recommendations balance climate ambition against economic competitiveness — its position sets the legislative baseline.',
        default: 'Environmental proposals must navigate competing interests from industry, regional governments, and EU climate commitments, making parliamentary support critical.'
      },
      sv: {
        mot: 'Klimatmotioner speglar växande parlamentariskt tryck för snabbare koldioxidminskning och riktar sig ofta mot specifika branscher.',
        bet: 'Miljöutskottet väger klimatambition mot ekonomisk konkurrenskraft – dess rekommendation sätter lagstiftningens utgångspunkt.',
        default: 'Miljöförslag måste navigera konkurrerande intressen från industrin, regionerna och EU:s klimatåtaganden.'
      },
      de: { default: 'Umweltvorschläge müssen konkurrierende Interessen aus Industrie, regionalen Regierungen und EU-Klimaverpflichtungen ausbalancieren.' },
      fr: { default: 'Les propositions environnementales doivent naviguer entre les intérêts concurrents de l\'industrie, des gouvernements régionaux et des engagements climatiques de l\'UE.' },
      es: { default: 'Las propuestas medioambientales deben navegar entre los intereses en competencia de la industria, los gobiernos regionales y los compromisos climáticos de la UE.' },
    },
    'healthcare policy': {
      en: {
        mot: 'Healthcare motions typically target gaps in regional service delivery, pressing for national minimum standards, additional funding, or new patient rights.',
        bet: 'Social Affairs Committee reports on healthcare set the framework for Sweden\'s regionally delivered but nationally financed health system.',
        default: 'Healthcare proposals require coordination between national government, regional councils, and professional bodies — a complexity that shapes the legislative timeline.'
      },
      sv: {
        mot: 'Hälso- och sjukvårdsmotioner riktar sig typiskt mot brister i regionala tjänster och driver på för nationella miniminivåer eller nya patienträttigheter.',
        bet: 'Socialutskottets betänkanden om hälso- och sjukvård sätter ramarna för det regionalt levererade men nationellt finansierade hälsosystemet.',
        default: 'Hälso- och sjukvårdspropositioner kräver samordning mellan stat, regioner och professioner – en komplexitet som formar lagstiftningens tidslinje.'
      },
      de: { default: 'Gesundheitsvorschläge erfordern Koordination zwischen nationaler Regierung, Regionalräten und Fachverbänden — eine Komplexität, die den Gesetzgebungszeitplan prägt.' },
      fr: { default: 'Les propositions en matière de santé nécessitent une coordination entre le gouvernement national, les conseils régionaux et les organismes professionnels.' },
      es: { default: 'Las propuestas sanitarias requieren coordinación entre el gobierno nacional, los consejos regionales y los organismos profesionales — una complejidad que determina el calendario legislativo.' },
    },
    'migration policy': {
      en: {
        mot: 'Migration motions reflect one of Sweden\'s most contested policy areas, with parties divided on asylum rules, integration requirements, and deportation procedures.',
        bet: 'The Social Insurance Committee\'s migration reports navigate Sweden\'s EU law obligations and UN Refugee Convention commitments alongside domestic political pressures.',
        default: 'Migration proposals must balance EU regulatory obligations with national political imperatives, making cross-party support essential for durable legislation.'
      },
      sv: {
        mot: 'Migrationsmotioner speglar ett av Sveriges mest omtvistade politikområden, med partier delade om asylregler, integrationskrav och återvändanderutiner.',
        bet: 'Socialförsäkringsutskottets migrationsbetänkanden navigerar Sveriges åtaganden enligt EU-rätten och FN:s flyktingkonvention.',
        default: 'Migrationspropositioner måste balansera EU-rättsliga förpliktelser med nationella politiska imperativ.'
      },
      de: { default: 'Migrationsvorschläge müssen EU-Regulierungsverpflichtungen mit nationalen politischen Erfordernissen in Einklang bringen — parteiübergreifende Unterstützung ist für dauerhafte Gesetzgebung unerlässlich.' },
      fr: { default: 'Les propositions migratoires doivent équilibrer les obligations réglementaires de l\'UE et les impératifs politiques nationaux — le soutien multipartite est essentiel pour une législation durable.' },
      es: { default: 'Las propuestas migratorias deben equilibrar las obligaciones regulatorias de la UE con los imperativos políticos nacionales, siendo el apoyo multipartidario esencial para una legislación duradera.' },
    },
    'EU and foreign affairs': {
      en: {
        mot: 'EU and foreign affairs motions signal parliamentary expectations for government negotiating positions — influential despite executive prerogative in external relations.',
        bet: 'The Foreign Affairs Committee\'s reports on EU matters reflect Sweden\'s positioning within the bloc and may bind future negotiating postures.',
        default: 'EU and foreign affairs proposals engage Sweden\'s treaty obligations and often require coordination with European partners before domestic enactment.'
      },
      sv: {
        mot: 'EU- och utrikespolitiska motioner signalerar parlamentets förväntningar på regeringens förhandlingspositioner.',
        bet: 'Utrikesutskottets betänkanden om EU-frågor speglar Sveriges positionering inom unionen och kan binda framtida förhandlingslinjer.',
        default: 'EU- och utrikespropositioner engagerar Sveriges fördragsförpliktelser och kräver samordning med europeiska partner.'
      },
      de: { default: 'EU- und Außenpolitikvorschläge berühren Schwedens Vertragserpflichtungen und erfordern oft eine Koordination mit europäischen Partnern.' },
      fr: { default: 'Les propositions en matière d\'UE et d\'affaires étrangères engagent les obligations conventionnelles de la Suède et nécessitent souvent une coordination avec les partenaires européens.' },
      es: { default: 'Las propuestas de la UE y de asuntos exteriores comprometen las obligaciones convencionales de Suecia y a menudo requieren coordinación con los socios europeos.' },
    },
    'justice policy': {
      en: {
        mot: 'Justice motions address crime, sentencing, and policing — areas with high public salience where opposition parties frequently press for tougher or more targeted measures.',
        bet: 'The Justice Committee shapes the criminal law framework; its reports on sentencing and policing directly affect prosecution practice and enforcement priorities.',
        default: 'Justice proposals balance rule-of-law principles, human rights obligations, and public safety demands — requiring careful drafting to withstand constitutional scrutiny.'
      },
      sv: {
        mot: 'Rättsliga motioner rör brott, straff och polis – frågor med hög allmän relevans där oppositionen ofta driver på för hårdare åtgärder.',
        bet: 'Justitieutskottet formar den straffrättsliga ramen; dess betänkanden om straffsatser och polisverksamhet påverkar direkt åklagarnas praxis.',
        default: 'Rättsliga propositioner balanserar rättsstatsprinciper, mänskliga rättigheter och allmän säkerhet.'
      },
      de: { default: 'Justizvorschläge balancieren Rechtsstaatsprinzipien, Menschenrechtsverpflichtungen und öffentliche Sicherheitsforderungen — sorgfältige Ausarbeitung ist erforderlich, um der verfassungsrechtlichen Prüfung standzuhalten.' },
      fr: { default: 'Les propositions de justice équilibrent les principes de l\'État de droit, les obligations en matière de droits de l\'homme et les exigences de sécurité publique.' },
      es: { default: 'Las propuestas de justicia equilibran los principios del Estado de derecho, las obligaciones de derechos humanos y las demandas de seguridad pública — requiriendo una redacción cuidadosa para resistir el escrutinio constitucional.' },
    },
    'labour market policy': {
      en: {
        mot: 'Labour market motions engage sensitive negotiations between employers, unions, and the state — every motion sends a signal to Sweden\'s social partners.',
        bet: 'The Labour Committee\'s reports on workplace legislation must navigate collective bargaining autonomy while setting minimum statutory floors.',
        default: 'Labour market proposals enter an arena where tripartite negotiation shapes the final legislative outcome as much as parliamentary votes.'
      },
      sv: {
        mot: 'Arbetsmarknadsmotioner engagerar känsliga förhandlingar mellan arbetsgivare, fackförbund och stat – varje motion signalerar till parterna.',
        bet: 'Arbetsmarknadsutskottets betänkanden om arbetsplatslagar måste navigera kollektivavtalens självständighet.',
        default: 'Arbetsmarknadspropositioner träder in i en arena där trepartsförhandlingar formar det slutliga lagstiftningsresultatet.'
      },
      de: { default: 'Arbeitsmarktvorschläge betreten eine Arena, in der Tarifverhandlungen das Gesetzgebungsergebnis ebenso stark prägen wie Parlamentsabstimmungen.' },
      fr: { default: 'Les propositions sur le marché du travail entrent dans une arène où la négociation tripartite détermine le résultat législatif autant que les votes parlementaires.' },
      es: { default: 'Las propuestas del mercado laboral entran en una arena donde la negociación tripartita determina el resultado legislativo tanto como los votos parlamentarios.' },
    },
    'housing policy': {
      en: {
        mot: 'Housing motions reflect structural tension between demand for affordable homes and constraints of planning law, rent regulation, and construction cost pressures.',
        bet: 'The Civil Affairs Committee\'s housing reports address one of Sweden\'s most persistent policy challenges, where committee decisions unlock or block major regulatory change.',
        default: 'Housing proposals must reconcile competing interests from municipalities, property owners, tenants, and developers — a coalition rarely achieved quickly.'
      },
      sv: {
        mot: 'Bostadsmotioner speglar strukturell spänning mellan efterfrågan på prisvärda bostäder och begränsningarna i plan- och hyreslagstiftning.',
        bet: 'Civilutskottets bostadsbetänkanden hanterar en av Sveriges mest ihållande politiska utmaningar.',
        default: 'Bostadspropositioner måste balansera konkurrerande intressen från kommuner, fastighetsägare, hyresgäster och byggföretag.'
      },
      de: { default: 'Wohnungsvorschläge müssen konkurrierende Interessen von Gemeinden, Eigentümern, Mietern und Bauträgern in Einklang bringen.' },
      fr: { default: 'Les propositions de logement doivent concilier les intérêts concurrents des municipalités, propriétaires, locataires et promoteurs.' },
      es: { default: 'Las propuestas de vivienda deben conciliar los intereses en competencia de municipios, propietarios, inquilinos y promotores.' },
    },
    'transport policy': {
      en: {
        mot: 'Transport motions address infrastructure investment, road safety, and public transit — areas where regional and national interests frequently diverge.',
        bet: 'The Transport Committee\'s reports guide Sweden\'s national infrastructure planning cycle, directly affecting long-term investment priorities.',
        default: 'Transport proposals engage the national infrastructure budget, regional equity, and climate transition targets — all must be balanced in committee deliberation.'
      },
      sv: {
        mot: 'Transportmotioner rör infrastrukturinvesteringar, trafiksäkerhet och kollektivtrafik – frågor där regionala och nationella intressen ofta divergerar.',
        bet: 'Trafikutskottets betänkanden vägleder Sveriges nationella infrastrukturplanering och påverkar direkt långsiktiga investeringsprioriteringar.',
        default: 'Transportpropositioner engagerar den nationella infrastrukturbudgeten, regional jämlikhet och klimatomställningsmål.'
      },
      de: { default: 'Verkehrsvorschläge betreffen den nationalen Infrastrukturhaushalt, regionale Gerechtigkeit und Klimaübergangsziele.' },
      fr: { default: 'Les propositions de transport concernent le budget national d\'infrastructure, l\'équité régionale et les objectifs de transition climatique.' },
      es: { default: 'Las propuestas de transporte implican el presupuesto nacional de infraestructura, la equidad regional y los objetivos de transición climática.' },
    },
    'trade and industry policy': {
      en: {
        mot: 'Industry and trade motions often target competitiveness, innovation, or trade agreements — signalling party positions ahead of EU-level or bilateral negotiations.',
        bet: 'The Committee on Industry and Trade shapes Sweden\'s business environment through reports that set conditions for investment, innovation, and exports.',
        default: 'Industry and trade proposals engage international commitments, EU single-market rules, and domestic competitiveness imperatives simultaneously.'
      },
      sv: {
        mot: 'Näringspolitiska motioner riktar sig ofta mot konkurrenskraft, innovation eller handelsavtal och signalerar partipositioner inför förhandlingar.',
        bet: 'Näringsutskottets betänkanden formar Sveriges affärsmiljö och sätter villkoren för investeringar och export.',
        default: 'Näringspolitiska propositioner engagerar internationella åtaganden, EU:s inre marknadsregler och inhemsk konkurrenskraft.'
      },
      de: { default: 'Industrie- und Handelsvorschläge berühren gleichzeitig internationale Verpflichtungen, EU-Binnenmarktregeln und inländische Wettbewerbserfordernisse.' },
      fr: { default: 'Les propositions industrielles et commerciales engagent simultanément des engagements internationaux, les règles du marché unique européen et les impératifs de compétitivité nationale.' },
      es: { default: 'Las propuestas industriales y comerciales comprometen simultáneamente compromisos internacionales, normas del mercado único europeo e imperativos de competitividad nacional.' },
    },
    'education policy': {
      en: {
        mot: 'Education motions reflect deep disagreements on school standards, teacher pay, and the role of independent schools — one of Sweden\'s most contested domestic debates.',
        bet: 'The Education Committee\'s reports directly shape curriculum standards, funding formulas, and school regulation — decisions with long generational consequences.',
        default: 'Education proposals must balance national curriculum standards with municipal delivery autonomy and the contested role of private providers in the Swedish school system.'
      },
      sv: {
        mot: 'Utbildningsmotioner speglar djupa meningsskiljaktigheter om skolstandard, lärarlöner och friskolornas roll.',
        bet: 'Utbildningsutskottets betänkanden formar direkt läroplaner, finansieringsmodeller och skolreglering.',
        default: 'Utbildningspropositioner måste balansera nationella läroplaner med kommunalt leveransansvar och de privata aktörernas omstridda roll.'
      },
      de: { default: 'Bildungsvorschläge müssen nationale Lehrplanstandards mit kommunaler Durchführungsautonomie und der umstrittenen Rolle privater Anbieter im schwedischen Schulsystem ausbalancieren.' },
      fr: { default: 'Les propositions éducatives doivent équilibrer les normes nationales de programme avec l\'autonomie de prestation municipale et le rôle controversé des prestataires privés dans le système scolaire suédois.' },
      es: { default: 'Las propuestas educativas deben equilibrar los estándares curriculares nacionales con la autonomía de prestación municipal y el controvertido papel de los proveedores privados en el sistema escolar sueco.' },
    }
};

/** Module-level constant — reverse lookup from any localised domain name to English key. */
const EN_DOMAIN_MAP: Record<string, string> = _LOCALISED_TO_EN;

/**
 * Return a substantive domain-specific and type-specific analysis sentence.
 * Each of 12 policy domains has tailored text for motions (mot), committee
 * reports (bet), and propositions/default. English and Swedish are always
 * present; other languages fall back to English when not available.
 */
export function getDomainSpecificAnalysis(primaryDomain: string, doktyp: string, lang: Language | string): string {
  const lookupKey = EN_DOMAIN_MAP[primaryDomain] ?? primaryDomain;
  const entry = DOMAIN_ANALYSES[lookupKey];
  if (!entry) return '';

  // Prefer the exact language entry, fall back to English
  const langKey = lang as Language;
  const langEntry = entry[langKey] ?? entry.en;
  const typeKey = (doktyp === 'mot' || doktyp === 'bet') ? doktyp : 'default';
  return langEntry[typeKey] ?? langEntry['default'] ?? '';
}

/**
 * Generate policy significance context for a document based on its metadata.
 * Uses the localised policySignificanceTouches label plus a domain-specific
 * analysis sentence instead of generic boilerplate.
 * Falls back to a committee-specific sentence (derived from COMMITTEE_NAMES)
 * when no domain keyword matches but the document's organ field identifies a
 * known Riksdag committee.
 * @param impliedDoktyp - document type inferred from the calling context
 *   ('mot', 'bet', 'prop') when doc.doktyp / doc.documentType is absent.
 */
export function generatePolicySignificance(doc: RawDocument, lang: Language | string, impliedDoktyp?: string): string {
  const domains = detectPolicyDomains(doc, lang);

  if (domains.length > 0) {
    const domainsStr = domains.join(', ');
    const touchesFn = L(lang, 'policySignificanceTouches') as string | ((d: string) => string);
    const baseText = typeof touchesFn === 'function'
      ? touchesFn(escapeHtml(domainsStr))
      : `Touches on ${escapeHtml(domainsStr)}.`;

    const doktyp = doc.doktyp || doc.documentType || impliedDoktyp || '';
    const deepAnalysis = getDomainSpecificAnalysis(domains[0] ?? '', doktyp, lang);
    return deepAnalysis ? `${baseText} ${deepAnalysis}` : baseText;
  }

  // Secondary: committee-specific context when organ is present but no domain matched
  const organ = doc.organ || doc.committee || '';
  if (organ) {
    const organEntry = COMMITTEE_NAMES[organ];
    if (organEntry) {
      const committeeRefTemplates: Record<string, (name: string) => string> = {
        sv: (n) => `Ärendet behandlas av ${n.toLowerCase()} för parlamentarisk beredning.`,
        da: (n) => `Sagen behandles af ${n} til parlamentarisk behandling.`,
        no: (n) => `Saken behandles av ${n} for parlamentarisk behandling.`,
        fi: (n) => `Asia käsitellään valiokunnassa ${n} parlamentaarista käsittelyä varten.`,
        de: (n) => `Die Angelegenheit wird dem ${n} zur parlamentarischen Prüfung überwiesen.`,
        fr: (n) => `L'affaire est renvoyée à la ${n} pour examen parlementaire.`,
        es: (n) => `El asunto se remite a la ${n} para examen parlamentario.`,
        nl: (n) => `De zaak wordt verwezen naar de ${n} voor parlementaire behandeling.`,
        ar: (n) => `تم إحالة الموضوع إلى ${n} للنظر البرلماني.`,
        he: (n) => `הנושא הועבר ל${n} לבחינה פרלמנטרית.`,
        ja: (n) => `この件は${n}に付託され、議会審議が行われます。`,
        ko: (n) => `이 안건은 ${n}에 회부되어 의회 심의를 받습니다.`,
        zh: (n) => `此事项已移交${n}进行议会审查。`,
      };
      // Use getCommitteeName for consistent localization: Swedish name for sv,
      // English name for all others (client-side data-translate handles further l10n)
      const committeeName = getCommitteeName(organ, lang);
      const tpl = committeeRefTemplates[lang as string];
      return tpl
        ? tpl(committeeName)
        : `This matter is referred to the ${organEntry.en} for parliamentary examination.`;
    }
  }

  // Generic significance when no domain detected and no known committee
  const genericVal = L(lang, 'policySignificanceGeneric');
  return typeof genericVal === 'string' ? genericVal : 'Requires committee review and chamber debate before a decision is reached.';
}

/**
 * Generate deep policy analysis for a single document entry.
 * Only uses `fullText` / `fullContent` (enriched content fetched separately)
 * as the passage source — summary/notis are already shown in the summary line
 * above in structured views and must not be duplicated here.
 * Falls back to generatePolicySignificance when no enriched text is available.
 * @param impliedDoktyp - document type inferred from the calling context
 *   ('mot', 'bet', 'prop') when doc.doktyp / doc.documentType is absent.
 */
export function generateDeepPolicyAnalysis(doc: RawDocument, lang: Language | string, impliedDoktyp?: string, maxPassageChars = 300): string {
  const effectiveDoktyp = doc.doktyp || doc.documentType || impliedDoktyp || '';
  const rawText = doc.fullText || doc.fullContent || '';
  if (rawText && !isPersonProfileText(rawText)) {
    const cleanedText = (effectiveDoktyp === 'mot' && rawText.includes('Motion till riksdagen'))
      ? cleanMotionText(rawText)
      : rawText;
    const passage = extractKeyPassage(cleanedText, maxPassageChars);
    if (passage) {
      const isSwedishSource = !!(doc.titel && !doc.title);
      const passageHtml = isSwedishSource
        ? svSpan(escapeHtml(passage), lang)
        : escapeHtml(passage);
      return `${passageHtml} ${generatePolicySignificance(doc, lang, impliedDoktyp)}`;
    }
  }
  return generatePolicySignificance(doc, lang, impliedDoktyp);
}

// ---------------------------------------------------------------------------
// SCB (Statistics Sweden) table mapping for policy domains
// ---------------------------------------------------------------------------

/**
 * Maps policy domain keys to relevant SCB table IDs and search queries
 * for enriching political analysis with official statistics.
 *
 * Each entry contains:
 * - `query` — Swedish-language search terms for `search_tables()` SCB MCP tool
 * - `tables` — Known SCB table IDs (e.g. "TAB5765" for unemployment) for `get_table_data()`
 * - `indicators` — Human-readable indicator names expected from the tables
 *
 * SCB MCP tools: search_tables, get_table_data, get_table_variables, preview_data, find_region_code
 * Source: https://scb-mcp.onrender.com/mcp (PxWebAPI 2.0)
 */
export const SCB_DOMAIN_TABLES: Readonly<Record<DomainKey, { query: string; tables: string[]; indicators: string[] }>> = {
  fiscal: {
    query: 'skatter statsbudget offentliga finanser',
    tables: ['TAB1291', 'TAB1292'],
    indicators: ['Government revenue', 'Government expenditure', 'Budget balance'],
  },
  defence: {
    query: 'försvar militär offentliga utgifter',
    tables: [],
    indicators: ['Defence spending as % of GDP'],
  },
  environment: {
    query: 'växthusgaser utsläpp miljö',
    tables: ['TAB5404', 'TAB5407'],
    indicators: ['GHG emissions (kt CO₂e)', 'Renewable energy share'],
  },
  education: {
    query: 'utbildning studenter skola',
    tables: ['TAB4787', 'TAB4790'],
    indicators: ['Student enrollment', 'Graduation rates', 'Education spending'],
  },
  healthcare: {
    query: 'hälsa sjukvård vård',
    tables: [],
    indicators: ['Healthcare spending', 'Hospital beds per capita'],
  },
  migration: {
    query: 'invandring utvandring migration befolkning',
    tables: ['TAB637', 'TAB4230'],
    indicators: ['Immigration', 'Emigration', 'Net migration'],
  },
  'eu-foreign': {
    query: 'utrikeshandel export import',
    tables: ['TAB2661'],
    indicators: ['Export value', 'Import value', 'Trade balance'],
  },
  justice: {
    query: 'brott lagföringar kriminalstatistik',
    tables: ['TAB1172'],
    indicators: ['Reported crimes', 'Conviction rate'],
  },
  labour: {
    query: 'sysselsättning arbetslöshet arbetsmarknad',
    tables: ['TAB5765', 'TAB5616'],
    indicators: ['Unemployment rate', 'Employment rate', 'Labour force participation'],
  },
  housing: {
    query: 'bostäder nybyggnation hyror',
    tables: ['TAB2052', 'TAB4709'],
    indicators: ['Housing starts', 'Housing prices index'],
  },
  transport: {
    query: 'trafik transport infrastruktur',
    tables: [],
    indicators: ['Road traffic volume', 'Public transport ridership'],
  },
  trade: {
    query: 'näringsliv företag BNP',
    tables: ['TAB5802', 'TAB5803'],
    indicators: ['GDP growth', 'Business starts', 'Industrial production index'],
  },
};

