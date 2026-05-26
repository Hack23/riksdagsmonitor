# Data Download Manifest — Evening Analysis 2026-05-26

**Author**: James Pether Sörling | **Date**: 2026-05-26 | **Type**: Tier-C Aggregation | **Classification**: PUBLIC  
**Source**: riksdag-regering MCP API (riksdag-regering-ai.onrender.com) | **Retrieval**: 2026-05-26T18:56:20Z

---

## Manifest Summary

This Tier-C aggregation workflow ingests documents already downloaded and analysed in sibling folders. All raw documents and their metadata are catalogued below with references to their sibling-folder analysis locations.

| Sibling folder | Document count | Raw files location |
|---------------|---------------|-------------------|
| propositions/ | 10 | analysis/daily/2026-05-26/propositions/documents/ |
| motions/ | 2 | analysis/daily/2026-05-26/motions/documents/ |
| committee-reports/ | 4 | analysis/daily/2026-05-26/committee-reports/documents/ |
| interpellations/ | 7 | analysis/daily/2026-05-26/interpellations/documents/ |
| **Total** | **23** | |

---

## Propositions (from propositions/ sibling)

| dok_id | Title | Source URL | Data-depth | Sibling analysis |
|--------|-------|-----------|------------|-----------------|
| HD03267 | Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | data.riksdagen.se/dok/HD03267 | L2+ | propositions/documents/HD03267-analysis.md |
| HD03265 | Complement to HD03267 (security threats) | data.riksdagen.se/dok/HD03265 | L2+ | propositions/documents/HD03265-analysis.md |
| HD03254 | NATO defence integration proposition | data.riksdagen.se/dok/HD03254 | L2+ | propositions/documents/HD03254-analysis.md |
| HD03250 | e-ID digital identity framework (eIDAS 2.0) | data.riksdagen.se/dok/HD03250 | L2+ | propositions/documents/HD03250-analysis.md |
| HD03261 | Utökade befogenheter för Skatteverket (folkbokföring) | data.riksdagen.se/dok/HD03261 | L2+ | propositions/documents/HD03261-analysis.md |
| HD03251 | Social care coordination proposition | data.riksdagen.se/dok/HD03251 | L2 | propositions/documents/HD03251-analysis.md |
| HD03260 | Social/health supplement | data.riksdagen.se/dok/HD03260 | L2 | propositions/documents/HD03260-analysis.md |
| HD03248 | EU partnership ratification (1) | data.riksdagen.se/dok/HD03248 | L2 | propositions/documents/HD03248-analysis.md |
| HD03249 | EU partnership ratification (2) | data.riksdagen.se/dok/HD03249 | L2 | propositions/documents/HD03249-analysis.md |
| HD03255 | Supporting legislative bill | data.riksdagen.se/dok/HD03255 | L1 | propositions/documents/HD03255-analysis.md |

## Motions (from motions/ sibling)

| dok_id | Title | Source URL | Data-depth | Sibling analysis |
|--------|-------|-----------|------------|-----------------|
| HD024192 | MP opposition — children's detention (JuU) | data.riksdagen.se/dok/HD024192 | L2+ | motions/documents/hd024192-analysis.md |
| HD024191 | MP opposition — Skatteverket GDPR safeguards (SkU) | data.riksdagen.se/dok/HD024191 | L2 | motions/documents/hd024191-analysis.md |

## Committee Reports (from committee-reports/ sibling)

| dok_id | Title | Source URL | Data-depth | Sibling analysis |
|--------|-------|-----------|------------|-----------------|
| HD01UU24 | Civilian intelligence service (UU24) | data.riksdagen.se/dok/HD01UU24 | L3 | committee-reports/documents/HD01UU24-analysis.md |
| HD01JuU48 | New criminal sanctions system (JuU48) | data.riksdagen.se/dok/HD01JuU48 | L3 | committee-reports/documents/HD01JuU48-analysis.md |
| HD01JuU47 | Online recruitment policing tools (JuU47) | data.riksdagen.se/dok/HD01JuU47 | L2+ | committee-reports/documents/HD01JuU47-analysis.md |
| HD01UU19 | NATO activities 2025 review (UU19) | data.riksdagen.se/dok/HD01UU19 | L2 | committee-reports/documents/HD01UU19-analysis.md |

## Interpellations (from interpellations/ sibling)

| dok_id | Title | Questioner | Target Minister | Deadline | Sibling analysis |
|--------|-------|-----------|----------------|---------|-----------------|
| HD10514 | 2030 transport climate target | Westlund (S) | Britz (L) | 2026-06-09 | interpellations/documents/ |
| HD10515 | Swedish emissions audit | Guteland (S) | Britz (L) | 2026-06-09 | interpellations/documents/ |
| HD10510 | Climate instruments (MP) | MP MP | Britz (L) | 2026-06-05 | interpellations/documents/ |
| HD10509 | Styrmedelsutredningen delay (MP) | MP MP | Britz (L) | 2026-06-05 | interpellations/documents/ |
| HD10512 | Women's shelter closures | Backeskog (S) | Waltersson Grönvall (M) | 2026-06-05 | interpellations/documents/ |
| HD10513 | Sjukersättning access failures | Rodén (S) | Tenje (M) | 2026-06-05 | interpellations/documents/ |
| HD10511 | Tax cuts and inequality (RF 1:2) | Karlsson (S) | Svantesson (M) | 2026-06-18 | interpellations/documents/ |

---

## MCP Data Source Metadata

| Source | Status | Retrieved at | Reliability |
|--------|--------|-------------|-------------|
| riksdag-regering MCP API | ✅ Live | 2026-05-26T18:56:20.693Z | A1 (completely reliable) |
| data.riksdagen.se | ✅ Online | 2026-05-26 | A1 |
| IMF WEO-2026-04 | ✅ Loaded from cache | 2026-05-26 | B1 (published vintage) |

---

## Retrieval Notes

- All documents retrieved by sibling workflows (propositions, motions, committee-reports, interpellations) on 2026-05-26
- Tier-C aggregation workflow does not re-download documents — references existing sibling analyses
- No retry queue items pending for evening-analysis
- MCP sync status: `{"status":"live","generated_at":"2026-05-26T18:56:20.693Z"}`
