/**
 * @module generate-news-indexes/constants
 * @description Localisation configuration for 14 supported languages.
 * Contains language configs, flags, and availability translations.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { LanguageCode, LanguageConfig } from './types.js';

/**
 * Full language configuration for all 14 supported languages.
 * Each entry contains translations for titles, subtitles, filters,
 * breadcrumbs, SEO keywords, and Schema.org descriptions.
 */
export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: {
    name: 'English', code: 'en', locale: 'en_US',
    title: 'News',
    subtitle: 'Latest news and analysis from Sweden\'s Riksdag. The Economist-style political journalism covering parliament, government, and agencies with systematic transparency.',
    keywords: 'riksdag news, swedish parliament, government bills, committee reports, propositions, motions, parliamentary votes, political analysis, Sweden Democrats, Social Democrats, Moderaterna, coalition politics, transparency, democracy',
    breadcrumbs: { home: 'Home', news: 'News' },
    backLink: 'Back to Main',
    filters: {
      type: 'Type:', allTypes: 'All types', prospective: 'Prospective', retrospective: 'Retrospective', analysis: 'Analysis', breaking: 'Breaking news',
      topic: 'Topic:', allTopics: 'All Topics', parliament: 'Parliament', government: 'Government', defense: 'Defense', environment: 'Environment', committees: 'Committees', legislation: 'Legislation',
      sort: 'Sort:', newest: 'Newest First', oldest: 'Oldest First', titleSort: 'Title'
    },
    noResults: 'No articles matched the filters',
    i18n: { noArticles: 'No articles available', search: 'Search:', searchPlaceholder: 'Search articles...', loadMore: 'Load more articles', showing: '(shown, total) => \'Showing \' + shown + \' of \' + total + \' articles\'' },
    schemaDescription: 'Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency'
  },
  sv: {
    name: 'Svenska', code: 'sv', locale: 'sv_SE',
    title: 'Nyheter',
    subtitle: 'Senaste nyheterna och analyser från Sveriges Riksdag. Politisk journalistik i The Economist-stil som täcker riksdag, regering och myndigheter med systematisk transparens.',
    keywords: 'riksdag nyheter, svenska riksdagen, propositioner, betänkanden, motioner, utskott, voteringar, politisk analys, Socialdemokraterna, Moderaterna, Sverigedemokraterna, koalitionspolitik, öppenhet, demokrati',
    breadcrumbs: { home: 'Hem', news: 'Nyheter' },
    backLink: 'Tillbaka till huvudsidan',
    filters: {
      type: 'Typ:', allTypes: 'Alla typer', prospective: 'Framåtblickande', retrospective: 'Återblickande', analysis: 'Analys', breaking: 'Senaste nytt',
      topic: 'Ämne:', allTopics: 'Alla ämnen', parliament: 'Riksdagen', government: 'Regeringen', defense: 'Försvar', environment: 'Miljö', committees: 'Utskott', legislation: 'Lagstiftning',
      sort: 'Sortera:', newest: 'Nyast först', oldest: 'Äldst först', titleSort: 'Titel'
    },
    noResults: 'Inga artiklar matchade filtren',
    i18n: { noArticles: 'Inga artiklar tillgängliga', search: 'Sök:', searchPlaceholder: 'Sök artiklar...', loadMore: 'Ladda fler artiklar', showing: '(shown, total) => \'Visar \' + shown + \' av \' + total + \' artiklar\'' },
    schemaDescription: 'Svensk riksdagsbevakning - Övervaka politisk aktivitet med systematisk transparens'
  },
  da: {
    name: 'Dansk', code: 'da', locale: 'da_DK',
    title: 'Nyheder',
    subtitle: 'Seneste nyheder og analyser fra Sveriges Rigsdag. Politisk journalistik i The Economist-stil.',
    keywords: 'riksdag nyheder, svensk parlament, regeringsforslag, udvalgsbetænkninger, afstemninger, politisk analyse, svenske partier, gennemsigtighed, demokrati',
    breadcrumbs: { home: 'Hjem', news: 'Nyheder' },
    backLink: 'Tilbage til hovedsiden',
    filters: {
      type: 'Type:', allTypes: 'Alle typer', prospective: 'Fremadrettet', retrospective: 'Tilbageblik', analysis: 'Analyse', breaking: 'Seneste nyt',
      topic: 'Emne:', allTopics: 'Alle emner', parliament: 'Parlamentet', government: 'Regeringen', defense: 'Forsvar', environment: 'Miljø', committees: 'Udvalg', legislation: 'Lovgivning',
      sort: 'Sorter:', newest: 'Nyeste først', oldest: 'Ældste først', titleSort: 'Titel'
    },
    noResults: 'Ingen artikler matchede filtrene',
    i18n: { noArticles: 'Ingen artikler tilgængelige', search: 'Søg:', searchPlaceholder: 'Søg artikler...', loadMore: 'Indlæs flere artikler', showing: '(shown, total) => \'Viser \' + shown + \' af \' + total + \' artikler\'' },
    schemaDescription: 'Svensk parlamentsovervågning - Overvåg politisk aktivitet med systematisk gennemsigtighed'
  },
  no: {
    name: 'Norsk', code: 'no', locale: 'no_NO',
    title: 'Nyheter',
    subtitle: 'Siste nyheter og analyser fra Sveriges Riksdag. Politisk journalistikk i The Economist-stil.',
    keywords: 'riksdag nyheter, svensk parlament, regjeringsforslag, komitéinnstillinger, voteringer, politisk analyse, svenske partier, åpenhet, demokrati',
    breadcrumbs: { home: 'Hjem', news: 'Nyheter' },
    backLink: 'Tilbake til hovedsiden',
    filters: {
      type: 'Type:', allTypes: 'Alle typer', prospective: 'Fremtidsrettet', retrospective: 'Tilbakeblikk', analysis: 'Analyse', breaking: 'Siste nytt',
      topic: 'Emne:', allTopics: 'Alle emner', parliament: 'Parlamentet', government: 'Regjeringen', defense: 'Forsvar', environment: 'Miljø', committees: 'Utvalg', legislation: 'Lovgivning',
      sort: 'Sorter:', newest: 'Nyeste først', oldest: 'Eldste først', titleSort: 'Tittel'
    },
    noResults: 'Ingen artikler matchet filtrene',
    i18n: { noArticles: 'Ingen artikler tilgjengelige', search: 'Søk:', searchPlaceholder: 'Søk artikler...', loadMore: 'Last flere artikler', showing: '(shown, total) => \'Viser \' + shown + \' av \' + total + \' artikler\'' },
    schemaDescription: 'Svensk parlamentsovervåking - Overvåk politisk aktivitet med systematisk åpenhet'
  },
  fi: {
    name: 'Suomi', code: 'fi', locale: 'fi_FI',
    title: 'Uutiset',
    subtitle: 'Viimeisimmät uutiset ja analyysit Ruotsin valtiopäivistä. The Economist -tyylistä poliittista journalismia.',
    keywords: 'riksdag uutiset, ruotsin parlamentti, hallituksen esitykset, valiokunnan mietinnöt, äänestykset, poliittinen analyysi, ruotsin puolueet, avoimuus, demokratia',
    breadcrumbs: { home: 'Etusivu', news: 'Uutiset' },
    backLink: 'Takaisin etusivulle',
    filters: {
      type: 'Tyyppi:', allTypes: 'Kaikki tyypit', prospective: 'Ennakoiva', retrospective: 'Takautuva', analysis: 'Analyysi', breaking: 'Viimeisimmät',
      topic: 'Aihe:', allTopics: 'Kaikki aiheet', parliament: 'Parlamentti', government: 'Hallitus', defense: 'Puolustus', environment: 'Ympäristö', committees: 'Valiokunnat', legislation: 'Lainsäädäntö',
      sort: 'Järjestä:', newest: 'Uusimmat ensin', oldest: 'Vanhimmat ensin', titleSort: 'Otsikko'
    },
    noResults: 'Mikään artikkeli ei vastannut suodattimia',
    i18n: { noArticles: 'Ei artikkeleita saatavilla', search: 'Haku:', searchPlaceholder: 'Hae artikkeleita...', loadMore: 'Lataa lisää artikkeleita', showing: '(shown, total) => \'Näytetään \' + shown + \' / \' + total + \' artikkelia\'' },
    schemaDescription: 'Ruotsin parlamenttiseuranta - Seuraa poliittista toimintaa järjestelmällisellä avoimuudella'
  },
  de: {
    name: 'Deutsch', code: 'de', locale: 'de_DE',
    title: 'Nachrichten',
    subtitle: 'Neueste Nachrichten und Analysen aus dem schwedischen Reichstag. Politischer Journalismus im Stil des Economist.',
    keywords: 'riksdag nachrichten, schwedisches parlament, regierungsvorlagen, ausschussberichte, abstimmungen, politische analyse, schwedische parteien, transparenz, demokratie',
    breadcrumbs: { home: 'Startseite', news: 'Nachrichten' },
    backLink: 'Zurück zur Hauptseite',
    filters: {
      type: 'Typ:', allTypes: 'Alle Typen', prospective: 'Vorausschauend', retrospective: 'Rückblickend', analysis: 'Analyse', breaking: 'Eilmeldungen',
      topic: 'Thema:', allTopics: 'Alle Themen', parliament: 'Parlament', government: 'Regierung', defense: 'Verteidigung', environment: 'Umwelt', committees: 'Ausschüsse', legislation: 'Gesetzgebung',
      sort: 'Sortieren:', newest: 'Neueste zuerst', oldest: 'Älteste zuerst', titleSort: 'Titel'
    },
    noResults: 'Keine Artikel entsprachen den Filtern',
    i18n: { noArticles: 'Keine Artikel verfügbar', search: 'Suche:', searchPlaceholder: 'Artikel suchen...', loadMore: 'Mehr Artikel laden', showing: '(shown, total) => \'Zeige \' + shown + \' von \' + total + \' Artikeln\'' },
    schemaDescription: 'Schwedische Parlamentsüberwachung - Politische Aktivitäten mit systematischer Transparenz verfolgen'
  },
  fr: {
    name: 'Français', code: 'fr', locale: 'fr_FR',
    title: 'Actualités',
    subtitle: 'Dernières nouvelles et analyses du Riksdag suédois. Journalisme politique dans le style de The Economist.',
    keywords: 'riksdag actualités, parlement suédois, projets de loi, rapports de commission, motions parlementaires, votes, analyse politique, partis suédois, transparence, démocratie',
    breadcrumbs: { home: 'Accueil', news: 'Actualités' },
    backLink: 'Retour à l\'accueil',
    filters: {
      type: 'Type :', allTypes: 'Tous types', prospective: 'Prospectif', retrospective: 'Rétrospectif', analysis: 'Analyse', breaking: 'Dernières nouvelles',
      topic: 'Sujet :', allTopics: 'Tous sujets', parliament: 'Parlement', government: 'Gouvernement', defense: 'Défense', environment: 'Environnement', committees: 'Comités', legislation: 'Législation',
      sort: 'Trier :', newest: 'Plus récent', oldest: 'Plus ancien', titleSort: 'Titre'
    },
    noResults: 'Aucun article ne correspond aux filtres',
    i18n: { noArticles: 'Aucun article disponible', search: 'Recherche :', searchPlaceholder: 'Rechercher des articles...', loadMore: 'Charger plus d\'articles', showing: '(shown, total) => \'Affichage de \' + shown + \' sur \' + total + \' articles\'' },
    schemaDescription: 'Surveillance du Parlement suédois - Suivre l\'activité politique avec une transparence systématique'
  },
  es: {
    name: 'Español', code: 'es', locale: 'es_ES',
    title: 'Noticias',
    subtitle: 'Últimas noticias y análisis del Parlamento sueco. Periodismo político al estilo de The Economist.',
    keywords: 'riksdag noticias, parlamento sueco, proyectos de ley, informes de comité, mociones parlamentarias, votaciones, análisis político, partidos suecos, transparencia, democracia',
    breadcrumbs: { home: 'Inicio', news: 'Noticias' },
    backLink: 'Volver a la página principal',
    filters: {
      type: 'Tipo:', allTypes: 'Todos los tipos', prospective: 'Prospectivo', retrospective: 'Retrospectivo', analysis: 'Análisis', breaking: 'Última hora',
      topic: 'Tema:', allTopics: 'Todos los temas', parliament: 'Parlamento', government: 'Gobierno', defense: 'Defensa', environment: 'Medio ambiente', committees: 'Comités', legislation: 'Legislación',
      sort: 'Ordenar:', newest: 'Más reciente', oldest: 'Más antiguo', titleSort: 'Título'
    },
    noResults: 'Ningún artículo coincidió con los filtros',
    i18n: { noArticles: 'No hay artículos disponibles', search: 'Buscar:', searchPlaceholder: 'Buscar artículos...', loadMore: 'Cargar más artículos', showing: '(shown, total) => \'Mostrando \' + shown + \' de \' + total + \' artículos\'' },
    schemaDescription: 'Monitoreo del Parlamento sueco - Seguimiento de la actividad política con transparencia sistemática'
  },
  nl: {
    name: 'Nederlands', code: 'nl', locale: 'nl_NL',
    title: 'Nieuws',
    subtitle: 'Laatste nieuws en analyses uit het Zweedse Parlement. Politieke journalistiek in de stijl van The Economist.',
    keywords: 'riksdag nieuws, zweeds parlement, wetsvoorstellen, commissieverslagen, parlementaire moties, stemmingen, politieke analyse, zweedse partijen, transparantie, democratie',
    breadcrumbs: { home: 'Home', news: 'Nieuws' },
    backLink: 'Terug naar hoofdpagina',
    filters: {
      type: 'Type:', allTypes: 'Alle types', prospective: 'Vooruitziend', retrospective: 'Terugblik', analysis: 'Analyse', breaking: 'Laatste nieuws',
      topic: 'Onderwerp:', allTopics: 'Alle onderwerpen', parliament: 'Parlement', government: 'Regering', defense: 'Defensie', environment: 'Milieu', committees: 'Commissies', legislation: 'Wetgeving',
      sort: 'Sorteren:', newest: 'Nieuwste eerst', oldest: 'Oudste eerst', titleSort: 'Titel'
    },
    noResults: 'Geen artikelen voldeden aan de filters',
    i18n: { noArticles: 'Geen artikelen beschikbaar', search: 'Zoeken:', searchPlaceholder: 'Artikelen zoeken...', loadMore: 'Meer artikelen laden', showing: '(shown, total) => \'Toon \' + shown + \' van \' + total + \' artikelen\'' },
    schemaDescription: 'Zweeds parlementair toezicht - Volg politieke activiteit met systematische transparantie'
  },
  ar: {
    name: 'العربية', code: 'ar', locale: 'ar_SA', rtl: true,
    title: 'أخبار',
    subtitle: 'آخر الأخبار والتحليلات من البرلمان السويدي. صحافة سياسية على طراز ذا إيكونوميست.',
    keywords: 'أخبار البرلمان, البرلمان السويدي, مشاريع القوانين, تقارير اللجان, التصويت, تحليل سياسي, الأحزاب السويدية, شفافية, ديمقراطية',
    breadcrumbs: { home: 'الرئيسية', news: 'أخبار' },
    backLink: 'العودة إلى الصفحة الرئيسية',
    filters: {
      type: 'النوع:', allTypes: 'جميع الأنواع', prospective: 'استشرافي', retrospective: 'استعادي', analysis: 'تحليل', breaking: 'أخبار عاجلة',
      topic: 'الموضوع:', allTopics: 'جميع المواضيع', parliament: 'البرلمان', government: 'الحكومة', defense: 'الدفاع', environment: 'البيئة', committees: 'اللجان', legislation: 'التشريعات',
      sort: 'الترتيب:', newest: 'الأحدث أولاً', oldest: 'الأقدم أولاً', titleSort: 'العنوان'
    },
    noResults: 'لا توجد مقالات تطابق الفلاتر',
    i18n: { noArticles: 'لا توجد مقالات متاحة', search: 'بحث:', searchPlaceholder: 'ابحث في المقالات...', loadMore: 'تحميل المزيد من المقالات', showing: '(shown, total) => \'عرض \' + shown + \' من \' + total + \' مقالات\'' },
    schemaDescription: 'مراقبة البرلمان السويدي - متابعة النشاط السياسي بشفافية منهجية'
  },
  he: {
    name: 'עברית', code: 'he', locale: 'he_IL', rtl: true,
    title: 'חדשות',
    subtitle: 'חדשות ואנליזות אחרונות מהפרלמנט השוודי. עיתונות פוליטית בסגנון דה אקונומיסט.',
    keywords: 'חדשות הפרלמנט, הפרלמנט השוודי, הצעות חוק, דוחות ועדות, הצבעות, ניתוח פוליטי, מפלגות שוודיות, שקיפות, דמוקרטיה',
    breadcrumbs: { home: 'בית', news: 'חדשות' },
    backLink: 'חזרה לדף הבית',
    filters: {
      type: 'סוג:', allTypes: 'כל הסוגים', prospective: 'פרוספקטיבי', retrospective: 'רטרוספקטיבי', analysis: 'ניתוח', breaking: 'חדשות אחרונות',
      topic: 'נושא:', allTopics: 'כל הנושאים', parliament: 'פרלמנט', government: 'ממשלה', defense: 'הגנה', environment: 'סביבה', committees: 'ועדות', legislation: 'חקיקה',
      sort: 'מיון:', newest: 'החדש ביותר', oldest: 'הישן ביותר', titleSort: 'כותרת'
    },
    noResults: 'אין מאמרים שתואמים את הסינון',
    i18n: { noArticles: 'אין מאמרים זמינים', search: 'חיפוש:', searchPlaceholder: 'חפש מאמרים...', loadMore: 'טען עוד מאמרים', showing: '(shown, total) => \'מציג \' + shown + \' מתוך \' + total + \' מאמרים\'' },
    schemaDescription: 'ניטור הפרלמנט השוודי - מעקב אחר פעילות פוליטית בשקיפות שיטתית'
  },
  ja: {
    name: '日本語', code: 'ja', locale: 'ja_JP',
    title: 'ニュース',
    subtitle: 'スウェーデン国会からの最新ニュースと分析。エコノミスト・スタイルの政治ジャーナリズム。',
    keywords: '国会ニュース, スウェーデン議会, 政府法案, 委員会報告, 採決, 政治分析, スウェーデン政党, 透明性, 民主主義',
    breadcrumbs: { home: 'ホーム', news: 'ニュース' },
    backLink: 'ホームページに戻る',
    filters: {
      type: '種類：', allTypes: 'すべてのタイプ', prospective: '予測', retrospective: '振り返り', analysis: '分析', breaking: '速報',
      topic: 'トピック：', allTopics: 'すべてのトピック', parliament: '議会', government: '政府', defense: '防衛', environment: '環境', committees: '委員会', legislation: '立法',
      sort: '並び替え：', newest: '最新順', oldest: '古い順', titleSort: 'タイトル'
    },
    noResults: 'フィルターに一致する記事がありません',
    i18n: { noArticles: '記事がありません', search: '検索：', searchPlaceholder: '記事を検索...', loadMore: 'さらに記事を読み込む', showing: '(shown, total) => shown + \' / \' + total + \' 件の記事\'' },
    schemaDescription: 'スウェーデン議会監視プラットフォーム - 体系的な透明性で政治活動を監視'
  },
  ko: {
    name: '한국어', code: 'ko', locale: 'ko_KR',
    title: '뉴스',
    subtitle: '스웨덴 의회의 최신 뉴스 및 분석. 이코노미스트 스타일의 정치 저널리즘.',
    keywords: '의회 뉴스, 스웨덴 의회, 정부 법안, 위원회 보고서, 표결, 정치 분석, 스웨덴 정당, 투명성, 민주주의',
    breadcrumbs: { home: '홈', news: '뉴스' },
    backLink: '홈페이지로 돌아가기',
    filters: {
      type: '유형:', allTypes: '모든 유형', prospective: '전망', retrospective: '회고', analysis: '분석', breaking: '속보',
      topic: '주제:', allTopics: '모든 주제', parliament: '의회', government: '정부', defense: '국방', environment: '환경', committees: '위원회', legislation: '입법',
      sort: '정렬:', newest: '최신순', oldest: '오래된 순', titleSort: '제목'
    },
    noResults: '필터와 일치하는 기사가 없습니다',
    i18n: { noArticles: '기사가 없습니다', search: '검색:', searchPlaceholder: '기사 검색...', loadMore: '더 많은 기사 불러오기', showing: '(shown, total) => shown + \' / \' + total + \' 개 기사\'' },
    schemaDescription: '스웨덴 의회 모니터링 플랫폼 - 체계적인 투명성으로 정치 활동 감시'
  },
  zh: {
    name: '中文', code: 'zh', locale: 'zh_CN',
    title: '新闻',
    subtitle: '来自瑞典议会的最新新闻和分析。经济学人风格的政治新闻报道。',
    keywords: '议会新闻, 瑞典议会, 政府法案, 委员会报告, 表决, 政治分析, 瑞典政党, 透明度, 民主',
    breadcrumbs: { home: '主页', news: '新闻' },
    backLink: '返回主页',
    filters: {
      type: '类型：', allTypes: '所有类型', prospective: '前瞻', retrospective: '回顾', analysis: '分析', breaking: '最新消息',
      topic: '主题：', allTopics: '所有主题', parliament: '议会', government: '政府', defense: '国防', environment: '环境', committees: '委员会', legislation: '立法',
      sort: '排序：', newest: '最新优先', oldest: '最旧优先', titleSort: '标题'
    },
    noResults: '没有与过滤器匹配的文章',
    i18n: { noArticles: '没有可用的文章', search: '搜索：', searchPlaceholder: '搜索文章...', loadMore: '加载更多文章', showing: '(shown, total) => \'显示 \' + shown + \' / \' + total + \' 篇文章\'' },
    schemaDescription: '瑞典议会监督平台 - 以系统化透明度监测政治活动'
  }
};

/** Language flags mapping for badges */
export const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧', sv: '🇸🇪', da: '🇩🇰', no: '🇳🇴', fi: '🇫🇮',
  de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', nl: '🇳🇱', ar: '🇸🇦',
  he: '🇮🇱', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳'
};

/** "Available in" translations for each language */
export const AVAILABLE_IN_TRANSLATIONS: Record<string, string> = {
  en: 'Available in', sv: 'Tillgänglig på', da: 'Tilgængelig på', no: 'Tilgjengelig på', fi: 'Saatavilla kielellä',
  de: 'Verfügbar in', fr: 'Disponible en', es: 'Disponible en', nl: 'Beschikbaar in', ar: 'متاح في',
  he: 'זמין ב', ja: '利用可能な言語', ko: '사용 가능 언어', zh: '可用语言'
};
