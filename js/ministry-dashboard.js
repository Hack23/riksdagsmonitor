/**
 * Government Minister Risk & Influence Analytics Dashboard
 * 
 * @description Comprehensive dashboard displaying Swedish government minister risk profiles,
 * influence metrics, productivity scores, and decision impact analysis using CIA platform data.
 * 
 * @version 1.0.0
 * @author Hack23 AB
 * @license MIT
 * 
 * @security CSP-compliant, no inline scripts, HTTPS-only data fetching
 * @accessibility WCAG 2.1 AA compliant with keyboard navigation and screen reader support
 * @performance Lazy loading, local caching, < 3 second load time
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    dataSource: {
      // Local-first data loading: try local files first, then fallback to remote
      localUrl: 'cia-data/ministry/',
      remoteUrl: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/',
      files: {
        riskLevels: 'distribution_ministry_risk_levels.csv',
        productivity: 'distribution_ministry_productivity_matrix.csv',
        influence: 'percentile_politician_influence_metrics.csv',
        decisionImpact: 'distribution_ministry_decision_impact.csv'
      },
      cacheExpiry: 3600000 // 1 hour in milliseconds
    },
    charts: {
      d3Version: '7.8.5',
      chartJsVersion: '4.4.1'
    },
    colors: {
      riskCritical: '#d32f2f',
      riskHigh: '#f57c00',
      riskMedium: '#fbc02d',
      riskLow: '#388e3c',
      primary: '#006633',
      accent: '#00cc66'
    }
  };

  // Ministry translations for all 14 languages
  const MINISTRY_TRANSLATIONS = {
    en: {
      'Finansdepartementet': 'Ministry of Finance',
      'Utrikesdepartementet': 'Ministry of Foreign Affairs',
      'Försvarsdepartementet': 'Ministry of Defence',
      'Justitiedepartementet': 'Ministry of Justice',
      'Socialdepartementet': 'Ministry of Health and Social Affairs',
      'Utbildningsdepartementet': 'Ministry of Education',
      'Näringsdepartementet': 'Ministry of Enterprise',
      'Miljödepartementet': 'Ministry of Environment',
      'Kulturdepartementet': 'Ministry of Culture',
      'Infrastrukturdepartementet': 'Ministry of Infrastructure'
    },
    sv: {
      'Finansdepartementet': 'Finansdepartementet',
      'Utrikesdepartementet': 'Utrikesdepartementet',
      'Försvarsdepartementet': 'Försvarsdepartementet',
      'Justitiedepartementet': 'Justitiedepartementet',
      'Socialdepartementet': 'Socialdepartementet',
      'Utbildningsdepartementet': 'Utbildningsdepartementet',
      'Näringsdepartementet': 'Näringsdepartementet',
      'Miljödepartementet': 'Miljödepartementet',
      'Kulturdepartementet': 'Kulturdepartementet',
      'Infrastrukturdepartementet': 'Infrastrukturdepartementet'
    },
    da: {
      'Finansdepartementet': 'Finansministeriet',
      'Utrikesdepartementet': 'Udenrigsministeriet',
      'Försvarsdepartementet': 'Forsvarsministeriet',
      'Justitiedepartementet': 'Justitsministeriet',
      'Socialdepartementet': 'Social- og Sundhedsministeriet',
      'Utbildningsdepartementet': 'Undervisningsministeriet',
      'Näringsdepartementet': 'Erhvervsministeriet',
      'Miljödepartementet': 'Miljøministeriet',
      'Kulturdepartementet': 'Kulturministeriet',
      'Infrastrukturdepartementet': 'Infrastrukturministeriet'
    },
    no: {
      'Finansdepartementet': 'Finansdepartementet',
      'Utrikesdepartementet': 'Utenriksdepartementet',
      'Försvarsdepartementet': 'Forsvarsdepartementet',
      'Justitiedepartementet': 'Justis- og beredskapsdepartementet',
      'Socialdepartementet': 'Helse- og omsorgsdepartementet',
      'Utbildningsdepartementet': 'Kunnskapsdepartementet',
      'Näringsdepartementet': 'Nærings- og fiskeridepartementet',
      'Miljödepartementet': 'Klima- og miljødepartementet',
      'Kulturdepartementet': 'Kulturdepartementet',
      'Infrastrukturdepartementet': 'Samferdselsdepartementet'
    },
    fi: {
      'Finansdepartementet': 'Valtiovarainministeriö',
      'Utrikesdepartementet': 'Ulkoministeriö',
      'Försvarsdepartementet': 'Puolustusministeriö',
      'Justitiedepartementet': 'Oikeusministeriö',
      'Socialdepartementet': 'Sosiaali- ja terveysministeriö',
      'Utbildningsdepartementet': 'Opetus- ja kulttuuriministeriö',
      'Näringsdepartementet': 'Työ- ja elinkeinoministeriö',
      'Miljödepartementet': 'Ympäristöministeriö',
      'Kulturdepartementet': 'Opetus- ja kulttuuriministeriö',
      'Infrastrukturdepartementet': 'Liikenne- ja viestintäministeriö'
    },
    de: {
      'Finansdepartementet': 'Finanzministerium',
      'Utrikesdepartementet': 'Außenministerium',
      'Försvarsdepartementet': 'Verteidigungsministerium',
      'Justitiedepartementet': 'Justizministerium',
      'Socialdepartementet': 'Ministerium für Gesundheit und Soziales',
      'Utbildningsdepartementet': 'Bildungsministerium',
      'Näringsdepartementet': 'Wirtschaftsministerium',
      'Miljödepartementet': 'Umweltministerium',
      'Kulturdepartementet': 'Kulturministerium',
      'Infrastrukturdepartementet': 'Infrastrukturministerium'
    },
    fr: {
      'Finansdepartementet': 'Ministère des Finances',
      'Utrikesdepartementet': 'Ministère des Affaires étrangères',
      'Försvarsdepartementet': 'Ministère de la Défense',
      'Justitiedepartementet': 'Ministère de la Justice',
      'Socialdepartementet': 'Ministère de la Santé et des Affaires sociales',
      'Utbildningsdepartementet': "Ministère de l'Éducation",
      'Näringsdepartementet': "Ministère de l'Entreprise",
      'Miljödepartementet': "Ministère de l'Environnement",
      'Kulturdepartementet': 'Ministère de la Culture',
      'Infrastrukturdepartementet': "Ministère de l'Infrastructure"
    },
    es: {
      'Finansdepartementet': 'Ministerio de Finanzas',
      'Utrikesdepartementet': 'Ministerio de Asuntos Exteriores',
      'Försvarsdepartementet': 'Ministerio de Defensa',
      'Justitiedepartementet': 'Ministerio de Justicia',
      'Socialdepartementet': 'Ministerio de Salud y Asuntos Sociales',
      'Utbildningsdepartementet': 'Ministerio de Educación',
      'Näringsdepartementet': 'Ministerio de Empresa',
      'Miljödepartementet': 'Ministerio de Medio Ambiente',
      'Kulturdepartementet': 'Ministerio de Cultura',
      'Infrastrukturdepartementet': 'Ministerio de Infraestructura'
    },
    nl: {
      'Finansdepartementet': 'Ministerie van Financiën',
      'Utrikesdepartementet': 'Ministerie van Buitenlandse Zaken',
      'Försvarsdepartementet': 'Ministerie van Defensie',
      'Justitiedepartementet': 'Ministerie van Justitie',
      'Socialdepartementet': 'Ministerie van Volksgezondheid en Sociale Zaken',
      'Utbildningsdepartementet': 'Ministerie van Onderwijs',
      'Näringsdepartementet': 'Ministerie van Economische Zaken',
      'Miljödepartementet': 'Ministerie van Milieu',
      'Kulturdepartementet': 'Ministerie van Cultuur',
      'Infrastrukturdepartementet': 'Ministerie van Infrastructuur'
    },
    ar: {
      'Finansdepartementet': 'وزارة المالية',
      'Utrikesdepartementet': 'وزارة الخارجية',
      'Försvarsdepartementet': 'وزارة الدفاع',
      'Justitiedepartementet': 'وزارة العدل',
      'Socialdepartementet': 'وزارة الصحة والشؤون الاجتماعية',
      'Utbildningsdepartementet': 'وزارة التعليم',
      'Näringsdepartementet': 'وزارة المؤسسات',
      'Miljödepartementet': 'وزارة البيئة',
      'Kulturdepartementet': 'وزارة الثقافة',
      'Infrastrukturdepartementet': 'وزارة البنية التحتية'
    },
    he: {
      'Finansdepartementet': 'משרד האוצר',
      'Utrikesdepartementet': 'משרד החוץ',
      'Försvarsdepartementet': 'משרד הביטחון',
      'Justitiedepartementet': 'משרד המשפטים',
      'Socialdepartementet': 'משרד הבריאות והרווחה',
      'Utbildningsdepartementet': 'משרד החינוך',
      'Näringsdepartementet': 'משרד הכלכלה',
      'Miljödepartementet': 'משרד הסביבה',
      'Kulturdepartementet': 'משרד התרבות',
      'Infrastrukturdepartementet': 'משרד התשתיות'
    },
    ja: {
      'Finansdepartementet': '財務省',
      'Utrikesdepartementet': '外務省',
      'Försvarsdepartementet': '防衛省',
      'Justitiedepartementet': '法務省',
      'Socialdepartementet': '厚生労働省',
      'Utbildningsdepartementet': '文部科学省',
      'Näringsdepartementet': '経済産業省',
      'Miljödepartementet': '環境省',
      'Kulturdepartementet': '文化省',
      'Infrastrukturdepartementet': '国土交通省'
    },
    ko: {
      'Finansdepartementet': '재무부',
      'Utrikesdepartementet': '외교부',
      'Försvarsdepartementet': '국방부',
      'Justitiedepartementet': '법무부',
      'Socialdepartementet': '보건복지부',
      'Utbildningsdepartementet': '교육부',
      'Näringsdepartementet': '산업통상자원부',
      'Miljödepartementet': '환경부',
      'Kulturdepartementet': '문화체육관광부',
      'Infrastrukturdepartementet': '국토교통부'
    },
    zh: {
      'Finansdepartementet': '财政部',
      'Utrikesdepartementet': '外交部',
      'Försvarsdepartementet': '国防部',
      'Justitiedepartementet': '司法部',
      'Socialdepartementet': '卫生与社会事务部',
      'Utbildningsdepartementet': '教育部',
      'Näringsdepartementet': '企业部',
      'Miljödepartementet': '环境部',
      'Kulturdepartementet': '文化部',
      'Infrastrukturdepartementet': '基础设施部'
    }
  };

  // UI text translations
  const UI_TRANSLATIONS = {
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
      dataAttribution: 'Data by CIA Platform'
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
      dataAttribution: 'Data från CIA-plattformen'
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
      dataAttribution: 'Data af CIA Platform'
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
      dataAttribution: 'Data fra CIA Platform'
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
      dataAttribution: 'Tiedot CIA-alustalta'
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
      dataAttribution: 'Daten von CIA Platform'
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
      dataAttribution: 'Données de la plateforme CIA'
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
      dataAttribution: 'Datos de CIA Platform'
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
      dataAttribution: 'Gegevens van CIA Platform'
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
      dataAttribution: 'بيانات من منصة CIA'
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
      dataAttribution: 'נתונים מפלטפורמת CIA'
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
      dataAttribution: 'CIAプラットフォームのデータ'
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
      dataAttribution: 'CIA 플랫폼 데이터'
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
      dataAttribution: 'CIA平台数据'
    }
  };

  /**
   * Data Cache Manager
   */
  class DataCache {
    constructor() {
      this.cache = new Map();
      this.storageKey = 'ministryDashboardCache';
      this.loadFromStorage();
    }

    loadFromStorage() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          Object.keys(data).forEach(key => {
            this.cache.set(key, data[key]);
          });
        }
      } catch (e) {
        console.warn('Failed to load cache from storage:', e);
      }
    }

    saveToStorage() {
      try {
        const data = {};
        this.cache.forEach((value, key) => {
          data[key] = value;
        });
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save cache to storage:', e);
      }
    }

    get(key) {
      const item = this.cache.get(key);
      if (!item) return null;
      
      // Check expiry
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        this.saveToStorage();
        return null;
      }
      
      return item.data;
    }

    set(key, data) {
      this.cache.set(key, {
        data: data,
        expiry: Date.now() + CONFIG.dataSource.cacheExpiry
      });
      this.saveToStorage();
    }

    clear() {
      this.cache.clear();
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Data Fetcher
   */
  class DataFetcher {
    constructor() {
      this.cache = new DataCache();
    }

    async fetchCSV(filename) {
      // Check cache first
      const cached = this.cache.get(filename);
      if (cached) {
        return cached;
      }

      // Try local file first, then fallback to remote
      const urls = [
        `${CONFIG.dataSource.localUrl}${filename}`,
        `${CONFIG.dataSource.remoteUrl}${filename}`
      ];
      
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'text/csv'
            }
          });

          if (!response.ok) {
            console.log(`Failed to fetch from ${url}: ${response.status}`);
            continue; // Try next URL
          }

          const text = await response.text();
          
          // Check if we got valid CSV data
          if (!text || text.length < 10) {
            console.log(`Empty or invalid data from ${url}`);
            continue; // Try next URL
          }
          
          const data = this.parseCSV(text);
          
          // Cache the data
          this.cache.set(filename, data);
          
          console.log(`✓ Loaded ${filename} from ${url.includes('cia-data') ? 'local' : 'remote'} (${data.length} rows)`);
          return data;
        } catch (error) {
          console.log(`Error fetching from ${url}:`, error.message);
          // Continue to next URL
        }
      }
      
      // All URLs failed
      console.error(`Failed to fetch ${filename} from all sources`);
      throw new Error(`Unable to load ${filename}`);
    }

    parseCSV(text) {
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });
        data.push(row);
      }

      return data;
    }

    async fetchAllData() {
      const [riskLevels, productivity, influence, decisionImpact] = await Promise.all([
        this.fetchCSV(CONFIG.dataSource.files.riskLevels),
        this.fetchCSV(CONFIG.dataSource.files.productivity),
        this.fetchCSV(CONFIG.dataSource.files.influence),
        this.fetchCSV(CONFIG.dataSource.files.decisionImpact)
      ]);

      return {
        riskLevels,
        productivity,
        influence,
        decisionImpact
      };
    }
  }

  /**
   * Ministry Risk Heat Map (D3.js)
   */
  class RiskHeatMap {
    constructor(containerId, data, lang = 'en') {
      this.container = document.getElementById(containerId);
      this.data = data;
      this.lang = lang;
      this.translations = MINISTRY_TRANSLATIONS[lang] || MINISTRY_TRANSLATIONS.en;
    }

    render() {
      if (!this.container || !this.data || this.data.length === 0) {
        console.warn('RiskHeatMap: Invalid container or data');
        return;
      }

      // Clear container
      this.container.innerHTML = '';

      // Dimensions
      const margin = { top: 30, right: 30, bottom: 100, left: 200 };
      const width = Math.min(this.container.clientWidth, 1200) - margin.left - margin.right;
      const height = Math.max(this.data.length * 40, 400) - margin.top - margin.bottom;

      // Create SVG
      const svg = d3.select(this.container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('role', 'img')
        .attr('aria-label', UI_TRANSLATIONS[this.lang].riskHeatMap)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Process data
      const ministries = this.data.map(d => this.translations[d.ministry] || d.ministry);
      const riskScores = this.data.map(d => parseFloat(d.riskScore) || 0);

      // Scales
      const yScale = d3.scaleBand()
        .domain(ministries)
        .range([0, height])
        .padding(0.1);

      const xScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);

      const colorScale = d3.scaleThreshold()
        .domain([4.0, 6.0, 8.0])
        .range([CONFIG.colors.riskLow, CONFIG.colors.riskMedium, CONFIG.colors.riskHigh, CONFIG.colors.riskCritical]);

      // Y axis
      svg.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('font-size', '14px')
        .style('fill', 'var(--text-color)');

      // X axis
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(10))
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', 'var(--text-color)');

      // Bars
      const bars = svg.selectAll('.risk-bar')
        .data(this.data)
        .enter()
        .append('rect')
        .attr('class', 'risk-bar')
        .attr('x', 0)
        .attr('y', (d, i) => yScale(ministries[i]))
        .attr('width', (d) => xScale(parseFloat(d.riskScore) || 0))
        .attr('height', yScale.bandwidth())
        .attr('fill', (d) => colorScale(parseFloat(d.riskScore) || 0))
        .attr('rx', 4)
        .attr('tabindex', 0)
        .attr('role', 'graphics-symbol')
        .attr('aria-label', (d, i) => `${ministries[i]}: Risk score ${d.riskScore}`)
        .style('cursor', 'pointer');

      // Tooltips
      const tooltip = d3.select('body')
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

      bars.on('mouseover', function(event, d) {
          const riskLevel = parseFloat(d.riskScore);
          let level = 'Low';
          if (riskLevel >= 8.0) level = 'Critical';
          else if (riskLevel >= 6.0) level = 'High';
          else if (riskLevel >= 4.0) level = 'Medium';

          tooltip.html(`
            <strong>${MINISTRY_TRANSLATIONS[this.lang][d.ministry] || d.ministry}</strong><br/>
            Risk Score: ${d.riskScore}<br/>
            Level: ${level}<br/>
            Alerts: ${d.alerts || 'N/A'}
          `.bind(this))
            .style('visibility', 'visible');
        }.bind(this))
        .on('mousemove', function(event) {
          tooltip.style('top', (event.pageY - 10) + 'px')
            .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function() {
          tooltip.style('visibility', 'hidden');
        });

      // Risk level legend
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(0, ${height + 50})`);

      const legendData = [
        { label: 'Low (<4.0)', color: CONFIG.colors.riskLow },
        { label: 'Medium (4.0-6.0)', color: CONFIG.colors.riskMedium },
        { label: 'High (6.0-8.0)', color: CONFIG.colors.riskHigh },
        { label: 'Critical (>8.0)', color: CONFIG.colors.riskCritical }
      ];

      legendData.forEach((item, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(${i * 150}, 0)`);

        legendItem.append('rect')
          .attr('width', 20)
          .attr('height', 20)
          .attr('fill', item.color)
          .attr('rx', 4);

        legendItem.append('text')
          .attr('x', 30)
          .attr('y', 15)
          .text(item.label)
          .style('font-size', '12px')
          .style('fill', 'var(--text-color)');
      });
    }
  }

  /**
   * Minister Influence Chart (Chart.js)
   */
  class InfluenceChart {
    constructor(canvasId, data, lang = 'en') {
      this.canvas = document.getElementById(canvasId);
      this.data = data;
      this.lang = lang;
      this.chart = null;
    }

    render() {
      if (!this.canvas || !this.data || this.data.length === 0) {
        console.warn('InfluenceChart: Invalid canvas or data');
        return;
      }

      // Sort by influence and take top 10
      const sortedData = [...this.data]
        .sort((a, b) => (parseFloat(b.influence) || 0) - (parseFloat(a.influence) || 0))
        .slice(0, 10);

      const labels = sortedData.map(d => d.name || 'Unknown');
      const values = sortedData.map(d => parseFloat(d.influence) || 0);

      const ctx = this.canvas.getContext('2d');
      
      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Influence Score',
            data: values,
            backgroundColor: CONFIG.colors.primary,
            borderColor: CONFIG.colors.accent,
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
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: CONFIG.colors.accent,
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `Influence: ${context.parsed.x.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: {
                color: 'var(--text-color)'
              },
              grid: {
                color: 'var(--border-color)'
              }
            },
            y: {
              ticks: {
                color: 'var(--text-color)',
                font: {
                  size: 12
                }
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    }

    destroy() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }

  /**
   * Ministry Productivity Chart (Chart.js)
   */
  class ProductivityChart {
    constructor(canvasId, data, lang = 'en') {
      this.canvas = document.getElementById(canvasId);
      this.data = data;
      this.lang = lang;
      this.chart = null;
    }

    render() {
      if (!this.canvas || !this.data || this.data.length === 0) {
        console.warn('ProductivityChart: Invalid canvas or data');
        return;
      }

      const ministryTranslations = MINISTRY_TRANSLATIONS[this.lang] || MINISTRY_TRANSLATIONS.en;
      const labels = this.data.map(d => ministryTranslations[d.ministry] || d.ministry);
      const current = this.data.map(d => parseFloat(d.currentQuarter) || 0);
      const previous = this.data.map(d => parseFloat(d.previousQuarter) || 0);

      const ctx = this.canvas.getContext('2d');
      
      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Current Quarter',
              data: current,
              backgroundColor: CONFIG.colors.primary,
              borderColor: CONFIG.colors.primary,
              borderWidth: 1
            },
            {
              label: 'Previous Quarter',
              data: previous,
              backgroundColor: CONFIG.colors.accent,
              borderColor: CONFIG.colors.accent,
              borderWidth: 1
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: 'var(--text-color)',
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: CONFIG.colors.accent,
              borderWidth: 1
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: 'var(--text-color)'
              },
              grid: {
                color: 'var(--border-color)'
              }
            },
            y: {
              ticks: {
                color: 'var(--text-color)',
                font: {
                  size: 12
                }
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    }

    destroy() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }

  /**
   * Decision Impact Timeline (Chart.js)
   */
  class DecisionImpactChart {
    constructor(canvasId, data, lang = 'en') {
      this.canvas = document.getElementById(canvasId);
      this.data = data;
      this.lang = lang;
      this.chart = null;
    }

    render() {
      if (!this.canvas || !this.data || this.data.length === 0) {
        console.warn('DecisionImpactChart: Invalid canvas or data');
        return;
      }

      // Group data by ministry and time period
      const ministries = [...new Set(this.data.map(d => d.ministry))].slice(0, 5); // Top 5 for readability
      const periods = [...new Set(this.data.map(d => d.period))].sort();

      const datasets = ministries.map((ministry, index) => {
        const ministryData = this.data.filter(d => d.ministry === ministry);
        const values = periods.map(period => {
          const item = ministryData.find(d => d.period === period);
          return item ? parseFloat(item.impact) || 0 : 0;
        });

        const colors = [
          '#006633', '#00cc66', '#008838', '#007744', '#004422'
        ];

        return {
          label: MINISTRY_TRANSLATIONS[this.lang][ministry] || ministry,
          data: values,
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length] + '33',
          borderWidth: 2,
          tension: 0.4,
          fill: false
        };
      });

      const ctx = this.canvas.getContext('2d');
      
      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: periods,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: 'var(--text-color)',
                font: {
                  size: 11
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: CONFIG.colors.accent,
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: 'var(--text-color)',
                font: {
                  size: 10
                }
              },
              grid: {
                color: 'var(--border-color)'
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: 'var(--text-color)'
              },
              grid: {
                color: 'var(--border-color)'
              }
            }
          }
        }
      });
    }

    destroy() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }

  /**
   * Accessibility Table Generator
   */
  class AccessibilityTable {
    constructor(tableId, data, lang = 'en') {
      this.table = document.getElementById(tableId);
      this.data = data;
      this.lang = lang;
    }

    render() {
      if (!this.table || !this.data) {
        return;
      }

      const ministryTranslations = MINISTRY_TRANSLATIONS[this.lang] || MINISTRY_TRANSLATIONS.en;

      let html = `
        <caption>Government Ministry Risk and Productivity Data</caption>
        <thead>
          <tr>
            <th scope="col">Ministry</th>
            <th scope="col">Risk Score</th>
            <th scope="col">Risk Level</th>
            <th scope="col">Productivity</th>
          </tr>
        </thead>
        <tbody>
      `;

      this.data.riskLevels.forEach((item, index) => {
        const riskScore = parseFloat(item.riskScore) || 0;
        let riskLevel = 'Low';
        if (riskScore >= 8.0) riskLevel = 'Critical';
        else if (riskScore >= 6.0) riskLevel = 'High';
        else if (riskScore >= 4.0) riskLevel = 'Medium';

        const productivity = this.data.productivity[index];
        const prodValue = productivity ? productivity.currentQuarter : 'N/A';

        html += `
          <tr>
            <td>${ministryTranslations[item.ministry] || item.ministry}</td>
            <td>${item.riskScore}</td>
            <td>${riskLevel}</td>
            <td>${prodValue}</td>
          </tr>
        `;
      });

      html += `
        </tbody>
      `;

      this.table.innerHTML = html;
    }
  }

  /**
   * Main Dashboard Controller
   */
  class MinistryDashboard {
    constructor(lang = 'en') {
      this.lang = lang;
      this.fetcher = new DataFetcher();
      this.data = null;
      this.charts = {};
    }

    async initialize() {
      try {
        // Show loading state
        this.showLoading();

        // Fetch all data
        this.data = await this.fetcher.fetchAllData();

        // Generate mock data if CIA data is not available
        if (!this.data.riskLevels || this.data.riskLevels.length === 0) {
          this.data = this.generateMockData();
        }

        // Hide loading state
        this.hideLoading();

        // Render all visualizations
        this.renderVisualizations();

        // Add attribution
        this.addAttribution();

      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        this.showError();
      }
    }

    showLoading() {
      const container = document.getElementById('ministry-dashboard');
      if (container) {
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'ministry-loading';
        loadingMsg.className = 'loading-message';
        loadingMsg.textContent = UI_TRANSLATIONS[this.lang].loading;
        loadingMsg.setAttribute('role', 'status');
        loadingMsg.setAttribute('aria-live', 'polite');
        container.prepend(loadingMsg);
      }
    }

    hideLoading() {
      const loading = document.getElementById('ministry-loading');
      if (loading) {
        loading.remove();
      }
    }

    showError() {
      const container = document.getElementById('ministry-dashboard');
      if (container) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = UI_TRANSLATIONS[this.lang].error;
        errorMsg.setAttribute('role', 'alert');
        container.innerHTML = '';
        container.appendChild(errorMsg);
      }
    }

    generateMockData() {
      // Generate realistic mock data for demonstration
      const ministries = [
        'Finansdepartementet',
        'Utrikesdepartementet',
        'Försvarsdepartementet',
        'Justitiedepartementet',
        'Socialdepartementet',
        'Utbildningsdepartementet',
        'Näringsdepartementet',
        'Miljödepartementet',
        'Kulturdepartementet',
        'Infrastrukturdepartementet'
      ];

      const ministers = [
        { name: 'Ulf Kristersson', ministry: 'Statsrådsberedningen' },
        { name: 'Elisabeth Svantesson', ministry: 'Finansdepartementet' },
        { name: 'Tobias Billström', ministry: 'Utrikesdepartementet' },
        { name: 'Pål Jonson', ministry: 'Försvarsdepartementet' },
        { name: 'Gunnar Strömmer', ministry: 'Justitiedepartementet' },
        { name: 'Jakob Forssmed', ministry: 'Socialdepartementet' },
        { name: 'Mats Persson', ministry: 'Utbildningsdepartementet' },
        { name: 'Ebba Busch', ministry: 'Näringsdepartementet' },
        { name: 'Romina Pourmokhtari', ministry: 'Miljödepartementet' },
        { name: 'Parisa Liljestrand', ministry: 'Kulturdepartementet' }
      ];

      return {
        riskLevels: ministries.map(ministry => ({
          ministry: ministry,
          riskScore: (Math.random() * 6 + 2).toFixed(2),
          alerts: Math.floor(Math.random() * 15)
        })),
        productivity: ministries.map(ministry => ({
          ministry: ministry,
          currentQuarter: (Math.random() * 50 + 50).toFixed(1),
          previousQuarter: (Math.random() * 50 + 50).toFixed(1)
        })),
        influence: ministers.map(minister => ({
          name: minister.name,
          ministry: minister.ministry,
          influence: (Math.random() * 40 + 60).toFixed(2)
        })),
        decisionImpact: ministries.flatMap(ministry => 
          ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'].map(period => ({
            ministry: ministry,
            period: period,
            impact: (Math.random() * 30 + 60).toFixed(1)
          }))
        )
      };
    }

    renderVisualizations() {
      // Risk Heat Map (D3.js)
      if (window.d3) {
        this.charts.riskHeatMap = new RiskHeatMap('ministryRiskHeatMap', this.data.riskLevels, this.lang);
        this.charts.riskHeatMap.render();
      } else {
        console.warn('D3.js not loaded, skipping heat map');
      }

      // Minister Influence Chart (Chart.js)
      if (window.Chart) {
        this.charts.influenceChart = new InfluenceChart('ministerInfluenceChart', this.data.influence, this.lang);
        this.charts.influenceChart.render();

        // Ministry Productivity Chart
        this.charts.productivityChart = new ProductivityChart('ministryProductivityChart', this.data.productivity, this.lang);
        this.charts.productivityChart.render();

        // Decision Impact Timeline
        this.charts.decisionImpactChart = new DecisionImpactChart('decisionImpactChart', this.data.decisionImpact, this.lang);
        this.charts.decisionImpactChart.render();
      } else {
        console.warn('Chart.js not loaded, skipping charts');
      }

      // Accessibility Table
      this.charts.accessibilityTable = new AccessibilityTable('ministryDataTable', this.data, this.lang);
      this.charts.accessibilityTable.render();
    }

    addAttribution() {
      const container = document.getElementById('ministry-dashboard');
      if (container) {
        const attribution = document.createElement('p');
        attribution.className = 'data-attribution';
        attribution.style.cssText = 'text-align: center; margin-top: 2rem; font-size: 0.875rem; color: var(--text-secondary);';
        attribution.innerHTML = `📊 ${UI_TRANSLATIONS[this.lang].dataAttribution} | <a href="https://www.hack23.com/cia" target="_blank" rel="noopener">www.hack23.com/cia</a>`;
        container.appendChild(attribution);
      }
    }

    destroy() {
      Object.values(this.charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      this.charts = {};
    }
  }

  /**
   * Initialize dashboard on DOM ready
   */
  function initializeDashboard() {
    // Detect language from HTML lang attribute
    const lang = document.documentElement.lang || 'en';
    
    // Check if dashboard container exists
    const container = document.getElementById('ministry-dashboard');
    if (!container) {
      console.log('Ministry dashboard container not found, skipping initialization');
      return;
    }

    // Load external libraries if not already loaded
    const loadLibraries = async () => {
      const promises = [];

      // Load D3.js
      if (!window.d3) {
        promises.push(
          new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://cdnjs.cloudflare.com/ajax/libs/d3/${CONFIG.charts.d3Version}/d3.min.js`;
            script.integrity = 'sha512-qRbKjmS0kCp2YIrRxzm7O7jZRp4aLDOo3lW7kvrLqxNFMd2gWgGGj/4LXd0VdDjYtdW1P0nqZYYGLtDO2RLzQ==';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          })
        );
      }

      // Load Chart.js
      if (!window.Chart) {
        promises.push(
          new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://cdn.jsdelivr.net/npm/chart.js@${CONFIG.charts.chartJsVersion}/dist/chart.umd.min.js`;
            script.integrity = 'sha512-SIMGYRUjwY8+gKg7nn9EItdD8LCADSDfJNutF9TPrvEo86sQmFMh6MyralfIyhADlajSxqc7G0gs7+MwWF5ogA==';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          })
        );
      }

      await Promise.all(promises);
    };

    // Initialize dashboard after libraries are loaded
    loadLibraries()
      .then(() => {
        const dashboard = new MinistryDashboard(lang);
        dashboard.initialize();

        // Store reference for cleanup
        window.ministryDashboard = dashboard;
      })
      .catch(error => {
        console.error('Failed to load visualization libraries:', error);
      });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
  } else {
    initializeDashboard();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.ministryDashboard) {
      window.ministryDashboard.destroy();
    }
  });

})();
