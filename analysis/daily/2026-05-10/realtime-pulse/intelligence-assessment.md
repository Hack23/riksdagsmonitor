# Intelligence Assessment — Realtime Pulse 2026-05-10

## Priority Intelligence Requirements (PIR) Status

### PIR-1: Coalition Stability — Status: OPEN, Signal: MEDIUM-ELEVATED

**Prior-cycle ingestion**: No prior realtime-pulse PIR data on disk (first run for this subfolder). Drawing on propositioner/ and interpellationer/ sibling folder context. Previous intelligence cycle (T-72h) identified Busch/Fransson energy tensions as active monitoring signal.

**Current assessment**: The Tidö coalition (M+SD+KD+L) shows normal pre-election operating friction but no acute instability signal. KD/SD energy tension (Busch/Fransson interpellation debates) remains managed. The critical near-term instability risk is L's position on prop 2025/26:246 (criminal age). If L breaks with the coalition in JuU committee, this would be the most significant coalition fracture since the 2022 budget compromise.

**Intelligence gap**: L's internal deliberations on the criminal-age proposition are not directly observable. Proxies to monitor: LP press statements, L youth-wing statements, L members' op-eds.

**WEP assessment**: We assess that L WILL LIKELY (P~55%) ultimately support the government on the criminal age prop, possibly with amendments, rather than joining the opposition coalition.

### PIR-3: Opposition Legislative Capacity — Status: OPEN, Signal: HIGH

**Assessment**: The 4-party opposition coalition on prop 2025/26:246 (S + V + C + MP motions filed 2026-04-29 to 2026-05-04) is the strongest observed cross-party coordination in this monitoring cycle. This is notable because C and V rarely coordinate formally on justice issues. The coordination suggests S-led strategic direction — S has historically used "child rights" as a unifying opposition frame.

However (drawing on Devil's Advocate findings): this coalition is likely an "opening bid" and may fragment under JuU hearing pressure if the government offers a compromise amendment. The opposition's capacity to sustain a JuU committee majority is UNCERTAIN.

**WEP assessment**: We assess it is as likely as not (P~45%) that the opposition motion coalition maintains sufficient votes to force meaningful amendments to prop 2025/26:246 in JuU committee.

### PIR-5: Election-Proximity Policy Acceleration — Status: OPEN, Signal: CONFIRMED

**Assessment**: Three major propositions tabled on a single day (2026-05-07), 126 days before the election, with all three targeting core M+SD brand themes, constitutes CONFIRMED election-proximity policy acceleration. This is the defining legislative event of the 2026-05-10 monitoring window.

The sprint is consistent with the Tidö coalition's stated objective of completing its "100 points" policy agenda before the election. The security/identity cluster (HD03267, HD03261, HD03250) represents a coherent sub-agenda of that program being executed in the final sprint phase.

**WEP assessment**: We ASSESS WITH HIGH CONFIDENCE that the government will continue to table 4–8 additional significant propositions before the June 2026 recess, focusing on justice, migration, and energy themes.

---

## Key Judgements

**KJ-1 [MEDIUM CONFIDENCE]**: HD03267 (security-threat foreigners) will face Lagrådet observations on ECHR Art. 5 compliance. The proposition will pass but may require amendment to incorporate procedural safeguards (closed hearings, judicial oversight, time limits). Net effect: 4–8 week delay but eventual enactment.

**KJ-2 [MEDIUM-HIGH CONFIDENCE]**: Prop 2025/26:246 (criminal age to 13) faces genuine committee risk. The outcome depends on L's position — the most consequential unknown in the current monitoring cycle.

**KJ-3 [HIGH CONFIDENCE]**: HD03250 (state e-legitimation) will pass, supported by eIDAS 2.0 compliance obligation. Banking sector opposition will cause delay but cannot prevent passage.

**KJ-4 [HIGH CONFIDENCE]**: The Gaza interpellationer (HD10476, HD10478 by MP) will receive standard government deflection (multilateral framework, UN processes, EU coordination). No significant foreign policy shift will result.

**KJ-5 [MEDIUM CONFIDENCE]**: KD/SD energy tension will not escalate to a coalition veto or policy reversal before the election. Managed disagreement will continue.

---

## Collection Gaps

| Gap | Impact | Proposed resolution |
|---|---|---|
| Full text of HD03267 | Cannot assess ECHR safeguards as written | Retry get_dokument with include_full_text=true or wait for API update |
| Lagrådet referral confirmation | Cannot time-stamp Lagrådet risk | Monitor lagradet.se directly (domain currently unreachable from workflow) |
| L internal position on prop 2025/26:246 | Key unknown for PIR-3 | Monitor L press statements, L committee spokespersons |
| IMF IFS/SDMX data | Cannot provide precise Swedish macro numbers | API degraded; use WEO Apr-2026 approximations |
| Statskontoret evaluation of HD03261 | Cannot assess Skatteverket capacity | Domain not accessible in this run |

---

## Confidence and Source Assessment

**Source quality**: Riksdag MCP live data — HIGH reliability (official Riksdag database). IMF data — DEGRADED (WEO/FM only, SDMX 404). No primary source full-text for leading propositions.

**Overall assessment confidence**: MEDIUM-HIGH for political analysis; LOW-MEDIUM for precise budget/implementation numbers (IMF degraded, full-text unavailable).
