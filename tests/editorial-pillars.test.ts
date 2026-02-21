import { describe, it, expect, afterEach, vi } from 'vitest';
import { 
  EDITORIAL_PILLAR_HEADINGS, 
  detectArticleLanguage, 
  getLocalizedHeading 
} from '../scripts/editorial-pillars.js';
import type { Language } from '../scripts/types/language.js';
import type { EditorialPillar, PillarHeadings } from '../scripts/types/editorial.js';

describe('editorial-pillars', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('EDITORIAL_PILLAR_HEADINGS', () => {
    it('should have all 14 supported languages', () => {
      const expectedLanguages: string[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      const actualLanguages: string[] = Object.keys(EDITORIAL_PILLAR_HEADINGS);
      
      expect(actualLanguages.sort()).toEqual(expectedLanguages.sort());
    });

    it('should have all 4 pillar headings for each language', () => {
      const expectedPillars: string[] = ['parliamentaryPulse', 'governmentWatch', 'oppositionDynamics', 'lookingAhead'];
      
      (Object.entries(EDITORIAL_PILLAR_HEADINGS) as Array<[Language, PillarHeadings]>).forEach(([lang, headings]) => {
        const actualPillars: string[] = Object.keys(headings);
        expect(actualPillars.sort()).toEqual(expectedPillars.sort());
      });
    });

    it('should have non-empty strings for all headings', () => {
      (Object.entries(EDITORIAL_PILLAR_HEADINGS) as Array<[Language, PillarHeadings]>).forEach(([lang, headings]) => {
        (Object.entries(headings) as Array<[EditorialPillar, string]>).forEach(([pillar, heading]) => {
          expect(typeof heading).toBe('string');
          expect(heading.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have unique headings per language (no duplicates)', () => {
      (Object.entries(EDITORIAL_PILLAR_HEADINGS) as Array<[Language, PillarHeadings]>).forEach(([lang, headings]) => {
        const headingValues: string[] = Object.values(headings);
        const uniqueHeadings: string[] = [...new Set(headingValues)];
        expect(headingValues.length).toBe(uniqueHeadings.length);
      });
    });

    it('should have correct English headings', () => {
      expect(EDITORIAL_PILLAR_HEADINGS.en).toEqual({
        parliamentaryPulse: 'Parliamentary Pulse',
        governmentWatch: 'Government Watch',
        oppositionDynamics: 'Opposition Dynamics',
        lookingAhead: 'Looking Ahead'
      });
    });

    it('should have correct Swedish headings', () => {
      expect(EDITORIAL_PILLAR_HEADINGS.sv).toEqual({
        parliamentaryPulse: 'Riksdagspulsen',
        governmentWatch: 'Regeringsbevakning',
        oppositionDynamics: 'Oppositionsdynamik',
        lookingAhead: 'Vad händer imorgon'
      });
    });
  });

  describe('detectArticleLanguage', () => {
    it('should detect English from HTML lang attribute', () => {
      const html = '<html lang="en"><head><title>Test</title></head></html>';
      expect(detectArticleLanguage(html)).toBe('en');
    });

    it('should detect Swedish from HTML lang attribute', () => {
      const html = '<html lang="sv"><head><title>Test</title></head></html>';
      expect(detectArticleLanguage(html)).toBe('sv');
    });

    it('should detect language with case-insensitive matching', () => {
      const html = '<html LANG="de"><head><title>Test</title></head></html>';
      expect(detectArticleLanguage(html)).toBe('de');
    });

    it('should detect language with extra attributes', () => {
      const html = '<html class="no-js" lang="fr" dir="ltr"><head><title>Test</title></head></html>';
      expect(detectArticleLanguage(html)).toBe('fr');
    });

    it('should fallback to English when lang attribute is missing', () => {
      const html = '<html><head><title>Test</title></head></html>';
      expect(detectArticleLanguage(html)).toBe('en');
    });

    it('should fallback to English when lang is unsupported', () => {
      const html = '<html lang="xx"><head><title>Test</title></head></html>';
      expect(detectArticleLanguage(html)).toBe('en');
    });

    it('should fallback to English for empty HTML', () => {
      expect(detectArticleLanguage('')).toBe('en');
    });

    it('should fallback to English for null input', () => {
      expect(detectArticleLanguage(null as unknown as string)).toBe('en');
    });

    it('should fallback to English for malformed HTML', () => {
      const html = '<html lang=><head><title>Test</title></head></html>';
      expect(detectArticleLanguage(html)).toBe('en');
    });

    it('should detect all 14 supported languages', () => {
      const languages: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
      languages.forEach((lang: Language) => {
        const html = `<html lang="${lang}"><head><title>Test</title></head></html>`;
        expect(detectArticleLanguage(html)).toBe(lang);
      });
    });

    it('should extract first lang attribute when multiple html tags', () => {
      const html = '<html lang="sv"><body><html lang="en"></body></html>';
      expect(detectArticleLanguage(html)).toBe('sv');
    });
  });

  describe('getLocalizedHeading', () => {
    it('should return correct heading for English', () => {
      expect(getLocalizedHeading('en', 'parliamentaryPulse')).toBe('Parliamentary Pulse');
      expect(getLocalizedHeading('en', 'governmentWatch')).toBe('Government Watch');
      expect(getLocalizedHeading('en', 'oppositionDynamics')).toBe('Opposition Dynamics');
      expect(getLocalizedHeading('en', 'lookingAhead')).toBe('Looking Ahead');
    });

    it('should return correct heading for Swedish', () => {
      expect(getLocalizedHeading('sv', 'parliamentaryPulse')).toBe('Riksdagspulsen');
      expect(getLocalizedHeading('sv', 'governmentWatch')).toBe('Regeringsbevakning');
      expect(getLocalizedHeading('sv', 'oppositionDynamics')).toBe('Oppositionsdynamik');
      expect(getLocalizedHeading('sv', 'lookingAhead')).toBe('Vad händer imorgon');
    });

    it('should return correct heading for Norwegian', () => {
      expect(getLocalizedHeading('no', 'parliamentaryPulse')).toBe('Parlamentarisk Puls');
      expect(getLocalizedHeading('no', 'governmentWatch')).toBe('Regjeringsovervåking');
    });

    it('should return correct heading for Arabic (RTL)', () => {
      expect(getLocalizedHeading('ar', 'parliamentaryPulse')).toBe('النبض البرلماني');
      expect(getLocalizedHeading('ar', 'governmentWatch')).toBe('مراقبة الحكومة');
    });

    it('should return correct heading for Hebrew (RTL)', () => {
      expect(getLocalizedHeading('he', 'parliamentaryPulse')).toBe('הדופק הפרלמנטרי');
      expect(getLocalizedHeading('he', 'governmentWatch')).toBe('מעקב אחר הממשלה');
    });

    it('should return correct heading for Japanese', () => {
      expect(getLocalizedHeading('ja', 'parliamentaryPulse')).toBe('議会の脈動');
      expect(getLocalizedHeading('ja', 'governmentWatch')).toBe('政府監視');
    });

    it('should fallback to English for unsupported language', () => {
      expect(getLocalizedHeading('xx', 'parliamentaryPulse')).toBe('Parliamentary Pulse');
      expect(getLocalizedHeading('invalid', 'governmentWatch')).toBe('Government Watch');
    });

    it('should fallback to English for null language', () => {
      expect(getLocalizedHeading(null as unknown as string, 'parliamentaryPulse')).toBe('Parliamentary Pulse');
    });

    it('should fallback to English for undefined language', () => {
      expect(getLocalizedHeading(undefined as unknown as string, 'governmentWatch')).toBe('Government Watch');
    });

    it('should handle all pillars for all 14 languages', () => {
      const languages: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      const pillars: EditorialPillar[] = ['parliamentaryPulse', 'governmentWatch', 'oppositionDynamics', 'lookingAhead'];
      
      languages.forEach((lang: Language) => {
        pillars.forEach((pillar: EditorialPillar) => {
          const heading: string = getLocalizedHeading(lang, pillar);
          expect(typeof heading).toBe('string');
          expect(heading.length).toBeGreaterThan(0);
        });
      });
    });

    it('should return undefined for non-existent pillar', () => {
      expect(getLocalizedHeading('en', 'nonExistentPillar' as EditorialPillar)).toBeUndefined();
    });
  });

  describe('Integration', () => {
    it('should work together: detect language and get localized heading', () => {
      const htmlSv = '<html lang="sv"><body><h2>Riksdagspulsen</h2></body></html>';
      const lang: Language = detectArticleLanguage(htmlSv);
      const heading: string = getLocalizedHeading(lang, 'parliamentaryPulse');
      
      expect(lang).toBe('sv');
      expect(heading).toBe('Riksdagspulsen');
    });

    it('should work with fallback chain: unknown lang -> English heading', () => {
      const htmlUnknown = '<html lang="unknown"><body><h2>Test</h2></body></html>';
      const lang: Language = detectArticleLanguage(htmlUnknown);
      const heading: string = getLocalizedHeading(lang, 'parliamentaryPulse');
      
      expect(lang).toBe('en');
      expect(heading).toBe('Parliamentary Pulse');
    });
  });
});
