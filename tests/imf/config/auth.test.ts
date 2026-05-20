/**
 * NEW invariant test: assert IMF_SDMX_SUBSCRIPTION_KEY is read from
 * exactly one file in scripts/imf/** (the auth boundary).
 *
 * Required by acceptance criteria of #2620. Complements the existing
 * static-source scan in tests/imf/refactor-invariants.test.ts by
 * pinning the expected reader path explicitly.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const IMF_ROOT = path.resolve(__dirname, '..', '..', '..', 'scripts', 'imf');

/** Recursively collect *.ts files under `root`. */
function walkTs(root: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTs(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('IMF SDMX subscription key auth boundary', () => {
  const files = walkTs(IMF_ROOT);

  it('walks the scripts/imf tree and finds .ts source files (sanity)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('reads IMF_SDMX_SUBSCRIPTION_KEY from process.env in exactly one file', () => {
    // We deliberately match `process.env...IMF_SDMX_SUBSCRIPTION_KEY` (bracket OR
    // dot access) rather than the bare string. Other modules may legitimately
    // reference the env var name in docstrings, error messages, or types — but
    // only the auth boundary may actually READ it.
    const ENV_READ = /process\.env\s*(?:\.\s*IMF_SDMX_SUBSCRIPTION_KEY\b|\[\s*['"]IMF_SDMX_SUBSCRIPTION_KEY['"]\s*\])/;
    const matches = files.filter((f) => ENV_READ.test(fs.readFileSync(f, 'utf8')));
    // Diagnostic hint when this fails: a second module is reading the env var
    // directly — route it through scripts/imf/config/auth.ts::resolveSdmxSubscriptionKey.
    expect(matches.map((f) => path.relative(IMF_ROOT, f))).toEqual(['config/auth.ts']);
  });

  it('the auth boundary file actually contains a process.env read', () => {
    const authFile = path.join(IMF_ROOT, 'config', 'auth.ts');
    const src = fs.readFileSync(authFile, 'utf8');
    expect(src).toMatch(/process\.env\s*(?:\.\s*IMF_SDMX_SUBSCRIPTION_KEY|\[\s*['"]IMF_SDMX_SUBSCRIPTION_KEY['"]\s*\])/);
  });
});
