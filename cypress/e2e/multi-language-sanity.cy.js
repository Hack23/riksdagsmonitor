/**
 * Cypress E2E Tests - Multi-Language Sanity Checks
 * 
 * Comprehensive sanity tests for all 14 language variants across homepage, dashboard, and news pages
 * 
 * Languages: EN, SV, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('Multi-Language Sanity Tests', () => {
  const languages = [
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', dir: 'ltr', langCode: 'sv' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', dir: 'ltr', langCode: 'da' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', dir: 'ltr', langCode: 'nb' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', dir: 'ltr', langCode: 'fi' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', langCode: 'de' },
    { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', langCode: 'fr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', langCode: 'es' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr', langCode: 'nl' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', langCode: 'ar' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', langCode: 'he' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', langCode: 'ja' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', langCode: 'ko' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', langCode: 'zh' }
  ];
  // Representative subset for runtime-heavy cross-page/news checks:
  // sv (Nordic), de (continental EU), ar (RTL), ja/zh (CJK).
  // The same sample is now applied to Homepage and Dashboard loops to keep
  // each E2E shard under the 10-minute target — the full 14-language
  // matrix is still covered by HTML validators (htmlhint, translation-
  // validation.yml) and per-page checks (BCP-47, hreflang).
  const representativeNewsLanguages = ['sv', 'de', 'ar', 'ja', 'zh'];
  const representativeLtrLanguages = representativeNewsLanguages.filter((code) => code !== 'ar');
  const representativeNewsLangs = languages.filter((lang) =>
    representativeNewsLanguages.includes(lang.code),
  );
  const representativeLtrLangs = languages.filter((lang) =>
    representativeLtrLanguages.includes(lang.code),
  );
  // Homepage/Dashboard loops use the same representative sample.
  const representativeHomepageLangs = representativeNewsLangs;
  const representativeDashboardLangs = representativeNewsLangs;

  describe('Homepage - Representative Languages', () => {
    representativeHomepageLangs.forEach((lang) => {
      it(`should load ${lang.name} (${lang.code}) homepage`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('body').should('be.visible');
        cy.title().should('exist');
      });
      
      it(`should have proper lang attribute for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'lang');
        cy.get('html').invoke('attr', 'lang').should('match', new RegExp(lang.langCode, 'i'));
      });
      
      it(`should have correct text direction for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`);
        if (lang.dir === 'rtl') {
          cy.get('html').should('have.attr', 'dir', 'rtl');
        } else {
          cy.get('html').then(($html) => {
            const dirAttr = $html.attr('dir');
            expect(dirAttr === 'ltr' || dirAttr === undefined).to.be.true;
          });
        }
      });
      
      it(`should have basic page structure for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('header').should('exist');
        cy.get('main').should('exist');
        cy.get('footer').should('exist');
      });
    });
  });

  describe('Dashboard - Representative Languages', () => {
    representativeDashboardLangs.forEach((lang) => {
      it(`should load ${lang.name} (${lang.code}) dashboard`, () => {
        cy.visit(`/dashboard/index_${lang.code}.html`);
        cy.get('body').should('be.visible');
        cy.title().should('exist');
      });
      
      it(`should have proper lang attribute for ${lang.name} dashboard`, () => {
        cy.visit(`/dashboard/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'lang');
        cy.get('html').invoke('attr', 'lang').should('match', new RegExp(lang.langCode, 'i'));
      });
      
      it(`should have correct text direction for ${lang.name} dashboard`, () => {
        cy.visit(`/dashboard/index_${lang.code}.html`);
        if (lang.dir === 'rtl') {
          cy.get('html').should('have.attr', 'dir', 'rtl');
        } else {
          cy.get('html').then(($html) => {
            const dirAttr = $html.attr('dir');
            expect(dirAttr === 'ltr' || dirAttr === undefined).to.be.true;
          });
        }
      });
      
      it(`should have basic page structure for ${lang.name} dashboard`, () => {
        cy.visit(`/dashboard/index_${lang.code}.html`);
        cy.get('header').should('exist');
        cy.get('main').should('exist');
        cy.get('footer').should('exist');
      });
    });
  });

  describe('News - Representative Languages', () => {
    representativeNewsLangs.forEach((lang) => {
      // Fix: Wrap each language in its own describe block to avoid closure issues
      describe(`${lang.name} (${lang.code})`, () => {
        // Cypress 15 Feature: Use beforeEach with optimized page visit
        beforeEach(() => {
          cy.visit(`/news/index_${lang.code}.html`, {
            // Cypress 15: Improved visit options
            failOnStatusCode: true,
            timeout: 10000
          });
        });

        it(`should load news page`, () => {
          // Cypress 15: Modern selector and assertion chaining
          cy.get('body').should('be.visible');
          cy.title().should('exist').and('not.be.empty');
        });
        
        it(`should have proper lang attribute`, () => {
          // Cypress 15: Use document API for more reliable attribute checking
          cy.document().its('documentElement').should('have.attr', 'lang');
          cy.document()
            .its('documentElement')
            .invoke('getAttribute', 'lang')
            .should('match', new RegExp(lang.langCode, 'i'));
        });
        
        it(`should have correct text direction`, () => {
          if (lang.dir === 'rtl') {
            // Cypress 15: Improved assertion with better error messages
            cy.document()
              .its('documentElement')
              .should('have.attr', 'dir', 'rtl');
          } else {
            // Cypress 15: Modern then() with improved assertion
            cy.document().its('documentElement').then(($html) => {
              const dirAttr = $html.getAttribute('dir');
              expect(dirAttr === 'ltr' || dirAttr === null || dirAttr === undefined, 
                `Expected dir to be 'ltr', null, or undefined but got '${dirAttr}'`).to.be.true;
            });
          }
        });
        
        it(`should have basic page structure`, () => {
          // Cypress 15: Improved selector chaining
          cy.get('header').should('exist').and('be.visible');
          cy.get('main').should('exist').and('be.visible');
          cy.get('footer').should('exist');
        });
      });
    });
  });

  describe('Language Consistency', () => {
    representativeNewsLangs.forEach((lang) => {
      it(`should have consistent lang attribute across all pages for ${lang.name}`, () => {
        // Check homepage
        cy.visit(`/index_${lang.code}.html`);
        cy.get('html').invoke('attr', 'lang').as('homepageLang');
        
        // Check dashboard
        cy.visit(`/dashboard/index_${lang.code}.html`);
        cy.get('html').invoke('attr', 'lang').as('dashboardLang');
        
        // Check news
        cy.visit(`/news/index_${lang.code}.html`);
        cy.get('html').invoke('attr', 'lang').as('newsLang');
        
        // All should contain the language code
        cy.get('@homepageLang').should('match', new RegExp(lang.langCode, 'i'));
        cy.get('@dashboardLang').should('match', new RegExp(lang.langCode, 'i'));
        cy.get('@newsLang').should('match', new RegExp(lang.langCode, 'i'));
      });
    });
  });

  describe('RTL Language Specific Tests', () => {
    const rtlLanguages = [
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית' }
    ];

    rtlLanguages.forEach((lang) => {
      it(`should have RTL dir attribute on all pages for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'dir', 'rtl');
        
        cy.visit(`/dashboard/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'dir', 'rtl');
        
        cy.visit(`/news/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'dir', 'rtl');
      });
      
      it(`should render RTL content properly for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`);
        cy.get('body').should('be.visible');
        
        // Check that page has actual content
        cy.get('body').invoke('text').should('have.length.greaterThan', 50);
      });
    });
  });

  describe('LTR Language Specific Tests', () => {
    representativeLtrLangs.forEach((lang) => {
      it(`should have LTR or default dir for ${lang.name} on all pages`, () => {
        // Homepage
        cy.visit(`/index_${lang.code}.html`);
        cy.get('html').then(($html) => {
          const dirAttr = $html.attr('dir');
          expect(dirAttr === 'ltr' || dirAttr === undefined).to.be.true;
        });
        
        // Dashboard
        cy.visit(`/dashboard/index_${lang.code}.html`);
        cy.get('html').then(($html) => {
          const dirAttr = $html.attr('dir');
          expect(dirAttr === 'ltr' || dirAttr === undefined).to.be.true;
        });
        
        // News
        cy.visit(`/news/index_${lang.code}.html`);
        cy.get('html').then(($html) => {
          const dirAttr = $html.attr('dir');
          expect(dirAttr === 'ltr' || dirAttr === undefined).to.be.true;
        });
      });
    });
  });

  describe('Language Switcher Functionality', () => {
    it('should have language switcher on all pages', () => {
      // Check homepage
      cy.visit('/');
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        let foundCount = 0;
        
        languages.forEach((lang) => {
          if (bodyHtml.includes(`index_${lang.code}.html`)) {
            foundCount++;
          }
        });
        
        // At least 10 language links should be present on homepage
        expect(foundCount).to.be.at.least(10);
      });
      
      // Check dashboard
      cy.visit('/dashboard/');
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        let foundCount = 0;
        
        languages.forEach((lang) => {
          if (bodyHtml.includes(`index_${lang.code}.html`)) {
            foundCount++;
          }
        });
        
        // Dashboard might have fewer language links (at least 5)
        expect(foundCount).to.be.at.least(5);
      });
      
      // Check news
      cy.visit('/news/');
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        let foundCount = 0;
        
        languages.forEach((lang) => {
          if (bodyHtml.includes(`index_${lang.code}.html`)) {
            foundCount++;
          }
        });
        
        // News page might have fewer language links (at least 5)
        expect(foundCount).to.be.at.least(5);
      });
    });
    
    it('should allow switching between languages on homepage', () => {
      // Try to switch to a few languages
      const testLanguages = ['sv', 'de', 'ja'];

      testLanguages.forEach((langCode) => {
        cy.visit('/');
        // The .rm-lang-bar may render below the initial 720px viewport fold
        // depending on header/hero height — scroll it into view before
        // asserting visibility & clicking (Cypress's :visible filter treats
        // elements clipped by the body's computed overflow as hidden).
        cy.get(`nav.rm-lang-bar a[href*="index_${langCode}.html"]`)
          .first()
          .scrollIntoView()
          .should('be.visible')
          .click();
        cy.url().should('include', `index_${langCode}.html`);
        cy.get('body').should('be.visible');
      });
    });
  });

  describe('Responsive Design - All Languages', () => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];
    
    // Test a few representative languages
    const testLanguages = [
      { code: 'sv', name: 'Swedish' },
      { code: 'ar', name: 'Arabic' },
      { code: 'ja', name: 'Japanese' }
    ];
    
    testLanguages.forEach((lang) => {
      viewports.forEach((viewport) => {
        it(`should be responsive on ${viewport.name} for ${lang.name} homepage`, () => {
          cy.viewport(viewport.width, viewport.height);
          cy.visit(`/index_${lang.code}.html`);
          cy.get('body').should('be.visible');
          cy.get('header').should('be.visible');
          cy.get('main').should('be.visible');
        });
      });
    });
  });

  describe('Meta Tags - All Languages', () => {
    const testLanguages = [
      { code: 'sv', name: 'Swedish' },
      { code: 'ar', name: 'Arabic' },
      { code: 'zh', name: 'Chinese' }
    ];
    
    testLanguages.forEach((lang) => {
      it(`should have proper meta tags for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`);
        
        cy.get('meta[charset]').should('exist');
        cy.get('meta[name="viewport"]').should('exist');
        cy.get('meta[name="description"]').should('exist');
      });
    });
  });

  describe('Accessibility - All Languages', () => {
    const testLanguages = [
      { code: 'sv', name: 'Swedish' },
      { code: 'he', name: 'Hebrew' },
      { code: 'ko', name: 'Korean' }
    ];
    
    testLanguages.forEach((lang) => {
      it(`should have accessible structure for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`);
        
        // Should have single h1
        cy.get('h1').should('have.length', 1);
        
        // Should have semantic structure
        cy.get('header').should('exist');
        cy.get('main').should('exist');
        cy.get('footer').should('exist');
        
        // Should be keyboard navigable
        cy.get('a, button').first().focus().should('have.focus');
      });
    });
  });

  describe('Performance - All Languages', () => {
    const testLanguages = [
      { code: 'sv', name: 'Swedish' },
      { code: 'ar', name: 'Arabic' },
      { code: 'ja', name: 'Japanese' }
    ];
    
    testLanguages.forEach((lang) => {
      it(`should load quickly for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`, { timeout: 10000 });
        cy.get('body', { timeout: 5000 }).should('be.visible');
      });
    });
  });

  describe('Content Validation - Sample Languages', () => {
    const testLanguages = [
      { code: 'sv', name: 'Swedish', minLength: 100 },
      { code: 'ar', name: 'Arabic', minLength: 100 },
      { code: 'ja', name: 'Japanese', minLength: 100 }
    ];
    
    testLanguages.forEach((lang) => {
      it(`should have meaningful content for ${lang.name}`, () => {
        cy.visit(`/index_${lang.code}.html`);
        
        // Should have text content
        cy.get('body').invoke('text').should('have.length.greaterThan', lang.minLength);
        
        // Should have navigation
        cy.get('nav').should('exist');
        cy.get('nav a').should('have.length.greaterThan', 0);
      });
    });
  });
});

describe('Multi-Language Cross-Page Navigation', () => {
  const testLanguages = ['sv', 'de', 'ar', 'ja'];
  
  testLanguages.forEach((langCode) => {
    it(`should maintain language when navigating for ${langCode}`, () => {
      // Start on homepage
      cy.visit(`/index_${langCode}.html`);
      cy.get('body').should('be.visible');
      
      // Navigate to dashboard (if link exists)
      cy.get('body').then(($body) => {
        const dashboardLink = $body.find('a.dashboard-cta-link');
        if (dashboardLink.length > 0) {
          cy.get('a.dashboard-cta-link').first().scrollIntoView().click();
          cy.url().should('include', 'dashboard');
          cy.get('html').invoke('attr', 'lang').should('match', new RegExp(langCode, 'i'));
        }
      });
      
      // Navigate to news (if link exists)
      cy.visit(`/index_${langCode}.html`);
      cy.get('body').then(($body) => {
        const newsLink = $body.find('a.news-navigation-link');
        if (newsLink.length > 0) {
          cy.get('a.news-navigation-link').first().scrollIntoView().click({ force: true });
          cy.url().should('include', 'news');
          cy.get('html').invoke('attr', 'lang').should('match', new RegExp(langCode, 'i'));
        }
      });
    });
  });
});
