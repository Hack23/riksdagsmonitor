---
name: european-parliament-api
description: European Parliament Open Data API integration, MEP data, legislative procedures, and cross-parliament analysis
license: CC-BY-4.0
---

# European Parliament API Skill

## Purpose
Expertise in integrating European Parliament Open Data for cross-parliament political analysis alongside Swedish Riksdag data.

## Data Sources
- **EP Open Data Portal** — Legislative documents, MEP info, votes
- **EUR-Lex** — EU legislation and case law
- **Legislative Observatory (OEIL)** — Procedure tracking
- **EP Plenary** — Debates and voting records

## Key Endpoints
- `/meps` — Member of European Parliament profiles
- `/activities` — Parliamentary activities
- `/documents` — Legislative documents
- `/votes` — Plenary voting records
- `/committees` — Committee information

## Cross-Parliament Analysis
- Compare Swedish Riksdag and EP voting patterns
- Track Swedish MEP activities in Brussels
- Monitor EU legislation affecting Sweden
- Analyze party group alignments (S&D, EPP, RE, etc.)

## Integration Patterns
- REST API with JSON responses
- Pagination handling for large datasets
- Caching strategy for static data (MEP profiles)
- Rate limiting compliance
- Error handling with graceful degradation

## Data Quality
- Validate response schemas
- Handle missing or incomplete data
- Cross-reference with official sources
- Track data freshness and updates

## Related Policies
- [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
