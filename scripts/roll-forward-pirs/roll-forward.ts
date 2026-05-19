/**
 * @module roll-forward-pirs/roll-forward
 * @description Pure transformation that turns yesterday's `pir-status.json`
 * into today's: open PIRs degrade and accumulate genealogy, non-open PIRs
 * are carried forward unchanged.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';

import { degrade } from './confidence.js';
import { REPO_ROOT } from './constants.js';
import type { CycleType, PirEntry, PirStatusFile } from './types.js';

/**
 * Roll-forward semantics:
 * - Open PIRs carry forward to the new file with confidence degraded one
 *   step and `inherits_from` extended by the parent `pir_id` so genealogy
 *   inheritance is fully preserved.
 * - Non-open PIRs (answered, superseded, deferred, cancelled) are carried
 *   forward UNCHANGED — including any pre-existing `inherits_from` chain —
 *   so the historical lineage is never lost.
 */
export function rollForward(
  source: PirStatusFile,
  sourcePath: string,
  targetDate: string,
  targetCycle: CycleType,
  options: { now?: () => Date; repoRoot?: string } = {},
): PirStatusFile {
  const now = options.now ?? (() => new Date());
  const repoRoot = options.repoRoot ?? REPO_ROOT;

  const pirs: PirEntry[] = source.pirs.map((p) => {
    if (p.status !== 'open') {
      return { ...p };
    }
    const { answer_summary: _dropped, ...rest } = p;
    void _dropped;
    return {
      ...rest,
      confidence: degrade(p.confidence),
      inherits_from: [...(p.inherits_from ?? []), p.pir_id],
    };
  });

  const relativeToRepo = path.relative(repoRoot, sourcePath);
  const relativeSourcePath =
    relativeToRepo &&
    !relativeToRepo.startsWith('..') &&
    !path.isAbsolute(relativeToRepo)
      ? relativeToRepo.split(path.sep).join('/')
      : sourcePath.split(path.sep).join('/');

  return {
    schema_version: '1.0',
    cycle: targetCycle,
    date: targetDate,
    subfolder: targetCycle,
    generated_at: now().toISOString(),
    inherited_from: relativeSourcePath,
    pirs,
  };
}
