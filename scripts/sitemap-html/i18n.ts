/**
 * @module Infrastructure/SitemapHtml/I18n/LanguageMeta
 * @category Intelligence Operations / Supporting Infrastructure
 * @name LANGUAGE_META — Per-language sitemap labels (14 languages)
 *
 * @description
 * Pure data module — `LanguageMeta` shape + `LANGUAGE_META` (one entry per
 * supported language). Contains BCP-47 hreflang code, locale, native name,
 * flag, text direction, and the localised UI strings used by every
 * sitemap_${lang}.html page.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap-html.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';

export interface LanguageMeta {
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
    articleTrustAriaLabel: string;
    articleTrustPublicSources: string;
    articleTrustAiFirst: string;
    articleTrustTraceable: string;
    articleSourcesHeading: string;
    articleSourcesDesc: string;
    articleMethodologyLabel: string;
    articleReaderGuideHeading: string;
    articleReaderGuideDesc: string;
    articleReaderGuideOsint: string;
    articleReaderGuideOsintDesc: string;
    articleReaderGuideAiFirst: string;
    articleReaderGuideAiFirstDesc: string;
    articleReaderGuideSwot: string;
    articleReaderGuideSwotDesc: string;
    articleReaderGuideTraceable: string;
    articleReaderGuideTraceableDesc: string;
    articleReaderGuideMoreMethodologies: string;
  };
}


export const LANGUAGE_META: Record<Language, LanguageMeta> = {
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
      articleTrustAriaLabel: "Article provenance and quality controls", articleTrustPublicSources: "Public sources", articleTrustAiFirst: "AI-FIRST review", articleTrustTraceable: "Traceable artifacts",
      articleSourcesHeading: "Analysis sources & methodology", articleSourcesDesc: "This article is rendered 100% from the analysis artifacts below — every claim is traceable to an auditable source file on GitHub.", articleMethodologyLabel: "Methodology",
      articleReaderGuideHeading: "Reader Intelligence Guide", articleReaderGuideDesc: "How to read this analysis — understand the methods and standards behind every article on Riksdagsmonitor.",
      articleReaderGuideOsint: "OSINT tradecraft", articleReaderGuideOsintDesc: "All data comes from publicly available parliamentary and government sources, collected using professional open-source intelligence standards.",
      articleReaderGuideAiFirst: "AI-FIRST dual-pass review", articleReaderGuideAiFirstDesc: "Every article undergoes at least two complete analysis passes — the second iteration critically revises and deepens the first, ensuring no shallow conclusions.",
      articleReaderGuideSwot: "SWOT & risk scoring", articleReaderGuideSwotDesc: "Political positions are evaluated using structured SWOT frameworks and quantitative risk scoring grounded in coalition dynamics, policy volatility, and narrative risk.",
      articleReaderGuideTraceable: "Fully traceable artifacts", articleReaderGuideTraceableDesc: "Every claim links to an auditable analysis artifact on GitHub — readers can verify any assertion by following the source links.",
      articleReaderGuideMoreMethodologies: "Explore full methodology library",
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
      articleTrustAriaLabel: "Artikelhärkomst och kvalitetskontroller", articleTrustPublicSources: "Offentliga källor", articleTrustAiFirst: "AI-FIRST granskning", articleTrustTraceable: "Spårbara artefakter",
      articleSourcesHeading: "Analyskällor och metodik", articleSourcesDesc: "Denna artikel renderas till 100 % från analysartefakterna nedan — varje påstående är spårbart till en granskningsbar källfil på GitHub.", articleMethodologyLabel: "Metodik",
      articleReaderGuideHeading: "Läsguide för underrättelseanalys", articleReaderGuideDesc: "Så läser du denna analys — förstå metoderna och standarderna bakom varje artikel på Riksdagsmonitor.",
      articleReaderGuideOsint: "OSINT-metodik", articleReaderGuideOsintDesc: "All data kommer från offentligt tillgängliga riksdags- och regeringskällor, insamlade enligt professionella standarder för öppen källinformation.",
      articleReaderGuideAiFirst: "AI-FIRST dubbelpassgranskning", articleReaderGuideAiFirstDesc: "Varje artikel genomgår minst två kompletta analyspass — den andra iterationen reviderar och fördjupar den första kritiskt, utan ytliga slutsatser.",
      articleReaderGuideSwot: "SWOT & riskbedömning", articleReaderGuideSwotDesc: "Politiska positioner utvärderas med strukturerade SWOT-ramverk och kvantitativ riskpoängsättning baserad på koalitionsdynamik, politisk volatilitet och narrativa risker.",
      articleReaderGuideTraceable: "Fullt spårbara artefakter", articleReaderGuideTraceableDesc: "Varje påstående länkar till en granskningsbar analysartefakt på GitHub — läsare kan verifiera alla påståenden genom att följa källlänkarna.",
      articleReaderGuideMoreMethodologies: "Utforska hela metodbiblioteket",
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
      articleTrustAriaLabel: "Artikelproveniens og kvalitetskontroller", articleTrustPublicSources: "Offentlige kilder", articleTrustAiFirst: "AI-FIRST gennemgang", articleTrustTraceable: "Sporbare artefakter",
      articleSourcesHeading: "Analysekilder og metodik", articleSourcesDesc: "Denne artikel er renderet 100 % fra analyseartefakterne nedenfor — enhver påstand er sporbar til en reviderbar kildefil på GitHub.", articleMethodologyLabel: "Metodik",
      articleReaderGuideHeading: "Læserguide til efterretningsanalyse", articleReaderGuideDesc: "Sådan læser du denne analyse — forstå metoderne og standarderne bag hver artikel på Riksdagsmonitor.",
      articleReaderGuideOsint: "OSINT-metodik", articleReaderGuideOsintDesc: "Alle data stammer fra offentligt tilgængelige parlaments- og regeringskilder, indsamlet efter professionelle OSINT-standarder.",
      articleReaderGuideAiFirst: "AI-FIRST dobbeltgennemgang", articleReaderGuideAiFirstDesc: "Hver artikel gennemgår mindst to komplette analysepas — anden iteration reviderer og uddyber den første kritisk.",
      articleReaderGuideSwot: "SWOT & risikovurdering", articleReaderGuideSwotDesc: "Politiske positioner vurderes med strukturerede SWOT-rammer og kvantitativ risikoscoring baseret på koalitionsdynamik og politisk volatilitet.",
      articleReaderGuideTraceable: "Fuldt sporbare artefakter", articleReaderGuideTraceableDesc: "Enhver påstand linker til en reviderbar analyseartefakt på GitHub — læsere kan verificere alle påstande.",
      articleReaderGuideMoreMethodologies: "Udforsk det fulde metodbibliotek",
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
      articleTrustAriaLabel: "Artikelproveniens og kvalitetskontroller", articleTrustPublicSources: "Offentlige kilder", articleTrustAiFirst: "AI-FIRST gjennomgang", articleTrustTraceable: "Sporbare artefakter",
      articleSourcesHeading: "Analysekilder og metodikk", articleSourcesDesc: "Denne artikkelen er gjengitt 100 % fra analyseartefaktene nedenfor — enhver påstand er sporbar til en reviderbar kildefil på GitHub.", articleMethodologyLabel: "Metodikk",
      articleReaderGuideHeading: "Leserguide for etterretningsanalyse", articleReaderGuideDesc: "Slik leser du denne analysen — forstå metodene og standardene bak hver artikkel på Riksdagsmonitor.",
      articleReaderGuideOsint: "OSINT-metodikk", articleReaderGuideOsintDesc: "Alle data kommer fra offentlig tilgjengelige parlamentariske og statlige kilder, samlet inn etter profesjonelle OSINT-standarder.",
      articleReaderGuideAiFirst: "AI-FIRST dobbeltgjennomgang", articleReaderGuideAiFirstDesc: "Hver artikkel gjennomgår minst to komplette analysepass — den andre iterasjonen reviderer og utdyper den første kritisk.",
      articleReaderGuideSwot: "SWOT & risikovurdering", articleReaderGuideSwotDesc: "Politiske posisjoner vurderes med strukturerte SWOT-rammeverk og kvantitativ risikoscoring basert på koalisjonsdynamikk og politisk volatilitet.",
      articleReaderGuideTraceable: "Fullt sporbare artefakter", articleReaderGuideTraceableDesc: "Enhver påstand lenker til en reviderbar analyseartefakt på GitHub — lesere kan verifisere alle påstander.",
      articleReaderGuideMoreMethodologies: "Utforsk hele metodbiblioteket",
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
      articleTrustAriaLabel: "Artikkelin alkuperä ja laadunvalvonta", articleTrustPublicSources: "Julkiset lähteet", articleTrustAiFirst: "AI-FIRST tarkastus", articleTrustTraceable: "Jäljitettävät artefaktit",
      articleSourcesHeading: "Analyysilähteet ja metodologia", articleSourcesDesc: "Tämä artikkeli on tuotettu 100 % alla olevista analyysiartifakteista — jokainen väite on jäljitettävissä tarkastettavaan lähdetiedostoon GitHubissa.", articleMethodologyLabel: "Metodologia",
      articleReaderGuideHeading: "Lukijan tiedusteluopas", articleReaderGuideDesc: "Näin luet tätä analyysiä — ymmärrä Riksdagsmonitorin artikkeleiden takana olevat menetelmät ja standardit.",
      articleReaderGuideOsint: "OSINT-menetelmät", articleReaderGuideOsintDesc: "Kaikki data tulee julkisesti saatavilla olevista parlamentaarisista ja hallituksen lähteistä, kerätty ammattimaisten OSINT-standardien mukaisesti.",
      articleReaderGuideAiFirst: "AI-FIRST kaksoisläpikäynti", articleReaderGuideAiFirstDesc: "Jokainen artikkeli käy läpi vähintään kaksi täydellistä analyysikierrosta — toinen iteraatio arvioi ja syventää ensimmäistä kriittisesti.",
      articleReaderGuideSwot: "SWOT ja riskiarviointi", articleReaderGuideSwotDesc: "Poliittisia kantoja arvioidaan rakenteisilla SWOT-kehyksillä ja määrällisellä riskipisteyttämisellä koalitiodynamiikan ja poliittisen volatiliteetin perusteella.",
      articleReaderGuideTraceable: "Täysin jäljitettävät artefaktit", articleReaderGuideTraceableDesc: "Jokainen väite linkittää tarkastettavaan analyysiartifaktiin GitHubissa — lukijat voivat todentaa kaikki väitteet.",
      articleReaderGuideMoreMethodologies: "Tutustu koko menetelmäkirjastoon",
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
      articleTrustAriaLabel: "Artikelherkunft und Qualitätskontrollen", articleTrustPublicSources: "Öffentliche Quellen", articleTrustAiFirst: "AI-FIRST Prüfung", articleTrustTraceable: "Nachvollziehbare Artefakte",
      articleSourcesHeading: "Analysequellen und Methodik", articleSourcesDesc: "Dieser Artikel wird zu 100 % aus den unten aufgeführten Analyseartefakten gerendert — jede Behauptung ist auf eine überprüfbare Quelldatei auf GitHub zurückführbar.", articleMethodologyLabel: "Methodik",
      articleReaderGuideHeading: "Leserguide zur Nachrichtenanalyse", articleReaderGuideDesc: "So lesen Sie diese Analyse — verstehen Sie die Methoden und Standards hinter jedem Artikel auf Riksdagsmonitor.",
      articleReaderGuideOsint: "OSINT-Methodik", articleReaderGuideOsintDesc: "Alle Daten stammen aus öffentlich zugänglichen parlamentarischen und staatlichen Quellen, gesammelt nach professionellen OSINT-Standards.",
      articleReaderGuideAiFirst: "AI-FIRST Doppelprüfung", articleReaderGuideAiFirstDesc: "Jeder Artikel durchläuft mindestens zwei vollständige Analysedurchgänge — die zweite Iteration überprüft und vertieft die erste kritisch.",
      articleReaderGuideSwot: "SWOT & Risikobewertung", articleReaderGuideSwotDesc: "Politische Positionen werden mit strukturierten SWOT-Rahmen und quantitativer Risikobewertung basierend auf Koalitionsdynamik und politischer Volatilität bewertet.",
      articleReaderGuideTraceable: "Vollständig nachverfolgbare Artefakte", articleReaderGuideTraceableDesc: "Jede Behauptung verlinkt auf ein überprüfbares Analyseartefakt auf GitHub — Leser können alle Aussagen verifizieren.",
      articleReaderGuideMoreMethodologies: "Gesamte Methodenbibliothek erkunden",
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
      articleTrustAriaLabel: "Provenance de l'article et contrôles qualité", articleTrustPublicSources: "Sources publiques", articleTrustAiFirst: "Examen AI-FIRST", articleTrustTraceable: "Artefacts traçables",
      articleSourcesHeading: "Sources d'analyse et méthodologie", articleSourcesDesc: "Cet article est rendu à 100 % à partir des artefacts d'analyse ci-dessous — chaque affirmation est traçable à un fichier source vérifiable sur GitHub.", articleMethodologyLabel: "Méthodologie",
      articleReaderGuideHeading: "Guide de lecture du renseignement", articleReaderGuideDesc: "Comment lire cette analyse — comprenez les méthodes et les normes derrière chaque article de Riksdagsmonitor.",
      articleReaderGuideOsint: "Méthodologie OSINT", articleReaderGuideOsintDesc: "Toutes les données proviennent de sources parlementaires et gouvernementales accessibles au public, collectées selon les normes professionnelles de renseignement en source ouverte.",
      articleReaderGuideAiFirst: "Double révision AI-FIRST", articleReaderGuideAiFirstDesc: "Chaque article subit au moins deux passes d'analyse complètes — la seconde itération révise et approfondit la première de manière critique.",
      articleReaderGuideSwot: "SWOT et évaluation des risques", articleReaderGuideSwotDesc: "Les positions politiques sont évaluées à l'aide de cadres SWOT structurés et d'une notation quantitative des risques basée sur la dynamique des coalitions et la volatilité politique.",
      articleReaderGuideTraceable: "Artefacts entièrement traçables", articleReaderGuideTraceableDesc: "Chaque affirmation renvoie à un artefact d'analyse vérifiable sur GitHub — les lecteurs peuvent vérifier toute assertion.",
      articleReaderGuideMoreMethodologies: "Explorer la bibliothèque de méthodologies",
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
      articleTrustAriaLabel: "Procedencia del artículo y controles de calidad", articleTrustPublicSources: "Fuentes públicas", articleTrustAiFirst: "Revisión AI-FIRST", articleTrustTraceable: "Artefactos rastreables",
      articleSourcesHeading: "Fuentes de análisis y metodología", articleSourcesDesc: "Este artículo se renderiza al 100 % a partir de los artefactos de análisis a continuación — cada afirmación es rastreable a un archivo fuente auditable en GitHub.", articleMethodologyLabel: "Metodología",
      articleReaderGuideHeading: "Guía de lectura de inteligencia", articleReaderGuideDesc: "Cómo leer este análisis — comprenda los métodos y estándares detrás de cada artículo en Riksdagsmonitor.",
      articleReaderGuideOsint: "Metodología OSINT", articleReaderGuideOsintDesc: "Todos los datos provienen de fuentes parlamentarias y gubernamentales de acceso público, recopilados según estándares profesionales de inteligencia de fuentes abiertas.",
      articleReaderGuideAiFirst: "Doble revisión AI-FIRST", articleReaderGuideAiFirstDesc: "Cada artículo pasa por al menos dos pasadas de análisis completas — la segunda iteración revisa y profundiza críticamente la primera.",
      articleReaderGuideSwot: "SWOT y evaluación de riesgos", articleReaderGuideSwotDesc: "Las posiciones políticas se evalúan con marcos SWOT estructurados y puntuación cuantitativa de riesgos basada en dinámica de coaliciones y volatilidad política.",
      articleReaderGuideTraceable: "Artefactos completamente rastreables", articleReaderGuideTraceableDesc: "Cada afirmación enlaza a un artefacto de análisis auditable en GitHub — los lectores pueden verificar cualquier aseveración.",
      articleReaderGuideMoreMethodologies: "Explorar la biblioteca de metodologías",
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
      articleTrustAriaLabel: "Artikelherkomst en kwaliteitscontroles", articleTrustPublicSources: "Openbare bronnen", articleTrustAiFirst: "AI-FIRST controle", articleTrustTraceable: "Traceerbare artefacten",
      articleSourcesHeading: "Analysebronnen en methodologie", articleSourcesDesc: "Dit artikel is voor 100 % gerenderd uit de onderstaande analyse-artefacten — elke bewering is herleidbaar tot een controleerbaar bronbestand op GitHub.", articleMethodologyLabel: "Methodologie",
      articleReaderGuideHeading: "Lezersgids voor inlichtingenanalyse", articleReaderGuideDesc: "Zo leest u deze analyse — begrijp de methoden en standaarden achter elk artikel op Riksdagsmonitor.",
      articleReaderGuideOsint: "OSINT-methodologie", articleReaderGuideOsintDesc: "Alle gegevens komen uit openbaar toegankelijke parlementaire en overheidsbronnen, verzameld volgens professionele OSINT-standaarden.",
      articleReaderGuideAiFirst: "AI-FIRST dubbele beoordeling", articleReaderGuideAiFirstDesc: "Elk artikel doorloopt ten minste twee volledige analyseronden — de tweede iteratie herziet en verdiept de eerste kritisch.",
      articleReaderGuideSwot: "SWOT en risicobeoordeling", articleReaderGuideSwotDesc: "Politieke posities worden beoordeeld met gestructureerde SWOT-kaders en kwantitatieve risicoscoring op basis van coalitiedynamiek en politieke volatiliteit.",
      articleReaderGuideTraceable: "Volledig traceerbare artefacten", articleReaderGuideTraceableDesc: "Elke bewering linkt naar een controleerbaar analyse-artefact op GitHub — lezers kunnen elke uitspraak verifiëren.",
      articleReaderGuideMoreMethodologies: "Verken de volledige methodenbibliotheek",
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
      articleTrustAriaLabel: "مصدر المقال وضوابط الجودة", articleTrustPublicSources: "مصادر عامة", articleTrustAiFirst: "مراجعة AI-FIRST", articleTrustTraceable: "مصنوعات قابلة للتتبع",
      articleSourcesHeading: "مصادر التحليل والمنهجية", articleSourcesDesc: "تم إنشاء هذا المقال بنسبة 100% من مصنوعات التحليل أدناه — كل ادعاء يمكن تتبعه إلى ملف مصدر قابل للتدقيق على GitHub.", articleMethodologyLabel: "المنهجية",
      articleReaderGuideHeading: "دليل القارئ للتحليل الاستخباراتي", articleReaderGuideDesc: "كيف تقرأ هذا التحليل — افهم المناهج والمعايير وراء كل مقال في Riksdagsmonitor.",
      articleReaderGuideOsint: "منهجية المصادر المفتوحة", articleReaderGuideOsintDesc: "جميع البيانات مستمدة من مصادر برلمانية وحكومية متاحة للعموم، تم جمعها وفقًا لمعايير الاستخبارات مفتوحة المصدر المهنية.",
      articleReaderGuideAiFirst: "مراجعة AI-FIRST مزدوجة", articleReaderGuideAiFirstDesc: "يخضع كل مقال لجولتين تحليليتين كاملتين على الأقل — تراجع الجولة الثانية الأولى وتعمقها بشكل نقدي.",
      articleReaderGuideSwot: "SWOT وتقييم المخاطر", articleReaderGuideSwotDesc: "يتم تقييم المواقف السياسية باستخدام أطر SWOT منظمة وتسجيل كمي للمخاطر بناءً على ديناميكيات الائتلاف والتقلب السياسي.",
      articleReaderGuideTraceable: "مصنوعات قابلة للتتبع بالكامل", articleReaderGuideTraceableDesc: "كل ادعاء يرتبط بمصنوع تحليل قابل للتدقيق على GitHub — يمكن للقراء التحقق من أي تأكيد.",
      articleReaderGuideMoreMethodologies: "استكشف مكتبة المناهج الكاملة",
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
      articleTrustAriaLabel: "מקור המאמר ובקרות איכות", articleTrustPublicSources: "מקורות ציבוריים", articleTrustAiFirst: "סקירת AI-FIRST", articleTrustTraceable: "פריטי מקור עקיבים",
      articleSourcesHeading: "מקורות ניתוח ומתודולוגיה", articleSourcesDesc: "מאמר זה מופק ב-100% מפריטי הניתוח שלהלן — כל טענה ניתנת למעקב לקובץ מקור ניתן לביקורת ב-GitHub.", articleMethodologyLabel: "מתודולוגיה",
      articleReaderGuideHeading: "מדריך קריאה למודיעין", articleReaderGuideDesc: "כיצד לקרוא ניתוח זה — הבן את השיטות והסטנדרטים מאחורי כל מאמר ב-Riksdagsmonitor.",
      articleReaderGuideOsint: "מתודולוגיית OSINT", articleReaderGuideOsintDesc: "כל הנתונים מגיעים ממקורות פרלמנטריים וממשלתיים הנגישים לציבור, שנאספו לפי סטנדרטים מקצועיים של מודיעין מקורות פתוחים.",
      articleReaderGuideAiFirst: "סקירה כפולה AI-FIRST", articleReaderGuideAiFirstDesc: "כל מאמר עובר לפחות שני מעברי ניתוח מלאים — האיטרציה השנייה סוקרת ומעמיקה את הראשונה באופן ביקורתי.",
      articleReaderGuideSwot: "SWOT והערכת סיכונים", articleReaderGuideSwotDesc: "עמדות פוליטיות מוערכות באמצעות מסגרות SWOT מובנות ודירוג סיכונים כמותי המבוסס על דינמיקת קואליציה ותנודתיות פוליטית.",
      articleReaderGuideTraceable: "ממצאים הניתנים למעקב מלא", articleReaderGuideTraceableDesc: "כל טענה מקושרת למימצא ניתוח הניתן לביקורת ב-GitHub — קוראים יכולים לאמת כל קביעה.",
      articleReaderGuideMoreMethodologies: "חקור את ספריית המתודולוגיות המלאה",
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
      articleTrustAriaLabel: "記事の出所と品質管理", articleTrustPublicSources: "公開ソース", articleTrustAiFirst: "AI-FIRSTレビュー", articleTrustTraceable: "追跡可能なアーティファクト",
      articleSourcesHeading: "分析ソースと方法論", articleSourcesDesc: "この記事は以下の分析アーティファクトから100%レンダリングされています — すべての主張はGitHub上の監査可能なソースファイルに遡ることができます。", articleMethodologyLabel: "方法論",
      articleReaderGuideHeading: "読者のためのインテリジェンスガイド", articleReaderGuideDesc: "この分析の読み方 — Riksdagsmonitorの各記事の背後にある手法と基準を理解してください。",
      articleReaderGuideOsint: "OSINTの手法", articleReaderGuideOsintDesc: "すべてのデータは、公開されている議会および政府の情報源から、プロフェッショナルなOSINT基準に従って収集されています。",
      articleReaderGuideAiFirst: "AI-FIRSTデュアルパスレビュー", articleReaderGuideAiFirstDesc: "各記事は少なくとも2回の完全な分析パスを経ます — 2回目の反復は最初の結果を批判的に見直し、深掘りします。",
      articleReaderGuideSwot: "SWOTとリスク評価", articleReaderGuideSwotDesc: "政治的立場は、連立力学と政治的変動性に基づく構造化SWOTフレームワークと定量的リスクスコアリングで評価されます。",
      articleReaderGuideTraceable: "完全に追跡可能なアーティファクト", articleReaderGuideTraceableDesc: "すべての主張はGitHub上の監査可能な分析アーティファクトにリンクしています — 読者はすべての主張を検証できます。",
      articleReaderGuideMoreMethodologies: "方法論ライブラリ全体を探索",
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
      articleTrustAriaLabel: "기사 출처 및 품질 관리", articleTrustPublicSources: "공개 출처", articleTrustAiFirst: "AI-FIRST 검토", articleTrustTraceable: "추적 가능한 아티팩트",
      articleSourcesHeading: "분석 출처 및 방법론", articleSourcesDesc: "이 기사는 아래 분석 아티팩트로부터 100% 렌더링됩니다 — 모든 주장은 GitHub의 감사 가능한 소스 파일로 추적할 수 있습니다.", articleMethodologyLabel: "방법론",
      articleReaderGuideHeading: "독자를 위한 정보 분석 가이드", articleReaderGuideDesc: "이 분석을 읽는 방법 — Riksdagsmonitor의 모든 기사 뒤에 있는 방법과 기준을 이해하세요.",
      articleReaderGuideOsint: "OSINT 방법론", articleReaderGuideOsintDesc: "모든 데이터는 공개적으로 이용 가능한 의회 및 정부 출처에서 전문적인 공개 출처 정보 표준에 따라 수집됩니다.",
      articleReaderGuideAiFirst: "AI-FIRST 이중 검토", articleReaderGuideAiFirstDesc: "모든 기사는 최소 두 번의 완전한 분석 과정을 거칩니다 — 두 번째 반복은 첫 번째를 비판적으로 검토하고 심화합니다.",
      articleReaderGuideSwot: "SWOT 및 위험 평가", articleReaderGuideSwotDesc: "정치적 입장은 연합 역학과 정치적 변동성에 기반한 구조화된 SWOT 프레임워크와 정량적 위험 점수로 평가됩니다.",
      articleReaderGuideTraceable: "완전 추적 가능한 아티팩트", articleReaderGuideTraceableDesc: "모든 주장은 GitHub의 감사 가능한 분석 아티팩트에 연결됩니다 — 독자는 모든 주장을 검증할 수 있습니다.",
      articleReaderGuideMoreMethodologies: "전체 방법론 라이브러리 탐색",
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
      articleTrustAriaLabel: "文章来源与质量控制", articleTrustPublicSources: "公开来源", articleTrustAiFirst: "AI-FIRST审查", articleTrustTraceable: "可追溯产物",
      articleSourcesHeading: "分析来源与方法论", articleSourcesDesc: "本文100%由以下分析产物渲染 — 每项声明均可追溯到GitHub上可审计的源文件。", articleMethodologyLabel: "方法论",
      articleReaderGuideHeading: "读者情报指南", articleReaderGuideDesc: "如何阅读本分析 — 了解Riksdagsmonitor每篇文章背后的方法和标准。",
      articleReaderGuideOsint: "OSINT方法论", articleReaderGuideOsintDesc: "所有数据来源于公开可用的议会和政府信息，按照专业开源情报标准收集。",
      articleReaderGuideAiFirst: "AI-FIRST双重审查", articleReaderGuideAiFirstDesc: "每篇文章至少经过两轮完整的分析 — 第二轮迭代批判性地审查和深化第一轮的结论。",
      articleReaderGuideSwot: "SWOT与风险评估", articleReaderGuideSwotDesc: "政治立场通过结构化SWOT框架和基于联盟动态与政治波动性的定量风险评分进行评估。",
      articleReaderGuideTraceable: "完全可追溯的工件", articleReaderGuideTraceableDesc: "每项声明都链接到GitHub上可审计的分析工件 — 读者可以验证任何断言。",
      articleReaderGuideMoreMethodologies: "探索完整方法论库",
    },
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

