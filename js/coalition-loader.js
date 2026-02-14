/**
 * Coalition Status Data Loader
 * 
 * Loads dynamic coalition data from CIA platform CSV exports:
 * - view_riksdagen_party_summary_sample.csv: Party statistics (members, assignments)
 * - view_riksdagen_party_role_member_sample.csv: Party leadership roles
 * 
 * Data Source: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data
 * Update Frequency: Weekly (7-day freshness threshold)
 * Coverage: Active Swedish political parties (8 parties)
 * 
 * Integration Pattern: Follows party-dashboard.js localStorage caching strategy
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    githubRawBase: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data',
    dataSources: {
      partySummary: 'view_riksdagen_party_summary_sample.csv',
      partyRoles: 'view_riksdagen_party_role_member_sample.csv'
    },
    freshnessThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    cachePrefix: 'coalition_data_',
    retryDelay: 2000,
    maxRetries: 3
  };

  // Party metadata with official names and colors
  const PARTY_INFO = {
    'S': { name: 'Social Democrats', nameShort: 'S', color: '#E8112d', fullName: 'Socialdemokraterna' },
    'M': { name: 'Moderates', nameShort: 'M', color: '#52BDEC', fullName: 'Moderaterna' },
    'SD': { name: 'Sweden Democrats', nameShort: 'SD', color: '#DDDD00', fullName: 'Sverigedemokraterna' },
    'C': { name: 'Centre Party', nameShort: 'C', color: '#009933', fullName: 'Centerpartiet' },
    'V': { name: 'Left Party', nameShort: 'V', color: '#DA291C', fullName: 'Vänsterpartiet' },
    'KD': { name: 'Christian Democrats', nameShort: 'KD', color: '#000077', fullName: 'Kristdemokraterna' },
    'L': { name: 'Liberals', nameShort: 'L', color: '#006AB3', fullName: 'Liberalerna' },
    'MP': { name: 'Green Party', nameShort: 'MP', color: '#83CF39', fullName: 'Miljöpartiet' }
  };

  // Multi-language translations
  const TRANSLATIONS = {
    en: {
      coalitionTitle: 'Current Coalition: Tidö Agreement',
      coalitionStatus: 'Formation: October 2022 | Status: Active',
      parliamentSeats: 'Parliament seats',
      governmentMembers: 'Government members',
      partyAssignments: 'Party assignments',
      leader: 'Leader',
      groupLeader: 'Group Leader',
      loadingMessage: 'Loading coalition data...',
      errorMessage: 'Unable to load coalition data',
      dataAttribution: 'Data from CIA Platform',
      lastUpdated: 'Last Updated'
    },
    sv: {
      coalitionTitle: 'Nuvarande koalition: Tidöavtalet',
      coalitionStatus: 'Bildande: oktober 2022 | Status: Aktiv',
      parliamentSeats: 'Riksdagsmandat',
      governmentMembers: 'Regeringsmedlemmar',
      partyAssignments: 'Partiuppdrag',
      leader: 'Partiledare',
      groupLeader: 'Gruppledare',
      loadingMessage: 'Laddar koalitionsdata...',
      errorMessage: 'Kunde inte ladda koalitionsdata',
      dataAttribution: 'Data från CIA-plattformen',
      lastUpdated: 'Senast uppdaterad'
    },
    da: {
      coalitionTitle: 'Nuværende koalition: Tidö-aftalen',
      coalitionStatus: 'Dannelse: oktober 2022 | Status: Aktiv',
      parliamentSeats: 'Rigsdagsmandater',
      governmentMembers: 'Regeringsmedlemmer',
      partyAssignments: 'Partiopgaver',
      leader: 'Leder',
      groupLeader: 'Gruppeleder',
      loadingMessage: 'Indlæser koalitionsdata...',
      errorMessage: 'Kunne ikke indlæse koalitionsdata',
      dataAttribution: 'Data fra CIA-platformen',
      lastUpdated: 'Senest opdateret'
    },
    no: {
      coalitionTitle: 'Nåværende koalisjon: Tidö-avtalen',
      coalitionStatus: 'Dannelse: oktober 2022 | Status: Aktiv',
      parliamentSeats: 'Stortingsmandater',
      governmentMembers: 'Regjeringsmedlemmer',
      partyAssignments: 'Partioppgaver',
      leader: 'Leder',
      groupLeader: 'Gruppeleder',
      loadingMessage: 'Laster koalisjonsdata...',
      errorMessage: 'Kunne ikke laste koalisjonsdata',
      dataAttribution: 'Data fra CIA-plattformen',
      lastUpdated: 'Sist oppdatert'
    },
    de: {
      coalitionTitle: 'Aktuelle Koalition: Tidö-Vereinbarung',
      coalitionStatus: 'Bildung: Oktober 2022 | Status: Aktiv',
      parliamentSeats: 'Parlamentssitze',
      governmentMembers: 'Regierungsmitglieder',
      partyAssignments: 'Parteiaufgaben',
      leader: 'Vorsitzender',
      groupLeader: 'Fraktionsvorsitzender',
      loadingMessage: 'Koalitionsdaten werden geladen...',
      errorMessage: 'Koalitionsdaten konnten nicht geladen werden',
      dataAttribution: 'Daten von der CIA-Plattform',
      lastUpdated: 'Zuletzt aktualisiert'
    },
    fr: {
      coalitionTitle: 'Coalition actuelle : Accord de Tidö',
      coalitionStatus: 'Formation : octobre 2022 | Statut : Actif',
      parliamentSeats: 'Sièges parlementaires',
      governmentMembers: 'Membres du gouvernement',
      partyAssignments: 'Affectations de parti',
      leader: 'Chef',
      groupLeader: 'Chef de groupe',
      loadingMessage: 'Chargement des données de coalition...',
      errorMessage: 'Impossible de charger les données de coalition',
      dataAttribution: 'Données de la plateforme CIA',
      lastUpdated: 'Dernière mise à jour'
    },
    es: {
      coalitionTitle: 'Coalición actual: Acuerdo de Tidö',
      coalitionStatus: 'Formación: octubre 2022 | Estado: Activo',
      parliamentSeats: 'Escaños parlamentarios',
      governmentMembers: 'Miembros del gobierno',
      partyAssignments: 'Asignaciones de partido',
      leader: 'Líder',
      groupLeader: 'Líder del grupo',
      loadingMessage: 'Cargando datos de coalición...',
      errorMessage: 'No se pudieron cargar los datos de coalición',
      dataAttribution: 'Datos de la plataforma CIA',
      lastUpdated: 'Última actualización'
    },
    fi: {
      coalitionTitle: 'Nykyinen koalitio: Tidö-sopimus',
      coalitionStatus: 'Muodostus: lokakuu 2022 | Tila: Aktiivinen',
      parliamentSeats: 'Eduskuntapaikkoja',
      governmentMembers: 'Hallituksen jäseniä',
      partyAssignments: 'Puoluetehtävät',
      leader: 'Johtaja',
      groupLeader: 'Ryhmänjohtaja',
      loadingMessage: 'Ladataan koalitiotietoja...',
      errorMessage: 'Koalitiotietoja ei voitu ladata',
      dataAttribution: 'Tiedot CIA-alustalta',
      lastUpdated: 'Viimeksi päivitetty'
    },
    nl: {
      coalitionTitle: 'Huidige coalitie: Tidö-akkoord',
      coalitionStatus: 'Vorming: oktober 2022 | Status: Actief',
      parliamentSeats: 'Parlementszetels',
      governmentMembers: 'Regeringsleden',
      partyAssignments: 'Partijfuncties',
      leader: 'Leider',
      groupLeader: 'Fractievoorzitter',
      loadingMessage: 'Coalitiegegevens laden...',
      errorMessage: 'Kan coalitiegegevens niet laden',
      dataAttribution: 'Gegevens van het CIA-platform',
      lastUpdated: 'Laatst bijgewerkt'
    },
    ar: {
      coalitionTitle: 'الائتلاف الحالي: اتفاقية تيدو',
      coalitionStatus: 'التشكيل: أكتوبر 2022 | الحالة: نشط',
      parliamentSeats: 'مقاعد البرلمان',
      governmentMembers: 'أعضاء الحكومة',
      partyAssignments: 'مهام الحزب',
      leader: 'القائد',
      groupLeader: 'قائد المجموعة',
      loadingMessage: 'جاري تحميل بيانات الائتلاف...',
      errorMessage: 'تعذر تحميل بيانات الائتلاف',
      dataAttribution: 'البيانات من منصة CIA',
      lastUpdated: 'آخر تحديث'
    },
    he: {
      coalitionTitle: 'קואליציה נוכחית: הסכם טידו',
      coalitionStatus: 'הקמה: אוקטובר 2022 | סטטוס: פעיל',
      parliamentSeats: 'מושבי פרלמנט',
      governmentMembers: 'חברי ממשלה',
      partyAssignments: 'משימות מפלגה',
      leader: 'מנהיג',
      groupLeader: 'מנהיג הקבוצה',
      loadingMessage: 'טוען נתוני קואליציה...',
      errorMessage: 'לא ניתן לטעון נתוני קואליציה',
      dataAttribution: 'נתונים מפלטפורמת CIA',
      lastUpdated: 'עודכן לאחרונה'
    },
    ja: {
      coalitionTitle: '現在の連立：ティドー協定',
      coalitionStatus: '形成：2022年10月 | ステータス：アクティブ',
      parliamentSeats: '国会議席',
      governmentMembers: '政府メンバー',
      partyAssignments: '党の任務',
      leader: 'リーダー',
      groupLeader: 'グループリーダー',
      loadingMessage: '連立データを読み込んでいます...',
      errorMessage: '連立データを読み込めませんでした',
      dataAttribution: 'CIAプラットフォームのデータ',
      lastUpdated: '最終更新'
    },
    ko: {
      coalitionTitle: '현재 연립: 티도 협정',
      coalitionStatus: '구성: 2022년 10월 | 상태: 활성',
      parliamentSeats: '의회 의석',
      governmentMembers: '정부 구성원',
      partyAssignments: '당 임무',
      leader: '리더',
      groupLeader: '그룹 리더',
      loadingMessage: '연립 데이터 로드 중...',
      errorMessage: '연립 데이터를 로드할 수 없습니다',
      dataAttribution: 'CIA 플랫폼의 데이터',
      lastUpdated: '마지막 업데이트'
    },
    zh: {
      coalitionTitle: '当前联盟：蒂德协议',
      coalitionStatus: '成立：2022年10月 | 状态：活跃',
      parliamentSeats: '议会席位',
      governmentMembers: '政府成员',
      partyAssignments: '党派任务',
      leader: '领导',
      groupLeader: '团队领导',
      loadingMessage: '正在加载联盟数据...',
      errorMessage: '无法加载联盟数据',
      dataAttribution: '来自CIA平台的数据',
      lastUpdated: '最后更新'
    }
  };

  // Detect current language from HTML lang attribute
  function getCurrentLanguage() {
    const htmlLang = document.documentElement.lang || 'en';
    return htmlLang.substring(0, 2); // Get first 2 chars (en, sv, etc.)
  }

  // Get translations for current language with fallback to English
  function getTranslations() {
    const lang = getCurrentLanguage();
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
  }

  /**
   * Parse CSV string into array of objects
   * @param {string} csvText - CSV content
   * @returns {Array<Object>} Parsed data
   */
  function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== headers.length) continue;

      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx].trim();
      });
      data.push(row);
    }

    return data;
  }

  /**
   * Check if cached data is fresh
   * @param {string} key - Cache key
   * @returns {boolean} True if data is fresh
   */
  function isCacheFresh(key) {
    try {
      const cached = localStorage.getItem(CONFIG.cachePrefix + key);
      if (!cached) return false;

      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      return age < CONFIG.freshnessThreshold;
    } catch (e) {
      console.error('Cache check error:', e);
      return false;
    }
  }

  /**
   * Get cached data if fresh
   * @param {string} key - Cache key
   * @returns {*} Cached data or null
   */
  function getCachedData(key) {
    try {
      if (!isCacheFresh(key)) return null;
      const cached = localStorage.getItem(CONFIG.cachePrefix + key);
      return cached ? JSON.parse(cached).data : null;
    } catch (e) {
      console.error('Cache retrieval error:', e);
      return null;
    }
  }

  /**
   * Cache data with timestamp
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  function setCachedData(key, data) {
    try {
      const cacheObject = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(CONFIG.cachePrefix + key, JSON.stringify(cacheObject));
    } catch (e) {
      console.error('Cache storage error:', e);
    }
  }

  /**
   * Fetch CSV data from GitHub with retry logic
   * @param {string} filename - CSV filename
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<string>} CSV content
   */
  async function fetchCSV(filename, retryCount = 0) {
    const url = `${CONFIG.githubRawBase}/${filename}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Fetch error for ${filename} (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        return fetchCSV(filename, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Load party summary data (cached)
   * @returns {Promise<Array>} Party summary data
   */
  async function loadPartySummary() {
    const cacheKey = 'party_summary';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('Using cached party summary data');
      return cached;
    }

    console.log('Fetching party summary from GitHub...');
    const csvText = await fetchCSV(CONFIG.dataSources.partySummary);
    const data = parseCSV(csvText);
    
    // Filter for active parties only
    const activeParties = data.filter(row => row.active === 't');
    
    setCachedData(cacheKey, activeParties);
    return activeParties;
  }

  /**
   * Load party role/leader data (cached)
   * @returns {Promise<Array>} Party role data
   */
  async function loadPartyRoles() {
    const cacheKey = 'party_roles';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('Using cached party roles data');
      return cached;
    }

    console.log('Fetching party roles from GitHub...');
    const csvText = await fetchCSV(CONFIG.dataSources.partyRoles);
    const data = parseCSV(csvText);
    
    // Filter for active party leaders and group leaders
    const leaders = data.filter(row => 
      row.active === 't' && 
      (row.role_code === 'Partiledare' || row.role_code === 'Gruppledare')
    );
    
    setCachedData(cacheKey, leaders);
    return leaders;
  }

  /**
   * Get party leader name from role data
   * @param {Array} roleData - Party role data
   * @param {string} partyCode - Party code (e.g., 'M', 'SD')
   * @returns {Object} Leader info { name, role }
   */
  function getPartyLeader(roleData, partyCode) {
    // Prioritize Partiledare (Party Leader) over Gruppledare (Group Leader)
    const partyLeader = roleData.find(row => 
      row.party === partyCode && row.role_code === 'Partiledare'
    );
    
    if (partyLeader) {
      return {
        name: `${partyLeader.first_name} ${partyLeader.last_name}`,
        role: 'Party Leader'
      };
    }

    const groupLeader = roleData.find(row => 
      row.party === partyCode && row.role_code === 'Gruppledare'
    );
    
    if (groupLeader) {
      return {
        name: `${groupLeader.first_name} ${groupLeader.last_name}`,
        role: 'Group Leader'
      };
    }

    return { name: 'Unknown', role: '' };
  }

  /**
   * Render coalition cards
   * @param {Array} partySummary - Party summary data
   * @param {Array} partyRoles - Party role data
   */
  function renderCoalition(partySummary, partyRoles) {
    const container = document.getElementById('coalition-status');
    if (!container) {
      console.error('Coalition status container not found');
      return;
    }

    const t = getTranslations();
    const cardsContainer = container.querySelector('.cards');
    if (!cardsContainer) {
      console.error('Cards container not found');
      return;
    }

    // Clear existing cards
    cardsContainer.innerHTML = '';

    // Sort parties by parliament seats (descending)
    const sortedParties = [...partySummary].sort((a, b) => {
      const seatsA = parseInt(a.total_active_parliament) || 0;
      const seatsB = parseInt(b.total_active_parliament) || 0;
      return seatsB - seatsA;
    });

    // Calculate total seats
    const totalSeats = sortedParties.reduce((sum, party) => {
      return sum + (parseInt(party.total_active_parliament) || 0);
    }, 0);

    // Render each party card
    sortedParties.forEach(party => {
      const partyCode = party.party;
      const partyInfo = PARTY_INFO[partyCode];
      if (!partyInfo) return; // Skip unknown parties

      const parliamentSeats = parseInt(party.total_active_parliament) || 0;
      const governmentMembers = parseInt(party.total_active_government) || 0;
      const partyAssignments = parseInt(party.current_party_assignments) || 0;
      
      const leader = getPartyLeader(partyRoles, partyCode);

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="scanner-effect"></div>
        <h3>${partyInfo.name} (${partyCode})</h3>
        <div class="party-stats">
          <p><strong>${parliamentSeats} ${t.parliamentSeats}</strong></p>
          ${governmentMembers > 0 ? `<p>${governmentMembers} ${t.governmentMembers}</p>` : ''}
          <p>${partyAssignments} ${t.partyAssignments}</p>
        </div>
        <p class="party-leader">${t.leader}: ${leader.name}</p>
      `;

      cardsContainer.appendChild(card);
    });

    // Update coalition status text
    const statusP = container.querySelector('p');
    if (statusP) {
      statusP.textContent = `${t.coalitionStatus} | Total Seats: ${totalSeats} of 349`;
    }

    console.log(`Rendered ${sortedParties.length} active parties`);
  }

  /**
   * Show loading state
   */
  function showLoading() {
    const container = document.getElementById('coalition-status');
    if (!container) return;

    const cardsContainer = container.querySelector('.cards');
    if (cardsContainer) {
      const t = getTranslations();
      cardsContainer.innerHTML = `<p class="loading-message">${t.loadingMessage}</p>`;
    }
  }

  /**
   * Show error state
   * @param {Error} error - Error object
   */
  function showError(error) {
    const container = document.getElementById('coalition-status');
    if (!container) return;

    const cardsContainer = container.querySelector('.cards');
    if (cardsContainer) {
      const t = getTranslations();
      cardsContainer.innerHTML = `
        <p class="error-message">
          ${t.errorMessage}: ${error.message}
        </p>
      `;
    }
    console.error('Coalition loader error:', error);
  }

  /**
   * Initialize coalition loader
   */
  async function init() {
    try {
      showLoading();

      // Load data from CSV files
      const [partySummary, partyRoles] = await Promise.all([
        loadPartySummary(),
        loadPartyRoles()
      ]);

      console.log('Loaded data:', {
        parties: partySummary.length,
        leaders: partyRoles.length
      });

      // Render coalition cards
      renderCoalition(partySummary, partyRoles);

    } catch (error) {
      showError(error);
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual refresh if needed
  window.CoalitionLoader = {
    refresh: init,
    clearCache: function() {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CONFIG.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('Coalition cache cleared');
    }
  };

})();
