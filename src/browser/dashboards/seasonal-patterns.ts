/**
 * @module Dashboards/SeasonalPatterns
 * @category Intelligence Analysis - Seasonal Parliamentary Patterns & Anomaly Detection
 *
 * Swedish Parliamentary Seasonal Activity Analysis & Quarterly Pattern Intelligence Dashboard.
 *
 * Advanced intelligence analysis implementing 23-year temporal pattern analysis
 * (2002-2025) of Swedish parliamentary quarterly activity with sophisticated Z-score
 * anomaly detection and seasonal pattern classification.
 *
 * @author Hack23 AB - Temporal Intelligence Team
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024
 */

import {
  logger,
  detectLanguage,
} from '../shared/index.js';

import type { CSVRow } from '../shared/index.js';

const d3 = (globalThis as any).d3;
const Chart = (globalThis as any).Chart;
const Papa = (globalThis as any).Papa;

// ============================================================================
// INTERFACES
// ============================================================================

interface SeasonalConfig {
  readonly dataUrls: readonly string[];
  readonly cacheKey: string;
  readonly cacheDuration: number;
  readonly zScoreThreshold: number;
  readonly colors: Record<string, string>;
  readonly quarterColors: Record<string, string>;
}

interface SeasonalTranslations {
  title: string;
  subtitle: string;
  filters: {
    year: string;
    quarter: string;
    election: string;
    classification: string;
    allYears: string;
    allQuarters: string;
    allElections: string;
    electionYears: string;
    nonElectionYears: string;
    allClassifications: string;
  };
  quarters: Record<string, string>;
  charts: {
    heatmap: { title: string; description: string };
    zscore: { title: string; description: string };
    comparison: { title: string; description: string };
    classification: { title: string; description: string };
    qoq: { title: string; description: string };
  };
  classifications: Record<string, string>;
  tooltips: {
    ballots: string;
    zScore: string;
    classification: string;
    anomaly: string;
    na: string;
    quarter: string;
    year: string;
  };
  chartLabels: {
    ballotZScore: string;
    documentZScore: string;
    attendanceZScore: string;
    yearQuarter: string;
    zScore: string;
    quarter: string;
    averageBallots: string;
    year: string;
    count: string;
    changePercent: string;
    qoqChange: string;
    anomaly: string;
  };
  loading: string;
  error: string;
  dataAttribution: string;
}

interface SeasonalFilters {
  year: string;
  quarter: string;
  election: string;
  classification: string;
}

interface QuarterAggregate {
  quarter: string;
  avgBallots: number;
  stddevBallots: number;
  avgAttendance: number;
  stddevAttendance: number;
  avgDocs: number;
  stddevDocs: number;
  count: number;
}

interface CacheEntry {
  data: CSVRow[];
  timestamp: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG: SeasonalConfig = {
  dataUrls: [
    'cia-data/seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv',
    'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_activity_patterns_sample.csv'
  ],
  cacheKey: 'riksdag_seasonal_patterns',
  cacheDuration: 24 * 60 * 60 * 1000,
  zScoreThreshold: 2.0,
  colors: {
    primary: '#00d9ff',
    secondary: '#ff006e',
    tertiary: '#ffbe0b',
    success: '#008838',
    warning: '#fbc02d',
    danger: '#d32f2f',
    info: '#117a8b',
    normal: '#388e3c',
    elevated: '#f57c00',
    reduced: '#1976d2',
    anomaly: '#d32f2f'
  },
  quarterColors: {
    Q1: '#1976d2',
    Q2: '#388e3c',
    Q3: '#fbc02d',
    Q4: '#f57c00'
  }
};

// ============================================================================
// TRANSLATIONS (14 Languages)
// ============================================================================

const TRANSLATIONS: Record<string, SeasonalTranslations> = {
  en: {
    title: 'Seasonal Activity Patterns (2002-2025)',
    subtitle: 'Quarterly Analysis with Z-Score Anomaly Detection',
    filters: { year: 'Year', quarter: 'Quarter', election: 'Election Status', classification: 'Activity Classification', allYears: 'All Years', allQuarters: 'All Quarters', allElections: 'All', electionYears: 'Election Years', nonElectionYears: 'Non-Election Years', allClassifications: 'All Classifications' },
    quarters: { Q1: 'Q1 - Winter Session', Q2: 'Q2 - Spring Session', Q3: 'Q3 - Summer Recess', Q4: 'Q4 - Autumn Session' },
    charts: {
      heatmap: { title: 'Quarterly Activity Heat Map (2002-2025)', description: 'Ballot volume by year and quarter with Z-score overlay' },
      zscore: { title: 'Z-Score Anomaly Detection', description: 'Statistical outliers (|Z| ≥ 2.0) flagged in red' },
      comparison: { title: 'Average Activity by Quarter (All Years)', description: 'Q1-Q4 baselines with standard deviation bands' },
      classification: { title: 'Seasonal Pattern Classification', description: 'Distribution of NORMAL, ELEVATED, REDUCED, ANOMALY patterns' },
      qoq: { title: 'Quarter-over-Quarter Changes', description: 'Sequential ballot changes (% and absolute)' }
    },
    classifications: { NORMAL_ACTIVITY: 'Normal Activity', ELEVATED_ACTIVITY: 'Elevated Activity', REDUCED_ACTIVITY: 'Reduced Activity', ANOMALY_DETECTED: 'Anomaly Detected', NORMAL_SEASONAL_PATTERN: 'Normal Seasonal Pattern', Q3_SUMMER_LULL: 'Q3 Summer Lull', Q4_ELEVATED_ACTIVITY: 'Q4 Elevated Activity', UNUSUALLY_HIGH_ACTIVITY: 'Unusually High Activity', UNUSUALLY_LOW_ACTIVITY: 'Unusually Low Activity' },
    tooltips: { ballots: 'Ballots', zScore: 'Z-Score', classification: 'Classification', anomaly: 'ANOMALY', na: 'N/A', quarter: 'Quarter', year: 'Year' },
    chartLabels: { ballotZScore: 'Ballot Z-Score', documentZScore: 'Document Z-Score', attendanceZScore: 'Attendance Z-Score', yearQuarter: 'Year-Quarter', zScore: 'Z-Score', quarter: 'Quarter', averageBallots: 'Average Ballots', year: 'Year', count: 'Count', changePercent: 'Change (%)', qoqChange: 'QoQ Change (%)', anomaly: 'ANOMALY' },
    loading: 'Loading data...', error: 'Error loading data. Please try again.', dataAttribution: 'Data by CIA Platform'
  },
  sv: {
    title: 'Säsongsmönster (2002-2025)',
    subtitle: 'Kvartalsanalys med Z-poäng anomalidetektering',
    filters: { year: 'År', quarter: 'Kvartal', election: 'Valstatus', classification: 'Aktivitetsklassificering', allYears: 'Alla år', allQuarters: 'Alla kvartal', allElections: 'Alla', electionYears: 'Valår', nonElectionYears: 'Icke-valår', allClassifications: 'Alla klassificeringar' },
    quarters: { Q1: 'Q1 - Vintersession', Q2: 'Q2 - Vårsession', Q3: 'Q3 - Sommaruppehåll', Q4: 'Q4 - Höstsession' },
    charts: { heatmap: { title: 'Kvartalsaktivitet värmekarta (2002-2025)', description: 'Omröstningsvolym per år och kvartal med Z-poäng' }, zscore: { title: 'Z-poäng anomalidetektering', description: 'Statistiska avvikelser (|Z| ≥ 2.0) markerade i rött' }, comparison: { title: 'Genomsnittlig aktivitet per kvartal (alla år)', description: 'Q1-Q4 baslinjer med standardavvikelseband' }, classification: { title: 'Säsongsmönster klassificering', description: 'Fördelning av NORMAL, FÖRHÖJD, REDUCERAD, ANOMALI mönster' }, qoq: { title: 'Kvartal-till-kvartal förändringar', description: 'Sekventiella omröstningsförändringar (% och absolut)' } },
    classifications: { NORMAL_ACTIVITY: 'Normal aktivitet', ELEVATED_ACTIVITY: 'Förhöjd aktivitet', REDUCED_ACTIVITY: 'Reducerad aktivitet', ANOMALY_DETECTED: 'Anomali upptäckt', NORMAL_SEASONAL_PATTERN: 'Normalt säsongsmönster', Q3_SUMMER_LULL: 'Q3 sommaruppehåll', Q4_ELEVATED_ACTIVITY: 'Q4 förhöjd aktivitet', UNUSUALLY_HIGH_ACTIVITY: 'Ovanligt hög aktivitet', UNUSUALLY_LOW_ACTIVITY: 'Ovanligt låg aktivitet' },
    tooltips: { ballots: 'Omröstningar', zScore: 'Z-poäng', classification: 'Klassificering', anomaly: 'ANOMALI', na: 'Saknas', quarter: 'Kvartal', year: 'År' },
    chartLabels: { ballotZScore: 'Omröstningar Z-poäng', documentZScore: 'Dokument Z-poäng', attendanceZScore: 'Närvaro Z-poäng', yearQuarter: 'År-Kvartal', zScore: 'Z-poäng', quarter: 'Kvartal', averageBallots: 'Genomsnittliga omröstningar', year: 'År', count: 'Antal', changePercent: 'Förändring (%)', qoqChange: 'KtK-förändring (%)', anomaly: 'ANOMALI' },
    loading: 'Laddar data...', error: 'Fel vid inläsning av data. Försök igen.', dataAttribution: 'Data från CIA-plattformen'
  },
  da: { title: 'Sæsonmønstre (2002-2025)', subtitle: 'Kvartalsanalyse med Z-score anomalidetektion', filters: { year: 'År', quarter: 'Kvartal', election: 'Valgstatus', classification: 'Aktivitetsklassificering', allYears: 'Alle år', allQuarters: 'Alle kvartaler', allElections: 'Alle', electionYears: 'Valgår', nonElectionYears: 'Ikke-valgår', allClassifications: 'Alle klassificeringer' }, quarters: { Q1: 'K1 - Vintersession', Q2: 'K2 - Forårssession', Q3: 'K3 - Sommerpause', Q4: 'K4 - Efterårssession' }, charts: { heatmap: { title: 'Kvartalsaktivitet varmekort (2002-2025)', description: 'Afstemningsvolumen efter år og kvartal med Z-score' }, zscore: { title: 'Z-score anomalidetektion', description: 'Statistiske afvigelser (|Z| ≥ 2.0) markeret med rødt' }, comparison: { title: 'Gennemsnitlig aktivitet efter kvartal (alle år)', description: 'K1-K4 basislinjer med standardafvigelsesbånd' }, classification: { title: 'Sæsonmønster klassificering', description: 'Fordeling af NORMAL, FORHØJET, REDUCERET, ANOMALI mønstre' }, qoq: { title: 'Kvartal-til-kvartal ændringer', description: 'Sekventielle afstemningsændringer (% og absolut)' } }, classifications: { NORMAL_ACTIVITY: 'Normal aktivitet', ELEVATED_ACTIVITY: 'Forhøjet aktivitet', REDUCED_ACTIVITY: 'Reduceret aktivitet', ANOMALY_DETECTED: 'Anomali opdaget', NORMAL_SEASONAL_PATTERN: 'Normalt sæsonmønster', Q3_SUMMER_LULL: 'K3 sommerpause', Q4_ELEVATED_ACTIVITY: 'K4 forhøjet aktivitet', UNUSUALLY_HIGH_ACTIVITY: 'Usædvanligt høj aktivitet', UNUSUALLY_LOW_ACTIVITY: 'Usædvanligt lav aktivitet' }, tooltips: { ballots: 'Afstemninger', zScore: 'Z-score', classification: 'Klassificering', anomaly: 'ANOMALI', na: 'Mangler', quarter: 'Kvartal', year: 'År' }, chartLabels: { ballotZScore: 'Afstemninger Z-score', documentZScore: 'Dokument Z-score', attendanceZScore: 'Fremmøde Z-score', yearQuarter: 'År-Kvartal', zScore: 'Z-score', quarter: 'Kvartal', averageBallots: 'Gennemsnitlige afstemninger', year: 'År', count: 'Antal', changePercent: 'Ændring (%)', qoqChange: 'KtK-ændring (%)', anomaly: 'ANOMALI' }, loading: 'Indlæser data...', error: 'Fejl ved indlæsning af data. Prøv igen.', dataAttribution: 'Data fra CIA-platformen' },
  no: { title: 'Sesongmønstre (2002-2025)', subtitle: 'Kvartalsanalyse med Z-score anomalideteksjon', filters: { year: 'År', quarter: 'Kvartal', election: 'Valgstatus', classification: 'Aktivitetsklassifisering', allYears: 'Alle år', allQuarters: 'Alle kvartaler', allElections: 'Alle', electionYears: 'Valgår', nonElectionYears: 'Ikke-valgår', allClassifications: 'Alle klassifiseringer' }, quarters: { Q1: 'K1 - Vintersesjon', Q2: 'K2 - Vårsesjon', Q3: 'K3 - Sommerferie', Q4: 'K4 - Høstsesjon' }, charts: { heatmap: { title: 'Kvartalsaktivitet varmekart (2002-2025)', description: 'Avstemningsvolum etter år og kvartal med Z-score' }, zscore: { title: 'Z-score anomalideteksjon', description: 'Statistiske avvik (|Z| ≥ 2.0) markert i rødt' }, comparison: { title: 'Gjennomsnittlig aktivitet etter kvartal (alle år)', description: 'K1-K4 basislinjer med standardavviksbånd' }, classification: { title: 'Sesongmønster klassifisering', description: 'Fordeling av NORMAL, FORHØYET, REDUSERT, ANOMALI mønstre' }, qoq: { title: 'Kvartal-til-kvartal endringer', description: 'Sekvensielle avstemningsendringer (% og absolutt)' } }, classifications: { NORMAL_ACTIVITY: 'Normal aktivitet', ELEVATED_ACTIVITY: 'Forhøyet aktivitet', REDUCED_ACTIVITY: 'Redusert aktivitet', ANOMALY_DETECTED: 'Anomali oppdaget', NORMAL_SEASONAL_PATTERN: 'Normalt sesongmønster', Q3_SUMMER_LULL: 'K3 sommerferie', Q4_ELEVATED_ACTIVITY: 'K4 forhøyet aktivitet', UNUSUALLY_HIGH_ACTIVITY: 'Uvanlig høy aktivitet', UNUSUALLY_LOW_ACTIVITY: 'Uvanlig lav aktivitet' }, tooltips: { ballots: 'Avstemninger', zScore: 'Z-score', classification: 'Klassifisering', anomaly: 'ANOMALI', na: 'Mangler', quarter: 'Kvartal', year: 'År' }, chartLabels: { ballotZScore: 'Avstemninger Z-score', documentZScore: 'Dokument Z-score', attendanceZScore: 'Fremmøte Z-score', yearQuarter: 'År-Kvartal', zScore: 'Z-score', quarter: 'Kvartal', averageBallots: 'Gjennomsnittlige avstemninger', year: 'År', count: 'Antall', changePercent: 'Endring (%)', qoqChange: 'KtK-endring (%)', anomaly: 'ANOMALI' }, loading: 'Laster data...', error: 'Feil ved lasting av data. Prøv igjen.', dataAttribution: 'Data fra CIA-plattformen' },
  fi: { title: 'Kausivaihtelut (2002-2025)', subtitle: 'Neljännesvuosi-analyysi Z-pisteiden poikkeamatunnistuksella', filters: { year: 'Vuosi', quarter: 'Kvartaali', election: 'Vaalitilanne', classification: 'Aktiviteettiluokitus', allYears: 'Kaikki vuodet', allQuarters: 'Kaikki kvartaalit', allElections: 'Kaikki', electionYears: 'Vaalivuodet', nonElectionYears: 'Ei-vaalivuodet', allClassifications: 'Kaikki luokitukset' }, quarters: { Q1: 'Q1 - Talviistunto', Q2: 'Q2 - Kevätistunto', Q3: 'Q3 - Kesätauko', Q4: 'Q4 - Syysistunto' }, charts: { heatmap: { title: 'Neljännesvuosi-aktiviteetti lämpökartta (2002-2025)', description: 'Äänestysvolyymi vuoden ja kvartaalin mukaan Z-pisteillä' }, zscore: { title: 'Z-piste poikkeamatunnistus', description: 'Tilastolliset poikkeamat (|Z| ≥ 2.0) merkitty punaisella' }, comparison: { title: 'Keskimääräinen aktiviteetti kvartaaleittain (kaikki vuodet)', description: 'Q1-Q4 perusviivat keskihajontakaistaleilla' }, classification: { title: 'Kausivaihtelujen luokittelu', description: 'NORMAALI, KOHONNUT, ALENTUNUT, POIKKEAMA -mallien jakauma' }, qoq: { title: 'Kvartaalista toiseen muutokset', description: 'Peräkkäiset äänestysmuutokset (% ja absoluuttinen)' } }, classifications: { NORMAL_ACTIVITY: 'Normaali aktiviteetti', ELEVATED_ACTIVITY: 'Kohonnut aktiviteetti', REDUCED_ACTIVITY: 'Alentunut aktiviteetti', ANOMALY_DETECTED: 'Poikkeama havaittu', NORMAL_SEASONAL_PATTERN: 'Normaali kausimalli', Q3_SUMMER_LULL: 'Q3 kesätauko', Q4_ELEVATED_ACTIVITY: 'Q4 kohonnut aktiviteetti', UNUSUALLY_HIGH_ACTIVITY: 'Epätavallisen korkea aktiviteetti', UNUSUALLY_LOW_ACTIVITY: 'Epätavallisen matala aktiviteetti' }, tooltips: { ballots: 'Äänet', zScore: 'Z-piste', classification: 'Luokitus', anomaly: 'POIKKEAMA', na: 'Puuttuu', quarter: 'Kvartaali', year: 'Vuosi' }, chartLabels: { ballotZScore: 'Äänet Z-piste', documentZScore: 'Dokumentti Z-piste', attendanceZScore: 'Läsnäolo Z-piste', yearQuarter: 'Vuosi-Kvartaali', zScore: 'Z-piste', quarter: 'Kvartaali', averageBallots: 'Keskimääräiset äänet', year: 'Vuosi', count: 'Lukumäärä', changePercent: 'Muutos (%)', qoqChange: 'KtK-muutos (%)', anomaly: 'POIKKEAMA' }, loading: 'Ladataan tietoja...', error: 'Virhe tietojen lataamisessa.', dataAttribution: 'Data CIA-alustalta' },
  de: { title: 'Saisonale Muster (2002-2025)', subtitle: 'Quartalsanalyse mit Z-Score-Anomalieerkennung', filters: { year: 'Jahr', quarter: 'Quartal', election: 'Wahlstatus', classification: 'Aktivitätsklassifizierung', allYears: 'Alle Jahre', allQuarters: 'Alle Quartale', allElections: 'Alle', electionYears: 'Wahljahre', nonElectionYears: 'Nicht-Wahljahre', allClassifications: 'Alle Klassifizierungen' }, quarters: { Q1: 'Q1 - Wintersitzung', Q2: 'Q2 - Frühjahrssitzung', Q3: 'Q3 - Sommerpause', Q4: 'Q4 - Herbstsitzung' }, charts: { heatmap: { title: 'Quartalsaktivität Heatmap (2002-2025)', description: 'Abstimmungsvolumen nach Jahr und Quartal mit Z-Score' }, zscore: { title: 'Z-Score-Anomalieerkennung', description: 'Statistische Ausreißer (|Z| ≥ 2.0) rot markiert' }, comparison: { title: 'Durchschnittliche Aktivität nach Quartal (alle Jahre)', description: 'Q1-Q4 Basislinien mit Standardabweichungsbändern' }, classification: { title: 'Saisonale Musterklassifizierung', description: 'Verteilung von NORMAL, ERHÖHT, REDUZIERT, ANOMALIE Mustern' }, qoq: { title: 'Quartal-zu-Quartal Änderungen', description: 'Aufeinanderfolgende Abstimmungsänderungen (% und absolut)' } }, classifications: { NORMAL_ACTIVITY: 'Normale Aktivität', ELEVATED_ACTIVITY: 'Erhöhte Aktivität', REDUCED_ACTIVITY: 'Reduzierte Aktivität', ANOMALY_DETECTED: 'Anomalie erkannt', NORMAL_SEASONAL_PATTERN: 'Normales saisonales Muster', Q3_SUMMER_LULL: 'Q3 Sommerpause', Q4_ELEVATED_ACTIVITY: 'Q4 erhöhte Aktivität', UNUSUALLY_HIGH_ACTIVITY: 'Ungewöhnlich hohe Aktivität', UNUSUALLY_LOW_ACTIVITY: 'Ungewöhnlich niedrige Aktivität' }, tooltips: { ballots: 'Abstimmungen', zScore: 'Z-Score', classification: 'Klassifizierung', anomaly: 'ANOMALIE', na: 'Fehlt', quarter: 'Quartal', year: 'Jahr' }, chartLabels: { ballotZScore: 'Abstimmungen Z-Score', documentZScore: 'Dokument Z-Score', attendanceZScore: 'Anwesenheit Z-Score', yearQuarter: 'Jahr-Quartal', zScore: 'Z-Score', quarter: 'Quartal', averageBallots: 'Durchschnittliche Abstimmungen', year: 'Jahr', count: 'Anzahl', changePercent: 'Änderung (%)', qoqChange: 'QzQ-Änderung (%)', anomaly: 'ANOMALIE' }, loading: 'Daten werden geladen...', error: 'Fehler beim Laden der Daten.', dataAttribution: 'Daten von CIA-Plattform' },
  fr: { title: 'Schémas saisonniers (2002-2025)', subtitle: 'Analyse trimestrielle avec détection d\'anomalies par score Z', filters: { year: 'Année', quarter: 'Trimestre', election: 'Statut électoral', classification: 'Classification d\'activité', allYears: 'Toutes les années', allQuarters: 'Tous les trimestres', allElections: 'Tous', electionYears: 'Années électorales', nonElectionYears: 'Années non-électorales', allClassifications: 'Toutes les classifications' }, quarters: { Q1: 'T1 - Session d\'hiver', Q2: 'T2 - Session de printemps', Q3: 'T3 - Pause estivale', Q4: 'T4 - Session d\'automne' }, charts: { heatmap: { title: 'Carte de chaleur d\'activité trimestrielle (2002-2025)', description: 'Volume de scrutins par année et trimestre avec score Z' }, zscore: { title: 'Détection d\'anomalies par score Z', description: 'Valeurs aberrantes statistiques (|Z| ≥ 2.0) marquées en rouge' }, comparison: { title: 'Activité moyenne par trimestre (toutes les années)', description: 'Lignes de base T1-T4 avec bandes d\'écart-type' }, classification: { title: 'Classification des schémas saisonniers', description: 'Distribution des schémas NORMAL, ÉLEVÉ, RÉDUIT, ANOMALIE' }, qoq: { title: 'Changements d\'un trimestre à l\'autre', description: 'Changements séquentiels de scrutins (% et absolu)' } }, classifications: { NORMAL_ACTIVITY: 'Activité normale', ELEVATED_ACTIVITY: 'Activité élevée', REDUCED_ACTIVITY: 'Activité réduite', ANOMALY_DETECTED: 'Anomalie détectée', NORMAL_SEASONAL_PATTERN: 'Schéma saisonnier normal', Q3_SUMMER_LULL: 'T3 pause estivale', Q4_ELEVATED_ACTIVITY: 'T4 activité élevée', UNUSUALLY_HIGH_ACTIVITY: 'Activité exceptionnellement élevée', UNUSUALLY_LOW_ACTIVITY: 'Activité exceptionnellement basse' }, tooltips: { ballots: 'Scrutins', zScore: 'Score Z', classification: 'Classification', anomaly: 'ANOMALIE', na: 'Manquant', quarter: 'Trimestre', year: 'Année' }, chartLabels: { ballotZScore: 'Scrutins Score Z', documentZScore: 'Document Score Z', attendanceZScore: 'Présence Score Z', yearQuarter: 'Année-Trimestre', zScore: 'Score Z', quarter: 'Trimestre', averageBallots: 'Scrutins moyens', year: 'Année', count: 'Nombre', changePercent: 'Changement (%)', qoqChange: 'TàT-changement (%)', anomaly: 'ANOMALIE' }, loading: 'Chargement des données...', error: 'Erreur lors du chargement des données.', dataAttribution: 'Données de la plateforme CIA' },
  es: { title: 'Patrones estacionales (2002-2025)', subtitle: 'Análisis trimestral con detección de anomalías por puntuación Z', filters: { year: 'Año', quarter: 'Trimestre', election: 'Estado electoral', classification: 'Clasificación de actividad', allYears: 'Todos los años', allQuarters: 'Todos los trimestres', allElections: 'Todos', electionYears: 'Años electorales', nonElectionYears: 'Años no electorales', allClassifications: 'Todas las clasificaciones' }, quarters: { Q1: 'T1 - Sesión de invierno', Q2: 'T2 - Sesión de primavera', Q3: 'T3 - Receso de verano', Q4: 'T4 - Sesión de otoño' }, charts: { heatmap: { title: 'Mapa de calor de actividad trimestral (2002-2025)', description: 'Volumen de votaciones por año y trimestre' }, zscore: { title: 'Detección de anomalías por puntuación Z', description: 'Valores atípicos (|Z| ≥ 2.0) marcados en rojo' }, comparison: { title: 'Actividad promedio por trimestre (todos los años)', description: 'Líneas base T1-T4 con bandas de desviación estándar' }, classification: { title: 'Clasificación de patrones estacionales', description: 'Distribución de patrones NORMAL, ELEVADO, REDUCIDO, ANOMALÍA' }, qoq: { title: 'Cambios de trimestre a trimestre', description: 'Cambios secuenciales de votaciones' } }, classifications: { NORMAL_ACTIVITY: 'Actividad normal', ELEVATED_ACTIVITY: 'Actividad elevada', REDUCED_ACTIVITY: 'Actividad reducida', ANOMALY_DETECTED: 'Anomalía detectada', NORMAL_SEASONAL_PATTERN: 'Patrón estacional normal', Q3_SUMMER_LULL: 'T3 receso de verano', Q4_ELEVATED_ACTIVITY: 'T4 actividad elevada', UNUSUALLY_HIGH_ACTIVITY: 'Actividad inusualmente alta', UNUSUALLY_LOW_ACTIVITY: 'Actividad inusualmente baja' }, tooltips: { ballots: 'Votaciones', zScore: 'Puntuación Z', classification: 'Clasificación', anomaly: 'ANOMALÍA', na: 'N/A', quarter: 'Trimestre', year: 'Año' }, chartLabels: { ballotZScore: 'Votaciones Z', documentZScore: 'Documento Z', attendanceZScore: 'Asistencia Z', yearQuarter: 'Año-Trimestre', zScore: 'Puntuación Z', quarter: 'Trimestre', averageBallots: 'Votaciones promedio', year: 'Año', count: 'Recuento', changePercent: 'Cambio (%)', qoqChange: 'TaT-cambio (%)', anomaly: 'ANOMALÍA' }, loading: 'Cargando datos...', error: 'Error al cargar los datos.', dataAttribution: 'Datos de la plataforma CIA' },
  nl: { title: 'Seizoenspatronen (2002-2025)', subtitle: 'Kwartaalanalyse met Z-score anomaliedetectie', filters: { year: 'Jaar', quarter: 'Kwartaal', election: 'Verkiezingsstatus', classification: 'Activiteitsclassificatie', allYears: 'Alle jaren', allQuarters: 'Alle kwartalen', allElections: 'Alle', electionYears: 'Verkiezingsjaren', nonElectionYears: 'Niet-verkiezingsjaren', allClassifications: 'Alle classificaties' }, quarters: { Q1: 'K1 - Wintersessie', Q2: 'K2 - Voorjaarssessie', Q3: 'K3 - Zomerpauze', Q4: 'K4 - Herfstsessie' }, charts: { heatmap: { title: 'Kwartaalactiviteit heatmap (2002-2025)', description: 'Stemvolume per jaar en kwartaal met Z-score' }, zscore: { title: 'Z-score anomaliedetectie', description: 'Statistische uitschieters (|Z| ≥ 2.0) gemarkeerd in rood' }, comparison: { title: 'Gemiddelde activiteit per kwartaal (alle jaren)', description: 'K1-K4 basislijnen met standaardafwijkingsbanden' }, classification: { title: 'Seizoenspatroon classificatie', description: 'Verdeling van patronen' }, qoq: { title: 'Kwartaal-op-kwartaal veranderingen', description: 'Opeenvolgende stemveranderingen' } }, classifications: { NORMAL_ACTIVITY: 'Normale activiteit', ELEVATED_ACTIVITY: 'Verhoogde activiteit', REDUCED_ACTIVITY: 'Verminderde activiteit', ANOMALY_DETECTED: 'Anomalie gedetecteerd', NORMAL_SEASONAL_PATTERN: 'Normaal seizoenspatroon', Q3_SUMMER_LULL: 'K3 zomerpauze', Q4_ELEVATED_ACTIVITY: 'K4 verhoogde activiteit', UNUSUALLY_HIGH_ACTIVITY: 'Ongewoon hoge activiteit', UNUSUALLY_LOW_ACTIVITY: 'Ongewoon lage activiteit' }, tooltips: { ballots: 'Stemmen', zScore: 'Z-score', classification: 'Classificatie', anomaly: 'ANOMALIE', na: 'Ontbreekt', quarter: 'Kwartaal', year: 'Jaar' }, chartLabels: { ballotZScore: 'Stemmen Z-score', documentZScore: 'Document Z-score', attendanceZScore: 'Aanwezigheid Z-score', yearQuarter: 'Jaar-Kwartaal', zScore: 'Z-score', quarter: 'Kwartaal', averageBallots: 'Gemiddelde stemmen', year: 'Jaar', count: 'Aantal', changePercent: 'Verandering (%)', qoqChange: 'KoK-verandering (%)', anomaly: 'ANOMALIE' }, loading: 'Gegevens laden...', error: 'Fout bij het laden van gegevens.', dataAttribution: 'Data van CIA-platform' },
  ar: { title: 'الأنماط الموسمية (2002-2025)', subtitle: 'تحليل ربع سنوي مع كشف الشذوذ بالنقاط Z', filters: { year: 'السنة', quarter: 'الربع', election: 'حالة الانتخابات', classification: 'تصنيف النشاط', allYears: 'كل السنوات', allQuarters: 'كل الأرباع', allElections: 'الكل', electionYears: 'سنوات الانتخابات', nonElectionYears: 'سنوات بدون انتخابات', allClassifications: 'كل التصنيفات' }, quarters: { Q1: 'الربع 1', Q2: 'الربع 2', Q3: 'الربع 3', Q4: 'الربع 4' }, charts: { heatmap: { title: 'خريطة حرارية للنشاط الفصلي', description: 'حجم التصويت حسب السنة والربع' }, zscore: { title: 'كشف الشذوذ بالنقاط Z', description: 'القيم الشاذة مميزة بالأحمر' }, comparison: { title: 'متوسط النشاط حسب الربع', description: 'خطوط أساسية مع نطاقات الانحراف المعياري' }, classification: { title: 'تصنيف الأنماط الموسمية', description: 'توزيع الأنماط' }, qoq: { title: 'التغيرات من ربع لآخر', description: 'التغيرات المتسلسلة' } }, classifications: { NORMAL_ACTIVITY: 'نشاط عادي', ELEVATED_ACTIVITY: 'نشاط مرتفع', REDUCED_ACTIVITY: 'نشاط منخفض', ANOMALY_DETECTED: 'شذوذ مكتشف', NORMAL_SEASONAL_PATTERN: 'نمط موسمي عادي', Q3_SUMMER_LULL: 'عطلة صيفية', Q4_ELEVATED_ACTIVITY: 'نشاط مرتفع', UNUSUALLY_HIGH_ACTIVITY: 'نشاط مرتفع بشكل غير عادي', UNUSUALLY_LOW_ACTIVITY: 'نشاط منخفض بشكل غير عادي' }, tooltips: { ballots: 'تصويت', zScore: 'نقاط Z', classification: 'تصنيف', anomaly: 'شذوذ', na: 'غير متوفر', quarter: 'ربع', year: 'سنة' }, chartLabels: { ballotZScore: 'تصويت Z', documentZScore: 'مستند Z', attendanceZScore: 'حضور Z', yearQuarter: 'سنة-ربع', zScore: 'نقاط Z', quarter: 'ربع', averageBallots: 'متوسط التصويت', year: 'سنة', count: 'عدد', changePercent: 'تغيير (%)', qoqChange: 'ربع-ربع (%)', anomaly: 'شذوذ' }, loading: 'جاري تحميل البيانات...', error: 'خطأ في تحميل البيانات.', dataAttribution: 'البيانات من منصة CIA' },
  he: { title: 'דפוסים עונתיים (2002-2025)', subtitle: 'ניתוח רבעוני עם זיהוי חריגות Z-Score', filters: { year: 'שנה', quarter: 'רבעון', election: 'סטטוס בחירות', classification: 'סיווג פעילות', allYears: 'כל השנים', allQuarters: 'כל הרבעונים', allElections: 'הכל', electionYears: 'שנות בחירות', nonElectionYears: 'שנים ללא בחירות', allClassifications: 'כל הסיווגים' }, quarters: { Q1: 'רבעון 1', Q2: 'רבעון 2', Q3: 'רבעון 3', Q4: 'רבעון 4' }, charts: { heatmap: { title: 'מפת חום של פעילות רבעונית', description: 'נפח הצבעות לפי שנה ורבעון' }, zscore: { title: 'זיהוי חריגות Z-Score', description: 'ערכים חריגים מסומנים באדום' }, comparison: { title: 'פעילות ממוצעת לפי רבעון', description: 'קווי בסיס עם רצועות סטיית תקן' }, classification: { title: 'סיווג דפוסים עונתיים', description: 'התפלגות דפוסים' }, qoq: { title: 'שינויים מרבעון לרבעון', description: 'שינויים רציפים בהצבעה' } }, classifications: { NORMAL_ACTIVITY: 'פעילות רגילה', ELEVATED_ACTIVITY: 'פעילות מוגברת', REDUCED_ACTIVITY: 'פעילות מופחתת', ANOMALY_DETECTED: 'חריגה זוהתה', NORMAL_SEASONAL_PATTERN: 'דפוס עונתי רגיל', Q3_SUMMER_LULL: 'הפסקת קיץ', Q4_ELEVATED_ACTIVITY: 'פעילות מוגברת', UNUSUALLY_HIGH_ACTIVITY: 'פעילות גבוהה במיוחד', UNUSUALLY_LOW_ACTIVITY: 'פעילות נמוכה במיוחד' }, tooltips: { ballots: 'הצבעות', zScore: 'Z-Score', classification: 'סיווג', anomaly: 'חריגה', na: 'חסר', quarter: 'רבעון', year: 'שנה' }, chartLabels: { ballotZScore: 'הצבעות Z', documentZScore: 'מסמך Z', attendanceZScore: 'נוכחות Z', yearQuarter: 'שנה-רבעון', zScore: 'Z-Score', quarter: 'רבעון', averageBallots: 'הצבעות ממוצעות', year: 'שנה', count: 'ספירה', changePercent: 'שינוי (%)', qoqChange: 'רבעון-רבעון (%)', anomaly: 'חריגה' }, loading: 'טוען נתונים...', error: 'שגיאה בטעינת נתונים.', dataAttribution: 'נתונים מפלטפורמת CIA' },
  ja: { title: '季節パターン (2002-2025)', subtitle: 'Zスコア異常検出を伴う四半期分析', filters: { year: '年', quarter: '四半期', election: '選挙状況', classification: '活動分類', allYears: 'すべての年', allQuarters: 'すべての四半期', allElections: 'すべて', electionYears: '選挙年', nonElectionYears: '非選挙年', allClassifications: 'すべての分類' }, quarters: { Q1: 'Q1 - 冬季会期', Q2: 'Q2 - 春季会期', Q3: 'Q3 - 夏季休会', Q4: 'Q4 - 秋季会期' }, charts: { heatmap: { title: '四半期活動ヒートマップ', description: '年と四半期別の投票量' }, zscore: { title: 'Zスコア異常検出', description: '統計的外れ値を赤でマーク' }, comparison: { title: '四半期別平均活動', description: 'ベースラインと標準偏差バンド' }, classification: { title: '季節パターン分類', description: 'パターンの分布' }, qoq: { title: '四半期間の変化', description: '連続的な投票変化' } }, classifications: { NORMAL_ACTIVITY: '通常の活動', ELEVATED_ACTIVITY: '活動上昇', REDUCED_ACTIVITY: '活動減少', ANOMALY_DETECTED: '異常検出', NORMAL_SEASONAL_PATTERN: '通常の季節パターン', Q3_SUMMER_LULL: 'Q3夏季休会', Q4_ELEVATED_ACTIVITY: 'Q4活動上昇', UNUSUALLY_HIGH_ACTIVITY: '異常に高い活動', UNUSUALLY_LOW_ACTIVITY: '異常に低い活動' }, tooltips: { ballots: '投票', zScore: 'Zスコア', classification: '分類', anomaly: '異常', na: 'N/A', quarter: '四半期', year: '年' }, chartLabels: { ballotZScore: '投票Z', documentZScore: '文書Z', attendanceZScore: '出席Z', yearQuarter: '年-四半期', zScore: 'Zスコア', quarter: '四半期', averageBallots: '平均投票', year: '年', count: '数', changePercent: '変化 (%)', qoqChange: 'QoQ変化 (%)', anomaly: '異常' }, loading: 'データ読み込み中...', error: 'データの読み込みエラー。', dataAttribution: 'CIAプラットフォームのデータ' },
  ko: { title: '계절별 패턴 (2002-2025)', subtitle: 'Z점수 이상 탐지를 통한 분기별 분석', filters: { year: '년도', quarter: '분기', election: '선거 상태', classification: '활동 분류', allYears: '모든 연도', allQuarters: '모든 분기', allElections: '모두', electionYears: '선거 연도', nonElectionYears: '비선거 연도', allClassifications: '모든 분류' }, quarters: { Q1: '1분기', Q2: '2분기', Q3: '3분기', Q4: '4분기' }, charts: { heatmap: { title: '분기별 활동 히트맵', description: '연도 및 분기별 투표량' }, zscore: { title: 'Z점수 이상 탐지', description: '통계적 이상값은 빨간색' }, comparison: { title: '분기별 평균 활동', description: '기준선과 표준편차 밴드' }, classification: { title: '계절별 패턴 분류', description: '패턴의 분포' }, qoq: { title: '분기별 변화', description: '순차적 투표 변화' } }, classifications: { NORMAL_ACTIVITY: '정상 활동', ELEVATED_ACTIVITY: '상승 활동', REDUCED_ACTIVITY: '감소 활동', ANOMALY_DETECTED: '이상 탐지', NORMAL_SEASONAL_PATTERN: '정상 계절 패턴', Q3_SUMMER_LULL: '여름 휴회', Q4_ELEVATED_ACTIVITY: '상승 활동', UNUSUALLY_HIGH_ACTIVITY: '비정상적으로 높은 활동', UNUSUALLY_LOW_ACTIVITY: '비정상적으로 낮은 활동' }, tooltips: { ballots: '투표', zScore: 'Z점수', classification: '분류', anomaly: '이상', na: 'N/A', quarter: '분기', year: '년도' }, chartLabels: { ballotZScore: '투표 Z', documentZScore: '문서 Z', attendanceZScore: '출석 Z', yearQuarter: '년-분기', zScore: 'Z점수', quarter: '분기', averageBallots: '평균 투표', year: '년도', count: '수', changePercent: '변화 (%)', qoqChange: 'QoQ 변화 (%)', anomaly: '이상' }, loading: '데이터 로딩 중...', error: '데이터 로딩 오류.', dataAttribution: 'CIA 플랫폼의 데이터' },
  zh: { title: '季节性模式 (2002-2025)', subtitle: '带Z分数异常检测的季度分析', filters: { year: '年份', quarter: '季度', election: '选举状态', classification: '活动分类', allYears: '所有年份', allQuarters: '所有季度', allElections: '全部', electionYears: '选举年', nonElectionYears: '非选举年', allClassifications: '所有分类' }, quarters: { Q1: '第1季度', Q2: '第2季度', Q3: '第3季度', Q4: '第4季度' }, charts: { heatmap: { title: '季度活动热图', description: '按年份和季度' }, zscore: { title: 'Z分数异常检测', description: '统计异常值标记为红色' }, comparison: { title: '按季度的平均活动', description: '基线与标准差带' }, classification: { title: '季节性模式分类', description: '模式的分布' }, qoq: { title: '季度环比变化', description: '连续投票变化' } }, classifications: { NORMAL_ACTIVITY: '正常活动', ELEVATED_ACTIVITY: '活动升高', REDUCED_ACTIVITY: '活动降低', ANOMALY_DETECTED: '检测到异常', NORMAL_SEASONAL_PATTERN: '正常季节性模式', Q3_SUMMER_LULL: '夏季休会', Q4_ELEVATED_ACTIVITY: '活动升高', UNUSUALLY_HIGH_ACTIVITY: '异常高的活动', UNUSUALLY_LOW_ACTIVITY: '异常低的活动' }, tooltips: { ballots: '投票', zScore: 'Z分数', classification: '分类', anomaly: '异常', na: '无', quarter: '季度', year: '年份' }, chartLabels: { ballotZScore: '投票Z', documentZScore: '文档Z', attendanceZScore: '出勤Z', yearQuarter: '年-季度', zScore: 'Z分数', quarter: '季度', averageBallots: '平均投票', year: '年份', count: '计数', changePercent: '变化 (%)', qoqChange: 'QoQ变化 (%)', anomaly: '异常' }, loading: '加载数据中...', error: '加载数据出错。', dataAttribution: '数据来自CIA平台' }
};

// ============================================================================
// DATA MANAGER
// ============================================================================

class SeasonalPatternsDataManager {
  data: CSVRow[] | null = null;

  async fetchData(): Promise<CSVRow[]> {
    const cached = this.getCachedData();
    if (cached) { logger.info('Using cached seasonal patterns data'); this.data = cached; return cached; }

    let lastError: Error | null = null;
    for (let i = 0; i < CONFIG.dataUrls.length; i++) {
      const url = CONFIG.dataUrls[i];
      const isLocal = !url.startsWith('http');
      try {
        logger.info(`Fetching seasonal patterns data from ${isLocal ? 'local' : 'remote'} source (${i + 1}/${CONFIG.dataUrls.length})...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const csvText = await response.text();
        const parsedData = this.parseCSV(csvText);
        this.setCachedData(parsedData);
        this.data = parsedData;
        logger.info(`Loaded ${parsedData.length} seasonal activity records from ${isLocal ? 'local' : 'remote'} source`);
        return parsedData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`Failed to load from ${isLocal ? 'local' : 'remote'} source: ${lastError.message}`);
      }
    }

    // Try expired cache as fallback
    const cached2 = localStorage.getItem(CONFIG.cacheKey);
    if (cached2) {
      try {
        const parsed = JSON.parse(cached2) as CacheEntry;
        if (parsed && typeof parsed === 'object' && 'data' in parsed) {
          logger.info('Using expired cache as fallback');
          this.data = parsed.data;
          return parsed.data;
        }
      } catch { /* ignore */ }
    }
    throw lastError || new Error('All data sources failed');
  }

  parseCSV(csvText: string): CSVRow[] {
    if (typeof Papa !== 'undefined') {
      const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
      return parsed.data as CSVRow[];
    }
    if (typeof d3 !== 'undefined' && typeof d3.csvParse === 'function') {
      try {
        return d3.csvParse(csvText, (d: Record<string, string>) => {
          const row: CSVRow = {};
          Object.keys(d).forEach((key) => {
            const value = d[key];
            if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
              (row as any)[key] = parseFloat(value);
            } else {
              (row as any)[key] = value;
            }
          });
          return row;
        }) as CSVRow[];
      } catch { /* fallback below */ }
    }

    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (/^-?\d+(\.\d+)?$/.test(value)) { (row as any)[header] = parseFloat(value); }
        else { (row as any)[header] = value; }
      });
      data.push(row);
    }
    return data;
  }

  getCachedData(): CSVRow[] | null {
    try {
      const cached = localStorage.getItem(CONFIG.cacheKey);
      if (!cached) return null;
      const parsed = JSON.parse(cached) as CacheEntry;
      if (Date.now() - parsed.timestamp > CONFIG.cacheDuration) return null;
      return parsed.data;
    } catch { return null; }
  }

  setCachedData(data: CSVRow[]): void {
    try { localStorage.setItem(CONFIG.cacheKey, JSON.stringify({ data, timestamp: Date.now() })); }
    catch (e) { logger.error('Error caching data:', e); }
  }

  aggregateByQuarter(): Record<string, QuarterAggregate> | null {
    if (!this.data) return null;
    const quarters: Record<string, CSVRow[]> = { Q1: [], Q2: [], Q3: [], Q4: [] };
    this.data.forEach(row => { const q = `Q${row['quarter']}`; if (quarters[q]) quarters[q].push(row); });

    const aggregated: Record<string, QuarterAggregate> = {};
    Object.keys(quarters).forEach(q => {
      const records = quarters[q];
      if (records.length === 0) return;
      const ballots = records.map(r => Number(r['total_ballots']) || 0);
      const attendance = records.map(r => Number(r['attendance_rate']) || 0);
      const docs = records.map(r => Number(r['documents_produced']) || 0);
      aggregated[q] = { quarter: q, avgBallots: mean(ballots), stddevBallots: stddev(ballots), avgAttendance: mean(attendance), stddevAttendance: stddev(attendance), avgDocs: mean(docs), stddevDocs: stddev(docs), count: records.length };
    });
    return aggregated;
  }

  identifyAnomalies(threshold: number = CONFIG.zScoreThreshold): CSVRow[] {
    if (!this.data) return [];
    const anomalies = this.data.filter(row => {
      const ballotZ = Math.abs(Number(row['ballot_z_score']) || 0);
      const docZ = Math.abs(Number(row['doc_z_score']) || 0);
      const attendanceZ = Math.abs(Number(row['attendance_z_score']) || 0);
      return ballotZ >= threshold || docZ >= threshold || attendanceZ >= threshold;
    });
    anomalies.sort((a, b) => {
      const maxZa = Math.max(Math.abs(Number(a['ballot_z_score']) || 0), Math.abs(Number(a['doc_z_score']) || 0), Math.abs(Number(a['attendance_z_score']) || 0));
      const maxZb = Math.max(Math.abs(Number(b['ballot_z_score']) || 0), Math.abs(Number(b['doc_z_score']) || 0), Math.abs(Number(b['attendance_z_score']) || 0));
      return maxZb - maxZa;
    });
    return anomalies;
  }

  filterData(filters: SeasonalFilters): CSVRow[] {
    if (!this.data) return [];
    return this.data.filter(row => {
      if (filters.year && filters.year !== 'all' && row['year'] !== parseInt(filters.year)) return false;
      if (filters.quarter && filters.quarter !== 'all' && row['quarter'] !== parseInt(filters.quarter)) return false;
      if (filters.election && filters.election !== 'all') {
        const isElection = row['is_election_year'] === 't' || row['is_election_year'] === true;
        if (filters.election === 'election' && !isElection) return false;
        if (filters.election === 'non-election' && isElection) return false;
      }
      if (filters.classification && filters.classification !== 'all') {
        if (row['base_activity_classification'] !== filters.classification && row['seasonal_pattern_classification'] !== filters.classification) return false;
      }
      return true;
    });
  }
}

function mean(arr: number[]): number { if (arr.length === 0) return 0; return arr.reduce((s, v) => s + v, 0) / arr.length; }
function stddev(arr: number[]): number { if (arr.length === 0) return 0; const avg = mean(arr); return Math.sqrt(mean(arr.map(v => Math.pow(v - avg, 2)))); }

// ============================================================================
// CHART RENDERER
// ============================================================================

class SeasonalPatternsCharts {
  private chartInstances: Record<string, any> = {};
  private translations: SeasonalTranslations;
  private dataManager: SeasonalPatternsDataManager;

  constructor(dataManager: SeasonalPatternsDataManager, language: string = 'en') {
    this.dataManager = dataManager;
    this.translations = TRANSLATIONS[language] || TRANSLATIONS['en'];
  }

  destroyCharts(): void {
    Object.keys(this.chartInstances).forEach(key => { if (this.chartInstances[key]) { this.chartInstances[key].destroy(); delete this.chartInstances[key]; } });
  }

  async renderAll(filteredData: CSVRow[] | null = null): Promise<void> {
    const data = filteredData || this.dataManager.data;
    if (!data || data.length === 0) return;
    this.destroyCharts();
    this.renderSeasonalHeatmap(data);
    this.renderZScoreTimeline(data);
    this.renderQuarterComparison(data);
    this.renderClassificationChart(data);
    this.renderQoQChangeChart(data);
  }

  renderSeasonalHeatmap(data: CSVRow[]): void {
    const container = document.getElementById('seasonal-heatmap');
    if (!container || typeof d3 === 'undefined') return;
    container.innerHTML = '';

    const margin = { top: 40, right: 100, bottom: 60, left: 60 };
    const width = Math.min(container.clientWidth, 1200) - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select(container).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).attr('role', 'img').attr('aria-label', this.translations.charts.heatmap.title).append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const years = [...new Set(data.map((d: CSVRow) => d['year']))].sort() as number[];
    const quarters = [1, 2, 3, 4];
    const xScale = d3.scaleBand().domain(quarters).range([0, width]).padding(0.05);
    const yScale = d3.scaleBand().domain(years).range([0, height]).padding(0.05);
    const maxBallots = d3.max(data, (d: CSVRow) => Number(d['total_ballots']) || 0) as number;
    const colorScale = d3.scaleSequential().domain([0, maxBallots]).interpolator(d3.interpolateYlOrRd);

    const t = this.translations;
    svg.selectAll('.cell').data(data).enter().append('rect').attr('class', 'cell')
      .attr('x', (d: CSVRow) => xScale(d['quarter'])).attr('y', (d: CSVRow) => yScale(d['year']))
      .attr('width', xScale.bandwidth()).attr('height', yScale.bandwidth())
      .attr('fill', (d: CSVRow) => colorScale(Number(d['total_ballots']) || 0)).attr('stroke', '#fff').attr('stroke-width', 1)
      .append('title').text((d: CSVRow) => {
        const classText = t.classifications[d['seasonal_pattern_classification'] as string] || t.classifications[d['base_activity_classification'] as string] || d['seasonal_pattern_classification'] || t.tooltips.na;
        return `${d['year']} Q${d['quarter']}\n${t.tooltips.ballots}: ${d['total_ballots']}\n${t.tooltips.zScore}: ${(Number(d['ballot_z_score']) || 0).toFixed(2)}\n${t.tooltips.classification}: ${classText}`;
      });

    const anomalies = data.filter((d: CSVRow) => Math.abs(Number(d['ballot_z_score']) || 0) >= CONFIG.zScoreThreshold);
    svg.selectAll('.anomaly-marker').data(anomalies).enter().append('circle').attr('class', 'anomaly-marker')
      .attr('cx', (d: CSVRow) => xScale(d['quarter']) + xScale.bandwidth() / 2).attr('cy', (d: CSVRow) => yScale(d['year']) + yScale.bandwidth() / 2)
      .attr('r', 8).attr('fill', CONFIG.colors.danger).attr('stroke', '#fff').attr('stroke-width', 2)
      .append('title').text((d: CSVRow) => `${t.tooltips.anomaly}: ${d['year']} Q${d['quarter']}\n${t.tooltips.zScore}: ${(Number(d['ballot_z_score']) || 0).toFixed(2)}`);

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).tickFormat((q: number) => `Q${q}`));
    svg.append('g').call(d3.axisLeft(yScale));
    svg.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle').text(t.filters?.quarter || 'Quarter').style('font-size', '14px');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -40).attr('text-anchor', 'middle').text(t.filters?.year || 'Year').style('font-size', '14px');
  }

  renderZScoreTimeline(data: CSVRow[]): void {
    const canvas = document.getElementById('zscore-timeline-chart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const t = this.translations.chartLabels;
    const sortedData = [...data].sort((a, b) => { if (a['year'] !== b['year']) return (a['year'] as number) - (b['year'] as number); return (a['quarter'] as number) - (b['quarter'] as number); });
    const labels = sortedData.map(d => `${d['year']}-Q${d['quarter']}`);

    this.chartInstances['zscore'] = new Chart(ctx, {
      type: 'line', data: { labels, datasets: [
        { label: t.ballotZScore, data: sortedData.map(d => Number(d['ballot_z_score']) || 0), borderColor: CONFIG.colors.primary, backgroundColor: CONFIG.colors.primary + '40', borderWidth: 2, pointRadius: 3, tension: 0.1 },
        { label: t.documentZScore, data: sortedData.map(d => Number(d['doc_z_score']) || 0), borderColor: CONFIG.colors.secondary, backgroundColor: CONFIG.colors.secondary + '40', borderWidth: 2, pointRadius: 3, tension: 0.1 },
        { label: t.attendanceZScore, data: sortedData.map(d => Number(d['attendance_z_score']) || 0), borderColor: CONFIG.colors.tertiary, backgroundColor: CONFIG.colors.tertiary + '40', borderWidth: 2, pointRadius: 3, tension: 0.1 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (context: any) => { let label = context.dataset.label || ''; if (label) label += ': '; label += context.parsed.y.toFixed(2); if (Math.abs(context.parsed.y) >= CONFIG.zScoreThreshold) label += ' 🔴 ' + t.anomaly; return label; } } } }, scales: { x: { title: { display: true, text: t.yearQuarter }, ticks: { maxRotation: 90, minRotation: 45, autoSkip: true, maxTicksLimit: 20 } }, y: { title: { display: true, text: t.zScore }, min: -4, max: 4 } } }
    });
  }

  renderQuarterComparison(data: CSVRow[]): void {
    const canvas = document.getElementById('quarter-comparison-chart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const aggregated = this.aggregateDataByQuarter(data);
    if (!aggregated) return;
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    const avgBallots = labels.map(q => aggregated[q]?.avgBallots || 0);
    const stddevBallots = labels.map(q => aggregated[q]?.stddevBallots || 0);

    this.chartInstances['comparison'] = new Chart(ctx, {
      type: 'bar', data: { labels: labels.map(q => this.translations.quarters[q] || q), datasets: [{ label: this.translations.charts?.comparison?.title || 'Average Ballots', data: avgBallots, backgroundColor: labels.map(q => CONFIG.quarterColors[q]), borderColor: labels.map(q => CONFIG.quarterColors[q]), borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context: any) => [`Average: ${context.parsed.y.toFixed(1)} ballots`, `Std Dev: ±${stddevBallots[context.dataIndex].toFixed(1)}`] } } }, scales: { x: { title: { display: true, text: this.translations.chartLabels.quarter } }, y: { title: { display: true, text: this.translations.chartLabels.averageBallots }, beginAtZero: true } } }
    });
  }

  private aggregateDataByQuarter(data: CSVRow[]): Record<string, QuarterAggregate> | null {
    if (!data) return null;
    const quarters: Record<string, CSVRow[]> = { Q1: [], Q2: [], Q3: [], Q4: [] };
    data.forEach(row => { const q = `Q${row['quarter']}`; if (quarters[q]) quarters[q].push(row); });
    const aggregated: Record<string, QuarterAggregate> = {};
    Object.keys(quarters).forEach(q => {
      const records = quarters[q]; if (records.length === 0) return;
      const ballots = records.map(r => Number(r['total_ballots']) || 0);
      aggregated[q] = { quarter: q, avgBallots: mean(ballots), stddevBallots: stddev(ballots), avgAttendance: 0, stddevAttendance: 0, avgDocs: 0, stddevDocs: 0, count: records.length };
    });
    return aggregated;
  }

  renderClassificationChart(data: CSVRow[]): void {
    const canvas = document.getElementById('classification-chart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const years = [...new Set(data.map(d => d['year']))].sort() as number[];
    const classifications: Record<string, Record<number, number>> = {};
    data.forEach(row => {
      const classification = (row['seasonal_pattern_classification'] as string) || 'UNKNOWN';
      if (!classifications[classification]) classifications[classification] = {};
      if (!classifications[classification][row['year'] as number]) classifications[classification][row['year'] as number] = 0;
      classifications[classification][row['year'] as number]++;
    });
    const datasets = Object.keys(classifications).map(classification => {
      const counts = years.map(year => classifications[classification][year] || 0);
      let color = CONFIG.colors.info;
      if (classification.includes('NORMAL')) color = CONFIG.colors.normal;
      else if (classification.includes('ELEVATED') || classification.includes('HIGH')) color = CONFIG.colors.elevated;
      else if (classification.includes('REDUCED') || classification.includes('LOW')) color = CONFIG.colors.reduced;
      else if (classification.includes('ANOMALY')) color = CONFIG.colors.anomaly;
      return { label: this.translations.classifications[classification] || classification, data: counts, backgroundColor: color, borderColor: color, borderWidth: 1 };
    });

    this.chartInstances['classification'] = new Chart(ctx, {
      type: 'bar', data: { labels: years, datasets },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { stacked: true, title: { display: true, text: this.translations.chartLabels.year } }, y: { stacked: true, title: { display: true, text: this.translations.chartLabels.count }, beginAtZero: true } } }
    });
  }

  renderQoQChangeChart(data: CSVRow[]): void {
    const canvas = document.getElementById('qoq-change-chart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sortedData = [...data].filter(d => d['qoq_ballot_change_pct'] !== null && d['qoq_ballot_change_pct'] !== undefined).sort((a, b) => { if (a['year'] !== b['year']) return (a['year'] as number) - (b['year'] as number); return (a['quarter'] as number) - (b['quarter'] as number); });
    const labels = sortedData.map(d => `${d['year']}-Q${d['quarter']}`);
    const changes = sortedData.map(d => Number(d['qoq_ballot_change_pct']) || 0);
    const colors = changes.map(change => change > 0 ? CONFIG.colors.success : change < 0 ? CONFIG.colors.danger : CONFIG.colors.info);

    this.chartInstances['qoq'] = new Chart(ctx, {
      type: 'bar', data: { labels, datasets: [{ label: this.translations.chartLabels.qoqChange, data: changes, backgroundColor: colors, borderColor: colors, borderWidth: 1 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context: any) => `Change: ${context.parsed.y.toFixed(2)}%` } } }, scales: { x: { title: { display: true, text: this.translations.chartLabels.yearQuarter }, ticks: { maxRotation: 90, minRotation: 45, autoSkip: true, maxTicksLimit: 20 } }, y: { title: { display: true, text: this.translations.chartLabels.changePercent } } } }
    });
  }
}

// ============================================================================
// DASHBOARD CONTROLLER
// ============================================================================

class SeasonalPatternsDashboard {
  private dataManager = new SeasonalPatternsDataManager();
  private chartRenderer: SeasonalPatternsCharts | null = null;
  private currentLanguage: string;
  private translations: SeasonalTranslations;
  private currentFilters: SeasonalFilters = { year: 'all', quarter: 'all', election: 'all', classification: 'all' };

  constructor() {
    this.currentLanguage = detectLanguage();
    this.translations = TRANSLATIONS[this.currentLanguage] || TRANSLATIONS['en'];
    if (!this.translations.tooltips) this.translations.tooltips = TRANSLATIONS['en'].tooltips;
    if (!this.translations.chartLabels) this.translations.chartLabels = TRANSLATIONS['en'].chartLabels;
  }

  async initialize(): Promise<void> {
    try {
      this.showLoading();
      await this.dataManager.fetchData();
      this.chartRenderer = new SeasonalPatternsCharts(this.dataManager, this.currentLanguage);
      this.setupFilters();
      await this.chartRenderer.renderAll();
      this.hideLoading();
      logger.info('Seasonal Patterns Dashboard initialized successfully');
    } catch (error) {
      logger.error('Error initializing dashboard:', error);
      this.showError();
    }
  }

  private setupFilters(): void {
    const yearFilter = document.getElementById('year-filter') as HTMLSelectElement | null;
    const quarterFilter = document.getElementById('quarter-filter') as HTMLSelectElement | null;
    const electionFilter = document.getElementById('election-filter') as HTMLSelectElement | null;
    const classificationFilter = document.getElementById('classification-filter') as HTMLSelectElement | null;

    if (yearFilter) {
      yearFilter.addEventListener('change', (e) => { this.currentFilters.year = (e.target as HTMLSelectElement).value; this.applyFilters(); });
      const years = [...new Set(this.dataManager.data!.map(d => d['year']))].sort((a: any, b: any) => b - a);
      years.forEach(year => { const o = document.createElement('option'); o.value = String(year); o.textContent = String(year); yearFilter.appendChild(o); });
    }
    if (quarterFilter) { quarterFilter.addEventListener('change', (e) => { this.currentFilters.quarter = (e.target as HTMLSelectElement).value; this.applyFilters(); }); }
    if (electionFilter) { electionFilter.addEventListener('change', (e) => { this.currentFilters.election = (e.target as HTMLSelectElement).value; this.applyFilters(); }); }
    if (classificationFilter) {
      classificationFilter.addEventListener('change', (e) => { this.currentFilters.classification = (e.target as HTMLSelectElement).value; this.applyFilters(); });
      const classificationSet = new Set<string>();
      this.dataManager.data!.forEach(d => { if (d['seasonal_pattern_classification']) classificationSet.add(d['seasonal_pattern_classification'] as string); if (d['base_activity_classification']) classificationSet.add(d['base_activity_classification'] as string); });
      [...classificationSet].sort().forEach(classification => {
        const o = document.createElement('option'); o.value = classification;
        o.textContent = this.translations.classifications?.[classification] || TRANSLATIONS['en']?.classifications?.[classification] || classification;
        classificationFilter.appendChild(o);
      });
    }
  }

  private async applyFilters(): Promise<void> {
    const filteredData = this.dataManager.filterData(this.currentFilters);
    await this.chartRenderer!.renderAll(filteredData);
  }

  private showLoading(): void {
    const container = document.getElementById('seasonal-patterns-dashboard');
    if (container) { container.classList.add('loading'); container.setAttribute('aria-busy', 'true'); }
  }

  private hideLoading(): void {
    const container = document.getElementById('seasonal-patterns-dashboard');
    if (container) { container.classList.remove('loading'); container.removeAttribute('aria-busy'); }
  }

  private showError(): void {
    const container = document.getElementById('seasonal-patterns-dashboard');
    if (container) {
      while (container.firstChild) container.removeChild(container.firstChild);
      const errorWrapper = document.createElement('div'); errorWrapper.className = 'error-message'; errorWrapper.setAttribute('role', 'alert');
      const errorText = document.createElement('p'); errorText.textContent = `⚠️ ${this.translations.error || TRANSLATIONS['en'].error}`;
      errorWrapper.appendChild(errorText); container.appendChild(errorWrapper);
    }
  }
}

// ============================================================================
// EXPORTED INIT
// ============================================================================

export async function init(): Promise<void> {
  const dashboardContainer = document.getElementById('seasonal-patterns-dashboard');
  if (dashboardContainer) {
    const dashboard = new SeasonalPatternsDashboard();
    await dashboard.initialize();
  }
}
