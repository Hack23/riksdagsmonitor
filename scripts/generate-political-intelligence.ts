/**
 * @module Infrastructure/PoliticalIntelligence
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Political Intelligence Index Generation — Multi-Language
 *
 * @description
 * Generates a polished political-intelligence_{lang}.html page for each of the
 * 14 supported languages. The page catalogues the analytical foundation of the
 * platform — all methodologies and templates (linked back to GitHub) plus every
 * artifact published under analysis/daily/ — so analysts, journalists, and
 * search engines can discover Riksdagsmonitor's evidence-based intelligence
 * work in a single, richly cross-linked document.
 *
 * The page shares its visual language with the site (cyberpunk header/footer,
 * styles.css) and ships with comprehensive SEO metadata (canonical, Open
 * Graph, Twitter Card, JSON-LD CollectionPage, hreflang alternates).
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';
import { LANGUAGE_META, escapeHtml } from './generate-sitemap-html.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧠 Political Intelligence HTML Generation');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = 'https://riksdagsmonitor.com';
const GITHUB_BLOB = 'https://github.com/Hack23/riksdagsmonitor/blob/main';
const GITHUB_TREE = 'https://github.com/Hack23/riksdagsmonitor/tree/main';
const ROOT_DIR = path.join(__dirname, '..');
const ANALYSIS_DIR = path.join(ROOT_DIR, 'analysis');
const METHODOLOGIES_DIR = path.join(ANALYSIS_DIR, 'methodologies');
const TEMPLATES_DIR = path.join(ANALYSIS_DIR, 'templates');
const DAILY_DIR = path.join(ANALYSIS_DIR, 'daily');

const LANGUAGES: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

// ---------------------------------------------------------------------------
// Per-language UI strings for the political-intelligence page
// ---------------------------------------------------------------------------

interface PiTranslations {
  readonly title: string;
  readonly subtitle: string;
  readonly intro: string;
  readonly metaDescription: string;
  readonly metaKeywords: string;
  readonly quickJumpTo: string;
  readonly methodologies: string;
  readonly methodologiesDesc: string;
  readonly templates: string;
  readonly templatesDesc: string;
  readonly dailyArtifacts: string;
  readonly dailyArtifactsDesc: string;
  readonly openOnGithub: string;
  readonly browseDirectoryOnGithub: string;
  readonly browseAllDays: string;
  readonly artifacts: string;
  readonly stream: string;
  readonly home: string;
  readonly sitemap: string;
  readonly recentDays: string;
  readonly olderDays: string;
  readonly showMore: string;
  readonly backToTop: string;
  /** Label for the expandable artifact listing under each stream. */
  readonly expandArtifacts: string;
  /** Accessible label e.g. "N artifacts in stream" */
  readonly artifactsLabel: string;
  /** Link label for opening the documents/ subfolder */
  readonly documentsFolder: string;
  /** Short generic description for per-document analysis artifacts (e.g. hd01au11-analysis.md). */
  readonly documentAnalysisDesc: string;
  /** Short generic description for per-document raw JSON artifacts. */
  readonly documentJsonDesc: string;
  /** Generic word "Analysis" used in generated artifact titles. */
  readonly analysisWord: string;
  /** Generic word "Data" used in generated artifact titles (for .json artifacts). */
  readonly dataWord: string;
  /** Other-language switcher heading. */
  readonly otherLanguages: string;
  /** Skip-link anchor label. */
  readonly skipToMain: string;
}

const PI_TRANSLATIONS: Record<Language, PiTranslations> = {
  en: {
    title: 'Political Intelligence',
    subtitle: 'Methodologies, templates, and the full daily analytical output of Riksdagsmonitor',
    intro: 'Riksdagsmonitor produces evidence-based political intelligence for the Swedish Parliament and Government using a disciplined analytical framework. This index exposes the complete methodology library, the reusable analysis templates, and every daily intelligence artifact — each linked back to GitHub for full auditability.',
    metaDescription: 'Complete index of Riksdagsmonitor political intelligence assets: methodologies, analysis templates, and daily artifacts covering the Swedish Parliament and Government.',
    metaKeywords: 'political intelligence, Riksdagsmonitor, OSINT, analysis methodologies, analysis templates, Swedish Parliament, Riksdagen, political analysis, intelligence framework',
    quickJumpTo: 'Quick Jump To',
    methodologies: 'Methodologies',
    methodologiesDesc: 'Canonical frameworks that govern every analysis produced on the platform — from AI-driven protocols and political-risk scoring to threat, SWOT, and reference-quality standards.',
    templates: 'Analysis Templates',
    templatesDesc: 'Structured output templates used by every agentic workflow to guarantee consistent, Mermaid-rich, confidence-labeled intelligence products.',
    dailyArtifacts: 'Daily Analysis Artifacts',
    dailyArtifactsDesc: 'Every artifact published under analysis/daily/, grouped by date and content stream (propositions, motions, interpellations, committee reports, evening analysis, realtime snapshots, deep inspections, and more).',
    openOnGithub: 'Open on GitHub',
    browseDirectoryOnGithub: 'Browse the full directory on GitHub',
    browseAllDays: 'Browse every analysis day on GitHub',
    artifacts: 'artifacts',
    stream: 'stream',
    home: 'Home',
    sitemap: 'Sitemap',
    recentDays: 'Most recent analysis days',
    olderDays: 'Earlier analysis days',
    showMore: 'Show more',
    backToTop: 'Back to top',
    expandArtifacts: 'Show individual artifacts',
    artifactsLabel: 'artifacts in this stream',
    documentsFolder: 'Source documents',
    documentAnalysisDesc: 'Per-document intelligence analysis with structured metadata and Mermaid visualisations.',
    documentJsonDesc: 'Structured JSON payload extracted from the source parliamentary document.',
    analysisWord: 'Analysis',
    dataWord: 'Data',
    otherLanguages: 'Read this page in another language',
    skipToMain: 'Skip to main content',
  },
  sv: {
    title: 'Politisk underrättelse',
    subtitle: 'Metoder, mallar och Riksdagsmonitors fullständiga dagliga analysunderlag',
    intro: 'Riksdagsmonitor producerar evidensbaserad politisk underrättelse om Sveriges riksdag och regering enligt ett strikt analytiskt ramverk. Detta index visar hela metodbiblioteket, de återanvändbara analysmallarna och varje dagligt underrättelseartifakt — alla länkade till GitHub för full spårbarhet.',
    metaDescription: 'Komplett index över Riksdagsmonitors politiska underrättelsetillgångar: metoder, analysmallar och dagliga artifakter om Sveriges riksdag och regering.',
    metaKeywords: 'politisk underrättelse, Riksdagsmonitor, OSINT, analysmetoder, analysmallar, riksdagen, Sveriges riksdag, politisk analys, underrättelseramverk',
    quickJumpTo: 'Snabbnavigering',
    methodologies: 'Metoder',
    methodologiesDesc: 'Kanoniska ramverk som styr varje analys på plattformen — från AI-drivna protokoll och politisk riskbedömning till hot-, SWOT- och referenskvalitetsstandarder.',
    templates: 'Analysmallar',
    templatesDesc: 'Strukturerade outputmallar som används av varje agentiskt arbetsflöde för att garantera konsekventa, Mermaid-rika och förtroendemärkta underrättelseprodukter.',
    dailyArtifacts: 'Dagliga analysartefakter',
    dailyArtifactsDesc: 'Varje artefakt som publiceras under analysis/daily/, grupperad efter datum och innehållsström (propositioner, motioner, interpellationer, betänkanden, kvällsanalyser, realtidsavbildningar, djupgranskningar m.fl.).',
    openOnGithub: 'Öppna på GitHub',
    browseDirectoryOnGithub: 'Bläddra i hela katalogen på GitHub',
    browseAllDays: 'Bläddra i alla analysdagar på GitHub',
    artifacts: 'artefakter',
    stream: 'ström',
    home: 'Hem',
    sitemap: 'Webbplatskarta',
    recentDays: 'Senaste analysdagarna',
    olderDays: 'Tidigare analysdagar',
    showMore: 'Visa fler',
    backToTop: 'Tillbaka till toppen',
    expandArtifacts: 'Visa enskilda artefakter',
    artifactsLabel: 'artefakter i strömmen',
    documentsFolder: 'Källdokument',
    documentAnalysisDesc: 'Underrättelseanalys per dokument med strukturerad metadata och Mermaid-visualiseringar.',
    documentJsonDesc: 'Strukturerad JSON-fil extraherad från det ursprungliga riksdagsdokumentet.',
    analysisWord: 'Analys',
    dataWord: 'Data',
    otherLanguages: 'Läs sidan på ett annat språk',
    skipToMain: 'Hoppa till huvudinnehållet',
  },
  da: {
    title: 'Politisk efterretning',
    subtitle: 'Metoder, skabeloner og Riksdagsmonitors fulde daglige analyseproduktion',
    intro: 'Riksdagsmonitor leverer evidensbaseret politisk efterretning om det svenske Folketing og regering efter et disciplineret analytisk rammeværk. Dette indeks viser hele metodebiblioteket, de genbrugelige analyseskabeloner og alle daglige efterretningsartefakter — alle linket tilbage til GitHub for fuld sporbarhed.',
    metaDescription: 'Komplet indeks over Riksdagsmonitors politiske efterretningsaktiver: metoder, analyseskabeloner og daglige artefakter om det svenske parlament og regering.',
    metaKeywords: 'politisk efterretning, Riksdagsmonitor, OSINT, analysemetoder, analyseskabeloner, svensk parlament, politisk analyse, efterretningsrammer',
    quickJumpTo: 'Hurtig navigation',
    methodologies: 'Metoder',
    methodologiesDesc: 'Kanoniske rammer, der styrer enhver analyse på platformen — fra AI-drevne protokoller og politisk risikoscoring til trussel-, SWOT- og referencestandarder.',
    templates: 'Analyseskabeloner',
    templatesDesc: 'Strukturerede outputskabeloner, der bruges af alle agentiske workflows for at sikre konsistente, Mermaid-rige og tillidsmærkede efterretningsprodukter.',
    dailyArtifacts: 'Daglige analyseartefakter',
    dailyArtifactsDesc: 'Hver artefakt publiceret under analysis/daily/, grupperet efter dato og indholdsstrøm (propositioner, motioner, interpellationer, udvalgsrapporter, aftenanalyser, realtidsoptagelser, dybdeinspektioner m.fl.).',
    openOnGithub: 'Åbn på GitHub',
    browseDirectoryOnGithub: 'Gennemse hele mappen på GitHub',
    browseAllDays: 'Gennemse alle analysedage på GitHub',
    artifacts: 'artefakter',
    stream: 'strøm',
    home: 'Hjem',
    sitemap: 'Sitekort',
    recentDays: 'Seneste analysedage',
    olderDays: 'Ældre analysedage',
    showMore: 'Vis mere',
    backToTop: 'Tilbage til toppen',
    expandArtifacts: 'Vis enkelte artefakter',
    artifactsLabel: 'artefakter i strømmen',
    documentsFolder: 'Kildedokumenter',
    documentAnalysisDesc: 'Efterretningsanalyse per dokument med struktureret metadata og Mermaid-visualiseringer.',
    documentJsonDesc: 'Struktureret JSON-payload udtrukket fra det originale parlamentariske dokument.',
    analysisWord: 'Analyse',
    dataWord: 'Data',
    otherLanguages: 'Læs siden på et andet sprog',
    skipToMain: 'Spring til hovedindholdet',
  },
  no: {
    title: 'Politisk etterretning',
    subtitle: 'Metoder, maler og Riksdagsmonitors fullstendige daglige analyseutbytte',
    intro: 'Riksdagsmonitor leverer evidensbasert politisk etterretning om det svenske Riksdagen og regjeringen gjennom et disiplinert analytisk rammeverk. Dette indekset eksponerer hele metodebiblioteket, de gjenbrukbare analysemalene og hver daglig etterretningsartefakt — alle lenket tilbake til GitHub for full sporbarhet.',
    metaDescription: 'Komplett indeks over Riksdagsmonitors politiske etterretningsressurser: metoder, analysemaler og daglige artefakter som dekker det svenske parlamentet og regjeringen.',
    metaKeywords: 'politisk etterretning, Riksdagsmonitor, OSINT, analysemetoder, analysemaler, svensk parlament, politisk analyse, etterretningsrammeverk',
    quickJumpTo: 'Hurtignavigasjon',
    methodologies: 'Metoder',
    methodologiesDesc: 'Kanoniske rammeverk som styrer hver analyse på plattformen — fra AI-drevne protokoller og politisk risikoskåring til trussel-, SWOT- og referansekvalitetsstandarder.',
    templates: 'Analysemaler',
    templatesDesc: 'Strukturerte utdatamaler brukt av hvert agentisk arbeidsflyt for å garantere konsistente, Mermaid-rike og tillitsmerkede etterretningsprodukter.',
    dailyArtifacts: 'Daglige analyseartefakter',
    dailyArtifactsDesc: 'Hver artefakt publisert under analysis/daily/, gruppert etter dato og innholdsstrøm (proposisjoner, motsjoner, interpellasjoner, komitérapporter, kveldsanalyser, sanntidsopptak, dybdegranskninger m.m.).',
    openOnGithub: 'Åpne på GitHub',
    browseDirectoryOnGithub: 'Bla gjennom hele katalogen på GitHub',
    browseAllDays: 'Bla gjennom alle analysedager på GitHub',
    artifacts: 'artefakter',
    stream: 'strøm',
    home: 'Hjem',
    sitemap: 'Nettstedskart',
    recentDays: 'Nyeste analysedager',
    olderDays: 'Eldre analysedager',
    showMore: 'Vis flere',
    backToTop: 'Tilbake til toppen',
    expandArtifacts: 'Vis enkelte artefakter',
    artifactsLabel: 'artefakter i strømmen',
    documentsFolder: 'Kildedokumenter',
    documentAnalysisDesc: 'Etterretningsanalyse per dokument med strukturert metadata og Mermaid-visualiseringer.',
    documentJsonDesc: 'Strukturert JSON-nyttelast trukket ut fra det opprinnelige parlamentsdokumentet.',
    analysisWord: 'Analyse',
    dataWord: 'Data',
    otherLanguages: 'Les siden på et annet språk',
    skipToMain: 'Hopp til hovedinnholdet',
  },
  fi: {
    title: 'Poliittinen tiedustelu',
    subtitle: 'Metodologiat, mallit ja Riksdagsmonitorin koko päivittäinen analyyttinen tuotos',
    intro: 'Riksdagsmonitor tuottaa evidenssipohjaista poliittista tiedustelua Ruotsin valtiopäivistä ja hallituksesta kurinalaisessa analyyttisessa viitekehyksessä. Tämä hakemisto paljastaa koko metodologiakirjaston, uudelleenkäytettävät analyysimallit ja jokaisen päivittäisen tiedusteluartifaktin — kaikki linkitettyinä GitHubiin täydelliseksi jäljitettävyyden varmistamiseksi.',
    metaDescription: 'Täydellinen hakemisto Riksdagsmonitorin poliittisen tiedustelun resursseista: metodologiat, analyysimallit ja päivittäiset artefaktit Ruotsin parlamentista ja hallituksesta.',
    metaKeywords: 'poliittinen tiedustelu, Riksdagsmonitor, OSINT, analyysimenetelmät, analyysimallit, Ruotsin parlamentti, poliittinen analyysi, tiedusteluviitekehys',
    quickJumpTo: 'Pikanavigointi',
    methodologies: 'Metodologiat',
    methodologiesDesc: 'Kanoniset viitekehykset, jotka ohjaavat jokaista alustalla tuotettua analyysiä — AI-pohjaisista protokollista ja poliittisesta riskipisteytyksestä uhka-, SWOT- ja lähdelaatustandardeihin.',
    templates: 'Analyysimallit',
    templatesDesc: 'Strukturoidut tulosmallit, joita jokainen agenttinen työnkulku käyttää taatakseen johdonmukaiset, Mermaid-rikkaat ja luottamusmerkityt tiedustelutuotteet.',
    dailyArtifacts: 'Päivittäiset analyysiartefaktit',
    dailyArtifactsDesc: 'Jokainen analysis/daily/ -kansioon julkaistu artefakti ryhmiteltynä päivämäärän ja sisältövirran mukaan (propositiot, aloitteet, interpellaatiot, valiokuntaraportit, ilta-analyysit, reaaliaikaiset otokset, syväntutkimukset ym.).',
    openOnGithub: 'Avaa GitHubissa',
    browseDirectoryOnGithub: 'Selaa koko hakemistoa GitHubissa',
    browseAllDays: 'Selaa kaikkia analyysipäiviä GitHubissa',
    artifacts: 'artefaktit',
    stream: 'virta',
    home: 'Etusivu',
    sitemap: 'Sivustokartta',
    recentDays: 'Uusimmat analyysipäivät',
    olderDays: 'Vanhemmat analyysipäivät',
    showMore: 'Näytä lisää',
    backToTop: 'Takaisin ylös',
    expandArtifacts: 'Näytä yksittäiset artefaktit',
    artifactsLabel: 'artefaktit tässä virrassa',
    documentsFolder: 'Lähdeasiakirjat',
    documentAnalysisDesc: 'Asiakirjakohtainen tiedusteluanalyysi strukturoidulla metatiedolla ja Mermaid-visualisoinneilla.',
    documentJsonDesc: 'Strukturoitu JSON-data, joka on poimittu alkuperäisestä parlamentin asiakirjasta.',
    analysisWord: 'Analyysi',
    dataWord: 'Data',
    otherLanguages: 'Lue tämä sivu toisella kielellä',
    skipToMain: 'Siirry pääsisältöön',
  },
  de: {
    title: 'Politische Intelligenz',
    subtitle: 'Methoden, Vorlagen und die vollständige tägliche Analyseausgabe von Riksdagsmonitor',
    intro: 'Riksdagsmonitor erzeugt evidenzbasierte politische Intelligenz über das schwedische Parlament und die Regierung in einem disziplinierten analytischen Rahmenwerk. Dieses Verzeichnis offenbart die gesamte Methodenbibliothek, die wiederverwendbaren Analysevorlagen und jedes tägliche Intelligenzartefakt — alle zur vollständigen Nachvollziehbarkeit auf GitHub verlinkt.',
    metaDescription: 'Vollständiges Verzeichnis der politischen Intelligenzressourcen von Riksdagsmonitor: Methoden, Analysevorlagen und tägliche Artefakte zum schwedischen Parlament und zur Regierung.',
    metaKeywords: 'politische Intelligenz, Riksdagsmonitor, OSINT, Analysemethoden, Analysevorlagen, schwedisches Parlament, politische Analyse, Intelligenzrahmenwerk',
    quickJumpTo: 'Schnellnavigation',
    methodologies: 'Methoden',
    methodologiesDesc: 'Kanonische Rahmenwerke, die jede Analyse der Plattform steuern — von KI-gestützten Protokollen und politischer Risikobewertung bis zu Bedrohungs-, SWOT- und Referenzqualitätsstandards.',
    templates: 'Analysevorlagen',
    templatesDesc: 'Strukturierte Ausgabevorlagen, die von jedem agentischen Workflow verwendet werden, um konsistente, Mermaid-reiche und konfidenzmarkierte Intelligenzprodukte zu garantieren.',
    dailyArtifacts: 'Tägliche Analyseartefakte',
    dailyArtifactsDesc: 'Jedes unter analysis/daily/ veröffentlichte Artefakt, gruppiert nach Datum und Inhaltsstrom (Propositionen, Motionen, Interpellationen, Ausschussberichte, Abendanalysen, Echtzeit-Snapshots, Tiefeninspektionen u.v.m.).',
    openOnGithub: 'Auf GitHub öffnen',
    browseDirectoryOnGithub: 'Das gesamte Verzeichnis auf GitHub durchsuchen',
    browseAllDays: 'Alle Analyse-Tage auf GitHub durchsuchen',
    artifacts: 'Artefakte',
    stream: 'Strom',
    home: 'Startseite',
    sitemap: 'Sitemap',
    recentDays: 'Neueste Analyse-Tage',
    olderDays: 'Ältere Analyse-Tage',
    showMore: 'Mehr anzeigen',
    backToTop: 'Nach oben',
    expandArtifacts: 'Einzelne Artefakte anzeigen',
    artifactsLabel: 'Artefakte in diesem Strom',
    documentsFolder: 'Quelldokumente',
    documentAnalysisDesc: 'Dokumentweise Intelligenzanalyse mit strukturierten Metadaten und Mermaid-Visualisierungen.',
    documentJsonDesc: 'Strukturierte JSON-Nutzlast, extrahiert aus dem ursprünglichen Parlamentsdokument.',
    analysisWord: 'Analyse',
    dataWord: 'Daten',
    otherLanguages: 'Diese Seite in einer anderen Sprache lesen',
    skipToMain: 'Zum Hauptinhalt springen',
  },
  fr: {
    title: 'Intelligence politique',
    subtitle: 'Méthodologies, modèles et la production analytique quotidienne complète de Riksdagsmonitor',
    intro: 'Riksdagsmonitor produit une intelligence politique fondée sur des preuves concernant le Parlement et le gouvernement suédois selon un cadre analytique rigoureux. Cet index expose l\'ensemble de la bibliothèque de méthodologies, les modèles d\'analyse réutilisables et chaque artefact de renseignement quotidien — tous liés à GitHub pour une traçabilité complète.',
    metaDescription: 'Index complet des actifs d\'intelligence politique de Riksdagsmonitor : méthodologies, modèles d\'analyse et artefacts quotidiens couvrant le Parlement et le gouvernement suédois.',
    metaKeywords: 'intelligence politique, Riksdagsmonitor, OSINT, méthodologies d\'analyse, modèles d\'analyse, Parlement suédois, analyse politique, cadre de renseignement',
    quickJumpTo: 'Navigation rapide',
    methodologies: 'Méthodologies',
    methodologiesDesc: 'Cadres canoniques régissant chaque analyse produite sur la plateforme — des protocoles pilotés par IA et du scoring de risque politique aux standards de menace, SWOT et qualité de référence.',
    templates: 'Modèles d\'analyse',
    templatesDesc: 'Modèles de sortie structurés utilisés par chaque workflow agentique pour garantir des produits de renseignement cohérents, riches en Mermaid et étiquetés en confiance.',
    dailyArtifacts: 'Artefacts d\'analyse quotidiens',
    dailyArtifactsDesc: 'Chaque artefact publié sous analysis/daily/, regroupé par date et par flux de contenu (propositions, motions, interpellations, rapports de commission, analyses du soir, captures temps réel, inspections approfondies, etc.).',
    openOnGithub: 'Ouvrir sur GitHub',
    browseDirectoryOnGithub: 'Parcourir tout le répertoire sur GitHub',
    browseAllDays: 'Parcourir tous les jours d\'analyse sur GitHub',
    artifacts: 'artefacts',
    stream: 'flux',
    home: 'Accueil',
    sitemap: 'Plan du site',
    recentDays: 'Jours d\'analyse les plus récents',
    olderDays: 'Jours d\'analyse antérieurs',
    showMore: 'Afficher plus',
    backToTop: 'Retour en haut',
    expandArtifacts: 'Afficher les artefacts individuels',
    artifactsLabel: 'artefacts dans ce flux',
    documentsFolder: 'Documents sources',
    documentAnalysisDesc: 'Analyse de renseignement par document avec métadonnées structurées et visualisations Mermaid.',
    documentJsonDesc: 'Charge utile JSON structurée extraite du document parlementaire source.',
    analysisWord: 'Analyse',
    dataWord: 'Données',
    otherLanguages: 'Lire cette page dans une autre langue',
    skipToMain: 'Aller au contenu principal',
  },
  es: {
    title: 'Inteligencia política',
    subtitle: 'Metodologías, plantillas y la producción analítica diaria completa de Riksdagsmonitor',
    intro: 'Riksdagsmonitor produce inteligencia política basada en evidencia sobre el Parlamento y el Gobierno sueco bajo un marco analítico disciplinado. Este índice expone toda la biblioteca de metodologías, las plantillas de análisis reutilizables y cada artefacto de inteligencia diario — todos enlazados a GitHub para una trazabilidad completa.',
    metaDescription: 'Índice completo de los activos de inteligencia política de Riksdagsmonitor: metodologías, plantillas de análisis y artefactos diarios que cubren el Parlamento y el Gobierno suecos.',
    metaKeywords: 'inteligencia política, Riksdagsmonitor, OSINT, metodologías de análisis, plantillas de análisis, Parlamento sueco, análisis político, marco de inteligencia',
    quickJumpTo: 'Navegación rápida',
    methodologies: 'Metodologías',
    methodologiesDesc: 'Marcos canónicos que rigen cada análisis producido en la plataforma — desde protocolos impulsados por IA y puntuación de riesgo político hasta estándares de amenaza, SWOT y calidad de referencia.',
    templates: 'Plantillas de análisis',
    templatesDesc: 'Plantillas de salida estructuradas utilizadas por cada flujo de trabajo agéntico para garantizar productos de inteligencia consistentes, ricos en Mermaid y etiquetados de confianza.',
    dailyArtifacts: 'Artefactos de análisis diarios',
    dailyArtifactsDesc: 'Cada artefacto publicado bajo analysis/daily/, agrupado por fecha y flujo de contenido (proposiciones, mociones, interpelaciones, informes de comité, análisis vespertinos, capturas en tiempo real, inspecciones profundas, etc.).',
    openOnGithub: 'Abrir en GitHub',
    browseDirectoryOnGithub: 'Explorar el directorio completo en GitHub',
    browseAllDays: 'Explorar todos los días de análisis en GitHub',
    artifacts: 'artefactos',
    stream: 'flujo',
    home: 'Inicio',
    sitemap: 'Mapa del sitio',
    recentDays: 'Días de análisis más recientes',
    olderDays: 'Días de análisis anteriores',
    showMore: 'Mostrar más',
    backToTop: 'Volver arriba',
    expandArtifacts: 'Mostrar artefactos individuales',
    artifactsLabel: 'artefactos en este flujo',
    documentsFolder: 'Documentos fuente',
    documentAnalysisDesc: 'Análisis de inteligencia por documento con metadatos estructurados y visualizaciones Mermaid.',
    documentJsonDesc: 'Carga JSON estructurada extraída del documento parlamentario original.',
    analysisWord: 'Análisis',
    dataWord: 'Datos',
    otherLanguages: 'Leer esta página en otro idioma',
    skipToMain: 'Saltar al contenido principal',
  },
  nl: {
    title: 'Politieke inlichtingen',
    subtitle: 'Methodologieën, sjablonen en de volledige dagelijkse analytische output van Riksdagsmonitor',
    intro: 'Riksdagsmonitor produceert bewijsgebaseerde politieke inlichtingen over het Zweedse Parlement en de regering binnen een gedisciplineerd analytisch raamwerk. Deze index onthult de volledige methodologiebibliotheek, de herbruikbare analysesjablonen en elk dagelijks inlichtingenartefact — alle teruggekoppeld naar GitHub voor volledige traceerbaarheid.',
    metaDescription: 'Volledige index van de politieke inlichtingenassets van Riksdagsmonitor: methodologieën, analysesjablonen en dagelijkse artefacten over het Zweedse Parlement en de regering.',
    metaKeywords: 'politieke inlichtingen, Riksdagsmonitor, OSINT, analysemethodologieën, analysesjablonen, Zweeds Parlement, politieke analyse, inlichtingenraamwerk',
    quickJumpTo: 'Snelnavigatie',
    methodologies: 'Methodologieën',
    methodologiesDesc: 'Canonieke raamwerken die elke analyse op het platform sturen — van AI-gestuurde protocollen en politieke risicoscoring tot dreigings-, SWOT- en referentiekwaliteitsstandaarden.',
    templates: 'Analysesjablonen',
    templatesDesc: 'Gestructureerde outputsjablonen gebruikt door elk agentisch werkproces om consistente, Mermaid-rijke en betrouwbaarheidsgelabelde inlichtingenproducten te garanderen.',
    dailyArtifacts: 'Dagelijkse analyseartefacten',
    dailyArtifactsDesc: 'Elk artefact gepubliceerd onder analysis/daily/, gegroepeerd op datum en inhoudsstroom (proposities, moties, interpellaties, commissierapporten, avondanalyses, real-time snapshots, diepte-inspecties enz.).',
    openOnGithub: 'Openen op GitHub',
    browseDirectoryOnGithub: 'Blader door de volledige map op GitHub',
    browseAllDays: 'Blader door alle analysedagen op GitHub',
    artifacts: 'artefacten',
    stream: 'stroom',
    home: 'Home',
    sitemap: 'Sitemap',
    recentDays: 'Meest recente analysedagen',
    olderDays: 'Oudere analysedagen',
    showMore: 'Meer tonen',
    backToTop: 'Naar boven',
    expandArtifacts: 'Individuele artefacten tonen',
    artifactsLabel: 'artefacten in deze stroom',
    documentsFolder: 'Brondocumenten',
    documentAnalysisDesc: 'Inlichtingenanalyse per document met gestructureerde metadata en Mermaid-visualisaties.',
    documentJsonDesc: 'Gestructureerde JSON-payload geëxtraheerd uit het oorspronkelijke parlementaire document.',
    analysisWord: 'Analyse',
    dataWord: 'Data',
    otherLanguages: 'Lees deze pagina in een andere taal',
    skipToMain: 'Ga naar hoofdinhoud',
  },
  ar: {
    title: 'الاستخبارات السياسية',
    subtitle: 'المنهجيات والقوالب والإنتاج التحليلي اليومي الكامل لـ Riksdagsmonitor',
    intro: 'ينتج Riksdagsmonitor استخبارات سياسية قائمة على الأدلة حول البرلمان والحكومة السويديين ضمن إطار تحليلي منضبط. يكشف هذا الفهرس مكتبة المنهجيات الكاملة والقوالب التحليلية القابلة لإعادة الاستخدام وكل عمل استخباراتي يومي — جميعها مرتبطة بـ GitHub لضمان التتبع الكامل.',
    metaDescription: 'فهرس كامل لأصول الاستخبارات السياسية في Riksdagsmonitor: المنهجيات وقوالب التحليل والعمل اليومي حول البرلمان والحكومة السويديين.',
    metaKeywords: 'استخبارات سياسية، Riksdagsmonitor، OSINT، منهجيات تحليل، قوالب تحليل، البرلمان السويدي، تحليل سياسي، إطار استخباراتي',
    quickJumpTo: 'انتقال سريع',
    methodologies: 'المنهجيات',
    methodologiesDesc: 'أطر قانونية تحكم كل تحليل ينتج على المنصة — من البروتوكولات المدفوعة بالذكاء الاصطناعي وتقييم المخاطر السياسية إلى معايير التهديد وSWOT وجودة المراجع.',
    templates: 'قوالب التحليل',
    templatesDesc: 'قوالب إخراج منظمة يستخدمها كل سير عمل وكيلي لضمان منتجات استخباراتية متسقة وغنية بـ Mermaid ومُعلَّمة بمستوى الثقة.',
    dailyArtifacts: 'عمل تحليلي يومي',
    dailyArtifactsDesc: 'كل عمل منشور تحت analysis/daily/، مجمّع حسب التاريخ وتيار المحتوى (مقترحات، عرائض، استجوابات، تقارير لجان، تحليلات مسائية، لقطات فورية، فحوص عميقة وغيرها).',
    openOnGithub: 'افتح على GitHub',
    browseDirectoryOnGithub: 'تصفح المجلد الكامل على GitHub',
    browseAllDays: 'تصفح كل أيام التحليل على GitHub',
    artifacts: 'عمل',
    stream: 'تيار',
    home: 'الرئيسية',
    sitemap: 'خريطة الموقع',
    recentDays: 'أحدث أيام التحليل',
    olderDays: 'أيام تحليل سابقة',
    showMore: 'عرض المزيد',
    backToTop: 'العودة إلى الأعلى',
    expandArtifacts: 'عرض كل القطع الفردية',
    artifactsLabel: 'قطع في هذا التيار',
    documentsFolder: 'الوثائق المصدرية',
    documentAnalysisDesc: 'تحليل استخباراتي لكل وثيقة مع بيانات وصفية منظمة ومخططات Mermaid.',
    documentJsonDesc: 'حمولة JSON منظمة مستخرجة من الوثيقة البرلمانية الأصلية.',
    analysisWord: 'تحليل',
    dataWord: 'بيانات',
    otherLanguages: 'اقرأ هذه الصفحة بلغة أخرى',
    skipToMain: 'انتقل إلى المحتوى الرئيسي',
  },
  he: {
    title: 'מודיעין פוליטי',
    subtitle: 'מתודולוגיות, תבניות וכל הפלט האנליטי היומי של Riksdagsmonitor',
    intro: 'Riksdagsmonitor מפיקה מודיעין פוליטי מבוסס ראיות על הפרלמנט והממשלה השוודיים במסגרת אנליטית מדוקדקת. אינדקס זה חושף את כל ספריית המתודולוגיות, את תבניות הניתוח הניתנות לשימוש חוזר וכל ארטיפקט מודיעיני יומי — כולם מקושרים חזרה ל-GitHub לצורך עקיבות מלאה.',
    metaDescription: 'אינדקס מלא של נכסי המודיעין הפוליטי של Riksdagsmonitor: מתודולוגיות, תבניות ניתוח וארטיפקטים יומיים המכסים את הפרלמנט והממשלה השוודיים.',
    metaKeywords: 'מודיעין פוליטי, Riksdagsmonitor, OSINT, מתודולוגיות ניתוח, תבניות ניתוח, פרלמנט שוודי, ניתוח פוליטי, מסגרת מודיעין',
    quickJumpTo: 'ניווט מהיר',
    methodologies: 'מתודולוגיות',
    methodologiesDesc: 'מסגרות קנוניות המכוונות כל ניתוח שנוצר בפלטפורמה — מפרוטוקולי AI וניקוד סיכון פוליטי ועד תקני איומים, SWOT ואיכות הפניה.',
    templates: 'תבניות ניתוח',
    templatesDesc: 'תבניות פלט מובנות המשמשות כל זרימת עבודה אגנטית להבטחת מוצרי מודיעין עקביים, עשירי Mermaid ומסומני רמת ביטחון.',
    dailyArtifacts: 'ארטיפקטים אנליטיים יומיים',
    dailyArtifactsDesc: 'כל ארטיפקט שפורסם תחת analysis/daily/, מקובץ לפי תאריך וזרם תוכן (הצעות חוק, הצעות, שאילתות, דוחות ועדות, ניתוחי ערב, לכידות בזמן אמת, בדיקות עומק ועוד).',
    openOnGithub: 'פתח ב-GitHub',
    browseDirectoryOnGithub: 'דפדף בספרייה המלאה ב-GitHub',
    browseAllDays: 'דפדף בכל ימי הניתוח ב-GitHub',
    artifacts: 'ארטיפקטים',
    stream: 'זרם',
    home: 'בית',
    sitemap: 'מפת אתר',
    recentDays: 'ימי הניתוח האחרונים',
    olderDays: 'ימי ניתוח ישנים יותר',
    showMore: 'הצג עוד',
    backToTop: 'חזור למעלה',
    expandArtifacts: 'הצג ארטיפקטים בודדים',
    artifactsLabel: 'ארטיפקטים בזרם',
    documentsFolder: 'מסמכי מקור',
    documentAnalysisDesc: 'ניתוח מודיעיני לכל מסמך עם מטא-נתונים מובנים ותרשימי Mermaid.',
    documentJsonDesc: 'מטען JSON מובנה שנשלף ממסמך הפרלמנט המקורי.',
    analysisWord: 'ניתוח',
    dataWord: 'נתונים',
    otherLanguages: 'קרא דף זה בשפה אחרת',
    skipToMain: 'דלג לתוכן הראשי',
  },
  ja: {
    title: '政治インテリジェンス',
    subtitle: 'Riksdagsmonitorの方法論、テンプレート、そして日々すべての分析成果',
    intro: 'Riksdagsmonitorは、規律ある分析フレームワークのもとで、スウェーデン議会と政府に関する証拠ベースの政治インテリジェンスを生み出しています。このインデックスは、方法論ライブラリ全体、再利用可能な分析テンプレート、そしてすべての日次インテリジェンス成果物を公開しており、完全な追跡可能性を保証するためにすべて GitHub にリンクされています。',
    metaDescription: 'Riksdagsmonitor の政治インテリジェンス資産の完全なインデックス：方法論、分析テンプレート、およびスウェーデン議会と政府を対象とする日次成果物。',
    metaKeywords: '政治インテリジェンス, Riksdagsmonitor, OSINT, 分析方法論, 分析テンプレート, スウェーデン議会, 政治分析, インテリジェンスフレームワーク',
    quickJumpTo: 'クイックナビゲーション',
    methodologies: '方法論',
    methodologiesDesc: 'プラットフォームで作成されるすべての分析を統制する正典的フレームワーク — AI駆動プロトコルや政治的リスク評価から、脅威、SWOT、参照品質基準まで。',
    templates: '分析テンプレート',
    templatesDesc: 'すべてのエージェント型ワークフローが使用する構造化出力テンプレート。一貫性があり、Mermaid豊富で、信頼度ラベル付きのインテリジェンス製品を保証します。',
    dailyArtifacts: '日次分析成果物',
    dailyArtifactsDesc: 'analysis/daily/ 配下に公開されたすべての成果物を、日付とコンテンツストリーム（法案、動議、質問主意書、委員会報告、夜間分析、リアルタイムスナップショット、詳細調査など）別にグループ化しています。',
    openOnGithub: 'GitHubで開く',
    browseDirectoryOnGithub: 'GitHubでディレクトリ全体を閲覧',
    browseAllDays: 'GitHubで全ての分析日を閲覧',
    artifacts: '成果物',
    stream: 'ストリーム',
    home: 'ホーム',
    sitemap: 'サイトマップ',
    recentDays: '最新の分析日',
    olderDays: '過去の分析日',
    showMore: 'さらに表示',
    backToTop: 'トップへ戻る',
    expandArtifacts: '個別の成果物を表示',
    artifactsLabel: 'このストリームの成果物',
    documentsFolder: 'ソース文書',
    documentAnalysisDesc: '構造化メタデータと Mermaid 可視化を含む文書単位のインテリジェンス分析。',
    documentJsonDesc: '元の議会文書から抽出された構造化 JSON ペイロード。',
    analysisWord: '分析',
    dataWord: 'データ',
    otherLanguages: 'このページを他の言語で読む',
    skipToMain: 'メインコンテンツへスキップ',
  },
  ko: {
    title: '정치 인텔리전스',
    subtitle: 'Riksdagsmonitor의 방법론, 템플릿 및 전체 일일 분석 산출물',
    intro: 'Riksdagsmonitor는 엄격한 분석 프레임워크 아래에서 스웨덴 의회와 정부에 관한 증거 기반의 정치 인텔리전스를 생산합니다. 이 인덱스는 전체 방법론 라이브러리, 재사용 가능한 분석 템플릿, 그리고 모든 일일 인텔리전스 산출물을 공개하며, 완전한 추적 가능성을 위해 모두 GitHub에 연결되어 있습니다.',
    metaDescription: 'Riksdagsmonitor 정치 인텔리전스 자산의 전체 인덱스: 방법론, 분석 템플릿, 스웨덴 의회 및 정부에 관한 일일 산출물.',
    metaKeywords: '정치 인텔리전스, Riksdagsmonitor, OSINT, 분석 방법론, 분석 템플릿, 스웨덴 의회, 정치 분석, 인텔리전스 프레임워크',
    quickJumpTo: '빠른 탐색',
    methodologies: '방법론',
    methodologiesDesc: '플랫폼에서 생성되는 모든 분석을 관장하는 정식 프레임워크 — AI 기반 프로토콜과 정치적 위험 점수화부터 위협, SWOT, 참조 품질 표준까지.',
    templates: '분석 템플릿',
    templatesDesc: '모든 에이전트 워크플로가 사용하는 구조화된 출력 템플릿으로, 일관적이고 Mermaid가 풍부하며 신뢰도 라벨이 지정된 인텔리전스 제품을 보장합니다.',
    dailyArtifacts: '일일 분석 산출물',
    dailyArtifactsDesc: 'analysis/daily/ 아래 게시된 모든 산출물을 날짜 및 콘텐츠 스트림(법안, 의안, 질의, 위원회 보고서, 저녁 분석, 실시간 스냅샷, 심층 조사 등)별로 그룹화합니다.',
    openOnGithub: 'GitHub에서 열기',
    browseDirectoryOnGithub: 'GitHub에서 전체 디렉터리 탐색',
    browseAllDays: 'GitHub에서 모든 분석 일자 탐색',
    artifacts: '산출물',
    stream: '스트림',
    home: '홈',
    sitemap: '사이트맵',
    recentDays: '가장 최근의 분석 일자',
    olderDays: '이전 분석 일자',
    showMore: '더 보기',
    backToTop: '맨 위로',
    expandArtifacts: '개별 산출물 표시',
    artifactsLabel: '이 스트림의 산출물',
    documentsFolder: '원본 문서',
    documentAnalysisDesc: '구조화된 메타데이터와 Mermaid 시각화를 포함한 문서별 인텔리전스 분석.',
    documentJsonDesc: '원본 의회 문서에서 추출한 구조화된 JSON 페이로드.',
    analysisWord: '분석',
    dataWord: '데이터',
    otherLanguages: '이 페이지를 다른 언어로 읽기',
    skipToMain: '본문으로 건너뛰기',
  },
  zh: {
    title: '政治情报',
    subtitle: 'Riksdagsmonitor 的方法论、模板及全部日常分析产出',
    intro: 'Riksdagsmonitor 在严谨的分析框架下，针对瑞典议会和政府生产以证据为基础的政治情报。此索引公开完整的方法论库、可复用的分析模板以及每一份日常情报产出，全部回链至 GitHub 以保证完整的可追溯性。',
    metaDescription: 'Riksdagsmonitor 政治情报资产的完整索引：方法论、分析模板以及涵盖瑞典议会和政府的日常产出。',
    metaKeywords: '政治情报, Riksdagsmonitor, OSINT, 分析方法论, 分析模板, 瑞典议会, 政治分析, 情报框架',
    quickJumpTo: '快速导航',
    methodologies: '方法论',
    methodologiesDesc: '管控平台上每一项分析的权威框架 — 从 AI 驱动协议和政治风险评分到威胁、SWOT 以及参考质量标准。',
    templates: '分析模板',
    templatesDesc: '每个代理式工作流使用的结构化输出模板，以确保一致、富含 Mermaid 且带信心标签的情报产品。',
    dailyArtifacts: '日常分析产出',
    dailyArtifactsDesc: '按日期和内容流（法案、动议、质询、委员会报告、晚间分析、实时快照、深度检查等）分组呈现 analysis/daily/ 下发布的每一份产出。',
    openOnGithub: '在 GitHub 上打开',
    browseDirectoryOnGithub: '在 GitHub 上浏览整个目录',
    browseAllDays: '在 GitHub 上浏览所有分析日期',
    artifacts: '产出',
    stream: '流',
    home: '首页',
    sitemap: '网站地图',
    recentDays: '最近的分析日期',
    olderDays: '较早的分析日期',
    showMore: '显示更多',
    backToTop: '返回顶部',
    expandArtifacts: '显示单个产出物',
    artifactsLabel: '该流中的产出物',
    documentsFolder: '源文档',
    documentAnalysisDesc: '逐文档情报分析，附带结构化元数据和 Mermaid 可视化。',
    documentJsonDesc: '从议会原始文档中提取的结构化 JSON 负载。',
    analysisWord: '分析',
    dataWord: '数据',
    otherLanguages: '以其他语言阅读本页',
    skipToMain: '跳至主要内容',
  },
};

// ---------------------------------------------------------------------------
// Heuristic icon + description lookup for methodologies & templates
// ---------------------------------------------------------------------------

interface CatalogEntry {
  readonly file: string;
  readonly title: string;
  readonly icon: string;
  /** English description used as canonical fallback when a language lacks a translation. */
  readonly description: string;
  readonly githubUrl: string;
  /** Which library this entry belongs to (methodology vs template); drives i18n lookup. */
  readonly library: 'methodologies' | 'templates';
}

/** Curated icons and English high-level descriptions keyed by filename. */
const METHODOLOGY_META: Record<string, { icon: string; description: string }> = {
  'ai-driven-analysis-guide.md': { icon: '🤖', description: 'The single canonical protocol every agentic workflow follows — step-by-step analysis with positive voice, color-coded Mermaid, and deep political intelligence.' },
  'analytical-supplementary-methodology.md': { icon: '📐', description: 'Supplementary analytical techniques layered on top of core methodologies for edge cases and specialised inquiries.' },
  'artifact-catalog.md': { icon: '📚', description: 'Catalog of every analytical artifact the platform can produce, with scope, inputs, and expected deliverables.' },
  'electoral-domain-methodology.md': { icon: '🗳️', description: 'Forecasting, coalition math, and voter-segmentation framework specialised for Swedish elections.' },
  'imf-indicator-mapping.md': { icon: '🌐', description: 'Mapping of IMF macroeconomic indicators into Riksdagsmonitor\'s political-economy analysis.' },
  'osint-tradecraft-standards.md': { icon: '🕵️', description: 'OSINT tradecraft standards: source evaluation, attribution, verification, and GDPR-compliant collection.' },
  'per-artifact-methodologies.md': { icon: '🧩', description: 'Per-artifact methodology notes bridging generic frameworks with artifact-specific analytical rigor.' },
  'per-document-methodology.md': { icon: '📄', description: 'Document-level methodology guidance for annotating, scoring, and contextualising parliamentary documents.' },
  'political-classification-guide.md': { icon: '🏷️', description: 'Classification taxonomy for political content: actors, stances, risk surfaces, and information-security classification.' },
  'political-risk-methodology.md': { icon: '⚠️', description: 'Comprehensive political-risk scoring methodology integrating coalition stability, policy volatility, and narrative risks.' },
  'political-style-guide.md': { icon: '🎨', description: 'Editorial and political style guide — tone, balance, attribution, and multi-language considerations.' },
  'political-swot-framework.md': { icon: '🧮', description: 'SWOT framework adapted for political actors, coalitions, and policy positions.' },
  'political-threat-framework.md': { icon: '🛡️', description: 'Threat modelling framework for political actors and decision-making processes, including adversary mapping.' },
  'reference-quality-thresholds.json': { icon: '📊', description: 'Quantitative thresholds used to evaluate reference-source quality across every analysis.' },
  'strategic-extensions-methodology.md': { icon: '🚀', description: 'Strategic extensions to core methodologies — scenario planning, wildcard analysis, and long-horizon forecasting.' },
  'structural-metadata-methodology.md': { icon: '🧬', description: 'Structural metadata extraction methodology for every parliamentary document type.' },
  'synthesis-methodology.md': { icon: '🧠', description: 'Synthesis methodology used to combine multiple artifacts into cohesive intelligence products.' },
  'worldbank-indicator-mapping.md': { icon: '🌍', description: 'Mapping of World Bank development indicators into political-economic analysis.' },
  'README.md': { icon: '📘', description: 'Overview and entry-point for the full methodology library.' },
};

const TEMPLATE_META: Record<string, { icon: string; description: string }> = {
  'analysis-index.md': { icon: '📇', description: 'Master index template linking every artifact produced during a given workflow run.' },
  'coalition-mathematics.md': { icon: '🧮', description: 'Coalition-math template: seat arithmetic, blocking minorities, and majority feasibility scenarios.' },
  'comparative-international.md': { icon: '🌐', description: 'Comparative international template contextualising Swedish developments against peer democracies.' },
  'cross-reference-map.md': { icon: '🔗', description: 'Cross-reference map linking every claim to its supporting sources and analytical dependencies.' },
  'cross-run-diff.md': { icon: '🔁', description: 'Diff template comparing analyses across runs, exposing new signals, reversals, and drift.' },
  'cross-session-intelligence.md': { icon: '🧵', description: 'Cross-session intelligence template synthesising learning across consecutive workflow runs.' },
  'data-download-manifest.md': { icon: '📥', description: 'Manifest template documenting every dataset downloaded for an analysis, including hashes and provenance.' },
  'devils-advocate.md': { icon: '😈', description: 'Devil\'s-advocate template stress-testing conclusions with the strongest counter-arguments.' },
  'election-2026-analysis.md': { icon: '🗳️', description: 'Structured template specialised for the Swedish 2026 election cycle.' },
  'executive-brief.md': { icon: '📋', description: 'Executive-brief template — the top-line intelligence summary for senior decision-makers.' },
  'forward-indicators.md': { icon: '🔭', description: 'Forward-indicator template listing the signals worth monitoring over the coming days and weeks.' },
  'historical-parallels.md': { icon: '📜', description: 'Historical-parallels template drawing on 50+ years of parliamentary data.' },
  'implementation-feasibility.md': { icon: '🛠️', description: 'Implementation-feasibility template assessing whether proposed policies can realistically be delivered.' },
  'intelligence-assessment.md': { icon: '🎯', description: 'Full intelligence-assessment template covering judgements, confidence, gaps, and dissenting views.' },
  'mcp-reliability-audit.md': { icon: '🔒', description: 'MCP reliability audit template documenting every MCP tool invocation and its verification status.' },
  'media-framing-analysis.md': { icon: '📺', description: 'Media-framing analysis template mapping how narratives spread across outlets and languages.' },
  'methodology-reflection.md': { icon: '🪞', description: 'Methodology-reflection template capturing lessons learned for continuous improvement.' },
  'per-file-political-intelligence.md': { icon: '🧾', description: 'Per-file political-intelligence template used to annotate individual parliamentary documents.' },
  'pestle-analysis.md': { icon: '🌳', description: 'PESTLE analysis template: Political, Economic, Social, Technological, Legal, Environmental factors.' },
  'political-classification.md': { icon: '🏷️', description: 'Political-classification template applying the classification taxonomy to the current artifact.' },
  'political-stride-assessment.md': { icon: '🛡️', description: 'STRIDE-inspired political-threat assessment template.' },
  'quantitative-swot.md': { icon: '📊', description: 'Quantitative SWOT template converting SWOT items into scored, comparable dimensions.' },
  'reference-analysis-quality.md': { icon: '⭐', description: 'Reference-quality template scoring sources against the platform\'s thresholds.' },
  'risk-assessment.md': { icon: '⚠️', description: 'Risk-assessment template enumerating risk vectors, likelihood, impact, and mitigations.' },
  'scenario-analysis.md': { icon: '🎲', description: 'Scenario-analysis template projecting alternative futures with probabilities and drivers.' },
  'session-baseline.md': { icon: '📍', description: 'Session-baseline template capturing the starting state for a workflow run.' },
  'significance-scoring.md': { icon: '🏆', description: 'Significance-scoring template ranking artifacts by political and societal importance.' },
  'stakeholder-impact.md': { icon: '👥', description: 'Stakeholder-impact template mapping affected groups and expected consequences.' },
  'swot-analysis.md': { icon: '📈', description: 'Classic SWOT-analysis template customised for political actors and policies.' },
  'synthesis-summary.md': { icon: '🧠', description: 'Synthesis-summary template consolidating multiple artifacts into a single intelligence product.' },
  'threat-analysis.md': { icon: '🛡️', description: 'Threat-analysis template identifying adversaries, TTPs, and political-threat surfaces.' },
  'voter-segmentation.md': { icon: '👥', description: 'Voter-segmentation template modelling constituencies, demographics, and behavioural clusters.' },
  'wildcards-blackswans.md': { icon: '🦢', description: 'Wildcards & black-swans template capturing low-probability, high-impact events.' },
  'workflow-audit.md': { icon: '🔍', description: 'Workflow-audit template documenting every step, tool call, and artifact of a run.' },
  'README.md': { icon: '📘', description: 'Overview and entry-point for the full template library.' },
};

/** Icon + description for each known content stream under analysis/daily/{date}/{stream}. */
const STREAM_META: Record<string, { icon: string; description: string }> = {
  propositions: { icon: '📜', description: 'Government propositions (bills tabled by the Cabinet).' },
  motions: { icon: '✍️', description: 'Member motions (bills and proposals introduced by MPs).' },
  interpellations: { icon: '❓', description: 'Interpellations — formal ministerial questions and responses.' },
  committeeReports: { icon: '🏛️', description: 'Parliamentary committee reports (betänkanden) and recommendations.' },
  'committee-reports': { icon: '🏛️', description: 'Parliamentary committee reports (betänkanden) and recommendations.' },
  'evening-analysis': { icon: '🌙', description: 'Evening analysis synthesising the day\'s parliamentary and government developments.' },
  'deep-inspection': { icon: '🔬', description: 'Deep inspection — long-form structured analysis of a focused topic.' },
  'week-ahead': { icon: '📅', description: 'Week-ahead prospective coverage of scheduled parliamentary activity.' },
  'month-ahead': { icon: '📆', description: 'Month-ahead forward-looking intelligence covering scheduled activity.' },
  'weekly-review': { icon: '🗓️', description: 'Weekly review synthesising the week\'s political and legislative developments.' },
  'monthly-review': { icon: '📊', description: 'Monthly review synthesising the month\'s political and legislative developments.' },
  'breaking-news': { icon: '🚨', description: 'Breaking-news intelligence products generated in response to significant events.' },
};

// ---------------------------------------------------------------------------
// Per-language description overlays — every stream, methodology, template, and
// artifact filename has a concise localised description for all 14 supported
// languages. Helpers fall back to English when a specific key/lang is missing.
// ---------------------------------------------------------------------------

/** Per-language display name for each known stream slug. */
const STREAM_NAME_I18N: Record<string, Record<Language, string>> = {
  propositions: {
    en: 'Propositions', sv: 'Propositioner', da: 'Propositioner', no: 'Proposisjoner', fi: 'Propositiot',
    de: 'Propositionen', fr: 'Propositions', es: 'Proposiciones', nl: 'Proposities',
    ar: 'المقترحات الحكومية', he: 'הצעות חוק ממשלתיות', ja: '政府法案', ko: '정부 제안', zh: '政府法案',
  },
  motions: {
    en: 'Motions', sv: 'Motioner', da: 'Motioner', no: 'Motsjoner', fi: 'Aloitteet',
    de: 'Motionen', fr: 'Motions', es: 'Mociones', nl: 'Moties',
    ar: 'عرائض برلمانية', he: 'הצעות חוק פרטיות', ja: '動議', ko: '의안', zh: '动议',
  },
  interpellations: {
    en: 'Interpellations', sv: 'Interpellationer', da: 'Interpellationer', no: 'Interpellasjoner', fi: 'Interpellaatiot',
    de: 'Interpellationen', fr: 'Interpellations', es: 'Interpelaciones', nl: 'Interpellaties',
    ar: 'استجوابات وزارية', he: 'שאילתות', ja: '質問主意書', ko: '질의', zh: '质询',
  },
  committeeReports: {
    en: 'Committee Reports', sv: 'Betänkanden', da: 'Udvalgsrapporter', no: 'Komitérapporter', fi: 'Valiokuntaraportit',
    de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comité', nl: 'Commissierapporten',
    ar: 'تقارير اللجان', he: 'דוחות ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告',
  },
  'committee-reports': {
    en: 'Committee Reports', sv: 'Betänkanden', da: 'Udvalgsrapporter', no: 'Komitérapporter', fi: 'Valiokuntaraportit',
    de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comité', nl: 'Commissierapporten',
    ar: 'تقارير اللجان', he: 'דוחות ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告',
  },
  'evening-analysis': {
    en: 'Evening Analysis', sv: 'Kvällsanalys', da: 'Aftenanalyse', no: 'Kveldsanalyse', fi: 'Ilta-analyysi',
    de: 'Abendanalyse', fr: 'Analyse du soir', es: 'Análisis vespertino', nl: 'Avondanalyse',
    ar: 'تحليل مسائي', he: 'ניתוח ערב', ja: '夜間分析', ko: '저녁 분석', zh: '晚间分析',
  },
  'deep-inspection': {
    en: 'Deep Inspection', sv: 'Djupgranskning', da: 'Dybdeinspektion', no: 'Dybdegranskning', fi: 'Syvätarkastelu',
    de: 'Tiefeninspektion', fr: 'Inspection approfondie', es: 'Inspección profunda', nl: 'Diepte-inspectie',
    ar: 'فحص معمق', he: 'בדיקה מעמיקה', ja: '詳細調査', ko: '심층 조사', zh: '深度检查',
  },
  'week-ahead': {
    en: 'Week Ahead', sv: 'Veckan framåt', da: 'Ugen forude', no: 'Uken fremover', fi: 'Tuleva viikko',
    de: 'Kommende Woche', fr: 'Semaine à venir', es: 'Semana próxima', nl: 'Komende week',
    ar: 'الأسبوع القادم', he: 'השבוע הקרוב', ja: '今後一週間', ko: '다음 주', zh: '未来一周',
  },
  'month-ahead': {
    en: 'Month Ahead', sv: 'Månaden framåt', da: 'Måneden forude', no: 'Måneden fremover', fi: 'Tuleva kuukausi',
    de: 'Kommender Monat', fr: 'Mois à venir', es: 'Mes próximo', nl: 'Komende maand',
    ar: 'الشهر القادم', he: 'החודש הקרוב', ja: '今後一か月', ko: '다음 달', zh: '未来一月',
  },
  'weekly-review': {
    en: 'Weekly Review', sv: 'Veckoöversikt', da: 'Ugeoversigt', no: 'Ukesoppsummering', fi: 'Viikkokatsaus',
    de: 'Wochenrückblick', fr: 'Revue hebdomadaire', es: 'Resumen semanal', nl: 'Weekoverzicht',
    ar: 'المراجعة الأسبوعية', he: 'סקירה שבועית', ja: '週次レビュー', ko: '주간 리뷰', zh: '每周综述',
  },
  'monthly-review': {
    en: 'Monthly Review', sv: 'Månadsöversikt', da: 'Månedsoversigt', no: 'Månedsoppsummering', fi: 'Kuukausikatsaus',
    de: 'Monatsrückblick', fr: 'Revue mensuelle', es: 'Resumen mensual', nl: 'Maandoverzicht',
    ar: 'المراجعة الشهرية', he: 'סקירה חודשית', ja: '月次レビュー', ko: '월간 리뷰', zh: '每月综述',
  },
  'breaking-news': {
    en: 'Breaking News', sv: 'Senaste nytt', da: 'Breaking news', no: 'Siste nytt', fi: 'Uutisvirta',
    de: 'Eilmeldungen', fr: 'Actualité urgente', es: 'Noticias de última hora', nl: 'Laatste nieuws',
    ar: 'أخبار عاجلة', he: 'חדשות בוערות', ja: '速報', ko: '속보', zh: '突发新闻',
  },
  documents: {
    en: 'Documents', sv: 'Dokument', da: 'Dokumenter', no: 'Dokumenter', fi: 'Asiakirjat',
    de: 'Dokumente', fr: 'Documents', es: 'Documentos', nl: 'Documenten',
    ar: 'الوثائق', he: 'מסמכים', ja: '文書', ko: '문서', zh: '文档',
  },
};

/** Per-language description for each known stream slug. */
const STREAM_DESC_I18N: Record<string, Record<Language, string>> = {
  propositions: {
    en: 'Government propositions (bills tabled by the Cabinet).',
    sv: 'Regeringens propositioner (lagförslag från regeringen).',
    da: 'Regeringens propositioner (lovforslag fra kabinettet).',
    no: 'Regjeringens proposisjoner (lovforslag fra regjeringen).',
    fi: 'Hallituksen esitykset (hallituksen lakiehdotukset).',
    de: 'Regierungsvorlagen (vom Kabinett eingebrachte Gesetzentwürfe).',
    fr: 'Propositions gouvernementales (projets de loi déposés par le gouvernement).',
    es: 'Proposiciones del Gobierno (proyectos de ley presentados por el Gabinete).',
    nl: 'Regeringsvoorstellen (wetsvoorstellen ingediend door het Kabinet).',
    ar: 'مقترحات حكومية (مشاريع قوانين مقدمة من مجلس الوزراء).',
    he: 'הצעות חוק ממשלתיות (הצעות שהונחו על־ידי הקבינט).',
    ja: '政府提出法案（内閣が提出する法律案）。',
    ko: '정부 제안 법안(내각이 제출한 법률안).',
    zh: '政府法案（内阁提交的法案）。',
  },
  motions: {
    en: 'Member motions (bills and proposals introduced by MPs).',
    sv: 'Motioner (förslag från enskilda riksdagsledamöter).',
    da: 'Motioner (lovforslag indbragt af folketingsmedlemmer).',
    no: 'Motsjoner (forslag fra enkelte stortingsrepresentanter).',
    fi: 'Kansanedustajien aloitteet (edustajien lakialoitteet ja ehdotukset).',
    de: 'Anträge von Abgeordneten (von Parlamentariern eingebrachte Gesetzentwürfe und Vorschläge).',
    fr: 'Motions parlementaires (projets et propositions déposés par les députés).',
    es: 'Mociones de miembros (proyectos y propuestas presentados por los parlamentarios).',
    nl: 'Moties van leden (wetsvoorstellen en voorstellen ingediend door Kamerleden).',
    ar: 'عرائض النواب (مشاريع قوانين ومقترحات يقدمها أعضاء البرلمان).',
    he: 'הצעות חוק פרטיות של חברי פרלמנט.',
    ja: '議員発議の動議（議員が提出する法案・提案）。',
    ko: '의원 발의 의안(의원이 제출한 법안 및 제안).',
    zh: '议员动议（国会议员提出的法案和提案）。',
  },
  interpellations: {
    en: 'Interpellations — formal ministerial questions and responses.',
    sv: 'Interpellationer — formella ministerfrågor och svar.',
    da: 'Interpellationer — formelle ministerspørgsmål og svar.',
    no: 'Interpellasjoner — formelle statsrådsspørsmål og svar.',
    fi: 'Interpellaatiot — ministeriöille esitettyjä muodollisia kysymyksiä ja vastauksia.',
    de: 'Interpellationen — formelle Anfragen an Minister und deren Antworten.',
    fr: 'Interpellations — questions ministérielles formelles et réponses.',
    es: 'Interpelaciones: preguntas ministeriales formales y sus respuestas.',
    nl: 'Interpellaties — formele ministeriële vragen en antwoorden.',
    ar: 'استجوابات — أسئلة وزارية رسمية وإجاباتها.',
    he: 'שאילתות — שאלות רשמיות לשרים ותשובותיהם.',
    ja: '質問主意書 — 閣僚に対する正式な質問と回答。',
    ko: '질의 — 장관에 대한 공식 질문과 답변.',
    zh: '质询 — 向部长提出的正式问题及其答复。',
  },
  committeeReports: {
    en: 'Parliamentary committee reports (betänkanden) and recommendations.',
    sv: 'Riksdagens utskottsbetänkanden och rekommendationer.',
    da: 'Udvalgsbetænkninger og anbefalinger fra Folketingets udvalg.',
    no: 'Komitébetenkninger og tilrådninger fra Stortingets komiteer.',
    fi: 'Eduskunnan valiokuntien mietinnöt ja suositukset.',
    de: 'Berichte und Empfehlungen der Parlamentsausschüsse (betänkanden).',
    fr: 'Rapports des commissions parlementaires (betänkanden) et recommandations.',
    es: 'Informes y recomendaciones de las comisiones parlamentarias (betänkanden).',
    nl: 'Rapporten en aanbevelingen van parlementaire commissies (betänkanden).',
    ar: 'تقارير لجان البرلمان السويدي (بيتينكانديْن) وتوصياتها.',
    he: 'דוחות והמלצות של ועדות הפרלמנט (betänkanden).',
    ja: '国会委員会報告（betänkanden）と勧告。',
    ko: '의회 위원회 보고서(betänkanden)와 권고.',
    zh: '议会委员会报告（betänkanden）及建议。',
  },
  'committee-reports': {
    en: 'Parliamentary committee reports (betänkanden) and recommendations.',
    sv: 'Riksdagens utskottsbetänkanden och rekommendationer.',
    da: 'Udvalgsbetænkninger og anbefalinger fra Folketingets udvalg.',
    no: 'Komitébetenkninger og tilrådninger fra Stortingets komiteer.',
    fi: 'Eduskunnan valiokuntien mietinnöt ja suositukset.',
    de: 'Berichte und Empfehlungen der Parlamentsausschüsse (betänkanden).',
    fr: 'Rapports des commissions parlementaires (betänkanden) et recommandations.',
    es: 'Informes y recomendaciones de las comisiones parlamentarias (betänkanden).',
    nl: 'Rapporten en aanbevelingen van parlementaire commissies (betänkanden).',
    ar: 'تقارير لجان البرلمان السويدي (بيتينكانديْن) وتوصياتها.',
    he: 'דוחות והמלצות של ועדות הפרלמנט (betänkanden).',
    ja: '国会委員会報告（betänkanden）と勧告。',
    ko: '의회 위원회 보고서(betänkanden)와 권고.',
    zh: '议会委员会报告（betänkanden）及建议。',
  },
  'evening-analysis': {
    en: 'Evening analysis synthesising the day\'s parliamentary and government developments.',
    sv: 'Kvällsanalys som sammanfattar dagens händelser i riksdag och regering.',
    da: 'Aftenanalyse der samler dagens parlaments- og regeringsudvikling.',
    no: 'Kveldsanalyse som oppsummerer dagens hendelser i parlament og regjering.',
    fi: 'Ilta-analyysi, joka kokoaa päivän parlamentti- ja hallituskehityksen.',
    de: 'Abendanalyse, die die parlamentarischen und Regierungsereignisse des Tages zusammenfasst.',
    fr: 'Analyse du soir synthétisant les développements parlementaires et gouvernementaux du jour.',
    es: 'Análisis vespertino que sintetiza los acontecimientos parlamentarios y gubernamentales del día.',
    nl: 'Avondanalyse die de parlementaire en regeringsontwikkelingen van de dag samenvat.',
    ar: 'تحليل مسائي يُجمِل تطورات البرلمان والحكومة خلال اليوم.',
    he: 'ניתוח ערב המסכם את התפתחויות הפרלמנט והממשלה מהיום.',
    ja: '議会と政府のその日の動向をまとめる夜間分析。',
    ko: '당일 의회 및 정부 상황을 종합한 저녁 분석.',
    zh: '汇总当日议会和政府动态的晚间分析。',
  },
  'deep-inspection': {
    en: 'Deep inspection — long-form structured analysis of a focused topic.',
    sv: 'Djupgranskning — utförlig strukturerad analys av ett fokuserat ämne.',
    da: 'Dybdeinspektion — lang, struktureret analyse af et fokuseret emne.',
    no: 'Dybdegranskning — lang strukturert analyse av et fokusert emne.',
    fi: 'Syvätarkastelu — pitkä, jäsennelty analyysi rajatusta aiheesta.',
    de: 'Tiefeninspektion — strukturierte Langform-Analyse zu einem fokussierten Thema.',
    fr: 'Inspection approfondie — analyse structurée et longue sur un sujet ciblé.',
    es: 'Inspección profunda: análisis estructurado y extenso sobre un tema concreto.',
    nl: 'Diepte-inspectie — lange, gestructureerde analyse van een specifiek onderwerp.',
    ar: 'فحص معمق — تحليل منظم ومفصل لموضوع محدد.',
    he: 'בדיקה מעמיקה — ניתוח מובנה וארוך על נושא ממוקד.',
    ja: '特定のテーマに焦点を当てた長編の構造化分析（詳細調査）。',
    ko: '특정 주제에 초점을 맞춘 장문의 구조화 분석(심층 조사).',
    zh: '针对特定主题的长篇结构化分析（深度检查）。',
  },
  'week-ahead': {
    en: 'Week-ahead prospective coverage of scheduled parliamentary activity.',
    sv: 'Prospektiv bevakning för kommande vecka i riksdagen.',
    da: 'Fremadrettet dækning af den kommende uges parlamentariske aktivitet.',
    no: 'Framskuende dekning av neste ukes parlamentariske aktivitet.',
    fi: 'Tulevan viikon eduskuntatoiminnan ennakkokatsaus.',
    de: 'Vorausschauende Berichterstattung zur parlamentarischen Tagesordnung der kommenden Woche.',
    fr: 'Couverture prospective de l\'activité parlementaire prévue pour la semaine à venir.',
    es: 'Cobertura prospectiva de la actividad parlamentaria prevista para la semana próxima.',
    nl: 'Vooruitblik op de parlementaire agenda van de komende week.',
    ar: 'تغطية استشرافية لأنشطة البرلمان في الأسبوع القادم.',
    he: 'סקירה צופה פני עתיד של פעילות הפרלמנט בשבוע הקרוב.',
    ja: '翌週に予定されている議会活動の先行分析。',
    ko: '다음 주 의회 활동에 대한 사전 분석.',
    zh: '对未来一周议会活动的前瞻报道。',
  },
  'month-ahead': {
    en: 'Month-ahead forward-looking intelligence covering scheduled activity.',
    sv: 'Framåtblickande underrättelser för kommande månad.',
    da: 'Fremadrettet efterretning for den kommende måned.',
    no: 'Framskuende etterretning for neste måneds planlagte aktivitet.',
    fi: 'Tulevan kuukauden ennakoiva tiedustelukatsaus.',
    de: 'Vorausschauende Intelligenz zur geplanten Tätigkeit im kommenden Monat.',
    fr: 'Renseignement prospectif couvrant l\'activité planifiée du mois à venir.',
    es: 'Inteligencia prospectiva sobre la actividad programada del próximo mes.',
    nl: 'Vooruitkijkende inlichtingen voor de geplande activiteit van de komende maand.',
    ar: 'استخبارات استشرافية تغطي النشاط المخطط للشهر القادم.',
    he: 'מודיעין צופה פני עתיד לפעילות המתוכננת בחודש הקרוב.',
    ja: '翌月の予定活動に関する先読みインテリジェンス。',
    ko: '다음 달 예정 활동을 다루는 사전 인텔리전스.',
    zh: '覆盖未来一月预定活动的前瞻性情报。',
  },
  'weekly-review': {
    en: 'Weekly review synthesising the week\'s political and legislative developments.',
    sv: 'Veckoöversikt som sammanfattar veckans politiska och lagstiftningsmässiga händelser.',
    da: 'Ugeoversigt der samler ugens politiske og lovgivningsmæssige udvikling.',
    no: 'Ukeoppsummering som samler ukens politiske og lovgivende utvikling.',
    fi: 'Viikkokatsaus, joka kokoaa viikon poliittiset ja lainsäädännölliset tapahtumat.',
    de: 'Wochenrückblick, der die politischen und legislativen Entwicklungen der Woche zusammenfasst.',
    fr: 'Revue hebdomadaire synthétisant les développements politiques et législatifs de la semaine.',
    es: 'Resumen semanal que sintetiza los desarrollos políticos y legislativos de la semana.',
    nl: 'Weekoverzicht dat de politieke en wetgevende ontwikkelingen van de week samenvat.',
    ar: 'مراجعة أسبوعية تُجمل التطورات السياسية والتشريعية للأسبوع.',
    he: 'סקירה שבועית המסכמת את ההתפתחויות הפוליטיות והחקיקתיות מהשבוע.',
    ja: '週の政治・立法動向をまとめる週次レビュー。',
    ko: '한 주의 정치·입법 동향을 종합한 주간 리뷰.',
    zh: '汇总本周政治与立法动态的每周综述。',
  },
  'monthly-review': {
    en: 'Monthly review synthesising the month\'s political and legislative developments.',
    sv: 'Månadsöversikt som sammanfattar månadens politiska och lagstiftningsmässiga händelser.',
    da: 'Månedsoversigt der samler månedens politiske og lovgivningsmæssige udvikling.',
    no: 'Månedsoppsummering som samler månedens politiske og lovgivende utvikling.',
    fi: 'Kuukausikatsaus, joka kokoaa kuukauden poliittiset ja lainsäädännölliset tapahtumat.',
    de: 'Monatsrückblick, der die politischen und legislativen Entwicklungen des Monats zusammenfasst.',
    fr: 'Revue mensuelle synthétisant les développements politiques et législatifs du mois.',
    es: 'Resumen mensual que sintetiza los desarrollos políticos y legislativos del mes.',
    nl: 'Maandoverzicht dat de politieke en wetgevende ontwikkelingen van de maand samenvat.',
    ar: 'مراجعة شهرية تُجمل التطورات السياسية والتشريعية للشهر.',
    he: 'סקירה חודשית המסכמת את ההתפתחויות הפוליטיות והחקיקתיות מהחודש.',
    ja: '月の政治・立法動向をまとめる月次レビュー。',
    ko: '한 달의 정치·입법 동향을 종합한 월간 리뷰.',
    zh: '汇总本月政治与立法动态的每月综述。',
  },
  'breaking-news': {
    en: 'Breaking-news intelligence products generated in response to significant events.',
    sv: 'Underrättelseprodukter som produceras direkt vid betydande händelser.',
    da: 'Efterretningsprodukter genereret som reaktion på væsentlige begivenheder.',
    no: 'Etterretningsprodukter laget som svar på betydelige hendelser.',
    fi: 'Merkittäviin tapahtumiin reagoivat uutisluokan tiedustelutuotteet.',
    de: 'Intelligenzprodukte, die als Reaktion auf bedeutende Ereignisse erstellt werden.',
    fr: 'Produits de renseignement générés en réponse à des événements majeurs.',
    es: 'Productos de inteligencia generados en respuesta a eventos significativos.',
    nl: 'Inlichtingenproducten die als reactie op belangrijke gebeurtenissen worden gegenereerd.',
    ar: 'منتجات استخباراتية عاجلة تُنتج استجابةً لأحداث بارزة.',
    he: 'מוצרי מודיעין הנוצרים בתגובה לאירועים משמעותיים.',
    ja: '重要な出来事に応じて生成される速報インテリジェンス製品。',
    ko: '중요한 사건에 대응하여 생성되는 속보 인텔리전스 제품.',
    zh: '针对重大事件即时产出的突发新闻情报产品。',
  },
  documents: {
    en: 'Raw source documents and supporting materials for this stream.',
    sv: 'Källdokument och stödmaterial som ligger till grund för strömmen.',
    da: 'Kildedokumenter og støttemateriale til denne strøm.',
    no: 'Kildedokumenter og støttemateriale for denne strømmen.',
    fi: 'Tämän virran lähdeasiakirjat ja tukimateriaalit.',
    de: 'Quelldokumente und Hintergrundmaterial für diesen Strom.',
    fr: 'Documents sources et éléments d\'appui pour ce flux.',
    es: 'Documentos fuente y materiales de apoyo de este flujo.',
    nl: 'Brondocumenten en ondersteunend materiaal voor deze stroom.',
    ar: 'الوثائق المصدرية والمواد الداعمة لهذا التيار.',
    he: 'מסמכי מקור וחומרי עזר לזרם זה.',
    ja: 'このストリームの原資料および補足資料。',
    ko: '이 스트림의 원본 문서 및 보조 자료.',
    zh: '本流的原始文档和支持材料。',
  },
};

/** Per-language realtime description template. */
const REALTIME_DESC_I18N: Record<Language, string> = {
  en: 'Realtime snapshot capturing the parliamentary and government state at a specific time.',
  sv: 'Realtidssnapshot som fångar riksdagens och regeringens tillstånd vid en specifik tid.',
  da: 'Realtidsoptagelse der fanger parlamentets og regeringens tilstand på et bestemt tidspunkt.',
  no: 'Sanntidssnapshot som fanger parlamentets og regjeringens tilstand på et gitt tidspunkt.',
  fi: 'Reaaliaikainen tilannekuva, joka tallentaa parlamentin ja hallituksen tilan tietyllä hetkellä.',
  de: 'Echtzeit-Snapshot, der den parlamentarischen und Regierungszustand zu einem bestimmten Zeitpunkt festhält.',
  fr: 'Capture en temps réel de l\'état du parlement et du gouvernement à un moment donné.',
  es: 'Instantánea en tiempo real que captura el estado del parlamento y del Gobierno en un momento concreto.',
  nl: 'Realtime snapshot die de staat van parlement en regering op een specifiek moment vastlegt.',
  ar: 'لقطة في الزمن الحقيقي ترصد حالة البرلمان والحكومة في وقت محدد.',
  he: 'תמונת זמן אמת הלוכדת את מצב הפרלמנט והממשלה ברגע מסוים.',
  ja: 'ある時点における議会と政府の状態を捉えたリアルタイム・スナップショット。',
  ko: '특정 시점의 의회 및 정부 상태를 포착한 실시간 스냅샷.',
  zh: '捕捉某一时刻议会和政府状态的实时快照。',
};

/** Generic fallback for unknown streams, keyed by language. The "%s" placeholder
 *  is replaced by the prettified stream name. */
const STREAM_GENERIC_DESC_I18N: Record<Language, string> = {
  en: 'Analytical content stream: %s.',
  sv: 'Analytisk innehållsström: %s.',
  da: 'Analytisk indholdsstrøm: %s.',
  no: 'Analytisk innholdsstrøm: %s.',
  fi: 'Analyyttinen sisältövirta: %s.',
  de: 'Analytischer Inhaltsstrom: %s.',
  fr: 'Flux de contenu analytique : %s.',
  es: 'Flujo de contenido analítico: %s.',
  nl: 'Analytische inhoudsstroom: %s.',
  ar: 'تيار محتوى تحليلي: %s.',
  he: 'זרם תוכן אנליטי: %s.',
  ja: '分析コンテンツストリーム: %s。',
  ko: '분석 콘텐츠 스트림: %s.',
  zh: '分析内容流：%s。',
};

// ---------------------------------------------------------------------------
// Localised descriptions for every methodology file, template file and
// recurring artifact filename. Entries fall back to the English META
// description when a specific key/lang combination is missing.
// ---------------------------------------------------------------------------

type LangMap = Record<Language, string>;

/** Concise localised descriptions for every methodology file. */
const METHODOLOGY_DESC_I18N: Record<string, LangMap> = {
  'ai-driven-analysis-guide.md': {
    en: 'The canonical AI-driven analysis protocol used by every agentic workflow, with positive voice and colour-coded Mermaid diagrams.',
    sv: 'Den kanoniska AI-drivna analysprotokollet som alla agentiska arbetsflöden följer, med positivt tonläge och färgkodade Mermaid-diagram.',
    da: 'Den kanoniske AI-drevne analyseprotokol, som alle agentiske arbejdsgange følger, med positivt tonefald og farvekodede Mermaid-diagrammer.',
    no: 'Den kanoniske AI-drevne analyseprotokollen som alle agentiske arbeidsflyter følger, med positiv tone og fargekodede Mermaid-diagrammer.',
    fi: 'Kanoninen tekoälyohjattu analyysiprotokolla, jota jokainen agenttinen työnkulku noudattaa — myönteinen sävy ja väri koodatut Mermaid-kaaviot.',
    de: 'Das kanonische KI-gesteuerte Analyseprotokoll, dem jeder agentische Workflow folgt — positive Tonlage und farbcodierte Mermaid-Diagramme.',
    fr: 'Le protocole canonique d\'analyse pilotée par IA suivi par chaque workflow agentique, avec voix positive et diagrammes Mermaid codés par couleur.',
    es: 'El protocolo canónico de análisis impulsado por IA que sigue cada flujo de trabajo agéntico, con voz positiva y diagramas Mermaid codificados por color.',
    nl: 'Het canonieke AI-gedreven analyseprotocol dat elke agentische workflow volgt, met positieve toon en kleurgecodeerde Mermaid-diagrammen.',
    ar: 'بروتوكول التحليل الكنسي المدفوع بالذكاء الاصطناعي الذي تتبعه كل سير عمل وكيلي، بنبرة إيجابية ومخططات Mermaid مرمزة بالألوان.',
    he: 'הפרוטוקול הקנוני לניתוח מבוסס בינה מלאכותית שכל זרימת עבודה אג\'נטית עוקבת אחריו, בטון חיובי ותרשימי Mermaid מקודדים בצבע.',
    ja: 'すべてのエージェント型ワークフローが従う、肯定的な語調と色分け Mermaid 図を用いた正典的な AI 駆動分析プロトコル。',
    ko: '긍정적 어조와 색상 코드 Mermaid 다이어그램을 사용하여 모든 에이전트 워크플로가 따르는 표준 AI 기반 분석 프로토콜.',
    zh: '所有代理式工作流都遵循的权威 AI 驱动分析协议，采用积极语气和彩色编码的 Mermaid 图表。',
  },
  'analytical-supplementary-methodology.md': {
    en: 'Supplementary analytical techniques layered on top of core methodologies for edge cases and specialised inquiries.',
    sv: 'Kompletterande analytiska tekniker som läggs ovanpå kärnmetodikerna för specialfall och specialiserade frågor.',
    da: 'Supplerende analytiske teknikker ovenpå kernemetodikerne til grænsetilfælde og specialiserede undersøgelser.',
    no: 'Supplerende analytiske teknikker som legges oppå kjernemetodikkene for grensetilfeller og spesialiserte undersøkelser.',
    fi: 'Ydinmetodologioiden päälle rakennetut täydentävät analyyttiset tekniikat erityistapauksiin ja erikoistuneisiin tutkimuksiin.',
    de: 'Ergänzende Analysetechniken, die auf den Kernmethodologien aufbauen — für Grenzfälle und spezialisierte Untersuchungen.',
    fr: 'Techniques analytiques complémentaires superposées aux méthodologies principales pour les cas particuliers et les enquêtes spécialisées.',
    es: 'Técnicas analíticas complementarias superpuestas a las metodologías principales para casos límite y consultas especializadas.',
    nl: 'Aanvullende analytische technieken bovenop de kernmethodologieën voor randgevallen en gespecialiseerde onderzoeken.',
    ar: 'تقنيات تحليلية تكميلية فوق المنهجيات الأساسية للحالات الخاصة والاستفسارات المتخصصة.',
    he: 'טכניקות אנליטיות משלימות מעל המתודולוגיות המרכזיות עבור מקרי קצה וחקירות מיוחדות.',
    ja: 'コア方法論の上に重ねる、エッジケースや専門的調査向けの補助的分析技法。',
    ko: '핵심 방법론 위에 적용되는 보조 분석 기법으로, 예외 사례 및 전문 조사용.',
    zh: '叠加在核心方法论之上的补充分析技术，用于特殊案例和专业查询。',
  },
  'artifact-catalog.md': {
    en: 'Catalog of every analytical artifact the platform can produce, with scope, inputs and expected deliverables.',
    sv: 'Katalog över varje analytisk artefakt plattformen kan producera — omfattning, indata och förväntade leveranser.',
    da: 'Katalog over alle analytiske artefakter platformen kan producere, med omfang, input og forventede leverancer.',
    no: 'Katalog over alle analytiske artefakter plattformen kan produsere — omfang, input og forventede leveranser.',
    fi: 'Luettelo kaikista analyyttisistä artefakteista, joita alusta voi tuottaa — laajuus, syötteet ja odotetut tulokset.',
    de: 'Katalog aller analytischen Artefakte, die die Plattform erzeugen kann — Umfang, Eingaben und erwartete Ergebnisse.',
    fr: 'Catalogue de chaque artefact analytique que la plateforme peut produire, avec périmètre, entrées et livrables attendus.',
    es: 'Catálogo de cada artefacto analítico que la plataforma puede producir, con alcance, entradas y entregables esperados.',
    nl: 'Catalogus van elk analytisch artefact dat het platform kan produceren — reikwijdte, invoer en verwachte opleveringen.',
    ar: 'كتالوج لكل قطعة تحليلية يمكن للمنصة إنتاجها، مع النطاق والمدخلات والمخرجات المتوقعة.',
    he: 'קטלוג של כל ארטיפקט אנליטי שהפלטפורמה יכולה לייצר — היקף, קלטים ותוצרים צפויים.',
    ja: 'プラットフォームが生成できるすべての分析成果物のカタログ（範囲・入力・期待される成果物）。',
    ko: '플랫폼이 생성할 수 있는 모든 분석 산출물의 목록(범위·입력·예상 결과물).',
    zh: '平台能够生成的所有分析产出物的目录，包括范围、输入和预期交付物。',
  },
  'electoral-domain-methodology.md': {
    en: 'Forecasting, coalition math and voter-segmentation framework specialised for Swedish elections.',
    sv: 'Ramverk för prognoser, koalitionsmatematik och väljarsegmentering specialiserat för svenska val.',
    da: 'Rammeværk for valgprognoser, koalitionsmatematik og vælgersegmentering specialiseret til svenske valg.',
    no: 'Rammeverk for valgprognoser, koalisjonsmatematikk og velgersegmentering spesialisert for svenske valg.',
    fi: 'Ennustamisen, koalitiomatematiikan ja äänestäjäsegmentoinnin viitekehys Ruotsin vaaleille.',
    de: 'Rahmenwerk für Prognosen, Koalitionsmathematik und Wählersegmentierung, spezialisiert auf schwedische Wahlen.',
    fr: 'Cadre de prévision, mathématiques de coalition et segmentation des électeurs spécialisé pour les élections suédoises.',
    es: 'Marco de pronósticos, matemáticas de coalición y segmentación de votantes especializado para elecciones suecas.',
    nl: 'Kader voor prognoses, coalitiewiskunde en kiezerssegmentatie, gespecialiseerd voor Zweedse verkiezingen.',
    ar: 'إطار للتنبؤ وحسابات التحالفات وتجزئة الناخبين متخصص للانتخابات السويدية.',
    he: 'מסגרת לתחזיות, חישובי קואליציה ופילוח בוחרים המותאמת לבחירות בשוודיה.',
    ja: 'スウェーデンの選挙に特化した予測・連立数学・有権者セグメンテーションのフレームワーク。',
    ko: '스웨덴 선거에 특화된 예측·연정 수학·유권자 세분화 프레임워크.',
    zh: '专为瑞典选举设计的预测、联盟数学与选民分群框架。',
  },
  'imf-indicator-mapping.md': {
    en: 'Mapping of IMF macroeconomic indicators into Riksdagsmonitor\'s political-economy analysis.',
    sv: 'Mappning av IMF:s makroekonomiska indikatorer in i Riksdagsmonitors politiskt-ekonomiska analys.',
    da: 'Kortlægning af IMF\'s makroøkonomiske indikatorer ind i Riksdagsmonitors politisk-økonomiske analyse.',
    no: 'Kartlegging av IMFs makroøkonomiske indikatorer inn i Riksdagsmonitors politisk-økonomiske analyse.',
    fi: 'IMF:n makrotaloudellisten indikaattoreiden kartoitus Riksdagsmonitorin poliittis-taloudelliseen analyysiin.',
    de: 'Zuordnung der makroökonomischen IWF-Indikatoren zur politisch-ökonomischen Analyse von Riksdagsmonitor.',
    fr: 'Correspondance des indicateurs macroéconomiques du FMI avec l\'analyse d\'économie politique de Riksdagsmonitor.',
    es: 'Correspondencia de los indicadores macroeconómicos del FMI con el análisis de economía política de Riksdagsmonitor.',
    nl: 'Toewijzing van IMF-macro-economische indicatoren aan de politiek-economische analyse van Riksdagsmonitor.',
    ar: 'ربط مؤشرات صندوق النقد الدولي الاقتصادية الكلية بتحليل الاقتصاد السياسي لدى Riksdagsmonitor.',
    he: 'מיפוי אינדיקטורים מאקרו־כלכליים של קרן המטבע הבינלאומית לניתוח הכלכלה הפוליטית של Riksdagsmonitor.',
    ja: 'IMF マクロ経済指標を Riksdagsmonitor の政治経済分析にマッピング。',
    ko: 'IMF 거시경제 지표를 Riksdagsmonitor의 정치·경제 분석으로 매핑.',
    zh: '将 IMF 宏观经济指标映射到 Riksdagsmonitor 的政治经济分析中。',
  },
  'osint-tradecraft-standards.md': {
    en: 'OSINT tradecraft standards: source evaluation, attribution, verification and GDPR-compliant collection.',
    sv: 'OSINT-standarder: källutvärdering, attribuering, verifiering och GDPR-efterlevande insamling.',
    da: 'OSINT-standarder: kildeevaluering, attribution, verifikation og GDPR-kompatibel indsamling.',
    no: 'OSINT-standarder: kildeevaluering, attribusjon, verifisering og GDPR-kompatibel innsamling.',
    fi: 'OSINT-ammattistandardit: lähdearviointi, attribuointi, todentaminen ja GDPR-yhteensopiva kerääminen.',
    de: 'OSINT-Handwerksstandards: Quellenbewertung, Attribution, Verifikation und DSGVO-konforme Erhebung.',
    fr: 'Normes de renseignement OSINT : évaluation des sources, attribution, vérification et collecte conforme au RGPD.',
    es: 'Estándares de tradecraft OSINT: evaluación de fuentes, atribución, verificación y recolección conforme al RGPD.',
    nl: 'OSINT-vakstandaarden: bronbeoordeling, attributie, verificatie en AVG-conforme verzameling.',
    ar: 'معايير حِرفة OSINT: تقييم المصادر، الإسناد، التحقق، والجمع المتوافق مع GDPR.',
    he: 'תקני מלאכת OSINT: הערכת מקורות, ייחוס, אימות ואיסוף התואם ל-GDPR.',
    ja: 'OSINT トレードクラフト基準：情報源評価、帰属、検証、GDPR 準拠の収集。',
    ko: 'OSINT 전문 기법 표준: 출처 평가·귀속·검증·GDPR 준수 수집.',
    zh: 'OSINT 专业标准：信息源评估、归因、验证以及符合 GDPR 的收集。',
  },
  'per-artifact-methodologies.md': {
    en: 'Per-artifact methodology notes bridging generic frameworks with artifact-specific analytical rigor.',
    sv: 'Metodnoteringar per artefakt som kopplar generiska ramverk med artefaktspecifik analytisk stringens.',
    da: 'Metodenoter per artefakt der forbinder generiske rammer med artefaktspecifik analytisk stringens.',
    no: 'Metodenotat per artefakt som kobler generiske rammer med artefaktspesifikk analytisk stringens.',
    fi: 'Artefakti- kohtaiset metodimuistiinpanot, jotka yhdistävät yleiset viitekehykset artefakti-kohtaiseen analyyttiseen tarkkuuteen.',
    de: 'Methodennotizen pro Artefakt, die generische Rahmen mit artefaktspezifischer analytischer Strenge verbinden.',
    fr: 'Notes méthodologiques par artefact reliant les cadres génériques à la rigueur analytique propre à chaque artefact.',
    es: 'Notas metodológicas por artefacto que conectan marcos genéricos con el rigor analítico específico del artefacto.',
    nl: 'Methodische notities per artefact die generieke kaders verbinden met artefact-specifieke analytische rigor.',
    ar: 'ملاحظات منهجية لكل قطعة تربط الأطر العامة بالدقة التحليلية الخاصة بالقطعة.',
    he: 'הערות מתודולוגיות לכל ארטיפקט המקשרות בין מסגרות גנריות לקפדנות אנליטית ייעודית.',
    ja: '一般的な枠組みと成果物ごとの分析的厳密性を橋渡しする、成果物別の方法論ノート。',
    ko: '일반 프레임워크와 산출물별 분석적 엄밀성을 연결하는 산출물별 방법론 노트.',
    zh: '将通用框架与逐产物分析严谨性连接的逐产物方法论笔记。',
  },
  'per-document-methodology.md': {
    en: 'Document-level methodology guidance for annotating, scoring and contextualising parliamentary documents.',
    sv: 'Dokumentnivåmetodik för att annotera, poängsätta och kontextualisera riksdagsdokument.',
    da: 'Metodevejledning på dokumentniveau til annotering, scoring og kontekstualisering af parlamentsdokumenter.',
    no: 'Metodeveiledning på dokumentnivå for annotering, scoring og kontekstualisering av parlamentsdokumenter.',
    fi: 'Asiakirjatason metodiikkaohje parlamenttiasiakirjojen merkintää, pisteytystä ja kontekstointia varten.',
    de: 'Methodische Leitlinien auf Dokumentenebene für Annotation, Scoring und Kontextualisierung parlamentarischer Dokumente.',
    fr: 'Guide méthodologique au niveau du document pour annoter, noter et contextualiser les documents parlementaires.',
    es: 'Guía metodológica a nivel de documento para anotar, puntuar y contextualizar documentos parlamentarios.',
    nl: 'Methodische richtlijn op documentniveau voor annoteren, scoren en contextualiseren van parlementaire documenten.',
    ar: 'إرشادات منهجية على مستوى الوثيقة لتعليق الوثائق البرلمانية وتقييمها ووضعها في السياق.',
    he: 'הנחיות מתודולוגיות ברמת המסמך לתיוג, ניקוד והקשרה של מסמכים פרלמנטריים.',
    ja: '議会文書の注釈付け・スコアリング・文脈化のための文書単位の方法論ガイダンス。',
    ko: '의회 문서의 주석·채점·맥락화를 위한 문서 수준 방법론 지침.',
    zh: '针对议会文件进行标注、评分和语境化的文档级方法论指导。',
  },
  'political-classification-guide.md': {
    en: 'Classification taxonomy for political content: actors, stances, risk surfaces and information-security classification.',
    sv: 'Klassificeringstaxonomi för politiskt innehåll: aktörer, positioner, riskytor och informationssäkerhetsklassificering.',
    da: 'Klassifikationstaksonomi for politisk indhold: aktører, holdninger, risikoflader og informationssikkerhedsklassifikation.',
    no: 'Klassifiseringstaksonomi for politisk innhold: aktører, posisjoner, risikoflater og informasjonssikkerhetsklassifisering.',
    fi: 'Poliittisen sisällön luokittelutaksonomia: toimijat, kannat, riskipinnat ja tietoturvaluokittelu.',
    de: 'Klassifikationstaxonomie für politische Inhalte: Akteure, Positionen, Risikoflächen und Informationssicherheits-Klassifikation.',
    fr: 'Taxonomie de classification pour le contenu politique : acteurs, positions, surfaces de risque et classification de sécurité de l\'information.',
    es: 'Taxonomía de clasificación para contenido político: actores, posturas, superficies de riesgo y clasificación de seguridad de la información.',
    nl: 'Classificatietaxonomie voor politieke inhoud: actoren, standpunten, risicovlakken en informatiebeveiligingsclassificatie.',
    ar: 'تصنيف تصنيفي للمحتوى السياسي: الفاعلون، المواقف، أسطح المخاطر، وتصنيف أمن المعلومات.',
    he: 'טקסונומיית סיווג לתוכן פוליטי: שחקנים, עמדות, משטחי סיכון וסיווג אבטחת מידע.',
    ja: '政治コンテンツの分類タクソノミー：アクター、立場、リスク面、情報セキュリティ分類。',
    ko: '정치 콘텐츠 분류 체계: 행위자·입장·위험 면·정보보안 분류.',
    zh: '政治内容的分类体系：行为者、立场、风险面及信息安全分类。',
  },
  'political-risk-methodology.md': {
    en: 'Comprehensive political-risk scoring methodology integrating coalition stability, policy volatility and narrative risks.',
    sv: 'Heltäckande metodik för politisk riskpoäng som integrerar koalitionsstabilitet, policyvolatilitet och narrativa risker.',
    da: 'Omfattende metodik for politisk risikoscoring der integrerer koalitionsstabilitet, politikvolatilitet og narrative risici.',
    no: 'Omfattende metodikk for politisk risikoscoring som integrerer koalisjonsstabilitet, politikkvolatilitet og narrative risikoer.',
    fi: 'Kattava poliittisen riskin pisteytysmenetelmä, joka yhdistää koalitiovakauden, politiikan volatiliteetin ja narratiiviset riskit.',
    de: 'Umfassende Methodik für politisches Risiko-Scoring, integriert Koalitionsstabilität, Politikvolatilität und narrative Risiken.',
    fr: 'Méthodologie complète de notation du risque politique intégrant la stabilité des coalitions, la volatilité des politiques et les risques narratifs.',
    es: 'Metodología integral de puntuación de riesgo político que integra estabilidad de coaliciones, volatilidad de políticas y riesgos narrativos.',
    nl: 'Omvattende methodologie voor politieke risicoscoring met coalitie-stabiliteit, beleidsvolatiliteit en narratieve risico\'s.',
    ar: 'منهجية شاملة لتقييم المخاطر السياسية تدمج استقرار التحالفات وتقلب السياسات والمخاطر السردية.',
    he: 'מתודולוגיית ניקוד מקיפה לסיכון פוליטי המשלבת יציבות קואליציה, תנודתיות מדיניות וסיכונים נרטיביים.',
    ja: '連立の安定性、政策ボラティリティ、ナラティブリスクを統合した包括的政治リスクスコアリング方法論。',
    ko: '연정 안정성·정책 변동성·서사적 위험을 통합한 포괄적 정치 위험 점수 방법론.',
    zh: '整合联盟稳定性、政策波动性与叙事风险的综合性政治风险评分方法论。',
  },
  'political-style-guide.md': {
    en: 'Editorial and political style guide — tone, balance, attribution and multi-language considerations.',
    sv: 'Redaktionell och politisk stilguide — ton, balans, attribuering och flerspråkiga överväganden.',
    da: 'Redaktionel og politisk stilguide — tone, balance, attribution og flersprogede hensyn.',
    no: 'Redaksjonell og politisk stilguide — tone, balanse, attribusjon og flerspråklige hensyn.',
    fi: 'Toimituksellinen ja poliittinen tyyliopas — sävy, tasapaino, attribuointi ja monikielisyyskysymykset.',
    de: 'Redaktioneller und politischer Styleguide — Tonlage, Ausgewogenheit, Attribution und Mehrsprachigkeit.',
    fr: 'Guide de style éditorial et politique — ton, équilibre, attribution et considérations multilingues.',
    es: 'Guía de estilo editorial y política: tono, equilibrio, atribución y consideraciones multilingües.',
    nl: 'Redactionele en politieke stijlgids — toon, balans, attributie en meertalige overwegingen.',
    ar: 'دليل الأسلوب التحريري والسياسي — النبرة والتوازن والإسناد واعتبارات تعدد اللغات.',
    he: 'מדריך סגנון עריכתי ופוליטי — טון, איזון, ייחוס ושיקולים רב-לשוניים.',
    ja: '編集・政治スタイルガイド — 語調、バランス、帰属、多言語対応。',
    ko: '편집·정치 스타일 가이드 — 어조·균형·귀속·다국어 고려.',
    zh: '编辑与政治风格指南 — 语气、平衡、归因及多语种考虑。',
  },
  'political-swot-framework.md': {
    en: 'SWOT framework adapted for political actors, coalitions and policy positions.',
    sv: 'SWOT-ramverk anpassat för politiska aktörer, koalitioner och policypositioner.',
    da: 'SWOT-rammeværk tilpasset politiske aktører, koalitioner og politiske holdninger.',
    no: 'SWOT-rammeverk tilpasset politiske aktører, koalisjoner og politiske posisjoner.',
    fi: 'SWOT-viitekehys sovellettuna poliittisille toimijoille, koalitioille ja politiikan kannoille.',
    de: 'SWOT-Rahmenwerk, angepasst an politische Akteure, Koalitionen und politische Positionen.',
    fr: 'Cadre SWOT adapté aux acteurs politiques, aux coalitions et aux positions politiques.',
    es: 'Marco SWOT adaptado a actores políticos, coaliciones y posiciones políticas.',
    nl: 'SWOT-kader aangepast voor politieke actoren, coalities en beleidsposities.',
    ar: 'إطار SWOT مُكيَّف مع الفاعلين السياسيين والتحالفات والمواقف السياسية.',
    he: 'מסגרת SWOT המותאמת לשחקנים פוליטיים, קואליציות ועמדות מדיניות.',
    ja: '政治的アクター・連立・政策立場向けに適応された SWOT フレームワーク。',
    ko: '정치 행위자·연정·정책 입장에 맞게 조정된 SWOT 프레임워크.',
    zh: '针对政治行为者、联盟与政策立场调整的 SWOT 框架。',
  },
  'political-threat-framework.md': {
    en: 'Threat-modelling framework for political actors and decision-making processes, including adversary mapping.',
    sv: 'Ramverk för hotmodellering av politiska aktörer och beslutsprocesser, inklusive motståndarkartläggning.',
    da: 'Rammeværk til trusselsmodellering af politiske aktører og beslutningsprocesser, inklusive modstanderkortlægning.',
    no: 'Rammeverk for trusselmodellering av politiske aktører og beslutningsprosesser, inkludert motstanderkartlegging.',
    fi: 'Poliittisten toimijoiden ja päätöksentekoprosessien uhkamallinnuksen viitekehys, mukaan lukien vastustajien kartoitus.',
    de: 'Rahmenwerk zur Bedrohungsmodellierung politischer Akteure und Entscheidungsprozesse, inklusive Gegner-Mapping.',
    fr: 'Cadre de modélisation des menaces pour les acteurs politiques et les processus décisionnels, incluant la cartographie des adversaires.',
    es: 'Marco de modelado de amenazas para actores políticos y procesos de toma de decisiones, incluyendo mapeo de adversarios.',
    nl: 'Kader voor dreigingsmodellering van politieke actoren en besluitvormingsprocessen, inclusief tegenstander-mapping.',
    ar: 'إطار لنمذجة التهديدات للفاعلين السياسيين وعمليات صنع القرار، بما في ذلك رسم خرائط الخصوم.',
    he: 'מסגרת לדוגמנות איומים לשחקנים פוליטיים ותהליכי קבלת החלטות, כולל מיפוי יריבים.',
    ja: 'アドバーサリー・マッピングを含む、政治的アクターと意思決定プロセスの脅威モデリング枠組み。',
    ko: '적대자 매핑을 포함하는 정치 행위자 및 의사결정 과정의 위협 모델링 프레임워크.',
    zh: '面向政治行为者与决策过程的威胁建模框架，包括对手映射。',
  },
  'reference-quality-thresholds.json': {
    en: 'Quantitative thresholds used to evaluate reference-source quality across every analysis.',
    sv: 'Kvantitativa tröskelvärden som används för att bedöma referenskällors kvalitet i varje analys.',
    da: 'Kvantitative tærskler brugt til at vurdere referencekilders kvalitet på tværs af hver analyse.',
    no: 'Kvantitative terskler brukt til å vurdere referansekilders kvalitet på tvers av hver analyse.',
    fi: 'Kvantitatiiviset kynnysarvot, joilla arvioidaan viitelähteiden laatua jokaisessa analyysissa.',
    de: 'Quantitative Schwellenwerte zur Bewertung der Qualität von Referenzquellen in jeder Analyse.',
    fr: 'Seuils quantitatifs utilisés pour évaluer la qualité des sources de référence dans chaque analyse.',
    es: 'Umbrales cuantitativos para evaluar la calidad de las fuentes de referencia en cada análisis.',
    nl: 'Kwantitatieve drempels om de kwaliteit van referentiebronnen in elke analyse te beoordelen.',
    ar: 'حدود كمية تستخدم لتقييم جودة المصادر المرجعية عبر كل تحليل.',
    he: 'ספי כימות להערכת איכות מקורות ייחוס בכל ניתוח.',
    ja: '全分析における参照元の品質を評価するための定量しきい値。',
    ko: '모든 분석에서 참조 출처 품질을 평가하는 데 사용되는 정량적 임계값.',
    zh: '用于评估每次分析中参考来源质量的定量阈值。',
  },
  'strategic-extensions-methodology.md': {
    en: 'Strategic extensions to core methodologies — scenario planning, wildcard analysis and long-horizon forecasting.',
    sv: 'Strategiska utökningar av kärnmetodikerna — scenarioplanering, wildcard-analys och långsiktiga prognoser.',
    da: 'Strategiske udvidelser af kernemetodikkerne — scenarieplanlægning, wildcard-analyse og langtidsprognoser.',
    no: 'Strategiske utvidelser av kjernemetodikkene — scenarieplanlegging, wildcard-analyse og langhorisontprognoser.',
    fi: 'Strategiset laajennukset ydinmetodologioihin — skenaariosuunnittelu, villit kortit ja pitkän aikavälin ennusteet.',
    de: 'Strategische Erweiterungen zu den Kernmethodologien — Szenarienplanung, Wildcard-Analyse und Langfristprognosen.',
    fr: 'Extensions stratégiques des méthodologies centrales — planification de scénarios, analyse de signaux faibles et prévision à long terme.',
    es: 'Extensiones estratégicas a las metodologías principales — planificación de escenarios, análisis de comodines y pronóstico a largo plazo.',
    nl: 'Strategische uitbreidingen op de kernmethodologieën — scenarioplanning, wildcard-analyse en langetermijnprognose.',
    ar: 'امتدادات استراتيجية للمنهجيات الأساسية — تخطيط السيناريوهات وتحليل الأحداث الشاذة والتنبؤ بعيد المدى.',
    he: 'הרחבות אסטרטגיות למתודולוגיות המרכזיות — תכנון תרחישים, ניתוח פרוע ותחזיות לטווח ארוך.',
    ja: 'コア方法論への戦略的拡張 — シナリオ計画、ワイルドカード分析、長期予測。',
    ko: '핵심 방법론에 대한 전략적 확장 — 시나리오 계획·와일드카드 분석·장기 예측.',
    zh: '核心方法论的战略性扩展——情景规划、黑天鹅分析与长远预测。',
  },
  'structural-metadata-methodology.md': {
    en: 'Structural metadata extraction methodology for every parliamentary document type.',
    sv: 'Metodik för extrahering av strukturell metadata för varje typ av riksdagsdokument.',
    da: 'Metodik til udtræk af strukturel metadata for hver type parlamentsdokument.',
    no: 'Metodikk for utvinning av strukturell metadata for hver type parlamentsdokument.',
    fi: 'Rakenteellisen metatiedon uuttaamisen menetelmä jokaista parlamenttiasiakirjatyyppiä varten.',
    de: 'Methodik zur Extraktion struktureller Metadaten für jeden Typ parlamentarischer Dokumente.',
    fr: 'Méthodologie d\'extraction des métadonnées structurelles pour chaque type de document parlementaire.',
    es: 'Metodología de extracción de metadatos estructurales para cada tipo de documento parlamentario.',
    nl: 'Methodologie voor extractie van structurele metadata voor elk type parlementair document.',
    ar: 'منهجية استخراج البيانات الوصفية الهيكلية لكل نوع من الوثائق البرلمانية.',
    he: 'מתודולוגיה לחילוץ מטא־נתונים מבניים עבור כל סוג של מסמך פרלמנטרי.',
    ja: 'すべての議会文書タイプに対する構造的メタデータ抽出方法論。',
    ko: '모든 의회 문서 유형에 대한 구조적 메타데이터 추출 방법론.',
    zh: '针对每一类议会文件的结构化元数据提取方法论。',
  },
  'synthesis-methodology.md': {
    en: 'Synthesis methodology used to combine multiple artifacts into cohesive intelligence products.',
    sv: 'Syntesmetodik som används för att kombinera flera artefakter till sammanhängande underrättelseprodukter.',
    da: 'Syntesemetodik brugt til at kombinere flere artefakter til sammenhængende efterretningsprodukter.',
    no: 'Syntesemetodikk brukt for å kombinere flere artefakter til sammenhengende etterretningsprodukter.',
    fi: 'Synteesimetodologia, jolla yhdistetään useita artefakteja johdonmukaisiksi tiedustelutuotteiksi.',
    de: 'Synthesemethodik zur Kombination mehrerer Artefakte zu kohärenten Intelligenzprodukten.',
    fr: 'Méthodologie de synthèse utilisée pour combiner plusieurs artefacts en produits de renseignement cohérents.',
    es: 'Metodología de síntesis para combinar múltiples artefactos en productos de inteligencia coherentes.',
    nl: 'Synthesemethodologie om meerdere artefacten te combineren tot samenhangende inlichtingenproducten.',
    ar: 'منهجية التوليف المستخدمة لدمج عدة قطع في منتجات استخباراتية متماسكة.',
    he: 'מתודולוגיית סינתזה לשילוב ארטיפקטים רבים למוצרי מודיעין קוהרנטיים.',
    ja: '複数の成果物を一貫したインテリジェンス製品に統合する統合方法論。',
    ko: '여러 산출물을 일관된 인텔리전스 제품으로 결합하는 통합 방법론.',
    zh: '将多份产物合并为连贯情报产品的综合方法论。',
  },
  'worldbank-indicator-mapping.md': {
    en: 'Mapping of World Bank development indicators into political-economic analysis.',
    sv: 'Mappning av Världsbankens utvecklingsindikatorer in i politisk-ekonomisk analys.',
    da: 'Kortlægning af Verdensbankens udviklingsindikatorer ind i politisk-økonomisk analyse.',
    no: 'Kartlegging av Verdensbankens utviklingsindikatorer inn i politisk-økonomisk analyse.',
    fi: 'Maailmanpankin kehitysindikaattoreiden kartoitus poliittis-taloudelliseen analyysiin.',
    de: 'Zuordnung der Weltbank-Entwicklungsindikatoren zur politisch-ökonomischen Analyse.',
    fr: 'Correspondance des indicateurs de développement de la Banque mondiale avec l\'analyse politico-économique.',
    es: 'Correspondencia de los indicadores de desarrollo del Banco Mundial con el análisis político-económico.',
    nl: 'Toewijzing van ontwikkelingsindicatoren van de Wereldbank aan politiek-economische analyse.',
    ar: 'ربط مؤشرات التنمية للبنك الدولي بالتحليل السياسي-الاقتصادي.',
    he: 'מיפוי אינדיקטורי פיתוח של הבנק העולמי לניתוח פוליטי־כלכלי.',
    ja: '世界銀行の開発指標を政治経済分析にマッピング。',
    ko: '세계은행 개발 지표를 정치·경제 분석으로 매핑.',
    zh: '将世界银行发展指标映射到政治经济分析中。',
  },
  'README.md': {
    en: 'Overview and entry-point for the full methodology library.',
    sv: 'Översikt och ingångspunkt till hela metodbiblioteket.',
    da: 'Oversigt og indgang til hele metodologibiblioteket.',
    no: 'Oversikt og inngangspunkt til hele metodikkbiblioteket.',
    fi: 'Yleiskatsaus ja sisääntulopiste koko metodologiakirjastoon.',
    de: 'Überblick und Einstiegspunkt für die gesamte Methodologie-Bibliothek.',
    fr: 'Aperçu et point d\'entrée de l\'ensemble de la bibliothèque méthodologique.',
    es: 'Resumen y punto de entrada de toda la biblioteca de metodologías.',
    nl: 'Overzicht en toegangspunt voor de volledige methodologie-bibliotheek.',
    ar: 'نظرة عامة ونقطة دخول إلى مكتبة المنهجيات الكاملة.',
    he: 'סקירה ונקודת כניסה לספריית המתודולוגיות המלאה.',
    ja: '方法論ライブラリ全体の概観とエントリーポイント。',
    ko: '전체 방법론 라이브러리의 개요 및 진입점.',
    zh: '完整方法论库的概览与入口。',
  },
};

/** Per-language label + brief description pattern for every template / artifact
 *  file. Templates share a translated "kind" prefix (%k) followed by the
 *  artifact-specific localised label (%t). Filenames unknown to the system fall
 *  back to a fully localised generic phrase constructed from this pattern. */
const TEMPLATE_DESC_I18N: Record<string, LangMap> = {
  'executive-brief.md': {
    en: 'Executive brief: concise 2-page decision-maker summary with top findings and recommendations.',
    sv: 'Chefsbriefing: koncis 2-sidig beslutsfattarsammanfattning med främsta fynd och rekommendationer.',
    da: 'Ledelsesbriefing: kortfattet 2-sidet sammenfatning for beslutningstagere med topfund og anbefalinger.',
    no: 'Ledelsesbrief: kortfattet 2-siders beslutningstakersammendrag med hovedfunn og anbefalinger.',
    fi: 'Johdon lyhyt katsaus: tiivis 2-sivuinen päätöksentekijöille suunnattu yhteenveto keskeisistä havainnoista ja suosituksista.',
    de: 'Executive Brief: prägnante 2-seitige Entscheiderzusammenfassung mit Kernerkenntnissen und Empfehlungen.',
    fr: 'Note de direction : synthèse concise de 2 pages pour décideurs avec constats clés et recommandations.',
    es: 'Resumen ejecutivo: síntesis concisa de 2 páginas para responsables con principales hallazgos y recomendaciones.',
    nl: 'Executive brief: beknopte 2-pagina samenvatting voor besluitvormers met hoofdbevindingen en aanbevelingen.',
    ar: 'ملخص تنفيذي: موجز مؤلف من صفحتين لصنّاع القرار يتضمن أهم النتائج والتوصيات.',
    he: 'תקציר מנהלים: סיכום תמציתי של 2 עמודים למקבלי החלטות עם ממצאים מרכזיים והמלצות.',
    ja: 'エグゼクティブ・ブリーフ：主要な発見と提言を含む意思決定者向けの簡潔な 2 ページ要約。',
    ko: '임원 브리핑: 주요 발견과 권고를 담은 2페이지 분량의 의사결정자용 간결 요약.',
    zh: '执行摘要：面向决策者的简明 2 页摘要，涵盖主要发现与建议。',
  },
  'risk-assessment.md': {
    en: 'Risk assessment: enumerated risks with likelihood, impact, mitigations and monitoring indicators.',
    sv: 'Riskbedömning: listade risker med sannolikhet, konsekvens, åtgärder och övervakningsindikatorer.',
    da: 'Risikovurdering: opremsede risici med sandsynlighed, konsekvens, afbødning og overvågningsindikatorer.',
    no: 'Risikovurdering: opplistede risikoer med sannsynlighet, konsekvens, tiltak og overvåkingsindikatorer.',
    fi: 'Riskiarvio: luetellut riskit todennäköisyydellä, vaikutuksella, lieventämistoimilla ja seurantamittareilla.',
    de: 'Risikobewertung: aufgelistete Risiken mit Wahrscheinlichkeit, Auswirkung, Gegenmaßnahmen und Überwachungsindikatoren.',
    fr: 'Évaluation des risques : risques énumérés avec probabilité, impact, mesures d\'atténuation et indicateurs de suivi.',
    es: 'Evaluación de riesgos: riesgos enumerados con probabilidad, impacto, mitigaciones e indicadores de seguimiento.',
    nl: 'Risicobeoordeling: opgesomde risico\'s met waarschijnlijkheid, impact, mitigaties en monitoringindicatoren.',
    ar: 'تقييم المخاطر: مخاطر محصورة مع الاحتمال والتأثير وإجراءات التخفيف ومؤشرات الرصد.',
    he: 'הערכת סיכונים: רשימת סיכונים עם הסתברות, השפעה, הקלות ומדדי ניטור.',
    ja: 'リスク評価：確率・影響・緩和策・監視指標を伴う列挙型リスク一覧。',
    ko: '위험 평가: 가능성·영향·완화·모니터링 지표를 갖춘 위험 목록.',
    zh: '风险评估：列出风险及其可能性、影响、缓解措施与监测指标。',
  },
  'swot-analysis.md': {
    en: 'SWOT analysis: strengths, weaknesses, opportunities and threats mapped to actors or positions.',
    sv: 'SWOT-analys: styrkor, svagheter, möjligheter och hot kopplade till aktörer eller positioner.',
    da: 'SWOT-analyse: styrker, svagheder, muligheder og trusler knyttet til aktører eller holdninger.',
    no: 'SWOT-analyse: styrker, svakheter, muligheter og trusler knyttet til aktører eller posisjoner.',
    fi: 'SWOT-analyysi: vahvuudet, heikkoudet, mahdollisuudet ja uhat toimijoille tai kannoille kartoitettuna.',
    de: 'SWOT-Analyse: Stärken, Schwächen, Chancen und Risiken, zugeordnet zu Akteuren oder Positionen.',
    fr: 'Analyse SWOT : forces, faiblesses, opportunités et menaces associées aux acteurs ou aux positions.',
    es: 'Análisis SWOT: fortalezas, debilidades, oportunidades y amenazas asociadas a actores o posiciones.',
    nl: 'SWOT-analyse: sterktes, zwaktes, kansen en bedreigingen gekoppeld aan actoren of standpunten.',
    ar: 'تحليل SWOT: نقاط القوة والضعف والفرص والتهديدات المرتبطة بالفاعلين أو المواقف.',
    he: 'ניתוח SWOT: חוזקות, חולשות, הזדמנויות ואיומים ממופים לשחקנים או עמדות.',
    ja: 'SWOT 分析：アクターまたは立場に紐づく強み・弱み・機会・脅威。',
    ko: 'SWOT 분석: 행위자 또는 입장에 연결된 강점·약점·기회·위협.',
    zh: 'SWOT 分析：将优势、劣势、机会与威胁映射到行为者或立场。',
  },
  'stakeholder-map.md': {
    en: 'Stakeholder map: actors, interests, influence and alignment across the covered issue.',
    sv: 'Intressentkarta: aktörer, intressen, inflytande och samsyn kring den aktuella frågan.',
    da: 'Interessentkort: aktører, interesser, indflydelse og samstemmighed omkring emnet.',
    no: 'Interessentkart: aktører, interesser, innflytelse og samstemmighet rundt saken.',
    fi: 'Sidosryhmäkartta: toimijat, intressit, vaikutusvalta ja asemointi käsiteltävässä kysymyksessä.',
    de: 'Stakeholder-Karte: Akteure, Interessen, Einfluss und Ausrichtung zum behandelten Thema.',
    fr: 'Carte des parties prenantes : acteurs, intérêts, influence et alignements sur le sujet traité.',
    es: 'Mapa de partes interesadas: actores, intereses, influencia y alineamiento respecto al tema tratado.',
    nl: 'Stakeholderkaart: actoren, belangen, invloed en positionering rond het behandelde onderwerp.',
    ar: 'خريطة الأطراف المعنية: الفاعلون والمصالح والنفوذ والاصطفاف بشأن الموضوع.',
    he: 'מפת בעלי עניין: שחקנים, אינטרסים, השפעה והתיישרות סביב הנושא.',
    ja: 'ステークホルダー・マップ：対象イシューに関わるアクター、利害、影響力、同盟関係。',
    ko: '이해관계자 지도: 해당 이슈를 둘러싼 행위자·이해·영향력·정합성.',
    zh: '利益相关者地图：围绕所涉议题的行为者、利益、影响力与立场对齐。',
  },
  'threat-analysis.md': {
    en: 'Threat analysis: adversary mapping, attack surfaces and defence priorities.',
    sv: 'Hotanalys: motståndarkartläggning, angreppsytor och försvarsprioriteringar.',
    da: 'Trusselsanalyse: modstanderkortlægning, angrebsflader og forsvarsprioriteter.',
    no: 'Trusselanalyse: motstanderkartlegging, angrepsflater og forsvarsprioriteringer.',
    fi: 'Uhka-analyysi: vastustajien kartoitus, hyökkäyspinnat ja puolustusprioriteetit.',
    de: 'Bedrohungsanalyse: Gegner-Mapping, Angriffsflächen und Verteidigungsprioritäten.',
    fr: 'Analyse des menaces : cartographie des adversaires, surfaces d\'attaque et priorités de défense.',
    es: 'Análisis de amenazas: mapeo de adversarios, superficies de ataque y prioridades de defensa.',
    nl: 'Dreigingsanalyse: tegenstander-mapping, aanvalsvlakken en verdedigingsprioriteiten.',
    ar: 'تحليل التهديدات: رسم خرائط الخصوم وأسطح الهجوم وأولويات الدفاع.',
    he: 'ניתוח איומים: מיפוי יריבים, משטחי תקיפה ועדיפויות הגנה.',
    ja: '脅威分析：アドバーサリー・マッピング、攻撃面、防御優先順位。',
    ko: '위협 분석: 적대자 매핑·공격 표면·방어 우선순위.',
    zh: '威胁分析：对手映射、攻击面与防御优先级。',
  },
  'scenario-planning.md': {
    en: 'Scenario planning: 3-5 plausible futures with drivers, indicators and decision points.',
    sv: 'Scenarioplanering: 3–5 troliga framtider med drivkrafter, indikatorer och beslutspunkter.',
    da: 'Scenarieplanlægning: 3-5 plausible fremtider med drivkræfter, indikatorer og beslutningspunkter.',
    no: 'Scenarieplanlegging: 3-5 sannsynlige fremtider med drivkrefter, indikatorer og beslutningspunkter.',
    fi: 'Skenaariosuunnittelu: 3–5 uskottavaa tulevaisuutta ajureineen, indikaattoreineen ja päätöspisteineen.',
    de: 'Szenarienplanung: 3-5 plausible Zukünfte mit Treibern, Indikatoren und Entscheidungspunkten.',
    fr: 'Planification de scénarios : 3-5 futurs plausibles avec moteurs, indicateurs et points de décision.',
    es: 'Planificación de escenarios: 3-5 futuros plausibles con impulsores, indicadores y puntos de decisión.',
    nl: 'Scenarioplanning: 3-5 aannemelijke toekomsten met drivers, indicatoren en beslispunten.',
    ar: 'تخطيط السيناريوهات: 3-5 سيناريوهات مستقبلية معقولة مع محركات ومؤشرات ونقاط قرار.',
    he: 'תכנון תרחישים: 3-5 עתידים סבירים עם מניעים, אינדיקטורים ונקודות החלטה.',
    ja: 'シナリオ・プランニング：駆動要因・指標・意思決定点を伴う 3〜5 の妥当な未来像。',
    ko: '시나리오 기획: 동인·지표·결정 시점을 갖춘 3~5개의 타당한 미래.',
    zh: '情景规划：包含驱动因素、指标与决策点的 3–5 种可能未来。',
  },
  'behavioral-analysis.md': {
    en: 'Behavioural analysis: political psychology patterns, incentives and likely responses.',
    sv: 'Beteendeanalys: politisk-psykologiska mönster, incitament och troliga reaktioner.',
    da: 'Adfærdsanalyse: politisk-psykologiske mønstre, incitamenter og sandsynlige reaktioner.',
    no: 'Atferdsanalyse: politisk-psykologiske mønstre, insentiver og sannsynlige reaksjoner.',
    fi: 'Käyttäytymisanalyysi: poliittis-psykologiset mallit, kannustimet ja todennäköiset reaktiot.',
    de: 'Verhaltensanalyse: politisch-psychologische Muster, Anreize und wahrscheinliche Reaktionen.',
    fr: 'Analyse comportementale : schémas psycho-politiques, incitations et réactions probables.',
    es: 'Análisis conductual: patrones psico-políticos, incentivos y respuestas probables.',
    nl: 'Gedragsanalyse: politiek-psychologische patronen, prikkels en waarschijnlijke reacties.',
    ar: 'تحليل سلوكي: أنماط نفسية-سياسية وحوافز وردود أفعال محتملة.',
    he: 'ניתוח התנהגותי: דפוסי פסיכולוגיה פוליטית, תמריצים ותגובות צפויות.',
    ja: '行動分析：政治心理パターン、インセンティブ、予想される反応。',
    ko: '행동 분석: 정치 심리 패턴·유인·예상 반응.',
    zh: '行为分析：政治心理模式、激励与可能反应。',
  },
  'synthesis.md': {
    en: 'Synthesis: integrated narrative weaving together every artifact into a coherent intelligence product.',
    sv: 'Syntes: integrerad berättelse som väver samman varje artefakt till en sammanhängande underrättelseprodukt.',
    da: 'Syntese: integreret fortælling der væver hver artefakt sammen til ét sammenhængende efterretningsprodukt.',
    no: 'Syntese: integrert fortelling som vever hver artefakt sammen til ett sammenhengende etterretningsprodukt.',
    fi: 'Synteesi: integroitu kertomus, joka kutoo jokaisen artefaktin johdonmukaiseksi tiedustelutuotteeksi.',
    de: 'Synthese: integrierte Erzählung, die jedes Artefakt zu einem kohärenten Intelligenzprodukt verwebt.',
    fr: 'Synthèse : récit intégré tissant chaque artefact en un produit de renseignement cohérent.',
    es: 'Síntesis: narrativa integrada que teje cada artefacto en un producto de inteligencia coherente.',
    nl: 'Synthese: geïntegreerd narratief dat elk artefact samenvlecht tot een coherent inlichtingenproduct.',
    ar: 'توليف: سرد متكامل ينسج كل قطعة في منتج استخباراتي متماسك.',
    he: 'סינתזה: נרטיב משולב השוזר כל ארטיפקט למוצר מודיעין קוהרנטי.',
    ja: '統合：すべての成果物を一貫したインテリジェンス製品へ織り上げる統合的ナラティブ。',
    ko: '종합: 모든 산출물을 일관된 인텔리전스 제품으로 엮는 통합 서사.',
    zh: '综合：将每份产物编织为连贯情报产品的整合叙事。',
  },
  'timeline.md': {
    en: 'Timeline: chronological narrative of events with dates, actors and causal links.',
    sv: 'Tidslinje: kronologisk redogörelse av händelser med datum, aktörer och kausala länkar.',
    da: 'Tidslinje: kronologisk fortælling om begivenheder med datoer, aktører og årsagssammenhænge.',
    no: 'Tidslinje: kronologisk fortelling om hendelser med datoer, aktører og årsakssammenhenger.',
    fi: 'Aikajana: tapahtumien kronologinen kuvaus päivämäärineen, toimijoineen ja syy-yhteyksineen.',
    de: 'Zeitleiste: chronologische Erzählung der Ereignisse mit Daten, Akteuren und Kausalverbindungen.',
    fr: 'Chronologie : récit chronologique des événements avec dates, acteurs et liens causaux.',
    es: 'Cronología: narrativa cronológica de eventos con fechas, actores y vínculos causales.',
    nl: 'Tijdlijn: chronologisch narratief van gebeurtenissen met data, actoren en causale links.',
    ar: 'الجدول الزمني: سرد زمني للأحداث مع التواريخ والفاعلين والروابط السببية.',
    he: 'ציר זמן: נרטיב כרונולוגי של אירועים עם תאריכים, שחקנים וקשרים סיבתיים.',
    ja: 'タイムライン：日付・アクター・因果関係を含む出来事の時系列ナラティブ。',
    ko: '타임라인: 날짜·행위자·인과관계를 담은 사건의 시계열 서사.',
    zh: '时间线：包含日期、行为者与因果联系的事件时序叙事。',
  },
  'classification-results.json': {
    en: 'Classification results: structured JSON with CIA/RTO/RPO scoring and information-security labelling.',
    sv: 'Klassificeringsresultat: strukturerad JSON med CIA/RTO/RPO-poäng och informationssäkerhetsmärkning.',
    da: 'Klassificeringsresultater: struktureret JSON med CIA/RTO/RPO-scoring og informationssikkerhedsmærkning.',
    no: 'Klassifiseringsresultater: strukturert JSON med CIA/RTO/RPO-scoring og informasjonssikkerhetsmerking.',
    fi: 'Luokitustulokset: jäsennelty JSON CIA/RTO/RPO-pisteytyksellä ja tietoturvamerkinnällä.',
    de: 'Klassifikationsergebnisse: strukturiertes JSON mit CIA/RTO/RPO-Scoring und Informationssicherheits-Kennzeichnung.',
    fr: 'Résultats de classification : JSON structuré avec notation CIA/RTO/RPO et étiquetage de sécurité de l\'information.',
    es: 'Resultados de clasificación: JSON estructurado con puntuación CIA/RTO/RPO y etiquetado de seguridad de la información.',
    nl: 'Classificatieresultaten: gestructureerde JSON met CIA/RTO/RPO-scoring en informatiebeveiligingslabeling.',
    ar: 'نتائج التصنيف: JSON منظم مع تقييم CIA/RTO/RPO ووسم أمن المعلومات.',
    he: 'תוצאות סיווג: JSON מובנה עם ניקוד CIA/RTO/RPO וסימון אבטחת מידע.',
    ja: '分類結果：CIA/RTO/RPO スコアリングと情報セキュリティラベルを含む構造化 JSON。',
    ko: '분류 결과: CIA/RTO/RPO 점수와 정보보안 라벨링을 담은 구조화 JSON.',
    zh: '分类结果：包含 CIA/RTO/RPO 评分与信息安全标注的结构化 JSON。',
  },
  'economic-data.json': {
    en: 'Economic data: curated macroeconomic indicators feeding downstream political-economy analyses.',
    sv: 'Ekonomisk data: kurerade makroekonomiska indikatorer som matar nedströms politisk-ekonomiska analyser.',
    da: 'Økonomiske data: kuraterede makroøkonomiske indikatorer der fødes ind i nedstrøms politisk-økonomiske analyser.',
    no: 'Økonomiske data: kuraterte makroøkonomiske indikatorer som mater nedstrøms politisk-økonomiske analyser.',
    fi: 'Taloustiedot: kuratoidut makrotaloudelliset indikaattorit, jotka syöttävät alavirran poliittis-taloudellisia analyyseja.',
    de: 'Wirtschaftsdaten: kuratierte makroökonomische Indikatoren für nachgelagerte politisch-ökonomische Analysen.',
    fr: 'Données économiques : indicateurs macroéconomiques sélectionnés alimentant les analyses d\'économie politique en aval.',
    es: 'Datos económicos: indicadores macroeconómicos curados que alimentan los análisis de economía política aguas abajo.',
    nl: 'Economische data: gecureerde macro-economische indicatoren die politieke-economie-analyses stroomafwaarts voeden.',
    ar: 'بيانات اقتصادية: مؤشرات اقتصاد كلي منسَّقة تُغذي تحليلات الاقتصاد السياسي اللاحقة.',
    he: 'נתונים כלכליים: אינדיקטורים מאקרו־כלכליים אוצרים המזינים ניתוחי כלכלה פוליטית במורד הזרם.',
    ja: '経済データ：下流の政治経済分析に供給する選定済みマクロ経済指標。',
    ko: '경제 데이터: 하류의 정치경제 분석에 공급되는 큐레이션된 거시경제 지표.',
    zh: '经济数据：为下游政治经济分析提供支撑的精选宏观经济指标。',
  },
  'README.md': {
    en: 'Overview and entry-point for the full template library.',
    sv: 'Översikt och ingångspunkt till hela mallbiblioteket.',
    da: 'Oversigt og indgang til hele skabelonbiblioteket.',
    no: 'Oversikt og inngangspunkt til hele malbiblioteket.',
    fi: 'Yleiskatsaus ja sisääntulopiste koko mallikirjastoon.',
    de: 'Überblick und Einstiegspunkt für die gesamte Vorlagen-Bibliothek.',
    fr: 'Aperçu et point d\'entrée de la bibliothèque complète de modèles.',
    es: 'Resumen y punto de entrada de toda la biblioteca de plantillas.',
    nl: 'Overzicht en toegangspunt voor de volledige sjabloonbibliotheek.',
    ar: 'نظرة عامة ونقطة دخول لمكتبة القوالب الكاملة.',
    he: 'סקירה ונקודת כניסה לספריית התבניות המלאה.',
    ja: 'テンプレートライブラリ全体の概観とエントリーポイント。',
    ko: '전체 템플릿 라이브러리의 개요 및 진입점.',
    zh: '完整模板库的概览与入口。',
  },
};

/** Generic "template in the X library" fallback phrase, localised per language.
 *  The two placeholders are replaced with the prettified filename and library name. */
const TEMPLATE_GENERIC_DESC_I18N: Record<Language, string> = {
  en: '%t — reference template in the %l library.',
  sv: '%t — referensmall i biblioteket %l.',
  da: '%t — referenceskabelon i biblioteket %l.',
  no: '%t — referansemaal i biblioteket %l.',
  fi: '%t — viitemalli kirjastossa %l.',
  de: '%t — Referenzvorlage in der Bibliothek %l.',
  fr: '%t — modèle de référence dans la bibliothèque %l.',
  es: '%t — plantilla de referencia en la biblioteca %l.',
  nl: '%t — referentiesjabloon in de bibliotheek %l.',
  ar: '%t — قالب مرجعي في مكتبة %l.',
  he: '%t — תבנית ייחוס בספרייה %l.',
  ja: '%t — %l ライブラリ内の参照テンプレート。',
  ko: '%t — %l 라이브러리의 참조 템플릿.',
  zh: '%t — %l 库中的参考模板。',
};

/** Per-language display title for every artifact filename that appears in daily
 *  streams. Falls back to the English prettified filename when missing. */
const ARTIFACT_TITLE_I18N: Record<string, LangMap> = {
  'executive-brief.md': {
    en: 'Executive Brief', sv: 'Chefsbriefing', da: 'Ledelsesbriefing', no: 'Ledelsesbrief', fi: 'Johdon lyhyt katsaus',
    de: 'Executive Brief', fr: 'Note de direction', es: 'Resumen ejecutivo', nl: 'Executive brief',
    ar: 'ملخص تنفيذي', he: 'תקציר מנהלים', ja: 'エグゼクティブ・ブリーフ', ko: '임원 브리핑', zh: '执行摘要',
  },
  'risk-assessment.md': {
    en: 'Risk Assessment', sv: 'Riskbedömning', da: 'Risikovurdering', no: 'Risikovurdering', fi: 'Riskiarvio',
    de: 'Risikobewertung', fr: 'Évaluation des risques', es: 'Evaluación de riesgos', nl: 'Risicobeoordeling',
    ar: 'تقييم المخاطر', he: 'הערכת סיכונים', ja: 'リスク評価', ko: '위험 평가', zh: '风险评估',
  },
  'swot-analysis.md': {
    en: 'SWOT Analysis', sv: 'SWOT-analys', da: 'SWOT-analyse', no: 'SWOT-analyse', fi: 'SWOT-analyysi',
    de: 'SWOT-Analyse', fr: 'Analyse SWOT', es: 'Análisis SWOT', nl: 'SWOT-analyse',
    ar: 'تحليل SWOT', he: 'ניתוח SWOT', ja: 'SWOT 分析', ko: 'SWOT 분석', zh: 'SWOT 分析',
  },
  'stakeholder-map.md': {
    en: 'Stakeholder Map', sv: 'Intressentkarta', da: 'Interessentkort', no: 'Interessentkart', fi: 'Sidosryhmäkartta',
    de: 'Stakeholder-Karte', fr: 'Carte des parties prenantes', es: 'Mapa de partes interesadas', nl: 'Stakeholderkaart',
    ar: 'خريطة الأطراف المعنية', he: 'מפת בעלי עניין', ja: 'ステークホルダー・マップ', ko: '이해관계자 지도', zh: '利益相关者地图',
  },
  'threat-analysis.md': {
    en: 'Threat Analysis', sv: 'Hotanalys', da: 'Trusselsanalyse', no: 'Trusselanalyse', fi: 'Uhka-analyysi',
    de: 'Bedrohungsanalyse', fr: 'Analyse des menaces', es: 'Análisis de amenazas', nl: 'Dreigingsanalyse',
    ar: 'تحليل التهديدات', he: 'ניתוח איומים', ja: '脅威分析', ko: '위협 분석', zh: '威胁分析',
  },
  'scenario-planning.md': {
    en: 'Scenario Planning', sv: 'Scenarioplanering', da: 'Scenarieplanlægning', no: 'Scenarieplanlegging', fi: 'Skenaariosuunnittelu',
    de: 'Szenarienplanung', fr: 'Planification de scénarios', es: 'Planificación de escenarios', nl: 'Scenarioplanning',
    ar: 'تخطيط السيناريوهات', he: 'תכנון תרחישים', ja: 'シナリオ・プランニング', ko: '시나리오 기획', zh: '情景规划',
  },
  'behavioral-analysis.md': {
    en: 'Behavioural Analysis', sv: 'Beteendeanalys', da: 'Adfærdsanalyse', no: 'Atferdsanalyse', fi: 'Käyttäytymisanalyysi',
    de: 'Verhaltensanalyse', fr: 'Analyse comportementale', es: 'Análisis conductual', nl: 'Gedragsanalyse',
    ar: 'تحليل سلوكي', he: 'ניתוח התנהגותי', ja: '行動分析', ko: '행동 분석', zh: '行为分析',
  },
  'synthesis.md': {
    en: 'Synthesis', sv: 'Syntes', da: 'Syntese', no: 'Syntese', fi: 'Synteesi',
    de: 'Synthese', fr: 'Synthèse', es: 'Síntesis', nl: 'Synthese',
    ar: 'توليف', he: 'סינתזה', ja: '統合', ko: '종합', zh: '综合',
  },
  'timeline.md': {
    en: 'Timeline', sv: 'Tidslinje', da: 'Tidslinje', no: 'Tidslinje', fi: 'Aikajana',
    de: 'Zeitleiste', fr: 'Chronologie', es: 'Cronología', nl: 'Tijdlijn',
    ar: 'الجدول الزمني', he: 'ציר זמן', ja: 'タイムライン', ko: '타임라인', zh: '时间线',
  },
  'classification-results.json': {
    en: 'Classification Results', sv: 'Klassificeringsresultat', da: 'Klassificeringsresultater', no: 'Klassifiseringsresultater', fi: 'Luokitustulokset',
    de: 'Klassifikationsergebnisse', fr: 'Résultats de classification', es: 'Resultados de clasificación', nl: 'Classificatieresultaten',
    ar: 'نتائج التصنيف', he: 'תוצאות סיווג', ja: '分類結果', ko: '분류 결과', zh: '分类结果',
  },
  'economic-data.json': {
    en: 'Economic Data', sv: 'Ekonomisk data', da: 'Økonomiske data', no: 'Økonomiske data', fi: 'Taloustiedot',
    de: 'Wirtschaftsdaten', fr: 'Données économiques', es: 'Datos económicos', nl: 'Economische data',
    ar: 'بيانات اقتصادية', he: 'נתונים כלכליים', ja: '経済データ', ko: '경제 데이터', zh: '经济数据',
  },
  'README.md': {
    en: 'README', sv: 'Läs mig', da: 'Læs mig', no: 'Les meg', fi: 'Lue minut',
    de: 'Lies mich', fr: 'Lisez-moi', es: 'Léame', nl: 'Lees mij',
    ar: 'اقرأني', he: 'קרא אותי', ja: 'お読みください', ko: '읽어 주세요', zh: '自述文件',
  },
};

/** Generic library-display-name phrases, localised per language. */
const LIBRARY_NAME_I18N: Record<'methodologies' | 'templates', LangMap> = {
  methodologies: {
    en: 'methodologies', sv: 'metoder', da: 'metoder', no: 'metoder', fi: 'metodit',
    de: 'Methoden', fr: 'méthodologies', es: 'metodologías', nl: 'methodologieën',
    ar: 'منهجيات', he: 'מתודולוגיות', ja: '方法論', ko: '방법론', zh: '方法论',
  },
  templates: {
    en: 'templates', sv: 'mallar', da: 'skabeloner', no: 'maler', fi: 'mallit',
    de: 'Vorlagen', fr: 'modèles', es: 'plantillas', nl: 'sjablonen',
    ar: 'قوالب', he: 'תבניות', ja: 'テンプレート', ko: '템플릿', zh: '模板',
  },
};

/** Localised display title for an artifact filename. Falls back to English prettify. */
function artifactTitle(file: string, lang: Language): string {
  return ARTIFACT_TITLE_I18N[file]?.[lang]
      ?? ARTIFACT_TITLE_I18N[file]?.en
      ?? prettifyMarkdownTitle(file);
}

/** Localised description for a methodology/template/artifact filename. */
function localisedCatalogDescription(
  file: string,
  lang: Language,
  library: 'methodologies' | 'templates',
  englishFallback: string,
): string {
  const map = library === 'methodologies' ? METHODOLOGY_DESC_I18N : TEMPLATE_DESC_I18N;
  const hit = map[file]?.[lang];
  if (hit) return hit;
  // Generic localised template/methodology fallback: "<title> — reference template in the <library> library."
  if (library === 'templates') {
    const pattern = TEMPLATE_GENERIC_DESC_I18N[lang] ?? TEMPLATE_GENERIC_DESC_I18N.en;
    const title = artifactTitle(file, lang);
    const libName = LIBRARY_NAME_I18N.templates[lang] ?? LIBRARY_NAME_I18N.templates.en;
    return pattern.replace('%t', title).replace('%l', libName);
  }
  // Methodology: fall back to English canonical description so we never leave blanks.
  return englishFallback;
}

function prettifyStream(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function streamIcon(name: string): string {
  if (STREAM_META[name]) return STREAM_META[name].icon;
  if (name === 'documents') return '📂';
  if (name.startsWith('realtime-')) return '⏱️';
  if (name.startsWith('morning-')) return '🌅';
  if (name.startsWith('midday-')) return '🕛';
  if (name.startsWith('evening-')) return '🌙';
  return '📦';
}

/** Localised stream display name (falls back to English prettify). */
function streamDisplayName(name: string, lang: Language): string {
  const hit = STREAM_NAME_I18N[name]?.[lang];
  if (hit) return hit;
  // Preserve timestamp suffix for realtime-HHMM → "Realtime HH:MM" variants
  const match = name.match(/^realtime-(\d{2})(\d{2})$/);
  if (match) {
    const base = STREAM_NAME_I18N['breaking-news']?.[lang] ?? 'Realtime';
    // Use English "Realtime" label for clarity across languages
    return `${lang === 'en' ? 'Realtime' : base.replace(/breaking[-\s]?news?/i, 'Realtime')} ${match[1]}:${match[2]}`;
  }
  return prettifyStream(name);
}

/** Localised stream description. */
function streamDescription(name: string, lang: Language): string {
  const hit = STREAM_DESC_I18N[name]?.[lang];
  if (hit) return hit;
  if (name.startsWith('realtime-')) return REALTIME_DESC_I18N[lang];
  const generic = STREAM_GENERIC_DESC_I18N[lang] ?? STREAM_GENERIC_DESC_I18N.en;
  return generic.replace('%s', streamDisplayName(name, lang));
}

function prettifyMarkdownTitle(file: string): string {
  return file
    .replace(/\.md$/i, '')
    .replace(/\.json$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Analysis data collection
// ---------------------------------------------------------------------------

function buildGithubUrl(type: 'blob' | 'tree', relative: string): string {
  const base = type === 'blob' ? GITHUB_BLOB : GITHUB_TREE;
  const encoded = relative.split('/').map(encodeURIComponent).join('/');
  return `${base}/${encoded}`;
}

function collectCatalog(
  dir: string,
  relativePrefix: string,
  metaMap: Record<string, { icon: string; description: string }>,
  library: 'methodologies' | 'templates',
): CatalogEntry[] {
  if (!fs.existsSync(dir)) return [];
  const entries: CatalogEntry[] = [];
  for (const name of fs.readdirSync(dir).sort((a, b) => a.localeCompare(b))) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    if (!/\.(md|json)$/i.test(name)) continue;
    const meta = metaMap[name];
    entries.push({
      file: name,
      title: prettifyMarkdownTitle(name),
      icon: meta?.icon ?? (name.endsWith('.json') ? '📊' : '📄'),
      description: meta?.description ?? `${prettifyMarkdownTitle(name)} — reference document in the ${relativePrefix.split('/').pop()} library.`,
      githubUrl: buildGithubUrl('blob', `${relativePrefix}/${name}`),
      library,
    });
  }
  return entries;
}

interface DailyArtifact {
  readonly file: string;
  /** Path relative to analysis/daily (e.g. 2026-04-23/propositions/executive-brief.md). */
  readonly relative: string;
  readonly githubUrl: string;
}

interface DailyStream {
  readonly name: string;
  readonly githubUrl: string;
  readonly artifactCount: number;
  readonly artifacts: DailyArtifact[];
}

interface DailyDay {
  readonly date: string;
  readonly githubUrl: string;
  readonly streams: DailyStream[];
  readonly totalArtifacts: number;
}

function countArtifactsRecursive(dir: string): number {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      n += countArtifactsRecursive(full);
    } else if (e.isFile() && /\.(md|json)$/i.test(e.name)) {
      n += 1;
    }
  }
  return n;
}

/** Recursively collect every `.md`/`.json` artifact under a stream folder, sorted by relative path. */
function collectStreamArtifacts(streamDir: string, streamRelativeBase: string): DailyArtifact[] {
  if (!fs.existsSync(streamDir)) return [];
  const out: DailyArtifact[] = [];
  const walk = (dir: string, relBase: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) {
        walk(full, rel);
      } else if (e.isFile() && /\.(md|json)$/i.test(e.name)) {
        out.push({
          file: rel,
          relative: `${streamRelativeBase}/${rel}`,
          githubUrl: buildGithubUrl('blob', `analysis/daily/${streamRelativeBase}/${rel}`),
        });
      }
    }
  };
  walk(streamDir, '');
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

function collectDailyDays(): DailyDay[] {
  if (!fs.existsSync(DAILY_DIR)) return [];
  const days: DailyDay[] = [];
  const dateEntries = fs.readdirSync(DAILY_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => b.localeCompare(a)); // newest first

  for (const date of dateEntries) {
    const dateDir = path.join(DAILY_DIR, date);
    const streamNames = fs.readdirSync(dateDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    const streams: DailyStream[] = streamNames.map((name) => {
      const streamDir = path.join(dateDir, name);
      const artifacts = collectStreamArtifacts(streamDir, `${date}/${name}`);
      return {
        name,
        githubUrl: buildGithubUrl('tree', `analysis/daily/${date}/${name}`),
        artifactCount: artifacts.length || countArtifactsRecursive(streamDir),
        artifacts,
      };
    });

    const totalArtifacts = streams.reduce((a, s) => a + s.artifactCount, 0);

    days.push({
      date,
      githubUrl: buildGithubUrl('tree', `analysis/daily/${date}`),
      streams,
      totalArtifacts,
    });
  }

  return days;
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

function hreflangCodeOf(lang: Language): string {
  return LANGUAGE_META[lang].hreflang;
}

function renderCatalogGrid(entries: CatalogEntry[], openLabel: string, lang: Language): string {
  return entries.map((e) => {
    const desc = localisedCatalogDescription(e.file, lang, e.library, e.description);
    const title = artifactTitle(e.file, lang) || e.title;
    return `
        <article class="pi-card">
          <div class="pi-card-icon" aria-hidden="true">${e.icon}</div>
          <h3 class="pi-card-title"><a href="${e.githubUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
          <p class="pi-card-desc">${escapeHtml(desc)}</p>
          <p class="pi-card-meta"><code class="pi-card-file">${escapeHtml(e.file)}</code></p>
          <p class="pi-card-link"><a href="${e.githubUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(openLabel)} <span aria-hidden="true">↗</span></a></p>
        </article>`;
  }).join('\n');
}

function renderDailyDay(day: DailyDay, t: PiTranslations, lang: Language): string {
  const streamsHtml = day.streams.map((s) => {
    const displayName = streamDisplayName(s.name, lang);
    const desc = streamDescription(s.name, lang);
    const artifactsHtml = s.artifacts.length > 0
      ? `
              <details class="pi-stream-artifacts">
                <summary class="pi-stream-artifacts-summary">
                  <span class="pi-stream-artifacts-toggle" aria-hidden="true">▸</span>
                  <span class="pi-stream-artifacts-label">${escapeHtml(t.expandArtifacts)}</span>
                  <span class="pi-stream-artifacts-count">(${s.artifacts.length})</span>
                </summary>
                <ol class="pi-artifact-list" aria-label="${s.artifacts.length} ${escapeHtml(t.artifactsLabel)} — ${escapeHtml(displayName)}">
${s.artifacts.map((a) => `                  <li class="pi-artifact"><a href="${a.githubUrl}" target="_blank" rel="noopener noreferrer"><span class="pi-artifact-icon" aria-hidden="true">${artifactIcon(a.file)}</span> <span class="pi-artifact-title">${escapeHtml(artifactTitle(artifactBaseName(a.file), lang))}</span> <code class="pi-artifact-file">${escapeHtml(a.file)}</code></a></li>`).join('\n')}
                </ol>
              </details>`
      : '';
    return `
            <li class="pi-stream">
              <a class="pi-stream-link" href="${s.githubUrl}" target="_blank" rel="noopener noreferrer">
                <span class="pi-stream-icon" aria-hidden="true">${streamIcon(s.name)}</span>
                <span class="pi-stream-name">${escapeHtml(displayName)}</span>
                <span class="pi-stream-count" aria-label="${s.artifactCount} ${escapeHtml(t.artifacts)}">${s.artifactCount}</span>
              </a>
              <p class="pi-stream-desc">${escapeHtml(desc)}</p>${artifactsHtml}
            </li>`;
  }).join('\n');

  return `
      <article class="pi-day">
        <header class="pi-day-header">
          <h3><time datetime="${day.date}">${day.date}</time></h3>
          <span class="pi-day-total" aria-label="${day.totalArtifacts} ${escapeHtml(t.artifacts)}">${day.totalArtifacts} ${escapeHtml(t.artifacts)}</span>
          <a class="pi-day-github" href="${day.githubUrl}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(t.openOnGithub)} (${day.date})">
            <span aria-hidden="true">🔗</span> ${escapeHtml(t.openOnGithub)}
          </a>
        </header>
        <ul class="pi-streams">
${streamsHtml}
        </ul>
      </article>`;
}

/** Strip nested directory prefix from an artifact relative path so the i18n
 *  title lookup sees just the filename (e.g. "sub/executive-brief.md" → "executive-brief.md"). */
function artifactBaseName(file: string): string {
  const idx = file.lastIndexOf('/');
  return idx >= 0 ? file.slice(idx + 1) : file;
}

/** Icon helper for an individual artifact filename. */
function artifactIcon(file: string): string {
  const base = artifactBaseName(file);
  if (TEMPLATE_META[base]?.icon) return TEMPLATE_META[base].icon;
  if (METHODOLOGY_META[base]?.icon) return METHODOLOGY_META[base].icon;
  if (/\.json$/i.test(base)) return '📊';
  if (/readme/i.test(base)) return '📘';
  return '📄';
}

function renderHreflangTags(current: Language): string {
  return LANGUAGES.map((l) => {
    const href = l === 'en' ? 'political-intelligence.html' : `political-intelligence_${l}.html`;
    return `    <link rel="alternate" hreflang="${hreflangCodeOf(l)}" href="${BASE_URL}/${href}">`;
  }).concat([
    `    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/political-intelligence.html">`,
    `    <link rel="canonical" href="${BASE_URL}/${current === 'en' ? 'political-intelligence.html' : `political-intelligence_${current}.html`}">`,
  ]).join('\n');
}

function generatePoliticalIntelligenceHtml(lang: Language): string {
  const meta = LANGUAGE_META[lang];
  const t = PI_TRANSLATIONS[lang];
  const isEnglish = lang === 'en';
  const selfFile = isEnglish ? 'political-intelligence.html' : `political-intelligence_${lang}.html`;
  const indexFile = isEnglish ? 'index.html' : `index_${lang}.html`;
  const sitemapFile = isEnglish ? 'sitemap.html' : `sitemap_${lang}.html`;

  const methodologies = collectCatalog(METHODOLOGIES_DIR, 'analysis/methodologies', METHODOLOGY_META, 'methodologies');
  const templates = collectCatalog(TEMPLATES_DIR, 'analysis/templates', TEMPLATE_META, 'templates');
  const days = collectDailyDays();
  const totalArtifacts = days.reduce((a, d) => a + d.totalArtifacts, 0);

  const RECENT = 14;
  const recentDays = days.slice(0, RECENT);
  const olderDays = days.slice(RECENT);

  const methodologyCardsHtml = renderCatalogGrid(methodologies, t.openOnGithub, lang);
  const templateCardsHtml = renderCatalogGrid(templates, t.openOnGithub, lang);
  const recentDaysHtml = recentDays.map((d) => renderDailyDay(d, t, lang)).join('\n');
  const olderDaysHtml = olderDays.map((d) => renderDailyDay(d, t, lang)).join('\n');

  const otherLangLinks = LANGUAGES
    .filter((l) => l !== lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = l === 'en' ? 'political-intelligence.html' : `political-intelligence_${l}.html`;
      return `        <a href="${href}" lang="${hreflangCodeOf(l)}" title="${escapeHtml(lm.nativeName)}"><span aria-hidden="true">${lm.flag}</span> ${lm.nativeName}</a>`;
    })
    .join('\n');

  // Latest analysis date — used as `dateModified` for SEO/JSON-LD; falls back
  // to today when no daily artifacts have been generated yet.
  const latestDate = days[0]?.date ?? new Date().toISOString().slice(0, 10);
  const buildIso = new Date().toISOString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${t.title} — Riksdagsmonitor`,
    headline: `${t.title} — Riksdagsmonitor`,
    description: t.metaDescription,
    keywords: t.metaKeywords,
    inLanguage: hreflangCodeOf(lang),
    url: `${BASE_URL}/${selfFile}`,
    mainEntityOfPage: `${BASE_URL}/${selfFile}`,
    dateModified: latestDate,
    dateCreated: '2026-04-01',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Riksdagsmonitor',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Hack23 AB',
      url: 'https://www.hack23.com',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/logo.png`,
      },
    },
    about: [
      { '@type': 'Thing', name: 'Swedish Parliament political intelligence' },
      { '@type': 'Thing', name: 'OSINT methodologies' },
      { '@type': 'Thing', name: 'Political risk assessment' },
    ],
    hasPart: [
      {
        '@type': 'CreativeWork',
        name: t.methodologies,
        url: `${GITHUB_TREE}/analysis/methodologies`,
        description: t.methodologiesDesc,
      },
      {
        '@type': 'CreativeWork',
        name: t.templates,
        url: `${GITHUB_TREE}/analysis/templates`,
        description: t.templatesDesc,
      },
      {
        '@type': 'Dataset',
        name: t.dailyArtifacts,
        url: `${GITHUB_TREE}/analysis/daily`,
        description: t.dailyArtifactsDesc,
      },
    ],
  };

  // Detailed `ItemList` of recent days for richer search-engine results.
  const recentDaysItemList = recentDays.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t.recentDays,
    numberOfItems: recentDays.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: recentDays.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: d.date,
      url: d.githubUrl,
    })),
  } : null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.home, item: `${BASE_URL}/${indexFile}` },
      { '@type': 'ListItem', position: 2, name: t.title, item: `${BASE_URL}/${selfFile}` },
    ],
  };

  return `<!DOCTYPE html>
<html lang="${hreflangCodeOf(lang)}" dir="${meta.dir}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(t.title)} — Riksdagsmonitor</title>
    <meta name="description" content="${escapeHtml(t.metaDescription)}">
    <meta name="keywords" content="${escapeHtml(t.metaKeywords)}">
    <meta name="news_keywords" content="${escapeHtml(t.metaKeywords)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="James Pether Sörling, CISSP, CISM">
    <meta name="publisher" content="Hack23 AB">
    <meta name="theme-color" content="#0a0e27">
    <meta name="color-scheme" content="dark light">
    <meta name="generator" content="riksdagsmonitor:scripts/generate-political-intelligence.ts">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta http-equiv="Content-Language" content="${hreflangCodeOf(lang)}">

    <!-- Performance hints: preconnect to outbound link targets -->
    <link rel="preconnect" href="https://github.com" crossorigin>
    <link rel="dns-prefetch" href="https://github.com">
    <link rel="preconnect" href="https://www.hack23.com" crossorigin>

    <link rel="stylesheet" type="text/css" href="styles.css">

    <!-- Hreflang + canonical -->
${renderHreflangTags(lang)}

    <!-- Sitemap + RSS feed -->
    <link rel="sitemap" type="application/xml" href="/sitemap.xml">
    <link rel="alternate" type="application/rss+xml" title="Riksdagsmonitor news (English)" href="/rss/news.xml">
    <link rel="alternate" type="application/rss+xml" title="Riksdagsmonitor news (${escapeHtml(meta.nativeName)})" href="/rss/news_${lang}.xml">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Riksdagsmonitor">
    <meta property="og:title" content="${escapeHtml(t.title)} — Riksdagsmonitor">
    <meta property="og:description" content="${escapeHtml(t.metaDescription)}">
    <meta property="og:url" content="${BASE_URL}/${selfFile}">
    <meta property="og:locale" content="${meta.locale}">
${LANGUAGES.filter((l) => l !== lang).map((l) => `    <meta property="og:locale:alternate" content="${LANGUAGE_META[l].locale}">`).join('\n')}
    <meta property="og:image" content="${BASE_URL}/images/og-image.webp">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Riksdagsmonitor ${escapeHtml(t.title)}">
    <meta property="og:updated_time" content="${buildIso}">

    <!-- Article (collection-page) extras -->
    <meta property="article:publisher" content="https://www.hack23.com">
    <meta property="article:section" content="${escapeHtml(t.title)}">
    <meta property="article:modified_time" content="${buildIso}">
    <meta property="article:published_time" content="${latestDate}T00:00:00Z">
${(t.metaKeywords ?? '').split(',').slice(0, 8).map((k) => `    <meta property="article:tag" content="${escapeHtml(k.trim())}">`).join('\n')}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@riksdagsmonitor">
    <meta name="twitter:creator" content="@hack23ab">
    <meta name="twitter:title" content="${escapeHtml(t.title)} — Riksdagsmonitor">
    <meta name="twitter:description" content="${escapeHtml(t.metaDescription)}">
    <meta name="twitter:image" content="${BASE_URL}/images/og-image.webp">
    <meta name="twitter:image:alt" content="Riksdagsmonitor ${escapeHtml(t.title)}">

    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/images/favicon-96x96.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">
    <link rel="icon" href="/favicon.ico" sizes="48x48">
    <link rel="manifest" href="/site.webmanifest">

    <style>
        .pi-container { max-width: 1280px; margin: 0 auto; padding: 2rem 1rem 4rem; }
        .pi-hero {
            text-align: center;
            padding: 3rem 1rem;
            margin-bottom: 2.5rem;
            background: linear-gradient(135deg, rgba(0, 217, 255, 0.08), rgba(255, 0, 110, 0.06));
            border: 1px solid rgba(0, 217, 255, 0.25);
            border-radius: 12px;
        }
        .pi-hero h1 {
            font-family: var(--font-heading, 'Orbitron', sans-serif);
            color: var(--primary-cyan, #00d9ff);
            font-size: clamp(2rem, 4.5vw, 3.25rem);
            margin: 0 0 0.5rem;
            letter-spacing: 0.02em;
        }
        .pi-hero p.pi-subtitle {
            color: var(--primary-yellow, #ffbe0b);
            font-size: clamp(1rem, 2vw, 1.25rem);
            margin: 0.25rem 0 1rem;
            font-weight: 500;
        }
        .pi-hero p.pi-intro {
            color: var(--light-text, #e0e0e0);
            max-width: 900px;
            margin: 1rem auto 0;
            line-height: 1.7;
        }
        .pi-stats { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem; }
        .pi-stat {
            background: rgba(0, 217, 255, 0.08);
            border: 1px solid rgba(0, 217, 255, 0.3);
            padding: 0.75rem 1.25rem;
            border-radius: 999px;
            color: var(--light-text, #e0e0e0);
            font-size: 0.95rem;
        }
        .pi-stat strong { color: var(--primary-cyan, #00d9ff); font-size: 1.15rem; margin-right: 0.35rem; }
        .toc-nav {
            background: var(--mid-bg, #1a1e3d);
            border-radius: 8px;
            padding: 1.25rem 1.5rem;
            margin-bottom: 2rem;
            border-left: 4px solid var(--primary-cyan, #00d9ff);
        }
        .toc-nav h2 {
            font-family: var(--font-heading, 'Orbitron', sans-serif);
            color: var(--primary-cyan, #00d9ff);
            font-size: 1.1rem;
            margin: 0 0 0.75rem;
        }
        .toc-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem; }
        .toc-list a { color: var(--primary-cyan, #00d9ff); text-decoration: none; padding: 0.35rem 0; display: inline-block; }
        .toc-list a:hover, .toc-list a:focus { text-decoration: underline; }

        .pi-section { margin-bottom: 3.5rem; }
        .pi-section-header {
            display: flex; align-items: baseline; justify-content: space-between;
            flex-wrap: wrap; gap: 1rem;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--primary-magenta, #ff006e);
        }
        .pi-section-header h2 {
            font-family: var(--font-heading, 'Orbitron', sans-serif);
            color: var(--primary-magenta, #ff006e);
            font-size: clamp(1.5rem, 3vw, 2rem);
            margin: 0;
        }
        .pi-section-header .pi-section-link a {
            color: var(--primary-cyan, #00d9ff);
            font-size: 0.95rem;
            text-decoration: none;
        }
        .pi-section-header .pi-section-link a:hover { text-decoration: underline; }
        .pi-section-desc { color: var(--muted-text, #a0a3bd); max-width: 900px; line-height: 1.6; margin: 0.5rem 0 1.5rem; }

        .pi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .pi-card {
            background: var(--card-bg, rgba(26, 30, 61, 0.5));
            border: 1px solid rgba(0, 217, 255, 0.18);
            border-radius: 10px;
            padding: 1.25rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .pi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0, 217, 255, 0.15); border-color: rgba(0, 217, 255, 0.45); }
        .pi-card-icon { font-size: 2rem; line-height: 1; margin-bottom: 0.5rem; }
        .pi-card-title { margin: 0 0 0.5rem; font-family: var(--font-heading, 'Orbitron', sans-serif); font-size: 1.05rem; }
        .pi-card-title a { color: var(--primary-cyan, #00d9ff); text-decoration: none; }
        .pi-card-title a:hover, .pi-card-title a:focus { text-decoration: underline; }
        .pi-card-desc { color: var(--light-text, #e0e0e0); line-height: 1.55; margin: 0 0 0.75rem; font-size: 0.95rem; }
        .pi-card-meta { margin: 0 0 0.5rem; }
        .pi-card-file { font-family: var(--font-mono, 'Courier New', monospace); font-size: 0.8rem; color: var(--primary-yellow, #ffbe0b); background: rgba(255, 190, 11, 0.08); border: 1px solid rgba(255, 190, 11, 0.25); border-radius: 4px; padding: 0.1rem 0.4rem; }
        .pi-card-link a { color: var(--primary-cyan, #00d9ff); font-size: 0.9rem; text-decoration: none; }
        .pi-card-link a:hover { text-decoration: underline; }

        .pi-day { background: var(--card-bg, rgba(26, 30, 61, 0.5)); border: 1px solid rgba(0, 217, 255, 0.18); border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; }
        .pi-day-header { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .pi-day-header h3 { margin: 0; font-family: var(--font-heading, 'Orbitron', sans-serif); color: var(--primary-cyan, #00d9ff); font-size: 1.2rem; }
        .pi-day-total { background: rgba(255, 0, 110, 0.12); border: 1px solid rgba(255, 0, 110, 0.35); color: var(--primary-magenta, #ff006e); padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.85rem; }
        .pi-day-github { margin-left: auto; color: var(--primary-cyan, #00d9ff); text-decoration: none; font-size: 0.9rem; }
        .pi-day-github:hover { text-decoration: underline; }

        .pi-streams { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
        .pi-stream-link {
            display: flex; align-items: center; gap: 0.5rem; color: var(--primary-cyan, #00d9ff); text-decoration: none;
            background: rgba(0, 217, 255, 0.05); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid rgba(0, 217, 255, 0.15);
        }
        .pi-stream-link:hover, .pi-stream-link:focus { background: rgba(0, 217, 255, 0.12); border-color: rgba(0, 217, 255, 0.4); }
        .pi-stream-icon { font-size: 1.1rem; }
        .pi-stream-name { flex: 1; font-weight: 600; }
        .pi-stream-count { background: rgba(0, 217, 255, 0.18); color: var(--primary-cyan, #00d9ff); padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.8rem; }
        .pi-stream-desc { margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--muted-text, #a0a3bd); line-height: 1.5; }

        .pi-stream-artifacts { margin: 0.4rem 0 0; }
        .pi-stream-artifacts-summary {
            list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;
            font-size: 0.8rem; color: var(--primary-cyan, #00d9ff); padding: 0.2rem 0.5rem; border-radius: 4px;
            background: rgba(0, 217, 255, 0.06); border: 1px solid rgba(0, 217, 255, 0.18);
        }
        .pi-stream-artifacts-summary::-webkit-details-marker { display: none; }
        .pi-stream-artifacts-summary:hover, .pi-stream-artifacts-summary:focus { background: rgba(0, 217, 255, 0.14); }
        .pi-stream-artifacts[open] .pi-stream-artifacts-toggle { transform: rotate(90deg); }
        .pi-stream-artifacts-toggle { display: inline-block; transition: transform 120ms ease; }
        .pi-stream-artifacts-count { color: var(--muted-text, #a0a3bd); font-variant-numeric: tabular-nums; }
        .pi-artifact-list { list-style: decimal inside; margin: 0.5rem 0 0; padding: 0.5rem 0.5rem 0.5rem 1rem; background: rgba(10, 14, 39, 0.4); border-radius: 6px; border: 1px solid rgba(0, 217, 255, 0.12); }
        .pi-artifact { margin: 0.25rem 0; line-height: 1.5; }
        .pi-artifact a { display: inline-flex; align-items: baseline; gap: 0.4rem; color: var(--primary-cyan, #00d9ff); text-decoration: none; font-size: 0.85rem; }
        .pi-artifact a:hover, .pi-artifact a:focus { text-decoration: underline; }
        .pi-artifact-icon { font-size: 0.95rem; }
        .pi-artifact-title { font-weight: 500; }
        .pi-artifact-file { font-family: 'Courier New', monospace; font-size: 0.72rem; color: var(--muted-text, #a0a3bd); background: rgba(0, 217, 255, 0.05); padding: 0.05rem 0.3rem; border-radius: 3px; }

        .pi-older-toggle { display: block; width: 100%; text-align: left; background: transparent; border: 1px dashed rgba(0, 217, 255, 0.3); color: var(--primary-cyan, #00d9ff); padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 0.5rem; }
        .pi-older-toggle:hover, .pi-older-toggle:focus { background: rgba(0, 217, 255, 0.06); }
        .pi-older-content[hidden] { display: none; }

        .pi-other-langs { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 2rem; }
        .pi-other-langs a { padding: 0.5rem 0.8rem; border: 1px solid rgba(0, 217, 255, 0.3); border-radius: 999px; color: var(--primary-cyan, #00d9ff); text-decoration: none; font-size: 0.9rem; }
        .pi-other-langs a:hover, .pi-other-langs a:focus { background: rgba(0, 217, 255, 0.08); text-decoration: underline; }

        @media (max-width: 640px) {
            .pi-container { padding: 1rem 0.5rem 3rem; }
            .pi-hero { padding: 2rem 0.75rem; }
            .pi-grid { grid-template-columns: 1fr; }
            .pi-streams { grid-template-columns: 1fr; }
        }

        [dir="rtl"] .pi-day-github { margin-left: 0; margin-right: auto; }
        [dir="rtl"] .toc-nav { border-left: none; border-right: 4px solid var(--primary-cyan, #00d9ff); }
    </style>

    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>
    <script type="application/ld+json">
${JSON.stringify(breadcrumbLd, null, 2)}
    </script>${recentDaysItemList ? `
    <script type="application/ld+json">
${JSON.stringify(recentDaysItemList, null, 2)}
    </script>` : ''}
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <div class="pi-container">
        <header class="pi-hero">
            <a href="/${indexFile}" aria-label="Riksdagsmonitor Home">
                <img src="/images/riksdagsmonitor-logo.webp" alt="Riksdagsmonitor" style="display:block;max-width:100px;height:auto;margin:0 auto 0.75rem" width="100" height="100" loading="eager">
            </a>
            <h1><span aria-hidden="true">🧠</span> ${escapeHtml(t.title)}</h1>
            <p class="pi-subtitle">${escapeHtml(t.subtitle)}</p>
            <p class="pi-intro">${escapeHtml(t.intro)}</p>
            <div class="pi-stats" role="list">
                <span class="pi-stat" role="listitem"><strong>${methodologies.length}</strong> ${escapeHtml(t.methodologies)}</span>
                <span class="pi-stat" role="listitem"><strong>${templates.length}</strong> ${escapeHtml(t.templates)}</span>
                <span class="pi-stat" role="listitem"><strong>${days.length}</strong> ${escapeHtml(t.dailyArtifacts)}</span>
                <span class="pi-stat" role="listitem"><strong>${totalArtifacts}</strong> ${escapeHtml(t.artifacts)}</span>
            </div>
        </header>

        <nav class="toc-nav" aria-label="${escapeHtml(t.quickJumpTo)}">
            <h2>${escapeHtml(t.quickJumpTo)}</h2>
            <ul class="toc-list">
                <li><a href="#methodologies"><span aria-hidden="true">📚</span> ${escapeHtml(t.methodologies)}</a></li>
                <li><a href="#templates"><span aria-hidden="true">📋</span> ${escapeHtml(t.templates)}</a></li>
                <li><a href="#daily"><span aria-hidden="true">📅</span> ${escapeHtml(t.dailyArtifacts)}</a></li>
                <li><a href="/${sitemapFile}"><span aria-hidden="true">🗺️</span> ${escapeHtml(t.sitemap)}</a></li>
            </ul>
        </nav>

        <main id="main-content">
            <section id="methodologies" class="pi-section">
                <div class="pi-section-header">
                    <h2><span aria-hidden="true">📚</span> ${escapeHtml(t.methodologies)}</h2>
                    <span class="pi-section-link"><a href="${GITHUB_TREE}/analysis/methodologies" target="_blank" rel="noopener noreferrer">${escapeHtml(t.browseDirectoryOnGithub)} <span aria-hidden="true">↗</span></a></span>
                </div>
                <p class="pi-section-desc">${escapeHtml(t.methodologiesDesc)}</p>
                <div class="pi-grid">
${methodologyCardsHtml}
                </div>
            </section>

            <section id="templates" class="pi-section">
                <div class="pi-section-header">
                    <h2><span aria-hidden="true">📋</span> ${escapeHtml(t.templates)}</h2>
                    <span class="pi-section-link"><a href="${GITHUB_TREE}/analysis/templates" target="_blank" rel="noopener noreferrer">${escapeHtml(t.browseDirectoryOnGithub)} <span aria-hidden="true">↗</span></a></span>
                </div>
                <p class="pi-section-desc">${escapeHtml(t.templatesDesc)}</p>
                <div class="pi-grid">
${templateCardsHtml}
                </div>
            </section>

            <section id="daily" class="pi-section">
                <div class="pi-section-header">
                    <h2><span aria-hidden="true">📅</span> ${escapeHtml(t.dailyArtifacts)}</h2>
                    <span class="pi-section-link"><a href="${GITHUB_TREE}/analysis/daily" target="_blank" rel="noopener noreferrer">${escapeHtml(t.browseAllDays)} <span aria-hidden="true">↗</span></a></span>
                </div>
                <p class="pi-section-desc">${escapeHtml(t.dailyArtifactsDesc)}</p>

                <h3 style="font-family: var(--font-heading, 'Orbitron', sans-serif); color: var(--primary-yellow, #ffbe0b); font-size: 1.1rem; margin-top: 1.5rem;">${escapeHtml(t.recentDays)}</h3>
${recentDaysHtml}
${olderDays.length > 0 ? `
                <button type="button" class="pi-older-toggle" aria-expanded="false" aria-controls="pi-older-days" onclick="(function(b){var el=document.getElementById('pi-older-days');var exp=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',(!exp).toString());if(exp){el.setAttribute('hidden','');}else{el.removeAttribute('hidden');}})(this)">
                    <span aria-hidden="true">🕰️</span> ${escapeHtml(t.olderDays)} (${olderDays.length}) — ${escapeHtml(t.showMore)}
                </button>
                <div id="pi-older-days" class="pi-older-content" hidden>
${olderDaysHtml}
                </div>` : ''}
            </section>
        </main>

        <nav class="pi-other-langs" aria-label="Other languages">
${otherLangLinks}
        </nav>

        <footer style="text-align: center; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--primary-cyan, #00d9ff); color: var(--muted-text, #a0a3bd);">
            <p>&copy; 2008-<time datetime="2026">2026</time> <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer" style="color: var(--primary-cyan, #00d9ff);">Hack23 AB</a> |
            <a href="/${indexFile}" style="color: var(--primary-cyan, #00d9ff);">${escapeHtml(t.home)}</a> ·
            <a href="/${sitemapFile}" style="color: var(--primary-cyan, #00d9ff);">${escapeHtml(t.sitemap)}</a></p>
        </footer>
    </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): number {
  try {
    console.log('🚀 Starting political-intelligence HTML generation...\n');

    let generated = 0;
    for (const lang of LANGUAGES) {
      const html = generatePoliticalIntelligenceHtml(lang);
      const fileName = lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${lang}.html`;
      const filePath = path.join(ROOT_DIR, fileName);
      fs.writeFileSync(filePath, html, 'utf8');
      console.log(`  ✅ Generated ${fileName}`);
      generated++;
    }

    console.log(`\n✅ Generated ${generated} political-intelligence HTML files`);
    return 0;
  } catch (error: unknown) {
    console.error('❌ Error generating political-intelligence HTML:', (error as Error).message);
    if (process.env.DEBUG) console.error((error as Error).stack);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}

export {
  generatePoliticalIntelligenceHtml,
  collectCatalog,
  collectDailyDays,
  METHODOLOGY_META,
  TEMPLATE_META,
  STREAM_META,
  PI_TRANSLATIONS,
};
