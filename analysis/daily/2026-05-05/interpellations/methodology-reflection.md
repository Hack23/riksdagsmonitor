# Methodology Reflection — Interpellations 2026-05-05

**Purpose**: Transparency on analytical choices, limitations, and confidence calibration  

---

## Data Sources Used

| Source | Tool/Method | Quality | Limitations |
|--------|------------|---------|-------------|
| riksdag.se interpellations | riksdag-regering MCP (get_interpellationer, get_dokument_innehall) | HIGH | Only 5 of 15 documents full-text retrieved |
| Prior PIR carry-forward | analysis/daily/2026-05-04/pir-status.json | HIGH | 24h-old; no updates since then |
| Parliamentary voting records | riksdag-regering MCP (search_voteringar) | HIGH | Only gang-crime adjacent votes searched |
| IMF economic context | IMF CLI (imf-fetch.ts, WEO) | HIGH | Sweden macroeconomic data retrieved; specific infrastructure cost data not available via IMF |
| International comparators | Analyst knowledge + structured templates | MEDIUM | Not verified via real-time web retrieval |
| Media context | Interpellation text (references to Aftonbladet) | LOW | Original article not retrieved; interpellation paraphrase used |

---

## Analytical Choices

**Choice 1: Lead story selection**
Two documents scored identically at composite 0.81 (HD10463, HD10458). The article leads with HD10463 (Ostlänken) as *the* framing story because:
- It affects a tangible, visual infrastructure asset that can be photographed/mapped
- It creates an unambiguous, geographically bounded accountability question
- Gang crime stories have been covered frequently; Ostlänken is fresher angle
- Eva Lindh's interpellation is structurally tighter (four specific questions) than Teresa Carvalho's (two questions)

Alternative choice would be co-equal leads or HD10458 first — both are defensible.

**Choice 2: PIR-4 (SFV) deprioritisation**
HD10460 (cultural heritage/SFV) is PIR-4 but received only metadata retrieval (no full text). Assessment: HD10460 is less time-sensitive than the other four and its political significance is lower. PIR-4 carry-forward is preserved but not as a featured story in this cycle. Will be reviewed at next available full-text retrieval.

**Choice 3: International comparators selected**
Netherlands, UK, Denmark, Germany selected for gang crime and infrastructure comparators because they are: (a) peer Nordic/European democracies, (b) have documented comparable cases, (c) are likely to resonate with Swedish readers. EU/Eastern European comparators (Hungary, Poland) used only for agency-governance analysis where the contrast is analytically important.

---

## Confidence Calibration

**Over-confidence risks**:
- The "broken promise" narrative for HD10458 and HD10463 is analytically compelling but there is a risk of confirmation bias — we may be underweighting scenarios where ministerial answers are more sophisticated than expected.
- The electoral impact (WEP) scores assume that the 2026 Swedish election campaign will unfold in a relatively conventional way. A significant external shock (economic, security, foreign policy) could completely reshape which issues matter.

**Under-confidence risks**:
- The EU TEN-T dimension of HD10463 is potentially larger than assessed. If EU co-financing is at risk, the story escalates from a national infrastructure story to an EU-Sweden relations story.
- The NATO/defence dimension of HD10461 is potentially larger than the interpellation framing suggests.

---

## Improvement Pass Observations

**Pass 2 improvements made**:
1. Added EU TEN-T dimension to Ostlänken analysis (absent from Pass 1)
2. Added NATO dimension to ESA analysis (absent from Pass 1)
3. Strengthened PIR carry-forward integration across artifacts (PIR-1, -2, -3, -4 now consistently referenced)
4. Added stakeholder cluster for "Swedish police and criminal justice system" — previously missing from stakeholder analysis
5. Added the "SD differentiation strategy" dimension to cross-reference map
6. Strengthened devils-advocate on agency activism with more substantive "SD has a legitimate point" case

**Remaining gaps after Pass 2**:
- Original Aftonbladet article text not retrieved (blocked by newspaper paywall / not available via current MCP toolset)
- Brå crime statistics Q1 2026 not available via current toolset
- EU TEN-T project database not queried (not in current allowed network list)

Overall quality assessment: PUBLICATION-READY. The analysis meets the depth standard for a `deep` analysis with 5 primary source documents.
