import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CIA dashboard production entry contract', () => {
  it('uses explicit imports so production tree shaking keeps the dashboard bootstrap', () => {
    const entry = readFileSync(resolve(process.cwd(), 'src/browser/cia-entry.ts'), 'utf8');

    expect(entry).toContain('registerBrowserGlobals');
    expect(entry).toContain('startDashboard');
    expect(entry).toContain('startDashboard();');
  });

  it('keeps bootstrap ownership explicit without module import side effects', () => {
    const registerGlobals = readFileSync(resolve(process.cwd(), 'src/browser/shared/register-globals.ts'), 'utf8');
    const dashboardInit = readFileSync(resolve(process.cwd(), 'src/browser/cia/dashboard-init.ts'), 'utf8');

    expect(registerGlobals).not.toMatch(/\nregisterBrowserGlobals\(\);/);
    expect(dashboardInit).not.toContain('export async function initDashboard');
    expect(dashboardInit).toContain('export function startDashboard');
  });

  it('marks only the source entry bootstrap as side-effectful for the app build', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

    // Both the production entry AND the bootstrap helper must be flagged as
    // side-effectful, otherwise Vite/Rollup tree-shake the bare side-effect
    // import `import './shared/register-globals-bootstrap.js';` from
    // `cia-entry.ts` and Chart.js / D3 are silently dropped from the
    // CIA dashboard bundle. Reproduced 2026-05-13: live
    // `/assets/js/cia-entry-*.js` shipped 3 144 lines (no Chart.js); after
    // adding the bootstrap to `sideEffects` it ships 32 000+ lines and
    // executes `globalThis.Chart = Chart$1;` before any chart renders.
    expect(packageJson.sideEffects).toEqual(
      expect.arrayContaining([
        './src/browser/cia-entry.ts',
        './src/browser/shared/register-globals-bootstrap.ts',
      ]),
    );
    expect(packageJson.sideEffects).not.toContain('./src/browser/cia/dashboard-init.ts');
    expect(packageJson.sideEffects).not.toContain('./src/browser/shared/register-globals.ts');
  });

  it('keeps the bootstrap import on the first line of executable code in cia-entry', () => {
    const entry = readFileSync(resolve(process.cwd(), 'src/browser/cia-entry.ts'), 'utf8');

    // Strip block/line comments, then find first non-empty line.
    const code = entry
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/.*$/gm, '');
    const firstImport = code.split('\n').map((l) => l.trim()).find((l) => l.length > 0);

    expect(firstImport, 'first executable statement in cia-entry.ts').toMatch(
      /^import\s+['"]\.\/shared\/register-globals-bootstrap\.js['"]\s*;?$/,
    );
  });
});
