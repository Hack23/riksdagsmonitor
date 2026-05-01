# Election Cycle Analysis — Alias

> **This file is a filename alias.** The canonical template is [`election-2026-analysis.md`](election-2026-analysis.md).

Both filenames resolve to the same cycle-parameterised template. The `election-2026-analysis.md` name is retained for backward compatibility with ~50 existing run folders. Post-rollover (after 2026-09-13), workflows write `election-cycle-analysis.md` as the canonical output filename.

**Aliasing is handled by:**
- `scripts/render-lib/aggregator/order.ts` → `FILENAME_ALIASES` (de-duplicates at render time)
- `.github/prompts/04-analysis-pipeline.md` → §Filename variants
- Documentation note: `analysis/methodologies/artifact-catalog.md` may lag filename-alias updates and is not the authoritative source for this alias

**Cycle-anchor resolution:** `scripts/horizon-context.ts` → `activeCycleAnchor(articleDate)` determines whether the template renders with `cycleAnchor=current` (pre-election / incumbent mandate) or `cycleAnchor=next` (post-election / formation phase).
