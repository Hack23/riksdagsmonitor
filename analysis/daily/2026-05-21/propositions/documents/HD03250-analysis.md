# Per-Document Analysis: HD03250

## Proposition 2025/26:250 — En statlig e-legitimation

**Document ID**: HD03250  
**Full title**: En statlig e-legitimation  
**Department**: Finansdepartementet  
**Committee referral**: FiU (Finansutskottet)  
**Submission date**: 2026-05-07  
**Riksmöte**: 2025/26

---

## Document Classification

| Attribute | Value |
|-----------|-------|
| Type | Proposition (Government Bill) |
| Track | Digital Governance |
| Priority | MEDIUM |
| Electoral salience | MEDIUM |
| Constitutional complexity | LOW-MEDIUM |
| EU law dimension | HIGH (eIDAS 2.0) |

---

## Core Policy Architecture

### Problem Statement

Sweden has operated without a state-issued digital identity since the digital era began. The current system:
- **BankID**: Private, bank-issued identity credential (6 major banks)
- **Freja eID+**: Commercial alternative, limited adoption
- **Physical ID**: Passport, national ID card (offline only)

**Systemic risks of current approach**:
1. Private infrastructure for public functions — if banks fail or exit market, government services paralyzed
2. Exclusion: 500,000-800,000 Swedes without bank account cannot get BankID → excluded from digital public services
3. EU eIDAS 2.0 compliance: Regulation requires state digital wallet by 2026
4. Digital sovereignty: Foreign bank shareholders (Nordea is Finnish-Swedish; SEB has foreign institutional shareholders) control Sweden's de facto identity infrastructure

### Proposed Solution

**State e-legitimation**:
- Issued by a state authority (Digisamverkan or new Statlig e-ID myndighet)
- Free to citizens (or low-cost)
- Mandatory acceptance for all public digital services
- Optional but encouraged for private sector
- Full EU eIDAS 2.0 compliance — interoperable across EU

**Key design principles**:
1. **Complement, not replace**: BankID continues as private alternative
2. **Inclusion by design**: Accessible to unbankable, elderly, recently arrived
3. **Privacy by design**: Minimal data collection; GDPR compliance built in
4. **Interoperability**: EU Digital Identity Wallet compatible
5. **Security**: HSM-backed key storage; ISO 27001 certified operations

---

## Technical Implementation Plan

**Phase 1 (2026-2027)**: Legislative framework and authority establishment
- Designate responsible authority
- Develop technical specifications (based on eIDAS 2.0 ARF)
- Select PKI provider and HSM infrastructure
- Pilot with government services only

**Phase 2 (2027-2028)**: Deployment and scaling
- Issue first credentials
- Integrate with key public services (skatteverket.se, 1177.se, myndigheter.se)
- Launch public awareness campaign

**Phase 3 (2028-2029)**: Full deployment
- All public services accept state e-ID
- Private sector integration optional
- Continuous improvement cycle

**Estimated timeline**: 18-30 months to operational service

---

## EU Legal Framework: eIDAS 2.0

**Regulation (EU) 2024/1183** amending eIDAS 1.0:
- Requires all Member States to offer national Digital Identity Wallets (EUDIW)
- Technical specifications under ARF (Architecture and Reference Framework)
- High assurance level required for most use cases
- Cross-border interoperability: Swedish e-ID must work in EU countries and vice versa

**Sweden's compliance status**: HD03250 provides the legal foundation for EUDIW-compliant Swedish e-ID. Technical implementation will follow.

---

## Stakeholder Impact

### Benefits

**Citizens**:
- Access to digital services regardless of banking status
- Free digital identity (vs. BankID fee via bank relationship)
- EU-wide use of Swedish digital identity
- Stronger data protection (GDPR-compliant state authority)

**Government**:
- Reduced fraud in digital services (identity theft, benefit fraud)
- EU eIDAS compliance
- Reduced dependency on private banking infrastructure
- Better digital service access rates

**Businesses**:
- Alternative identity verification option (reduced BankID fee dependency)
- EU customer onboarding simplified
- Smaller companies can avoid BankID licensing costs

### Concerns

**Banks (BankID providers)**:
- Reduced BankID revenue as some users migrate to free state option
- However: banks' core financial services still require bank relationship; BankID is not their core revenue

**Civil liberties organizations**:
- Centralized state identity database = surveillance risk
- Function creep: state identity data used for tracking
- **Mitigation needed**: Independent data protection oversight; strict purpose limitation in law

**Technical community**:
- State systems historically slower to innovate than private
- BankID's user experience is very good — state version may be inferior initially

---

## Assessment

**Strategic appropriateness**: HIGH — Sweden needs state digital identity for EU compliance and inclusion  
**Implementation risk**: MEDIUM — complex technical project; cost overrun and delay risk  
**Privacy risk**: MEDIUM-HIGH without strong independent oversight  
**Electoral impact**: LOW-MEDIUM — broadly popular but low salience

---

*Document analysis: HD03250 — Pass 1, Family E artifact*
