# Intelligence Gaps — Realtime Pulse 2026-05-04

**Pass**: 2 (improved)

---

## Critical Gaps (Must Close in Next Cycle)

### Gap 1: Lagrådet Status on Migration Propositions (CRITICAL)
**What we need**: Official Lagrådet yttrande on HD03262 (stricter return) and HD03265 (deportation grounds)  
**Why critical**: If Lagrådet issues critical opinion, S "bad law" narrative becomes legally grounded. If clean opinion, government is protected.  
**Retrieval path**: `search_dokument(doktyp='lgu', relaterat_id='HD03262')` in next realtime cycle

### Gap 2: Polling Data (HIGH)
**What we need**: Novus or Demoskop poll published after migration proposition announcement (after 2026-05-01)  
**Why high**: L threshold determination and S vs M lead are the two key electoral variables that all scenario analysis depends on. Currently using stale polling priors.  
**Retrieval path**: Not available via Riksdag MCP; requires web monitoring of pollsters

### Gap 3: IMF IFS May 2026 Update (MEDIUM)
**What we need**: IMF IFS M.SE.LUR (unemployment) and M.SE.PCPI_IX (CPI) for April/May 2026  
**Why medium**: Supports economic narrative; not currently distorted, but vintage discipline requires update when available  
**Retrieval path**: `tsx scripts/imf-fetch.ts sdmx --path '/data/IMF.STA,IFS,3.0.0/M.SE.LUR+PCPI_IX?startPeriod=2026-03'`

### Gap 4: Anföranden Full Text (LOW)
**What we need**: Actual speech texts from interpellation debates (most recent: housing, airport)  
**Why low**: Riksdag API limitation — text fields are empty. Can be partially addressed by fetching individual anförande HTML pages  
**Retrieval path**: Known API limitation; individual anförande HTML URLs may work

### Gap 5: C (Centerpartiet) Explicit Position on Key Votes (MEDIUM)
**What we need**: C committee voting records on NU19 (nuclear), FöU13 (explosives), and other committee reports this week  
**Why medium**: C's swing-actor position makes their vote critical; we only have committee recommendations (Ja/Nej), not party-by-party breakdown  
**Retrieval path**: `get_voting_group(bet='NU19', rm='2025/26', groupBy='parti')` — but committee votes may not be in voteringsdatabasen

---

## Information Completeness Score

| Analysis Domain | Score | Gap Driver |
|---|---|---|
| Legislative programme | 90% | High — full text/summaries for all key documents |
| Interpellation politics | 85% | High — full text of HD10463; summary gaps for others |
| Economic context | 80% | IMF WEO vintage used; IFS update pending |
| Electoral polling | 50% | No current polling data |
| Coalition voting | 60% | No party-by-party committee votes retrieved |
| Lagrådet status | 20% | PIR-RT-001 open; no yttrande published |
| Realtime monitoring | 75% | No same-day speeches/votes; calendar API non-functional |
