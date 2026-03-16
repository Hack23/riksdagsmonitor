#!/usr/bin/env bash
# S3 Deployment Script for Riksdagsmonitor
#
# Uploads site assets to S3 with correct MIME types and cache headers.
# Shared by deploy-s3.yml (push to main) and release.yml workflows.
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

echo "🚀 Deploying $SRC → $BUCKET"

# ── Main site assets (exclude docs/ — handled separately below) ──

# HTML files - short cache, must-revalidate
aws s3 sync "$SRC" "$BUCKET" --exclude '*' --include '*.html' \
  --cache-control 'public, max-age=3600, must-revalidate' \
  --content-type 'text/html; charset=utf-8' \
  --exclude 'screenshots/*' --exclude '.git/*' --exclude 'node_modules/*' \
  --exclude 'artifacts/*' --exclude 'tests/*' --exclude 'cypress/*' \
  --exclude 'docs/*'

# CSS files - long cache, immutable (hashed Vite bundles)
aws s3 sync "$SRC" "$BUCKET" --exclude '*' --include '*.css' \
  --cache-control 'public, max-age=31536000, immutable' \
  --content-type 'text/css' \
  --exclude 'screenshots/*' --exclude '.git/*' --exclude 'docs/*'

# JS files - long cache, immutable (hashed Vite bundles)
aws s3 sync "$SRC" "$BUCKET" --exclude '*' --include '*.js' \
  --cache-control 'public, max-age=31536000, immutable' \
  --content-type 'application/javascript' \
  --exclude 'screenshots/*' --exclude '.git/*' --exclude 'docs/*'

# Image files - long cache, immutable
aws s3 sync "$SRC" "$BUCKET" --exclude '*' \
  --include '*.webp' --include '*.png' --include '*.jpg' --include '*.jpeg' \
  --include '*.gif' --include '*.svg' --include '*.ico' \
  --cache-control 'public, max-age=31536000, immutable' \
  --exclude 'screenshots/*' --exclude '.git/*' --exclude 'docs/*'

# Font files - long cache, immutable
aws s3 sync "$SRC" "$BUCKET" --exclude '*' \
  --include '*.woff' --include '*.woff2' --include '*.ttf' --include '*.eot' --include '*.otf' \
  --cache-control 'public, max-age=31536000, immutable' \
  --exclude 'screenshots/*' --exclude '.git/*' --exclude 'docs/*'

# Metadata files - medium cache (1 day)
aws s3 sync "$SRC" "$BUCKET" --exclude '*' \
  --include '*.xml' --include '*.json' --include '*.txt' \
  --cache-control 'public, max-age=86400' \
  --exclude 'screenshots/*' --exclude '.git/*' --exclude 'docs/*'

# ── Documentation directory (coverage, test-results, API docs) ──
# Docs are regenerated each release so they use shorter cache TTLs
# and need explicit MIME types to ensure correct rendering.

if [ -d "$SRC/docs" ]; then
  echo "📚 Deploying docs/ with explicit MIME types..."

  # Docs - HTML files
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.html' \
    --cache-control 'public, max-age=86400, must-revalidate' \
    --content-type 'text/html; charset=utf-8'

  # Docs - CSS files
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.css' \
    --cache-control 'public, max-age=86400' \
    --content-type 'text/css'

  # Docs - JS files
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.js' \
    --cache-control 'public, max-age=86400' \
    --content-type 'application/javascript'

  # Docs - PNG images
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.png' \
    --cache-control 'public, max-age=86400' \
    --content-type 'image/png'

  # Docs - GIF images
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.gif' \
    --cache-control 'public, max-age=86400' \
    --content-type 'image/gif'

  # Docs - SVG images
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.svg' \
    --cache-control 'public, max-age=86400' \
    --content-type 'image/svg+xml'

  # Docs - ICO favicons
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.ico' \
    --cache-control 'public, max-age=86400' \
    --content-type 'image/x-icon'

  # Docs - JPEG images
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.jpg' --include '*.jpeg' \
    --cache-control 'public, max-age=86400' \
    --content-type 'image/jpeg'

  # Docs - WebP images
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' --include '*.webp' \
    --cache-control 'public, max-age=86400' \
    --content-type 'image/webp'

  # Docs - JSON/data files
  aws s3 sync "$SRC/docs" "$BUCKET/docs" --exclude '*' \
    --include '*.json' --include '*.txt' --include '*.xml' \
    --cache-control 'public, max-age=86400'

  # Docs - remaining files (fonts, source maps, etc.)
  aws s3 sync "$SRC/docs" "$BUCKET/docs" \
    --cache-control 'public, max-age=86400' \
    --exclude '*.html' --exclude '*.css' --exclude '*.js' \
    --exclude '*.png' --exclude '*.gif' --exclude '*.svg' --exclude '*.ico' \
    --exclude '*.jpg' --exclude '*.jpeg' --exclude '*.webp' \
    --exclude '*.json' --exclude '*.txt' --exclude '*.xml'

  echo "✅ Docs deployed with correct MIME types"
else
  echo "ℹ️ No docs directory found at $SRC/docs, skipping docs deployment"
fi

# ── Catch-all for remaining main site files ──
aws s3 sync "$SRC" "$BUCKET" \
  --exclude '.git/*' --exclude 'screenshots/*' \
  --exclude '.github/*' --exclude 'schemas/*' \
  --exclude 'scripts/*' --exclude '.devcontainer/*' --exclude 'quicksight/*' \
  --exclude 'src/*' --exclude 'tests/*' --exclude 'cypress/*' \
  --exclude 'node_modules/*' --exclude 'builds/*' \
  --exclude 'docs/*' \
  --exclude '*.md' --exclude 'package*.json' --exclude '.gitignore' \
  --exclude 'tsconfig*.json' --exclude '*.config.js' --exclude 'jsdoc.json' \
  --exclude 'typedoc.json' --exclude 'eslint.config.js' \
  --exclude '*.html' --exclude '*.css' --exclude '*.js' \
  --exclude '*.webp' --exclude '*.png' --exclude '*.jpg' --exclude '*.jpeg' \
  --exclude '*.gif' --exclude '*.svg' --exclude '*.ico' \
  --exclude '*.woff' --exclude '*.woff2' --exclude '*.ttf' --exclude '*.eot' --exclude '*.otf' \
  --exclude '*.xml' --exclude '*.json' --exclude '*.txt'

echo "✅ S3 deployment completed"
