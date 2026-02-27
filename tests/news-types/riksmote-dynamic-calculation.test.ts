/**
 * Test Suite: Riksmöte Dynamic Calculation Enforcement
 *
 * Verifies that TypeScript news-type generators do not hardcode riksmöte year
 * strings (e.g. '2025/26') in executable code and instead rely on the shared
 * getCurrentRiksmote() utility from motions.ts.
 *
 * These tests act as regression guards: any re-introduction of a hardcoded
 * parliamentary-year string in the generator source will cause a test failure.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const newsTypesDir = join(__dirname, '../../scripts/news-types');

/** All TypeScript generator files in scripts/news-types — discovered programmatically */
const DYNAMIC_RM_FILES = readdirSync(newsTypesDir)
  .filter(f => f.endsWith('.ts'))
  .sort();

/** Strip single-line (//) and multi-line block comments from TypeScript source */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
}

describe('Riksmöte dynamic calculation enforcement', () => {
  for (const file of DYNAMIC_RM_FILES) {
    it(`${file} should not hardcode riksmöte year strings in executable code`, () => {
      const content = readFileSync(join(newsTypesDir, file), 'utf-8');
      const codeOnly = stripComments(content);
      // Matches single-quoted, double-quoted, or template-literal strings like '2025/26'
      expect(codeOnly).not.toMatch(/['"`]20\d{2}\/\d{2}['"`]/);
    });
  }

  it('monthly-review.ts should import getCurrentRiksmote', () => {
    const content = readFileSync(join(newsTypesDir, 'monthly-review.ts'), 'utf-8');
    expect(content).toMatch(/import.*getCurrentRiksmote/);
  });

  it('propositions.ts should import getCurrentRiksmote', () => {
    const content = readFileSync(join(newsTypesDir, 'propositions.ts'), 'utf-8');
    expect(content).toMatch(/import.*getCurrentRiksmote/);
  });
});
