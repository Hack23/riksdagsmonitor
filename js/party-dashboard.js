/**
 * Party Performance & Effectiveness Analytics Dashboard
 * 
 * Data Integration: CIA Platform Sample Data (GitHub Raw API)
 * Coverage: 50+ years (1971-2026) | 8 Swedish Political Parties
 * Update Frequency: Weekly (7-day freshness threshold)
 * 
 * Swedish Parties:
 * - S (Socialdemokraterna) - Social Democrats
 * - M (Moderaterna) - Moderates
 * - SD (Sverigedemokraterna) - Sweden Democrats
 * - C (Centerpartiet) - Centre Party
 * - V (Vänsterpartiet) - Left Party
 * - KD (Kristdemokraterna) - Christian Democrats
 * - L (Liberalerna) - Liberals
 * - MP (Miljöpartiet) - Green Party
 * 
 * Methodology: https://github.com/Hack23/cia/blob/master/service.data.impl/src/main/resources/DATA_ANALYSIS_INTOP_OSINT.md
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    githubRawBase: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data',
    dataSources: {
      partyPerformance: 'distribution_party_performance.csv',
      partyEffectiveness: 'distribution_party_effectiveness_trends.csv',
      partyMomentum: 'distribution_party_momentum.csv',
      coalitionAlignment: 'distribution_coalition_alignment.csv',
      annualMembers: 'distribution_annual_party_members.csv',
      annualVotes: 'distribution_annual_party_votes.csv'
    },
    freshnessThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    cachePrefix: 'cia_data_',
    chartColors: {
      // Official Swedish party colors (WCAG AA compliant for cyberpunk theme)
      'S': '#E8112d',    // Social Democrats - Red
      'M': '#52BDEC',    // Moderates - Light Blue
      'SD': '#DDDD00',   // Sweden Democrats - Yellow
      'C': '#009933',    // Centre - Green
      'V': '#DA291C',    // Left Party - Dark Red
      'KD': '#000077',   // Christian Democrats - Blue
      'L': '#006AB3',    // Liberals - Blue
      'MP': '#83CF39'    // Green Party - Light Green
    }
  };

  // Multi-language support
  const TRANSLATIONS = {
    en: {
      sectionTitle: '🗳️ Party Performance & Effectiveness',
      sectionDescription: 'Comprehensive analysis of Swedish political parties using 50+ years of CIA platform data. Track effectiveness trends, coalition dynamics, and momentum indicators across 8 parties.',
      effectivenessTitle: 'Effectiveness Trends (1990-2026)',
      effectivenessDescription: 'Historical party effectiveness scores showing legislative productivity, voting consistency, and policy impact over time.',
      effectivenessAriaLabel: 'Party effectiveness line chart showing trends from 1990 to 2026 for all 8 Swedish political parties',
      effectivenessSrOnly: 'Line chart displaying effectiveness scores for Social Democrats, Moderates, Sweden Democrats, Centre Party, Left Party, Christian Democrats, Liberals, and Green Party from 1990 to 2026.',
      comparisonTitle: 'Party Comparison (Current Period)',
      comparisonDescription: 'Comparative analysis of party performance metrics for the current legislative period.',
      comparisonAriaLabel: 'Horizontal bar chart comparing performance scores across 8 Swedish political parties',
      comparisonSrOnly: 'Bar chart showing party performance rankings with scores for Social Democrats, Moderates, Sweden Democrats, Centre Party, Left Party, Christian Democrats, Liberals, and Green Party.',
      coalitionTitle: 'Coalition Alignment',
      coalitionDescription: 'Coalition patterns and inter-party collaboration networks.',
      coalitionAriaLabel: 'Coalition alignment visualization showing collaboration strength between political parties',
      coalitionSrOnly: 'Visualization of coalition patterns and alignment rates between Swedish political parties.',
      momentumTitle: 'Momentum Indicators',
      momentumDescription: 'Party momentum scores with percentile benchmarks (P50, P90) indicating electoral trajectory.',
      momentumAriaLabel: 'Doughnut chart showing momentum indicators for all 8 Swedish political parties',
      momentumSrOnly: 'Doughnut chart displaying momentum scores for Social Democrats, Moderates, Sweden Democrats, Centre Party, Left Party, Christian Democrats, Liberals, and Green Party.',
      loadingMessage: 'Loading CIA data from GitHub repository...',
      errorMessage: 'Error loading data. Please try again later.',
      dataAttribution: 'Data by CIA Platform',
      lastUpdated: 'Last Updated',
      parties: {
        'S': 'Social Democrats',
        'M': 'Moderates',
        'SD': 'Sweden Democrats',
        'C': 'Centre Party',
        'V': 'Left Party',
        'KD': 'Christian Democrats',
        'L': 'Liberals',
        'MP': 'Green Party'
      }
    },
    sv: {
      sectionTitle: '🗳️ Partiprestation & Effektivitet',
      sectionDescription: 'Omfattande analys av svenska politiska partier med över 50 års CIA-plattformsdata. Spåra effektivitetstrender, koalitionsdynamik och momentumindikatorer för 8 partier.',
      effectivenessTitle: 'Effektivitetstrender (1990-2026)',
      effectivenessDescription: 'Historiska partieffektivitetspoäng som visar lagstiftningsproduktivitet, röstningskonsistens och politisk påverkan över tid.',
      effectivenessAriaLabel: 'Linjeagram över partieffektivitet som visar trender från 1990 till 2026 för alla 8 svenska politiska partier',
      effectivenessSrOnly: 'Linjeagram som visar effektivitetspoäng för Socialdemokraterna, Moderaterna, Sverigedemokraterna, Centerpartiet, Vänsterpartiet, Kristdemokraterna, Liberalerna och Miljöpartiet från 1990 till 2026.',
      comparisonTitle: 'Partijämförelse (Nuvarande Period)',
      comparisonDescription: 'Jämförande analys av partiprestandametrik för nuvarande mandatperiod.',
      comparisonAriaLabel: 'Horisontellt stapeldiagram som jämför prestandapoäng för 8 svenska politiska partier',
      comparisonSrOnly: 'Stapeldiagram som visar partiprestandarankingar med poäng för Socialdemokraterna, Moderaterna, Sverigedemokraterna, Centerpartiet, Vänsterpartiet, Kristdemokraterna, Liberalerna och Miljöpartiet.',
      coalitionTitle: 'Koalitionsanpassning',
      coalitionDescription: 'Koalitionsmönster och samarbetsnätverk mellan partier.',
      coalitionAriaLabel: 'Visualisering av koalitionsanpassning som visar samarbetsstyrka mellan politiska partier',
      coalitionSrOnly: 'Visualisering av koalitionsmönster och anpassningsgrader mellan svenska politiska partier.',
      momentumTitle: 'Momentumindikatorer',
      momentumDescription: 'Partimomentumpoäng med percentilriktmärken (P50, P90) som indikerar valbana.',
      momentumAriaLabel: 'Ringdiagram som visar momentumindikatorer för alla 8 svenska politiska partier',
      momentumSrOnly: 'Ringdiagram som visar momentumpoäng för Socialdemokraterna, Moderaterna, Sverigedemokraterna, Centerpartiet, Vänsterpartiet, Kristdemokraterna, Liberalerna och Miljöpartiet.',
      loadingMessage: 'Laddar CIA-data från GitHub-repository...',
      errorMessage: 'Fel vid laddning av data. Försök igen senare.',
      dataAttribution: 'Data från CIA-plattformen',
      lastUpdated: 'Senast Uppdaterad',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    da: {
      sectionTitle: '🗳️ Partipræstation & Effektivitet',
      sectionDescription: 'Omfattende analyse af svenske politiske partier med over 50 års CIA-platformsdata. Spor effektivitetstendenser, koalitionsdynamik og momentumindikatorer for 8 partier.',
      effectivenessTitle: 'Effektivitetstendenser (1990-2026)',
      effectivenessDescription: 'Historiske partieffektivitetsscorer, der viser lovgivningsmæssig produktivitet, stemningskonsistens og politisk indvirkning over tid.',
      comparisonTitle: 'Partisammenligning (Nuværende Periode)',
      comparisonDescription: 'Sammenlignende analyse af partipræstationsmålinger for den nuværende lovgivende periode.',
      coalitionTitle: 'Koalitionstilpasning',
      coalitionDescription: 'Koalitionsmønstre og samarbejdsnetværk mellem partier.',
      momentumTitle: 'Momentumindikatorer',
      momentumDescription: 'Partimomentumscorer med percentilbenchmarks (P50, P90), der angiver valgbane.',
      loadingMessage: 'Indlæser CIA-data fra GitHub-repository...',
      errorMessage: 'Fejl ved indlæsning af data. Prøv igen senere.',
      dataAttribution: 'Data fra CIA-platformen',
      lastUpdated: 'Senest Opdateret',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    no: {
      sectionTitle: '🗳️ Partiprestasjon & Effektivitet',
      sectionDescription: 'Omfattende analyse av svenske politiske partier med over 50 års CIA-plattformdata. Spor effektivitetstrender, koalisjonsdynamikk og momentumindikatorer for 8 partier.',
      effectivenessTitle: 'Effektivitetstrender (1990-2026)',
      effectivenessDescription: 'Historiske partieffektivitetspoeng som viser lovgivende produktivitet, stemmekonsistens og politisk innvirkning over tid.',
      comparisonTitle: 'Partisammenligning (Nåværende Periode)',
      comparisonDescription: 'Sammenlignende analyse av partiprestasjonsmålinger for den nåværende lovgivende perioden.',
      coalitionTitle: 'Koalisjonstilpasning',
      coalitionDescription: 'Koalisjonsmønstre og samarbeidsnettverk mellom partier.',
      momentumTitle: 'Momentumindikatorer',
      momentumDescription: 'Partimomentumpoeng med persentilreferanser (P50, P90) som indikerer valgbane.',
      loadingMessage: 'Laster inn CIA-data fra GitHub-repository...',
      errorMessage: 'Feil ved lasting av data. Prøv igjen senere.',
      dataAttribution: 'Data fra CIA-plattformen',
      lastUpdated: 'Sist Oppdatert',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    fi: {
      sectionTitle: '🗳️ Puolueiden Suorituskyky & Tehokkuus',
      sectionDescription: 'Kattava analyysi ruotsalaisista poliittisista puolueista yli 50 vuoden CIA-alustatiedoilla. Seuraa tehokkuustrendejä, koalitiodynamiikkaa ja vauhtia indikaattoreita 8 puolueelle.',
      effectivenessTitle: 'Tehokkuustrendit (1990-2026)',
      effectivenessDescription: 'Historialliset puolueiden tehokkuuspisteet, jotka osoittavat lainsäädännöllisen tuottavuuden, äänestyksen johdonmukaisuuden ja politiikan vaikutuksen ajan mittaan.',
      comparisonTitle: 'Puoluevertailu (Nykyinen Kausi)',
      comparisonDescription: 'Vertaileva analyysi puolueiden suorituskykymittareista nykyisellä lainsäädäntökaudella.',
      coalitionTitle: 'Koalition Yhdenmukaistaminen',
      coalitionDescription: 'Koalitiokuviot ja puolueiden väliset yhteistyöverkostot.',
      momentumTitle: 'Vauhti-Indikaattorit',
      momentumDescription: 'Puolueen vauhtipisteet prosenttipisteillä (P50, P90), jotka osoittavat vaalikaaren.',
      loadingMessage: 'Ladataan CIA-tietoja GitHub-repositoriosta...',
      errorMessage: 'Virhe tietojen lataamisessa. Yritä myöhemmin uudelleen.',
      dataAttribution: 'Tiedot CIA-alustalta',
      lastUpdated: 'Viimeksi Päivitetty',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    de: {
      sectionTitle: '🗳️ Parteileistung & Effektivität',
      sectionDescription: 'Umfassende Analyse schwedischer politischer Parteien mit über 50 Jahren CIA-Plattformdaten. Verfolgen Sie Effektivitätstrends, Koalitionsdynamik und Momentumindikatoren für 8 Parteien.',
      effectivenessTitle: 'Effektivitätstrends (1990-2026)',
      effectivenessDescription: 'Historische Parteieneffektivitätswerte, die legislative Produktivität, Abstimmungskonsistenz und politische Auswirkungen im Laufe der Zeit zeigen.',
      comparisonTitle: 'Parteienvergleich (Aktuelle Periode)',
      comparisonDescription: 'Vergleichende Analyse der Parteileistungsmetriken für die aktuelle Legislaturperiode.',
      coalitionTitle: 'Koalitionsausrichtung',
      coalitionDescription: 'Koalitionsmuster und parteiübergreifende Zusammenarbeitsnetzwerke.',
      momentumTitle: 'Momentum-Indikatoren',
      momentumDescription: 'Parteien-Momentum-Werte mit Perzentil-Benchmarks (P50, P90), die den Wahlverlauf anzeigen.',
      loadingMessage: 'Lade CIA-Daten aus GitHub-Repository...',
      errorMessage: 'Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.',
      dataAttribution: 'Daten von der CIA-Plattform',
      lastUpdated: 'Zuletzt Aktualisiert',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    fr: {
      sectionTitle: '🗳️ Performance & Efficacité des Partis',
      sectionDescription: 'Analyse complète des partis politiques suédois avec plus de 50 ans de données de la plateforme CIA. Suivez les tendances d\'efficacité, la dynamique de coalition et les indicateurs de momentum pour 8 partis.',
      effectivenessTitle: 'Tendances d\'Efficacité (1990-2026)',
      effectivenessDescription: 'Scores historiques d\'efficacité des partis montrant la productivité législative, la cohérence de vote et l\'impact politique au fil du temps.',
      comparisonTitle: 'Comparaison des Partis (Période Actuelle)',
      comparisonDescription: 'Analyse comparative des métriques de performance des partis pour la période législative actuelle.',
      coalitionTitle: 'Alignement de Coalition',
      coalitionDescription: 'Modèles de coalition et réseaux de collaboration inter-partis.',
      momentumTitle: 'Indicateurs de Momentum',
      momentumDescription: 'Scores de momentum des partis avec des repères de percentile (P50, P90) indiquant la trajectoire électorale.',
      loadingMessage: 'Chargement des données CIA depuis le dépôt GitHub...',
      errorMessage: 'Erreur lors du chargement des données. Veuillez réessayer plus tard.',
      dataAttribution: 'Données de la plateforme CIA',
      lastUpdated: 'Dernière Mise à Jour',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    es: {
      sectionTitle: '🗳️ Rendimiento & Eficacia de Partidos',
      sectionDescription: 'Análisis exhaustivo de los partidos políticos suecos con más de 50 años de datos de la plataforma CIA. Rastree tendencias de eficacia, dinámica de coalición e indicadores de momentum para 8 partidos.',
      effectivenessTitle: 'Tendencias de Eficacia (1990-2026)',
      effectivenessDescription: 'Puntuaciones históricas de eficacia de los partidos que muestran productividad legislativa, consistencia de votación e impacto político a lo largo del tiempo.',
      comparisonTitle: 'Comparación de Partidos (Período Actual)',
      comparisonDescription: 'Análisis comparativo de las métricas de rendimiento de los partidos para el período legislativo actual.',
      coalitionTitle: 'Alineación de Coalición',
      coalitionDescription: 'Patrones de coalición y redes de colaboración entre partidos.',
      momentumTitle: 'Indicadores de Momentum',
      momentumDescription: 'Puntuaciones de momentum de los partidos con puntos de referencia de percentil (P50, P90) que indican la trayectoria electoral.',
      loadingMessage: 'Cargando datos de CIA desde el repositorio de GitHub...',
      errorMessage: 'Error al cargar los datos. Por favor, inténtelo de nuevo más tarde.',
      dataAttribution: 'Datos de la plataforma CIA',
      lastUpdated: 'Última Actualización',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    nl: {
      sectionTitle: '🗳️ Partijprestatie & Effectiviteit',
      sectionDescription: 'Uitgebreide analyse van Zweedse politieke partijen met meer dan 50 jaar CIA-platformgegevens. Volg effectiviteitstrends, coalitiedynamiek en momentumindicatoren voor 8 partijen.',
      effectivenessTitle: 'Effectiviteitstrends (1990-2026)',
      effectivenessDescription: 'Historische partijeffectiviteitsscores die wetgevende productiviteit, stemconsistentie en beleidsimpact in de loop van de tijd tonen.',
      comparisonTitle: 'Partijvergelijking (Huidige Periode)',
      comparisonDescription: 'Vergelijkende analyse van partijprestatiemetrics voor de huidige wetgevende periode.',
      coalitionTitle: 'Coalitie-Afstemming',
      coalitionDescription: 'Coalitiepatronen en samenwerkingsnetwerken tussen partijen.',
      momentumTitle: 'Momentumindicatoren',
      momentumDescription: 'Partijmomentumscores met percentiel-benchmarks (P50, P90) die het verkiezingstraject aangeven.',
      loadingMessage: 'CIA-gegevens laden vanuit GitHub-repository...',
      errorMessage: 'Fout bij het laden van gegevens. Probeer het later opnieuw.',
      dataAttribution: 'Gegevens van het CIA-platform',
      lastUpdated: 'Laatst Bijgewerkt',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    ar: {
      sectionTitle: '🗳️ أداء وفعالية الأحزاب',
      sectionDescription: 'تحليل شامل للأحزاب السياسية السويدية مع أكثر من 50 عامًا من بيانات منصة CIA. تتبع اتجاهات الفعالية وديناميكيات الائتلاف ومؤشرات الزخم لـ 8 أحزاب.',
      effectivenessTitle: 'اتجاهات الفعالية (1990-2026)',
      effectivenessDescription: 'درجات الفعالية التاريخية للأحزاب التي تظهر الإنتاجية التشريعية واتساق التصويت والتأثير السياسي بمرور الوقت.',
      comparisonTitle: 'مقارنة الأحزاب (الفترة الحالية)',
      comparisonDescription: 'تحليل مقارن لمقاييس أداء الأحزاب للفترة التشريعية الحالية.',
      coalitionTitle: 'مواءمة الائتلاف',
      coalitionDescription: 'أنماط الائتلاف وشبكات التعاون بين الأحزاب.',
      momentumTitle: 'مؤشرات الزخم',
      momentumDescription: 'درجات زخم الأحزاب مع معايير النسبة المئوية (P50، P90) التي تشير إلى المسار الانتخابي.',
      loadingMessage: 'جارٍ تحميل بيانات CIA من مستودع GitHub...',
      errorMessage: 'خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى لاحقًا.',
      dataAttribution: 'البيانات من منصة CIA',
      lastUpdated: 'آخر تحديث',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    he: {
      sectionTitle: '🗳️ ביצועים ויעילות של מפלגות',
      sectionDescription: 'ניתוח מקיף של מפלגות פוליטיות שוודיות עם יותר מ-50 שנים של נתוני פלטפורמת CIA. עקבו אחר מגמות יעילות, דינמיקת קואליציה ומדדי מומנטום עבור 8 מפלגות.',
      effectivenessTitle: 'מגמות יעילות (1990-2026)',
      effectivenessDescription: 'ציוני יעילות היסטוריים של מפלגות המציגים פרודוקטיביות חקיקתית, עקביות הצבעה והשפעה מדינית לאורך זמן.',
      comparisonTitle: 'השוואת מפלגות (תקופה נוכחית)',
      comparisonDescription: 'ניתוח השוואתי של מדדי ביצועים של מפלגות לתקופת החקיקה הנוכחית.',
      coalitionTitle: 'יישור קואליציה',
      coalitionDescription: 'דפוסי קואליציה ורשתות שיתוף פעולה בין-מפלגתיות.',
      momentumTitle: 'מדדי מומנטום',
      momentumDescription: 'ציוני מומנטום של מפלגות עם אמות מידה אחוזיות (P50, P90) המצביעים על מסלול בחירות.',
      loadingMessage: 'טוען נתוני CIA ממאגר GitHub...',
      errorMessage: 'שגיאה בטעינת נתונים. נסה שוב מאוחר יותר.',
      dataAttribution: 'נתונים מפלטפורמת CIA',
      lastUpdated: 'עודכן לאחרונה',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    ja: {
      sectionTitle: '🗳️ 政党のパフォーマンスと効果',
      sectionDescription: 'CIAプラットフォームの50年以上のデータを使用したスウェーデンの政党の包括的な分析。8つの政党の効果トレンド、連立動態、勢いの指標を追跡します。',
      effectivenessTitle: '効果トレンド（1990-2026）',
      effectivenessDescription: '立法の生産性、投票の一貫性、および政策の影響を時系列で示す歴史的な政党の効果スコア。',
      comparisonTitle: '政党比較（現在の期間）',
      comparisonDescription: '現在の立法期間における政党のパフォーマンスメトリクスの比較分析。',
      coalitionTitle: '連立の調整',
      coalitionDescription: '連立パターンと政党間の協力ネットワーク。',
      momentumTitle: '勢いの指標',
      momentumDescription: 'パーセンタイルベンチマーク（P50、P90）を使用した政党の勢いスコアで、選挙の軌跡を示します。',
      loadingMessage: 'GitHubリポジトリからCIAデータを読み込んでいます...',
      errorMessage: 'データの読み込みエラー。後でもう一度お試しください。',
      dataAttribution: 'CIAプラットフォームからのデータ',
      lastUpdated: '最終更新',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    ko: {
      sectionTitle: '🗳️ 정당 성과 및 효과',
      sectionDescription: '50년 이상의 CIA 플랫폼 데이터로 스웨덴 정당에 대한 포괄적인 분석. 8개 정당의 효과 추세, 연립 역학 및 모멘텀 지표를 추적합니다.',
      effectivenessTitle: '효과 추세 (1990-2026)',
      effectivenessDescription: '시간 경과에 따른 입법 생산성, 투표 일관성 및 정책 영향을 보여주는 역사적 정당 효과 점수.',
      comparisonTitle: '정당 비교 (현재 기간)',
      comparisonDescription: '현재 입법 기간에 대한 정당 성과 메트릭의 비교 분석.',
      coalitionTitle: '연립 조정',
      coalitionDescription: '연립 패턴 및 정당 간 협력 네트워크.',
      momentumTitle: '모멘텀 지표',
      momentumDescription: '백분위수 벤치마크(P50, P90)로 선거 궤적을 나타내는 정당 모멘텀 점수.',
      loadingMessage: 'GitHub 저장소에서 CIA 데이터를 로드하는 중...',
      errorMessage: '데이터 로드 오류. 나중에 다시 시도하십시오.',
      dataAttribution: 'CIA 플랫폼의 데이터',
      lastUpdated: '마지막 업데이트',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    },
    zh: {
      sectionTitle: '🗳️ 政党表现与效率',
      sectionDescription: '使用CIA平台50多年的数据对瑞典政党进行全面分析。跟踪8个政党的效率趋势、联盟动态和动量指标。',
      effectivenessTitle: '效率趋势（1990-2026）',
      effectivenessDescription: '显示立法生产力、投票一致性和政策影响随时间变化的历史政党效率分数。',
      comparisonTitle: '政党比较（当前期间）',
      comparisonDescription: '当前立法期间政党绩效指标的比较分析。',
      coalitionTitle: '联盟协调',
      coalitionDescription: '联盟模式和政党间合作网络。',
      momentumTitle: '动量指标',
      momentumDescription: '具有百分位基准（P50，P90）的政党动量分数，指示选举轨迹。',
      loadingMessage: '正在从GitHub存储库加载CIA数据...',
      errorMessage: '加载数据时出错。请稍后再试。',
      dataAttribution: '来自CIA平台的数据',
      lastUpdated: '最后更新',
      parties: {
        'S': 'Socialdemokraterna',
        'M': 'Moderaterna',
        'SD': 'Sverigedemokraterna',
        'C': 'Centerpartiet',
        'V': 'Vänsterpartiet',
        'KD': 'Kristdemokraterna',
        'L': 'Liberalerna',
        'MP': 'Miljöpartiet'
      }
    }
  };

  // Detect current language from URL
  function detectLanguage() {
    const filename = window.location.pathname.split('/').pop();
    const langMatch = filename.match(/index_([a-z]{2})\.html/);
    return langMatch ? langMatch[1] : 'en';
  }

  // Get translations for current language
  function getTranslations() {
    const lang = detectLanguage();
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
  }

  /**
   * Parse CSV data using native JavaScript (no external dependencies)
   */
  function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  }

  /**
   * Fetch data from GitHub with caching
   */
  async function fetchData(filename) {
    const cacheKey = CONFIG.cachePrefix + filename;
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheKey + '_timestamp');

    // Check cache freshness
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < CONFIG.freshnessThreshold) {
        console.log(`Using cached data for ${filename} (age: ${Math.floor(age / 1000 / 60 / 60)}h)`);
        return parseCSV(cached);
      }
    }

    // Fetch fresh data
    const url = `${CONFIG.githubRawBase}/${filename}`;
    console.log(`Fetching fresh data from: ${url}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      // Cache the data
      localStorage.setItem(cacheKey, csvText);
      localStorage.setItem(cacheKey + '_timestamp', Date.now().toString());
      
      return parseCSV(csvText);
    } catch (error) {
      console.error(`Error fetching ${filename}:`, error);
      
      // Fall back to cached data if available
      if (cached) {
        console.warn('Using stale cached data due to fetch error');
        return parseCSV(cached);
      }
      
      throw error;
    }
  }

  /**
   * Initialize Chart.js with cyberpunk theme defaults
   */
  function initChartDefaults() {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not loaded');
      return;
    }

    Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 15;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 6;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
  }

  /**
   * Create Effectiveness Trends Line Chart
   */
  function createEffectivenessChart(data) {
    const ctx = document.getElementById('partyEffectivenessChart');
    if (!ctx) return;

    const t = getTranslations();
    
    // Update ARIA label for current language with fallback to English
    ctx.setAttribute('aria-label', t.effectivenessAriaLabel || TRANSLATIONS.en.effectivenessAriaLabel);
    const srOnly = ctx.parentElement.querySelector('.sr-only');
    if (srOnly) srOnly.textContent = t.effectivenessSrOnly || TRANSLATIONS.en.effectivenessSrOnly;
    
    // Process real CSV data
    const parties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
    const partyData = {};
    const allYears = new Set();
    
    // Parse effectiveness data from CSV
    data.forEach(row => {
      if (row.party && row.year && row.avg_win_rate) {
        const party = row.party;
        const year = parseInt(row.year);
        const effectiveness = parseFloat(row.avg_win_rate) || 0;
        
        if (parties.includes(party) && year >= 1990 && year <= 2026) {
          if (!partyData[party]) partyData[party] = {};
          partyData[party][year] = effectiveness;
          allYears.add(year);
        }
      }
    });
    
    // Create sorted year array
    const years = Array.from(allYears).sort((a, b) => a - b);
    if (years.length === 0) {
      // Fallback to year range if no data
      years.push(...Array.from({length: 37}, (_, i) => 1990 + i));
    }
    
    const datasets = parties.map(party => ({
      label: t.parties[party] || party,
      data: years.map(year => partyData[party]?.[year] || null), // Use real data or null
      borderColor: CONFIG.chartColors[party],
      backgroundColor: CONFIG.chartColors[party] + '20',
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 5,
      spanGaps: true // Connect lines across missing data
    }));

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 102, 51, 0.1)'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 102, 51, 0.1)'
            },
            min: 0,
            max: 100,
            ticks: {
              callback: function(value) {
                return value.toFixed(0);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create Party Comparison Bar Chart
   */
  function createComparisonChart(data) {
    const ctx = document.getElementById('partyComparisonChart');
    if (!ctx) return;

    const t = getTranslations();
    
    // Update ARIA label for current language with fallback to English
    ctx.setAttribute('aria-label', t.comparisonAriaLabel || TRANSLATIONS.en.comparisonAriaLabel);
    const srOnly = ctx.parentElement.querySelector('.sr-only');
    if (srOnly) srOnly.textContent = t.comparisonSrOnly || TRANSLATIONS.en.comparisonSrOnly;
    
    const parties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
    
    // Process real CSV data
    const chartData = parties.map(party => {
      const partyRow = data.find(row => row.party === party);
      let score = 50; // Default fallback
      
      if (partyRow) {
        // Use docs_per_member as performance score, normalized to 0-100 scale
        score = parseFloat(partyRow.docs_per_member) || 0;
        // If very small numbers, multiply by 10 for visibility
        if (score > 0 && score < 10) score *= 10;
        // Cap at 100 for chart scale
        if (score > 100) score = 100;
      }
      
      return {
        party: t.parties[party] || party,
        score: score,
        color: CONFIG.chartColors[party]
      };
    });

    // Sort by score descending
    chartData.sort((a, b) => b.score - a.score);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.party),
        datasets: [{
          label: t.comparisonTitle,
          data: chartData.map(d => d.score),
          backgroundColor: chartData.map(d => d.color),
          borderColor: chartData.map(d => d.color),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Score: ${context.parsed.x.toFixed(1)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 102, 51, 0.1)'
            },
            min: 0,
            max: 100
          },
          y: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Create Coalition Network Visualization
   */
  function createCoalitionNetwork(data) {
    const container = document.getElementById('coalitionNetwork');
    if (!container) return;

    const t = getTranslations();
    
    // Update ARIA label for current language with fallback to English
    container.setAttribute('aria-label', t.coalitionAriaLabel || TRANSLATIONS.en.coalitionAriaLabel);
    const srOnly = container.parentElement.querySelector('.sr-only');
    if (srOnly) srOnly.textContent = t.coalitionSrOnly || TRANSLATIONS.en.coalitionSrOnly;
    
    // Process real CSV data for coalitions
    const coalitions = [];
    
    data.forEach(row => {
      if (row.party1 && row.party2 && row.alignment_rate) {
        const rate = parseFloat(row.alignment_rate) || 0;
        const party1Label = t.parties[row.party1] || row.party1;
        const party2Label = t.parties[row.party2] || row.party2;
        
        coalitions.push({
          name: `${party1Label} + ${party2Label}`,
          strength: Math.round(rate),
          parties: [row.party1, row.party2],
          likelihood: row.coalition_likelihood || 'UNKNOWN'
        });
      }
    });
    
    // Sort by strength descending
    coalitions.sort((a, b) => b.strength - a.strength);
    
    // Take top 6 coalitions
    const topCoalitions = coalitions.slice(0, 6);
    
    // Fallback if no data
    if (topCoalitions.length === 0) {
      topCoalitions.push(
        { name: t.parties['M'] + ' + ' + t.parties['KD'], strength: 85, parties: ['M', 'KD'] },
        { name: t.parties['M'] + ' + ' + t.parties['L'], strength: 72, parties: ['M', 'L'] },
        { name: t.parties['S'] + ' + ' + t.parties['V'], strength: 55, parties: ['S', 'V'] }
      );
    }

    const html = topCoalitions.map(coalition => `
      <div class="coalition-item" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 600;">${coalition.name}</span>
          <span style="color: var(--accent-color);">${coalition.strength}%</span>
        </div>
        <div style="background: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: var(--accent-color); height: 100%; width: ${coalition.strength}%; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  /**
   * Create Momentum Indicators Doughnut Chart
   */
  function createMomentumChart(data) {
    const ctx = document.getElementById('partyMomentumChart');
    if (!ctx) return;

    const t = getTranslations();
    
    // Update ARIA label for current language with fallback to English
    ctx.setAttribute('aria-label', t.momentumAriaLabel || TRANSLATIONS.en.momentumAriaLabel);
    const srOnly = ctx.parentElement.querySelector('.sr-only');
    if (srOnly) srOnly.textContent = t.momentumSrOnly || TRANSLATIONS.en.momentumSrOnly;
    
    const parties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
    
    // Process real CSV data for momentum
    const momentumData = parties.map(party => {
      // Filter data for this party and get most recent quarter
      const partyRows = data.filter(row => row.party === party && row.momentum);
      
      if (partyRows.length > 0) {
        // Sort by year and quarter to get latest
        partyRows.sort((a, b) => {
          const yearDiff = parseInt(b.year) - parseInt(a.year);
          if (yearDiff !== 0) return yearDiff;
          return parseInt(b.quarter) - parseInt(a.quarter);
        });
        
        const momentum = parseFloat(partyRows[0].momentum) || 0;
        // Scale momentum to 0-100 range for visualization
        return {
          party: party,
          momentum: Math.abs(momentum) * 100 || 50 // Default to 50 if 0
        };
      }
      
      return {
        party: party,
        momentum: 50 // Default value
      };
    });

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: parties.map(p => t.parties[p] || p),
        datasets: [{
          label: t.momentumTitle,
          data: momentumData.map(d => d.momentum),
          backgroundColor: parties.map(p => CONFIG.chartColors[p] + '80'),
          borderColor: parties.map(p => CONFIG.chartColors[p]),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                return `${context.label}: ${context.parsed.toFixed(1)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Initialize dashboard
   */
  async function initDashboard() {
    const t = getTranslations();
    
    // Show loading state
    const dashboardSection = document.getElementById('party-dashboard');
    if (!dashboardSection) {
      console.warn('Dashboard section not found');
      return;
    }

    // Wait for Chart.js to load
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not loaded. Please include Chart.js before this script.');
      return;
    }

    try {
      initChartDefaults();

      // Fetch all data sources (in parallel for performance)
      const [
        partyPerformance,
        partyEffectiveness,
        partyMomentum,
        coalitionAlignment
      ] = await Promise.all([
        fetchData(CONFIG.dataSources.partyPerformance).catch(e => { console.warn('partyPerformance:', e); return []; }),
        fetchData(CONFIG.dataSources.partyEffectiveness).catch(e => { console.warn('partyEffectiveness:', e); return []; }),
        fetchData(CONFIG.dataSources.partyMomentum).catch(e => { console.warn('partyMomentum:', e); return []; }),
        fetchData(CONFIG.dataSources.coalitionAlignment).catch(e => { console.warn('coalitionAlignment:', e); return []; })
      ]);

      // Create visualizations
      createEffectivenessChart(partyEffectiveness);
      createComparisonChart(partyPerformance);
      createCoalitionNetwork(coalitionAlignment);
      createMomentumChart(partyMomentum);

      // Add data attribution
      const attribution = document.createElement('p');
      attribution.className = 'data-attribution';
      attribution.style.cssText = 'text-align: center; margin-top: 2rem; font-size: 0.875rem; color: var(--text-secondary);';
      attribution.innerHTML = `${t.dataAttribution} | <a href="https://www.hack23.com/cia" target="_blank" rel="noopener">CIA Platform</a> | ${t.lastUpdated}: ${new Date().toLocaleDateString()}`;
      dashboardSection.appendChild(attribution);

      console.log('Party dashboard initialized successfully');
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'dashboard-error';
      errorDiv.style.cssText = 'padding: 2rem; text-align: center; color: var(--danger-color);';
      errorDiv.textContent = t.errorMessage;
      dashboardSection.appendChild(errorDiv);
    }
  }

  /**
   * Intersection Observer for lazy loading
   */
  function setupLazyLoad() {
    const dashboardSection = document.getElementById('party-dashboard');
    if (!dashboardSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initDashboard();
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px' // Load when 100px before entering viewport
    });

    observer.observe(dashboardSection);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLazyLoad);
  } else {
    setupLazyLoad();
  }

})();
