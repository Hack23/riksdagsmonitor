# Cross-Reference Map — Committee Reports 2026-04-28

**Author**: James Pether Sörling | **Date**: 2026-04-29 | **Confidence**: HIGH [B2]

## Inter-Document Relationship Network

```mermaid
%%{init: {"theme": "dark", "themeVariables": {"primaryColor": "#00d9ff", "primaryTextColor": "#e0e0e0", "lineColor": "#ffbe0b"}}}%%
graph TD
    SFU28["HD01SfU28\nCitizenship\n🔴 TIER-1"]
    FOU20["HD01FöU20\nCER Directive\n🔴 TIER-1"]
    FOU14["HD01FöU14\nMilitary Coop\n🔴 TIER-1"]
    UBU17["HD01UbU17\nYrkeshögskola\n🟡 TIER-2"]
    SKU22["HD01SkU22\nVAT Fraud\n🟡 TIER-2"]
    SOU27["HD01SoU27\nSocial Data\n🟡 TIER-2"]
    SKU21["HD01SkU21\nTax Liability\n🟡 TIER-2"]
    FIU44["HD01FiU44\nESAP\n🟡 TIER-2"]

    SECCLUSTER["Security Cluster\nHD01FöU20 + HD01FöU14"]
    TAXCLUSTER["Tax/Finance Cluster\nHD01SkU22 + HD01SkU21 + HD01FiU44"]
    GOVCLUSTER["Governance Cluster\nHD01SoU27 + HD01UbU17"]

    SFU28 -->|"electoral signal"| FOU20
    FOU20 <-->|"security interdependence"| FOU14
    FOU14 -->|"NATO integration"| FOU20
    SKU22 <-->|"fiscal admin cluster"| SKU21
    SKU22 <-->|"EU financial data"| FIU44
    SOU27 <-->|"data governance"| UBU17

    SECCLUSTER --> SFU28
    TAXCLUSTER --> FIU44
    GOVCLUSTER --> SOU27

    style SFU28 fill:#6b0f1a,color:#fff
    style FOU20 fill:#0a4060,color:#fff
    style FOU14 fill:#0a4060,color:#fff
    style SKU22 fill:#3d2b00,color:#fff
    style SKU21 fill:#3d2b00,color:#fff
    style FIU44 fill:#3d2b00,color:#fff
    style SOU27 fill:#1a3d5c,color:#fff
    style UBU17 fill:#1a3d5c,color:#fff
```

## Thematic Clusters

### Cluster A — National Security & Defence (HD01FöU20, HD01FöU14)
**Link type**: STRONG — both advance Sweden's post-NATO-accession security architecture  
**Shared prop/bills**: Both "planerat" status — coordinated rollout planned for autumn 2026 riksmöte  
**Policy coherence score**: HIGH — complementary instruments for resilience + operational capability

### Cluster B — Fiscal/Tax (HD01SkU22, HD01SkU21, HD01FiU44)
**Link type**: STRONG — all three advance fiscal governance modernisation  
**Shared committee**: SkU handles both SkU22 and SkU21 (same committee chair)  
**EU alignment**: SkU22 (VAT directive), FiU44 (ESAP regulation) — both EU-mandated; SkU21 national  
**Policy coherence score**: HIGH — unified fiscal reliability signal

### Cluster C — Social/Data Governance (HD01SoU27, HD01UbU17)
**Link type**: MODERATE — both involve institutional data and governance requirements  
**Distinction**: SoU27 mandates data sharing (social sector); UbU17 mandates governance structures (education sector)  
**Policy coherence score**: MEDIUM — sectoral parallel rather than integrated policy

### Cluster D — Citizenship/Integration (HD01SfU28 standalone)
**Link type**: WEAK external links to Cluster B (income criteria overlap with tax records)  
**Policy coherence score**: STANDALONE — politically distinct, high-salience single-document cluster

## Citation Cross-Reference Table

| Source dok_id | Referenced by | Reference type | Details |
|--------------|---------------|---------------|---------|
| Prop 2025/26:175 | HD01SfU28 | Parent proposition | Citizenship requirements bill |
| Prop 2025/26:173 | HD01UbU17 | Parent proposition | Yrkeshögskola bill |
| Prop 2025/26:128 | HD01SkU22 | Parent proposition | VAT fraud measures bill |
| Prop 2025/26:165 | HD01SoU27 | Parent proposition | Social data registry bill |
| CER Directive 2022/2557 | HD01FöU20 | EU directive transposition | Critical entities resilience |
| ESAP Regulation | HD01FiU44 | EU regulation transposition | European single access point |
| NATO SOFA Agreement | HD01FöU14 | International framework | Military cooperation legal basis |
