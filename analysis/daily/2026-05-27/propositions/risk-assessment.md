<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# ⚠️ Risk Assessment — Propositions 2026-05-27

**Run:** propositions-run01 | **Date:** 2026-05-27 | **Confidence floor:** B2

---

## Risk Register

### HD03271 — En förändrad abortlag

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0a0e27', 'primaryTextColor': '#00d9ff', 'primaryBorderColor': '#00d9ff', 'lineColor': '#ff006e', 'secondaryColor': '#1a1e3d', 'tertiaryColor': '#0a0e27', 'background': '#0a0e27', 'mainBkg': '#1a1e3d', 'nodeBorder': '#00d9ff', 'clusterBkg': '#1a1e3d', 'titleColor': '#ffbe0b', 'edgeLabelBackground': '#1a1e3d'}}}%%
quadrantChart
    title Risk Matrix — HD03271 Abortion Law Reform
    x-axis Low Probability --> High Probability
    y-axis Low Impact --> High Impact
    quadrant-1 Critical (Mitigate)
    quadrant-2 Escalate (Plan)
    quadrant-3 Accept (Monitor)
    quadrant-4 Watch (Respond)
    SD values opposition: [0.15, 0.85]
    Values mobilisation against reform: [0.4, 0.6]
    IVO implementation delays: [0.35, 0.4]
    KD internal dissent public: [0.25, 0.5]
    Coalition fracture on values: [0.1, 0.9]
    Medication dispensing incidents: [0.2, 0.35]
```

| Risk ID | Risk | Probability | Impact | Severity | Owner | Mitigation |
|---------|------|-------------|--------|----------|-------|------------|
| R-271-1 | SD votes against on values grounds | LOW 15% | HIGH | 6/10 | Government coalition managers | Cross-party majority available (S+V+MP+L covers loss of SD) |
| R-271-2 | Values mobilisation (demonstrations, campaigns) | MEDIUM 40% | MEDIUM | 5/10 | Communications | Clear framing: modernisation not liberalisation |
| R-271-3 | IVO approval backlog for existing facilities | MEDIUM 35% | MEDIUM | 4/10 | IVO/Socialdepartementet | Transition clause in §9 |
| R-271-4 | KD internal dissent becomes public | LOW-MEDIUM 25% | MEDIUM | 4/10 | KD party leadership | Forssmed-Busch unified messaging |
| R-271-5 | Coalition fracture triggering early election | LOW 10% | CRITICAL | 6/10 | Tidö coalition | Unlikely given April 2026 budget agreement |
| R-271-6 | Medication dispensing safety incident | LOW 20% | MEDIUM | 3/10 | IVO | Quality assurance requirements |

**Evidence anchors:**
| Claim | Evidence | Retrieved | Confidence |
|-------|----------|-----------|------------|
| SD coalition arithmetic | Seat distribution: SD 62/349 | Riksdag.se seat data | A1 |
| IVO transition clause | HD03271 §9 | 2026-05-27T06:59Z | A2 |
| Cross-party majority without SD | S(107)+V(24)+MP(24)+L(16) = 171; M(68)+KD(19)+C(16) = 103; total majority available | Seat data | A1 |

---

### HD03270 — EU Chemicals/Waste

| Risk ID | Risk | Probability | Impact | Severity | Mitigation |
|---------|------|-------------|--------|----------|------------|
| R-270-1 | EU infringement if delayed | LOW 15% | HIGH | 4/10 | On-track legislative timeline |
| R-270-2 | Business compliance cost overrun | MEDIUM 30% | LOW | 2/10 | Konsekvensutredning §9 |
| R-270-3 | Packaging exemptions challenged | LOW 20% | LOW | 1/10 | Government majority |

---

## Aggregate Risk Score

| Portfolio | Score | Key risk |
|-----------|-------|----------|
| HD03271 | 6/10 | SD values flip (low prob, high impact) |
| HD03270 | 2/10 | EU deadline (low prob, manageable) |
| **Combined batch** | 4.5/10 | Abortion reform values politics |

---

## 🔄 Pass 2 Self-Audit

- ✅ Risk register with probability/impact/severity for both documents
- ✅ Evidence anchors for coalition arithmetic claims
- ✅ Mermaid risk matrix with colour theming
- ✅ Mitigation strategies named
- ✅ No banned phrases
