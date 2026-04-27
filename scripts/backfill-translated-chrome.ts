/**
 * Surgical post-processor that injects the Sponsor Hack23 / Transparency &
 * Security CTAs into the modern `.rm-site-header` and the new Hack23 ISMS
 * column + trust-badges row into the modern `.rm-site-footer` for HTML files
 * that were rendered by an older revision of `scripts/render-lib/chrome.ts`
 * (typically pre-translated language variants of news articles which we do
 * not re-translate on every build).
 *
 * Idempotent: pages that already contain the new markers are skipped.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const HEADER_CTAS = `        <a class="rm-header-cta rm-header-cta-transparency"
           href="https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY.md"
           target="_blank" rel="noopener noreferrer"
           title="Hack23 commitment to transparency and security"
           aria-label="Hack23 commitment to transparency and security">
          <span class="rm-header-cta-icon" aria-hidden="true">🔐</span>
          <span class="rm-header-cta-label">Transparency &amp; Security</span>
        </a>
        <a class="rm-header-cta rm-header-cta-sponsor"
           href="https://github.com/sponsors/Hack23"
           target="_blank" rel="noopener noreferrer"
           title="Become a sponsor to Hack23 on GitHub"
           aria-label="Sponsor Hack23 on GitHub">
          <span class="rm-header-cta-icon" aria-hidden="true">💖</span>
          <span class="rm-header-cta-label">Sponsor Hack23</span>
        </a>
`;

const ISMS_COLUMN = `        <section class="rm-footer-col rm-footer-isms" aria-labelledby="rm-ft-isms">
          <h2 id="rm-ft-isms" class="rm-footer-heading"><span aria-hidden="true">🛡️</span> Hack23 ISMS</h2>
          <p class="rm-footer-isms-tagline">Public ISMS aligned with ISO 27001:2022, NIST CSF 2.0, CIS Controls v8.1, EU CRA &amp; NIS2.</p>
          <ul>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">Public ISMS repository</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md" target="_blank" rel="noopener noreferrer">Information Security Policy</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Privacy_Policy.md" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer">Secure Development Policy</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md" target="_blank" rel="noopener noreferrer">AI Policy</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md" target="_blank" rel="noopener noreferrer">Threat Modeling</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md" target="_blank" rel="noopener noreferrer">Vulnerability Management</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md" target="_blank" rel="noopener noreferrer">Incident Response Plan</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Access_Control_Policy.md" target="_blank" rel="noopener noreferrer">Access Control Policy</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md" target="_blank" rel="noopener noreferrer">Cryptography Policy</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md" target="_blank" rel="noopener noreferrer">Open Source Policy</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md" target="_blank" rel="noopener noreferrer">Change Management</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md" target="_blank" rel="noopener noreferrer">Classification</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md" target="_blank" rel="noopener noreferrer">Security Metrics</a></li>
          </ul>
        </section>
`;

const TRUST_BADGES = `      <nav class="rm-footer-trust-badges" aria-label="Open trust, quality and security badges">
        <a href="https://www.npmjs.com/package/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor on npmjs"><img src="https://img.shields.io/npm/v/riksdagsmonitor.svg?logo=npm&label=npm" alt="Riksdagsmonitor on npmjs" width="100" height="20" loading="lazy" decoding="async"></a>
        <a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Scorecard"><img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard" width="120" height="20" loading="lazy" decoding="async"></a>
        <a href="https://www.bestpractices.dev/projects/12069" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Best Practices"><img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices" width="124" height="20" loading="lazy" decoding="async"></a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml" target="_blank" rel="noopener noreferrer" aria-label="CodeQL workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml/badge.svg" alt="CodeQL workflow status" width="120" height="20" loading="lazy" decoding="async"></a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml" target="_blank" rel="noopener noreferrer" aria-label="Quality checks workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml/badge.svg" alt="Quality checks workflow status" width="160" height="20" loading="lazy" decoding="async"></a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml" target="_blank" rel="noopener noreferrer" aria-label="Dependency review workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml/badge.svg" alt="Dependency review workflow status" width="170" height="20" loading="lazy" decoding="async"></a>
        <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" aria-label="Apache-2.0 License"><img src="https://img.shields.io/github/license/Hack23/riksdagsmonitor" alt="Apache-2.0 License" width="120" height="20" loading="lazy" decoding="async"></a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer" aria-label="Hack23 ISMS-PUBLIC"><img src="https://img.shields.io/badge/Hack23-ISMS-blue?logo=shield" alt="Hack23 ISMS-PUBLIC" width="100" height="20" loading="lazy" decoding="async"></a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="ISO 27001:2022 alignment"><img src="https://img.shields.io/badge/ISO-27001:2022-purple" alt="ISO 27001:2022 alignment" width="110" height="20" loading="lazy" decoding="async"></a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="NIST CSF 2.0 alignment"><img src="https://img.shields.io/badge/NIST-CSF_2.0-orange" alt="NIST CSF 2.0 alignment" width="100" height="20" loading="lazy" decoding="async"></a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="CIS Controls v8.1 alignment"><img src="https://img.shields.io/badge/CIS-Controls_v8.1-red" alt="CIS Controls v8.1 alignment" width="120" height="20" loading="lazy" decoding="async"></a>
        <a href="https://riksdagsmonitor.com" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor.com website status"><img src="https://img.shields.io/website?url=https%3A%2F%2Friksdagsmonitor.com" alt="Riksdagsmonitor.com website status" width="120" height="20" loading="lazy" decoding="async"></a>
      </nav>
`;

interface Stats {
  scanned: number;
  headerPatched: number;
  footerPatched: number;
  alreadyCurrent: number;
  noModernChrome: number;
}

function injectLegacyTranslatedHeaderCtas(html: string): { html: string; changed: boolean } {
  // Translated articles use `<header role="banner">` with a `<nav role="navigation">`
  // and no `site-header-nav`/`rm-site-header` markers. Inject the sponsor +
  // transparency anchors right before the closing </nav> of the banner header.
  if (html.includes('rm-header-cta-sponsor')) return { html, changed: false };
  const bannerHeader = html.match(/<header[^>]*role="banner"[^>]*>([\s\S]*?)<\/header>/i);
  if (!bannerHeader) return { html, changed: false };
  const inner = bannerHeader[1];
  if (!/<nav[^>]*role="navigation"[^>]*>([\s\S]*?)<\/nav>/i.test(inner)) {
    return { html, changed: false };
  }
  const ctas = `\n    <a class="rm-header-cta rm-header-cta-transparency" href="https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" title="Hack23 commitment to transparency and security" aria-label="Hack23 commitment to transparency and security"><span class="rm-header-cta-icon" aria-hidden="true">🔐</span> <span class="rm-header-cta-label">Transparency &amp; Security</span></a>\n    <a class="rm-header-cta rm-header-cta-sponsor" href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer" title="Become a sponsor to Hack23 on GitHub" aria-label="Sponsor Hack23 on GitHub"><span class="rm-header-cta-icon" aria-hidden="true">💖</span> <span class="rm-header-cta-label">Sponsor Hack23</span></a>\n  `;
  const newInner = inner.replace(/(<\/nav>)/i, `${ctas}$1`);
  if (newInner === inner) return { html, changed: false };
  const next = html.replace(bannerHeader[0], bannerHeader[0].replace(inner, newInner));
  return { html: next, changed: true };
}

function injectModernHeaderCtas(html: string): { html: string; changed: boolean } {
  if (!html.includes('class="rm-site-header"')) return { html, changed: false };
  if (html.includes('rm-header-cta-sponsor')) return { html, changed: false };
  const themeTogglePattern = /(\s*)<button id="theme-toggle" class="rm-theme-toggle"/;
  if (!themeTogglePattern.test(html)) return { html, changed: false };
  const next = html.replace(themeTogglePattern, `\n${HEADER_CTAS}$1<button id="theme-toggle" class="rm-theme-toggle"`);
  return { html: next, changed: true };
}

function injectFooterIsmsAndBadges(html: string): { html: string; changed: boolean } {
  if (!html.includes('class="rm-site-footer"')) return { html, changed: false };
  let next = html;
  let changed = false;

  // Insert ISMS column right before the existing rm-footer-trust column whose
  // labelledby is `rm-ft-compliance` (the "Trust & compliance" column).
  if (!next.includes('id="rm-ft-isms"')) {
    const compliancePattern = /(\s*)<section class="rm-footer-col rm-footer-trust" aria-labelledby="rm-ft-compliance">/;
    if (compliancePattern.test(next)) {
      next = next.replace(compliancePattern, `\n${ISMS_COLUMN}$1<section class="rm-footer-col rm-footer-trust" aria-labelledby="rm-ft-compliance">`);
      changed = true;
    }
  }

  // Insert trust-badges row right before the language switcher nav.
  if (!next.includes('rm-footer-trust-badges')) {
    const langsPattern = /(\s*)<nav class="rm-footer-langs" aria-label="Switch language">/;
    if (langsPattern.test(next)) {
      next = next.replace(langsPattern, `\n${TRUST_BADGES}$1<nav class="rm-footer-langs" aria-label="Switch language">`);
      changed = true;
    }
  }

  // Add sponsor + Hack23 quick links into the existing "Built by Hack23 AB"
  // column so the footer-list link inventory matches the modern chrome.
  if (!next.includes('https://github.com/sponsors/Hack23')) {
    const linkedinAnchor = /(<li><a href="https:\/\/www\.linkedin\.com\/company\/hack23\/")/;
    if (linkedinAnchor.test(next)) {
      next = next.replace(
        linkedinAnchor,
        `<li><a href="https://www.hack23.com/riksdagsmonitor.html" target="_blank" rel="noopener noreferrer">Hack23 · Riksdagsmonitor</a></li>\n            <li><a href="https://www.hack23.com/riksdagsmonitor-features.html" target="_blank" rel="noopener noreferrer">Hack23 · Features</a></li>\n            <li><a href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">💖</span> Sponsor Hack23</a></li>\n            $1`,
      );
      changed = true;
    }
  }

  return { html: next, changed };
}

function* walkHtml(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (['node_modules', 'builds', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkHtml(full);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield full;
    }
  }
}

function main(): void {
  const stats: Stats = { scanned: 0, headerPatched: 0, footerPatched: 0, alreadyCurrent: 0, noModernChrome: 0 };

  const newsDir = path.join(ROOT_DIR, 'news');
  for (const absolute of walkHtml(newsDir)) {
    stats.scanned += 1;
    const before = fs.readFileSync(absolute, 'utf8');
    if (before.includes('rm-header-cta-sponsor') && before.includes('rm-footer-trust-badges')) {
      stats.alreadyCurrent += 1;
      continue;
    }
    let after = before;
    const modernHeader = injectModernHeaderCtas(after);
    if (modernHeader.changed) {
      stats.headerPatched += 1;
      after = modernHeader.html;
    } else {
      const legacyHeader = injectLegacyTranslatedHeaderCtas(after);
      if (legacyHeader.changed) {
        stats.headerPatched += 1;
        after = legacyHeader.html;
      }
    }
    const footerStep = injectFooterIsmsAndBadges(after);
    if (footerStep.changed) {
      stats.footerPatched += 1;
      after = footerStep.html;
    }
    if (after !== before) {
      fs.writeFileSync(absolute, after, 'utf8');
    } else if (!before.includes('class="rm-site-footer"') && !before.includes('class="site-footer"')
      && !before.includes('class="rm-site-header"') && !before.includes('role="banner"')) {
      stats.noModernChrome += 1;
    }
  }

  console.log(
    `Backfilled chrome on translated articles: scanned=${stats.scanned} headerPatched=${stats.headerPatched} footerPatched=${stats.footerPatched} alreadyCurrent=${stats.alreadyCurrent} noModernChrome=${stats.noModernChrome}`,
  );
}

main();
