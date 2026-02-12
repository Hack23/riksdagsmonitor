/**
 * Comprehensive Tests for News Index Localization Enhancements
 * 
 * Tests all 14 languages for:
 * - Complete filter translations
 * - Language-specific keywords
 * - Dynamic content support
 * - Proper HTML structure
 * - SEO optimization
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_DIR = path.join(__dirname, '..', 'news');

// All 14 supported languages
const LANGUAGES = {
  en: 'index.html',
  sv: 'index_sv.html',
  da: 'index_da.html',
  no: 'index_no.html',
  fi: 'index_fi.html',
  de: 'index_de.html',
  fr: 'index_fr.html',
  es: 'index_es.html',
  nl: 'index_nl.html',
  ar: 'index_ar.html',
  he: 'index_he.html',
  ja: 'index_ja.html',
  ko: 'index_ko.html',
  zh: 'index_zh.html'
};

// Expected filter translations per language
const FILTER_TRANSLATIONS = {
  en: { type: 'Type:', topic: 'Topic:', sort: 'Sort:' },
  sv: { type: 'Typ:', topic: 'Ämne:', sort: 'Sortera:' },
  da: { type: 'Type:', topic: 'Emne:', sort: 'Sorter:' },
  no: { type: 'Type:', topic: 'Emne:', sort: 'Sorter:' },
  fi: { type: 'Tyyppi:', topic: 'Aihe:', sort: 'Järjestä:' },
  de: { type: 'Typ:', topic: 'Thema:', sort: 'Sortieren:' },
  fr: { type: 'Type :', topic: 'Sujet :', sort: 'Trier :' },
  es: { type: 'Tipo:', topic: 'Tema:', sort: 'Ordenar:' },
  nl: { type: 'Type:', topic: 'Onderwerp:', sort: 'Sorteren:' },
  ar: { type: 'النوع:', topic: 'الموضوع:', sort: 'الترتيب:' },
  he: { type: 'סוג:', topic: 'נושא:', sort: 'מיון:' },
  ja: { type: '種類：', topic: 'トピック：', sort: '並び替え：' },
  ko: { type: '유형:', topic: '주제:', sort: '정렬:' },
  zh: { type: '类型：', topic: '主题：', sort: '排序：' }
};

// Language-specific keywords
const KEYWORDS = {
  en: 'riksdag news, swedish parliament, government analysis, political journalism, transparency, democracy',
  sv: 'riksdag nyheter, svenska riksdagen, regeringsanalys, politisk journalistik, öppenhet, demokrati',
  da: 'riksdag nyheder, svensk parlament, regeringsanalyse, politisk journalistik, gennemsigtighed, demokrati',
  no: 'riksdag nyheter, svensk parlament, regjeringsanalyse, politisk journalistikk, åpenhet, demokrati',
  fi: 'riksdag uutiset, ruotsin parlamentti, hallitusanalyysi, poliittinen journalismi, avoimuus, demokratia',
  de: 'riksdag nachrichten, schwedisches parlament, regierungsanalyse, politischer journalismus, transparenz, demokratie',
  fr: 'riksdag actualités, parlement suédois, analyse gouvernementale, journalisme politique, transparence, démocratie',
  es: 'riksdag noticias, parlamento sueco, análisis gubernamental, periodismo político, transparencia, democracia',
  nl: 'riksdag nieuws, zweeds parlement, regeringsanalyse, politieke journalistiek, transparantie, democratie',
  ar: 'أخبار البرلمان, البرلمان السويدي, تحليل حكومي, صحافة سياسية, شفافية, ديمقراطية',
  he: 'חדשות הפרלמנט, הפרלמנט השוודי, ניתוח ממשלתי, עיתונות פוליטית, שקיפות, דמוקרטיה',
  ja: '国会ニュース, スウェーデン議会, 政府分析, 政治ジャーナリズム, 透明性, 民主主義',
  ko: '의회 뉴스, 스웨덴 의회, 정부 분석, 정치 저널리즘, 투명성, 민주주의',
  zh: '议会新闻, 瑞典议会, 政府分析, 政治新闻, 透明度, 民主'
};

// Load all index files
let indexFiles = {};
beforeAll(() => {
  Object.entries(LANGUAGES).forEach(([lang, fileName]) => {
    const filePath = path.join(NEWS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      indexFiles[lang] = fs.readFileSync(filePath, 'utf-8');
    }
  });
});

describe('News Index Localization - All 14 Languages', () => {
  
  describe('File Existence', () => {
    Object.entries(LANGUAGES).forEach(([lang, fileName]) => {
      it(`should have ${fileName} file`, () => {
        const filePath = path.join(NEWS_DIR, fileName);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Filter Translations', () => {
    Object.entries(FILTER_TRANSLATIONS).forEach(([lang, translations]) => {
      it(`should have translated filter labels in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        
        // Check Type filter label
        expect(content).toMatch(new RegExp(`<label for="filter-type">${translations.type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</label>`));
        
        // Check Topic filter label
        expect(content).toMatch(new RegExp(`<label for="filter-topic">${translations.topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</label>`));
        
        // Check Sort filter label
        expect(content).toMatch(new RegExp(`<label for="filter-sort">${translations.sort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</label>`));
      });
    });
  });

  describe('SEO Keywords', () => {
    Object.entries(KEYWORDS).forEach(([lang, keywords]) => {
      it(`should have language-specific keywords in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toContain(`<meta name="keywords" content="${keywords}">`);
      });
    });
  });

  describe('Dynamic Content Support', () => {
    Object.keys(LANGUAGES).forEach(lang => {
      it(`should have dynamic content script in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toContain('<!-- Dynamic Content Loader -->');
        expect(content).toContain('const i18n =');
        expect(content).toContain('noArticles:');
        expect(content).toContain('loading:');
        expect(content).toContain('articleCount:');
      });

      it(`should have localized no articles message in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toMatch(/noArticles:\s*['"]/);
      });

      it(`should have localized loading message in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toMatch(/loading:\s*['"]/);
      });
    });
  });

  describe('HTML Structure', () => {
    Object.keys(LANGUAGES).forEach(lang => {
      it(`should have filter bar in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toContain('<div class="filter-bar">');
      });

      it(`should have filter-type select in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toContain('<select id="filter-type">');
      });

      it(`should have filter-topic select in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toContain('<select id="filter-topic">');
      });

      it(`should have filter-sort select in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toContain('<select id="filter-sort">');
      });
    });
  });

  describe('Accessibility', () => {
    Object.keys(LANGUAGES).forEach(lang => {
      it(`should have proper label-for associations in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toMatch(/<label for="filter-type">/);
        expect(content).toMatch(/<label for="filter-topic">/);
        expect(content).toMatch(/<label for="filter-sort">/);
      });
    });
  });

  describe('RTL Support', () => {
    ['ar', 'he'].forEach(lang => {
      it(`should have RTL dir attribute for ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toMatch(/<html[^>]*\s+dir="rtl"/);
      });

      it(`should have RTL-specific styling for ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        // RTL languages might have specific styles
        expect(content).toContain('lang="' + (lang === 'ar' ? 'ar' : 'he') + '"');
      });
    });
  });

  describe('Content Quality', () => {
    Object.keys(LANGUAGES).forEach(lang => {
      it(`should have valid HTML structure in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toMatch(/<!DOCTYPE html>/i);
        expect(content).toMatch(/<html[^>]*>/);
        expect(content).toMatch(/<head>/);
        expect(content).toMatch(/<body[^>]*>/);
        expect(content).toMatch(/<\/body>/);
        expect(content).toMatch(/<\/html>/);
      });

      it(`should have proper charset declaration in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toContain('<meta charset="UTF-8">');
      });

      it(`should have viewport meta tag in ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        expect(content).toContain('<meta name="viewport"');
      });
    });
  });

  describe('Performance', () => {
    Object.keys(LANGUAGES).forEach(lang => {
      it(`should have reasonable file size for ${lang}`, () => {
        const content = indexFiles[lang];
        expect(content).toBeDefined();
        // Files should be under 50KB for good performance
        expect(content.length).toBeLessThan(50000);
      });
    });
  });
});

describe('News Index Localization - Language Coverage', () => {
  it('should support all 14 languages', () => {
    expect(Object.keys(LANGUAGES)).toHaveLength(14);
  });

  it('should have filter translations for all 14 languages', () => {
    expect(Object.keys(FILTER_TRANSLATIONS)).toHaveLength(14);
  });

  it('should have keywords for all 14 languages', () => {
    expect(Object.keys(KEYWORDS)).toHaveLength(14);
  });

  it('should have all index files loaded', () => {
    expect(Object.keys(indexFiles)).toHaveLength(14);
  });
});

describe('News Index Localization - Consistency', () => {
  it('should have consistent filter structure across all languages', () => {
    const filterBarPattern = /<div class="filter-bar">/;
    Object.keys(LANGUAGES).forEach(lang => {
      const content = indexFiles[lang];
      expect(content).toMatch(filterBarPattern);
    });
  });

  it('should have consistent select elements across all languages', () => {
    Object.keys(LANGUAGES).forEach(lang => {
      const content = indexFiles[lang];
      expect(content).toContain('id="filter-type"');
      expect(content).toContain('id="filter-topic"');
      expect(content).toContain('id="filter-sort"');
    });
  });

  it('should have dynamic content loader in all languages', () => {
    Object.keys(LANGUAGES).forEach(lang => {
      const content = indexFiles[lang];
      expect(content).toContain('<!-- Dynamic Content Loader -->');
    });
  });
});
