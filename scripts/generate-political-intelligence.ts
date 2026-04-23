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
  },
};

// ---------------------------------------------------------------------------
// Heuristic icon + description lookup for methodologies & templates
// ---------------------------------------------------------------------------

interface CatalogEntry {
  readonly file: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly githubUrl: string;
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

function prettifyStream(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function streamIcon(name: string): string {
  if (STREAM_META[name]) return STREAM_META[name].icon;
  if (name.startsWith('realtime-')) return '⏱️';
  if (name.startsWith('morning-')) return '🌅';
  if (name.startsWith('midday-')) return '🕛';
  if (name.startsWith('evening-')) return '🌙';
  return '📦';
}

function streamDescription(name: string): string {
  if (STREAM_META[name]) return STREAM_META[name].description;
  if (name.startsWith('realtime-')) return 'Realtime snapshot capturing the parliamentary and government state at a specific time.';
  return `Analytical content stream: ${prettifyStream(name)}.`;
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
    });
  }
  return entries;
}

interface DailyStream {
  readonly name: string;
  readonly githubUrl: string;
  readonly artifactCount: number;
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

    const streams: DailyStream[] = streamNames.map((name) => ({
      name,
      githubUrl: buildGithubUrl('tree', `analysis/daily/${date}/${name}`),
      artifactCount: countArtifactsRecursive(path.join(dateDir, name)),
    }));

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

function renderCatalogGrid(entries: CatalogEntry[], openLabel: string): string {
  return entries.map((e) => `
        <article class="pi-card">
          <div class="pi-card-icon" aria-hidden="true">${e.icon}</div>
          <h3 class="pi-card-title"><a href="${e.githubUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(e.title)}</a></h3>
          <p class="pi-card-desc">${escapeHtml(e.description)}</p>
          <p class="pi-card-meta"><code class="pi-card-file">${escapeHtml(e.file)}</code></p>
          <p class="pi-card-link"><a href="${e.githubUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(openLabel)} <span aria-hidden="true">↗</span></a></p>
        </article>`).join('\n');
}

function renderDailyDay(day: DailyDay, t: PiTranslations): string {
  const streamsHtml = day.streams.map((s) => `
            <li class="pi-stream">
              <a href="${s.githubUrl}" target="_blank" rel="noopener noreferrer">
                <span class="pi-stream-icon" aria-hidden="true">${streamIcon(s.name)}</span>
                <span class="pi-stream-name">${escapeHtml(prettifyStream(s.name))}</span>
                <span class="pi-stream-count" aria-label="${s.artifactCount} ${escapeHtml(t.artifacts)}">${s.artifactCount}</span>
              </a>
              <p class="pi-stream-desc">${escapeHtml(streamDescription(s.name))}</p>
            </li>`).join('\n');

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

  const methodologies = collectCatalog(METHODOLOGIES_DIR, 'analysis/methodologies', METHODOLOGY_META);
  const templates = collectCatalog(TEMPLATES_DIR, 'analysis/templates', TEMPLATE_META);
  const days = collectDailyDays();
  const totalArtifacts = days.reduce((a, d) => a + d.totalArtifacts, 0);

  const RECENT = 14;
  const recentDays = days.slice(0, RECENT);
  const olderDays = days.slice(RECENT);

  const methodologyCardsHtml = renderCatalogGrid(methodologies, t.openOnGithub);
  const templateCardsHtml = renderCatalogGrid(templates, t.openOnGithub);
  const recentDaysHtml = recentDays.map((d) => renderDailyDay(d, t)).join('\n');
  const olderDaysHtml = olderDays.map((d) => renderDailyDay(d, t)).join('\n');

  const otherLangLinks = LANGUAGES
    .filter((l) => l !== lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = l === 'en' ? 'political-intelligence.html' : `political-intelligence_${l}.html`;
      return `        <a href="${href}" lang="${hreflangCodeOf(l)}" title="${escapeHtml(lm.nativeName)}"><span aria-hidden="true">${lm.flag}</span> ${lm.nativeName}</a>`;
    })
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${t.title} — Riksdagsmonitor`,
    description: t.metaDescription,
    inLanguage: hreflangCodeOf(lang),
    url: `${BASE_URL}/${selfFile}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Riksdagsmonitor',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Hack23 AB',
      url: 'https://www.hack23.com',
    },
    about: {
      '@type': 'Thing',
      name: 'Swedish Parliament political intelligence',
    },
    hasPart: [
      {
        '@type': 'CreativeWork',
        name: t.methodologies,
        url: `${GITHUB_TREE}/analysis/methodologies`,
      },
      {
        '@type': 'CreativeWork',
        name: t.templates,
        url: `${GITHUB_TREE}/analysis/templates`,
      },
      {
        '@type': 'Dataset',
        name: t.dailyArtifacts,
        url: `${GITHUB_TREE}/analysis/daily`,
      },
    ],
  };

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
    <meta name="robots" content="index, follow, max-image-preview:large">
    <meta name="author" content="James Pether Sörling, CISSP, CISM">
    <meta name="theme-color" content="#0a0e27">
    <meta name="color-scheme" content="dark light">

    <link rel="stylesheet" type="text/css" href="styles.css">

    <!-- Hreflang + canonical -->
${renderHreflangTags(lang)}

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Riksdagsmonitor">
    <meta property="og:title" content="${escapeHtml(t.title)} — Riksdagsmonitor">
    <meta property="og:description" content="${escapeHtml(t.metaDescription)}">
    <meta property="og:url" content="${BASE_URL}/${selfFile}">
    <meta property="og:locale" content="${meta.locale}">
    <meta property="og:image" content="${BASE_URL}/images/og-image.webp">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Riksdagsmonitor ${escapeHtml(t.title)}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@riksdagsmonitor">
    <meta name="twitter:title" content="${escapeHtml(t.title)} — Riksdagsmonitor">
    <meta name="twitter:description" content="${escapeHtml(t.metaDescription)}">
    <meta name="twitter:image" content="${BASE_URL}/images/og-image.webp">

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
        .pi-stream a {
            display: flex; align-items: center; gap: 0.5rem; color: var(--primary-cyan, #00d9ff); text-decoration: none;
            background: rgba(0, 217, 255, 0.05); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid rgba(0, 217, 255, 0.15);
        }
        .pi-stream a:hover, .pi-stream a:focus { background: rgba(0, 217, 255, 0.12); border-color: rgba(0, 217, 255, 0.4); }
        .pi-stream-icon { font-size: 1.1rem; }
        .pi-stream-name { flex: 1; font-weight: 600; }
        .pi-stream-count { background: rgba(0, 217, 255, 0.18); color: var(--primary-cyan, #00d9ff); padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.8rem; }
        .pi-stream-desc { margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--muted-text, #a0a3bd); line-height: 1.5; }

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
    </script>
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
