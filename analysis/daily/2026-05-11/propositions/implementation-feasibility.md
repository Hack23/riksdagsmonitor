# Implementation Feasibility — Propositionspaket 7 maj 2026

**Author:** James Pether Sörling | **Run ID:** 25654727630 | **Date:** 2026-05-11
**Classification:** Public | **Admiralty:** [B2]

---

## Genomförbarhetsbedömning

### HD03267 — Implementeringsfeasibility: HÖG

**Ikraftträdandedatum:** 1 mars 2027

**Implementeringskrav:**
| Krav | Ansvarig | Komplexitet | Status |
|------|----------|-------------|--------|
| Domstolarna informerade om nytt beviskrav | Domstolsverket | LÅG | Väntar på JuU-betänkande |
| SÄPO uppdaterar ärendehandläggning | SÄPO | LÅG | Intern rutin |
| Migrationsverket justerar förvarsregistret | MiV | MEDEL | Systemuppdatering |
| Polismyndigheten rutiner för barn | Polisen | MEDEL | Utbildning + riktlinjer |
| Information till förvarsenheter | Kriminalvården | LÅG | Informationsbrev |

**Genomförbarhetsbedömning:** HÖG — Lagändringen kräver inga större organisatoriska förändringar. Primär implementeringsutmaning är utbildning av myndigheter i det nya beviskravet och hantering av barnärenden.

**Risk:** Om Europadomstolsanmälan kommer snabbt (inom 1 år efter ikraftträdande) kan Sverige behöva tillfälligt skjuta upp tillämpning under EU-processens gång.

---

### HD03250 — Implementeringsfeasibility: MEDEL (hög teknisk komplexitet)

**Ikraftträdandedatum:** Okänt (baserat på metadata; bedömt 2027–2028)

**Implementeringskrav:**
| Krav | Ansvarig | Komplexitet | Risk |
|------|----------|-------------|------|
| Bygg statlig e-ID-infrastruktur | DIGG/Finansdep | KRITISK HÖG | Statlig IT-historik = risk |
| Integrera med offentlig service | E-hälsomyndigheten, CSN, Försäkringskassan | HÖG | Koordinationsutmaning |
| Migrera befintliga BankID-användare | Bankerna + staten | HÖG | Motståndsrisk |
| eIDAS 2.0 interoperabilitet | DIGG + EU | MEDEL | EU-tidslinjesberoende |
| Användarutbildning (äldre, lågdigitala) | Kommunerna | MEDEL | Resurskrävande |

**Kritisk risk:** DIGG (Myndigheten för digital förvaltning) är primär implementeringsansvarig. DIGG:s kapacitet och budget är begränsade — stor implementation av nationell e-ID-infrastruktur kan kräva externleverantör med tillhörande upphandlingskomplexitet.

**Genomförandetid:**
- Optimistisk: 18 månader (2027Q1–2028Q3)
- Realistisk: 30 månader (2027Q1–2029Q3)
- Pessimistisk: 48+ månader (baserat på historik: Sjunet, SPAR, e-legitimation 1.0)

---

### HD03261 — Implementeringsfeasibility: HÖG

**Implementeringskrav:**
| Krav | Ansvarig | Komplexitet | Risk |
|------|----------|-------------|------|
| Skatteverket uppdaterar IT-system | Skatteverket | MEDEL | Normalt — SKV är stark IT-myndighet |
| Juridisk kompetensutveckling | SKV personal | LÅG | Intern |
| GDPR-konsekvensbedömning (DPIA) | Skatteverket + IMY | MEDEL | IMY kan kräva ändringar |
| Rutiner för individens rättigheter | Skatteverket | LÅG | Standard GDPR-process |

**Genomförbarhetsbedömning:** HÖG — Skatteverket är en av Sveriges mest kompetenta IT-myndigheter. HD03261 innebär utökade befogenheter och systemjusteringar, inte en ny grundinfrastruktur.

---

## Paketnivå: Koordineringsutmaningar

**Mellan HD03250 och HD03261:** Synergimöjlighet — statlig e-ID (HD03250) och folkbokföring (HD03261) bör koordineras för att den digitala identiteten kan kopplas mot folkbokföringsregistret. Om HD03250 implementeras separat från HD03261 skapas teknisk skuld.

**Rekommendation:** Regeringen bör utse en koordineringsgrupp (Finansdep + DIGG + Skatteverket) som säkerställer att e-ID och folkbokföring implementeras koherens.

---

## Kostnadsestimering (Hypotetisk)

| Proposition | Estimerad implementeringskostnad | Unsäkerhet |
|-------------|----------------------------------|-----------|
| HD03267 | 20–50 MSEK (myndighetsutbildning + systemjustering) | LÅG |
| HD03250 | 500 MSEK – 2 GSEK (nationell e-ID-infrastruktur) | HÖG |
| HD03261 | 50–100 MSEK (Skatteverket-IT + GDPR-arbete) | MEDEL |

*Kostnadsestimat baserade på analoger (SPAR-system, MitID-analogier); ej officiella budgetar.*

| Claim | Evidence | Retrieved at | Confidence |
|-------|----------|--------------|------------|
| HD03267 ikraftträdande 1 mars 2027 | HD03267 fulltext | 2026-05-11 | HIGH |
| DIGG som e-ID ansvarig | Känd myndighetsfunktioner | 2026-05-11 | HIGH |
| SKV IT-kompetens | Känd myndighetsprofil | 2026-05-11 | HIGH |

