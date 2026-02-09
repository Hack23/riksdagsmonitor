#!/bin/bash

echo "====================================="
echo "SEO & UI/UX Implementation Verification"
echo "====================================="
echo ""

echo "1. HTML Validation:"
npx htmlhint index.html 2>&1 | grep -E "(error|Scanned)"
echo ""

echo "2. JSON-LD Validation:"
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const jsonLdMatch = html.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/);
if (jsonLdMatch) {
  try {
    const data = JSON.parse(jsonLdMatch[1]);
    console.log('✅ Valid JSON-LD with', data['@graph'].length, 'entities');
  } catch (e) {
    console.error('❌ Invalid JSON:', e.message);
  }
}" 2>&1
echo ""

echo "3. File Statistics:"
echo "   index.html: $(wc -l < index.html) lines, $(du -h index.html | cut -f1)"
echo "   styles.css: $(wc -l < styles.css) lines, $(du -h styles.css | cut -f1)"
echo ""

echo "4. Feature Checks:"
echo "   - Skip-to-content: $(grep -c 'skip-to-content' index.html) occurrences"
echo "   - Back-to-top button: $(grep -c 'back-to-top' index.html) occurrences"
echo "   - Footer sections: $(grep -c 'footer-section' index.html) sections"
echo "   - Language links: $(grep -c 'language-grid' index.html) grids"
echo "   - ARIA labels: $(grep -c 'aria-label=' index.html) labels"
echo "   - ARIA roles: $(grep -c 'role=' index.html) roles"
echo "   - Schema.org types: $(grep -c '@type' index.html) types"
echo ""

echo "5. Meta Tag Checks:"
echo "   - Geographic tags: $(grep -c 'geo\.' index.html) tags"
echo "   - Mobile app tags: $(grep -c 'mobile-web-app\|apple-mobile' index.html) tags"
echo "   - Resource hints: $(grep -c 'dns-prefetch\|preconnect\|preload' index.html) hints"
echo ""

echo "6. CSS Feature Checks:"
echo "   - Skip-to-content styles: $(grep -c '\.skip-to-content' styles.css) occurrences"
echo "   - Back-to-top styles: $(grep -c '\.back-to-top' styles.css) occurrences"
echo "   - Footer styles: $(grep -c '\.footer-' styles.css) occurrences"
echo "   - Language grid styles: $(grep -c '\.language-grid' styles.css) occurrences"
echo "   - Focus-visible: $(grep -c 'focus-visible' styles.css) occurrences"
echo "   - Prefers-reduced-motion: $(grep -c 'prefers-reduced-motion' styles.css) occurrences"
echo ""

echo "7. Accessibility Checks:"
echo "   - Touch target media query: $(grep -c '@media (pointer: coarse)' styles.css) query"
echo "   - High contrast support: $(grep -c 'prefers-contrast' styles.css) query"
echo "   - Semantic time elements: $(grep -c '<time' index.html) elements"
echo ""

echo "====================================="
echo "✅ Verification Complete!"
echo "====================================="
