import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('Multi-Language Support', () => {
  describe('Script Configuration', () => {
    it('should support --languages flag in generate-news-enhanced.js', () => {
      const scriptPath = path.join(projectRoot, 'scripts', 'generate-news-enhanced.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for languages argument parsing
      expect(content).toContain('languagesArg');
      expect(content).toContain('--languages=');
      // Check that languagesInput is set and then split
      expect(content).toContain("languagesArg.split('=')[1]");
      expect(content).toContain("languagesInput.split(',')");
    });

    it('should default to EN and SV', () => {
      const scriptPath = path.join(projectRoot, 'scripts', 'generate-news-enhanced.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check default languages (now uses string 'en,sv' instead of array literal)
      expect(content).toContain("'en,sv'");
    });

    it('should support all 14 languages in titles', () => {
      const scriptPath = path.join(projectRoot, 'scripts', 'generate-news-enhanced.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const allLanguages = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
      allLanguages.forEach(lang => {
        expect(content).toContain(`${lang}:`);
      });
    });

    it('should have RTL support for Arabic and Hebrew', () => {
      const scriptPath = path.join(projectRoot, 'scripts', 'generate-news-enhanced.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for Arabic title
      expect(content).toContain('ar:');
      expect(content).toMatch(/الأسبوع القادم/); // "Week Ahead" in Arabic
      
      // Check for Hebrew title
      expect(content).toContain('he:');
      expect(content).toMatch(/השבוע הקרוב/); // "Week Ahead" in Hebrew
    });
  });

  describe('Workflow Configuration', () => {
    it('should have languages input in agentic workflow', () => {
      const workflowPath = path.join(projectRoot, '.github', 'workflows', 'news-article-generator.md');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('languages:');
      expect(content).toContain('Languages to generate');
      expect(content).toContain('default: en,sv');
    });

    it('should document language options in agentic workflow', () => {
      const workflowPath = path.join(projectRoot, '.github', 'workflows', 'news-article-generator.md');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('nordic');
      expect(content).toContain('eu-core');
      expect(content).toContain('all');
    });

    it('should have languages input in traditional workflow', () => {
      const workflowPath = path.join(projectRoot, '.github', 'workflows', 'news-generation.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('languages:');
      expect(content).toContain('Languages to generate');
      expect(content).toContain("default: 'en,sv'");
    });

    it('should expand language presets in traditional workflow', () => {
      const workflowPath = path.join(projectRoot, '.github', 'workflows', 'news-generation.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      // Check for preset expansion logic
      expect(content).toContain('"nordic"');
      expect(content).toContain('en,sv,da,no,fi');
      expect(content).toContain('"eu-core"');
      expect(content).toContain('en,sv,de,fr,es,nl');
      expect(content).toContain('"all"');
      expect(content).toContain('en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh');
    });
  });

  describe('Language Index Files', () => {
    it('should have all 14 language index files', () => {
      const newsDir = path.join(projectRoot, 'news');
      const allLanguages = ['', '_ar', '_da', '_de', '_es', '_fi', '_fr', '_he', '_ja', '_ko', '_nl', '_no', '_sv', '_zh'];
      
      allLanguages.forEach(lang => {
        const indexFile = path.join(newsDir, `index${lang}.html`);
        expect(fs.existsSync(indexFile), `index${lang}.html should exist`).toBe(true);
      });
    });

    it('should have proper lang attribute in each index file', () => {
      const newsDir = path.join(projectRoot, 'news');
      const languageCodes = {
        '': 'en',
        '_sv': 'sv',
        '_da': 'da',
        '_no': 'nb',
        '_fi': 'fi',
        '_de': 'de',
        '_fr': 'fr',
        '_es': 'es',
        '_nl': 'nl',
        '_ar': 'ar',
        '_he': 'he',
        '_ja': 'ja',
        '_ko': 'ko',
        '_zh': 'zh'
      };
      
      Object.entries(languageCodes).forEach(([suffix, langCode]) => {
        const indexFile = path.join(newsDir, `index${suffix}.html`);
        if (fs.existsSync(indexFile)) {
          const content = fs.readFileSync(indexFile, 'utf-8');
          expect(content).toMatch(new RegExp(`lang="${langCode}"`));
        }
      });
    });

    it('should have RTL dir attribute for Arabic and Hebrew', () => {
      const newsDir = path.join(projectRoot, 'news');
      
      // Check Arabic
      const arIndex = path.join(newsDir, 'index_ar.html');
      if (fs.existsSync(arIndex)) {
        const content = fs.readFileSync(arIndex, 'utf-8');
        expect(content).toContain('dir="rtl"');
      }
      
      // Check Hebrew
      const heIndex = path.join(newsDir, 'index_he.html');
      if (fs.existsSync(heIndex)) {
        const content = fs.readFileSync(heIndex, 'utf-8');
        expect(content).toContain('dir="rtl"');
      }
    });
  });

  describe('Language Presets', () => {
    it('should define Nordic languages correctly', () => {
      const workflowPath = path.join(projectRoot, '.github', 'workflows', 'news-generation.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('en,sv,da,no,fi');
    });

    it('should define EU Core languages correctly', () => {
      const workflowPath = path.join(projectRoot, '.github', 'workflows', 'news-generation.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('en,sv,de,fr,es,nl');
    });

    it('should define all 14 languages correctly', () => {
      const workflowPath = path.join(projectRoot, '.github', 'workflows', 'news-generation.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh');
    });
  });

  describe('Article Template Multi-Language Support', () => {
    it('should support hreflang tags for all languages', () => {
      const templatePath = path.join(projectRoot, 'scripts', 'article-template.js');
      const content = fs.readFileSync(templatePath, 'utf-8');
      
      // Check for hreflang implementation
      expect(content).toContain('hreflang');
      expect(content).toContain('rel="alternate"');
      expect(content).toMatch(/hreflang="\$\{.*?\}"/);
    });

    it('should support language-specific metadata', () => {
      const templatePath = path.join(projectRoot, 'scripts', 'article-template.js');
      const content = fs.readFileSync(templatePath, 'utf-8');
      
      expect(content).toContain('og:locale');
      expect(content).toContain('inLanguage');
    });
  });

  describe('Documentation', () => {
    it('should have multi-language status documentation', () => {
      const docPath = path.join(projectRoot, 'MULTI_LANGUAGE_STATUS.md');
      expect(fs.existsSync(docPath), 'MULTI_LANGUAGE_STATUS.md should exist').toBe(true);
      
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('14 languages');
      expect(content).toContain('--languages=all');
    });

    it('should document all 14 supported languages', () => {
      const docPath = path.join(projectRoot, 'MULTI_LANGUAGE_STATUS.md');
      const content = fs.readFileSync(docPath, 'utf-8');
      
      const allLanguages = [
        'English', 'Swedish', 'Danish', 'Norwegian', 'Finnish',
        'German', 'French', 'Spanish', 'Dutch',
        'Arabic', 'Hebrew', 'Japanese', 'Korean', 'Chinese'
      ];
      
      allLanguages.forEach(lang => {
        expect(content).toContain(lang);
      });
    });

    it('should document language presets', () => {
      const docPath = path.join(projectRoot, 'MULTI_LANGUAGE_STATUS.md');
      const content = fs.readFileSync(docPath, 'utf-8');
      
      // Check for preset documentation (case-insensitive)
      expect(content.toLowerCase()).toContain('nordic');
      expect(content.toLowerCase()).toContain('eu');
      expect(content).toContain('--languages');
    });
  });

  describe('Language-Specific Features', () => {
    it('should have language-specific titles for all 14 languages', () => {
      const scriptPath = path.join(projectRoot, 'scripts', 'generate-news-enhanced.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // English
      expect(content).toContain('Week Ahead');
      // Swedish
      expect(content).toContain('Vecka Framåt');
      // Danish
      expect(content).toContain('Ugen Fremover');
      // Norwegian
      expect(content).toContain('Uke Fremover');
      // Finnish
      expect(content).toContain('Tuleva Viikko');
      // German
      expect(content).toContain('Woche Voraus');
      // French
      expect(content).toContain('Semaine à Venir');
      // Spanish
      expect(content).toContain('Semana Próxima');
      // Dutch
      expect(content).toContain('Week Vooruit');
      // Arabic
      expect(content).toMatch(/الأسبوع القادم/);
      // Hebrew
      expect(content).toMatch(/השבוע הקרוב/);
      // Japanese
      expect(content).toMatch(/来週の展望/);
      // Korean
      expect(content).toMatch(/다음 주 전망/);
      // Chinese
      expect(content).toMatch(/下周展望/);
    });

    it('should handle RTL languages correctly', () => {
      const indexGenPath = path.join(projectRoot, 'scripts', 'generate-news-indexes.js');
      const content = fs.readFileSync(indexGenPath, 'utf-8');
      
      // Check for RTL handling
      expect(content).toContain('rtl');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain default EN+SV behavior', () => {
      const scriptPath = path.join(projectRoot, 'scripts', 'generate-news-enhanced.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should default to EN,SV (now uses string 'en,sv' instead of array literal)
      expect(content).toContain("'en,sv'");
    });

    it('should support legacy writeArticlePair function', () => {
      const scriptPath = path.join(projectRoot, 'scripts', 'generate-news-enhanced.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for function existence and export
      expect(content).toContain('writeArticlePair');
      expect(content).toMatch(/function\s+writeArticlePair/);
      expect(content).toMatch(/export\s*\{[^}]*writeArticlePair[^}]*\}/);
    });
  });
});
