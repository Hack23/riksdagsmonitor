# Intelligence Assessment — Year-Ahead 2026-05-10

## Source Evaluation

### Tier A Sources (High credibility, directly observed)

**A1: Riksdagsdokument (11 documents)**
- Credibility: High (official parliamentary record, publicly available under Offentlighetsprincipen)
- Completeness: Partial (full text available via MCP but 59KB+ triggers token limits; metadata used for FiU37, JuU32, HD03267, HD03250, HD03261)
- Bias: Government propositions advocate for government's preferred policy; committee reports reflect committee majority position
- Limitations: Committee minority positions not fully captured (require full-text parsing); motreservationer not individually extracted

**A2: Prior riksdag votes (cross-riksmöte)**
- Credibility: Very high (actual recorded votes, not modelled)
- Limitation: Cross-riksmöte proxy only (2022/23 JuU32 voting pattern used for 2025/26 JuU32 prediction); party positions may have shifted
- Confidence: High for directional prediction; medium for exact seat distribution

**A3: IMF WEO April 2026 via imf-fetch pre-warm** [T+1]
- Credibility: High (IMF institutional; WEO is gold standard for macro projections) [T+1]
- Limitation: SDMX endpoint degraded; WEO/FM Datamapper used as fallback; specific Swedish indicators confirmed (GDP, CPI, debt/GDP, fiscal balance)
- Vintage: April 2026 (<3 months from article date); annotation not required
- economicProvenance: provider=imf, dataflow=WEO, vintage=2026-04, retrieved_at=2026-05-10T11:08:00Z [T+1]

**A4: MCP riksdag-regering health check (Live status)**
- Credibility: Confirmed live; latency ~100ms; all tools responsive

### Tier B Sources (Medium credibility, contextual/inferred)

**B1: Nordic comparative data (Denmark §45b, Norway MinID/Altinn, Finland bilateral enforcement)**
- Source: Open-source analysis from ECHR case database, Oikeusministeriö Finland, Altinn documentation
- Credibility: Medium-high (institutional sources, but not directly queried in this workflow — cited from analyst knowledge base)
- Limitation: Exact case counts and dates not independently verified in this workflow run; pending independent verification

**B2: German ePerso adoption data**
- Source: Bundesregierung published statistics; third-party analysis
- Credibility: Medium (adoption figures widely reported; cited from analyst knowledge base)
- Limitation: Not independently queried from BMI (German Ministry of Interior) in this run

**B3: Statskontoret welfare fraud estimates (SEK 18 billion/year)**
- Source: Statskontoret annual reviews (cited as approximately SEK 18 billion/year in prior government documents)
- Credibility: Medium-high (Statskontoret is authoritative)
- Limitation: Exact figure not queried live; approximate

**B4: BankID penetration (85% Swedish adults)**
- Source: Swedish Payments Council / BankID statistics
- Credibility: Medium-high (widely cited)
- Limitation: 2024 figure; not independently verified in this workflow run

### Tier C Sources (Low credibility — political signalling, not independently verified)

**C1: Written questions HD10475–HD11799**
- Credibility: Low as factual claims (political advocacy documents); High as signals of party priorities
- Use: Treated exclusively as political signal/intelligence on opposition agenda

**C2: Opinion polling references**
- No specific polls cited with dates/margins in this analysis
- Probability estimates (Tidö 32%, S-bloc 38%) derived from structural analysis, not specific current polls
- **Gap**: No specific dated opinion poll data queried in this workflow. Polling estimates are directional only.

---

## Intelligence Gaps

### GAP-01: Current SÄPO Threat Level [CRITICAL]
- Needed for: R01 (pre-election security incident), T-D2 (physical attack), election security planning
- Status: SÄPO does not publish real-time threat levels; annual threat assessment published Q1
- Workaround: R01 probability (15%) based on historical baseline; not current threat assessment
- Recommendation: Query SÄPO press releases and parliamentary oversight committee (KU) for any recent threat level changes

### GAP-02: Current Opinion Polls (May 2026) [HIGH]
- Needed for: Scenario probability calibration, election-2026-analysis seat projections
- Status: No specific polls queried in this workflow; estimates based on structural factors
- Workaround: Used structural analysis (party trends, incumbency, issue salience)
- Recommendation: Cross-reference Demoskop, Ipsos, Kantar polls from April-May 2026 (would sharpen scenario probabilities by ±8pp)

### GAP-03: Lagrådet Status on HD03267 [HIGH]
- Needed for: Constitutional challenge risk assessment, R05
- Status: Lagrådet referral expected within 4–6 weeks; no yttrande published as of 2026-05-10T11:08:00Z
- Workaround: Probability estimate (25% for block) based on ECHR jurisprudence and precedent
- Recommendation: Monitor lagradet.se weekly from T+14

### GAP-04: Full Text of Key Committee Reports [MEDIUM]
- Needed for: Exact minority positions (motreservationer), committee reasoning
- Status: Full text available but not parsed (>59KB token limit triggered)
- Impact on analysis: Minority positions of V, MP, and L on JuU32, HD03267 not captured
- Workaround: Prior voting patterns used as proxy

### GAP-05: IMF SDMX Dataflow [LOW-MEDIUM] [T+1]
- Needed for: IFS data (monetary, banking, balance of payments)
- Status: IFS SDMX endpoint returning 404 as of 2026-05-10T11:08:00Z
- Impact: Only WEO/FM Datamapper used; no IFS Swedish-specific monthly data
- Workaround: WEO Apr-2026 provides annual aggregates; Riksbank independent policy data not captured
- economicProvenance: warningBlock injected per data/imf-context.json spec [T+1]

### GAP-06: Swedish Election Polling Aggregates [HIGH]
- See GAP-02 above; distinct gap for seat projection modelling

---

## Confidence Assessment by Domain

| Domain | Confidence | Basis |
|--------|-----------|-------|
| Legislative content accuracy | HIGH | Official riksdagsdokument metadata |
| Security legislation analysis | HIGH | Comparative analysis + prior votes |
| Economic context | HIGH | IMF WEO Apr-2026 (vintage good) | [T+1]
| Election scenario probabilities | MEDIUM | Structural analysis; no current polls |
| Implementation timeline estimates | MEDIUM-LOW | Comparative precedents; no operational data |
| State actor threat probabilities | MEDIUM | NCSC 2025 report referenced; not current |
| Coalition formation predictions | MEDIUM | Historical parallels; uncertain outcome |

## Overall Assessment

This year-ahead analysis is built on a solid foundation of official riksdagsdokument and IMF economic data, with sound comparative analysis of Nordic and German precedents. The primary weaknesses are: (1) absence of current opinion polling data for election scenario calibration; (2) incomplete full-text parsing of committee reports; and (3) no current SÄPO threat assessment. [T+1]

These gaps are consistent with the constraints of an automated intelligence analysis workflow operating on the day of document publication. The gaps do not materially undermine the strategic conclusions but should be flagged for human analyst follow-up.

**Net confidence level**: MEDIUM-HIGH for strategic analysis; MEDIUM for quantitative probability estimates; HIGH for legislative content and economic context.
