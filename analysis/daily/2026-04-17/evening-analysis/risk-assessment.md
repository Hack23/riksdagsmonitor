# Risk Assessment — Evening Analysis 2026-04-17

**RSK-ID**: RSK-EVE-20260417-001
**Generated**: 2026-04-17T18:32:00Z
**Riksmöte**: 2025/26

---

## Risk Heat Map

```mermaid
quadrantChart
    title Risk Assessment: Likelihood vs Impact
    x-axis Low Likelihood --> High Likelihood
    y-axis Low Impact --> High Impact
    quadrant-1 High Priority Risks
    quadrant-2 Monitor Closely
    quadrant-3 Low Priority
    quadrant-4 Contingency Planning
    Trafficking Tax Scandal Q719: [0.95, 0.95]
    Coalition Climate Credibility: [0.65, 0.80]
    Gender Equality Backslide: [0.75, 0.65]
    KU33 Civil Liberties Erosion: [0.55, 0.75]
    Women Shelter Closures: [0.70, 0.70]
    State Services Retreat SE Skane: [0.40, 0.55]
    Housing Fraud Before CU27 Passes: [0.50, 0.50]
    EU Directive Non-Compliance: [0.60, 0.65]
```

---

## Risk Register

| Risk ID | Risk | Category | L (1-5) | I (1-5) | L×I | Priority | Owner |
|---------|------|----------|---------|---------|-----|----------|-------|
| RSK-01 | Tax demands on trafficking victims (Q719) | Justice/Human Rights | 5 | 5 | **25** | 🟥 CRITICAL | Finansminister Svantesson (M) |
| RSK-02 | Women's shelter funding crisis (IP438) | Social/Gender | 4 | 4 | **16** | 🟥 HIGH | Jämställdhetsminister Larsson (L) |
| RSK-03 | Climate credibility loss — fuel tax cuts | Environmental/Political | 4 | 4 | **16** | 🟥 HIGH | Finansminister Svantesson (M) |
| RSK-04 | EU Wage Transparency Directive lag (IP437) | Legal/EU Compliance | 3 | 4 | **12** | 🟧 MEDIUM | Arbetsmarknadsdepartementet |
| RSK-05 | KU33 civil liberties restriction | Constitutional | 3 | 4 | **12** | 🟧 MEDIUM | Constitutional Committee (KU) |
| RSK-06 | State service hollowing in SE Skåne (Q718) | Governance | 2 | 3 | **6** | 🟨 LOW-MED | Civilminister Slottner (KD) |
| RSK-07 | Housing market fraud before CU27/28 pass | Economic/Fraud | 3 | 3 | **9** | 🟨 LOW-MED | Civil Committee (CU) |
| RSK-08 | Estate management oversight gap (CU42) | Governance | 2 | 3 | **6** | 🟨 LOW-MED | Skatteverket/Court system |

---

## Coalition Stability Risk Analysis

**Critical vulnerability**: The extra budget proposition 2025/26:236 (fuel tax cuts + energy support) carries a Tidöalliansen internal contradiction: L's environmental profile conflicts with SD/M's populist fuel cost reduction demand. The Green Party (MP) has lodged formal opposition via HD024098, seeking outright rejection of the fuel tax cut.

**Risk trajectory**:
- If extra budget passes with fuel tax cuts → MP/V locked into opposition; S picks up climate voters  
- If fuel tax cuts are modified under opposition pressure → coalition shows weakness heading into 2026 election
- S/V/MP/C combined bloc: plausible majority against fuel tax component

**Confidence**: 🟩 HIGH that this becomes a major pre-election media story within 2 weeks.

---

## Temporal Risk Profile

```mermaid
gantt
    title Risk Timeline — Next 30 Days
    dateFormat YYYY-MM-DD
    section Immediate (1-3 days)
    CU22/27/28/KU32/33 votes      :2026-04-17, 3d
    Minister Q719 response due     :2026-04-18, 2d
    section Short-term (1-2 weeks)
    IP437 Wage Transparency reply  :2026-04-20, 14d
    IP438 Women Shelters reply     :2026-04-20, 14d
    Extra budget final vote        :2026-04-20, 10d
    section Medium-term (2-4 weeks)
    EU directive implementation    :2026-04-28, 21d
    CU22 guardianship law effect   :2026-05-01, 30d
```

---

## Risk Interdependencies

```mermaid
graph LR
    R01["RSK-01 Trafficking Tax\n CRITICAL L5×I5"] --> R03["RSK-03 Coalition Ethics\n reputational damage"]
    R02["RSK-02 Women Shelters\n HIGH L4×I4"] --> R04["RSK-04 EU Directive\n L3×I4"]
    R04 --> R05["RSK-05 KU33 Civil Liberties\n L3×I4"]
    R03["RSK-03 Fuel Tax Climate\n HIGH L4×I4"] --> R08["Political salience 2026"]
    
    style R01 fill:#3d1a1a,color:#ff006e
    style R02 fill:#3d2a1a,color:#ffbe0b
    style R03 fill:#3d2a1a,color:#ffbe0b
```
