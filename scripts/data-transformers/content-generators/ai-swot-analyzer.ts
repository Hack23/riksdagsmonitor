/**
 * @module data-transformers/content-generators/ai-swot-analyzer
 * @description AI-driven multi-perspective SWOT analysis builder.
 *
 * Produces substantive analytical SWOT entries for 6 stakeholder perspectives
 * by reasoning over parliamentary document metadata, summaries, and topics.
 * Each entry carries justification, trend direction, confidence scoring, and
 * optional quantitative evidence — rather than raw document title truncation.
 *
 * The six perspectives are:
 *  1. Government Coalition (M, KD, L + SD support)
 *  2. Social Democratic Opposition (S, V, C, MP)
 *  3. EU / International Actors
 *  4. Private Sector & Business
 *  5. Civil Society & NGOs
 *  6. Swedish Citizens / Voters
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import type { SwotImpact } from '../../types/article.js';
import type { StakeholderSwot } from './stakeholder-swot-section.js';
import type { RawDocument } from '../types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One of the six recognised stakeholder perspectives */
export type StakeholderPerspective =
  | 'government-coalition'
  | 'opposition'
  | 'eu-international'
  | 'private-sector'
  | 'civil-society'
  | 'citizens-voters';

/** Trend direction for a SWOT entry */
export type TrendDirection = 'improving' | 'stable' | 'deteriorating';

/**
 * Enhanced SWOT entry with AI-generated analytical content.
 * Extends the base `SwotEntry` shape with additional intelligence fields.
 */
export interface AISwotEntry {
  /** Short analytical statement (the main SWOT item) */
  text: string;
  /** Relative policy impact or significance */
  impact: SwotImpact;
  /** Reasoning explaining why this item was included */
  justification: string;
  /** IDs or titles of related documents that support this entry */
  relatedDocuments: string[];
  /** Whether this factor is getting better, static, or worse */
  trendDirection: TrendDirection;
  /** Optional metric supporting the entry (e.g. "73% majority", "SEK 2.1 bn") */
  quantitativeEvidence?: string;
}

/** A link connecting a SWOT entry in one stakeholder analysis to another */
export interface SwotCrossReference {
  fromStakeholder: StakeholderPerspective;
  fromQuadrant: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  toStakeholder: StakeholderPerspective;
  toQuadrant: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  rationale: string;
}

/** Full AI SWOT analysis for a single stakeholder */
export interface AISwotAnalysis {
  stakeholder: string;
  perspective: StakeholderPerspective;
  strengths: AISwotEntry[];
  weaknesses: AISwotEntry[];
  opportunities: AISwotEntry[];
  threats: AISwotEntry[];
  crossReferences: SwotCrossReference[];
  /** Overall analytical confidence (0–1) */
  confidenceScore: number;
}

// ---------------------------------------------------------------------------
// Localised stakeholder names (all 14 languages)
// ---------------------------------------------------------------------------

const STAKEHOLDER_NAMES: Readonly<Record<StakeholderPerspective, Partial<Record<Language, string>>>> = {
  'government-coalition': {
    en: 'Government Coalition',
    sv: 'Regeringskoalitionen',
    da: 'Regeringskoalitionen',
    no: 'Regjeringskoalisjonen',
    fi: 'Hallituskoalitio',
    de: 'Regierungskoalition',
    fr: 'Coalition gouvernementale',
    es: 'Coalición gubernamental',
    nl: 'Regeringscoalitie',
    ar: 'الائتلاف الحكومي',
    he: 'הקואליציה הממשלתית',
    ja: '政府連立',
    ko: '정부 연립',
    zh: '执政联盟',
  },
  opposition: {
    en: 'Social Democratic Opposition',
    sv: 'Socialdemokratisk opposition',
    da: 'Socialdemokratisk opposition',
    no: 'Sosialdemokratisk opposisjon',
    fi: 'Sosiaalidemokraattinen oppositio',
    de: 'Sozialdemokratische Opposition',
    fr: 'Opposition sociale-démocrate',
    es: 'Oposición socialdemócrata',
    nl: 'Sociaaldemocratische oppositie',
    ar: 'المعارضة الاشتراكية الديمقراطية',
    he: 'האופוזיציה הסוציאל-דמוקרטית',
    ja: '社会民主主義野党',
    ko: '사회민주주의 야당',
    zh: '社会民主主义反对派',
  },
  'eu-international': {
    en: 'EU & International Actors',
    sv: 'EU och internationella aktörer',
    da: 'EU og internationale aktører',
    no: 'EU og internasjonale aktører',
    fi: 'EU ja kansainväliset toimijat',
    de: 'EU & Internationale Akteure',
    fr: 'UE et acteurs internationaux',
    es: 'UE y actores internacionales',
    nl: 'EU & Internationale actoren',
    ar: 'الاتحاد الأوروبي والجهات الدولية',
    he: 'האיחוד האירופי וגורמים בינלאומיים',
    ja: 'EUと国際的アクター',
    ko: 'EU 및 국제 행위자',
    zh: '欧盟与国际行为者',
  },
  'private-sector': {
    en: 'Private Sector & Business',
    sv: 'Privat sektor och näringsliv',
    da: 'Privat sektor og erhvervsliv',
    no: 'Privat sektor og næringsliv',
    fi: 'Yksityissektori ja elinkeinoelämä',
    de: 'Privatwirtschaft & Unternehmen',
    fr: 'Secteur privé & entreprises',
    es: 'Sector privado y empresas',
    nl: 'Private sector & bedrijfsleven',
    ar: 'القطاع الخاص والأعمال',
    he: 'המגזר הפרטי והעסקים',
    ja: '民間セクターとビジネス',
    ko: '민간 부문 및 기업',
    zh: '私营部门与商业',
  },
  'civil-society': {
    en: 'Civil Society & NGOs',
    sv: 'Civilsamhälle och NGO:er',
    da: 'Civilsamfund og NGO\'er',
    no: 'Sivilsamfunn og frivillige organisasjoner',
    fi: 'Kansalaisyhteiskunta ja kansalaisjärjestöt',
    de: 'Zivilgesellschaft & NGOs',
    fr: 'Société civile & ONG',
    es: 'Sociedad civil y ONG',
    nl: 'Maatschappelijk middenveld & NGO\'s',
    ar: 'المجتمع المدني ومنظمات غير حكومية',
    he: 'החברה האזרחית וארגוני מלכ"ר',
    ja: '市民社会とNGO',
    ko: '시민 사회 및 NGO',
    zh: '公民社会与非政府组织',
  },
  'citizens-voters': {
    en: 'Swedish Citizens & Voters',
    sv: 'Svenska medborgare och väljare',
    da: 'Svenske borgere og vælgere',
    no: 'Svenske borgere og velgere',
    fi: 'Ruotsalaiset kansalaiset ja äänestäjät',
    de: 'Schwedische Bürger & Wähler',
    fr: 'Citoyens & électeurs suédois',
    es: 'Ciudadanos y votantes suecos',
    nl: 'Zweedse burgers & kiezers',
    ar: 'المواطنون والناخبون السويديون',
    he: 'אזרחים ובוחרים שבדים',
    ja: 'スウェーデン市民と有権者',
    ko: '스웨덴 시민 및 유권자',
    zh: '瑞典公民与选民',
  },
};

// ---------------------------------------------------------------------------
// Localised stakeholder roles (all 14 languages)
// ---------------------------------------------------------------------------

const STAKEHOLDER_ROLES: Readonly<Record<StakeholderPerspective, Partial<Record<Language, string>>>> = {
  'government-coalition': {
    en: 'Tidö Agreement parties: M, KD, L with SD support',
    sv: 'Tidöavtalspartierna: M, KD, L med SD:s stöd',
    da: 'Tidö-aftalepartierne: M, KD, L med SD-støtte',
    no: 'Tidö-avtalepartiene: M, KD, L med SD-støtte',
    fi: 'Tidö-sopimuspuolueet: M, KD, L SD:n tuella',
    de: 'Tidö-Vereinbarungsparteien: M, KD, L mit SD-Unterstützung',
    fr: 'Partis de l\'accord Tidö: M, KD, L avec soutien SD',
    es: 'Partidos del acuerdo Tidö: M, KD, L con apoyo SD',
    nl: 'Tidö-akkoordpartijen: M, KD, L met SD-steun',
    ar: 'أحزاب اتفاقية تيدو: M وKD وL بدعم SD',
    he: 'מפלגות הסכם טידו: M, KD, L בתמיכת SD',
    ja: 'ティドー協定政党: M、KD、L（SD支持）',
    ko: '티도 협정 정당: M, KD, L (SD 지원)',
    zh: 'Tidö协议党派：M、KD、L，获SD支持',
  },
  opposition: {
    en: 'S, V, C, MP — alternative governance bloc',
    sv: 'S, V, C, MP — alternativt styrningsblock',
    da: 'S, V, C, MP — alternativ styringsblok',
    no: 'S, V, C, MP — alternativ styringsblokk',
    fi: 'S, V, C, MP — vaihtoehtoinen hallintoryhmä',
    de: 'S, V, C, MP — alternatives Regierungsblock',
    fr: 'S, V, C, MP — bloc de gouvernance alternatif',
    es: 'S, V, C, MP — bloque de gobierno alternativo',
    nl: 'S, V, C, MP — alternatief regeringsblok',
    ar: 'S وV وC وMP — كتلة حوكمة بديلة',
    he: 'S, V, C, MP — גוש שלטון חלופי',
    ja: 'S、V、C、MP — 代替統治ブロック',
    ko: 'S, V, C, MP — 대안 통치 블록',
    zh: 'S、V、C、MP — 替代执政集团',
  },
  'eu-international': {
    en: 'European Union institutions, international bodies & diplomatic actors',
    sv: 'EU:s institutioner, internationella organ och diplomatiska aktörer',
    da: 'EU-institutioner, internationale organer og diplomatiske aktører',
    no: 'EU-institusjoner, internasjonale organer og diplomatiske aktører',
    fi: 'EU-instituutiot, kansainväliset elimet ja diplomaattiset toimijat',
    de: 'EU-Institutionen, internationale Gremien & diplomatische Akteure',
    fr: 'Institutions européennes, organismes internationaux & acteurs diplomatiques',
    es: 'Instituciones europeas, organismos internacionales y actores diplomáticos',
    nl: 'EU-instellingen, internationale organen & diplomatieke actoren',
    ar: 'المؤسسات الأوروبية والهيئات الدولية والجهات الدبلوماسية',
    he: 'מוסדות האיחוד האירופי, גופים בינלאומיים ושחקנים דיפלומטיים',
    ja: 'EU機関・国際機関・外交的行為者',
    ko: 'EU 기관, 국제 기구 및 외교적 행위자',
    zh: '欧盟机构、国际组织与外交行为者',
  },
  'private-sector': {
    en: 'Companies, industry federations, employers & investors',
    sv: 'Företag, branschorganisationer, arbetsgivare och investerare',
    da: 'Virksomheder, brancheforeninger, arbejdsgivere og investorer',
    no: 'Bedrifter, bransjeforeninger, arbeidsgivere og investorer',
    fi: 'Yritykset, toimialajärjestöt, työnantajat ja sijoittajat',
    de: 'Unternehmen, Branchenverbände, Arbeitgeber & Investoren',
    fr: 'Entreprises, fédérations sectorielles, employeurs & investisseurs',
    es: 'Empresas, federaciones sectoriales, empleadores e inversores',
    nl: 'Bedrijven, brancheverenigingen, werkgevers & investeerders',
    ar: 'الشركات والاتحادات القطاعية وأصحاب العمل والمستثمرون',
    he: 'חברות, התאחדויות ענפיות, מעסיקים ומשקיעים',
    ja: '企業・業界団体・雇用主・投資家',
    ko: '기업, 업계 연합, 고용주 및 투자자',
    zh: '企业、行业协会、雇主与投资者',
  },
  'civil-society': {
    en: 'Trade unions, advocacy groups, human rights organisations & media',
    sv: 'Fackföreningar, påtryckargrupper, människorättsorganisationer och media',
    da: 'Fagforeninger, interesseorganisationer, menneskerettighedsorganisationer og medier',
    no: 'Fagforeninger, interesseorganisasjoner, menneskerettighetsorganisasjoner og medier',
    fi: 'Ammattiliitot, edunvalvontaryhmät, ihmisoikeusjärjestöt ja media',
    de: 'Gewerkschaften, Interessengruppen, Menschenrechtsorganisationen & Medien',
    fr: 'Syndicats, groupes de plaidoyer, organisations de droits humains & médias',
    es: 'Sindicatos, grupos de defensa, organizaciones de derechos humanos y medios',
    nl: 'Vakbonden, belangengroepen, mensenrechtenorganisaties & media',
    ar: 'النقابات ومجموعات المناصرة ومنظمات حقوق الإنسان والإعلام',
    he: 'ועדי עובדים, קבוצות הסברה, ארגוני זכויות אדם ותקשורת',
    ja: '労働組合・権利擁護団体・人権団体・メディア',
    ko: '노동조합, 권익 단체, 인권 단체 및 미디어',
    zh: '工会、倡导团体、人权组织与媒体',
  },
  'citizens-voters': {
    en: 'Electorate, public service users & democratic stakeholders',
    sv: 'Valmanskåren, användare av offentliga tjänster och demokratiska intressenter',
    da: 'Valgberettigede, brugere af offentlige tjenester og demokratiske interessenter',
    no: 'Stemmeberettigede, brukere av offentlige tjenester og demokratiske interessenter',
    fi: 'Äänioikeutetut, julkisten palvelujen käyttäjät ja demokraattiset sidosryhmät',
    de: 'Wählerschaft, Nutzer öffentlicher Dienste & demokratische Stakeholder',
    fr: 'Électorat, usagers des services publics & parties prenantes démocratiques',
    es: 'Electorado, usuarios de servicios públicos y partes interesadas democráticas',
    nl: 'Kiezers, gebruikers van overheidsdiensten & democratische stakeholders',
    ar: 'الناخبون ومستخدمو الخدمات العامة وأصحاب المصلحة الديمقراطية',
    he: 'מצביעים, משתמשי שירותים ציבוריים ובעלי עניין דמוקרטיים',
    ja: '有権者・公共サービス利用者・民主的利害関係者',
    ko: '유권자, 공공 서비스 이용자 및 민주적 이해 관계자',
    zh: '选民、公共服务用户与民主利益相关者',
  },
};

// ---------------------------------------------------------------------------
// Document classification helpers
// ---------------------------------------------------------------------------

/** Minimum summary length to prefer summary over title */
const MIN_SUMMARY_LENGTH = 20;
/** Maximum characters to use from a summary */
const MAX_SUMMARY_CHARS = 120;
/** Maximum characters to use from a document title */
const MAX_TITLE_CHARS = 100;

function titleOf(d: RawDocument): string {
  return (d.titel || d.title || d.rubrik || d.dokumentnamn || d.dok_id || '').trim();
}

function summaryOf(d: RawDocument): string {
  return (d.summary || d.notis || d.undertitel || '').trim();
}

/** Extract meaningful content for an AI entry — prefer summary over raw title */
function contentOf(d: RawDocument, fallback: string): string {
  const s = summaryOf(d);
  if (s.length > MIN_SUMMARY_LENGTH) return s.slice(0, MAX_SUMMARY_CHARS);
  const t = titleOf(d);
  return t.length > 0 ? t.slice(0, MAX_TITLE_CHARS) : fallback;
}

function makeAIEntry(
  text: string,
  impact: SwotImpact,
  justification: string,
  relatedDocuments: string[],
  trendDirection: TrendDirection,
  quantitativeEvidence?: string,
): AISwotEntry {
  return { text, impact, justification, relatedDocuments, trendDirection, quantitativeEvidence };
}

function docEntry(
  d: RawDocument,
  defaultText: string,
  impact: SwotImpact,
  justification: string,
  trendDirection: TrendDirection,
  quantEvidence?: string,
): AISwotEntry {
  return makeAIEntry(
    contentOf(d, defaultText),
    impact,
    justification,
    [titleOf(d) || d.dok_id || ''].filter(Boolean),
    trendDirection,
    quantEvidence,
  );
}

// ---------------------------------------------------------------------------
// Topic-aware analytical statement builder
// ---------------------------------------------------------------------------

/** Build a topical statement: "X in {topic}" or fallback X */
function withTopic(template: string, topic: string | null): string {
  if (!topic) return template;
  return template.replace('%t', topic);
}

// ---------------------------------------------------------------------------
// Per-stakeholder SWOT builders
// ---------------------------------------------------------------------------

function buildGovernmentSwot(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): Pick<AISwotAnalysis, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'> {
  const propDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'prop');
  const sfsDocs   = docs.filter(d => (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  const pressmDocs = docs.filter(d => (d.doktyp || d.documentType) === 'pressm');
  const betDocs   = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  const euDocs    = docs.filter(d => (d.doktyp || d.documentType) === 'fpm');
  const motDocs   = docs.filter(d => (d.doktyp || d.documentType) === 'mot');

  const topicStr = topic ? ` on ${topic}` : '';
  const docCount = `${docs.length} parliamentary document${docs.length !== 1 ? 's' : ''} examined`;

  const strengths: AISwotEntry[] = [];
  propDocs.slice(0, 2).forEach(d => {
    strengths.push(docEntry(
      d, withTopic('Government proposition%t', topicStr ? ` ${topic}` : null),
      'high',
      withTopic(`Government-initiated proposition demonstrates legislative agenda-setting capacity${topicStr}`, topic),
      'stable',
    ));
  });
  sfsDocs.slice(0, 1).forEach(d => {
    strengths.push(docEntry(
      d, withTopic('Enacted law%t', topicStr ? ` ${topic}` : null),
      'high',
      withTopic(`Enacted statute indicates completed legislative cycle${topicStr}`, topic),
      'stable',
    ));
  });
  pressmDocs.slice(0, 1).forEach(d => {
    strengths.push(docEntry(
      d, withTopic('Government communication%t', topicStr ? ` ${topic}` : null),
      'medium',
      withTopic(`Press communication signals proactive policy messaging${topicStr}`, topic),
      'stable',
    ));
  });
  if (strengths.length === 0) {
    strengths.push(makeAIEntry(
      withTopic('Policy initiative and agenda-setting%t', topicStr ? ` on ${topic}` : ''),
      'medium',
      withTopic(`Government holds exclusive right to introduce primary legislation${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  const weaknesses: AISwotEntry[] = [];
  betDocs.slice(0, 2).forEach(d => {
    weaknesses.push(docEntry(
      d, 'Implementation scrutiny in committee report',
      'medium',
      withTopic(`Committee scrutiny reveals implementation challenges${topicStr}`, topic),
      'stable',
    ));
  });
  if (weaknesses.length === 0) {
    weaknesses.push(makeAIEntry(
      withTopic('Implementation timeline and resource prioritisation%t', topicStr ? ` for ${topic}` : ''),
      'medium',
      withTopic(`Complex legislation requires sustained administrative capacity${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  const opportunities: AISwotEntry[] = [];
  euDocs.slice(0, 2).forEach(d => {
    opportunities.push(docEntry(
      d, 'EU framework position paper',
      'high',
      withTopic(`EU/international alignment can strengthen domestic policy credibility${topicStr}`, topic),
      'improving',
    ));
  });
  if (opportunities.length === 0) {
    opportunities.push(makeAIEntry(
      withTopic('EU and international cooperation%t', topicStr ? ` on ${topic}` : ''),
      'high',
      withTopic(`Multilateral frameworks provide legitimacy and co-funding for domestic reforms${topicStr}`, topic),
      [],
      'improving',
    ));
  }

  const threats: AISwotEntry[] = [];
  motDocs.slice(0, 2).forEach(d => {
    threats.push(docEntry(
      d, 'Opposition motion challenging policy',
      'medium',
      withTopic(`Opposition motions create parliamentary counter-pressure${topicStr}`, topic),
      'stable',
    ));
  });
  if (threats.length === 0) {
    threats.push(makeAIEntry(
      withTopic('Execution risks and political resistance%t', topicStr ? ` to ${topic} reform` : ''),
      'medium',
      withTopic(`Policy implementation faces stakeholder friction and opposition challenge${topicStr}`, topic),
      [],
      'stable',
      docCount,
    ));
  }

  return { strengths, weaknesses, opportunities, threats };
}

function buildOppositionSwot(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): Pick<AISwotAnalysis, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'> {
  const betDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  const motDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'mot');
  const propDocs = docs.filter(d => (d.doktyp || d.documentType) === 'prop');

  const topicStr = topic ? ` on ${topic}` : '';

  const strengths: AISwotEntry[] = [];
  betDocs.slice(0, 2).forEach(d => {
    strengths.push(docEntry(
      d, 'Committee oversight report',
      'high',
      withTopic(`Committee report enables structured parliamentary scrutiny${topicStr}`, topic),
      'stable',
    ));
  });
  motDocs.slice(0, 2).forEach(d => {
    strengths.push(docEntry(
      d, 'Opposition motion for alternative policy',
      'medium',
      withTopic(`Tabling motions demonstrates alternative policy capacity and public positioning${topicStr}`, topic),
      'stable',
    ));
  });
  if (strengths.length === 0) {
    strengths.push(makeAIEntry(
      withTopic('Parliamentary oversight and scrutiny%t', topicStr ? ` of ${topic} proposals` : ''),
      'high',
      withTopic(`Opposition fulfils democratic accountability function${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  const weaknesses: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Limited access to implementation data%t', topicStr ? ` on ${topic}` : ''),
      'medium',
      withTopic(`Government controls executive information; opposition relies on public documents${topicStr}`, topic),
      [],
      'stable',
    ),
  ];

  const opportunities: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Cross-party consensus building%t', topicStr ? ` on ${topic}` : ''),
      'high',
      withTopic(`Issue salience creates openings for coalition with centrist defectors${topicStr}`, topic),
      [],
      'improving',
    ),
  ];

  const threats: AISwotEntry[] = [];
  propDocs.slice(0, 1).forEach(d => {
    threats.push(docEntry(
      d, 'Government proposition limiting amendment scope',
      'medium',
      withTopic(`Government majority can pass legislation with minimal opposition amendments${topicStr}`, topic),
      'stable',
    ));
  });
  if (threats.length === 0) {
    threats.push(makeAIEntry(
      withTopic('Government majority limiting amendment capacity%t', topicStr ? ` on ${topic}` : ''),
      'medium',
      withTopic(`Parliamentary arithmetic constrains opposition legislative influence${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  return { strengths, weaknesses, opportunities, threats };
}

function buildEUInternationalSwot(
  docs: RawDocument[],
  topic: string | null,
  _lang: Language,
): Pick<AISwotAnalysis, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'> {
  const euDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'fpm');
  const extDocs = docs.filter(d => (d.doktyp || d.documentType) === 'ext');
  const topicStr = topic ? ` on ${topic}` : '';

  const strengths: AISwotEntry[] = [];
  euDocs.slice(0, 2).forEach(d => {
    strengths.push(docEntry(
      d, 'EU/international regulatory framework',
      'high',
      withTopic(`EU regulatory alignment provides Sweden with binding legal framework and co-funding${topicStr}`, topic),
      'improving',
    ));
  });
  if (strengths.length === 0) {
    strengths.push(makeAIEntry(
      withTopic('EU regulatory frameworks and directives%t', topicStr ? ` for ${topic}` : ''),
      'high',
      withTopic(`EU membership provides supranational standards that shape national policy${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  extDocs.slice(0, 1).forEach(d => {
    strengths.push(docEntry(
      d, 'External expert input',
      'medium',
      withTopic(`International expertise validates and contextualises domestic policy positions${topicStr}`, topic),
      'stable',
    ));
  });

  const weaknesses: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Implementation variation across EU member states%t', topicStr ? ` regarding ${topic}` : ''),
      'medium',
      withTopic(`Divergent transposition timelines can create competitive disadvantages for Sweden${topicStr}`, topic),
      [],
      'stable',
    ),
  ];

  const opportunities: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Diplomatic leadership and norm-setting%t', topicStr ? ` on ${topic}` : ''),
      'high',
      withTopic(`Sweden can use international forums to shape standards and attract investment${topicStr}`, topic),
      [],
      'improving',
    ),
  ];

  const threats: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Geopolitical uncertainty impacting Swedish policy space%t', topicStr ? ` for ${topic}` : ''),
      'high',
      withTopic(`Shifting international dynamics can constrain or override domestic policy choices${topicStr}`, topic),
      [],
      'deteriorating',
    ),
  ];

  return { strengths, weaknesses, opportunities, threats };
}

function buildPrivateSectorSwot(
  docs: RawDocument[],
  topic: string | null,
  _lang: Language,
): Pick<AISwotAnalysis, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'> {
  const sfsDocs = docs.filter(d => (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  const extDocs = docs.filter(d => (d.doktyp || d.documentType) === 'ext');
  const topicStr = topic ? ` in ${topic}` : '';

  const strengths: AISwotEntry[] = [];
  extDocs.slice(0, 2).forEach(d => {
    strengths.push(docEntry(
      d, 'Industry input to policy process',
      'high',
      withTopic(`Industry representation in consultation demonstrates established influence channels${topicStr}`, topic),
      'stable',
    ));
  });
  if (strengths.length === 0) {
    strengths.push(makeAIEntry(
      withTopic('Domain expertise and operational capacity%t', topicStr ? ` in ${topic}` : ''),
      'high',
      withTopic(`Private sector holds implementation knowledge critical to policy success${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  const weaknesses: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Compliance costs from new regulatory requirements%t', topicStr ? ` in ${topic}` : ''),
      'medium',
      withTopic(`Legislative changes impose adaptation costs particularly on SMEs${topicStr}`, topic),
      [],
      'deteriorating',
    ),
  ];
  sfsDocs.slice(0, 1).forEach(d => {
    weaknesses.push(docEntry(
      d, 'New regulatory requirement',
      'medium',
      withTopic(`Enacted statute creates compliance obligations for business${topicStr}`, topic),
      'stable',
    ));
  });

  const opportunities: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Investment and innovation from policy-driven market development%t', topicStr ? ` in ${topic}` : ''),
      'high',
      withTopic(`Government programmes create new markets and procurement opportunities${topicStr}`, topic),
      [],
      'improving',
    ),
  ];

  const threats: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Regulatory uncertainty during policy transition%t', topicStr ? ` on ${topic}` : ''),
      'high',
      withTopic(`Short implementation timelines and evolving rules hamper business planning${topicStr}`, topic),
      [],
      'deteriorating',
    ),
  ];

  return { strengths, weaknesses, opportunities, threats };
}

function buildCivilSocietySwot(
  docs: RawDocument[],
  topic: string | null,
  _lang: Language,
): Pick<AISwotAnalysis, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'> {
  const betDocs = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  const motDocs = docs.filter(d => (d.doktyp || d.documentType) === 'mot');
  const topicStr = topic ? ` on ${topic}` : '';

  const strengths: AISwotEntry[] = [];
  betDocs.slice(0, 1).forEach(d => {
    strengths.push(docEntry(
      d, 'Civil society input in committee process',
      'high',
      withTopic(`Committee consultation includes civil society perspectives that shape final legislation${topicStr}`, topic),
      'stable',
    ));
  });
  if (strengths.length === 0) {
    strengths.push(makeAIEntry(
      withTopic('Democratic accountability and rights advocacy%t', topicStr ? ` regarding ${topic}` : ''),
      'high',
      withTopic(`Civil society provides independent oversight and public interest representation${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  const weaknesses: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Resource constraints limiting monitoring capacity%t', topicStr ? ` for ${topic}` : ''),
      'medium',
      withTopic(`NGOs often lack funding to mount sustained campaigns on complex legislation${topicStr}`, topic),
      [],
      'stable',
    ),
  ];

  const opportunities: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Public mobilisation on rights-sensitive policies%t', topicStr ? ` related to ${topic}` : ''),
      'high',
      withTopic(`Heightened media attention creates window for civil society agenda-setting${topicStr}`, topic),
      [],
      'improving',
    ),
  ];

  const threats: AISwotEntry[] = [];
  motDocs.slice(0, 1).forEach(d => {
    threats.push(docEntry(
      d, 'Restrictive legislative motion',
      'medium',
      withTopic(`Proposed legislation may restrict civic space or NGO operational freedoms${topicStr}`, topic),
      'deteriorating',
    ));
  });
  if (threats.length === 0) {
    threats.push(makeAIEntry(
      withTopic('Legislative changes reducing civic freedoms%t', topicStr ? ` in ${topic}` : ''),
      'medium',
      withTopic(`Policy reforms can inadvertently curtail associational rights or protest space${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  return { strengths, weaknesses, opportunities, threats };
}

function buildCitizensSwot(
  docs: RawDocument[],
  topic: string | null,
  _lang: Language,
): Pick<AISwotAnalysis, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'> {
  const propDocs = docs.filter(d => (d.doktyp || d.documentType) === 'prop');
  const sfsDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  const betDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  const topicStr = topic ? ` on ${topic}` : '';

  const strengths: AISwotEntry[] = [];
  sfsDocs.slice(0, 1).forEach(d => {
    strengths.push(docEntry(
      d, 'Enacted welfare or service law',
      'high',
      withTopic(`Enacted legislation directly improves public service delivery${topicStr}`, topic),
      'stable',
    ));
  });
  if (strengths.length === 0) {
    strengths.push(makeAIEntry(
      withTopic('Democratic representation through elected parliament%t', topicStr ? ` on ${topic}` : ''),
      'high',
      withTopic(`Citizens exercise electoral accountability over policy direction${topicStr}`, topic),
      [],
      'stable',
    ));
  }

  const weaknesses: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Information asymmetry on policy impacts%t', topicStr ? ` of ${topic}` : ''),
      'medium',
      withTopic(`Complex legislation is difficult for citizens to evaluate without expert analysis${topicStr}`, topic),
      [],
      'stable',
    ),
  ];

  const opportunities: AISwotEntry[] = [];
  propDocs.slice(0, 1).forEach(d => {
    opportunities.push(docEntry(
      d, 'Government reform proposition',
      'high',
      withTopic(`Government reform proposals create opportunities for improved public services${topicStr}`, topic),
      'improving',
    ));
  });
  betDocs.slice(0, 1).forEach(d => {
    opportunities.push(docEntry(
      d, 'Transparent committee review process',
      'medium',
      withTopic(`Open committee proceedings allow citizens to track legislative development${topicStr}`, topic),
      'stable',
    ));
  });
  if (opportunities.length === 0) {
    opportunities.push(makeAIEntry(
      withTopic('Policy reforms improving public service quality%t', topicStr ? ` for ${topic}` : ''),
      'high',
      withTopic(`Parliamentary activity on this issue indicates political will to improve outcomes${topicStr}`, topic),
      [],
      'improving',
    ));
  }

  const threats: AISwotEntry[] = [
    makeAIEntry(
      withTopic('Policy implementation gaps reducing service quality%t', topicStr ? ` in ${topic}` : ''),
      'medium',
      withTopic(`Distance between legislative intent and administrative execution affects citizen outcomes${topicStr}`, topic),
      [],
      'stable',
    ),
  ];

  return { strengths, weaknesses, opportunities, threats };
}

// ---------------------------------------------------------------------------
// Cross-reference generator
// ---------------------------------------------------------------------------

function buildCrossReferences(docs: RawDocument[], topic: string | null): SwotCrossReference[] {
  const refs: SwotCrossReference[] = [];

  // Government strengths → Opposition threats
  if (docs.filter(d => (d.doktyp || d.documentType) === 'prop').length > 0) {
    refs.push({
      fromStakeholder: 'government-coalition',
      fromQuadrant: 'strengths',
      toStakeholder: 'opposition',
      toQuadrant: 'threats',
      rationale: topic
        ? `Government propositions on ${topic} that reinforce coalition strengths simultaneously limit opposition influence`
        : 'Government legislative agenda that strengthens coalition simultaneously constrains opposition amendment capacity',
    });
  }

  // EU opportunities → Private sector opportunities
  if (docs.filter(d => (d.doktyp || d.documentType) === 'fpm').length > 0) {
    refs.push({
      fromStakeholder: 'eu-international',
      fromQuadrant: 'opportunities',
      toStakeholder: 'private-sector',
      toQuadrant: 'opportunities',
      rationale: topic
        ? `EU directives on ${topic} open cross-border market opportunities for Swedish business`
        : 'EU regulatory harmonisation creates new market access opportunities for Swedish companies',
    });
  }

  // Private sector regulatory burden → Civil society accountability
  refs.push({
    fromStakeholder: 'private-sector',
    fromQuadrant: 'weaknesses',
    toStakeholder: 'civil-society',
    toQuadrant: 'opportunities',
    rationale: topic
      ? `Business compliance challenges on ${topic} create space for civil society to advocate proportionate regulation`
      : 'Regulatory compliance burdens provide civil society with advocacy leverage for balanced policy design',
  });

  return refs;
}

// ---------------------------------------------------------------------------
// Confidence score calculation
// ---------------------------------------------------------------------------

/** Baseline confidence with minimal document evidence */
const BASE_CONFIDENCE = 0.55;
/** Maximum bonus for document volume (capped at 10 extra documents) */
const MAX_DOC_VOLUME_BONUS = 0.20;
/** Confidence points added per document (capped by MAX_DOC_VOLUME_BONUS) */
const CONFIDENCE_PER_DOC = 0.02;
/** Maximum bonus for enriched full-text documents */
const MAX_ENRICHMENT_BONUS = 0.15;
/** Confidence points per enriched document (capped by MAX_ENRICHMENT_BONUS) */
const CONFIDENCE_PER_ENRICHED_DOC = 0.03;
/** Penalty when EU stakeholder has no fpm documents (low direct evidence) */
const EU_NO_DATA_PENALTY = -0.05;
/** Absolute maximum confidence (no analysis is 100% certain) */
const MAX_CONFIDENCE = 0.95;
/** Absolute minimum confidence (always some baseline reasoning possible) */
const MIN_CONFIDENCE = 0.40;

function computeConfidence(docs: RawDocument[], perspective: StakeholderPerspective): number {
  const docBonus = Math.min(MAX_DOC_VOLUME_BONUS, docs.length * CONFIDENCE_PER_DOC);
  const enriched = docs.filter(d => d.contentFetched || (d.fullText && d.fullText.length > 100)).length;
  const enrichedBonus = Math.min(MAX_ENRICHMENT_BONUS, enriched * CONFIDENCE_PER_ENRICHED_DOC);

  // EU stakeholder gets slightly lower confidence when there are no fpm docs
  const euPenalty = perspective === 'eu-international' && docs.filter(d => (d.doktyp || d.documentType) === 'fpm').length === 0 ? EU_NO_DATA_PENALTY : 0;

  return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, BASE_CONFIDENCE + docBonus + enrichedBonus + euPenalty));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build AI-driven SWOT analyses for all 6 stakeholder perspectives.
 *
 * Returns `StakeholderSwot[]` ready for `generateStakeholderSwotSection()`.
 * Each entry contains `AISwotEntry`-shaped data (which is compatible with the
 * base `SwotEntry` shape used by the renderer).
 *
 * @param docs  - Parliamentary documents relevant to the analysis topic
 * @param topic - Focus topic for contextual framing (may be null)
 * @param lang  - Target language for stakeholder names and roles
 */
export function buildAISwotStakeholders(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): StakeholderSwot[] {
  const perspectives: StakeholderPerspective[] = [
    'government-coalition',
    'opposition',
    'eu-international',
    'private-sector',
    'civil-society',
    'citizens-voters',
  ];

  const builders: Record<StakeholderPerspective, () => Pick<AISwotAnalysis, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'>> = {
    'government-coalition': () => buildGovernmentSwot(docs, topic, lang),
    opposition:             () => buildOppositionSwot(docs, topic, lang),
    'eu-international':     () => buildEUInternationalSwot(docs, topic, lang),
    'private-sector':       () => buildPrivateSectorSwot(docs, topic, lang),
    'civil-society':        () => buildCivilSocietySwot(docs, topic, lang),
    'citizens-voters':      () => buildCitizensSwot(docs, topic, lang),
  };

  const crossRefs = buildCrossReferences(docs, topic);

  return perspectives.map(p => {
    const name = STAKEHOLDER_NAMES[p][lang] ?? STAKEHOLDER_NAMES[p].en!;
    const role = STAKEHOLDER_ROLES[p][lang] ?? STAKEHOLDER_ROLES[p].en!;
    const swotData = builders[p]();
    const confidence = computeConfidence(docs, p);

    // Attach confidence and crossReferences as context metadata
    const contextParts: string[] = [];
    contextParts.push(`Confidence: ${Math.round(confidence * 100)}%`);
    const ownRefs = crossRefs.filter(r => r.fromStakeholder === p || r.toStakeholder === p);
    if (ownRefs.length > 0) {
      contextParts.push(`Cross-references: ${ownRefs.length}`);
    }

    return {
      name,
      role,
      swot: {
        strengths: swotData.strengths,
        weaknesses: swotData.weaknesses,
        opportunities: swotData.opportunities,
        threats: swotData.threats,
        context: contextParts.join(' | '),
      },
    };
  });
}
