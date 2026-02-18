#!/usr/bin/env python3
"""
Enhanced script to add language switchers to ALL news articles that are missing them.
Auto-discovers all article base names and processes them.
"""

import os
import re
from pathlib import Path
from collections import defaultdict

# Define all 14 languages
LANGUAGES = ["en", "sv", "da", "no", "fi", "de", "fr", "es", "nl", "ar", "he", "ja", "ko", "zh"]

# Language display names with flags
LANG_DISPLAY = {
    "en": "🇬🇧 English",
    "sv": "🇸🇪 Svenska",
    "da": "🇩🇰 Dansk",
    "no": "🇳🇴 Norsk",
    "fi": "🇫🇮 Suomi",
    "de": "🇩🇪 Deutsch",
    "fr": "🇫🇷 Français",
    "es": "🇪🇸 Español",
    "nl": "🇳🇱 Nederlands",
    "ar": "🇸🇦 العربية",
    "he": "🇮🇱 עברית",
    "ja": "🇯🇵 日本語",
    "ko": "🇰🇷 한국어",
    "zh": "🇨🇳 中文",
}


def extract_base_name(filename):
    """Extract base name from article filename by removing language suffix."""
    # Remove .html extension
    name = filename.replace('.html', '')
    
    # Check if it ends with a language code
    for lang in LANGUAGES:
        if name.endswith(f'-{lang}'):
            return name[:-len(f'-{lang}')]
    
    return None


def discover_article_bases(news_dir):
    """Discover all unique article base names in the news directory."""
    article_bases = defaultdict(list)
    
    # Find all HTML files except index files
    for file_path in news_dir.glob("*.html"):
        if file_path.name.startswith("index"):
            continue
        
        base_name = extract_base_name(file_path.name)
        if base_name:
            article_bases[base_name].append(file_path.name)
    
    return article_bases


def generate_lang_switcher(base_name, current_lang):
    """Generate language switcher HTML."""
    lines = ['  <nav class="language-switcher" role="navigation" aria-label="Language versions">']
    
    for lang in LANGUAGES:
        active = ' active' if lang == current_lang else ''
        lines.append(f'    <a href="{base_name}-{lang}.html" class="lang-link{active}" hreflang="{lang}">{LANG_DISPLAY[lang]}</a>')
    
    lines.append('  </nav>')
    
    return '\n'.join(lines)


def add_lang_switcher(file_path, base_name, lang):
    """Add language switcher to a file if it doesn't have one."""
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file already has language switcher
    if 'language-switcher' in content:
        return False
    
    print(f"  + Adding language switcher to: {file_path}")
    
    # Generate the language switcher HTML
    switcher = generate_lang_switcher(base_name, lang)
    
    # Insert language switcher after <body> tag
    # Use regex to find <body> tag and insert switcher after it
    pattern = r'(<body>)'
    replacement = r'\1\n' + switcher
    
    modified_content = re.sub(pattern, replacement, content, count=1)
    
    # Write the modified content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(modified_content)
    
    return True


def main():
    """Main execution."""
    print("=== Adding Language Switchers to ALL News Articles ===")
    print()
    
    news_dir = Path("news")
    
    # Discover all article base names
    print("Discovering articles...")
    article_bases = discover_article_bases(news_dir)
    print(f"Found {len(article_bases)} unique article base names")
    print()
    
    total_files = 0
    added_count = 0
    skipped_count = 0
    
    # Process each article base
    for base_name in sorted(article_bases.keys()):
        files = article_bases[base_name]
        
        # Determine which languages exist for this article
        existing_langs = []
        for filename in files:
            for lang in LANGUAGES:
                if filename.endswith(f'-{lang}.html'):
                    existing_langs.append(lang)
                    break
        
        if not existing_langs:
            continue
        
        # Check if any file needs language switcher
        needs_processing = False
        for lang in existing_langs:
            file_path = news_dir / f"{base_name}-{lang}.html"
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    if 'language-switcher' not in f.read():
                        needs_processing = True
                        break
        
        if not needs_processing:
            skipped_count += len(existing_langs)
            continue
        
        print(f"Processing: {base_name} ({len(existing_langs)} languages)")
        
        # Process each language version
        for lang in existing_langs:
            file_path = news_dir / f"{base_name}-{lang}.html"
            
            if file_path.exists():
                total_files += 1
                
                if add_lang_switcher(file_path, base_name, lang):
                    added_count += 1
        
        print()
    
    print("=== Summary ===")
    print(f"Total files checked: {total_files}")
    print(f"Language switchers added: {added_count}")
    print(f"Files already had switchers: {skipped_count}")
    print()
    print("✓ Done!")


if __name__ == "__main__":
    main()
