# Political STRIDE Assessment — Swedish Democratic System 2026

**Date**: 2026-05-04 | **Framework**: STRIDE applied to political/democratic security

## Overview

This STRIDE assessment applies threat modelling to the Swedish democratic system as a security domain, identifying threats to democratic integrity, electoral legitimacy, and institutional resilience during the critical 2026 election cycle.

## S — Spoofing (Disinformation / Identity)

### Threat S-1: Russian Election Influence Operations
**Asset targeted**: Swedish voter perception; party identity; NATO/migration frames
**Attack vector**: Social media amplification of divisive content; fabricated "leaks"; astroturfing
**Actors**: GRU, FSB linked networks; domestic amplifiers (knowingly or unknowingly)
**Indicators**: Increased Telegram/X activity on SD-adjacent migration topics; fabricated Kristersson/Åkesson statements
**Severity**: HIGH | **Likelihood**: HIGH (confirmed SÄPO concern in prior annual reports)
**Countermeasures**:
- MPF (Myndigheten för psykologiskt försvar) active counter-narrative operations
- META/Google domestic coordination with Swedish authorities
- Political transparency reform (HD01KU39) — long-term audit trail
**Residual risk**: MEDIUM-HIGH — countermeasures reduce but cannot eliminate

### Threat S-2: AI-Generated Candidate Impersonation
**Asset targeted**: Party campaign communications; voter trust
**Attack vector**: Deep fake videos/audio of party leaders saying extreme statements
**Indicators**: Technology now accessible; low cost; hard to debunk quickly
**Severity**: HIGH | **Likelihood**: MEDIUM
**Countermeasures**: Party rapid response teams; platform deep fake detection; press authentication
**Residual risk**: MEDIUM

### Threat S-3: Fake Polling Data Injection
**Asset targeted**: Media narrative; voter behaviour (bandwagon/underdog effects)
**Attack vector**: False "polls" promoted on social media showing extreme results
**Severity**: MEDIUM | **Likelihood**: MEDIUM
**Countermeasures**: Swedish polling organisations have strict methodology disclosure requirements
**Residual risk**: LOW-MEDIUM

## R — Repudiation (Legitimacy Denial)

### Threat R-1: Election Result Rejection by Losing Bloc
**Asset targeted**: Democratic transition legitimacy
**Actors**: Fringe elements within SD; potential Russian amplification
**Attack vector**: Social media claims of fraud; demands for recount
**Severity**: HIGH if successful | **Likelihood**: LOW (5%) in full form
**Countermeasures**: Valmyndigheten transparent process; paper ballot verification; all-party election observers
**Residual risk**: LOW — Sweden's democratic institutions are robust

### Threat R-2: Government Formation Process Delegitimisation
**Asset targeted**: Riksdag Speaker's mandate allocation process
**Attack vector**: Claims that Speaker allocation process favours one bloc
**Severity**: MEDIUM | **Likelihood**: LOW
**Countermeasures**: Speaker (Talmannen) follows established constitutional procedure
**Residual risk**: LOW

## I — Information Disclosure (Unauthorised)

### Threat I-1: Campaign Strategy Leak
**Asset targeted**: Party internal strategy documents
**Attack vector**: Hack of party IT systems; insider leak; corporate espionage by political operatives
**Severity**: MEDIUM | **Likelihood**: MEDIUM (20%)
**Countermeasures**: Party IT security; NCSA guidance
**Residual risk**: MEDIUM

### Threat I-2: Classified Military Information Disclosure
**Asset targeted**: HD03254 bilateral military cooperation operational details
**Attack vector**: Insider threat; foreign intelligence penetration of Defence Ministry
**Severity**: HIGH | **Likelihood**: LOW (10%)
**Countermeasures**: MUST classification; security clearance procedures; compartmentalisation
**Residual risk**: LOW-MEDIUM

### Threat I-3: Personal Data of Voters Exposed
**Asset targeted**: Valmyndigheten voter register; SPAR (population register)
**Attack vector**: State-sponsored cyber attack; ransomware
**Severity**: HIGH | **Likelihood**: LOW (5%)
**Countermeasures**: NIS2 implementation (HD01FöU20); NCSA monitoring; distributed architecture
**Residual risk**: LOW

## D — Denial of Service (Electoral Infrastructure)

### Threat D-1: DDoS Against Valmyndigheten
**Asset targeted**: Valmyndigheten.se; election night results publication
**Attack vector**: DDoS from botnet; state-sponsored disruption
**Severity**: MEDIUM (results delayed but not altered — paper ballots used) | **Likelihood**: MEDIUM (30%)
**Countermeasures**: CDN protection; backup publication channels; NCSA support; paper ballots ensure result integrity
**Residual risk**: LOW (disruption possible; result integrity maintained due to paper ballots)

### Threat D-2: Physical Disruption of Counting
**Asset targeted**: Physical counting operations in municipality centres
**Attack vector**: Bomb threat/disruption; violent protest
**Severity**: MEDIUM | **Likelihood**: LOW (8%)
**Countermeasures**: Police presence; distributed counting (349 constituencies)
**Residual risk**: LOW

## E — Elevation of Privilege (Norm Erosion)

### Threat E-1: Executive Legislative Overreach (Final Session)
**Asset targeted**: Constitutional balance; Lagrådet scrutiny role
**Attack vector**: Government submitting complex legislation too late for Lagrådet full review
**Evidence**: Migration reform cluster submitted April 30 — late in session; Lagrådet review time compressed
**Severity**: MEDIUM | **Likelihood**: MEDIUM-HIGH (35%)
**Countermeasures**: Opposition can delay committee processing; Lagrådet can flag constitutional concerns
**Residual risk**: MEDIUM — some legislation may have reduced scrutiny

### Threat E-2: SD Cabinet Entry as Norm Rupture
**Asset targeted**: Post-war Swedish democratic cordon sanitaire against far-right governance
**Attack vector**: SD entering cabinet breaks 70-year norm
**Severity**: HIGH (structural democratic norm shift) | **Likelihood**: 12–18% (if L falls below threshold)
**Countermeasures**: L survival above threshold; M insisting on confidence-and-supply only
**Residual risk**: MEDIUM

### Threat E-3: Information Warfare Against Transparency Reform
**Asset targeted**: HD01KU39 transparency reform implementation
**Attack vector**: Parties finding loopholes; opacity maintained despite nominal reform
**Severity**: LOW | **Likelihood**: MEDIUM
**Countermeasures**: Civil society monitoring; KU oversight
**Residual risk**: LOW-MEDIUM

## STRIDE Risk Register Summary

| Threat | Category | Severity | Likelihood | Priority |
|---|---|---|---|---|
| Russian influence operations | S | HIGH | HIGH | P1 |
| AI deep fake impersonation | S | HIGH | MEDIUM | P2 |
| SD cabinet norm breach | E | HIGH | MEDIUM | P2 |
| Military info disclosure | I | HIGH | LOW | P3 |
| DDoS on Valmyndigheten | D | MEDIUM | MEDIUM | P2 |
| Election result rejection | R | HIGH | LOW | P3 |
| Legislative overreach | E | MEDIUM | MEDIUM-HIGH | P2 |
| Voter data breach | I | HIGH | LOW | P3 |
