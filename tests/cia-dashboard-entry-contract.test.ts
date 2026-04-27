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

  it('marks source bootstrap modules as side-effectful for the app build', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

    expect(packageJson.sideEffects).toEqual(
      expect.arrayContaining([
        './src/browser/cia-entry.ts',
        './src/browser/cia/dashboard-init.ts',
        './src/browser/shared/register-globals.ts',
      ]),
    );
  });
});
