# HD03250 — En statlig e-legitimation

**dok_id**: HD03250  
**Title**: En statlig e-legitimation  
**Ministry**: Finansdepartementet (Digital Affairs)  
**Responsible minister**: Erik Slottner (M)  
**Submitted**: 2026-05-07  
**Committee**: TU (Trafikutskottet / digital governance scope)  
**DIW Score**: 84 (High)

## Summary

HD03250 creates Sweden's first government-issued digital identity system, providing an alternative to the privately operated BankID system. The proposition implements Sweden's obligations under eIDAS 2 (Regulation (EU) 2024/1183) which requires all EU member states to offer a government digital identity wallet by end-2026/early-2027.

## Key Provisions

1. **State e-ID creation**: Bolagsverket designated as operator of the new state digital identity system.
2. **Universal access**: The state e-ID must be accessible to all Swedish residents regardless of bank account status.
3. **Government service integration**: All government digital services must accept the state e-ID within 24 months of enactment.
4. **Private sector integration**: Private relying parties (banks, insurance companies, platforms) encouraged but not mandated to accept state e-ID alongside BankID.
5. **eIDAS 2 compliance**: State e-ID must be certified as an eIDAS 2 Level of Assurance (LoA) High wallet.
6. **Privacy by design**: Selective disclosure capability required (users can share only specific attributes, not full identity — zero-knowledge proof capable).

## Implementation Complexity

Bolagsverket as operator is a logical choice (they manage the company register, have government PKI infrastructure experience) but the operational complexity of a consumer-facing mass-market product is orders of magnitude greater than their current B2B services. The critical path involves:

1. Technical specification (Q4 2026–Q1 2027)
2. Procurement of identity proofing infrastructure (Q1–Q2 2027)
3. BankID API integration work (Q2–Q3 2027)
4. Banking sector acceptance mandate via Finansinspektionen (Q3 2027–Q1 2028)
5. Public launch (Q2–Q3 2028 estimate)

**eIDAS 2 deadline**: Sweden is very likely to miss the formal EU deadline. This is acceptable if communicated proactively to the European Commission — multiple other member states are in the same position.

## Market Impact

**BankID**: The proposition positions the state as a direct competitor but not a monopoly replacement. BankID will retain dominant position for private sector use for 5+ years after state e-ID launch. The long-term threat to BankID's business model is real but not immediate. The Swedbank-SHB-SEB-Nordea-Danske consortium that owns BankID will seek to shape the implementation to maintain interoperability requirements rather than compete.

**Nordic interoperability**: State e-ID aligned with eIDAS 2 will be interoperable with Danish MitID, Finnish Suomi.fi, and Norwegian BankID — potentially enabling a Nordic cross-border digital services layer.

## Electoral Significance

Cross-partisan popular proposal. Primarily a competence signal for the Busch government. S would adopt this under any future government.
