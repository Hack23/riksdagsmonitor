---
name: responsive-design
description: Mobile-first responsive web design with CSS Grid/Flexbox, breakpoints (320px-1440px+), and cross-device optimization
license: Apache-2.0
---

# Responsive Design

## Purpose

Create fluid, adaptable web experiences that work seamlessly across all devices from smartphones (320px) to large desktops (1440px+) using modern CSS techniques and mobile-first methodology.

## Core Principles

1. **Mobile-First**: Design for smallest screen first, progressively enhance for larger
2. **Fluid Typography**: Use `clamp()` for scalable text across viewports
3. **Flexible Layouts**: CSS Grid and Flexbox for adaptable structures
4. **Touch-Friendly**: 44x44px minimum touch targets, adequate spacing
5. **Performance**: Optimize for mobile networks (lazy loading, efficient CSS)
6. **Content Priority**: Most important content visible without scrolling on mobile

## Breakpoints

Riksdagsmonitor uses standard breakpoints aligned with common devices:

```css
/* Default: Mobile-first (320px - 767px) */
/* Base styles for smallest screens */

/* Tablet: Medium screens */
@media (min-width: 768px) {
  /* iPad portrait, tablets */
}

/* Desktop: Large screens */
@media (min-width: 1024px) {
  /* Laptop, desktop monitors */
}

/* Large Desktop: Extra large screens */
@media (min-width: 1440px) {
  /* High-res monitors, 4K displays */
}

/* Ultra-wide: Maximum width constraint */
@media (min-width: 1920px) {
  /* Ultra-wide monitors */
  max-width: 1920px;
  margin: 0 auto;
}
```

## Enforces

### Fluid Typography with clamp()
```css
/* Scalable headings without media queries */
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
  /* Min: 32px, Preferred: 5vw + 16px, Max: 64px */
}

h2 {
  font-size: clamp(1.5rem, 4vw + 0.5rem, 3rem);
}

body {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.6;
}
```

### CSS Grid Responsive Layouts
```css
/* Auto-responsive grid without media queries */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 1.5rem;
}

/* Dashboard layout with sidebar */
.dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .dashboard {
    grid-template-columns: 250px 1fr;
  }
}
```

### Flexbox Navigation
```css
/* Mobile: Vertical stack */
nav ul {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Desktop: Horizontal bar */
@media (min-width: 768px) {
  nav ul {
    flex-direction: row;
    justify-content: space-between;
  }
}
```

### Touch-Friendly Targets
```css
/* Minimum 44x44px for touch targets */
button,
a.button,
.nav-link {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Responsive Images
```html
<!-- Picture element for art direction -->
<picture>
  <source media="(min-width: 1024px)" srcset="hero-desktop.jpg">
  <source media="(min-width: 768px)" srcset="hero-tablet.jpg">
  <img src="hero-mobile.jpg" alt="Riksdag building" loading="lazy">
</picture>

<!-- Responsive width -->
<img src="chart.png" alt="Voting chart" style="width: 100%; height: auto;">
```

### Viewport Meta Tag (Required)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Container Queries (Modern)
```css
/* Container-based responsiveness */
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 150px 1fr;
  }
}
```

## Device Categories

### Mobile (320px - 767px)
- **Primary Use**: iPhone, Android phones
- **Layout**: Single column, vertical stack
- **Navigation**: Hamburger menu or bottom tabs
- **Typography**: 16px base, larger touch targets
- **Images**: Mobile-optimized, lazy loading

### Tablet (768px - 1023px)
- **Primary Use**: iPad, Android tablets
- **Layout**: 2-column grids, flexible sidebars
- **Navigation**: Horizontal tabs or expanded menu
- **Typography**: 16-18px base
- **Images**: Medium resolution

### Desktop (1024px - 1439px)
- **Primary Use**: Laptops, standard monitors
- **Layout**: 3-column grids, persistent sidebars
- **Navigation**: Full horizontal menu
- **Typography**: 16-18px base
- **Images**: High resolution

### Large Desktop (1440px+)
- **Primary Use**: High-res monitors, 4K displays
- **Layout**: Wide layouts with max-width constraint
- **Navigation**: Full menu with space for branding
- **Typography**: 18-20px base
- **Images**: Retina-quality

## When to Use

- **All HTML/CSS development** for Riksdagsmonitor
- **New feature implementation** requiring cross-device support
- **Dashboard design** for political metrics
- **Data visualization** that adapts to screen size
- **Navigation redesign** for 14-language support
- **Accessibility improvements** ensuring mobile usability
- **Performance optimization** for mobile networks

## Examples

### Good Pattern: Mobile-First Dashboard
```css
/* Mobile: Single column */
.dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

.widget {
  padding: 1rem;
  background: var(--card-bg);
  border-radius: 8px;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .dashboard {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

/* Desktop: 3 columns with sidebar */
@media (min-width: 1024px) {
  .dashboard {
    grid-template-columns: 250px repeat(2, 1fr);
    gap: 2rem;
    padding: 2rem;
  }
  
  .sidebar {
    grid-column: 1;
    grid-row: 1 / -1;
  }
}
```

### Good Pattern: Responsive Typography Scale
```css
:root {
  /* Fluid spacing */
  --space-xs: clamp(0.5rem, 1vw, 0.75rem);
  --space-sm: clamp(0.75rem, 2vw, 1rem);
  --space-md: clamp(1rem, 3vw, 1.5rem);
  --space-lg: clamp(1.5rem, 4vw, 2rem);
  --space-xl: clamp(2rem, 5vw, 3rem);
  
  /* Fluid font sizes */
  --text-sm: clamp(0.875rem, 1.5vw, 1rem);
  --text-base: clamp(1rem, 2vw, 1.125rem);
  --text-lg: clamp(1.125rem, 2.5vw, 1.25rem);
  --text-xl: clamp(1.25rem, 3vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 4vw, 2rem);
  --text-3xl: clamp(2rem, 5vw, 3rem);
}

body {
  font-size: var(--text-base);
  padding: var(--space-md);
}

h1 {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-lg);
}
```

### Good Pattern: Responsive Navigation
```html
<!-- Mobile-first navigation -->
<nav class="main-nav">
  <button class="menu-toggle" aria-label="Toggle menu">☰</button>
  <ul class="nav-list">
    <li><a href="#overview">Overview</a></li>
    <li><a href="#parties">Parties</a></li>
    <li><a href="#mps">MPs</a></li>
  </ul>
</nav>

<style>
/* Mobile: Hidden menu, toggle button */
.menu-toggle {
  display: block;
  min-width: 44px;
  min-height: 44px;
}

.nav-list {
  display: none;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-list.open {
  display: flex;
}

/* Desktop: Always visible, horizontal */
@media (min-width: 768px) {
  .menu-toggle {
    display: none;
  }
  
  .nav-list {
    display: flex;
    flex-direction: row;
    gap: 2rem;
  }
}
</style>
```

### Anti-Pattern: Desktop-First Approach
```css
/* ❌ BAD: Desktop-first, overcomplicated mobile overrides */
.widget {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding: 2rem;
}

@media (max-width: 1023px) {
  .widget {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (max-width: 767px) {
  .widget {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
}

/* ✅ GOOD: Mobile-first, progressive enhancement */
.widget {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .widget {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .widget {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    padding: 2rem;
  }
}
```

### Anti-Pattern: Fixed Pixel Sizes
```css
/* ❌ BAD: Fixed sizes don't adapt */
h1 {
  font-size: 48px;
}

.container {
  width: 1200px;
}

/* ✅ GOOD: Fluid, adaptable sizes */
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
}

.container {
  width: min(1200px, 100% - 2rem);
  margin-inline: auto;
}
```

## Testing Responsive Design

### Browser DevTools
```javascript
// Test key breakpoints in Chrome DevTools
const breakpoints = [
  { width: 320, height: 568, device: 'iPhone SE' },
  { width: 375, height: 667, device: 'iPhone 8' },
  { width: 768, height: 1024, device: 'iPad' },
  { width: 1024, height: 768, device: 'iPad Pro' },
  { width: 1920, height: 1080, device: 'Desktop HD' }
];
```

### Playwright Testing
```javascript
// test/responsive.spec.js
const { test, expect } = require('@playwright/test');

test('Responsive layout adapts correctly', async ({ page }) => {
  await page.goto('http://localhost:8080/');
  
  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'screenshots/mobile.png' });
  
  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'screenshots/tablet.png' });
  
  // Desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'screenshots/desktop.png' });
});
```

## Remember

- **Mobile-first always** - start with smallest screen
- **Use clamp() for typography** - fluid, responsive text without media queries
- **CSS Grid for layouts** - modern, flexible, powerful
- **44x44px touch targets** minimum for accessibility
- **Test on real devices** when possible
- **Optimize for mobile networks** - lazy loading, efficient CSS
- **Progressive enhancement** - core functionality works everywhere
- **Container queries** for component-level responsiveness (modern browsers)
- **Viewport meta tag** required in all HTML files
- **Max-width constraint** for ultra-wide screens (1920px)

## References

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [CSS-Tricks: A Complete Guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [CSS-Tricks: A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
- [MDN: Using Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries)
- [Can I Use: CSS Container Queries](https://caniuse.com/css-container-queries)

---

**Version**: 1.0  
**Last Updated**: 2026-02-06  
**Maintained by**: Hack23 AB
