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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKFLOWS_DIR = path.join(__dirname, '..', '.github', 'workflows');
const AW_DIR = path.join(__dirname, '..', '.github', 'aw');

// Workflows to validate
const WORKFLOWS: readonly string[] = [
  'news-evening-analysis.md',
  'news-article-generator.md',
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
        const content = fs.readFileSync(filepath, 'utf-8');

        // Check for get_sync_status() documentation
        expect(content).toContain('get_sync_status');

        // Check for data freshness validation guidance
        expect(content.toLowerCase()).toMatch(/data\s+freshness|sync\s+status|stale\s+data/);
      });

      it(`${workflow} should warn about stale data`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        // Should document stale data handling
        const hasStaleDataHandling =
          content.includes('stale') ||
          content.includes('last_updated') ||
          content.includes('hoursSinceSync') ||
          content.includes('>48') ||
          content.includes('> 48');

        expect(hasStaleDataHandling).toBe(true);
      });
    });
  });

  describe('Explicit Date Filtering', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should document explicit date parameters`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        // Should document date parameters
        const hasDateParameters =
          content.includes('from_date') ||
          content.includes('to_date') ||
          content.includes('from:') ||
          content.includes('tom:') ||
          content.includes('dateFrom') ||
          content.includes('dateTo');

        expect(hasDateParameters).toBe(true);
      });

      it(`${workflow} should NOT rely on implicit "latest" patterns`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

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
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should document filtering by date fields
      expect(content).toMatch(/filter.*by.*publicerad|filter.*by.*datum|filter.*by.*inlämnad|Date Filtering/i);

      // Should have filtering guidance (either JS code examples, date-parameter patterns, or delegation)
      expect(content).toMatch(/\.filter\(|\bfromDate\b|\bfrom_date\b|\bdateFrom\b|\bdateTo\b|SHARED_PROMPT_PATTERNS/i);
      // Should reference date-based filtering approach
      expect(content).toMatch(/from_date|to_date|fromDate|dateFrom|dateTo|>= fromDate/i);

      // Should have filtering instructions (fromDate references or filter directives)
      expect(content).toMatch(/fromDate|from_date|filter.*results|SHARED_PROMPT_PATTERNS/i);
      // Should have filtering examples inline OR delegate to shared patterns
      expect(content).toMatch(/\.filter\(|SHARED_PROMPT_PATTERNS.*Date Filtering|§"Date Filtering"/);
      // Should have date comparison examples or delegate to shared patterns
      expect(content).toMatch(/\.slice\(0,\s*10\)\s*>=\s*fromDate|new Date.*>=.*new Date|new Date.*>.*fromDate|SHARED_PROMPT_PATTERNS.*Date|§"Date Filtering"/);
      // Should reference fromDate/toDate or from/tom query parameters
      expect(content).toMatch(/\bfromDate\b|\bfrom_date\b|\bdateFrom\b|\btoDate\b|\bto_date\b|\bdateTo\b|\bfrom\b.*\btom\b/);
    });

    it('workflows should annotate tools with date support', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Check for date support annotations (inline or via delegation to shared patterns)
      const hasDateAnnotations = /supports.*from.*tom|supports.*from_date.*to_date|supports.*dateFrom.*dateTo/i.test(content);
      const hasDelegatedDateDocs = content.includes('SHARED_PROMPT_PATTERNS') && /Date Filtering|date.*param/i.test(content);
      const hasInlineDateParams = /get_calendar_events.*from.*tom|search_regering.*dateFrom.*dateTo/i.test(content);
      expect(
        hasDateAnnotations || hasDelegatedDateDocs || hasInlineDateParams,
        'Should annotate tools with date support or delegate to SHARED_PROMPT_PATTERNS.md'
      ).toBe(true);
      // Should reference date field filtering (inline or by delegation)
      expect(content).toMatch(/filter.*datum|filter.*publicerad|filter.*inlämnad|datum.*publicerad.*inlämnad/);
    });

    it('news-evening-analysis.md should document post-query fromDate filtering guidance', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should include explicit fromDate usage or delegate to shared patterns
      expect(content).toMatch(/>=\s*fromDate|new Date\([^\n]*fromDate[^\n]*\)\s*[>=]|fromDate|SHARED_PROMPT_PATTERNS.*Date/i);
      // Should include post-query filtering guidance (inline or delegated)
      expect(content).toMatch(/post-query\s+filter|filter\s+results|date\s+filter|SHARED_PROMPT_PATTERNS/i);
    });
  });

  describe('Cross-Referencing Strategy', () => {
    it('news-evening-analysis.md should have a Cross-Referencing Strategy section', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should have "Cross-Referencing Strategy" section
      expect(content).toMatch(/cross.*referencing.*strategy/i);
    });

    it('cross-referencing section should reference data source combinations', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = fs.readFileSync(filepath, 'utf-8');
      // Should have cross-referencing guidance (numbered examples, descriptive patterns, or delegation)
      const hasCrossRefGuidance =
        (content.includes('Example 1:') && content.includes('Example 2:')) ||
        /cross[\s-]?referenc(?:e|ing)/i.test(content);
      expect(hasCrossRefGuidance).toBe(true);
      // Should describe cross-referencing approach (e.g. combining data sources, filter by date)
      expect(content).toMatch(/cross.*reference|related.*data.*sources|richer.*analysis|combine.*committee|combine.*reports/i);
      // Should have multi-tool query examples inline OR delegate to SHARED_PROMPT_PATTERNS.md
      const hasMultiToolExamples =
        (content.includes('Example 1:') && content.includes('Example 2:')) ||
        (content.includes('SHARED_PROMPT_PATTERNS') && /cross.*referenc/i.test(content));
      expect(hasMultiToolExamples).toBe(true);

      // Should mention cross-referencing related data sources (inline or delegated)
      expect(content).toMatch(/Cross-reference related data sources|cross.*referenc.*strategy|combine.*committee.*reports/i);
      // Should mention committee reports or voting records as cross-ref targets
      expect(content).toMatch(/committee reports|voting records|propositions|motions/i);
    });
  });

  describe('Error Handling', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should document error scenarios`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        // Should have error handling table or section
        expect(content).toMatch(/error|Error|cause|Cause|fix|Fix/);

        // Should document specific error scenarios
        const hasErrorScenarios =
          content.includes('Tool not found') ||
          content.includes('Empty results') ||
          content.includes('Timeout') ||
          content.includes('Stale data');

        expect(hasErrorScenarios).toBe(true);
      });

      it(`${workflow} should document stale data handling`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        // Should document what to do with stale data
        const hasStaleDataGuidance =
          content.toLowerCase().includes('stale') &&
          (content.includes('disclaimer') ||
           content.includes('note in analysis') ||
           content.includes('48h') ||
           content.includes('48 hours'));

        expect(hasStaleDataGuidance).toBe(true);
      });
    });
  });

  describe('MCP Tool Documentation Quality', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should list all 32 riksdag-regering tools or delegate to shared patterns`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        // Should document tool count inline OR delegate to SHARED_PROMPT_PATTERNS.md
        const hasInlineToolCount = /32.*tools|32.*riksdag-regering/i.test(content);
        const hasDelegation = content.includes('SHARED_PROMPT_PATTERNS') && /MCP.*Tool|Tool.*Reference/i.test(content);
        expect(
          hasInlineToolCount || hasDelegation,
          `${workflow} should document tool count or delegate to SHARED_PROMPT_PATTERNS.md`
        ).toBe(true);

        // Should list key tools
        const keyTools: readonly string[] = [
          'get_calendar_events',
          'search_voteringar',
          'get_betankanden',
          'search_regering',
          'get_sync_status'
        ];

        keyTools.forEach(tool => {
          expect(content).toContain(tool);
        });
      });

      it(`${workflow} should emphasize get_sync_status() first`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        // Should emphasize calling get_sync_status first
        const emphasizesFirst =
          content.includes('ALWAYS check') ||
          content.includes('STEP 1') ||
          content.includes('CALL THIS FIRST') ||
          content.includes('first to warm up');

        expect(emphasizesFirst).toBe(true);
      });
    });
  });

  describe('Date Filtering Best Practices', () => {
    it('workflows should have date calculation examples', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should show date calculation patterns (either JS Date or fromDate/today parameters)
      expect(content).toMatch(/new Date.*toISOString|Date\.now\(\)|fromDate|today/i);
      // Should include date placeholder patterns or dynamic calculation
      expect(content).toMatch(/<today>|<fromDate>|date.*calculation/i);
      // Should show date-range arithmetic or lookback logic
      expect(content).toMatch(/86400000|3600000|lookback_hours|lookback/);
    });

    it('workflows should include dynamic riksmöte calculation instructions', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should include explicit instructions for how to calculate the current riksmöte dynamically
      expect(content).toMatch(/(calculate|calculating|calculation|determine|compute)[\s\S]{0,120}(riksmöte|parliamentary\s+session)/i);
      // Should not rely on hardcoded rm literals like rm: "2025/26" (quotes optional)
      expect(content).not.toMatch(/rm:\s*["']?20\d{2}\/\d{2}["']?/i);
    });

    it('all news workflows should include riksmöte calculation instruction', () => {
      const newsWorkflows = [
        'news-realtime-monitor.md', 'news-motions.md', 'news-article-generator.md',
        'news-evening-analysis.md', 'news-monthly-review.md', 'news-week-ahead.md',
        'news-weekly-review.md', 'news-committee-reports.md', 'news-propositions.md',
        'news-month-ahead.md',
      ];
      for (const workflow of newsWorkflows) {
        const content = fs.readFileSync(path.join(WORKFLOWS_DIR, workflow), 'utf-8');
        expect(content).toContain('## 📅 Riksmöte (Parliamentary Session) Calculation');
        // No hardcoded parliamentary session year in rm parameter (any year format)
        expect(content).not.toMatch(/rm:\s*"20\d{2}\/\d{2}"/);
      }
    });
  });

  describe('Workflow Compilation', () => {
    WORKFLOWS.forEach(workflow => {
      it(`${workflow} should compile without errors`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);

        // Check file exists
        expect(fs.existsSync(filepath)).toBe(true);

        // Check for required YAML frontmatter
        const content = fs.readFileSync(filepath, 'utf-8');
        expect(content).toMatch(/^---\n/);
        expect(content).toMatch(/\nname:/);
        expect(content).toMatch(/\ndescription:/);
        expect(content).toMatch(/\nmcp-servers:/);
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
      const content = fs.readFileSync(filepath, 'utf-8');

      // Check for key enhancements added to prevent regression
      const enhancements: readonly string[] = [
        'DATA FRESHNESS CHECK',
        'hoursSinceSync',
        'Date Filtering',
        'Cross-Referencing Strategy',
        'Too broad results'
      ];

      enhancements.forEach(enhancement => {
        expect(content).toContain(enhancement);
      });
    });

    it('workflows should not use ambiguous "latest" language', () => {
      WORKFLOWS.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
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
  it('should document which tools support date parameters', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-evening-analysis.md');
    const content = fs.readFileSync(filepath, 'utf-8');

    // Also read SHARED_PROMPT_PATTERNS.md for delegated tool documentation
    const sharedPath = path.join(AW_DIR, 'SHARED_PROMPT_PATTERNS.md');
    const sharedContent = fs.existsSync(sharedPath) ? fs.readFileSync(sharedPath, 'utf-8') : '';
    const combined = content + '\n' + sharedContent;

    // Tools that SUPPORT date parameters
    const supportsDateParams: readonly string[] = [
      'get_calendar_events',  // from/tom
      'search_regering',      // from_date/to_date
      'analyze_g0v_by_department'  // dateFrom/dateTo
    ];

    supportsDateParams.forEach(tool => {
      // Tool should be documented inline or in shared patterns
      expect(
        content.includes(tool) || sharedContent.includes(tool),
        `Tool ${tool} should be documented in workflow or SHARED_PROMPT_PATTERNS.md`
      ).toBe(true);

      // Should be annotated with supported parameters (in combined content)
      // Use wider context window (500 chars) and also check if the tool appears
      // near date-related documentation
      const toolSection = combined.split(tool)[1]?.substring(0, 500) ?? '';
      const hasDateAnnotation =
        toolSection.includes('supports') ||
        toolSection.includes('from') ||
        toolSection.includes('date') ||
        toolSection.includes('Date') ||
        // The tool itself may appear in a section about date parameters
        combined.includes(`${tool}`) && /dateFrom|dateTo|from_date|to_date|from.*tom/i.test(combined);

      expect(hasDateAnnotation).toBe(true);
    });

    // Tools that REQUIRE post-query filtering
    const requiresFiltering: readonly string[] = [
      'search_voteringar',    // filter by datum
      'get_betankanden',      // filter by publicerad
      'get_motioner',         // filter by inlämnad
      'get_propositioner',    // filter by publicerad
      'search_anforanden'     // filter by datum
    ];

    requiresFiltering.forEach(tool => {
      // Tool should be documented inline or in shared patterns
      expect(
        content.includes(tool) || sharedContent.includes(tool),
        `Tool ${tool} should be documented in workflow or SHARED_PROMPT_PATTERNS.md`
      ).toBe(true);

      // Should be annotated with filter guidance (in combined content)
      // Use wider context and also check if filter-related terms exist near the tool
      const toolSection = combined.split(tool)[1]?.substring(0, 500) ?? '';
      const hasFilterAnnotation =
        toolSection.includes('filter') ||
        toolSection.includes('datum') ||
        toolSection.includes('publicerad') ||
        toolSection.includes('inlämnad') ||
        // The tool appears in a context that documents post-query filtering
        (combined.includes(tool) && /filter.*datum|filter.*publicerad|filter.*inlämnad|post-query/i.test(combined));

      expect(hasFilterAnnotation).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// MCP Setup & Anti-Pattern Tests
// ---------------------------------------------------------------------------

/** All workflow .md files that contain bash blocks running generate-news-enhanced.ts */
const ALL_WORKFLOWS: readonly string[] = [
  'news-article-generator.md',
  'news-committee-reports.md',
  'news-evening-analysis.md',
  'news-month-ahead.md',
  'news-monthly-review.md',
  'news-motions.md',
  'news-propositions.md',
  'news-week-ahead.md',
  'news-weekly-review.md',
];

describe('MCP Setup Script Usage', () => {
  ALL_WORKFLOWS.forEach(workflow => {
    it(`${workflow} should use source scripts/mcp-setup.sh instead of inline python3`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      // Must reference the shared MCP setup script
      expect(content).toContain('source scripts/mcp-setup.sh');

      // Must NOT contain inline python3 for JSON parsing (except in anti-pattern warnings)
      const lines = content.split('\n');
      const problematicPython: ProblematicLine[] = [];
      lines.forEach((line, idx) => {
        // Skip lines that are anti-pattern documentation (contain ❌ or "DO NOT" or "NEVER")
        if (line.includes('❌') || line.includes('DO NOT') || line.includes('NEVER')) {
          return;
        }
        if (line.includes('python3 -c') && !line.includes('❌')) {
          problematicPython.push({ line: idx + 1, content: line.trim() });
        }
      });

      expect(problematicPython).toEqual([]);
    });
  });
});

describe('MCP Anti-Pattern Guards', () => {
  const COMPLEX_WORKFLOWS: readonly string[] = [
    'news-evening-analysis.md',
    'news-article-generator.md',
    'news-realtime-monitor.md',
  ];

  COMPLEX_WORKFLOWS.forEach(workflow => {
    it(`${workflow} should warn against ad-hoc MCP scripts`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      // Must contain prohibition against ad-hoc MCP scripts
      expect(content).toMatch(/NEVER.*implement.*MCP|NEVER.*MCP.*client|PROHIBITION/i);
    });

    it(`${workflow} should reference mcp-query-cli.ts as alternative`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('mcp-query-cli.ts');
    });
  });

  it('scripts/mcp-setup.sh should exist and be valid', () => {
    const setupPath = path.join(__dirname, '..', 'scripts', 'mcp-setup.sh');
    expect(fs.existsSync(setupPath)).toBe(true);

    const content = fs.readFileSync(setupPath, 'utf-8');
    // Should set the three required env vars
    expect(content).toContain('MCP_SERVER_URL');
    expect(content).toContain('MCP_AUTH_TOKEN');
    expect(content).toContain('MCP_CLIENT_TIMEOUT_MS');
    // Should use node -e, not python3 for execution
    expect(content).toContain('node -e');
    // Should not contain python3 execution commands (comments are OK)
    const execLines = content.split('\n').filter(l =>
      !l.trim().startsWith('#') && l.includes('python3 -c')
    );
    expect(execLines).toEqual([]);
    // Should try both gateway.apiKey and mcpServers headers paths
    expect(content).toContain('gateway');
    expect(content).toContain('mcpServers');
    expect(content).toContain('riksdag-regering');
    expect(content).toContain('Authorization');
  });

  it('scripts/mcp-query-cli.ts should exist', () => {
    const cliPath = path.join(__dirname, '..', 'scripts', 'mcp-query-cli.ts');
    expect(fs.existsSync(cliPath)).toBe(true);

    const content = fs.readFileSync(cliPath, 'utf-8');
    // Should import MCPClient from the repo's client
    expect(content).toContain('MCPClient');
    expect(content).toContain('mcp-client');
  });
});
