<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">⚖️ Lagrådet / Statskontoret / SKR Tracking Fragment</h1>

> Reusable fragment for `methodology-reflection.md` and implementation-oriented artifacts.

## Required fields

| Field | Allowed values | Notes |
|------|-----------------|-------|
| `lagradet_status` | `not applicable` · `referral pending` · `yttrande published` | Include URL + date if published |
| `statskontoret_status` | `not triggered` · `none found` · `found` | Include `statskontoret.se` URL when found |
| `skr_status` | `not triggered` · `none found` · `found` | Include `skr.se` URL when found |
| `next_check` | `YYYY-MM-DD` | Mandatory for pending/none-found statuses |
| `impact_note` | free text | Explain why status matters for KJ confidence |

## Table fragment

| Track | Applicability | Status | Latest evidence (URL + date) | Next check | Impact note |
|-------|:-------------:|--------|-------------------------------|------------|------------|
| Lagrådet yttrande | Y/N | `not applicable / referral pending / yttrande published` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |
| Statskontoret implementation signal | Y/N | `not triggered / none found / found` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |
| SKR operational impact signal | Y/N | `not triggered / none found / found` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |

---

**Document Control**
- **Template path:** `/analysis/templates/lagradet-tracking.md`
- **Referenced by:** `/analysis/templates/methodology-reflection.md`
- **Classification:** Public
