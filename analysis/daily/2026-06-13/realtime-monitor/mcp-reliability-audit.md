# MCP Reliability Audit — Realtime Monitor 2026-06-13

## Status

- Riksdag/Regering sync: live
- Calendar API: degraded, returned HTML instead of JSON
- IMF WEO pre-warm: degraded after retries

## Impact

- The realtime feed was still sufficient for a full parliamentary pulse.
- No evidence gap forced a no-op.

## Note

The calendar failure is a source limitation, not an analysis failure.

