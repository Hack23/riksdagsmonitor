<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📘 Per-Artifact Methodologies — Riksdagsmonitor</h1>

<p align="center">
  <strong>🔬 How the AI Agent Writes Each of the 24 Core + 8 Supplementary Artifacts</strong><br>
  <em>🎯 One §section per artifact · Inputs · Analytic moves · Evidence rules · Anti-patterns</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.3-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--05--01-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.3 | **📅 Last Updated:** 2026-05-01 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-07-31  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

For every artifact listed in [`artifact-catalog.md`](artifact-catalog.md), this document answers **four questions** the AI agent must answer before writing a single paragraph:

1. **Inputs** — which MCP tools, sibling artifacts, and methodology sections feed this artifact?
2. **Analytic moves** — what structured analytic techniques (SATs) must be applied, and in what order?
3. **Evidence rules** — what citations, Admiralty grades, WEP bands, and neutrality constraints are required?
4. **Anti-patterns** — what shallow / first-pass behaviours cause this artifact to fail Pass-2 or the gate?

This file is referenced from [`ai-driven-analysis-guide.md §Per-artifact methodology index`](ai-driven-analysis-guide.md#-per-artifact-methodology-index) and [`artifact-catalog.md §Methodology §link column`](artifact-catalog.md). **Read the catalog first, then open only the sections you need for the current run.**

---

## 📑 Index

### Family A — Core Synthesis (9)
- [§ README](#readme)
- [§ executive-brief](#executive-brief)
- [§ synthesis-summary](#synthesis-summary) ⭐
- [§ significance-scoring](#significance-scoring)
- [§ classification-results](#classification-results)
- [§ swot-analysis](#swot-analysis)
- [§ risk-assessment](#risk-assessment)
- [§ threat-analysis](#threat-analysis)
- [§ stakeholder-perspectives](#stakeholder-perspectives)

### Family B — Structural Metadata (2)
- [§ data-download-manifest](#data-download-manifest)
- [§ cross-reference-map](#cross-reference-map)

### Family E — Per-Document (N, separate template)
- [§ per-file-analysis](#per-file-analysis) — produced under `documents/{dok_id}-analysis.md`; validated separately by gate Check 2, not part of the 23 core set

### Family C — Strategic Extensions
- [§ scenario-analysis](#scenario-analysis)
- [§ comparative-international](#comparative-international)
- [§ devils-advocate](#devils-advocate)
- [§ intelligence-assessment](#intelligence-assessment)
- [§ methodology-reflection](#methodology-reflection) ⭐
- [§ parliamentary-season](#parliamentary-season)

### Family D — Electoral & Domain
- [§ election-2026-analysis](#election-2026-analysis)
- [§ voter-segmentation](#voter-segmentation)
- [§ coalition-mathematics](#coalition-mathematics)
- [§ historical-parallels](#historical-parallels)
- [§ media-framing-analysis](#media-framing-analysis)
- [§ implementation-feasibility](#implementation-feasibility)
- [§ forward-indicators](#forward-indicators)
- [§ cycle-trajectory](#cycle-trajectory)

### Operational Supplementary
- [§ analysis-index](#analysis-index)
- [§ reference-analysis-quality](#reference-analysis-quality)
- [§ mcp-reliability-audit](#mcp-reliability-audit)
- [§ workflow-audit](#workflow-audit)
- [§ cross-run-diff](#cross-run-diff)
- [§ cross-session-intelligence](#cross-session-intelligence)
- [§ session-baseline](#session-baseline)
- [§ horizon-pir-rollforward](#horizon-pir-rollforward)

---

## Family A — Core Synthesis

### synthesis-summary ⭐

**Inputs** — all Family A peers (`significance-scoring`, `classification-results`, `swot`, `risk`, `threat`, `stakeholder-perspectives`) + `cross-reference-map`.  
**Analytic moves** — (1) BLUF paragraph (ICD 203) stating the single most-important judgement with WEP band and horizon; (2) 3–7 Key Judgments each with confidence grade; (3) mindmap of policy clusters; (4) party-neutrality arithmetic table; (5) dissenting view (≥ 1 alternative hypothesis from `devils-advocate`).  
**Evidence rules** — every KJ cites ≥ 2 independent sources (Source Diversity Rule); WEP band + horizon on every forecast; Admiralty grades listed in a footer table.  
**Anti-patterns** — "intelligence theatre" (dramatic prose without numeric anchor); missing BLUF; treating one party as villain/hero.

### cross-reference-map

**Inputs** — `data-download-manifest.md`; sibling folders under `$ARTICLE_DATE`.  
**Analytic moves** — (1) policy clusters (thematic grouping of `dok_id`s); (2) legislative chains (proposition → betänkande → beslut → följdlag); (3) coordinated-activity patterns (co-signed motions, party-block anföranden); (4) Tier-C sibling-folder citations.  
**Evidence rules** — every edge in the map cites `dok_id` pair or MP pair; no speculative links.  
**Anti-patterns** — treating co-occurrence of keywords as coordination; uni-directional chains labelled as bi-directional.

### significance-scoring

**Inputs** — `data-download-manifest.md` (all `dok_id`s); `get_dokument` for abstract/metadata; historical DIW calibration table.  
**Analytic moves** — (1) assign **D**emocratic impact (0–10), **I**mpact breadth (0–10), **W**indow / urgency (0–10) per DIW; (2) rank and bucket into L1 / L2 / L2+ / L3; (3) sensitivity analysis (±2 on each axis → does tier change?); (4) Mermaid rank diagram.  
**Evidence rules** — DIW justification sentence per item citing `dok_id`; minimum spread (not all items in one tier).  
**Anti-patterns** — inflation ("everything is L3"); uniform scoring; no sensitivity check.

### classification-results

**Inputs** — [`political-classification-guide.md`](political-classification-guide.md) (7-dimension framework); `get_dokument`.  
**Analytic moves** — per item: (1) dimension 1–7 scores; (2) priority tier (P0–P3); (3) retention class; (4) access class; (5) aggregation note (Tier-C).  
**Evidence rules** — numeric scores with 1-line justification; priority tier ties back to DIW.  
**Anti-patterns** — classification drift (same item different scores across runs without justification).

### swot-analysis

**Inputs** — `search_anforanden`, `get_voteringar`, sibling Family A artifacts.  
**Analytic moves** — (1) S/W/O/T with evidence rows (each row: claim + `dok_id` + Admiralty); (2) TOWS matrix (SO, ST, WO, WT strategies); (3) cross-SWOT comparison against prior run's SWOT (link from `cross-run-diff.md` when present).  
**Evidence rules** — ≥ 3 items per quadrant; balanced across parties (neutrality arithmetic); no empty quadrant.  
**Anti-patterns** — SWOT as adjective-bag; weaknesses only of opposition, strengths only of government (neutrality failure).

### risk-assessment

**Inputs** — `search_dokument`, `get_betankanden`, sibling `threat-analysis`.  
**Analytic moves** — (1) 5-dimension register (Electoral / Policy / Institutional / Corruption / External); (2) L × I score; (3) cascading chain diagram (upstream cause → event → downstream impact); (4) posterior probabilities via Bayesian update from prior run; (5) WEP band per risk.  
**Evidence rules** — every risk row has `dok_id` or vote count; Admiralty grade on external sources.  
**Anti-patterns** — doubling risk count without new evidence; no L × I scoring; no cascade.

### threat-analysis

**Inputs** — `search_anforanden`, `get_voteringar`, OSINT framing sources.  
**Analytic moves** — (1) Political Threat Taxonomy mapping per [`political-threat-framework.md`](political-threat-framework.md); (2) attack tree (root threat → sub-goals → leaves); (3) kill chain; (4) MITRE-style TTP mapping; (5) WEP band per leaf.  
**Evidence rules** — TTPs reference public actor statements, no private data; attack-tree leaves cite `dok_id` or news URL with Admiralty.  
**Anti-patterns** — criminalising normal political behaviour; unsourced "operation" labels.

### stakeholder-perspectives

**Inputs** — `search_ledamoter`, `get_ledamot`, `search_anforanden`, party programmes.  
**Analytic moves** — (1) 6-lens matrix (Government / Opposition / Civil society / Business / Media / EU/external); (2) named actor per lens with role and `intressent_id`; (3) influence network diagram (nodes + edges labelled with power/interest/position); (4) **neutrality arithmetic** — equal treatment of all 8 Riksdag parties (S, M, SD, V, MP, C, L, KD) verified by table.  
**Evidence rules** — named MP + `intressent_id` for every Riksdag actor; speech or vote citation.  
**Anti-patterns** — "voters" as undifferentiated block; one party missing from the matrix.

---

## Family B — Structural Metadata

### data-download-manifest

**Inputs** — output of scripts in `03-data-download.md`.  
**Analytic moves** — (AI role is minimal here) (1) annotate data-depth tag (API / scraped / cached); (2) flag retrieval anomalies; (3) verify every `dok_id` resolves via `get_dokument`.  
**Evidence rules** — every row: `dok_id`, source URL, retrieval timestamp, data-depth tag.  
**Anti-patterns** — `AI_MUST_REPLACE` left in; rows without retrieval time.

---

## Family C — Strategic Extensions

### scenario-analysis

**Inputs** — all Family A; political calendar; `get_calendar_events`.  
**Analytic moves** — (1) ≥ 3 distinct scenarios (status-quo, shock, opportunity); (2) probabilities summing 100%; (3) leading indicator per scenario (what to watch); (4) decision tree from trigger → scenario. When `horizonDays >= 90`: (5) horizon-stratified branches — each scenario subdivided by time band (quarter / year / cycle) with per-band probability and WEP ceiling applied.  
**Evidence rules** — WEP band + horizon on each scenario; historical precedent citation on each. Horizon-stratified branches (when present) respect the WEP-degradation ladder: quarter ≤ "roughly even", year ≤ "roughly even" (unless ≥ 3 corroborated sources), cycle ≤ "roughly even" / "unlikely" / "very unlikely"; "likely" / "very likely" only with ≥ 3 cycle-aged corroborated sources.  
**Anti-patterns** — probabilities summing to 120% or 70%; scenarios that are re-phrasings of each other; horizon-stratified branches with identical probabilities across bands (indicates no genuine degradation modelling).

### comparative-international

**Inputs** — world-bank MCP (non-economic residue), IMF CLI (economic primary), SCB, Statskontoret for public-administration comparators, peer-country press.  
**Analytic moves** — (1) ≥ 2 comparator jurisdictions (Nordic baseline + EU or global); (2) Outside-In analysis (what would this look like to a Finnish / Danish / EU observer?); (3) quantitative table of ≥ 3 indicators.  
**Evidence rules** — indicator code (e.g. `WEO:NGDP_RPCH`, `SE.XPD.TOTL.GD.ZS`) + source URL per row; year/vintage stamp. Statskontoret rows cite report/page URL + publication date.  
**Anti-patterns** — Swedish exceptionalism; comparator chosen only to confirm prior.

### devils-advocate

**Inputs** — draft `synthesis-summary` (Pass 1).  
**Analytic moves** — (1) ≥ 3 competing hypotheses; (2) ACH matrix (evidence × hypothesis, consistent / inconsistent); (3) Red-Team challenge paragraph; (4) rejected alternatives logged with reason.  
**Evidence rules** — evidence cells reference `dok_id` or speech ID; ACH matrix complete.  
**Anti-patterns** — straw-man alternatives; only one hypothesis surviving without rejection log.

### intelligence-assessment

**Inputs** — all Family A + Family C peers.  
**Analytic moves** — (1) 3–7 Key Judgments with confidence labels (ICD 203); (2) Priority Intelligence Requirements (PIRs) for next cycle; (3) Key Assumptions Check (KAC); (4) handoff to next-run memory.  
**Evidence rules** — WEP + horizon + Admiralty per KJ.  
**Anti-patterns** — KJs without confidence labels; PIRs phrased as questions already answered.

### methodology-reflection ⭐

**Inputs** — every other artifact produced in the run.  
**Analytic moves** — (1) Evidence sufficiency audit (min source count per claim); (2) confidence distribution histogram; (3) source diversity ratio; (4) **party-neutrality arithmetic** (word count per party ± 15% of expected share); (5) **ICD 203 compliance audit** (BLUF, WEP, confidence labels, KAC); (6) ≥ 10 SATs documented; (7) ≥ 3 concrete methodology improvements for next run.  
**Evidence rules** — every audit row quantitative; improvements must be actionable in next run.  
**Anti-patterns** — "went well" with no numbers; improvements that require code changes outside the agent's scope.

### parliamentary-season

**Inputs** — `get_calendar_events` (Riksdagen published calendar), `get_propositioner` (government proposition pipeline), `search_dokument` (tabling status), Riksbank monetary-policy calendar, SCB release calendar, Lagrådet announcements.  
**Analytic moves** — (1) Identify current Riksmöte phase + days to next boundary; (2) committee-schedule overlay for horizon window (quarter / year / cycle); (3) government propositions schedule (BP/VP tabling dates); (4) Lagrådet referral tracker; (5) interpellation & frågestund window mapping; (6) Riksbank/SCB/KI release integration (year/cycle only); (7) cross-horizon carry-forward from predecessor runs.  
**Evidence rules** — every committee row carries a `riksdagen.se` calendar URL or `dok_id` for the ärende; every proposition row cites `regeringen.se`; minimum row counts: ≥ 5 propositions (quarter), ≥ 12 (year), ≥ 20 (cycle); watchlist items ≥ 5 (quarter), ≥ 8 (year), ≥ 12 (cycle).  
**Anti-patterns** — committee schedule without dates; propositions without department attribution; missing carry-forward from predecessor horizon runs.

---

## Family D — Electoral & Domain

### election-2026-analysis

**Inputs** — `search_voteringar` (recent voting coalition evidence), SCB opinion polls, historical seat table.  
**Analytic moves** — (1) seat-projection delta vs prior run; (2) coalition viability table (M+KD+L+SD, S+MP+V+C, etc.); (3) Sainte-Laguë redistribution if poll shift > 2 pp.  
**Evidence rules** — poll source + date; WEP band on seat projections.  
**Anti-patterns** — wishful-thinking coalitions that never held; outdated polls.  
**Post-election** — section converts to "post-2026 context" retrospective.

### voter-segmentation

**Inputs** — SCB demographics, electoral geography, issue polling.  
**Analytic moves** — (1) demographic / regional / ideological segments; (2) baseline segment positions (for procedural / no-bill days, this is the "nothing changed" baseline); (3) shift vector per segment if an event is present.  
**Evidence rules** — segment size from SCB; issue position from named poll.  
**Anti-patterns** — segments invented for narrative; "the youth" as a monolith.

### coalition-mathematics

**Inputs** — current 349-seat map; `search_voteringar` for realised coalitions.  
**Analytic moves** — (1) pivotal-vote table (Shapley-Shubik–style); (2) Sainte-Laguë scenarios at ±1 / ±2 pp poll shifts; (3) majority sensitivity (who can flip the floor?).  
**Evidence rules** — seat counts from Riksdagen.se; vote counts from `get_voteringar`.  
**Anti-patterns** — ignoring Sverigedemokraterna's role under Tidö-agreement; treating passive tolerance as active coalition.

### historical-parallels

**Inputs** — historical Riksdag archive, academic sources.  
**Analytic moves** — (1) ≥ 1 named precedent ≤ 40 years (or "no-precedent" finding with reasoning); (2) similarity score (0–1); (3) lesson-learned paragraph.  
**Evidence rules** — precedent cited with year, dok/propositionsnummer if applicable.  
**Anti-patterns** — vague analogy ("like the 90s crisis") without citation.

### media-framing-analysis

> **v2.2 (2026-05-02) — global audience orientation + multi-dimensional alignment.** Adds two mandatory top-of-artifact sections: (1) **Global Audience Orientation** — Swedish political-system context for readers in Asia, Americas, and Europe; and (2) **Multi-Dimensional Alignment Key** — 5-axis framework (economic / social-identity / EU / security / media-ownership) that replaces the naive single left/right score for all outlet characterisations. All outlet bias-audit entries now use 5-axis lean columns. Comparative-international frame lineage now requires regional notes (Asia, Americas, Europe) per major frame. The Pass-2 checklist gains a new "Global Audience & Multi-Dimensional Alignment" section as the first blocking gate. Inherits all v2.1 constraints (no-neutral-media doctrine; outlet bias audit; algorithmic-asymmetry; Frame C/D label discipline). The template at [`analysis/templates/media-framing-analysis.md`](../templates/media-framing-analysis.md) is the contract; this section gives the agent the "why" behind each block.

**Inputs**
- **Riksdag MCP** — `search_anforanden` (named-MP framing language), `get_dokument` (motion / proposition language as the source frame), `search_dokument` (longitudinal frame record across cycles).
- **Swedish public press** — DN, SvD, Aftonbladet, Expressen, SVT, SR, TV4, Dagens ETC, Kvartal, Nyheter Idag, Samhällsnytt, Riks, regional press sample.
- **International quality press for frame lineage** — Reuters / AP / DPA / AFP / Politico EU / FT / NYT / Le Monde / Der Spiegel / Helsingin Sanomat / Aftenposten / Berlingske / South China Morning Post / NHK World / Al Jazeera English.
- **State-affiliated outlets (amplification fingerprinting only, never as factual source)** — RT, Sputnik, RIA, TASS, CGTN, Global Times, PressTV.
- **Public CIB / influence-ops dossiers** — EUvsDisinfo case database, EU DisinfoLab reports (e.g. Doppelganger 2022), Meta CIB removal reports, NATO StratCom COE briefings, GLOBSEC Vulnerability Index, Reuters Institute Digital News Report, Freedom House Nations in Transit, SÄPO/MUST/FRA/EU-EEAS public statements.
- **Ownership / funding registries** — Nordicom Media Ownership Database (gu.se), Allmänhetens Pressombudsman public registry.
- **Sibling artifacts** — `synthesis-summary.md` (today's lead story), `voter-segmentation.md` (audiences), `intelligence-assessment.md` (Key Judgments to align frames against), `comparative-international.md` (jurisdictional cognates), `forward-indicators.md` (frame-shift triggers).

**Analytic moves (in order)**
0. **Global Audience Orientation** — produce the context block for international readers (Riksdag structure, coalition, election date, NATO/EU/SEK context) plus the 5-axis Multi-Dimensional Alignment Key. This block MUST appear before all frame analysis.
1. **Frame package inventory** — name ≥ 3 frame packages (A government / B opposition / C establishment / centrist-consensus / D public-broadcaster proceduralist; add **Frame E** ONLY if a foreign-amplification signal is observed in window — otherwise document its absence explicitly).
2. **Entman functions per frame** — problem definition, causal attribution, moral evaluation, treatment recommendation. Cite dated quote / `dok_id` / anförande for every cell.
3. **Cognitive vulnerability map** — link each frame to ≥ 1 documented bias (Cialdini / Kahneman / Roozenbeek-van der Linden), with the inoculation lever.
4. **DISARM TTP map** — match observed manipulation indicators to verbatim DISARM `T####` codes; the absence of signal is itself a documented finding (`No coordinated manipulation signal in window`).
5. **Narrative-laundering chain** — fringe → alt-media → politician amplification → mainstream → international. Timestamp first-observed per node. Missing nodes are labelled, never invented.
6. **Outlet Bias Audit / source ecology table** — every cited outlet listed with ownership group · funding mix percentages · board-appointment authority · **multi-dimensional editorial lean (5 axes: economic / social-identity / EU / security / media-ownership)** · Reuters Institute Trust score · PO/PON complaint history · foreign-actor link. **No bias audit row = no citation.** "Neutral / impartial / balanced / objective" labels rejected. Single left/right scores rejected. Sources: Nordicom Media Ownership Database, Reuters Institute Digital News Report, Allmänhetens Pressombudsman/PO public registry, Förvaltningsstiftelsen (SVT/SR/UR boards), EUvsDisinfo, EU-EEAS / SÄPO.
7. **CIB ABCDE block** — Actor-Behaviour-Content-Degree-Effect (Camille François 2020) populated for any state-attribution claim. Observation ≠ attribution.
8. **Algorithmic asymmetry table** — per-platform reach asymmetry; **every row declares the platform's optimisation target** (engagement / watch-time / retention / ad-yield) and cites a documented partisan/emotional asymmetry (Huszár et al. 2022 PNAS for X; Rathje et al. 2021 PNAS for Facebook outrage-amplification; TikTok DSA transparency report; Ribeiro et al. 2020 + Hosseinmardi et al. 2024 for YouTube; NATO StratCom COE 2023 for Telegram). **There is no neutral algorithm.**
9. **Comparative-international frame lineage with global notes** — ≥ 2 cognates traced to prior jurisdictions; PLUS regional notes for **Asia** (East + South/Southeast), **Americas** (North + South/Central), and **Europe** (EU + Nordic). "No international cognate" is suspicious for any major Swedish story and triggers re-do. Regional notes explain why the frame matters to readers from those regions.
10. **Strategic-doctrine detection** — pattern-match against the public-doctrine catalogue (firehose-of-falsehood / doppelganger / gish gallop / reflexive control / active-measures spillover / interest-group capture / MAGA cognate populism). Detection ≠ attribution; ≥ MODERATE confidence floor for any 🟧/🟥 verdict.
11. **Frame lifecycle / longevity** — phase (rising / peak / decay / sleeper / zombie), half-life in days, zombie probability, reactivation trigger. Use the xychart-beta horizon block (≥ 8 points: T-7d / T-3d / Today / T+3d / T+7d / T+14d / T+30d / T+90d).
12. **RRPA impact conversion** — Reach × Resonance × Persistence × Action with ≥ 1 dated action indicator per frame (poll move, petition signatures, donation flows, demonstration permit) or `[no action signal yet]`.
13. **Counter-resilience plan (L1–L5)** — prebunking → just-in-time inoculation → lateral-reading prompt → debunking truth-sandwich → algorithmic-friction / DSA Art. 40 escalation, mapped per frame. Platform-neutrality discipline: Riksdagsmonitor reports the ladder, never executes counter-framing.
14. **Forward watchlist with WEP** — ≥ 5 dated triggers (EU Commission letter, SCB release, EUvsDisinfo dossier, SÄPO public statement, coalition-vote calendar) with WEP bands and Admiralty grades.
15. **Longitudinal frame record entry** — append today's frame snapshot to the running record so future runs can detect zombie reactivations.

**Evidence rules**
- Every claim ties to: `dok_id`, anförande URL, public outlet URL, SCB / IMF dataflow code, EUvsDisinfo dossier ID, or named EU-EEAS / NATO StratCom / SÄPO public statement.
- Admiralty floor: quality / public-service press **B2/B3**; tabloids **C3**; alt/partisan **D3**; anonymous social **E5** with `[unconfirmed]`; named public-figure social **D2**; state-affiliated outlets **F-flag** with `[state-affiliated]` annotation — never cited as factual source.
- WEP band on every momentum claim ("gaining traction" / "fading"); MODERATE-confidence floor for influence-operation attribution; HIGH confidence + ≥ 3 ABCDE indicators required for foreign-state attribution.
- Source-diversity floors: P2 (frame dominance) ≥ 2 outlets; P1 (laundering chain) ≥ 1 source per node; P0 (state-attribution) ≥ 3 ABCDE indicators.

**Anti-patterns (auto-fail at Pass 2)**
- **Global Audience Orientation section missing** — international readers require political-system context and multi-dimensional alignment key.
- **Single left/right score for any outlet** without 5-axis qualification — rejected.
- **Any "neutral / impartial / unbiased / balanced / objective" label applied to an outlet, algorithm, or broadcaster** without ≥ 1 documented-bias citation in the same paragraph.
- Public-service broadcasters (SVT/SR/UR) cited without the licence-fee + politically-appointed-board + institutional-editorial-culture caveat.
- Frame C labelled "neutral / analytical / institutional" instead of "establishment / centrist-consensus".
- Frame D labelled "objective" / "what really happened" instead of "public-broadcaster proceduralist".
- Algorithmic claim with no optimisation-target attribution and no academic/transparency-report citation ("the algorithm shows X" rejected).
- One paper / one outlet stands for all media — single-source frame claims without `[unconfirmed]`.
- "No foreign influence observed" stated by silence rather than by explicit no-signal finding mapped to DISARM TTP search.
- Any frame without Entman 4-function decomposition.
- Any cognitive-vulnerability claim without primary-literature citation.
- Comparative-international section with "no international cognate" for a major story — re-do required.
- Comparative-international section with no regional notes (Asia / Americas / Europe) — add notes or explain why not applicable.
- Frame-attribution to a foreign state without ≥ 3 ABCDE indicators and a published EUvsDisinfo / SÄPO / EU-EEAS reference — drop the claim.
- Counter-resilience layer that imports partisan framing — procedural neutrality is non-negotiable; the platform reports the ladder, never executes it.
- No longitudinal-record entry, so zombie frames cannot be detected next cycle.

### implementation-feasibility

**Inputs** — relevant myndighet (agency) capacity, Statskontoret evaluations/reports, budget, IT, regulatory, workforce.  
**Analytic moves** — (1) delivery-risk view per dimension; (2) backlog audit (for no-bill days); (3) timeline with critical path.  
**Evidence rules** — myndighet citation + budget appropriation + Statskontoret URL where available; regulatory CV.  
**Anti-patterns** — "easy to implement" without citing capacity data.

### forward-indicators

**Inputs** — political calendar, bill pipeline, poll cadence, economic releases.  
**Analytic moves** — (1) build a dated indicator set that covers the current article type's active `forwardIndicatorHorizons` from `analysis/article-types.json`, meeting that article type's minimum-count expectations per active band; (2) leading / coincident / lagging tag; (3) threshold that would move the KJ. When `horizonDays >= 90`: (4) horizon-band column required — each indicator tagged with its applicable band (`72h` / week / month / quarter / year / cycle / election), and the selected band must be one of the current article type's active `forwardIndicatorHorizons` in `article-types.json`; (5) WEP-degradation ladder enforced per band (no indicator may carry a probability above its band's WEP ceiling).  
**Evidence rules** — each indicator dated + sourced; per-band WEP language degradation enforced according to the active bands for the article type and the forward-indicators template; minimum indicator counts are band-specific and article-type-dependent (for example: 4 (`72h`) / 6 (week) / 8 (month) / 10 (quarter) / 12 (year) / 15 (cycle) where those bands are active). Quarter-band indicators must stay at or below "roughly even"; year-band indicators must stay at or below "roughly even" unless supported by ≥ 3 corroborated sources; cycle-band indicators should normally stay below "likely"/"very likely", but `likely` / `very likely` is allowed when supported by ≥ 3 corroborated cycle-aged sources.  
**Anti-patterns** — indicators without thresholds; all indicators lagging; missing horizon-band column when `horizonDays >= 90`; assigning above-ceiling WEP to a year- or cycle-band indicator without the required corroboration.

### cycle-trajectory

**Inputs** — multi-year SCB national accounts (NR0103), IMF WEO multi-vintage projections (at least Apr + Oct across the cycle), Riksdag voteringar bulk export (chamber vote counts, coalition cohesion), KU årsredogörelse (reprimand counts), Lagrådet critique rate.  
**Analytic moves** — (1) ICD 203 BLUF at the `cycle` horizon band with mandatory WEP + falsification trigger; (2) year-by-year dimension tables (T+1, T+2, T+3, T+5) covering macro, fiscal, coalition cohesion, legislative throughput, KU reprimands — each with WEP at appropriate band ceiling; (3) multi-vintage IMF compare (≥ 4 indicators × ≥ 4 countries: SWE + 3 Nordic peers); (4) cumulative Riksdag throughput metrics (cycle-to-date vs prev-cycle); (5) cycle-anchor-specific block: `current` → Tidö mandate scorecard (≥ 10 rows), `next` → 4×3 coalition-formation scenario table (12 leaves, sum 100%); (6) ≥ 5 falsification triggers with thresholds + horizons + sources.  
**Evidence rules** — ≥ 5 charts/tables with IMF vintage stamps (projection-year T+1/T+2/T+5); every WEP term carries `[horizon:<band>]` tag; WEP at the `cycle` band must not use `likely` or `very likely` unless supported by ≥ 3 cycle-aged corroborated sources; delta > 0.3 pp between IMF vintages triggers editorial review note in `methodology-reflection.md`.  
**Anti-patterns** — omitting any year table even when "no change" (deliberate emptiness encodes WEP correctly); mixing IMF vintages without annotation; cycle-anchor block missing; fewer than 5 falsification triggers.

---

## Family E — Per-Document (separate template; not part of the 24 core set)

### per-file-analysis

Per-document analyses are produced under `documents/{dok_id}-analysis.md`, one file per downloaded Riksdag document. They are validated separately by gate Check 2 (Family-E per-document check) and are **not** counted in the 24-row core inventory.

**Inputs** — `get_dokument`, `search_dokument`; paired `dok_id` entry in `data-download-manifest.md`; DIW tier from `significance-scoring.md` Pass 1.  
**Analytic moves** — (1) Read full document text; (2) classify along 7 dimensions per [`political-classification-guide.md`](political-classification-guide.md); (3) extract 3–7 named actors, ≥ 2 stakeholder lenses; (4) tag PIR/EEI; (5) apply depth per tier (L1 / L2 / L2+ / L3).  
**Evidence rules** — every claim cites `dok_id` + paragraph marker; Admiralty grade per external citation; WEP band on forecast sentences; no generic phrases ("*this may*", "*could lead to*") without a WEP band.  
**Anti-patterns** — summarising the document's own abstract; single-source claims without `[unconfirmed]` flag; skipping stakeholder identification on L2+ items.

---

## Operational Supplementary

### analysis-index

**Inputs** — the run directory itself (filesystem scan at end of Pass 2).  
**Analytic moves** — (1) enumerate every artifact with path and line count; (2) production stage diagram; (3) recommended reading order for article generator; (4) MCP success/fail summary (linking to `mcp-reliability-audit`).  
**Evidence rules** — every row matches an on-disk file; no hallucinated paths.  
**Anti-patterns** — index out of sync with disk; missing supplementary files.

### reference-analysis-quality

**Inputs** — `reference-quality-thresholds.json`; per-artifact line counts; tradecraft signals.  
**Analytic moves** — (1) per-artifact table (floor, actual, delta, status); (2) tradecraft audit (WEP presence, Admiralty, ICD 203, SATs); (3) Pass-2 action list with 1-line rationale each; (4) overall benchmark-met judgement.  
**Evidence rules** — numeric, reproducible (`wc -l` is the reference counter).  
**Anti-patterns** — claiming benchmark met without table; no Pass-2 actions when status is ⚠️ or ❌.

### mcp-reliability-audit

**Inputs** — run log of every MCP call (riksdag-regering, scb, world-bank, IMF, github, playwright).  
**Analytic moves** — (1) endpoint scoreboard; (2) fallback record (when cached / SKIP_ANALYSIS / retry); (3) latency percentiles; (4) open tickets / known issues carried into next run.  
**Evidence rules** — tool name, call count, success/fail, mean latency.  
**Anti-patterns** — "looked fine" without numbers; no record of failed calls.

### workflow-audit

**Inputs** — phase-checkpoint log (`phase-04-pass1`, `phase-04-pass2`); prompt modules touched; wall-clock timing.  
**Analytic moves** — (1) module-by-module execution summary; (2) rule compliance audit against [`ai-driven-analysis-guide.md`](ai-driven-analysis-guide.md) core principles; (3) deviations and their cause; (4) time-budget vs actual.  
**Evidence rules** — timestamps, phase labels; compliance grade per rule (✅ / ⚠️ / ❌).  
**Anti-patterns** — compliance 100% with no evidence; skipping Pass-2 and not flagging it.

### cross-run-diff

**Inputs** — current run's `synthesis-summary` + prior run of **same article type**.  
**Analytic moves** — (1) prior-run KJ list with prior WEP bands; (2) new evidence for each KJ; (3) Bayesian update (prior × likelihood → posterior) with numeric deltas; (4) changed scenarios.  
**Evidence rules** — every posterior cites new `dok_id`(s) or vote(s); WEP band updated; Admiralty on external.  
**Anti-patterns** — posterior = prior (no update); no explanation of shift.

### cross-session-intelligence

**Inputs** — ≥ 2 sibling runs' `synthesis-summary` within the aggregation period.  
**Analytic moves** — (1) session overview table; (2) progression diagram (timeline); (3) momentum/maturation narrative; (4) crystallisation-moment identification.  
**Evidence rules** — each session cited with date + dok / vote count; narrative grounded in at least 3 concrete events.  
**Anti-patterns** — "week was busy" without counts; ignoring sessions that contradict the narrative.

### session-baseline

**Inputs** — `get_calendar_events`, `get_betankanden`, `get_propositioner`, `search_voteringar` over the period.  
**Analytic moves** — (1) session calendar (dates, sitting days, location); (2) adopted-texts roster with `dok_id`; (3) votering count and outcome summary; (4) link to per-file analyses in sibling folders.  
**Evidence rules** — every row has source; no estimates.  
**Anti-patterns** — missing sessions; approximate counts ("about 15 bills").

### horizon-pir-rollforward

**Inputs** — predecessor `pir-status.json` (most recent same-type folder within `lookbackDays`), current run's `pir-status.json`, sibling PIR artifacts (`intelligence-assessment.md`, `forward-indicators.md`, `risk-assessment.md`).  
**Analytic moves** — (1) predecessor manifest (folder path, SHA-256 hash, days-since); (2) PIR genealogy table (every PIR: first-seen, status, origin, successor); (3) PIR coverage map (which artifacts in this run engage each PIR); (4) newly-created PIRs with all 7 fields (created, owner, question, confidence-to-retire, inherits-cycle, obsolescence-date, first-evidence); (5) archived PIRs with reason + final WEP; (6) cycle-rollover manifest when within ± 30 days of election anchor.  
**Evidence rules** — ≥ 1 explicit obsolescence date per PIR (or "indefinite — cycle-spanning" with justification); every newly-created PIR links to a `dok_id` or primary-source URL as first evidence; every archived PIR carries final WEP + resolution reason.  
**Anti-patterns** — PIR table out of sync with `pir-status.json`; PIRs without obsolescence dates; coverage map showing a PIR engaged by zero artifacts (should be archived or addressed).

---

## Analytical Supplementary

Optional deep-dive templates. Full production rules in [`analytical-supplementary-methodology.md`](analytical-supplementary-methodology.md). Non-blocking in `05-analysis-gate.md`.

### pestle-analysis

**Inputs** — scoped event / bill / decision, horizon, primary sources (riksdagen.se, regeringen.se, scb.se, IMF WEO vintage per [`imf-indicator-mapping.md`](imf-indicator-mapping.md), WB codes per [`worldbank-indicator-mapping.md`](worldbank-indicator-mapping.md), EUR-Lex for EU instruments).  
**Analytic moves** — (1) scope declaration (trigger, horizon, unit, sources); (2) 6 dimension tables (P/E/S/T/L/Env) each with ≥ 4 rows covering factor, current state, direction, evidence, impact, WEP; (3) economic rows tagged with IMF vintage; (4) ≥ 3 cross-dimension interactions (direction + magnitude + rationale); (5) key judgement per dimension (WEP-tagged); (6) PIR feedback row.  
**Evidence rules** — every row cites a `dok_id` or primary-source host; economic rows cite IMF indicator code + vintage; WB rows cite indicator code.  
**Anti-patterns** — dimension rows without evidence; skipping the cross-dimension interaction table (the value add); mixing vintages across economic rows; stating "trend" without a dated reference point.

### political-stride-assessment

**Inputs** — scoped entity (party / committee / agency / electoral component), trust boundary, adversary model, relevant `threat-analysis.md` kill-chain and `risk-assessment.md` Institutional/Corruption rows.  
**Analytic moves** — (1) scope + adversary-model declaration; (2) 6 dimension tables (Spoofing / Tampering / Repudiation / Information-disclosure / Denial / Elevation) with ≥ 3 rows each carrying vector, target, L, I, existing mitigation, residual risk, evidence; (3) ≥ 2 Mermaid colour-coded attack trees; (4) MITRE-style TTP mapping table with political adaptations; (5) control mapping to ISO 27001 · NIST CSF 2.0 · CIS Controls v8.1; (6) PIR feedback.  
**Evidence rules** — every STRIDE row cites evidence (incident log, historical parallel, named actor, `dok_id`); every L × I ≥ 12 row also appears in `threat-analysis.md` TTPs.  
**Anti-patterns** — applying STRIDE verbatim without political adaptation; missing residual-risk column; no Mermaid attack tree; omitting the ISMS control map.

### wildcards--black-swans

**Inputs** — `scenario-analysis.md` anchor, historical-parallels register, long-horizon elicitation, external-shock indicators (IMF risk outlook, NATO briefs, MSB reports).  
**Analytic moves** — (1) horizon + domain filter; (2) ICD-203-aligned definitions (wildcard in WEP `Unlikely`…`Remote` ≈ 5–37 % per [`political-style-guide.md`](political-style-guide.md#-words-of-estimative-probability-wep--odni-confidence-overlay); black-swan < 5 % with plausible chain); (3) wildcard register ≥ 8 events across domains with trigger indicator + lead time + impact vectors + existing counter-measures; (4) ≥ 3 black-swan candidates each with "why under-weighted" + ≤ 4-step plausible causal chain; (5) ≥ 2 Mermaid colour-coded cascading consequence trees; (6) early-warning indicator table feeding `forward-indicators.md`; (7) resilience assessment across 5 dimensions (institutional / fiscal / coalition / info-integrity / alliance).  
**Evidence rules** — every wildcard row cites a historical analogue OR expert source; every early-warning indicator includes data source + threshold; resilience rows cite fiscal buffer via IMF GGXWDG_NGDP.  
**Anti-patterns** — treating the register as doomsaying without causal chains; no early-warning indicators (the actionable column); confusing high-probability risks with wildcards; omitting resilience assessment.

### quantitative-swot

**Inputs** — `swot-analysis.md` narrative content, `significance-scoring.md` weight vector (`w_D=0.35, w_I=0.25, w_W=0.20, w_S=0.20`).  
**Analytic moves** — (1) scope + perspective declaration; (2) scoring rubric documentation (`I ∈ [-5,+5]`, `C ∈ [0.2,0.95]` WEP-mapped, `L ∈ [0.1,1.0]`, `T ∈ [0.3,1.0]`); (3) 4 scored tables (S / W / O / T) with ≥ 3 evidence-citing items each; (4) composite metrics (net position, SW-balance, OT-balance, high-confidence share); (5) TOWS 2 × 2 with ≥ 1 action per quadrant citing item IDs; (6) ≥ 3 sensitivity analyses; (7) Mermaid `xychart-beta` composite-score bar chart.  
**Evidence rules** — every scored item cites evidence matching `swot-analysis.md`; confidence `C` must correspond to declared WEP band; top-3 composite items appear in `executive-brief.md § 3 Decisions`.  
**Anti-patterns** — inventing items not in narrative SWOT; picking scores to justify a pre-decided ranking; omitting sensitivity analysis; TOWS quadrants without item-ID citations.

---

## 🔗 Related Documentation

- [`artifact-catalog.md`](artifact-catalog.md) — single row per artifact (this file's companion index)
- [`ai-driven-analysis-guide.md`](ai-driven-analysis-guide.md) — DIW weighting, tier depths, Pass 1/2 rules
- [`osint-tradecraft-standards.md`](osint-tradecraft-standards.md) — ICD 203, Admiralty, WEP, SATs
- [`reference-quality-thresholds.json`](reference-quality-thresholds.json) — numeric floors
- [`.github/prompts/04-analysis-pipeline.md`](../../.github/prompts/04-analysis-pipeline.md) — execution order
- [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) — enforcement
- Templates — one per artifact under [`../templates/`](../templates/)

## 📜 Changelog

- **v1.3 (2026-05-01)** — Added §`cycle-trajectory` (Family D), §`parliamentary-season` (Family C), §`horizon-pir-rollforward` (Supplementary S8). Extended §`forward-indicators` with horizon-band evidence rule (per-band WEP degradation, min indicator counts). Extended §`scenario-analysis` with horizon-stratified branches rule. Updated core count 23→24.
- **v1.1 (2026-04-23)** — Added Analytical Supplementary section (pestle-analysis · political-stride-assessment · wildcards--black-swans · quantitative-swot) aligned with [`analytical-supplementary-methodology.md`](analytical-supplementary-methodology.md).
- **v1.0 (2026-04-23)** — Initial Riksdagsmonitor per-artifact methodology reference; adapted from EU Parliament Monitor `per-artifact-methodologies.md` v1.0 to the Riksdag 23-artifact catalog.
