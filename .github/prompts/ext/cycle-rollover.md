# ext — Election Cycle Rollover (± 30 days of a Swedish election anchor)

> **Bounded-context module.** Loaded by `news-election-cycle.md` and any future cycle-aware workflow. Active **only** when `$ARTICLE_DATE` is within ± 30 days of a Swedish election anchor (next is **2026-09-13**). Outside the window this module is a no-op — its checks short-circuit and emit a single line: `cycle-rollover: window inactive (T-NN days)`.

The next Swedish general election is **2026-09-13**. This module encodes the precise file-rename + content-carry-forward + PIR-archival procedure that converts an in-flight `election-cycle/current/` artifact set into the `election-cycle/next/` baseline once the registry's `electionCycleAnchor` flips. The same procedure repeats for the 2030-09-08 anchor and for every subsequent quadrennial anchor, parameterised by `analysis/article-types.json → electionCycles`.

---

## 1 — Activation predicate

```bash
ELECTION_DATE=$(jq -r '.electionCycles.next.start' analysis/article-types.json)
TODAY="$ARTICLE_DATE"
DAYS_DELTA=$(( ($(date -d "$TODAY" +%s) - $(date -d "$ELECTION_DATE" +%s)) / 86400 ))
if [ "${DAYS_DELTA#-}" -gt 30 ]; then
  echo "cycle-rollover: window inactive (T${DAYS_DELTA} days)" >&2
  exit 0
fi
```

When active, the rollover module hooks into the analysis pipeline at three points:

1. **Pre-flight** (`03-data-download.md`) — locate the most recent `election-cycle/current/` artifact set in the predecessor manifest and load it as the carry-forward baseline.
2. **Post-Pass-2** (`04-analysis-pipeline.md`) — apply the rename + carry-forward procedure §3.
3. **Pre-aggregate** (`06-article-generation.md`) — emit a `cycle-rollover-report.md` summarising the conversion.

### Anchor-coverage hard rule

When `cycle_anchor=both`, both `election-cycle/current/` and `election-cycle/next/` are expected outputs. Skipping an anchor because of runtime pressure is not allowed. If an anchor is intentionally skipped, `methodology-reflection.md` must include an **Anchor coverage decision** entry citing a formal reason:

- `cycle-rollover-window-inactive` (predicate outside ±30-day window and operator explicitly selected a single anchor), or
- `cycle-rollover-window-transition` (T+31 → T+45 freeze semantics from §2 table).

`time-budget`, `timeout`, or equivalent wording is never a valid anchor-skip reason.

---

## 2 — Cycle-anchor flip rule

The `electionCycleAnchor` field in the registry is **not** automatically rotated. Operators flip it via a dedicated PR after the official Riksdagen has been seated (typically T+45 to T+60 days post-election, after government formation negotiations). The rollover module covers the **bridge period** (T-30 → T+45) when both anchors are simultaneously authoritative:

| Days from election | `cycle_anchor` semantics | Rollover behaviour |
|--------------------|--------------------------|---------------------|
| T-30 → T-1 | `current` cycle still authoritative; `next` cycle pre-positioned | Both anchors generated; `next/` artifacts marked `[provisional pre-election]` |
| T+0 (election day) | Vote count in progress | Single-run emergency: no PR until results lock; reuses `realtime-monitor` workflow instead |
| T+1 → T+30 | Vote count locked; government formation in progress | Both anchors generated; `current/` artifacts add a `# 📜 Mandate retrospective` H1; `next/` upgraded from provisional |
| T+31 → T+45 | Government formed | Single-run: only `next/` is regenerated; `current/` is **frozen** as historical record |

---

## 3 — File-rename + content-carry-forward procedure

> 🛠 **File-write contract**: every archival write (`analysis/cycles/2022-2026/mandate-scorecard.md`, `ku-reprimands.md`, `cohesion-trajectory.md`), every PIR carry-forward append to the new-cycle `intelligence-assessment.md`, and the T+0 `cycle-trajectory.md` rewind MUST be performed with the `edit` tool. **Never** use `python3`, `node -e`, `sed -i`, `echo … > file`, `tee file`, or unquoted heredocs (`<<EOF`) on any cycle-rollover artifact. See [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](../01-bash-and-shell-safety.md).

When the operator flips `electionCycleAnchor` from `current` to `next` in `analysis/article-types.json`, the rollover procedure defined in this module performs the following idempotent operations against the **most recent** `election-cycle/current/synthesis-summary.md` predecessor.

> **Implementation status.** `scripts/cycle-rollover.ts` is **planned future work** and is **not yet implemented in this repository**. Until that script lands, the steps below are operator-run/manual workflow instructions; election-window runs MUST NOT invoke `scripts/cycle-rollover.ts` and MUST NOT auto-create `analysis/cycles/` directories. The `analysis/cycles/` archival paths referenced in §3.2 are the **target layout** for the future script; operators performing manual rollover should `mkdir -p analysis/cycles/<cycle-range>/` before copying files.

### 3.1 Filename aliases

The rollover preserves the canonical-filename pattern already used elsewhere in the repo (e.g. `historical-baseline.md` ↔ `historical-parallels.md`):

| Pre-rollover filename | Post-rollover filename | Behaviour |
|-----------------------|------------------------|-----------|
| `election-2026-analysis.md` | `election-cycle-analysis.md` | **Aliased**; both names map to the same artifact via `FILENAME_ALIASES` in `scripts/render-lib/aggregator/order.ts`. When both exist the aggregator prefers `election-2026-analysis.md` (first in `AGGREGATION_ORDER`). Post-rollover, workflows write `election-cycle-analysis.md` as the cycle-agnostic canonical name; write only one name per run to avoid the dedup ambiguity. |
| `cycle-trajectory.md` | `cycle-trajectory.md` | Unchanged filename; **content** rewinds to T+0 baseline (see §3.3). |
| `intelligence-assessment.md` | `intelligence-assessment.md` | PIRs prefixed by `[CYCLE-2022-2026]` are **archived** (see §4); new PIRs prefixed `[CYCLE-2026-2030]` are seeded. |

### 3.2 Carry-forward content

A small, fixed subset of analysis carries forward from the closing cycle into the opening cycle:

- **Mandate-fulfilment scorecard** → archived under `analysis/cycles/2022-2026/mandate-scorecard.md` (one-time write); referenced by the new cycle's `historical-parallels.md` as the closest precedent.
- **KU reprimands ledger** → archived under `analysis/cycles/2022-2026/ku-reprimands.md`.
- **Coalition cohesion trajectory** → archived under `analysis/cycles/2022-2026/cohesion-trajectory.md`.
- **Open PIRs flagged as `inheritsCycle: true`** → carried forward verbatim with provenance preserved.

### 3.3 Cycle-trajectory rewind

`cycle-trajectory.md` for the new cycle starts with a **deliberately empty T+0 baseline**:

- ICD 203 BLUF: "Cycle 2026-2030 baseline established. No mandate trajectory observable yet (T+0)."
- WEP for every horizon band: `roughly even` (cannot reasonably be otherwise without 2+ years of evidence).
- Three forward indicators seeded: (a) first government statement / regeringsförklaring, (b) BP autumn-2026 fiscal stance, (c) first KU referral.

Subsequent runs accrete evidence onto this baseline; the ICD 203 BLUF strengthens organically.

---

## 4 — PIR archival

Every PIR in `pir-status.json` declared during the closing cycle is rotated:

```jsonc
// before flip:
{
  "id": "PIR-1-coalition-stability",
  "cycle": "2022-2026",
  "status": "open",
  "obsolescenceDate": "2026-09-13"
}
// after flip:
{
  "id": "PIR-1-coalition-stability",
  "cycle": "2022-2026",
  "status": "archived",
  "archivedReason": "cycle-rollover-2026-09-13",
  "successor": "PIR-1-coalition-stability-2026-2030"
}
```

PIRs marked `inheritsCycle: true` (the small set that survive the cycle boundary, e.g. PIR-7 `Democratic Norms`) get a successor PIR seeded automatically with `parent` linkage to the archived predecessor.

---

## 5 — Operator runbook

The flip from `current` to `next` is a **CEO-approved Normal change** under `Change_Management.md`. `scripts/cycle-rollover.ts` is **not yet implemented**, so the rollover is currently performed manually in the PR:

1. Bump `analysis/article-types.json` `electionCycles.current` to the closed-out cycle and `next` to the new "next" placeholder.
2. Perform a manual dry-run review in the PR description: list every `analysis/election-cycle/current/` artifact that will be carried forward into `analysis/election-cycle/next/`, every cycle-scoped artifact that will be archived, and every PIR successor that will be seeded for entries marked `inheritsCycle: true`.
3. Apply the rollover manually: archive cycle-scoped PIRs with `status: "archived"`, `archivedReason: "cycle-rollover-<election-date>"`, and `successor` where applicable; seed successor PIRs with `parent` linkage; and carry forward the `next/` baseline files into the new cycle state described in this module.
4. Update `analysis/methodologies/electoral-domain-methodology.md` cycle table.
5. Append the activation row to `analysis/cycles/rollover-log.md` using the format in §7 (operator must `mkdir -p analysis/cycles/` if the directory does not yet exist — see §3 implementation-status note).
6. Open the PR; `tests/article-types.test.ts > election cycle coherence` MUST pass.

The whole sequence is intended to be idempotent — re-applying the same manual rollover on already-rotated state should result in no further content changes. Once `scripts/cycle-rollover.ts` ships, steps 2–3 are expected to collapse into `--dry-run` / `--apply` invocations.

---

## 6 — Out of scope

- **The election day itself** (T+0) is covered by `news-realtime-monitor.md`, not this module.
- **Per-document Family-E coverage** of the elected MPs (the new 349 ledamöter) is bootstrapped by `news-monthly-review.md` runs T+30 onward, not by this module.
- **Coalition-formation prediction** before election day uses `news-election-cycle.md → next` anchor with `[provisional pre-election]` marker; after election day the anchor moves to `current` once the operator flips the registry.

---

## 7 — Audit trail

Every activation of this module appends a one-line audit row to `analysis/cycles/rollover-log.md`:

```
2026-09-13 | cycle-rollover | activated | from=2022-2026 to=2026-2030 | run-id=<workflow-run-url>
```

This file is append-only and serves as the historical record of every cycle transition the platform has handled.
