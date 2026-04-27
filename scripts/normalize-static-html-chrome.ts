import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';
import { LANGUAGE_META } from './sitemap-html/i18n.js';

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
    .replace(/href="https:\/\/riksdagsmonitor\.com\/docs\/api\/?"/g, `href="${API_DOCS_URL}"`);
}

function languageGrid(prefix: string, family: PageFamily, current: Language): string {
  return LANGUAGES.map((lang) => {
    const meta = LANGUAGE_META[lang];
    const href = `${prefix}${fileFor(family, lang)}`;
    const code = meta.hreflang.toUpperCase();
    const currentAttrs = lang === current ? ' aria-current="page" class="active"' : '';
    return `        <a href="${href}" lang="${meta.hreflang}" hreflang="${meta.hreflang}" title="${meta.nativeName}" aria-label="Switch to ${meta.name}"${currentAttrs}><span aria-hidden="true">${meta.flag}</span> ${code}</a>`;
  }).join('\n');
}

function languageBar(prefix: string, family: PageFamily, current: Language): string {
  return `\n<nav class="language-switcher site-language-switcher" aria-label="This page in other languages" data-rm-static-language-switcher="true">\n${languageGrid(prefix, family, current)}\n</nav>\n`;
}

function footer(prefix: string, family: PageFamily, current: Language): string {
  const indexFile = current === 'en' ? 'index.html' : `index_${current}.html`;
  const newsFile = current === 'en' ? 'news/index.html' : `news/index_${current}.html`;
  const dashboardFile = current === 'en' ? 'dashboard/index.html' : `dashboard/index_${current}.html`;
  const piFile = current === 'en' ? 'political-intelligence.html' : `political-intelligence_${current}.html`;
  const sitemapFile = current === 'en' ? 'sitemap.html' : `sitemap_${current}.html`;
  const year = new Date().getUTCFullYear();

  return `<footer role="contentinfo" class="site-footer" data-rm-static-footer="true">
  <div class="footer-content">
    <div class="footer-section">
      <a href="${prefix}${indexFile}" aria-label="Riksdagsmonitor Home">
        <img src="${prefix}images/riksdagsmonitor-logo.webp" alt="Riksdagsmonitor" class="footer-logo" width="80" height="80" loading="lazy">
      </a>
      <h3>About Riksdagsmonitor</h3>
      <p>Live intelligence platform for Swedish Parliament monitoring using CIA OSINT capabilities.</p>
      <p>Swedish cybersecurity consultancy specializing in political transparency and open-source intelligence.</p>
      <ul class="footer-stats">
        <li><strong>349 MPs</strong> tracked</li>
        <li><strong>45 risk rules</strong> active</li>
        <li><strong>14 languages</strong> supported</li>
        <li><strong>50+ years</strong> historical data</li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="${prefix}${indexFile}">Home</a></li>
        <li><a href="${prefix}${newsFile}">News</a></li>
        <li><a href="${prefix}${dashboardFile}">Dashboard</a></li>
        <li><a href="${prefix}${piFile}"><span aria-hidden="true">🧠</span> Political Intelligence</a></li>
        <li><a href="${prefix}${sitemapFile}"><span aria-hidden="true">🗺️</span> Sitemap</a></li>
        <li><a href="${API_DOCS_URL}"><span aria-hidden="true">📚</span> API Documentation (TypeDoc)</a></li>
        <li><a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">CIA Platform</a></li>
        <li><a href="https://github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
        <li><a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">Sveriges Riksdag</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>Built by Hack23 AB</h3>
      <p>Swedish cybersecurity consultancy specializing in political transparency and open-source intelligence.</p>
      <ul>
        <li><a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23.com</a></li>
        <li><a href="https://www.linkedin.com/company/hack23/" target="_blank" rel="noopener noreferrer">Company LinkedIn</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">Public ISMS</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md" target="_blank" rel="noopener noreferrer">Security Policy</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Privacy_Policy.md" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
        <li><a href="mailto:info@hack23.com">Contact Us</a></li>
        <li><a href="${ISSUE_URL}" target="_blank" rel="noopener noreferrer">Report a GitHub issue</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>Languages</h3>
      <div class="language-grid">
${languageGrid(prefix, family, current)}
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2008-<time datetime="${year}">${year}</time> <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a> (Org.nr 5595347807) | Gothenburg, Sweden</p>
    <p class="footer-disclaimer">⚠️ Ongoing improvements — please <a href="${ISSUE_URL}" target="_blank" rel="noopener noreferrer">report any issues on GitHub</a>.</p>
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
  const cleaned = html.replace(/\n?<nav class="language-switcher site-language-switcher"[\s\S]*?data-rm-static-language-switcher="true"[\s\S]*?<\/nav>\n?/i, '\n');
  const bar = languageBar(prefix, family, lang);
  if (/<\/header>/i.test(cleaned)) {
    return cleaned.replace(/<\/header>/i, `</header>${bar}`);
  }
  return cleaned.replace(/(<body[^>]*>)/i, `$1${bar}`);
}

let changed = 0;
for (const target of targets()) {
  const absolute = path.join(ROOT_DIR, target.file);
  if (!fs.existsSync(absolute)) continue;
  const prefix = pathPrefix(target.file);
  const before = fs.readFileSync(absolute, 'utf8');
  let after = ensureStylesheet(before, prefix);
  after = normalizeApiLinks(after);
  after = replaceFooter(after, prefix, target.family, target.lang);
  after = ensureLanguageSwitcher(after, prefix, target.family, target.lang);
  if (after !== before) {
    fs.writeFileSync(absolute, after, 'utf8');
    changed++;
  }
}

console.log(`Normalized static HTML chrome for ${changed} page(s).`);
