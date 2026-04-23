# Cross-Reference Map — Committee Reports 2026-04-23

**Methodology**: `analysis/methodologies/structural-metadata-methodology.md`
**Analyst**: James Pether Sörling | **Date**: 2026-04-23

## Policy Clusters

### Cluster 1: Election-Year Fiscal and Energy Policy
- **Primary**: HD01FiU48 (Extra ändringsbudget)
- **Related**: HD01MJU21 (agricultural energy/climate — MJU scrutiny), HD01MJU19 (waste/circular economy EU compliance)
- **Tension**: FiU48 fuel tax cuts vs. MJU19/MJU21 environmental ambition
- **Theme**: Household economics vs. long-term climate policy trade-off

### Cluster 2: Constitutional Modernization Package
- **Primary**: HD01KU33 (TF — beslag/husrannsakan digital insyn)
- **Related**: HD01KU32 (TF+YGL — tillgänglighetskrav medier)
- **Link**: Both are vilande grundlagsändringar decided in same KU session; both require post-election second vote
- **Theme**: Digital-era constitutional adaptation — crime-fighting efficiency × fundamental freedoms

### Cluster 3: Housing Market Transparency and Anti-Crime
- **Primary**: HD01CU27 (Identitetskrav lagfart + bostadsrättslagen)
- **Related**: HD01CU28 (Nationellt bostadsrättsregister)
- **Link**: Both CU committee; complementary measures; both effective before/around election
- **Theme**: Property market integrity, anti-money laundering, consumer protection

### Cluster 4: Social Welfare and Administrative Reform
- **Primary**: HD01CU22 (Ställföreträdarskap)
- **Related**: HD01SfU20 (Föräldrapenning), HD01TU16 (Körkort)
- **Theme**: State service simplification, CRPD compliance, administrative deregulation

## Legislative Chains

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#1565C0","primaryTextColor":"#ffffff","primaryBorderColor":"#0A3F7F","lineColor":"#90CAF9","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart LR
    subgraph "Constitutional Chain"
        KU33["HD01KU33<br/>TF vilande<br/>Vote 1 of 2"]
        KU32["HD01KU32<br/>TF+YGL vilande<br/>Vote 1 of 2"]
        ELECT["Election<br/>Sep 2026"]
        VOTE2["2nd Vote<br/>Post-election"]
        KU33 --> ELECT --> VOTE2
        KU32 --> ELECT --> VOTE2
    end
    subgraph "Housing Market Chain"
        CU27["HD01CU27<br/>Identity lagfart<br/>1 Jul 2026"]
        CU28["HD01CU28<br/>Bostadsrättsregister<br/>1 Jan 2027"]
        CU27 --> CU28
    end
    subgraph "Fiscal Chain"
        FiU48["HD01FiU48<br/>Fuel cut 1 May–30 Sep 2026"]
        ENERGY["Household energy<br/>cost relief"]
        FiU48 --> ENERGY
    end

    style KU33 fill:#1565C0,color:#fff
    style KU32 fill:#1565C0,color:#fff
    style ELECT fill:#C62828,color:#fff
    style VOTE2 fill:#2E7D32,color:#fff
    style CU27 fill:#7B1FA2,color:#fff
    style CU28 fill:#7B1FA2,color:#fff
    style FiU48 fill:#E65100,color:#fff
    style ENERGY fill:#FF8F00,color:#000
```

## Coordinated Activity Patterns

The April 2026 legislative sprint shows coordinated committee scheduling:
- FiU (FiU48) + KU (KU33, KU32) + CU (CU27, CU28, CU22) all reporting in the same week of 17–21 April 2026
- Pattern: Government tabling and committee approval synchronized for maximum legislative throughput before the summer recess and election campaign
- This is not unusual: the spring riksmöte sprint is standard, but the political salience of this year's package is higher than typical due to election-year timing

## Sibling Folder Citations

No sibling analysis folders present for this date (first run). Future Tier-C aggregation should reference:
- `analysis/daily/2026-04-23/propositions/` if props workflow runs same day
- `analysis/daily/2026-04-23/evening-analysis/` for synthesis integration
