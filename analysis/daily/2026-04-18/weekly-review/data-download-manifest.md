# 📦 Data Download Manifest — Riksdag Week 16, 2026

| Field | Value |
|-------|-------|
| **DLM-ID** | DLM-2026-W16 |
| **Period Covered** | 2026-04-11 — 2026-04-17 (Riksmöte 2025/26) |
| **Run** | weekly-review-2026-04-18 |
| **Total Documents Tracked** | 23 high-significance documents (top of ≈150 in weekly catalog) |
| **Documents Persisted** | 11 dok JSON files + `economic-data.json` |
| **MCP Sources** | `riksdag-regering` (32+ tools) · `world-bank` · `scb` |
| **Methodology** | `ai-driven-analysis-guide.md` v5.1 §Rule 2 (AI performs analysis; scripts only download data) |

---

## 📄 Persisted Files (in `documents/`)

| File | Dok ID | Title | Type | Committee | Date | MCP Source | Retrieval Timestamp | Selected? (post-DIW) |
|------|--------|-------|------|-----------|------|-----------|--------------------:|:---------------------:|
| `hd01cu22.json` | HD01CU22 | Ett ställföreträdarskap att lita på | Bet | CU | 2026-04-17 | `get_betankanden` | 2026-04-18T05:21Z | 🟢 Brief reference (L1) |
| `hd01cu27.json` | HD01CU27 | Identitetskrav vid lagfart och åtgärder mot kringgåenden av bostadsrättslagen | Bet | CU | 2026-04-17 | `get_betankanden` | 2026-04-18T05:21Z | 🟠 Section H3 (L2) |
| `hd01cu28.json` | HD01CU28 | Ett register för alla bostadsrätter | Bet | CU | 2026-04-17 | `get_betankanden` | 2026-04-18T05:21Z | 🟠 Section H3 (L2) |
| `hd01cu42.json` | HD01CU42 | Riksrevisionens rapport om statens insatser vid hantering av dödsbon | Bet | CU | 2026-04-17 | `get_betankanden` | 2026-04-18T05:21Z | 🟢 Brief reference (L1) |
| `hd01ku32.json` | HD01KU32 | Tillgänglighetskrav för vissa medier | Bet | KU | 2026-04-17 | `get_betankanden` | 2026-04-18T05:22Z | 🔴 **CO-PROMINENT (L3)** |
| `hd01ku33.json` | HD01KU33 | Insyn i handlingar som inhämtas genom beslag och kopiering vid husrannsakan | Bet | KU | 2026-04-17 | `get_betankanden` | 2026-04-18T05:22Z | 🔴 **CO-LEAD (L3)** |
| `hd024098.json` | HD024098 | Motion mot Extra ändringsbudget 2025/26:236 | Mot | FiU | 2026-04-17 | `search_dokument` (typ=mot, rm=2025/26) | 2026-04-18T05:23Z | 🟠 Counter-narrative reference (L2) |
| `hd10437.json` | HD10437 | Lönetransparensdirektivet (EU rapport) | EU-rapport | — | 2026-04-17 | `search_dokument` (typ=eun) | 2026-04-18T05:24Z | 🟢 Brief reference |
| `hd10438.json` | HD10438 | Nedläggning av kvinnojourer | Interpellation | — | 2026-04-17 | `get_interpellationer` | 2026-04-18T05:24Z | 🟠 Cross-link to HD03245 |
| `hd11718.json` | HD11718 | Statlig närvaro i sydöstra Skåne | Interpellation | — | 2026-04-17 | `get_interpellationer` | 2026-04-18T05:24Z | 🟢 Brief reference |
| `hd11719.json` | HD11719 | Skattekrav mot kvinnor i tvångsprostitution | Interpellation | — | 2026-04-17 | `get_interpellationer` | 2026-04-18T05:24Z | 🟢 Brief reference |
| `economic-data.json` | (n/a) | World Bank GDP / unemployment time series — Sweden + Nordic peers | Reference | — | n/a | `world-bank` MCP | 2026-04-18T05:25Z | 🟢 Backdrop for fiscal analysis |

---

## 📚 Documents Referenced But NOT Persisted (in upstream catalog)

These documents are referenced extensively in this analysis but live in upstream catalogs (week 16 batch download) or in the realtime-1434 deep-dive folder. They are cited by dok_id throughout the analysis package:

| Dok ID | Title (short) | Source Where Persisted |
|--------|--------------|------------------------|
| HD03100 | Vårpropositionen 2026 | Daily catalog 2026-04-13 |
| HD0399 | Vårändringsbudgeten 2026 | Daily catalog 2026-04-13 |
| HD03236 | Extra ändringsbudget — fuel + el/gas | Daily catalog 2026-04-13 |
| HD03231 | Ukraine Special Tribunal | `analysis/daily/2026-04-17/realtime-1434/documents/HD03231-analysis.md` |
| HD03232 | Ukraine Damages Commission | `analysis/daily/2026-04-17/realtime-1434/documents/HD03232-analysis.md` |
| HD03244 | Interoperability data sharing | Daily catalog 2026-04-16 |
| HD03242 | Active forestry framework | Daily catalog 2026-04-16 |
| HD03246 | Skärpta regler unga lagöverträdare | Daily catalog 2026-04-16 (JuU15 protokoll separately) |
| HD03237 | Betald polisutbildning | Daily catalog 2026-04-14 |
| HD03245 | Strategy on men's violence vs women | Daily catalog 2026-04-14 |
| HD03240 | Electricity System Act | Daily catalog 2026-04-14 |
| HD03239 | Wind power municipal share | Daily catalog 2026-04-14 |
| HD03233 | Anti-fraud electronic communications | Daily catalog 2026-04-14 |
| HD01UFöU3 | NATO eFP Finland | Daily catalog 2026-04-15 |
| HD01SfU22 | Inhibition orders (migration) | Daily catalog 2026-04-14 |
| Prop 235 | Deportation expansion | Daily catalog 2026-04-14 |
| Prop 229 | New reception law | Daily catalog 2026-04-14 |

---

## 🔑 Provenance Summary

| Source | Volume This Run | Authentication | Caching |
|--------|:--------------:|----------------|---------|
| `riksdag-regering` MCP — `get_betankanden` | 6 documents (CU + KU) | None (public API) | TTL 24h |
| `riksdag-regering` MCP — `get_interpellationer` | 3 documents | None (public API) | TTL 24h |
| `riksdag-regering` MCP — `search_dokument` (mot/eun) | 2 documents | None (public API) | TTL 24h |
| `world-bank` MCP — `get-economic-data` (GDP, GDP_GROWTH, UNEMPLOYMENT) | 4 country series (SE, DK, NO, FI) × 10 years | None (public API) | TTL 24h |
| `riksdag-regering` MCP — `search_voteringar` | JuU15 chamber vote 145–142 | None (public API) | TTL 24h |
| `riksdag-regering` MCP — `search_anforanden` | Plenary speeches week 16 (Stenergard, Strömmer, Kristersson) | None (public API) | TTL 24h |

> **Source-protected information**: NONE in this run. All claims sourced from public Riksdagen / Regeringskansliet / World Bank data per [`Hack23 ISMS-PUBLIC CLASSIFICATION`](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md).

---

## ✅ Coverage Verification

| Check | Result |
|-------|:------:|
| All 11 persisted JSONs match a dok_id referenced in synthesis-summary.md | ✅ |
| All documents with weighted significance ≥ 7.0 cited in synthesis-summary.md and significance-scoring.md | ✅ (14/14) |
| economic-data.json values cited in synthesis-summary.md and swot-analysis.md (W2, W3) | ✅ |
| HD024098 (counter-budget motion) referenced in cross-reference-map.md C1 | ✅ |
| HD10438 cross-linked to HD03245 in stakeholder-perspectives.md | ✅ |
| HD11718 + HD11719 referenced in stakeholder-perspectives.md (Civil Society lens) | ✅ |
| Realtime-1434 cross-references resolve to existing files | ✅ |

---

## 🔁 Update Cycle

| Trigger | Refresh Action |
|---------|---------------|
| New persisted dok JSON | Re-run `data-download-manifest.md` row insert + verify selection status |
| Significance-scoring re-rank | Update "Selected? (post-DIW)" column |
| Article published | Verify each H3 section maps to a persisted or referenced dok_id |
| MCP source schema change | Re-validate retrieval timestamps + caching annotations |

---

## 📎 Cross-References

- [`README.md`](README.md) §File Index lists every persisted + analytical artefact
- [`significance-scoring.md`](significance-scoring.md) §Coverage-Completeness Verification mirrors the verification table here
- [`synthesis-summary.md`](synthesis-summary.md) §Documents Analysed cross-references each row

---

**Classification**: Public · **Next Review**: 2026-04-25 · **Methodology**: `ai-driven-analysis-guide.md` v5.1 §Rule 2 (separation: data download vs analysis) + §Provenance discipline
