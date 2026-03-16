#!/usr/bin/env bash
# S3 Deployment Script for Riksdagsmonitor
#
# Uploads site assets to S3 with correct MIME types and cache headers.
# Shared by deploy-s3.yml (push to main) and release.yml workflows.
#
# Uses `aws s3 cp --recursive` (not sync) for type-specific passes so that
# Content-Type metadata is always set correctly — even on objects that already
# exist on S3 with stale / wrong MIME types (sync skips unchanged files and
# would never fix their metadata).
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
  --exclude '.git/*' --exclude 'screenshots/*' --exclude 'node_modules/*'
  --exclude 'artifacts/*' --exclude 'tests/*' --exclude 'cypress/*'
  --exclude '.github/*' --exclude 'schemas/*' --exclude 'scripts/*'
  --exclude '.devcontainer/*' --exclude 'quicksight/*' --exclude 'src/*'
  --exclude 'builds/*'
)

echo "🚀 Deploying $SRC → $BUCKET"

# ── Main site assets (exclude docs/ — handled separately below) ──
# cp --recursive always uploads every matched file, ensuring Content-Type
# metadata is set correctly even if the file content has not changed.

# HTML files - short cache, must-revalidate
aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.html' \
  --no-guess-mime-type --content-type 'text/html; charset=utf-8' \
  --cache-control 'public, max-age=3600, must-revalidate' \
  "${SKIP[@]}" --exclude 'docs/*'

# CSS files - long cache, immutable (hashed Vite bundles)
aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.css' \
  --no-guess-mime-type --content-type 'text/css' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

# JS files - long cache, immutable (hashed Vite bundles)
aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.js' \
  --no-guess-mime-type --content-type 'application/javascript' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

# Image files — each format gets its own explicit MIME type
aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.webp' \
  --no-guess-mime-type --content-type 'image/webp' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.png' \
  --no-guess-mime-type --content-type 'image/png' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.jpg' --include '*.jpeg' \
  --no-guess-mime-type --content-type 'image/jpeg' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.gif' \
  --no-guess-mime-type --content-type 'image/gif' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.svg' \
  --no-guess-mime-type --content-type 'image/svg+xml' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.ico' \
  --no-guess-mime-type --content-type 'image/x-icon' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

# Font files - long cache, immutable
aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.woff2' \
  --no-guess-mime-type --content-type 'font/woff2' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.woff' \
  --no-guess-mime-type --content-type 'font/woff' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.ttf' \
  --no-guess-mime-type --content-type 'font/ttf' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.eot' \
  --no-guess-mime-type --content-type 'application/vnd.ms-fontobject' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.otf' \
  --no-guess-mime-type --content-type 'font/otf' \
  --cache-control 'public, max-age=31536000, immutable' \
  "${SKIP[@]}" --exclude 'docs/*'

# Metadata files - medium cache (1 day)
aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.xml' \
  --no-guess-mime-type --content-type 'application/xml' \
  --cache-control 'public, max-age=86400' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.json' \
  --no-guess-mime-type --content-type 'application/json' \
  --cache-control 'public, max-age=86400' \
  "${SKIP[@]}" --exclude 'docs/*'

aws s3 cp "$SRC" "$BUCKET" --recursive \
  --exclude '*' --include '*.txt' \
  --no-guess-mime-type --content-type 'text/plain' \
  --cache-control 'public, max-age=86400' \
  "${SKIP[@]}" --exclude 'docs/*'

# ── Documentation directory (coverage, test-results, API docs) ──
# Docs are regenerated each release so they use shorter cache TTLs.
# Every format gets an explicit MIME type to fix broken existing objects.

if [ -d "$SRC/docs" ]; then
  echo "📚 Deploying docs/ with explicit MIME types..."

  # Docs - HTML
  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.html' \
    --no-guess-mime-type --content-type 'text/html; charset=utf-8' \
    --cache-control 'public, max-age=86400, must-revalidate'

  # Docs - CSS
  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.css' \
    --no-guess-mime-type --content-type 'text/css' \
    --cache-control 'public, max-age=86400'

  # Docs - JS
  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.js' \
    --no-guess-mime-type --content-type 'application/javascript' \
    --cache-control 'public, max-age=86400'

  # Docs - Images (one command per format for correct MIME type)
  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.png' \
    --no-guess-mime-type --content-type 'image/png' \
    --cache-control 'public, max-age=86400'

  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.gif' \
    --no-guess-mime-type --content-type 'image/gif' \
    --cache-control 'public, max-age=86400'

  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.svg' \
    --no-guess-mime-type --content-type 'image/svg+xml' \
    --cache-control 'public, max-age=86400'

  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.ico' \
    --no-guess-mime-type --content-type 'image/x-icon' \
    --cache-control 'public, max-age=86400'

  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.jpg' --include '*.jpeg' \
    --no-guess-mime-type --content-type 'image/jpeg' \
    --cache-control 'public, max-age=86400'

  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.webp' \
    --no-guess-mime-type --content-type 'image/webp' \
    --cache-control 'public, max-age=86400'

  # Docs - Data files
  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.json' \
    --no-guess-mime-type --content-type 'application/json' \
    --cache-control 'public, max-age=86400'

  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.xml' \
    --no-guess-mime-type --content-type 'application/xml' \
    --cache-control 'public, max-age=86400'

  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.txt' \
    --no-guess-mime-type --content-type 'text/plain' \
    --cache-control 'public, max-age=86400'

  # Docs - Fonts
  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.woff2' \
    --no-guess-mime-type --content-type 'font/woff2' \
    --cache-control 'public, max-age=86400'

  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.woff' \
    --no-guess-mime-type --content-type 'font/woff' \
    --cache-control 'public, max-age=86400'

  # Docs - Source maps
  aws s3 cp "$SRC/docs" "$BUCKET/docs" --recursive \
    --exclude '*' --include '*.map' \
    --no-guess-mime-type --content-type 'application/json' \
    --cache-control 'public, max-age=86400'

  echo "✅ Docs deployed with correct MIME types"
else
  echo "ℹ️ No docs directory found at $SRC/docs, skipping docs deployment"
fi

echo "✅ S3 deployment completed"
