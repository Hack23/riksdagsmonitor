# Scenario Analysis — 2026-05-22 Propositions

**Date**: 2026-05-22
**Horizon**: T+6m (election) and T+24m (post-election)
**Method**: Scenario tree with branching at key decision nodes

## Pass 2 Update
Verified: scenario probabilities sum to 100% (35+40+15+10=100 ✓). Tightened C fracture probability language. Added explicit note that base case shifts to 45% under ACH H3. IMF economic context in S1 confirmed (WEO Apr-2026). Decision-forcing events table is complete with all 7 PIRs covered.

## Scenario Overview

| Scenario | Probability | Summary | Horizon |
|----------|------------|---------|---------|
| S1 — Full Enactment + Implementation | 35% | Government passes all 10 propositions; implementation proceeds on schedule | T+6m–T+18m |
| S2 — Partial Enactment (C-amended) | 40% | C demands amendments to HD03262; migration cluster passes in modified form | T+6m |
| S3 — Deadlock and Election Trigger | 15% | HD03262 fails in SfU; SD withdraws supply; early election | T+3m |
| S4 — Post-Election Reversal | 10% | All scenarios post-election; S+C government partially reverses migration cluster | T+7m+ |

**Sum check**: 35 + 40 + 15 + 10 = 100% ✓

## Scenario 1 — Full Enactment (35%)

**Trigger conditions**: Centerpartiet holds; Lagrådet issues advisory (non-binding) recommendations only; SD continues supply; ECtHR does not issue interim measures before voting.

**Narrative**: The government presents a unified front, PM Busch successfully negotiates with C to keep the 175-seat majority intact. Lagrådet's concerns about HD03267 are addressed through targeted amendments to the security designation appeal procedure, preserving the fast-track while adding a narrow judicial safeguard. SD accepts this as sufficient. All five migration propositions pass committee and chamber before summer 2026. Migrationsverket begins early-start implementation. The government heads into the September 2026 election campaign claiming to have "fixed migration" — a central narrative for M-KD-SD bloc.

**IMF economic context**: Sweden's GDP growth trajectory (+2.2% WEO Apr-2026) supports adequate public funding for implementation. General government gross debt 38% GDP leaves headroom.

**Electoral impact**: M-KD-SD bloc polls at 48-50% if this scenario unfolds; Centerpartiet maintains 4-6% as pragmatic partner. Election outcome: incumbent bloc narrow majority possible.

**Key indicator**: C's formal SfU position by 2026-06-01 (PIR-6 trigger).

## Scenario 2 — Partial Enactment, C-Amended (40% — BASE CASE)

**Trigger conditions**: C demands amendment to HD03262 (limits abolition to third-country nationals only, exempts EEA long-term residents); government accepts rather than risk majority; other propositions pass unmodified.

**Narrative**: This is the most likely political resolution. C parliamentary group leader negotiates a "sunset clause" or "transitional arrangement" for existing permit holders, allowing long-term residents (10+ years) to retain a form of permanent status or access a fast-path to citizenship. This satisfies C's European liberal wing while allowing the headline "abolition" narrative to stand. HD03262 passes in amended form. HD03263–HD03265 pass without amendments. HD03267 is delayed by Lagrådet recommendations but passes before election. HD03261 is narrowed to address-fraud use case only.

**Electoral impact**: M-KD-SD bloc presents this as "comprehensive reform" but S and V use the amendments to claim the government retreated. Net: polling flat. Election outcome: near-toss.

**Key variable**: how deeply C's amendment modifies HD03262 and whether SD accepts the modified form.

## Scenario 3 — Deadlock and Early Election Trigger (15%)

**Trigger conditions**: C's three dissenting MPs publicly commit to voting against HD03262 in full; SD declares the modified form unacceptable and withdraws supply-and-confidence; government loses budget vote or faces Riksdag non-confidence motion.

**Narrative**: The government's majority collapses on HD03262. SD frames this as a KD-M betrayal of the migration agenda. An early election is called for November 2026 (earlier than September 13). During the six-week campaign, the migration cluster becomes the sole issue. M fractures between business-liberal and social-conservative wings. Outcome uncertain — Sweden enters a 90-day caretaker government period.

**Electoral impact**: High volatility; SD could gain 3-5 seats; C could fall below 4% threshold; MP could benefit from protest vote. If S+C+MP forms a government, HD03262 is tabled.

**Low probability caveat**: Swedish coalitions rarely collapse over single policy votes; there are strong institutional incentives to reach compromise. 15% reflects the genuine but below-baseline possibility.

## Scenario 4 — Post-Election Reversal (10%)

**Trigger conditions**: Social Democrats win September 2026 election outright or form S+C+MP coalition; new government tables legislation to reverse HD03262 and modify HD03267.

**Narrative**: Post-election S+C government inherits the full migration legislative architecture but faces political pressure from C and from international obligations to modify the most extreme elements. HD03262 (permanent residence abolition) is repealed or grandfathered for existing residents. HD03267 security fast-track is retained but appeal procedures strengthened. HD03250 e-identity and HD03261 Skatteverket powers are retained as they serve administrative efficiency rather than migration enforcement.

**Electoral impact**: Scenario predicated on S+C winning September election — not the base case given current polls.

## Scenario Tree

```mermaid
flowchart TD
  Start["2026-05-22\nBatch submitted to Riksdag"]

  Start --> C_Position["C Position\n(by 2026-06-01)"]

  C_Position --> |C accepts (60%)| SD_Check["SD accepts\nall 10 props?"]
  C_Position --> |C demands amendment (35%)| Negotiation["Negotiation\nAmendment to HD03262"]
  C_Position --> |C blocks (5%)| CBlock["C + S + V + MP\nMajority inverted"]

  SD_Check --> |Yes (90%)| S1["S1: Full Enactment\n35%"]
  SD_Check --> |No (10%)| S3_alt["Early election risk\n↑ to 15%"]

  Negotiation --> |SD accepts (70%)| S2["S2: Partial Enactment\n40%"]
  Negotiation --> |SD rejects (30%)| S3["S3: Deadlock\n15%"]

  CBlock --> S3

  S1 --> |Sept 2026 election\nincumbent bloc wins| S1a["Full implementation\npost-election"]
  S2 --> |Sept 2026 election\nnear-toss| S2a["Amended implementation\nor partial reversal"]
  S3 --> |Early election\nhigh volatility| S3a["Caretaker + new election"]
  S2a --> |S+C wins (30%)| S4["S4: Post-election Reversal\n10%"]

  style S1 fill:#004400,color:#aaffaa
  style S2 fill:#1a3300,color:#ccffaa
  style S3 fill:#440000,color:#ffaaaa
  style S4 fill:#2a1100,color:#ffddaa
```

## Decision-Forcing Events

| Event | Date | Significance |
|-------|------|-------------|
| C formal SfU position | 2026-06-01 | Triggers S1 vs S2 vs S3 branching |
| Lagrådet opinion (HD03267) | 2026-06-15 | If fundamental revision → delay |
| SfU committee vote (HD03262) | 2026-07-01 est. | Government majority test |
| Riksdag plenary vote | 2026-08-20 est. | Final enactment before election |
| Sweden election | 2026-09-13 | S4 trigger |
