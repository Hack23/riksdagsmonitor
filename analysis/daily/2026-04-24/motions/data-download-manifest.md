# Data Download Manifest — Motions — 2026-04-24

**Workflow**: news-motions
**Run ID**: 24866827737
**UTC timestamp**: 2026-04-24T01:05Z
**Requested date**: 2026-04-24
**Effective window**: 2026-04-15 to 2026-04-17 (most recent motion datum in open data)
**MCP**: riksdag-regering (HTTP, Render) — `get_sync_status` = live; `get_motioner` limit=20 returned 20 of 257,825 total

> **Lookback used**: The current riksmöte 2025/26 motion window for counter-motions to government propositions peaked 2026-04-15 to 2026-04-17 (motion deadline following prop tabling). 2026-04-24 is a procedural day; the most recent 20 motions below form today's analytical corpus per §3 lookback policy.

## Per-document inventory (20 motions)

| # | dok_id | Datum | Organ | Party | Responds to | Title (short) | Full text |
|--:|--------|-------|-------|-------|-------------|---------------|-----------|
| 1 | HD024098 | 2026-04-17 | FiU | MP | prop 2025/26:236 | Extra ändringsbudget 2026 – drivmedel/el/gas | metadata-only |
| 2 | HD024096 | 2026-04-16 | UU | MP | prop 2025/26:228 | Regelverk för krigsmateriel | metadata-only |
| 3 | HD024094 | 2026-04-16 | SoU | C | prop 2025/26:216 | Medicinsk kompetens kommunal hälso- och sjukvård | metadata-only |
| 4 | HD024092 | 2026-04-16 | FiU | V | prop 2025/26:236 | Extra ändringsbudget 2026 – drivmedel | metadata-only |
| 5 | HD024091 | 2026-04-16 | UU | V | prop 2025/26:228 | Krigsmateriel — vapenexport | metadata-only |
| 6 | HD024097 | 2026-04-16 | SfU | MP | prop 2025/26:235 | Skärpta regler om utvisning p.g.a. brott | metadata-only |
| 7 | HD024095 | 2026-04-16 | SfU | C | prop 2025/26:235 | Utvisning p.g.a. brott — systematik | metadata-only |
| 8 | HD024093 | 2026-04-16 | FöU | C | prop 2025/26:214 | Nationellt cybersäkerhetscenter | metadata-only |
| 9 | HD024090 | 2026-04-16 | SfU | V | prop 2025/26:235 | Utvisning p.g.a. brott — avslag | metadata-only |
| 10 | HD024088 | 2026-04-15 | CU | C | prop 2025/26:223 | Ny konsumentkreditlag | metadata-only |
| 11 | HD024086 | 2026-04-15 | AU | MP | prop 2025/26:215 | Tidsbegränsat boende nyanlända | metadata-only |
| 12 | HD024085 | 2026-04-15 | CU | MP | prop 2025/26:222 | Ersättningsregler med brottsoffret i fokus | metadata-only |
| 13 | HD024084 | 2026-04-15 | CU | V | prop 2025/26:222 | Ersättningsregler — vårdnadshavares ansvar | metadata-only |
| 14 | HD024083 | 2026-04-15 | SoU | V | prop 2025/26:216 | Medicinsk kompetens — avslag | metadata-only |
| 15 | HD024082 | 2026-04-15 | FiU | S | prop 2025/26:236 | Extra ändringsbudget 2026 | metadata-only |
| 16 | HD024081 | 2026-04-15 | SoU | S | prop 2025/26:216 | Medicinsk kompetens — S-linje | metadata-only |
| 17 | HD024079 | 2026-04-15 | AU | S | prop 2025/26:215 | Tidsbegränsat boende — S-linje | metadata-only |
| 18 | HD024078 | 2026-04-15 | CU | S | prop 2025/26:222 | Ersättningsregler — brottsofferlag | metadata-only |
| 19 | HD024089 | 2026-04-15 | SfU | C | prop 2025/26:229 | En ny mottagandelag | metadata-only |
| 20 | HD024087 | 2026-04-15 | SfU | MP | prop 2025/26:229 | En ny mottagandelag — avslag | metadata-only |

## Source URLs (primary)

All accessible at `https://data.riksdagen.se/dokument/{dok_id}.html`. Example: <https://data.riksdagen.se/dokument/HD024098.html>.

## MCP server availability notes

- `get_sync_status`: live (2026-04-24T01:05:50Z)
- `get_motioner`: successful on first call, 20 records retrieved
- No retries required. No partial failures.

## Cluster summary

| Cluster | Responds to | Parties | Count |
|---------|-------------|---------|------:|
| Extra ändringsbudget drivmedel | prop 236 | S, V, MP | 3 |
| Krigsmateriel | prop 228 | V, MP | 2 |
| Utvisning vid brott | prop 235 | C, V, MP | 3 |
| Medicinsk kompetens kommun | prop 216 | S, V, C | 3 |
| Mottagandelag | prop 229 | C, MP | 2 |
| Tidsbegränsat boende | prop 215 | S, MP | 2 |
| Ersättningsregler brottsoffer | prop 222 | S, V, MP | 3 |
| Cybersäkerhetscenter | prop 214 | C | 1 |
| Konsumentkreditlag | prop 223 | C | 1 |

**Opposition coverage**: S (5), V (4), MP (6), C (5). Sverigedemokraterna (SD) absent from counter-motion wave — a structurally notable signal given SD's Tidö-coalition alignment.

---

*Author: James Pether Sörling · Generated via riksdag-regering MCP*
