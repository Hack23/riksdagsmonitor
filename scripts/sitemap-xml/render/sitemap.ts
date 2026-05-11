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
import { getDocFiles } from '../scanners/docs.js';
import { generateUrlEntry, type HreflangAlternate } from './url-entry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const NEWS_DIR = path.join(ROOT_DIR, 'news');

const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

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
    })),
    { lang: 'x-default', href: 'index.html' },
  ];

  const indexMtime = getFileModTime(path.join(ROOT_DIR, 'index.html'));
  xml += generateUrlEntry('index.html', indexMtime, 'daily', '1.0', indexAlternates);

  LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
    const loc = `index_${lang}.html`;
    const lastmod = getFileModTime(path.join(ROOT_DIR, loc));
    const priority = lang === 'sv' ? '0.9' : '0.7';

    xml += generateUrlEntry(loc, lastmod, 'daily', priority);
  });

  const politicianDashboardMtime = getFileModTime(path.join(ROOT_DIR, 'politician-dashboard.html'));
  xml += generateUrlEntry('politician-dashboard.html', politicianDashboardMtime, 'weekly', '0.8');

  const rssPath = path.join(ROOT_DIR, 'rss.xml');
  if (fs.existsSync(rssPath)) {
    const rssMtime = getFileModTime(rssPath);
    xml += generateUrlEntry('rss.xml', rssMtime, 'daily', '0.5');
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
    { lang: 'en', href: 'sitemap.html' },
    { lang: 'sv', href: 'sitemap_sv.html' },
    { lang: 'da', href: 'sitemap_da.html' },
    { lang: 'no', href: 'sitemap_no.html' },
    { lang: 'fi', href: 'sitemap_fi.html' },
    { lang: 'de', href: 'sitemap_de.html' },
    { lang: 'fr', href: 'sitemap_fr.html' },
    { lang: 'es', href: 'sitemap_es.html' },
    { lang: 'nl', href: 'sitemap_nl.html' },
    { lang: 'ar', href: 'sitemap_ar.html' },
    { lang: 'he', href: 'sitemap_he.html' },
    { lang: 'ja', href: 'sitemap_ja.html' },
    { lang: 'ko', href: 'sitemap_ko.html' },
    { lang: 'zh', href: 'sitemap_zh.html' },
    { lang: 'x-default', href: 'sitemap.html' },
  ];

  const sitemapEnMtime = getFileModTime(path.join(ROOT_DIR, 'sitemap.html'));
  xml += generateUrlEntry('sitemap.html', sitemapEnMtime, 'monthly', '0.6', sitemapAlternates);

  const sitemapLangPages: Array<{ file: string; priority: string }> = [
    { file: 'sitemap_sv.html', priority: '0.5' },
    { file: 'sitemap_da.html', priority: '0.4' },
    { file: 'sitemap_no.html', priority: '0.4' },
    { file: 'sitemap_fi.html', priority: '0.4' },
    { file: 'sitemap_de.html', priority: '0.4' },
    { file: 'sitemap_fr.html', priority: '0.4' },
    { file: 'sitemap_es.html', priority: '0.4' },
    { file: 'sitemap_nl.html', priority: '0.4' },
    { file: 'sitemap_ar.html', priority: '0.4' },
    { file: 'sitemap_he.html', priority: '0.4' },
    { file: 'sitemap_ja.html', priority: '0.4' },
    { file: 'sitemap_ko.html', priority: '0.4' },
    { file: 'sitemap_zh.html', priority: '0.4' },
  ];

  sitemapLangPages.forEach(({ file, priority }) => {
    const lastmod = getFileModTime(path.join(ROOT_DIR, file));
    xml += generateUrlEntry(file, lastmod, 'monthly', priority);
  });

  const piAlternates = [
    ...LANGUAGES.map((lang) => ({
      lang: lang === 'no' ? 'nb' : lang,
      href: lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${lang}.html`,
    })),
    { lang: 'x-default', href: 'political-intelligence.html' },
  ];
  const piEnMtime = getFileModTime(path.join(ROOT_DIR, 'political-intelligence.html'));
  xml += generateUrlEntry('political-intelligence.html', piEnMtime, 'daily', '0.85', piAlternates);

  for (const lang of LANGUAGES) {
    if (lang === 'en') continue;
    const file = `political-intelligence_${lang}.html`;
    const lastmod = getFileModTime(path.join(ROOT_DIR, file));
    xml += generateUrlEntry(file, lastmod, 'daily', '0.7');
  }

  const newsLangFiles = [
    'index.html', 'index_sv.html', 'index_da.html', 'index_no.html', 'index_fi.html',
    'index_de.html', 'index_fr.html', 'index_es.html', 'index_nl.html', 'index_ar.html', 'index_he.html',
  ];
  const newsIndexMtimes = newsLangFiles.map((file) => {
    try {
      return new Date(getFileModTime(path.join(NEWS_DIR, file)));
    } catch (_e: unknown) {
      return new Date(0);
    }
  });
  const newsIndexMaxMtime = new Date(Math.max(...newsIndexMtimes.map((d) => d.getTime()))).toISOString();

  const newsIndexAlternates: HreflangAlternate[] = [
    { lang: 'en', href: 'news/' },
    { lang: 'sv', href: 'news/index_sv.html' },
    { lang: 'da', href: 'news/index_da.html' },
    { lang: 'no', href: 'news/index_no.html' },
    { lang: 'fi', href: 'news/index_fi.html' },
    { lang: 'de', href: 'news/index_de.html' },
    { lang: 'fr', href: 'news/index_fr.html' },
    { lang: 'es', href: 'news/index_es.html' },
    { lang: 'nl', href: 'news/index_nl.html' },
    { lang: 'ar', href: 'news/index_ar.html' },
    { lang: 'he', href: 'news/index_he.html' },
    { lang: 'x-default', href: 'news/' },
  ];

  xml += generateUrlEntry('news/', newsIndexMaxMtime, 'daily', '0.9', newsIndexAlternates);

  const newsLanguagePages: Array<{ file: string; priority: string }> = [
    { file: 'index_sv.html', priority: '0.9' },
    { file: 'index_da.html', priority: '0.7' },
    { file: 'index_no.html', priority: '0.7' },
    { file: 'index_fi.html', priority: '0.7' },
    { file: 'index_de.html', priority: '0.7' },
    { file: 'index_fr.html', priority: '0.7' },
    { file: 'index_es.html', priority: '0.7' },
    { file: 'index_nl.html', priority: '0.7' },
    { file: 'index_ar.html', priority: '0.7' },
    { file: 'index_he.html', priority: '0.7' },
  ];

  newsLanguagePages.forEach(({ file, priority }) => {
    try {
      const lastmod = getFileModTime(path.join(NEWS_DIR, file));
      xml += generateUrlEntry(`news/${file}`, lastmod, 'daily', priority);
    } catch (_e: unknown) {
      // File doesn't exist yet, skip
    }
  });

  const articles = getNewsArticles();
  console.log(`  Processing ${articles.length} article groups...`);

  articles.forEach((article) => {
    const sortedLanguages = [...article.languages].sort((a, b) => {
      if (a === 'en') return -1;
      if (b === 'en') return 1;
      return a.localeCompare(b);
    });

    const alternates: HreflangAlternate[] = sortedLanguages.map((altLang) => ({
      lang: altLang,
      href: `news/${article.baseSlug}-${altLang}.html`,
    }));

    alternates.push({
      lang: 'x-default',
      href: `news/${article.baseSlug}-${sortedLanguages[0]}.html`,
    });

    sortedLanguages.forEach((lang) => {
      const loc = `news/${article.baseSlug}-${lang}.html`;
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

  xml += `
  
</urlset>`;

  return xml;
}
