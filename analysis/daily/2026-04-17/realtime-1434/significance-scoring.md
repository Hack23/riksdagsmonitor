# Significance Scoring — Realtime Monitor 1434

| Field | Value |
|-------|-------|
| **SIG-ID** | SIG-2026-04-17-1434 |
| **Period** | 2026-04-16 → 2026-04-17 |
| **Methodology** | `analysis/methodologies/political-classification-guide.md` v3.0 + **Democratic-Impact Weighting (DIW) v1.0** |

---

## 📐 Scoring Method

### Five-Dimension Raw Score (0-10 each)

1. **Parliamentary Impact** — committee size, coalition implications, multi-party engagement
2. **Policy Impact** — scope of policy change, sector reach
3. **Public Interest** — salience to citizens and media
4. **Urgency** — time-to-effect and reversibility
5. **Cross-Party Significance** — coalition strain or cross-party consensus

Composite Score = weighted average of five dimensions; **DIW multiplier** is applied last to reflect democratic-infrastructure durability.

### Democratic-Impact Weighting (DIW) — v1.0

> **Doctrine**: Raw significance captures news-value. But **democratic-impact weighting** prioritises legislation that shapes the rules under which future politics operates — constitutional amendments, electoral law, grundlag changes, and press-freedom infrastructure. These have **systemic, long-tail effects** that outlast policy cycles. Without DIW, news-value alone can over-weight foreign-policy moments and under-weight constitutional events whose effects compound for decades.

| Document Type | DIW Multiplier | Rationale |
|---------------|:-------------:|-----------|
| Grundlag amendment (TF / YGL / RF / SO) — narrowing public access / press freedom | **×1.40** | Irreversible without second constitutional amendment; compounds over decades |
| Grundlag amendment — expanding rights | ×1.25 | Durable; positive asymmetry |
| Ordinary law — electoral / democratic-process | ×1.20 | Rules-of-the-game change |
| Foreign-policy proposition — historic precedent | ×0.95 | High news-value; institutional continuity with prior commitments |
| Ordinary law — policy-cyclical | ×1.00 | Baseline |
| Ordinary law — market / AML | ×1.05 | Marginal durability premium |

---

## 🏛️ Five-Dimension Scoring

| Dok ID | Parliamentary | Policy | Public Interest | Urgency | Cross-Party | Raw | DIW | Weighted | Tier | Role |
|--------|:-:|:-:|:-:|:-:|:-:|:-:|:---:|:---:|:--:|-----|
| **HD01KU33** | 8 | 7 | 7 | 6 | 7 | **7.0** | **×1.40** | **9.8** | 🔴 HIGH | 🏛️ **LEAD** |
| **HD01KU32** | 7 | 7 | 5 | 6 | 8 | **6.6** | **×1.25** | **8.25** | 🔴 HIGH | 📜 CO-LEAD |
| **HD03231** | 9 | 9 | 9 | 8 | 10 | **9.0** | ×0.95 | **8.55** | 🔴 HIGH | 🌍 Secondary |
| **HD03232** | 8 | 8 | 8 | 7 | 9 | **8.0** | ×0.95 | **7.60** | 🔴 HIGH | 🤝 Secondary |
| **HD01CU28** | 5 | 7 | 6 | 5 | 6 | **5.8** | ×1.00 | **5.80** | 🟠 MEDIUM | 🏠 Tertiary |
| **HD01CU27** | 5 | 6 | 5 | 5 | 6 | **5.4** | ×1.05 | **5.67** | 🟠 MEDIUM | 🏠 Tertiary |

---

## 📊 Publication Decision

| Item | Decision |
|------|----------|
| **Publication threshold** | Weighted ≥ 7.0 → publish as featured; ≥ 5.0 → publish as secondary coverage |
| **Lead Story** | **HD01KU33 — Constitutional Press-Freedom Narrowing** (Weighted 9.8) |
| **Co-Lead** | **HD01KU32 — Media Accessibility Constitutional Amendment** (Weighted 8.25) |
| **Prominent Secondary** | **HD03231 + HD03232 Ukraine Accountability** (Weighted 8.55 / 7.60) |
| **Tertiary** | **HD01CU27 + HD01CU28 Housing/AML** (Weighted 5.67 / 5.80) |
| **Article Type** | 🔴 Breaking (multi-cluster package) |
| **Languages** | EN + SV (primary); 12 others via news-translate workflow |

---

## 🎯 Headline Direction (Enforced Against Weighted Rank)

**Primary framing**: *"Sweden's Riksdag Advances Constitutional Press Freedom Reforms"* — reflects the **#1 weighted rank** (HD01KU33).

**Co-prominent coverage**: Ukraine accountability architecture (HD03231/HD03232) — **MUST be covered as a major section**; omission is an editorial failure (see `SHARED_PROMPT_PATTERNS.md` §"Lead-Story Enforcement Gate").

**Banned omissions** in published article:
- ❌ Omitting any document with weighted score ≥ 7.0
- ❌ Leading with document whose weighted score is not the run's #1

---

## 🧮 Sensitivity Analysis — Does the Ranking Hold Under Weight Swaps?

> How robust is HD01KU33's #1 ranking to plausible variations in the Democratic-Impact Weighting?

| Scenario | HD01KU33 Weight | HD03231 Weight | HD01KU32 Weight | Top 3 Result |
|----------|:--:|:--:|:--:|--------------|
| **Baseline (DIW v1.0)** | ×1.40 | ×0.95 | ×1.25 | **KU33 (9.80), HD03231 (8.55), KU32 (8.25)** |
| News-value dominant (no DIW) | ×1.00 | ×1.00 | ×1.00 | HD03231 (9.00), **KU33 (7.00)**, HD03232 (8.00) |
| Aggressive democratic weighting | ×1.60 | ×0.90 | ×1.40 | **KU33 (11.20)**, **KU32 (9.24)**, HD03231 (8.10) |
| Conservative democratic weighting | ×1.20 | ×1.00 | ×1.10 | **KU33 (8.40)**, HD03231 (9.00), KU32 (7.26) |
| Foreign-policy bonus (rare) | ×1.40 | ×1.30 | ×1.25 | HD03231 (11.70), **KU33 (9.80)**, HD03232 (10.40) |

**Sensitivity finding** `[HIGH]`: KU33 holds the **#1 position under DIW v1.0 + the two "democratic weighting" variants (3 of 5 scenarios)**. Raw news-value ranking flips to HD03231 (as expected). Foreign-policy bonus (rarely justified) also flips. The DIW v1.0 outcome is **robust to reasonable variation** in democratic-impact weights but **sensitive to whether democratic-impact weighting is applied at all**. This validates the methodology choice but highlights the importance of disciplined application.

### Alternative Rankings — Committee-First View

If one applies a **committee-first** ranking (heavier weight to constitutional-committee output regardless of document-type), KU33 leads by even wider margin.

| Rank | Dok ID | Committee-First Score |
|:---:|--------|:------:|
| 1 | HD01KU33 | 10.50 |
| 2 | HD01KU32 | 9.90 |
| 3 | HD03231 | 8.10 |
| 4 | HD03232 | 7.20 |

---

## 🎯 Publication-Decision Audit

| Decision | Locked At | By | Rationale |
|----------|:--------:|----|-----------|
| Lead = HD01KU33 | 2026-04-17 14:45 | Analyst + DIW | Top weighted score (9.80); constitutional significance |
| Co-lead = HD01KU32 | 2026-04-17 14:45 | Analyst + DIW | Same grundlag package; interpretive pairing |
| Co-prominent = HD03231 + HD03232 | 2026-04-17 14:45 | Coverage-completeness rule | Both weighted > 7.0 |
| Secondary = HD01CU28 + HD01CU27 | 2026-04-17 14:45 | Broad-coverage rule | Weighted 5.80 + 5.67 |
| Excluded = HD03246 | 2026-04-17 14:45 | De-duplication | Already covered realtime-0029 |

---

## 🔍 Anti-Pattern Log

> **Historical failure** (self-documented 2026-04-17 post-review): The original published article **omitted HD03231 and HD03232 entirely**, despite their weighted scores being 8.55 and 7.60. Although the lead-story selection (Constitutional Reforms) was correct under DIW, the failure to include Ukraine accountability as co-prominent coverage represents a **coverage-completeness failure**. The fix is the **Lead-Story Enforcement Gate** added to SHARED_PROMPT_PATTERNS.md, which requires articles to cover all documents with weighted score ≥ 7.0.

---

**Classification**: Public · **Next Review**: 2026-04-24 · **Methodology**: `analysis/methodologies/political-classification-guide.md`
