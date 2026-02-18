#!/usr/bin/env python3
"""
Fix Language Switchers and Remove Embedded CSS

This script:
1. Updates language switchers to only show languages that actually exist
2. Removes embedded <style> tags from articles and ensures they use styles.css
"""

import os
import re
from pathlib import Path
from collections import defaultdict

# Language configuration
LANGUAGES = {
    'en': ('🇬🇧', 'English'),
    'sv': ('🇸🇪', 'Svenska'),
    'da': ('🇩🇰', 'Dansk'),
    'no': ('🇳🇴', 'Norsk'),
    'fi': ('🇫🇮', 'Suomi'),
    'de': ('🇩🇪', 'Deutsch'),
    'fr': ('🇫🇷', 'Français'),
    'es': ('🇪🇸', 'Español'),
    'nl': ('🇳🇱', 'Nederlands'),
    'ar': ('🇸🇦', 'العربية'),
    'he': ('🇮🇱', 'עברית'),
    'ja': ('🇯🇵', '日本語'),
    'ko': ('🇰🇷', '한국어'),
    'zh': ('🇨🇳', '中文'),
}

def discover_articles(news_dir):
    """Discover all article base names and their available languages."""
    articles = defaultdict(set)
    
    for html_file in Path(news_dir).glob('*.html'):
        filename = html_file.name
        
        # Skip index files
        if filename.startswith('index'):
            continue
        
        # Extract base name and language
        for lang_code in LANGUAGES.keys():
            suffix = f'-{lang_code}.html'
            if filename.endswith(suffix):
                base_name = filename[:-len(suffix)]
                articles[base_name].add(lang_code)
                break
    
    return articles

def generate_language_switcher(base_name, current_lang, available_languages):
    """Generate language switcher HTML with only existing languages."""
    lines = ['  <nav class="language-switcher" role="navigation" aria-label="Language versions">']
    
    # Sort languages by the order in LANGUAGES dict
    sorted_langs = [lang for lang in LANGUAGES.keys() if lang in available_languages]
    
    for lang_code in sorted_langs:
        flag, name = LANGUAGES[lang_code]
        active_class = ' active' if lang_code == current_lang else ''
        href = f'{base_name}-{lang_code}.html'
        lines.append(f'    <a href="{href}" class="lang-link{active_class}" hreflang="{lang_code}">{flag} {name}</a>')
    
    lines.append('  </nav>')
    return '\n'.join(lines)

def extract_current_lang(filename):
    """Extract language code from filename."""
    for lang_code in LANGUAGES.keys():
        if filename.endswith(f'-{lang_code}.html'):
            return lang_code
    return 'en'  # default

def remove_embedded_css(content):
    """Remove embedded <style> tags from HTML content."""
    # Find and remove <style>...</style> blocks
    pattern = r'<style>.*?</style>'
    cleaned_content = re.sub(pattern, '', content, flags=re.DOTALL)
    return cleaned_content

def has_embedded_css(content):
    """Check if content has embedded CSS."""
    return '<style>' in content

def ensure_styles_link(content):
    """Ensure the article has a link to styles.css."""
    if '<link rel="stylesheet" href="../styles.css">' not in content:
        # Add it after the Google Fonts link or in the head section
        if '<link href="https://fonts.googleapis.com/css2?' in content:
            content = content.replace(
                '<link href="https://fonts.googleapis.com/css2?',
                '<link rel="stylesheet" href="../styles.css">\n  \n  <link href="https://fonts.googleapis.com/css2?'
            )
        elif '</head>' in content:
            content = content.replace('</head>', '  <link rel="stylesheet" href="../styles.css">\n</head>')
    return content

def update_article(filepath, base_name, available_languages):
    """Update an article's language switcher and remove embedded CSS."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    current_lang = extract_current_lang(filepath.name)
    
    # Generate new language switcher
    new_switcher = generate_language_switcher(base_name, current_lang, available_languages)
    
    # Replace existing language switcher
    pattern = r'<nav class="language-switcher".*?</nav>'
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, new_switcher, content, flags=re.DOTALL)
    else:
        # Insert language switcher after <body> tag
        content = content.replace('<body>', f'<body>\n{new_switcher}')
    
    # Remove embedded CSS if present
    had_embedded_css = has_embedded_css(content)
    if had_embedded_css:
        content = remove_embedded_css(content)
        content = ensure_styles_link(content)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return had_embedded_css

def main():
    news_dir = Path(__file__).parent.parent / 'news'
    
    print("=== Fixing Language Switchers and Removing Embedded CSS ===\n")
    
    # Discover articles and their available languages
    print("Discovering articles and available languages...")
    articles = discover_articles(news_dir)
    print(f"Found {len(articles)} unique article base names\n")
    
    # Statistics
    total_files = 0
    fixed_switchers = 0
    removed_css = 0
    
    # Process each article
    for base_name, available_languages in sorted(articles.items()):
        # Process each language version
        for lang_code in available_languages:
            filename = f'{base_name}-{lang_code}.html'
            filepath = news_dir / filename
            
            if filepath.exists():
                had_css = update_article(filepath, base_name, available_languages)
                total_files += 1
                fixed_switchers += 1
                if had_css:
                    removed_css += 1
                    print(f"  ✓ {filename}: Fixed switcher + Removed embedded CSS")
    
    # Summary
    print(f"\n=== Summary ===")
    print(f"Total files processed: {total_files}")
    print(f"Language switchers fixed: {fixed_switchers}")
    print(f"Embedded CSS removed: {removed_css}")
    print(f"\n✓ Done!")

if __name__ == '__main__':
    main()
