# Testing Guide for SEO & UI/UX Enhancements

This guide provides step-by-step instructions for testing all the new features implemented in the February 9, 2026 enhancements.

---

## 🧪 Quick Start

### Prerequisites
```bash
# Install test server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080/index.html
```

---

## 1. Schema.org Validation

### Google Rich Results Test
1. Visit: https://search.google.com/test/rich-results
2. Enter URL: `https://riksdagsmonitor.com/index.html`
3. Click "Test URL"
4. **Expected Results:**
   - ✅ Event (Swedish Parliamentary Election 2026)
   - ✅ FAQPage (6 questions)
   - ✅ BreadcrumbList
   - ✅ Organization (Hack23 AB)
   - No errors or warnings

### Schema.org Validator
1. Visit: https://validator.schema.org/
2. Paste the JSON-LD from `<script type="application/ld+json">`
3. Click "Validate"
4. **Expected:** All 7 entities valid

### Manual JSON-LD Extraction
```bash
cd /home/runner/work/riksdagsmonitor/riksdagsmonitor
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const jsonLdMatch = html.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/);
console.log(JSON.stringify(JSON.parse(jsonLdMatch[1]), null, 2));
" > schema-org-data.json
```

---

## 2. Meta Tags Verification

### Open Graph (Facebook)
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter URL: `https://riksdagsmonitor.com/index.html`
3. Click "Debug"
4. **Check:**
   - ✅ Title: "Swedish Election 2026 | Live Intelligence Platform"
   - ✅ Description: Present
   - ✅ Image: 1200x630 dimensions
   - ✅ Type: website
   - ✅ 14 locale alternates

### Twitter Card
1. Visit: https://cards-dev.twitter.com/validator
2. Enter URL: `https://riksdagsmonitor.com/index.html`
3. **Check:**
   - ✅ Card type: summary_large_image
   - ✅ Title present
   - ✅ Image present
   - ✅ Domain: riksdagsmonitor.com

### LinkedIn Post Inspector
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter URL: `https://riksdagsmonitor.com/index.html`
3. **Check:** Proper preview rendering

---

## 3. Keyboard Navigation Testing

### Tab Order Test
1. Open page in browser
2. Press **Tab** key repeatedly
3. **Expected order:**
   1. Skip-to-content link (visible on focus)
   2. Breadcrumb links
   3. Header links
   4. Main content links/buttons
   5. Footer section links
   6. Language grid links (14 links)
   7. Footer bottom links
   8. Back-to-top button (when visible)

### Skip-to-Content Link
1. Reload page
2. Press **Tab** once
3. **Expected:** "Skip to main content" appears at top
4. Press **Enter**
5. **Expected:** Page scrolls to main content (smooth scroll)

### Focus Indicators
1. Tab through all elements
2. **Check each element:**
   - ✅ 3px solid green outline (#006633)
   - ✅ 2px outline offset
   - ✅ Clearly visible against all backgrounds
   - ✅ Border radius on outline

### Back-to-Top Button
1. Scroll down 300px+
2. **Expected:** Button fades in (bottom-right)
3. Tab to button or click
4. Press Enter (or click)
5. **Expected:** Smooth scroll to top

---

## 4. Responsive Design Testing

### Desktop (1440px+)
```
Browser DevTools → Responsive Design Mode
Width: 1440px
```
**Check:**
- ✅ Footer: 4 columns visible
- ✅ Language grid: 7 items per row (2 rows)
- ✅ Back-to-top: 50px × 50px (bottom-right 30px)
- ✅ All content readable

### Desktop (1024px)
```
Width: 1024px
```
**Check:**
- ✅ Footer: 4 columns (narrower)
- ✅ Layout intact

### Tablet (768px)
```
Width: 768px
```
**Check:**
- ✅ Footer: 2 columns (2×2 grid)
- ✅ Language grid: Smaller items
- ✅ Back-to-top: 50px × 50px

### Mobile (480px)
```
Width: 480px
```
**Check:**
- ✅ Footer: 1 column (stacked)
- ✅ Language grid: Smaller font (0.75rem)
- ✅ Back-to-top: 45px × 45px (bottom-right 20px)
- ✅ Touch targets: 44px minimum

### Mobile Small (320px)
```
Width: 320px
```
**Check:**
- ✅ Footer: Single column, readable
- ✅ Language grid: 4-5 items per row
- ✅ No horizontal scroll
- ✅ All text readable

---

## 5. Accessibility (WCAG 2.1) Testing

### Automated Tools

#### axe DevTools (Browser Extension)
1. Install: https://www.deque.com/axe/devtools/
2. Open DevTools → axe tab
3. Click "Scan All of My Page"
4. **Expected:** 0 critical issues
5. **Target Score:** 95+ (WCAG 2.1 AA)

#### WAVE (Web Accessibility Evaluation Tool)
1. Visit: https://wave.webaim.org/
2. Enter URL: `https://riksdagsmonitor.com/index.html`
3. **Check:**
   - ✅ 0 errors
   - ✅ 9+ ARIA roles
   - ✅ 26+ ARIA labels
   - ✅ Proper heading structure

#### Lighthouse (Chrome DevTools)
1. Open DevTools → Lighthouse tab
2. Select: Desktop, Accessibility
3. Click "Generate report"
4. **Expected Score:** 95+ (100 ideal)

### Manual Testing

#### Keyboard-Only Navigation
1. Disconnect mouse/trackpad
2. Navigate entire site using only:
   - **Tab** (forward)
   - **Shift+Tab** (backward)
   - **Enter** (activate)
   - **Space** (activate buttons)
   - **Arrow keys** (if applicable)
3. **Check:** All features accessible

#### Screen Reader Testing (NVDA - Windows)
1. Install NVDA: https://www.nvaccess.org/
2. Launch NVDA (Ctrl+Alt+N)
3. Open page
4. **Listen for:**
   - ✅ "Skip to main content" link announced
   - ✅ Heading levels read correctly (H1, H2, H3)
   - ✅ ARIA labels read for language links ("Switch to English", etc.)
   - ✅ Footer sections announced as lists
   - ✅ Back-to-top button: "Back to top, button"

#### Screen Reader Testing (VoiceOver - macOS)
1. Enable VoiceOver (Cmd+F5)
2. Navigate with VO keys (Ctrl+Option+arrows)
3. **Same checks as NVDA**

#### Color Contrast Testing
1. Use browser extension: https://www.tpgi.com/color-contrast-checker/
2. Test these combinations:
   - ✅ Body text (#1a1a1a) on white: **12.63:1** (AAA)
   - ✅ Primary green (#006633) on white: **7.82:1** (AAA)
   - ✅ Secondary text (#4a4a4a) on white: **8.86:1** (AAA)
   - ✅ Link color (#007744) on white: **6.42:1** (AAA)
   - ✅ Accent (#008838) on white: **4.59:1** (AA)
3. **Minimum required:** 4.5:1 for normal text (AA)
4. **Target:** 7:1 for AAA

#### Touch Target Testing (Mobile)
1. Use mobile device or simulator
2. Check all interactive elements:
   - ✅ Language grid links: 44px minimum height
   - ✅ Footer links: 44px minimum (with padding)
   - ✅ Back-to-top button: 45px × 45px (>44px ✓)
   - ✅ Skip link: 44px+ with padding
3. **Standard:** WCAG 2.1 AAA requires 44px × 44px

---

## 6. Performance Testing

### Google Lighthouse (Full Audit)
1. Open DevTools → Lighthouse
2. Select: Desktop, Performance, Accessibility, Best Practices, SEO
3. Generate report
4. **Expected Scores:**
   - Performance: 90+ (green)
   - Accessibility: 95+ (green)
   - Best Practices: 95+ (green)
   - SEO: 100 (green)

### Core Web Vitals
1. Use PageSpeed Insights: https://pagespeed.web.dev/
2. Enter URL: `https://riksdagsmonitor.com/index.html`
3. **Check metrics:**
   - ✅ **LCP (Largest Contentful Paint):** <2.5s
   - ✅ **FID (First Input Delay):** <100ms
   - ✅ **CLS (Cumulative Layout Shift):** <0.1
   - ✅ **FCP (First Contentful Paint):** <1.8s
   - ✅ **TTI (Time to Interactive):** <3.8s

### Network Performance
1. Open DevTools → Network tab
2. Reload page (Cmd/Ctrl+Shift+R)
3. **Check:**
   - ✅ Total page size: <500KB
   - ✅ index.html: ~60KB
   - ✅ styles.css: ~156KB
   - ✅ Total requests: <20
   - ✅ Load time: <5s (on 3G)

### Resource Hints Verification
1. Open DevTools → Network tab
2. Check early requests:
   - ✅ DNS prefetch to fonts.googleapis.com
   - ✅ Preconnect to fonts.gstatic.com
   - ✅ Preload styles.css
   - ✅ Preload fonts CSS
3. **Expected:** Faster font loading, no FOIT (Flash of Invisible Text)

---

## 7. UI/UX Feature Testing

### Skip-to-Content Link
**Test 1: Visibility on focus**
1. Reload page
2. Press Tab
3. **Expected:** Green button appears at top-left: "Skip to main content"
4. **Check:** 3px focus outline visible

**Test 2: Functionality**
1. With skip link focused, press Enter
2. **Expected:** Page scrolls smoothly to main content
3. **Check:** Focus moves to main element

### Back-to-Top Button
**Test 1: Visibility threshold**
1. Page loads at top
2. **Expected:** Button invisible (opacity: 0)
3. Scroll down 300px+
4. **Expected:** Button fades in smoothly

**Test 2: Functionality**
1. Scroll to bottom of page
2. Click back-to-top button
3. **Expected:** Smooth scroll to top (not instant jump)
4. **Duration:** ~1-2 seconds

**Test 3: Keyboard access**
1. Scroll down 300px+
2. Tab to back-to-top button
3. **Expected:** 3px green outline visible
4. Press Enter
5. **Expected:** Smooth scroll to top

**Test 4: Hover effect**
1. Scroll down 300px+
2. Hover over button
3. **Expected:**
   - Background lightens (#007744)
   - Button lifts up 3px (translateY(-3px))
   - Shadow increases

### Enhanced Footer
**Test 1: Structure**
1. Scroll to footer
2. **Count sections:** 4 visible (desktop)
3. **Section titles:**
   - About Riksdagsmonitor
   - Quick Links
   - Resources
   - Languages
4. **Footer bottom:** Copyright, last updated date

**Test 2: Links**
1. Hover over any footer link
2. **Expected:**
   - Text color changes to green (#006633)
   - Slight left padding animation (4px)
3. Test all 20+ footer links work

**Test 3: Language Grid**
1. Count language links: **14 total**
2. Flags present: 🇬🇧🇸🇪🇩🇰🇳🇴🇫🇮🇩🇪🇫🇷🇪🇸🇳🇱🇸🇦🇮🇱🇯🇵🇰🇷🇨🇳
3. Hover over language link
4. **Expected:**
   - Background: Green (#006633)
   - Text: White
   - Lift effect (translateY(-2px))
   - Shadow appears

**Test 4: Footer Stats**
1. Check "About" section stats:
   - ✅ **349 MPs** tracked
   - ✅ **45 risk rules** active
   - ✅ **14 languages** supported
   - ✅ **50+ years** historical data
2. **Visual:** Separator lines between stats

### Card Hover Effects
1. Hover over any `.card` element
2. **Expected:**
   - Card lifts up 4px (translateY(-4px))
   - Card scales slightly (scale(1.01))
   - Triple-layer shadow appears
   - Smooth 0.3s transition
3. Click card (mouse down)
4. **Expected:** Active state (lift reduces to 2px)

### Smooth Scroll
**Test 1: Normal users**
1. Click any anchor link (e.g., "#main-content")
2. **Expected:** Smooth scrolling animation (not instant jump)

**Test 2: Motion-sensitive users**
1. Enable "Reduce motion" in OS:
   - **macOS:** System Preferences → Accessibility → Display → Reduce motion
   - **Windows:** Settings → Ease of Access → Display → Show animations
2. Click anchor link
3. **Expected:** Instant scroll (no animation)

### Loading States (Optional - if implemented)
1. Add `.loading` class to any element
2. **Expected:**
   - Opacity: 0.6
   - Cursor: wait
   - Pointer events disabled

3. Add `.skeleton` class to empty div
4. **Expected:** Animated gradient loading effect

---

## 8. Browser Compatibility Testing

### Chrome/Edge (Chromium)
| Version | Status | Notes |
|---------|--------|-------|
| 120+ | ✅ | Full support expected |
| 100-119 | ✅ | Full support |
| 65-99 | ⚠️ | Test focus-visible fallback |

**Test:** All features (focus-visible, grid, flex, smooth-scroll)

### Firefox
| Version | Status | Notes |
|---------|--------|-------|
| 120+ | ✅ | Full support expected |
| 100-119 | ✅ | Full support |
| 60-99 | ⚠️ | Test focus-visible fallback |

**Test:** All features

### Safari
| Version | Status | Notes |
|---------|--------|-------|
| 17+ (macOS) | ✅ | Full support expected |
| 16+ (iOS) | ✅ | PWA tags functional |
| 12-15 | ⚠️ | Test vendor prefixes |

**Test:** Webkit-specific prefixes (-webkit-appearance, etc.)

### Mobile Browsers
| Browser | OS | Status |
|---------|-----|--------|
| Chrome Mobile | Android 12+ | ✅ |
| Safari | iOS 16+ | ✅ |
| Samsung Internet | Android 12+ | ✅ |
| Firefox Mobile | Android 12+ | ✅ |

**Test:** Touch targets (44px), PWA manifest, smooth scroll

---

## 9. SEO Validation

### Sitemap.xml Check
```bash
curl https://riksdagsmonitor.com/sitemap.xml | grep "index.html"
```
**Expected:** Entry for index.html present

### Robots.txt Check
```bash
curl https://riksdagsmonitor.com/robots.txt
```
**Expected:**
```
User-agent: *
Allow: /
Sitemap: https://riksdagsmonitor.com/sitemap.xml
```

### hreflang Tags Validation
1. View page source
2. Search for `rel="alternate"`
3. **Count:** 14 hreflang tags + 1 x-default
4. **Languages:** ar, da, de, en, es, fi, fr, he, ja, ko, nl, no, sv, zh

### Canonical URL
1. View page source
2. Find: `<link rel="canonical" href="...">`
3. **Expected:** `https://riksdagsmonitor.com/index.html`

---

## 10. Security Testing

### Content Security Policy (CSP)
1. Open DevTools → Console
2. Look for CSP violations
3. **Expected:** 0 violations
4. **Check:** No inline scripts/styles (except whitelisted)

### External Links Safety
1. Inspect all external links
2. **Required attributes:**
   - `target="_blank"` → ✅
   - `rel="noopener noreferrer"` → ✅
3. **Count:** 10+ external links
4. **Test:** Right-click → Open in new tab (should be safe)

### XSS Prevention
1. Try injecting script in URL parameters
2. **Expected:** No execution (static site, no URL params processed)

---

## 🎯 Acceptance Criteria

### Critical (Must Pass)
- ✅ HTML validation: 0 errors
- ✅ JSON-LD validation: 7 entities valid
- ✅ WCAG 2.1 AA: 100% compliance
- ✅ Keyboard navigation: Full accessibility
- ✅ Responsive: 320px - 1440px+ working
- ✅ Performance: Lighthouse scores 90+
- ✅ Schema.org: Rich results eligible

### Important (Should Pass)
- ✅ WCAG 2.1 AAA: Focus indicators, touch targets
- ✅ Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
- ✅ Screen reader: NVDA/VoiceOver compatible
- ✅ Browser support: Chrome/Firefox/Safari 2+ versions back
- ✅ SEO: Google Rich Results eligible

### Nice-to-Have (Optional)
- 🎨 Dark mode support (future)
- 🚀 PWA support (future - requires favicon files)
- 📊 Analytics integration (future)

---

## 📝 Test Results Template

```markdown
## Test Session Report

**Date:** [YYYY-MM-DD]
**Tester:** [Name]
**Browser:** [Chrome 120 / Firefox 120 / Safari 17]
**Device:** [Desktop / Mobile]

### Results

| Category | Status | Notes |
|----------|--------|-------|
| HTML Validation | ✅/❌ | |
| Schema.org | ✅/❌ | |
| Keyboard Navigation | ✅/❌ | |
| Screen Reader | ✅/❌ | |
| Responsive (320px) | ✅/❌ | |
| Responsive (768px) | ✅/❌ | |
| Responsive (1440px) | ✅/❌ | |
| Performance (Lighthouse) | Score: ___ | |
| Accessibility (axe) | Issues: ___ | |
| Back-to-Top Button | ✅/❌ | |
| Skip-to-Content | ✅/❌ | |
| Footer (4-column) | ✅/❌ | |
| Language Grid (14) | ✅/❌ | |

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## 🔧 Troubleshooting

### Issue: Skip link not visible on Tab
**Solution:** Check browser focus-visible support. Use `:focus` fallback.

### Issue: Back-to-top button not appearing
**Solution:** Scroll >300px. Check JavaScript console for errors.

### Issue: Footer stacked on desktop
**Solution:** Check viewport width. Footer is 4-column at 1024px+.

### Issue: Schema.org errors in Google validator
**Solution:** Copy JSON-LD from page source, validate separately.

### Issue: Lighthouse score <90
**Solution:** Check network speed, disable extensions, run in incognito mode.

---

## 📞 Support

For issues or questions:
- **Email:** info@hack23.com
- **GitHub:** https://github.com/Hack23/riksdagsmonitor/issues
- **Documentation:** SEO_UX_ENHANCEMENTS_SUMMARY.md

---

**Last Updated:** February 9, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
