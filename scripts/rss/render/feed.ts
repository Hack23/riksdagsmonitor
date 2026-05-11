/**
 * @module Infrastructure/Rss/Render/Feed
 * @category Intelligence Operations / Supporting Infrastructure
 * @name RSS 2.0 feed builder
 *
 * @description
 * Pure string builder for the full `rss.xml` document — channel header,
 * categories, image, atom:link self-reference, and one `<item>` per
 * article (with hreflang `atom:link` extensions for every alternate
 * language). The lastBuildDate / pubDate / copyright year are derived
 * from the most recent article so output is deterministic.
 *
 * Round-6 split: extracted from `scripts/generate-rss.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { getRssArticles } from '../scanner.js';
import { escapeXml } from '../escape.js';
import { hreflangCode } from '../hreflang.js';
import { getBySubfolder } from '../../render-lib/article-types.js';

const BASE_URL = 'https://riksdagsmonitor.com';

/**
 * Derive the article-type subfolder slug from a baseSlug like
 * `2026-04-23-propositions` → `propositions`.
 */
function subfolderFromBaseSlug(baseSlug: string): string | null {
  const m = baseSlug.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  return m ? m[1]! : null;
}

/**
 * Generate RSS 2.0 XML feed.
 */
export function generateRss(): string {
  console.log('🔨 Generating RSS feed...');

  const articles = getRssArticles();
  const now = new Date().toUTCString();

  const lastBuildDate = articles.length > 0
    ? new Date(articles[0]!.pubDate).toUTCString()
    : now;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Riksdagsmonitor - Swedish Parliament Intelligence</title>
    <link>${BASE_URL}</link>
    <description>Real-time monitoring, analysis, and intelligence from the Swedish Parliament (Riksdag) and Government. Covering legislative activity, voting patterns, coalition dynamics, and election forecasts.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${lastBuildDate}</pubDate>
    <ttl>60</ttl>
    <copyright>Copyright ${articles.length > 0 ? new Date(articles[0]!.pubDate).getUTCFullYear() : new Date(lastBuildDate).getUTCFullYear()} Hack23 AB. Licensed under Apache-2.0.</copyright>
    <managingEditor>info@hack23.com (Hack23 AB)</managingEditor>
    <webMaster>info@hack23.com (Hack23 AB)</webMaster>
    <generator>Riksdagsmonitor RSS Generator v1.0</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <image>
      <url>https://riksdagsmonitor.com/images/android-chrome-512x512.png</url>
      <title>Riksdagsmonitor</title>
      <link>${BASE_URL}</link>
      <width>144</width>
      <height>144</height>
      <description>Riksdagsmonitor - Swedish Parliament Intelligence Platform</description>
    </image>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>`;

  const channelCategories = [
    'Swedish Politics', 'Parliament', 'Riksdag', 'Political Intelligence',
    'Election Analysis', 'Legislative Monitoring',
  ];
  for (const cat of channelCategories) {
    xml += `
    <category>${escapeXml(cat)}</category>`;
  }

  for (const article of articles) {
    const subfolder = subfolderFromBaseSlug(article.baseSlug);
    const typeEntry = subfolder ? getBySubfolder(subfolder) : undefined;
    const categoryLabel = typeEntry
      ? `${typeEntry.icon} ${typeEntry.label}`
      : article.category;

    xml += `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(article.link)}</link>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${new Date(article.pubDate).toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXml(article.link)}</guid>
      <dc:creator>${escapeXml(article.author)}</dc:creator>
      <category>${escapeXml(categoryLabel)}</category>
      <atom:link href="${escapeXml(article.link)}" rel="alternate" type="text/html" hreflang="en"/>`;

    for (const alt of article.alternateLanguages) {
      xml += `
      <atom:link href="${escapeXml(alt.href)}" rel="alternate" type="text/html" hreflang="${hreflangCode(alt.lang)}"/>`;
    }

    xml += `
    </item>`;
  }

  xml += `
  </channel>
</rss>`;

  return xml;
}
