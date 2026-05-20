/**
 * @module generate-news-indexes/constants/languages
 * @description Single source of truth for the 14-language LANGUAGES record
 * used by the news-index renderer. Per-language UI strings, filter labels,
 * Schema.org descriptions, and SEO keywords are colocated here so that
 * adding/editing a language is a one-file change.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { LanguageCode, LanguageConfig } from '../types.js';

/**
 * Full language configuration for all 14 supported languages.
 * Each entry contains translations for titles, subtitles, filters,
 * breadcrumbs, SEO keywords, and Schema.org descriptions.
 */
export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: {
    name: 'English', code: 'en', locale: 'en_US',
    title: 'News',
    subtitle: 'Latest news and analysis from Sweden\'s Riksdag. AI-generated political intelligence based on OSINT/INTOP data covering parliament, government, and agencies.',
    keywords: 'riksdag news, swedish parliament, government bills, committee reports, propositions, motions, parliamentary votes, political analysis, Sweden Democrats, Social Democrats, Moderaterna, coalition politics, transparency, democracy',
    breadcrumbs: { home: 'Home', news: 'News' },
    backLink: 'Back to Main',
    filters: {
      type: 'Type:', allTypes: 'All types', prospective: 'Prospective', retrospective: 'Retrospective', analysis: 'Analysis', breaking: 'Breaking news',
      topic: 'Topic:', allTopics: 'All Topics', parliament: 'Parliament', government: 'Government', defense: 'Defense', environment: 'Environment', committees: 'Committees', legislation: 'Legislation',
      sort: 'Sort:', newest: 'Newest First', oldest: 'Oldest First', titleSort: 'Title'
    },
    noResults: 'No articles matched the filters',
    i18n: { noArticles: 'No articles available', search: 'Search:', searchPlaceholder: 'Search articles...', loadMore: 'Load more articles', showing: 'Showing {shown} of {total} articles' },
    aiNewsroomTitle: 'AI-Disrupted News Generation',
    aiNewsroomText: 'Riksdagsmonitor\'s agentic news generation pipeline is the world\'s first fully AI-driven political intelligence newsroom for parliamentary monitoring. Powered by Claude Opus via GitHub Copilot Coding Agent, our 10 specialized workflows (9 scheduled + 1 on-demand) autonomously produce deep political analysis \u2014 not shallow summaries, but structured intelligence products with source verification, multi-party balance, and GDPR-compliant OSINT methodology.',
    disclaimer: 'Ongoing improvements \u2014 please',
    disclaimerLink: 'report any issues on GitHub',
    schemaDescription: 'Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency'
  },
  sv: {
    name: 'Svenska', code: 'sv', locale: 'sv_SE',
    title: 'Nyheter',
    subtitle: 'Senaste nyheterna och analyser från Sveriges Riksdag. AI-genererad politisk intelligens baserad på OSINT/INTOP-data om riksdag, regering och myndigheter.',
    keywords: 'riksdag nyheter, svenska riksdagen, propositioner, betänkanden, motioner, utskott, voteringar, politisk analys, Socialdemokraterna, Moderaterna, Sverigedemokraterna, koalitionspolitik, öppenhet, demokrati',
    breadcrumbs: { home: 'Hem', news: 'Nyheter' },
    backLink: 'Tillbaka till huvudsidan',
    filters: {
      type: 'Typ:', allTypes: 'Alla typer', prospective: 'Framåtblickande', retrospective: 'Återblickande', analysis: 'Analys', breaking: 'Senaste nytt',
      topic: 'Ämne:', allTopics: 'Alla ämnen', parliament: 'Riksdagen', government: 'Regeringen', defense: 'Försvar', environment: 'Miljö', committees: 'Utskott', legislation: 'Lagstiftning',
      sort: 'Sortera:', newest: 'Nyast först', oldest: 'Äldst först', titleSort: 'Titel'
    },
    noResults: 'Inga artiklar matchade filtren',
    i18n: { noArticles: 'Inga artiklar tillgängliga', search: 'Sök:', searchPlaceholder: 'Sök artiklar...', loadMore: 'Ladda fler artiklar', showing: 'Visar {shown} av {total} artiklar' },
    aiNewsroomTitle: 'AI-styrd nyhetsproduktion',
    aiNewsroomText: 'Riksdagsmonitors agentbaserade nyhetsproduktionskedja \u00e4r v\u00e4rldens f\u00f6rsta helt AI-drivna politiska underr\u00e4ttelseredaktion f\u00f6r parlaments\u00f6vervakning. Med kraft fr\u00e5n Claude Opus via GitHub Copilot Coding Agent producerar v\u00e5ra 10 specialiserade arbetsfl\u00f6den (9 schemalagda + 1 vid behov) sj\u00e4lvst\u00e4ndigt djupg\u00e5ende politiska analyser \u2014 inte ytliga sammanfattningar, utan strukturerade underr\u00e4ttelseprodukter med k\u00e4llverifiering, flerpartibalans och GDPR-kompatibel OSINT-metodik.',
    disclaimer: 'P\u00e5g\u00e5ende f\u00f6rb\u00e4ttringar \u2014 v\u00e4nligen',
    disclaimerLink: 'rapportera eventuella problem p\u00e5 GitHub',
    schemaDescription: 'Svensk riksdagsbevakning - Övervaka politisk aktivitet med systematisk transparens'
  },
  da: {
    name: 'Dansk', code: 'da', locale: 'da_DK',
    title: 'Nyheder',
    subtitle: 'Seneste nyheder og analyser fra Sveriges Rigsdag. AI-genereret politisk efterretningsjournalistik baseret på OSINT/INTOP-data.',
    keywords: 'riksdag nyheder, svensk parlament, regeringsforslag, udvalgsbetænkninger, afstemninger, politisk analyse, svenske partier, gennemsigtighed, demokrati',
    breadcrumbs: { home: 'Hjem', news: 'Nyheder' },
    backLink: 'Tilbage til hovedsiden',
    filters: {
      type: 'Type:', allTypes: 'Alle typer', prospective: 'Fremadrettet', retrospective: 'Tilbageblik', analysis: 'Analyse', breaking: 'Seneste nyt',
      topic: 'Emne:', allTopics: 'Alle emner', parliament: 'Parlamentet', government: 'Regeringen', defense: 'Forsvar', environment: 'Miljø', committees: 'Udvalg', legislation: 'Lovgivning',
      sort: 'Sorter:', newest: 'Nyeste først', oldest: 'Ældste først', titleSort: 'Titel'
    },
    noResults: 'Ingen artikler matchede filtrene',
    i18n: { noArticles: 'Ingen artikler tilgængelige', search: 'Søg:', searchPlaceholder: 'Søg artikler...', loadMore: 'Indlæs flere artikler', showing: 'Viser {shown} af {total} artikler' },
    aiNewsroomTitle: 'AI-disrupteret nyhedsgenerering',
    aiNewsroomText: 'Riksdagsmonitors agentbaserede nyhedsgenereringspipeline er verdens f\u00f8rste fuldt AI-drevne politiske efterretningsnyhedsredaktion til parlamentarisk overv\u00e5gning. Drevet af Claude Opus via GitHub Copilot Coding Agent producerer vores 10 specialiserede arbejdsgange (9 planlagte + 1 on-demand) autonomt dybdeg\u00e5ende politiske analyser \u2014 ikke overfladiske resum\u00e9er, men strukturerede efterretningsprodukter med kildeverificering, flerpartisk balance og GDPR-kompatibel OSINT-metodologi.',
    disclaimer: 'L\u00f8bende forbedringer \u2014 venligst',
    disclaimerLink: 'rapporter eventuelle problemer p\u00e5 GitHub',
    schemaDescription: 'Svensk parlamentsovervågning - Overvåg politisk aktivitet med systematisk gennemsigtighed'
  },
  no: {
    name: 'Norsk', code: 'nb', locale: 'nb_NO',
    title: 'Nyheter',
    subtitle: 'Siste nyheter og analyser fra Sveriges Riksdag. AI-generert politisk etterretningsjournalistikk basert på OSINT/INTOP-data.',
    keywords: 'riksdag nyheter, svensk parlament, regjeringsforslag, komitéinnstillinger, voteringer, politisk analyse, svenske partier, åpenhet, demokrati',
    breadcrumbs: { home: 'Hjem', news: 'Nyheter' },
    backLink: 'Tilbake til hovedsiden',
    filters: {
      type: 'Type:', allTypes: 'Alle typer', prospective: 'Fremtidsrettet', retrospective: 'Tilbakeblikk', analysis: 'Analyse', breaking: 'Siste nytt',
      topic: 'Emne:', allTopics: 'Alle emner', parliament: 'Parlamentet', government: 'Regjeringen', defense: 'Forsvar', environment: 'Miljø', committees: 'Utvalg', legislation: 'Lovgivning',
      sort: 'Sorter:', newest: 'Nyeste først', oldest: 'Eldste først', titleSort: 'Tittel'
    },
    noResults: 'Ingen artikler matchet filtrene',
    i18n: { noArticles: 'Ingen artikler tilgjengelige', search: 'Søk:', searchPlaceholder: 'Søk artikler...', loadMore: 'Last flere artikler', showing: 'Viser {shown} av {total} artikler' },
    aiNewsroomTitle: 'AI-drevet nyhetsproduksjon',
    aiNewsroomText: 'Riksdagsmonitors agentbaserte nyhetsproduksjonslinje er verdens f\u00f8rste fullt AI-drevne politiske etterretningsredaksjon for parlamentarisk overv\u00e5king. Drevet av Claude Opus via GitHub Copilot Coding Agent produserer v\u00e5re 10 spesialiserte arbeidsflyter (9 planlagte + 1 ved behov) autonomt dyptg\u00e5ende politiske analyser \u2014 ikke overfladiske sammendrag, men strukturerte etterretningsprodukter med kildeverifisering, flerpartisk balanse og GDPR-kompatibel OSINT-metodikk.',
    disclaimer: 'P\u00e5g\u00e5ende forbedringer \u2014 vennligst',
    disclaimerLink: 'rapporter eventuelle problemer p\u00e5 GitHub',
    schemaDescription: 'Svensk parlamentsovervåking - Overvåk politisk aktivitet med systematisk åpenhet'
  },
  fi: {
    name: 'Suomi', code: 'fi', locale: 'fi_FI',
    title: 'Uutiset',
    subtitle: 'Viimeisimmät uutiset ja analyysit Ruotsin valtiopäivistä. Tekoälyn tuottamaa poliittista tiedustelujournalismia OSINT/INTOP-dataan perustuen.',
    keywords: 'riksdag uutiset, ruotsin parlamentti, hallituksen esitykset, valiokunnan mietinnöt, äänestykset, poliittinen analyysi, ruotsin puolueet, avoimuus, demokratia',
    breadcrumbs: { home: 'Etusivu', news: 'Uutiset' },
    backLink: 'Takaisin etusivulle',
    filters: {
      type: 'Tyyppi:', allTypes: 'Kaikki tyypit', prospective: 'Ennakoiva', retrospective: 'Takautuva', analysis: 'Analyysi', breaking: 'Viimeisimmät',
      topic: 'Aihe:', allTopics: 'Kaikki aiheet', parliament: 'Parlamentti', government: 'Hallitus', defense: 'Puolustus', environment: 'Ympäristö', committees: 'Valiokunnat', legislation: 'Lainsäädäntö',
      sort: 'Järjestä:', newest: 'Uusimmat ensin', oldest: 'Vanhimmat ensin', titleSort: 'Otsikko'
    },
    noResults: 'Mikään artikkeli ei vastannut suodattimia',
    i18n: { noArticles: 'Ei artikkeleita saatavilla', search: 'Haku:', searchPlaceholder: 'Hae artikkeleita...', loadMore: 'Lataa lisää artikkeleita', showing: 'Näytetään {shown} / {total} artikkelia' },
    aiNewsroomTitle: 'AI-ohjattu uutistuotanto',
    aiNewsroomText: 'Riksdagsmonitorin agenttipohjainen uutistuotantoputki on maailman ensimm\u00e4inen t\u00e4ysin teko\u00e4lyll\u00e4 toimiva poliittisen tiedustelun uutistoimitus parlamenttiseurantaa varten. Claude Opus -mallin ja GitHub Copilot Coding Agent -agentin voimin 10 erikoistunutta ty\u00f6nkulkua (9 ajastettua + 1 tarvittaessa k\u00e4ynnistett\u00e4v\u00e4) tuottaa itsen\u00e4isesti syv\u00e4llist\u00e4 poliittista analyysi\u00e4 \u2014 ei pinnallisia yhteenvetoja, vaan rakenteistettuja tiedustelutuotteita, joissa on l\u00e4hteiden varmistus, monipuolueinen tasapaino ja GDPR-yhteensopiva OSINT-menetelm\u00e4.',
    disclaimer: 'Jatkuvia parannuksia \u2014 ole hyv\u00e4 ja',
    disclaimerLink: 'ilmoita mahdollisista ongelmista GitHubissa',
    schemaDescription: 'Ruotsin parlamenttiseuranta - Seuraa poliittista toimintaa järjestelmällisellä avoimuudella'
  },
  de: {
    name: 'Deutsch', code: 'de', locale: 'de_DE',
    title: 'Nachrichten',
    subtitle: 'Neueste Nachrichten und Analysen aus dem schwedischen Reichstag. KI-generierter politischer Nachrichtendienst-Journalismus basierend auf OSINT/INTOP-Daten.',
    keywords: 'riksdag nachrichten, schwedisches parlament, regierungsvorlagen, ausschussberichte, abstimmungen, politische analyse, schwedische parteien, transparenz, demokratie',
    breadcrumbs: { home: 'Startseite', news: 'Nachrichten' },
    backLink: 'Zurück zur Hauptseite',
    filters: {
      type: 'Typ:', allTypes: 'Alle Typen', prospective: 'Vorausschauend', retrospective: 'Rückblickend', analysis: 'Analyse', breaking: 'Eilmeldungen',
      topic: 'Thema:', allTopics: 'Alle Themen', parliament: 'Parlament', government: 'Regierung', defense: 'Verteidigung', environment: 'Umwelt', committees: 'Ausschüsse', legislation: 'Gesetzgebung',
      sort: 'Sortieren:', newest: 'Neueste zuerst', oldest: 'Älteste zuerst', titleSort: 'Titel'
    },
    noResults: 'Keine Artikel entsprachen den Filtern',
    i18n: { noArticles: 'Keine Artikel verfügbar', search: 'Suche:', searchPlaceholder: 'Artikel suchen...', loadMore: 'Mehr Artikel laden', showing: 'Zeige {shown} von {total} Artikeln' },
    aiNewsroomTitle: 'KI-gest\u00fctzte Nachrichtenproduktion',
    aiNewsroomText: 'Die agentenbasierte Nachrichtenpipeline von Riksdagsmonitor ist der weltweit erste vollst\u00e4ndig KI-gesteuerte Newsroom f\u00fcr politische Intelligence im Parlamentsmonitoring. Angetrieben von Claude Opus \u00fcber den GitHub Copilot Coding Agent erzeugen unsere 10 spezialisierten Workflows (9 geplante + 1 On-Demand) autonom tiefgehende politische Analysen \u2014 keine oberfl\u00e4chlichen Zusammenfassungen, sondern strukturierte Intelligence-Produkte mit Quellenpr\u00fcfung, multiperspektivischer Parteibalance und DSGVO-konformer OSINT-Methodik.',
    disclaimer: 'Laufende Verbesserungen \u2014 bitte',
    disclaimerLink: 'melden Sie Probleme auf GitHub',
    schemaDescription: 'Schwedische Parlamentsüberwachung - Politische Aktivitäten mit systematischer Transparenz verfolgen'
  },
  fr: {
    name: 'Français', code: 'fr', locale: 'fr_FR',
    title: 'Actualités',
    subtitle: 'Dernières nouvelles et analyses du Riksdag suédois. Journalisme de renseignement politique généré par IA basé sur des données OSINT/INTOP.',
    keywords: 'riksdag actualités, parlement suédois, projets de loi, rapports de commission, motions parlementaires, votes, analyse politique, partis suédois, transparence, démocratie',
    breadcrumbs: { home: 'Accueil', news: 'Actualités' },
    backLink: 'Retour à l\'accueil',
    filters: {
      type: 'Type :', allTypes: 'Tous types', prospective: 'Prospectif', retrospective: 'Rétrospectif', analysis: 'Analyse', breaking: 'Dernières nouvelles',
      topic: 'Sujet :', allTopics: 'Tous sujets', parliament: 'Parlement', government: 'Gouvernement', defense: 'Défense', environment: 'Environnement', committees: 'Comités', legislation: 'Législation',
      sort: 'Trier :', newest: 'Plus récent', oldest: 'Plus ancien', titleSort: 'Titre'
    },
    noResults: 'Aucun article ne correspond aux filtres',
    i18n: { noArticles: 'Aucun article disponible', search: 'Recherche :', searchPlaceholder: 'Rechercher des articles...', loadMore: 'Charger plus d\'articles', showing: 'Affichage de {shown} sur {total} articles' },
    aiNewsroomTitle: 'R\u00e9daction d\'actualit\u00e9s pilot\u00e9e par l\'IA',
    aiNewsroomText: 'Le pipeline de g\u00e9n\u00e9ration d\'actualit\u00e9s agentique de Riksdagsmonitor est la premi\u00e8re r\u00e9daction d\'intelligence politique enti\u00e8rement pilot\u00e9e par l\'IA d\u00e9di\u00e9e au suivi parlementaire. Propuls\u00e9s par Claude Opus via GitHub Copilot Coding Agent, nos 10 flux de travail sp\u00e9cialis\u00e9s (9 planifi\u00e9s + 1 \u00e0 la demande) produisent de mani\u00e8re autonome des analyses politiques approfondies \u2014 non pas de simples r\u00e9sum\u00e9s, mais de v\u00e9ritables produits d\'intelligence structur\u00e9s avec v\u00e9rification des sources, \u00e9quilibre multipartite et m\u00e9thodologie OSINT conforme au RGPD.',
    disclaimer: 'Am\u00e9liorations en cours \u2014 veuillez',
    disclaimerLink: 'signaler tout probl\u00e8me sur GitHub',
    schemaDescription: 'Surveillance du Parlement suédois - Suivre l\'activité politique avec une transparence systématique'
  },
  es: {
    name: 'Español', code: 'es', locale: 'es_ES',
    title: 'Noticias',
    subtitle: 'Últimas noticias y análisis del Parlamento sueco. Periodismo de inteligencia política generado por IA basado en datos OSINT/INTOP.',
    keywords: 'riksdag noticias, parlamento sueco, proyectos de ley, informes de comité, mociones parlamentarias, votaciones, análisis político, partidos suecos, transparencia, democracia',
    breadcrumbs: { home: 'Inicio', news: 'Noticias' },
    backLink: 'Volver a la página principal',
    filters: {
      type: 'Tipo:', allTypes: 'Todos los tipos', prospective: 'Prospectivo', retrospective: 'Retrospectivo', analysis: 'Análisis', breaking: 'Última hora',
      topic: 'Tema:', allTopics: 'Todos los temas', parliament: 'Parlamento', government: 'Gobierno', defense: 'Defensa', environment: 'Medio ambiente', committees: 'Comités', legislation: 'Legislación',
      sort: 'Ordenar:', newest: 'Más reciente', oldest: 'Más antiguo', titleSort: 'Título'
    },
    noResults: 'Ningún artículo coincidió con los filtros',
    i18n: { noArticles: 'No hay artículos disponibles', search: 'Buscar:', searchPlaceholder: 'Buscar artículos...', loadMore: 'Cargar más artículos', showing: 'Mostrando {shown} de {total} artículos' },
    aiNewsroomTitle: 'Redacci\u00f3n de noticias impulsada por IA',
    aiNewsroomText: 'La cadena agente de generaci\u00f3n de noticias de Riksdagsmonitor es la primera redacci\u00f3n de inteligencia pol\u00edtica del mundo totalmente impulsada por IA para el monitoreo parlamentario. Impulsada por Claude Opus a trav\u00e9s de GitHub Copilot Coding Agent, nuestras 10 canalizaciones especializadas (9 programadas y 1 bajo demanda) producen de forma aut\u00f3noma an\u00e1lisis pol\u00edticos profundos \u2014 no simples res\u00famenes, sino productos de inteligencia estructurados con verificaci\u00f3n de fuentes, equilibrio multipartidista y una metodolog\u00eda OSINT compatible con el RGPD.',
    disclaimer: 'Mejoras en curso \u2014 por favor',
    disclaimerLink: 'reporte cualquier problema en GitHub',
    schemaDescription: 'Monitoreo del Parlamento sueco - Seguimiento de la actividad política con transparencia sistemática'
  },
  nl: {
    name: 'Nederlands', code: 'nl', locale: 'nl_NL',
    title: 'Nieuws',
    subtitle: 'Laatste nieuws en analyses uit het Zweedse Parlement. AI-gegenereerde politieke inlichtingenjournalistiek gebaseerd op OSINT/INTOP-data.',
    keywords: 'riksdag nieuws, zweeds parlement, wetsvoorstellen, commissieverslagen, parlementaire moties, stemmingen, politieke analyse, zweedse partijen, transparantie, democratie',
    breadcrumbs: { home: 'Home', news: 'Nieuws' },
    backLink: 'Terug naar hoofdpagina',
    filters: {
      type: 'Type:', allTypes: 'Alle types', prospective: 'Vooruitziend', retrospective: 'Terugblik', analysis: 'Analyse', breaking: 'Laatste nieuws',
      topic: 'Onderwerp:', allTopics: 'Alle onderwerpen', parliament: 'Parlement', government: 'Regering', defense: 'Defensie', environment: 'Milieu', committees: 'Commissies', legislation: 'Wetgeving',
      sort: 'Sorteren:', newest: 'Nieuwste eerst', oldest: 'Oudste eerst', titleSort: 'Titel'
    },
    noResults: 'Geen artikelen voldeden aan de filters',
    i18n: { noArticles: 'Geen artikelen beschikbaar', search: 'Zoeken:', searchPlaceholder: 'Artikelen zoeken...', loadMore: 'Meer artikelen laden', showing: 'Toon {shown} van {total} artikelen' },
    aiNewsroomTitle: 'AI-gestuurde nieuwsproductie',
    aiNewsroomText: 'De agentische nieuwsproductiepijplijn van Riksdagsmonitor is \'s werelds eerste volledig AI-gestuurde politieke-intelligentie-nieuwsredactie voor parlementaire monitoring. Aangedreven door Claude Opus via de GitHub Copilot Coding Agent produceren onze 10 gespecialiseerde workflows (9 gepland + 1 on-demand) autonoom diepgaande politieke analyses \u2014 geen oppervlakkige samenvattingen, maar gestructureerde inlichtingenproducten met bronverificatie, meerpartijenbalans en een AVG-conforme OSINT-methodologie.',
    disclaimer: 'Doorlopende verbeteringen \u2014 gelieve',
    disclaimerLink: 'eventuele problemen te melden op GitHub',
    schemaDescription: 'Zweeds parlementair toezicht - Volg politieke activiteit met systematische transparantie'
  },
  ar: {
    name: 'العربية', code: 'ar', locale: 'ar_SA', rtl: true,
    title: 'أخبار',
    subtitle: 'آخر الأخبار والتحليلات من البرلمان السويدي. صحافة استخبارات سياسية مولّدة بالذكاء الاصطناعي مبنية على بيانات OSINT/INTOP.',
    keywords: 'أخبار البرلمان, البرلمان السويدي, مشاريع القوانين, تقارير اللجان, التصويت, تحليل سياسي, الأحزاب السويدية, شفافية, ديمقراطية',
    breadcrumbs: { home: 'الرئيسية', news: 'أخبار' },
    backLink: 'العودة إلى الصفحة الرئيسية',
    filters: {
      type: 'النوع:', allTypes: 'جميع الأنواع', prospective: 'استشرافي', retrospective: 'استعادي', analysis: 'تحليل', breaking: 'أخبار عاجلة',
      topic: 'الموضوع:', allTopics: 'جميع المواضيع', parliament: 'البرلمان', government: 'الحكومة', defense: 'الدفاع', environment: 'البيئة', committees: 'اللجان', legislation: 'التشريعات',
      sort: 'الترتيب:', newest: 'الأحدث أولاً', oldest: 'الأقدم أولاً', titleSort: 'العنوان'
    },
    noResults: 'لا توجد مقالات تطابق الفلاتر',
    i18n: { noArticles: 'لا توجد مقالات متاحة', search: 'بحث:', searchPlaceholder: 'ابحث في المقالات...', loadMore: 'تحميل المزيد من المقالات', showing: 'عرض {shown} من {total} مقالات' },
    aiNewsroomTitle: '\u0625\u0646\u062a\u0627\u062c \u0627\u0644\u0623\u062e\u0628\u0627\u0631 \u0627\u0644\u0645\u0639\u0637\u064e\u0651\u0644 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
    aiNewsroomText: '\u062e\u0637 \u0625\u0646\u062a\u0627\u062c \u0627\u0644\u0623\u062e\u0628\u0627\u0631 \u0627\u0644\u0630\u0643\u064a \u0641\u064a Riksdagsmonitor \u0647\u0648 \u0623\u0648\u0644 \u063a\u0631\u0641\u0629 \u0623\u062e\u0628\u0627\u0631 \u0627\u0633\u062a\u062e\u0628\u0627\u0631\u0627\u062a \u0633\u064a\u0627\u0633\u064a\u0629 \u0641\u064a \u0627\u0644\u0639\u0627\u0644\u0645 \u062a\u0639\u0645\u0644 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0628\u0631\u0644\u0645\u0627\u0646\u0627\u062a. \u0645\u062f\u0639\u0648\u0645 \u0628\u0646\u0645\u0648\u0630\u062c Claude Opus \u0639\u0628\u0631 GitHub Copilot Coding Agent\u060c \u062a\u0642\u0648\u0645 10 \u0645\u0633\u0627\u0631\u0627\u062a \u0639\u0645\u0644 \u0645\u062a\u062e\u0635\u0635\u0629 (9 \u0645\u062c\u062f\u0648\u0644\u0629 + 1 \u062d\u0633\u0628 \u0627\u0644\u0637\u0644\u0628) \u0628\u0625\u0646\u062a\u0627\u062c \u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0633\u064a\u0627\u0633\u064a\u0629 \u0645\u0639\u0645\u0651\u0642\u0629 \u0628\u0634\u0643\u0644 \u0630\u0627\u062a\u064a \u2014 \u0644\u064a\u0633\u062a \u0645\u0644\u062e\u0635\u0627\u062a \u0633\u0637\u062d\u064a\u0629\u060c \u0628\u0644 \u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0633\u062a\u062e\u0628\u0627\u0631\u0627\u062a\u064a\u0629 \u0645\u0646\u0638\u0645\u0629 \u0645\u0639 \u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u0635\u0627\u062f\u0631\u060c \u0648\u062a\u0648\u0627\u0632\u0646 \u0628\u064a\u0646 \u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u062d\u0632\u0627\u0628\u060c \u0648\u0645\u0646\u0647\u062c\u064a\u0629 OSINT \u0645\u062a\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 \u0627\u0644\u0644\u0627\u0626\u062d\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a (GDPR).',
    disclaimer: '\u062a\u062d\u0633\u064a\u0646\u0627\u062a \u0645\u0633\u062a\u0645\u0631\u0629 \u2014 \u064a\u0631\u062c\u0649',
    disclaimerLink: '\u0627\u0644\u0625\u0628\u0644\u0627\u063a \u0639\u0646 \u0623\u064a \u0645\u0634\u0627\u0643\u0644 \u0639\u0644\u0649 GitHub',
    schemaDescription: 'مراقبة البرلمان السويدي - متابعة النشاط السياسي بشفافية منهجية'
  },
  he: {
    name: 'עברית', code: 'he', locale: 'he_IL', rtl: true,
    title: 'חדשות',
    subtitle: 'חדשות ואנליזות אחרונות מהפרלמנט השוודי. עיתונות מודיעין פוליטי מבוססת AI ונתוני OSINT/INTOP.',
    keywords: 'חדשות הפרלמנט, הפרלמנט השוודי, הצעות חוק, דוחות ועדות, הצבעות, ניתוח פוליטי, מפלגות שוודיות, שקיפות, דמוקרטיה',
    breadcrumbs: { home: 'בית', news: 'חדשות' },
    backLink: 'חזרה לדף הבית',
    filters: {
      type: 'סוג:', allTypes: 'כל הסוגים', prospective: 'פרוספקטיבי', retrospective: 'רטרוספקטיבי', analysis: 'ניתוח', breaking: 'חדשות אחרונות',
      topic: 'נושא:', allTopics: 'כל הנושאים', parliament: 'פרלמנט', government: 'ממשלה', defense: 'הגנה', environment: 'סביבה', committees: 'ועדות', legislation: 'חקיקה',
      sort: 'מיון:', newest: 'החדש ביותר', oldest: 'הישן ביותר', titleSort: 'כותרת'
    },
    noResults: 'אין מאמרים שתואמים את הסינון',
    i18n: { noArticles: 'אין מאמרים זמינים', search: 'חיפוש:', searchPlaceholder: 'חפש מאמרים...', loadMore: 'טען עוד מאמרים', showing: 'מציג {shown} מתוך {total} מאמרים' },
    aiNewsroomTitle: '\u05d7\u05d3\u05e8 \u05d7\u05d3\u05e9\u05d5\u05ea \u05e4\u05d5\u05dc\u05d9\u05d8\u05d9\u05d5\u05ea \u05de\u05d5\u05e0\u05e2 \u05d1\u05d9\u05e0\u05d4 \u05de\u05dc\u05d0\u05db\u05d5\u05ea\u05d9\u05ea',
    aiNewsroomText: '\u05e6\u05d9\u05e0\u05d5\u05e8 \u05d9\u05e6\u05d9\u05e8\u05ea \u05d4\u05d7\u05d3\u05e9\u05d5\u05ea \u05d4\u05d0\u05d5\u05d8\u05d5\u05e0\u05d5\u05de\u05d9 \u05e9\u05dc Riksdagsmonitor \u05d4\u05d5\u05d0 \u05d7\u05d3\u05e8 \u05d4\u05d7\u05d3\u05e9\u05d5\u05ea \u05d4\u05e8\u05d0\u05e9\u05d5\u05df \u05d1\u05e2\u05d5\u05dc\u05dd \u05dc\u05e0\u05d9\u05d8\u05d5\u05e8 \u05e4\u05e8\u05dc\u05de\u05e0\u05d8\u05e8\u05d9 \u05e9\u05de\u05d5\u05e4\u05e2\u05dc \u05db\u05d5\u05dc\u05d5 \u05d1\u05d1\u05d9\u05e0\u05d4 \u05de\u05dc\u05d0\u05db\u05d5\u05ea\u05d9\u05ea. \u05d1\u05e2\u05d6\u05e8\u05ea Claude Opus \u05d3\u05e8\u05da GitHub Copilot Coding Agent, \u05e2\u05e9\u05e8\u05d4 \u05ea\u05d6\u05e8\u05d9\u05de\u05d9 \u05e2\u05d1\u05d5\u05d3\u05d4 \u05de\u05ea\u05de\u05d7\u05d9\u05dd (9 \u05de\u05ea\u05d5\u05d6\u05de\u05e0\u05d9\u05dd + 1 \u05dc\u05e4\u05d9 \u05d3\u05e8\u05d9\u05e9\u05d4) \u05de\u05d9\u05d9\u05e6\u05e8\u05d9\u05dd \u05d1\u05d0\u05d5\u05e4\u05df \u05e2\u05e6\u05de\u05d0\u05d9 \u05e0\u05d9\u05ea\u05d5\u05d7 \u05e4\u05d5\u05dc\u05d9\u05d8\u05d9 \u05e2\u05de\u05d5\u05e7 \u2014 \u05dc\u05d0 \u05ea\u05e7\u05e6\u05d9\u05e8\u05d9\u05dd \u05e9\u05d8\u05d7\u05d9\u05d9\u05dd, \u05d0\u05dc\u05d0 \u05de\u05d5\u05e6\u05e8\u05d9 \u05de\u05d5\u05d3\u05d9\u05e2\u05d9\u05df \u05de\u05d5\u05d1\u05e0\u05d9\u05dd \u05e2\u05dd \u05d0\u05d9\u05de\u05d5\u05ea \u05de\u05e7\u05d5\u05e8\u05d5\u05ea, \u05d0\u05d9\u05d6\u05d5\u05df \u05d1\u05d9\u05df \u05de\u05e4\u05dc\u05d2\u05d5\u05ea \u05d5\u05de\u05ea\u05d5\u05d3\u05d5\u05dc\u05d5\u05d2\u05d9\u05d9\u05ea OSINT \u05d4\u05ea\u05d5\u05d0\u05de\u05ea \u05dc-GDPR.',
    disclaimer: '\u05e9\u05d9\u05e4\u05d5\u05e8\u05d9\u05dd \u05de\u05ea\u05de\u05e9\u05db\u05d9\u05dd \u2014 \u05e0\u05d0',
    disclaimerLink: '\u05dc\u05d3\u05d5\u05d5\u05d7 \u05e2\u05dc \u05d1\u05e2\u05d9\u05d5\u05ea \u05d1-GitHub',
    schemaDescription: 'ניטור הפרלמנט השוודי - מעקב אחר פעילות פוליטית בשקיפות שיטתית'
  },
  ja: {
    name: '日本語', code: 'ja', locale: 'ja_JP',
    title: 'ニュース',
    subtitle: 'スウェーデン国会からの最新ニュースと分析。OSINT/INTOPデータに基づくAI生成の政治インテリジェンスジャーナリズム。',
    keywords: '国会ニュース, スウェーデン議会, 政府法案, 委員会報告, 採決, 政治分析, スウェーデン政党, 透明性, 民主主義',
    breadcrumbs: { home: 'ホーム', news: 'ニュース' },
    backLink: 'ホームページに戻る',
    filters: {
      type: '種類：', allTypes: 'すべてのタイプ', prospective: '予測', retrospective: '振り返り', analysis: '分析', breaking: '速報',
      topic: 'トピック：', allTopics: 'すべてのトピック', parliament: '議会', government: '政府', defense: '防衛', environment: '環境', committees: '委員会', legislation: '立法',
      sort: '並び替え：', newest: '最新順', oldest: '古い順', titleSort: 'タイトル'
    },
    noResults: 'フィルターに一致する記事がありません',
    i18n: { noArticles: '記事がありません', search: '検索：', searchPlaceholder: '記事を検索...', loadMore: 'さらに記事を読み込む', showing: '{shown} / {total} 件の記事' },
    aiNewsroomTitle: 'AI\u306b\u3088\u308b\u30cb\u30e5\u30fc\u30b9\u751f\u6210\u9769\u547d',
    aiNewsroomText: 'Riksdagsmonitor \u306e\u30a8\u30fc\u30b8\u30a7\u30f3\u30c8\u578b\u30cb\u30e5\u30fc\u30b9\u751f\u6210\u30d1\u30a4\u30d7\u30e9\u30a4\u30f3\u306f\u3001\u8b70\u4f1a\u30e2\u30cb\u30bf\u30ea\u30f3\u30b0\u306e\u305f\u3081\u306e\u4e16\u754c\u521d\u306e\u30d5\u30ebAI\u99c6\u52d5\u578b\u300c\u653f\u6cbb\u30a4\u30f3\u30c6\u30ea\u30b8\u30a7\u30f3\u30b9\u30fb\u30cb\u30e5\u30fc\u30b9\u30eb\u30fc\u30e0\u300d\u3067\u3059\u3002GitHub Copilot Coding Agent \u7d4c\u7531\u3067\u52d5\u4f5c\u3059\u308b Claude Opus \u3092\u4e2d\u6838\u306b\u300110\u500b\u306e\u5c02\u9580\u30ef\u30fc\u30af\u30d5\u30ed\u30fc\uff08\u5b9a\u671f\u5b9f\u884c9\u672c\uff0b\u30aa\u30f3\u30c7\u30de\u30f3\u30c91\u672c\uff09\u304c\u3001\u81ea\u5f8b\u7684\u306b\u9ad8\u5ea6\u306a\u653f\u6cbb\u5206\u6790\u3092\u751f\u6210\u3057\u307e\u3059\u3002\u5358\u306a\u308b\u8981\u7d04\u3067\u306f\u306a\u304f\u3001\u60c5\u5831\u6e90\u691c\u8a3c\u3001\u8907\u6570\u653f\u515a\u3078\u306e\u516c\u5e73\u6027\u3001GDPR\u306b\u6e96\u62e0\u3057\u305fOSINT\u624b\u6cd5\u306b\u57fa\u3065\u304f\u69cb\u9020\u5316\u30a4\u30f3\u30c6\u30ea\u30b8\u30a7\u30f3\u30b9\u3068\u3057\u3066\u63d0\u4f9b\u3057\u307e\u3059\u3002',
    disclaimer: '\u7d99\u7d9a\u7684\u306a\u6539\u5584\u3092\u884c\u3063\u3066\u3044\u307e\u3059 \u2014',
    disclaimerLink: '\u554f\u984c\u304c\u3042\u308c\u3070GitHub\u3067\u5831\u544a\u3057\u3066\u304f\u3060\u3055\u3044',
    schemaDescription: 'スウェーデン議会監視プラットフォーム - 体系的な透明性で政治活動を監視'
  },
  ko: {
    name: '한국어', code: 'ko', locale: 'ko_KR',
    title: '뉴스',
    subtitle: '스웨덴 의회의 최신 뉴스 및 분석. OSINT/INTOP 데이터 기반 AI 생성 정치 인텔리전스 저널리즘.',
    keywords: '의회 뉴스, 스웨덴 의회, 정부 법안, 위원회 보고서, 표결, 정치 분석, 스웨덴 정당, 투명성, 민주주의',
    breadcrumbs: { home: '홈', news: '뉴스' },
    backLink: '홈페이지로 돌아가기',
    filters: {
      type: '유형:', allTypes: '모든 유형', prospective: '전망', retrospective: '회고', analysis: '분석', breaking: '속보',
      topic: '주제:', allTopics: '모든 주제', parliament: '의회', government: '정부', defense: '국방', environment: '환경', committees: '위원회', legislation: '입법',
      sort: '정렬:', newest: '최신순', oldest: '오래된 순', titleSort: '제목'
    },
    noResults: '필터와 일치하는 기사가 없습니다',
    i18n: { noArticles: '기사가 없습니다', search: '검색:', searchPlaceholder: '기사 검색...', loadMore: '더 많은 기사 불러오기', showing: '{shown} / {total} 개 기사' },
    aiNewsroomTitle: 'AI \ud601\uc2e0 \ub274\uc2a4 \uc0dd\uc131',
    aiNewsroomText: 'Riksdagsmonitor\uc758 \uc5d0\uc774\uc804\ud2b8\ud615 \ub274\uc2a4 \uc0dd\uc131 \ud30c\uc774\ud504\ub77c\uc778\uc740 \uc758\ud68c \ubaa8\ub2c8\ud130\ub9c1\uc744 \uc704\ud55c \uc138\uacc4 \ucd5c\ucd08\uc758 \uc644\uc804 AI \uae30\ubc18 \uc815\uce58 \uc778\ud154\ub9ac\uc804\uc2a4 \ub274\uc2a4\ub8f8\uc785\ub2c8\ub2e4. GitHub Copilot Coding Agent\ub97c \ud1b5\ud574 Claude Opus\ub85c \uad6c\ub3d9\ub418\uba70, 10\uac1c\uc758 \uc804\ubb38 \uc6cc\ud06c\ud50c\ub85c(\uc608\uc57d 9\uac1c + \uc8fc\ubb38\ud615 1\uac1c)\uac00 \uc790\uc728\uc801\uc73c\ub85c \uc2ec\uce35 \uc815\uce58 \ubd84\uc11d\uc744 \uc0dd\uc131\ud569\ub2c8\ub2e4. \uc774\ub294 \ub2e8\uc21c \uc694\uc57d\uc774 \uc544\ub2c8\ub77c \ucd9c\ucc98 \uac80\uc99d, \ub2e4\ub2f9\uc81c \uade0\ud615, GDPR\uc744 \uc900\uc218\ud558\ub294 OSINT \ubc29\ubc95\ub860\uc744 \uac16\ucd98 \uad6c\uc870\ud654\ub41c \uc778\ud154\ub9ac\uc804\uc2a4 \ub9ac\ud3ec\ud2b8\uc785\ub2c8\ub2e4.',
    disclaimer: '\uc9c0\uc18d\uc801\uc73c\ub85c \uac1c\uc120 \uc911\uc785\ub2c8\ub2e4 \u2014',
    disclaimerLink: '\ubb38\uc81c\uac00 \uc788\uc73c\uba74 GitHub\uc5d0 \ubcf4\uace0\ud574\uc8fc\uc138\uc694',
    schemaDescription: '스웨덴 의회 모니터링 플랫폼 - 체계적인 투명성으로 정치 활동 감시'
  },
  zh: {
    name: '中文', code: 'zh', locale: 'zh_CN',
    title: '新闻',
    subtitle: '来自瑞典议会的最新新闻和分析。基于OSINT/INTOP数据的AI生成政治情报新闻。',
    keywords: '议会新闻, 瑞典议会, 政府法案, 委员会报告, 表决, 政治分析, 瑞典政党, 透明度, 民主',
    breadcrumbs: { home: '主页', news: '新闻' },
    backLink: '返回主页',
    filters: {
      type: '类型：', allTypes: '所有类型', prospective: '前瞻', retrospective: '回顾', analysis: '分析', breaking: '最新消息',
      topic: '主题：', allTopics: '所有主题', parliament: '议会', government: '政府', defense: '国防', environment: '环境', committees: '委员会', legislation: '立法',
      sort: '排序：', newest: '最新优先', oldest: '最旧优先', titleSort: '标题'
    },
    noResults: '没有与过滤器匹配的文章',
    i18n: { noArticles: '没有可用的文章', search: '搜索：', searchPlaceholder: '搜索文章...', loadMore: '加载更多文章', showing: '显示 {shown} / {total} 篇文章' },
    aiNewsroomTitle: 'AI \u9a71\u52a8\u7684\u65b0\u95fb\u60c5\u62a5\u751f\u4ea7',
    aiNewsroomText: 'Riksdagsmonitor \u7684\u4ee3\u7406\u5f0f\u65b0\u95fb\u751f\u6210\u6d41\u6c34\u7ebf\uff0c\u662f\u5168\u7403\u9996\u4e2a\u4e13\u6ce8\u8bae\u4f1a\u76d1\u6d4b\u7684\u5168\u81ea\u52a8 AI \u653f\u6cbb\u60c5\u62a5\u65b0\u95fb\u5ba4\u3002\u4f9d\u6258\u901a\u8fc7 GitHub Copilot Coding Agent \u8c03\u7528\u7684 Claude Opus\uff0c\u6211\u4eec\u7684 10 \u6761\u4e13\u4e1a\u5de5\u4f5c\u6d41\uff089 \u6761\u5b9a\u65f6\u4efb\u52a1 + 1 \u6761\u6309\u9700\u89e6\u53d1\uff09\u53ef\u4ee5\u81ea\u4e3b\u751f\u6210\u6df1\u5ea6\u653f\u6cbb\u5206\u6790\u2014\u2014\u4e0d\u662f\u6d45\u5c42\u6458\u8981\uff0c\u800c\u662f\u5305\u542b\u6765\u6e90\u6838\u67e5\u3001\u591a\u515a\u6d3e\u89c6\u89d2\u5e73\u8861\uff0c\u5e76\u9075\u5faa GDPR \u7684 OSINT \u65b9\u6cd5\u8bba\u7684\u7ed3\u6784\u5316\u60c5\u62a5\u4ea7\u54c1\u3002',
    disclaimer: '\u6301\u7eed\u6539\u8fdb\u4e2d\u2014\u2014\u8bf7',
    disclaimerLink: '\u5728 GitHub \u4e0a\u62a5\u544a\u4efb\u4f55\u95ee\u9898',
    schemaDescription: '瑞典议会监督平台 - 以系统化透明度监测政治活动'
  }
};
