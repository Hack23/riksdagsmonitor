#!/usr/bin/env bash
# Fix MIME types on ALL existing objects in an S3 bucket.
#
# This script lists every object in the bucket and re-copies it in-place
# (S3-to-S3 copy) with the correct Content-Type metadata based on its file
# extension.  Objects whose extension is already handled get their metadata
# updated; unknown extensions are skipped with a warning.
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

# ── MIME type mapping ──
# Returns the Content-Type and Cache-Control for a given file extension.
mime_for_ext() {
  local ext="${1,,}"  # lowercase
  case "$ext" in
    html)          echo "text/html; charset=utf-8|public, max-age=3600, must-revalidate" ;;
    css)           echo "text/css|public, max-age=31536000, immutable" ;;
    js)            echo "application/javascript|public, max-age=31536000, immutable" ;;
    mjs)           echo "application/javascript|public, max-age=31536000, immutable" ;;
    json)          echo "application/json|public, max-age=86400" ;;
    xml)           echo "application/xml|public, max-age=86400" ;;
    csv)           echo "text/csv; charset=utf-8|public, max-age=86400" ;;
    txt)           echo "text/plain|public, max-age=86400" ;;
    md)            echo "text/markdown; charset=utf-8|public, max-age=86400" ;;
    map)           echo "application/json|public, max-age=31536000, immutable" ;;
    webmanifest)   echo "application/manifest+json|public, max-age=86400" ;;
    wasm)          echo "application/wasm|public, max-age=31536000, immutable" ;;
    pdf)           echo "application/pdf|public, max-age=86400" ;;
    # Images
    png)           echo "image/png|public, max-age=31536000, immutable" ;;
    jpg|jpeg)      echo "image/jpeg|public, max-age=31536000, immutable" ;;
    gif)           echo "image/gif|public, max-age=31536000, immutable" ;;
    svg)           echo "image/svg+xml|public, max-age=31536000, immutable" ;;
    webp)          echo "image/webp|public, max-age=31536000, immutable" ;;
    ico)           echo "image/x-icon|public, max-age=31536000, immutable" ;;
    # Fonts
    woff2)         echo "font/woff2|public, max-age=31536000, immutable" ;;
    woff)          echo "font/woff|public, max-age=31536000, immutable" ;;
    ttf)           echo "font/ttf|public, max-age=31536000, immutable" ;;
    eot)           echo "application/vnd.ms-fontobject|public, max-age=31536000, immutable" ;;
    otf)           echo "font/otf|public, max-age=31536000, immutable" ;;
    # Shell / misc (skip upload, not web content)
    sh|gitignore)  echo "SKIP" ;;
    *)             echo "" ;;
  esac
}

echo "🔧 Fixing MIME types for all objects in $BUCKET"
echo ""

FIXED=0
SKIPPED=0
UNKNOWN=0
FAILED=0

# List all objects and process each one.
# Use process substitution (< <(...)) instead of a pipe so that counter
# variables are updated in the current shell, not a subshell.
while read -r _ _ _ key; do
  # Skip empty lines
  [ -z "$key" ] && continue

  # Extract extension (handle files without extension like CNAME)
  filename="${key##*/}"
  if [[ "$filename" == *"."* ]]; then
    ext="${filename##*.}"
  else
    # Files without extension (e.g. CNAME) — treat as text/plain
    ext="txt"
  fi

  result="$(mime_for_ext "$ext")"

  if [ -z "$result" ]; then
    echo "⚠️  Unknown extension: $key (.$ext) — skipping"
    UNKNOWN=$((UNKNOWN + 1))
    continue
  fi

  if [ "$result" = "SKIP" ]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  content_type="${result%%|*}"
  cache_control="${result##*|}"

  # Copy object to itself with updated metadata (S3-to-S3 copy)
  if aws s3 cp "$BUCKET/$key" "$BUCKET/$key" \
    --no-guess-mime-type \
    --content-type "$content_type" \
    --cache-control "$cache_control" \
    --metadata-directive REPLACE 2>/dev/null; then
    FIXED=$((FIXED + 1))
  else
    echo "❌ Failed to fix: $key"
    FAILED=$((FAILED + 1))
  fi
done < <(aws s3 ls "$BUCKET" --recursive)

echo ""
echo "✅ MIME type fix completed"
echo "   Fixed:   $FIXED"
echo "   Skipped: $SKIPPED"
echo "   Unknown: $UNKNOWN"
echo "   Failed:  $FAILED"
