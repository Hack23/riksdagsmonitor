import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';
import { LANGUAGE_META } from './sitemap-html/i18n.js';
import { chromeStrings } from './render-lib/chrome-i18n.js';
import { buildHeaderHtml } from './render-lib/chrome/header.js';
import type { BreadcrumbItem } from './render-lib/chrome/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
const API_DOCS_URL = 'https://riksdagsmonitor.com/docs/api/index.html';
const ISSUE_URL = 'https://github.com/Hack23/riksdagsmonitor/issues/new/choose';

type PageFamily = 'home' | 'dashboard' | 'politician';

interface PageTarget {
  readonly file: string;
  readonly lang: Language;
  readonly family: PageFamily;
}

function languageSuffix(lang: Language): string {
  return lang === 'en' ? '' : `_${lang}`;
}

function fileFor(family: PageFamily, lang: Language): string {
  const suffix = languageSuffix(lang);
  if (family === 'dashboard') return `dashboard/index${suffix}.html`;
  if (family === 'politician') return `politician-dashboard${suffix}.html`;
  return `index${suffix}.html`;
}

function pathPrefix(file: string): string {
  const depth = file.split('/').length - 1;
  return depth > 0 ? '../'.repeat(depth) : '';
}

function ensureStylesheet(html: string, prefix: string): string {
  const href = `${prefix}styles.css`;
  if (new RegExp(`<link\\b[^>]*href=["']${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html)) {
    return html;
  }
  const link = `<link rel="stylesheet" href="${href}">`;
  if (/<meta name="viewport"[^>]*>/i.test(html)) {
    return html.replace(/(<meta name="viewport"[^>]*>)/i, `$1\n${link}`);
  }
  return html.replace(/<\/head>/i, `${link}\n</head>`);
}

function normalizeApiLinks(html: string): string {
  return html
    .replace(/href="(?:\.\.\/)?api\/index\.html"/g, `href="${API_DOCS_URL}"`)
    .replace(/href="(?:\.\.\/)?docs\/api\/?"/g, `href="${API_DOCS_URL}"`)
    .replace(/href="(?:\.\.\/)?docs\/api\/index\.html"/g, `href="${API_DOCS_URL}"`)
    .replace(/href="https:\/\/riksdagsmonitor\.com\/docs\/api\/?"/g, `href="${API_DOCS_URL}"`)
    .replace(/href="https:\/\/github\.com\/Hack23\/riksdagsmonitor\/issues"/g, `href="${ISSUE_URL}"`);
}

function languageGrid(prefix: string, family: PageFamily, current: Language): string {
  const cs = chromeStrings(current);
  return LANGUAGES.map((lang) => {
    const meta = LANGUAGE_META[lang];
    const href = `${prefix}${fileFor(family, lang)}`;
    const code = lang === 'no' ? 'NO' : meta.hreflang.toUpperCase();
    const currentAttrs = lang === current ? ' aria-current="page" class="active"' : '';
    return `        <a href="${href}" lang="${meta.hreflang}" hreflang="${meta.hreflang}" title="${meta.nativeName}" aria-label="${cs.switchLanguage}: ${meta.name}"${currentAttrs}><span aria-hidden="true">${meta.flag}</span> ${code}</a>`;
  }).join('\n');
}

function languageBar(prefix: string, family: PageFamily, current: Language): string {
  const cs = chromeStrings(current);
  return `<nav class="language-switcher site-language-switcher" aria-label="${cs.thisPageInOtherLanguages}" data-rm-static-language-switcher="true">\n${languageGrid(prefix, family, current)}\n</nav>`;
}

function primaryNav(prefix: string, current: Language): string {
  const suffix = localizedSuffix(current);
  const cs = chromeStrings(current);
  const t = LANGUAGE_META[current].translations;
  const indexFile = `${prefix}index${suffix}.html`;
  const newsFile = `${prefix}news/index${suffix}.html`;
  const dashboardFile = `${prefix}dashboard/index${suffix}.html`;
  const piFile = `${prefix}political-intelligence${suffix}.html`;
  const politiciansFile = `${prefix}politician-dashboard${suffix}.html`;
  const sitemapFile = `${prefix}sitemap${suffix}.html`;
  return `<nav class="site-header-nav" aria-label="${cs.mainNav}" data-rm-static-primary-nav="true">
  <a href="${indexFile}">${t.home}</a>
  <a href="${newsFile}">${cs.news}</a>
  <a href="${dashboardFile}">${cs.dashboard}</a>
  <a href="${politiciansFile}"><span aria-hidden="true">👤</span> ${cs.politicians}</a>
  <a href="${piFile}"><span aria-hidden="true">🧠</span> ${cs.politicalIntelligence}</a>
  <a href="${sitemapFile}"><span aria-hidden="true">🗺️</span> ${t.siteMap}</a>
  <a href="${API_DOCS_URL}"><span aria-hidden="true">📚</span> ${t.apiDocs}</a>
  <a class="rm-header-cta rm-header-cta-transparency" href="https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" title="${cs.transparencyTitle}" aria-label="${cs.transparencyTitle}"><span aria-hidden="true">🔐</span> ${cs.transparencyLabel}</a>
  <a class="rm-header-cta rm-header-cta-sponsor" href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer" title="${cs.sponsorTitle}" aria-label="${cs.sponsorTitle}"><span aria-hidden="true">💖</span> ${cs.sponsorLabel}</a>
</nav>`;
}

function footer(prefix: string, family: PageFamily, current: Language): string {
  const cs = chromeStrings(current);
  const t = LANGUAGE_META[current].translations;
  const indexFile = current === 'en' ? 'index.html' : `index_${current}.html`;
  const newsFile = current === 'en' ? 'news/index.html' : `news/index_${current}.html`;
  const dashboardFile = current === 'en' ? 'dashboard/index.html' : `dashboard/index_${current}.html`;
  const piFile = current === 'en' ? 'political-intelligence.html' : `political-intelligence_${current}.html`;
  const politiciansFile = current === 'en' ? 'politician-dashboard.html' : `politician-dashboard_${current}.html`;
  const sitemapFile = current === 'en' ? 'sitemap.html' : `sitemap_${current}.html`;
  const year = new Date().getUTCFullYear();

  return `<footer role="contentinfo" class="site-footer" data-rm-static-footer="true">
  <div class="footer-content">
    <div class="footer-section">
      <a href="${prefix}${indexFile}" aria-label="Riksdagsmonitor ${t.home}">
        <img src="${prefix}images/riksdagsmonitor-logo.webp" alt="Riksdagsmonitor" class="footer-logo" width="80" height="80" loading="lazy">
      </a>
      <h3><span aria-hidden="true">📖</span> ${cs.legacyAboutHeading}</h3>
      <p>${cs.legacyAboutBody}</p>
      <p>${cs.footerCybersecurityTagline}</p>
      <ul class="footer-stats">
        <li><strong>349 ${cs.legacyStatMps}</strong> ${cs.legacyStatTracked}</li>
        <li><strong>45 ${cs.legacyStatRiskRules}</strong> ${cs.legacyStatActive}</li>
        <li><strong>14 ${cs.legacyStatLanguages}</strong> ${cs.legacyStatSupported}</li>
        <li><strong>${cs.legacyStatYears}</strong> ${cs.legacyStatHistorical}</li>
      </ul>
    </div>
    <div class="footer-section">
      <h3><span aria-hidden="true">🔗</span> ${cs.legacyQuickLinksHeading}</h3>
      <ul>
        <li><a href="${prefix}${indexFile}">${t.home}</a></li>
        <li><a href="${prefix}${newsFile}">${cs.news}</a></li>
        <li><a href="${prefix}${dashboardFile}">${cs.dashboard}</a></li>
        <li><a href="${prefix}${politiciansFile}"><span aria-hidden="true">👤</span> ${cs.politicians}</a></li>
        <li><a href="${prefix}${piFile}"><span aria-hidden="true">🧠</span> ${cs.politicalIntelligence}</a></li>
        <li><a href="${prefix}${sitemapFile}"><span aria-hidden="true">🗺️</span> ${t.siteMap}</a></li>
        <li><a href="${API_DOCS_URL}"><span aria-hidden="true">📚</span> ${cs.linkApiDocs}</a></li>
        <li><a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">${cs.linkCiaPlatform}</a></li>
        <li><a href="https://github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer">${cs.linkGithubRepo}</a></li>
        <li><a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">${cs.linkRiksdag}</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3><span aria-hidden="true">🏢</span> ${cs.footerBuiltByHeading}</h3>
      <p>${cs.footerCybersecurityTagline}</p>
      <ul>
        <li><a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">${cs.linkHack23Home}</a></li>
        <li><a href="https://www.hack23.com/riksdagsmonitor.html" target="_blank" rel="noopener noreferrer">${cs.linkHack23Riksdagsmonitor}</a></li>
        <li><a href="https://www.hack23.com/riksdagsmonitor-features.html" target="_blank" rel="noopener noreferrer">${cs.linkHack23Features}</a></li>
        <li><a href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">💖</span> ${cs.linkSponsorHack23}</a></li>
        <li><a href="https://www.linkedin.com/company/hack23/" target="_blank" rel="noopener noreferrer">${cs.linkLinkedin}</a></li>
        <li><a href="https://github.com/Hack23" target="_blank" rel="noopener noreferrer">${cs.linkHack23Org}</a></li>
        <li><a href="mailto:info@hack23.com">${cs.linkContactUs}</a></li>
        <li><a href="${ISSUE_URL}" target="_blank" rel="noopener noreferrer">${cs.linkReportIssue}</a></li>
      </ul>
    </div>
    <div class="footer-section rm-footer-isms">
      <h3><span aria-hidden="true">🛡️</span> ${cs.footerIsmsHeading}</h3>
      <p>${cs.footerIsmsTagline}</p>
      <ul>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">${cs.linkPublicIsmsRepo}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkInfoSecPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Privacy_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkPrivacyPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkSecureDevPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkAiPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md" target="_blank" rel="noopener noreferrer">${cs.linkThreatModeling}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md" target="_blank" rel="noopener noreferrer">${cs.linkVulnMgmt}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md" target="_blank" rel="noopener noreferrer">${cs.linkIncidentResponse}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Access_Control_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkAccessControl}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkCryptoPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkOpenSourcePolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md" target="_blank" rel="noopener noreferrer">${cs.linkChangeMgmt}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md" target="_blank" rel="noopener noreferrer">${cs.linkClassification}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md" target="_blank" rel="noopener noreferrer">${cs.linkSecurityMetrics}</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3><span aria-hidden="true">🌍</span> ${cs.legacyLanguagesHeading}</h3>
      <div class="language-grid">
${languageGrid(prefix, family, current)}
      </div>
    </div>
  </div>
  <nav class="rm-footer-trust-badges" aria-label="${cs.trustBadgesAria}">
    <a href="https://www.npmjs.com/package/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor on npmjs"><img src="https://img.shields.io/npm/v/riksdagsmonitor.svg?logo=npm&label=npm" alt="Riksdagsmonitor on npmjs" width="100" height="20" loading="lazy" decoding="async"></a>
    <a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Scorecard"><img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard" width="120" height="20" loading="lazy" decoding="async"></a>
    <a href="https://www.bestpractices.dev/projects/12069" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Best Practices"><img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices" width="124" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml" target="_blank" rel="noopener noreferrer" aria-label="CodeQL workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml/badge.svg" alt="CodeQL workflow status" width="120" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml" target="_blank" rel="noopener noreferrer" aria-label="Quality checks workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml/badge.svg" alt="Quality checks workflow status" width="160" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml" target="_blank" rel="noopener noreferrer" aria-label="Dependency review workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml/badge.svg" alt="Dependency review workflow status" width="170" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" aria-label="Apache-2.0 License"><img src="https://img.shields.io/github/license/Hack23/riksdagsmonitor" alt="Apache-2.0 License" width="120" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer" aria-label="Hack23 ISMS-PUBLIC"><img src="https://img.shields.io/badge/Hack23-ISMS-blue?logo=shield" alt="Hack23 ISMS-PUBLIC" width="100" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="ISO 27001:2022 alignment"><img src="https://img.shields.io/badge/ISO-27001:2022-purple" alt="ISO 27001:2022 alignment" width="110" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="NIST CSF 2.0 alignment"><img src="https://img.shields.io/badge/NIST-CSF_2.0-orange" alt="NIST CSF 2.0 alignment" width="100" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="CIS Controls v8.1 alignment"><img src="https://img.shields.io/badge/CIS-Controls_v8.1-red" alt="CIS Controls v8.1 alignment" width="120" height="20" loading="lazy" decoding="async"></a>
    <a href="https://riksdagsmonitor.com" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor.com website status"><img src="https://img.shields.io/website?url=https%3A%2F%2Friksdagsmonitor.com" alt="Riksdagsmonitor.com website status" width="120" height="20" loading="lazy" decoding="async"></a>
  </nav>
  <div class="footer-bottom">
    <p>&copy; 2008-<time datetime="${year}">${year}</time> <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a> (Org.nr 5595347807) | Gothenburg, Sweden</p>
    <p class="footer-disclaimer">⚠️ <a href="${ISSUE_URL}" target="_blank" rel="noopener noreferrer">${cs.linkReportIssue}</a></p>
  </div>
</footer>`;
}

function targets(): PageTarget[] {
  return LANGUAGES.flatMap((lang) => [
    { file: fileFor('home', lang), lang, family: 'home' as const },
    { file: fileFor('dashboard', lang), lang, family: 'dashboard' as const },
    { file: fileFor('politician', lang), lang, family: 'politician' as const },
  ]);
}

function replaceFooter(html: string, prefix: string, family: PageFamily, lang: Language): string {
  const nextFooter = footer(prefix, family, lang);
  if (/<footer\b[\s\S]*?<\/footer>/i.test(html)) {
    return html.replace(/<footer\b[\s\S]*?<\/footer>/i, nextFooter);
  }
  return html.replace(/<\/body>/i, `${nextFooter}\n</body>`);
}

function ensureLanguageSwitcher(html: string, prefix: string, family: PageFamily, lang: Language): string {
  const cleaned = html
    .replace(/\s*<nav class="site-header-nav"[\s\S]*?data-rm-static-primary-nav="true"[\s\S]*?<\/nav>\s*/i, '\n')
    .replace(/\s*<nav class="language-switcher site-language-switcher"[\s\S]*?data-rm-static-language-switcher="true"[\s\S]*?<\/nav>\s*/i, '\n');
  const nav = primaryNav(prefix, lang);
  const bar = languageBar(prefix, family, lang);
  if (/<\/header>/i.test(cleaned)) {
    return cleaned.replace(/\s*<\/header>/i, `\n${nav}\n${bar}\n</header>`);
  }
  return cleaned.replace(/(<body[^>]*>)/i, `$1\n${nav}\n${bar}\n`);
}

/**
 * Render the localized theme-toggle button used by all static landing
 * pages. Houses both ☀️ and 🌙 glyphs so CSS can swap visibility based on
 * `html[data-theme]`, giving the button a morphing icon without inline
 * scripts. Aria-pressed is set by `js/theme-toggle.js` at runtime.
 */
function themeToggleButton(cs: ReturnType<typeof chromeStrings>): string {
  return `<button id="theme-toggle" class="theme-toggle-btn" type="button"
        aria-pressed="false"
        aria-label="${cs.themeAria}"
        title="${cs.themeAria}"
        data-label-dark="${cs.themeToLight}"
        data-label-light="${cs.themeToDark}"
        data-rm-static-theme-toggle="true">
  <span class="theme-icon theme-icon-moon" aria-hidden="true">🌙</span>
  <span class="theme-icon theme-icon-sun" aria-hidden="true">☀️</span>
  <span class="theme-toggle-label">${cs.themeLabel}</span>
</button>`;
}

/**
 * Inject the localized hero block into a static landing page. Only home
 * pages (`index_*.html`) carry this block — dashboard and politician
 * variants have their own hero structures left untouched.
 */
function replaceHero(html: string, lang: Language): string {
  const cs = chromeStrings(lang);
  let next = html;

  next = next.replace(
    /<button\s+id="theme-toggle"[\s\S]*?<\/button>/i,
    themeToggleButton(cs),
  );

  next = next.replace(
    /(<span\s+class="h1-subtitle">)[\s\S]*?(<\/span>)/i,
    `$1${cs.heroSubtitle}$2`,
  );

  next = next.replace(
    /(<p\s+class="tagline">)[\s\S]*?(<\/p>)/i,
    `$1${cs.heroTagline}$2`,
  );

  next = next.replace(
    /<div\s+class="election-countdown">[\s\S]*?<\/div>/i,
    `<div class="election-countdown">
<h2>${cs.electionCountdownLabel} <span id="countdown">${cs.electionDateLong}</span></h2>
<p>${cs.electionDateLong}</p>
</div>`,
  );

  const STAT_LABELS: Record<string, { label: string; icon: string }> = {
    'stat-historical-persons':    { label: cs.heroStatPoliticians, icon: '👥' },
    'stat-against-proposals':     { label: cs.heroStatBallots,     icon: '🗳️' },
    'stat-total-documents':       { label: cs.heroStatDocuments,   icon: '📄' },
    'stat-government-proposals':  { label: cs.heroStatBills,       icon: '📜' },
    'stat-committee-decisions':   { label: cs.heroStatDecisions,   icon: '🏛️' },
  };
  for (const [statId, { label, icon }] of Object.entries(STAT_LABELS)) {
    const escaped = statId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `(<span\\s+class="number"\\s+data-stat-id="${escaped}">[\\s\\S]*?<\\/span>\\s*)[\\s\\S]*?(<\\/div>)`,
      'i',
    );
    next = next.replace(re, `$1<span class="label"><span aria-hidden="true">${icon}</span> ${label}</span>\n$2`);
  }

  return next;
}

let changed = 0;
for (const target of targets()) {
  const absolute = path.join(ROOT_DIR, target.file);
  if (!fs.existsSync(absolute)) continue;
  const prefix = pathPrefix(target.file);
  const before = fs.readFileSync(absolute, 'utf8');
  // Skip the legacy chrome pass entirely for pages that have already been
  // migrated to the modern `rm-site-header` shape — otherwise the legacy
  // pass re-injects `site-header-nav` / `site-language-switcher` on every
  // re-run of the prebuild chain.
  if (/class="rm-site-header"/.test(before)) continue;
  let after = ensureStylesheet(before, prefix);
  after = normalizeApiLinks(after);
  after = replaceFooter(after, prefix, target.family, target.lang);
  after = ensureLanguageSwitcher(after, prefix, target.family, target.lang);
  if (target.family === 'home') {
    after = replaceHero(after, target.lang);
  }
  if (after !== before) {
    fs.writeFileSync(absolute, after, 'utf8');
    changed++;
  }
}

function langFromNewsFile(file: string): Language | null {
  const match = file.match(/-([a-z]{2})\.html$/);
  const candidate = match?.[1] as Language | undefined;
  return candidate && (LANGUAGES as readonly string[]).includes(candidate) ? candidate : null;
}

function localizedSuffix(lang: Language): string {
  return lang === 'en' ? '' : `_${lang}`;
}

function inferLegacyArticleType(file: string): string {
  const lower = file.toLowerCase();
  const mappings: readonly [string, string][] = [
    ['committee-reports', 'committee-reports'],
    ['committeereports', 'committee-reports'],
    ['propositions', 'propositions'],
    ['government-propositions', 'propositions'],
    ['opposition-motions', 'motions'],
    ['motions', 'motions'],
    ['interpellations', 'interpellations'],
    ['evening-analysis', 'evening-analysis'],
    ['week-ahead', 'week-ahead'],
    ['month-ahead', 'month-ahead'],
    ['weekly-review', 'weekly-review'],
    ['monthly-review', 'monthly-review'],
    ['deep-inspection', 'deep-inspection'],
    ['realtime-pulse', 'realtime-pulse'],
    ['realtime', 'realtime'],
    ['breaking', 'breaking'],
    ['parliament-agenda', 'parliament-agenda'],
  ];
  return mappings.find(([needle]) => lower.includes(needle))?.[1] ?? 'political-intelligence';
}

function ensureLegacyArticleTypeClass(html: string, file: string): string {
  const type = inferLegacyArticleType(file);
  return html.replace(/<article\b([^>]*class=")([^"]*\bnews-article\b[^"]*)(")/i, (_match, before, classes, after) => {
    const classSet = new Set(String(classes).split(/\s+/).filter(Boolean));
    classSet.add(`article-type-${type}`);
    return `<article${before}${Array.from(classSet).join(' ')}${after}`;
  });
}

function addNewsQuickLinks(html: string, lang: Language): string {
  if (html.includes('political-intelligence')) return html;
  const suffix = localizedSuffix(lang);
  const additions = `
        <li><a href="../political-intelligence${suffix}.html"><span aria-hidden="true">🧠</span> Political Intelligence</a></li>
        <li><a href="../sitemap${suffix}.html"><span aria-hidden="true">🗺️</span> Sitemap</a></li>
        <li><a href="${API_DOCS_URL}"><span aria-hidden="true">📚</span> API Documentation (TypeDoc)</a></li>`;
  const dashboardHref = `../dashboard/index${suffix}.html`;
  const dashboardLinkPattern = new RegExp(`(<li><a href="${dashboardHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<\\/a><\\/li>)`, 'i');
  return html.replace(dashboardLinkPattern, `$1${additions}`);
}

function addNewsHeaderLinks(html: string, lang: Language): string {
  if (html.includes('political-intelligence')) return html;
  const suffix = localizedSuffix(lang);
  const additions = `
      <li><a href="../political-intelligence${suffix}.html">🧠 Political Intelligence</a></li>
      <li><a href="../sitemap${suffix}.html">🗺️ Sitemap</a></li>`;
  const dashboardHref = `../dashboard/index${suffix}.html`;
  const dashboardLinkPattern = new RegExp(`(<li><a href="${dashboardHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<\\/a><\\/li>)`, 'i');
  return html.replace(dashboardLinkPattern, `$1${additions}`);
}

function legacyNewsHeader(lang: Language): string {
  const suffix = localizedSuffix(lang);
  const cs = chromeStrings(lang);
  const t = LANGUAGE_META[lang].translations;
  return `<header class="site-header" role="banner">
<nav class="article-top-nav" aria-label="${cs.mainNav}">
<a href="../index${suffix}.html" class="nav-home" aria-label="Riksdagsmonitor ${t.home}">
  <img src="../images/riksdagsmonitor-logo.webp" alt="Riksdagsmonitor" class="site-logo" width="48" height="48" loading="eager">
  <span>Riksdagsmonitor</span>
</a>
<span class="nav-separator">|</span>
<a href="index${suffix}.html" class="nav-news">${cs.news}</a>
<a href="../dashboard/index${suffix}.html">${cs.dashboard}</a>
<a href="../political-intelligence${suffix}.html">🧠 ${cs.politicalIntelligence}</a>
<a href="../sitemap${suffix}.html">🗺️ ${t.siteMap}</a>
<a href="${API_DOCS_URL}">📚 ${t.apiDocs}</a>
<a class="rm-header-cta rm-header-cta-transparency" href="https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" title="${cs.transparencyTitle}" aria-label="${cs.transparencyTitle}">
  <span class="rm-header-cta-icon" aria-hidden="true">🔐</span>
  <span class="rm-header-cta-label">${cs.transparencyLabel}</span>
</a>
<a class="rm-header-cta rm-header-cta-sponsor" href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer" title="${cs.sponsorTitle}" aria-label="${cs.sponsorTitle}">
  <span class="rm-header-cta-icon" aria-hidden="true">💖</span>
  <span class="rm-header-cta-label">${cs.sponsorLabel}</span>
</a>
<button id="theme-toggle" class="theme-toggle-btn" type="button"
        aria-pressed="false"
        aria-label="${cs.themeAria}"
        title="${cs.themeAria}"
        data-label-dark="${cs.themeToLight}"
        data-label-light="${cs.themeToDark}">
  <span class="theme-icon" aria-hidden="true">🌙</span>
</button>
</nav>
</header>`;
}

function normalizeLegacyNewsChrome(html: string, lang: Language): string {
  if (html.includes('class="rm-site-header"')) return html;
  let next = html;
  if (/<header\b[^>]*class="[^"]*\bsite-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i.test(next)) {
    next = next.replace(/<header\b[^>]*class="[^"]*\bsite-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i, legacyNewsHeader(lang));
  }
  if (!next.includes('id="theme-toggle"') && /<body[^>]*>/i.test(next)) {
    next = next.replace(/(<body[^>]*>)/i, `$1\n${legacyNewsHeader(lang)}`);
  }
  const normalizedFooter = footer('../', 'home', lang);
  if (/<footer\b[^>]*(?:role="contentinfo"|class="[^"]*\bsite-footer\b)[^>]*>[\s\S]*?<\/footer>/i.test(next)) {
    next = next.replace(/<footer\b[^>]*(?:role="contentinfo"|class="[^"]*\bsite-footer\b)[^>]*>[\s\S]*?<\/footer>/i, normalizedFooter);
  }
  return next;
}

function walkHtmlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

let newsChanged = 0;
for (const absolute of walkHtmlFiles(path.join(ROOT_DIR, 'news'))) {
  const rel = path.relative(ROOT_DIR, absolute);
  const lang = langFromNewsFile(rel);
  if (!lang) continue;
  const before = fs.readFileSync(absolute, 'utf8');
  let after = normalizeApiLinks(before);
  if (!after.includes('class="rm-site-footer"')) {
    after = normalizeLegacyNewsChrome(addNewsHeaderLinks(addNewsQuickLinks(after, lang), lang), lang);
    after = ensureLegacyArticleTypeClass(after, rel);
  }
  if (after !== before) {
    fs.writeFileSync(absolute, after, 'utf8');
    newsChanged++;
  }
}

// ─── Modern chrome migration for static landing pages ────────────────────
//
// All static landing pages (root index*, dashboard/index*, politician-
// dashboard*, dashboards/<slug>*) historically carried the legacy
// `<header>` shape produced by `primaryNav()` / `languageBar()` above.
// Generated article and political-intelligence pages have since moved
// to the unified modern chrome built by `buildHeaderHtml()` in
// `scripts/render-lib/chrome/header.ts`. This second pass upgrades the
// 168 static pages in-place so the two surfaces stay visually and
// structurally identical.
//
// The migration is strictly idempotent: pages that already contain
// `class="rm-site-header"` are skipped, so re-running the prebuild step
// after a successful run is a no-op.

const DASHBOARD_SLUGS = [
  'anomaly-detection',
  'coalitions',
  'committees',
  'election-cycle',
  'ministers',
  'parties',
  'pre-election',
  'risk',
  'seasonal-patterns',
] as const;

interface ModernTarget {
  readonly file: string;
  readonly lang: Language;
  readonly family: 'home' | 'dashboard-hub' | 'politician' | 'dashboard-slug';
  readonly slug?: string;
}

function modernTargets(): ModernTarget[] {
  const out: ModernTarget[] = [];
  for (const lang of LANGUAGES) {
    const sfx = languageSuffix(lang);
    out.push({ file: `index${sfx}.html`, lang, family: 'home' });
    out.push({ file: `dashboard/index${sfx}.html`, lang, family: 'dashboard-hub' });
    out.push({ file: `politician-dashboard${sfx}.html`, lang, family: 'politician' });
    for (const slug of DASHBOARD_SLUGS) {
      out.push({ file: `dashboards/${slug}${sfx}.html`, lang, family: 'dashboard-slug', slug });
    }
  }
  return out;
}

function modernCanonicalFor(family: ModernTarget['family'], slug: string | undefined, lang: Language): string {
  const sfx = languageSuffix(lang);
  if (family === 'home') return `index${sfx}.html`;
  if (family === 'dashboard-hub') return `dashboard/index${sfx}.html`;
  if (family === 'politician') return `politician-dashboard${sfx}.html`;
  return `dashboards/${slug}${sfx}.html`;
}

function modernAlternatesFor(family: ModernTarget['family'], slug: string | undefined): Partial<Record<Language, string>> {
  const out: Partial<Record<Language, string>> = {};
  for (const lang of LANGUAGES) {
    out[lang] = modernCanonicalFor(family, slug, lang);
  }
  return out;
}

/**
 * Extract the existing `<title>…</title>` text. Trimmed and used to populate
 * the modern chrome breadcrumb and og:title.
 */
function extractTitle(html: string): string {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return 'Riksdagsmonitor';
  return m[1]!.replace(/\s+/g, ' ').trim();
}

/**
 * Read the existing body class list (excluding `rm-article-body`, which the
 * modern chrome adds itself).
 */
function extractBodyClass(html: string): string {
  const m = html.match(/<body\b([^>]*)>/i);
  if (!m) return '';
  const attrs = m[1]!;
  const cm = attrs.match(/\bclass\s*=\s*"([^"]*)"/i);
  if (!cm) return '';
  return cm[1]!
    .split(/\s+/)
    .filter((c) => c && c !== 'rm-article-body')
    .join(' ')
    .trim();
}

/**
 * Read the id of the page's `<main>` element so we can adjust the modern
 * chrome skip-link to point at the actual landing target. Defaults to
 * `main` (matches `buildHeaderHtml`) if no `<main id="…">` is present.
 */
function extractMainId(html: string): string {
  const m = html.match(/<main\b[^>]*\bid\s*=\s*"([^"]+)"/i);
  return m ? m[1]! : 'main';
}

/**
 * Build the breadcrumb chain shown in `rm-site-subnav`. Mirrors what the
 * legacy pages already carry in their pre-header breadcrumb nav.
 */
function modernBreadcrumb(family: ModernTarget['family'], lang: Language, pageTitle: string): readonly BreadcrumbItem[] {
  const cs = chromeStrings(lang);
  const t = LANGUAGE_META[lang].translations;
  const sfx = languageSuffix(lang);
  const homeHref = `${(family === 'dashboard-hub' || family === 'dashboard-slug') ? '../' : ''}index${sfx}.html`;
  if (family === 'home') {
    return [
      { label: t.home, href: homeHref },
      { label: pageTitle },
    ];
  }
  if (family === 'politician') {
    return [
      { label: t.home, href: homeHref },
      { label: cs.politicians ?? pageTitle },
    ];
  }
  if (family === 'dashboard-hub') {
    return [
      { label: t.home, href: homeHref },
      { label: cs.dashboard ?? pageTitle },
    ];
  }
  // dashboard-slug
  return [
    { label: t.home, href: homeHref },
    { label: cs.dashboard ?? 'Dashboards', href: `../dashboard/index${sfx}.html` },
    { label: pageTitle },
  ];
}

/**
 * Render the modern chrome head fragment (everything from `<body…>` up
 * through `</header>` + optional hero-banner + lang-bar) for a single
 * page. The trailing `<main id="main" …>` produced by `buildHeaderHtml`
 * is stripped — pages keep their existing `<main id="main-content">`
 * (or similar) intact and we rewrite the skip-link to match.
 */
function renderModernChromeBlock(target: ModernTarget, html: string): string {
  const pageTitle = extractTitle(html);
  const bodyClass = extractBodyClass(html);
  const mainId = extractMainId(html);
  const family = target.family;
  const canonicalPath = modernCanonicalFor(family, target.slug, target.lang);
  const alternates = modernAlternatesFor(family, target.slug);
  const breadcrumb = modernBreadcrumb(family, target.lang, pageTitle);
  const built = buildHeaderHtml({
    lang: target.lang,
    title: pageTitle,
    description: '',
    canonicalPath,
    hreflangAlternates: alternates,
    breadcrumb,
    bodyClass: bodyClass || undefined,
    defaultAlternateBase: canonicalPath.replace(/_[a-z]{2}\.html$/, '.html').split('/').pop()!,
    heroBanner: true,
    languageBar: true,
  });
  // Strip the trailing `<main …>` line — the page keeps its existing main.
  const stripped = built.replace(/\n?\s*<main\b[^>]*>\s*$/i, '\n');
  // Rewrite the skip-link to target the page's actual main id.
  if (mainId !== 'main') {
    return stripped.replace(/(<a class="skip-link" href=")#main(")/, `$1#${mainId}$2`);
  }
  return stripped;
}

/**
 * Extract the "preserved" content from inside the legacy `<header>` —
 * everything that is NOT site-header-nav, NOT site-language-switcher,
 * NOT the legacy theme-toggle button, and NOT the hero-banner div. This
 * keeps page-specific hero blocks (hero-header-text, election-countdown,
 * hero-stats, politician-dashboard's logo+ul secondary nav) intact and
 * re-inserts them between the modern chrome and the page's `<main>`.
 */
function extractPreservedHeaderContent(headerInner: string): string {
  let next = headerInner;
  // Strip the three pieces the modern chrome already provides.
  next = next.replace(/<nav\s+class="site-header-nav"[\s\S]*?<\/nav>/gi, '');
  next = next.replace(/<nav\s+class="language-switcher site-language-switcher"[\s\S]*?<\/nav>/gi, '');
  next = next.replace(/<button\s+id="theme-toggle"[\s\S]*?<\/button>/gi, '');
  // Strip the legacy hero banner div — modern chrome emits its own.
  next = next.replace(/<!--\s*Hero Banner\s*-->\s*<div\s+class="hero-banner">[\s\S]*?<\/div>/i, '');
  next = next.replace(/<div\s+class="hero-banner">[\s\S]*?<\/div>/i, '');
  // Strip politician-dashboard's bare `<nav>` containing logo + ul — this is
  // a legacy secondary nav now fully covered by the modern `rm-site-nav`.
  // Only strips bare `<nav>` tags (no class attribute) wrapping a `class="logo"` div.
  next = next.replace(/<nav>\s*<div\s+class="logo">[\s\S]*?<\/nav>/gi, '');
  // Strip vestigial section comments that would otherwise dangle.
  next = next.replace(/<!--\s*Hero Title\s*-->/gi, '');
  return next.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Transform a single legacy page into modern chrome. Idempotent — returns
 * the input unchanged if the page is already modernized.
 */
function migrateToModernChrome(html: string, target: ModernTarget): string {
  if (/class="rm-site-header"/.test(html)) return html;
  // Must have legacy chrome markers to convert.
  if (!/data-rm-static-primary-nav="true"/.test(html)) return html;

  // Capture the legacy region: from `<body…>` open through the FIRST
  // `</header>`. Everything before the body open stays intact (head),
  // everything after the closing `</header>` (including the page's
  // `<main>`) also stays intact.
  const bodyOpenMatch = html.match(/<body\b[^>]*>/i);
  if (!bodyOpenMatch) return html;
  const bodyOpenIdx = bodyOpenMatch.index!;
  const bodyOpenEnd = bodyOpenIdx + bodyOpenMatch[0].length;
  const headerCloseIdx = html.indexOf('</header>', bodyOpenEnd);
  if (headerCloseIdx < 0) return html;
  const legacyRegion = html.slice(bodyOpenEnd, headerCloseIdx);

  // Locate the legacy `<header>` inside that region so we can keep any
  // page-specific content that lives inside it (hero text, countdown, etc.).
  const headerOpenMatch = legacyRegion.match(/<header\b[^>]*>/i);
  const headerInner = headerOpenMatch
    ? legacyRegion.slice(headerOpenMatch.index! + headerOpenMatch[0].length)
    : '';
  const preserved = extractPreservedHeaderContent(headerInner);

  const modernBlock = renderModernChromeBlock(target, html);
  const replacement = preserved
    ? `${modernBlock}\n${preserved}\n`
    : `${modernBlock}\n`;

  return (
    html.slice(0, bodyOpenIdx) +
    replacement +
    html.slice(headerCloseIdx + '</header>'.length)
  );
}

let modernChanged = 0;
for (const target of modernTargets()) {
  const absolute = path.join(ROOT_DIR, target.file);
  if (!fs.existsSync(absolute)) continue;
  const before = fs.readFileSync(absolute, 'utf8');
  let after = migrateToModernChrome(before, target);
  // Defensive: downstream prebuild steps (backfill-translated-chrome,
  // ensureLanguageSwitcher legacy pass) may re-inject the legacy navs
  // into a page that already has modern chrome. Strip them whenever a
  // page already carries `rm-site-header`.
  if (/class="rm-site-header"/.test(after)) {
    after = after.replace(/<nav\s+class="site-header-nav"[\s\S]*?<\/nav>/gi, '');
    after = after.replace(/<nav\s+class="language-switcher site-language-switcher"[\s\S]*?<\/nav>/gi, '');
  }
  if (after !== before) {
    fs.writeFileSync(absolute, after, 'utf8');
    modernChanged++;
  }
}

console.log(`Normalized static HTML chrome for ${changed} page(s), legacy news links for ${newsChanged} page(s), modernized chrome for ${modernChanged} page(s).`);
