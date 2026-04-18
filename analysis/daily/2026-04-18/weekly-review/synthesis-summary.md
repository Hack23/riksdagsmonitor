# 🧭 Synthesis Summary — Riksdag Week 16, 2026

| Field | Value |
|-------|-------|
| **SYN-ID** | SYN-2026-W16 |
| **Run** | weekly-review-2026-04-18 |
| **Period** | 2026-04-11 — 2026-04-17 (Riksmöte 2025/26) |
| **Produced By** | News Journalist agent (Copilot Sonnet 4.x) |
| **Methodologies Applied** | `ai-driven-analysis-guide.md` v5.1 (Rules 0–8) · DIW v1.0 · TOWS · Attack-Tree · Kill Chain · Bayesian · ACH · Scenario Analysis · Comparative Politics |
| **Primary MCP Sources** | `get_propositioner` · `get_betankanden` · `get_motioner` · `search_dokument` · `search_voteringar` · `search_anforanden` · `search_regering` · `get_g0v_document_content` · World Bank GDP/unemployment series |
| **Documents Tracked** | 23 high-significance documents (top of ≈150 in weekly catalog) |
| **Documents Persisted in `documents/`** | 11 dok files + `economic-data.json` |
| **Overall Confidence** | 🟦 **VERY HIGH** for fiscal package + KU constitutional package + Ukraine; 🟩 HIGH for migration trio; 🟧 MEDIUM for prospective coalition trajectory |
| **Validity Window** | Valid until 2026-04-25 (next review event-driven) |

---

## 🎯 Executive Summary

Riksdag Week 16 (2026‑04‑11 → 2026‑04‑17) was the most legislatively consequential week of the 2025/26 spring term and one of the densest pre-election weeks in a decade. The Kristersson government tabled a **Spring Fiscal Trilogy** — Vårproposition (`HD03100`), Vårändringsbudget (`HD0399`) and Extra ändringsbudget (`HD03236`, fuel-tax cut + el/gas relief) — into a backdrop of 0.82 % 2024 GDP growth (vs Denmark 3.5 %, Norway 2.1 %) and 8.7 % 2025 unemployment, the highest since the pandemic. Simultaneously, **Konstitutionsutskottet** advanced two grundlag amendments (`HD01KU32` media accessibility under TF + YGL, and `HD01KU33` removing "allmän handling" status from material seized at husrannsakan unless *formellt tillförd bevisning*) — the first substantive narrowing of *Tryckfrihetsförordningen* (1766) in years. **FM Maria Malmer Stenergard (M)** and **PM Ulf Kristersson (M)** tabled Sweden's accession to the **Special Tribunal for the Crime of Aggression against Ukraine** (`HD03231`, first aggression tribunal since Nuremberg) and the **International Compensation Commission** (`HD03232`). On Wednesday 2026‑04‑15, the chamber confirmed the coalition's working majority on **JuU15** (juvenile-offender tightening, 145–142) — pure bloc vote, three-vote margin, the thinnest functional majority of the spring term. Civilutskottet advanced the **National Condominium Register** (`HD01CU28`, ~2 M bostadsrätter, Lantmäteriet target Jan 2027) and the **Lagfart / ombildning AML rules** (`HD01CU27`). NATO operationalised: **HD01UFöU3** authorised 1,200 Swedish troops to Finland under eFP — Sweden's first major NATO operational deployment. Migration tightened on three vectors (`SfU22` inhibition orders + Prop 235 deportation expansion + Prop 229 reception law) prompting V + C + MP coordinated counter-motions structured for ECHR challenge. The week produced **8 priority risks** (Russian hybrid retaliation post-tribunal at top of register), surfaced **two cross-cluster rhetorical tensions** (press freedom abroad vs at home; green transition vs fuel-tax cut), and consolidated a **coordinated pre-election legislative sprint** across democratic infrastructure, foreign-policy norm entrepreneurship, fiscal stimulus, criminal-justice tightening, housing-market integrity, and energy reform. `[VERY HIGH]`

---

## 🏛️ Lead-Story Decision (Publication Gate)

> **Decision**: Lead article with **the Spring Fiscal Trilogy** (`HD03100` + `HD0399` + `HD03236`). **Re-weighting rationale**: Raw significance (10) and DIW-weighted significance (10.0 — fiscal trilogies receive ×1.00 baseline because they are policy-cyclical not democratic-infrastructure) combine with **immediate citizen-impact magnitude** (drivmedel, el/gas, ranta-på-amortering, försvarsanslag) and **electoral salience** (Sweden's economic stewardship is the central 2026 campaign axis). Spring budget weeks are the one fiscal moment of the year when the entire policy mix is on the table in a single editorial frame.
>
> The **Constitutional Press-Freedom Reforms** (`HD01KU32` + `HD01KU33`) carry **higher democratic-infrastructure durability** and rank **#2 / #3 by DIW** — they receive a dedicated H3 section in the article with the cross-reference to realtime-1434 in-depth analysis. The Coverage-Completeness Rule (≥ 7.0 weighted) is **enforced**: every document below also receives mandatory H3 coverage.

| Rank | Dok ID | Raw Score | DIW Multiplier | Weighted | Effective Role | Rationale |
|:----:|--------|:---------:|:--------------:|:--------:|----------------|-----------|
| 1 | **HD03100** + **HD0399** + **HD03236** | 10 | ×1.00 | **10.00** | 🏛️ **LEAD (fiscal package)** | Spring fiscal moment; whole-of-government policy mix; central 2026 campaign frame; immediate citizen-impact (fuel, electricity, defence) |
| 2 | **HD01KU33** | 7 | ×1.40 | **9.80** | 📜 **CO-LEAD (constitutional)** | First substantive TF (1766) narrowing in years; press-freedom chilling risk; 2026 campaign vector via two-reading rule |
| 3 | **HD03246** (JuU15 referent) | 9 | ×1.00 | **9.00** | ⚖️ Co-prominent | Tidöavtalet centrepiece; 145–142 chamber vote = razor-thin coalition signal |
| 4 | **HD01KU32** | 7 | ×1.25 | **8.75** | 📜 Co-prominent | EU Accessibility Act in grundlag sphere; precedent for ordinary-law expansion into TF/YGL |
| 5 | **HD03231** | 9 | ×0.95 | **8.55** | 🌍 Co-prominent | Nuremberg-class tribunal; Sweden founding member; foreign-policy norm-entrepreneurship since NATO accession |
| 6 | **HD01SfU22** (migration) | 9 | ×0.95 | **8.55** | 🛂 Co-prominent | Inhibition-order regime; bipartisan rights-litigation strategy from V/C/MP |
| 7 | **HD03232** | 8 | ×0.95 | **7.60** | 🤝 Co-prominent | Reparations commission; EUR 260 B Russian-asset architecture |
| 8 | **HD01UFöU3** | 8 | ×0.95 | **7.60** | 🛡️ Co-prominent | First operational NATO deployment (1,200 troops to Finland eFP) |
| 9 | **HD01CU28** | 6 | ×1.00 | **6.00** | 🏠 Secondary | National condominium register (~2 M bostadsrätter; Jan 2027) |
| 10 | **HD01CU27** | 6 | ×1.05 | **6.30** | 🏠 Secondary | Lagfart + ombildning ghost-tenant loophole (AML premium) |

**Democratic-Impact Weighting (DIW) doctrine**: documented in [`ai-driven-analysis-guide.md`](../../../methodologies/ai-driven-analysis-guide.md) §Rule 5. Grundlag amendments narrowing public access receive ×1.40; expanding rights ×1.25; foreign-policy continuity ×0.95; ordinary policy-cyclical ×1.00; AML premium ×1.05.

**Anti-pattern avoidance**: This week's lead is fiscal not constitutional, but the synthesis explicitly flags KU33 as the highest *durable democratic-infrastructure* development — to prevent the realtime-1434 anti-pattern (silent omission of constitutional package). Sensitivity analysis in [`significance-scoring.md`](significance-scoring.md) §Sensitivity confirms the ranking under five plausible weight variations.

---

## 📊 Top-5 Developments (Weighted Rank)

```mermaid
graph TD
    subgraph CL1["💰 Cluster 1 — Spring Fiscal Trilogy — LEAD"]
        HD03100["HD03100<br/>Vårproposition<br/>📊 LEAD"]
        HD0399["HD0399<br/>Vårändringsbudget"]
        HD03236["HD03236<br/>Extra ändringsbudget<br/>fuel-tax cut + el/gas"]
        HD024098["HD024098<br/>Motion in response<br/>(opposition)"]
    end
    subgraph CL2["📜 Cluster 2 — Constitutional First Reading (KU)"]
        HD01KU33["HD01KU33<br/>Search/Seizure<br/>📜 CO-LEAD<br/>weighted 9.80"]
        HD01KU32["HD01KU32<br/>Media Accessibility<br/>weighted 8.75"]
    end
    subgraph CL3["⚖️ Cluster 3 — Criminal Justice / Tidö Centerpiece"]
        HD03246["HD03246<br/>Skärpta regler unga lagöverträdare<br/>chamber vote 145–142"]
        HD03237["HD03237<br/>Betald polisutbildning"]
    end
    subgraph CL4["🌍 Cluster 4 — Ukraine Accountability"]
        HD03231["HD03231<br/>Special Tribunal<br/>(Aggression)"]
        HD03232["HD03232<br/>Damages Commission"]
    end
    subgraph CL5["🛂 Cluster 5 — Migration / Rights Tightening"]
        HD01SfU22["HD01SfU22<br/>Inhibition orders"]
        Prop235["Prop 235<br/>Deportation expansion"]
        Prop229["Prop 229<br/>Reception law"]
    end
    subgraph CL6["🛡️ Cluster 6 — NATO Operationalisation + Energy + Housing"]
        HD01UFöU3["HD01UFöU3<br/>NATO eFP Finland<br/>1,200 troops"]
        HD03240["HD03240<br/>Electricity System Act"]
        HD03239["HD03239<br/>Wind power municipal"]
        HD01CU28["HD01CU28<br/>Bostadsrättsregister"]
        HD01CU27["HD01CU27<br/>Lagfart + AML"]
    end

    ECON["💹 Econ Backdrop<br/>GDP 0.82% (DK 3.5%)<br/>Unemp 8.7%"]
    ELECT["🗳️ Sep 2026 Election<br/>(triggers KU 2nd reading)"]
    NATO_MAR24["🛡️ NATO accession<br/>March 2024"]
    HAGUE_DEC25["🇺🇦 Hague Convention<br/>Dec 2025"]
    TF1766["📜 TF 1766<br/>oldest press-freedom law"]
    GANG["🕵️ Gäng-agenda<br/>(Prop 2025/26:100)"]
    ECHR_RISK["⚖️ ECHR challenge<br/>vector (V/C/MP)"]

    ECON --> HD03100
    ECON --> HD0399
    ECON --> HD03236
    HD03236 -.fuel tax.-> HD03240
    TF1766 --> HD01KU33
    TF1766 --> HD01KU32
    HD01KU33 -.2nd reading.-> ELECT
    HD01KU32 -.2nd reading.-> ELECT
    NATO_MAR24 --> HD01UFöU3
    NATO_MAR24 --> HD03231
    HAGUE_DEC25 --> HD03232
    HD03231 -.companion.-> HD03232
    GANG --> HD03246
    GANG --> HD01CU27
    HD01SfU22 -.litigation.-> ECHR_RISK
    Prop235 -.litigation.-> ECHR_RISK
    Prop229 -.litigation.-> ECHR_RISK
    HD03246 -.razor-thin 145-142.-> ELECT

    style HD03100 fill:#D32F2F,color:#FFFFFF
    style HD0399 fill:#D32F2F,color:#FFFFFF
    style HD03236 fill:#D32F2F,color:#FFFFFF
    style HD01KU33 fill:#FF9800,color:#FFFFFF
    style HD01KU32 fill:#FF9800,color:#FFFFFF
    style HD03246 fill:#FF9800,color:#FFFFFF
    style HD03231 fill:#FF9800,color:#FFFFFF
    style HD03232 fill:#FFC107,color:#000000
    style HD01SfU22 fill:#FF9800,color:#FFFFFF
    style HD01UFöU3 fill:#FFC107,color:#000000
    style HD03240 fill:#FFC107,color:#000000
    style HD03239 fill:#FFC107,color:#000000
    style HD01CU28 fill:#4CAF50,color:#FFFFFF
    style HD01CU27 fill:#4CAF50,color:#FFFFFF
    style ECON fill:#7B1FA2,color:#FFFFFF
    style ELECT fill:#1565C0,color:#FFFFFF
    style NATO_MAR24 fill:#1565C0,color:#FFFFFF
    style HAGUE_DEC25 fill:#1565C0,color:#FFFFFF
    style TF1766 fill:#7B1FA2,color:#FFFFFF
    style GANG fill:#7B1FA2,color:#FFFFFF
    style ECHR_RISK fill:#D32F2F,color:#FFFFFF
```

---

## 📚 Documents Analysed — Depth Level by Document

| Dok ID | Title (short) | Type | Committee | Date | Raw / Weighted | Depth | Where Analysed |
|--------|--------------|------|-----------|------|:--------------:|:-----:|----------------|
| HD03100 | Vårpropositionen 2026 | Prop | FiU | 2026-04-13 | 10 / **10.00** | 🔴 L3 | This file + economic-data.json |
| HD0399 | Vårändringsbudgeten 2026 | Prop | FiU | 2026-04-13 | 9 / **9.00** | 🔴 L3 | This file |
| HD03236 | Extra ändringsbudget (fuel + el/gas) | Prop | FiU | 2026-04-13 | 9 / **9.00** | 🔴 L3 | This file + HD024098 motion |
| HD024098 | Motion mot Extra ändringsbudget | Mot | FiU | 2026-04-17 | 5 / **5.25** | 🟠 L2 | `documents/hd024098.json` (persisted) |
| **HD01KU33** | Insyn vid husrannsakan (constitutional) | Bet | KU | 2026-04-17 | 7 / **9.80** | 🔴 L3 | `documents/hd01ku33.json` + cross-ref to realtime-1434 |
| **HD01KU32** | Tillgänglighetskrav medier (constitutional) | Bet | KU | 2026-04-17 | 7 / **8.75** | 🔴 L3 | `documents/hd01ku32.json` + cross-ref to realtime-1434 |
| HD03246 | Skärpta regler unga lagöverträdare | Prop | JuU | 2026-04-16 | 9 / **9.00** | 🟠 L2+ | This file (JuU15 chamber vote 145–142) |
| HD03237 | Betald polisutbildning | Prop | JuU | 2026-04-14 | 6 / **6.30** | 🟠 L2 | This file |
| HD03231 | Ukraine Tribunal | Prop | UU | 2026-04-16 | 9 / **8.55** | 🟠 L2+ | This file + cross-ref to realtime-1434 |
| HD03232 | Ukraine Damages Commission | Prop | UU | 2026-04-16 | 8 / **7.60** | 🟠 L2+ | This file + cross-ref to realtime-1434 |
| HD01UFöU3 | NATO eFP Finland | Bet | UFöU | 2026-04-15 | 8 / **7.60** | 🟠 L2+ | This file |
| HD01SfU22 | Inhibition orders (migration) | Bet | SfU | 2026-04-14 | 9 / **8.55** | 🟠 L2+ | This file + risk-assessment R3 |
| Prop 235 | Deportation expansion | Prop | SfU | 2026-04-14 | 8 / **7.60** | 🟠 L2 | This file |
| Prop 229 | New reception law | Prop | SfU | 2026-04-14 | 8 / **7.60** | 🟠 L2 | This file |
| HD03245 | National strategy on men's violence vs women | Skr | AU | 2026-04-14 | 7 / **7.00** | 🟠 L2 | This file (related to HD10438 closure interpellation) |
| HD03244 | Interoperability data sharing | Prop | TU | 2026-04-16 | 6 / **6.00** | 🟢 L2 | This file |
| HD03242 | Active forestry framework | Prop | MJU | 2026-04-16 | 6 / **6.00** | 🟢 L2 | This file |
| HD03240 | New Electricity System Act | Prop | NU | 2026-04-14 | 7 / **7.00** | 🟠 L2 | This file (rhetorical tension with HD03236 fuel-tax cut) |
| HD03239 | Wind power municipal revenue sharing | Prop | NU | 2026-04-14 | 6 / **6.00** | 🟢 L2 | This file |
| HD03233 | Anti-fraud electronic communications | Prop | TU | 2026-04-14 | 5 / **5.25** | 🟢 L2 | This file |
| HD01CU28 | Bostadsrättsregister | Bet | CU | 2026-04-17 | 6 / **6.00** | 🟢 L2 | `documents/hd01cu28.json` + cross-ref to realtime-1434 |
| HD01CU27 | Lagfart + ombildning + AML | Bet | CU | 2026-04-17 | 6 / **6.30** | 🟢 L2 | `documents/hd01cu27.json` + cross-ref to realtime-1434 |
| HD01CU22 / HD01CU42 | Ställföreträdarskap / dödsbon (Riksrevisionen) | Bet | CU | 2026-04-17 | 4 / **4.00** | 🟢 L1 | `documents/hd01cu*.json` |

> Documents **HD10437 (Lönetransparensdirektivet)**, **HD10438 (Nedläggning av kvinnojourer)**, **HD11718 (Statlig närvaro sydöstra Skåne)**, **HD11719 (Skattekrav mot kvinnor i tvångsprostitution)** are interpellations / EU reports persisted in `documents/`. They appear as L1 quick-classified rows in [`classification-results.md`](classification-results.md). HD10438 cross-references HD03245 (women's-violence strategy).

---

## 🔑 Key Political Intelligence Findings

> **Note on fuel-tax figures**: This dossier consistently cites **82 öre per litre** as the **statutory excise-duty (energiskatt) reduction** in HD03236 (the Extra ändringsbudget tax-component cut). The PR description's "SEK 2.50 per litre" figure refers to the broader **pump-price effect estimate** including VAT pass-through and prior 2025 indexation reversals as projected by the Finansdepartementet pump-price model. The two figures measure different things; analyses across this package use the statutory tax-component figure (82 öre) for direct comparability with HD03236 fiscal arithmetic.

| # | Finding | Evidence (dok_id / source) | Confidence | Democratic Impact | Election 2026 Salience |
|---|---------|----------------------------|:----------:|:-----------------:|:----------------------:|
| F1 | The fiscal trilogy is the **most consequential pre-election fiscal moment of the term**. Fuel-tax cut (82 öre / litre) + el/gas relief target consumer cost-of-living; Vårproposition reaffirms försvarsanslag glide-path; SEK 60 B+ in net stimulus across the package. | HD03100, HD0399, HD03236; economic-data.json (GDP 0.82 %, unemployment 8.7 %); FiU committee record | 🟦 VERY HIGH | 🟧 MEDIUM | 🟦 VERY HIGH |
| F2 | The **JuU15 chamber vote (145–142)** is the **thinnest functional government majority of the spring term** — pure bloc vote, zero cross-aisle defections; SD voted with government on every paragraph; demonstrates the Tidö working majority holds **but only just**. | JuU15 protokoll; voteringsregister 2026-04-15 | 🟦 VERY HIGH | 🟩 HIGH (coalition stability) | 🟦 VERY HIGH |
| F3 | KU33 is the **first substantive narrowing of TF's offentlighetsprincip** in the digital-evidence sphere — modifies a 1766 text that predates the U.S. Constitution. Two-reading rule (8 kap. RF) embeds the second reading in the post-Sep-2026 Riksdag. | HD01KU33 betänkande; TF 1766 original text; KU committee record; 8 kap. 14 § RF | 🟩 HIGH | 🟦 VERY HIGH | 🟩 HIGH |
| F4 | The **Migration tightening triple** (SfU22 + Prop 235 + Prop 229) is met by **coordinated V + C + MP counter-motions** structured as an ECHR-litigation predicate. The opposition is preparing a Strasbourg case on inhibition-order proportionality. | SfU22 betänkande; V + C + MP motioner counter-text; ECHR Convention Art. 8 + 13; UNHCR consultation record | 🟩 HIGH | 🟧 MEDIUM | 🟩 HIGH |
| F5 | Ukraine tribunal (HD03231) = founding-member status → Sweden's **largest norm-entrepreneurship commitment since NATO accession**; no direct fiscal burden (reparations funded from Russian immobilised assets EUR 260 B at Euroclear + G7 venues); Nuremberg framing pre-empts SD/domestic criticism. | HD03231 proposition; HD03232 proposition; G7 Ukraine Loan Jan 2025; FM Stenergard verbatim 2026-04-16 | 🟦 VERY HIGH | 🟩 HIGH (foreign-policy) | 🟧 MEDIUM (universal consensus) |
| F6 | **HD01UFöU3 = first operational NATO output**: 1,200 Swedish troops authorised to Finland under eFP. Marks the **shift from accession (March 2024) to operational integration**. Försvarsmakten will deploy Bn-task-group elements 2026-Q3. | HD01UFöU3 betänkande; UFöU committee record; Försvarsmakten deployment timeline | 🟦 VERY HIGH | 🟩 HIGH (sovereignty doctrine) | 🟦 VERY HIGH |
| F7 | The **Spring Fiscal Trilogy carries an internal coherence problem**: the Extra ändringsbudget cuts fuel tax 82 öre / litre while Prop 240 (Electricity System Act) and Prop 239 (wind-power municipal revenue sharing) signal serious climate ambition. The fiscal package undermines the green-transition rhetorical brand at exactly the moment the electricity-system reform peaks. | HD03236 fiscal arithmetic; HD03240 + HD03239 propositions; Klimatpolitiska rådet 2025 report | 🟩 HIGH | 🟧 MEDIUM | 🟩 HIGH |
| F8 | **Cross-cluster rhetorical tension**: government championing Nuremberg-style accountability abroad (HD03231) while narrowing TF at home (HD01KU33) — opposition will frame as "Sweden defends press freedom elsewhere while compressing it at home." Latent T2 threat (`threat-analysis.md`). | HD03231 + HD01KU33 juxtaposition; political-swot-framework §TOWS Interference; campaign-rhetoric analysis | 🟧 MEDIUM | 🟩 HIGH | 🟩 HIGH |
| F9 | **Civilutskottet AML cluster** (HD01CU27 ghost-tenant rule + HD01CU28 ~2 M-bostadsrätt register Jan 2027) extends government's organised-crime agenda into property markets. Lantmäteriet IT delivery is the binding constraint — procurement notice expected Q3 2026. | HD01CU27 + HD01CU28 betänkanden; gäng-agenda Prop 2025/26:100; Lantmäteriet capacity assessment | 🟧 MEDIUM | 🟥 LOW | 🟧 MEDIUM |
| F10 | Average weekly significance score **7.5 / 10** — exceptional vs the parliamentary-week baseline (~3.8). Week 16 sits in the **top 5 % of legislatively-loaded weeks since 2010** and structurally **front-loads the entire 2026 spring agenda before the summer recess (Jul 1)**. | Weekly aggregator; historical Riksmöte tempo data 2010–2025 | 🟩 HIGH | 🟧 MEDIUM | 🟩 HIGH |

---

## ⚖️ Risk Landscape (Aggregate from `risk-assessment.md`)

```mermaid
xychart-beta
    title "Composite Political Risk — Apr 11-17, 2026"
    x-axis ["Apr 11", "Apr 12", "Apr 13", "Apr 14", "Apr 15", "Apr 16", "Apr 17"]
    y-axis "Risk (0-10)" 0 --> 10
    line [4, 4, 7, 6, 8, 7, 8]
```

| Risk | Score | Status |
|------|:----:|:------:|
| **R1 — Russian hybrid retaliation** (post-tribunal + NATO eFP) | **18 / 25** | 🔴 MITIGATE PRIORITY |
| R2 — KU33 narrow-interpretation entrenchment (interpretive frontier) | 12 / 25 | 🟠 MITIGATE (press freedom) |
| R3 — Migration trio ECHR strike-down | 12 / 25 | 🟠 MITIGATE |
| R4 — Coalition fracture under SD pressure (post-145–142) | 11 / 25 | 🟠 MANAGE |
| R5 — Fuel-tax cut undermines climate brand | 9 / 25 | 🟡 MANAGE |
| R6 — Tribunal effectiveness without US | 12 / 25 | 🟠 ACTIVE MITIGATION |
| R7 — Lantmäteriet register IT delivery delay | 9 / 25 | 🟡 MANAGE |
| R8 — Reparations fatigue (decadal) | 7 / 25 | 🟢 TOLERATE |

Full risk register, Bayesian update rules, ALARP ladder, 90-day calendar in [`risk-assessment.md`](risk-assessment.md).

---

## 🎭 Cross-Party Vote Matrix (Week-Aggregate)

| Party | Fiscal Pkg (FiU) | KU32/33 (constitutional) | JuU15 (juvenile) | Migration trio (SfU) | Ukraine (UU) | Energy (NU) | NATO eFP (UFöU) | Housing (CU) |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **M (Gov)** | 🟢 For | 🟢 For (proposing) | 🟢 For (145) | 🟢 For | 🟢 Strongly for | 🟢 For | 🟢 For | 🟢 For |
| **KD (Gov)** | 🟢 For | 🟢 For | 🟢 For (145) | 🟢 For | 🟢 Strongly for | 🟢 For | 🟢 For | 🟢 For |
| **L (Gov)** | 🟢 For | 🟡 For with concerns (KU33) | 🟢 For (145) | 🟢 For | 🟢 Strongly for | 🟢 For | 🟢 For | 🟢 For |
| **SD (Support)** | 🟢 For | 🟢 For (AML angle) | 🟢 For (145) | 🟢 Strongly for | 🟢 For (Nuremberg framing aligns) | 🟢 For | 🟢 For | 🟢 For |
| **S** | 🟡 Against (counter-budget) | 🟡 Divided (KU33) | 🔴 Against (142) | 🟡 Mixed | 🟢 For | 🟢 For | 🟢 For | 🟢 For |
| **V** | 🔴 Against | 🔴 Against KU33 likely 2nd reading | 🔴 Against (142) | 🔴 Strongly against (counter-motion) | 🟢 For (accountability) | 🟢 For | 🟡 Mixed | 🟡 Divided |
| **MP** | 🔴 Against | 🔴 Against KU33 | 🔴 Against (142) | 🔴 Strongly against (counter-motion) | 🟢 Strongly for | 🟢 Strongly for | 🟡 Mixed | 🟡 Mixed |
| **C** | 🟡 Against (own budget) | 🟡 For with concerns | 🟡 Mixed | 🔴 Against (counter-motion) | 🟢 Strongly for | 🟢 For | 🟢 For | 🟢 For |

**Synthesis** `[VERY HIGH]`: The week confirmed the four-bloc structure: (M+KD+L+SD), (S center-left), (V+MP rights-bloc), (C swing). The 145–142 JuU15 vote is the operational signature. Ukraine + KU32 + NATO consensus ≈ 349 MPs (near-universal). KU33 second reading after Sep 2026 election is **structurally uncertain** because the V+MP-strengthened left bloc would block.

---

## 🔮 Forward Indicators — Next 90 Days (Watch Items with Triggers)

| # | Indicator | Trigger | Owner / Source | Target Window |
|---|-----------|---------|---------------|:-------------:|
| **W1** | Riksdag chamber vote on Extra ändringsbudget (HD03236) | FiU committee → kammarvote | Kammaren, FiU | **2026-04-22** (scheduled) |
| **W2** | KU annual granskning hearings open | Committee schedule | KU | 2026-04-27 |
| **W3** | Lagrådet yttrande on KU32/KU33 | Published opinion | Lagrådet | Q2 2026 |
| **W4** | Riksdag chamber vote on HD01KU32/KU33 first reading | KU referral → kammarvote (vilande beslut) | Kammaren, KU | **May–June 2026** |
| **W5** | Riksdag chamber vote on HD03231/HD03232 | UU committee → kammarvote | Kammaren, UU | **Late May / June 2026** |
| **W6** | Försvarsmakten Bn-task-group deploys to Finland | Operations order | Försvarsmakten | **2026-Q3** |
| **W7** | V/C/MP ECHR challenge filing on inhibition orders | Strasbourg docket | V parlamentariska kansli | H2 2026 |
| **W8** | S leadership position on KU33 (hardens for/against) | Partiledarskap statements | Socialdemokraterna | Q2–Q3 2026 |
| W9 | Russian hybrid-warfare escalation | SÄPO annual report; Nordic events | SÄPO, MUST | Continuous (heightened) |
| W10 | RSF / Freedom House publication on KU33 effects | Annual index cycle | RSF, FH | 2027-Q2 |
| W11 | Lantmäteriet register IT procurement | Anbud notice | Lantmäteriet | Q3 2026 |
| W12 | Post-election Riksdag composition → KU33 2nd-reading prospects | Valmyndigheten preliminary | Valmyndigheten | Oct–Nov 2026 |

---

## 🗳️ Election 2026 Implications (mandatory under Rule 5/6)

| Lens | Specific Implication |
|------|---------------------|
| **Electoral Impact** | Fiscal trilogy + JuU15 = government's central campaign assets ("ekonomin tryggare, brotten färre"). KU33 = secondary risk (V/MP attentive-voter mobilisation 0.5–1.5 pp; reverse-2008-FRA effect). Migration trio = SD-base reinforcement but ECHR risk if struck before Sep. |
| **Coalition Scenarios** | M+KD+L+SD continuity (P=0.50) preserves all four legislative streams; S-led minority (P=0.35) likely re-opens budget arithmetic + may revise KU33 language; S+V+MP majority (P=0.15) blocks KU33 2nd reading + opens Vårändringsbudget renegotiation. Detail in [`scenario-analysis.md`](scenario-analysis.md). |
| **Voter Salience** | Cost-of-living (fuel, el, hyror) > brott + ordning > försvar/Ukraina > klimat > migration > grundlag. KU33 only enters top-5 if a chilling-effect case breaks before Sep 2026 (Wildcard-1). |
| **Campaign Vulnerability** | Government most exposed on: (a) Nordic GDP gap (Sweden 0.82 % vs Denmark 3.5 %); (b) cross-cluster tension (press freedom abroad/at home); (c) ECHR ruling on inhibition orders. Opposition most exposed on: alternative fiscal arithmetic; Ukraine consensus (cannot break); JuU15 vote-against framing as "soft on crime". |
| **Policy Legacy** | Fiscal trilogy = annual cyclical policy (resets each year). KU33 = decadal grundlag change (only reversible by another grundlag change ⇒ 2 elections). HD03231 = institutional commitment binding for tribunal lifespan (10–25 yrs precedent). HD01UFöU3 = doctrinal precedent for further NATO-integration deployments. |

---

## 🎯 Analyst Confidence Meter

| Dimension | Confidence | Notes |
|-----------|:----------:|-------|
| Lead-story selection (DIW + immediate-impact balance) | 🟦 VERY HIGH | Sensitivity analysis in `significance-scoring.md` confirms top rank under 5 plausible weight variations |
| Coverage completeness (≥ 7.0 weighted) | 🟦 VERY HIGH | All 11 documents above the gate appear as dedicated H3 sections in the published article |
| Cross-party first-reading vote projection | 🟦 VERY HIGH | JuU15 = operationally validated 145–142; other patterns established |
| Cross-party **second-reading** vote projection (KU33) | 🟧 MEDIUM | Depends on 2026 election outcome — three plausible coalition compositions |
| Coalition fracture risk (R4) | 🟧 MEDIUM | 145–142 = stable but minimal margin; SD leverage measurable |
| Russian hybrid-warfare response magnitude (R1) | 🟧 MEDIUM | Rising baseline post-eFP + tribunal; exact timing uncertain |
| US tribunal cooperation (R6) | 🟥 LOW | Public statements ambiguous |
| Migration ECHR-strike-down probability (R3) | 🟧 MEDIUM | Counter-motion text shows preparedness; Strasbourg docket pace uncertain |

---

## 🕵️ Red-Team / Devil's-Advocate Critique

| Challenge | Mainstream View | Devil's-Advocate View | Analytic Response |
|-----------|-----------------|----------------------|-------------------|
| **Spring fiscal package as "election bribe"?** | Stimulus targets cost-of-living pressure citizens genuinely face | Fuel-tax cut benefits high-mileage / rural voters disproportionately and undermines green credibility | Both true. The intervention is regressive on climate but genuinely targeted on income groups with highest fuel-cost share. Nordic comparators (DK fuel surtax retained; NO carbon-fee adjusted) show alternative fiscal designs |
| **JuU15 145–142 = stability or fragility?** | 3-vote margin = fragile coalition | 145 vs 142 = pure bloc vote with zero defections = remarkable discipline | Operational stability **for legislation that fits the four-party agenda**; fragility re-emerges on issues that split SD from L (most plausibly: any further constitutional / international-law commitment) |
| **KU33 = press-freedom regression?** | 1766 narrowing is a step backwards | Norway (RSF #1), Denmark (#3), Finland (#5) operate equivalent regimes | Both true: Nordic normalisation is real; interpretive-frontier risk is real. The deciding variable is "formellt tillförd bevisning" definition strictness (`comparative-international.md`) |
| **Migration trio = ECHR strike-down inevitable?** | V/C/MP have prepared a litigation predicate | ECHR Article 8 jurisprudence supports proportionate inhibition orders if appeal mechanisms exist | Probability of full strike-down ≈ 0.20; partial requirement to add appeal mechanism ≈ 0.45; clean pass ≈ 0.35 (`scenario-analysis.md` §Migration scenarios) |
| **Ukraine tribunal = symbolic only without US?** | Without US, China, major Global South, tribunal is symbolically historic but operationally marginal | Symbolic deterrence + norm-building have independent weight; ECCC / SCSL operated effectively without all great powers | Both analyses required. Operational caseload depends on (a) Russian-asset access; (b) successor-state behaviour |
| **Coalition fracture under cost-of-living = high prob?** | Polls show economic stewardship as #1 issue ⇒ government most exposed | Government has tabled visible relief (fuel, el, gas) ⇒ exposure is mitigated | Stewardship vulnerability persists; mitigation is partial. Outcome conditional on Q2/Q3 2026 macro data |

---

## 🔁 TOWS Cross-Cluster Strategic Interference

| Combination | Mechanism | Strategic Implication |
|-------------|-----------|----------------------|
| **Ukraine S × KU33 T** | Government championing Nuremberg-style accountability abroad while narrowing TF at home → rhetorical exposure | Opposition talking point: *"Sweden defends press freedom elsewhere while compressing it at home"* |
| **Fiscal S × Migration T** | Cost-of-living relief sells well to median voter; migration tightening sells to SD base; tension is between coalition partner L (most uncomfortable on migration) and SD | L–SD friction is the strategic centre of gravity for coalition stability through Sep 2026 |
| **Energy O × Fiscal W** | Electricity System Act + wind-power municipal share = green ambition; fuel-tax cut = climate inversion | Government must hold both narratives simultaneously; opposition (MP especially) will exploit |
| **JuU15 razor-thin × SD leverage** | 145–142 with SD as kingmaker on every paragraph = coalition cannot afford SD defection on any subsequent vote | Effective rightward agenda pull; L most exposed |

(Full TOWS matrix in [`swot-analysis.md`](swot-analysis.md) §TOWS.)

---

## ❓ Key Uncertainties

| # | Uncertainty | Decision Impact | Resolution Window |
|---|-------------|-----------------|:-----------------:|
| U1 | Will Lagrådet scope "formellt tillförd bevisning" strictly? | Primary driver of KU33 interpretive trajectory | Q2 2026 |
| U2 | Will V/C/MP win partial or full ECHR ruling on inhibition orders? | Reverses or narrows SfU22 + Prop 235 + Prop 229 | H2 2026 / 2027 |
| U3 | Will the spring fiscal package translate into measurable Q3 2026 economic indicators? | Decisive for Sep 2026 government economic-stewardship narrative | 2026-07-01 (KI prognos) |
| U4 | Will post-Sep-2026 Riksdag composition support KU33 ratification? | Go / no-go for grundlag change | 2026-09-13 |
| U5 | Will US administration cooperate with HD03231 tribunal? | Tribunal effectiveness | H2 2026 |
| U6 | Will Russian hybrid-warfare response escalate above threshold? | Security posture + campaign dynamics | Continuous (heightened pre-election) |
| U7 | Will the JuU15 145–142 majority hold for the next contentious vote? | Coalition stability indicator | 2026-Q2 / Q3 |

---

## 📎 Related Artifacts

**Reference-grade dossier files**:
- [README](README.md) · [Executive Brief](executive-brief.md) · [Scenarios](scenario-analysis.md) · [Comparative International](comparative-international.md) · [Methodology Reflection](methodology-reflection.md)

**Core analysis files**:
- [Significance Scoring](significance-scoring.md) · [Classification](classification-results.md) · [SWOT](swot-analysis.md) · [Risk](risk-assessment.md) · [Threat](threat-analysis.md) · [Stakeholders](stakeholder-perspectives.md) · [Cross-Reference Map](cross-reference-map.md) · [Data Manifest](data-download-manifest.md)

**Cross-references to upstream realtime monitoring**:
- [`realtime-1434/synthesis-summary.md`](../../2026-04-17/realtime-1434/synthesis-summary.md) — deep-dive on KU32/KU33, HD03231/HD03232, CU27/CU28
- [`realtime-1434/comparative-international.md`](../../2026-04-17/realtime-1434/comparative-international.md) — Nordic + EU benchmarks for the constitutional cluster

---

**Classification**: Public · **Next Review**: 2026-04-25 (event-driven) · **Methodology**: `analysis/methodologies/ai-driven-analysis-guide.md` v5.1 (Rules 0–8 applied)
