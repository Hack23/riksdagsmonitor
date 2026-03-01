/**
 * @module shared/version
 * @description Centralised package version loader with safe fallback.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadPkgVersion(): string {
  try {
    const pkgJsonPath = join(__dirname, '..', '..', 'package.json');
    const pkgRaw = readFileSync(pkgJsonPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw) as { version?: string };
    if (typeof pkg.version === 'string' && pkg.version.trim() !== '') {
      return pkg.version;
    }
  } catch {
    // Fallback to a safe default if package.json cannot be read or parsed.
  }
  return '0.0.0';
}

export const PKG_VERSION: string = loadPkgVersion();
