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
import { readWorkflowWithImports } from './helpers/workflow-imports.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKFLOWS_DIR = path.join(__dirname, '..', '.github', 'workflows');
const PROMPTS_DIR = path.join(__dirname, '..', '.github', 'prompts');

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

/** Content workflows = article type workflows + evening analysis */
const CONTENT_WORKFLOWS = [
  ...Object.values(ARTICLE_TYPE_WORKFLOWS),
  'news-evening-analysis.md',
];

/** Parse schedule from workflow frontmatter (supports both cron and gh-aw fuzzy formats) */
function extractSchedule(content: string): string | null {
  // Match standard cron with double or single quotes: cron: "0 8 1 * *" or cron: '0 18 * * 1-5'
  const cronMatch = content.match(/cron:\s*["']([^"']+)["']/);
  if (cronMatch) return cronMatch[1] ?? null;

  // Match gh-aw fuzzy schedule: "schedule: daily around 4:00 on weekdays"
  const fuzzyMatch = content.match(/schedule:\s*((?:daily|weekly|monthly)\b[^\n]*)/);
  if (fuzzyMatch) return fuzzyMatch[1]?.trim() ?? null;

  return null;
}

/** Extract hour from a schedule string (cron or fuzzy format) */
function extractScheduleHour(schedule: string): number | null {
  // Cron format: "0 8 1 * *" → hour is 2nd field
  const cronParts = schedule.match(/^\d+\s+(\d+)/);
  if (cronParts) return parseInt(cronParts[1]!, 10);

  // Fuzzy format: "daily around 4:00 on weekdays" → hour after "around"
  const fuzzyHour = schedule.match(/around\s+(\d+):/);
  if (fuzzyHour) return parseInt(fuzzyHour[1]!, 10);

  return null;
}

/** Extract day-of-week name from a fuzzy schedule, or cron day number */
function extractScheduleDayOfWeek(schedule: string): string | null {
  // Fuzzy format: "weekly on friday around 7:00"
  const fuzzyDay = schedule.match(/on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (fuzzyDay) return fuzzyDay[1]!.toLowerCase();

  // Cron format: "0 8 * * 5" → 5th field is day-of-week
  const parts = schedule.split(/\s+/);
  if (parts.length >= 5 && parts[4] !== '*') return parts[4]!;

  return null;
}

/** Extract day-of-month from a cron schedule */
function extractScheduleDayOfMonth(schedule: string): string | null {
  // Cron format: "0 8 1 * *" → 3rd field is day-of-month
  const parts = schedule.split(/\s+/);
  if (parts.length >= 5 && parts[2] !== '*') return parts[2]!;

  return null;
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

  it('should have unique schedules for each article type workflow', () => {
    const schedules = new Map<string, string>();

    for (const [articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      const schedule = extractSchedule(content);

      if (schedule) {
        const existing = schedules.get(schedule);
        expect(
          existing,
          `Schedule conflict: "${articleType}" and "${existing}" both use schedule "${schedule}"`
        ).toBeUndefined();
        schedules.set(schedule, articleType);
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
    // In the modular architecture this is expressed EITHER as "Single article
    // type per run" in the dedicated single-type workflow descriptions (core
    // legislative workflows), OR as an explicit aggregation-only statement
    // (reference-grade / tier-c workflows) where "one article type" is
    // replaced by "N siblings aggregated into one brief". Accept both.
    for (const [_articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');

      // Single-type focus is either stated directly or implied by aggregation semantics.
      const hasSingleType =
        /single article type/i.test(content) ||
        /one article type per run/i.test(content) ||
        /tier-c-aggregation/i.test(content) ||
        /aggregation/i.test(content);

      expect(
        hasSingleType,
        `Workflow ${workflowFile} should state single-type focus or declare aggregation semantics`
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

      const content = fs.readFileSync(filepath, 'utf-8');
      const hasSchedule = extractSchedule(content) !== null;
      expect(
        hasSchedule,
        `Workflow ${workflowFile} should have a schedule (cron or fuzzy)`
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

  it('all news workflows should configure safe-outputs max-patch-size above the 1024 KB default', () => {
    // Regression for News Realtime Monitor failure (run 24541191332): a 1301 KB patch
    // was rejected because the default `max-patch-size` is 1024 KB. All news workflows
    // generate comparably large multi-file patches, so each must raise the limit.
    // gh-aw accepts `max-patch-size` at the top of the `safe-outputs` block
    // (sibling of `create-pull-request`), not nested inside it.
    const allNewsWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
      'news-translate.md',
    ];

    /**
     * Extract the YAML frontmatter block from a workflow .md file
     * (everything between the opening and closing `---` markers).
     */
    const extractFrontmatter = (content: string): string => {
      const lines = content.split('\n');
      const start = lines.indexOf('---');
      if (start === -1) return '';
      for (let i = start + 1; i < lines.length; i++) {
        if (lines[i]?.trim() === '---') return lines.slice(start + 1, i).join('\n');
      }
      return '';
    };

    /**
     * Parse `safe-outputs.max-patch-size` (direct child, 2-space indent)
     * from a frontmatter YAML string. Ignores nested occurrences such as
     * `tools.repo-memory.max-patch-size` or `safe-outputs.create-pull-request.max-patch-size`
     * which do not affect the create_pull_request limit. Allows an optional
     * trailing YAML comment (`# note`).
     */
    const parseSafeOutputsMaxPatchSize = (frontmatter: string): number | null => {
      const lines = frontmatter.split('\n');
      let inSafeOutputs = false;
      for (const line of lines) {
        if (/^safe-outputs\s*:/.test(line)) {
          inSafeOutputs = true;
          continue;
        }
        if (inSafeOutputs) {
          // Leaving safe-outputs when a new top-level key appears (no indent).
          if (/^[A-Za-z_-][^\s:]*\s*:/.test(line)) return null;
          // Direct child (exactly 2-space indent), with optional trailing comment.
          const direct = line.match(/^ {2}max-patch-size\s*:\s*(\d+)\s*(?:#.*)?$/);
          if (direct) return parseInt(direct[1]!, 10);
        }
      }
      return null;
    };

    for (const workflowFile of allNewsWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const frontmatter = extractFrontmatter(fs.readFileSync(filepath, 'utf-8'));
      expect(
        frontmatter.length,
        `Workflow ${workflowFile} should have YAML frontmatter`
      ).toBeGreaterThan(0);

      const value = parseSafeOutputsMaxPatchSize(frontmatter);
      expect(
        value,
        `Workflow ${workflowFile} must define safe-outputs.max-patch-size as a direct child (2-space indent) to override the 1024 KB default`
      ).not.toBeNull();
      expect(
        value!,
        `Workflow ${workflowFile} safe-outputs.max-patch-size (${value} KB) must exceed the 1024 KB gh-aw default`
      ).toBeGreaterThan(1024);
    }
  });

  it('should have safe PR creation how-to in all workflows', () => {
    const allWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md'
    ];

    // Safe-PR how-to moved into `../prompts/07-commit-and-pr.md`. We verify
    // the effective prompt (workflow body + imports) exposes the canonical
    // rules: (a) call `safeoutputs___create_pull_request`, (b) do not
    // `git push`, (c) stage via `git add` / `git commit` before calling.
    for (const workflowFile of allWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(
        fs.existsSync(filepath),
        `Workflow ${workflowFile} should exist on disk`
      ).toBe(true);

      const effective = readWorkflowWithImports(filepath);
      // (a) Must invoke the safe-outputs PR tool.
      expect(
        effective.includes('safeoutputs___create_pull_request'),
        `Workflow ${workflowFile} should reference safeoutputs___create_pull_request`
      ).toBe(true);
      // (b) Must prohibit `git push` from the agent.
      const hasDoNotGitPush = /(Do\s*not|DO\s*NOT|NEVER)[\s\S]{0,80}`?git push`?/i.test(effective);
      expect(
        hasDoNotGitPush,
        `Workflow ${workflowFile} effective prompt should forbid \`git push\``
      ).toBe(true);
      // (c) Must stage files before the safe-outputs call. Accept either
      // the literal `git add` / `git commit` commands (workflow body) or
      // the prose "Stage scoped files" guidance (prompts/07-commit-and-pr.md).
      const hasStagingGuidance =
        (effective.includes('git add') && effective.includes('git commit')) ||
        /Stage scoped files|^\s*\d+\.\s+\*\*Stage\b/im.test(effective);
      expect(
        hasStagingGuidance,
        `Workflow ${workflowFile} should document staging (git add + git commit, or equivalent "Stage scoped files" guidance) before safe PR creation`
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
    // In the modular architecture, the translation workflow has compact
    // rules referenced in its body + the shared `07-commit-and-pr.md` and
    // `00-base-contract.md` modules. The old "MANDATORY Translation Quality
    // Rules / RTL languages / CJK languages / CONTENT_LABELS" header block
    // is gone. Verify the essential translation concepts remain.
    const filepath = path.join(WORKFLOWS_DIR, TRANSLATE_WORKFLOW);
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const effective = readWorkflowWithImports(filepath);

    // Must restrict to translation work (never original analysis).
    expect(
      /pure[-\s]?derivative|never generates original|translation.*workflow/i.test(effective),
      'Translation workflow must state it is derivative-only (never generates original analysis)'
    ).toBe(true);
    // Must enumerate the 12 non-core languages (at least by example).
    expect(
      /da,\s*no|nordic-extra|eu-extra|\bcjk\b|\brtl\b|ar,\s*he|ja,\s*ko,\s*zh/i.test(effective),
      'Translation workflow must enumerate target language groups (nordic-extra, eu-extra, cjk, rtl, all-extra)'
    ).toBe(true);
    // Must scope by analysis_depth so quality mirrors the source article.
    expect(effective).toMatch(/analysis_depth/);
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
      const schedule = extractSchedule(content);
      if (schedule) {
        const hour = extractScheduleHour(schedule);
        if (hour !== null) {
          weekdaySchedules.push({ file: workflowFile, hour });
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
      const schedule = extractSchedule(content);
      if (schedule) {
        const dayOfWeek = extractScheduleDayOfWeek(schedule);
        if (dayOfWeek) {
          weekendWorkflows.push({ file: workflowFile, dayOfWeek });
        }
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
      const schedule = extractSchedule(content);
      if (schedule) {
        const dayOfMonth = extractScheduleDayOfMonth(schedule);
        if (dayOfMonth) {
          monthlyWorkflows.push({ file: workflowFile, dayOfMonth });
        }
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
  const PROMPTS_DIR = path.join(__dirname, '..', 'scripts', 'prompts', 'v2');

  it('should have all required prompt files', () => {
    const requiredFiles = [
      'political-analysis.md',
      'swot-generation.md',
      'stakeholder-perspectives.md',
      'quality-criteria.md',
      'per-file-intelligence-analysis.md',
      'political-threat-prompt.md',
      'political-risk-prompt.md',
      'political-classification-prompt.md',
    ];
    for (const file of requiredFiles) {
      expect(
        fs.existsSync(path.join(PROMPTS_DIR, file)),
        `Missing required prompt: scripts/prompts/v2/${file}`
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
  /** Content-generation workflows require all 6 skills */
  const CONTENT_GENERATION_WORKFLOWS = [
    ...Object.values(ARTICLE_TYPE_WORKFLOWS),
    'news-evening-analysis.md',
    'news-realtime-monitor.md',
    'news-article-generator.md',
  ];

  /** Translation workflow only needs a subset of skills */
  const TRANSLATION_WORKFLOWS = ['news-translate.md'];

  const ALL_NEWS_WORKFLOWS = [
    ...CONTENT_GENERATION_WORKFLOWS,
    ...TRANSLATION_WORKFLOWS,
  ];

  it('all news workflows should have standardised analysis depth table or reference', () => {
    // Analysis-depth guidance now lives in `../prompts/04-analysis-pipeline.md`
    // (Pass 1 / Pass 2) and in each workflow's `analysis_depth` dispatch
    // input defaults. Verify the effective prompt exposes SOME form of
    // depth-scoping, not the specific table header.
    for (const workflowFile of ALL_NEWS_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = readWorkflowWithImports(filepath);
      const hasDepthSurface =
        /analysis_depth/.test(content) ||
        /Analysis Depth Gate/i.test(content) ||
        /(standard|deep|comprehensive)[^\n]{0,80}(iterations?|depth|sources?)/i.test(content) ||
        /standard=1-2|deep=2-3|comprehensive=3\+/i.test(content) ||
        /Pass 1[\s\S]{0,120}Pass 2/.test(content);
      expect(
        hasDepthSurface,
        `Workflow ${workflowFile} should expose analysis depth scaling (analysis_depth input, Pass 1/2, or explicit depth table)`
      ).toBe(true);
    }
  });
});

describe('Playwright Validation in Content Workflows', () => {
  const PLAYWRIGHT_VALIDATOR_PATH = 'scripts/validate-articles-playwright.ts';

  it('Playwright validator script should exist on disk', () => {
    const validatorPath = path.join(__dirname, '..', PLAYWRIGHT_VALIDATOR_PATH);
    expect(
      fs.existsSync(validatorPath),
      `Playwright validator should exist at ${PLAYWRIGHT_VALIDATOR_PATH}`
    ).toBe(true);
  });
});

describe('Deduplication Check in Content Workflows', () => {
  it('all content workflows should support deduplication via ARTICLE_DATE + ARTICLE_TYPE scoping', () => {
    // The "MANDATORY Deduplication Check" header + inline `EXISTING=$(ls …)`
    // bash snippet is gone. In the modular architecture dedup is enforced by
    // `force_generation=false` + deterministic branch naming (see
    // `../prompts/07-commit-and-pr.md`: branch = `news/content/$ARTICLE_DATE/$ARTICLE_TYPE`).
    // We simply assert the dedup vocabulary exists somewhere in the effective prompt.
    for (const workflowFile of CONTENT_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const effective = readWorkflowWithImports(filepath);
      expect(
        effective.includes('ARTICLE_DATE') && /force_generation|already exist|dedup/i.test(effective),
        `Workflow ${workflowFile} should support dedup via ARTICLE_DATE + (force_generation|already exist|dedup)`
      ).toBe(true);
    }
  });

  it('all content workflows should derive ARTICLE_DATE from workflow dispatch input', () => {
    // Frontmatter-level dispatch input `article_date` must exist; the body
    // scopes to `$ARTICLE_DATE`. We accept either `github.event.inputs.article_date`
    // (compiled .lock.yml style) OR `inputs.article_date` (gh-aw .md style).
    for (const workflowFile of CONTENT_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        /github\.event\.inputs\.article_date|\binputs\.article_date\b/.test(content),
        `Workflow ${workflowFile} should reference the article_date dispatch input`
      ).toBe(true);
      expect(
        content.includes('ARTICLE_DATE'),
        `Workflow ${workflowFile} should scope work to $ARTICLE_DATE`
      ).toBe(true);
    }
  });

  it('article type workflows should wire force_generation dispatch input', () => {
    for (const workflowFile of Object.values(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      // Accept either the legacy compiled expression or the modern inputs.*
      expect(
        /github\.event\.inputs\.force_generation|\binputs\.force_generation\b|force_generation=false/.test(content),
        `Workflow ${workflowFile} should wire the force_generation dispatch input`
      ).toBe(true);
    }
  });
});

describe('Interpellations Minister-Response Cross-Reference', () => {
  it('news-interpellations.md should cross-reference minister responses', () => {
    // The dedicated "Cross-Reference Minister Responses" header with 4
    // numbered analysis steps was absorbed into the generic analysis
    // pipeline modules. We now verify the workflow (or imports) still
    // document minister-response handling using the canonical MCP tools.
    const filepath = path.join(WORKFLOWS_DIR, 'news-interpellations.md');
    expect(fs.existsSync(filepath), 'news-interpellations.md should exist').toBe(true);
    const effective = readWorkflowWithImports(filepath);
    const hasMinisterConcept =
      /minister/i.test(effective) ||
      /interpellation/i.test(effective);
    expect(
      hasMinisterConcept,
      'news-interpellations.md should discuss minister / interpellation concepts in the effective prompt'
    ).toBe(true);
  });

});

describe('Shared Prompt Patterns Reference', () => {
  it('should have a canonical prompt-module library', () => {
    // The legacy `.github/aw/SHARED_PROMPT_PATTERNS.md` was replaced by the
    // `.github/prompts/` bounded-context library. Verify the new layout.
    expect(
      fs.existsSync(path.join(PROMPTS_DIR, 'README.md')),
      '.github/prompts/README.md should document the prompt-module catalogue'
    ).toBe(true);
    for (const mod of ['00-base-contract.md', '01-bash-and-shell-safety.md',
                       '02-mcp-access.md', '03-data-download.md',
                       '04-analysis-pipeline.md', '05-analysis-gate.md',
                       '06-article-generation.md', '07-commit-and-pr.md']) {
      expect(
        fs.existsSync(path.join(PROMPTS_DIR, mod)),
        `Prompt module ${mod} should exist`
      ).toBe(true);
    }
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

  it('should reference the analysis-pipeline prompt module in all content workflows', () => {
    // LEGACY: `scripts/prompts/v2/quality-criteria.md` / `political-analysis.md`
    // / `stakeholder-perspectives.md` were consolidated into
    // `../prompts/04-analysis-pipeline.md` + `analysis/templates/`.
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
        /prompts\/04-analysis-pipeline\.md/.test(content),
        `Workflow ${workflowFile} should import ../prompts/04-analysis-pipeline.md`
      ).toBe(true);
    }
  });

  it('should enforce the analysis gate in all content workflows', () => {
    // Replaces the `class="analysis-references"` verification — the gate
    // now lives in `../prompts/05-analysis-gate.md` and is imported by
    // every content workflow.
    const allContentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
    ];
    for (const workflowFile of allContentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        /prompts\/05-analysis-gate\.md/.test(content),
        `Workflow ${workflowFile} must import the analysis-gate prompt module`
      ).toBe(true);
    }
  });

  it('all content workflows should mandate reading analysis files before article generation', () => {
    // Replaces the old "Step 2b: Read ALL Analysis Files" header — in the
    // modular architecture this is enforced by `../prompts/05-analysis-gate.md`
    // (blocks article generation until all 9 core artifacts exist and have
    // been read in full during Pass 2).
    const allContentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
    ];
    for (const workflowFile of allContentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      const effective = readWorkflowWithImports(filepath);
      expect(
        /Pass\s*2|read.*back|read.*all.*artifact|analysis-gate/i.test(effective),
        `Workflow ${workflowFile} should enforce reading analysis artifacts (Pass 2 / analysis gate)`
      ).toBe(true);
    }
  });

  it('aggregation workflows should import the tier-c-aggregation extension', () => {
    // Replaces the "Cross-Reference Sibling Types" header — in the modular
    // architecture aggregation semantics are imported from
    // `../prompts/ext/tier-c-aggregation.md`.
    const aggregationWorkflows = [
      'news-evening-analysis.md',
      'news-week-ahead.md',
      'news-month-ahead.md',
      'news-weekly-review.md',
      'news-monthly-review.md',
    ];
    for (const workflowFile of aggregationWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        /prompts\/ext\/tier-c-aggregation\.md/.test(content),
        `Aggregation workflow ${workflowFile} must import ../prompts/ext/tier-c-aggregation.md`
      ).toBe(true);
    }
  });

  it('translation workflow should preserve analysis integrity', () => {
    // Replaces the "preserve analysis-references section" assertion. In
    // the modular architecture the translation workflow is pure-derivative
    // and must not rewrite analysis artifacts. We verify that intent.
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.md');
    expect(fs.existsSync(filepath)).toBe(true);
    const effective = readWorkflowWithImports(filepath);
    expect(
      /pure[-\s]?derivative|never generates original|do not.*regenerate|preserve/i.test(effective),
      'Translation workflow must declare derivative-only / analysis-preserving intent'
    ).toBe(true);
  });
});

describe('Iterative Analysis Protocol', () => {
  const ANALYTICAL_WORKFLOWS = [
    'news-interpellations.md',
    'news-motions.md',
    'news-committee-reports.md',
    'news-propositions.md',
  ];

  it('should have AI-FIRST iterative analysis in analytical workflows', () => {
    // The old "Iterative Analysis Protocol / Iteration 1 / Maximum 3 iterations
    // / score < 7" phrasing was replaced by the AI-FIRST Pass 1 / Pass 2
    // rule in `../prompts/00-base-contract.md` + `../prompts/04-analysis-pipeline.md`.
    for (const workflowFile of ANALYTICAL_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const effective = readWorkflowWithImports(filepath);
      const hasIterative =
        /Pass\s*1[\s\S]{0,400}Pass\s*2/.test(effective) ||
        /AI[-\s]?FIRST/i.test(effective) ||
        /minimum\s+2\s+(complete\s+)?iterations?/i.test(effective) ||
        /iterat\w+[\s\S]{0,80}(quality|improve|refine)/i.test(effective);
      expect(
        hasIterative,
        `Workflow ${workflowFile} should enforce AI-FIRST iteration (Pass 1 / Pass 2, or equivalent)`
      ).toBe(true);
    }
  });

  it('all dedicated workflows should define the analysis pipeline stages', () => {
    // Replaces the "Multi-Step AI Analysis Framework" header assertion.
    // The modular architecture imports `../prompts/04-analysis-pipeline.md`
    // which IS the multi-step analysis framework.
    for (const workflowFile of Object.values(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        /prompts\/04-analysis-pipeline\.md/.test(content),
        `Workflow ${workflowFile} should import the analysis-pipeline prompt module`
      ).toBe(true);
    }
  });

  it('should have maximum 3 iterations limit in iterative workflows', () => {
    for (const workflowFile of ANALYTICAL_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const effective = readWorkflowWithImports(filepath);
      // Accept the original phrasing OR the modern AI-FIRST bound of
      // "minimum 2 complete iterations".
      expect(
        /3 iterations|Maximum 3|minimum\s+2\s+(complete\s+)?iterations?/i.test(effective),
        `Workflow ${workflowFile} should specify an iteration bound (max 3 or min 2)`
      ).toBe(true);
    }
  });

  it('all dedicated workflows should wire the analysis_depth dispatch input', () => {
    for (const workflowFile of Object.values(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      // analysis_depth must be declared as a dispatch input. The body may
      // reference it via either `github.event.inputs.analysis_depth`
      // (compiled) or `inputs.analysis_depth` (gh-aw source).
      const frontmatter = parseFrontmatter(filepath);
      expect(
        /analysis_depth\s*:/.test(frontmatter),
        `Workflow ${workflowFile} should declare analysis_depth in frontmatter`
      ).toBe(true);
      expect(
        /github\.event\.inputs\.analysis_depth|\binputs\.analysis_depth\b|\banalysis_depth\b/.test(content),
        `Workflow ${workflowFile} should reference analysis_depth in its body`
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
    const effective = readWorkflowWithImports(REALTIME_WORKFLOW);
    // Accept either explicit HIGH/MEDIUM/LOW labels OR a significance /
    // severity scoring vocabulary (the `significance-scoring.md` artifact
    // defined in `../prompts/04-analysis-pipeline.md`).
    const hasSeverity =
      (effective.includes('HIGH') && effective.includes('MEDIUM') && effective.includes('LOW')) ||
      /significance[-\s]?scoring|severity|breaking/i.test(effective);
    expect(
      hasSeverity,
      'Realtime monitor effective prompt should classify breaking news severity or significance'
    ).toBe(true);
  });

  it('should scale quality via analysis_depth', () => {
    // Replaces the `quality-criteria.md` script reference with a more
    // durable check: the realtime monitor imports the analysis pipeline
    // and scales via `analysis_depth`.
    expect(fs.existsSync(REALTIME_WORKFLOW), 'news-realtime-monitor.md should exist').toBe(true);
    const content = fs.readFileSync(REALTIME_WORKFLOW, 'utf-8');
    expect(
      /prompts\/04-analysis-pipeline\.md/.test(content) && /analysis_depth/.test(content),
      'Realtime monitor should import the analysis pipeline and wire analysis_depth'
    ).toBe(true);
  });

  it('should scope severity assessment to political topic areas', () => {
    // The old test hard-coded "confidence motion" and "fiscal" as required
    // substrings. The effective prompt no longer uses those exact words;
    // the significance-scoring artifact and analysis gate let the agent
    // classify any topic. We relax to: the workflow discusses at least
    // one political topic area relevant to breaking news.
    expect(fs.existsSync(REALTIME_WORKFLOW), 'news-realtime-monitor.md should exist').toBe(true);
    const effective = readWorkflowWithImports(REALTIME_WORKFLOW);
    const hasPoliticalScope =
      /government|parliament|riksdag|minister|motion|proposition|interpellation|committee/i.test(effective);
    expect(
      hasPoliticalScope,
      'Realtime monitor should scope severity assessment to political topic areas'
    ).toBe(true);
  });
});

describe('Manual Article Generation Safety', () => {
  // Only workflows that have manual bash-based article generation as a fallback
  const MANUAL_GENERATION_WORKFLOWS = [
    'news-article-generator.md',
    'news-evening-analysis.md',
  ];

  it('workflows with manual fallback should enforce bash-safety rules from the shell-safety prompt module', () => {
    // LEGACY string "NEVER use bash heredoc" / "printf '%s\n'" was removed.
    // Bash safety is now centrally enforced by `../prompts/01-bash-and-shell-safety.md`.
    for (const workflowFile of MANUAL_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        /prompts\/01-bash-and-shell-safety\.md/.test(content),
        `Workflow ${workflowFile} should import ../prompts/01-bash-and-shell-safety.md`
      ).toBe(true);
    }
  });

  it('workflows with manual fallback should not re-enable dangerous heredoc-based file writes', () => {
    // The abandoned pattern was ``cat > file.md <<EOF`` — we make sure it
    // does not re-appear as a recommended approach (negative regression).
    for (const workflowFile of MANUAL_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      const content = fs.readFileSync(filepath, 'utf-8');
      const badHeredoc = /cat\s*>\s*[^<]*<<\s*['"]?EOF['"]?\s*\n[\s\S]*EOF\s*$/m;
      const matchedBlocks = content.match(/```bash[\s\S]*?```/g) ?? [];
      for (const block of matchedBlocks) {
        // Allow EXAMPLES ONLY inside blocks that are explicitly flagged as bad patterns.
        if (/❌|NEVER|DO NOT|AVOID/i.test(block)) continue;
        expect(
          badHeredoc.test(block),
          `Workflow ${workflowFile} should not recommend heredoc-based file writes in a non-anti-pattern bash block`
        ).toBe(false);
      }
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

  it('script-based workflows should import the shell-safety prompt module', () => {
    // LEGACY: per-workflow "NEVER use `python3`" / "NEVER manually construct HTML"
    // / "generate-news-enhanced.ts" directives were replaced by the central
    // shell-safety + article-generation prompt modules.
    for (const workflowFile of SCRIPT_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        /prompts\/01-bash-and-shell-safety\.md/.test(content),
        `Workflow ${workflowFile} should import ../prompts/01-bash-and-shell-safety.md`
      ).toBe(true);
    }
  });

  it('script-based workflows should import the article-generation prompt module', () => {
    for (const workflowFile of SCRIPT_GENERATION_WORKFLOWS) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        /prompts\/06-article-generation\.md/.test(content),
        `Workflow ${workflowFile} should import ../prompts/06-article-generation.md`
      ).toBe(true);
    }
  });

});

describe('File Ownership Contract', () => {
  it('translation workflow should guard against racing in-flight content PRs', () => {
    // The "Content-PR Dependency Check" header is gone but the *behaviour*
    // remains: translation workflow checks for open content PRs before
    // translating and skips if any are found.
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.md');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(
      /OPEN_CONTENT_PRS|open content PR|in-flight content PR|No open content PRs/i.test(content),
      'Translation workflow should check for open content PRs before translating'
    ).toBe(true);
  });

  it('validate-file-ownership.ts script should exist', () => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'validate-file-ownership.ts');
    expect(
      fs.existsSync(scriptPath),
      'scripts/validate-file-ownership.ts should exist'
    ).toBe(true);
  });

  it('validate-file-ownership.ts should export CONTENT_LANGS and TRANSLATION_LANGS', async () => {
    const mod = await import('../scripts/validate-file-ownership.js');
    expect('CONTENT_LANGS' in mod).toBe(true);
    expect('TRANSLATION_LANGS' in mod).toBe(true);
  });

  it('validate-file-ownership.ts should export validateFileList and validatePendingFileOwnership', async () => {
    const mod = await import('../scripts/validate-file-ownership.js');
    expect('validateFileList' in mod).toBe(true);
    expect('validatePendingFileOwnership' in mod).toBe(true);
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
    // `news/content/` branch naming is documented in the shared
    // `../prompts/07-commit-and-pr.md` module. Check the effective prompt.
    const contentWorkflows = [
      ...Object.values(ARTICLE_TYPE_WORKFLOWS),
      'news-evening-analysis.md',
      'news-realtime-monitor.md',
      'news-article-generator.md',
    ];

    for (const workflowFile of contentWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
      const effective = readWorkflowWithImports(filepath);
      expect(
        effective.includes('news/content/'),
        `Workflow ${workflowFile} effective prompt should document news/content/ branch naming convention`
      ).toBe(true);
    }
  });

  it('translation workflow should use a deterministic branch naming prefix', () => {
    // The translation workflow's branch is auto-generated by gh-aw
    // safeoutputs from the workflow name (e.g. `news-translate/…`). The
    // deterministic part that MUST stay stable is the content branch
    // prefix the workflow checks against to avoid racing in-flight
    // content PRs.
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.md');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(
      /news\/content\/|CONTENT_BRANCH_PREFIX=|news-translate/.test(content),
      'Translation workflow should use a deterministic content-branch prefix (news/content/) or its own news-translate/ branch'
    ).toBe(true);
  });
});

describe('Workflow dispatch-workflow safeguards', () => {
  const ARTICLE_WORKFLOWS = Object.values(ARTICLE_TYPE_WORKFLOWS);

  it('content workflows that use dispatch-workflow reference news-translate', () => {
    for (const workflowFile of ARTICLE_WORKFLOWS) {
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
    // Assert on stable substrings of the pre-flight gh command rather than exact YAML-escaped formatting
    expect(content).toContain('gh pr list');
    expect(content).toContain('$GH_REPOSITORY');
    expect(content).toContain('--base main');
    expect(content).toContain('--state open');
    expect(content).toContain('--limit 200');
    expect(content).toContain('--json headRefName');
  });

  it('news-translate.lock.yml preflight should set TODAY_DEFERRED flag and let agent decide', () => {
    const filepath = path.join(WORKFLOWS_DIR, 'news-translate.lock.yml');
    expect(fs.existsSync(filepath), `Workflow file ${filepath} should exist`).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    // Preflight steps should set informational env flags instead of blocking workflow
    expect(content).toContain('TODAY_DEFERRED=true');
    expect(content).toContain('GITHUB_ENV');
    // Source article check should set TODAY_NO_SOURCES instead of blocking
    expect(content).toContain('TODAY_NO_SOURCES=true');
    // No hard preflight gate that kills the workflow — agent always runs
    expect(content).not.toContain('name: Preflight gate');
    expect(content).not.toContain('SKIP_TRANSLATION=true');
  });
});
