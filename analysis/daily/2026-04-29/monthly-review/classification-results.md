# Classification Results — Monthly Review 2026-04-29

**Classifier**: Riksdagsmonitor AI classification v3.1  
**Window**: 2026-03-30 → 2026-04-29

---

## Source Tier Classification

| dok_id | Type | Committee | Domain | Tier | Confidence |
|--------|------|-----------|--------|------|------------|
| HC01FiU20 | Betänkande | FiU | Economic Policy | L3 | A1 |
| HD03253 | Proposition | FiU | Financial Regulation | L3 | A1 |
| HD10448 | Interpellation | — | Energy/Coalition | L3 | A2 |
| HD01JuU31 | Betänkande | JuU | Law Enforcement | L3 | A1 |
| HC01FiU24 | Betänkande | FiU | Monetary Policy | L2+ | A1 |
| HD01SfU28 | Betänkande | SfU | Migration/Citizenship | L2+ | A1 |
| HC01KU20 | Betänkande | KU | Constitutional | L2+ | A1 |
| HD01JuU10 | Betänkande | JuU | Weapons/Security | L2 | A1 |
| HC01UbU17 | Betänkande | UbU | Education | L2 | A1 |
| HD01SoU25 | Betänkande | SoU | Elder Care | L2 | A1 |
| HC01FiU30 | Betänkande | FiU | State Finance | L2 | A1 |
| HD01CU24 | Betänkande | CU | Building/Housing | L1 | A1 |
| HC01SkU18 | Betänkande | SkU | Tax/F-Tax | L1 | A1 |
| HD10449 | Interpellation | — | Infrastructure | L2 | B2 |
| HD10450 | Interpellation | — | Social Insurance | L2 | B2 |
| HD10451 | Interpellation | — | Corporate Crime | L2 | B2 |
| HD10454 | Interpellation | — | HVB-hem/Security | L2 | B2 |
| HD10455 | Interpellation | — | Cultural Heritage | L1 | B2 |
| HD024099 | Motion | — | Civil Servant Liability | L2 | B2 |
| HC01FiU23 | Betänkande | FiU | Municipal Finance | L1 | A1 |
| HD03252 | Proposition | — | Welfare/Prisons | L2 | A1 |
| HC01UbU16 | Betänkande | UbU | Higher Education | L1 | A1 |
| HD03104 | Prop/Betänk | — | Debt Management | L1 | A1 |

---

## Classification Methodology

**Confidence Scale**:
- A1: Riksdag official document, MCP verified, full text accessible
- A2: Riksdag official document, MCP verified, summary only
- B2: Riksdag document, interpellation — partial text, attributed

**Domain Classification**:
- Economic Policy: Budget, fiscal, tax framework
- Financial Regulation: Banking, credit, capital
- Energy/Coalition: Party positioning, intra-coalition
- Law Enforcement: Police, Riksrevisionen audit
- Monetary Policy: Riksbank, inflation
- Migration/Citizenship: SfU domain
- Constitutional: KU, government accountability

---

## MCP Data Provenance

| Source | Status | Documents retrieved | Coverage |
|--------|--------|---------------------|----------|
| riksdag-regering-mcp | ✅ LIVE | 300 total, 23 active | 2026-03-30/2026-04-29 |
| IMF WEO Apr-2026 | ✅ CACHED | SWE GDP +2.1%/2026 | Prior pre-warm |
| SCB | Not queried | — | Not required this cycle |
| World Bank | Not queried | — | Governance residue only |

**IMF Provenance Block**:
```json
{
  "economicProvenance": {
    "provider": "imf",
    "dataflow": "WEO",
    "indicator": "NGDP_RPCH",
    "vintage": "2026-04",
    "retrieved_at": "2026-04-29",
    "note": "IMF SDMX endpoint unavailable at runtime; using WEO Apr-2026 cached data. Compare call returned null. SWE GDP 2025 revised to 1.9% per HC01FiU20 tariff annotation."
  }
}
```
