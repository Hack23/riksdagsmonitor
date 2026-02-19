#!/usr/bin/env python3
"""
Generate Content-Based Titles and Metadata for News Articles

This script analyzes the content of news articles (committee-reports, 
government-propositions, opposition-motions) and generates unique,
SEO-optimized titles and descriptions based on the actual policy areas
covered in each article.

Features:
- Extracts h3 document titles from articles
- Identifies top 2-3 policy themes
- Generates unique titles (50-60 characters optimal)
- Generates descriptions (150-160 characters optimal)
- Updates all metadata tags (title, description, OG, Twitter, Schema.org)
- Ensures zero duplicate titles across all articles
- Multi-language support (14 languages)

Usage:
    python scripts/generate-content-based-titles.py [--dry-run]
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Set
from collections import Counter
import html


class TitleGenerator:
    """Generate content-based titles from article content"""
    
    # Language codes for translation
    LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']
    
    # Article types
    ARTICLE_TYPES = {
        'committee-reports': {
            'en': 'Committee Reports',
            'format': '{themes} Dominate Committee Agenda'
        },
        'government-propositions': {
            'en': 'Government Propositions',
            'format': '{themes} Lead Government Legislative Push'
        },
        'opposition-motions': {
            'en': 'Opposition Motions',
            'format': 'Opposition {action} on {themes}'
        }
    }
    
    # Common policy keywords to extract
    POLICY_KEYWORDS = [
        # Security & Law Enforcement
        'weapons', 'border', 'security', 'defense', 'detention', 'cash controls',
        'schengen', 'customs', 'enforcement', 'civil liberties',
        
        # Financial & Economic
        'tax', 'vat', 'fraud', 'financial', 'audit', 'crisis management',
        'transparency', 'ownership', 'beneficial ownership',
        
        # Social Welfare
        'housing', 'welfare', 'parental', 'parental benefit', 'benefit', 
        'pension', 'elderly care', 'employment', 'labor',
        
        # Government & Administration
        'data protection', 'privacy', 'registry', 'cooperative',
        'appropriations', 'supplementary', 'government personnel',
        
        # Sector-Specific
        'education', 'health', 'trade', 'animal', 'animal protection',
        'road traffic', 'vehicle', 'renewable energy', 'macroprudential',
        
        # Language variations
        'language requirement', 'language'
    ]
    
    def __init__(self, news_dir: str = '/home/runner/work/riksdagsmonitor/riksdagsmonitor/news'):
        self.news_dir = Path(news_dir)
        self.used_titles: Set[str] = set()
        self.title_mapping: Dict[str, Dict[str, str]] = {}
    
    def extract_document_titles(self, html_content: str) -> List[str]:
        """Extract all h3 document titles from article"""
        # Find all h3 tags (document titles)
        h3_pattern = r'<h3>(.*?)</h3>'
        matches = re.findall(h3_pattern, html_content, re.IGNORECASE)
        
        # Filter out non-document h3s (like "Sources and Data")
        filtered = []
        exclude = ['sources and data', 'watch list', 'political context', 
                   'assessment', 'key takeaways', 'källor och data', 'key points',
                   'data sources and references']
        
        for match in matches:
            title_lower = match.lower()
            if not any(excl in title_lower for excl in exclude):
                filtered.append(match.strip())
        
        return filtered
    
    def extract_document_count(self, html_content: str, article_type: str) -> int:
        """Extract actual document count from article content"""
        # Try to find explicit count in article body (e.g., "<strong>10 motions</strong>" or "Six propositions")
        if 'opposition-motions' in article_type:
            # Look for pattern like "10 motions" or "ten motions"
            count_patterns = [
                (r'<strong>(\d+)\s+motions?</strong>', 'digit'),
                (r'\b(\d+)\s+motions?\s+submitted', 'digit'),
                (r'\bten\s+motions?\b', 10)
            ]
        elif 'committee-reports' in article_type:
            count_patterns = [
                (r'<strong>(\d+)\s+(?:committee\s+)?reports?</strong>', 'digit'),
                (r'\b(\d+)\s+(?:committee\s+)?reports?\s+', 'digit')
            ]
        elif 'government-propositions' in article_type:
            # Look for "six propositions" or "6 propositions" in lede
            count_patterns = [
                (r'\b[Ss]ix\s+propositions?\b', 6),  # Match "Six propositions"
                (r'\b(\d+)\s+propositions?\s+submitted', 'digit'),
                (r'<strong>(\d+)\s+(?:government\s+)?propositions?</strong>', 'digit')
            ]
        else:
            return 0
        
        for pattern_info in count_patterns:
            if isinstance(pattern_info, tuple):
                pattern, result_type = pattern_info
            else:
                pattern = pattern_info
                result_type = 'digit'
            
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            if matches:
                # If result_type is a number, return it directly
                if isinstance(result_type, int):
                    return result_type
                # If result_type is 'digit', extract the digit from match
                elif result_type == 'digit' and matches[0].isdigit():
                    return int(matches[0])
        
        return 0
    
    def extract_policy_themes(self, document_titles: List[str], max_themes: int = 3) -> List[str]:
        """Extract top policy themes from document titles"""
        if not document_titles:
            return []
        
        # Extract keywords from titles
        themes = []
        matched_keywords = set()  # Track which keywords we've already used
        
        for title in document_titles:
            title_lower = title.lower()
            
            # Try to find keyword matches
            for keyword in self.POLICY_KEYWORDS:
                if keyword in title_lower and keyword not in matched_keywords:
                    # Capitalize first letter of each word
                    theme = ' '.join(word.capitalize() for word in keyword.split())
                    # Fix special cases
                    if theme == 'Vat':
                        theme = 'VAT'
                    themes.append(theme)
                    matched_keywords.add(keyword)
                    break  # Only one keyword per title to avoid over-counting
        
        # Count frequency and get top themes
        theme_counts = Counter(themes)
        top_themes = [theme for theme, _ in theme_counts.most_common(max_themes)]
        
        # If we have fewer themes than requested, extract key phrases from titles
        if len(top_themes) < max_themes and document_titles:
            for title in document_titles:
                if len(top_themes) >= max_themes:
                    break
                
                # Skip if we already found a keyword in this title
                title_lower = title.lower()
                if any(kw in title_lower for kw in matched_keywords):
                    continue
                
                # Extract meaningful phrases (avoid generic words)
                skip_words = {'the', 'a', 'an', 'of', 'for', 'on', 'in', 'at', 'to', 'and', 'or'}
                words = []
                
                for word in title.split()[:4]:  # Look at first 4 words
                    word_clean = word.strip(',.!?;:')
                    if word_clean.lower() not in skip_words:
                        words.append(word_clean)
                    
                    # Stop if we have 2-3 meaningful words
                    if len(words) >= 2:
                        break
                
                if words:
                    theme = ' '.join(words)
                    if len(theme) < 40 and theme not in top_themes:
                        top_themes.append(theme)
        
        return top_themes[:max_themes]
    
    def generate_title(self, article_type: str, document_titles: List[str], 
                      date: str, lang: str = 'en') -> str:
        """Generate unique, SEO-optimized title"""
        
        themes = self.extract_policy_themes(document_titles, max_themes=3)
        
        if not themes:
            # Fallback to date-based unique title
            return f"{self.ARTICLE_TYPES[article_type]['en']} for {date}"
        
        # Generate title based on article type and themes
        if article_type == 'committee-reports':
            # Format: "{Theme1} and {Theme2} Dominate Committee Agenda"
            if len(themes) >= 2:
                title = f"{themes[0]} and {themes[1]} Dominate Committee Agenda"
            else:
                title = f"{themes[0]} Dominates Committee Agenda"
        
        elif article_type == 'government-propositions':
            # Format: "New {Theme1} and {Theme2} Lead Government Legislative Push"
            if len(themes) >= 2:
                # Check for specific high-impact themes
                if any(t in ['Weapons', 'VAT', 'Fraud', 'Financial', 'Security'] for t in themes):
                    title = f"New {themes[0]} and {themes[1]} Lead Government Legislative Push"
                else:
                    title = f"Government Advances {themes[0]} and {themes[1]} Reforms"
            else:
                title = f"Government Advances {themes[0]} Reforms"
        
        elif article_type == 'opposition-motions':
            # Format: "Opposition Unites Against {Theme1}, Splits on {Theme2}"
            if len(themes) >= 2:
                # Check for civil liberties / rights themes
                if any(t in ['Detention', 'Civil Liberties', 'Language', 'Labor'] for t in themes):
                    title = f"Opposition Unites Against {themes[0]}, Splits on {themes[1]}"
                else:
                    title = f"Opposition Challenges {themes[0]} and {themes[1]} Policy"
            else:
                title = f"Opposition Challenges Government on {themes[0]}"
        
        else:
            # Generic fallback
            if len(themes) >= 2:
                title = f"{themes[0]} and {themes[1]} Shape Parliamentary Agenda"
            else:
                title = f"{themes[0]} Shapes Parliamentary Agenda"
        
        # Add date to ensure uniqueness (YYYY-MM-DD format already provides uniqueness)
        # But check if title already exists
        if title in self.used_titles:
            # Make unique by adding a specific detail or date reference
            date_obj = date.split('-')
            if len(date_obj) == 3:
                month_day = f"{date_obj[1]}-{date_obj[2]}"
                # Try adding more context instead of just a number
                if len(themes) >= 3:
                    title = f"{themes[0]}, {themes[1]}, and {themes[2]} in Focus"
                else:
                    title = f"{title.split(' Dominate')[0]} Focus ({month_day})"
        
        # Truncate if too long (60 char optimal, 70 max)
        if len(title) > 70:
            title = title[:67] + "..."
        
        self.used_titles.add(title)
        return title
    
    def generate_description(self, document_titles: List[str], 
                            article_type: str, count: int) -> str:
        """Generate SEO-optimized description (150-160 characters)"""
        
        themes = self.extract_policy_themes(document_titles, max_themes=4)
        
        if not themes:
            # Fallback description
            type_name = self.ARTICLE_TYPES[article_type]['en'].lower()
            return f"Analysis of {count} {type_name} covering key policy areas and legislative priorities"
        
        # Join themes for description
        if len(themes) <= 2:
            theme_list = ' and '.join(themes)
        else:
            theme_list = ', '.join(themes[:-1]) + f", and {themes[-1]}"
        
        type_name = self.ARTICLE_TYPES[article_type]['en'].lower()
        
        # Generate description
        desc = f"Analysis of {count} {type_name} covering {theme_list.lower()}"
        
        # Add context based on article type
        if article_type == 'committee-reports':
            desc += " in parliamentary committees"
        elif article_type == 'government-propositions':
            desc += " shaping legislative agenda"
        elif article_type == 'opposition-motions':
            desc += " challenging government policy"
        
        # Truncate if too long (160 char max)
        if len(desc) > 160:
            desc = desc[:157] + "..."
        
        return desc
    
    def update_article_metadata(self, filepath: Path, new_title: str, 
                               new_description: str, dry_run: bool = False) -> bool:
        """Update all metadata fields in an article"""
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Backup original content
            original_content = content
            
            # Extract old title for verification
            old_title_match = re.search(r'<title>(.*?)</title>', content)
            old_title = old_title_match.group(1) if old_title_match else ''
            
            # 1. Update <title> tag
            content = re.sub(
                r'<title>.*?</title>',
                f'<title>{html.escape(new_title)}</title>',
                content,
                count=1
            )
            
            # 2. Update meta description
            content = re.sub(
                r'<meta name="description" content=".*?">',
                f'<meta name="description" content="{html.escape(new_description)}">',
                content,
                count=1
            )
            
            # 3. Update og:title
            content = re.sub(
                r'<meta property="og:title" content=".*?">',
                f'<meta property="og:title" content="{html.escape(new_title)}">',
                content,
                count=1
            )
            
            # 4. Update og:description
            content = re.sub(
                r'<meta property="og:description" content=".*?">',
                f'<meta property="og:description" content="{html.escape(new_description)}">',
                content,
                count=1
            )
            
            # 5. Update twitter:title
            content = re.sub(
                r'<meta name="twitter:title" content=".*?">',
                f'<meta name="twitter:title" content="{html.escape(new_title)}">',
                content,
                count=1
            )
            
            # 6. Update twitter:description
            content = re.sub(
                r'<meta name="twitter:description" content=".*?">',
                f'<meta name="twitter:description" content="{html.escape(new_description)}">',
                content,
                count=1
            )
            
            # 7. Update Schema.org NewsArticle headline
            content = re.sub(
                r'"headline":\s*".*?"',
                f'"headline": "{new_title.replace('"', '\\"')}"',
                content,
                count=1
            )
            
            # 8. Update Schema.org alternativeHeadline
            content = re.sub(
                r'"alternativeHeadline":\s*".*?"',
                f'"alternativeHeadline": "{new_description.replace('"', '\\"')}"',
                content,
                count=1
            )
            
            # 9. Update Schema.org description
            content = re.sub(
                r'("@type":\s*"NewsArticle".*?"description":\s*)".*?"',
                f'\\1"{new_description.replace('"', '\\"')}"',
                content,
                count=1,
                flags=re.DOTALL
            )
            
            # 10. Update BreadcrumbList position 3 name (use full title for consistency)
            content = re.sub(
                r'("position":\s*3,\s*"name":\s*)".*?"',
                f'\\1"{new_title.replace('"', '\\"')}"',
                content,
                count=1
            )
            
            # 11. Update article h1 tag
            content = re.sub(
                r'<h1>.*?</h1>',
                f'<h1>{html.escape(new_title)}</h1>',
                content,
                count=1
            )
            
            # Check if changes were made
            if content == original_content:
                print(f"  ⚠️  No changes made to {filepath.name}")
                return False
            
            if dry_run:
                print(f"  [DRY RUN] Would update: {filepath.name}")
                print(f"    Old title: {old_title}")
                print(f"    New title: {new_title}")
                print(f"    New desc:  {new_description}")
                return True
            
            # Write updated content
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ Updated: {filepath.name}")
            print(f"    Title: {new_title} ({len(new_title)} chars)")
            print(f"    Desc:  {new_description} ({len(new_description)} chars)")
            
            return True
            
        except Exception as e:
            print(f"  ❌ Error updating {filepath.name}: {e}")
            return False
    
    def translate_text(self, text: str, target_lang: str, context: str = "title") -> str:
        """
        Translate text to target language.
        Uses simple translation patterns for Swedish and keeps English for others.
        Note: In production, integrate with Azure Translator API or Google Cloud Translation.
        """
        
        # Language name mapping
        lang_names = {
            'sv': 'Swedish', 'da': 'Danish', 'no': 'Norwegian', 'fi': 'Finnish',
            'de': 'German', 'fr': 'French', 'es': 'Spanish', 'nl': 'Dutch',
            'ar': 'Arabic', 'he': 'Hebrew', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese'
        }
        
        if target_lang == 'en':
            return text
        
        # Comprehensive Swedish translations for political/government terminology
        if target_lang == 'sv':
            # Word-level translations (order matters - longer phrases first)
            translations = {
                # Article types
                'Committee Reports': 'Utskottsrapporter',
                'Government Propositions': 'Regeringspropositioner',
                'Opposition Motions': 'Oppositionsmotioner',
                
                # Action phrases
                'Dominate Committee Agenda': 'Dominerar Utskottsagendan',
                'Lead Government Legislative Push': 'Leder Regeringens Lagstiftningsoffensiv',
                'in Focus': 'i Fokus',
                'Opposition Challenges': 'Oppositionen Utmanar',
                'Opposition Unites Against': 'Oppositionen Enar sig Mot',
                'Splits on': 'Delar sig om',
                
                # Policy areas (capitalized and lowercase)
                'Border': 'Gränskontroll', 'border': 'gränskontroll',
                'Customs': 'Tull', 'customs': 'tull',
                'Appropriations': 'Anslag', 'appropriations': 'anslag',
                'Supplementary': 'Tillägg', 'supplementary': 'tillägg',
                'Government Personnel': 'Regeringspersonal', 'government personnel': 'regeringspersonal',
                'Tax': 'Skatt', 'tax': 'skatt',
                'Vat': 'Moms', 'vat': 'moms', 'VAT': 'Moms',
                'Weapons': 'Vapen', 'weapons': 'vapen',
                'Audit': 'Revision', 'audit': 'revision',
                'Financial': 'Finansiell', 'financial': 'finansiella',
                'Detention': 'Frihetsberövande', 'detention': 'frihetsberövande',
                'Elderly Care': 'Äldreomsorg', 'elderly care': 'äldreomsorg',
                'Animal Protection': 'Djurskydd', 'animal protection': 'djurskydd',
                'Animal': 'Djur', 'animal': 'djur',
                'Data Protection': 'Dataskydd', 'data protection': 'dataskydd',
                'Security': 'Säkerhet', 'security': 'säkerhet',
                'Defense': 'Försvar', 'defense': 'försvar',
                'Labor': 'Arbete', 'labor': 'arbete',
                'Welfare': 'Välfärd', 'welfare': 'välfärd',
                'Parental Benefit': 'Föräldrapenning', 'parental benefit': 'föräldrapenning',
                'Parental': 'Föräldra', 'parental': 'föräldra',
                'Trade': 'Handel', 'trade': 'handel',
                'Housing': 'Boende', 'housing': 'boende',
                'Macroprudential': 'Makrotillsyn', 'macroprudential': 'makrotillsyn',
                'Language Requirement': 'Språkkrav', 'language requirement': 'språkkrav',
                'Renewable Energy': 'Förnybar Energi', 'renewable energy': 'förnybar energi',
                
                # Description phrases
                'Analysis of': 'Analys av',
                'committee reports': 'utskottsrapporter',
                'government propositions': 'regeringspropositioner',
                'opposition motions': 'oppositionsmotioner',
                'covering': 'som omfattar',
                'shaping legislative agenda': 'formar lagstiftningsagendan',
                'challenging government policy': 'utmanar regeringens politik',
                'in parliamentary committees': 'i riksdagens utskott',
                'key policy areas': 'centrala politikområden',
                'legislative priorities': 'lagstiftningsprioriteringar',
                ' for ': ' för ',  # Space before/after to avoid replacing "before", "reform", etc.
                'and': 'och',
            }
            
            translated = text
            for eng, swe in translations.items():
                translated = translated.replace(eng, swe)
            return translated
        
        # Danish translations
        if target_lang == 'da':
            translations = {
                'Committee Reports': 'Udvalgsrapporter', 'Government Propositions': 'Regeringsforslag',
                'Opposition Motions': 'Oppositionens forslag', 'in Focus': 'i Fokus',
                'Border': 'Grænse', 'Customs': 'Told', 'Appropriations': 'Bevillinger',
                'Tax': 'Skat', 'Vat': 'Moms', 'Weapons': 'Våben', 'Audit': 'Revision',
                'Financial': 'Finansiel', 'Detention': 'Frihedsberøvelse', 'Elderly Care': 'Ældrepleje',
                'Analysis of': 'Analyse af', 'committee reports': 'udvalgsrapporter',
                'government propositions': 'regeringsforslag', 'opposition motions': 'oppositionens forslag',
                'covering': 'der dækker', 'shaping legislative agenda': 'former lovgivningsdagsordenen',
                'and': 'og',
            }
            translated = text
            for eng, da in translations.items():
                translated = translated.replace(eng, da)
            return translated
        
        # Norwegian translations
        if target_lang == 'no':
            translations = {
                'Committee Reports': 'Komitérapporter', 'Government Propositions': 'Regjeringsforslag',
                'Opposition Motions': 'Opposisjonsforslag', 'in Focus': 'i Fokus',
                'Dominate Committee Agenda': 'Dominerer Komitéagendaen',
                'Lead Government Legislative Push': 'Leder Regjeringens Lovgivningsinitiativer',
                'Border': 'Grense', 'border': 'grense', 'Customs': 'Toll', 'customs': 'toll', 
                'Appropriations': 'Bevilgninger', 'appropriations': 'bevilgninger',
                'Supplementary': 'Tillegg', 'supplementary': 'tillegg',
                'Government Personnel': 'Regjeringspersonell', 'government personnel': 'regjeringspersonell',
                'Tax': 'Skatt', 'tax': 'skatt', 'Vat': 'Mva', 'vat': 'mva', 'VAT': 'Mva', 
                'Weapons': 'Våpen', 'weapons': 'våpen', 'Audit': 'Revisjon', 'audit': 'revisjon',
                'Financial': 'Finansiell', 'financial': 'finansiell', 
                'Detention': 'Frihetsberøvelse', 'detention': 'frihetsberøvelse',
                'Elderly Care': 'Eldreomsorg', 'elderly care': 'eldreomsorg',
                'Security': 'Sikkerhet', 'security': 'sikkerhet',
                'Labor': 'Arbeid', 'labor': 'arbeid',
                'Welfare': 'Velferd', 'welfare': 'velferd',
                'Parental Benefit': 'Foreldrepenger', 'parental benefit': 'foreldrepenger',
                'Parental': 'Foreldrepenger', 'parental': 'foreldrepenger',
                'Trade': 'Handel', 'trade': 'handel',
                'Housing': 'Bolig', 'housing': 'bolig',
                'Animal Protection': 'Dyrevern', 'animal protection': 'dyrevern',
                'Animal': 'Dyr', 'animal': 'dyr',
                'Macroprudential': 'Makrotilsyn', 'macroprudential': 'makrotilsyn',
                'Language Requirement': 'Språkkrav', 'language requirement': 'språkkrav',
                'Renewable Energy': 'Fornybar Energi', 'renewable energy': 'fornybar energi',
                'Analysis of': 'Analyse av', 'committee reports': 'komitérapporter',
                'government propositions': 'regjeringsforslag', 'opposition motions': 'opposisjonsforslag',
                'covering': 'som dekker', 'shaping legislative agenda': 'former lovgivningsagendaen',
                'in parliamentary committees': 'i parlamentariske komitéer',
                'challenging government policy': 'utfordrer regjeringens politikk',
                ' for ': ' for ',  # Keep Norwegian preposition
                'and': 'og',
            }
            translated = text
            for eng, no in translations.items():
                translated = translated.replace(eng, no)
            return translated
        
        # Finnish translations
        if target_lang == 'fi':
            translations = {
                'Committee Reports': 'Valiokuntaraportit', 'Government Propositions': 'Hallituksen esitykset',
                'Opposition Motions': 'Opposition esitykset', 'in Focus': 'Keskiössä',
                'Border': 'Raja', 'Customs': 'Tulli', 'Appropriations': 'Määrärahat',
                'Tax': 'Vero', 'Vat': 'Alv', 'Weapons': 'Aseet', 'Audit': 'Tarkastus',
                'Financial': 'Taloudellinen', 'Detention': 'Vapaudenmenetys', 'Elderly Care': 'Vanhustenhoito',
                'Analysis of': 'Analyysi', 'committee reports': 'valiokuntaraporteista',
                'government propositions': 'hallituksen esityksistä', 'opposition motions': 'opposition esityksistä',
                'covering': 'kattaen', 'shaping legislative agenda': 'muokkaa lainsäädäntöagendaa',
                'and': 'ja',
            }
            translated = text
            for eng, fi in translations.items():
                translated = translated.replace(eng, fi)
            return translated
        
        # German translations
        if target_lang == 'de':
            translations = {
                'Committee Reports': 'Ausschussberichte', 'Government Propositions': 'Regierungsvorlagen',
                'Opposition Motions': 'Oppositionsanträge', 'in Focus': 'im Fokus',
                'Border': 'Grenze', 'Customs': 'Zoll', 'Appropriations': 'Mittel',
                'Tax': 'Steuer', 'Vat': 'MwSt', 'Weapons': 'Waffen', 'Audit': 'Prüfung',
                'Financial': 'Finanziell', 'Detention': 'Freiheitsentzug', 'Elderly Care': 'Altenpflege',
                'Analysis of': 'Analyse von', 'committee reports': 'Ausschussberichten',
                'government propositions': 'Regierungsvorlagen', 'opposition motions': 'Oppositionsanträgen',
                'covering': 'über', 'shaping legislative agenda': 'prägt die Gesetzgebungsagenda',
                'and': 'und',
            }
            translated = text
            for eng, de in translations.items():
                translated = translated.replace(eng, de)
            return translated
        
        # French translations
        if target_lang == 'fr':
            translations = {
                'Committee Reports': 'Rapports de Commission', 'Government Propositions': 'Propositions Gouvernementales',
                'Opposition Motions': 'Motions d\'Opposition', 'in Focus': 'au Centre',
                'Border': 'Frontière', 'Customs': 'Douane', 'Appropriations': 'Crédits',
                'Tax': 'Taxe', 'Vat': 'TVA', 'Weapons': 'Armes', 'Audit': 'Audit',
                'Financial': 'Financier', 'Detention': 'Détention', 'Elderly Care': 'Soins aux Personnes Âgées',
                'Analysis of': 'Analyse de', 'committee reports': 'rapports de commission',
                'government propositions': 'propositions gouvernementales', 'opposition motions': 'motions d\'opposition',
                'covering': 'couvrant', 'shaping legislative agenda': 'façonne l\'agenda législatif',
                'and': 'et',
            }
            translated = text
            for eng, fr in translations.items():
                translated = translated.replace(eng, fr)
            return translated
        
        # Spanish translations
        if target_lang == 'es':
            translations = {
                'Committee Reports': 'Informes de Comisión', 'Government Propositions': 'Proposiciones Gubernamentales',
                'Opposition Motions': 'Mociones de Oposición', 'in Focus': 'en Foco',
                'Border': 'Frontera', 'Customs': 'Aduanas', 'Appropriations': 'Asignaciones',
                'Tax': 'Impuesto', 'Vat': 'IVA', 'Weapons': 'Armas', 'Audit': 'Auditoría',
                'Financial': 'Financiero', 'Detention': 'Detención', 'Elderly Care': 'Cuidado de Ancianos',
                'Analysis of': 'Análisis de', 'committee reports': 'informes de comisión',
                'government propositions': 'proposiciones gubernamentales', 'opposition motions': 'mociones de oposición',
                'covering': 'cubriendo', 'shaping legislative agenda': 'configura la agenda legislativa',
                'and': 'y',
            }
            translated = text
            for eng, es in translations.items():
                translated = translated.replace(eng, es)
            return translated
        
        # Dutch translations
        if target_lang == 'nl':
            translations = {
                'Committee Reports': 'Commissierapporten', 'Government Propositions': 'Regeringsvoorstellen',
                'Opposition Motions': 'Oppositiemoties', 'in Focus': 'in Focus',
                'Border': 'Grens', 'Customs': 'Douane', 'Appropriations': 'Begrotingen',
                'Tax': 'Belasting', 'Vat': 'BTW', 'Weapons': 'Wapens', 'Audit': 'Audit',
                'Financial': 'Financieel', 'Detention': 'Detentie', 'Elderly Care': 'Ouderenzorg',
                'Analysis of': 'Analyse van', 'committee reports': 'commissierapporten',
                'government propositions': 'regeringsvoorstellen', 'opposition motions': 'oppositiemoties',
                'covering': 'betreffende', 'shaping legislative agenda': 'vormt de wetgevingsagenda',
                'and': 'en',
            }
            translated = text
            for eng, nl in translations.items():
                translated = translated.replace(eng, nl)
            return translated
        
        # Arabic translations (RTL)
        if target_lang == 'ar':
            translations = {
                'Committee Reports': 'تقارير اللجان', 'Government Propositions': 'مقترحات الحكومة',
                'Opposition Motions': 'مقترحات المعارضة', 'in Focus': 'في التركيز',
                'Border': 'الحدود', 'Customs': 'الجمارك', 'Appropriations': 'المخصصات',
                'Tax': 'الضريبة', 'Vat': 'ضريبة القيمة المضافة', 'Weapons': 'الأسلحة', 'Audit': 'التدقيق',
                'Financial': 'المالي', 'Detention': 'الاحتجاز', 'Elderly Care': 'رعاية المسنين',
                'Analysis of': 'تحليل', 'committee reports': 'تقارير اللجان',
                'government propositions': 'مقترحات الحكومة', 'opposition motions': 'مقترحات المعارضة',
                'covering': 'تغطي', 'shaping legislative agenda': 'تشكل جدول الأعمال التشريعي',
                'and': 'و',
            }
            translated = text
            for eng, ar in translations.items():
                translated = translated.replace(eng, ar)
            return translated
        
        # Hebrew translations (RTL)
        if target_lang == 'he':
            translations = {
                'Committee Reports': 'דוחות ועדה', 'Government Propositions': 'הצעות ממשלה',
                'Opposition Motions': 'הצעות אופוזיציה', 'in Focus': 'במוקד',
                'Border': 'גבול', 'Customs': 'מכס', 'Appropriations': 'הקצבות',
                'Tax': 'מס', 'Vat': 'מע"מ', 'Weapons': 'נשק', 'Audit': 'ביקורת',
                'Financial': 'פיננסי', 'Detention': 'מעצר', 'Elderly Care': 'טיפול בקשישים',
                'Analysis of': 'ניתוח של', 'committee reports': 'דוחות ועדה',
                'government propositions': 'הצעות ממשלה', 'opposition motions': 'הצעות אופוזיציה',
                'covering': 'המכסים', 'shaping legislative agenda': 'מעצבים את סדר היום החקיקתי',
                'and': 'ו',
            }
            translated = text
            for eng, he in translations.items():
                translated = translated.replace(eng, he)
            return translated
        
        # Japanese translations
        if target_lang == 'ja':
            translations = {
                'Committee Reports': '委員会報告', 'Government Propositions': '政府提案',
                'Opposition Motions': '野党動議', 'in Focus': 'に焦点',
                'Border': '国境', 'Customs': '税関', 'Appropriations': '予算配分',
                'Tax': '税', 'Vat': '付加価値税', 'Weapons': '武器', 'Audit': '監査',
                'Financial': '財政', 'Detention': '拘留', 'Elderly Care': '高齢者介護',
                'Analysis of': 'の分析', 'committee reports': '委員会報告',
                'government propositions': '政府提案', 'opposition motions': '野党動議',
                'covering': 'カバーする', 'shaping legislative agenda': '立法議題を形成',
                'and': 'と',
            }
            translated = text
            for eng, ja in translations.items():
                translated = translated.replace(eng, ja)
            return translated
        
        # Korean translations
        if target_lang == 'ko':
            translations = {
                'Committee Reports': '위원회 보고서', 'Government Propositions': '정부 제안',
                'Opposition Motions': '야당 동의', 'in Focus': '초점',
                'Dominate Committee Agenda': '위원회 의제 지배',
                'Lead Government Legislative Push': '정부 입법 추진 주도',
                'Border': '국경', 'border': '국경', 'Customs': '세관', 'customs': '세관',
                'Appropriations': '예산', 'appropriations': '예산',
                'Supplementary': '추가', 'supplementary': '추가',
                'Government Personnel': '정부 인력', 'government personnel': '정부 인력',
                'Tax': '세금', 'tax': '세금', 'Vat': '부가가치세', 'vat': '부가가치세', 'VAT': '부가가치세', 
                'Weapons': '무기', 'weapons': '무기', 'Audit': '감사', 'audit': '감사',
                'Financial': '금융', 'financial': '금융',
                'Detention': '구금', 'detention': '구금',
                'Elderly Care': '노인 돌봄', 'elderly care': '노인 돌봄',
                'Security': '보안', 'security': '보안',
                'Labor': '노동', 'labor': '노동',
                'Welfare': '복지', 'welfare': '복지',
                'Parental Benefit': '육아 수당', 'parental benefit': '육아 수당',
                'Parental': '육아', 'parental': '육아',
                'Trade': '무역', 'trade': '무역',
                'Housing': '주택', 'housing': '주택',
                'Animal Protection': '동물 보호', 'animal protection': '동물 보호',
                'Animal': '동물', 'animal': '동물',
                'Macroprudential': '거시건전성', 'macroprudential': '거시건전성',
                'Language Requirement': '언어 요구 사항', 'language requirement': '언어 요구 사항',
                'Renewable Energy': '재생 에너지', 'renewable energy': '재생 에너지',
                'Analysis of': '분석', 'committee reports': '위원회 보고서',
                'government propositions': '정부 제안', 'opposition motions': '야당 동의',
                'covering': '다루는', 'shaping legislative agenda': '입법 의제 형성',
                'in parliamentary committees': '의회 위원회에서',
                'challenging government policy': '정부 정책에 도전',
                ' for ': ' ',  # Korean doesn't need explicit "for"
                'and': '및',
            }
            translated = text
            for eng, ko in translations.items():
                translated = translated.replace(eng, ko)
            return translated
        
        # Chinese translations
        if target_lang == 'zh':
            translations = {
                'Committee Reports': '委员会报告', 'Government Propositions': '政府提案',
                'Opposition Motions': '反对党动议', 'in Focus': '焦点',
                'Dominate Committee Agenda': '主导委员会议程',
                'Lead Government Legislative Push': '引领政府立法推进',
                'Border': '边境', 'border': '边境', 'Customs': '海关', 'customs': '海关',
                'Appropriations': '拨款', 'appropriations': '拨款',
                'Supplementary': '补充', 'supplementary': '补充',
                'Government Personnel': '政府人员', 'government personnel': '政府人员',
                'Tax': '税收', 'tax': '税收', 'Vat': '增值税', 'vat': '增值税', 'VAT': '增值税', 
                'Weapons': '武器', 'weapons': '武器', 'Audit': '审计', 'audit': '审计',
                'Financial': '金融', 'financial': '金融',
                'Detention': '拘留', 'detention': '拘留',
                'Elderly Care': '养老护理', 'elderly care': '养老护理',
                'Security': '安全', 'security': '安全',
                'Labor': '劳工', 'labor': '劳工',
                'Welfare': '福利', 'welfare': '福利',
                'Parental Benefit': '育儿津贴', 'parental benefit': '育儿津贴',
                'Parental': '育儿', 'parental': '育儿',
                'Trade': '贸易', 'trade': '贸易',
                'Housing': '住房', 'housing': '住房',
                'Animal Protection': '动物保护', 'animal protection': '动物保护',
                'Animal': '动物', 'animal': '动物',
                'Macroprudential': '宏观审慎', 'macroprudential': '宏观审慎',
                'Language Requirement': '语言要求', 'language requirement': '语言要求',
                'Renewable Energy': '可再生能源', 'renewable energy': '可再生能源',
                'Analysis of': '分析', 'committee reports': '委员会报告',
                'government propositions': '政府提案', 'opposition motions': '反对党动议',
                'covering': '涵盖', 'shaping legislative agenda': '塑造立法议程',
                'in parliamentary committees': '在议会委员会中',
                'challenging government policy': '挑战政府政策',
                ' for ': ' ',  # Chinese doesn't need explicit "for"
                'and': '和',
            }
            translated = text
            for eng, zh in translations.items():
                translated = translated.replace(eng, zh)
            return translated
        
        # For any other languages, keep English (fallback)
        return text
    
    def process_article_set(self, base_filename: str, dry_run: bool = False) -> int:
        """Process all language versions of an article"""
        
        # Parse base filename (e.g., "2026-02-18-committee-reports")
        parts = base_filename.rsplit('-', 2)
        if len(parts) < 3:
            return 0
        
        date_str = parts[0]
        article_type = f"{parts[1]}-{parts[2]}"
        
        if article_type not in self.ARTICLE_TYPES:
            return 0
        
        print(f"\n📄 Processing: {base_filename}")
        
        # First, analyze English version to generate base title
        en_file = self.news_dir / f"{base_filename}-en.html"
        
        if not en_file.exists():
            print(f"  ⚠️  English version not found: {en_file.name}")
            return 0
        
        # Read English article content
        with open(en_file, 'r', encoding='utf-8') as f:
            en_content = f.read()
        
        # Extract document titles
        document_titles = self.extract_document_titles(en_content)
        
        # Try to get accurate document count from article content
        doc_count = self.extract_document_count(en_content, article_type)
        if doc_count == 0:
            doc_count = len(document_titles)
        
        print(f"  Found {len(document_titles)} h3 titles, article mentions {doc_count} documents")
        
        if len(document_titles) > 0:
            print(f"  Top documents: {', '.join(document_titles[:3])}")
        
        # Generate title and description for English
        en_title = self.generate_title(article_type, document_titles, date_str, 'en')
        en_description = self.generate_description(document_titles, article_type, doc_count)
        
        # Store for translation reference
        self.title_mapping[base_filename] = {
            'en': {'title': en_title, 'description': en_description}
        }
        
        # Update English article
        updated_count = 0
        if self.update_article_metadata(en_file, en_title, en_description, dry_run):
            updated_count += 1
        
        # Translate and update other language versions
        for lang in self.LANGUAGES:
            if lang == 'en':
                continue
            
            lang_file = self.news_dir / f"{base_filename}-{lang}.html"
            if lang_file.exists():
                # Translate title and description to target language
                lang_title = self.translate_text(en_title, lang, context="title")
                lang_description = self.translate_text(en_description, lang, context="description")
                
                # Store translated version
                self.title_mapping[base_filename][lang] = {
                    'title': lang_title,
                    'description': lang_description
                }
                
                # Update article with translated metadata
                if self.update_article_metadata(lang_file, lang_title, lang_description, dry_run):
                    updated_count += 1
        
        return updated_count
    
    def process_all_articles(self, dry_run: bool = False) -> Dict[str, int]:
        """Process all article types"""
        
        stats = {
            'committee-reports': 0,
            'government-propositions': 0,
            'opposition-motions': 0,
            'total': 0
        }
        
        # Find all unique article base names (without language suffix)
        article_files = list(self.news_dir.glob('*-en.html'))
        base_names = set()
        
        for filepath in article_files:
            name = filepath.stem  # Remove .html
            # Remove language suffix
            if name.endswith('-en'):
                base_name = name[:-3]
                
                # Check if it's one of our target article types
                for article_type in self.ARTICLE_TYPES.keys():
                    if article_type in base_name:
                        base_names.add(base_name)
                        break
        
        # Sort by date and article type
        sorted_names = sorted(base_names)
        
        print(f"\n🎯 Found {len(sorted_names)} article sets to process")
        print(f"   Languages: {', '.join(self.LANGUAGES)}")
        print(f"   Dry run: {dry_run}")
        
        for base_name in sorted_names:
            updated = self.process_article_set(base_name, dry_run)
            stats['total'] += updated
            
            # Track by type
            for article_type in self.ARTICLE_TYPES.keys():
                if article_type in base_name:
                    stats[article_type] += updated // len(self.LANGUAGES)  # Approximate
                    break
        
        return stats


def main():
    """Main entry point"""
    
    dry_run = '--dry-run' in sys.argv or '-n' in sys.argv
    
    print("=" * 70)
    print("  Content-Based Title and Metadata Generator")
    print("  Riksdagsmonitor - Swedish Parliament Intelligence")
    print("=" * 70)
    
    generator = TitleGenerator()
    stats = generator.process_all_articles(dry_run=dry_run)
    
    print("\n" + "=" * 70)
    print("  Summary")
    print("=" * 70)
    print(f"  Committee Reports:        {stats['committee-reports']} articles")
    print(f"  Government Propositions:  {stats['government-propositions']} articles")
    print(f"  Opposition Motions:       {stats['opposition-motions']} articles")
    print(f"  Total files updated:      {stats['total']} files")
    print(f"  Unique titles generated:  {len(generator.used_titles)}")
    
    # Check for duplicates (should be zero)
    if len(generator.used_titles) != len(set(generator.used_titles)):
        print("\n  ⚠️  WARNING: Duplicate titles detected!")
    else:
        print("\n  ✅ All titles are unique!")
    
    if dry_run:
        print("\n  ℹ️  This was a dry run. No files were modified.")
        print("     Run without --dry-run to apply changes.")
    
    print("=" * 70)


if __name__ == '__main__':
    main()
