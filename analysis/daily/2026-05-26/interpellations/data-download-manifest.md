# Data download manifest

**Workflow**: News: Interpellation Debates
**Run**: 26439154327 attempt 1
**Started (UTC)**: 2026-05-26T07:46:32Z
**Requested date**: 2026-05-26
**Effective date**: 2026-05-26
**Subfolder**: interpellations
**Riksmöte**: 2025/26
**Improvement mode**: false
**Status**: complete — 10 documents downloaded, 5 full-text enriched

## MCP attempts

| Attempt | Timestamp | Status |
|---------|-----------|--------|
| 1 | 2026-05-26T07:47:16Z | ✅ live — `riksdag-regering` MCP server online |

## Per-document table

| dok_id | Title | Type | Parti | Minister/Recipient | Date | Full-text | Status |
|--------|-------|------|-------|--------------------|------|-----------|--------|
| HD10514 | Klimatmålen till 2030 | ip | S | Johan Britz (L) — Arbetsmarknadsminister/vikarierande klimat- och miljöminister | 2026-05-26 | ✅ | Skickad/Anmäld 2026-05-27 |
| HD10515 | Ökad takt i klimatarbetet | ip | S | Johan Britz (L) — Arbetsmarknadsminister/vikarierande klimat- och miljöminister | 2026-05-26 | ✅ | Skickad/Anmäld 2026-05-27 |
| HD10513 | Sjukersättning för personer som saknar arbetsförmåga | ip | S | Anna Tenje (M) — Äldre- och socialförsäkringsminister | 2026-05-25 | ✅ | Skickad/Anmäld 2026-05-26 |
| HD10512 | Socialtjänstens och kvinnojourernas skydd av våldsutsatta | ip | S | Camilla Waltersson Grönvall (M) — Socialtjänstminister | 2026-05-25 | ✅ | Skickad/Svarsdatum 2026-06-05 |
| HD10511 | Den ekonomiska politikens fördelningseffekter | ip | S | Elisabeth Svantesson (M) — Finansminister | 2026-05-25 | ✅ | Skickad/Svarsdatum 2026-06-18 |
| HD10510 | Klimatpåverkan från transporter inom Stockholms stad | ip | MP | Johan Britz (L) — vikarierande klimat- och miljöminister | 2026-05-25 | metadata-only | Skickad |
| HD10509 | Ny lagstiftning för klimatanpassning | ip | MP | Johan Britz (L) — vikarierande klimat- och miljöminister | 2026-05-25 | metadata-only | Skickad |
| HD10508 | Stöd till civilsamhällets trafiksäkerhetsorganisationer | ip | S | Andreas Carlson (KD) — Infrastruktur- och bostadsminister | 2026-05-22 | metadata-only | Skickad |
| HD10507 | Statsbidrag till kooperativ utveckling | ip | S | Ebba Busch (KD) — Energi- och näringsminister | 2026-05-22 | metadata-only | Skickad |
| HD10505 | HVB-hem med kriminella kopplingar som fortfarande är i drift | ip | S | Camilla Waltersson Grönvall (M) — Socialtjänstminister | 2026-05-22 | metadata-only | Skickad |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | Notes |
|--------|---------------------|-------|
| HD10514 | true | Full HTML text retrieved |
| HD10515 | true | Full HTML text retrieved |
| HD10513 | true | Full HTML text retrieved |
| HD10512 | true | Full HTML text retrieved |
| HD10511 | true | Full HTML text retrieved |
| HD10510 | false | metadata-only |
| HD10509 | false | metadata-only |
| HD10508 | false | metadata-only |
| HD10507 | false | metadata-only |
| HD10505 | false | metadata-only |

## Prior-Voteringar Enrichment

Search conducted for climate (klimat) and sjukersättning votes, rm 2024/25.

- **AU10 (2025-05-14)** — votering_id EDADC2B5, sakfrågan punkt 1: S=Avstår, SD=Nej, C=Ja, M=Frånvarande. This is the most recent indexed climate/labour-related vote. Direct klimatmål votes not separately indexed for interpellations (interpellationer do not trigger formal votes; they generate debate).
- **Prior voteringar**: No directly comparable vote found in last 4 riksmöten specifically keyed to klimatmål 2030 or sjukersättning interpellations — interpellationer are debate instruments, not legislation triggers.

## Statskontoret Cross-Source Enrichment

Trigger evaluation:
- HD10513 (sjukersättning): Names Försäkringskassan implicitly (sjukpenning/sjukersättning system). **Trigger: administrative-capacity claim**. Statskontoret pre-warm conducted.
- HD10512 (skyddade boenden): Names socialtjänst and women's shelters — administrative-capacity/implementation risk. **Trigger fired**.
- HD10511 (economic distribution): Fiscal policy — no named agency. **Trigger: not matched**.
- HD10514/HD10515 (klimat): Names Miljömålsberedningen (advisory body), Styrmedelsutredningen. **Trigger: governance/implementation feasibility**.

Statskontoret search performed via web_fetch — domain statskontoret.se. No directly relevant report found in public search for acute interpellation topics (May 2026). Statskontoret: no directly relevant source found for these specific trigger areas at retrieval time 2026-05-26T07:49:00Z.

## Lagrådet Tracking

No government propositions in this batch — all documents are interpellations (ip type). Lagrådet review is not applicable to interpellationer. Lagrådet tracking: not applicable for interpellation document type.

## Withdrawn Documents

None identified in this document set.

## PIR Carry-Forward

PIRs for this cycle:
- PIR-CLIM-01: Will Sweden revise 2030 climate targets (transport target) before autumn 2026? Status: open
- PIR-SOC-01: Will government reform sjukersättning access criteria before election 2026? Status: open
- PIR-ECON-01: Will economic inequality metrics worsen under 2025/26 budget? Status: open
- PIR-SHLTR-01: Will government address women's shelter capacity crisis before summer recess? Status: open
