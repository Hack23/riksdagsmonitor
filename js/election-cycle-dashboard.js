/**
 * Election Cycle Intelligence Dashboard
 * 
 * Visualizes 40 years (1994-2034) of Swedish Parliament election cycles
 * with comprehensive analytics including party performance, decision intelligence,
 * predictive risk forecasting, and temporal voting patterns.
 * 
 * @author Hack23 AB
 * @copyright 2008-2026 Hack23 AB
 * @license Apache-2.0
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    cachePrefix: 'riksdag_election_cycle_',
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    dataUrls: {
      comparative: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_comparative_analysis_sample.csv',
      decision: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_decision_intelligence_sample.csv',
      predictive: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_predictive_intelligence_sample.csv',
      temporal: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_temporal_trends_sample.csv'
    },
    partyColors: {
      'M': '#52BDEC',   // Moderaterna (blue)
      'S': '#E8112D',   // Socialdemokraterna (red)
      'SD': '#DDDD00',  // Sverigedemokraterna (yellow)
      'C': '#009933',   // Centerpartiet (green)
      'V': '#DA291C',   // Vänsterpartiet (red)
      'MP': '#83CF39',  // Miljöpartiet (green)
      'KD': '#000077',  // Kristdemokraterna (dark blue)
      'L': '#006AB3',   // Liberalerna (blue)
      'default': '#666666'
    },
    riskColors: {
      'STABLE': '#2e7d32',
      'RAPID_ESCALATION': '#d32f2f'
    }
  };

  // Translations for 14 languages
  const TRANSLATIONS = {
    en: {
      title: 'Election Cycle Intelligence (1994-2034)',
      filters: {
        cycle: 'Election Cycle',
        party: 'Party',
        metric: 'Metric',
        allCycles: 'All Cycles',
        allParties: 'All Parties',
        performance: 'Performance',
        decisions: 'Decisions',
        risk: 'Risk',
        attendance: 'Attendance'
      },
      charts: {
        timeline: {
          title: 'Election Cycle Performance Timeline',
          description: 'Party performance evolution across 9 election cycles (1994-2034)'
        },
        decision: {
          title: 'Decision Effectiveness Heatmap',
          description: 'Legislative approval rates by party and cycle'
        },
        risk: {
          title: 'Predictive Risk Forecasting',
          description: 'Risk trajectory and confidence levels (2022-2034)'
        },
        temporal: {
          title: 'Temporal Voting Patterns',
          description: 'Attendance, ballots, and volatility trends'
        },
        tier: {
          title: 'Party Tier Distribution',
          description: 'Performance tiers (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Loading data...',
      error: 'Failed to load data',
      dataBy: 'Data by CIA Platform'
    },
    sv: {
      title: 'Valcykel Intelligens (1994-2034)',
      filters: {
        cycle: 'Valcykel',
        party: 'Parti',
        metric: 'Mått',
        allCycles: 'Alla Cykler',
        allParties: 'Alla Partier',
        performance: 'Prestation',
        decisions: 'Beslut',
        risk: 'Risk',
        attendance: 'Närvaro'
      },
      charts: {
        timeline: {
          title: 'Valcykel Prestationslinje',
          description: 'Partiernas utveckling över 9 valcykler (1994-2034)'
        },
        decision: {
          title: 'Besluts Effektivitet Värmekarta',
          description: 'Lagstiftande godkännandegrader per parti och cykel'
        },
        risk: {
          title: 'Prediktiv Riskprognos',
          description: 'Riskbana och konfidensnivåer (2022-2034)'
        },
        temporal: {
          title: 'Temporala Röstmönster',
          description: 'Närvaro, omröstningar och volatilitetstrender'
        },
        tier: {
          title: 'Parti Nivå Fördelning',
          description: 'Prestationsnivåer (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Laddar data...',
      error: 'Misslyckades att ladda data',
      dataBy: 'Data från CIA Plattformen'
    },
    da: {
      title: 'Valgcyklus Intelligens (1994-2034)',
      filters: {
        cycle: 'Valgcyklus',
        party: 'Parti',
        metric: 'Måling',
        allCycles: 'Alle Cykler',
        allParties: 'Alle Partier',
        performance: 'Præstation',
        decisions: 'Beslutninger',
        risk: 'Risiko',
        attendance: 'Fremmøde'
      },
      charts: {
        timeline: {
          title: 'Valgcyklus Præstationslinje',
          description: 'Partiernes udvikling over 9 valgcykler (1994-2034)'
        },
        decision: {
          title: 'Beslutningseffektivitet Varmekort',
          description: 'Lovgivende godkendelsesrater pr. parti og cyklus'
        },
        risk: {
          title: 'Prædiktiv Risikoforecast',
          description: 'Risikobane og konfidensniveauer (2022-2034)'
        },
        temporal: {
          title: 'Temporale Stemmemønstre',
          description: 'Fremmøde, afstemninger og volatilitetstendenser'
        },
        tier: {
          title: 'Parti Niveau Fordeling',
          description: 'Præstationsniveauer (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Indlæser data...',
      error: 'Kunne ikke indlæse data',
      dataBy: 'Data fra CIA Platformen'
    },
    no: {
      title: 'Valgsyklus Intelligens (1994-2034)',
      filters: {
        cycle: 'Valgsyklus',
        party: 'Parti',
        metric: 'Måling',
        allCycles: 'Alle Sykluser',
        allParties: 'Alle Partier',
        performance: 'Prestasjon',
        decisions: 'Beslutninger',
        risk: 'Risiko',
        attendance: 'Oppmøte'
      },
      charts: {
        timeline: {
          title: 'Valgsyklus Prestasjonslinje',
          description: 'Partienes utvikling over 9 valgsykluser (1994-2034)'
        },
        decision: {
          title: 'Beslutningseffektivitet Varmekart',
          description: 'Lovgivende godkjenningsrater per parti og syklus'
        },
        risk: {
          title: 'Prediktiv Risikoforecast',
          description: 'Risikobane og konfidensnivåer (2022-2034)'
        },
        temporal: {
          title: 'Temporale Stemmemønstre',
          description: 'Oppmøte, avstemninger og volatilitetstrender'
        },
        tier: {
          title: 'Parti Nivå Fordeling',
          description: 'Prestasjonsnivåer (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Laster data...',
      error: 'Kunne ikke laste data',
      dataBy: 'Data fra CIA Plattformen'
    },
    fi: {
      title: 'Vaalikierto Älykkyys (1994-2034)',
      filters: {
        cycle: 'Vaalikierto',
        party: 'Puolue',
        metric: 'Mittari',
        allCycles: 'Kaikki Kierrot',
        allParties: 'Kaikki Puolueet',
        performance: 'Suoritus',
        decisions: 'Päätökset',
        risk: 'Riski',
        attendance: 'Läsnäolo'
      },
      charts: {
        timeline: {
          title: 'Vaalikierto Suorituslinja',
          description: 'Puolueiden kehitys 9 vaalikierron aikana (1994-2034)'
        },
        decision: {
          title: 'Päätöksenteon Tehokkuus Lämpökartta',
          description: 'Lainsäädännölliset hyväksymisasteet puolueittain ja kierroittain'
        },
        risk: {
          title: 'Ennustava Riskiennuste',
          description: 'Riskirata ja luottamustasot (2022-2034)'
        },
        temporal: {
          title: 'Ajalliset Äänestysmallit',
          description: 'Läsnäolo, äänestysten ja volatiliteetin trendit'
        },
        tier: {
          title: 'Puolue Taso Jakautuminen',
          description: 'Suoritustasot (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Ladataan dataa...',
      error: 'Datan lataaminen epäonnistui',
      dataBy: 'Data CIA Alustalta'
    },
    de: {
      title: 'Wahlzyklus Intelligenz (1994-2034)',
      filters: {
        cycle: 'Wahlzyklus',
        party: 'Partei',
        metric: 'Metrik',
        allCycles: 'Alle Zyklen',
        allParties: 'Alle Parteien',
        performance: 'Leistung',
        decisions: 'Entscheidungen',
        risk: 'Risiko',
        attendance: 'Anwesenheit'
      },
      charts: {
        timeline: {
          title: 'Wahlzyklus Leistungslinie',
          description: 'Parteiliche Entwicklung über 9 Wahlzyklen (1994-2034)'
        },
        decision: {
          title: 'Entscheidungseffektivität Heatmap',
          description: 'Legislative Zustimmungsraten nach Partei und Zyklus'
        },
        risk: {
          title: 'Prädiktive Risikovorhersage',
          description: 'Risikotrajektorie und Konfidenzniveaus (2022-2034)'
        },
        temporal: {
          title: 'Zeitliche Abstimmungsmuster',
          description: 'Anwesenheit, Abstimmungen und Volatilitätstrends'
        },
        tier: {
          title: 'Partei Stufen Verteilung',
          description: 'Leistungsstufen (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Daten werden geladen...',
      error: 'Fehler beim Laden der Daten',
      dataBy: 'Daten von der CIA Plattform'
    },
    fr: {
      title: 'Intelligence des Cycles Électoraux (1994-2034)',
      filters: {
        cycle: 'Cycle Électoral',
        party: 'Parti',
        metric: 'Métrique',
        allCycles: 'Tous les Cycles',
        allParties: 'Tous les Partis',
        performance: 'Performance',
        decisions: 'Décisions',
        risk: 'Risque',
        attendance: 'Présence'
      },
      charts: {
        timeline: {
          title: 'Chronologie de Performance Électorale',
          description: 'Évolution des partis sur 9 cycles électoraux (1994-2034)'
        },
        decision: {
          title: 'Carte Thermique d\'Efficacité Décisionnelle',
          description: 'Taux d\'approbation législatif par parti et cycle'
        },
        risk: {
          title: 'Prévision Prédictive des Risques',
          description: 'Trajectoire des risques et niveaux de confiance (2022-2034)'
        },
        temporal: {
          title: 'Modèles de Vote Temporels',
          description: 'Tendances de présence, scrutins et volatilité'
        },
        tier: {
          title: 'Distribution des Niveaux de Parti',
          description: 'Niveaux de performance (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Chargement des données...',
      error: 'Échec du chargement des données',
      dataBy: 'Données de la Plateforme CIA'
    },
    es: {
      title: 'Inteligencia del Ciclo Electoral (1994-2034)',
      filters: {
        cycle: 'Ciclo Electoral',
        party: 'Partido',
        metric: 'Métrica',
        allCycles: 'Todos los Ciclos',
        allParties: 'Todos los Partidos',
        performance: 'Rendimiento',
        decisions: 'Decisiones',
        risk: 'Riesgo',
        attendance: 'Asistencia'
      },
      charts: {
        timeline: {
          title: 'Línea Temporal de Rendimiento Electoral',
          description: 'Evolución de partidos a través de 9 ciclos electorales (1994-2034)'
        },
        decision: {
          title: 'Mapa de Calor de Efectividad Decisional',
          description: 'Tasas de aprobación legislativa por partido y ciclo'
        },
        risk: {
          title: 'Pronóstico Predictivo de Riesgos',
          description: 'Trayectoria de riesgos y niveles de confianza (2022-2034)'
        },
        temporal: {
          title: 'Patrones de Votación Temporal',
          description: 'Tendencias de asistencia, votaciones y volatilidad'
        },
        tier: {
          title: 'Distribución de Niveles de Partido',
          description: 'Niveles de rendimiento (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Cargando datos...',
      error: 'Error al cargar datos',
      dataBy: 'Datos de la Plataforma CIA'
    },
    nl: {
      title: 'Verkiezingscyclus Intelligentie (1994-2034)',
      filters: {
        cycle: 'Verkiezingscyclus',
        party: 'Partij',
        metric: 'Maatstaf',
        allCycles: 'Alle Cycli',
        allParties: 'Alle Partijen',
        performance: 'Prestatie',
        decisions: 'Beslissingen',
        risk: 'Risico',
        attendance: 'Aanwezigheid'
      },
      charts: {
        timeline: {
          title: 'Verkiezingscyclus Prestatie Tijdlijn',
          description: 'Partij-evolutie over 9 verkiezingscycli (1994-2034)'
        },
        decision: {
          title: 'Beslissingseffectiviteit Heatmap',
          description: 'Wetgevende goedkeuringspercentages per partij en cyclus'
        },
        risk: {
          title: 'Voorspellende Risico Voorspelling',
          description: 'Risicobaan en vertrouwensniveaus (2022-2034)'
        },
        temporal: {
          title: 'Temporele Stempatronen',
          description: 'Aanwezigheid, stemmingen en volatiliteitstendenzen'
        },
        tier: {
          title: 'Partij Niveau Verdeling',
          description: 'Prestatieniveaus (ntile_party_tier: 1-4)'
        }
      },
      loading: 'Gegevens laden...',
      error: 'Laden van gegevens mislukt',
      dataBy: 'Gegevens van CIA Platform'
    },
    ar: {
      title: 'ذكاء الدورة الانتخابية (1994-2034)',
      filters: {
        cycle: 'الدورة الانتخابية',
        party: 'الحزب',
        metric: 'المقياس',
        allCycles: 'جميع الدورات',
        allParties: 'جميع الأحزاب',
        performance: 'الأداء',
        decisions: 'القرارات',
        risk: 'المخاطر',
        attendance: 'الحضور'
      },
      charts: {
        timeline: {
          title: 'الخط الزمني لأداء الدورة الانتخابية',
          description: 'تطور الأحزاب عبر 9 دورات انتخابية (1994-2034)'
        },
        decision: {
          title: 'خريطة حرارية لفعالية القرارات',
          description: 'معدلات الموافقة التشريعية حسب الحزب والدورة'
        },
        risk: {
          title: 'التنبؤ التنبؤي بالمخاطر',
          description: 'مسار المخاطر ومستويات الثقة (2022-2034)'
        },
        temporal: {
          title: 'أنماط التصويت الزمنية',
          description: 'اتجاهات الحضور والاقتراع والتقلب'
        },
        tier: {
          title: 'توزيع مستوى الحزب',
          description: 'مستويات الأداء (ntile_party_tier: 1-4)'
        }
      },
      loading: 'جاري تحميل البيانات...',
      error: 'فشل تحميل البيانات',
      dataBy: 'البيانات من منصة CIA'
    },
    he: {
      title: 'מודיעין מחזור בחירות (1994-2034)',
      filters: {
        cycle: 'מחזור בחירות',
        party: 'מפלגה',
        metric: 'מדד',
        allCycles: 'כל המחזורים',
        allParties: 'כל המפלגות',
        performance: 'ביצועים',
        decisions: 'החלטות',
        risk: 'סיכון',
        attendance: 'נוכחות'
      },
      charts: {
        timeline: {
          title: 'ציר זמן של ביצועי מחזור בחירות',
          description: 'התפתחות מפלגות על פני 9 מחזורי בחירות (1994-2034)'
        },
        decision: {
          title: 'מפת חום של אפקטיביות החלטות',
          description: 'שיעורי אישור חקיקתיים לפי מפלגה ומחזור'
        },
        risk: {
          title: 'תחזית סיכונים חזויה',
          description: 'מסלול סיכונים ורמות ביטחון (2022-2034)'
        },
        temporal: {
          title: 'דפוסי הצבעה זמניים',
          description: 'מגמות נוכחות, הצבעות ותנודתיות'
        },
        tier: {
          title: 'חלוקת רמת מפלגה',
          description: 'רמות ביצועים (ntile_party_tier: 1-4)'
        }
      },
      loading: 'טוען נתונים...',
      error: 'שגיאה בטעינת נתונים',
      dataBy: 'נתונים מפלטפורמת CIA'
    },
    ja: {
      title: '選挙サイクルインテリジェンス (1994-2034)',
      filters: {
        cycle: '選挙サイクル',
        party: '政党',
        metric: '指標',
        allCycles: '全サイクル',
        allParties: '全政党',
        performance: 'パフォーマンス',
        decisions: '決定',
        risk: 'リスク',
        attendance: '出席'
      },
      charts: {
        timeline: {
          title: '選挙サイクル パフォーマンス タイムライン',
          description: '9つの選挙サイクルにわたる政党の進化 (1994-2034)'
        },
        decision: {
          title: '意思決定の効率性 ヒートマップ',
          description: '政党とサイクル別の立法承認率'
        },
        risk: {
          title: '予測リスク予測',
          description: 'リスク軌道と信頼レベル (2022-2034)'
        },
        temporal: {
          title: '時間的投票パターン',
          description: '出席、投票、変動性のトレンド'
        },
        tier: {
          title: '政党階層分布',
          description: 'パフォーマンス階層 (ntile_party_tier: 1-4)'
        }
      },
      loading: 'データを読み込んでいます...',
      error: 'データの読み込みに失敗しました',
      dataBy: 'CIAプラットフォームからのデータ'
    },
    ko: {
      title: '선거 주기 인텔리전스 (1994-2034)',
      filters: {
        cycle: '선거 주기',
        party: '정당',
        metric: '지표',
        allCycles: '모든 주기',
        allParties: '모든 정당',
        performance: '성과',
        decisions: '결정',
        risk: '위험',
        attendance: '출석'
      },
      charts: {
        timeline: {
          title: '선거 주기 성과 타임라인',
          description: '9개 선거 주기에 걸친 정당 발전 (1994-2034)'
        },
        decision: {
          title: '의사 결정 효율성 히트맵',
          description: '정당 및 주기별 입법 승인률'
        },
        risk: {
          title: '예측 위험 예측',
          description: '위험 궤적 및 신뢰 수준 (2022-2034)'
        },
        temporal: {
          title: '시간적 투표 패턴',
          description: '출석, 투표, 변동성 추세'
        },
        tier: {
          title: '정당 계층 분포',
          description: '성과 계층 (ntile_party_tier: 1-4)'
        }
      },
      loading: '데이터 로딩 중...',
      error: '데이터 로드 실패',
      dataBy: 'CIA 플랫폼의 데이터'
    },
    zh: {
      title: '选举周期情报 (1994-2034)',
      filters: {
        cycle: '选举周期',
        party: '政党',
        metric: '指标',
        allCycles: '所有周期',
        allParties: '所有政党',
        performance: '表现',
        decisions: '决策',
        risk: '风险',
        attendance: '出勤'
      },
      charts: {
        timeline: {
          title: '选举周期表现时间线',
          description: '9个选举周期中的政党演变 (1994-2034)'
        },
        decision: {
          title: '决策效率热图',
          description: '按政党和周期的立法批准率'
        },
        risk: {
          title: '预测风险预报',
          description: '风险轨迹和置信水平 (2022-2034)'
        },
        temporal: {
          title: '时间投票模式',
          description: '出勤率、投票和波动性趋势'
        },
        tier: {
          title: '政党层级分布',
          description: '表现层级 (ntile_party_tier: 1-4)'
        }
      },
      loading: '正在加载数据...',
      error: '数据加载失败',
      dataBy: '来自CIA平台的数据'
    }
  };

  /**
   * Data Manager Class - Fetches and caches CIA CSV data
   */
  class ElectionCycleDataManager {
    constructor() {
      this.data = {
        comparative: null,
        decision: null,
        predictive: null,
        temporal: null
      };
    }

    /**
     * Fetch all CSV data with caching
     */
    async fetchAllData() {
      try {
        await Promise.all([
          this.fetchData('comparative'),
          this.fetchData('decision'),
          this.fetchData('predictive'),
          this.fetchData('temporal')
        ]);
        return this.data;
      } catch (error) {
        console.error('Error fetching election cycle data:', error);
        throw error;
      }
    }

    /**
     * Fetch individual CSV file with 24h caching
     */
    async fetchData(type) {
      const cacheKey = CONFIG.cachePrefix + type;
      const cached = this.getCache(cacheKey);

      if (cached) {
        this.data[type] = cached;
        return cached;
      }

      try {
        const response = await fetch(CONFIG.dataUrls[type]);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvText = await response.text();
        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        this.data[type] = parsed.data;
        this.setCache(cacheKey, parsed.data);
        return parsed.data;
      } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
        // Try to use cached data even if expired
        const expiredCache = localStorage.getItem(cacheKey);
        if (expiredCache) {
          const parsed = JSON.parse(expiredCache);
          this.data[type] = parsed.data;
          return parsed.data;
        }
        throw error;
      }
    }

    /**
     * Get cached data if not expired
     */
    getCache(key) {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CONFIG.cacheExpiry) {
          return data;
        }
      } catch (error) {
        console.error('Cache parse error:', error);
      }
      
      return null;
    }

    /**
     * Store data in cache with timestamp
     */
    setCache(key, data) {
      try {
        const cacheData = {
          data: data,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Cache storage error:', error);
      }
    }

    /**
     * Get unique election cycles from comparative data
     */
    getElectionCycles() {
      if (!this.data.comparative) return [];
      
      const cycles = [...new Set(this.data.comparative.map(d => d.election_cycle_id))];
      return cycles.sort();
    }

    /**
     * Get unique parties from comparative data
     */
    getParties() {
      if (!this.data.comparative) return [];
      
      const parties = [...new Set(this.data.comparative.map(d => d.party))];
      return parties.filter(p => p && p !== '').sort();
    }
  }

  /**
   * Chart Renderer Class - Creates visualizations with Chart.js and D3.js
   */
  class ElectionCycleCharts {
    constructor(dataManager, translations) {
      this.dataManager = dataManager;
      this.translations = translations;
      this.charts = {};
    }

    /**
     * Render timeline chart showing performance evolution
     */
    renderTimeline(canvasId, filteredData) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      
      // Destroy existing chart
      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy();
      }

      // Get major parties (top 8)
      const parties = ['M', 'S', 'SD', 'C', 'V', 'MP', 'KD', 'L'];
      
      // Group data by party and cycle
      const datasets = parties.map(party => {
        const partyData = filteredData.filter(d => d.party === party);
        
        // Aggregate by cycle_year
        const cycleData = {};
        partyData.forEach(d => {
          const year = d.cycle_year || d.election_cycle_id;
          if (!cycleData[year]) {
            cycleData[year] = {
              performance: 0,
              count: 0
            };
          }
          if (d.performance_score) {
            cycleData[year].performance += parseFloat(d.performance_score);
            cycleData[year].count++;
          }
        });
        
        // Calculate averages
        const data = Object.keys(cycleData)
          .sort()
          .map(year => ({
            x: year,
            y: cycleData[year].count > 0 ? cycleData[year].performance / cycleData[year].count : null
          }));

        return {
          label: party,
          data: data,
          borderColor: CONFIG.partyColors[party] || CONFIG.partyColors.default,
          backgroundColor: CONFIG.partyColors[party] || CONFIG.partyColors.default,
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 5
        };
      });

      this.charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            title: {
              display: true,
              text: this.translations.charts.timeline.title,
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const party = context.dataset.label;
                  const score = context.parsed.y ? context.parsed.y.toFixed(2) : 'N/A';
                  return `${party}: ${score}`;
                }
              }
            }
          },
          scales: {
            x: {
              type: 'category',
              title: {
                display: true,
                text: this.translations.filters.cycle
              }
            },
            y: {
              beginAtZero: false,
              min: 50,
              max: 100,
              title: {
                display: true,
                text: 'Performance Score'
              }
            }
          }
        }
      });
    }

    /**
     * Render D3.js heat map for decision effectiveness
     */
    renderDecisionHeatmap(containerId, decisionData) {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Clear existing content
      container.innerHTML = '';

      // Prepare data
      const heatmapData = [];
      const parties = ['M', 'S', 'SD', 'C', 'V', 'MP', 'KD', 'L'];
      const cycles = [...new Set(decisionData.map(d => d.election_cycle_id))].sort();

      parties.forEach(party => {
        cycles.forEach(cycle => {
          const cycleData = decisionData.filter(d => 
            d.party === party && d.election_cycle_id === cycle
          );
          
          if (cycleData.length > 0) {
            const avgApproval = cycleData.reduce((sum, d) => 
              sum + (parseFloat(d.avg_approval_rate) || 0), 0) / cycleData.length;
            
            heatmapData.push({
              party: party,
              cycle: cycle,
              approval: avgApproval,
              effectiveness: cycleData[0].decision_effectiveness || 'N/A'
            });
          }
        });
      });

      // Set dimensions
      const margin = { top: 60, right: 30, bottom: 60, left: 80 };
      const cellSize = 50;
      const width = cycles.length * cellSize + margin.left + margin.right;
      const height = parties.length * cellSize + margin.top + margin.bottom;

      // Create SVG
      const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Color scale (red → yellow → green)
      const colorScale = d3.scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateRdYlGn);

      // X scale (cycles)
      const xScale = d3.scaleBand()
        .domain(cycles)
        .range([0, cycles.length * cellSize])
        .padding(0.05);

      // Y scale (parties)
      const yScale = d3.scaleBand()
        .domain(parties)
        .range([0, parties.length * cellSize])
        .padding(0.05);

      // Add cells
      g.selectAll('rect')
        .data(heatmapData)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.cycle))
        .attr('y', d => yScale(d.party))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.approval))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .append('title')
        .text(d => `${d.party} - ${d.cycle}\nApproval: ${d.approval.toFixed(1)}%\n${d.effectiveness}`);

      // Add X axis
      g.append('g')
        .attr('transform', `translate(0,${parties.length * cellSize})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

      // Add Y axis
      g.append('g')
        .call(d3.axisLeft(yScale));

      // Add title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(this.translations.charts.decision.title);
    }

    /**
     * Render risk forecast scatter chart
     */
    renderRiskForecast(canvasId, predictiveData) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      
      // Destroy existing chart
      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy();
      }

      // Prepare data grouped by risk category
      const stableData = [];
      const escalationData = [];

      predictiveData.forEach(d => {
        const point = {
          x: d.election_cycle_id || d.cycle_year,
          y: parseFloat(d.avg_risk_score_change) || 0,
          r: Math.sqrt((d.politicians_at_risk || 0) / 10) + 3, // Size based on politicians at risk
          confidence: d.forecast_confidence || 'unknown',
          ministries: d.ministries_at_risk || 0
        };

        if (d.risk_forecast_category === 'STABLE') {
          stableData.push(point);
        } else if (d.risk_forecast_category === 'RAPID_ESCALATION') {
          escalationData.push(point);
        }
      });

      this.charts[canvasId] = new Chart(ctx, {
        type: 'bubble',
        data: {
          datasets: [
            {
              label: 'STABLE',
              data: stableData,
              backgroundColor: CONFIG.riskColors.STABLE + '80',
              borderColor: CONFIG.riskColors.STABLE,
              borderWidth: 2
            },
            {
              label: 'RAPID_ESCALATION',
              data: escalationData,
              backgroundColor: CONFIG.riskColors.RAPID_ESCALATION + '80',
              borderColor: CONFIG.riskColors.RAPID_ESCALATION,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: this.translations.charts.risk.title,
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const data = context.raw;
                  return [
                    `Risk Change: ${data.y.toFixed(2)}`,
                    `Politicians at Risk: ${Math.round(Math.pow((data.r - 3), 2) * 10)}`,
                    `Confidence: ${data.confidence}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              type: 'category',
              title: {
                display: true,
                text: this.translations.filters.cycle
              }
            },
            y: {
              title: {
                display: true,
                text: 'Avg Risk Score Change'
              }
            }
          }
        }
      });
    }

    /**
     * Render temporal trends multi-axis chart
     */
    renderTemporalTrends(canvasId, temporalData) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      
      // Destroy existing chart
      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy();
      }

      // Aggregate data by cycle_year + semester
      const aggregated = {};
      temporalData.forEach(d => {
        const key = `${d.election_cycle_id}-${d.semester}`;
        if (!aggregated[key]) {
          aggregated[key] = {
            label: key,
            attendance: parseFloat(d.avg_attendance_rate) || 0,
            ballots: parseInt(d.total_ballots) || 0,
            approval: parseFloat(d.avg_approval_rate) || 0,
            preElection: d.is_pre_election_semester === 'TRUE' || d.is_pre_election_semester === true
          };
        }
      });

      const labels = Object.keys(aggregated).sort();
      const attendanceData = labels.map(key => aggregated[key].attendance);
      const ballotsData = labels.map(key => aggregated[key].ballots / 1000); // Scale to thousands
      const approvalData = labels.map(key => aggregated[key].approval);

      this.charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Attendance Rate (%)',
              data: attendanceData,
              borderColor: '#2196F3',
              backgroundColor: '#2196F3',
              borderWidth: 2,
              fill: false,
              yAxisID: 'y'
            },
            {
              label: 'Ballots (thousands)',
              data: ballotsData,
              borderColor: '#4CAF50',
              backgroundColor: '#4CAF50',
              borderWidth: 2,
              fill: false,
              yAxisID: 'y1'
            },
            {
              label: 'Approval Rate (%)',
              data: approvalData,
              borderColor: '#FF9800',
              backgroundColor: '#FF9800',
              borderWidth: 2,
              fill: false,
              yAxisID: 'y'
            }
          ]
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
              display: true,
              text: this.translations.charts.temporal.title,
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'bottom'
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Cycle - Semester'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Percentage (%)'
              },
              beginAtZero: true,
              max: 100
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Ballots (thousands)'
              },
              beginAtZero: true,
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      });
    }

    /**
     * Render party tier distribution stacked bar chart
     */
    renderPartyTierChart(canvasId, comparativeData) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      
      // Destroy existing chart
      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy();
      }

      // Group by cycle and tier
      const cycleData = {};
      comparativeData.forEach(d => {
        const cycle = d.election_cycle_id || d.cycle_year;
        const tier = d.ntile_party_tier;
        
        if (!cycleData[cycle]) {
          cycleData[cycle] = { 1: 0, 2: 0, 3: 0, 4: 0 };
        }
        
        if (tier >= 1 && tier <= 4) {
          cycleData[cycle][tier]++;
        }
      });

      const cycles = Object.keys(cycleData).sort();
      const tier1Data = cycles.map(c => cycleData[c][1]);
      const tier2Data = cycles.map(c => cycleData[c][2]);
      const tier3Data = cycles.map(c => cycleData[c][3]);
      const tier4Data = cycles.map(c => cycleData[c][4]);

      this.charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: cycles,
          datasets: [
            {
              label: 'Tier 1 (Top)',
              data: tier1Data,
              backgroundColor: '#2e7d32'
            },
            {
              label: 'Tier 2',
              data: tier2Data,
              backgroundColor: '#66bb6a'
            },
            {
              label: 'Tier 3',
              data: tier3Data,
              backgroundColor: '#fbc02d'
            },
            {
              label: 'Tier 4 (Bottom)',
              data: tier4Data,
              backgroundColor: '#f57c00'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: this.translations.charts.tier.title,
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'bottom'
            }
          },
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: this.translations.filters.cycle
              }
            },
            y: {
              stacked: true,
              title: {
                display: true,
                text: 'Number of Parties'
              },
              beginAtZero: true
            }
          }
        }
      });
    }

    /**
     * Destroy all charts
     */
    destroyAll() {
      Object.keys(this.charts).forEach(key => {
        if (this.charts[key]) {
          this.charts[key].destroy();
        }
      });
      this.charts = {};
    }
  }

  /**
   * Dashboard Controller - Orchestrates data fetching and rendering
   */
  class ElectionCycleDashboard {
    constructor() {
      this.dataManager = new ElectionCycleDataManager();
      this.currentLanguage = this.detectLanguage();
      this.translations = TRANSLATIONS[this.currentLanguage] || TRANSLATIONS.en;
      this.chartRenderer = new ElectionCycleCharts(this.dataManager, this.translations);
      this.filters = {
        cycle: 'all',
        party: 'all',
        metric: 'performance'
      };
    }

    /**
     * Detect current language from URL
     */
    detectLanguage() {
      const path = window.location.pathname;
      const langMatch = path.match(/index_([a-z]{2})\.html/);
      return langMatch ? langMatch[1] : 'en';
    }

    /**
     * Initialize dashboard
     */
    async init() {
      try {
        this.showLoading();
        
        // Fetch all data
        await this.dataManager.fetchAllData();
        
        // Setup filters
        this.setupFilters();
        
        // Render all charts
        this.renderCharts();
        
        this.hideLoading();
      } catch (error) {
        this.showError(error.message);
      }
    }

    /**
     * Setup filter dropdowns
     */
    setupFilters() {
      // Cycle filter
      const cycleFilter = document.getElementById('election-cycle-filter');
      if (cycleFilter) {
        const cycles = this.dataManager.getElectionCycles();
        cycleFilter.innerHTML = `<option value="all">${this.translations.filters.allCycles}</option>`;
        cycles.forEach(cycle => {
          const option = document.createElement('option');
          option.value = cycle;
          option.textContent = cycle;
          cycleFilter.appendChild(option);
        });

        cycleFilter.addEventListener('change', (e) => {
          this.filters.cycle = e.target.value;
          this.renderCharts();
        });
      }

      // Party filter
      const partyFilter = document.getElementById('election-party-filter');
      if (partyFilter) {
        const parties = this.dataManager.getParties();
        partyFilter.innerHTML = `<option value="all">${this.translations.filters.allParties}</option>`;
        parties.forEach(party => {
          const option = document.createElement('option');
          option.value = party;
          option.textContent = party;
          partyFilter.appendChild(option);
        });

        partyFilter.addEventListener('change', (e) => {
          this.filters.party = e.target.value;
          this.renderCharts();
        });
      }

      // Metric filter
      const metricFilter = document.getElementById('election-metric-filter');
      if (metricFilter) {
        metricFilter.addEventListener('change', (e) => {
          this.filters.metric = e.target.value;
          this.renderCharts();
        });
      }
    }

    /**
     * Filter data based on current filters
     */
    filterData(data) {
      if (!data) return [];

      return data.filter(d => {
        // Cycle filter
        if (this.filters.cycle !== 'all' && d.election_cycle_id !== this.filters.cycle) {
          return false;
        }

        // Party filter
        if (this.filters.party !== 'all' && d.party !== this.filters.party) {
          return false;
        }

        return true;
      });
    }

    /**
     * Render all charts with current filters
     */
    renderCharts() {
      const comparativeData = this.filterData(this.dataManager.data.comparative);
      const decisionData = this.filterData(this.dataManager.data.decision);
      const predictiveData = this.filterData(this.dataManager.data.predictive);
      const temporalData = this.filterData(this.dataManager.data.temporal);

      // Render each chart
      this.chartRenderer.renderTimeline('cycle-timeline-chart', comparativeData);
      this.chartRenderer.renderDecisionHeatmap('decision-heatmap', decisionData);
      this.chartRenderer.renderRiskForecast('risk-forecast-chart', predictiveData);
      this.chartRenderer.renderTemporalTrends('temporal-trends-chart', temporalData);
      this.chartRenderer.renderPartyTierChart('party-tier-chart', comparativeData);
    }

    /**
     * Show loading state
     */
    showLoading() {
      const dashboard = document.getElementById('election-cycle-dashboard');
      if (dashboard) {
        dashboard.classList.add('loading');
        const loader = dashboard.querySelector('.dashboard-loader');
        if (loader) {
          loader.textContent = this.translations.loading;
          loader.style.display = 'block';
        }
      }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
      const dashboard = document.getElementById('election-cycle-dashboard');
      if (dashboard) {
        dashboard.classList.remove('loading');
        const loader = dashboard.querySelector('.dashboard-loader');
        if (loader) {
          loader.style.display = 'none';
        }
      }
    }

    /**
     * Show error message
     */
    showError(message) {
      const dashboard = document.getElementById('election-cycle-dashboard');
      if (dashboard) {
        dashboard.classList.add('error');
        const error = dashboard.querySelector('.dashboard-error');
        if (error) {
          error.textContent = `${this.translations.error}: ${message}`;
          error.style.display = 'block';
        }
      }
    }
  }

  // Initialize dashboard when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.electionCycleDashboard = new ElectionCycleDashboard();
      window.electionCycleDashboard.init();
    });
  } else {
    window.electionCycleDashboard = new ElectionCycleDashboard();
    window.electionCycleDashboard.init();
  }

})();
