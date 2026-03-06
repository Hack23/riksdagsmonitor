/**
 * @module Infrastructure/SEO
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Sitemap HTML Generation - Multi-Language HTML Sitemap Pages
 *
 * @description
 * Generates localized sitemap HTML pages for all 14 language variants.
 * Extracts article titles and descriptions from news HTML files and
 * generates human-readable sitemap pages with proper localization.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️ Sitemap HTML Generation Script');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = 'https://riksdagsmonitor.com';
const NEWS_DIR = path.join(__dirname, '..', 'news');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const ROOT_DIR = path.join(__dirname, '..');

const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

// ---------------------------------------------------------------------------
// Language metadata
// ---------------------------------------------------------------------------

interface LanguageMeta {
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  locale: string;
  hreflang: string;
  translations: {
    siteMap: string;
    completeNavigation: string;
    quickJumpTo: string;
    mainPlatform: string;
    dashboards: string;
    newsAnalysis: string;
    multiLanguage: string;
    documentation: string;
    resources: string;
    sitemapLanguages: string;
    home: string;
    newsIndex: string;
    newsDesc: string;
    ciaDashboard: string;
    ciaDashboardDesc: string;
    politicianDashboard: string;
    politicianDashboardDesc: string;
    mainPlatformDesc: string;
    xmlSitemap: string;
    xmlSitemapDesc: string;
    robotsTxt: string;
    robotsTxtDesc: string;
    sitemapInOtherLanguages: string;
    accessPlatform: string;
    apiDocs: string;
    apiDocsDesc: string;
    coverageReports: string;
    coverageReportsDesc: string;
    testResults: string;
    testResultsDesc: string;
    recentArticles: string;
    newsIndexPages: string;
  };
}

const LANGUAGE_META: Record<Language, LanguageMeta> = {
  en: {
    name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr', locale: 'en_US', hreflang: 'en',
    translations: {
      siteMap: 'Sitemap', completeNavigation: 'Complete navigation for Riksdagsmonitor platform',
      quickJumpTo: 'Quick Jump To', mainPlatform: 'Main Platform', dashboards: 'Interactive Dashboards',
      newsAnalysis: 'News & Analysis', multiLanguage: 'Multi-Language Platform Access',
      documentation: 'Documentation', resources: 'Additional Resources',
      sitemapLanguages: 'This Sitemap in Other Languages', home: 'Home',
      newsIndex: 'News Index', newsDesc: 'Latest political news, analysis, and updates from the Swedish Parliament and Government.',
      ciaDashboard: 'CIA Intelligence Dashboard', ciaDashboardDesc: 'Interactive visualization of CIA intelligence exports: Party performance, election predictions, MP rankings.',
      politicianDashboard: 'Politician Career & Productivity Analytics', politicianDashboardDesc: 'Comprehensive politician career and productivity dashboard for Sweden\'s 349 MPs.',
      mainPlatformDesc: 'Swedish Election 2026 live intelligence platform: Real-time monitoring, coalition predictions, comprehensive parliamentary analysis.',
      xmlSitemap: 'XML Sitemap', xmlSitemapDesc: 'Machine-readable sitemap for search engines (XML format).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Search engine crawler instructions.',
      sitemapInOtherLanguages: 'This Sitemap in Other Languages', accessPlatform: 'Access the main platform in your preferred language.',
      apiDocs: 'API Documentation', apiDocsDesc: 'Generated API documentation for platform scripts and modules.',
      coverageReports: 'Code Coverage Reports', coverageReportsDesc: 'Test coverage reports for JavaScript and TypeScript code.',
      testResults: 'Test Results', testResultsDesc: 'Automated test results and reports.',
      recentArticles: 'Recent News Articles', newsIndexPages: 'News Index Pages',
    },
  },
  sv: {
    name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', dir: 'ltr', locale: 'sv_SE', hreflang: 'sv',
    translations: {
      siteMap: 'Webbplatskarta', completeNavigation: 'Komplett navigering för Riksdagsmonitor-plattformen',
      quickJumpTo: 'Snabbnavigering', mainPlatform: 'Huvudplattform', dashboards: 'Interaktiva instrumentpaneler',
      newsAnalysis: 'Nyheter & Analys', multiLanguage: 'Flerspråkig plattformsåtkomst',
      documentation: 'Dokumentation', resources: 'Ytterligare resurser',
      sitemapLanguages: 'Denna webbplatskarta på andra språk', home: 'Hem',
      newsIndex: 'Nyhetsindex', newsDesc: 'Senaste politiska nyheter, analyser och uppdateringar från Sveriges riksdag och regering.',
      ciaDashboard: 'CIA Intelligens-instrumentpanel', ciaDashboardDesc: 'Interaktiv visualisering av CIA intelligensexporter: Partiprestation, valprognoser, MP-rankningar.',
      politicianDashboard: 'Politiker karriär & produktivitetsanalys', politicianDashboardDesc: 'Omfattande politiker karriär- och produktivitetspanel för Sveriges 349 riksdagsledamöter.',
      mainPlatformDesc: 'Sveriges val 2026 live: Realtidsövervakning, koalitionsprognoser, omfattande parlamentarisk analys.',
      xmlSitemap: 'XML-webbplatskarta', xmlSitemapDesc: 'Maskinläsbar webbplatskarta för sökmotorer (XML-format).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Instruktioner för sökmotorsökare.',
      sitemapInOtherLanguages: 'Denna webbplatskarta på andra språk', accessPlatform: 'Öppna huvudplattformen på ditt föredragna språk.',
      apiDocs: 'API-dokumentation', apiDocsDesc: 'Genererad API-dokumentation för plattformens skript och moduler.',
      coverageReports: 'Kodtäckningsrapporter', coverageReportsDesc: 'Testtäckningsrapporter för JavaScript och TypeScript-kod.',
      testResults: 'Testresultat', testResultsDesc: 'Automatiserade testresultat och rapporter.',
      recentArticles: 'Senaste nyhetsartiklar', newsIndexPages: 'Nyhetsindexsidor',
    },
  },
  da: {
    name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', dir: 'ltr', locale: 'da_DK', hreflang: 'da',
    translations: {
      siteMap: 'Sitemap', completeNavigation: 'Komplet navigation for Riksdagsmonitor-platformen',
      quickJumpTo: 'Hurtig navigation', mainPlatform: 'Hovedplatform', dashboards: 'Interaktive dashboards',
      newsAnalysis: 'Nyheder & Analyse', multiLanguage: 'Flersproget platformsadgang',
      documentation: 'Dokumentation', resources: 'Yderligere ressourcer',
      sitemapLanguages: 'Dette sitemap på andre sprog', home: 'Hjem',
      newsIndex: 'Nyhedsindeks', newsDesc: 'Seneste politiske nyheder, analyser og opdateringer fra Sveriges Riksdag og regering.',
      ciaDashboard: 'CIA Efterretningspanel', ciaDashboardDesc: 'Interaktivt CIA efterretningspanel: Partiydelse, valgprognoser, folketingsmedlemmer.',
      politicianDashboard: 'Politiker karriere & produktivitetsanalyse', politicianDashboardDesc: 'Omfattende politiker karriere- og produktivitetspanel.',
      mainPlatformDesc: 'Sveriges valg 2026 live: Realtidsovervågning, koalitionsprognoser, parlamentarisk analyse.',
      xmlSitemap: 'XML Sitemap', xmlSitemapDesc: 'Maskinlæsbart sitemap til søgemaskiner (XML-format).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Søgemaskine-crawler-instruktioner.',
      sitemapInOtherLanguages: 'Dette sitemap på andre sprog', accessPlatform: 'Adgang til hovedplatformen på dit foretrukne sprog.',
      apiDocs: 'API-dokumentation', apiDocsDesc: 'Genereret API-dokumentation for platformens scripts og moduler.',
      coverageReports: 'Kodedækningsrapporter', coverageReportsDesc: 'Testdækningsrapporter for JavaScript og TypeScript-kode.',
      testResults: 'Testresultater', testResultsDesc: 'Automatiserede testresultater og rapporter.',
      recentArticles: 'Seneste nyheder', newsIndexPages: 'Nyhedsindekssider',
    },
  },
  no: {
    name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', dir: 'ltr', locale: 'nb_NO', hreflang: 'nb',
    translations: {
      siteMap: 'Nettstedskart', completeNavigation: 'Komplett navigering for Riksdagsmonitor-plattformen',
      quickJumpTo: 'Hurtignavigering', mainPlatform: 'Hovedplattform', dashboards: 'Interaktive dashbord',
      newsAnalysis: 'Nyheter & Analyse', multiLanguage: 'Flerspråklig plattformstilgang',
      documentation: 'Dokumentasjon', resources: 'Ytterligere ressurser',
      sitemapLanguages: 'Dette nettstedskartet på andre språk', home: 'Hjem',
      newsIndex: 'Nyhetsindeks', newsDesc: 'Siste politiske nyheter, analyser og oppdateringer fra Sveriges Riksdag og regjering.',
      ciaDashboard: 'CIA Etterretningspanel', ciaDashboardDesc: 'Interaktivt CIA etterretningspanel: Partiytelse, valgprognoser, stortingsrepresentanter.',
      politicianDashboard: 'Politiker karriere & produktivitetsanalyse', politicianDashboardDesc: 'Omfattende politiker karriere- og produktivitetspanel.',
      mainPlatformDesc: 'Sveriges valg 2026 live: Sanntidsovervåking, koalisjonsprognoser, parlamentarisk analyse.',
      xmlSitemap: 'XML Nettstedskart', xmlSitemapDesc: 'Maskinlesbart nettstedskart for søkemotorer (XML-format).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Søkemotor-crawler-instruksjoner.',
      sitemapInOtherLanguages: 'Dette nettstedskartet på andre språk', accessPlatform: 'Tilgang til hovedplattformen på ditt foretrukne språk.',
      apiDocs: 'API-dokumentasjon', apiDocsDesc: 'Generert API-dokumentasjon for plattformens skript og moduler.',
      coverageReports: 'Kodedekkningsrapporter', coverageReportsDesc: 'Testdekkningsrapporter for JavaScript og TypeScript-kode.',
      testResults: 'Testresultater', testResultsDesc: 'Automatiserte testresultater og rapporter.',
      recentArticles: 'Siste nyheter', newsIndexPages: 'Nyhetsindekssider',
    },
  },
  fi: {
    name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', dir: 'ltr', locale: 'fi_FI', hreflang: 'fi',
    translations: {
      siteMap: 'Sivukartta', completeNavigation: 'Riksdagsmonitor-alustan täydellinen navigointi',
      quickJumpTo: 'Pikanavigaatio', mainPlatform: 'Pääalusta', dashboards: 'Interaktiiviset kojetaulut',
      newsAnalysis: 'Uutiset & Analyysi', multiLanguage: 'Monikielinen alustapääsy',
      documentation: 'Dokumentaatio', resources: 'Lisäresurssit',
      sitemapLanguages: 'Tämä sivukartta muilla kielillä', home: 'Etusivu',
      newsIndex: 'Uutisindeksi', newsDesc: 'Uusimmat poliittiset uutiset, analyysit ja päivitykset Ruotsin parlamentista ja hallituksesta.',
      ciaDashboard: 'CIA Tiedustelupaneeli', ciaDashboardDesc: 'Interaktiivinen CIA tiedustelupaneeli: Puolueiden suorituskyky, vaaliennusteet, kansanedustajat.',
      politicianDashboard: 'Poliitikon ura & tuottavuusanalyysi', politicianDashboardDesc: 'Kattava poliitikon ura- ja tuottavuuspaneeli.',
      mainPlatformDesc: 'Ruotsin vaalit 2026 live: Reaaliaikainen seuranta, koalitioennusteet, parlamentaarinen analyysi.',
      xmlSitemap: 'XML-sivukartta', xmlSitemapDesc: 'Koneluettava sivukartta hakukoneille (XML-muoto).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Hakukoneiden indeksointi-ohjeet.',
      sitemapInOtherLanguages: 'Tämä sivukartta muilla kielillä', accessPlatform: 'Avaa pääalusta haluamallasi kielellä.',
      apiDocs: 'API-dokumentaatio', apiDocsDesc: 'Generoitu API-dokumentaatio alustan skripteille ja moduuleille.',
      coverageReports: 'Koodikattavuusraportit', coverageReportsDesc: 'Testikattavuusraportit JavaScript- ja TypeScript-koodille.',
      testResults: 'Testitulokset', testResultsDesc: 'Automatisoidut testitulokset ja raportit.',
      recentArticles: 'Viimeisimmät uutiset', newsIndexPages: 'Uutisindeksisivut',
    },
  },
  de: {
    name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr', locale: 'de_DE', hreflang: 'de',
    translations: {
      siteMap: 'Sitemap', completeNavigation: 'Vollständige Navigation für die Riksdagsmonitor-Plattform',
      quickJumpTo: 'Schnellnavigation', mainPlatform: 'Hauptplattform', dashboards: 'Interaktive Dashboards',
      newsAnalysis: 'Nachrichten & Analyse', multiLanguage: 'Mehrsprachiger Plattformzugang',
      documentation: 'Dokumentation', resources: 'Weitere Ressourcen',
      sitemapLanguages: 'Diese Sitemap in anderen Sprachen', home: 'Startseite',
      newsIndex: 'Nachrichtenindex', newsDesc: 'Neueste politische Nachrichten, Analysen und Updates aus dem schwedischen Reichstag und der Regierung.',
      ciaDashboard: 'CIA Nachrichtendienst-Dashboard', ciaDashboardDesc: 'Interaktives CIA Dashboard: Parteileistung, Wahlprognosen, Abgeordnete und Analyse.',
      politicianDashboard: 'Politiker Karriere- & Produktivitätsanalyse', politicianDashboardDesc: 'Umfassendes Politiker-Karriere- und Produktivitäts-Dashboard.',
      mainPlatformDesc: 'Schwedische Wahl 2026 live: Echtzeitüberwachung, Koalitionsprognosen, parlamentarische Analyse.',
      xmlSitemap: 'XML-Sitemap', xmlSitemapDesc: 'Maschinenlesbare Sitemap für Suchmaschinen (XML-Format).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Suchmaschinen-Crawler-Anweisungen.',
      sitemapInOtherLanguages: 'Diese Sitemap in anderen Sprachen', accessPlatform: 'Zugriff auf die Hauptplattform in Ihrer bevorzugten Sprache.',
      apiDocs: 'API-Dokumentation', apiDocsDesc: 'Generierte API-Dokumentation für Plattform-Skripte und Module.',
      coverageReports: 'Code-Coverage-Berichte', coverageReportsDesc: 'Testabdeckungsberichte für JavaScript und TypeScript-Code.',
      testResults: 'Testergebnisse', testResultsDesc: 'Automatisierte Testergebnisse und Berichte.',
      recentArticles: 'Aktuelle Nachrichten', newsIndexPages: 'Nachrichtenindexseiten',
    },
  },
  fr: {
    name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr', locale: 'fr_FR', hreflang: 'fr',
    translations: {
      siteMap: 'Plan du site', completeNavigation: 'Navigation complète pour la plateforme Riksdagsmonitor',
      quickJumpTo: 'Navigation rapide', mainPlatform: 'Plateforme principale', dashboards: 'Tableaux de bord interactifs',
      newsAnalysis: 'Actualités & Analyse', multiLanguage: 'Accès multilingue à la plateforme',
      documentation: 'Documentation', resources: 'Ressources supplémentaires',
      sitemapLanguages: 'Ce plan du site dans d\'autres langues', home: 'Accueil',
      newsIndex: 'Index des actualités', newsDesc: 'Dernières actualités politiques, analyses et mises à jour du Parlement et du gouvernement suédois.',
      ciaDashboard: 'Tableau de bord CIA', ciaDashboardDesc: 'Tableau de bord CIA interactif: Performance des partis, prévisions électorales, députés.',
      politicianDashboard: 'Carrière politique & analyse de productivité', politicianDashboardDesc: 'Tableau de bord complet de carrière et productivité des politiciens.',
      mainPlatformDesc: 'Élections suédoises 2026 en direct: Surveillance en temps réel, prévisions de coalition, analyse parlementaire.',
      xmlSitemap: 'Plan du site XML', xmlSitemapDesc: 'Plan du site lisible par les machines pour les moteurs de recherche (format XML).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Instructions pour les robots des moteurs de recherche.',
      sitemapInOtherLanguages: 'Ce plan du site dans d\'autres langues', accessPlatform: 'Accédez à la plateforme principale dans votre langue préférée.',
      apiDocs: 'Documentation API', apiDocsDesc: 'Documentation API générée pour les scripts et modules de la plateforme.',
      coverageReports: 'Rapports de couverture de code', coverageReportsDesc: 'Rapports de couverture de tests pour le code JavaScript et TypeScript.',
      testResults: 'Résultats des tests', testResultsDesc: 'Résultats de tests automatisés et rapports.',
      recentArticles: 'Articles récents', newsIndexPages: 'Pages d\'index des actualités',
    },
  },
  es: {
    name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr', locale: 'es_ES', hreflang: 'es',
    translations: {
      siteMap: 'Mapa del sitio', completeNavigation: 'Navegación completa para la plataforma Riksdagsmonitor',
      quickJumpTo: 'Navegación rápida', mainPlatform: 'Plataforma principal', dashboards: 'Paneles interactivos',
      newsAnalysis: 'Noticias & Análisis', multiLanguage: 'Acceso multilingüe a la plataforma',
      documentation: 'Documentación', resources: 'Recursos adicionales',
      sitemapLanguages: 'Este mapa del sitio en otros idiomas', home: 'Inicio',
      newsIndex: 'Índice de noticias', newsDesc: 'Últimas noticias políticas, análisis y actualizaciones del Parlamento y Gobierno de Suecia.',
      ciaDashboard: 'Panel de inteligencia CIA', ciaDashboardDesc: 'Panel interactivo CIA: Rendimiento de partidos, pronósticos electorales, diputados.',
      politicianDashboard: 'Carrera política & análisis de productividad', politicianDashboardDesc: 'Panel completo de carrera y productividad de políticos.',
      mainPlatformDesc: 'Elecciones suecas 2026 en vivo: Monitoreo en tiempo real, pronósticos de coalición, análisis parlamentario.',
      xmlSitemap: 'Mapa del sitio XML', xmlSitemapDesc: 'Mapa del sitio legible por máquinas para motores de búsqueda (formato XML).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Instrucciones para rastreadores de motores de búsqueda.',
      sitemapInOtherLanguages: 'Este mapa del sitio en otros idiomas', accessPlatform: 'Acceda a la plataforma principal en su idioma preferido.',
      apiDocs: 'Documentación API', apiDocsDesc: 'Documentación API generada para scripts y módulos de la plataforma.',
      coverageReports: 'Informes de cobertura de código', coverageReportsDesc: 'Informes de cobertura de pruebas para código JavaScript y TypeScript.',
      testResults: 'Resultados de pruebas', testResultsDesc: 'Resultados de pruebas automatizadas e informes.',
      recentArticles: 'Artículos recientes', newsIndexPages: 'Páginas de índice de noticias',
    },
  },
  nl: {
    name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', dir: 'ltr', locale: 'nl_NL', hreflang: 'nl',
    translations: {
      siteMap: 'Sitemap', completeNavigation: 'Volledige navigatie voor het Riksdagsmonitor-platform',
      quickJumpTo: 'Snelnavigatie', mainPlatform: 'Hoofdplatform', dashboards: 'Interactieve dashboards',
      newsAnalysis: 'Nieuws & Analyse', multiLanguage: 'Meertalige platformtoegang',
      documentation: 'Documentatie', resources: 'Aanvullende bronnen',
      sitemapLanguages: 'Deze sitemap in andere talen', home: 'Home',
      newsIndex: 'Nieuwsindex', newsDesc: 'Laatste politieke nieuws, analyses en updates van het Zweedse Parlement en de regering.',
      ciaDashboard: 'CIA Inlichtingendashboard', ciaDashboardDesc: 'Interactief CIA inlichtingendashboard: Partijprestaties, verkiezingsprognoses, parlementariërs.',
      politicianDashboard: 'Politicus carrière & productiviteitsanalyse', politicianDashboardDesc: 'Uitgebreid politicus carrière- en productiviteitsdashboard.',
      mainPlatformDesc: 'Zweedse verkiezingen 2026 live: Realtime monitoring, coalitieprognoses, parlementaire analyse.',
      xmlSitemap: 'XML Sitemap', xmlSitemapDesc: 'Machineleesbare sitemap voor zoekmachines (XML-formaat).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'Zoekmachine-crawler-instructies.',
      sitemapInOtherLanguages: 'Deze sitemap in andere talen', accessPlatform: 'Toegang tot het hoofdplatform in uw voorkeurstaal.',
      apiDocs: 'API-documentatie', apiDocsDesc: 'Gegenereerde API-documentatie voor platformscripts en modules.',
      coverageReports: 'Codedekkingsrapporten', coverageReportsDesc: 'Testdekkingsrapporten voor JavaScript en TypeScript-code.',
      testResults: 'Testresultaten', testResultsDesc: 'Geautomatiseerde testresultaten en rapporten.',
      recentArticles: 'Recente artikelen', newsIndexPages: 'Nieuwsindexpagina\'s',
    },
  },
  ar: {
    name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl', locale: 'ar_SA', hreflang: 'ar',
    translations: {
      siteMap: 'خريطة الموقع', completeNavigation: 'التنقل الكامل لمنصة Riksdagsmonitor',
      quickJumpTo: 'انتقال سريع', mainPlatform: 'المنصة الرئيسية', dashboards: 'لوحات المعلومات التفاعلية',
      newsAnalysis: 'الأخبار والتحليل', multiLanguage: 'وصول متعدد اللغات للمنصة',
      documentation: 'التوثيق', resources: 'موارد إضافية',
      sitemapLanguages: 'خريطة الموقع هذه بلغات أخرى', home: 'الرئيسية',
      newsIndex: 'فهرس الأخبار', newsDesc: 'آخر الأخبار السياسية والتحليلات والتحديثات من البرلمان والحكومة السويدية.',
      ciaDashboard: 'لوحة معلومات استخباراتية', ciaDashboardDesc: 'لوحة معلومات استخباراتية تفاعلية: أداء الأحزاب، توقعات الانتخابات، أعضاء البرلمان.',
      politicianDashboard: 'تحليل مسيرة السياسيين والإنتاجية', politicianDashboardDesc: 'لوحة شاملة لمسيرة السياسيين والإنتاجية.',
      mainPlatformDesc: 'الانتخابات السويدية 2026 مباشر: مراقبة في الوقت الفعلي، توقعات الائتلاف، تحليل برلماني.',
      xmlSitemap: 'خريطة موقع XML', xmlSitemapDesc: 'خريطة موقع قابلة للقراءة آليًا لمحركات البحث (تنسيق XML).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'تعليمات زاحف محرك البحث.',
      sitemapInOtherLanguages: 'خريطة الموقع هذه بلغات أخرى', accessPlatform: 'الوصول إلى المنصة الرئيسية بلغتك المفضلة.',
      apiDocs: 'توثيق API', apiDocsDesc: 'توثيق API المُنشأ لنصوص ووحدات المنصة.',
      coverageReports: 'تقارير تغطية الكود', coverageReportsDesc: 'تقارير تغطية الاختبارات لكود JavaScript و TypeScript.',
      testResults: 'نتائج الاختبارات', testResultsDesc: 'نتائج الاختبارات الآلية والتقارير.',
      recentArticles: 'أحدث المقالات', newsIndexPages: 'صفحات فهرس الأخبار',
    },
  },
  he: {
    name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', dir: 'rtl', locale: 'he_IL', hreflang: 'he',
    translations: {
      siteMap: 'מפת האתר', completeNavigation: 'ניווט מלא לפלטפורמת Riksdagsmonitor',
      quickJumpTo: 'ניווט מהיר', mainPlatform: 'פלטפורמה ראשית', dashboards: 'לוחות מחוונים אינטראקטיביים',
      newsAnalysis: 'חדשות וניתוח', multiLanguage: 'גישה רב-לשונית לפלטפורמה',
      documentation: 'תיעוד', resources: 'משאבים נוספים',
      sitemapLanguages: 'מפת אתר זו בשפות אחרות', home: 'דף הבית',
      newsIndex: 'אינדקס חדשות', newsDesc: 'החדשות הפוליטיות, הניתוחים והעדכונים האחרונים מהפרלמנט והממשלה השוודיים.',
      ciaDashboard: 'לוח מחוונים מודיעיני', ciaDashboardDesc: 'לוח מחוונים מודיעיני אינטראקטיבי: ביצועי מפלגות, תחזיות בחירות, חברי כנסת.',
      politicianDashboard: 'קריירה פוליטית וניתוח פרודוקטיביות', politicianDashboardDesc: 'לוח מחוונים מקיף לקריירה ופרודוקטיביות של פוליטיקאים.',
      mainPlatformDesc: 'בחירות שוודיה 2026 בשידור חי: ניטור בזמן אמת, תחזיות קואליציה, ניתוח פרלמנטרי.',
      xmlSitemap: 'מפת אתר XML', xmlSitemapDesc: 'מפת אתר קריאה למכונות עבור מנועי חיפוש (פורמט XML).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: 'הוראות לסורקי מנועי חיפוש.',
      sitemapInOtherLanguages: 'מפת אתר זו בשפות אחרות', accessPlatform: 'גישה לפלטפורמה הראשית בשפה המועדפת עליך.',
      apiDocs: 'תיעוד API', apiDocsDesc: 'תיעוד API שנוצר עבור סקריפטים ומודולים של הפלטפורמה.',
      coverageReports: 'דוחות כיסוי קוד', coverageReportsDesc: 'דוחות כיסוי בדיקות עבור קוד JavaScript ו-TypeScript.',
      testResults: 'תוצאות בדיקות', testResultsDesc: 'תוצאות בדיקות אוטומטיות ודוחות.',
      recentArticles: 'כתבות אחרונות', newsIndexPages: 'דפי אינדקס חדשות',
    },
  },
  ja: {
    name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr', locale: 'ja_JP', hreflang: 'ja',
    translations: {
      siteMap: 'サイトマップ', completeNavigation: 'Riksdagsmonitorプラットフォームの完全なナビゲーション',
      quickJumpTo: 'クイックナビゲーション', mainPlatform: 'メインプラットフォーム', dashboards: 'インタラクティブダッシュボード',
      newsAnalysis: 'ニュース＆分析', multiLanguage: '多言語プラットフォームアクセス',
      documentation: 'ドキュメント', resources: '追加リソース',
      sitemapLanguages: 'このサイトマップの他言語版', home: 'ホーム',
      newsIndex: 'ニュースインデックス', newsDesc: 'スウェーデン議会と政府からの最新の政治ニュース、分析、アップデート。',
      ciaDashboard: 'CIA情報ダッシュボード', ciaDashboardDesc: 'インタラクティブCIA情報ダッシュボード: 政党パフォーマンス、選挙予測、国会議員ランキング。',
      politicianDashboard: '政治家のキャリアと生産性分析', politicianDashboardDesc: '包括的な政治家のキャリアと生産性ダッシュボード。',
      mainPlatformDesc: 'スウェーデン選挙2026ライブ: リアルタイム監視、連立予測、議会分析。',
      xmlSitemap: 'XMLサイトマップ', xmlSitemapDesc: '検索エンジン向け機械可読サイトマップ（XML形式）。',
      robotsTxt: 'Robots.txt', robotsTxtDesc: '検索エンジンクローラーの指示。',
      sitemapInOtherLanguages: 'このサイトマップの他言語版', accessPlatform: 'お好みの言語でメインプラットフォームにアクセスしてください。',
      apiDocs: 'APIドキュメント', apiDocsDesc: 'プラットフォームのスクリプトとモジュールの生成されたAPIドキュメント。',
      coverageReports: 'コードカバレッジレポート', coverageReportsDesc: 'JavaScript/TypeScriptコードのテストカバレッジレポート。',
      testResults: 'テスト結果', testResultsDesc: '自動テスト結果とレポート。',
      recentArticles: '最新記事', newsIndexPages: 'ニュースインデックスページ',
    },
  },
  ko: {
    name: 'Korean', nativeName: '한국어', flag: '🇰🇷', dir: 'ltr', locale: 'ko_KR', hreflang: 'ko',
    translations: {
      siteMap: '사이트맵', completeNavigation: 'Riksdagsmonitor 플랫폼의 완전한 탐색',
      quickJumpTo: '빠른 탐색', mainPlatform: '메인 플랫폼', dashboards: '인터랙티브 대시보드',
      newsAnalysis: '뉴스 & 분석', multiLanguage: '다국어 플랫폼 접근',
      documentation: '문서', resources: '추가 리소스',
      sitemapLanguages: '다른 언어의 사이트맵', home: '홈',
      newsIndex: '뉴스 인덱스', newsDesc: '스웨덴 의회와 정부의 최신 정치 뉴스, 분석 및 업데이트.',
      ciaDashboard: 'CIA 정보 대시보드', ciaDashboardDesc: 'CIA 정보 대시보드: 정당 성과, 선거 예측, 국회의원 순위.',
      politicianDashboard: '정치인 경력 & 생산성 분석', politicianDashboardDesc: '포괄적인 정치인 경력 및 생산성 대시보드.',
      mainPlatformDesc: '스웨덴 선거 2026 라이브: 실시간 모니터링, 연합 예측, 의회 분석.',
      xmlSitemap: 'XML 사이트맵', xmlSitemapDesc: '검색 엔진용 기계 판독 가능 사이트맵 (XML 형식).',
      robotsTxt: 'Robots.txt', robotsTxtDesc: '검색 엔진 크롤러 지침.',
      sitemapInOtherLanguages: '다른 언어의 사이트맵', accessPlatform: '선호하는 언어로 메인 플랫폼에 접근하세요.',
      apiDocs: 'API 문서', apiDocsDesc: '플랫폼 스크립트 및 모듈의 생성된 API 문서.',
      coverageReports: '코드 커버리지 보고서', coverageReportsDesc: 'JavaScript 및 TypeScript 코드의 테스트 커버리지 보고서.',
      testResults: '테스트 결과', testResultsDesc: '자동화된 테스트 결과 및 보고서.',
      recentArticles: '최신 기사', newsIndexPages: '뉴스 인덱스 페이지',
    },
  },
  zh: {
    name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr', locale: 'zh_CN', hreflang: 'zh',
    translations: {
      siteMap: '网站地图', completeNavigation: 'Riksdagsmonitor平台完整导航',
      quickJumpTo: '快速导航', mainPlatform: '主平台', dashboards: '交互式仪表板',
      newsAnalysis: '新闻与分析', multiLanguage: '多语言平台访问',
      documentation: '文档', resources: '附加资源',
      sitemapLanguages: '本站点地图的其他语言版本', home: '首页',
      newsIndex: '新闻索引', newsDesc: '来自瑞典议会和政府的最新政治新闻、分析和更新。',
      ciaDashboard: 'CIA情报仪表板', ciaDashboardDesc: 'CIA情报仪表板：政党表现、选举预测、国会议员排名。',
      politicianDashboard: '政治家职业与生产力分析', politicianDashboardDesc: '全面的政治家职业和生产力仪表板。',
      mainPlatformDesc: '瑞典2026年选举直播：实时监控、联盟预测、议会分析。',
      xmlSitemap: 'XML站点地图', xmlSitemapDesc: '供搜索引擎使用的机器可读站点地图（XML格式）。',
      robotsTxt: 'Robots.txt', robotsTxtDesc: '搜索引擎爬虫指令。',
      sitemapInOtherLanguages: '本站点地图的其他语言版本', accessPlatform: '以您偏好的语言访问主平台。',
      apiDocs: 'API文档', apiDocsDesc: '为平台脚本和模块生成的API文档。',
      coverageReports: '代码覆盖率报告', coverageReportsDesc: 'JavaScript和TypeScript代码的测试覆盖率报告。',
      testResults: '测试结果', testResultsDesc: '自动化测试结果和报告。',
      recentArticles: '最新文章', newsIndexPages: '新闻索引页面',
    },
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArticleInfo {
  file: string;
  title: string;
  description: string;
  lang: Language;
  baseSlug: string;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Extract title and description from an HTML file.
 */
function extractArticleMeta(filePath: string): { title: string; description: string } {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    return {
      title: titleMatch ? titleMatch[1]!.trim() : path.basename(filePath, '.html'),
      description: descMatch ? descMatch[1]!.trim() : '',
    };
  } catch (_error: unknown) {
    return { title: path.basename(filePath, '.html'), description: '' };
  }
}

/**
 * Scan news articles and group by language.
 */
function getArticlesByLanguage(): Map<Language, ArticleInfo[]> {
  const articlesByLang = new Map<Language, ArticleInfo[]>();

  if (!fs.existsSync(NEWS_DIR)) return articlesByLang;

  const files = fs
    .readdirSync(NEWS_DIR)
    .filter((file) => file.endsWith('.html') && file !== 'index.html' && !file.startsWith('index_'))
    .sort()
    .reverse(); // Most recent first

  for (const file of files) {
    const match = file.match(/^(.+?)-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
    if (match) {
      const baseSlug = match[1]!;
      const lang = match[2]! as Language;
      const filePath = path.join(NEWS_DIR, file);
      const meta = extractArticleMeta(filePath);

      if (!articlesByLang.has(lang)) {
        articlesByLang.set(lang, []);
      }
      articlesByLang.get(lang)!.push({
        file,
        title: meta.title,
        description: meta.description,
        lang,
        baseSlug,
      });
    }
  }

  return articlesByLang;
}

/**
 * Check which docs sections exist.
 */
function getDocsSections(): { api: boolean; coverage: boolean; testResults: boolean; cypress: boolean; index: boolean } {
  return {
    index: fs.existsSync(path.join(DOCS_DIR, 'index.html')),
    api: fs.existsSync(path.join(DOCS_DIR, 'api', 'index.html')),
    coverage: fs.existsSync(path.join(DOCS_DIR, 'coverage', 'index.html')),
    testResults: fs.existsSync(path.join(DOCS_DIR, 'test-results', 'index.html')),
    cypress: fs.existsSync(path.join(DOCS_DIR, 'cypress', 'index.html')),
  };
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    // Escape & only when it is NOT already part of a valid HTML entity
    .replace(/&(?!(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate a sitemap HTML page for a specific language.
 */
function generateSitemapHtml(lang: Language, articlesByLang: Map<Language, ArticleInfo[]>): string {
  const meta = LANGUAGE_META[lang];
  const t = meta.translations;
  const isEnglish = lang === 'en';
  const sitemapFile = isEnglish ? 'sitemap.html' : `sitemap_${lang}.html`;
  const indexFile = isEnglish ? 'index.html' : `index_${lang}.html`;
  const dashboardFile = isEnglish ? 'dashboard/index.html' : `dashboard/index_${lang}.html`;
  const newsIndexFile = isEnglish ? 'news/index.html' : `news/index_${lang}.html`;

  const articles = articlesByLang.get(lang) || [];
  // Limit to 50 most recent articles for readability
  const recentArticles = articles.slice(0, 50);

  const docsSections = getDocsSections();

  // Build hreflang tags
  const hreflangTags = LANGUAGES.map((l) => {
    const hreflangCode = LANGUAGE_META[l].hreflang;
    const href = l === 'en' ? 'sitemap.html' : `sitemap_${l}.html`;
    return `    <link rel="alternate" hreflang="${hreflangCode}" href="${BASE_URL}/${href}">`;
  }).join('\n');

  // Build other language links section
  const otherLanguageLinks = LANGUAGES
    .filter((l) => l !== lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = l === 'en' ? 'sitemap.html' : `sitemap_${l}.html`;
      return `                    <li>
                        <a href="${href}">${lm.flag} ${lm.nativeName} (${lm.name})</a>
                    </li>`;
    })
    .join('\n');

  // Build multi-language platform links
  const multiLangLinks = LANGUAGES.map((l) => {
    const lm = LANGUAGE_META[l];
    const href = l === 'en' ? 'index.html' : `index_${l}.html`;
    return `                    <li>
                        <a href="${href}">${lm.flag} ${lm.nativeName} (${lm.name})</a>
                    </li>`;
  }).join('\n');

  // Build dashboard links
  const dashboardLinks = LANGUAGES.map((l) => {
    const lm = LANGUAGE_META[l];
    const dFile = l === 'en' ? 'dashboard/index.html' : `dashboard/index_${l}.html`;
    const dashPath = path.join(ROOT_DIR, dFile);
    if (!fs.existsSync(dashPath)) return '';
    return `                    <li>
                        <a href="${dFile}">${escapeHtml(t.ciaDashboard)} - ${lm.nativeName}</a>
                    </li>`;
  }).filter(Boolean).join('\n');

  // Build news article list
  const articleListHtml = recentArticles.map((article) => {
    const escapedTitle = escapeHtml(article.title);
    const escapedDesc = escapeHtml(article.description);
    return `                    <li>
                        <a href="news/${escapeHtml(article.file)}">${escapedTitle}</a>
                        ${escapedDesc ? `<p class="sitemap-description">${escapedDesc}</p>` : ''}
                    </li>`;
  }).join('\n');

  // Build docs section
  let docsHtml = '';
  if (docsSections.index || docsSections.api || docsSections.coverage || docsSections.testResults || docsSections.cypress) {
    docsHtml = `
            <section class="sitemap-section" id="documentation">
                <h2>${escapeHtml(t.documentation)}</h2>
                <ul class="sitemap-list">`;
    if (docsSections.index) {
      docsHtml += `
                    <li>
                        <a href="docs/index.html">${escapeHtml(t.documentation)}</a>
                        <p class="sitemap-description">${escapeHtml(t.apiDocsDesc)}</p>
                    </li>`;
    }
    if (docsSections.api) {
      docsHtml += `
                    <li>
                        <a href="docs/api/index.html">${escapeHtml(t.apiDocs)}</a>
                        <p class="sitemap-description">${escapeHtml(t.apiDocsDesc)}</p>
                    </li>`;
    }
    if (docsSections.coverage) {
      docsHtml += `
                    <li>
                        <a href="docs/coverage/index.html">${escapeHtml(t.coverageReports)}</a>
                        <p class="sitemap-description">${escapeHtml(t.coverageReportsDesc)}</p>
                    </li>`;
    }
    if (docsSections.testResults) {
      docsHtml += `
                    <li>
                        <a href="docs/test-results/index.html">${escapeHtml(t.testResults)}</a>
                        <p class="sitemap-description">${escapeHtml(t.testResultsDesc)}</p>
                    </li>`;
    }
    if (docsSections.cypress) {
      docsHtml += `
                    <li>
                        <a href="docs/cypress/index.html">${escapeHtml(t.testResults)} (Cypress)</a>
                        <p class="sitemap-description">${escapeHtml(t.testResultsDesc)}</p>
                    </li>`;
    }
    docsHtml += `
                </ul>
            </section>`;
  }

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${meta.dir}">
<head>
    <title>${escapeHtml(t.siteMap)} | Riksdagsmonitor</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="styles.css">
    <link rel="canonical" href="${BASE_URL}/${sitemapFile}">
    <meta name="description" content="${escapeHtml(t.completeNavigation)}">
    <meta name="keywords" content="sitemap, site navigation, riksdagsmonitor pages, Swedish parliament monitoring">
    <meta name="robots" content="index, follow">
    <meta name="author" content="James Pether Sörling, CISSP, CISM">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(t.siteMap)} | Riksdagsmonitor">
    <meta property="og:description" content="${escapeHtml(t.completeNavigation)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${BASE_URL}/${sitemapFile}">
    <meta property="og:image" content="https://riksdagsmonitor.com/images/og-image.webp">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Riksdagsmonitor ${escapeHtml(t.siteMap)}">
    <meta property="og:locale" content="${meta.locale}">
    <meta property="og:site_name" content="Riksdagsmonitor">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(t.siteMap)} | Riksdagsmonitor">
    <meta name="twitter:description" content="${escapeHtml(t.completeNavigation)}">
    <meta name="twitter:image" content="https://riksdagsmonitor.com/images/og-image.webp">
    <meta name="twitter:site" content="@riksdagsmonitor">
    
    <!-- Additional Meta Tags -->
    <meta name="theme-color" content="#0a0e27">
    <meta name="color-scheme" content="dark light">
    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/images/favicon-96x96.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">
    <link rel="icon" href="/favicon.ico" sizes="48x48">
    <link rel="manifest" href="/site.webmanifest">
    
    <!-- Hreflang tags for all language versions -->
${hreflangTags}
    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/sitemap.html">
    
    <style>
        .sitemap-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }
        
        .sitemap-header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid var(--primary-cyan);
        }
        
        .sitemap-header h1 {
            font-family: var(--font-heading);
            color: var(--primary-cyan);
            font-size: clamp(2rem, 4vw, 3rem);
            margin-bottom: 1rem;
        }
        
        .sitemap-header p {
            color: var(--light-text);
            font-size: 1.125rem;
        }
        
        .sitemap-section {
            margin-bottom: 3rem;
        }
        
        .sitemap-section h2 {
            font-family: var(--font-heading);
            color: var(--primary-magenta);
            font-size: clamp(1.5rem, 3vw, 2rem);
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--primary-magenta);
        }
        
        .sitemap-section h3 {
            font-family: var(--font-heading);
            color: var(--primary-yellow);
            font-size: 1.25rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        
        .sitemap-list {
            list-style: none;
            padding: 0;
        }
        
        .sitemap-list li {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: var(--card-bg);
            border-radius: 8px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .sitemap-list li:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0, 217, 255, 0.2);
        }
        
        .sitemap-list a {
            color: var(--primary-cyan);
            text-decoration: none;
            font-weight: 600;
            font-size: 1.125rem;
            display: block;
            margin-bottom: 0.5rem;
        }
        
        .sitemap-list a:hover {
            text-decoration: underline;
        }
        
        .sitemap-list a:focus {
            outline: 2px solid var(--primary-cyan);
            outline-offset: 2px;
        }
        
        .sitemap-description {
            color: var(--muted-text);
            font-size: 0.9375rem;
            line-height: 1.6;
        }
        
        .language-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .language-grid li {
            margin-bottom: 0;
        }
        
        @media (max-width: 768px) {
            .sitemap-container {
                padding: 1rem 0.5rem;
            }
            
            .language-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* Table of Contents */
        .toc-nav {
            background: var(--mid-bg);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            border-left: 4px solid var(--primary-cyan);
        }
        
        .toc-nav h2 {
            font-family: var(--font-heading);
            color: var(--primary-cyan);
            font-size: 1.25rem;
            margin-bottom: 1rem;
            border: none;
            padding: 0;
        }
        
        .toc-list {
            list-style: none;
            padding: 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
        }
        
        .toc-list li {
            margin: 0;
            padding: 0;
        }
        
        .toc-list a {
            color: var(--primary-cyan);
            text-decoration: none;
            display: inline-block;
            padding: 0.5rem 0;
            transition: transform 0.2s ease;
        }
        
        .toc-list a:hover {
            transform: translateX(5px);
            text-decoration: underline;
        }
        
        .toc-list a:focus {
            outline: 2px solid var(--primary-cyan);
            outline-offset: 2px;
        }
    </style>
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Riksdagsmonitor",
      "url": "${BASE_URL}",
      "description": "Swedish Parliament Intelligence Platform - Real-time monitoring, coalition predictions, and comprehensive political analysis",
      "inLanguage": ["en", "sv", "da", "nb", "fi", "de", "fr", "es", "nl", "ar", "he", "ja", "ko", "zh"],
      "publisher": {
        "@type": "Organization",
        "name": "Hack23 AB",
        "url": "https://www.hack23.com"
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SiteNavigationElement",
      "name": "${escapeHtml(t.siteMap)}",
      "url": "${BASE_URL}/${sitemapFile}",
      "inLanguage": "${lang}"
    }
    </script>
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <div class="sitemap-container">
        <header class="sitemap-header">
            <a href="${meta.langCode === 'en' ? '/index.html' : `/index_${meta.langCode}.html`}" aria-label="Riksdagsmonitor Home">
              <img src="/images/riksdagsmonitor-logo.webp" alt="Riksdagsmonitor" style="display:block;max-width:100px;height:auto;margin:0 auto 0.75rem" width="100" height="100" loading="eager">
            </a>
            <h1>${escapeHtml(t.siteMap)}</h1>
            <p>${escapeHtml(t.completeNavigation)}</p>
        </header>
        
        <!-- Quick Navigation -->
        <nav class="toc-nav" aria-label="${escapeHtml(t.quickJumpTo)}">
            <h2>${escapeHtml(t.quickJumpTo)}</h2>
            <ul class="toc-list">
                <li><a href="#main-platform">${escapeHtml(t.mainPlatform)}</a></li>
                <li><a href="#dashboards">${escapeHtml(t.dashboards)}</a></li>
                <li><a href="#news">${escapeHtml(t.newsAnalysis)}</a></li>
                <li><a href="#languages">${escapeHtml(t.multiLanguage)}</a></li>${docsHtml ? `
                <li><a href="#documentation">${escapeHtml(t.documentation)}</a></li>` : ''}
                <li><a href="#resources">${escapeHtml(t.resources)}</a></li>
                <li><a href="#sitemap-languages">${escapeHtml(t.sitemapLanguages)}</a></li>
            </ul>
        </nav>
        
        <main id="main-content">
            <!-- Main Platform Section -->
            <section class="sitemap-section" id="main-platform">
                <h2>${escapeHtml(t.mainPlatform)}</h2>
                <ul class="sitemap-list">
                    <li>
                        <a href="${indexFile}">${escapeHtml(t.home)} - ${escapeHtml(meta.nativeName)}</a>
                        <p class="sitemap-description">${escapeHtml(t.mainPlatformDesc)}</p>
                    </li>
                </ul>
            </section>
            
            <!-- Dashboards Section -->
            <section class="sitemap-section" id="dashboards">
                <h2>${escapeHtml(t.dashboards)}</h2>
                <ul class="sitemap-list">
${dashboardLinks}
                    <li>
                        <a href="politician-dashboard.html">${escapeHtml(t.politicianDashboard)}</a>
                        <p class="sitemap-description">${escapeHtml(t.politicianDashboardDesc)}</p>
                    </li>
                </ul>
            </section>
            
            <!-- News Section -->
            <section class="sitemap-section" id="news">
                <h2>${escapeHtml(t.newsAnalysis)}</h2>
                <h3>${escapeHtml(t.newsIndexPages)}</h3>
                <ul class="sitemap-list">
                    <li>
                        <a href="${newsIndexFile}">${escapeHtml(t.newsIndex)} - ${escapeHtml(meta.nativeName)}</a>
                        <p class="sitemap-description">${escapeHtml(t.newsDesc)}</p>
                    </li>
                </ul>
                ${recentArticles.length > 0 ? `
                <h3>${escapeHtml(t.recentArticles)}</h3>
                <ul class="sitemap-list">
${articleListHtml}
                </ul>` : ''}
            </section>
            
            <!-- Multi-Language Section -->
            <section class="sitemap-section" id="languages">
                <h2>${escapeHtml(t.multiLanguage)}</h2>
                <p class="sitemap-description" style="margin-bottom: 1.5rem;">${escapeHtml(t.accessPlatform)}</p>
                <ul class="sitemap-list language-grid">
${multiLangLinks}
                </ul>
            </section>
            ${docsHtml}
            <!-- Additional Resources -->
            <section class="sitemap-section" id="resources">
                <h2>${escapeHtml(t.resources)}</h2>
                <ul class="sitemap-list">
                    <li>
                        <a href="sitemap.xml">${escapeHtml(t.xmlSitemap)}</a>
                        <p class="sitemap-description">${escapeHtml(t.xmlSitemapDesc)}</p>
                    </li>
                    <li>
                        <a href="robots.txt">${escapeHtml(t.robotsTxt)}</a>
                        <p class="sitemap-description">${escapeHtml(t.robotsTxtDesc)}</p>
                    </li>
                </ul>
            </section>
            
            <!-- Other Sitemap Languages -->
            <section class="sitemap-section" id="sitemap-languages">
                <h2>${escapeHtml(t.sitemapInOtherLanguages)}</h2>
                <ul class="sitemap-list language-grid">
${otherLanguageLinks}
                </ul>
            </section>
        </main>
        
        <footer style="text-align: center; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--primary-cyan); color: var(--muted-text);">
            <p>&copy; 2026 Riksdagsmonitor | <a href="${indexFile}" style="color: var(--primary-cyan);">${escapeHtml(t.home)}</a></p>
        </footer>
    </div>
</body>
</html>`;
}

/**
 * Main function.
 */
function main(): number {
  try {
    console.log('🚀 Starting sitemap HTML generation...\n');

    const articlesByLang = getArticlesByLanguage();
    console.log(`📰 Found articles in ${articlesByLang.size} languages`);

    let generated = 0;
    for (const lang of LANGUAGES) {
      const html = generateSitemapHtml(lang, articlesByLang);
      const fileName = lang === 'en' ? 'sitemap.html' : `sitemap_${lang}.html`;
      const filePath = path.join(ROOT_DIR, fileName);
      fs.writeFileSync(filePath, html, 'utf8');
      const articleCount = (articlesByLang.get(lang) || []).length;
      console.log(`  ✅ Generated ${fileName} (${articleCount} articles)`);
      generated++;
    }

    console.log(`\n✅ Generated ${generated} sitemap HTML files`);
    return 0;
  } catch (error: unknown) {
    console.error('❌ Error generating sitemap HTML:', (error as Error).message);
    return 1;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = main();
  process.exit(exitCode);
}

export { generateSitemapHtml, getArticlesByLanguage, escapeHtml, LANGUAGE_META };
