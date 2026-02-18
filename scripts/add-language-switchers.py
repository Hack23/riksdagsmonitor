#!/usr/bin/env python3
"""
Script to add language switchers to news articles that are missing them.
"""

import os
import re
from pathlib import Path

# Define article base names that need language switchers
ARTICLE_BASES = [
    "2026-02-18-committee-reports",
    "2026-02-18-government-propositions",
    "2026-02-18-parliamentary-questions",
    "2026-02-18-opposition-motions",
]

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
        print(f"  ✓ Already has language switcher: {file_path}")
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
    
    print(f"  ✓ Added language switcher to: {file_path}")
    return True


def main():
    """Main execution."""
    print("=== Adding Language Switchers to News Articles ===")
    print()
    
    news_dir = Path("news")
    total_files = 0
    added_count = 0
    
    for base in ARTICLE_BASES:
        print(f"Processing: {base}")
        
        for lang in LANGUAGES:
            file_path = news_dir / f"{base}-{lang}.html"
            
            if file_path.exists():
                total_files += 1
                
                if add_lang_switcher(file_path, base, lang):
                    added_count += 1
            else:
                print(f"  ⚠ File not found: {file_path}")
        
        print()
    
    print("=== Summary ===")
    print(f"Total files processed: {total_files}")
    print(f"Language switchers added: {added_count}")
    print(f"Files already had switchers: {total_files - added_count}")
    print()
    print("✓ Done!")


if __name__ == "__main__":
    main()
