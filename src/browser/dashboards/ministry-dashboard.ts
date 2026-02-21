/**
 * @module Dashboards/Ministry
 * @category Intelligence Analysis - Executive Power Assessment & Ministerial Risk Profiling
 *
 * Swedish Government Ministry Risk Assessment & Executive Influence Intelligence Dashboard.
 *
 * Advanced intelligence analysis platform providing comprehensive ministerial risk profiling
 * and executive influence measurement for all Swedish government ministers. Implements
 * multi-dimensional risk scoring, influence hierarchies, productivity metrics, and
 * decision-impact assessment using D3.js heat maps and Chart.js analytics visualization.
 *
 * ## Visualization Suite
 *
 * 1. **Risk Heat Map** (D3.js bar) – per-ministry risk scores with color grading
 * 2. **Influence Ranking** (horizontal bar) – top-10 most influential ministers
 * 3. **Productivity Matrix** (grouped bar) – current vs previous quarter
 * 4. **Decision Impact Timeline** (line) – quarterly decision impact trends
 *
 * ## Data Sources (CIA Platform CSVs)
 *
 * - `distribution_ministry_risk_levels.csv`
 * - `distribution_ministry_productivity_matrix.csv`
 * - `percentile_politician_influence_metrics.csv`
 * - `distribution_ministry_decision_impact.csv`
 * - `distribution_ministry_effectiveness.csv`
 *
 * @author Hack23 AB - Executive Intelligence Team
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024
 * @see {@link https://github.com/Hack23/cia|CIA Platform Data Source}
 */

import {
  createChart,
  THEME_COLORS,
  CHART_PALETTE,
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

// D3 is loaded as a global <script> for DOM manipulation / SVG features
const d3 = (globalThis as any).d3;

// ============================================================================
// INTERFACES
// ============================================================================

/** Data-source configuration for ministry dashboard. */
interface MinistryDataSourceConfig {
  readonly localUrl: string;
  readonly remoteUrl: string;
  readonly files: Readonly<Record<string, string>>;
  readonly cacheExpiry: number;
}

/** Dashboard-level configuration. */
interface MinistryDashboardConfig {
  readonly dataSource: MinistryDataSourceConfig;
  readonly charts: Readonly<{ d3Version: string; chartJsVersion: string }>;
  readonly colors: Readonly<Record<string, string>>;
}

/** A single risk-level entry for the heat-map. */
interface RiskEntry {
  ministry: string;
  riskScore: string;
  alerts: number;
}

/** A single productivity entry per ministry. */
interface ProductivityEntry {
  ministry: string;
  currentQuarter: string;
  previousQuarter: string;
}

/** A single influence entry. */
interface InfluenceEntry {
  name: string;
  ministry: string;
  influence: number | string;
}

/** A single decision-impact entry. */
interface DecisionImpactEntry {
  ministry: string;
  period: string;
  impact: string;
}

/** Aggregated transformed data for chart rendering. */
interface TransformedMinistryData {
  riskLevels: RiskEntry[];
  productivity: ProductivityEntry[];
  influence: InfluenceEntry[];
  decisionImpact: DecisionImpactEntry[];
}

/** Ministry translation map for a single locale. */
interface MinistryTranslationMap {
  readonly [ministryName: string]: string;
}

/** UI translation strings for a single locale. */
interface MinistryUITranslations {
  readonly title: string;
  readonly riskHeatMap: string;
  readonly topInfluential: string;
  readonly productivity: string;
  readonly decisionImpact: string;
  readonly viewTable: string;
  readonly loading: string;
  readonly error: string;
  readonly riskLevel: string;
  readonly critical: string;
  readonly high: string;
  readonly medium: string;
  readonly low: string;
  readonly dataAttribution: string;
  readonly tableCaption?: string;
  readonly tableHeaders?: {
    readonly ministry: string;
    readonly riskScore: string;
    readonly riskLevel: string;
    readonly productivity: string;
  };
}

/** Cache item with expiry. */
interface CacheItem<T> {
  data: T;
  expiry: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG: MinistryDashboardConfig = {
  dataSource: {
    localUrl: 'cia-data/ministry/',
    remoteUrl:
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/',
    files: {
      riskLevels: 'distribution_ministry_risk_levels.csv',
      productivity: 'distribution_ministry_productivity_matrix.csv',
      influence: 'percentile_politician_influence_metrics.csv',
      decisionImpact: 'distribution_ministry_decision_impact.csv',
      effectiveness: 'distribution_ministry_effectiveness.csv',
      riskQuarterly: 'distribution_ministry_risk_quarterly.csv',
      influenceView:
        '../politician/view_riksdagen_politician_influence_metrics_sample.csv',
      productivityView: 'view_ministry_productivity_matrix_sample.csv',
      riskEvolution: 'view_ministry_risk_evolution_sample.csv',
    },
    cacheExpiry: 3_600_000, // 1 hour
  },
  charts: {
    d3Version: '7.8.5',
    chartJsVersion: '4.4.1',
  },
  colors: {
    riskCritical: '#d32f2f',
    riskHigh: '#f57c00',
    riskMedium: '#fbc02d',
    riskLow: '#388e3c',
    primary: '#006633',
    accent: '#00cc66',
  },
};

// ============================================================================
// TRANSLATIONS
// ============================================================================

const MINISTRY_TRANSLATIONS: Record<string, MinistryTranslationMap> = {
  en: {
    Finansdepartementet: 'Ministry of Finance',
    Utrikesdepartementet: 'Ministry of Foreign Affairs',
    Försvarsdepartementet: 'Ministry of Defence',
    Justitiedepartementet: 'Ministry of Justice',
    Socialdepartementet: 'Ministry of Health and Social Affairs',
    Utbildningsdepartementet: 'Ministry of Education',
    Näringsdepartementet: 'Ministry of Enterprise',
    Miljödepartementet: 'Ministry of Environment',
    Kulturdepartementet: 'Ministry of Culture',
    Infrastrukturdepartementet: 'Ministry of Infrastructure',
  },
  sv: {
    Finansdepartementet: 'Finansdepartementet',
    Utrikesdepartementet: 'Utrikesdepartementet',
    Försvarsdepartementet: 'Försvarsdepartementet',
    Justitiedepartementet: 'Justitiedepartementet',
    Socialdepartementet: 'Socialdepartementet',
    Utbildningsdepartementet: 'Utbildningsdepartementet',
    Näringsdepartementet: 'Näringsdepartementet',
    Miljödepartementet: 'Miljödepartementet',
    Kulturdepartementet: 'Kulturdepartementet',
    Infrastrukturdepartementet: 'Infrastrukturdepartementet',
  },
  da: {
    Finansdepartementet: 'Finansministeriet',
    Utrikesdepartementet: 'Udenrigsministeriet',
    Försvarsdepartementet: 'Forsvarsministeriet',
    Justitiedepartementet: 'Justitsministeriet',
    Socialdepartementet: 'Social- og Sundhedsministeriet',
    Utbildningsdepartementet: 'Undervisningsministeriet',
    Näringsdepartementet: 'Erhvervsministeriet',
    Miljödepartementet: 'Miljøministeriet',
    Kulturdepartementet: 'Kulturministeriet',
    Infrastrukturdepartementet: 'Infrastrukturministeriet',
  },
  no: {
    Finansdepartementet: 'Finansdepartementet',
    Utrikesdepartementet: 'Utenriksdepartementet',
    Försvarsdepartementet: 'Forsvarsdepartementet',
    Justitiedepartementet: 'Justis- og beredskapsdepartementet',
    Socialdepartementet: 'Helse- og omsorgsdepartementet',
    Utbildningsdepartementet: 'Kunnskapsdepartementet',
    Näringsdepartementet: 'Nærings- og fiskeridepartementet',
    Miljödepartementet: 'Klima- og miljødepartementet',
    Kulturdepartementet: 'Kulturdepartementet',
    Infrastrukturdepartementet: 'Samferdselsdepartementet',
  },
  fi: {
    Finansdepartementet: 'Valtiovarainministeriö',
    Utrikesdepartementet: 'Ulkoministeriö',
    Försvarsdepartementet: 'Puolustusministeriö',
    Justitiedepartementet: 'Oikeusministeriö',
    Socialdepartementet: 'Sosiaali- ja terveysministeriö',
    Utbildningsdepartementet: 'Opetus- ja kulttuuriministeriö',
    Näringsdepartementet: 'Työ- ja elinkeinoministeriö',
    Miljödepartementet: 'Ympäristöministeriö',
    Kulturdepartementet: 'Opetus- ja kulttuuriministeriö',
    Infrastrukturdepartementet: 'Liikenne- ja viestintäministeriö',
  },
  de: {
    Finansdepartementet: 'Finanzministerium',
    Utrikesdepartementet: 'Außenministerium',
    Försvarsdepartementet: 'Verteidigungsministerium',
    Justitiedepartementet: 'Justizministerium',
    Socialdepartementet: 'Ministerium für Gesundheit und Soziales',
    Utbildningsdepartementet: 'Bildungsministerium',
    Näringsdepartementet: 'Wirtschaftsministerium',
    Miljödepartementet: 'Umweltministerium',
    Kulturdepartementet: 'Kulturministerium',
    Infrastrukturdepartementet: 'Infrastrukturministerium',
  },
  fr: {
    Finansdepartementet: 'Ministère des Finances',
    Utrikesdepartementet: 'Ministère des Affaires étrangères',
    Försvarsdepartementet: 'Ministère de la Défense',
    Justitiedepartementet: 'Ministère de la Justice',
    Socialdepartementet: 'Ministère de la Santé et des Affaires sociales',
    Utbildningsdepartementet: "Ministère de l'Éducation",
    Näringsdepartementet: "Ministère de l'Entreprise",
    Miljödepartementet: "Ministère de l'Environnement",
    Kulturdepartementet: 'Ministère de la Culture',
    Infrastrukturdepartementet: "Ministère de l'Infrastructure",
  },
  es: {
    Finansdepartementet: 'Ministerio de Finanzas',
    Utrikesdepartementet: 'Ministerio de Asuntos Exteriores',
    Försvarsdepartementet: 'Ministerio de Defensa',
    Justitiedepartementet: 'Ministerio de Justicia',
    Socialdepartementet: 'Ministerio de Salud y Asuntos Sociales',
    Utbildningsdepartementet: 'Ministerio de Educación',
    Näringsdepartementet: 'Ministerio de Empresa',
    Miljödepartementet: 'Ministerio de Medio Ambiente',
    Kulturdepartementet: 'Ministerio de Cultura',
    Infrastrukturdepartementet: 'Ministerio de Infraestructura',
  },
  nl: {
    Finansdepartementet: 'Ministerie van Financiën',
    Utrikesdepartementet: 'Ministerie van Buitenlandse Zaken',
    Försvarsdepartementet: 'Ministerie van Defensie',
    Justitiedepartementet: 'Ministerie van Justitie',
    Socialdepartementet: 'Ministerie van Volksgezondheid en Sociale Zaken',
    Utbildningsdepartementet: 'Ministerie van Onderwijs',
    Näringsdepartementet: 'Ministerie van Economische Zaken',
    Miljödepartementet: 'Ministerie van Milieu',
    Kulturdepartementet: 'Ministerie van Cultuur',
    Infrastrukturdepartementet: 'Ministerie van Infrastructuur',
  },
  ar: {
    Finansdepartementet: 'وزارة المالية',
    Utrikesdepartementet: 'وزارة الخارجية',
    Försvarsdepartementet: 'وزارة الدفاع',
    Justitiedepartementet: 'وزارة العدل',
    Socialdepartementet: 'وزارة الصحة والشؤون الاجتماعية',
    Utbildningsdepartementet: 'وزارة التعليم',
    Näringsdepartementet: 'وزارة المؤسسات',
    Miljödepartementet: 'وزارة البيئة',
    Kulturdepartementet: 'وزارة الثقافة',
    Infrastrukturdepartementet: 'وزارة البنية التحتية',
  },
  he: {
    Finansdepartementet: 'משרד האוצר',
    Utrikesdepartementet: 'משרד החוץ',
    Försvarsdepartementet: 'משרד הביטחון',
    Justitiedepartementet: 'משרד המשפטים',
    Socialdepartementet: 'משרד הבריאות והרווחה',
    Utbildningsdepartementet: 'משרד החינוך',
    Näringsdepartementet: 'משרד הכלכלה',
    Miljödepartementet: 'משרד הסביבה',
    Kulturdepartementet: 'משרד התרבות',
    Infrastrukturdepartementet: 'משרד התשתיות',
  },
  ja: {
    Finansdepartementet: '財務省',
    Utrikesdepartementet: '外務省',
    Försvarsdepartementet: '防衛省',
    Justitiedepartementet: '法務省',
    Socialdepartementet: '厚生労働省',
    Utbildningsdepartementet: '文部科学省',
    Näringsdepartementet: '経済産業省',
    Miljödepartementet: '環境省',
    Kulturdepartementet: '文化省',
    Infrastrukturdepartementet: '国土交通省',
  },
  ko: {
    Finansdepartementet: '재무부',
    Utrikesdepartementet: '외교부',
    Försvarsdepartementet: '국방부',
    Justitiedepartementet: '법무부',
    Socialdepartementet: '보건복지부',
    Utbildningsdepartementet: '교육부',
    Näringsdepartementet: '산업통상자원부',
    Miljödepartementet: '환경부',
    Kulturdepartementet: '문화체육관광부',
    Infrastrukturdepartementet: '국토교통부',
  },
  zh: {
    Finansdepartementet: '财政部',
    Utrikesdepartementet: '外交部',
    Försvarsdepartementet: '国防部',
    Justitiedepartementet: '司法部',
    Socialdepartementet: '卫生与社会事务部',
    Utbildningsdepartementet: '教育部',
    Näringsdepartementet: '企业部',
    Miljödepartementet: '环境部',
    Kulturdepartementet: '文化部',
    Infrastrukturdepartementet: '基础设施部',
  },
};

const UI_TRANSLATIONS: Record<string, MinistryUITranslations> = {
  en: {
    title: 'Government Minister Risk & Influence',
    riskHeatMap: 'Ministry Risk Heat Map',
    topInfluential: 'Top 10 Most Influential Ministers',
    productivity: 'Ministry Productivity Matrix',
    decisionImpact: 'Decision Impact Trends',
    viewTable: 'View data as table',
    loading: 'Loading ministry data...',
    error: 'Error loading data. Please try again later.',
    riskLevel: 'Risk Level',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    dataAttribution: 'Data by CIA Platform',
    tableCaption: 'Government Ministry Risk and Productivity Data',
    tableHeaders: { ministry: 'Ministry', riskScore: 'Risk Score', riskLevel: 'Risk Level', productivity: 'Productivity' },
  },
  sv: {
    title: 'Statsrådens Risk & Inflytande',
    riskHeatMap: 'Departementens Riskkarta',
    topInfluential: 'Topp 10 Mest Inflytelserika Statsråd',
    productivity: 'Departementens Produktivitetsmatris',
    decisionImpact: 'Beslutseffektstrender',
    viewTable: 'Visa data som tabell',
    loading: 'Laddar departements data...',
    error: 'Fel vid inläsning av data. Försök igen senare.',
    riskLevel: 'Risknivå',
    critical: 'Kritisk',
    high: 'Hög',
    medium: 'Medel',
    low: 'Låg',
    dataAttribution: 'Data från CIA-plattformen',
    tableCaption: 'Regeringens Departments Risk och Produktivitetsdata',
    tableHeaders: { ministry: 'Departement', riskScore: 'Riskpoäng', riskLevel: 'Risknivå', productivity: 'Produktivitet' },
  },
  da: {
    title: 'Ministres Risiko & Indflydelse',
    riskHeatMap: 'Ministeriers Risikokort',
    topInfluential: 'Top 10 Mest Indflydelsesrige Ministre',
    productivity: 'Ministeriers Produktivitetsmatrix',
    decisionImpact: 'Beslutningseffekttendenser',
    viewTable: 'Vis data som tabel',
    loading: 'Indlæser ministerie data...',
    error: 'Fejl ved indlæsning af data. Prøv igen senere.',
    riskLevel: 'Risikoniveau',
    critical: 'Kritisk',
    high: 'Høj',
    medium: 'Medium',
    low: 'Lav',
    dataAttribution: 'Data af CIA Platform',
    tableCaption: 'Regerings Ministeriums Risiko og Produktivitetsdata',
    tableHeaders: { ministry: 'Ministerium', riskScore: 'Risikoscore', riskLevel: 'Risikoniveau', productivity: 'Produktivitet' },
  },
  no: {
    title: 'Statsråders Risiko & Innflytelse',
    riskHeatMap: 'Departementenes Risikokart',
    topInfluential: 'Topp 10 Mest Innflytelsesrike Statsråder',
    productivity: 'Departementenes Produktivitetsmatrise',
    decisionImpact: 'Beslutningstrendanalyse',
    viewTable: 'Vis data som tabell',
    loading: 'Laster departements data...',
    error: 'Feil ved lasting av data. Prøv igjen senere.',
    riskLevel: 'Risikonivå',
    critical: 'Kritisk',
    high: 'Høy',
    medium: 'Medium',
    low: 'Lav',
    dataAttribution: 'Data fra CIA Platform',
    tableCaption: 'Regjeringens Departements Risiko og Produktivitetsdata',
    tableHeaders: { ministry: 'Departement', riskScore: 'Risikoscore', riskLevel: 'Risikonivå', productivity: 'Produktivitet' },
  },
  fi: {
    title: 'Ministerien Riski & Vaikutusvalta',
    riskHeatMap: 'Ministeriöiden Riskikartta',
    topInfluential: 'Top 10 Vaikutusvaltaisinta Ministeriä',
    productivity: 'Ministeriöiden Tuottavuusmatriisi',
    decisionImpact: 'Päätösvaikutustrendit',
    viewTable: 'Näytä tiedot taulukkona',
    loading: 'Ladataan ministeriö tietoja...',
    error: 'Virhe tietojen lataamisessa. Yritä myöhemmin uudelleen.',
    riskLevel: 'Riskitaso',
    critical: 'Kriittinen',
    high: 'Korkea',
    medium: 'Keskitaso',
    low: 'Matala',
    dataAttribution: 'Tiedot CIA-alustalta',
  },
  de: {
    title: 'Ministerrisiko & Einfluss',
    riskHeatMap: 'Ministerium-Risikokarte',
    topInfluential: 'Top 10 Einflussreichste Minister',
    productivity: 'Ministerium-Produktivitätsmatrix',
    decisionImpact: 'Entscheidungswirkungstrends',
    viewTable: 'Daten als Tabelle anzeigen',
    loading: 'Ministeriumsdaten werden geladen...',
    error: 'Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.',
    riskLevel: 'Risikoniveau',
    critical: 'Kritisch',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    dataAttribution: 'Daten von CIA Platform',
  },
  fr: {
    title: 'Risque & Influence des Ministres',
    riskHeatMap: 'Carte des Risques Ministériels',
    topInfluential: 'Top 10 Ministres les Plus Influents',
    productivity: 'Matrice de Productivité Ministérielle',
    decisionImpact: "Tendances d'Impact des Décisions",
    viewTable: 'Afficher les données sous forme de tableau',
    loading: 'Chargement des données ministérielles...',
    error: 'Erreur lors du chargement des données. Veuillez réessayer plus tard.',
    riskLevel: 'Niveau de risque',
    critical: 'Critique',
    high: 'Élevé',
    medium: 'Moyen',
    low: 'Faible',
    dataAttribution: 'Données de la plateforme CIA',
    tableCaption: 'Données de Risque et de Productivité des Ministères',
    tableHeaders: { ministry: 'Ministère', riskScore: 'Score de Risque', riskLevel: 'Niveau de Risque', productivity: 'Productivité' },
  },
  es: {
    title: 'Riesgo e Influencia de Ministros',
    riskHeatMap: 'Mapa de Calor de Riesgo Ministerial',
    topInfluential: 'Top 10 Ministros Más Influyentes',
    productivity: 'Matriz de Productividad Ministerial',
    decisionImpact: 'Tendencias de Impacto de Decisiones',
    viewTable: 'Ver datos como tabla',
    loading: 'Cargando datos ministeriales...',
    error: 'Error al cargar datos. Por favor, inténtelo más tarde.',
    riskLevel: 'Nivel de riesgo',
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
    dataAttribution: 'Datos de CIA Platform',
  },
  nl: {
    title: 'Ministerrisico & Invloed',
    riskHeatMap: 'Ministerie Risicokaart',
    topInfluential: 'Top 10 Meest Invloedrijke Ministers',
    productivity: 'Ministerie Productiviteitsmatrix',
    decisionImpact: 'Besluitvormingsimpacttrends',
    viewTable: 'Gegevens als tabel weergeven',
    loading: 'Ministeriegegevens laden...',
    error: 'Fout bij het laden van gegevens. Probeer het later opnieuw.',
    riskLevel: 'Risiconiveau',
    critical: 'Kritiek',
    high: 'Hoog',
    medium: 'Gemiddeld',
    low: 'Laag',
    dataAttribution: 'Gegevens van CIA Platform',
    tableCaption: 'Regeringsministerie Risico- en Productiviteitsgegevens',
    tableHeaders: { ministry: 'Ministerie', riskScore: 'Risicoscore', riskLevel: 'Risiconiveau', productivity: 'Productiviteit' },
  },
  ar: {
    title: 'مخاطر وتأثير الوزراء',
    riskHeatMap: 'خريطة مخاطر الوزارات',
    topInfluential: 'أكثر 10 وزراء تأثيراً',
    productivity: 'مصفوفة إنتاجية الوزارات',
    decisionImpact: 'اتجاهات تأثير القرارات',
    viewTable: 'عرض البيانات كجدول',
    loading: 'جارٍ تحميل بيانات الوزارة...',
    error: 'خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.',
    riskLevel: 'مستوى المخاطر',
    critical: 'حرج',
    high: 'عالي',
    medium: 'متوسط',
    low: 'منخفض',
    dataAttribution: 'بيانات من منصة CIA',
    tableCaption: 'بيانات المخاطر والإنتاجية للوزارات الحكومية',
    tableHeaders: { ministry: 'الوزارة', riskScore: 'درجة المخاطر', riskLevel: 'مستوى المخاطر', productivity: 'الإنتاجية' },
  },
  he: {
    title: 'סיכון והשפעה של שרים',
    riskHeatMap: 'מפת סיכונים משרדית',
    topInfluential: '10 השרים המשפיעים ביותר',
    productivity: 'מטריצת פרודוקטיביות משרדית',
    decisionImpact: 'מגמות השפעת החלטות',
    viewTable: 'הצג נתונים כטבלה',
    loading: 'טוען נתוני משרד...',
    error: 'שגיאה בטעינת נתונים. אנא נסה שוב מאוחר יותר.',
    riskLevel: 'רמת סיכון',
    critical: 'קריטי',
    high: 'גבוה',
    medium: 'בינוני',
    low: 'נמוך',
    dataAttribution: 'נתונים מפלטפורמת CIA',
    tableCaption: 'נתוני סיכון ופרודוקטיביות של משרדי הממשלה',
    tableHeaders: { ministry: 'משרד', riskScore: 'ציון סיכון', riskLevel: 'רמת סיכון', productivity: 'פרודוקטיביות' },
  },
  ja: {
    title: '大臣のリスクと影響力',
    riskHeatMap: '省庁リスクヒートマップ',
    topInfluential: '最も影響力のある10人の大臣',
    productivity: '省庁生産性マトリックス',
    decisionImpact: '意思決定の影響トレンド',
    viewTable: 'テーブルとしてデータを表示',
    loading: '省庁データを読み込んでいます...',
    error: 'データの読み込みエラー。後でもう一度お試しください。',
    riskLevel: 'リスクレベル',
    critical: '重大',
    high: '高',
    medium: '中',
    low: '低',
    dataAttribution: 'CIAプラットフォームのデータ',
    tableCaption: '政府省庁のリスクと生産性データ',
    tableHeaders: { ministry: '省庁', riskScore: 'リスクスコア', riskLevel: 'リスクレベル', productivity: '生産性' },
  },
  ko: {
    title: '정부 장관 위험 및 영향력',
    riskHeatMap: '부처 위험 히트맵',
    topInfluential: '가장 영향력 있는 10명의 장관',
    productivity: '부처 생산성 매트릭스',
    decisionImpact: '결정 영향 트렌드',
    viewTable: '테이블로 데이터 보기',
    loading: '부처 데이터 로딩 중...',
    error: '데이터 로딩 오류. 나중에 다시 시도하십시오.',
    riskLevel: '위험 수준',
    critical: '심각',
    high: '높음',
    medium: '중간',
    low: '낮음',
    dataAttribution: 'CIA 플랫폼 데이터',
    tableCaption: '정부 부처 위험 및 생산성 데이터',
    tableHeaders: { ministry: '부처', riskScore: '위험 점수', riskLevel: '위험 수준', productivity: '생산성' },
  },
  zh: {
    title: '政府部长风险与影响力',
    riskHeatMap: '部委风险热图',
    topInfluential: '最具影响力的10位部长',
    productivity: '部委生产力矩阵',
    decisionImpact: '决策影响趋势',
    viewTable: '以表格形式查看数据',
    loading: '正在加载部委数据...',
    error: '加载数据时出错。请稍后再试。',
    riskLevel: '风险等级',
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低',
    dataAttribution: 'CIA平台数据',
    tableCaption: '政府部委风险和生产力数据',
    tableHeaders: { ministry: '部委', riskScore: '风险评分', riskLevel: '风险等级', productivity: '生产力' },
  },
};

// ============================================================================
// DATA CACHE
// ============================================================================

class DataCache {
  private cache = new Map<string, CacheItem<CSVRow[]>>();
  private readonly storageKey = 'ministryDashboardCache';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, CacheItem<CSVRow[]>>;
        for (const key of Object.keys(data)) {
          this.cache.set(key, data[key]);
        }
      }
    } catch (e) {
      logger.warn('Failed to load cache from storage:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, CacheItem<CSVRow[]>> = {};
      this.cache.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      logger.warn('Failed to save cache to storage:', e);
    }
  }

  get(key: string): CSVRow[] | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }
    return item.data;
  }

  set(key: string, data: CSVRow[]): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + CONFIG.dataSource.cacheExpiry,
    });
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
  }
}

// ============================================================================
// CSV PARSING
// ============================================================================

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const data: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  return data;
}

// ============================================================================
// DATA FETCHER
// ============================================================================

class DataFetcher {
  private cache = new DataCache();

  async fetchCSV(filename: string): Promise<CSVRow[]> {
    const cached = this.cache.get(filename);
    if (cached) return cached;

    const urls = [
      `${CONFIG.dataSource.localUrl}${filename}`,
      `${CONFIG.dataSource.remoteUrl}${filename}`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'GET', headers: { Accept: 'text/csv' } });
        if (!response.ok) continue;

        const text = await response.text();
        if (!text || text.length < 10) continue;

        const data = parseCSV(text);
        this.cache.set(filename, data);
        logger.debug(`✓ Loaded ${filename} (${data.length} rows)`);
        return data;
      } catch {
        // try next URL
      }
    }
    logger.error(`Failed to fetch ${filename} from all sources`);
    throw new Error(`Unable to load ${filename}`);
  }

  async fetchAllData(): Promise<Record<string, CSVRow[]>> {
    const results: Record<string, CSVRow[]> = {};
    const fileKeys = Object.keys(CONFIG.dataSource.files);

    const promises = fileKeys.map(async (key) => {
      try {
        results[key] = await this.fetchCSV(
          CONFIG.dataSource.files[key as keyof typeof CONFIG.dataSource.files],
        );
      } catch {
        results[key] = [];
      }
    });

    await Promise.all(promises);
    return results;
  }
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

function transformRiskData(rawData: Record<string, CSVRow[]>): RiskEntry[] {
  const riskEntries: RiskEntry[] = [];

  const prodView =
    rawData.productivityView && rawData.productivityView.length > 0
      ? rawData.productivityView
      : rawData.productivity;

  if (prodView && prodView.length > 0) {
    const ministryMap: Record<string, { docs: number; count: number; assessment: string }> = {};
    prodView.forEach((row) => {
      const ministry = (row.ministry_name as string) || (row.name as string) || '';
      if (!ministry) return;
      if (!ministryMap[ministry]) ministryMap[ministry] = { docs: 0, count: 0, assessment: '' };
      ministryMap[ministry].docs += parseFloat((row.documents_produced as string) || (row.avg_documents as string) || '0');
      ministryMap[ministry].count += 1;
      ministryMap[ministry].assessment = (row.performance_assessment as string) || (row.productivity_level as string) || '';
    });

    for (const ministry of Object.keys(ministryMap)) {
      const m = ministryMap[ministry];
      let riskScore = 5.0;
      const assess = m.assessment.toLowerCase();
      if (assess.includes('underperforming') || assess.includes('concern') || assess.includes('investigation')) {
        riskScore = 7.5;
      } else if (assess.includes('high-performing') || assess.includes('top')) {
        riskScore = 2.5;
      } else if (assess.includes('standard')) {
        riskScore = 4.0;
      }
      riskEntries.push({
        ministry,
        riskScore: riskScore.toFixed(2),
        alerts: Math.max(0, Math.round((riskScore - 3) * 2)),
      });
    }
  }

  if (riskEntries.length === 0 && rawData.riskLevels && rawData.riskLevels.length > 0) {
    const riskLevelMap: Record<string, number> = { CRITICAL: 9.0, HIGH: 7.0, MEDIUM: 5.0, LOW: 2.5 };
    const defaultMinistries = [
      'Finansdepartementet', 'Utrikesdepartementet', 'Försvarsdepartementet',
      'Justitiedepartementet', 'Socialdepartementet', 'Utbildningsdepartementet',
      'Näringsdepartementet', 'Miljödepartementet', 'Kulturdepartementet',
      'Infrastrukturdepartementet',
    ];
    defaultMinistries.forEach((ministry, riskIdx) => {
      const levelRow = rawData.riskLevels[riskIdx % rawData.riskLevels.length];
      const score = riskLevelMap[levelRow.risk_level as string] || 5.0;
      riskEntries.push({ ministry, riskScore: score.toFixed(2), alerts: Math.max(0, Math.round((score - 3) * 2)) });
    });
  }

  return riskEntries;
}

function transformProductivityData(rawData: Record<string, CSVRow[]>): ProductivityEntry[] {
  const prod = rawData.productivity || [];
  if (prod.length === 0) return [];

  const ministryData: Record<string, { year: number; docs: number }[]> = {};
  prod.forEach((row) => {
    const ministry = (row.ministry_name as string) || '';
    if (!ministry) return;
    if (!ministryData[ministry]) ministryData[ministry] = [];
    ministryData[ministry].push({
      year: parseInt(row.year as string) || 0,
      docs: parseFloat(row.documents_produced as string) || 0,
    });
  });

  return Object.keys(ministryData).map((ministry) => {
    const entries = ministryData[ministry].sort((a, b) => b.year - a.year);
    return {
      ministry,
      currentQuarter: (entries[0] ? entries[0].docs : 0).toFixed(1),
      previousQuarter: (entries[1] ? entries[1].docs : 0).toFixed(1),
    };
  });
}

function transformInfluenceData(rawData: Record<string, CSVRow[]>): InfluenceEntry[] {
  const influenceView = rawData.influenceView || [];
  if (influenceView.length > 0) {
    return influenceView
      .filter((row) => row.first_name && row.last_name)
      .map((row) => ({
        name: `${row.first_name} ${row.last_name}`,
        ministry: (row.party as string) || '',
        influence: parseFloat(row.network_connections as string) || 0,
      }))
      .sort((a, b) => (b.influence as number) - (a.influence as number))
      .slice(0, 10);
  }

  const percentiles = rawData.influence || [];
  if (percentiles.length > 0) {
    const connRow = percentiles.find((r) => r.column_name === 'network_connections');
    if (connRow) {
      const median = parseFloat(connRow.median as string) || 100;
      const p90 = parseFloat(connRow.p90 as string) || 200;
      const p75 = parseFloat(connRow.p75 as string) || 180;
      return [
        { name: 'Top Influencer (P90)', ministry: '', influence: p90 },
        { name: 'High Influence (P75)', ministry: '', influence: p75 },
        { name: 'Median Influence (P50)', ministry: '', influence: median },
      ];
    }
  }
  return [];
}

function transformDecisionImpactData(rawData: Record<string, CSVRow[]>): DecisionImpactEntry[] {
  const decisions = rawData.decisionImpact || [];
  if (decisions.length === 0) return [];

  const impactEntries: DecisionImpactEntry[] = [];
  const ministryGroups: Record<string, { committee: string; approvalRate: number; totalProposals: number }[]> = {};

  decisions.forEach((row) => {
    const ministry = (row.ministry_code as string) || '';
    if (!ministry) return;
    if (!ministryGroups[ministry]) ministryGroups[ministry] = [];
    ministryGroups[ministry].push({
      committee: (row.committee as string) || '',
      approvalRate: parseFloat(row.approval_rate as string) || 0,
      totalProposals: parseInt(row.total_proposals as string) || 0,
    });
  });

  for (const ministry of Object.keys(ministryGroups)) {
    const entries = ministryGroups[ministry];
    const avgApproval = entries.reduce((sum, e) => sum + e.approvalRate, 0) / entries.length;
    ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'].forEach((period, idx) => {
      const variation =
        (idx % 2 === 0 ? 1 : -1) *
        (entries.length > idx ? entries[idx].approvalRate - avgApproval : 0) * 0.1;
      impactEntries.push({ ministry, period, impact: (avgApproval + variation).toFixed(1) });
    });
  }

  return impactEntries;
}

function transformCIAData(rawData: Record<string, CSVRow[]>): TransformedMinistryData {
  return {
    riskLevels: transformRiskData(rawData),
    productivity: transformProductivityData(rawData),
    influence: transformInfluenceData(rawData),
    decisionImpact: transformDecisionImpactData(rawData),
  };
}

// ============================================================================
// CHART RENDERING
// ============================================================================

function renderRiskHeatMap(
  containerId: string,
  data: RiskEntry[],
  lang: string,
): void {
  const container = document.getElementById(containerId);
  if (!container || !data || data.length === 0 || !d3) return;

  container.innerHTML = '';

  const translations = MINISTRY_TRANSLATIONS[lang] || MINISTRY_TRANSLATIONS.en;
  const uiT = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;

  const margin = { top: 30, right: 30, bottom: 100, left: 200 };
  const width = Math.min(container.clientWidth, 1200) - margin.left - margin.right;
  const height = Math.max(data.length * 40, 400) - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('role', 'img')
    .attr('aria-label', uiT.riskHeatMap)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const ministries = data.map((d) => translations[d.ministry] || d.ministry);

  const yScale = d3.scaleBand().domain(ministries).range([0, height]).padding(0.1);
  const xScale = d3.scaleLinear().domain([0, 10]).range([0, width]);
  const colorScale = d3
    .scaleThreshold()
    .domain([4.0, 6.0, 8.0])
    .range([CONFIG.colors.riskLow, CONFIG.colors.riskMedium, CONFIG.colors.riskHigh, CONFIG.colors.riskCritical]);

  svg.append('g').call(d3.axisLeft(yScale)).selectAll('text').style('font-size', '14px').style('fill', 'var(--text-color)');
  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(10)).selectAll('text').style('font-size', '12px').style('fill', 'var(--text-color)');

  let tooltip = d3.select('body').select('.ministry-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body')
      .append('div')
      .attr('class', 'ministry-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'var(--card-bg)')
      .style('border', '1px solid var(--border-color)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('box-shadow', '0 4px 12px var(--card-shadow)')
      .style('font-size', '14px')
      .style('z-index', '1000');
  }

  svg.selectAll('.risk-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'risk-bar')
    .attr('x', 0)
    .attr('y', (_d: RiskEntry, i: number) => yScale(ministries[i])!)
    .attr('width', (d: RiskEntry) => xScale(parseFloat(d.riskScore) || 0))
    .attr('height', yScale.bandwidth())
    .attr('fill', (d: RiskEntry) => colorScale(parseFloat(d.riskScore) || 0))
    .attr('rx', 4)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', (d: RiskEntry, i: number) => `${ministries[i]}: Risk score ${d.riskScore}`)
    .style('cursor', 'pointer')
    .on('mouseover', (event: MouseEvent, d: RiskEntry) => {
      const riskLevel = parseFloat(d.riskScore);
      let level = 'Low';
      if (riskLevel >= 8.0) level = 'Critical';
      else if (riskLevel >= 6.0) level = 'High';
      else if (riskLevel >= 4.0) level = 'Medium';
      const ministryName = translations[d.ministry] || d.ministry;
      tooltip.selectAll('*').remove();
      tooltip.append('strong').text(ministryName);
      tooltip.append('br');
      tooltip.append('span').text(`Risk Score: ${d.riskScore}`);
      tooltip.append('br');
      tooltip.append('span').text(`Level: ${level}`);
      tooltip.append('br');
      tooltip.append('span').text(`Alerts: ${d.alerts || 'N/A'}`);
      tooltip.style('visibility', 'visible');
    })
    .on('mousemove', (event: MouseEvent) => {
      tooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
    })
    .on('mouseout', () => {
      tooltip.style('visibility', 'hidden');
    });

  const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(0, ${height + 50})`);
  const legendData = [
    { label: 'Low (<4.0)', color: CONFIG.colors.riskLow },
    { label: 'Medium (4.0-6.0)', color: CONFIG.colors.riskMedium },
    { label: 'High (6.0-8.0)', color: CONFIG.colors.riskHigh },
    { label: 'Critical (>8.0)', color: CONFIG.colors.riskCritical },
  ];
  legendData.forEach((item, i) => {
    const g = legend.append('g').attr('transform', `translate(${i * 150}, 0)`);
    g.append('rect').attr('width', 20).attr('height', 20).attr('fill', item.color).attr('rx', 4);
    g.append('text').attr('x', 30).attr('y', 15).text(item.label).style('font-size', '12px').style('fill', 'var(--text-color)');
  });
}

function renderInfluenceChart(
  canvasId: string,
  data: InfluenceEntry[],
): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas || !data || data.length === 0) return;

  const Chart = (globalThis as any).Chart;
  if (!Chart) return;

  const sorted = [...data].sort((a, b) => (Number(b.influence) || 0) - (Number(a.influence) || 0)).slice(0, 10);
  const labels = sorted.map((d) => d.name || 'Unknown');
  const values = sorted.map((d) => Number(d.influence) || 0);

  const ctx = canvas.getContext('2d')!;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Influence Score', data: values, backgroundColor: CONFIG.colors.primary, borderColor: CONFIG.colors.accent, borderWidth: 1 }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', callbacks: { label: (ctx: any) => `Influence: ${ctx.parsed.x.toFixed(2)}` } } },
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { color: 'var(--text-color)' }, grid: { color: 'var(--border-color)' } },
        y: { ticks: { color: 'var(--text-color)', font: { size: 12 } }, grid: { display: false } },
      },
    },
  });
}

function renderProductivityChart(
  canvasId: string,
  data: ProductivityEntry[],
  lang: string,
): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas || !data || data.length === 0) return;

  const Chart = (globalThis as any).Chart;
  if (!Chart) return;

  const ministryTranslations = MINISTRY_TRANSLATIONS[lang] || MINISTRY_TRANSLATIONS.en;
  const labels = data.map((d) => ministryTranslations[d.ministry] || d.ministry);
  const current = data.map((d) => parseFloat(d.currentQuarter) || 0);
  const previous = data.map((d) => parseFloat(d.previousQuarter) || 0);

  const ctx = canvas.getContext('2d')!;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Current Quarter', data: current, backgroundColor: CONFIG.colors.primary, borderWidth: 1 },
        { label: 'Previous Quarter', data: previous, backgroundColor: CONFIG.colors.accent, borderWidth: 1 },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top', labels: { color: 'var(--text-color)' } } },
      scales: {
        x: { beginAtZero: true, ticks: { color: 'var(--text-color)' }, grid: { color: 'var(--border-color)' } },
        y: { ticks: { color: 'var(--text-color)', font: { size: 12 } }, grid: { display: false } },
      },
    },
  });
}

function renderDecisionImpactChart(
  canvasId: string,
  data: DecisionImpactEntry[],
  lang: string,
): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas || !data || data.length === 0) return;

  const Chart = (globalThis as any).Chart;
  if (!Chart) return;

  const ministries = Array.from(new Set(data.map((d) => d.ministry))).slice(0, 5);
  const periods = Array.from(new Set(data.map((d) => d.period))).sort();
  const lineColors = ['#006633', '#00cc66', '#008838', '#007744', '#004422'];

  const datasets = ministries.map((ministry, index) => {
    const mData = data.filter((d) => d.ministry === ministry);
    const values = periods.map((period) => {
      const item = mData.find((d) => d.period === period);
      return item ? parseFloat(item.impact) || 0 : 0;
    });
    const translatedName = (MINISTRY_TRANSLATIONS[lang] || MINISTRY_TRANSLATIONS.en)[ministry] || ministry;
    return {
      label: translatedName,
      data: values,
      borderColor: lineColors[index % lineColors.length],
      backgroundColor: lineColors[index % lineColors.length] + '33',
      borderWidth: 2,
      tension: 0.4,
      fill: false,
    };
  });

  const ctx = canvas.getContext('2d')!;
  new Chart(ctx, {
    type: 'line',
    data: { labels: periods, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top', labels: { color: 'var(--text-color)', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: 'var(--text-color)', font: { size: 10 } }, grid: { color: 'var(--border-color)' } },
        y: { beginAtZero: true, ticks: { color: 'var(--text-color)' }, grid: { color: 'var(--border-color)' } },
      },
    },
  });
}

function renderAccessibilityTable(
  tableId: string,
  data: TransformedMinistryData,
  lang: string,
): void {
  const table = document.getElementById(tableId) as HTMLTableElement | null;
  if (!table || !data) return;

  const ministryTranslations = MINISTRY_TRANSLATIONS[lang] || MINISTRY_TRANSLATIONS.en;
  const uiT = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  const headers = uiT.tableHeaders || UI_TRANSLATIONS.en.tableHeaders!;

  table.innerHTML = '';

  const caption = document.createElement('caption');
  caption.textContent = uiT.tableCaption || 'Government Ministry Risk and Productivity Data';
  table.appendChild(caption);

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  [headers.ministry, headers.riskScore, headers.riskLevel, headers.productivity].forEach((text) => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'col');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.riskLevels.forEach((item, index) => {
    const riskScore = parseFloat(item.riskScore) || 0;
    let riskLevel = 'Low';
    if (riskScore >= 8.0) riskLevel = 'Critical';
    else if (riskScore >= 6.0) riskLevel = 'High';
    else if (riskScore >= 4.0) riskLevel = 'Medium';

    const prod = data.productivity[index];
    const prodValue = prod ? prod.currentQuarter : 'N/A';

    const row = document.createElement('tr');
    const cells = [
      ministryTranslations[item.ministry] || item.ministry,
      item.riskScore,
      riskLevel,
      prodValue,
    ];
    cells.forEach((text) => {
      const td = document.createElement('td');
      td.textContent = String(text);
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
}

// ============================================================================
// INIT
// ============================================================================

/**
 * Initialise the Ministry Risk & Influence dashboard.
 *
 * Fetches CIA data, transforms it, and renders D3/Chart.js visualisations.
 */
export async function init(): Promise<void> {
  logger.debug('Initializing Ministry Dashboard...');

  const lang = detectLanguage();
  const uiT = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  const container = document.getElementById('ministry-dashboard');

  if (!container) {
    logger.warn('Ministry dashboard container not found, skipping initialization');
    return;
  }

  try {
    // Show loading state
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'ministry-loading';
    loadingMsg.className = 'loading-message';
    loadingMsg.textContent = uiT.loading;
    loadingMsg.setAttribute('role', 'status');
    loadingMsg.setAttribute('aria-live', 'polite');
    container.prepend(loadingMsg);

    // Fetch data
    const fetcher = new DataFetcher();
    const rawData = await fetcher.fetchAllData();
    const data = transformCIAData(rawData);

    // Hide loading
    loadingMsg.remove();

    // Render visualisations
    renderRiskHeatMap('ministryRiskHeatMap', data.riskLevels, lang);
    renderInfluenceChart('ministerInfluenceChart', data.influence);
    renderProductivityChart('ministryProductivityChart', data.productivity, lang);
    renderDecisionImpactChart('decisionImpactChart', data.decisionImpact, lang);
    renderAccessibilityTable('ministryDataTable', data, lang);

    // Attribution
    const attribution = document.createElement('p');
    attribution.className = 'data-attribution';
    const emoji = document.createTextNode('📊 ');
    attribution.appendChild(emoji);
    attribution.appendChild(document.createTextNode(uiT.dataAttribution + ' | '));
    const link = document.createElement('a');
    link.href = 'https://www.hack23.com/cia';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'www.hack23.com/cia';
    attribution.appendChild(link);
    container.appendChild(attribution);

    logger.debug('✅ Ministry dashboard initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize ministry dashboard:', error);

    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = uiT.error;
    errorMsg.setAttribute('role', 'alert');
    container.innerHTML = '';
    container.appendChild(errorMsg);
  }
}
