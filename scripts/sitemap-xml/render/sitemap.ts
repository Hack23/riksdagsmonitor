/**
 * @module Infrastructure/SitemapXml/Render/Sitemap
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Top-level sitemap.xml builder
 *
 * @description
 * Orchestrates the full `<urlset>` XML: index pages (with hreflang
 * alternates), language landing pages, dashboards, news articles, RSS,
 * TypeDoc API pages, and the `docs/` tree. Pure with respect to its
 * inputs (the scanners read the filesystem; this function only composes
 * their output).
 *
 * Round-6 split: extracted from `scripts/generate-sitemap.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from '../../types/language.js';

import { getFileModTime } from '../git-timestamps.js';
import { getNewsArticles } from '../scanners/news.js';
import { getApiDocs } from '../scanners/api.js';
import { getAnalysisFiles, getDocFiles } from '../scanners/docs.js';
import { generateUrlEntry, type HreflangAlternate } from './url-entry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const NEWS_DIR = path.join(ROOT_DIR, 'news');

const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

/** True when `relPath` (relative to the site root) exists on disk. */
function existsAtRoot(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT_DIR, relPath));
}

/**
 * Generate sitemap XML.
 */
export function generateSitemap(): string {
  console.log('🔨 Generating sitemap...');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  const indexAlternates: HreflangAlternate[] = [
    ...LANGUAGES.map((lang) => ({
      lang,
      href: lang === 'en' ? 'index.html' : `index_${lang}.html`,
    })).filter((alt) => existsAtRoot(alt.href)),
    { lang: 'x-default', href: 'index.html' },
  ];

  const indexMtime = getFileModTime(path.join(ROOT_DIR, 'index.html'));
  xml += generateUrlEntry('index.html', indexMtime, 'daily', '1.0', indexAlternates);

  LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
    const loc = `index_${lang}.html`;
    if (!existsAtRoot(loc)) return;
    const lastmod = getFileModTime(path.join(ROOT_DIR, loc));
    const priority = lang === 'sv' ? '0.9' : '0.7';

    xml += generateUrlEntry(loc, lastmod, 'daily', priority);
  });

  if (existsAtRoot('politician-dashboard.html')) {
    const politicianDashboardMtime = getFileModTime(path.join(ROOT_DIR, 'politician-dashboard.html'));
    const politicianAlternates: HreflangAlternate[] = LANGUAGES
      .map((lang) => ({
        lang,
        href: lang === 'en' ? 'politician-dashboard.html' : `politician-dashboard_${lang}.html`,
      }))
      .filter((alt) => existsAtRoot(alt.href));
    politicianAlternates.push({ lang: 'x-default', href: 'politician-dashboard.html' });
    xml += generateUrlEntry(
      'politician-dashboard.html',
      politicianDashboardMtime,
      'weekly',
      '0.8',
      politicianAlternates,
    );
    LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
      const loc = `politician-dashboard_${lang}.html`;
      if (!existsAtRoot(loc)) return;
      xml += generateUrlEntry(loc, getFileModTime(path.join(ROOT_DIR, loc)), 'weekly', '0.7');
    });
  }

  // English rss.xml plus every localized rss_<lang>.xml that was actually
  // emitted by generate-rss (languages with no articles are skipped there,
  // so the existence check keeps the sitemap free of dead feed URLs).
  for (const lang of LANGUAGES) {
    const loc = lang === 'en' ? 'rss.xml' : `rss_${lang}.xml`;
    if (!existsAtRoot(loc)) continue;
    const rssMtime = getFileModTime(path.join(ROOT_DIR, loc));
    const priority = lang === 'en' ? '0.5' : '0.4';
    xml += generateUrlEntry(loc, rssMtime, 'daily', priority);
  }

  const dashboardAlternates: HreflangAlternate[] = [
    ...LANGUAGES.map((lang) => ({
      lang,
      href: lang === 'en' ? 'dashboard/index.html' : `dashboard/index_${lang}.html`,
    })).filter((alt) => fs.existsSync(path.join(ROOT_DIR, alt.href))),
    { lang: 'x-default', href: 'dashboard/index.html' },
  ];

  const dashboardEnMtime = getFileModTime(path.join(ROOT_DIR, 'dashboard', 'index.html'));
  xml += generateUrlEntry('dashboard/index.html', dashboardEnMtime, 'weekly', '0.8', dashboardAlternates);

  LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
    const loc = `dashboard/index_${lang}.html`;
    const dashboardPath = path.join(ROOT_DIR, 'dashboard', `index_${lang}.html`);
    if (fs.existsSync(dashboardPath)) {
      const lastmod = getFileModTime(dashboardPath);
      const priority = lang === 'sv' ? '0.8' : '0.7';
      xml += generateUrlEntry(loc, lastmod, 'weekly', priority);
    }
  });

  const SPECIALISED_DASHBOARDS = [
    'election-cycle',
    'parties',
    'committees',
    'coalitions',
    'seasonal-patterns',
    'pre-election',
    'anomaly-detection',
    'ministers',
    'risk',
  ] as const;

  SPECIALISED_DASHBOARDS.forEach((slug) => {
    const enPath = path.join(ROOT_DIR, 'dashboards', `${slug}.html`);
    if (!fs.existsSync(enPath)) return;
    const enLastmod = getFileModTime(enPath);
    const alternates: HreflangAlternate[] = [
      ...LANGUAGES.map((lang) => ({
        lang,
        href: lang === 'en'
          ? `dashboards/${slug}.html`
          : `dashboards/${slug}_${lang}.html`,
      })).filter((alt) => fs.existsSync(path.join(ROOT_DIR, alt.href))),
      { lang: 'x-default', href: `dashboards/${slug}.html` },
    ];
    xml += generateUrlEntry(
      `dashboards/${slug}.html`, enLastmod, 'weekly', '0.75', alternates,
    );
    LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
      const langPath = path.join(ROOT_DIR, 'dashboards', `${slug}_${lang}.html`);
      if (!fs.existsSync(langPath)) return;
      const lastmod = getFileModTime(langPath);
      const priority = lang === 'sv' ? '0.7' : '0.6';
      xml += generateUrlEntry(
        `dashboards/${slug}_${lang}.html`, lastmod, 'weekly', priority,
      );
    });
  });

  const sitemapAlternates: HreflangAlternate[] = [
    ...LANGUAGES.map((lang) => ({
      lang,
      href: lang === 'en' ? 'sitemap.html' : `sitemap_${lang}.html`,
    })).filter((alt) => existsAtRoot(alt.href)),
    { lang: 'x-default', href: 'sitemap.html' },
  ];

  const sitemapEnMtime = getFileModTime(path.join(ROOT_DIR, 'sitemap.html'));
  xml += generateUrlEntry('sitemap.html', sitemapEnMtime, 'monthly', '0.6', sitemapAlternates);

  LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
    const file = `sitemap_${lang}.html`;
    if (!existsAtRoot(file)) return;
    const lastmod = getFileModTime(path.join(ROOT_DIR, file));
    const priority = lang === 'sv' ? '0.5' : '0.4';
    xml += generateUrlEntry(file, lastmod, 'monthly', priority);
  });

  const piAlternates = [
    ...LANGUAGES.map((lang) => ({
      lang: lang === 'no' ? 'nb' : lang,
      href: lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${lang}.html`,
    })).filter((alt) => existsAtRoot(alt.href)),
    { lang: 'x-default', href: 'political-intelligence.html' },
  ];
  if (existsAtRoot('political-intelligence.html')) {
    const piEnMtime = getFileModTime(path.join(ROOT_DIR, 'political-intelligence.html'));
    xml += generateUrlEntry('political-intelligence.html', piEnMtime, 'daily', '0.85', piAlternates);
  }

  for (const lang of LANGUAGES) {
    if (lang === 'en') continue;
    const file = `political-intelligence_${lang}.html`;
    if (!existsAtRoot(file)) continue;
    const lastmod = getFileModTime(path.join(ROOT_DIR, file));
    xml += generateUrlEntry(file, lastmod, 'daily', '0.7');
  }

  const newsIndexFileFor = (lang: Language): string =>
    lang === 'en' ? 'index.html' : `index_${lang}.html`;

  const newsLangFiles = LANGUAGES
    .map(newsIndexFileFor)
    .filter((file) => fs.existsSync(path.join(NEWS_DIR, file)));
  const newsIndexMtimes = newsLangFiles.map((file) => {
    try {
      return new Date(getFileModTime(path.join(NEWS_DIR, file)));
    } catch (_e: unknown) {
      return new Date(0);
    }
  });
  const newsIndexMaxMtime = newsIndexMtimes.length > 0
    ? new Date(Math.max(...newsIndexMtimes.map((d) => d.getTime()))).toISOString()
    : new Date(0).toISOString();

  const newsIndexAlternates: HreflangAlternate[] = [
    ...LANGUAGES
      .filter((lang) => fs.existsSync(path.join(NEWS_DIR, newsIndexFileFor(lang))))
      .map((lang) => ({
        lang,
        href: lang === 'en' ? 'news/' : `news/index_${lang}.html`,
      })),
    { lang: 'x-default', href: 'news/' },
  ];

  if (fs.existsSync(path.join(NEWS_DIR, 'index.html'))) {
    xml += generateUrlEntry('news/', newsIndexMaxMtime, 'daily', '0.9', newsIndexAlternates);
  }

  LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
    const file = newsIndexFileFor(lang);
    if (!fs.existsSync(path.join(NEWS_DIR, file))) return;
    const lastmod = getFileModTime(path.join(NEWS_DIR, file));
    const priority = lang === 'sv' ? '0.9' : '0.7';
    xml += generateUrlEntry(`news/${file}`, lastmod, 'daily', priority);
  });

  const articles = getNewsArticles();
  console.log(`  Processing ${articles.length} article groups...`);

  articles.forEach((article) => {
    const sortedLanguages = [...article.languages].sort((a, b) => {
      if (a === 'en') return -1;
      if (b === 'en') return 1;
      return a.localeCompare(b);
    });

    const pagesByLanguage = new Map(article.pages.map((page) => [page.lang, page.path]));
    const alternates: HreflangAlternate[] = sortedLanguages
      .map((altLang) => {
        const pagePath = pagesByLanguage.get(altLang);
        return pagePath ? { lang: altLang, href: `news/${pagePath}` } : null;
      })
      .filter((alternate): alternate is HreflangAlternate => alternate !== null);

    alternates.push({
      lang: 'x-default',
      href: `news/${pagesByLanguage.get(sortedLanguages[0]) ?? `${article.baseSlug}-${sortedLanguages[0]}.html`}`,
    });

    article.pages.forEach(({ path: pagePath }) => {
      const loc = `news/${pagePath}`;
      xml += generateUrlEntry(loc, article.lastmod, 'monthly', '0.8', alternates);
    });
  });

  const apiDocs = getApiDocs();
  if (apiDocs.length > 0) {
    console.log(`  Processing ${apiDocs.length} API documentation files...`);

    apiDocs.forEach((doc) => {
      const loc = `api/${doc.file}`;
      const priority = doc.file === 'index.html' ? '0.7' : '0.5';
      xml += generateUrlEntry(loc, doc.lastmod, 'weekly', priority);
    });
  }

  const docFiles = getDocFiles();
  if (docFiles.length > 0) {
    console.log(`  Processing ${docFiles.length} docs/ documentation files...`);

    docFiles.forEach((doc) => {
      const loc = `docs/${doc.file}`;
      const priority = doc.file === 'index.html' || doc.file.endsWith('/index.html') ? '0.4' : '0.3';
      xml += generateUrlEntry(loc, doc.lastmod, 'monthly', priority);
    });
  }

  const analysisFiles = getAnalysisFiles();
  if (analysisFiles.length > 0) {
    console.log(`  Processing ${analysisFiles.length} analysis HTML files...`);

    analysisFiles.forEach((analysisFile) => {
      xml += generateUrlEntry(`analysis/${analysisFile.file}`, analysisFile.lastmod, 'weekly', '0.3');
    });
  }

  xml += `
  
</urlset>`;

  return xml;
}
