/**
 * Unit tests for `scripts/vite-plugin-sw-build-id.js`.
 *
 * Validates:
 * - `resolveBuildId` behaviour under GITHUB_SHA env, git fallback, and
 *   the Date-based fallback when neither is available.
 * - The Vite plugin contract: name, apply, enforce, and closeBundle handler.
 * - That `closeBundle` substitutes every `__BUILD_ID__` occurrence and
 *   emits the correct `dist/sw.js` file.
 * - Error paths (missing source file, missing placeholder).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// We import the default export after env manipulation so we must reset
// the module cache between cases that mutate process.env.
let swBuildIdPlugin: (options: { projectRoot: string; outDir?: string }) => {
  name: string;
  apply: string;
  enforce: string;
  closeBundle: { order: string; sequential: boolean; handler: () => void };
};

function loadPlugin() {
  return import('../scripts/vite-plugin-sw-build-id.js?t=' + Date.now());
}

// ---------------------------------------------------------------------------
// Helper: build a minimal project-root with public/sw.js
// ---------------------------------------------------------------------------

interface Rig {
  projectRoot: string;
  distDir: string;
  swSrc: string;
}

function setupRig(placeholder = '__BUILD_ID__'): Rig {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-build-id-test-'));
  const distDir = path.join(projectRoot, 'dist');
  const publicDir = path.join(projectRoot, 'public');
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  const swSrc = path.join(publicDir, 'sw.js');
  fs.writeFileSync(swSrc, `const CACHE = '${placeholder}';`, 'utf8');
  return { projectRoot, distDir, swSrc };
}

function teardownRig(rig: Rig) {
  fs.rmSync(rig.projectRoot, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Plugin shape contract
// ---------------------------------------------------------------------------

describe('vite-plugin-sw-build-id — plugin shape', () => {
  it('exports a factory that returns the expected Vite plugin shape', async () => {
    const mod = await import('../scripts/vite-plugin-sw-build-id.js');
    const factory = mod.default;
    const rig = setupRig();
    try {
      const plugin = factory({ projectRoot: rig.projectRoot });
      expect(plugin.name).toBe('sw-build-id');
      expect(plugin.apply).toBe('build');
      expect(plugin.enforce).toBe('post');
      expect(typeof plugin.closeBundle.handler).toBe('function');
      expect(plugin.closeBundle.order).toBe('post');
      expect(plugin.closeBundle.sequential).toBe(true);
    } finally {
      teardownRig(rig);
    }
  });
});

// ---------------------------------------------------------------------------
// closeBundle handler — happy path
// ---------------------------------------------------------------------------

describe('vite-plugin-sw-build-id — closeBundle handler', () => {
  const savedEnv = process.env.GITHUB_SHA;

  afterEach(() => {
    if (savedEnv === undefined) {
      delete process.env.GITHUB_SHA;
    } else {
      process.env.GITHUB_SHA = savedEnv;
    }
  });

  it('substitutes __BUILD_ID__ with a GITHUB_SHA-derived value', async () => {
    process.env.GITHUB_SHA = 'abc1234567890def';
    const mod = await import('../scripts/vite-plugin-sw-build-id.js');
    const rig = setupRig();
    try {
      const plugin = mod.default({ projectRoot: rig.projectRoot });
      plugin.closeBundle.handler();
      const out = fs.readFileSync(path.join(rig.distDir, 'sw.js'), 'utf8');
      // The build-id should be the first 12 chars of GITHUB_SHA
      expect(out).toContain('abc123456789');
      expect(out).not.toContain('__BUILD_ID__');
    } finally {
      teardownRig(rig);
    }
  });

  it('substitutes __BUILD_ID__ via git fallback when GITHUB_SHA is not set', async () => {
    delete process.env.GITHUB_SHA;
    const mod = await import('../scripts/vite-plugin-sw-build-id.js');
    const rig = setupRig();
    try {
      const plugin = mod.default({ projectRoot: rig.projectRoot });
      plugin.closeBundle.handler();
      const out = fs.readFileSync(path.join(rig.distDir, 'sw.js'), 'utf8');
      // Either git SHA or t<timestamp> — either way no placeholder remains.
      expect(out).not.toContain('__BUILD_ID__');
    } finally {
      teardownRig(rig);
    }
  });

  it('replaces ALL occurrences of __BUILD_ID__ in the source file', async () => {
    process.env.GITHUB_SHA = 'aabbccdd112233445566';
    const mod = await import('../scripts/vite-plugin-sw-build-id.js');
    const rig = setupRig();
    // Write a source file with three occurrences of the placeholder
    fs.writeFileSync(
      path.join(rig.projectRoot, 'public', 'sw.js'),
      `const A='__BUILD_ID__'; const B='__BUILD_ID__'; const C='__BUILD_ID__';`,
      'utf8',
    );
    try {
      const plugin = mod.default({ projectRoot: rig.projectRoot });
      plugin.closeBundle.handler();
      const out = fs.readFileSync(path.join(rig.distDir, 'sw.js'), 'utf8');
      expect((out.match(/aabbccdd1122/g) ?? []).length).toBe(3);
      expect(out).not.toContain('__BUILD_ID__');
    } finally {
      teardownRig(rig);
    }
  });

  it('supports a custom outDir option', async () => {
    process.env.GITHUB_SHA = 'deadbeef00000000';
    const mod = await import('../scripts/vite-plugin-sw-build-id.js');
    const rig = setupRig();
    const customOut = path.join(rig.projectRoot, 'custom-dist');
    fs.mkdirSync(customOut, { recursive: true });
    try {
      const plugin = mod.default({ projectRoot: rig.projectRoot, outDir: 'custom-dist' });
      plugin.closeBundle.handler();
      const out = fs.readFileSync(path.join(customOut, 'sw.js'), 'utf8');
      expect(out).not.toContain('__BUILD_ID__');
    } finally {
      teardownRig(rig);
    }
  });
});

// ---------------------------------------------------------------------------
// closeBundle handler — error paths
// ---------------------------------------------------------------------------

describe('vite-plugin-sw-build-id — error paths', () => {
  it('throws when public/sw.js does not exist', async () => {
    const mod = await import('../scripts/vite-plugin-sw-build-id.js');
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-missing-'));
    fs.mkdirSync(path.join(projectRoot, 'dist'), { recursive: true });
    // public/ directory is absent — no sw.js
    try {
      const plugin = mod.default({ projectRoot });
      expect(() => plugin.closeBundle.handler()).toThrow(/not found/i);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it('throws when sw.js is missing the __BUILD_ID__ placeholder', async () => {
    const mod = await import('../scripts/vite-plugin-sw-build-id.js');
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-no-placeholder-'));
    const distDir = path.join(projectRoot, 'dist');
    const publicDir = path.join(projectRoot, 'public');
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'sw.js'), `const CACHE = 'v1';`, 'utf8');
    try {
      const plugin = mod.default({ projectRoot });
      expect(() => plugin.closeBundle.handler()).toThrow(/__BUILD_ID__/);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
