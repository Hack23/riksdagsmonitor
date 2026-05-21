# Threat Analysis — Realtime Pulse 2026-05-21

**Author**: Riksdagsmonitor Intelligence
**Framework**: STRIDE (Spoofing/Tampering/Repudiation/Information Disclosure/Denial of Service/Elevation of Privilege) adapted to democratic threat context

## Threat Model: AI Policing (JuU28)

### T1: Technology Spoofing / Adversarial Attacks
**Threat**: Adversaries (organised crime, state actors) could deploy adversarial-example techniques to defeat facial recognition (adversarial makeup, printed masks) or inject false positives by placing target face imagery in view of police cameras.
**Actor**: Organised crime syndicates, potentially state-sponsored actors (Russia, Iran) with interest in undermining Swedish law enforcement effectiveness.
**Likelihood**: Medium (T+1-3yr post-deployment). Current systems are vulnerable to physical adversarial attacks.
**Impact**: HIGH — if JuU28 surveillance is defeated by criminal countermeasures, the technology's legitimacy collapses.

### T2: Mission Creep / Scope Expansion (Elevation of Privilege)
**Threat**: Law enforcement expands facial recognition use beyond the "exceptional circumstances" threshold through regulatory interpretation drift. Examples: using the system for traffic violations, immigration enforcement, protest monitoring.
**Actor**: Internal Polismyndigheten pressure + political pressure from SD for broader deployment.
**Likelihood**: HIGH (T+1-5yr). International precedent consistently shows surveillance technology scope creep.
**Impact**: HIGH — democratic threat to freedom of assembly and political activity (Article 2:6 Instrument of Government).

### T3: Data Breach / Information Disclosure
**Threat**: Biometric database of facial matches (stored by Polismyndigheten for audit purposes under JuU28) is exfiltrated by state-sponsored hackers.
**Actor**: Russian GRU/FSB (active targeting of Nordic law enforcement databases documented 2023–2025), Chinese APT groups.
**Likelihood**: Medium. Swedish police databases are classified but have had security incidents in the past.
**Impact**: CRITICAL — biometric data is irreplaceable; individuals cannot change their face. Data breach would affect all persons biometrically identified by the system.

### T4: Democratic Accountability Denial
**Threat**: The three-year sunset clause review is conducted by Polismyndigheten internally, with minimal Riksdag oversight. The governing bloc uses the review to rubber-stamp continuation without genuine evaluation.
**Actor**: Government coalition + Polismyndigheten institutional self-interest.
**Likelihood**: Medium-High (T+3yr).
**Impact**: MEDIUM — institutionalisation of surveillance without genuine democratic review.

## Threat Model: Environmental Policy (CU41)

### T5: EU Infringement Risk (Denial of Regulatory Service)
**Threat**: European Commission infringement proceedings effectively suspend CU41's hydropower exemptions pending CJEU judgment — leaving 300+ hydropower operators in legal uncertainty for 3-5 years.
**Actor**: European Commission (legal actor, not adversarial — but outcome is politically threatening)
**Likelihood**: Medium-High (45%).
**Impact**: HIGH — economic disruption to Swedish energy sector during critical grid stability period.

### T6: Environmental Litigation (Repudiation)
**Threat**: Environmental NGOs (Naturskyddsföreningen, WWF Sverige) challenge individual hydropower exemption decisions in Swedish administrative courts, creating case-by-case uncertainty that the exemption mechanism is designed to avoid.
**Likelihood**: HIGH. Naturskyddsföreningen has explicitly stated it will challenge CU41 exemptions.
**Impact**: MEDIUM — delays and litigation costs, but individually manageable.

## Threat Model: Foreign Policy (HD11822, HD11821)

### T7: Taiwan Arms Sales Escalation
**Threat**: If Sweden agrees to sell arms to Taiwan (following US policy shift that prompted HD11822), China retaliates diplomatically — reducing Swedish exports to China and potentially complicating Huawei/ZTE regulatory decisions.
**Actor**: China (People's Republic)
**Likelihood**: Low (Sweden has historically been cautious on Taiwan arms)
**Impact**: Medium-High if it occurs — economic and diplomatic cost.

### T8: Russia / Disinformation Amplification
**Threat**: Russia's GRU information-warfare unit amplifies JuU28 as evidence of "Sweden becoming a police state" in Swedish-language disinformation campaigns, targeting pre-election public opinion.
**Actor**: Russia's GRU Unit 74455 (Sandworm) + Internet Research Agency successors.
**Likelihood**: HIGH. Sweden's EU accession debate and NATO membership have already attracted sustained Russian information-warfare attention.
**Impact**: MEDIUM — can shift a minority of persuadable voters; most effective in amplifying existing civil liberties concerns.

## Summary Risk Ladder (Democratic Threat Index)

| Threat | DTI Score | Priority |
|--------|-----------|---------|
| T2: Mission Creep | 8.5 | CRITICAL |
| T3: Biometric Data Breach | 8.0 | CRITICAL |
| T1: Adversarial Attacks | 6.0 | HIGH |
| T8: Russian Disinformation | 6.0 | HIGH |
| T5: EU Infringement/CU41 | 5.5 | HIGH |
| T4: Democratic Review Failure | 5.0 | MEDIUM-HIGH |
| T7: Taiwan Escalation | 4.0 | MEDIUM |
| T6: Environmental Litigation | 3.5 | MEDIUM |
