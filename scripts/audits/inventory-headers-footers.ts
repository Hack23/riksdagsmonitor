/**
 * Headers & footers inventory auditor.
 *
 * Scans every tracked HTML page in the repository, parses the site-wide
 * header (`.rm-site-header`, legacy `.site-header`) and footer
 * (`.rm-site-footer`, legacy `.site-footer`) blocks, extracts every link and
 * image, classifies each page by category and language, and writes a
 * markdown report at `analysis/audits/headers-footers-inventory.md`.
 *
 * The inventory is intentionally derived from the rendered HTML so that the
 * report reflects what users see, not just what `chrome.ts` would generate.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from '../types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const REPORT_PATH = path.join(ROOT_DIR, 'analysis', 'audits', 'headers-footers-inventory.md');

const LANGUAGES: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];
const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English', sv: 'Svenska', da: 'Dansk', no: 'Norsk', fi: 'Suomi',
  de: 'Deutsch', fr: 'Français', es: 'Español', nl: 'Nederlands',
  ar: 'العربية', he: 'עברית', ja: '日本語', ko: '한국어', zh: '中文',
};

interface ExtractedLink {
  readonly text: string;
  readonly href: string;
}

interface ExtractedImage {
  readonly src: string;
  readonly alt: string;
}

interface BlockInventory {
  readonly present: boolean;
  readonly className: string | null;
  readonly links: ExtractedLink[];
  readonly images: ExtractedImage[];
}

interface PageInventory {
  readonly relativePath: string;
  readonly category: string;
  readonly language: Language;
  readonly header: BlockInventory;
  readonly footer: BlockInventory;
}

const HEADER_PATTERN = /<header\b[^>]*>([\s\S]*?)<\/header>/i;
const FOOTER_PATTERN = /<footer\b[^>]*>([\s\S]*?)<\/footer>/i;
const PRIMARY_NAV_PATTERN = /<nav\b[^>]*class="[^"]*\bsite-header-nav\b[^"]*"[^>]*>([\s\S]*?)<\/nav>/i;
const LINK_PATTERN = /<a\b[^>]*\bhref="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
const IMG_PATTERN = /<img\b[^>]*\bsrc="([^"]+)"[^>]*?(?:\balt="([^"]*)")?[^>]*>/gi;

function detectLanguage(file: string): Language {
  const base = path.basename(file).toLowerCase();
  const dashMatch = base.match(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
  if (dashMatch) return dashMatch[1] as Language;
  const underscoreMatch = base.match(/_(sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
  if (underscoreMatch) return underscoreMatch[1] as Language;
  return 'en';
}

function classifyPage(rel: string): string {
  const norm = rel.replace(/\\/g, '/');
  if (/^news\/\d{4}-\d{2}(-\d{2})?-/.test(norm)) {
    if (/-(propositions|government-propositions)/.test(norm)) return 'news/article (propositions)';
    if (/-(committee-?reports?)/.test(norm)) return 'news/article (committee reports)';
    if (/-(motions|opposition-motions)/.test(norm)) return 'news/article (motions)';
    if (/-interpellations/.test(norm)) return 'news/article (interpellations)';
    if (/-evening-analysis/.test(norm)) return 'news/article (evening analysis)';
    if (/-week-ahead/.test(norm)) return 'news/article (week ahead)';
    if (/-month-ahead/.test(norm)) return 'news/article (month ahead)';
    if (/-weekly-review/.test(norm)) return 'news/article (weekly review)';
    if (/-monthly-review/.test(norm)) return 'news/article (monthly review)';
    if (/-deep-inspection/.test(norm)) return 'news/article (deep inspection)';
    if (/-realtime/.test(norm)) return 'news/article (realtime)';
    if (/-parliament-agenda/.test(norm)) return 'news/article (parliament agenda)';
    return 'news/article (other)';
  }
  if (/^news\/index(_\w+)?\.html$/.test(norm)) return 'news index';
  if (/^news\/categories\//.test(norm)) return 'news category index';
  if (/^news\/tags\//.test(norm)) return 'news tag index';
  if (/^news\//.test(norm)) return 'news support page';
  if (/^dashboard\/index(_\w+)?\.html$/.test(norm)) return 'dashboard';
  if (/^dashboard\//.test(norm)) return 'dashboard sub-page';
  if (/^index(_\w+)?\.html$/.test(norm)) return 'home';
  if (/^political-intelligence(_\w+)?\.html$/.test(norm)) return 'political intelligence';
  if (/^politician-dashboard(_\w+)?\.html$/.test(norm)) return 'politician dashboard';
  if (/^sitemap(_\w+)?\.html$/.test(norm)) return 'sitemap';
  if (/^docs\//.test(norm)) return 'docs';
  if (/^builds\//.test(norm)) return 'build artifact';
  return 'other';
}

function stripHtml(snippet: string): string {
  return snippet
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBlock(html: string, pattern: RegExp): BlockInventory {
  const match = html.match(pattern);
  if (!match) {
    return { present: false, className: null, links: [], images: [] };
  }
  const fullMatch = match[0];
  const inner = match[1] ?? '';
  const classMatch = fullMatch.match(/class="([^"]+)"/i);
  const links: ExtractedLink[] = [];
  for (const linkMatch of inner.matchAll(LINK_PATTERN)) {
    const href = linkMatch[1];
    const text = stripHtml(linkMatch[2]);
    links.push({ href, text: text || '(no text)' });
  }
  const images: ExtractedImage[] = [];
  for (const imgMatch of inner.matchAll(IMG_PATTERN)) {
    images.push({ src: imgMatch[1], alt: imgMatch[2] ?? '' });
  }
  return { present: true, className: classMatch?.[1] ?? null, links, images };
}

function extractHeaderBlock(html: string): BlockInventory {
  const headerBlock = extractBlock(html, HEADER_PATTERN);
  const primaryNav = extractBlock(html, PRIMARY_NAV_PATTERN);
  if (!primaryNav.present) return headerBlock;
  if (!headerBlock.present) {
    return {
      present: true,
      className: primaryNav.className ? `(nav) ${primaryNav.className}` : '(nav)',
      links: primaryNav.links,
      images: primaryNav.images,
    };
  }
  const headerLinkHrefs = new Set(headerBlock.links.map((l) => l.href));
  const merged: ExtractedLink[] = [...headerBlock.links];
  for (const link of primaryNav.links) {
    if (!headerLinkHrefs.has(link.href)) merged.push(link);
  }
  const headerImgSrcs = new Set(headerBlock.images.map((i) => i.src));
  const mergedImgs: ExtractedImage[] = [...headerBlock.images];
  for (const img of primaryNav.images) {
    if (!headerImgSrcs.has(img.src)) mergedImgs.push(img);
  }
  return {
    present: true,
    className: headerBlock.className,
    links: merged,
    images: mergedImgs,
  };
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (['node_modules', 'builds', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield full;
    }
  }
}

function dedupe<T extends { href?: string; src?: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = item.href ?? item.src ?? JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function summarizeLinks(links: readonly ExtractedLink[]): string {
  if (!links.length) return '_no links_';
  return dedupe(links)
    .map(({ text, href }) => `${text} → \`${href}\``)
    .map((line) => `- ${line}`)
    .join('\n');
}

function summarizeImages(images: readonly ExtractedImage[]): string {
  if (!images.length) return '_no images_';
  return dedupe(images)
    .map(({ src, alt }) => `\`${src}\`${alt ? ` _alt:_ "${alt}"` : ' _alt:_ (empty)'}`)
    .map((line) => `- ${line}`)
    .join('\n');
}

interface CategoryGroup {
  readonly category: string;
  /** First sample of header per language. */
  readonly headerByLanguage: Map<Language, BlockInventory>;
  /** First sample of footer per language. */
  readonly footerByLanguage: Map<Language, BlockInventory>;
  readonly languageCount: Map<Language, number>;
  /** Sample relative paths per language for traceability. */
  readonly samplePathByLanguage: Map<Language, string>;
  totalPages: number;
}

function main(): void {
  const pages: PageInventory[] = [];
  for (const absolute of walk(ROOT_DIR)) {
    const rel = path.relative(ROOT_DIR, absolute).replace(/\\/g, '/');
    if (rel.startsWith('analysis/') && !rel.includes('/audits/')) continue;
    const html = fs.readFileSync(absolute, 'utf8');
    const language = detectLanguage(rel);
    const category = classifyPage(rel);
    const header = extractHeaderBlock(html);
    const footer = extractBlock(html, FOOTER_PATTERN);
    pages.push({ relativePath: rel, category, language, header, footer });
  }
  const groups = new Map<string, CategoryGroup>();
  for (const page of pages) {
    let group = groups.get(page.category);
    if (!group) {
      group = {
        category: page.category,
        headerByLanguage: new Map(),
        footerByLanguage: new Map(),
        languageCount: new Map(),
        samplePathByLanguage: new Map(),
        totalPages: 0,
      };
      groups.set(page.category, group);
    }
    group.totalPages += 1;
    group.languageCount.set(page.language, (group.languageCount.get(page.language) ?? 0) + 1);
    if (!group.samplePathByLanguage.has(page.language)) {
      group.samplePathByLanguage.set(page.language, page.relativePath);
    }
    if (page.header.present && !group.headerByLanguage.has(page.language)) {
      group.headerByLanguage.set(page.language, page.header);
    }
    if (page.footer.present && !group.footerByLanguage.has(page.language)) {
      group.footerByLanguage.set(page.language, page.footer);
    }
  }

  const sortedCategories = [...groups.keys()].sort();

  const lines: string[] = [];
  lines.push('# Headers & Footers Inventory');
  lines.push('');
  lines.push('> Auto-generated by `scripts/audits/inventory-headers-footers.ts`. Re-run with `npx tsx scripts/audits/inventory-headers-footers.ts`.');
  lines.push('');
  lines.push(`Scanned **${pages.length}** HTML pages across **${sortedCategories.length}** page categories and the 14 supported languages.`);
  lines.push('');
  lines.push('## Languages covered');
  lines.push('');
  lines.push('| Code | Language | Pages |');
  lines.push('|------|----------|------:|');
  for (const lang of LANGUAGES) {
    const total = pages.filter((p) => p.language === lang).length;
    lines.push(`| \`${lang}\` | ${LANGUAGE_NAMES[lang]} | ${total} |`);
  }
  lines.push('');
  lines.push('## Per-category coverage');
  lines.push('');
  lines.push('| Category | Pages | Languages with header | Languages with footer | Per-language counts |');
  lines.push('|----------|------:|----------------------:|----------------------:|---------------------|');
  for (const category of sortedCategories) {
    const group = groups.get(category)!;
    const counts = LANGUAGES
      .filter((l) => (group.languageCount.get(l) ?? 0) > 0)
      .map((l) => `${l}(${group.languageCount.get(l)})`)
      .join(', ');
    lines.push(
      `| ${category} | ${group.totalPages} | ${group.headerByLanguage.size} | ${group.footerByLanguage.size} | ${counts} |`,
    );
  }
  lines.push('');

  for (const category of sortedCategories) {
    const group = groups.get(category)!;
    lines.push(`## ${category}`);
    lines.push('');
    lines.push(`- Pages: **${group.totalPages}**`);
    lines.push(`- Languages with rendered header: **${group.headerByLanguage.size} / 14**`);
    lines.push(`- Languages with rendered footer: **${group.footerByLanguage.size} / 14**`);
    lines.push('');

    for (const lang of LANGUAGES) {
      const sample = group.samplePathByLanguage.get(lang);
      if (!sample) continue;
      lines.push(`### ${category} — \`${lang}\` (${LANGUAGE_NAMES[lang]})`);
      lines.push('');
      lines.push(`- Sample page: \`${sample}\``);
      const header = group.headerByLanguage.get(lang);
      const footer = group.footerByLanguage.get(lang);
      lines.push('');
      lines.push('**Header**');
      lines.push('');
      if (!header) {
        lines.push('_no `<header>` element detected_');
      } else {
        lines.push(`Wrapper class: \`${header.className ?? '(none)'}\``);
        lines.push('');
        lines.push('Links:');
        lines.push('');
        lines.push(summarizeLinks(header.links));
        lines.push('');
        lines.push('Images:');
        lines.push('');
        lines.push(summarizeImages(header.images));
      }
      lines.push('');
      lines.push('**Footer**');
      lines.push('');
      if (!footer) {
        lines.push('_no `<footer>` element detected_');
      } else {
        lines.push(`Wrapper class: \`${footer.className ?? '(none)'}\``);
        lines.push('');
        lines.push('Links:');
        lines.push('');
        lines.push(summarizeLinks(footer.links));
        lines.push('');
        lines.push('Images:');
        lines.push('');
        lines.push(summarizeImages(footer.images));
      }
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  const lang14 = new Set<string>(LANGUAGES);
  lines.push('## Language coverage gaps (per category)');
  lines.push('');
  lines.push('Pages in each category that are **missing** one of the 14 supported languages.');
  lines.push('');
  lines.push('| Category | Missing languages |');
  lines.push('|----------|-------------------|');
  for (const category of sortedCategories) {
    const group = groups.get(category)!;
    const present = new Set<Language>([...group.languageCount.keys()]);
    const missing = [...lang14].filter((l) => !present.has(l as Language));
    if (missing.length === 0) continue;
    lines.push(`| ${category} | ${missing.map((l) => `\`${l}\``).join(', ')} |`);
  }
  lines.push('');

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
  console.log(`Wrote inventory: ${path.relative(ROOT_DIR, REPORT_PATH)} (${pages.length} pages)`);
}

main();
