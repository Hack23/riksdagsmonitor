/**
 * Unit tests for `scripts/check-headline-quality.ts`.
 *
 * Covers the four pure validation helpers (`findSwedishHeadlineTokens`,
 * `hasWeekdayDatePrefix`, `hasIsoDateAffix`, `findBoilerplatePrefixes`)
 * plus the integration `validateH1` aggregator and the `extractH1`
 * frontmatter-aware extractor. No filesystem I/O — these tests run in
 * milliseconds and pin the editorial contract for headline quality.
 */

import { describe, it, expect } from 'vitest';
import {
  extractH1,
  findBoilerplatePrefixes,
  findSwedishHeadlineTokens,
  hasIsoDateAffix,
  hasWeekdayDatePrefix,
  matchesPrettifiedSubfolder,
  normaliseHeadlineForCompare,
  prettifySubfolderPath,
  subfolderFromBriefPath,
  validateH1,
} from '../scripts/check-headline-quality.js';

describe('check-headline-quality — extractH1', () => {
  it('returns the first H1 after stripping YAML frontmatter', () => {
    const md = ['---', 'title: "ignored"', 'date: 2026-05-01', '---', '', '# Real Headline Here', '', 'Body…'].join(
      '\n',
    );
    expect(extractH1(md)).toBe('Real Headline Here');
  });

  it('returns null when there is no H1', () => {
    expect(extractH1('## Subhead only\n\nBody.')).toBeNull();
  });

  it('does not treat a body `---` thematic break as frontmatter', () => {
    const md = ['# Real Headline', '', 'BLUF.', '', '---', '', '## Section'].join('\n');
    expect(extractH1(md)).toBe('Real Headline');
  });

  it('strips trailing whitespace from the H1', () => {
    expect(extractH1('# Trailing spaces here   \n\nbody')).toBe('Trailing spaces here');
  });
});

describe('check-headline-quality — Rule A (Swedish-in-EN H1)', () => {
  it('flags definite-form party names', () => {
    expect(findSwedishHeadlineTokens('Socialdemokraterna criticize budget')).toEqual(['socialdemokraterna']);
    expect(findSwedishHeadlineTokens('Moderaterna and Sverigedemokraterna disagree')).toEqual([
      'moderaterna',
      'sverigedemokraterna',
    ]);
  });

  it('flags Tidö-coalition Swedish slugs', () => {
    expect(findSwedishHeadlineTokens('Tidöavtalet under strain')).toEqual(['tidöavtalet']);
  });

  it('flags untranslated political nouns', () => {
    expect(findSwedishHeadlineTokens('Näringsutskottet announces svarsdatum')).toEqual([
      'näringsutskottet',
      'svarsdatum',
    ]);
  });

  it('does NOT flag Riksdag / Regeringen — convention loans allowed in EN prose', () => {
    expect(findSwedishHeadlineTokens('Riksdag passes bill; Regeringen reshuffles cabinet')).toEqual([]);
  });

  it('does NOT flag English party-name forms', () => {
    expect(findSwedishHeadlineTokens('Social Democrats vote against Moderates proposal')).toEqual([]);
  });

  it('does NOT flag bill / proposition IDs that contain digits', () => {
    expect(findSwedishHeadlineTokens('Committee report JuU28 covers HD03267 and prop. 2025/26:267')).toEqual([]);
  });
});

describe('check-headline-quality — Rule B (weekday-date prefix)', () => {
  it('flags full weekday + day + month + year prefix', () => {
    expect(hasWeekdayDatePrefix('Thursday 21 May 2026 closes with new propositions')).toBe(true);
    expect(hasWeekdayDatePrefix('Monday 4 November 2024 — opposition motions')).toBe(true);
  });

  it('flags abbreviated weekday + month prefix', () => {
    expect(hasWeekdayDatePrefix('Mon 4 Nov 2024 brief')).toBe(true);
  });

  it('does NOT flag headlines that merely start with a weekday word (no date)', () => {
    expect(hasWeekdayDatePrefix('Monday morning briefing on coalition strain')).toBe(false);
    expect(hasWeekdayDatePrefix('Friday opposition motion summary')).toBe(false);
  });

  it('does NOT flag mid-sentence weekday references', () => {
    expect(hasWeekdayDatePrefix("Sweden's parliament reconvenes on Thursday 21 May 2026")).toBe(false);
  });
});

describe('check-headline-quality — Rule C (ISO-date affix)', () => {
  it('flags ISO date at the start', () => {
    expect(hasIsoDateAffix('2026-05-21 — Daily roundup').leading).toBe(true);
  });

  it('flags ISO date at the end after a separator', () => {
    expect(hasIsoDateAffix('Opposition motions — 2026-04-29').trailing).toBe(true);
    expect(hasIsoDateAffix('Brief: 2026-04-29').trailing).toBe(true);
  });

  it('does NOT flag mid-sentence ISO dates', () => {
    const result = hasIsoDateAffix('Sweden votes on bill 2026-05-21 ahead of recess');
    expect(result.leading).toBe(false);
    expect(result.trailing).toBe(false);
  });
});

describe('check-headline-quality — Rule D (boilerplate prefix)', () => {
  it('flags Executive Brief — prefix with leading emoji', () => {
    expect(findBoilerplatePrefixes('📋 Executive Brief — Swedish Government Propositions')).toEqual([
      'Executive Brief',
    ]);
    expect(findBoilerplatePrefixes('Executive Brief — 30 April 2026')).toEqual(['Executive Brief']);
  });

  it('flags Realtime Monitor — prefix', () => {
    expect(findBoilerplatePrefixes('Realtime Monitor — 2026-05-21 23:38')).toEqual(['Realtime Monitor']);
  });

  it('flags Pass 2 and Methodology Reflection scaffolding', () => {
    expect(findBoilerplatePrefixes('Pass 2 self-audit notes')).toEqual(['Pass 2']);
    expect(findBoilerplatePrefixes('Methodology Reflection — daily run')).toEqual(['Methodology Reflection']);
  });

  it('does NOT flag headlines that mention "brief" mid-sentence', () => {
    expect(findBoilerplatePrefixes('Sweden Abolishes Permanent Residence — a brief look')).toEqual([]);
  });
});

describe('check-headline-quality — Rule E (H1 equals prettified subfolder)', () => {
  it('flags bare leaf-label H1 for shallow subfolder', () => {
    expect(matchesPrettifiedSubfolder('Government Propositions', 'propositions')).toBe(false);
    expect(matchesPrettifiedSubfolder('Propositions', 'propositions')).toBe(true);
  });

  it('flags full-path H1 for nested subfolder', () => {
    expect(matchesPrettifiedSubfolder('Election Cycle Current', 'election-cycle/current')).toBe(true);
    expect(matchesPrettifiedSubfolder('Current', 'election-cycle/current')).toBe(true);
  });

  it('ignores trailing/leading whitespace and punctuation when matching', () => {
    expect(matchesPrettifiedSubfolder('  Propositions!  ', 'propositions')).toBe(true);
    // "Election Cycle — Current" normalises to "election cycle current" which matches
    // the full-path prettified label — the em-dash decoration alone is not a real headline.
    expect(matchesPrettifiedSubfolder('Election Cycle — Current', 'election-cycle/current')).toBe(true);
  });

  it('does NOT flag a real actor+verb headline that mentions the category word', () => {
    expect(matchesPrettifiedSubfolder("Sweden's Kristersson Government Submits 970 SEK Plan", 'propositions')).toBe(
      false,
    );
    expect(
      matchesPrettifiedSubfolder('Tidö Coalition Locks In 2026 Election Mandate', 'election-cycle/current'),
    ).toBe(false);
  });

  it('returns false when subfolder is missing', () => {
    expect(matchesPrettifiedSubfolder('Propositions', null)).toBe(false);
    expect(matchesPrettifiedSubfolder('Propositions', '')).toBe(false);
  });

  it('prettifies multi-segment subfolder paths via space-join', () => {
    expect(prettifySubfolderPath('election-cycle/current')).toBe('Election Cycle Current');
    expect(prettifySubfolderPath('week-ahead/foreign-affairs')).toBe('Week Ahead Foreign Affairs');
  });

  it('normaliseHeadlineForCompare strips punctuation and lowercases', () => {
    expect(normaliseHeadlineForCompare('Election Cycle — Current!')).toBe('election cycle current');
  });

  it('subfolderFromBriefPath extracts subfolder relative to analysis/daily/<date>', () => {
    expect(subfolderFromBriefPath('analysis/daily/2026-05-08/propositions/executive-brief.md')).toBe('propositions');
    expect(
      subfolderFromBriefPath('analysis/daily/2026-05-08/election-cycle/current/executive-brief.md'),
    ).toBe('election-cycle/current');
    expect(
      subfolderFromBriefPath('/abs/path/analysis/daily/2026-05-08/week-ahead/executive-brief.md'),
    ).toBe('week-ahead');
  });

  it('subfolderFromBriefPath returns null for non-canonical paths', () => {
    expect(subfolderFromBriefPath('analysis/daily/executive-brief.md')).toBeNull();
    expect(subfolderFromBriefPath('some/other/path.md')).toBeNull();
  });

  it('validateH1 wires Rule E with subfolder argument', () => {
    const issues = validateH1('Propositions', 'propositions');
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('rule-E');
    expect(issues[0]).toContain('propositions');
  });

  it('validateH1 does not fire Rule E when subfolder is omitted', () => {
    expect(validateH1('Propositions')).toEqual([]);
  });
});

describe('check-headline-quality — validateH1 (integration)', () => {
  it('returns empty array for a clean editorial headline', () => {
    expect(validateH1("Sweden Abolishes Permanent Residence — Migration Law Overhaul Advances")).toEqual([]);
  });

  it('returns multiple issues when several rules fire', () => {
    const issues = validateH1('Executive Brief — Socialdemokraterna debate 2026-05-21');
    expect(issues).toHaveLength(3);
    expect(issues[0]).toContain('rule-A');
    expect(issues[0]).toContain('socialdemokraterna');
    expect(issues[1]).toContain('rule-C');
    expect(issues[1]).toContain('trailing');
    expect(issues[2]).toContain('rule-D');
    expect(issues[2]).toContain('Executive Brief');
  });

  it('flags weekday-date-prefix + scaffolding combination', () => {
    const issues = validateH1('Thursday 21 May 2026 closes with new propositions');
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('rule-B');
  });

  it('passes a real editorial headline from the repository', () => {
    // Lifted from analysis/daily/2026-04-30/propositions/executive-brief.md (paraphrased).
    expect(
      validateH1("Sweden's Kristersson Government Submits Historic 970 Billion SEK Infrastructure Plan"),
    ).toEqual([]);
  });
});
