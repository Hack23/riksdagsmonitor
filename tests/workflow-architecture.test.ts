/**
 * Workflow Architecture Tests
 * 
 * Validates the agentic workflow architecture including:
 * - Each article type has its own workflow with unique schedule
 * - No schedule overlaps between article type workflows
 * - All valid article types have corresponding workflows
 * - Multi-type generator has no schedule (manual only)
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

/** All article types that should have dedicated workflows */
const ARTICLE_TYPE_WORKFLOWS: Record<string, string> = {
  'committee-reports': 'news-committee-reports.md',
  'propositions': 'news-propositions.md',
  'motions': 'news-motions.md',
  'interpellations': 'news-interpellations.md',
  'week-ahead': 'news-week-ahead.md',
  'month-ahead': 'news-month-ahead.md',
  'weekly-review': 'news-weekly-review.md',
  'monthly-review': 'news-monthly-review.md'
};

/** Parse cron schedule from workflow frontmatter */
function extractCronSchedule(content: string): string | null {
  const cronMatch = content.match(/cron:\s*"([^"]+)"/);
  return cronMatch ? (cronMatch[1] ?? null) : null;
}

/** Parse frontmatter from .md workflow file */
function parseFrontmatter(filepath: string): string {
  const content = fs.readFileSync(filepath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  return fmMatch ? fmMatch[1]! : '';
}

describe('Workflow Architecture', () => {
  it('should have dedicated workflow files for all article types', () => {
    for (const [articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(
        fs.existsSync(filepath),
        `Missing workflow for article type "${articleType}": ${workflowFile}`
      ).toBe(true);
    }
  });

  it('should have unique cron schedules for each article type workflow', () => {
    const schedules = new Map<string, string>();

    for (const [articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      const cron = extractCronSchedule(content);

      if (cron) {
        const existing = schedules.get(cron);
        expect(
          existing,
          `Schedule conflict: "${articleType}" and "${existing}" both use cron "${cron}"`
        ).toBeUndefined();
        schedules.set(cron, articleType);
      }
    }

    // Should have at least 5 unique schedules
    expect(schedules.size).toBeGreaterThanOrEqual(5);
  });

  it('should not have schedule on multi-type generator', () => {
    const generatorPath = path.join(WORKFLOWS_DIR, 'news-article-generator.md');
    expect(fs.existsSync(generatorPath), 'generate-news-enhanced.ts should exist').toBe(true);

    const frontmatter = parseFrontmatter(generatorPath);
    // The multi-type generator should use workflow_dispatch only, not schedule
    expect(frontmatter).not.toContain('schedule: daily');
    expect(frontmatter).not.toContain('cron:');
  });

  it('should have single article type focus in each dedicated workflow', () => {
    for (const [articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');

      // Should mention single type focus
      expect(
        content.toLowerCase().includes('single article type') ||
        content.toLowerCase().includes(`only \`${articleType}\``) ||
        content.toLowerCase().includes(`only "${articleType}"`),
        `Workflow ${workflowFile} should emphasize single article type focus`
      ).toBe(true);
    }
  });

  it('should have workflow_dispatch trigger on all article type workflows', () => {
    for (const [_articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('workflow_dispatch'),
        `Workflow ${workflowFile} should support manual dispatch`
      ).toBe(true);
    }
  });

  it('should have schedule trigger on all article type workflows', () => {
    for (const [_articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const frontmatter = parseFrontmatter(filepath);
      const hasCron = frontmatter.includes('cron:');
      expect(
        hasCron,
        `Workflow ${workflowFile} should have a cron schedule`
      ).toBe(true);
    }
  });

  it('should use safe-outputs in all article type workflows', () => {
    for (const [_articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('safe-outputs') || content.includes('safeoutputs'),
        `Workflow ${workflowFile} should use safe-outputs for PR creation`
      ).toBe(true);
    }
  });

  it('should have safe PR creation how-to in all workflows', () => {
    const allWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md'
    ];

    for (const workflowFile of allWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(
        fs.existsSync(filepath),
        `Workflow ${workflowFile} should exist on disk`
      ).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      const hasDoNotGitPush = /DO\s+NOT[\s\S]{0,80}`git push`/i.test(content);
      expect(
        hasDoNotGitPush,
        `Workflow ${workflowFile} should have explicit DO NOT git push instruction`
      ).toBe(true);
      expect(
        content.includes('safeoutputs___create_pull_request'),
        `Workflow ${workflowFile} should reference safeoutputs___create_pull_request`
      ).toBe(true);
      expect(
        content.includes('git add') && content.includes('git commit'),
        `Workflow ${workflowFile} should document git add + git commit before safe PR creation`
      ).toBe(true);
      expect(
        content.includes('HOW SAFE PR CREATION WORKS'),
        `Workflow ${workflowFile} should include the standardized HOW SAFE PR CREATION WORKS header block`
      ).toBe(true);
    }
  });

  it('should have least privilege permissions on all workflows', () => {
    for (const [_articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('contents: read'),
        `Workflow ${workflowFile} should have contents: read permission (least privilege)`
      ).toBe(true);
    }
  });
});

describe('Translation Workflow Architecture', () => {
  const TRANSLATE_WORKFLOW = 'news-translate.md';

  it('should have a dedicated translation workflow', () => {
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(
      fs.existsSync(filepath),
      'Missing dedicated translation workflow: news-translate.md'
    ).toBe(true);
  });

  it('translation workflow should have workflow_dispatch trigger', () => {
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('workflow_dispatch');
  });

  it('translation workflow should have schedule trigger for catch-up', () => {
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('cron:');
  });

  it('translation workflow should have concurrency.job-discriminator', () => {
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('job-discriminator');
  });

  it('translation workflow should support article_date and article_type inputs', () => {
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('article_date');
    expect(content).toContain('article_type');
  });

  it('translation workflow should contain canonical translation quality rules', () => {
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('MANDATORY Translation Quality Rules');
    expect(content).toContain('RTL languages');
    expect(content).toContain('CJK languages');
    expect(content).toContain('CONTENT_LABELS');
  });

  it('translation workflow should have safe-outputs with create-pull-request', () => {
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('safe-outputs');
    expect(content).toContain('create-pull-request');
  });

  it('translation workflow should have contents: read permission', () => {
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('contents: read');
  });

  it('content workflows should default to core languages (en,sv)', () => {
    const contentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md'
    ];

    for (const workflowFile of contentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('default: en,sv'),
        `Workflow ${workflowFile} should default to en,sv for core content generation`
      ).toBe(true);
    }
  });

  it('content workflows should have dispatch-workflow safe-output for news-translate', () => {
    const contentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-article-generator.md',
      'news-evening-analysis.md',
      'news-realtime-monitor.md'
    ];

    for (const workflowFile of contentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('dispatch-workflow'),
        `Workflow ${workflowFile} should have dispatch-workflow safe-output`
      ).toBe(true);
      expect(
        content.includes('news-translate'),
        `Workflow ${workflowFile} should reference news-translate in dispatch-workflow`
      ).toBe(true);
    }
  });
});

describe('Schedule Staggering', () => {
  it('should stagger weekday workflows across different hours', () => {
    const weekdaySchedules: Array<{ file: string; hour: number }> = [];

    const weekdayWorkflows = ['news-committee-reports.md', 'news-propositions.md', 'news-motions.md', 'news-interpellations.md'];

    for (const workflowFile of weekdayWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      const cron = extractCronSchedule(content);
      if (cron) {
        const hourMatch = cron.match(/^\d+\s+(\d+)/);
        if (hourMatch) {
          weekdaySchedules.push({ file: workflowFile, hour: parseInt(hourMatch[1]!, 10) });
        }
      }
    }

    // All weekday workflows should have different hours
    const hours = weekdaySchedules.map(s => s.hour);
    const uniqueHours = new Set(hours);
    expect(uniqueHours.size).toBe(hours.length);
  });

  it('should run weekend workflows on different days', () => {
    const weekendWorkflows: Array<{ file: string; dayOfWeek: string }> = [];

    const weekendFiles = ['news-week-ahead.md', 'news-weekly-review.md'];

    for (const workflowFile of weekendFiles) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      const cron = extractCronSchedule(content);
      if (cron) {
        const parts = cron.split(/\s+/);
        weekendWorkflows.push({ file: workflowFile, dayOfWeek: parts[4] ?? '' });
      }
    }

    // Week-ahead (Friday) and Weekly-review (Saturday) should be different days
    if (weekendWorkflows.length >= 2) {
      expect(weekendWorkflows[0]!.dayOfWeek).not.toBe(weekendWorkflows[1]!.dayOfWeek);
    }
  });

  it('should run monthly workflows on different days of month', () => {
    const monthlyWorkflows: Array<{ file: string; dayOfMonth: string }> = [];

    const monthlyFiles = ['news-month-ahead.md', 'news-monthly-review.md'];

    for (const workflowFile of monthlyFiles) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      const cron = extractCronSchedule(content);
      if (cron) {
        const parts = cron.split(/\s+/);
        monthlyWorkflows.push({ file: workflowFile, dayOfMonth: parts[2] ?? '' });
      }
    }

    // Month-ahead (1st) and Monthly-review (28th) should be different days
    if (monthlyWorkflows.length >= 2) {
      expect(monthlyWorkflows[0]!.dayOfMonth).not.toBe(monthlyWorkflows[1]!.dayOfMonth);
    }
  });
});

describe('Article Type Completeness', () => {
  it('should have all valid article types in generate-news-enhanced.ts', () => {
    const generatorPath = path.join(__dirname, '..', 'scripts', 'generate-news-enhanced.ts');
    const content = fs.readFileSync(generatorPath, 'utf-8');

    const expectedTypes = [
      'week-ahead', 'month-ahead', 'weekly-review', 'monthly-review',
      'committee-reports', 'propositions', 'motions', 'interpellations', 'breaking'
    ];

    for (const type of expectedTypes) {
      expect(
        content.includes(`'${type}'`),
        `VALID_ARTICLE_TYPES should include '${type}'`
      ).toBe(true);
    }
  });

  it('should have all article types in ArticleType union', () => {
    const typesPath = path.join(__dirname, '..', 'scripts', 'types', 'article.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');

    const expectedTypes = [
      'week-ahead', 'month-ahead', 'weekly-review', 'monthly-review',
      'committee-reports', 'propositions', 'motions', 'interpellations', 'breaking'
    ];

    for (const type of expectedTypes) {
      expect(
        content.includes(`'${type}'`),
        `ArticleType should include '${type}'`
      ).toBe(true);
    }
  });

  it('should have matching news-type modules for new article types', () => {
    const newsTypesDir = path.join(__dirname, '..', 'scripts', 'news-types');

    const requiredModules = [
      'month-ahead.ts',
      'weekly-review.ts',
      'monthly-review.ts'
    ];

    for (const module of requiredModules) {
      const filepath = path.join(newsTypesDir, module);
      expect(
        fs.existsSync(filepath),
        `Missing news-type module: ${module}`
      ).toBe(true);
    }
  });
});

describe('Editorial Framework', () => {
  it('should have editorial-framework.ts with article type profiles', () => {
    const frameworkPath = path.join(__dirname, '..', 'scripts', 'editorial-framework.ts');
    expect(
      fs.existsSync(frameworkPath),
      'Missing scripts/editorial-framework.ts'
    ).toBe(true);
  });

  it('editorial framework should define profiles for all article types', async () => {
    const { ARTICLE_TYPE_PROFILES } = await import('../scripts/editorial-framework.js');
    const profileKeys = Object.keys(ARTICLE_TYPE_PROFILES);

    const requiredTypes = [
      'committee-reports', 'propositions', 'motions', 'interpellations',
      'week-ahead', 'month-ahead', 'weekly-review', 'monthly-review',
      'evening-analysis', 'breaking', 'deep-inspection'
    ];
    for (const type of requiredTypes) {
      expect(
        profileKeys.includes(type),
        `ARTICLE_TYPE_PROFILES should include profile for '${type}'`
      ).toBe(true);
    }
  });
});

describe('Shared Prompts Library Integration', () => {
  const PROMPTS_DIR = path.join(__dirname, '..', 'scripts', 'prompts', 'v1');

  it('should have all required prompt files', () => {
    const requiredFiles = [
      'political-analysis.md',
      'swot-generation.md',
      'dashboard-generation.md',
      'stakeholder-perspectives.md',
      'quality-criteria.md',
    ];
    for (const file of requiredFiles) {
      expect(
        fs.existsSync(path.join(PROMPTS_DIR, file)),
        `Missing required prompt: scripts/prompts/v1/${file}`
      ).toBe(true);
    }
  });

  it('editorial framework should define AnalysisDepth type with standard, deep, comprehensive', () => {
    const frameworkPath = path.join(__dirname, '..', 'scripts', 'editorial-framework.ts');
    if (!fs.existsSync(frameworkPath)) return;
    const content = fs.readFileSync(frameworkPath, 'utf-8');
    expect(content).toContain("'standard'");
    expect(content).toContain("'deep'");
    expect(content).toContain("'comprehensive'");
    expect(content).toContain('AnalysisDepth');
  });

  it('editorial framework should specify quality thresholds', () => {
    const frameworkPath = path.join(__dirname, '..', 'scripts', 'editorial-framework.ts');
    if (!fs.existsSync(frameworkPath)) return;
    const content = fs.readFileSync(frameworkPath, 'utf-8');
    expect(content).toContain('minWordCount');
    expect(content).toContain('minQualityScore');
    expect(content).toContain('aiIterations');
  });

  it('editorial framework should require SWOT, dashboard, mindmap for deep article types', () => {
    const frameworkPath = path.join(__dirname, '..', 'scripts', 'editorial-framework.ts');
    if (!fs.existsSync(frameworkPath)) return;
    const content = fs.readFileSync(frameworkPath, 'utf-8');
    expect(content).toContain('swot:');
    expect(content).toContain('dashboard:');
    expect(content).toContain('mindmap:');
    expect(content).toContain('minStakeholders:');
  });
});

describe('Unified Required Skills', () => {
  const ALL_NEWS_WORKFLOWS = [
    ...Object.values(ARTICLE_TYPE_WORKFLOWS),
    'news-evening-analysis.md',
    'news-realtime-monitor.md',
    'news-article-generator.md',
    'news-translate.md'
  ];

  const REQUIRED_SKILLS = [
    'editorial-standards/SKILL.md',
    'swedish-political-system/SKILL.md',
    'legislative-monitoring/SKILL.md',
    'riksdag-regering-mcp/SKILL.md',
    'language-expertise/SKILL.md',
    'gh-aw-safe-outputs/SKILL.md',
  ];

  it('all news workflows should reference the 6 required skills', () => {
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      for (const skill of REQUIRED_SKILLS) {
        expect(
          content.includes(skill),
          `Workflow ${workflowFile} should reference required skill: ${skill}`
        ).toBe(true);
      }
    }
  });

  it('all news workflows should list skills in the same order', () => {
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      // Find the positions of each skill in the file
      const positions = REQUIRED_SKILLS.map(skill => content.indexOf(skill));
      // All skills must be found (position >= 0)
      for (let i = 0; i < REQUIRED_SKILLS.length; i++) {
        expect(
          positions[i],
          `Workflow ${workflowFile} should contain skill: ${REQUIRED_SKILLS[i]}`
        ).toBeGreaterThanOrEqual(0);
      }
      // Skills should appear in ascending order (same order across all files)
      for (let i = 1; i < positions.length; i++) {
        expect(
          positions[i]! > positions[i - 1]!,
          `Workflow ${workflowFile}: skill "${REQUIRED_SKILLS[i]}" should appear after "${REQUIRED_SKILLS[i - 1]}"`
        ).toBe(true);
      }
    }
  });

  it('all news workflows should have standardised analysis depth table', () => {
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('Standardised Analysis Depth Gate'),
        `Workflow ${workflowFile} should have Standardised Analysis Depth Gate table`
      ).toBe(true);
      expect(
        content.includes('| standard | 1-2') && content.includes('| deep | 2-3') && content.includes('| comprehensive | 3+'),
        `Workflow ${workflowFile} should have identical analysis depth rows (standard, deep, comprehensive)`
      ).toBe(true);
    }
  });
});

describe('Playwright Validation in Content Workflows', () => {
  const CONTENT_WORKFLOWS = Object.values(ARTICLE_TYPE_WORKFLOWS);
  const PLAYWRIGHT_VALIDATOR_PATH = 'scripts/validate-articles-playwright.ts';

  it('all article type workflows should have Playwright validation step', () => {
    const validatorPath = path.join(__dirname, '..', PLAYWRIGHT_VALIDATOR_PATH);
    expect(
      fs.existsSync(validatorPath),
      `Playwright validator should exist at ${PLAYWRIGHT_VALIDATOR_PATH}`
    ).toBe(true);

    for (const workflowFile of CONTENT_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes(`playwright test ${PLAYWRIGHT_VALIDATOR_PATH}`),
        `Workflow ${workflowFile} should reference the Playwright validator path: ${PLAYWRIGHT_VALIDATOR_PATH}`
      ).toBe(true);
    }
  });

  it('all article type workflows should have cross-reference validation step', () => {
    for (const workflowFile of CONTENT_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('validate-cross-references'),
        `Workflow ${workflowFile} should reference validate-cross-references for JSON-LD validation`
      ).toBe(true);
    }
  });
});

describe('Interpellations Minister-Response Cross-Reference', () => {
  it('should have minister-response cross-reference logic with at least 4 analysis steps', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-interpellations.md');
    expect(fs.existsSync(filepath), 'news-interpellations.md should exist').toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(
      content.includes('Cross-Reference Minister Responses'),
      'news-interpellations.md should have minister-response cross-reference section'
    ).toBe(true);
    // Verify at least 4 numbered analysis steps
    const crossRefSection = content.slice(content.indexOf('Cross-Reference Minister Responses'));
    const numberedSteps = crossRefSection.match(/^\d+\.\s+\*\*/gm);
    expect(
      numberedSteps && numberedSteps.length >= 4,
      `news-interpellations.md should have ≥4 minister-response analysis steps (found ${numberedSteps?.length ?? 0})`
    ).toBe(true);
  });

  it('should reference search_anforanden for minister response lookup', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-interpellations.md');
    expect(fs.existsSync(filepath), 'news-interpellations.md should exist').toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    const crossRefSection = content.slice(content.indexOf('Cross-Reference Minister Responses'));
    expect(
      crossRefSection.includes('search_anforanden'),
      'Minister-response cross-reference should use search_anforanden for fetching responses'
    ).toBe(true);
  });
});

describe('Shared Prompt Patterns Reference', () => {
  it('should have SHARED_PROMPT_PATTERNS.md reference document', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'SHARED_PROMPT_PATTERNS.md');
    expect(
      fs.existsSync(filepath),
      'Missing .github/workflows/SHARED_PROMPT_PATTERNS.md reference document'
    ).toBe(true);
  });

  it('SHARED_PROMPT_PATTERNS.md should list all 6 required skills', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'SHARED_PROMPT_PATTERNS.md');
    if (!fs.existsSync(filepath)) return;
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('editorial-standards');
    expect(content).toContain('swedish-political-system');
    expect(content).toContain('legislative-monitoring');
    expect(content).toContain('riksdag-regering-mcp');
    expect(content).toContain('language-expertise');
    expect(content).toContain('gh-aw-safe-outputs');
  });
});

describe('Analysis Depth Input', () => {
  const ALL_NEWS_WORKFLOWS = [
    ...Object.values(ARTICLE_TYPE_WORKFLOWS),
    'news-evening-analysis.md',
    'news-realtime-monitor.md',
    'news-article-generator.md',
    'news-translate.md'
  ];

  it('all news workflows should have analysis_depth under workflow_dispatch inputs', () => {
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      // Reuse the existing parseFrontmatter helper
      const frontmatter = parseFrontmatter(filepath);
      // Verify analysis_depth appears after workflow_dispatch: → inputs: (proper nesting)
      const nestedUnderInputs = /workflow_dispatch:\s*\n\s+inputs:[\s\S]*?analysis_depth:/.test(frontmatter);
      expect(
        nestedUnderInputs,
        `Workflow ${workflowFile} should have analysis_depth nested under workflow_dispatch.inputs in frontmatter`
      ).toBe(true);
    }
  });

  it('dedicated article type workflows should default analysis_depth to a valid depth (standard, deep, or comprehensive) in frontmatter', () => {
    for (const workflowFile of Object.values(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      // Reuse the existing parseFrontmatter helper
      const frontmatter = parseFrontmatter(filepath);
      const depthBlock = frontmatter.match(/analysis_depth:[\s\S]*?default:\s*(standard|deep|comprehensive)/);
      expect(
        depthBlock !== null,
        `Workflow ${workflowFile} should have analysis_depth with valid default (standard, deep, or comprehensive) in frontmatter`
      ).toBe(true);
    }
  });

  it('should reference quality-criteria.md in all content workflows', () => {
    const contentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
    ];
    for (const workflowFile of contentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('quality-criteria.md'),
        `Workflow ${workflowFile} should reference scripts/prompts/v1/quality-criteria.md`
      ).toBe(true);
    }
  });

  it('should reference political-analysis.md in all content workflows', () => {
    const contentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
    ];
    for (const workflowFile of contentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('political-analysis.md'),
        `Workflow ${workflowFile} should reference scripts/prompts/v1/political-analysis.md`
      ).toBe(true);
    }
  });

  it('should reference stakeholder-perspectives.md in all content workflows', () => {
    const contentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
    ];
    for (const workflowFile of contentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('stakeholder-perspectives.md'),
        `Workflow ${workflowFile} should reference scripts/prompts/v1/stakeholder-perspectives.md`
      ).toBe(true);
    }
  });
});

describe('Iterative Analysis Protocol', () => {
  const ANALYTICAL_WORKFLOWS = [
    'news-interpellations.md',
    'news-motions.md',
    'news-committee-reports.md',
    'news-propositions.md',
  ];

  it('should have iterative analysis protocol in analytical workflows', () => {
    for (const workflowFile of ANALYTICAL_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('Iterative Analysis Protocol') &&
        content.includes('Iteration 1') &&
        content.includes('Maximum 3 iterations') &&
        /score\s*<\s*7/.test(content),
        `Workflow ${workflowFile} should include iterative analysis protocol with 'Iteration 1', 'Maximum 3 iterations', and 'score < 7' markers`
      ).toBe(true);
    }
  });

  it('all dedicated workflows should have multi-step AI analysis framework section', () => {
    for (const workflowFile of Object.values(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('Multi-Step AI Analysis Framework'),
        `Workflow ${workflowFile} should have a Multi-Step AI Analysis Framework section in the markdown body`
      ).toBe(true);
    }
  });

  it('should have maximum 3 iterations limit in iterative workflows', () => {
    for (const workflowFile of ANALYTICAL_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('3 iterations') || content.includes('Maximum 3'),
        `Workflow ${workflowFile} should specify maximum 3 iterations`
      ).toBe(true);
    }
  });

  it('all dedicated workflows should list analysis_depth in dispatch parameters section', () => {
    for (const workflowFile of Object.values(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('analysis_depth') && content.includes('github.event.inputs.analysis_depth'),
        `Workflow ${workflowFile} should list analysis_depth in dispatch parameters section`
      ).toBe(true);
    }
  });

  it('should have minimum quality score 7/10 in analytical workflows', () => {
    for (const workflowFile of ANALYTICAL_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('7/10'),
        `Workflow ${workflowFile} should specify minimum quality score of 7/10`
      ).toBe(true);
    }
  });
});

describe('Interpellations Generator', () => {
  it('should have a dedicated interpellations content generator', () => {
    const generatorPath = path.join(
      __dirname, '..', 'scripts', 'data-transformers', 'content-generators', 'interpellations.ts'
    );
    expect(
      fs.existsSync(generatorPath),
      'Missing dedicated interpellations.ts content generator'
    ).toBe(true);
  });

  it('interpellations generator should export generateInterpellationsContent', () => {
    const generatorPath = path.join(
      __dirname, '..', 'scripts', 'data-transformers', 'content-generators', 'interpellations.ts'
    );
    if (!fs.existsSync(generatorPath)) return;
    const content = fs.readFileSync(generatorPath, 'utf-8');
    expect(content).toContain('export function generateInterpellationsContent');
  });

  it('interpellations generator should not use motions headings', () => {
    const generatorPath = path.join(
      __dirname, '..', 'scripts', 'data-transformers', 'content-generators', 'interpellations.ts'
    );
    if (!fs.existsSync(generatorPath)) return;
    const content = fs.readFileSync(generatorPath, 'utf-8');
    // Must not import from motions.ts (it's its own module)
    expect(content).not.toContain("from './motions.js'");
    expect(content).not.toContain("from './motions'");
    // Must reference interpellations heading not oppMotions
    expect(content).not.toContain("'oppMotions'");
  });

  it('data-transformers index should route interpellations to dedicated generator', () => {
    const indexPath = path.join(__dirname, '..', 'scripts', 'data-transformers', 'index.ts');
    if (!fs.existsSync(indexPath)) return;
    const content = fs.readFileSync(indexPath, 'utf-8');
    // Both conditions must hold: interpellations case exists AND it calls the dedicated generator
    expect(
      content.includes("case 'interpellations'"),
      "data-transformers/index.ts should have a case for 'interpellations'"
    ).toBe(true);
    expect(
      content.includes('generateInterpellationsContent'),
      "data-transformers/index.ts should reference generateInterpellationsContent"
    ).toBe(true);
    // Verify the interpellations case does NOT fall through to motions
    // Scan forward from 'case interpellations' until the next case/default to verify the right generator
    const lines = content.split('\n');
    const interpIdx = lines.findIndex(l => l.includes("case 'interpellations'"));
    if (interpIdx >= 0) {
      // Collect lines from the case label to the next case/default boundary
      const caseBlock: string[] = [];
      for (let i = interpIdx; i < lines.length; i++) {
        if (i > interpIdx && /^\s*(case\s|default\s*:)/.test(lines[i])) break;
        caseBlock.push(lines[i]);
      }
      const caseContent = caseBlock.join('\n');
      expect(
        caseContent.includes('generateInterpellationsContent'),
        "case 'interpellations' should return generateInterpellationsContent (not fall through to motions)"
      ).toBe(true);
    }
  });

  it('content-generators barrel should export generateInterpellationsContent', () => {
    const barrelPath = path.join(
      __dirname, '..', 'scripts', 'data-transformers', 'content-generators.ts'
    );
    if (!fs.existsSync(barrelPath)) return;
    const content = fs.readFileSync(barrelPath, 'utf-8');
    expect(content).toContain('generateInterpellationsContent');
  });
});

describe('Realtime Monitor Enhancement', () => {
  const REALTIME_WORKFLOW = path.join(WORKFLOWS_DIR, 'news-realtime-monitor.md');

  it('should have breaking news severity classification', () => {
    expect(fs.existsSync(REALTIME_WORKFLOW), 'news-realtime-monitor.md should exist').toBe(true);
    const content = fs.readFileSync(REALTIME_WORKFLOW, 'utf-8');
    expect(content).toContain('HIGH');
    expect(content).toContain('MEDIUM');
    expect(content).toContain('LOW');
  });

  it('should reference quality-criteria.md', () => {
    expect(fs.existsSync(REALTIME_WORKFLOW), 'news-realtime-monitor.md should exist').toBe(true);
    const content = fs.readFileSync(REALTIME_WORKFLOW, 'utf-8');
    expect(content).toContain('quality-criteria.md');
  });

  it('should have AI-driven severity scoring logic', () => {
    expect(fs.existsSync(REALTIME_WORKFLOW), 'news-realtime-monitor.md should exist').toBe(true);
    const content = fs.readFileSync(REALTIME_WORKFLOW, 'utf-8');
    // Should have structured assessment with specific criteria
    expect(content).toContain('confidence motion');
    expect(content).toContain('fiscal');
  });
});

describe('Manual Article Generation Safety', () => {
  const MANUAL_GENERATION_WORKFLOWS = [
    'news-realtime-monitor.md',
    'news-article-generator.md',
    'news-evening-analysis.md',
  ];

  it('workflows with manual fallback should prohibit bash heredoc for file writing', () => {
    for (const workflowFile of MANUAL_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('NEVER use bash heredoc'),
        `Workflow ${workflowFile} should prohibit bash heredoc for article writing`
      ).toBe(true);
    }
  });

  it('workflows with manual fallback should recommend incremental printf for safe file writing', () => {
    for (const workflowFile of MANUAL_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes("printf '%s\\n'"),
        `Workflow ${workflowFile} should recommend incremental printf for safe file writing`
      ).toBe(true);
    }
  });
});

describe('Script-Based Article Generation Safety', () => {
  const SCRIPT_GENERATION_WORKFLOWS = [
    'news-interpellations.md',
    'news-propositions.md',
    'news-motions.md',
    'news-committee-reports.md',
  ];

  it('script-based workflows should prohibit python3 article generation', () => {
    for (const workflowFile of SCRIPT_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('NEVER use `python3`'),
        `Workflow ${workflowFile} should prohibit python3 for article generation`
      ).toBe(true);
    }
  });

  it('script-based workflows should prohibit manual HTML construction', () => {
    for (const workflowFile of SCRIPT_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('NEVER manually construct HTML'),
        `Workflow ${workflowFile} should prohibit manual HTML article construction`
      ).toBe(true);
    }
  });

  it('script-based workflows should require generate-news-enhanced.ts', () => {
    for (const workflowFile of SCRIPT_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('generate-news-enhanced.ts') && content.includes('Article Generation Safety'),
        `Workflow ${workflowFile} should require generate-news-enhanced.ts in Article Generation Safety section`
      ).toBe(true);
    }
  });
});

describe('File Ownership Contract', () => {
  const ALL_CONTENT_WORKFLOWS = [
    ...Object.values(ARTICLE_TYPE_WORKFLOWS),
    'news-evening-analysis.md',
    'news-realtime-monitor.md',
    'news-article-generator.md',
  ];

  it('all content workflows should have file ownership contract section', () => {
    for (const workflowFile of ALL_CONTENT_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('File Ownership Contract'),
        `Workflow ${workflowFile} should have a File Ownership Contract section`
      ).toBe(true);
    }
  });

  it('content workflows should reference validate-file-ownership.ts', () => {
    for (const workflowFile of ALL_CONTENT_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('validate-file-ownership.ts content'),
        `Workflow ${workflowFile} should reference validate-file-ownership.ts with content category`
      ).toBe(true);
    }
  });

  it('translation workflow should reference validate-file-ownership.ts with translation category', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.md');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(
      content.includes('validate-file-ownership.ts translation'),
      'Translation workflow should reference validate-file-ownership.ts with translation category'
    ).toBe(true);
  });

  it('translation workflow should have content-PR dependency check', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.md');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(
      content.includes('Content-PR Dependency Check'),
      'Translation workflow should have a Content-PR Dependency Check section'
    ).toBe(true);
    expect(
      content.includes('OPEN_CONTENT_PRS'),
      'Translation workflow should check for open content PRs'
    ).toBe(true);
  });

  it('validate-file-ownership.ts script should exist', () => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'validate-file-ownership.ts');
    expect(
      fs.existsSync(scriptPath),
      'scripts/validate-file-ownership.ts should exist'
    ).toBe(true);
  });

  it('validate-file-ownership.ts should export CONTENT_LANGS and TRANSLATION_LANGS', () => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'validate-file-ownership.ts');
    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('export const CONTENT_LANGS');
    expect(content).toContain('export const TRANSLATION_LANGS');
  });

  it('validate-file-ownership.ts should export validateFileList and validatePendingFileOwnership', () => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'validate-file-ownership.ts');
    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('export function validateFileList');
    expect(content).toContain('export function validatePendingFileOwnership');
  });
});

// ---------------------------------------------------------------------------
// Additional structural checks (Issue #1335)
// ---------------------------------------------------------------------------

describe('Workflow timeout limits', () => {
  const ALL_NEWS_WORKFLOWS = [
    ...Object.values(ARTICLE_TYPE_WORKFLOWS),
    'news-evening-analysis.md',
    'news-realtime-monitor.md',
    'news-article-generator.md',
    'news-translate.md',
  ];

  it('no workflow should exceed 60-minute timeout', () => {
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      if (!fs.existsSync(filepath)) continue;

      const frontmatter = parseFrontmatter(filepath);
      const timeoutMatch = frontmatter.match(/timeout-minutes:\s*(\d+)/);
      if (timeoutMatch) {
        const timeout = parseInt(timeoutMatch[1]!, 10);
        expect(
          timeout,
          `Workflow ${workflowFile} has timeout-minutes: ${timeout} which exceeds 60 minutes`
        ).toBeLessThanOrEqual(60);
      }
    }
  });

  it('all workflows should have timeout-minutes specified in frontmatter', () => {
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      if (!fs.existsSync(filepath)) continue;

      const frontmatter = parseFrontmatter(filepath);
      expect(
        frontmatter.includes('timeout-minutes'),
        `Workflow ${workflowFile} should have timeout-minutes specified in frontmatter`
      ).toBe(true);
    }
  });
});

describe('Concurrency Strategy', () => {
  it('all content workflows should have concurrency blocks with deterministic group keys', () => {
    const contentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
    ] as const;

    const expectedGroups: Record<string, string> = Object.fromEntries(
      contentWorkflows.map((workflowFile) => {
        if (workflowFile === 'news-article-generator.md') {
          return [workflowFile, "group: gh-aw-news-article-generator-${{ inputs.article_types || 'manual' }}"];
        }
        const workflowType = workflowFile.replace(/^news-/, '').replace(/\.md$/, '');
        return [workflowFile, `group: gh-aw-news-${workflowType}-\${{ inputs.article_date || 'today' }}`];
      })
    );

    for (const [workflowFile, expectedGroupLine] of Object.entries(expectedGroups)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const frontmatter = parseFrontmatter(filepath);
      expect(
        frontmatter.includes('concurrency:'),
        `Workflow ${workflowFile} should have a concurrency block in frontmatter`
      ).toBe(true);
      expect(
        frontmatter.includes(expectedGroupLine),
        `Workflow ${workflowFile} should have deterministic concurrency group line: ${expectedGroupLine}`
      ).toBe(true);
      expect(
        frontmatter.includes('cancel-in-progress: false'),
        `Workflow ${workflowFile} should have cancel-in-progress: false (queue, don't cancel)`
      ).toBe(true);
    }
  });

  it('content workflow concurrency groups should include workflow name', () => {
    const workflowGroups: Record<string, string> = {
      'news-committee-reports.md': 'gh-aw-news-committee-reports',
      'news-propositions.md': 'gh-aw-news-propositions',
      'news-motions.md': 'gh-aw-news-motions',
      'news-interpellations.md': 'gh-aw-news-interpellations',
      'news-week-ahead.md': 'gh-aw-news-week-ahead',
      'news-month-ahead.md': 'gh-aw-news-month-ahead',
      'news-weekly-review.md': 'gh-aw-news-weekly-review',
      'news-monthly-review.md': 'gh-aw-news-monthly-review',
    };

    for (const [workflowFile, expectedGroupPrefix] of Object.entries(workflowGroups)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const frontmatter = parseFrontmatter(filepath);
      expect(
        frontmatter.includes(expectedGroupPrefix),
        `Workflow ${workflowFile} should have concurrency group starting with ${expectedGroupPrefix}`
      ).toBe(true);
    }
  });

  it('translation workflow concurrency should use job-discriminator for parallel execution', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.md');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const frontmatter = parseFrontmatter(filepath);
    expect(frontmatter).toContain('job-discriminator');
    expect(frontmatter).toContain('cancel-in-progress: true');
  });

  it('content workflows using article_date in concurrency group should define article_date input', () => {
    const dateScopedWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
    ] as const;

    for (const workflowFile of dateScopedWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const frontmatter = parseFrontmatter(filepath);
      expect(
        frontmatter.includes('article_date:'),
        `Workflow ${workflowFile} should define article_date input so the concurrency group is actually scoped per date on manual dispatch`
      ).toBe(true);
    }
  });

  it('compiled lock workflows should preserve deterministic concurrency groups', () => {
    const weeklyReviewLockPath = path.join(WORKFLOWS_DIR, 'news-weekly-review.lock.yml');
    expect(fs.existsSync(weeklyReviewLockPath), `Workflow file ${weeklyReviewLockPath} should exist`).toBe(true);
    const weeklyReviewLock = fs.readFileSync(weeklyReviewLockPath, 'utf-8');
    expect(weeklyReviewLock).toContain("group: gh-aw-news-weekly-review-${{ inputs.article_date || 'today' }}");
    expect(weeklyReviewLock).toContain('cancel-in-progress: false');
    expect(weeklyReviewLock).toContain('article_date:');

    const translateLockPath = path.join(WORKFLOWS_DIR, 'news-translate.lock.yml');
    expect(fs.existsSync(translateLockPath), `Workflow file ${translateLockPath} should exist`).toBe(true);
    const translateLock = fs.readFileSync(translateLockPath, 'utf-8');
    expect(translateLock).toContain("group: gh-aw-news-translate-${{ inputs.article_type || 'batch' }}-${{ inputs.article_date || 'today' }}");
    expect(translateLock).toContain('cancel-in-progress: true');
  });
});

describe('Workflow permissions enforcement', () => {
  const ALL_NEWS_WORKFLOWS = [
    ...Object.values(ARTICLE_TYPE_WORKFLOWS),
    'news-evening-analysis.md',
    'news-realtime-monitor.md',
    'news-article-generator.md',
  ];

  it('all content workflows should have permissions block', () => {
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      if (!fs.existsSync(filepath)) continue;

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('permissions:'),
        `Workflow ${workflowFile} should have a permissions block`
      ).toBe(true);
    }
  });

  it('all content workflows should have contents: read (least privilege)', () => {
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      if (!fs.existsSync(filepath)) continue;

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('contents: read'),
        `Workflow ${workflowFile} should specify contents: read permission`
      ).toBe(true);
    }
  });
});

describe('Branch Naming Convention', () => {
  it('content workflows should document deterministic branch naming', () => {
    const contentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
    ];

    for (const workflowFile of contentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('news/content/'),
        `Workflow ${workflowFile} should document news/content/ branch naming convention`
      ).toBe(true);
    }
  });

  it('translation workflow should document deterministic branch naming', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.md');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(
      content.includes('news/translate/'),
      'Translation workflow should document news/translate/ branch naming convention'
    ).toBe(true);
  });
});

describe('Workflow dispatch-workflow safeguards', () => {
  const CONTENT_WORKFLOWS = Object.values(ARTICLE_TYPE_WORKFLOWS);

  it('content workflows that use dispatch-workflow reference news-translate', () => {
    for (const workflowFile of CONTENT_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      if (!fs.existsSync(filepath)) continue;

      const content = fs.readFileSync(filepath, 'utf-8');
      if (content.includes('dispatch-workflow')) {
        expect(
          content.includes('news-translate'),
          `Workflow ${workflowFile} uses dispatch-workflow but does not reference news-translate`
        ).toBe(true);
      }
    }
  });
});

describe('Compiled lock workflow synchronization', () => {
  it('news-translate.lock.yml should include pre-flight content PR dependency gate', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.lock.yml');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('name: Pre-flight content PR dependency check');
    expect(content).toContain('gh pr list --repo \\"$GH_REPOSITORY\\" --base main --state open --limit 200 --json headRefName');
  });

  it('news-translate.lock.yml preflight gate should set SKIP_TRANSLATION flag and halt on defer', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.lock.yml');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    // Preflight steps should set env flag instead of silently exiting 0
    expect(content).toContain('SKIP_TRANSLATION=true');
    expect(content).toContain('GITHUB_ENV');
    // Source article check should be guarded by the skip flag
    expect(content).toContain("env.SKIP_TRANSLATION != 'true'");
    // Gate step should halt the job when SKIP_TRANSLATION is set
    expect(content).toContain('name: Preflight gate');
    expect(content).toContain("env.SKIP_TRANSLATION == 'true'");
    expect(content).toContain('exit 1');
  });
});
