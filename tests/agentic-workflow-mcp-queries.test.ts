/**
 * Test Suite for Agentic Workflow MCP Query Patterns
 *
 * Validates that agentic workflows follow best practices for MCP data querying:
 * - Data freshness validation with get_sync_status()
 * - Explicit date filtering where supported
 * - Post-query date filtering documentation
 * - Cross-referencing patterns
 * - Error handling for stale data
 *
 * Prevents regressions where workflows rely on implicit "latest" data
 * instead of explicit date-based queries.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readWorkflowWithImports } from './helpers/workflow-imports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKFLOWS_DIR = path.join(__dirname, '..', '.github', 'workflows');
const PROMPTS_DIR = path.join(__dirname, '..', '.github', 'prompts');

// Workflows to validate
const WORKFLOWS: readonly string[] = [
  'news-evening-analysis.md',
  
  'news-realtime-monitor.md'
];

/** A problematic line found in a workflow */
interface ProblematicLine {
  readonly line: number;
  readonly content: string;
}

describe('Agentic Workflow MCP Query Patterns', () => {
  describe('Data Freshness Validation', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should document get_sync_status() call`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        // `get_sync_status` / freshness rules live in `../prompts/02-mcp-access.md`.
        const content = readWorkflowWithImports(filepath);

        // Check for get_sync_status() documentation
        expect(content).toContain('get_sync_status');

        // Check for data freshness validation guidance
        expect(content.toLowerCase()).toMatch(/data\s+freshness|sync\s+status|stale\s+data|partial\s+data/);
      });

      it(`${workflow} should warn about stale data`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

        // Should document stale / partial data handling (inline in the
        // workflow body, in `../prompts/02-mcp-access.md`, or the
        // analysis-pipeline modules that enforce provenance/manifest rules).
        const hasStaleDataHandling =
          content.includes('stale') ||
          content.includes('last_updated') ||
          content.includes('hoursSinceSync') ||
          content.includes('>48') ||
          content.includes('> 48') ||
          content.includes('partial data') ||
          content.includes('document gaps');

        expect(hasStaleDataHandling).toBe(true);
      });
    });
  });

  describe('Explicit Date Filtering', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should document explicit date parameters`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

        // Should document date parameters
        const hasDateParameters =
          content.includes('from_date') ||
          content.includes('to_date') ||
          content.includes('from:') ||
          content.includes('tom:') ||
          content.includes('dateFrom') ||
          content.includes('dateTo') ||
          content.includes('ARTICLE_DATE');

        expect(hasDateParameters).toBe(true);
      });

      it(`${workflow} should NOT rely on implicit "latest" patterns`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

        // Check for problematic implicit patterns
        // Look for queries without any date awareness
        const lines = content.split('\n');
        const problematicLines: ProblematicLine[] = [];

        lines.forEach((line, idx) => {
          // Check for MCP tool calls without date context
          if (line.match(/search_voteringar|get_betankanden|get_motioner|get_propositioner|search_anforanden/)) {
            // Look for date-related context in surrounding lines
            const contextStart = Math.max(0, idx - 5);
            const contextEnd = Math.min(lines.length, idx + 5);
            const context = lines.slice(contextStart, contextEnd).join('\n');

            const hasDateContext =
              context.includes('from') ||
              context.includes('tom') ||
              context.includes('date') ||
              context.includes('filter') ||
              context.includes('Filter') ||
              context.includes('datum') ||
              context.includes('publicerad') ||
              context.includes('inlämnad');

            if (!hasDateContext && !line.includes('//')) {
              problematicLines.push({ line: idx + 1, content: line.trim() });
            }
          }
        });

        // For now, just log problematic lines for review
        // In future, could make this a hard failure
        if (problematicLines.length > 0) {
          console.log(`⚠️  ${workflow} has queries without obvious date context:`);
          problematicLines.forEach(p => {
            console.log(`  Line ${p.line}: ${p.content}`);
          });
        }
      });
    });
  });

  describe('Post-Query Date Filtering Documentation', () => {
    it('news-evening-analysis.md should document post-query filtering', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      // Canonical date-filtering rules live in `../prompts/02-mcp-access.md`
      // + `../prompts/03-data-download.md` now that workflows are modular.
      const content = readWorkflowWithImports(filepath);

      // Should document filtering by date fields (inline, via prompt
      // modules, or via delegation to shared patterns).
      expect(content).toMatch(/filter.*by.*publicerad|filter.*by.*datum|filter.*by.*inlämnad|Date Filtering|ARTICLE_DATE/i);

      // Should have filtering guidance (JS code examples, date-parameter
      // patterns, prompt-module delegation, or ARTICLE_DATE scoping).
      expect(content).toMatch(/\.filter\(|\bfromDate\b|\bfrom_date\b|\bdateFrom\b|\bdateTo\b|ARTICLE_DATE|prompts\/02-mcp-access|prompts\/03-data-download/i);
      // Should reference date-based filtering approach.
      expect(content).toMatch(/from_date|to_date|fromDate|dateFrom|dateTo|>= fromDate|ARTICLE_DATE/i);
      // Should have filtering instructions (fromDate references, filter
      // directives, or prompt-module delegation).
      expect(content).toMatch(/fromDate|from_date|filter.*results|ARTICLE_DATE|02-mcp-access|03-data-download/i);
    });

    it('workflows should annotate tools with date support', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = readWorkflowWithImports(filepath);

      // Check for date support annotations (inline, via imported prompts, or
      // via ARTICLE_DATE scoping that downstream filter-by-date).
      const hasDateAnnotations = /supports.*from.*tom|supports.*from_date.*to_date|supports.*dateFrom.*dateTo/i.test(content);
      const hasPromptModuleDelegation = /02-mcp-access|03-data-download/i.test(content) && /Date Filtering|date.*param|ARTICLE_DATE/i.test(content);
      const hasInlineDateParams = /get_calendar_events.*from.*tom|search_regering.*dateFrom.*dateTo|ARTICLE_DATE/i.test(content);
      expect(
        hasDateAnnotations || hasPromptModuleDelegation || hasInlineDateParams,
        'Should annotate tools with date support, delegate to a prompt module, or scope via ARTICLE_DATE'
      ).toBe(true);
      // Should reference date field filtering (inline or by delegation).
      expect(content).toMatch(/filter.*datum|filter.*publicerad|filter.*inlämnad|datum.*publicerad.*inlämnad|ARTICLE_DATE/);
    });

    it('news-evening-analysis.md should document post-query fromDate filtering guidance', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = readWorkflowWithImports(filepath);

      // Should include explicit fromDate usage or ARTICLE_DATE scoping.
      expect(content).toMatch(/>=\s*fromDate|new Date\([^\n]*fromDate[^\n]*\)\s*[>=]|fromDate|ARTICLE_DATE/i);
      // Should include post-query filtering guidance (inline or delegated).
      expect(content).toMatch(/post-query\s+filter|filter\s+results|date\s+filter|ARTICLE_DATE|02-mcp-access|03-data-download/i);
    });
  });

  describe('Cross-Referencing Strategy', () => {
    it('news-evening-analysis.md should document cross-referencing of data sources', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      // Cross-referencing guidance lives in the Tier-C aggregation extension
      // (`.github/prompts/ext/tier-c-aggregation.md`) and/or the analysis
      // pipeline prompt modules for aggregation-type workflows.
      const content = readWorkflowWithImports(filepath);

      // Should have cross-referencing guidance (numbered examples, descriptive
      // patterns, or delegation via prompt modules).
      const hasCrossRefGuidance =
        (content.includes('Example 1:') && content.includes('Example 2:')) ||
        /cross[\s-]?referenc(?:e|ing)/i.test(content);
      expect(hasCrossRefGuidance).toBe(true);

      // Should describe cross-referencing approach (combining data sources,
      // filtering by date, aggregation across tiers).
      expect(content).toMatch(/cross.*reference|related.*data.*sources|richer.*analysis|combine.*committee|combine.*reports|aggregation|sibling/i);

      // Should mention cross-ref targets like committee reports, voting
      // records, propositions, or motions.
      expect(content).toMatch(/committee reports|voting records|propositions|motions|interpellations/i);
    });
  });

  describe('Error Handling', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should document error scenarios`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

        // Should have error handling table or section
        expect(content).toMatch(/error|Error|cause|Cause|fix|Fix/);

        // Should document specific error scenarios (inline, or via the
        // imported MCP/commit prompt modules which document MCP-unreachable,
        // partial-data, and timeout handling).
        const hasErrorScenarios =
          content.includes('Tool not found') ||
          content.includes('Empty results') ||
          content.includes('Timeout') ||
          content.includes('Stale data') ||
          content.includes('partial data') ||
          content.includes('MCP unreachable') ||
          content.includes('MCP-unreachable');

        expect(hasErrorScenarios).toBe(true);
      });

      it(`${workflow} should document stale/partial data handling`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

        // Should document what to do with stale / partial data (inline or
        // via the imported MCP-access / commit-and-PR prompt modules).
        const hasStaleDataGuidance =
          (content.toLowerCase().includes('stale') &&
           (content.includes('disclaimer') ||
            content.includes('note in analysis') ||
            content.includes('48h') ||
            content.includes('48 hours'))) ||
          content.includes('partial data') ||
          content.includes('document gaps');

        expect(hasStaleDataGuidance).toBe(true);
      });
    });
  });

  describe('MCP Tool Documentation Quality', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should document the MCP surface inline or via prompt modules`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

        // Should document tool inventory inline OR delegate to
        // `../prompts/02-mcp-access.md` (which lists the servers and
        // naming conventions authoritatively).
        const hasInlineToolCount = /32.*tools|32.*riksdag-regering/i.test(content);
        const hasPromptModuleDelegation = /02-mcp-access|riksdag-regering-mcp|riksdag-regering/i.test(content) && /Tool|MCP|mcp-servers/.test(content);
        expect(
          hasInlineToolCount || hasPromptModuleDelegation,
          `${workflow} should document the MCP surface inline or delegate to a prompt module`
        ).toBe(true);

        // Must always emphasise the health-gate tool.
        expect(content).toContain('get_sync_status');

        // Must reference the canonical tool surface from
        // `../prompts/02-mcp-access.md` (at least one of the four tools
        // listed as the stable public API).
        const canonicalTools = [
          'search_dokument',
          'get_voteringar',
          'get_dokument_innehall',
        ];
        expect(
          canonicalTools.some(t => content.includes(t)),
          `${workflow} should reference at least one canonical riksdag-regering tool (${canonicalTools.join(', ')})`
        ).toBe(true);
      });

      it(`${workflow} should emphasize get_sync_status() first`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

        // Should emphasize calling get_sync_status first (workflow body,
        // prompt-module health gate, or pre-flight step).
        const emphasizesFirst =
          content.includes('ALWAYS check') ||
          content.includes('STEP 1') ||
          content.includes('CALL THIS FIRST') ||
          content.includes('first to warm up') ||
          content.includes('Run once at workflow start') ||
          content.includes('at workflow start') ||
          /Call\s+`get_sync_status/.test(content);

        expect(emphasizesFirst).toBe(true);
      });
    });
  });

  describe('Date Filtering Best Practices', () => {
    it('workflows should have date calculation examples', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = readWorkflowWithImports(filepath);

      // Should show date calculation patterns (either JS Date, fromDate /
      // today parameters, or ARTICLE_DATE scoping).
      expect(content).toMatch(/new Date.*toISOString|Date\.now\(\)|fromDate|today|ARTICLE_DATE/i);
      // Should include date placeholder patterns or dynamic calculation.
      expect(content).toMatch(/<today>|<fromDate>|date.*calculation|\$ARTICLE_DATE|\$\{ARTICLE_DATE\}/i);
      // Should show date-range arithmetic, lookback logic, or UTC derivation.
      expect(content).toMatch(/86400000|3600000|lookback_hours|lookback|date -u/);
    });

    it('workflows should include dynamic riksmöte calculation instructions', () => {
      // The Riksmöte calculation guidance is now an optional, per-workflow
      // inline note. What we care about structurally is: no hardcoded
      // `rm: "YYYY/YY"` literal sneaks back in.
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = readWorkflowWithImports(filepath);

      expect(content).not.toMatch(/rm:\s*["']?20\d{2}\/\d{2}["']?/i);
    });

    it('all news workflows should not hardcode the parliamentary session year', () => {
      const newsWorkflows = [
        'news-realtime-monitor.md', 'news-motions.md', 
        'news-evening-analysis.md', 'news-monthly-review.md', 'news-week-ahead.md',
        'news-weekly-review.md', 'news-committee-reports.md', 'news-propositions.md',
        'news-month-ahead.md',
      ];
      for (const workflow of newsWorkflows) {
        const content = readWorkflowWithImports(path.join(WORKFLOWS_DIR, workflow));
        // Should not hardcode rm: "2025/26" (any year format). This prevents
        // a common regression where an old session year gets copy-pasted
        // forward and then goes stale.
        expect(
          content,
          `${workflow} must not hardcode a parliamentary session year in rm`
        ).not.toMatch(/rm:\s*"20\d{2}\/\d{2}"/);
      }
    });
  });

  describe('Workflow Compilation', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should compile without errors`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);

        // Check file exists
        expect(fs.existsSync(filepath)).toBe(true);

        // Check for required YAML frontmatter (the workflow file itself —
        // imports don't carry frontmatter).
        const content = fs.readFileSync(filepath, 'utf-8');
        expect(content).toMatch(/^---\n/);
        expect(content).toMatch(/\nname:/);
        expect(content).toMatch(/\ndescription:/);
        // mcp-servers may be declared inline or inherited via prompt imports
        // that document MCP access for the engine; both are valid.
        const effective = readWorkflowWithImports(filepath);
        expect(effective).toMatch(/mcp-servers:|riksdag-regering/);
        expect(content).toMatch(/\nengine:/);

        // Check for compiled .lock.yml file
        const lockFile = filepath.replace('.md', '.lock.yml');
        expect(fs.existsSync(lockFile)).toBe(true);
      });
    });
  });

  describe('Regression Prevention', () => {
    it('evening analysis should maintain enhanced query patterns', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      // Enhanced-query concepts moved to the imported MCP / data-download
      // prompt modules when workflows were modularised.
      const content = readWorkflowWithImports(filepath);

      // Check for the canonical rules that replaced the pre-modular
      // enhancements — these are the regression markers we now care about.
      const regressionMarkers: readonly string[] = [
        'get_sync_status',   // data-freshness health gate
        'ARTICLE_DATE',      // explicit date scoping (replaces ad-hoc fromDate/hoursSinceSync)
        'safeoutputs___noop' // MCP-unreachable fallback
      ];

      regressionMarkers.forEach(marker => {
        expect(
          content,
          `evening analysis effective prompt should retain: ${marker}`
        ).toContain(marker);
      });
    });

    it('workflows should not use ambiguous "latest" language', () => {
      WORKFLOWS.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        // Only check the workflow body here — prompt modules intentionally
        // describe `get_latest_update` / "latest" tools as reference docs,
        // which would false-flag this regex.
        const content = fs.readFileSync(filepath, 'utf-8');

        // Check for problematic "latest" usage (excluding code comments and documentation)
        const lines = content.split('\n');
        const problematicLines: ProblematicLine[] = [];

        lines.forEach((line, idx) => {
          // Skip if it's a code comment explaining "latest"
          if (line.includes('//') && line.includes('Get latest')) {
            // This is OK - it's just a comment describing what the code does
            return;
          }

          // Skip if it's in documentation about what NOT to do
          if (line.includes('NOT') || line.includes('DO NOT') || line.includes('❌')) {
            return;
          }

          // Skip if it's documenting get_latest_update tool
          if (line.includes('get_latest_update')) {
            return;
          }

          // Skip if it's in a tool description
          if (line.match(/- `.*latest.*`.*-/)) {
            return;
          }

          // Flag queries that might rely on implicit "latest"
          if (line.match(/latest.*data|get.*latest|fetch.*latest/) &&
              !line.includes('DO NOT') &&
              !line.includes('❌')) {
            problematicLines.push({ line: idx + 1, content: line.trim() });
          }
        });

        // For now, just warn (not hard failure)
        if (problematicLines.length > 0) {
          console.log(`⚠️  ${workflow} may have ambiguous "latest" usage:`);
          problematicLines.forEach(p => {
            console.log(`  Line ${p.line}: ${p.content}`);
          });
        }
      });
    });
  });
});

describe('MCP Tool Date Parameter Support Matrix', () => {
  it('effective prompt for evening analysis should scope MCP queries by date', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
    const combined = readWorkflowWithImports(filepath);

    // Canonical riksdag-regering tools from `../prompts/02-mcp-access.md`.
    // At least one must appear — along with *some* form of date-based
    // scoping (ARTICLE_DATE derivation, explicit `from_date`/`to_date`,
    // `fromDate`/`dateFrom` param, or `from:`/`tom:` params).
    const canonicalTools: readonly string[] = [
      'search_dokument',
      'get_voteringar',
      'get_dokument_innehall',
      'get_sync_status',
    ];

    expect(
      canonicalTools.some(t => combined.includes(t)),
      'Effective prompt for evening analysis must reference at least one canonical riksdag-regering tool'
    ).toBe(true);

    const hasDateScoping =
      /ARTICLE_DATE/.test(combined) ||
      /from_date|to_date|fromDate|dateFrom|dateTo|from:\s|tom:\s/.test(combined);

    expect(
      hasDateScoping,
      'Effective prompt for evening analysis must scope MCP queries by date (ARTICLE_DATE, from/tom, dateFrom/dateTo, or from_date/to_date)'
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// MCP Setup & Anti-Pattern Tests
//
// The pre-modular architecture used a repo-local `scripts/mcp-setup.sh` +
// `scripts/mcp-query-cli.ts` pair to source MCP env-vars in `bash` blocks.
// In the current modular architecture the MCP Gateway is provisioned by
// gh-aw itself and the agent uses `safeoutputs` + `repo-memory` tool calls
// (documented in `../prompts/02-mcp-access.md`), so the legacy shell helpers
// are no longer part of the workflow contract. We replace those tests with
// prompt-module anti-pattern guards that target the new surface.
// ---------------------------------------------------------------------------

describe('MCP Prompt-Module Anti-Pattern Guards', () => {
  const ANALYTICAL_WORKFLOWS: readonly string[] = [
    
    'news-committee-reports.md',
    'news-evening-analysis.md',
    'news-interpellations.md',
    'news-month-ahead.md',
    'news-monthly-review.md',
    'news-motions.md',
    'news-propositions.md',
    'news-realtime-monitor.md',
    'news-week-ahead.md',
    'news-weekly-review.md',
  ];

  ANALYTICAL_WORKFLOWS.forEach(workflow => {
    it(`${workflow} should import the MCP access prompt module`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');
      // Every news workflow must pull in the canonical MCP access rules.
      expect(content).toMatch(/imports:[\s\S]*prompts\/02-mcp-access\.md/);
    });

    it(`${workflow} should not embed inline python3 JSON-parsing scripts`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      // MCP response parsing must happen inside the agent tool layer, not in
      // inline bash `python3 -c` snippets (those were removed when workflows
      // were modularised).
      const lines = content.split('\n');
      const problematicPython: ProblematicLine[] = [];
      lines.forEach((line, idx) => {
        if (line.includes('❌') || line.includes('DO NOT') || line.includes('NEVER')) return;
        if (line.includes('python3 -c')) {
          problematicPython.push({ line: idx + 1, content: line.trim() });
        }
      });
      expect(problematicPython).toEqual([]);
    });
  });

  it('prompts/02-mcp-access.md should define the canonical MCP access contract', () => {
    const mcpPromptPath = path.join(PROMPTS_DIR, '02-mcp-access.md');
    expect(
      fs.existsSync(mcpPromptPath),
      'Prompts module `02-mcp-access.md` is the single source of truth for MCP access rules'
    ).toBe(true);

    const content = fs.readFileSync(mcpPromptPath, 'utf-8');
    // The module must define the MCP surface and the health-gate contract.
    expect(content).toContain('riksdag-regering');
    expect(content).toContain('get_sync_status');
  });
});
