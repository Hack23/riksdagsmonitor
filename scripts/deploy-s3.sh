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
#   1. Per-type `sync --size-only` passes upload only changed files with
#      correct Content-Type and Cache-Control from the start.
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
# Each pass uses --size-only so unchanged files generate ZERO API calls.

# HTML files - short cache, must-revalidate
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.html' \
  --no-guess-mime-type --content-type 'text/html; charset=utf-8' \
  --cache-control 'public, max-age=3600, must-revalidate' \
  --size-only \
  "${SKIP[@]}"

# CSS files - long cache, immutable (hashed Vite bundles)
# Excludes root styles.css which gets cache-busting override below.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.css' \
  --exclude 'styles.css' \
  --no-guess-mime-type --content-type 'text/css' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# JS/MJS files - long cache, immutable (hashed Vite bundles)
# Excludes sw.js which gets cache-busting override below.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.js' --include '*.mjs' \
  --exclude 'sw.js' \
  --no-guess-mime-type --content-type 'application/javascript' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# Image files - long cache, immutable
# AWS CLI correctly guesses common image types; we omit --no-guess-mime-type
# here intentionally to let it auto-detect per-extension (webp, png, jpg, gif,
# svg+xml, x-icon) since a single --content-type can't cover all formats.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' \
  --include '*.webp' --include '*.png' --include '*.jpg' --include '*.jpeg' \
  --include '*.gif' --include '*.svg' --include '*.ico' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# Font files - long cache, immutable
# AWS CLI correctly guesses woff/woff2/ttf/otf; eot may need explicit type
# but is extremely rare in practice.  Letting CLI guess is acceptable.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' \
  --include '*.woff2' --include '*.woff' --include '*.ttf' \
  --include '*.eot' --include '*.otf' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# Source maps + WebAssembly - long cache, immutable
# AWS CLI correctly guesses application/wasm; .map files get application/json
# via the CLI's built-in mimetypes database.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' --include '*.map' --include '*.wasm' \
  --cache-control 'public, max-age=31536000, immutable' \
  --size-only \
  "${SKIP[@]}"

# Metadata files - medium cache (1 day)
# Multiple formats grouped by cache policy.  AWS CLI correctly guesses MIME
# types for xml, json, txt, csv, pdf.  For .md and .webmanifest the CLI may
# not guess perfectly but these are low-traffic auxiliary files.
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '*' \
  --include '*.xml' --include '*.json' --include '*.txt' --include '*.csv' \
  --include '*.pdf' --include '*.md' --include '*.webmanifest' \
  --cache-control 'public, max-age=86400' \
  --size-only \
  "${SKIP[@]}"

echo "✅ Per-type sync complete (only changed files uploaded)"

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
#   - Root `styles.css` is a non-hashed fallback referenced by legacy pages.

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

if [ -f "$SRC/styles.css" ]; then
  aws s3 cp "$SRC/styles.css" "$BUCKET/styles.css" \
    --no-guess-mime-type --content-type 'text/css' \
    --cache-control 'public, max-age=3600, must-revalidate'
fi

echo "✅ S3 deployment completed"
