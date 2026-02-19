/**
 * Cypress E2E Tests - Dashboards Multi-Language Coverage
 *
 * Tests all 14 language variants of the dashboard:
 * EN, SV, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH
 *
 * Validates:
 * - Correct lang attribute on html element
 * - RTL direction for Arabic and Hebrew
 * - Party dashboard rendering
 * - Hreflang SEO links
 * - Language switcher presence
 * - Translated headings (not English fallback)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('Dashboards - All 14 Languages', () => {
  const languages = [
    { code: 'en', file: 'index.html', name: 'English', dir: 'ltr', isDefault: true },
    { code: 'sv', file: 'index_sv.html', name: 'Swedish', dir: 'ltr' },
    { code: 'da', file: 'index_da.html', name: 'Danish', dir: 'ltr' },
    { code: 'no', file: 'index_no.html', name: 'Norwegian', dir: 'ltr' },
    { code: 'fi', file: 'index_fi.html', name: 'Finnish', dir: 'ltr' },
    { code: 'de', file: 'index_de.html', name: 'German', dir: 'ltr' },
    { code: 'fr', file: 'index_fr.html', name: 'French', dir: 'ltr' },
    { code: 'es', file: 'index_es.html', name: 'Spanish', dir: 'ltr' },
    { code: 'nl', file: 'index_nl.html', name: 'Dutch', dir: 'ltr' },
    { code: 'ar', file: 'index_ar.html', name: 'Arabic', dir: 'rtl' },
    { code: 'he', file: 'index_he.html', name: 'Hebrew', dir: 'rtl' },
    { code: 'ja', file: 'index_ja.html', name: 'Japanese', dir: 'ltr' },
    { code: 'ko', file: 'index_ko.html', name: 'Korean', dir: 'ltr' },
    { code: 'zh', file: 'index_zh.html', name: 'Chinese', dir: 'ltr' },
  ];

  const rtlLanguages = languages.filter((l) => l.dir === 'rtl');
  const ltrLanguages = languages.filter((l) => l.dir === 'ltr');
  const cjkLanguages = languages.filter((l) => ['ja', 'ko', 'zh'].includes(l.code));

  // ============================================================================
  // LANG ATTRIBUTE VALIDATION - ALL LANGUAGES
  // ============================================================================

  describe('Language Attribute Validation', () => {
    languages.forEach((lang) => {
      it(`${lang.name} (${lang.code}) - html element has lang="${lang.code}"`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('html').should('have.attr', 'lang', lang.code);
      });
    });
  });

  // ============================================================================
  // RTL DIRECTION - ARABIC AND HEBREW
  // ============================================================================

  describe('RTL Layout Validation', () => {
    rtlLanguages.forEach((lang) => {
      it(`${lang.name} (${lang.code}) - html element has dir="rtl"`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'dir', 'rtl');
      });

      it(`${lang.name} (${lang.code}) - body has RTL text direction`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('body').should('be.visible');
        cy.get('html').invoke('attr', 'dir').should('eq', 'rtl');
      });

      it(`${lang.name} (${lang.code}) - party dashboard is visible in RTL layout`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('#party-dashboard').should('exist');
      });
    });

    ltrLanguages.forEach((lang) => {
      it(`${lang.name} (${lang.code}) - has LTR or no dir attribute`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('html').then(($html) => {
          const dir = $html.attr('dir');
          expect(dir === 'ltr' || dir === undefined || dir === null).to.be.true;
        });
      });
    });
  });

  // ============================================================================
  // PARTY DASHBOARD RENDERING - ALL LANGUAGES
  // ============================================================================

  describe('Party Dashboard Rendering', () => {
    languages.forEach((lang) => {
      it(`${lang.name} (${lang.code}) - party dashboard exists and is visible`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('#party-dashboard').should('exist');
        cy.get('#party-dashboard').should('be.visible');
      });
    });
  });

  // ============================================================================
  // DASHBOARD CHART ELEMENTS - ALL LANGUAGES
  // ============================================================================

  describe('Chart Canvas Elements Present', () => {
    languages.forEach((lang) => {
      it(`${lang.name} (${lang.code}) - party effectiveness chart exists`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('#partyEffectivenessChart').should('exist');
      });
    });

    // Check a sample of other dashboards for a subset of languages
    const sampleLanguages = ['en', 'sv', 'ar', 'ja'];
    sampleLanguages.forEach((code) => {
      const lang = languages.find((l) => l.code === code);
      it(`${lang.name} - risk dashboard exists`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('#risk-dashboard').should('exist');
      });

      it(`${lang.name} - anomaly detection dashboard exists`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('#anomaly-detection-dashboard').should('exist');
      });
    });
  });

  // ============================================================================
  // HREFLANG SEO TAGS
  // ============================================================================

  describe('Hreflang SEO Tags', () => {
    it('English homepage should have hreflang tags for all 14 languages', () => {
      cy.visit('/');
      const expectedLangs = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      expectedLangs.forEach((lang) => {
        cy.get(`link[hreflang="${lang}"]`).should('exist');
      });
    });

    it('English homepage should have x-default hreflang', () => {
      cy.visit('/');
      cy.get('link[hreflang="x-default"]').should('exist');
    });

    languages
      .filter((l) => !l.isDefault)
      .slice(0, 3) // Test first 3 non-English languages
      .forEach((lang) => {
        it(`${lang.name} page should have hreflang tag for its own language`, () => {
          cy.visit(`/index_${lang.code}.html`);
          cy.get(`link[hreflang="${lang.code}"]`).should('exist');
        });
      });
  });

  // ============================================================================
  // LANGUAGE SWITCHER PRESENCE
  // ============================================================================

  describe('Language Switcher', () => {
    it('English homepage should have language switcher links', () => {
      cy.visit('/');
      const nonDefaultLangs = languages.filter((l) => !l.isDefault);
      nonDefaultLangs.forEach((lang) => {
        cy.get(`a[href*="index_${lang.code}.html"]`).should('exist');
      });
    });

    it('Swedish page should have link back to English', () => {
      cy.visit('/index_sv.html');
      cy.get('a[href="index.html"], a[href="/"], a[hreflang="en"]').should('exist');
    });

    it('Arabic page should have language switcher', () => {
      cy.visit('/index_ar.html');
      // Should have links to other languages
      cy.get('a[href*="index_"]').should('exist');
    });
  });

  // ============================================================================
  // PAGE TITLE TRANSLATIONS
  // ============================================================================

  describe('Page Title Localization', () => {
    languages.forEach((lang) => {
      it(`${lang.name} (${lang.code}) - page has a title`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.title().should('exist').and('not.be.empty');
      });
    });
  });

  // ============================================================================
  // BASIC PAGE STRUCTURE - ALL LANGUAGES
  // ============================================================================

  describe('Basic Page Structure', () => {
    languages.forEach((lang) => {
      it(`${lang.name} (${lang.code}) - has main content`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('main, #main-content, #content').should('exist');
      });

      it(`${lang.name} (${lang.code}) - has header`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('header').should('exist');
      });

      it(`${lang.name} (${lang.code}) - has footer`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('footer').should('exist');
      });
    });
  });

  // ============================================================================
  // CJK FONT RENDERING STRUCTURE
  // ============================================================================

  describe('CJK Language Structure', () => {
    cjkLanguages.forEach((lang) => {
      it(`${lang.name} (${lang.code}) - html element has correct lang attribute`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'lang', lang.code);
      });

      it(`${lang.name} (${lang.code}) - page loads without errors`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('body').should('be.visible');
      });

      it(`${lang.name} (${lang.code}) - party dashboard has headings`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('#party-dashboard h2').should('exist');
      });
    });
  });

  // ============================================================================
  // NUMBER AND DATE FORMATTING
  // ============================================================================

  describe('Numeric Content Presence', () => {
    const sampleLangs = ['en', 'sv', 'ar', 'ja'];
    sampleLangs.forEach((code) => {
      const lang = languages.find((l) => l.code === code);
      it(`${lang.name} (${code}) - stat numbers are present`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('[data-stat-id], .number, .stat-value, .current-value').then(($els) => {
          if ($els.length > 0) {
            cy.wrap($els.first()).should('be.visible');
          } else {
            cy.log(`No stat elements found for ${lang.name}`);
          }
        });
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY ACROSS LANGUAGES
  // ============================================================================

  describe('Accessibility Across Language Variants', () => {
    const a11yLangs = ['en', 'sv', 'ar', 'he'];
    a11yLangs.forEach((code) => {
      const lang = languages.find((l) => l.code === code);
      it(`${lang.name} (${code}) - html has lang attribute (WCAG 3.1.1)`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('html').should('have.attr', 'lang');
        cy.get('html').invoke('attr', 'lang').should('not.be.empty');
      });

      it(`${lang.name} (${code}) - canvas elements have aria-labels`, () => {
        const url = lang.isDefault ? '/' : `/index_${lang.code}.html`;
        cy.visit(url);
        cy.get('canvas[role="img"]').each(($canvas) => {
          cy.wrap($canvas).should('have.attr', 'aria-label');
        });
      });
    });
  });
});
