# Threat Analysis — Evening Analysis 2026-05-05

**Date**: 2026-05-05  
**Method**: STRIDE + Political OSINT threat modelling  
**Admiralty**: [B2]  

---

## Threat Landscape

### T-EA-01: Coalition Internal Legitimacy Threat (HIGH)

**Threat actor**: Sverigedemokraterna (SD), acting as inside-coalition challenger to M-led government  
**Vector**: Parliamentary interpellations (HD10464, HD10466) as elite-level pressure  
**Mechanism**: SD files interpellations against M ministers for coalition-adjacent matters (Sida, civil servants), creating media narrative that M is not pursuing SD's state-reform agenda fast enough.  
**Effect**: Forces M into public justification of status quo, weakening M's governing narrative.  
**Precedent**: Exact same mechanism used against Riksgälden/FiU49 (committeeReports sibling), gang crime (PIR-001), ESA (PIR-002).  
**STRIDE classification**: Spoofing (SD presenting as legitimate reform advocate inside coalition), Tampering (distorting public understanding of coalition cohesion), Repudiation (SD can later deny responsibility for outcomes).  
**Countermeasure**: M government public communication clarifying that SD interpellations are opposition-within-coalition posturing, not formal coalition policy.

### T-EA-02: Judicial Legitimacy Challenge to JuU30 (MEDIUM)

**Threat actor**: S + V parliamentary groups; civil society human rights organisations  
**Vector**: Parliamentary dissent in JuU30 committee vote + future court challenge  
**Mechanism**: UNCRC proportionality arguments (juvenile custody mandatory minimum) + Lagrådet proportionality concern in yttrande 2026-01-19. Any case reaching administrative court or ECtHR weakens the government's "rule of law" claim.  
**STRIDE**: Denial-of-Service to government criminal justice agenda (legal delay), Elevation-of-Privilege (civil society and court actors constraining parliamentary sovereignty).

### T-EA-03: V NPT Campaign Insurgency (LOW-MEDIUM)

**Threat actor**: Vänsterpartiet (V)  
**Vector**: HD11787 — scheduled during ongoing NPT review conference (April 27–May 22)  
**Mechanism**: Forces government to make public record of Sweden's NPT position, creating a documentary anchor for V's anti-nuclear NATO-sceptic campaign from May 2026 onwards.  
**STRIDE**: Information Disclosure (Sweden's diplomatic position partially revealed), Repudiation contested.

### T-EA-04: Media Amplification of Administrative State Narrative (HIGH)

**Threat actor**: SD-aligned and mainstream media political correspondents  
**Vector**: Day's collection of interpellations forms a coherent narrative arc across 3 state domains  
**Mechanism**: Journalists aggregate HD10464 + HD10466 + HD10465 + (from sibling) HD10459 into a single "state reform" story. Narrative captures swing voters who distrust bureaucracy.  
**STRIDE**: Spoofing (SD reforms presented as legitimate governance rather than electoral positioning), Tampering (public understanding of Swedish administrative state distorted).

### T-EA-05: Ostlänken Cost Controversy Escalation (LOW)

**Threat actor**: S regional infrastructure constituencies; cost-sceptic media  
**Vector**: HD11784 (written question, costs for Linköping connection)  
**Mechanism**: If Trafikverket estimate reveals further cost overruns, links to PIR-007 (route change) and creates government infrastructure credibility problem.  
**STRIDE**: Information Disclosure, Repudiation.

---

## Threat Heat Map

| Threat | Actor | Probability | Impact | Election Impact |
|--------|-------|-------------|--------|-----------------|
| T-EA-01 | SD | HIGH | MEDIUM-HIGH | Vote share + coalition optics |
| T-EA-02 | S/V + courts | MEDIUM | MEDIUM | Long-tail judicial risk |
| T-EA-03 | V | LOW-MEDIUM | LOW-MEDIUM | V base mobilisation only |
| T-EA-04 | Media | HIGH | HIGH | Framing contest |
| T-EA-05 | S/media | LOW | LOW | Regional only |

## Counter-Threat Playbook

**Immediate (T+1 to T+7)**:
- Government rapid response on JuU30 adoption — lead with crime-reduction outcome, not custody mechanics
- M minister teams prepare holding answers for SD interpellations — defer Sida to "annual review" process, defer RK civil servants to "ongoing HR procedures"

**Short-term (T+7 to T+30)**:
- NPT response: standard diplomatic formula that references Swedish TPNW/CTBTO engagement without committing to new disarmament initiatives vs. NATO allies
- Commission Statskontoret brief on regional service access to pre-empt S narrative

**Medium-term (T+30 to T+131)**:
- Use KU39 constitutional transparency outcome (from committeeReports sibling) as evidence that parliamentary accountability is functioning — counter SD's captured-state narrative
- JuU30 implementation monitoring — ensure no early implementation failures that opposition can weaponise

