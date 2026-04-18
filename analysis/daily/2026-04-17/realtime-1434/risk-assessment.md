# Risk Assessment — Realtime Monitor 1434

| Field | Value |
|-------|-------|
| **RISK-ID** | RSK-2026-04-17-1434 |
| **Analysis Date** | 2026-04-17 14:34 UTC |
| **Methodology** | `analysis/methodologies/political-risk-methodology.md` v3.0 |
| **Scope** | Constitutional Reforms (PRIMARY) · Ukraine Accountability (SECONDARY) · Housing/AML (TERTIARY) |
| **Validity Window** | Valid until 2026-04-24 |

---

## 🎯 Aggregate Risk Landscape

```mermaid
quadrantChart
    title Risk Heat Map — Likelihood × Impact (Realtime 1434)
    x-axis Low Likelihood --> High Likelihood
    y-axis Low Impact --> High Impact
    quadrant-1 🔴 MITIGATE PRIORITY
    quadrant-2 🟠 ACTIVE MITIGATION
    quadrant-3 🟢 TOLERATE
    quadrant-4 🟡 MANAGE
    R1-Russian-Hybrid: [0.80, 0.80]
    R2-KU33-Narrow-Interpretation: [0.55, 0.80]
    R3-Tribunal-without-US: [0.50, 0.80]
    R4-KU32-Precedent-Erosion: [0.50, 0.65]
    R5-Campaign-Weaponisation-KU33: [0.75, 0.50]
    R6-Reparations-Fatigue: [0.50, 0.45]
    R7-Press-Freedom-Index-Drop: [0.45, 0.55]
    R8-Russia-Asset-Retaliation: [0.45, 0.45]
    R9-Property-Register-IT: [0.35, 0.70]
    R10-SD-Ukraine-Reversal: [0.25, 0.75]
```

---

## 🗂️ Risk Register

| Risk ID | Risk Description | Cluster | Likelihood (1-5) | Impact (1-5) | Score | Confidence | Status | Mitigation Owner |
|:-------:|-----------------|:-------:|:----------------:|:------------:|:-----:|:----------:|:------:|------------------|
| **R1** | Russian hybrid retaliation (cyber, disinformation, sabotage) against Sweden as tribunal founding member | Ukraine | 4 | 4 | **16** | HIGH | 🔴 MITIGATE | SÄPO, MSB, NATO StratCom COE |
| **R2** | KU33's "formellt tillförd bevisning" interpretation drifts narrow under a future government — systemic transparency loss | Constitutional | 3 | 4 | **12** | MEDIUM | 🔴 MITIGATE | Lagrådet, KU (legislative history), Riksdag ombudsman |
| **R3** | Tribunal (HD03231) effectiveness collapses if US refuses cooperation | Ukraine | 3 | 4 | **12** | MEDIUM | 🟠 ACTIVE | UD, EU External Action Service, Council of Europe |
| **R4** | KU32's EU-obligation template reused to justify further grundlag compression (digital platforms, AI content, national security) | Constitutional | 3 | 3-4 | **10** | MEDIUM | 🟠 ACTIVE | KU, Riksdag constitutional scholars |
| **R5** | KU33 weaponised in 2026 valrörelse — polarises press freedom into partisan wedge; second-reading coalition fractures | Constitutional | 4 | 3 | **12** | HIGH | 🟠 ACTIVE | Party leaders, party-strategy teams |
| **R6** | Reparations commission (HD03232) takes decades → political fatigue erodes Ukraine support | Ukraine | 3 | 3 | **9** | MEDIUM | 🟡 MANAGE | Commission secretariat, UD |
| **R7** | International press-freedom index (RSF, Freedom House) downgrades Sweden after TF amendments | Constitutional | 3 | 3 | **9** | MEDIUM | 🟡 MANAGE | UD, Sida, press-freedom diplomacy |
| **R8** | Russia seizes assets of Swedish firms in retaliation | Ukraine | 3 | 3 | **9** | MEDIUM | 🟡 MANAGE | Kommerskollegium, EU sanctions policy |
| **R9** | Lantmäteriet register (HD01CU28) IT procurement delayed or suffers data-security breach | Housing | 2 | 4 | **8** | MEDIUM | 🟢 TOLERATE | Lantmäteriet, MSB, Finansdepartementet |
| **R10** | SD reverses Ukraine support in 2026 campaign (populist realignment) | Ukraine | 1-2 | 4 | **7** | LOW | 🟢 TOLERATE | Coalition monitoring, cross-party statesmanship |
| **R11** | KU32 accessibility implementation cost exceeds impact assessment → business pushback | Constitutional | 2 | 2 | **4** | LOW | 🟢 TOLERATE | MPRT, Näringsdepartementet |

---

## 🔴 Priority Risks (Score ≥ 12) — Deep Dive

### R1 — Russian Hybrid Warfare (Score 16, HIGH Confidence)

**Context**: Russia has conducted hybrid operations against NATO members following Ukraine-support decisions. Sweden's NATO accession (March 2024) combined with founding-member status in the aggression tribunal and reparations commission creates enhanced targeting.

**Evidence**:
- Nordic data-cable sabotage events (Baltic Sea, 2023-2024) `[HIGH]`
- Disinformation campaigns targeting Swedish NATO debates 2022-2024 `[HIGH]`
- Russia's "unfriendly state" designation of Sweden (2022) `[HIGH]`
- Historical pattern: tribunal-supporting states face targeted information operations `[MEDIUM]`

**Trajectory**: Rising. Likelihood increases as Sweden's role shifts from supporter to founder.

**Mitigation status**: NATO Article 5 deterrence, SÄPO reinforcement, MSB civil defence doctrine updates. Below-threshold hybrid operations remain persistent.

**Key indicators to watch**:
- SÄPO annual report (released H1 2026)
- MSB cyber-incident bulletins
- Nordic infrastructure events (cables, power, logistics)

### R2 — KU33 Narrow-Interpretation Entrenchment (Score 12, MEDIUM Confidence)

**Context**: HD01KU33 preserves "allmän handling" status for seized digital material **only** when it is *formellt tillförd bevisning*. The interpretive boundary of "formally incorporated" is **legislatively underspecified** in the public summary. A future government (or shift in prosecutorial practice) could apply a narrow test, functionally shielding large volumes of seized material from offentlighetsprincipen.

**Evidence**:
- HD01KU33 textual analysis — carve-out relies on undefined threshold `[HIGH]`
- Forvaltningsrätt doctrine permits wide administrative discretion absent explicit statutory definition `[MEDIUM]`
- Historical TF narrowings (e.g., 2016 Panama Papers debates) illustrate interpretation drift `[MEDIUM]`

**Why this is a constitutional risk, not merely administrative**: TF is a grundlag. Once narrowed, restoring the original scope requires another two-reading/cross-election constitutional amendment — a decade-scale reversal window.

**Mitigation status**:
- **Pre-vote** (H1 2026): Lagrådet review can scope interpretation; KU committee record can lock legislator intent.
- **Post-vote** (2027-): JO/JK oversight; annual press-freedom reporting; NGO litigation in förvaltningsdomstol.

**Bayesian update trigger**: If Lagrådet yttrande is silent on the interpretive test, update likelihood 3 → 4 (score to 16).

### R3 — Tribunal Effectiveness Without US (Score 12, MEDIUM Confidence)

**Context**: The International Criminal Court illustrates the effectiveness cost of US non-participation. Public US statements on HD03231 have been cautious. The tribunal can still operate as a legitimacy platform and set precedent, but enforcement against high-value defendants becomes dependent on arrest-state cooperation.

**Evidence**:
- ICC experience with 124 states parties, major absences `[HIGH]`
- Recent US reticence on similar jurisdictional innovations `[MEDIUM]`

**Mitigation**: EU coalition-building; Council of Europe framework provides legitimacy backstop; G7 asset-policy coordination.

### R5 — KU33 Campaign Weaponisation (Score 12, HIGH Confidence)

**Context**: V/MP have strong press-freedom commitments and will foreground KU33 in the 2026 campaign. S's leadership has signalled mixed positions — if the S leadership moves against KU33, the second-reading coalition fractures.

**Evidence**:
- V/MP historical voting pattern on grundlag changes `[HIGH]`
- 2026 opinion polling — campaign-issue salience `[MEDIUM]`
- Media commentary projecting press-freedom prominence `[MEDIUM]`

**Mitigation**: Cross-party statesmanship; early Lagrådet yttrande; NGO engagement by government to pre-empt legitimate concerns.

---

## 📉 Risk Trend — 7-Day

```mermaid
xychart-beta
    title "Composite Political Risk — April 10-17, 2026"
    x-axis ["Apr 10", "Apr 11", "Apr 12", "Apr 13", "Apr 14", "Apr 15", "Apr 16", "Apr 17"]
    y-axis "Risk (0-10)" 0 --> 10
    line [4, 4, 5, 7, 6, 5, 7, 8]
```

**Readings**:
- Apr 13 — Spring budget package elevates fiscal/policy risk
- Apr 16-17 — Ukraine propositions + KU betänkanden compound into highest reading of week

---

## 🔄 Bayesian Update Rules

| Observable Signal | Direction | Risk Affected | Magnitude |
|-------------------|:---------:|:-------------:|:---------:|
| Lagrådet yttrande strict on KU33 | ↓ | R2 | −4 |
| Lagrådet yttrande silent on KU33 interpretation | ↑ | R2 | +4 |
| S-leadership statement supporting KU33 | ↓ | R5 | −3 |
| S-leadership statement opposing KU33 | ↑ | R5 | +3 |
| US public statement supporting HD03231 | ↓ | R3 | −4 |
| Nordic cable-sabotage or cyber event | ↑ | R1 | +2 |
| RSF Sweden score unchanged post-amendment | ↓ | R7 | −2 |

---

**Classification**: Public · **Next Review**: 2026-04-24 · **Methodology**: `analysis/methodologies/political-risk-methodology.md`
