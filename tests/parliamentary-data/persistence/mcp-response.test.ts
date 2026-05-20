/**
 * @file mcp-response.test.ts
 * @module tests/parliamentary-data/persistence/mcp-response
 * @description `persistMCPResponse` happy path + **path-sanitization**
 * (security-relevant trust boundary, see
 * https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md).
 *
 * Split from the original 710-line `tests/data-persistence.test.ts`
 * (issue #2620). Path-sanitization vectors expanded to cover:
 *   - raw `../` traversal
 *   - URL-encoded `%2e%2e/` traversal (and uppercase `%2E%2E%2F`)
 *   - embedded NUL bytes (`\0`)
 *   - absolute path injection (`/etc/...`, `C:\...`)
 *   - dot-only / dot-segment-only server names
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { persistMCPResponse } from '../../../scripts/parliamentary-data/data-persistence.js';

import { mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('persistMCPResponse', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  describe('happy path', () => {
    it('should store generic MCP tool response in server/tool subdirs', () => {
      const resultPath = persistMCPResponse(
        { tool: 'get_sync_status', params: { key: 'val' }, server: 'riksdag-regering' },
        { status: 'ok', last_sync: '2026-03-28' },
        'sync-check',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      expect(data.status).toBe('ok');

      const metaPath = resultPath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.mcpTool).toBe('get_sync_status');
      expect(meta.params.key).toBe('val');
    });

    it('should use UUID-based fallback for empty id', () => {
      const resultPath = persistMCPResponse(
        { tool: 'test_tool', params: {}, server: 'test' },
        { data: true },
        '',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(path.basename(resultPath)).toMatch(
        /^response-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/,
      );
    });

    it('should derive riksmote from call.params.rm when not explicitly provided', () => {
      const resultPath = persistMCPResponse(
        { tool: 'get_propositioner', params: { rm: '2025/26' }, server: 'riksdag-regering' },
        { dokument_lista: [] },
        'rm-test',
        tmpDir,
      );
      const metaPath = resultPath.replace('.json', '.meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.riksmote).toBe('2025/26');
    });

    it('should use explicit riksmote param over call.params.rm', () => {
      const resultPath = persistMCPResponse(
        { tool: 'get_propositioner', params: { rm: '2024/25' }, server: 'riksdag-regering' },
        { dokument_lista: [] },
        'rm-override-test',
        tmpDir,
        '2025/26',
      );
      const metaPath = resultPath.replace('.json', '.meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.riksmote).toBe('2025/26');
    });
  });

  describe('path traversal prevention', () => {
    it('should sanitize raw `../` in server and tool names', () => {
      const resultPath = persistMCPResponse(
        { tool: '../../../etc', params: {}, server: '../secret' },
        { safe: true },
        'test-doc',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
      expect(resultPath).not.toContain('../');
    });

    it('should handle dots-only server names', () => {
      const resultPath = persistMCPResponse(
        { tool: 'test', params: {}, server: '..' },
        { safe: true },
        'test-doc',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
    });

    it('should neutralise URL-encoded traversal (%2e%2e/) in server name', () => {
      const resultPath = persistMCPResponse(
        { tool: 'get_x', params: {}, server: '%2e%2e/etc' },
        { safe: true },
        'encoded-traversal',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
      // The persisted path must remain confined under tmpDir even when the
      // attacker uses URL-encoded traversal — `%2e%2e/` literally is fine on
      // disk only if it does not collapse to `../`. The realpath sanity
      // check guarantees we cannot escape.
      const real = fs.realpathSync(path.dirname(resultPath));
      expect(real.startsWith(fs.realpathSync(tmpDir))).toBe(true);
    });

    it('should neutralise uppercase URL-encoded traversal (%2E%2E%2F) in tool name', () => {
      const resultPath = persistMCPResponse(
        { tool: '%2E%2E%2Fpasswd', params: {}, server: 'svr' },
        { safe: true },
        'upper-encoded',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
      const real = fs.realpathSync(path.dirname(resultPath));
      expect(real.startsWith(fs.realpathSync(tmpDir))).toBe(true);
    });

    it('should strip embedded NUL bytes (\\0) from server, tool and id', () => {
      const resultPath = persistMCPResponse(
        { tool: 'safe\0../tool', params: {}, server: 'svr\0name' },
        { safe: true },
        'doc\0id',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
      // NUL bytes must never reach the on-disk filename — most filesystems
      // truncate at NUL and Node throws on writeFile with NUL in the path,
      // so the file existing AT ALL plus the prefix check is the assertion.
      expect(resultPath.includes('\0')).toBe(false);
    });

    it('should reject absolute path injection in tool name (unix)', () => {
      const resultPath = persistMCPResponse(
        { tool: '/etc/passwd', params: {}, server: 'svr' },
        { safe: true },
        'abs-unix',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
    });

    it('should reject absolute path injection in tool name (windows-style)', () => {
      const resultPath = persistMCPResponse(
        { tool: 'C:\\Windows\\System32', params: {}, server: 'svr' },
        { safe: true },
        'abs-win',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
    });

    it('should sanitize multi-level traversal (..\\..\\..)', () => {
      const resultPath = persistMCPResponse(
        { tool: 'tool', params: {}, server: '..\\..\\..\\secret' },
        { safe: true },
        'multi-level',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
      expect(resultPath).not.toContain('..\\');
    });
  });
});
