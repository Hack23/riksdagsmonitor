/**
 * @module Infrastructure/Scripts/StaticPagesSeoHead
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Static-page SEO `<head>` enhancer (politician-dashboard, dashboard, home)
 *
 * @description
 * The static landing pages (`index{,_$LANG}.html`, `dashboard/index{,_$LANG}.html`,
 * `politician-dashboard{,_$LANG}.html`) are authored by hand: their
 * `<title>` and `<meta name="description">` are already translated, but
 * lower-signal SEO surface is identical across every language. Before
 * this module landed:
 *
 *  - All 14 `politician-dashboard_<lang>.html` files shared one
 *    English-only `<meta name="keywords">` list (`politician analytics,
 *    MP productivity, career trajectory, …`). That violates
 *    `.github/prompts/seo-metadata-contract.md` §4 (per-language SERP
 *    signal).
 *  - `politician-dashboard*.html` had no Twitter Card meta and no
 *    JSON-LD blob — search engines and Twitter cards saw only the
 *    minimum Open Graph block, which collapses 14 hreflang siblings to
 *    near-identical previews.
 *  - Neither `dashboard/index*.html` nor `index*.html` declared
 *    `og:locale:alternate[]` for cross-language Open Graph discovery.
 *
 * This module is the **pure** core that fixes those gaps. Wire-up is in
 * `scripts/normalize-static-html-chrome.ts` (post-prebuild pass) — that
 * keeps every regex transform and filesystem call in the script and
 * leaves this module unit-testable without spinning up a temp tree.
 *
 * The module exports four building blocks (each pure, each testable):
 *
 *  - {@link buildStaticPageKeywords} — localized 7-token keyword string
 *    per `family × lang` (42 native sets — 3 families × 14 languages).
 *  - {@link buildStaticPageOgLocaleBlock} — `og:locale` +
 *    `og:locale:alternate[]` for the other 13 siblings.
 *  - {@link buildStaticPageTwitterCardBlock} — Twitter Card meta block
 *    parametrised by the page's title / description.
 *  - {@link buildStaticPageJsonLd} — `WebSite` + `WebPage` (with
 *    Speakable for the `<h1>`) JSON-LD blob.
 *
 * The orchestrator {@link enhanceStaticPageHead} composes them and
 * returns the rewritten HTML.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from './types/language.js';

/**
 * Supported static-page families. The shape mirrors the `PageFamily`
 * union in `normalize-static-html-chrome.ts` so the same value flows
 * through both modules without a re-encoding step.
 */
export type StaticPageFamily = 'home' | 'dashboard' | 'politician';

/**
 * BCP-47 / hreflang codes per `Language`. Mirrors `LANGUAGE_META[lang].hreflang`
 * from `sitemap-html/i18n.ts` (Norwegian uses `nb` per repo convention)
 * but duplicated locally so this module stays I/O-free and importable
 * from any test fixture.
 */
const HREFLANG: Readonly<Record<Language, string>> = {
  en: 'en', sv: 'sv', da: 'da', no: 'nb', fi: 'fi', de: 'de',
  fr: 'fr', es: 'es', nl: 'nl', ar: 'ar', he: 'he', ja: 'ja',
  ko: 'ko', zh: 'zh',
};

/**
 * OG-locale codes per `Language`. Open Graph requires the
 * `language_TERRITORY` form (e.g. `en_US`, `sv_SE`) — we pick the
 * canonical territory for each supported tongue. Re-uses the same table
 * format `index.html` already ships.
 */
const OG_LOCALE: Readonly<Record<Language, string>> = {
  en: 'en_US', sv: 'sv_SE', da: 'da_DK', no: 'nb_NO', fi: 'fi_FI',
  de: 'de_DE', fr: 'fr_FR', es: 'es_ES', nl: 'nl_NL', ar: 'ar_SA',
  he: 'he_IL', ja: 'ja_JP', ko: 'ko_KR', zh: 'zh_CN',
};

const ALL_LANGS: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
];

/**
 * Native 7-token keyword strings per `family × language`.
 *
 * **Editorial rule** (per `seo-metadata-contract.md` §4): every entry is
 * in the target language; the platform brand `Riksdagsmonitor` and the
 * international acronym `OSINT` stay verbatim (they are proper nouns).
 *
 * **Format**: comma-separated string ready to drop into
 * `<meta name="keywords">`. Token count is held at 7 across all sets so
 * SERP signal stays uniform.
 */
const KEYWORDS: Readonly<Record<StaticPageFamily, Readonly<Record<Language, string>>>> = {
  home: {
    en: 'Swedish parliament intelligence, Riksdagsmonitor, political transparency, parliamentary data, Sweden election 2026, OSINT politics, open democracy',
    sv: 'svensk parlamentsunderrättelse, Riksdagsmonitor, politisk transparens, parlamentsdata, val 2026 Sverige, OSINT politik, öppen demokrati',
    da: 'svensk parlamentsefterretning, Riksdagsmonitor, politisk gennemsigtighed, parlamentsdata, valg 2026 Sverige, OSINT politik, åben demokrati',
    no: 'svensk parlamentsetterretning, Riksdagsmonitor, politisk åpenhet, parlamentsdata, valg 2026 Sverige, OSINT politikk, åpent demokrati',
    fi: 'Ruotsin parlamenttitiedustelu, Riksdagsmonitor, poliittinen läpinäkyvyys, parlamenttidata, vaalit 2026 Ruotsi, OSINT-politiikka, avoin demokratia',
    de: 'schwedische Parlamentsaufklärung, Riksdagsmonitor, politische Transparenz, Parlamentsdaten, Schweden-Wahl 2026, OSINT-Politik, offene Demokratie',
    fr: 'renseignement parlementaire suédois, Riksdagsmonitor, transparence politique, données parlementaires, élections 2026 Suède, politique OSINT, démocratie ouverte',
    es: 'inteligencia parlamentaria sueca, Riksdagsmonitor, transparencia política, datos parlamentarios, elecciones 2026 Suecia, política OSINT, democracia abierta',
    nl: 'Zweedse parlementaire inlichtingen, Riksdagsmonitor, politieke transparantie, parlementaire data, verkiezingen 2026 Zweden, OSINT-politiek, open democratie',
    ar: 'استخبارات برلمانية سويدية, Riksdagsmonitor, شفافية سياسية, بيانات برلمانية, انتخابات 2026 السويد, سياسة OSINT, ديمقراطية مفتوحة',
    he: 'מודיעין פרלמנטרי שוודי, Riksdagsmonitor, שקיפות פוליטית, נתוני פרלמנט, בחירות 2026 שוודיה, פוליטיקת OSINT, דמוקרטיה פתוחה',
    ja: 'スウェーデン議会インテリジェンス, Riksdagsmonitor, 政治的透明性, 議会データ, 2026年スウェーデン選挙, OSINT政治, 開かれた民主主義',
    ko: '스웨덴 의회 정보, Riksdagsmonitor, 정치적 투명성, 의회 데이터, 2026 스웨덴 선거, OSINT 정치, 열린 민주주의',
    zh: '瑞典议会情报, Riksdagsmonitor, 政治透明度, 议会数据, 2026年瑞典选举, OSINT政治, 开放民主',
  },
  dashboard: {
    en: 'parliamentary dashboard, political analytics, voting patterns, party performance, MP rankings, election predictions, Swedish parliament',
    sv: 'parlamentariskt instrumentpanel, politisk analys, röstningsmönster, partiprestation, riksdagsledamotsrankning, valprognoser, Sveriges riksdag',
    da: 'parlamentarisk dashboard, politisk analyse, afstemningsmønstre, partiprestation, MP-rangering, valgforudsigelser, Sveriges rigsdag',
    no: 'parlamentarisk dashbord, politisk analyse, stemmemønstre, partiprestasjon, MP-rangering, valgprognoser, Sveriges riksdag',
    fi: 'parlamenttinen kojelauta, poliittinen analyysi, äänestyskuviot, puoluesuoritus, kansanedustajien sijoitukset, vaaliennusteet, Ruotsin valtiopäivät',
    de: 'parlamentarisches Dashboard, politische Analyse, Abstimmungsmuster, Parteileistung, Abgeordnetenranking, Wahlprognosen, schwedisches Parlament',
    fr: 'tableau de bord parlementaire, analyse politique, schémas de vote, performance des partis, classements des députés, prévisions électorales, parlement suédois',
    es: 'tablero parlamentario, análisis político, patrones de voto, rendimiento de partidos, clasificaciones de diputados, predicciones electorales, parlamento sueco',
    nl: 'parlementair dashboard, politieke analyse, stempatronen, partijprestaties, parlementsledenranglijst, verkiezingsvoorspellingen, Zweeds parlement',
    ar: 'لوحة معلومات برلمانية, تحليل سياسي, أنماط التصويت, أداء الأحزاب, تصنيفات النواب, توقعات الانتخابات, البرلمان السويدي',
    he: 'לוח מחוונים פרלמנטרי, ניתוח פוליטי, דפוסי הצבעה, ביצועי מפלגות, דירוגי חברי פרלמנט, תחזיות בחירות, פרלמנט שוודי',
    ja: '議会ダッシュボード, 政治分析, 投票パターン, 政党パフォーマンス, 議員ランキング, 選挙予測, スウェーデン議会',
    ko: '의회 대시보드, 정치 분석, 투표 패턴, 정당 성과, 의원 순위, 선거 예측, 스웨덴 의회',
    zh: '议会仪表板, 政治分析, 投票模式, 政党表现, 议员排名, 选举预测, 瑞典议会',
  },
  politician: {
    en: 'politician analytics, MP productivity, career trajectory, riksdag politicians, Swedish parliament, legislative output, committee activity',
    sv: 'politikeranalys, riksdagsledamots produktivitet, karriärbana, riksdagspolitiker, Sveriges riksdag, lagstiftningsproduktion, utskottsaktivitet',
    da: 'politikeranalyse, MP-produktivitet, karriereforløb, rigsdagspolitikere, Sveriges rigsdag, lovgivningsproduktion, udvalgsaktivitet',
    no: 'politikeranalyse, stortingsrepresentanters produktivitet, karrierebane, riksdagspolitikere, Sveriges riksdag, lovgivningsproduksjon, komitéaktivitet',
    fi: 'poliitikkoanalyysi, kansanedustajan tuottavuus, urapolku, valtiopäiväpoliitikot, Ruotsin valtiopäivät, lainsäädäntötuotos, valiokuntatoiminta',
    de: 'Politikeranalyse, Abgeordnetenproduktivität, Karriereverlauf, Reichstagspolitiker, schwedisches Parlament, Gesetzgebungsleistung, Ausschussaktivität',
    fr: 'analyse des politiciens, productivité des députés, trajectoire de carrière, politiciens du Riksdag, parlement suédois, production législative, activité des commissions',
    es: 'analítica de políticos, productividad de diputados, trayectoria profesional, políticos del Riksdag, parlamento sueco, producción legislativa, actividad de comisiones',
    nl: 'politicusanalyse, productiviteit van parlementsleden, carrièretraject, Riksdag-politici, Zweeds parlement, wetgevingsproductie, commissieactiviteit',
    ar: 'تحليلات السياسيين, إنتاجية النواب, المسار المهني, سياسيو الريكسداغ, البرلمان السويدي, الإنتاج التشريعي, نشاط اللجان',
    he: 'אנליטיקה של פוליטיקאים, פרודוקטיביות חברי פרלמנט, מסלול קריירה, פוליטיקאי ריקסדאג, פרלמנט שוודי, תפוקה חקיקתית, פעילות ועדות',
    ja: '政治家分析, 議員の生産性, キャリア軌道, リクスダーグの政治家, スウェーデン議会, 立法生産, 委員会活動',
    ko: '정치인 분석, 의원 생산성, 경력 궤적, 릭스다그 정치인, 스웨덴 의회, 입법 산출, 위원회 활동',
    zh: '政治家分析, 议员生产力, 职业轨迹, 瑞典国会议员, 瑞典议会, 立法产出, 委员会活动',
  },
};

/**
 * Build the localized `<meta name="keywords">` content for a static page.
 * Pure — returns the comma-separated string, not the full `<meta>` tag,
 * so callers can decide how to splice it into the existing `<head>`.
 *
 * **The string is always 7 tokens**; the brand `Riksdagsmonitor` and the
 * acronym `OSINT` stay in Latin script across all 14 languages because
 * they are proper nouns.
 */
export function buildStaticPageKeywords(family: StaticPageFamily, lang: Language): string {
  return KEYWORDS[family][lang];
}

/**
 * Build the `og:locale` + `og:locale:alternate[]` block (newline-joined
 * `<meta>` tags). Open Graph requires the `og:locale` for the page
 * itself and one `og:locale:alternate` for every other supported
 * language — defining the alternates lets Facebook / LinkedIn pick the
 * best-fit locale at preview time.
 *
 * Pure — no template literal interpolation beyond the static OG-locale
 * map, so the output is deterministic across runs.
 */
export function buildStaticPageOgLocaleBlock(lang: Language): string {
  const lines: string[] = [];
  lines.push(`<meta property="og:locale" content="${OG_LOCALE[lang]}">`);
  for (const other of ALL_LANGS) {
    if (other === lang) continue;
    lines.push(`<meta property="og:locale:alternate" content="${OG_LOCALE[other]}">`);
  }
  return lines.join('\n');
}

/**
 * Build the Twitter Card meta block (parametrised by title / description /
 * canonical URL). Returns a newline-joined string of `<meta>` tags.
 *
 * Twitter inherits the Open Graph `og:image` when no dedicated
 * `twitter:image` is set, but we still emit the dedicated meta tags so
 * the card preview is identical regardless of crawler.
 */
export function buildStaticPageTwitterCardBlock(input: {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly imageUrl: string;
}): string {
  const { title, description, imageUrl } = input;
  const escapedTitle = escapeHtmlAttribute(title);
  const escapedDescription = escapeHtmlAttribute(description);
  const escapedImage = escapeHtmlAttribute(imageUrl);
  return [
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapedTitle}">`,
    `<meta name="twitter:description" content="${escapedDescription}">`,
    `<meta name="twitter:image" content="${escapedImage}">`,
    `<meta name="twitter:image:alt" content="${escapedTitle}">`,
    `<meta name="twitter:site" content="@riksdagsmonitor">`,
    `<meta name="twitter:creator" content="@jamessorling">`,
    `<meta name="twitter:domain" content="riksdagsmonitor.com">`,
  ].join('\n');
}

/**
 * Build the JSON-LD blob (`WebSite` + `WebPage` with Speakable) for a
 * static page. The Speakable spec lets voice assistants read the page
 * `<h1>` — important for political-intelligence pages where the
 * headline carries the analytical lede.
 *
 * Pure — returns the `<script type="application/ld+json">…</script>`
 * wrapper as a string so callers can splice it before `</head>`.
 */
export function buildStaticPageJsonLd(input: {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly lang: Language;
  readonly family: StaticPageFamily;
}): string {
  const { title, description, canonicalUrl, lang, family } = input;
  const inLanguage = HREFLANG[lang];
  const homeHref = lang === 'en'
    ? 'https://riksdagsmonitor.com/'
    : `https://riksdagsmonitor.com/index_${lang}.html`;
  const homeLabel = breadcrumbLabel('home', lang);
  const pageLabel = breadcrumbLabel(family, lang);
  // The `inLanguage` field carries the BCP-47 / hreflang code; the
  // `Speakable` cssSelector points at the first `<h1>` on every static
  // page (every family ships one). The `BreadcrumbList` node is added
  // for every family (single-item for `home`, two-item for the rest)
  // so Google rich-results and AI assistants can surface the page
  // location inside the site hierarchy.
  const breadcrumbItems: ReadonlyArray<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }> = family === 'home'
    ? [{ '@type': 'ListItem', position: 1, name: homeLabel, item: homeHref }]
    : [
        { '@type': 'ListItem', position: 1, name: homeLabel, item: homeHref },
        { '@type': 'ListItem', position: 2, name: pageLabel, item: canonicalUrl },
      ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://riksdagsmonitor.com/#website',
        'name': 'Riksdagsmonitor',
        'url': 'https://riksdagsmonitor.com/',
        'inLanguage': inLanguage,
        'publisher': { '@id': 'https://riksdagsmonitor.com/#organization' },
      },
      {
        '@type': 'Organization',
        '@id': 'https://riksdagsmonitor.com/#organization',
        'name': 'Hack23 AB',
        'url': 'https://www.hack23.com',
        'logo': 'https://riksdagsmonitor.com/icon-192.png',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        'itemListElement': breadcrumbItems,
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        'url': canonicalUrl,
        'name': title,
        'description': description,
        'inLanguage': inLanguage,
        'isPartOf': { '@id': 'https://riksdagsmonitor.com/#website' },
        'breadcrumb': { '@id': `${canonicalUrl}#breadcrumb` },
        'about': {
          '@type': 'Thing',
          'name': pageAbout(family, lang),
        },
        'speakable': {
          '@type': 'SpeakableSpecification',
          'cssSelector': ['h1'],
        },
      },
    ],
  };
  return `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;
}

/**
 * Localised `BreadcrumbList` item label per `family × language`. Mirrors
 * the human-readable header links shipped on the same pages so a screen
 * reader hearing the breadcrumb hears the same phrase it sees in the
 * navigation bar.
 */
function breadcrumbLabel(family: StaticPageFamily, lang: Language): string {
  const BREADCRUMB_LABELS: Readonly<Record<StaticPageFamily, Readonly<Record<Language, string>>>> = {
    home: {
      en: 'Home', sv: 'Hem', da: 'Hjem', no: 'Hjem', fi: 'Etusivu',
      de: 'Startseite', fr: 'Accueil', es: 'Inicio', nl: 'Home',
      ar: 'الرئيسية', he: 'דף הבית', ja: 'ホーム', ko: '홈', zh: '首页',
    },
    dashboard: {
      en: 'Dashboard', sv: 'Instrumentpanel', da: 'Dashboard',
      no: 'Dashbord', fi: 'Kojelauta', de: 'Dashboard',
      fr: 'Tableau de bord', es: 'Tablero', nl: 'Dashboard',
      ar: 'لوحة المعلومات', he: 'לוח מחוונים', ja: 'ダッシュボード',
      ko: '대시보드', zh: '仪表板',
    },
    politician: {
      en: 'Politician Dashboard', sv: 'Politikerpanel',
      da: 'Politikerpanel', no: 'Politikerpanel',
      fi: 'Poliitikko­paneeli', de: 'Politiker-Dashboard',
      fr: 'Tableau des politiciens', es: 'Tablero de políticos',
      nl: 'Politici-dashboard',
      ar: 'لوحة السياسيين', he: 'לוח פוליטיקאים',
      ja: '政治家ダッシュボード', ko: '정치인 대시보드',
      zh: '政治家仪表板',
    },
  };
  return BREADCRUMB_LABELS[family][lang];
}

/**
 * Human-readable `about` label per `family × lang` for the WebPage
 * JSON-LD node. Pre-localised so search engines surface the right
 * topic in their Knowledge Graph snippet.
 */
function pageAbout(family: StaticPageFamily, lang: Language): string {
  const PAGE_ABOUT: Readonly<Record<StaticPageFamily, Readonly<Record<Language, string>>>> = {
    home: {
      en: 'Swedish Parliament political intelligence',
      sv: 'Politisk underrättelse om Sveriges riksdag',
      da: 'Politisk efterretning om Sveriges rigsdag',
      no: 'Politisk etterretning om Sveriges riksdag',
      fi: 'Ruotsin valtiopäivien poliittinen tiedustelu',
      de: 'Politische Aufklärung des schwedischen Parlaments',
      fr: 'Renseignement politique du parlement suédois',
      es: 'Inteligencia política del parlamento sueco',
      nl: 'Politieke inlichtingen over het Zweedse parlement',
      ar: 'استخبارات سياسية للبرلمان السويدي',
      he: 'מודיעין פוליטי של הפרלמנט השוודי',
      ja: 'スウェーデン議会の政治インテリジェンス',
      ko: '스웨덴 의회 정치 정보',
      zh: '瑞典议会政治情报',
    },
    dashboard: {
      en: 'Parliamentary analytics dashboard',
      sv: 'Parlamentariskt analyspanel',
      da: 'Parlamentarisk analysepanel',
      no: 'Parlamentarisk analysepanel',
      fi: 'Parlamenttinen analytiikkapaneeli',
      de: 'Parlamentarisches Analyse-Dashboard',
      fr: 'Tableau de bord d’analyse parlementaire',
      es: 'Tablero de análisis parlamentario',
      nl: 'Parlementair analyse-dashboard',
      ar: 'لوحة تحليلات برلمانية',
      he: 'לוח אנליטיקה פרלמנטרי',
      ja: '議会分析ダッシュボード',
      ko: '의회 분석 대시보드',
      zh: '议会分析仪表板',
    },
    politician: {
      en: 'Politician career and productivity analytics',
      sv: 'Politikers karriär- och produktivitetsanalys',
      da: 'Politikers karriere- og produktivitetsanalyse',
      no: 'Politikers karriere- og produktivitetsanalyse',
      fi: 'Poliitikkojen ura- ja tuottavuusanalyysi',
      de: 'Politiker­karriere- und Produktivitätsanalyse',
      fr: 'Analyse de la carrière et de la productivité des politiciens',
      es: 'Análisis de carrera y productividad de políticos',
      nl: 'Carrière- en productiviteitsanalyse van politici',
      ar: 'تحليل المسار المهني وإنتاجية السياسيين',
      he: 'ניתוח קריירה ופרודוקטיביות של פוליטיקאים',
      ja: '政治家のキャリアと生産性分析',
      ko: '정치인 경력 및 생산성 분석',
      zh: '政治家职业生涯与生产力分析',
    },
  };
  return PAGE_ABOUT[family][lang];
}

/**
 * HTML attribute escaper used inside the building blocks above. Mirrors
 * the strictest subset used by `render-lib/chrome/head.ts` so the output
 * passes HTMLHint without surprises (`&`, `"`, `<`, `>`, `'`).
 */
function escapeHtmlAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');
}

/**
 * Orchestrator — rewrites the `<head>` of a static page so it ships:
 *
 *  1. A localized 7-token `<meta name="keywords">` (replacing the EN
 *     leak that was identical across all 14 hreflang siblings).
 *  2. An `og:locale` + `og:locale:alternate[]` block (replacing any
 *     single hard-coded `<meta property="og:locale" content="en_US">`).
 *  3. A Twitter Card block (added if missing — `politician-dashboard*.html`
 *     had none before this module landed).
 *  4. A JSON-LD `WebSite` + `WebPage` + Speakable blob (added if missing).
 *
 * The function is **idempotent** — running it twice yields the same
 * output as running it once. This is required because
 * `normalize-static-html-chrome.ts` runs in the prebuild pipeline and
 * may execute multiple times during dev / CI re-renders.
 *
 * **Title and description are preserved verbatim** — they are
 * hand-authored per language in the source HTML, and this module is
 * deliberately non-destructive on those fields. The Twitter Card and
 * JSON-LD merely *reference* them.
 */
export function enhanceStaticPageHead(input: {
  readonly html: string;
  readonly lang: Language;
  readonly family: StaticPageFamily;
}): string {
  const { html, lang, family } = input;

  // Skip rewrite for pages that do not have a parseable <head>.
  if (!/<head\b[^>]*>[\s\S]*?<\/head>/i.test(html)) return html;

  // Extract the page-level `<title>` and `<meta name="description">` so
  // the Twitter Card / JSON-LD references the already-translated values.
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);

  const title = (titleMatch?.[1] ?? '').trim();
  const description = (descriptionMatch?.[1] ?? '').trim();
  const canonicalUrl = (canonicalMatch?.[1] ?? '').trim();
  const imageUrl = (ogImageMatch?.[1] ?? 'https://riksdagsmonitor.com/images/og-image.webp').trim();

  let next = html;

  // ── (1) Replace `<meta name="keywords">` ─────────────────────────────
  const localizedKeywords = buildStaticPageKeywords(family, lang);
  const keywordsTag = `<meta name="keywords" content="${escapeHtmlAttribute(localizedKeywords)}">`;
  if (/<meta\s+name=["']keywords["'][^>]*>/i.test(next)) {
    next = next.replace(/<meta\s+name=["']keywords["'][^>]*>/i, keywordsTag);
  } else if (/<\/head>/i.test(next)) {
    next = next.replace(/<\/head>/i, `${keywordsTag}\n</head>`);
  }

  // ── (2) Replace `<meta property="og:locale" ...>` (single tag form) ─
  // The hand-authored pages ship at most one `og:locale` meta tag. We
  // remove every existing `og:locale` / `og:locale:alternate` tag and
  // inject the freshly-built block in a deterministic location.
  const ogLocaleBlock = buildStaticPageOgLocaleBlock(lang);
  next = next.replace(/\s*<meta\s+property=["']og:locale(?::alternate)?["'][^>]*>/gi, '');
  // Insert after the first `og:url` tag if present, else before `</head>`.
  if (/<meta\s+property=["']og:url["'][^>]*>/i.test(next)) {
    next = next.replace(/(<meta\s+property=["']og:url["'][^>]*>)/i, `$1\n${ogLocaleBlock}`);
  } else if (/<\/head>/i.test(next)) {
    next = next.replace(/<\/head>/i, `${ogLocaleBlock}\n</head>`);
  }

  // ── (3) Twitter Card — add if missing (idempotent) ──────────────────
  if (!/<meta\s+name=["']twitter:card["']/i.test(next)) {
    const twitterBlock = buildStaticPageTwitterCardBlock({
      title,
      description,
      canonicalUrl,
      imageUrl,
    });
    if (/<\/head>/i.test(next)) {
      next = next.replace(/<\/head>/i, `${twitterBlock}\n</head>`);
    }
  }

  // ── (4) JSON-LD WebSite + WebPage + BreadcrumbList + Speakable ────
  // Idempotency contract:
  //
  //   • If the document already contains `"@type": "BreadcrumbList"`
  //     anywhere (our current contract OR a hand-authored block — e.g.
  //     `index.html`, `political-intelligence_*.html`,
  //     `dashboards/*.html` all ship their own BreadcrumbList nodes),
  //     we leave structured data untouched.
  //
  //   • Otherwise, if the canonical WebSite `@id` is present, the page
  //     was enhanced by a previous version of this script that didn't
  //     emit BreadcrumbList. We strip that legacy block and re-inject
  //     the current contract so older committed pages get upgraded
  //     in-place on the next normalize pass.
  //
  //   • If neither marker is present, we inject for the first time.
  //
  // Multiple `<script type="application/ld+json">` blocks per page are
  // explicitly supported by Schema.org / Google Search, so we only
  // augment — never remove — hand-authored JSON-LD that ships its own
  // BreadcrumbList.
  const hasBreadcrumb = /"@type":\s*"BreadcrumbList"/.test(next);
  if (!hasBreadcrumb) {
    const legacyMarker = '"@id": "https://riksdagsmonitor.com/#website"';
    if (next.includes(legacyMarker)) {
      // Strip our legacy block (WebSite + Organization + WebPage,
      // no BreadcrumbList). We only enter this branch when no
      // BreadcrumbList exists in the document, so this regex is safe.
      next = next.replace(
        /<script type="application\/ld\+json">\s*\{[\s\S]*?"@id":\s*"https:\/\/riksdagsmonitor\.com\/#website"[\s\S]*?<\/script>\s*/,
        '',
      );
    }
    const jsonLdBlock = buildStaticPageJsonLd({
      title,
      description,
      canonicalUrl,
      lang,
      family,
    });
    if (/<\/head>/i.test(next)) {
      next = next.replace(/<\/head>/i, `${jsonLdBlock}\n</head>`);
    }
  }

  return next;
}
