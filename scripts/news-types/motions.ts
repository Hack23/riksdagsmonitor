/**
 * @module ContentGeneration/OppositionAnalysis
 * @category ContentGeneration
 * 
 * @title Opposition Motions Article Generator - Legislative Initiative Intelligence
 * 
 * @description
 * **INTELLIGENCE OPERATIVE PERSPECTIVE**
 * 
 * This module generates analysis articles on opposition motions (motioner), which are
 * parliamentary proposals for policy change submitted by opposition parties and some
 * government coalition members. Motions represent the parliamentary toolkit for policy
 * challenge and alternatives, making them critical for understanding opposition
 * strategy and emerging policy ideas that may later influence government policy.
 * 
 * **PARLIAMENTARY CONTEXT - SWEDISH LEGISLATIVE PROCESS:**
 * The Swedish legislative process involves multiple parliamentary document types:
 * 1. **Propositioner** (Government Proposals): Executive branch initiates bills
 * 2. **Motioner** (Motions): Opposition/members propose alternatives
 * 3. **Betänkanden** (Committee Reports): Committees analyze proposals
 * 4. **Skrivelser** (Government Reports): Executive reports to parliament
 * 5. **Frågor** (Written Questions): Members demand government clarification
 * 
 * Motions exist in this ecosystem as the primary tool for opposition leverage,
 * allowing non-governing parties to shape the agenda and challenge government policy.
 * 
 * **OPPOSITION MOTION INTELLIGENCE VALUE:**
 * Motions reveal:
 * 1. **Alternative Policy Directions**: What opposition wants to change
 * 2. **Coalition Fault Lines**: Issues dividing government coalition
 * 3. **Emerging Policy Ideas**: Proposals not yet on government agenda
 * 4. **Party Positioning**: Which parties cooperate on specific issues
 * 5. **Time-to-Victory Prediction**: Which opposition ideas may gain government support
 * 
 * **MOTION TYPES & CHARACTERISTICS:**
 * - **Policy Motions**: Comprehensive proposal for new direction
 * - **Amendment Motions**: Modification to existing policy
 * - **Rhetorical Motions**: Statement of principle (often symbolic)
 * - **Procedural Motions**: Changes to parliamentary rules
 * - **Budget Motions**: Alternative budget proposals during budget process
 * 
 * **ARTICLE STRUCTURE:**
 * Each opposition motion article includes:
 * 1. **Motion Summary**: What's being proposed and by whom
 * 2. **Policy Problem**: Why opposition believes change is needed
 * 3. **Proposed Solution**: Specific policy recommendation
 * 4. **Government Position**: Official response and likelihood of adoption
 * 5. **Coalition Implications**: Which parties support/oppose the motion
 * 6. **Timeline & Impact**: When would implementation occur, affected sectors
 * 
 * **MCP DATA SOURCE:**
 * Primary tool: get_motioner
 * - Retrieves parliamentary motion records from riksdag platform
 * - Includes motion text, sponsorship, current status
 * - Enables systematic opposition coverage
 * 
 * Additional tools (all implemented with graceful degradation):
 * - search_dokument_fulltext: Full-text policy alternative analysis
 * - analyze_g0v_by_department: Government department response tracking
 * - search_anforanden: Debate context and party positioning
 * 
 * **OPERATIONAL WORKFLOW:**
 * 1. Query MCP: Fetch recent motions (default: 10 most recent)
 * 2. Filter Analysis: Identify motions with policy significance
 * 3. Government Response: Look up government statement if available
 * 4. Impact Assessment: Estimate likelihood of adoption
 * 5. Article Generation: Create narrative with contextual analysis
 * 6. Multilingual Creation: Generate 14-language editions
 * 7. Publication: Deploy to news directory
 * 
 * **PARTY STRATEGY ANALYSIS:**
 * Opposition motions serve multiple strategic purposes:
 * 
 * **Social Democrats (S)** - Major Opposition:
 * - Systematic policy proposals for when they return to power
 * - Cooperation opportunities with other center-left parties
 * - Pressure on government coalition weaknesses
 * 
 * **Moderates (M)** - Usually Coalition:
 * - Occasionally submit motions in policy disputes
 * - Bridges to other center-right parties
 * - Strategic positioning for future coalition shifts
 * 
 * **Sweden Democrats (SD)** - Oppositional:
 * - Immigration and security policy focus
 * - Cross-party alliance building on specific issues
 * - Strategic pressure on coalition on security matters
 * 
 * **Left Party (V)** - Opposition:
 * - Labor rights and welfare state advocacy
 * - Tactical alliance with Social Democrats
 * - Symbolic motions on socialist principles
 * 
 * **Other Parties** (KD, L, C, MP, FI):
 * - Issue-specific motions aligned with constituencies
 * - Coalition or opposition depending on government composition
 * - Significant for niche policy areas
 * 
 * **INTELLIGENCE APPLICATIONS:**
 * 1. **Opposition Morale Tracking**: Frequency and ambition of motions
 * 2. **Cross-Party Coalition**: Identify emerging non-governmental coalitions
 * 3. **Policy Direction Detection**: Emerging issues before government acts
 * 4. **Vulnerability Identification**: Government weak points under attack
 * 5. **Timeline Prediction**: When opposition ideas become policy
 * 
 * **RISK ASSESSMENT FRAMEWORK:**
 * Opposition motion analysis feeds into risk assessment:
 * - **Coalition Stability**: Frequency of internal coalition conflict motions
 * - **Political Momentum**: Which parties gaining traction with ideas
 * - **Agenda Shifting**: Policy areas gaining opposition attention
 * - **Pressure Points**: Where government facing most challenge
 * 
 * **PERFORMANCE CHARACTERISTICS:**
 * - MCP Query: ~400ms for 10 latest motions
 * - Article Generation: ~2 seconds per motion
 * - Translation: ~5 seconds per motion (parallel)
 * - Total: ~12 seconds for batch (10 motions, 14 languages)
 * 
 * **LANGUAGE CONSIDERATIONS:**
 * Motion language is dense and technical, presenting translation challenges:
 * - Swedish: Formal parliamentary language with specific terminology
 * - English: Translation often requires policy context explanation
 * - Nordic Languages: Similar legislative traditions enable closer translation
 * - Other Languages: Require significant contextualization
 * 
 * **FAILURE HANDLING:**
 * - Missing Motion Text: Generate article with summary only
 * - Government Response Unavailable: Note that response pending
 * - MCP Service Down: Skip batch, retry on schedule
 * - Empty Results: Log informational, no articles generated
 * 
 * **GDPR COMPLIANCE:**
 * - Motion sponsors are public figures (public record)
 * - Member statements in motions are public
 * - Data retention follows parliamentary archive standards
 * - Supporting audit trail for regulatory compliance
 * 
 * @osint Opposition Strategy Intelligence
 * - Maps opposition party alliances through motion sponsorship
 * - Tracks emerging opposition policy direction
 * - Identifies opposition leadership and influential members
 * - Analyzes cross-party coalition patterns for future government
 * 
 * @risk Government Pressure Assessment
 * - Opposition motions indicate policy challenges
 * - Coalition stress detectable through internal conflict motions
 * - Early warning of potential policy shifts
 * - Momentum changes in political landscape
 * 
 * @gdpr Public Parliamentary Record
 * - Motions are public documents
 * - Sponsorship publicly recorded
 * - Data retention follows parliamentary standards
 * - Supporting historical record for democracy transparency
 * 
 * @security Legislative Integrity
 * - Motion authenticity verified through official MCP source
 * - Sponsorship verification prevents attribution errors
 * - Timestamp validation prevents tampering
 * - Official status confirmation from riksdag records
 * 
 * @author Hack23 AB (Opposition Intelligence & Legislative Analysis)
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024-08-22
 * @see scripts/data-transformers.js (Content Generation Utilities)
 * @see scripts/article-template.js (HTML Rendering)
 * @see Issue #137 (Opposition Tracking Enhancement)
 * @see https://www.riksdagen.se/ (Riksdag Parliamentary Records)
 */

import { getCurrentRiksmote } from '../shared/riksmote.js';
import { MCPClient } from '../mcp-client.js';
import {
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  generateContentTitle,
  filterFreshDocuments,
  type RawDocument
} from '../data-transformers.js';
import { generateArticleHTML } from '../article-template.js';
import type { Language } from '../types/language.js';
import type { ArticleCategory, GeneratedArticle, GenerationResult, MCPCallRecord } from '../types/article.js';

/**
 * Required MCP tools for motions articles
 * 
 * Restored to full 4-tool specification (2026-02-26):
 * All four tools are now implemented with graceful degradation on failure.
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'get_motioner',
  'search_dokument_fulltext',
  'analyze_g0v_by_department',
  'search_anforanden',
];

export interface TitleSet {
  title: string;
  subtitle: string;
}

export interface MotionsValidationResult {
  hasMotions: boolean;
  hasMinimumSources: boolean;
  hasOppositionAnalysis: boolean;
  passed: boolean;
}

export interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface GenerationOptions {
  languages?: Language[];
  limit?: number;
  writeArticle?: ((html: string, filename: string) => Promise<void>) | null;
}

/**
 * Format date for article slug
 */
export function formatDateForSlug(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Calculate the current Swedish riksmöte (parliamentary session) string.
 * The session runs September–August: e.g. September 2025 → "2025/26".
 *
 * Re-exports the shared implementation from `scripts/shared/riksmote.ts`
 * to maintain the existing public API while keeping Sep–Aug boundary logic
 * consistent across generators (motions, propositions, weekly/monthly review).
 */
export { getCurrentRiksmote };

/**
 * Generate Opposition Motions article
 */
export async function generateMotions(options: GenerationOptions = {}): Promise<GenerationResult> {
  const { languages = ['en', 'sv'], limit = 10, writeArticle = null } = options;
  
  console.log('📝 Generating Opposition Motions article...');
  
  const mcpCalls: MCPCallRecord[] = [];
  
  try {
    const client = new MCPClient();
    
    console.log('  🔄 Fetching motions from riksdag-regering-mcp...');
    const motions = filterFreshDocuments(await client.fetchMotions(limit) as RawDocument[]);
    mcpCalls.push({ tool: 'get_motioner', result: motions });
    console.log(`  📊 Found ${motions.length} motions`);
    
    if (motions.length === 0) {
      console.log('  ℹ️ No new motions found, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    // Tool 2: search_dokument_fulltext — full-text policy alternative analysis
    try {
      const topTitle = motions[0]?.titel || motions[0]?.title || '';
      if (topTitle) {
        const ftResponse = await client.request('search_dokument_fulltext', { query: topTitle, limit: 3 });
        const ftDocs = (ftResponse['dokument'] ?? ftResponse['results'] ?? []) as RawDocument[];
        mcpCalls.push({ tool: 'search_dokument_fulltext', result: ftDocs });
        console.log(`  📄 Full text: ${ftDocs.length} results`);
        // Attach the best matching full text only to the primary motion (the one used for the query)
        const primaryMotion = motions[0] as Record<string, unknown> | undefined;
        if (primaryMotion && ftDocs.length > 0 && !primaryMotion['fullText']) {
          const bestDoc = ftDocs[0] as Record<string, unknown>;
          primaryMotion['fullText'] = (bestDoc['fullText'] as string) || (bestDoc['summary'] as string) || '';
          if (ftDocs.length > 1) {
            primaryMotion['policyAlternativeDocs'] = ftDocs;
          }
        }
      }
    } catch (err) {
      console.warn('  ⚠ search_dokument_fulltext unavailable:', (err as Error).message);
      mcpCalls.push({ tool: 'search_dokument_fulltext', result: [] });
    }

    // Tool 3: analyze_g0v_by_department — government department response tracking
    let govDeptData: Record<string, unknown>[] = [];
    try {
      const today0 = new Date();
      const thirtyDaysAgo = new Date(today0);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const govResp = await client.request('analyze_g0v_by_department', {
        dateFrom: formatDateForSlug(thirtyDaysAgo),
        dateTo: formatDateForSlug(today0),
      });
      govDeptData = (govResp['departments'] ?? govResp['data'] ?? []) as Record<string, unknown>[];
      mcpCalls.push({ tool: 'analyze_g0v_by_department', result: govDeptData });
      console.log(`  🏛 Gov dept analysis: ${govDeptData.length} departments`);
    } catch (err) {
      console.warn('  ⚠ analyze_g0v_by_department unavailable:', (err as Error).message);
      mcpCalls.push({ tool: 'analyze_g0v_by_department', result: [] });
    }

    // Tool 4: search_anforanden — debate context and party positioning
    try {
      const debateQuery = motions[0]?.titel || motions[0]?.title || '';
      if (debateQuery) {
        const speeches = await client.searchSpeeches({ text: debateQuery, rm: getCurrentRiksmote(), limit: 10 }) as Array<Record<string, unknown>>;
        mcpCalls.push({ tool: 'search_anforanden', result: speeches });
        console.log(`  🗣 Debate speeches: ${speeches.length} found`);
        // Attach speeches to the first motion without speeches for "Party Positioning" rendering
        if (speeches.length > 0) {
          for (const motion of motions) {
            const m = motion as Record<string, unknown>;
            if (!m['speeches']) {
              m['speeches'] = speeches.slice(0, 3).map((s: Record<string, unknown>) => ({
                talare: s['talare'],
                parti: s['parti'],
                text: (s['anforande_text'] as string | undefined)?.slice(0, 300),
                anforande_nummer: s['anforande_nummer'],
              }));
              break;
            }
          }
        }
      }
    } catch (err) {
      console.warn('  ⚠ search_anforanden unavailable:', (err as Error).message);
      mcpCalls.push({ tool: 'search_anforanden', result: [] });
    }
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-opposition-motions`;
    const articles: GeneratedArticle[] = [];
    
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      const content: string = generateArticleContent({ motions, govDeptData }, 'motions', lang);
      const watchPoints = extractWatchPoints({ motions }, lang);
      const metadata = generateMetadata({ motions }, 'motions', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources([
        'get_motioner',
        'search_dokument_fulltext',
        'analyze_g0v_by_department',
        'search_anforanden',
      ]);
      
      const titles: TitleSet = getTitles(lang, motions.length, motions);
      
      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0] ?? '',
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
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
        event: `${motions.length} motions`,
        sources: ['motioner', 'fulltext', 'gov-dept', 'speeches']
      }
    };
    
  } catch (error: unknown) {
    console.error('❌ Error generating Motions:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      mcpCalls
    };
  }
}

function getTitles(lang: Language, count: number, documents: RawDocument[] = []): TitleSet {
  const contentTitle = generateContentTitle(documents, lang, 'motions');
  if (contentTitle) return contentTitle;

  const titles: Record<Language, TitleSet> = {
    en: {
      title: `Opposition Motions: Battle Lines This Week`,
      subtitle: `Analysis of ${count} opposition motions revealing parliamentary fault lines`
    },
    sv: {
      title: `Oppositionsmotioner: Veckans stridslinjer`,
      subtitle: `Analys av ${count} oppositionsmotioner som avslöjar parlamentariska skiljelinjer`
    },
    da: {
      title: `Oppositionsforslag: Ugens kamppladser`,
      subtitle: `Analyse af ${count} oppositionsforslag`
    },
    no: {
      title: `Opposisjonsforslag: Ukens kamplinjer`,
      subtitle: `Analyse av ${count} opposisjonsforslag`
    },
    fi: {
      title: `Opposition aloitteet: Viikon taistelulinjat`,
      subtitle: `Analyysi ${count} opposition aloitteesta`
    },
    de: {
      title: `Oppositionsanträge: Kampflinien dieser Woche`,
      subtitle: `Analyse von ${count} Oppositionsanträgen`
    },
    fr: {
      title: `Motions d'opposition: Lignes de bataille cette semaine`,
      subtitle: `Analyse de ${count} motions d'opposition`
    },
    es: {
      title: `Mociones de oposición: Líneas de batalla esta semana`,
      subtitle: `Análisis de ${count} mociones de oposición`
    },
    nl: {
      title: `Oppositiemoties: Strijdlijnen deze week`,
      subtitle: `Analyse van ${count} oppositiemoties`
    },
    ar: {
      title: `اقتراحات المعارضة: خطوط المعركة هذا الأسبوع`,
      subtitle: `تحليل ${count} اقتراحات المعارضة`
    },
    he: {
      title: `הצעות אופוזיציה: קווי העימות השבוע`,
      subtitle: `ניתוח ${count} הצעות אופוזיציה`
    },
    ja: {
      title: `野党動議：今週の対立構図`,
      subtitle: `${count}件の野党動議の分析`
    },
    ko: {
      title: `야당 동의: 이번 주 대립 구도`,
      subtitle: `${count}개 야당 동의 분석`
    },
    zh: {
      title: `反对党动议：本周对立格局`,
      subtitle: `${count}份反对党动议分析`
    }
  };
  
  return titles[lang] || titles.en;
}

export function validateMotions(article: ArticleInput): MotionsValidationResult {
  const hasMotions = checkMotions(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasOppositionAnalysis = checkOppositionAnalysis(article);
  
  return {
    hasMotions,
    hasMinimumSources,
    hasOppositionAnalysis,
    passed: hasMotions && hasMinimumSources && hasOppositionAnalysis
  };
}

function checkMotions(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('motion') ||
         article.content.toLowerCase().includes('opposition');
}

function countSources(article: ArticleInput): number {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkOppositionAnalysis(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const keywords = ['opposition', 'battle', 'fault lines', 'parliamentary'];
  return keywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}
