#!/usr/bin/env python3
"""
Fix Mixed-Language Descriptions Script

This script ONLY translates descriptions in non-English news articles.
It explicitly NEVER touches titles to preserve professional human translations.

Purpose: Fix mixed-language metadata (English descriptions on non-English pages)
Safety: Title-protection built-in, only modifies description fields
Usage: python3 scripts/fix-mixed-language-descriptions.py [--dry-run]

Created: 2026-02-19
Context: After merge conflict resolution, ~80 files have English descriptions
         on non-English pages, but professional titles must be preserved.
"""

import re
import os
import sys
from pathlib import Path

class DescriptionFixer:
    """Fix mixed-language descriptions while preserving professional titles."""
    
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.news_dir = Path('/home/runner/work/riksdagsmonitor/riksdagsmonitor/news')
        self.stats = {'processed': 0, 'updated': 0, 'skipped': 0, 'errors': 0}
        
    def translate_description(self, text, target_lang):
        """Translate description text to target language using comprehensive dictionaries."""
        
        if target_lang == 'en':
            return text
        
        # Swedish translations
        if target_lang == 'sv':
            translations = {
                # Description-specific phrases (longer first)
                'Ten committee reports advance': 'Tio utskottsrapporter som främjar',
                'Analysis of': 'Analys av',
                'committee reports': 'utskottsrapporter',
                'government propositions': 'regeringspropositioner',
                'opposition motions': 'oppositionsmotioner',
                'covering': 'som omfattar',
                'shaping legislative agenda': 'formar lagstiftningsagendan',
                'challenging government policy': 'utmanar regeringens politik',
                'revealing government priorities': 'avslöjar regeringsprioriteringar',
                'ahead of spring legislative session': 'inför vårens lagstiftningsperiod',
                
                # Policy areas
                'Ukraine support funding': 'Ukrainastöd',
                'data protection reforms': 'dataskyddsreformer',
                'transport sustainability': 'hållbar transport',
                'border': 'gränskontroll', 'customs': 'tull',
                'appropriations': 'anslag', 'supplementary': 'tillägg',
                'government personnel': 'regeringspersonal',
                'tax': 'skatt', 'vat': 'moms', 'VAT': 'moms',
                'weapons': 'vapen', 'audit': 'revision',
                'financial': 'finansiella', 'detention': 'frihetsberövande',
                'elderly care': 'äldreomsorg', 'security': 'säkerhet',
                'defense': 'försvar', 'labor': 'arbete', 'welfare': 'välfärd',
                'parental': 'föräldra', 'trade': 'handel', 'housing': 'boende',
                
                # Connectors
                ' and ': ' och ', ', and': ', och',
            }
            
            translated = text
            for eng, swe in translations.items():
                translated = translated.replace(eng, swe)
            return translated
        
        # Danish translations
        elif target_lang == 'da':
            translations = {
                'Ten committee reports advance': 'Ti udvalgsrapporter der fremmer',
                'Analysis of': 'Analyse af',
                'committee reports': 'udvalgsrapporter',
                'government propositions': 'regeringsforslag',
                'opposition motions': 'oppositionsforslag',
                'covering': 'der dækker',
                'shaping legislative agenda': 'former lovgivningsdagsordenen',
                'revealing government priorities': 'afslører regeringsprioriteringer',
                'ahead of spring legislative session': 'før forårets lovgivningsperiode',
                
                'Ukraine support funding': 'Ukraine støtte',
                'data protection reforms': 'databeskyttelsesreformer',
                'transport sustainability': 'bæredygtig transport',
                'border': 'grænse', 'customs': 'told',
                'appropriations': 'bevillinger', 'supplementary': 'tillæg',
                'government personnel': 'regeringspersonale',
                'tax': 'skat', 'vat': 'moms', 'VAT': 'moms',
                'weapons': 'våben', 'audit': 'revision',
                'financial': 'finansielle', 'detention': 'frihedsberøvelse',
                'elderly care': 'ældrepleje', 'security': 'sikkerhed',
                'defense': 'forsvar', 'labor': 'arbejde', 'welfare': 'velfærd',
                'parental': 'forældreomsorg', 'trade': 'handel', 'housing': 'bolig',
                
                ' and ': ' og ', ', and': ', og',
            }
            
            translated = text
            for eng, da in translations.items():
                translated = translated.replace(eng, da)
            return translated
        
        # Norwegian translations
        elif target_lang == 'no':
            translations = {
                'Ten committee reports advance': 'Ti komitérapporter som fremmer',
                'Analysis of': 'Analyse av',
                'committee reports': 'komitérapporter',
                'government propositions': 'regjeringsforslag',
                'opposition motions': 'opposisjonsforslag',
                'covering': 'som dekker',
                'shaping legislative agenda': 'former lovgivningsagendaen',
                'revealing government priorities': 'avslører regjeringsprioriteringer',
                'ahead of spring legislative session': 'før vårens lovgivningsperiode',
                
                'Ukraine support funding': 'Ukraina-støtte',
                'data protection reforms': 'databeskyttelsesreformer',
                'transport sustainability': 'bærekraftig transport',
                'border': 'grense', 'customs': 'toll',
                'appropriations': 'bevilgninger', 'supplementary': 'tillegg',
                'government personnel': 'regjeringspersonell',
                'tax': 'skatt', 'vat': 'mva', 'VAT': 'mva',
                'weapons': 'våpen', 'audit': 'revisjon',
                'financial': 'finansielle', 'detention': 'frihetsberøvelse',
                'elderly care': 'eldreomsorg', 'security': 'sikkerhet',
                'defense': 'forsvar', 'labor': 'arbeid', 'welfare': 'velferd',
                'parental': 'foreldre', 'trade': 'handel', 'housing': 'bolig',
                
                ' and ': ' og ', ', and': ', og',
            }
            
            translated = text
            for eng, no in translations.items():
                translated = translated.replace(eng, no)
            return translated
        
        # For other languages, return as-is (would need more comprehensive dictionaries)
        # Future: Add FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH
        return text
    
    def get_language_from_filename(self, filename):
        """Extract language code from filename (e.g., *-sv.html -> sv)."""
        match = re.search(r'-([a-z]{2})\.html$', filename)
        return match.group(1) if match else 'en'
    
    def fix_article_descriptions(self, filepath):
        """Fix descriptions in a single article file. NEVER touches titles."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lang = self.get_language_from_filename(filepath.name)
            
            # Skip English files
            if lang == 'en':
                self.stats['skipped'] += 1
                return False
            
            # Skip if description is already translated (not English)
            desc_match = re.search(r'<meta name="description" content="([^"]+)"', content)
            if not desc_match:
                self.stats['skipped'] += 1
                return False
            
            current_desc = desc_match.group(1)
            
            # Simple heuristic: if description starts with common English words, it needs translation
            english_indicators = ['Ten committee', 'Analysis of', 'Comprehensive', 'The government']
            needs_translation = any(current_desc.startswith(ind) for ind in english_indicators)
            
            if not needs_translation:
                self.stats['skipped'] += 1
                return False
            
            # Translate description
            translated_desc = self.translate_description(current_desc, lang)
            
            if translated_desc == current_desc:
                self.stats['skipped'] += 1
                return False
            
            # ONLY update description fields (NEVER titles)
            # Update meta description
            content = re.sub(
                r'(<meta name="description" content=")[^"]+(")',
                fr'\1{translated_desc}\2',
                content
            )
            
            # Update og:description
            content = re.sub(
                r'(<meta property="og:description" content=")[^"]+(")',
                fr'\1{translated_desc}\2',
                content
            )
            
            # Update twitter:description
            content = re.sub(
                r'(<meta name="twitter:description" content=")[^"]+(")',
                fr'\1{translated_desc}\2',
                content
            )
            
            # Update Schema.org NewsArticle description (if present)
            # Match the description field within NewsArticle schema
            content = re.sub(
                r'("@type":\s*"NewsArticle"[^}]*"description":\s*")[^"]+(")',
                fr'\1{translated_desc}\2',
                content,
                flags=re.DOTALL
            )
            
            if self.dry_run:
                print(f"[DRY RUN] Would update: {filepath.name}")
                print(f"  FROM: {current_desc[:60]}...")
                print(f"  TO:   {translated_desc[:60]}...")
            else:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Updated: {filepath.name}")
            
            self.stats['updated'] += 1
            return True
            
        except Exception as e:
            print(f"❌ Error processing {filepath.name}: {e}")
            self.stats['errors'] += 1
            return False
    
    def process_all(self):
        """Process all news article files."""
        print("=" * 70)
        print("Fix Mixed-Language Descriptions")
        print("=" * 70)
        print(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        print(f"Directory: {self.news_dir}")
        print()
        
        # Process committee reports, government propositions, opposition motions
        patterns = [
            '2026-02-*-committee-reports-*.html',
            '2026-02-*-government-propositions-*.html',
            '2026-02-*-opposition-motions-*.html',
        ]
        
        for pattern in patterns:
            files = sorted(self.news_dir.glob(pattern))
            for filepath in files:
                self.fix_article_descriptions(filepath)
                self.stats['processed'] += 1
        
        print()
        print("=" * 70)
        print("Summary")
        print("=" * 70)
        print(f"Files processed: {self.stats['processed']}")
        print(f"Files updated:   {self.stats['updated']}")
        print(f"Files skipped:   {self.stats['skipped']}")
        print(f"Errors:          {self.stats['errors']}")
        print("=" * 70)
        
        if self.dry_run:
            print("\n⚠️  DRY RUN MODE - No files were actually modified")
            print("Run without --dry-run to apply changes")
        else:
            print(f"\n✅ {self.stats['updated']} files updated successfully")

def main():
    dry_run = '--dry-run' in sys.argv
    fixer = DescriptionFixer(dry_run=dry_run)
    fixer.process_all()

if __name__ == '__main__':
    main()
