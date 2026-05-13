#!/usr/bin/env bash
# Fix MIME types on ALL existing objects in an S3 bucket.
#
# Uses batch `aws s3 cp --recursive` per extension (S3-to-S3 copy with
# --metadata-directive REPLACE) instead of processing objects one-by-one.
# This is orders of magnitude faster on large buckets.
#
# Usage: scripts/fix-s3-mimetypes.sh <s3-bucket-url>
#   s3-bucket-url: full S3 URL including protocol (e.g. "s3://bucket-name")
#
# @author Hack23 AB
# @license Apache-2.0
set -euo pipefail

BUCKET="${1:?Usage: fix-s3-mimetypes.sh <s3-bucket-url>}"

# Strip trailing slash
BUCKET="${BUCKET%/}"

echo "🔧 Fixing MIME types for all objects in $BUCKET"
echo ""

# ── Helper: fix one extension pattern in batch ──
# S3-to-S3 recursive copy with --metadata-directive REPLACE overwrites
# Content-Type and Cache-Control on every matching object in one pass.
fix_type() {
  local content_type="$1"; shift
  local cache_control="$1"; shift
  # remaining args are --include patterns

  echo "  → $content_type  ($*)"
  aws s3 cp "$BUCKET" "$BUCKET" --recursive \
    --exclude '*' "$@" \
    --no-guess-mime-type \
    --content-type "$content_type" \
    --cache-control "$cache_control" \
    --metadata-directive REPLACE
}

# ── HTML ──
fix_type 'text/html; charset=utf-8' 'public, max-age=3600, must-revalidate' \
  --include '*.html'

# ── CSS ──
fix_type 'text/css' 'public, max-age=31536000, immutable' \
  --include '*.css'

# ── JavaScript ──
fix_type 'application/javascript' 'public, max-age=31536000, immutable' \
  --include '*.js' --include '*.mjs'

# ── Images ──
fix_type 'image/png'     'public, max-age=31536000, immutable' --include '*.png'
fix_type 'image/jpeg'    'public, max-age=31536000, immutable' --include '*.jpg' --include '*.jpeg'
fix_type 'image/gif'     'public, max-age=31536000, immutable' --include '*.gif'
fix_type 'image/svg+xml' 'public, max-age=31536000, immutable' --include '*.svg'
fix_type 'image/webp'    'public, max-age=31536000, immutable' --include '*.webp'
fix_type 'image/avif'    'public, max-age=31536000, immutable' --include '*.avif'
fix_type 'image/x-icon'  'public, max-age=31536000, immutable' --include '*.ico'

# ── Fonts ──
fix_type 'font/woff2'                    'public, max-age=31536000, immutable' --include '*.woff2'
fix_type 'font/woff'                     'public, max-age=31536000, immutable' --include '*.woff'
fix_type 'font/ttf'                      'public, max-age=31536000, immutable' --include '*.ttf'
fix_type 'application/vnd.ms-fontobject' 'public, max-age=31536000, immutable' --include '*.eot'
fix_type 'font/otf'                      'public, max-age=31536000, immutable' --include '*.otf'

# ── Data / metadata ──
fix_type 'application/json'          'public, max-age=86400' --include '*.json'
fix_type 'application/xml'           'public, max-age=86400' --include '*.xml'
fix_type 'text/plain'                'public, max-age=86400' --include '*.txt'
fix_type 'text/csv; charset=utf-8'   'public, max-age=86400' --include '*.csv'
fix_type 'text/markdown; charset=utf-8' 'public, max-age=86400' --include '*.md'
fix_type 'application/manifest+json' 'public, max-age=86400' --include '*.webmanifest'
fix_type 'application/pdf'           'public, max-age=86400' --include '*.pdf'

# ── Build artifacts ──
fix_type 'application/json' 'public, max-age=31536000, immutable' --include '*.map'
fix_type 'application/wasm' 'public, max-age=31536000, immutable' --include '*.wasm'

echo ""
echo "✅ MIME type fix completed"
