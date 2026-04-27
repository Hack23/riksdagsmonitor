/**
 * @module Infrastructure/PoliticalIntelligence/DailyStreams
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Daily-stream artifact discovery
 *
 * @description
 * Walks `analysis/daily/<YYYY-MM-DD>/<stream>/` to produce a structured
 * `DailyDay[]` with one entry per date and one `DailyStream` per workflow
 * stream. Recursively counts `.md` / `.json` artifacts. Sorted newest-first.
 *
 * Round-6 split: extracted from `scripts/generate-political-intelligence.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { buildGithubUrl } from './catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..', '..');
const DAILY_DIR = path.join(ROOT_DIR, 'analysis', 'daily');

export interface DailyArtifact {
  readonly file: string;
  /** Path relative to analysis/daily (e.g. 2026-04-23/propositions/executive-brief.md). */
  readonly relative: string;
  readonly githubUrl: string;
}

export interface DailyStream {
  readonly name: string;
  readonly githubUrl: string;
  readonly artifactCount: number;
  readonly artifacts: DailyArtifact[];
}

export interface DailyDay {
  readonly date: string;
  readonly githubUrl: string;
  readonly streams: DailyStream[];
  readonly totalArtifacts: number;
}

export function countArtifactsRecursive(dir: string): number {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      n += countArtifactsRecursive(full);
    } else if (e.isFile() && /\.(md|json)$/i.test(e.name)) {
      n += 1;
    }
  }
  return n;
}

/** Recursively collect every `.md`/`.json` artifact under a stream folder, sorted by relative path. */
export function collectStreamArtifacts(streamDir: string, streamRelativeBase: string): DailyArtifact[] {
  if (!fs.existsSync(streamDir)) return [];
  const out: DailyArtifact[] = [];
  const walk = (dir: string, relBase: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) {
        walk(full, rel);
      } else if (e.isFile() && /\.(md|json)$/i.test(e.name)) {
        out.push({
          file: rel,
          relative: `${streamRelativeBase}/${rel}`,
          githubUrl: buildGithubUrl('blob', `analysis/daily/${streamRelativeBase}/${rel}`),
        });
      }
    }
  };
  walk(streamDir, '');
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

export function collectDailyDays(): DailyDay[] {
  if (!fs.existsSync(DAILY_DIR)) return [];
  const days: DailyDay[] = [];
  const dateEntries = fs.readdirSync(DAILY_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => b.localeCompare(a)); // newest first

  for (const date of dateEntries) {
    const dateDir = path.join(DAILY_DIR, date);
    const streamNames = fs.readdirSync(dateDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    const streams: DailyStream[] = streamNames.map((name) => {
      const streamDir = path.join(dateDir, name);
      const artifacts = collectStreamArtifacts(streamDir, `${date}/${name}`);
      return {
        name,
        githubUrl: buildGithubUrl('tree', `analysis/daily/${date}/${name}`),
        artifactCount: artifacts.length || countArtifactsRecursive(streamDir),
        artifacts,
      };
    });

    const totalArtifacts = streams.reduce((a, s) => a + s.artifactCount, 0);

    days.push({
      date,
      githubUrl: buildGithubUrl('tree', `analysis/daily/${date}`),
      streams,
      totalArtifacts,
    });
  }

  return days;
}
