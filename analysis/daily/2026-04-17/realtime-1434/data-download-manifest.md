# 📥 Data Download Manifest — Realtime Monitor 1434

| Field | Value |
|-------|-------|
| **MAN-ID** | MAN-2026-04-17-1434 |
| **Date** | 2026-04-17 14:34 UTC |
| **Completed** | 2026-04-17T14:40:00Z |
| **Data Freshness** | < 1 minute at query time — FRESH |

> **v5.0 note**: "Selected?" column reflects **post-DIW** publication decision. See `significance-scoring.md` for weighting rationale.

---

## 🔌 Data Sources

| Source | MCP Tool | Status | Count |
|--------|----------|:------:|:-----:|
| Riksdag propositioner (2025/26) | `get_propositioner` | ✅ Live | 272 total, 6 recent |
| Riksdag betänkanden (2025/26) | `get_betankanden` | ✅ Live | 20 retrieved |
| Riksdag dokument search | `search_dokument` (2026-04-16 → 2026-04-17) | ✅ Live | 2,818 total |
| Riksdag voteringar (2025/26) | `search_voteringar` | ✅ Live | 20 retrieved (latest: March 2026) |
| Regering pressmeddelanden | `search_regering` (2026-04-16 → 2026-04-17) | ✅ Live | 15 found |
| Regering propositioner | `search_regering` propositioner | ✅ Live | 3 found |
| Document content | `get_g0v_document_content` | ✅ Live | 1 fetched (Ukraine press release) |
| Document details | `get_dokument` | ✅ Live | 6 fetched |
| Sync status | `get_sync_status` | ✅ Live | Status: live |

---

## 📄 Key Documents Retrieved (Post-DIW Selection)

| Dok ID | Type | Date | Raw | DIW | Weighted | Role | Depth |
|--------|:----:|:----:|:---:|:---:|:--------:|------|:-----:|
| **HD01KU33** | Bet | 2026-04-17 | 7 | ×1.40 | **9.80** | 🏛️ **LEAD** | L3 |
| **HD03231** | Prop | 2026-04-16 | 9 | ×0.95 | **8.55** | 🌍 Prominent | L2+ |
| **HD01KU32** | Bet | 2026-04-17 | 7 | ×1.25 | **8.25** | 📜 CO-LEAD | L3 |
| **HD03232** | Prop | 2026-04-16 | 8 | ×0.95 | **7.60** | 🤝 Prominent | L2+ |
| HD01CU28 | Bet | 2026-04-17 | 6 | ×1.00 | 5.80 | 🏠 Secondary | L2 |
| HD01CU27 | Bet | 2026-04-17 | 5 | ×1.05 | 5.67 | 🏠 Secondary | L2 |
| HD01CU22 | Bet | 2026-04-17 | — | — | — | Context only | — |
| HD01SfU22 | Bet | 2026-04-14 | — | — | — | Context (prev. covered) | — |

---

## 🚫 Excluded Documents (Previously Covered)

| Dok ID | Reason |
|--------|--------|
| HD03246 | Covered in realtime-0029 (today, 00:29 UTC) |
| HD0399 | Published Apr 13 — covered by other workflows |
| HD03100 | Published Apr 13 — spring economic proposition |
| HD03236 | Published Apr 13 — spring extra budget |

---

## 🕐 Data Freshness

- **Last riksdagen sync**: 2026-04-17T14:34:37Z (live)
- **Data age at analysis start**: < 1 minute
- **Status**: FRESH — no staleness disclaimer required
- **Validity window**: Until 2026-04-24 (next realtime scan) or event-driven refresh

---

## 🔗 Provenance & Chain-of-Custody

| Step | Tool / Responsible | Timestamp (UTC) |
|------|-------------------|:---------------:|
| MCP query batch | news-realtime-monitor agent | 2026-04-17 14:34 |
| Document selection (post-DIW) | Agent + significance-scoring.md | 2026-04-17 14:36 |
| Per-file analysis generation | Copilot Opus 4.7 | 2026-04-17 14:38–15:10 |
| Synthesis + cross-reference | Copilot Opus 4.7 | 2026-04-17 15:12 |
| Article rendering | Copilot Opus 4.7 + rendering script | 2026-04-17 15:18 |
| Lead-Story & Coverage-Completeness Gate | bash verification | 2026-04-17 15:20 |
| Reference-grade upgrade (this version) | Copilot Opus 4.7 (2026-04-18 session) | 2026-04-18 07:30– |

---

**Classification**: Public · **Next Review**: 2026-04-24
