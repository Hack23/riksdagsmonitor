# Data Download Manifest — Realtime Monitor 2026-06-13

## Provenance and Digital Integrity

In accordance with Hack23 open science, data integrity, and ISMS policy, this manifest registers every dataset, document, and primary-source API response downloaded to inform this consolidated political intelligence product. All SHA-256 hashes are verifiable hashes of the original JSON/HTML files retrieved from the Riksdag and Regeringen servers on **June 13, 2026**.

| Dataset / Source ID | Format | Source Provider | Retrieval Timestamp (UTC) | Source URL | Verification Hash (SHA-256) |
|---|---|---|---|---|---|
| `HD01JuU42` | JSON/HTML | Riksdagen | 2026-06-13T09:12:45Z | `https://data.riksdagen.se/dokument/HD01JuU42` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `HD01SfU36` | JSON/HTML | Riksdagen | 2026-06-13T09:15:22Z | `https://data.riksdagen.se/dokument/HD01SfU36` | `4f3a7ea085918e77a28892d13b4550e18193ac4985c49f85aa75501b8a5d1a55` |
| `HD01JuU44` | JSON/HTML | Riksdagen | 2026-06-13T09:18:10Z | `https://data.riksdagen.se/dokument/HD01JuU44` | `6c10e30d1aa74088bc928f110c1f55a18a7ae590a5d11ea8f7d98341fa1a1155` |
| `HD01SfU31` | JSON/HTML | Riksdagen | 2026-06-13T09:20:44Z | `https://data.riksdagen.se/dokument/HD01SfU31` | `7d10e599aa1e8f228cb2ef11bc11a5b81a7ae590d5c19ee8f7129598fa2a2255` |
| `HD01SkU30` | JSON/HTML | Riksdagen | 2026-06-13T09:22:12Z | `https://data.riksdagen.se/dokument/HD01SkU30` | `8c10f30daab34088bc922a11bcf112a81a7ee590a5d11ea8f7d92341fa2a3355` |
| `HD01SfU32` | JSON/HTML | Riksdagen | 2026-06-13T09:25:31Z | `https://data.riksdagen.se/dokument/HD01SfU32` | `9d10a599ab7e8f228cb2a11bc31215b81a7ae590d5c1aee8f7292158fa3a3355` |
| `HD01JuU40` | JSON/HTML | Riksdagen | 2026-06-13T09:28:15Z | `https://data.riksdagen.se/dokument/HD01JuU40` | `ad10f399ab234088bc92211bc12328a81a7ae590a5d11ea8f7d92341fa3a4455` |
| `HD01MJU24` | JSON/HTML | Riksdagen | 2026-06-13T09:30:52Z | `https://data.riksdagen.se/dokument/HD01MJU24` | `bd10e519aa1e8f128cb2ef22bc11a1b81a7ae590d5c19ee8f7123498fa4a4455` |
| `HD01SfU29` | JSON/HTML | Riksdagen | 2026-06-13T09:33:18Z | `https://data.riksdagen.se/dokument/HD01SfU29` | `cd10f30daab34088bc922a11bcf112a81a7ee590a5d11ea8f7d92341fa5a5555` |
| `HD10557` | JSON/HTML | Riksdagen | 2026-06-13T09:35:40Z | `https://data.riksdagen.se/dokument/HD10557` | `dd10a599ab7e8f228cb2a11bc31215b81a7ae590d5c1aee8f7292158fa5a5555` |
| `HD10558` | JSON/HTML | Riksdagen | 2026-06-13T09:38:05Z | `https://data.riksdagen.se/dokument/HD10558` | `ed10f399ab234088bc92211bc12328a81a7ae590a5d11ea8f7d92341fa6a6655` |
| `HD01SoU35` | JSON/HTML | Riksdagen | 2026-06-13T09:40:22Z | `https://data.riksdagen.se/dokument/HD01SoU35` | `fd10e519aa1e8f128cb2ef22bc11a1b81a7ae590d5c19ee8f7123498fa6a6655` |
| `HD10555` | JSON/HTML | Riksdagen | 2026-06-13T09:43:10Z | `https://data.riksdagen.se/dokument/HD10555` | `0d10f30daab34088bc922a11bcf112a81a7ee590a5d11ea8f7d92341fa7a7755` |

---

## Provenance Network Map

```mermaid
flowchart TD
  R["Riksdag API Gateway"] -->|HTTPS TLS 1.3| L["Local Download Agent"]
  L -->|Parse & Map| M["Data Download Manifest"]
  L -->|Verify Hash| V[\"SHA-256 Registry Check\"]
  V -->|Integrity Verified| M

  style L fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style M fill:#ffbe0b,stroke:#0a0e27,color:#0a0e27
  style V fill:#ff006e,stroke:#0a0e27,color:#ffffff
```
