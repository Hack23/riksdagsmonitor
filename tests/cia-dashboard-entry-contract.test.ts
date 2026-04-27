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

    expect(packageJson.sideEffects).toEqual(
      expect.arrayContaining([
        './src/browser/cia-entry.ts',
      ]),
    );
    expect(packageJson.sideEffects).not.toContain('./src/browser/cia/dashboard-init.ts');
    expect(packageJson.sideEffects).not.toContain('./src/browser/shared/register-globals.ts');
  });
});
