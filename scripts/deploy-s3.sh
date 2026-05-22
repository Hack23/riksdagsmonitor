#!/usr/bin/env bash
# S3 Deployment Script for Riksdagsmonitor
#
# Uploads site assets to S3 with correct MIME types and cache headers.
# Shared by deploy-s3.yml (push to main) and release.yml workflows.
#
# Uses `aws s3 sync` per file-type group so that only NEW or CHANGED files
# are uploaded.  This dramatically reduces S3 API calls (and CloudTrail
# PutObject events) compared to the previous `cp --recursive` approach which
# unconditionally uploaded every file on every deploy.
#
# Strategy:
#   1. Per-type `sync` passes upload only changed files with correct
#      Content-Type and Cache-Control from the start.
#      - Immutable hashed assets use --size-only (safe: content hash in filename)
#      - Mutable assets (HTML, metadata) use default size+mtime comparison
#   2. A final `sync --delete --size-only` pass removes orphaned S3 objects
#      without re-uploading anything (all files already handled above).
#   3. Cache-busting overrides for sw.js / manifests / styles.css run last.
#
# Existing objects already on S3 are assumed to have correct MIME types and
# cache headers (fixed by the one-time fix-s3-mimetypes.sh run).  If this
# assumption is ever invalidated, run: workflow_dispatch → fix_mimetypes=true
# to re-apply correct metadata to all existing objects.
#
# Usage: scripts/deploy-s3.sh <source-dir> <s3-bucket-url>
#   source-dir:    local directory containing the built site (e.g. "dist" or ".")
#   s3-bucket-url: full S3 URL including protocol (e.g. "s3://bucket-name")
#
# @author Hack23 AB
# @license Apache-2.0
set -euo pipefail

SRC="${1:?Usage: deploy-s3.sh <source-dir> <s3-bucket-url>}"
BUCKET="${2:?Usage: deploy-s3.sh <source-dir> <s3-bucket-url>}"

# Directories that must never be uploaded
SKIP=(
  --exclude '.git/*'
  --exclude 'screenshots/*'
  --exclude 'node_modules/*'
  --exclude 'artifacts/*'
  --exclude 'tests/*'
  --exclude 'cypress/*'
  --exclude '.github/*'
  --exclude 'schemas/*'
  --exclude 'scripts/*'
  --exclude '.devcontainer/*'
  --exclude 'quicksight/*'
  --exclude 'src/*'
  --exclude 'builds/*'
)

echo "🚀 Deploying $SRC → $BUCKET"

# ── Per-type sync passes: upload only changed files with correct headers ──
#
# Comparison strategy:
#   - Hashed assets (CSS/JS/images/fonts/maps/wasm): use --size-only.
#     Vite includes a content hash in the filename, so any content change
#     produces a new S3 key.  Same-size-different-content is impossible.
#   - Non-hashed assets (HTML, XML, JSON, TXT, etc.): use default comparison
#     (size + last-modified).  This ensures same-size content changes are
#     detected.  Fresh builds will re-upload these files, but correctness
#     trumps efficiency for mutable content.

# HTML files - short cache, must-revalidate
# No --size-only: ensures same-size HTML edits are always uploaded.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.html' \
  --no-guess-mime-type --content-type 'text/html; charset=utf-8' \
  --cache-control 'public, max-age=3600, must-revalidate' \
  "${SKIP[@]}"

# CSS files - long cache, immutable (hashed Vite bundles)
# --size-only is safe: Vite content-hashes filenames; any change → new key.
# Excludes the canonical `assets/styles.css` (stable, non-hashed URL —
# see vite.config.js) which gets cache-busting override below.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.css' \
  --exclude 'styles.css' --exclude 'assets/styles.css' \
  --no-guess-mime-type --content-type 'text/css' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# JS/MJS files - long cache, immutable (hashed Vite bundles)
# --size-only is safe: Vite content-hashes filenames; any change → new key.
# Excludes sw.js which gets cache-busting override below.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.js' --include '*.mjs' \
  --exclude 'sw.js' \
  --no-guess-mime-type --content-type 'application/javascript' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# Image files - long cache, immutable.
# Use explicit Content-Type per format so optimized WebP/AVIF variants and
# favicons never depend on AWS CLI MIME guessing.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.webp' \
  --no-guess-mime-type --content-type 'image/webp' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.avif' \
  --no-guess-mime-type --content-type 'image/avif' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.png' \
  --no-guess-mime-type --content-type 'image/png' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.jpg' --include '*.jpeg' \
  --no-guess-mime-type --content-type 'image/jpeg' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.gif' \
  --no-guess-mime-type --content-type 'image/gif' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.svg' \
  --no-guess-mime-type --content-type 'image/svg+xml' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.ico' \
  --no-guess-mime-type --content-type 'image/x-icon' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# Font files - long cache, immutable
# --size-only is safe: fonts are static vendored assets.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' \
  --include '*.woff2' --include '*.woff' --include '*.ttf' \
  --include '*.eot' --include '*.otf' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# Source maps + WebAssembly - long cache, immutable
# --size-only is safe: these are Vite content-hashed.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.map' --include '*.wasm' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# Metadata files - medium cache (1 day)
# No --size-only: mutable files (sitemaps, RSS, JSON-LD) must always reflect
# latest content even if byte size happens to stay the same.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' \
  --include '*.xml' --include '*.json' --include '*.txt' --include '*.csv' \
  --include '*.pdf' --include '*.md' --include '*.webmanifest' \
  --cache-control 'public, max-age=86400' \
  "${SKIP[@]}"

echo "✅ Per-type sync complete (only changed files uploaded)"

# ── Mermaid runtime: unconditional cp --recursive ────────────────────
# The per-type `aws s3 sync --include '*.mjs' --size-only` block above
# has been observed to silently skip the deeply-nested chunk files
# under `dist/js/lib/mermaid/chunks/mermaid.esm.min/` even when those
# keys are missing from the bucket (deploy run 26294355929: zero .mjs
# uploads despite 82 chunks present in dist). The result is that every
# article page that embeds Mermaid diagrams fails to render with
# `Failed to fetch dynamically imported module: …/mermaid.esm.min.mjs`
# in the browser console — the entry module loads OK, but its internal
# imports of `./chunks/mermaid.esm.min/chunk-*.mjs` 404, and the
# browser surfaces the failure against the top-level URL.
#
# `aws s3 cp --recursive` is unconditional (no size-vs-mtime compare —
# always uploads), so it guarantees correctness regardless of why
# `aws s3 sync` decided the chunks were "already in sync". The mermaid
# runtime is small (~2.6 MB across ~82 chunks) and only changes when
# the pinned `mermaid` devDependency is bumped in `package.json`, so
# the extra always-upload cost is negligible compared to the cost of
# articles silently rendering without diagrams.
#
# Placed AFTER per-type sync (so the cache-control / content-type
# headers we set here are the ones that survive) and BEFORE orphan
# cleanup (so the cleanup pass sees our just-uploaded keys as
# already-in-sync and does not consider them orphans).
if [ -d "$SRC/js/lib/mermaid" ]; then
  echo "🎨 Force-uploading Mermaid runtime → $BUCKET/js/lib/mermaid/"
  aws s3 cp "$SRC/js/lib/mermaid" "$BUCKET/js/lib/mermaid" \
    --recursive \
    --exclude '*' --include '*.mjs' \
    --no-guess-mime-type --content-type 'application/javascript' \
    --cache-control 'public, max-age=31536000, immutable'
  echo "✅ Mermaid runtime upload command completed"

  # ── HARD per-chunk verification ────────────────────────────────────
  # `aws s3 cp --recursive` prints `upload: …` per file but its overall
  # exit code is the ONLY signal of failure; individual key durability
  # is NOT re-checked. Production runs 1882 + 1883 logged "upload: …"
  # for every chunk yet CloudFront subsequently returned 403 for every
  # chunk (S3 `<Code>AccessDenied</Code>` body — with OAC, missing keys
  # surface as 403 not 404). The asymmetric symptom (entry .mjs = 200,
  # every `chunks/mermaid.esm.min/*.mjs` = 403) only makes sense if
  # those keys never actually landed in S3.
  #
  # Re-verify durability with `aws s3api head-object` per key. This is
  # ~80 cheap HEAD calls (well under 1s in total for the runner) and
  # turns silent CDN-only failures into a HARD deploy failure with the
  # exact list of missing keys + a one-shot retry attempt for each.
  BUCKET_NAME="${BUCKET#s3://}"
  BUCKET_NAME="${BUCKET_NAME%%/*}"
  echo "🔍 Verifying every Mermaid .mjs key landed in s3://$BUCKET_NAME/…"
  MISSING_KEYS=()
  while IFS= read -r -d '' LOCAL; do
    REL="${LOCAL#"$SRC"/}"
    if ! aws s3api head-object \
        --bucket "$BUCKET_NAME" --key "$REL" >/dev/null 2>&1; then
      MISSING_KEYS+=("$REL")
    fi
  done < <(find "$SRC/js/lib/mermaid" -name '*.mjs' -type f -print0)

  if [ "${#MISSING_KEYS[@]}" -gt 0 ]; then
    echo "⚠️  ${#MISSING_KEYS[@]} Mermaid chunk(s) MISSING from S3 after force-upload:"
    printf '   - %s\n' "${MISSING_KEYS[@]}"
    echo "🔁 Retrying each missing key individually with explicit put-object…"
    STILL_MISSING=()
    for REL in "${MISSING_KEYS[@]}"; do
      aws s3 cp "$SRC/$REL" "s3://$BUCKET_NAME/$REL" \
        --no-guess-mime-type --content-type 'application/javascript' \
        --cache-control 'public, max-age=31536000, immutable' \
        --only-show-errors || true
      if ! aws s3api head-object \
          --bucket "$BUCKET_NAME" --key "$REL" >/dev/null 2>&1; then
        STILL_MISSING+=("$REL")
      fi
    done
    if [ "${#STILL_MISSING[@]}" -gt 0 ]; then
      echo "❌ ${#STILL_MISSING[@]} Mermaid chunk(s) still missing from S3 after retry:"
      printf '   - %s\n' "${STILL_MISSING[@]}"
      echo "    Bucket listing of chunks prefix follows (truncated to 200 lines):"
      aws s3 ls "s3://$BUCKET_NAME/js/lib/mermaid/" --recursive | head -200 || true
      exit 1
    fi
    echo "✅ Retry succeeded — all previously-missing chunks are now in S3"
  fi

  # Ground-truth bucket listing for the chunks prefix — single source
  # of truth in deploy logs, regardless of upload exit codes.
  CHUNK_S3_COUNT=$(aws s3 ls \
    "s3://$BUCKET_NAME/js/lib/mermaid/chunks/mermaid.esm.min/" \
    --recursive 2>/dev/null | grep -c '\.mjs$' || true)
  CHUNK_LOCAL_COUNT=$(find \
    "$SRC/js/lib/mermaid/chunks/mermaid.esm.min" \
    -name '*.mjs' -type f 2>/dev/null | wc -l)
  echo "📊 Mermaid chunks in S3: $CHUNK_S3_COUNT (local: $CHUNK_LOCAL_COUNT)"
  if [ "$CHUNK_S3_COUNT" -lt "$CHUNK_LOCAL_COUNT" ]; then
    echo "❌ S3 chunk count ($CHUNK_S3_COUNT) is below local count ($CHUNK_LOCAL_COUNT)"
    exit 1
  fi
  echo "✅ Mermaid runtime upload verified — entry + $CHUNK_S3_COUNT chunks live on S3"
fi

# ── Delete orphaned objects from S3 ──
# A final sync --delete pass removes files that no longer exist locally.
# --size-only ensures it does NOT re-upload files already handled above.
aws s3 sync "$SRC" "$BUCKET" --delete --size-only \
  "${SKIP[@]}"

echo "✅ Orphan cleanup complete"

# ── Cache-busting overrides for files that MUST update on every push ──
# These always upload unconditionally to ensure the browser/CDN never serves
# stale versions of critical control files.
#
# WHY THIS MATTERS:
#   - `sw.js` carries a per-build BUILD_ID — stale sw.js means the browser
#     never detects a service-worker update.
#   - PWA manifests are refetched during install/update; stale manifests
#     block PWA-shortcut and screenshot rotation.
#   - `assets/styles.css` is the canonical, stable-URL stylesheet (see
#     vite.config.js — explicitly NOT content-hashed so external consumers
#     and cached HTML pages can rely on a single forever URL). Cache-busted
#     with `must-revalidate` so browsers re-validate via ETag on every
#     navigation.
#   - Root `styles.css` is a legacy fallback referenced by older builds —
#     overridden when present, no-op when absent.

if [ -f "$SRC/sw.js" ]; then
  aws s3 cp "$SRC/sw.js" "$BUCKET/sw.js" \
    --no-guess-mime-type --content-type 'application/javascript' \
    --cache-control 'no-cache, no-store, must-revalidate'
fi

for MANIFEST in site.webmanifest manifest.json; do
  if [ -f "$SRC/$MANIFEST" ]; then
    aws s3 cp "$SRC/$MANIFEST" "$BUCKET/$MANIFEST" \
      --no-guess-mime-type --content-type 'application/manifest+json' \
      --cache-control 'public, max-age=300, must-revalidate'
  fi
done

if [ -f "$SRC/assets/styles.css" ]; then
  aws s3 cp "$SRC/assets/styles.css" "$BUCKET/assets/styles.css" \
    --no-guess-mime-type --content-type 'text/css' \
    --cache-control 'public, max-age=3600, must-revalidate'
fi

if [ -f "$SRC/styles.css" ]; then
  aws s3 cp "$SRC/styles.css" "$BUCKET/styles.css" \
    --no-guess-mime-type --content-type 'text/css' \
    --cache-control 'public, max-age=3600, must-revalidate'
fi

echo "✅ S3 deployment completed"
