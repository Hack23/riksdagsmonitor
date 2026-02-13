#!/usr/bin/env node

/**
 * Backport News Generation Script
 * 
 * Generates historical news articles for 2026 by querying riksdag-regering-mcp
 * with past date ranges. Creates weekly and daily articles for dates that
 * don't already have coverage.
 * 
 * Usage:
 *   node scripts/generate-news-backport.js --from=2026-01-01 --to=2026-02-10
 *   node scripts/generate-news-backport.js --from=2026-01-01 --to=2026-02-10 --types=week-ahead
 *   node scripts/generate-news-backport.js --from=2026-01-01 --to=2026-02-10 --languages=all --dry-run
 *   node scripts/generate-news-backport.js --from=2026-01-01 --to=2026-02-10 --mode=weekly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from './mcp-client.js';
import {
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources
} from './data-transformers.js';
import { generateArticleHTML } from './article-template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── CLI Arguments ───

const args = process.argv.slice(2);

function getArg(name, defaultValue = '') {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : defaultValue;
}

const fromDate = getArg('from', '2026-01-05'); // First Monday of 2026
const toDate = getArg('to', new Date().toISOString().split('T')[0]);
const mode = getArg('mode', 'weekly'); // 'daily' or 'weekly'
const typesInput = getArg('types', 'week-ahead,committee-reports,propositions,motions');
const dryRun = args.includes('--dry-run');
const delayMs = parseInt(getArg('delay', '2000'), 10); // ms between MCP calls

// Language support
const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
const LANGUAGE_PRESETS = {
  all: ALL_LANGUAGES,
  nordic: ['en', 'sv', 'da', 'no', 'fi'],
  'eu-core': ['en', 'sv', 'de', 'fr', 'es', 'nl']
};

let langInput = getArg('languages', 'en,sv');
if (LANGUAGE_PRESETS[langInput]) {
  langInput = LANGUAGE_PRESETS[langInput].join(',');
}
const languages = langInput.split(',').filter(l => ALL_LANGUAGES.includes(l.trim()));

const articleTypes = typesInput.split(',').filter(Boolean);
const NEWS_DIR = path.join(__dirname, '..', 'news');

// Ensure directory exists
if (!fs.existsSync(NEWS_DIR)) {
  fs.mkdirSync(NEWS_DIR, { recursive: true });
}

// ─── Date Helpers ───

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getMondaysInRange(from, to) {
  const mondays = [];
  let current = new Date(from);
  // Advance to next Monday if not already Monday
  const dayOfWeek = current.getDay();
  if (dayOfWeek !== 1) {
    current = addDays(current, (8 - dayOfWeek) % 7);
  }
  const end = new Date(to);
  while (current <= end) {
    mondays.push(new Date(current));
    current = addDays(current, 7);
  }
  return mondays;
}

function getDaysInRange(from, to) {
  const days = [];
  let current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    // Skip weekends for daily mode (Riksdag doesn't meet weekends)
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(current));
    }
    current = addDays(current, 1);
  }
  return days;
}

function articleExists(slug, lang) {
  const filename = `${slug}-${lang}.html`;
  return fs.existsSync(path.join(NEWS_DIR, filename));
}

// ─── Rate Limiter ───

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Title Maps ───

const WEEK_AHEAD_TITLES = {
  en: (from, to) => ({ title: `Week Ahead: ${from} to ${to}`, subtitle: 'Prospective coverage of upcoming parliamentary activity' }),
  sv: (from, to) => ({ title: `Veckan framåt: ${from} till ${to}`, subtitle: 'Översikt av kommande parlamentarisk verksamhet' }),
  da: (from, to) => ({ title: `Ugen forude: ${from} til ${to}`, subtitle: 'Oversigt over kommende parlamentarisk aktivitet' }),
  no: (from, to) => ({ title: `Uken fremover: ${from} til ${to}`, subtitle: 'Oversikt over kommende parlamentarisk aktivitet' }),
  fi: (from, to) => ({ title: `Tuleva viikko: ${from}–${to}`, subtitle: 'Katsaus tulevaan parlamentaariseen toimintaan' }),
  de: (from, to) => ({ title: `Woche voraus: ${from} bis ${to}`, subtitle: 'Vorschau auf die parlamentarische Aktivität' }),
  fr: (from, to) => ({ title: `Semaine à venir : ${from} au ${to}`, subtitle: "Aperçu de l'activité parlementaire à venir" }),
  es: (from, to) => ({ title: `Semana por delante: ${from} al ${to}`, subtitle: 'Perspectiva de la actividad parlamentaria próxima' }),
  nl: (from, to) => ({ title: `Week vooruit: ${from} tot ${to}`, subtitle: 'Vooruitblik op parlementaire activiteit' }),
  ar: (from, to) => ({ title: `الأسبوع القادم: ${from} إلى ${to}`, subtitle: 'نظرة مسبقة على النشاط البرلماني القادم' }),
  he: (from, to) => ({ title: `השבוע הקרוב: ${from} עד ${to}`, subtitle: 'סקירה מקדימה של הפעילות הפרלמנטרית' }),
  ja: (from, to) => ({ title: `今週の展望：${from}〜${to}`, subtitle: '今後の議会活動の予測報道' }),
  ko: (from, to) => ({ title: `주간 전망: ${from}~${to}`, subtitle: '향후 의회 활동 전망' }),
  zh: (from, to) => ({ title: `本周展望：${from}至${to}`, subtitle: '即将到来的议会活动前瞻' })
};

const COMMITTEE_TITLES = {
  en: (n) => ({ title: `Committee Reports Analysis`, subtitle: `Analysis of ${n} committee reports` }),
  sv: (n) => ({ title: `Utskottsbetänkanden`, subtitle: `Analys av ${n} utskottsbetänkanden` }),
  da: (n) => ({ title: `Udvalgsrapporter`, subtitle: `Analyse af ${n} udvalgsrapporter` }),
  no: (n) => ({ title: `Komitérapporter`, subtitle: `Analyse av ${n} komitérapporter` }),
  fi: (n) => ({ title: `Valiokunnan mietinnöt`, subtitle: `${n} valiokunnan mietinnön analyysi` }),
  de: (n) => ({ title: `Ausschussberichte`, subtitle: `Analyse von ${n} Ausschussberichten` }),
  fr: (n) => ({ title: `Rapports de commission`, subtitle: `Analyse de ${n} rapports de commission` }),
  es: (n) => ({ title: `Informes de comisión`, subtitle: `Análisis de ${n} informes de comisión` }),
  nl: (n) => ({ title: `Commissierapporten`, subtitle: `Analyse van ${n} commissierapporten` }),
  ar: (n) => ({ title: `تقارير اللجان`, subtitle: `تحليل ${n} تقارير لجان` }),
  he: (n) => ({ title: `דוחות ועדות`, subtitle: `ניתוח ${n} דוחות ועדות` }),
  ja: (n) => ({ title: `委員会報告`, subtitle: `${n}件の委員会報告の分析` }),
  ko: (n) => ({ title: `위원회 보고서`, subtitle: `${n}개 위원회 보고서 분석` }),
  zh: (n) => ({ title: `委员会报告`, subtitle: `${n}份委员会报告分析` })
};

const PROPOSITION_TITLES = {
  en: (n) => ({ title: `Government Propositions`, subtitle: `Analysis of ${n} government propositions` }),
  sv: (n) => ({ title: `Regeringens propositioner`, subtitle: `Analys av ${n} propositioner` }),
  da: (n) => ({ title: `Regeringsforslag`, subtitle: `Analyse af ${n} regeringsforslag` }),
  no: (n) => ({ title: `Regjeringens proposisjoner`, subtitle: `Analyse av ${n} proposisjoner` }),
  fi: (n) => ({ title: `Hallituksen esitykset`, subtitle: `${n} hallituksen esityksen analyysi` }),
  de: (n) => ({ title: `Regierungsvorlagen`, subtitle: `Analyse von ${n} Regierungsvorlagen` }),
  fr: (n) => ({ title: `Propositions gouvernementales`, subtitle: `Analyse de ${n} propositions` }),
  es: (n) => ({ title: `Proposiciones gubernamentales`, subtitle: `Análisis de ${n} proposiciones` }),
  nl: (n) => ({ title: `Regeringsvoorstellen`, subtitle: `Analyse van ${n} voorstellen` }),
  ar: (n) => ({ title: `مقترحات حكومية`, subtitle: `تحليل ${n} مقترحات حكومية` }),
  he: (n) => ({ title: `הצעות ממשלתיות`, subtitle: `ניתוח ${n} הצעות ממשלתיות` }),
  ja: (n) => ({ title: `政府提案`, subtitle: `${n}件の政府提案の分析` }),
  ko: (n) => ({ title: `정부 제안`, subtitle: `${n}개 정부 제안 분석` }),
  zh: (n) => ({ title: `政府提案`, subtitle: `${n}份政府提案分析` })
};

const MOTION_TITLES = {
  en: (n) => ({ title: `Opposition Motions`, subtitle: `Analysis of ${n} opposition motions` }),
  sv: (n) => ({ title: `Oppositionsmotioner`, subtitle: `Analys av ${n} motioner` }),
  da: (n) => ({ title: `Oppositionsforslag`, subtitle: `Analyse af ${n} forslag` }),
  no: (n) => ({ title: `Opposisjonsforslag`, subtitle: `Analyse av ${n} forslag` }),
  fi: (n) => ({ title: `Opposition aloitteet`, subtitle: `${n} aloitteen analyysi` }),
  de: (n) => ({ title: `Oppositionsanträge`, subtitle: `Analyse von ${n} Anträgen` }),
  fr: (n) => ({ title: `Motions d'opposition`, subtitle: `Analyse de ${n} motions` }),
  es: (n) => ({ title: `Mociones de oposición`, subtitle: `Análisis de ${n} mociones` }),
  nl: (n) => ({ title: `Oppositiemoties`, subtitle: `Analyse van ${n} moties` }),
  ar: (n) => ({ title: `اقتراحات المعارضة`, subtitle: `تحليل ${n} اقتراحات` }),
  he: (n) => ({ title: `הצעות אופוזיציה`, subtitle: `ניתוח ${n} הצעות` }),
  ja: (n) => ({ title: `野党動議`, subtitle: `${n}件の動議分析` }),
  ko: (n) => ({ title: `야당 동의`, subtitle: `${n}개 동의 분석` }),
  zh: (n) => ({ title: `反对党动议`, subtitle: `${n}份动议分析` })
};

// ─── Article Generator ───

async function generateForDate(targetDate, type, client) {
  const dateStr = formatDate(targetDate);
  const weekEnd = formatDate(addDays(targetDate, 6));
  let slug, titleMap, data, dataKey, toolName;

  switch (type) {
    case 'week-ahead': {
      slug = `${dateStr}-week-ahead`;
      titleMap = WEEK_AHEAD_TITLES;
      console.log(`    📆 Fetching calendar ${dateStr} → ${weekEnd}...`);
      const events = await client.fetchCalendarEvents(dateStr, weekEnd, 100);
      data = { events };
      dataKey = 'week-ahead';
      toolName = 'get_calendar_events';
      break;
    }
    case 'committee-reports': {
      slug = `${dateStr}-committee-reports`;
      titleMap = COMMITTEE_TITLES;
      console.log(`    📋 Fetching committee reports near ${dateStr}...`);
      const reports = await client.fetchCommitteeReports(15);
      data = { reports };
      dataKey = 'committee-reports';
      toolName = 'get_betankanden';
      break;
    }
    case 'propositions': {
      slug = `${dateStr}-government-propositions`;
      titleMap = PROPOSITION_TITLES;
      console.log(`    📜 Fetching propositions near ${dateStr}...`);
      const propositions = await client.fetchPropositions(10);
      data = { propositions };
      dataKey = 'propositions';
      toolName = 'get_propositioner';
      break;
    }
    case 'motions': {
      slug = `${dateStr}-opposition-motions`;
      titleMap = MOTION_TITLES;
      console.log(`    📝 Fetching motions near ${dateStr}...`);
      const motions = await client.fetchMotions(10);
      data = { motions };
      dataKey = 'motions';
      toolName = 'get_motioner';
      break;
    }
    default:
      console.log(`    ⚠️ Unknown type: ${type}, skipping`);
      return 0;
  }

  // Check if articles already exist for this slug
  const existingLangs = languages.filter(l => articleExists(slug, l));
  if (existingLangs.length === languages.length) {
    console.log(`    ⏭️  All ${languages.length} language versions already exist for ${slug}`);
    return 0;
  }

  const missingLangs = languages.filter(l => !articleExists(slug, l));
  console.log(`    🌐 Generating ${missingLangs.length} missing language versions...`);

  let generated = 0;
  for (const lang of missingLangs) {
    try {
      const content = generateArticleContent(data, dataKey, lang);
      const watchPoints = extractWatchPoints(data, lang);
      const metadata = generateMetadata(data, dataKey, lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources([toolName]);

      // Get titles
      const dataItems = Object.values(data)[0] || [];
      const count = Array.isArray(dataItems) ? dataItems.length : 0;
      const titleFn = (titleMap[lang] || titleMap.en);
      const titles = type === 'week-ahead'
        ? titleFn(dateStr, weekEnd)
        : titleFn(count);

      const html = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: dateStr,
        type: type === 'week-ahead' ? 'prospective' : 'analysis',
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      if (dryRun) {
        console.log(`      [DRY RUN] Would write: ${slug}-${lang}.html`);
      } else {
        const filepath = path.join(NEWS_DIR, `${slug}-${lang}.html`);
        fs.writeFileSync(filepath, html, 'utf-8');
        console.log(`      ✅ ${slug}-${lang}.html`);
      }
      generated++;
    } catch (err) {
      console.error(`      ❌ ${lang}: ${err.message}`);
    }
  }

  return generated;
}

// ─── Main ───

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📰 Riksdagsmonitor News Backport Generator');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  From:       ${fromDate}`);
  console.log(`  To:         ${toDate}`);
  console.log(`  Mode:       ${mode}`);
  console.log(`  Types:      ${articleTypes.join(', ')}`);
  console.log(`  Languages:  ${languages.join(', ')}`);
  console.log(`  Dry run:    ${dryRun ? 'Yes' : 'No'}`);
  console.log(`  Delay:      ${delayMs}ms between MCP calls`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  const dates = mode === 'weekly'
    ? getMondaysInRange(fromDate, toDate)
    : getDaysInRange(fromDate, toDate);

  console.log(`📅 ${dates.length} ${mode === 'weekly' ? 'weeks' : 'days'} to process\n`);

  const client = new MCPClient();
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const date of dates) {
    const dateStr = formatDate(date);
    console.log(`\n📆 Processing ${dateStr}...`);

    for (const type of articleTypes) {
      console.log(`  📰 Type: ${type}`);
      try {
        const count = await generateForDate(date, type, client);
        totalGenerated += count;
        if (count === 0) totalSkipped++;
        // Rate limit between MCP calls
        await delay(delayMs);
      } catch (err) {
        console.error(`  ❌ Error for ${type} on ${dateStr}: ${err.message}`);
        totalErrors++;
        // Continue with next type/date
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📊 Backport Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Dates processed:  ${dates.length}`);
  console.log(`  Articles created: ${totalGenerated}`);
  console.log(`  Skipped (exist):  ${totalSkipped}`);
  console.log(`  Errors:           ${totalErrors}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (!dryRun && totalGenerated > 0) {
    console.log('💡 Run the following to update indexes:');
    console.log('   node scripts/generate-news-indexes.js');
    console.log('   node scripts/generate-sitemap.js');
  }

  // Exit with error code if there were failures
  if (totalErrors > 0 && totalGenerated === 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
