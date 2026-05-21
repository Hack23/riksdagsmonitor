# Digital Governance Analysis — Government Propositions 2026-05-21

## Digital Policy Package Overview

Two propositions form a digital governance package: HD03250 (state e-ID) and HD03261 (Skatteverket population register expansion).

---

## HD03250 — En statlig e-legitimation

### Technical Architecture

**Problem statement**: Sweden has relied on bank-issued BankID since 2003. As of 2025:
- ~8.5 million active BankID users
- BankID issued by 6 major banks (Nordea, SEB, Handelsbanken, Swedbank, SHB, Länsförsäkringar)
- No BankID = no access to most Swedish digital services (e-declaration, healthcare booking, e-government)
- Estimated 500,000-800,000 Swedes cannot get BankID (unbanked, elderly, new immigrants)

**Solution (HD03250)**:
- State-issued eID (Statlig e-legitimation)
- Issued by Digisamverkan (or new authority to be established)
- Based on EU eIDAS 2.0 technical standards
- Mandatory acceptance by all public authorities
- Optional but encouraged for private sector
- Compatible with EU Digital Identity Wallet

### Technical Implementation Requirements

**Infrastructure**: 
- Public Key Infrastructure (PKI) for credential issuance
- Identity verification process (in-person or secure remote)
- Backend identity management system
- API integration layer for service providers (replacing BankID API)

**Security considerations**:
- Central identity store is high-value target (foreign state actors, criminal hackers)
- Need HSM (Hardware Security Module) for key storage
- Must have distributed/redundant architecture
- ISO 27001 certification recommended for operational authority

**Interoperability**:
- Technical specification: EU eIDAS 2.0 (Regulation 2024/1183)
- Cross-border use: EU Digital Identity Wallet integration
- Backward compatibility: BankID still valid in parallel

**Timeline estimate**: 18-24 months from legislation to operational system (based on Danish MitID experience)

### Privacy and Data Protection (GDPR)

**DPIA required**: YES — state e-ID involves large-scale processing of identity data  
**Legal basis**: Article 6(1)(e) GDPR (public task) for state issuance  
**Risks**: 
- Function creep: state identity data used beyond original purpose
- Data retention: how long identity credentials stored after cancellation
- Cross-authority sharing: prevent scope expansion without legislative basis

**IMY (Data Protection Authority) involvement**: IMY consultation required before implementation

---

## HD03261 — Skatteverket Folkbokföring Powers

### Policy Context

Folkbokföringen (population register) is Sweden's foundational identity database — used for:
- Tax assessment
- Healthcare access
- Electoral rolls
- Benefits eligibility
- Bank account opening
- School enrollment

**Problem**: ~18,000-25,000 estimated fraudulent registrations (government estimate):
- Shell addresses (mailbox apartments with 100+ registered persons)
- Persons registered at addresses where they don't live
- Strategic registration for welfare access, school choice, tax benefits

### New Powers Under HD03261

**Home visits**: Skatteverket inspectors can visit registered addresses to verify actual residence. Requirements (from proposition framework):
- Administrative decision required before visit
- Person notified in advance (except in fraud investigation cases)
- Cannot force entry — requires cooperation or police assistance

**Enhanced data sharing**: Skatteverket can share population register data more broadly with:
- Migrationsverket (cross-check against immigration status)
- Polismyndigheten (criminal population register integrity)
- Kommuner (municipal authorities for school choice fraud)

**Documentation requirements**: Individuals can be required to provide evidence of actual residence (lease agreements, utility bills, etc.)

### Civil Liberties Dimension

**Proportionality**: Home visits to verify residence are proportionate to population register integrity goals IF:
- Applied evenhandedly (not ethnically targeted)
- Administrative safeguards in place
- Appeals mechanism available
- Duration limits on enhanced investigation

**Discrimination risk**: Most significant concern. If implementation disproportionately targets immigrant or minority communities, Article 14 ECHR + Discrimination Act risk.

**Operational safeguard needed**: Independent monitoring of which communities receive home visits; regular equality impact assessments.

---

## Digital Sovereignty Assessment

**Sweden's digital infrastructure strategic picture**:

| System | Control | Risk Level |
|--------|---------|-----------|
| BankID (current) | Private (6 banks) | MEDIUM — foreign ownership risk (SEB: some foreign shareholders) |
| State e-ID (proposed) | State | LOW operating risk; HIGH breach risk |
| Tax registry | State (Skatteverket) | LOW |
| Population register | State + HD03261 expansion | LOW operating; MEDIUM privacy |
| Health records (1177) | State/regional | MEDIUM |

**Assessment**: HD03250 is a genuine digital sovereignty improvement. The dependency on private bank infrastructure for fundamental state functions was a systemic vulnerability.

---

*Pass 1 — digital governance analysis*
