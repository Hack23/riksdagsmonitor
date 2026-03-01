/**
 * @module news-types/weekly-review/generator
 * @description Main generateWeeklyReview function and title generation helper.
 * Orchestrates the full data pipeline from MCP API calls to final HTML output.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { MCPClient } from '../../mcp-client.js';
import {
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  type RawDocument,
  type CIAContext,
} from '../../data-transformers.js';
import { generateArticleHTML } from '../../article-template.js';
import type { Language } from '../../types/language.js';
import type { ArticleCategory, GeneratedArticle, GenerationResult, MCPCallRecord } from '../../types/article.js';
import { getCurrentRiksmote } from '../motions.js';
import type { GenerationOptions, TitleSet, VotingRecord } from './types.js';
import { REQUIRED_TOOLS } from './types.js';
import { loadCIAContext, enrichWithFullText, attachSpeechesToDocuments, formatDateForSlug } from './data-loader.js';
import {
  analyzeCoalitionStress,
  calculateWeeklyActivityMetrics,
  generateCoalitionDynamicsSection,
  generateWeeklyActivitySection,
} from './analysis.js';

export async function generateWeeklyReview(options: GenerationOptions = {}): Promise<GenerationResult> {
  const { languages = ['en', 'sv'], lookbackDays = 7, writeArticle = null } = options;

  console.log('📊 Generating Weekly Review article (full-document analysis pipeline)...');

  const mcpCalls: MCPCallRecord[] = [];

  try {
    const client = new MCPClient();

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - lookbackDays);

    const fromStr = formatDateForSlug(startDate);
    const toStr = formatDateForSlug(today);

    console.log(`  🔄 Step 1 — Searching documents ${fromStr} → ${toStr}...`);

    // ── Step 1: search_dokument to discover IDs and types ──────────────────
    const allDocs = await client.searchDocuments({
      from_date: fromStr,
      to_date: toStr,
      limit: 200,
    });

    mcpCalls.push({ tool: 'search_dokument', result: allDocs });

    const filterRecent = (docs: unknown[]): RawDocument[] =>
      (docs as RawDocument[]).filter(d => {
        const date = (d as Record<string, string>).datum ?? (d as Record<string, string>).publicerad ?? '';
        return date >= fromStr && date <= toStr;
      });

    // ── Step 2: type-specific fetchers for richer metadata (non-fatal) ─────
    console.log('  🔄 Step 2 — Fetching typed metadata (reports, propositions, motions)...');
    const rm = getCurrentRiksmote(today);
    const [reports, propositions, motions] = await Promise.all([
      Promise.resolve()
        .then(() => client.fetchCommitteeReports(50, rm) as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch committee reports:', err); return [] as unknown[]; }),
      Promise.resolve()
        .then(() => client.fetchPropositions(50, rm) as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch propositions:', err); return [] as unknown[]; }),
      Promise.resolve()
        .then(() => client.fetchMotions(50, rm) as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch motions:', err); return [] as unknown[]; }),
    ]);

    const recentReports = filterRecent(reports);
    const recentPropositions = filterRecent(propositions);
    const recentMotions = filterRecent(motions);

    for (const d of recentReports) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'bet'; }
    for (const d of recentPropositions) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'prop'; }
    for (const d of recentMotions) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'mot'; }

    mcpCalls.push({ tool: 'get_betankanden', result: recentReports });
    mcpCalls.push({ tool: 'get_propositioner', result: recentPropositions });
    mcpCalls.push({ tool: 'get_motioner', result: recentMotions });

    // Merge: typed docs (with dok_id) are highest quality; supplement with
    // real documents from general search (those that have both dok_id and doktyp).
    const typedDocs = [...recentReports, ...recentPropositions, ...recentMotions];
    const typedDocIds = new Set<string>(
      typedDocs.flatMap(d => {
        const id = (d as Record<string, string>).dok_id;
        return id ? [id] : [];
      }),
    );

    const searchExtras = (allDocs as RawDocument[]).filter(d => {
      const id = (d as Record<string, string>).dok_id;
      const type = (d as Record<string, string>).doktyp;
      return id && type && !typedDocIds.has(id);
    });

    // Use typed + extras when available; fall back to raw search results (test mocks / edge cases)
    const documents: RawDocument[] =
      typedDocs.length > 0 || searchExtras.length > 0
        ? [...typedDocs, ...searchExtras]
        : (allDocs as RawDocument[]);

    console.log(`  📊 Found ${documents.length} documents (${recentReports.length} reports, ${recentPropositions.length} propositions, ${recentMotions.length} motions)`);

    if (documents.length === 0) {
      console.log('  ℹ️ No documents found for the past week, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    // ── Step 3: load each document completely via get_dokument_innehall ────
    console.log('  🔄 Step 3 — Loading full document content...');
    await enrichWithFullText(client, documents, mcpCalls, 3);

    // ── Step 4: fetch speeches from the period ─────────────────────────────
    console.log('  🔄 Step 4 — Fetching speeches from the period...');
    const speeches = await Promise.resolve()
      .then(() => client.searchSpeeches({ rm, from: fromStr, to: toStr, limit: 100 }) as Promise<unknown[]>)
      .catch((err: unknown) => { console.error('Failed to fetch speeches:', err); return [] as unknown[]; });

    mcpCalls.push({ tool: 'search_anforanden', result: speeches });
    attachSpeechesToDocuments(documents, speeches as Array<Record<string, unknown>>);
    console.log(`  🗣 Found ${speeches.length} speeches`);

    // ── Step 5: load CIA intelligence context from static data ─────────────
    console.log('  🔄 Step 5 — Loading CIA intelligence context...');
    const ciaContext = loadCIAContext();
    console.log(`  🧠 CIA context: ${ciaContext.partyPerformance.length} parties, coalition stability ${ciaContext.coalitionStability.stabilityScore}/100, motion denial rate ${ciaContext.overallMotionDenialRate}%`);

    // ── Step 6: fetch voting records for coalition stress analysis ─────────
    console.log('  🔄 Step 6 — Fetching voting records for coalition stress analysis...');
    let votingRecords: unknown[] = [];
    try {
      // search_voteringar does not support date params; use rm+limit then filter by datum.
      // Derive the riksmöte(s) from both ends of the date range using the shared
      // getCurrentRiksmote utility (Sep boundary: month >= 8 → new session).
      const startRm = getCurrentRiksmote(startDate);
      const endRm = getCurrentRiksmote(today);
      const rmValues = startRm === endRm ? [startRm] : [startRm, endRm];
      const allVotesArrays = await Promise.all(
        rmValues.map(rm => client.fetchVotingRecords({ rm, limit: 200 }) as Promise<VotingRecord[]>),
      );
      const allVotes: VotingRecord[] = allVotesArrays.flat();
      // Post-query filter to the weekly window using the datum field.
      votingRecords = allVotes.filter(r => {
        const d = r.datum;
        if (typeof d !== 'string') return false;
        // Extract YYYY-MM-DD via regex to handle ISO timestamps and timezone suffixes
        // (e.g. '2026-02-10T10:00:00' or '2026-09-05+02:00').
        const match = /^\d{4}-\d{2}-\d{2}/.exec(d);
        if (!match) return false;
        const dateStr = match[0];
        return dateStr >= fromStr && dateStr <= toStr;
      });
    } catch (err: unknown) {
      console.error('Failed to fetch voting records:', err);
    }

    mcpCalls.push({ tool: 'search_voteringar', result: votingRecords });
    console.log(`  🗳 Found ${votingRecords.length} voting records`);

    // ── Compute coalition stress and week-over-week metrics ────────────────
    const coalitionStress = analyzeCoalitionStress(votingRecords as VotingRecord[], ciaContext);
    const weekMetrics = calculateWeeklyActivityMetrics(documents, speeches, votingRecords as VotingRecord[], ciaContext);
    console.log(`  📈 Coalition risk: ${coalitionStress.riskIndex.level} (${coalitionStress.riskIndex.score}/100), activity: ${weekMetrics.activityChange}`);

    // ── Generate articles ──────────────────────────────────────────────────
    const slug = `${formatDateForSlug(today)}-weekly-review`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const content: string = generateArticleContent({ documents, ciaContext }, 'weekly-review', lang);
      const coalitionSection: string = generateCoalitionDynamicsSection(coalitionStress, lang);
      const weekOverWeekSection: string = generateWeeklyActivitySection(weekMetrics, lang);
      const fullContent: string = content + coalitionSection + weekOverWeekSection;
      const watchPoints = extractWatchPoints({ documents, ciaContext }, lang);
      const metadata = generateMetadata({ documents, ciaContext }, 'weekly-review', lang);
      const readTime: string = calculateReadTime(fullContent);
      const sources: string[] = generateSources([...REQUIRED_TOOLS]);

      const titles: TitleSet = getTitles(lang, documents.length);

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0] ?? '',
        type: 'retrospective' as ArticleCategory,
        readTime,
        lang,
        content: fullContent,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      articles.push({
        lang,
        html,
        filename: `${slug}-${lang}.html`,
        slug: `${slug}-${lang}`
      });

      if (writeArticle) {
        await writeArticle(html, `${slug}-${lang}.html`);
        console.log(`  ✅ ${lang.toUpperCase()} version generated`);
      }
    }

    return {
      success: true,
      files: languages.length,
      slug,
      articles,
      mcpCalls,
      crossReferences: {
        event: `${documents.length} documents over ${lookbackDays} days`,
        sources: ['search_dokument', 'get_dokument_innehall', 'search_anforanden', 'get_betankanden', 'get_propositioner', 'get_motioner', 'search_voteringar']
      }
    };
  } catch (error: unknown) {
    console.error('❌ Error generating Weekly Review:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      mcpCalls
    };
  }
}

/**
 * Get language-specific titles
 */
function getTitles(lang: Language, documentCount: number): TitleSet {
  const titles: Record<Language, TitleSet> = {
    en: {
      title: `Weekly Review: Parliament in Retrospect`,
      subtitle: `Analysis of ${documentCount} key developments from the past week in Swedish politics`
    },
    sv: {
      title: `Veckans sammanfattning: Riksdagen i retrospektiv`,
      subtitle: `Analys av ${documentCount} viktiga händelser från den gångna veckan`
    },
    da: {
      title: `Ugentlig gennemgang: Parlamentet i tilbageblik`,
      subtitle: `Analyse af ${documentCount} vigtige begivenheder fra den forgangne uge`
    },
    no: {
      title: `Ukentlig gjennomgang: Stortinget i retrospekt`,
      subtitle: `Analyse av ${documentCount} viktige hendelser fra den siste uken`
    },
    fi: {
      title: `Viikkokatsaus: Eduskunta jälkikäteen`,
      subtitle: `Analyysi ${documentCount} tärkeästä tapahtumasta viime viikolta`
    },
    de: {
      title: `Wochenrückblick: Parlament in Rückschau`,
      subtitle: `Analyse von ${documentCount} wichtigen Entwicklungen der vergangenen Woche`
    },
    fr: {
      title: `Revue hebdomadaire : Le Parlement en rétrospective`,
      subtitle: `Analyse de ${documentCount} développements clés de la semaine écoulée`
    },
    es: {
      title: `Revisión semanal: El Parlamento en retrospectiva`,
      subtitle: `Análisis de ${documentCount} desarrollos clave de la semana pasada`
    },
    nl: {
      title: `Wekelijkse terugblik: Parlement in retrospectief`,
      subtitle: `Analyse van ${documentCount} belangrijke ontwikkelingen van de afgelopen week`
    },
    ar: {
      title: `المراجعة الأسبوعية: البرلمان في استعراض`,
      subtitle: `تحليل ${documentCount} تطورات رئيسية من الأسبوع الماضي`
    },
    he: {
      title: `סקירה שבועית: הפרלמנט בראי`,
      subtitle: `ניתוח ${documentCount} התפתחויות מרכזיות מהשבוע שעבר`
    },
    ja: {
      title: `週間レビュー：議会の振り返り`,
      subtitle: `先週の${documentCount}件の主要な動向の分析`
    },
    ko: {
      title: `주간 리뷰: 의회 회고`,
      subtitle: `지난 주 ${documentCount}건의 주요 동향 분석`
    },
    zh: {
      title: `每周回顾：议会回顾`,
      subtitle: `过去一周${documentCount}项重要发展的分析`
    }
  };

  return titles[lang] || titles.en;
}

/**
 * Validate weekly review article structure
 */
