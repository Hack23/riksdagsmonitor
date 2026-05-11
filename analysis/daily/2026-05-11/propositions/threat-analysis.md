# Threat Analysis (STRIDE) — Propositionspaket 7 maj 2026

**Author:** James Pether Sörling | **Run ID:** 25654727630 | **Date:** 2026-05-11
**Classification:** Public | **Admiralty:** [B2]

---

## STRIDE-analys per Proposition

### HD03267 — Säkerhetshotlagstiftning

| STRIDE | Hotvektor | Aktör | Sannolikhet | Konsekvens | Notis |
|--------|-----------|-------|-------------|------------|-------|
| Spoofing | Falsk säkerhetsklassificering av individer | Statsaktörer / myndigheter | LÅG | HÖG | Kräver internt missbruk |
| Tampering | Manipulation av säkerhetsbedömning i ärenden | Korrupt myndighetsanställd | LÅG | HÖG | Systemdesign reducerar risk |
| Repudiation | Bevislöst frihetsberövande utan dokumentation | Staten | MEDEL | KRITISK | Sänkt beviskrav "kan antas" ökar risk |
| Information Disclosure | Läckage av sekretessbelagd säkerhetsinformation | Utländsk underrättelse | LÅG | KRITISK | Statens sekretess skyddar |
| Denial of Service | Systematiska rättsliga överklaganden blockerar snabba utvisningar | Rättshjälpsorganisationer | MEDEL | MEDEL | Acceptabel rättsstatlig funktion |
| Elevation of Privilege | Utvidgning av lagens tillämpningsområde bortom ursprungssyfte | Staten | MEDEL | HÖG | Slippery slope risk |

---

### HD03250 — Statlig e-Legitimation (Cybersäkerhetsperspektiv)

| STRIDE | Hotvektor | Aktör | Sannolikhet | Konsekvens | Notis |
|--------|-----------|-------|-------------|------------|-------|
| Spoofing | Förfalskade e-ID-tokens | Cyberbrottsling | MEDEL | HÖG | Central e-ID = centralt mål |
| Tampering | Manipulation av identitetsregister | Statsaktör / insider | LÅG | KRITISK | Kräver stark åtkomstkontroll |
| Repudiation | Nekad digital transaktion utan logg | System- eller användarfel | MEDEL | MEDEL | Audit trail obligatorisk |
| Information Disclosure | Läckage av e-ID-infrastruktur | Utländsk underrättelse / ransomware | MEDEL | KRITISK | Kritisk infrastruktur = högt mål |
| Denial of Service | DDoS mot e-ID-tjänst → blockering av offentlig service | Statsaktör / hacktivist | HÖG | HÖG | Central e-ID = single point of failure |
| Elevation of Privilege | Obehörig tillgång till e-ID-utfärdningsprocess | Insider | LÅG | KRITISK | HSM + multi-faktor motverkar |

**Högkritisk risk:** HD03250 skapar en centraliserad digital identitetsinfrastruktur som är ett högt värde mål (HVT) för statsaktörer. DoS-risken (avbrott i offentlig service) är den mest sannolika realiserade risken.

---

### HD03261 — Skatteverket Folkbokföring

| STRIDE | Hotvektor | Aktör | Sannolikhet | Konsekvens |
|--------|-----------|-------|-------------|------------|
| Repudiation | Felaktig folkbokföringsuppgift utan rättelse | System | MEDEL | MEDEL |
| Information Disclosure | Utlämnande av folkbokföringsdata utan lagstöd | Myndighetsfel | LÅG | MEDEL |
| Elevation of Privilege | Skatteverkets befogenheter utnyttjas bortom folkbokföring | Myndighetsmissbruk | LÅG | MEDEL |

---

## Sammantagen Hotbild

**Highest Priority Threats:**
1. **HD03250 DDoS/Disruption** — Central e-ID utan redundans = nationell serviceavbrott
2. **HD03267 EoP (scope creep)** — Lagstiftning designad för specifik hotbild kan expandera tillämpningsområdet
3. **HD03267 Repudiation** — "Kan antas"-standard öppnar för bevislösa frihetsberövanden

**Threat Actors:**
- *Externa:* Ryska och kinesiska statsaktörer mot e-ID-infrastruktur (HD03250)
- *Interna:* Politiserat missbruk av HD03267 för att frihetsberöva individer som ej uppfyller ursprungssyftet

| Claim | Evidence | Retrieved at | Confidence |
|-------|----------|--------------|------------|
| HD03250 = critical infra target | Känd statlig e-ID-arkitektur; NCSC-SE-erfarenhet | 2026-05-11 | HIGH |
| HD03267 EoP risk | 3 kap. 1 § "kan antas"; lagstiftningshistorik | 2026-05-11 | HIGH |

