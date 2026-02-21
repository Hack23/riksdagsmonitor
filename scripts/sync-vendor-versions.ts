/**
 * Vendor Library Version Sync Script
 *
 * Reads chart.js, d3, and other vendor library versions from package.json
 * and reports any version mismatches with local copies in js/lib/.
 * With the TypeScript migration, vendor libs are imported from npm,
 * so this script primarily validates package.json versions are current.
 *
 * Usage: node --experimental-strip-types scripts/sync-vendor-versions.ts
 *
 * @module scripts/sync-vendor-versions
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface VersionInfo {
  package: string;
  installed: string;
  latest: string;
  current: boolean;
}

const TRACKED_PACKAGES = [
  'chart.js',
  'chartjs-plugin-annotation',
  'd3',
];

function getInstalledVersion(pkg: string): string {
  try {
    const pkgJsonPath = join(ROOT, 'node_modules', pkg, 'package.json');
    if (!existsSync(pkgJsonPath)) return 'not installed';
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as PackageJson & { version?: string };
    return pkgJson.version ?? 'unknown';
  } catch {
    return 'error';
  }
}

function getLatestVersion(pkg: string): string {
  try {
    const result = execSync(`npm view ${pkg} version 2>/dev/null`, { encoding: 'utf-8' });
    return result.trim();
  } catch {
    return 'unknown';
  }
}

function checkVersions(): void {
  const pkgJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as PackageJson;
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

  console.log('Vendor Library Version Report');
  console.log('='.repeat(60));

  const results: VersionInfo[] = [];

  for (const pkg of TRACKED_PACKAGES) {
    const declared = deps[pkg] ?? 'not declared';
    const installed = getInstalledVersion(pkg);
    const latest = getLatestVersion(pkg);
    const current = installed === latest;

    results.push({ package: pkg, installed, latest, current });

    const status = current ? '✅' : '⚠️';
    console.log(`${status} ${pkg}`);
    console.log(`   Declared:  ${declared}`);
    console.log(`   Installed: ${installed}`);
    console.log(`   Latest:    ${latest}`);
  }

  // Check for stale vendor copies in js/lib/
  const libDir = join(ROOT, 'js', 'lib');
  if (existsSync(libDir)) {
    console.log('\n⚠️  WARNING: js/lib/ directory still exists.');
    console.log('   Vendor libraries should be imported from npm via src/browser/main.ts');
    console.log('   Consider removing js/lib/ to avoid version confusion.');
  }

  const outdated = results.filter((r) => !r.current);
  if (outdated.length > 0) {
    console.log(`\n${outdated.length} package(s) can be updated:`);
    for (const r of outdated) {
      console.log(`  npm install ${r.package}@${r.latest}`);
    }
  } else {
    console.log('\nAll tracked packages are up to date.');
  }
}

checkVersions();
