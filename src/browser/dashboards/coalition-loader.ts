/**
 * @module Dashboards/Coalition
 * @category Political Analysis - Coalition Dynamics & Party Behavior
 *
 * Coalition Status Intelligence & Party Dynamics Analyzer.
 *
 * Real-time intelligence module for monitoring Swedish coalition formations,
 * party membership dynamics, leadership roles, and political alignment patterns.
 * Provides strategic assessment of the Tidö Agreement coalition (October 2022-)
 * and comprehensive party-level metrics across all 8 Riksdag parties.
 *
 * ## Data Sources (CIA Platform CSVs)
 *
 * - `view_riksdagen_party_summary_sample.csv`
 * - `view_riksdagen_party_role_member_sample.csv`
 * - `view_riksdagen_politician_sample.csv`
 * - `view_riksdagen_politician_experience_summary_sample.csv`
 *
 * @author Hack23 AB - Coalition Intelligence Unit
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024
 * @see {@link https://github.com/Hack23/cia|CIA Platform Data Pipeline}

 *
 * @intelligence Coalition Intelligence Acquisition Module — real-time monitoring of Swedish coalition formations (Tidö Agreement 2022-), party membership dynamics, leadership role analysis, and political alignment patterns. Provides strategic assessment of coalition stability and party-level behavioral metrics across all 8 Riksdag parties.
 *
 * @business Predictive intelligence asset — coalition dynamics data is uniquely valuable for political risk consulting, corporate government affairs teams, and financial institutions assessing regulatory stability. Foundation for premium alerting service (coalition changes, leadership shifts).
 *
 * @marketing Breaking news fuel — coalition changes are high-impact political events generating significant media coverage. Real-time coalition monitoring enables Riksdagsmonitor to be first-to-report, driving traffic and establishing authority as a political intelligence source.
 * */

import {
  createChart,
  initDashboardSection,
  loadCSV,
  createDataSource,
  logger,
  formatNumber,
  formatPercent,
  getResponsiveOptions,
  addChartKeyboardNav,
  detectLanguage,
  showLoadingState,
  showErrorState,
  hideStateOverlays,
} from '../shared/index.js';

import type { CSVRow } from '../shared/index.js';

// ============================================================================
// INTERFACES
// ============================================================================

/** Configuration for coalition data sources and caching. */
interface CoalitionConfig {
  readonly githubRawBase: string;
  readonly dataSources: Readonly<{
    partySummary: string;
    partyRoles: string;
    politicianData: string;
    experienceData: string;
  }>;
  readonly freshnessThreshold: number;
  readonly cachePrefix: string;
  readonly retryDelay: number;
  readonly maxRetries: number;
}

/** Party metadata with official names and colors. */
interface PartyInfo {
  readonly name: string;
  readonly nameShort: string;
  readonly color: string;
  readonly fullName: string;
}

/** Coalition UI translation strings for a single locale. */
interface CoalitionTranslations {
  readonly coalitionTitle: string;
  readonly coalitionStatus: string;
  readonly parliamentSeats: string;
  readonly governmentMembers: string;
  readonly partyAssignments: string;
  readonly leader: string;
  readonly groupLeader: string;
  readonly yearsInPolitics: string;
  readonly totalDocuments: string;
  readonly activityLevel: string;
  readonly specialization: string;
  readonly partyFocused: string;
  readonly committeeFocused: string;
  readonly loadingMessage: string;
  readonly errorMessage: string;
  readonly dataAttribution: string;
  readonly lastUpdated: string;
}

/** Basic leader information extracted from role data. */
interface LeaderInfo {
  name: string;
  roleType: 'leader' | 'groupLeader';
  personId: string | null;
}

/** Enhanced leader info with experience details. */
interface EnhancedLeaderInfo extends LeaderInfo {
  yearsInPolitics?: number;
  totalDocuments?: number;
  activityLevel?: string;
  specialization?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG: CoalitionConfig = {
  githubRawBase:
    'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data',
  dataSources: {
    partySummary: 'view_riksdagen_party_summary_sample.csv',
    partyRoles: 'view_riksdagen_party_role_member_sample.csv',
    politicianData: 'view_riksdagen_politician_sample.csv',
    experienceData: 'view_riksdagen_politician_experience_summary_sample.csv',
  },
  freshnessThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days
  cachePrefix: 'coalition_data_',
  retryDelay: 2000,
  maxRetries: 3,
};

const PARTY_INFO: Record<string, PartyInfo> = {
  S: { name: 'Social Democrats', nameShort: 'S', color: '#E8112d', fullName: 'Socialdemokraterna' },
  M: { name: 'Moderates', nameShort: 'M', color: '#52BDEC', fullName: 'Moderaterna' },
  SD: { name: 'Sweden Democrats', nameShort: 'SD', color: '#DDDD00', fullName: 'Sverigedemokraterna' },
  C: { name: 'Centre Party', nameShort: 'C', color: '#009933', fullName: 'Centerpartiet' },
  V: { name: 'Left Party', nameShort: 'V', color: '#DA291C', fullName: 'Vänsterpartiet' },
  KD: { name: 'Christian Democrats', nameShort: 'KD', color: '#000077', fullName: 'Kristdemokraterna' },
  L: { name: 'Liberals', nameShort: 'L', color: '#006AB3', fullName: 'Liberalerna' },
  MP: { name: 'Green Party', nameShort: 'MP', color: '#83CF39', fullName: 'Miljöpartiet' },
};

// ============================================================================
// TRANSLATIONS
// ============================================================================

const TRANSLATIONS: Record<string, CoalitionTranslations> = {
  en: {
    coalitionTitle: 'Current Coalition: Tidö Agreement',
    coalitionStatus: 'Formation: October 2022 | Status: Active',
    parliamentSeats: 'Parliament seats',
    governmentMembers: 'Government members',
    partyAssignments: 'Party assignments',
    leader: 'Leader',
    groupLeader: 'Group Leader',
    yearsInPolitics: 'Years in politics',
    totalDocuments: 'Documents authored',
    activityLevel: 'Activity level',
    specialization: 'Focus area',
    partyFocused: 'Party-focused',
    committeeFocused: 'Committee-focused',
    loadingMessage: 'Loading coalition data...',
    errorMessage: 'Unable to load coalition data',
    dataAttribution: 'Data from CIA Platform',
    lastUpdated: 'Last Updated',
  },
  sv: {
    coalitionTitle: 'Nuvarande koalition: Tidöavtalet',
    coalitionStatus: 'Bildande: oktober 2022 | Status: Aktiv',
    parliamentSeats: 'Riksdagsmandat',
    governmentMembers: 'Regeringsmedlemmar',
    partyAssignments: 'Partiuppdrag',
    leader: 'Partiledare',
    groupLeader: 'Gruppledare',
    yearsInPolitics: 'År i politiken',
    totalDocuments: 'Dokument författade',
    activityLevel: 'Aktivitetsnivå',
    specialization: 'Fokusområde',
    partyFocused: 'Partifokuserad',
    committeeFocused: 'Utskottsfokuserad',
    loadingMessage: 'Laddar koalitionsdata...',
    errorMessage: 'Kunde inte ladda koalitionsdata',
    dataAttribution: 'Data från CIA-plattformen',
    lastUpdated: 'Senast uppdaterad',
  },
  da: {
    coalitionTitle: 'Nuværende koalition: Tidö-aftalen',
    coalitionStatus: 'Dannelse: oktober 2022 | Status: Aktiv',
    parliamentSeats: 'Rigsdagsmandater',
    governmentMembers: 'Regeringsmedlemmer',
    partyAssignments: 'Partiopgaver',
    leader: 'Leder',
    groupLeader: 'Gruppeleder',
    yearsInPolitics: 'År i politik',
    totalDocuments: 'Dokumenter forfattet',
    activityLevel: 'Aktivitetsniveau',
    specialization: 'Fokusområde',
    partyFocused: 'Partifokuseret',
    committeeFocused: 'Udvalgsfokuseret',
    loadingMessage: 'Indlæser koalitionsdata...',
    errorMessage: 'Kunne ikke indlæse koalitionsdata',
    dataAttribution: 'Data fra CIA-platformen',
    lastUpdated: 'Senest opdateret',
  },
  no: {
    coalitionTitle: 'Nåværende koalisjon: Tidö-avtalen',
    coalitionStatus: 'Dannelse: oktober 2022 | Status: Aktiv',
    parliamentSeats: 'Riksdagsmandater',
    governmentMembers: 'Regjeringsmedlemmer',
    partyAssignments: 'Partioppgaver',
    leader: 'Leder',
    groupLeader: 'Gruppeleder',
    yearsInPolitics: 'År i politikken',
    totalDocuments: 'Dokumenter forfattet',
    activityLevel: 'Aktivitetsnivå',
    specialization: 'Fokusområde',
    partyFocused: 'Partifokusert',
    committeeFocused: 'Komitéfokusert',
    loadingMessage: 'Laster koalisjonsdata...',
    errorMessage: 'Kunne ikke laste koalisjonsdata',
    dataAttribution: 'Data fra CIA-plattformen',
    lastUpdated: 'Sist oppdatert',
  },
  de: {
    coalitionTitle: 'Aktuelle Koalition: Tidö-Vereinbarung',
    coalitionStatus: 'Bildung: Oktober 2022 | Status: Aktiv',
    parliamentSeats: 'Sitze im schwedischen Reichstag',
    governmentMembers: 'Regierungsmitglieder',
    partyAssignments: 'Parteiaufgaben',
    leader: 'Vorsitzender',
    groupLeader: 'Fraktionsvorsitzender',
    yearsInPolitics: 'Jahre in der Politik',
    totalDocuments: 'Verfasste Dokumente',
    activityLevel: 'Aktivitätsniveau',
    specialization: 'Schwerpunktbereich',
    partyFocused: 'Parteifokussiert',
    committeeFocused: 'Ausschussfokussiert',
    loadingMessage: 'Koalitionsdaten werden geladen...',
    errorMessage: 'Koalitionsdaten konnten nicht geladen werden',
    dataAttribution: 'Daten von der CIA-Plattform',
    lastUpdated: 'Zuletzt aktualisiert',
  },
  fr: {
    coalitionTitle: 'Coalition actuelle : Accord de Tidö',
    coalitionStatus: 'Formation : octobre 2022 | Statut : Actif',
    parliamentSeats: 'Sièges au Riksdag suédois',
    governmentMembers: 'Membres du gouvernement',
    partyAssignments: 'Affectations de parti',
    leader: 'Chef',
    groupLeader: 'Chef de groupe',
    yearsInPolitics: 'Années en politique',
    totalDocuments: 'Documents rédigés',
    activityLevel: "Niveau d'activité",
    specialization: "Domaine d'expertise",
    partyFocused: 'Axé parti',
    committeeFocused: 'Axé comité',
    loadingMessage: 'Chargement des données de coalition...',
    errorMessage: 'Impossible de charger les données de coalition',
    dataAttribution: 'Données de la plateforme CIA',
    lastUpdated: 'Dernière mise à jour',
  },
  es: {
    coalitionTitle: 'Coalición actual: Acuerdo de Tidö',
    coalitionStatus: 'Formación: octubre 2022 | Estado: Activo',
    parliamentSeats: 'Escaños del Riksdag sueco',
    governmentMembers: 'Miembros del gobierno',
    partyAssignments: 'Asignaciones de partido',
    leader: 'Líder',
    groupLeader: 'Líder del grupo',
    yearsInPolitics: 'Años en política',
    totalDocuments: 'Documentos escritos',
    activityLevel: 'Nivel de actividad',
    specialization: 'Área de enfoque',
    partyFocused: 'Enfocado en partido',
    committeeFocused: 'Enfocado en comité',
    loadingMessage: 'Cargando datos de coalición...',
    errorMessage: 'No se pudieron cargar los datos de coalición',
    dataAttribution: 'Datos de la plataforma CIA',
    lastUpdated: 'Última actualización',
  },
  fi: {
    coalitionTitle: 'Nykyinen koalitio: Tidö-sopimus',
    coalitionStatus: 'Muodostus: lokakuu 2022 | Tila: Aktiivinen',
    parliamentSeats: 'Riksdagin paikat',
    governmentMembers: 'Hallituksen jäseniä',
    partyAssignments: 'Puoluetehtävät',
    leader: 'Johtaja',
    groupLeader: 'Ryhmänjohtaja',
    yearsInPolitics: 'Vuotta politiikassa',
    totalDocuments: 'Kirjoitettuja asiakirjoja',
    activityLevel: 'Aktiivisuustaso',
    specialization: 'Painopistealue',
    partyFocused: 'Puoluepainotteinen',
    committeeFocused: 'Valiokuntapainotteinen',
    loadingMessage: 'Ladataan koalitiotietoja...',
    errorMessage: 'Koalitiotietoja ei voitu ladata',
    dataAttribution: 'Tiedot CIA-alustalta',
    lastUpdated: 'Viimeksi päivitetty',
  },
  nl: {
    coalitionTitle: 'Huidige coalitie: Tidö-akkoord',
    coalitionStatus: 'Vorming: oktober 2022 | Status: Actief',
    parliamentSeats: 'Zetels in het Zweedse Rijksdag',
    governmentMembers: 'Regeringsleden',
    partyAssignments: 'Partijfuncties',
    leader: 'Leider',
    groupLeader: 'Fractievoorzitter',
    yearsInPolitics: 'Jaren in de politiek',
    totalDocuments: 'Geschreven documenten',
    activityLevel: 'Activiteitsniveau',
    specialization: 'Focusgebied',
    partyFocused: 'Partijgericht',
    committeeFocused: 'Commissiegericht',
    loadingMessage: 'Coalitiegegevens laden...',
    errorMessage: 'Kan coalitiegegevens niet laden',
    dataAttribution: 'Gegevens van het CIA-platform',
    lastUpdated: 'Laatst bijgewerkt',
  },
  ar: {
    coalitionTitle: 'الائتلاف الحالي: اتفاقية تيدو',
    coalitionStatus: 'التشكيل: أكتوبر 2022 | الحالة: نشط',
    parliamentSeats: 'مقاعد البرلمان',
    governmentMembers: 'أعضاء الحكومة',
    partyAssignments: 'مهام الحزب',
    leader: 'القائد',
    groupLeader: 'قائد المجموعة',
    yearsInPolitics: 'سنوات في السياسة',
    totalDocuments: 'الوثائق المكتوبة',
    activityLevel: 'مستوى النشاط',
    specialization: 'مجال التركيز',
    partyFocused: 'التركيز على الحزب',
    committeeFocused: 'التركيز على اللجنة',
    loadingMessage: 'جاري تحميل بيانات الائتلاف...',
    errorMessage: 'تعذر تحميل بيانات الائتلاف',
    dataAttribution: 'البيانات من منصة CIA',
    lastUpdated: 'آخر تحديث',
  },
  he: {
    coalitionTitle: 'קואליציה נוכחית: הסכם טידו',
    coalitionStatus: 'הקמה: אוקטובר 2022 | סטטוס: פעיל',
    parliamentSeats: 'מושבי פרלמנט',
    governmentMembers: 'חברי ממשלה',
    partyAssignments: 'משימות מפלגה',
    leader: 'מנהיג',
    groupLeader: 'מנהיג הקבוצה',
    yearsInPolitics: 'שנים בפוליטיקה',
    totalDocuments: 'מסמכים שנכתבו',
    activityLevel: 'רמת פעילות',
    specialization: 'תחום התמחות',
    partyFocused: 'ממוקד מפלגה',
    committeeFocused: 'ממוקד וועדה',
    loadingMessage: 'טוען נתוני קואליציה...',
    errorMessage: 'לא ניתן לטעון נתוני קואליציה',
    dataAttribution: 'נתונים מפלטפורמת CIA',
    lastUpdated: 'עודכן לאחרונה',
  },
  ja: {
    coalitionTitle: '現在の連立：ティドー協定',
    coalitionStatus: '形成：2022年10月 | ステータス：アクティブ',
    parliamentSeats: '国会議席',
    governmentMembers: '政府メンバー',
    partyAssignments: '党の任務',
    leader: 'リーダー',
    groupLeader: 'グループリーダー',
    yearsInPolitics: '政治活動年数',
    totalDocuments: '作成文書',
    activityLevel: '活動レベル',
    specialization: '専門分野',
    partyFocused: '政党重視',
    committeeFocused: '委員会重視',
    loadingMessage: '連立データを読み込んでいます...',
    errorMessage: '連立データを読み込めませんでした',
    dataAttribution: 'CIAプラットフォームのデータ',
    lastUpdated: '最終更新',
  },
  ko: {
    coalitionTitle: '현재 연립: 티도 협정',
    coalitionStatus: '구성: 2022년 10월 | 상태: 활성',
    parliamentSeats: '의회 의석',
    governmentMembers: '정부 구성원',
    partyAssignments: '당 임무',
    leader: '리더',
    groupLeader: '그룹 리더',
    yearsInPolitics: '정치 경력',
    totalDocuments: '작성 문서',
    activityLevel: '활동 수준',
    specialization: '전문 분야',
    partyFocused: '정당 중심',
    committeeFocused: '위원회 중심',
    loadingMessage: '연립 데이터 로드 중...',
    errorMessage: '연립 데이터를 로드할 수 없습니다',
    dataAttribution: 'CIA 플랫폼의 데이터',
    lastUpdated: '마지막 업데이트',
  },
  zh: {
    coalitionTitle: '当前联盟：蒂德协议',
    coalitionStatus: '成立：2022年10月 | 状态：活跃',
    parliamentSeats: '议会席位',
    governmentMembers: '政府成员',
    partyAssignments: '党派任务',
    leader: '领导',
    groupLeader: '团队领导',
    yearsInPolitics: '从政年数',
    totalDocuments: '撰写文件',
    activityLevel: '活动水平',
    specialization: '专注领域',
    partyFocused: '政党导向',
    committeeFocused: '委员会导向',
    loadingMessage: '正在加载联盟数据...',
    errorMessage: '无法加载联盟数据',
    dataAttribution: '来自CIA平台的数据',
    lastUpdated: '最后更新',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function getTranslations(): CoalitionTranslations {
  const lang = detectLanguage();
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const data: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;
    const row: CSVRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx].trim();
    });
    data.push(row);
  }
  return data;
}

// ============================================================================
// CACHE
// ============================================================================

function isCacheFresh(key: string): boolean {
  try {
    const cached = localStorage.getItem(CONFIG.cachePrefix + key);
    if (!cached) return false;
    const data = JSON.parse(cached);
    return Date.now() - data.timestamp < CONFIG.freshnessThreshold;
  } catch {
    return false;
  }
}

function getCachedData(key: string): CSVRow[] | null {
  try {
    if (!isCacheFresh(key)) return null;
    const cached = localStorage.getItem(CONFIG.cachePrefix + key);
    return cached ? JSON.parse(cached).data : null;
  } catch {
    return null;
  }
}

function setCachedData(key: string, data: CSVRow[]): void {
  try {
    localStorage.setItem(
      CONFIG.cachePrefix + key,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch (e) {
    logger.warn('Cache storage error:', e);
  }
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchCSVRetry(filename: string, retryCount = 0): Promise<string> {
  const url = `${CONFIG.githubRawBase}/${filename}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.text();
  } catch (error) {
    if (retryCount < CONFIG.maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, CONFIG.retryDelay));
      return fetchCSVRetry(filename, retryCount + 1);
    }
    throw error;
  }
}

async function loadPartySummary(): Promise<CSVRow[]> {
  const cached = getCachedData('party_summary');
  if (cached) return cached;

  const csvText = await fetchCSVRetry(CONFIG.dataSources.partySummary);
  const data = parseCSV(csvText);
  const active = data.filter((row) => row.active === 't');
  setCachedData('party_summary', active);
  return active;
}

async function loadPartyRoles(): Promise<CSVRow[]> {
  const cached = getCachedData('party_roles');
  if (cached) return cached;

  const csvText = await fetchCSVRetry(CONFIG.dataSources.partyRoles);
  const data = parseCSV(csvText);
  const leaders = data.filter(
    (row) =>
      row.active === 't' &&
      (row.role_code === 'Partiledare' || row.role_code === 'Gruppledare'),
  );
  setCachedData('party_roles', leaders);
  return leaders;
}

async function loadPoliticianData(): Promise<CSVRow[]> {
  const cached = getCachedData('politician_data');
  if (cached) return cached;

  const csvText = await fetchCSVRetry(CONFIG.dataSources.politicianData);
  const data = parseCSV(csvText);
  setCachedData('politician_data', data);
  return data;
}

async function loadExperienceData(): Promise<CSVRow[]> {
  const cached = getCachedData('experience_data');
  if (cached) return cached;

  const csvText = await fetchCSVRetry(CONFIG.dataSources.experienceData);
  const data = parseCSV(csvText);
  setCachedData('experience_data', data);
  return data;
}

// ============================================================================
// LEADER INFO
// ============================================================================

function getPartyLeader(roleData: CSVRow[], partyCode: string): LeaderInfo {
  const partyLeader = roleData.find(
    (row) => row.party === partyCode && row.role_code === 'Partiledare',
  );
  if (partyLeader) {
    return {
      name: `${partyLeader.first_name} ${partyLeader.last_name}`,
      roleType: 'leader',
      personId: (partyLeader.person_id as string) || null,
    };
  }

  const groupLeader = roleData.find(
    (row) => row.party === partyCode && row.role_code === 'Gruppledare',
  );
  if (groupLeader) {
    return {
      name: `${groupLeader.first_name} ${groupLeader.last_name}`,
      roleType: 'groupLeader',
      personId: (groupLeader.person_id as string) || null,
    };
  }

  return { name: 'Unknown', roleType: 'leader', personId: null };
}

function getEnhancedLeaderInfo(
  leader: LeaderInfo,
  politicianData: CSVRow[],
  _experienceData: CSVRow[],
): EnhancedLeaderInfo {
  if (!leader.personId) return leader;

  const politician = politicianData.find((p) => p.person_id === leader.personId);
  if (!politician) return leader;

  const firstDate = new Date(politician.first_assignment_date as string);
  const yearsInPolitics = Math.floor(
    (Date.now() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );

  const totalDocs = parseInt(politician.total_documents as string, 10) || 0;
  const activityLevel = (politician.doc_activity_level as string) || 'Unknown';

  const partyDocs = parseInt(politician.party_motions as string, 10) || 0;
  const committeeDocs = parseInt(politician.committee_motions as string, 10) || 0;
  let specialization = 'Balanced';
  if (partyDocs > committeeDocs * 2) specialization = 'Party-focused';
  else if (committeeDocs > partyDocs * 2) specialization = 'Committee-focused';

  return {
    ...leader,
    yearsInPolitics,
    totalDocuments: totalDocs,
    activityLevel,
    specialization,
  };
}

// ============================================================================
// RENDERING
// ============================================================================

function renderCoalition(
  partySummary: CSVRow[],
  partyRoles: CSVRow[],
  politicianData: CSVRow[] = [],
  experienceData: CSVRow[] = [],
): void {
  const container = document.getElementById('coalition-status');
  if (!container) {
    logger.error('Coalition status container not found');
    return;
  }

  const t = getTranslations();
  const cardsContainer = container.querySelector('.cards') as HTMLElement | null;
  if (!cardsContainer) {
    logger.error('Cards container not found');
    return;
  }

  cardsContainer.innerHTML = '';

  const knownParties = partySummary.filter((party) => PARTY_INFO[party.party as string]);
  const sortedParties = [...knownParties].sort((a, b) => {
    const seatsA = parseInt(a.total_active_parliament as string, 10) || 0;
    const seatsB = parseInt(b.total_active_parliament as string, 10) || 0;
    return seatsB - seatsA;
  });

  const totalSeats = sortedParties.reduce(
    (sum, party) => sum + (parseInt(party.total_active_parliament as string, 10) || 0),
    0,
  );

  sortedParties.forEach((party) => {
    const partyCode = party.party as string;
    const partyInfo = PARTY_INFO[partyCode];
    if (!partyInfo) return;

    const parliamentSeats = parseInt(party.total_active_parliament as string, 10) || 0;
    const governmentMembers = parseInt(party.total_active_government as string, 10) || 0;
    const partyAssignments = parseInt(party.current_party_assignments as string, 10) || 0;

    const basicLeader = getPartyLeader(partyRoles, partyCode);
    const leader = getEnhancedLeaderInfo(basicLeader, politicianData, experienceData);
    const leaderLabel = t[leader.roleType] || t.leader;

    const card = document.createElement('div');
    card.className = 'card';

    const scanner = document.createElement('div');
    scanner.className = 'scanner-effect';
    card.appendChild(scanner);

    const heading = document.createElement('h3');
    heading.textContent = `${partyInfo.name} (${partyCode})`;
    card.appendChild(heading);

    const partyStats = document.createElement('div');
    partyStats.className = 'party-stats';

    const seatsP = document.createElement('p');
    const seatsStrong = document.createElement('strong');
    seatsStrong.textContent = `${parliamentSeats} ${t.parliamentSeats}`;
    seatsP.appendChild(seatsStrong);
    partyStats.appendChild(seatsP);

    if (governmentMembers > 0) {
      const govP = document.createElement('p');
      govP.textContent = `${governmentMembers} ${t.governmentMembers}`;
      partyStats.appendChild(govP);
    }

    const assignmentsP = document.createElement('p');
    assignmentsP.textContent = `${partyAssignments} ${t.partyAssignments}`;
    partyStats.appendChild(assignmentsP);
    card.appendChild(partyStats);

    const leaderSection = document.createElement('div');
    leaderSection.className = 'party-leader';

    const leaderName = document.createElement('p');
    const leaderStrong = document.createElement('strong');
    leaderStrong.textContent = `${leaderLabel}:`;
    leaderName.appendChild(leaderStrong);
    leaderName.appendChild(document.createTextNode(` ${leader.name}`));
    leaderSection.appendChild(leaderName);

    if (leader.yearsInPolitics !== undefined) {
      const leaderDetails = document.createElement('div');
      leaderDetails.className = 'leader-details';
      leaderDetails.style.fontSize = '0.9em';
      leaderDetails.style.marginTop = '0.5rem';

      const yearsP = document.createElement('p');
      yearsP.textContent = `${t.yearsInPolitics}: ${leader.yearsInPolitics}`;
      yearsP.style.margin = '0.25rem 0';
      leaderDetails.appendChild(yearsP);

      if (leader.totalDocuments && leader.totalDocuments > 0) {
        const docsP = document.createElement('p');
        docsP.textContent = `${t.totalDocuments}: ${leader.totalDocuments}`;
        docsP.style.margin = '0.25rem 0';
        leaderDetails.appendChild(docsP);
      }

      if (leader.activityLevel && leader.activityLevel !== 'Unknown') {
        const activityP = document.createElement('p');
        activityP.textContent = `${t.activityLevel}: ${leader.activityLevel}`;
        activityP.style.margin = '0.25rem 0';
        leaderDetails.appendChild(activityP);
      }

      if (leader.specialization && leader.specialization !== 'Balanced') {
        const specP = document.createElement('p');
        const specKey =
          leader.specialization === 'Party-focused' ? 'partyFocused' : 'committeeFocused';
        specP.textContent = `${t.specialization}: ${t[specKey as keyof CoalitionTranslations]}`;
        specP.style.margin = '0.25rem 0';
        leaderDetails.appendChild(specP);
      }

      leaderSection.appendChild(leaderDetails);
    }

    card.appendChild(leaderSection);
    cardsContainer.appendChild(card);
  });

  const statusP = container.querySelector('p');
  if (statusP) {
    statusP.textContent = `${t.coalitionStatus} | Total Seats: ${totalSeats} of 349`;
  }

  logger.debug(`Rendered ${sortedParties.length} active parties with ${totalSeats} total seats`);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Clear all coalition-related caches from localStorage.
 */
export function clearCache(): void {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(CONFIG.cachePrefix)) {
      localStorage.removeItem(key);
    }
  });
  logger.debug('Coalition cache cleared');
}

/**
 * Initialise the Coalition Status dashboard.
 *
 * Loads party summary, roles, politician, and experience data in parallel,
 * then renders coalition cards with leader information.
 */
export async function init(): Promise<void> {
  logger.debug('Initializing Coalition Loader...');

  const t = getTranslations();
  const container = document.getElementById('coalition-status');

  if (container) {
    const cardsContainer = container.querySelector('.cards');
    if (cardsContainer) {
      cardsContainer.innerHTML = `<p class="loading-message">${t.loadingMessage}</p>`;
    }
  }

  try {
    const [partySummary, partyRoles, politicianData, experienceData] = await Promise.all([
      loadPartySummary(),
      loadPartyRoles(),
      loadPoliticianData().catch((err) => {
        logger.warn('Could not load politician data:', err);
        return [] as CSVRow[];
      }),
      loadExperienceData().catch((err) => {
        logger.warn('Could not load experience data:', err);
        return [] as CSVRow[];
      }),
    ]);

    logger.debug('Loaded data:', {
      parties: partySummary.length,
      leaders: partyRoles.length,
      politicians: politicianData.length,
      experiences: experienceData.length,
    });

    renderCoalition(partySummary, partyRoles, politicianData, experienceData);

    logger.debug('✅ Coalition loader initialized successfully');
  } catch (error) {
    logger.error('Coalition loader error:', error);

    if (container) {
      const cardsContainer = container.querySelector('.cards');
      if (cardsContainer) {
        const errorP = document.createElement('p');
        errorP.className = 'error-message';
        errorP.textContent = `${t.errorMessage}: ${(error as Error).message}`;
        cardsContainer.innerHTML = '';
        cardsContainer.appendChild(errorP);
      }
    }
  }
}
