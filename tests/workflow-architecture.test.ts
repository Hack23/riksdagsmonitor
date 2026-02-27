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
      if (!fs.existsSync(filepath)) continue;

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
    if (!fs.existsSync(generatorPath)) return;

    const frontmatter = parseFrontmatter(generatorPath);
    // The multi-type generator should use workflow_dispatch only, not schedule
    expect(frontmatter).not.toContain('schedule: daily');
    expect(frontmatter).not.toContain('cron:');
  });

  it('should have single article type focus in each dedicated workflow', () => {
    for (const [articleType, workflowFile] of Object.entries(ARTICLE_TYPE_WORKFLOWS)) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      if (!fs.existsSync(filepath)) continue;

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
      if (!fs.existsSync(filepath)) continue;

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
      if (!fs.existsSync(filepath)) continue;

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
      if (!fs.existsSync(filepath)) continue;

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
      if (!fs.existsSync(filepath)) continue;

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(
        content.includes('contents: read'),
        `Workflow ${workflowFile} should have contents: read permission (least privilege)`
      ).toBe(true);
    }
  });
});

describe('Schedule Staggering', () => {
  it('should stagger weekday workflows across different hours', () => {
    const weekdaySchedules: Array<{ file: string; hour: number }> = [];

    const weekdayWorkflows = ['news-committee-reports.md', 'news-propositions.md', 'news-motions.md'];

    for (const workflowFile of weekdayWorkflows) {
      const filepath = path.join(WORKFLOWS_DIR, workflowFile);
      if (!fs.existsSync(filepath)) continue;

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
      if (!fs.existsSync(filepath)) continue;

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
      if (!fs.existsSync(filepath)) continue;

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
      'committee-reports', 'propositions', 'motions', 'breaking'
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
      'committee-reports', 'propositions', 'motions', 'breaking'
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
