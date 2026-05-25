# Data download manifest — scaffold

**Workflow**: News: Opposition Motions
**Run**: 26390391956 attempt 1
**Started (UTC)**: 2026-05-25T08:12:47Z
**Requested date**: 2026-05-25
**Subfolder**: motions
**Improvement mode**: false
**Status**: scaffold — populated as the pipeline progresses.

> This file is written before any MCP call so even a fully-failed run
> produces a non-empty diff and a partial PR rather than a silent no-op.

## MCP attempts

- Attempt 1 (2026-05-25T08:13:14Z): riksdag-regering MCP live — `{"status":"live","generated_at":"2026-05-25T08:13:14.188Z"}`

## Per-document table

| dok_id | Title | Type | Committee | Sponsor | Date | Full-text | Status |
|--------|-------|------|-----------|---------|------|-----------|--------|
| HD024192 | Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | Kommittémotion | JuU | Ulrika Westerlund m.fl. (MP) | 2026-05-22 | ✅ | Active |
| HD024191 | Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | Kommittémotion | SkU | Annika Hirvonen m.fl. (MP) | 2026-05-22 | metadata-only | Active |
| HD024190 | EU-Kirgizistan partnership | Kommittémotion | UU | Jacob Risberg m.fl. (MP) | 2026-05-21 | metadata-only | Active |
| HD024189 | EU-Uzbekistan partnership | Kommittémotion | UU | Jacob Risberg m.fl. (MP) | 2026-05-21 | metadata-only | Active |
| HD024188 | Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | Kommittémotion | JuU | Gudrun Nordborg m.fl. (V) | 2026-05-21 | ✅ | Active |
| HD024187 | Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | Kommittémotion | SkU | Ilona Szatmári Waldau m.fl. (V) | 2026-05-21 | ✅ | Active |
| HD024186 | Stickprovsinsamling av uppgifter om hushållens skulder | Kommittémotion | FiU | Janine Alm Ericson m.fl. (MP) | 2026-05-20 | metadata-only | Active |
| HD024185 | Stickprovsinsamling av uppgifter om hushållens skulder | Kommittémotion | FiU | Mikael Damberg m.fl. (S) | 2026-05-20 | metadata-only | Active |

**Total documents**: 8 | **Full-text retrieved**: 3 (HD024192, HD024188, HD024187) | **Lookback needed**: No (sufficient data on primary date)

## Full-Text Fetch Outcomes

| dok_id | Status | Notes |
|--------|--------|-------|
| HD024192 | ✅ Retrieved | MP motion on security detention of foreigners — 3 yrkanden |
| HD024188 | ✅ Retrieved | V motion demanding full rejection of prop 2025/26:267 — 1 yrkande |
| HD024187 | ✅ Retrieved | V motion rejecting Skatteverket biometric expansion — Admiralty [A1] |

## Prior-Voteringar Enrichment

Prior-voteringar search: JuU 2024/25 — count: 0 (no directly comparable vote found in last 4 riksmöten for this specific security-screening topic).
Prior-voteringar search: JuU 2025/26 — count: 0 (new riksmöte cycle; using 2024/25 proxy: Vänsterpartiet and Miljöpartiet opposed LSU introduction in mot. 2021/22:4444 and mot. 2021/22:4431 respectively — consistent opposition pattern).

Fallback applied: expanded riksmöte search (4 → 6) and committee-keyword search. Documented as methodology limitation: 🟡 partial, new riksmöte cycle.

## Statskontoret Cross-Source Enrichment

Triggers evaluated:
- HD024192/HD024188: Names Säkerhetspolisen (SÄPO) and Migrationsverket — **trigger fired** (named agencies, implementation feasibility risk)
- HD024187/HD024191: Names Skatteverket and Migrationsverket — **trigger fired** (biometric IT system, inter-agency coordination claim)

Statskontoret web_fetch outcome: `www.statskontoret.se` — relevant reports on Migrationsverket operational capacity and Skatteverket population registry modernisation referenced in implementation-feasibility.md. No specific 2026 report directly on LSU expansion found; citing 2024 Statskontoret report on Migrationsverket capacity (report 2024:10) as background.

## Lagrådet Tracking

Prop. 2025/26:267 (LSU expansion): Touches fundamental rights (ECHR Art. 5 liberty, Art. 3 inhuman treatment), child detention, lower evidence thresholds. **Lagrådet review is statutory** for such fundamental-rights measures.
web_fetch to lagradet.se: Lagrådet referral for prop. 2025/26:267 — **referral published; yttrande pending as of 2026-05-25T08:15:00Z**. No yttrande text available yet. Forward indicator added.

## PIR Carry-Forward

Prior-cycle PIR scan: no prior pir-status.json found in analysis/daily under motions subfolder. New PIR cycle initiated.

## Withdrawn Documents

None identified in this download cycle.

