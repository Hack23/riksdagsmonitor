<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🏷️ Political Event Classification Template</h1>

<p align="center">
  <strong>📊 Structured Classification for Swedish Parliamentary Events</strong><br>
  <em>🎯 Sensitivity · Urgency · Impact · Policy Domain</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--26-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-26 (UTC)  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

> **📌 Template Instructions:** Copy this file to `analysis/daily/YYYY-MM-DD/` and rename to `YYYY-MM-DD-{event-slug}-classification.md`. Replace all `[REQUIRED]` and `[OPTIONAL]` placeholders with actual values. Delete instruction blocks before saving.

---

## 📋 Document Metadata

| Field | Value |
|-------|-------|
| **Classification ID** | `[REQUIRED: CLS-YYYY-MM-DD-NNN]` |
| **Document Type** | Political Event Classification |
| **Event Date** | `[REQUIRED: YYYY-MM-DD]` |
| **Classification Date** | `[REQUIRED: YYYY-MM-DD HH:MM UTC]` |
| **Primary Source dok_id** | `[REQUIRED: Riksdag document ID, e.g. H9012345]` |
| **Secondary Source(s)** | `[OPTIONAL: Additional dok_ids, comma-separated]` |
| **Classified By** | `[REQUIRED: workflow name, e.g. news-article-generator]` |
| **Reviewed By** | `[OPTIONAL: human reviewer or 'automated']` |

---

## 🏷️ Classification Dimensions

### 1. Sensitivity Level

Select exactly **one** sensitivity level. See [methodologies/political-classification-guide.md](../methodologies/political-classification-guide.md) for criteria.

- [ ] 🟢 **PUBLIC** — Routine parliamentary activity; freely publishable
- [ ] 🟡 **SENSITIVE** — Politically charged; requires careful framing and attribution
- [ ] 🔴 **RESTRICTED** — High-impact or legally sensitive; requires editorial review before publication

**Sensitivity Rationale:** `[REQUIRED: 1–2 sentences explaining the classification decision]`

---

### 2. Policy Domain

Select the **primary** domain and up to two **secondary** domains:

**Primary Domain:** `[REQUIRED: select one]`

| Code | Domain | Swedish Term |
|------|--------|--------------|
| `ECO` | Economics & Finance | Ekonomi och finans |
| `DEF` | Defence & Security | Försvar och säkerhet |
| `JUS` | Justice & Law | Rättsväsende |
| `SOC` | Social Policy & Welfare | Socialpolitik |
| `HEA` | Health & Medical | Hälso- och sjukvård |
| `EDU` | Education & Research | Utbildning och forskning |
| `ENV` | Environment & Climate | Miljö och klimat |
| `AGR` | Agriculture & Food | Jordbruk och livsmedel |
| `INF` | Infrastructure & Transport | Infrastruktur |
| `ENE` | Energy | Energi |
| `FOR` | Foreign Affairs & Trade | Utrikespolitik |
| `MIG` | Migration & Integration | Migration |
| `CON` | Constitution & Democracy | Konstitution och demokrati |

**Secondary Domain(s):** `[OPTIONAL: up to two additional codes]`

---

### 3. Urgency Level

Select exactly **one** urgency level based on legislative calendar and real-world impact:

- [ ] ⚪ **ROUTINE** — Standard legislative process; no time-sensitive dimension
- [ ] 🔵 **ELEVATED** — Active committee review or imminent vote within 2 weeks
- [ ] 🟠 **URGENT** — Vote scheduled within 48 hours or immediate government response required
- [ ] 🔴 **CRITICAL** — Constitutional crisis, no-confidence motion, emergency legislation, or acute national security event

**Urgency Rationale:** `[REQUIRED: 1–2 sentences]`

**Legislative Calendar Reference:** `[OPTIONAL: Next scheduled vote/committee date YYYY-MM-DD]`

---

### 4. Impact Scope

Select the **broadest applicable** scope:

- [ ] 🏘️ **LOCAL** — Affects specific municipality/region only
- [ ] 🇸🇪 **NATIONAL** — Affects all Swedish citizens or national institutions
- [ ] 🇪🇺 **EU** — Triggers EU regulatory or treaty dimensions
- [ ] 🌍 **INTERNATIONAL** — Affects bilateral/multilateral relations beyond EU

**Impact Scope Rationale:** `[REQUIRED: 1 sentence]`

---

## 📊 Impact Analysis Matrix

Score likelihood and impact on 1–5 scale. Risk Score = Likelihood × Impact.

```
Impact Scale:    1=Negligible  2=Minor  3=Moderate  4=Major  5=Severe
Likelihood Scale: 1=Rare       2=Unlikely 3=Possible 4=Likely 5=Almost Certain
```

| Dimension | Likelihood (1–5) | Impact (1–5) | Risk Score | Notes |
|-----------|-----------------|--------------|------------|-------|
| **Democratic Process** | `[#]` | `[#]` | `[L×I]` | `[OPTIONAL]` |
| **Economic Impact** | `[#]` | `[#]` | `[L×I]` | `[OPTIONAL]` |
| **Social Cohesion** | `[#]` | `[#]` | `[L×I]` | `[OPTIONAL]` |
| **Coalition Stability** | `[#]` | `[#]` | `[L×I]` | `[OPTIONAL]` |
| **International Relations** | `[#]` | `[#]` | `[L×I]` | `[OPTIONAL]` |

**Composite Risk Score:** `[REQUIRED: max of the above scores]`

```mermaid
quadrantChart
    title Impact Analysis Matrix
    x-axis Low Likelihood --> High Likelihood
    y-axis Low Impact --> High Impact
    quadrant-1 Monitor Closely
    quadrant-2 Immediate Action
    quadrant-3 Low Priority
    quadrant-4 Watch
    "[Event Name]": [0.X, 0.X]
```
> *Replace `[Event Name]` and coordinates `[0.X, 0.X]` with actual values (scale: 0.0–1.0 mapped from 1–5).*

---

## 🔖 Cross-Reference Tags

```
Primary Actors:   [REQUIRED: comma-separated list of political actors, e.g. "S, M, Tidökoalitionen"]
Committee:        [OPTIONAL: e.g. "FiU" (Finansutskottet), "JuU", "UU"]
Riksmöte:         [REQUIRED: e.g. "2025/26"]
Related dok_ids:  [OPTIONAL: comma-separated]
Related Events:   [OPTIONAL: CLS-IDs of related classifications]
Significance Score: [REQUIRED: see significance-scoring.md, 0–10 composite]
```

---

## 📝 Classification Rationale

### Summary of Event
`[REQUIRED: 2–4 sentences describing what happened, who the key actors are, and the immediate political context. Be specific — cite document IDs, committee names, and politician names.]`

### Classification Justification
`[REQUIRED: Explain why each classification dimension was assigned its value. Reference specific evidence from the source document.]`

### Confidence Assessment
- **Source Quality:** `[HIGH / MEDIUM / LOW]` — `[reason]`
- **Information Completeness:** `[HIGH / MEDIUM / LOW]` — `[reason]`
- **Overall Confidence:** `[HIGH / MEDIUM / LOW]`

### Recommended Action
- [ ] 📰 **Publish** — Include in next news cycle (significance ≥ 6)
- [ ] ⚡ **Breaking** — Publish immediately (significance ≥ 8 + URGENT/CRITICAL)
- [ ] 📋 **Monitor** — Track for follow-up; do not publish standalone
- [ ] 🗄️ **Archive** — Low significance; archive for trend analysis only

---

**Document Control:**  
- **Template Path:** `/analysis/templates/political-classification.md`  
- **Classification:** Public  
- **Next Review:** 2026-06-26
