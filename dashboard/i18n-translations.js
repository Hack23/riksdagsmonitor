/**
 * @module Intelligence/Internationalization
 * @category Intelligence Platform - Multi-Language Support
 * 
 * @description
 * ## Dashboard i18n Translation Dictionary
 * 
 * Comprehensive translation system for CIA Intelligence Dashboard supporting 14 languages.
 * Provides language-specific translations for UI text, error messages, data labels, and
 * cultural formatting (dates, numbers) using the Intl API.
 * 
 * ### Supported Languages
 * - **Nordic**: English (en), Swedish (sv), Danish (da), Norwegian (no), Finnish (fi)
 * - **European**: German (de), French (fr), Spanish (es), Dutch (nl)
 * - **Middle Eastern**: Arabic (ar), Hebrew (he)
 * - **East Asian**: Japanese (ja), Korean (ko), Chinese Simplified (zh)
 * 
 * ### Translation Categories
 * - **System Messages**: Loading states, errors, retry actions
 * - **Political Terminology**: Party names, risk levels, roles
 * - **UI Labels**: Section headings, metrics, chart labels
 * - **Cultural Formatting**: Date/time formats, number formats
 * 
 * ### Usage Example
 * ```javascript
 * import { t, formatDate, formatNumber } from './i18n-translations.js';
 * 
 * // Simple translation
 * const loadingText = t('loadingData'); // "Loading CIA intelligence data..."
 * 
 * // Nested translation
 * const partyName = t('parties.M'); // "Moderate Party"
 * 
 * // Cultural formatting
 * const formattedDate = formatDate(new Date(), 'sv'); // "13 februari 2026"
 * const formattedNumber = formatNumber(12345.67, 'de'); // "12.345,67"
 * ```
 * 
 * @author Hack23 AB - Intelligence Platforms
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2026-02-13
 */

export const TRANSLATIONS = {
  en: {
    loadingData: 'Loading CIA intelligence data...',
    noDataAvailable: 'No data available',
    errorLoadingData: 'Error loading data. Please try again.',
    retryButton: 'Retry',
    lastUpdated: 'Last updated',
    parties: {
      M: 'Moderate Party',
      S: 'Social Democrats',
      SD: 'Sweden Democrats',
      C: 'Centre Party',
      V: 'Left Party',
      MP: 'Green Party',
      KD: 'Christian Democrats',
      L: 'Liberals'
    },
    riskLevel: {
      CRITICAL: 'Critical',
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low'
    },
    metrics: {
      seats: 'Seats',
      voteShare: 'Vote Share',
      documents: 'Documents',
      motions: 'Motions',
      attendance: 'Attendance',
      influence: 'Influence'
    }
  },
  sv: {
    loadingData: 'Laddar CIA underrättelsedata...',
    noDataAvailable: 'Ingen data tillgänglig',
    errorLoadingData: 'Fel vid inläsning av data. Försök igen.',
    retryButton: 'Försök igen',
    lastUpdated: 'Senast uppdaterad',
    parties: {
      M: 'Moderaterna',
      S: 'Socialdemokraterna',
      SD: 'Sverigedemokraterna',
      C: 'Centerpartiet',
      V: 'Vänsterpartiet',
      MP: 'Miljöpartiet',
      KD: 'Kristdemokraterna',
      L: 'Liberalerna'
    },
    riskLevel: {
      CRITICAL: 'Kritisk',
      HIGH: 'Hög',
      MEDIUM: 'Medel',
      LOW: 'Låg'
    },
    metrics: {
      seats: 'Mandat',
      voteShare: 'Röstandel',
      documents: 'Dokument',
      motions: 'Motioner',
      attendance: 'Närvaro',
      influence: 'Inflytande'
    }
  },
  da: {
    loadingData: 'Indlæser CIA efterretningsdata...',
    noDataAvailable: 'Ingen tilgængelige data',
    errorLoadingData: 'Fejl ved indlæsning af data. Prøv igen.',
    retryButton: 'Prøv igen',
    lastUpdated: 'Sidst opdateret',
    parties: {
      M: 'Moderate Parti',
      S: 'Socialdemokraterne',
      SD: 'Sverigedemokraterne',
      C: 'Centerpartiet',
      V: 'Venstrefløjen',
      MP: 'Miljøpartiet',
      KD: 'Kristdemokraterne',
      L: 'Liberalerne'
    },
    riskLevel: {
      CRITICAL: 'Kritisk',
      HIGH: 'Høj',
      MEDIUM: 'Middel',
      LOW: 'Lav'
    },
    metrics: {
      seats: 'Pladser',
      voteShare: 'Stemmeandel',
      documents: 'Dokumenter',
      motions: 'Forslag',
      attendance: 'Fremmøde',
      influence: 'Indflydelse'
    }
  },
  no: {
    loadingData: 'Laster CIA etterretningsdata...',
    noDataAvailable: 'Ingen tilgjengelige data',
    errorLoadingData: 'Feil ved lasting av data. Prøv igjen.',
    retryButton: 'Prøv igjen',
    lastUpdated: 'Sist oppdatert',
    parties: {
      M: 'Moderate Parti',
      S: 'Sosialdemokratene',
      SD: 'Sverigedemokratene',
      C: 'Senterpartiet',
      V: 'Venstrepartiet',
      MP: 'Miljøpartiet',
      KD: 'Kristdemokratene',
      L: 'Liberalene'
    },
    riskLevel: {
      CRITICAL: 'Kritisk',
      HIGH: 'Høy',
      MEDIUM: 'Middels',
      LOW: 'Lav'
    },
    metrics: {
      seats: 'Seter',
      voteShare: 'Stemmeandel',
      documents: 'Dokumenter',
      motions: 'Forslag',
      attendance: 'Oppmøte',
      influence: 'Innflytelse'
    }
  },
  fi: {
    loadingData: 'Ladataan CIA-tiedustelutietoja...',
    noDataAvailable: 'Ei saatavilla olevia tietoja',
    errorLoadingData: 'Virhe tietojen latauksessa. Yritä uudelleen.',
    retryButton: 'Yritä uudelleen',
    lastUpdated: 'Viimeksi päivitetty',
    parties: {
      M: 'Maltillinen puolue',
      S: 'Sosiaalidemokraatit',
      SD: 'Ruotsidemokraatit',
      C: 'Keskustapuolue',
      V: 'Vasemmistopuolue',
      MP: 'Vihreä puolue',
      KD: 'Kristillisdemokraatit',
      L: 'Liberaalit'
    },
    riskLevel: {
      CRITICAL: 'Kriittinen',
      HIGH: 'Korkea',
      MEDIUM: 'Keskitaso',
      LOW: 'Matala'
    },
    metrics: {
      seats: 'Paikat',
      voteShare: 'Ääniosuus',
      documents: 'Asiakirjat',
      motions: 'Aloitteet',
      attendance: 'Läsnäolo',
      influence: 'Vaikutusvalta'
    }
  },
  de: {
    loadingData: 'CIA-Geheimdienstdaten werden geladen...',
    noDataAvailable: 'Keine Daten verfügbar',
    errorLoadingData: 'Fehler beim Laden der Daten. Bitte versuchen Sie es erneut.',
    retryButton: 'Erneut versuchen',
    lastUpdated: 'Zuletzt aktualisiert',
    parties: {
      M: 'Moderate Partei',
      S: 'Sozialdemokraten',
      SD: 'Schwedendemokraten',
      C: 'Zentrumspartei',
      V: 'Linkspartei',
      MP: 'Grüne Partei',
      KD: 'Christdemokraten',
      L: 'Liberale'
    },
    riskLevel: {
      CRITICAL: 'Kritisch',
      HIGH: 'Hoch',
      MEDIUM: 'Mittel',
      LOW: 'Niedrig'
    },
    metrics: {
      seats: 'Sitze',
      voteShare: 'Stimmenanteil',
      documents: 'Dokumente',
      motions: 'Anträge',
      attendance: 'Anwesenheit',
      influence: 'Einfluss'
    }
  },
  fr: {
    loadingData: 'Chargement des données de renseignement CIA...',
    noDataAvailable: 'Aucune donnée disponible',
    errorLoadingData: 'Erreur lors du chargement des données. Veuillez réessayer.',
    retryButton: 'Réessayer',
    lastUpdated: 'Dernière mise à jour',
    parties: {
      M: 'Parti modéré',
      S: 'Sociaux-démocrates',
      SD: 'Démocrates de Suède',
      C: 'Parti du centre',
      V: 'Parti de gauche',
      MP: 'Parti vert',
      KD: 'Chrétiens-démocrates',
      L: 'Libéraux'
    },
    riskLevel: {
      CRITICAL: 'Critique',
      HIGH: 'Élevé',
      MEDIUM: 'Moyen',
      LOW: 'Faible'
    },
    metrics: {
      seats: 'Sièges',
      voteShare: 'Part des voix',
      documents: 'Documents',
      motions: 'Motions',
      attendance: 'Présence',
      influence: 'Influence'
    }
  },
  es: {
    loadingData: 'Cargando datos de inteligencia CIA...',
    noDataAvailable: 'No hay datos disponibles',
    errorLoadingData: 'Error al cargar datos. Por favor, inténtelo de nuevo.',
    retryButton: 'Reintentar',
    lastUpdated: 'Última actualización',
    parties: {
      M: 'Partido Moderado',
      S: 'Socialdemócratas',
      SD: 'Demócratas de Suecia',
      C: 'Partido de Centro',
      V: 'Partido de Izquierda',
      MP: 'Partido Verde',
      KD: 'Cristianodemócratas',
      L: 'Liberales'
    },
    riskLevel: {
      CRITICAL: 'Crítico',
      HIGH: 'Alto',
      MEDIUM: 'Medio',
      LOW: 'Bajo'
    },
    metrics: {
      seats: 'Escaños',
      voteShare: 'Porcentaje de votos',
      documents: 'Documentos',
      motions: 'Mociones',
      attendance: 'Asistencia',
      influence: 'Influencia'
    }
  },
  nl: {
    loadingData: 'CIA inlichtingengegevens laden...',
    noDataAvailable: 'Geen gegevens beschikbaar',
    errorLoadingData: 'Fout bij het laden van gegevens. Probeer het opnieuw.',
    retryButton: 'Opnieuw proberen',
    lastUpdated: 'Laatst bijgewerkt',
    parties: {
      M: 'Gematigde Partij',
      S: 'Sociaaldemocraten',
      SD: 'Zweden Democraten',
      C: 'Centrumpartij',
      V: 'Linkse Partij',
      MP: 'Groene Partij',
      KD: 'Christendemocraten',
      L: 'Liberalen'
    },
    riskLevel: {
      CRITICAL: 'Kritiek',
      HIGH: 'Hoog',
      MEDIUM: 'Gemiddeld',
      LOW: 'Laag'
    },
    metrics: {
      seats: 'Zetels',
      voteShare: 'Stemmenpercentage',
      documents: 'Documenten',
      motions: 'Moties',
      attendance: 'Aanwezigheid',
      influence: 'Invloed'
    }
  },
  ar: {
    loadingData: 'جاري تحميل بيانات استخبارات CIA...',
    noDataAvailable: 'لا توجد بيانات متاحة',
    errorLoadingData: 'خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.',
    retryButton: 'إعادة المحاولة',
    lastUpdated: 'آخر تحديث',
    parties: {
      M: 'الحزب المعتدل',
      S: 'الاشتراكيون الديمقراطيون',
      SD: 'ديمقراطيو السويد',
      C: 'حزب الوسط',
      V: 'حزب اليسار',
      MP: 'الحزب الأخضر',
      KD: 'الديمقراطيون المسيحيون',
      L: 'الليبراليون'
    },
    riskLevel: {
      CRITICAL: 'حرج',
      HIGH: 'عالي',
      MEDIUM: 'متوسط',
      LOW: 'منخفض'
    },
    metrics: {
      seats: 'المقاعد',
      voteShare: 'حصة الأصوات',
      documents: 'الوثائق',
      motions: 'الاقتراحات',
      attendance: 'الحضور',
      influence: 'النفوذ'
    }
  },
  he: {
    loadingData: 'טוען נתוני מודיעין CIA...',
    noDataAvailable: 'אין נתונים זמינים',
    errorLoadingData: 'שגיאה בטעינת נתונים. אנא נסה שנית.',
    retryButton: 'נסה שוב',
    lastUpdated: 'עודכן לאחרונה',
    parties: {
      M: 'המפלגה המתונה',
      S: 'הסוציאל-דמוקרטים',
      SD: 'דמוקרטי שבדיה',
      C: 'מפלגת המרכז',
      V: 'מפלגת השמאל',
      MP: 'המפלגה הירוקה',
      KD: 'הנוצרים-דמוקרטים',
      L: 'הליברלים'
    },
    riskLevel: {
      CRITICAL: 'קריטי',
      HIGH: 'גבוה',
      MEDIUM: 'בינוני',
      LOW: 'נמוך'
    },
    metrics: {
      seats: 'מושבים',
      voteShare: 'אחוז קולות',
      documents: 'מסמכים',
      motions: 'הצעות',
      attendance: 'נוכחות',
      influence: 'השפעה'
    }
  },
  ja: {
    loadingData: 'CIA情報データを読み込んでいます...',
    noDataAvailable: '利用可能なデータがありません',
    errorLoadingData: 'データの読み込みエラーです。もう一度お試しください。',
    retryButton: '再試行',
    lastUpdated: '最終更新',
    parties: {
      M: '穏健党',
      S: '社会民主党',
      SD: 'スウェーデン民主党',
      C: '中央党',
      V: '左翼党',
      MP: '緑の党',
      KD: 'キリスト教民主党',
      L: '自由党'
    },
    riskLevel: {
      CRITICAL: '重大',
      HIGH: '高',
      MEDIUM: '中',
      LOW: '低'
    },
    metrics: {
      seats: '議席',
      voteShare: '得票率',
      documents: '文書',
      motions: '動議',
      attendance: '出席',
      influence: '影響力'
    }
  },
  ko: {
    loadingData: 'CIA 정보 데이터를 불러오는 중...',
    noDataAvailable: '사용 가능한 데이터가 없습니다',
    errorLoadingData: '데이터 로드 중 오류가 발생했습니다. 다시 시도해 주세요.',
    retryButton: '다시 시도',
    lastUpdated: '마지막 업데이트',
    parties: {
      M: '온건당',
      S: '사회민주당',
      SD: '스웨덴민주당',
      C: '중앙당',
      V: '좌파당',
      MP: '녹색당',
      KD: '기독교민주당',
      L: '자유당'
    },
    riskLevel: {
      CRITICAL: '심각',
      HIGH: '높음',
      MEDIUM: '보통',
      LOW: '낮음'
    },
    metrics: {
      seats: '의석',
      voteShare: '득표율',
      documents: '문서',
      motions: '동의',
      attendance: '출석',
      influence: '영향력'
    }
  },
  zh: {
    loadingData: '正在加载CIA情报数据...',
    noDataAvailable: '无可用数据',
    errorLoadingData: '加载数据时出错。请重试。',
    retryButton: '重试',
    lastUpdated: '最后更新',
    parties: {
      M: '温和党',
      S: '社会民主党',
      SD: '瑞典民主党',
      C: '中央党',
      V: '左翼党',
      MP: '绿党',
      KD: '基督教民主党',
      L: '自由党'
    },
    riskLevel: {
      CRITICAL: '严重',
      HIGH: '高',
      MEDIUM: '中',
      LOW: '低'
    },
    metrics: {
      seats: '席位',
      voteShare: '得票份额',
      documents: '文件',
      motions: '动议',
      attendance: '出席',
      influence: '影响力'
    }
  }
};

/**
 * Detect current page language from document.documentElement.lang
 * @returns {string} Language code (en, sv, da, etc.)
 */
export function detectLanguage() {
  const htmlLang = document.documentElement.lang;
  return htmlLang && TRANSLATIONS[htmlLang] ? htmlLang : 'en';
}

/**
 * Get translation for a key
 * @param {string} key - Translation key (supports dot notation like 'parties.M')
 * @param {string} [lang] - Language code (defaults to auto-detected)
 * @returns {string} Translated text
 */
export function t(key, lang = detectLanguage()) {
  const keys = key.split('.');
  let value = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation missing: ${key} for language ${lang}`);
      return key; // Return key as fallback
    }
  }
  
  return value;
}

/**
 * Locale mappings for Intl API
 */
const LOCALE_MAP = {
  en: 'en-US',
  sv: 'sv-SE',
  da: 'da-DK',
  no: 'nb-NO',
  fi: 'fi-FI',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  nl: 'nl-NL',
  ar: 'ar-SA',
  he: 'he-IL',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN'
};

/**
 * Format date with cultural awareness
 * @param {Date|string} date - Date to format
 * @param {string} [lang] - Language code
 * @returns {string} Formatted date
 */
export function formatDate(date, lang = detectLanguage()) {
  const locale = LOCALE_MAP[lang] || 'en-US';
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format number with cultural awareness
 * @param {number} num - Number to format
 * @param {string} [lang] - Language code
 * @param {Object} [options] - Intl.NumberFormat options
 * @returns {string} Formatted number
 */
export function formatNumber(num, lang = detectLanguage(), options = {}) {
  const locale = LOCALE_MAP[lang] || 'en-US';
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format percentage with cultural awareness
 * @param {number} num - Number to format as percentage (0-1 range, e.g., 0.5 for 50%)
 * @param {string} [lang] - Language code
 * @returns {string} Formatted percentage
 */
export function formatPercentage(num, lang = detectLanguage()) {
  return formatNumber(num, lang, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

/**
 * Format currency (SEK) with cultural awareness
 * @param {number} amount - Amount to format
 * @param {string} [lang] - Language code
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount, lang = detectLanguage()) {
  const locale = LOCALE_MAP[lang] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SEK'
  }).format(amount);
}
