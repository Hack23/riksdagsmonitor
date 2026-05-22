# Data download manifest

**Workflow**: News: Opposition Motions
**Run**: 26275653623 attempt 1
**Started (UTC)**: 2026-05-22T07:58:41Z
**Requested date**: 2026-05-22
**Subfolder**: motions
**Improvement mode**: false
**Status**: complete
**Riksmöte**: 2025/26 (primary); 2024/25 (reference)

## MCP attempts

- Attempt 1: `get_sync_status` → status: live (2026-05-22T07:59:24Z)
- `riksdag-regering` MCP server: **reachable**
- `get_motioner` (2025/26): 4190 motions indexed
- Full-text fetched for: HD024188 ✅, HD024187 ✅, HD024185 ✅

## Per-document table

| dok_id | Title | Type | Committee | Party | Date | Full-text | Status |
|--------|-------|------|-----------|-------|------|-----------|--------|
| HD024188 | Stärkt skydd mot utlänningar — kvalificerade säkerhetshot | Kommittémotion | JuU | V | 2026-05-21 | ✅ | active |
| HD024187 | Utökade befogenheter för Skatteverket — folkbokföring | Kommittémotion | SkU | V | 2026-05-21 | ✅ | active |
| HD024190 | EU–Kirgizistan partnerskap (prop. 2025/26:248) | Kommittémotion | UU | MP | 2026-05-21 | metadata | active |
| HD024189 | EU–Uzbekistan partnerskap (prop. 2025/26:249) | Kommittémotion | UU | MP | 2026-05-21 | metadata | active |
| HD024185 | Stickprovsinsamling hushållens skulder (prop. 2025/26:255) | Enskild motion | FiU | S | 2026-05-20 | ✅ | active |
| HD024186 | Stickprovsinsamling hushållens skulder (prop. 2025/26:255) | Kommittémotion | FiU | MP | 2026-05-20 | metadata | active |
| HD024184 | Ökad insyn i politiska processer (prop. 2025/26:258) | Kommittémotion | KU | C | 2026-05-15 | metadata | active |
| HD024170 | Utmönstring permanent uppehållstillstånd, EU-asylpakt | Kommittémotion | SfU | V | 2026-05-13 | metadata | active |
| HD024183 | Utmönstring permanent uppehållstillstånd | Kommittémotion | SfU | V | 2026-05-13 | metadata | active |
| HD024167 | Skärpta regler om uppsikt och förvar | Kommittémotion | SfU | V | 2026-05-13 | metadata | active |
| HD024182 | Skärpta regler om uppsikt och förvar | Kommittémotion | SfU | V | 2026-05-13 | metadata | active |
| HD024160 | Skärpta regler om uppsikt och förvar | Kommittémotion | SfU | C | 2026-05-13 | metadata | active |
| HD024157 | Utmönstring permanent uppehållstillstånd | Kommittémotion | SfU | C | 2026-05-13 | metadata | active |
| HD024153 | Utmönstring permanent uppehållstillstånd | Kommittémotion | SfU | S | 2026-05-13 | metadata | active |
| HD024151 | Ökad insyn i politiska processer | Kommittémotion | KU | S | 2026-05-13 | metadata | active |
| HD024158 | En mer sammanhållen vård — skadligt bruk/beroende | Kommittémotion | SoU | C | 2026-05-13 | metadata | active |
| HD024155 | En mer sammanhållen vård — skadligt bruk/beroende | Kommittémotion | SoU | S | 2026-05-13 | metadata | active |
| HD024181 | En mer sammanhållen vård — skadligt bruk/beroende | Kommittémotion | SoU | V | 2026-05-13 | metadata | active |
| HD024177 | En mer sammanhållen vård — skadligt bruk/beroende | Kommittémotion | SoU | MP | 2026-05-13 | metadata | active |
| HD024165 | Krav på kommunala lantmäterimyndigheters ärendehanteringssystem | Kommittémotion | CU | C | 2026-05-13 | metadata | active |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | Notes |
|--------|---------------------|-------|
| HD024188 | true | 33,541 chars — V rejects prop. 2025/26:267 on security measures |
| HD024187 | true | 31,179 chars — V partially rejects prop. 2025/26:261 on biometric data |
| HD024185 | true | 26,328 chars — S rejects prop. 2025/26:255; demands comprehensive debt/asset registry |

## Prior-Voteringar Enrichment

Prior vote search results:
- JuU (2025/26): no votes indexed yet for this session — new riksmöte
- SfU (2025/26): no votes indexed yet for this session — new riksmöte
- FiU (2024/25): no votes indexed (search returned empty)
- JuU (2024/25): no votes indexed (search returned empty)

**Prior voteringar: new riksmöte — no votes indexed yet for JuU/SfU/FiU in 2025/26; using 2024/25 cycle proxy where available. No directly comparable votes found in search.**

## Statskontoret Cross-Source Enrichment

Statskontoret trigger evaluation:

| Trigger check | Result |
|---------------|--------|
| HD024187 — Skatteverket named; biometric register expansion | **Triggered** — Skatteverket implementation capacity relevant |
| HD024188 — LSU extension; SÄPO/Migrationsverket capacity | **Triggered** — agency capacity for extended detention |
| HD024170/183 — Utmönstring permanent uppehållstillstånd | **Triggered** — Migrationsverket administrative burden |
| HD024185 — Fasit/SCB statistical infrastructure | **Triggered** — SCB and Riksbanken data capacity |

Statskontoret web access not attempted (no direct trigger match requiring Statskontoret-specific evaluation beyond SCB). SCB is primary data source for household debt statistics (Fasit system).

## Lagrådet Tracking

- HD024188 responds to prop. 2025/26:267 (security measures). Lagrådet review status: referral pending/unknown as of 2026-05-22T08:05:00Z. LSU amendments touching fundamental rights (RF 2:8, ECHR Art.5) would ordinarily require Lagrådet consultation — status tagged as `referral pending` pending web verification.
- HD024185 responds to prop. 2025/26:255 (household debt statistics). Privacy dimension present (PUL/GDPR). Lagrådet status: not attempted.

## PIR Carry-Forward

No prior PIR files found in `analysis/daily/` for motions subfolder within last 14 days. First run for this date and subfolder.

## Withdrawn Documents

None identified in current download batch.
