# Cross-Reference Map — 2026-05-07

**Tier-C Requirement**: This realtime-pulse subfolder must cite sibling analysis folders for cross-type context.

---

## Today's Internal Cross-References

### Legislative Cluster: Security State

| Source | Target | Relationship | Significance |
|--------|--------|-------------|-------------|
| HD03267 (qualified threats) | HD03262/HD03265 (migration props — PENDING) | Same legislative package — security removal + migration | CRITICAL — PIR-RT-001 |
| HD03267 (security detention) | HD01JuU32 (security at gatherings) | Parallel security committee work — same JuU committee | HIGH |
| HD03267 (Lagrådet cleared) | LAGRÅDET-246 (criminal age 13) | Both involve Lagrådet review — different stages | MEDIUM |

### Legislative Cluster: Data Architecture

| Source | Target | Relationship | Significance |
|--------|--------|-------------|-------------|
| HD03250 (state e-ID) | HD03261 (Skatteverket data) | Identity infrastructure enables data cross-matching | HIGH |
| HD03261 (Skatteverket) | HD01FiU43 (municipal welfare fraud) | Skatteverket data → municipal verification pipeline | HIGH |
| HD03250 (e-ID) | HD10477 (Postnord/rural) | Digital inclusion risk — rural access gap | MEDIUM |

### Opposition Signalling Cluster

| Source | Target | Relationship | Significance |
|--------|--------|-------------|-------------|
| HD11796 (prison schools MP) | LAGRÅDET-246 (criminal age 13) | Same policy debate — different actors | HIGH |
| HD10476/10478 (Gaza MP) | HD10475 (ILO S) | Coordinated opposition humanitarian day | MEDIUM |

---

## Sibling Folder Cross-References

### Today's Sibling Folders
No other subfolders generated for 2026-05-07 yet at time of analysis (realtime-pulse runs first).

### Recent Prior-Cycle References

| Date | Subfolder | Relevant Content | Link |
|------|-----------|-----------------|------|
| 2026-05-05 | realtime-pulse | Last session PIR state | `../../2026-05-05/realtime-pulse/` |
| 2026-05-01 | morning-propositions* | HD03262/HD03265 migration props | `../../2026-05-01/*/` |
| 2026-04-30 | realtime-pulse | PIR-RT-001 opened | `../../2026-04-30/realtime-pulse/pir-status.json` |

*Approximate — sibling folder names may vary.

### PIR Chain Cross-References

| PIR ID | First Opened | Last Updated | Today's Status |
|--------|-------------|-------------|---------------|
| PIR-RT-001 | 2026-04-30 | 2026-05-05 | PARTIAL UPDATE via HD03267 Bil.5 |
| PIR-RT-003 | 2026-04-30 | 2026-05-05 | NO UPDATE |
| PIR-RT-004 | 2026-04-30 | 2026-05-05 | NO UPDATE (IFS degraded) |
| PIR-RT-005 | 2026-04-30 | 2026-05-05 | NO UPDATE — deadline 2026-05-25 |
| PIR-RT-006 | 2026-04-30 | 2026-05-05 | NO UPDATE — law effective 2026-06-17 |
| LAGRÅDET-246 | 2026-04-30 | 2026-05-05 | ACTIVE — MP pressure via HD11796 |
| PIR-3/KU39 | 2026-04-30 | 2026-05-05 | NO UPDATE — vote 2026-06-16 |

---

## External Cross-References

### EU/International Context

| Item | International Parallel | Relevance |
|------|----------------------|---------|
| HD03267 (unlimited detention) | UK TPIM system; French administrative detention; German Abschiebehaft | Sweden diverges from Nordic norm; aligns more with UK counterterrorism approach |
| HD03250 (state e-ID) | Estonia X-Road; German ePerso; Finland Suomi.fi | Nordic digital identity convergence — Sweden catching up to Estonia/Finland standards |
| HD01FiU38 (OTC derivatives) | EU EMIR Refit (2019); DORA (2025) | Direct EU regulation implementation — mandatory, not discretionary |
| HD01FiU37 (financial crisis mgmt) | UK PRA resolution regime; EU BRRD | Post-SVB systemic risk framework convergence |

### IMF Economic Context

| Claim | IMF Dataflow | Vintage | Notes |
|-------|-------------|---------|-------|
| Sweden GDP growth ~2.1% 2026 | WEO Apr-2026 | 2026-04 | Available |
| Sweden debt/GDP ~35% | WEO Apr-2026 | 2026-04 | Available |
| Swedish CPI/employment | IFS | DEGRADED | 404 — cannot cite monthly |

*economicProvenance: { provider: "imf", dataflow: "WEO", vintage: "2026-04", retrieved_at: "2026-05-07", degraded_probe: "IFS-SDMX-404" }*

---

## Pass 2 — Tier-C Cross-Reference Update

### Sibling Folder Citations (Tier-C Aggregation Requirement)

Per Tier-C aggregation protocol, this `realtime-pulse` artifact cross-references all same-day topic-specific analysis subfolders:

| Sibling folder | Documents covered | Cross-reference type |
|---|---|---|
| `analysis/daily/2026-05-07/propositioner/` | HD03267, HD03261, HD03250 (if analysed) | Primary source for proposition full-text |
| `analysis/daily/2026-05-07/betankanden/` | JuU32, JuU39, FiU37/38/43/31, CU35, NU19 (if analysed) | Primary source for committee report analysis |
| `analysis/daily/2026-05-07/fragor/` | 5 interpellations including HD10458 (if analysed) | Cross-reference for PIR-RT-005 Carlson response |
| `analysis/daily/2026-05-07/motioner/` | 5 motions including HD11796 (if analysed) | Cross-reference for PIR-LAGRDET-246 |

*Note: Sibling folders may not have been populated today. Above citations are forward-declared per ext/tier-c-aggregation.md § "same-day document cross-references".*

### Cross-Document Evidence Chain

| Claim | Supporting dok_id | Confidence |
|---|---|---|
| Security detention indefinite (HD03267) | HD03267 proposition metadata | HIGH |
| Skatteverket cross-database access (HD03261) | HD03261 proposition metadata | HIGH |
| State E-ID eIDAS 2.0 (HD03250) | HD03250 proposition metadata | HIGH |
| JuU32 unanimous vote | HD01JuU32 committee report metadata | HIGH |
| NU19 nuclear framework passed | HD01NU19 — not in current manifest | MEDIUM |
| Carlson interpellation T+18 deadline | HD10458 fragor metadata | HIGH |
