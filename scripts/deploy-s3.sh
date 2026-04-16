#!/usr/bin/env bash
# S3 Deployment Script for Riksdagsmonitor
#
# Uploads site assets to S3 with correct MIME types and cache headers.
# Shared by deploy-s3.yml (push to main) and release.yml workflows.
#
# Uses `aws s3 sync` per-extension to upload only changed files while
# setting the correct Content-Type metadata.  Sync compares file sizes
# (--size-only) so unchanged files are skipped — dramatically faster
# than the old `cp --recursive` approach that re-uploaded everything.
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

# ── Directories and files that must never be uploaded ──
SKIP=(
  --exclude '.git/*'
  --exclude '.github/*'
  --exclude '.devcontainer/*'
  --exclude 'node_modules/*'
  --exclude 'artifacts/*'
  --exclude 'builds/*'
  --exclude 'cypress/*'
  --exclude 'screenshots/*'
  --exclude 'schemas/*'
  --exclude 'scripts/*'
  --exclude 'quicksight/*'
  --exclude 'src/*'
  --exclude 'tests/*'
  --exclude 'analysis/*'
  --exclude 'cia-data/*'
  --exclude '.npmrc'
  --exclude '.nvmrc'
  --exclude '.gitignore'
  --exclude '.gitattributes'
  --exclude 'package.json'
  --exclude 'package-lock.json'
  --exclude 'tsconfig*.json'
  --exclude 'vite.config.js'
  --exclude 'vitest.config.js'
  --exclude 'eslint.config.js'
  --exclude 'cypress.config.js'
  --exclude 'knip.json'
  --exclude 'typedoc.json'
  --exclude 'LICENSE'
  --exclude 'CODE_OF_CONDUCT.md'
  --exclude 'CONTRIBUTING.md'
  --exclude 'AGENTS.md'
  --exclude 'SKILLS.md'
  --exclude 'LABELS.md'
  --exclude 'TESTING.md'
  --exclude 'RELEASE_PROCESS.md'
  --exclude 'TRANSLATION_GUIDE.md'
  --exclude '*.sh'
)

echo "🚀 Deploying $SRC → $BUCKET"

# ── Helper: sync a set of extensions with explicit MIME type ──
# Uses aws s3 sync --size-only so unchanged files are skipped.
# --size-only compares file sizes (not timestamps or checksums).
# This is the right tradeoff: content changes always alter size for
# text/code files, and the first deploy after a fresh build always
# uploads everything anyway.  Use the fix-s3-mimetypes.sh script
# (manual trigger) to repair metadata on existing objects.
# Arguments:
#   $1  content-type
#   $2  cache-control
#   $3+ include patterns (e.g. '*.html')
#   Optionally set TARGET_PREFIX before calling to deploy a subdirectory
#   (defaults to the bucket root).
sync_type() {
  local content_type="$1"; shift
  local cache_control="$1"; shift
  local includes=()
  for pat in "$@"; do
    includes+=(--include "$pat")
  done

  local dest="${TARGET_PREFIX:-$BUCKET}"

  aws s3 sync "$SYNC_SRC" "$dest" \
    --size-only \
    --exclude '*' "${includes[@]}" \
    --no-guess-mime-type --content-type "$content_type" \
    --cache-control "$cache_control" \
    "${EXTRA_EXCLUDES[@]}"
}

# ── Main site assets (exclude docs/ — handled separately) ──
SYNC_SRC="$SRC"
EXTRA_EXCLUDES=("${SKIP[@]}" --exclude 'docs/*')
TARGET_PREFIX="$BUCKET"

echo "📄 Syncing HTML..."
sync_type 'text/html; charset=utf-8' 'public, max-age=3600, must-revalidate' '*.html'

echo "🎨 Syncing CSS..."
sync_type 'text/css' 'public, max-age=31536000, immutable' '*.css'

echo "⚡ Syncing JS..."
sync_type 'application/javascript' 'public, max-age=31536000, immutable' '*.js' '*.mjs'

echo "🖼️  Syncing images..."
sync_type 'image/webp'     'public, max-age=31536000, immutable' '*.webp'
sync_type 'image/png'      'public, max-age=31536000, immutable' '*.png'
sync_type 'image/jpeg'     'public, max-age=31536000, immutable' '*.jpg' '*.jpeg'
sync_type 'image/gif'      'public, max-age=31536000, immutable' '*.gif'
sync_type 'image/svg+xml'  'public, max-age=31536000, immutable' '*.svg'
sync_type 'image/x-icon'   'public, max-age=31536000, immutable' '*.ico'

echo "🔤 Syncing fonts..."
sync_type 'font/woff2'                       'public, max-age=31536000, immutable' '*.woff2'
sync_type 'font/woff'                        'public, max-age=31536000, immutable' '*.woff'
sync_type 'font/ttf'                         'public, max-age=31536000, immutable' '*.ttf'
sync_type 'application/vnd.ms-fontobject'    'public, max-age=31536000, immutable' '*.eot'
sync_type 'font/otf'                         'public, max-age=31536000, immutable' '*.otf'

echo "📋 Syncing metadata & data files..."
sync_type 'application/xml'           'public, max-age=86400' '*.xml'
sync_type 'application/json'          'public, max-age=86400' '*.json'
sync_type 'text/plain'                'public, max-age=86400' '*.txt'
sync_type 'text/csv; charset=utf-8'   'public, max-age=86400' '*.csv'
sync_type 'application/manifest+json' 'public, max-age=86400' '*.webmanifest'
sync_type 'application/pdf'           'public, max-age=86400' '*.pdf'
sync_type 'text/markdown; charset=utf-8' 'public, max-age=86400' '*.md'

echo "🗺️  Syncing source maps & wasm..."
sync_type 'application/json' 'public, max-age=31536000, immutable' '*.map'
sync_type 'application/wasm' 'public, max-age=31536000, immutable' '*.wasm'

# ── Documentation directory (coverage, test-results, API docs) ──
# Docs use shorter cache TTLs since they are regenerated each release.
if [ -d "$SRC/docs" ]; then
  echo "📚 Syncing docs/ ..."
  SYNC_SRC="$SRC/docs"
  TARGET_PREFIX="$BUCKET/docs"
  EXTRA_EXCLUDES=()

  sync_type 'text/html; charset=utf-8' 'public, max-age=86400, must-revalidate' '*.html'
  sync_type 'text/css'                 'public, max-age=86400' '*.css'
  sync_type 'application/javascript'   'public, max-age=86400' '*.js'
  sync_type 'image/png'               'public, max-age=86400' '*.png'
  sync_type 'image/gif'               'public, max-age=86400' '*.gif'
  sync_type 'image/svg+xml'           'public, max-age=86400' '*.svg'
  sync_type 'image/x-icon'            'public, max-age=86400' '*.ico'
  sync_type 'image/jpeg'              'public, max-age=86400' '*.jpg' '*.jpeg'
  sync_type 'image/webp'              'public, max-age=86400' '*.webp'
  sync_type 'application/json'        'public, max-age=86400' '*.json'
  sync_type 'application/xml'         'public, max-age=86400' '*.xml'
  sync_type 'text/plain'              'public, max-age=86400' '*.txt'
  sync_type 'font/woff2'              'public, max-age=86400' '*.woff2'
  sync_type 'font/woff'               'public, max-age=86400' '*.woff'
  sync_type 'application/json'        'public, max-age=86400' '*.map'

  echo "✅ Docs synced"
else
  echo "ℹ️  No docs directory found at $SRC/docs, skipping docs deployment"
fi

# ── Delete orphaned objects from S3 ──
# A final sync --delete removes files that no longer exist locally.
# --size-only prevents re-uploading files whose metadata was already
# set correctly by the per-extension passes above.
echo "🧹 Cleaning orphaned S3 objects..."
aws s3 sync "$SRC" "$BUCKET" --delete --size-only \
  "${SKIP[@]}"

echo "✅ S3 deployment completed"
