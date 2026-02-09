/**
 * Seasonal Activity Patterns Dashboard
 * 
 * Visualizes quarterly parliamentary activity from 2002-2025 with:
 * - Quarterly activity heat map (23 years × 4 quarters)
 * - Z-score anomaly detection
 * - Seasonal pattern classification
 * - Cross-year quarter comparison
 * - Activity quartile tracking
 * 
 * Data Source: CIA Platform
 * CSV: view_riksdagen_seasonal_activity_patterns_sample.csv
 * 
 * @author Hack23 AB
 * @version 1.0.0
 * @license Apache-2.0
 */

(function() {
  'use strict';

  // ============================================================================
  // Configuration
  // ============================================================================
  
  const CONFIG = {
    dataUrls: [
      'cia-data/seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv', // Local first
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_activity_patterns_sample.csv' // Remote fallback
    ],
    cacheKey: 'riksdag_seasonal_patterns',
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    zScoreThreshold: 2.0, // Anomaly threshold
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
      Q1: '#1976d2', // Blue - Winter
      Q2: '#388e3c', // Green - Spring
      Q3: '#fbc02d', // Yellow - Summer Recess
      Q4: '#f57c00'  // Orange - Autumn
    }
  };

  // ============================================================================
  // Translations (14 Languages)
  // ============================================================================
  
  const TRANSLATIONS = {
    en: {
      title: 'Seasonal Activity Patterns (2002-2025)',
      subtitle: 'Quarterly Analysis with Z-Score Anomaly Detection',
      filters: {
        year: 'Year',
        quarter: 'Quarter',
        election: 'Election Status',
        classification: 'Activity Classification',
        allYears: 'All Years',
        allQuarters: 'All Quarters',
        allElections: 'All',
        electionYears: 'Election Years',
        nonElectionYears: 'Non-Election Years',
        allClassifications: 'All Classifications'
      },
      quarters: {
        Q1: 'Q1 - Winter Session',
        Q2: 'Q2 - Spring Session',
        Q3: 'Q3 - Summer Recess',
        Q4: 'Q4 - Autumn Session'
      },
      charts: {
        heatmap: {
          title: 'Quarterly Activity Heat Map (2002-2025)',
          description: 'Ballot volume by year and quarter with Z-score overlay'
        },
        zscore: {
          title: 'Z-Score Anomaly Detection',
          description: 'Statistical outliers (|Z| ≥ 2.0) flagged in red'
        },
        comparison: {
          title: 'Average Activity by Quarter (All Years)',
          description: 'Q1-Q4 baselines with standard deviation bands'
        },
        classification: {
          title: 'Seasonal Pattern Classification',
          description: 'Distribution of NORMAL, ELEVATED, REDUCED, ANOMALY patterns'
        },
        qoq: {
          title: 'Quarter-over-Quarter Changes',
          description: 'Sequential ballot changes (% and absolute)'
        }
      },
      classifications: {
        NORMAL_ACTIVITY: 'Normal Activity',
        ELEVATED_ACTIVITY: 'Elevated Activity',
        REDUCED_ACTIVITY: 'Reduced Activity',
        ANOMALY_DETECTED: 'Anomaly Detected',
        NORMAL_SEASONAL_PATTERN: 'Normal Seasonal Pattern',
        Q3_SUMMER_LULL: 'Q3 Summer Lull',
        Q4_ELEVATED_ACTIVITY: 'Q4 Elevated Activity',
        UNUSUALLY_HIGH_ACTIVITY: 'Unusually High Activity',
        UNUSUALLY_LOW_ACTIVITY: 'Unusually Low Activity'
      },
      tooltips: {
        ballots: 'Ballots',
        zScore: 'Z-Score',
        classification: 'Classification',
        anomaly: 'ANOMALY',
        na: 'N/A',
        quarter: 'Quarter',
        year: 'Year'
      },
      loading: 'Loading data...',
      error: 'Error loading data. Please try again.',
      dataAttribution: 'Data by CIA Platform'
    },
    sv: {
      title: 'Säsongsmönster (2002-2025)',
      subtitle: 'Kvartalsanalys med Z-poäng anomalidetektering',
      filters: {
        year: 'År',
        quarter: 'Kvartal',
        election: 'Valstatus',
        classification: 'Aktivitetsklassificering',
        allYears: 'Alla år',
        allQuarters: 'Alla kvartal',
        allElections: 'Alla',
        electionYears: 'Valår',
        nonElectionYears: 'Icke-valår',
        allClassifications: 'Alla klassificeringar'
      },
      quarters: {
        Q1: 'Q1 - Vintersession',
        Q2: 'Q2 - Vårsession',
        Q3: 'Q3 - Sommaruppehåll',
        Q4: 'Q4 - Höstsession'
      },
      charts: {
        heatmap: {
          title: 'Kvartalsaktivitet värmekarta (2002-2025)',
          description: 'Omröstningsvolym per år och kvartal med Z-poäng'
        },
        zscore: {
          title: 'Z-poäng anomalidetektering',
          description: 'Statistiska avvikelser (|Z| ≥ 2.0) markerade i rött'
        },
        comparison: {
          title: 'Genomsnittlig aktivitet per kvartal (alla år)',
          description: 'Q1-Q4 baslinjer med standardavvikelseband'
        },
        classification: {
          title: 'Säsongsmönster klassificering',
          description: 'Fördelning av NORMAL, FÖRHÖJD, REDUCERAD, ANOMALI mönster'
        },
        qoq: {
          title: 'Kvartal-till-kvartal förändringar',
          description: 'Sekventiella omröstningsförändringar (% och absolut)'
        }
      },
      classifications: {
        NORMAL_ACTIVITY: 'Normal aktivitet',
        ELEVATED_ACTIVITY: 'Förhöjd aktivitet',
        REDUCED_ACTIVITY: 'Reducerad aktivitet',
        ANOMALY_DETECTED: 'Anomali upptäckt',
        NORMAL_SEASONAL_PATTERN: 'Normalt säsongsmönster',
        Q3_SUMMER_LULL: 'Q3 sommaruppehåll',
        Q4_ELEVATED_ACTIVITY: 'Q4 förhöjd aktivitet',
        UNUSUALLY_HIGH_ACTIVITY: 'Ovanligt hög aktivitet',
        UNUSUALLY_LOW_ACTIVITY: 'Ovanligt låg aktivitet'
      },
      tooltips: {
        ballots: 'Omröstningar',
        zScore: 'Z-poäng',
        classification: 'Klassificering',
        anomaly: 'ANOMALI',
        na: 'Saknas',
        quarter: 'Kvartal',
        year: 'År'
      },
      loading: 'Laddar data...',
      error: 'Fel vid inläsning av data. Försök igen.',
      dataAttribution: 'Data från CIA-plattformen'
    },
    da: {
      title: 'Sæsonmønstre (2002-2025)',
      subtitle: 'Kvartalsanalyse med Z-score anomalidetektion',
      filters: {
        year: 'År',
        quarter: 'Kvartal',
        election: 'Valgstatus',
        classification: 'Aktivitetsklassificering',
        allYears: 'Alle år',
        allQuarters: 'Alle kvartaler',
        allElections: 'Alle',
        electionYears: 'Valgår',
        nonElectionYears: 'Ikke-valgår',
        allClassifications: 'Alle klassificeringer'
      },
      quarters: {
        Q1: 'K1 - Vintersession',
        Q2: 'K2 - Forårssession',
        Q3: 'K3 - Sommerpause',
        Q4: 'K4 - Efterårssession'
      },
      charts: {
        heatmap: {
          title: 'Kvartalsaktivitet varmekort (2002-2025)',
          description: 'Afstemningsvolumen efter år og kvartal med Z-score'
        },
        zscore: {
          title: 'Z-score anomalidetektion',
          description: 'Statistiske afvigelser (|Z| ≥ 2.0) markeret med rødt'
        },
        comparison: {
          title: 'Gennemsnitlig aktivitet efter kvartal (alle år)',
          description: 'K1-K4 basislinjer med standardafvikelsesbånd'
        },
        classification: {
          title: 'Sæsonmønster klassificering',
          description: 'Fordeling af NORMAL, FORHØJET, REDUCERET, ANOMALI mønstre'
        },
        qoq: {
          title: 'Kvartal-til-kvartal ændringer',
          description: 'Sekventielle afstemningsændringer (% og absolut)'
        }
      },
      classifications: {
        NORMAL_ACTIVITY: 'Normal aktivitet',
        ELEVATED_ACTIVITY: 'Forhøjet aktivitet',
        REDUCED_ACTIVITY: 'Reduceret aktivitet',
        ANOMALY_DETECTED: 'Anomali opdaget',
        NORMAL_SEASONAL_PATTERN: 'Normalt sæsonmønster',
        Q3_SUMMER_LULL: 'K3 sommerpause',
        Q4_ELEVATED_ACTIVITY: 'K4 forhøjet aktivitet',
        UNUSUALLY_HIGH_ACTIVITY: 'Usædvanligt høj aktivitet',
        UNUSUALLY_LOW_ACTIVITY: 'Usædvanligt lav aktivitet'
      },
      tooltips: {
        ballots: 'Afstemninger',
        zScore: 'Z-score',
        classification: 'Klassificering',
        anomaly: 'ANOMALI',
        na: 'Mangler',
        quarter: 'Kvartal',
        year: 'År'
      },
      loading: 'Indlæser data...',
      error: 'Fejl ved indlæsning af data. Prøv igen.',
      dataAttribution: 'Data fra CIA-platformen'
    },
    // Additional languages with full translations
    no: { title: 'Sesongmønstre (2002-2025)', subtitle: 'Kvartalsanalyse med Z-score anomalideteksjon', filters: { year: 'År', quarter: 'Kvartal', election: 'Valgstatus', classification: 'Aktivitetsklassifisering', allYears: 'Alle år', allQuarters: 'Alle kvartaler', allElections: 'Alle', electionYears: 'Valgår', nonElectionYears: 'Ikke-valgår', allClassifications: 'Alle klassifiseringer' }, quarters: { Q1: 'K1 - Vintersesjon', Q2: 'K2 - Vårsesjon', Q3: 'K3 - Sommerferie', Q4: 'K4 - Høstsesjon' }, charts: { heatmap: { title: 'Kvartalsaktivitet varmekart (2002-2025)', description: 'Avstemningsvolum etter år og kvartal med Z-score' }, zscore: { title: 'Z-score anomalideteksjon', description: 'Statistiske avvik (|Z| ≥ 2.0) markert i rødt' }, comparison: { title: 'Gjennomsnittlig aktivitet etter kvartal (alle år)', description: 'K1-K4 basislinjer med standardavviksbånd' }, classification: { title: 'Sesongmønster klassifisering', description: 'Fordeling av NORMAL, FORHØYET, REDUSERT, ANOMALI mønstre' }, qoq: { title: 'Kvartal-til-kvartal endringer', description: 'Sekvensielle avstemningsendringer (% og absolutt)' } }, classifications: { NORMAL_ACTIVITY: 'Normal aktivitet', ELEVATED_ACTIVITY: 'Forhøyet aktivitet', REDUCED_ACTIVITY: 'Redusert aktivitet', ANOMALY_DETECTED: 'Anomali oppdaget', NORMAL_SEASONAL_PATTERN: 'Normalt sesongmønster', Q3_SUMMER_LULL: 'K3 sommerferie', Q4_ELEVATED_ACTIVITY: 'K4 forhøyet aktivitet', UNUSUALLY_HIGH_ACTIVITY: 'Uvanlig høy aktivitet', UNUSUALLY_LOW_ACTIVITY: 'Uvanlig lav aktivitet' }, loading: 'Laster data...', error: 'Feil ved lasting av data. Prøv igjen.', dataAttribution: 'Data fra CIA-plattformen' },
    fi: { title: 'Kausivaihtelut (2002-2025)', subtitle: 'Neljännesvuosi-analyysi Z-pisteiden poikkeamatunnistuksella', filters: { year: 'Vuosi', quarter: 'Kvartaali', election: 'Vaalitilanne', classification: 'Aktiviteettiluokitus', allYears: 'Kaikki vuodet', allQuarters: 'Kaikki kvartaalit', allElections: 'Kaikki', electionYears: 'Vaalivuodet', nonElectionYears: 'Ei-vaalivuodet', allClassifications: 'Kaikki luokitukset' }, quarters: { Q1: 'Q1 - Talviistunto', Q2: 'Q2 - Kevätistunto', Q3: 'Q3 - Kesätauko', Q4: 'Q4 - Syysistunto' }, charts: { heatmap: { title: 'Neljännesvuosi-aktiviteetti lämpökartta (2002-2025)', description: 'Äänestysvolyymi vuoden ja kvartaalin mukaan Z-pisteillä' }, zscore: { title: 'Z-piste poikkeamatunnistus', description: 'Tilastolliset poikkeamat (|Z| ≥ 2.0) merkitty punaisella' }, comparison: { title: 'Keskimääräinen aktiviteetti kvartaaleittain (kaikki vuodet)', description: 'Q1-Q4 perusviivat keskihajontakaistaleilla' }, classification: { title: 'Kausivaihtelujen luokittelu', description: 'NORMAALI, KOHONNUT, ALENTUNUT, POIKKEAMA -mallien jakauma' }, qoq: { title: 'Kvartaalista toiseen muutokset', description: 'Peräkkäiset äänestysmuutokset (% ja absoluuttinen)' } }, classifications: { NORMAL_ACTIVITY: 'Normaali aktiviteetti', ELEVATED_ACTIVITY: 'Kohonnut aktiviteetti', REDUCED_ACTIVITY: 'Alentunut aktiviteetti', ANOMALY_DETECTED: 'Poikkeama havaittu', NORMAL_SEASONAL_PATTERN: 'Normaali kausimalli', Q3_SUMMER_LULL: 'Q3 kesätauko', Q4_ELEVATED_ACTIVITY: 'Q4 kohonnut aktiviteetti', UNUSUALLY_HIGH_ACTIVITY: 'Epätavallisen korkea aktiviteetti', UNUSUALLY_LOW_ACTIVITY: 'Epätavallisen matala aktiviteetti' }, loading: 'Ladataan tietoja...', error: 'Virhe tietojen lataamisessa. Yritä uudelleen.', dataAttribution: 'Data CIA-alustalta' },
    de: { title: 'Saisonale Muster (2002-2025)', subtitle: 'Quartalsanalyse mit Z-Score-Anomalieerkennung', filters: { year: 'Jahr', quarter: 'Quartal', election: 'Wahlstatus', classification: 'Aktivitätsklassifizierung', allYears: 'Alle Jahre', allQuarters: 'Alle Quartale', allElections: 'Alle', electionYears: 'Wahljahre', nonElectionYears: 'Nicht-Wahljahre', allClassifications: 'Alle Klassifizierungen' }, quarters: { Q1: 'Q1 - Wintersitzung', Q2: 'Q2 - Frühjahrssitzung', Q3: 'Q3 - Sommerpause', Q4: 'Q4 - Herbstsitzung' }, charts: { heatmap: { title: 'Quartalsaktivität Heatmap (2002-2025)', description: 'Abstimmungsvolumen nach Jahr und Quartal mit Z-Score' }, zscore: { title: 'Z-Score-Anomalieerkennung', description: 'Statistische Ausreißer (|Z| ≥ 2.0) rot markiert' }, comparison: { title: 'Durchschnittliche Aktivität nach Quartal (alle Jahre)', description: 'Q1-Q4 Basislinien mit Standardabweichungsbändern' }, classification: { title: 'Saisonale Musterklassifizierung', description: 'Verteilung von NORMAL, ERHÖHT, REDUZIERT, ANOMALIE Mustern' }, qoq: { title: 'Quartal-zu-Quartal Änderungen', description: 'Aufeinanderfolgende Abstimmungsänderungen (% und absolut)' } }, classifications: { NORMAL_ACTIVITY: 'Normale Aktivität', ELEVATED_ACTIVITY: 'Erhöhte Aktivität', REDUCED_ACTIVITY: 'Reduzierte Aktivität', ANOMALY_DETECTED: 'Anomalie erkannt', NORMAL_SEASONAL_PATTERN: 'Normales saisonales Muster', Q3_SUMMER_LULL: 'Q3 Sommerpause', Q4_ELEVATED_ACTIVITY: 'Q4 erhöhte Aktivität', UNUSUALLY_HIGH_ACTIVITY: 'Ungewöhnlich hohe Aktivität', UNUSUALLY_LOW_ACTIVITY: 'Ungewöhnlich niedrige Aktivität' }, loading: 'Daten werden geladen...', error: 'Fehler beim Laden der Daten. Bitte versuchen Sie es erneut.', dataAttribution: 'Daten von CIA-Plattform' },
    fr: { title: 'Schémas saisonniers (2002-2025)', subtitle: 'Analyse trimestrielle avec détection d\'anomalies par score Z', filters: { year: 'Année', quarter: 'Trimestre', election: 'Statut électoral', classification: 'Classification d\'activité', allYears: 'Toutes les années', allQuarters: 'Tous les trimestres', allElections: 'Tous', electionYears: 'Années électorales', nonElectionYears: 'Années non-électorales', allClassifications: 'Toutes les classifications' }, quarters: { Q1: 'T1 - Session d\'hiver', Q2: 'T2 - Session de printemps', Q3: 'T3 - Pause estivale', Q4: 'T4 - Session d\'automne' }, charts: { heatmap: { title: 'Carte de chaleur d\'activité trimestrielle (2002-2025)', description: 'Volume de scrutins par année et trimestre avec score Z' }, zscore: { title: 'Détection d\'anomalies par score Z', description: 'Valeurs aberrantes statistiques (|Z| ≥ 2.0) marquées en rouge' }, comparison: { title: 'Activité moyenne par trimestre (toutes les années)', description: 'Lignes de base T1-T4 avec bandes d\'écart-type' }, classification: { title: 'Classification des schémas saisonniers', description: 'Distribution des schémas NORMAL, ÉLEVÉ, RÉDUIT, ANOMALIE' }, qoq: { title: 'Changements d\'un trimestre à l\'autre', description: 'Changements séquentiels de scrutins (% et absolu)' } }, classifications: { NORMAL_ACTIVITY: 'Activité normale', ELEVATED_ACTIVITY: 'Activité élevée', REDUCED_ACTIVITY: 'Activité réduite', ANOMALY_DETECTED: 'Anomalie détectée', NORMAL_SEASONAL_PATTERN: 'Schéma saisonnier normal', Q3_SUMMER_LULL: 'T3 pause estivale', Q4_ELEVATED_ACTIVITY: 'T4 activité élevée', UNUSUALLY_HIGH_ACTIVITY: 'Activité exceptionnellement élevée', UNUSUALLY_LOW_ACTIVITY: 'Activité exceptionnellement basse' }, loading: 'Chargement des données...', error: 'Erreur lors du chargement des données. Veuillez réessayer.', dataAttribution: 'Données de la plateforme CIA' },
    es: { title: 'Patrones estacionales (2002-2025)', subtitle: 'Análisis trimestral con detección de anomalías por puntuación Z', filters: { year: 'Año', quarter: 'Trimestre', election: 'Estado electoral', classification: 'Clasificación de actividad', allYears: 'Todos los años', allQuarters: 'Todos los trimestres', allElections: 'Todos', electionYears: 'Años electorales', nonElectionYears: 'Años no electorales', allClassifications: 'Todas las clasificaciones' }, quarters: { Q1: 'T1 - Sesión de invierno', Q2: 'T2 - Sesión de primavera', Q3: 'T3 - Receso de verano', Q4: 'T4 - Sesión de otoño' }, charts: { heatmap: { title: 'Mapa de calor de actividad trimestral (2002-2025)', description: 'Volumen de votaciones por año y trimestre con puntuación Z' }, zscore: { title: 'Detección de anomalías por puntuación Z', description: 'Valores atípicos estadísticos (|Z| ≥ 2.0) marcados en rojo' }, comparison: { title: 'Actividad promedio por trimestre (todos los años)', description: 'Líneas base T1-T4 con bandas de desviación estándar' }, classification: { title: 'Clasificación de patrones estacionales', description: 'Distribución de patrones NORMAL, ELEVADO, REDUCIDO, ANOMALÍA' }, qoq: { title: 'Cambios de trimestre a trimestre', description: 'Cambios secuenciales de votaciones (% y absoluto)' } }, classifications: { NORMAL_ACTIVITY: 'Actividad normal', ELEVATED_ACTIVITY: 'Actividad elevada', REDUCED_ACTIVITY: 'Actividad reducida', ANOMALY_DETECTED: 'Anomalía detectada', NORMAL_SEASONAL_PATTERN: 'Patrón estacional normal', Q3_SUMMER_LULL: 'T3 receso de verano', Q4_ELEVATED_ACTIVITY: 'T4 actividad elevada', UNUSUALLY_HIGH_ACTIVITY: 'Actividad inusualmente alta', UNUSUALLY_LOW_ACTIVITY: 'Actividad inusualmente baja' }, loading: 'Cargando datos...', error: 'Error al cargar los datos. Por favor, inténtelo de nuevo.', dataAttribution: 'Datos de la plataforma CIA' },
    nl: { title: 'Seizoenspatronen (2002-2025)', subtitle: 'Kwartaalanalyse met Z-score anomaliedetectie', filters: { year: 'Jaar', quarter: 'Kwartaal', election: 'Verkiezingsstatus', classification: 'Activiteitsclassificatie', allYears: 'Alle jaren', allQuarters: 'Alle kwartalen', allElections: 'Alle', electionYears: 'Verkiezingsjaren', nonElectionYears: 'Niet-verkiezingsjaren', allClassifications: 'Alle classificaties' }, quarters: { Q1: 'K1 - Wintersessie', Q2: 'K2 - Voorjaarssessie', Q3: 'K3 - Zomerpauze', Q4: 'K4 - Herfst sessie' }, charts: { heatmap: { title: 'Kwartaalactiviteit heatmap (2002-2025)', description: 'Stemvolume per jaar en kwartaal met Z-score' }, zscore: { title: 'Z-score anomaliedetectie', description: 'Statistische uitschieters (|Z| ≥ 2.0) gemarkeerd in rood' }, comparison: { title: 'Gemiddelde activiteit per kwartaal (alle jaren)', description: 'K1-K4 basislijnen met standaardafwijkingsbanden' }, classification: { title: 'Seizoenspatroon classificatie', description: 'Verdeling van NORMAAL, VERHOOGD, VERMINDERD, ANOMALIE patronen' }, qoq: { title: 'Kwartaal-op-kwartaal veranderingen', description: 'Opeenvolgende stemveranderingen (% en absoluut)' } }, classifications: { NORMAL_ACTIVITY: 'Normale activiteit', ELEVATED_ACTIVITY: 'Verhoogde activiteit', REDUCED_ACTIVITY: 'Verminderde activiteit', ANOMALY_DETECTED: 'Anomalie gedetecteerd', NORMAL_SEASONAL_PATTERN: 'Normaal seizoenspatroon', Q3_SUMMER_LULL: 'K3 zomerpauze', Q4_ELEVATED_ACTIVITY: 'K4 verhoogde activiteit', UNUSUALLY_HIGH_ACTIVITY: 'Ongewoon hoge activiteit', UNUSUALLY_LOW_ACTIVITY: 'Ongewoon lage activiteit' }, loading: 'Gegevens laden...', error: 'Fout bij het laden van gegevens. Probeer het opnieuw.', dataAttribution: 'Data van CIA-platform' },
    ar: { title: 'الأنماط الموسمية (2002-2025)', subtitle: 'تحليل ربع سنوي مع كشف الشذوذ بالنقاط Z', filters: { year: 'السنة', quarter: 'الربع', election: 'حالة الانتخابات', classification: 'تصنيف النشاط', allYears: 'كل السنوات', allQuarters: 'كل الأرباع', allElections: 'الكل', electionYears: 'سنوات الانتخابات', nonElectionYears: 'سنوات بدون انتخابات', allClassifications: 'كل التصنيفات' }, quarters: { Q1: 'الربع 1 - جلسة الشتاء', Q2: 'الربع 2 - جلسة الربيع', Q3: 'الربع 3 - عطلة الصيف', Q4: 'الربع 4 - جلسة الخريف' }, charts: { heatmap: { title: 'خريطة حرارية للنشاط الفصلي (2002-2025)', description: 'حجم التصويت حسب السنة والربع مع نقاط Z' }, zscore: { title: 'كشف الشذوذ بالنقاط Z', description: 'القيم الشاذة الإحصائية (|Z| ≥ 2.0) مميزة بالأحمر' }, comparison: { title: 'متوسط النشاط حسب الربع (كل السنوات)', description: 'خطوط أساسية للربع 1-4 مع نطاقات الانحراف المعياري' }, classification: { title: 'تصنيف الأنماط الموسمية', description: 'توزيع الأنماط العادية والمرتفعة والمنخفضة والشاذة' }, qoq: { title: 'التغيرات من ربع لآخر', description: 'التغيرات المتسلسلة في التصويت (% ومطلق)' } }, classifications: { NORMAL_ACTIVITY: 'نشاط عادي', ELEVATED_ACTIVITY: 'نشاط مرتفع', REDUCED_ACTIVITY: 'نشاط منخفض', ANOMALY_DETECTED: 'شذوذ مكتشف', NORMAL_SEASONAL_PATTERN: 'نمط موسمي عادي', Q3_SUMMER_LULL: 'الربع 3 عطلة صيفية', Q4_ELEVATED_ACTIVITY: 'الربع 4 نشاط مرتفع', UNUSUALLY_HIGH_ACTIVITY: 'نشاط مرتفع بشكل غير عادي', UNUSUALLY_LOW_ACTIVITY: 'نشاط منخفض بشكل غير عادي' }, loading: 'جاري تحميل البيانات...', error: 'خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.', dataAttribution: 'البيانات من منصة CIA' },
    he: { title: 'דפוסים עונתיים (2002-2025)', subtitle: 'ניתוח רבעוני עם זיהוי חריגות Z-Score', filters: { year: 'שנה', quarter: 'רבעון', election: 'סטטוס בחירות', classification: 'סיווג פעילות', allYears: 'כל השנים', allQuarters: 'כל הרבעונים', allElections: 'הכל', electionYears: 'שנות בחירות', nonElectionYears: 'שנים ללא בחירות', allClassifications: 'כל הסיווגים' }, quarters: { Q1: 'רבעון 1 - מושב חורף', Q2: 'רבעון 2 - מושב אביב', Q3: 'רבעון 3 - הפסקת קיץ', Q4: 'רבעון 4 - מושב סתיו' }, charts: { heatmap: { title: 'מפת חום של פעילות רבעונית (2002-2025)', description: 'נפח הצבעות לפי שנה ורבעון עם ציון Z' }, zscore: { title: 'זיהוי חריגות Z-Score', description: 'ערכים סטטיסטיים חריגים (|Z| ≥ 2.0) מסומנים באדום' }, comparison: { title: 'פעילות ממוצעת לפי רבעון (כל השנים)', description: 'קווי בסיס רבעון 1-4 עם רצועות סטיית תקן' }, classification: { title: 'סיווג דפוסים עונתיים', description: 'התפלגות דפוסים רגילים, מוגברים, מופחתים וחריגים' }, qoq: { title: 'שינויים מרבעון לרבעון', description: 'שינויים רציפים בהצבעה (% ומוחלט)' } }, classifications: { NORMAL_ACTIVITY: 'פעילות רגילה', ELEVATED_ACTIVITY: 'פעילות מוגברת', REDUCED_ACTIVITY: 'פעילות מופחתת', ANOMALY_DETECTED: 'חריגה זוהתה', NORMAL_SEASONAL_PATTERN: 'דפוס עונתי רגיל', Q3_SUMMER_LULL: 'רבעון 3 הפסקת קיץ', Q4_ELEVATED_ACTIVITY: 'רבעון 4 פעילות מוגברת', UNUSUALLY_HIGH_ACTIVITY: 'פעילות גבוהה במיוחד', UNUSUALLY_LOW_ACTIVITY: 'פעילות נמוכה במיוחד' }, loading: 'טוען נתונים...', error: 'שגיאה בטעינת נתונים. נסה שוב.', dataAttribution: 'נתונים מפלטפורמת CIA' },
    ja: { title: '季節パターン (2002-2025)', subtitle: 'Zスコア異常検出を伴う四半期分析', filters: { year: '年', quarter: '四半期', election: '選挙状況', classification: '活動分類', allYears: 'すべての年', allQuarters: 'すべての四半期', allElections: 'すべて', electionYears: '選挙年', nonElectionYears: '非選挙年', allClassifications: 'すべての分類' }, quarters: { Q1: 'Q1 - 冬季会期', Q2: 'Q2 - 春季会期', Q3: 'Q3 - 夏季休会', Q4: 'Q4 - 秋季会期' }, charts: { heatmap: { title: '四半期活動ヒートマップ (2002-2025)', description: '年と四半期別の投票量とZスコア' }, zscore: { title: 'Zスコア異常検出', description: '統計的外れ値 (|Z| ≥ 2.0) を赤でマーク' }, comparison: { title: '四半期別平均活動（全年）', description: 'Q1-Q4のベースラインと標準偏差バンド' }, classification: { title: '季節パターン分類', description: '正常、上昇、減少、異常パターンの分布' }, qoq: { title: '四半期間の変化', description: '連続的な投票変化（%と絶対値）' } }, classifications: { NORMAL_ACTIVITY: '通常の活動', ELEVATED_ACTIVITY: '活動上昇', REDUCED_ACTIVITY: '活動減少', ANOMALY_DETECTED: '異常検出', NORMAL_SEASONAL_PATTERN: '通常の季節パターン', Q3_SUMMER_LULL: 'Q3夏季休会', Q4_ELEVATED_ACTIVITY: 'Q4活動上昇', UNUSUALLY_HIGH_ACTIVITY: '異常に高い活動', UNUSUALLY_LOW_ACTIVITY: '異常に低い活動' }, loading: 'データ読み込み中...', error: 'データの読み込みエラー。もう一度お試しください。', dataAttribution: 'CIAプラットフォームのデータ' },
    ko: { title: '계절별 패턴 (2002-2025)', subtitle: 'Z점수 이상 탐지를 통한 분기별 분석', filters: { year: '년도', quarter: '분기', election: '선거 상태', classification: '활동 분류', allYears: '모든 연도', allQuarters: '모든 분기', allElections: '모두', electionYears: '선거 연도', nonElectionYears: '비선거 연도', allClassifications: '모든 분류' }, quarters: { Q1: '1분기 - 겨울 회기', Q2: '2분기 - 봄 회기', Q3: '3분기 - 여름 휴회', Q4: '4분기 - 가을 회기' }, charts: { heatmap: { title: '분기별 활동 히트맵 (2002-2025)', description: '연도 및 분기별 투표량과 Z점수' }, zscore: { title: 'Z점수 이상 탐지', description: '통계적 이상값 (|Z| ≥ 2.0)은 빨간색으로 표시' }, comparison: { title: '분기별 평균 활동 (모든 연도)', description: '1~4분기 기준선과 표준편차 밴드' }, classification: { title: '계절별 패턴 분류', description: '정상, 상승, 감소, 이상 패턴의 분포' }, qoq: { title: '분기별 변화', description: '순차적 투표 변화 (% 및 절대값)' } }, classifications: { NORMAL_ACTIVITY: '정상 활동', ELEVATED_ACTIVITY: '상승 활동', REDUCED_ACTIVITY: '감소 활동', ANOMALY_DETECTED: '이상 탐지', NORMAL_SEASONAL_PATTERN: '정상 계절 패턴', Q3_SUMMER_LULL: '3분기 여름 휴회', Q4_ELEVATED_ACTIVITY: '4분기 상승 활동', UNUSUALLY_HIGH_ACTIVITY: '비정상적으로 높은 활동', UNUSUALLY_LOW_ACTIVITY: '비정상적으로 낮은 활동' }, loading: '데이터 로딩 중...', error: '데이터 로딩 오류. 다시 시도해주세요.', dataAttribution: 'CIA 플랫폼의 데이터' },
    zh: { title: '季节性模式 (2002-2025)', subtitle: '带Z分数异常检测的季度分析', filters: { year: '年份', quarter: '季度', election: '选举状态', classification: '活动分类', allYears: '所有年份', allQuarters: '所有季度', allElections: '全部', electionYears: '选举年', nonElectionYears: '非选举年', allClassifications: '所有分类' }, quarters: { Q1: '第1季度 - 冬季会期', Q2: '第2季度 - 春季会期', Q3: '第3季度 - 夏季休会', Q4: '第4季度 - 秋季会期' }, charts: { heatmap: { title: '季度活动热图 (2002-2025)', description: '按年份和季度的投票量与Z分数' }, zscore: { title: 'Z分数异常检测', description: '统计异常值 (|Z| ≥ 2.0) 标记为红色' }, comparison: { title: '按季度的平均活动（所有年份）', description: '第1-4季度基线与标准差带' }, classification: { title: '季节性模式分类', description: '正常、升高、降低、异常模式的分布' }, qoq: { title: '季度环比变化', description: '连续投票变化（%和绝对值）' } }, classifications: { NORMAL_ACTIVITY: '正常活动', ELEVATED_ACTIVITY: '活动升高', REDUCED_ACTIVITY: '活动降低', ANOMALY_DETECTED: '检测到异常', NORMAL_SEASONAL_PATTERN: '正常季节性模式', Q3_SUMMER_LULL: '第3季度夏季休会', Q4_ELEVATED_ACTIVITY: '第4季度活动升高', UNUSUALLY_HIGH_ACTIVITY: '异常高的活动', UNUSUALLY_LOW_ACTIVITY: '异常低的活动' }, loading: '加载数据中...', error: '加载数据出错。请重试。', dataAttribution: '数据来自CIA平台' }
  };

  // ============================================================================
  // Data Manager
  // ============================================================================
  
  class SeasonalPatternsDataManager {
    constructor() {
      this.data = null;
      this.cachedData = null;
    }

    /**
     * Fetch data from CIA platform with 24-hour caching
     * Implements local-first loading: tries local file, then remote fallback
     */
    async fetchData() {
      try {
        // Check cache first
        const cached = this.getCachedData();
        if (cached) {
          console.log('Using cached seasonal patterns data');
          this.data = cached;
          return cached;
        }

        // Try each URL in sequence (local first, then remote)
        let lastError = null;
        for (let i = 0; i < CONFIG.dataUrls.length; i++) {
          const url = CONFIG.dataUrls[i];
          const isLocal = !url.startsWith('http');
          
          try {
            console.log(`Fetching seasonal patterns data from ${isLocal ? 'local' : 'remote'} source (${i + 1}/${CONFIG.dataUrls.length})...`);
            const response = await fetch(url);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const csvText = await response.text();
            const parsedData = this.parseCSV(csvText);
            
            // Cache the data
            this.setCachedData(parsedData);
            this.data = parsedData;
            
            console.log(`✅ Loaded ${parsedData.length} seasonal activity records from ${isLocal ? 'local' : 'remote'} source`);
            return parsedData;
          } catch (error) {
            lastError = error;
            console.warn(`Failed to load from ${isLocal ? 'local' : 'remote'} source: ${error.message}`);
            // Continue to next URL
          }
        }
        
        // All URLs failed
        throw lastError || new Error('All data sources failed');
        
      } catch (error) {
        console.error('Error fetching seasonal patterns data:', error);
        // Try to use cached data even if expired
        const cached = localStorage.getItem(CONFIG.cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object' && 'data' in parsed) {
              console.log('Using expired cache as fallback');
              this.data = parsed.data;
              return parsed.data;
            } else {
              console.warn('Expired cache is in an unexpected format, ignoring.');
            }
          } catch (parseError) {
            console.warn('Failed to parse expired cache, ignoring.', parseError);
          }
        }
        throw error;
      }
    }

    /**
     * Parse CSV data using PapaParse (if available) or fallback parser
     */
    parseCSV(csvText) {
      if (typeof Papa !== 'undefined') {
        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        return parsed.data;
      } else {
        // Fallback CSV parser
        return this.parseCSVFallback(csvText);
      }
    }

    /**
     * Fallback CSV parser (if PapaParse is not available)
     * Uses d3.csvParse when available (handles RFC 4180 quoted fields),
     * otherwise falls back to a minimal parser.
     */
    parseCSVFallback(csvText) {
      // Prefer d3.csvParse if D3 is available (handles RFC 4180 properly)
      if (typeof d3 !== 'undefined' && typeof d3.csvParse === 'function') {
        try {
          const parsed = d3.csvParse(csvText, (d) => {
            const row = {};
            Object.keys(d).forEach((key) => {
              const value = d[key];
              const numValue = typeof value === 'string' ? parseFloat(value) : NaN;
              row[key] = isNaN(numValue) ? value : numValue;
            });
            return row;
          });
          return parsed;
        } catch (err) {
          console.warn('d3.csvParse failed, using basic parser:', err);
        }
      }

      // Minimal fallback parser (does not handle quoted fields with commas)
      console.warn('Using basic CSV parser - quoted fields with commas may not parse correctly');
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          const value = values[index];
          // Try to convert to number
          const numValue = parseFloat(value);
          row[header] = isNaN(numValue) ? value : numValue;
        });
        data.push(row);
      }

      return data;
    }

    /**
     * Get cached data from LocalStorage
     */
    getCachedData() {
      try {
        const cached = localStorage.getItem(CONFIG.cacheKey);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        const now = Date.now();
        
        if (now - parsed.timestamp > CONFIG.cacheDuration) {
          console.log('Cache expired');
          return null;
        }

        return parsed.data;
      } catch (error) {
        console.error('Error reading cache:', error);
        return null;
      }
    }

    /**
     * Save data to LocalStorage cache
     */
    setCachedData(data) {
      try {
        const cacheObject = {
          data: data,
          timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.cacheKey, JSON.stringify(cacheObject));
        console.log('Data cached successfully');
      } catch (error) {
        console.error('Error caching data:', error);
      }
    }

    /**
     * Aggregate data by quarter (cross-year averages)
     */
    aggregateByQuarter() {
      if (!this.data) return null;

      const quarters = { Q1: [], Q2: [], Q3: [], Q4: [] };
      
      this.data.forEach(row => {
        const quarter = `Q${row.quarter}`;
        if (quarters[quarter]) {
          quarters[quarter].push(row);
        }
      });

      const aggregated = {};
      Object.keys(quarters).forEach(q => {
        const records = quarters[q];
        if (records.length === 0) return;

        const ballots = records.map(r => r.total_ballots || 0);
        const attendance = records.map(r => r.attendance_rate || 0);
        const docs = records.map(r => r.documents_produced || 0);

        aggregated[q] = {
          quarter: q,
          avgBallots: this.mean(ballots),
          stddevBallots: this.stddev(ballots),
          avgAttendance: this.mean(attendance),
          stddevAttendance: this.stddev(attendance),
          avgDocs: this.mean(docs),
          stddevDocs: this.stddev(docs),
          count: records.length
        };
      });

      return aggregated;
    }

    /**
     * Identify anomalies (|Z-score| >= threshold)
     */
    identifyAnomalies(threshold = CONFIG.zScoreThreshold) {
      if (!this.data) return [];

      const anomalies = this.data.filter(row => {
        const ballotZ = Math.abs(row.ballot_z_score || 0);
        const docZ = Math.abs(row.doc_z_score || 0);
        const attendanceZ = Math.abs(row.attendance_z_score || 0);
        
        return ballotZ >= threshold || docZ >= threshold || attendanceZ >= threshold;
      });

      // Sort by maximum Z-score (descending)
      anomalies.sort((a, b) => {
        const maxZa = Math.max(
          Math.abs(a.ballot_z_score || 0),
          Math.abs(a.doc_z_score || 0),
          Math.abs(a.attendance_z_score || 0)
        );
        const maxZb = Math.max(
          Math.abs(b.ballot_z_score || 0),
          Math.abs(b.doc_z_score || 0),
          Math.abs(b.attendance_z_score || 0)
        );
        return maxZb - maxZa;
      });

      return anomalies;
    }

    /**
     * Calculate mean of an array
     */
    mean(arr) {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    /**
     * Calculate standard deviation of an array
     */
    stddev(arr) {
      if (arr.length === 0) return 0;
      const avg = this.mean(arr);
      const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
      const avgSquareDiff = this.mean(squareDiffs);
      return Math.sqrt(avgSquareDiff);
    }

    /**
     * Filter data by criteria
     */
    filterData(filters) {
      if (!this.data) return [];

      return this.data.filter(row => {
        if (filters.year && filters.year !== 'all' && row.year !== parseInt(filters.year)) {
          return false;
        }
        if (filters.quarter && filters.quarter !== 'all' && row.quarter !== parseInt(filters.quarter)) {
          return false;
        }
        if (filters.election && filters.election !== 'all') {
          const isElection = row.is_election_year === 't' || row.is_election_year === true;
          if (filters.election === 'election' && !isElection) return false;
          if (filters.election === 'non-election' && isElection) return false;
        }
        if (filters.classification && filters.classification !== 'all') {
          if (row.base_activity_classification !== filters.classification &&
              row.seasonal_pattern_classification !== filters.classification) {
            return false;
          }
        }
        return true;
      });
    }
  }

  // ============================================================================
  // Chart Renderers
  // ============================================================================
  
  class SeasonalPatternsCharts {
    constructor(dataManager, language = 'en') {
      this.dataManager = dataManager;
      this.language = language;
      this.translations = TRANSLATIONS[language] || TRANSLATIONS.en;
      this.chartInstances = {};
    }

    /**
     * Destroy all chart instances
     */
    destroyCharts() {
      Object.keys(this.chartInstances).forEach(key => {
        if (this.chartInstances[key]) {
          this.chartInstances[key].destroy();
          delete this.chartInstances[key];
        }
      });
    }

    /**
     * Render all charts
     */
    async renderAll(filteredData = null) {
      const data = filteredData || this.dataManager.data;
      if (!data || data.length === 0) {
        console.warn('No data available for rendering');
        return;
      }

      this.destroyCharts();

      // Render each chart
      this.renderSeasonalHeatmap(data);
      this.renderZScoreTimeline(data);
      this.renderQuarterComparison(data);
      this.renderClassificationChart(data);
      this.renderQoQChangeChart(data);
    }

    /**
     * Render seasonal heat map using D3.js
     */
    renderSeasonalHeatmap(data) {
      const container = document.getElementById('seasonal-heatmap');
      if (!container || typeof d3 === 'undefined') {
        console.warn('D3.js not loaded or container not found');
        return;
      }

      // Clear container
      container.innerHTML = '';

      // Dimensions
      const margin = { top: 40, right: 100, bottom: 60, left: 60 };
      const width = Math.min(container.clientWidth, 1200) - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      // Create SVG
      const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('role', 'img')
        .attr('aria-label', this.translations.charts.heatmap.title)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Get unique years and quarters
      const years = [...new Set(data.map(d => d.year))].sort();
      const quarters = [1, 2, 3, 4];

      // Scales
      const xScale = d3.scaleBand()
        .domain(quarters)
        .range([0, width])
        .padding(0.05);

      const yScale = d3.scaleBand()
        .domain(years)
        .range([0, height])
        .padding(0.05);

      // Color scale for ballots
      const maxBallots = d3.max(data, d => d.total_ballots || 0);
      const colorScale = d3.scaleSequential()
        .domain([0, maxBallots])
        .interpolator(d3.interpolateYlOrRd);

      // Create heat map cells
      svg.selectAll('.cell')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', d => xScale(d.quarter))
        .attr('y', d => yScale(d.year))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.total_ballots || 0))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('role', 'presentation')
        .on('mouseover', function(event, d) {
          // Tooltip
          d3.select(this).attr('stroke', '#000').attr('stroke-width', 2);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1);
        })
        .append('title')
        .text(d => {
          const t = this.translations;
          const classText = t.classifications[d.seasonal_pattern_classification] || t.classifications[d.base_activity_classification] || d.seasonal_pattern_classification || t.tooltips.na;
          return `${d.year} Q${d.quarter}\n${t.tooltips.ballots}: ${d.total_ballots}\n${t.tooltips.zScore}: ${(d.ballot_z_score || 0).toFixed(2)}\n${t.tooltips.classification}: ${classText}`;
        });

      // Add anomaly markers
      const anomalies = data.filter(d => Math.abs(d.ballot_z_score || 0) >= CONFIG.zScoreThreshold);
      svg.selectAll('.anomaly-marker')
        .data(anomalies)
        .enter()
        .append('circle')
        .attr('class', 'anomaly-marker')
        .attr('cx', d => xScale(d.quarter) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.year) + yScale.bandwidth() / 2)
        .attr('r', 8)
        .attr('fill', CONFIG.colors.danger)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('role', 'presentation')
        .append('title')
        .text(d => {
          const t = this.translations;
          return `${t.tooltips.anomaly}: ${d.year} Q${d.quarter}\n${t.tooltips.zScore}: ${(d.ballot_z_score || 0).toFixed(2)}`;
        });

      // Add axes
      const xAxis = d3.axisBottom(xScale)
        .tickFormat(q => `Q${q}`);
      
      const yAxis = d3.axisLeft(yScale);

      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .attr('class', 'axis');

      svg.append('g')
        .call(yAxis)
        .attr('class', 'axis');

      // Add axis labels
      const quarterLabel = this.translations.filters?.quarter || 'Quarter';
      const yearLabel = this.translations.filters?.year || 'Year';
      
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .text(quarterLabel)
        .style('font-size', '14px')
        .style('font-weight', '500');

      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .text(yearLabel)
        .style('font-size', '14px')
        .style('font-weight', '500');

      // Add legend
      const legendHeight = 10;
      const legend = svg.append('g')
        .attr('transform', `translate(${width + 20}, 0)`);

      const legendScale = d3.scaleLinear()
        .domain([0, maxBallots])
        .range([0, legendHeight * 20]);

      const legendAxis = d3.axisRight(legendScale)
        .ticks(5);

      // Legend gradient
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');

      gradient.selectAll('stop')
        .data(d3.range(0, 1.1, 0.1))
        .enter()
        .append('stop')
        .attr('offset', d => `${d * 100}%`)
        .attr('stop-color', d => colorScale(d * maxBallots));

      legend.append('rect')
        .attr('width', legendHeight)
        .attr('height', legendHeight * 20)
        .style('fill', 'url(#legend-gradient)');

      legend.append('g')
        .attr('transform', `translate(${legendHeight}, 0)`)
        .call(legendAxis);

      legend.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .text('Ballots')
        .style('font-size', '12px')
        .style('font-weight', '500');
    }

    /**
     * Render Z-score timeline using Chart.js
     */
    renderZScoreTimeline(data) {
      const canvas = document.getElementById('zscore-timeline-chart');
      if (!canvas || typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded or canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Sort data by year and quarter
      const sortedData = [...data].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter - b.quarter;
      });

      const labels = sortedData.map(d => `${d.year}-Q${d.quarter}`);
      const ballotZScores = sortedData.map(d => d.ballot_z_score || 0);
      const docZScores = sortedData.map(d => d.doc_z_score || 0);
      const attendanceZScores = sortedData.map(d => d.attendance_z_score || 0);

      this.chartInstances.zscore = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Ballot Z-Score',
              data: ballotZScores,
              borderColor: CONFIG.colors.primary,
              backgroundColor: CONFIG.colors.primary + '40',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.1
            },
            {
              label: 'Document Z-Score',
              data: docZScores,
              borderColor: CONFIG.colors.secondary,
              backgroundColor: CONFIG.colors.secondary + '40',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.1
            },
            {
              label: 'Attendance Z-Score',
              data: attendanceZScores,
              borderColor: CONFIG.colors.tertiary,
              backgroundColor: CONFIG.colors.tertiary + '40',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: false
            },
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += context.parsed.y.toFixed(2);
                  const absZ = Math.abs(context.parsed.y);
                  if (absZ >= CONFIG.zScoreThreshold) {
                    label += ' 🔴 ANOMALY';
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Year-Quarter'
              },
              ticks: {
                maxRotation: 90,
                minRotation: 45,
                autoSkip: true,
                maxTicksLimit: 20
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Z-Score'
              },
              min: -4,
              max: 4
            }
          }
        }
      });
    }

    /**
     * Render quarter comparison chart using Chart.js
     */
    renderQuarterComparison(data) {
      const canvas = document.getElementById('quarter-comparison-chart');
      if (!canvas || typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded or canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');
      
      // Aggregate the provided filtered data
      const aggregated = this.aggregateDataByQuarter(data || this.dataManager.data);

      if (!aggregated) {
        console.warn('No aggregated data available');
        return;
      }

      const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      const avgBallots = labels.map(q => aggregated[q]?.avgBallots || 0);
      const stddevBallots = labels.map(q => aggregated[q]?.stddevBallots || 0);

      this.chartInstances.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.map(q => this.translations.quarters[q] || q),
          datasets: [
            {
              label: this.translations.charts?.comparison?.title || 'Average Ballots',
              data: avgBallots,
              backgroundColor: labels.map(q => CONFIG.quarterColors[q]),
              borderColor: labels.map(q => CONFIG.quarterColors[q]),
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: false
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const avg = context.parsed.y;
                  const stddev = stddevBallots[context.dataIndex];
                  return [
                    `Average: ${avg.toFixed(1)} ballots`,
                    `Std Dev: ±${stddev.toFixed(1)}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Quarter'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Average Ballots'
              },
              beginAtZero: true
            }
          }
        }
      });
    }

    /**
     * Aggregate data by quarter (for filtered datasets)
     */
    aggregateDataByQuarter(data) {
      if (!data) return null;

      const quarters = { Q1: [], Q2: [], Q3: [], Q4: [] };
      
      data.forEach(row => {
        const quarter = `Q${row.quarter}`;
        if (quarters[quarter]) {
          quarters[quarter].push(row);
        }
      });

      const aggregated = {};
      Object.keys(quarters).forEach(q => {
        const records = quarters[q];
        if (records.length === 0) return;

        const ballots = records.map(r => r.total_ballots || 0);
        const attendance = records.map(r => r.attendance_rate || 0);
        const docs = records.map(r => r.documents_produced || 0);

        aggregated[q] = {
          quarter: q,
          avgBallots: this.mean(ballots),
          stddevBallots: this.stddev(ballots),
          avgAttendance: this.mean(attendance),
          stddevAttendance: this.stddev(attendance),
          avgDocs: this.mean(docs),
          stddevDocs: this.stddev(docs),
          count: records.length
        };
      });

      return aggregated;
    }

    /**
     * Calculate mean of an array
     */
    mean(arr) {
      if (!arr || arr.length === 0) return 0;
      return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    /**
     * Calculate standard deviation of an array
     */
    stddev(arr) {
      if (!arr || arr.length === 0) return 0;
      const avg = this.mean(arr);
      const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
      return Math.sqrt(this.mean(squareDiffs));
    }

    /**
     * Render classification distribution chart using Chart.js
     */
    renderClassificationChart(data) {
      const canvas = document.getElementById('classification-chart');
      if (!canvas || typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded or canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Count classifications by year
      const years = [...new Set(data.map(d => d.year))].sort();
      const classifications = {};

      data.forEach(row => {
        const classification = row.seasonal_pattern_classification || 'UNKNOWN';
        if (!classifications[classification]) {
          classifications[classification] = {};
        }
        if (!classifications[classification][row.year]) {
          classifications[classification][row.year] = 0;
        }
        classifications[classification][row.year]++;
      });

      const datasets = Object.keys(classifications).map(classification => {
        const counts = years.map(year => classifications[classification][year] || 0);
        let color;
        
        if (classification.includes('NORMAL')) {
          color = CONFIG.colors.normal;
        } else if (classification.includes('ELEVATED') || classification.includes('HIGH')) {
          color = CONFIG.colors.elevated;
        } else if (classification.includes('REDUCED') || classification.includes('LOW')) {
          color = CONFIG.colors.reduced;
        } else if (classification.includes('ANOMALY')) {
          color = CONFIG.colors.anomaly;
        } else {
          color = CONFIG.colors.info;
        }

        return {
          label: this.translations.classifications[classification] || classification,
          data: counts,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        };
      });

      this.chartInstances.classification = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: false
            },
            legend: {
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              stacked: true,
              display: true,
              title: {
                display: true,
                text: 'Year'
              }
            },
            y: {
              stacked: true,
              display: true,
              title: {
                display: true,
                text: 'Count'
              },
              beginAtZero: true
            }
          }
        }
      });
    }

    /**
     * Render QoQ change waterfall chart using Chart.js
     */
    renderQoQChangeChart(data) {
      const canvas = document.getElementById('qoq-change-chart');
      if (!canvas || typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded or canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Sort data and filter those with QoQ change data
      const sortedData = [...data]
        .filter(d => d.qoq_ballot_change_pct !== null && d.qoq_ballot_change_pct !== undefined)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.quarter - b.quarter;
        });

      const labels = sortedData.map(d => `${d.year}-Q${d.quarter}`);
      const changes = sortedData.map(d => d.qoq_ballot_change_pct || 0);
      
      // Color by positive/negative
      const colors = changes.map(change => {
        if (change > 0) return CONFIG.colors.success;
        if (change < 0) return CONFIG.colors.danger;
        return CONFIG.colors.info;
      });

      this.chartInstances.qoq = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'QoQ Change (%)',
              data: changes,
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: false
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Change: ${context.parsed.y.toFixed(2)}%`;
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Year-Quarter'
              },
              ticks: {
                maxRotation: 90,
                minRotation: 45,
                autoSkip: true,
                maxTicksLimit: 20
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Change (%)'
              }
            }
          }
        }
      });
    }
  }

  // ============================================================================
  // Dashboard Controller
  // ============================================================================
  
  class SeasonalPatternsDashboard {
    constructor() {
      this.dataManager = new SeasonalPatternsDataManager();
      this.chartRenderer = null;
      this.currentLanguage = this.detectLanguage();
      this.currentFilters = {
        year: 'all',
        quarter: 'all',
        election: 'all',
        classification: 'all'
      };
    }

    /**
     * Detect current language from URL
     */
    detectLanguage() {
      const path = window.location.pathname;
      const match = path.match(/index_([a-z]{2})\.html/);
      if (match) {
        return match[1];
      }
      return 'en';
    }

    /**
     * Initialize dashboard
     */
    async initialize() {
      try {
        // Show loading state
        this.showLoading();

        // Fetch data
        await this.dataManager.fetchData();

        // Initialize chart renderer
        this.chartRenderer = new SeasonalPatternsCharts(this.dataManager, this.currentLanguage);

        // Setup filters
        this.setupFilters();

        // Render charts
        await this.chartRenderer.renderAll();

        // Hide loading state
        this.hideLoading();

        console.log('Seasonal Patterns Dashboard initialized successfully');
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        this.showError();
      }
    }

    /**
     * Setup filter controls
     */
    setupFilters() {
      const yearFilter = document.getElementById('year-filter');
      const quarterFilter = document.getElementById('quarter-filter');
      const electionFilter = document.getElementById('election-filter');
      const classificationFilter = document.getElementById('classification-filter');

      if (yearFilter) {
        yearFilter.addEventListener('change', (e) => {
          this.currentFilters.year = e.target.value;
          this.applyFilters();
        });

        // Populate year options
        const years = [...new Set(this.dataManager.data.map(d => d.year))].sort((a, b) => b - a);
        years.forEach(year => {
          const option = document.createElement('option');
          option.value = year;
          option.textContent = year;
          yearFilter.appendChild(option);
        });
      }

      if (quarterFilter) {
        quarterFilter.addEventListener('change', (e) => {
          this.currentFilters.quarter = e.target.value;
          this.applyFilters();
        });
      }

      if (electionFilter) {
        electionFilter.addEventListener('change', (e) => {
          this.currentFilters.election = e.target.value;
          this.applyFilters();
        });
      }

      if (classificationFilter) {
        classificationFilter.addEventListener('change', (e) => {
          this.currentFilters.classification = e.target.value;
          this.applyFilters();
        });

        // Populate classification options from both seasonal and base activity classifications
        const classificationSet = new Set();
        this.dataManager.data.forEach(d => {
          if (d.seasonal_pattern_classification) {
            classificationSet.add(d.seasonal_pattern_classification);
          }
          if (d.base_activity_classification) {
            classificationSet.add(d.base_activity_classification);
          }
        });

        const classifications = [...classificationSet].sort();
        classifications.forEach(classification => {
          const option = document.createElement('option');
          option.value = classification;
          const translatedLabel = this.translations.classifications?.[classification]
            || TRANSLATIONS.en?.classifications?.[classification]
            || classification;
          option.textContent = translatedLabel;
          classificationFilter.appendChild(option);
        });
      }
    }

    /**
     * Apply filters and re-render charts
     */
    async applyFilters() {
      const filteredData = this.dataManager.filterData(this.currentFilters);
      await this.chartRenderer.renderAll(filteredData);
    }

    /**
     * Show loading state
     */
    showLoading() {
      const container = document.getElementById('seasonal-patterns-dashboard');
      if (container) {
        container.classList.add('loading');
        container.setAttribute('aria-busy', 'true');
        // Add screen reader announcement
        const loadingMsg = document.createElement('div');
        loadingMsg.setAttribute('role', 'status');
        loadingMsg.setAttribute('aria-live', 'polite');
        loadingMsg.className = 'sr-only';
        loadingMsg.textContent = this.translations.loading || 'Loading data...';
        container.prepend(loadingMsg);
      }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
      const container = document.getElementById('seasonal-patterns-dashboard');
      if (container) {
        container.classList.remove('loading');
        container.removeAttribute('aria-busy');
        // Remove screen reader loading message
        const loadingMsg = container.querySelector('[role="status"]');
        if (loadingMsg) {
          loadingMsg.remove();
        }
      }
    }

    /**
     * Show error message
     */
    showError() {
      const container = document.getElementById('seasonal-patterns-dashboard');
      if (container) {
        container.innerHTML = `
          <div class="error-message" role="alert">
            <p>⚠️ ${TRANSLATIONS[this.currentLanguage]?.error || TRANSLATIONS.en.error}</p>
          </div>
        `;
      }
    }
  }

  // ============================================================================
  // Initialize on DOM ready
  // ============================================================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }

  function initDashboard() {
    const dashboardContainer = document.getElementById('seasonal-patterns-dashboard');
    if (dashboardContainer) {
      const dashboard = new SeasonalPatternsDashboard();
      dashboard.initialize();
    }
  }

})();
