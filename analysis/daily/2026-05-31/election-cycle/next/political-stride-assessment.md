# Political STRIDE Assessment — Tidö Mandate Cycle — 2026-05-31

**Anchor**: `next` · **Horizon**: [horizon:cycle] · Adapts the STRIDE threat taxonomy to *political-process* risks across the forming mandate. Each dimension names actor, mechanism, and a 1–5 risk score.

## STRIDE dimensions

### S — Spoofing (false mandate/legitimacy claims)
Actor: campaign actors. Mechanism: misrepresenting the mandate scorecard (claiming full delivery on contested domains `HD01SoU32`). Risk: **3**. [horizon:election]

### T — Tampering (process manipulation)
Actor: bloc whips. Mechanism: agenda-tampering to avoid exposing the +1 margin on contested divisions. Risk: **3**. [horizon:cycle]

### R — Repudiation (deniability of pledges)
Actor: governing parties. Mechanism: repudiating Tidö commitments whose delivery lagged (energy MW online). Risk: **4** — high salience pre-poll. [horizon:election]

### I — Information disclosure (leak/transparency risk)
Actor: internal coalition factions. Mechanism: leaking SD-price addenda to damage rivals. Risk: **3**. [horizon:cycle]

### D — Denial of governance (paralysis)
Actor: any single small partner. Mechanism: a +1-margin defection denying the chamber a working majority. Risk: **4** — the structural cycle risk. [horizon:cycle]

### E — Elevation of privilege (unearned influence)
Actor: SD. Mechanism: confidence-and-supply leverage exceeding seat share, escalating across the cycle. Risk: **4**. [horizon:cycle]

## Attack tree 1 — Cohesion-fracture path

Root: bloc loses working majority before poll.
- AND: SD price breach → L exit incentive.
  - OR: L defects on confidence-adjacent vote (Risk D, score 4).
  - OR: KD–L joint threshold failure (Risk D, score 3).
- Leaf mitigations: early SD accommodation; tactical-vote shelter messaging.

## Attack tree 2 — Delivery-repudiation path

Root: government's delivery claim collapses in campaign.
- AND: implementation scandal (migration/crime) → opposition amplification.
  - OR: agency-capacity miss on `HD01JuU37` (Risk R, score 4).
  - OR: municipal-health deficit on `HD01SoU32` (Risk S, score 3).
- Leaf mitigations: pre-poll delivery audit; counter-framing.

## TTP mapping

| TTP | Actor | STRIDE dim | Risk | Indicator (forward-indicators.md #) |
|---|---|---|---|---|
| Price escalation | SD | E | 4 | #2 |
| Confidence-vote defection | L | D | 4 | #1 |
| Pledge repudiation | Gov | R | 4 | #6,#7 |
| Agenda-tampering | Whips | T | 3 | #1 |
| Selective leak | Faction | I | 3 | #16 |

## Controls

Cohesion telemetry (indicators 1,2,16), delivery audits (6–8), macro tripwires (9–11,14). Residual risk concentrated in dimensions **D** and **E** — the confidence-and-supply architecture itself.

## Election lens

At [horizon:election], dimensions R (repudiation) and D (denial) dominate: the campaign is a contest over whether the mandate delivered and whether the bloc can still govern at +1.

## PIR feedback

STRIDE D/E findings feed the **COHESION** PIR; R/S findings feed the **DELIVERY** PIR in `pir-status.json`.

## Pass-2 checklist

- [x] All six STRIDE dimensions scored with actor + mechanism.
- [x] ≥2 attack trees with AND/OR logic.
- [x] TTP table mapped to forward indicators.
- [x] Election lens + PIR feedback present.
- [x] Horizon tags on risk statements.

**Pass-2 status: executed in full.**

Source: https://www.riksdagen.se/
