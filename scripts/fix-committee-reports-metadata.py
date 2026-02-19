#!/usr/bin/env python3
"""
Fix metadata in all 39 committee reports files.
This handles canonical URLs, og:locale, inLanguage, and other metadata issues.
"""

import re
from pathlib import Path
from typing import Dict

# Language metadata configuration
LANGUAGE_CONFIGS = {
    "sv": {"locale": "sv_SE"},
    "da": {"locale": "da_DK"},
    "no": {"locale": "nb_NO"},
    "fi": {"locale": "fi_FI"},
    "de": {"locale": "de_DE"},
    "fr": {"locale": "fr_FR"},
    "es": {"locale": "es_ES"},
    "nl": {"locale": "nl_NL"},
    "ar": {"locale": "ar_SA"},
    "he": {"locale": "he_IL"},
    "ja": {"locale": "ja_JP"},
    "ko": {"locale": "ko_KR"},
    "zh": {"locale": "zh_CN"},
}

def fix_file_metadata(file_path: Path) -> bool:
    """
    Fix all metadata issues in a single file.
    Returns True if fixes were applied.
    """
    # Extract language code and date from filename
    # Format: YYYY-MM-DD-committee-reports-LANG.html
    match = re.match(r'(\d{4}-\d{2}-\d{2})-committee-reports-(\w{2})\.html', file_path.name)
    if not match:
        print(f"⚠️  Skipping {file_path.name} - doesn't match expected pattern")
        return False
    
    date, lang_code = match.groups()
    
    if lang_code not in LANGUAGE_CONFIGS:
        print(f"⚠️  Skipping {file_path.name} - unknown language code: {lang_code}")
        return False
    
    config = LANGUAGE_CONFIGS[lang_code]
    locale = config['locale']
    
    # Read file
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
    except Exception as e:
        print(f"❌ Error reading {file_path.name}: {e}")
        return False
    
    # Fix canonical URL
    content = re.sub(
        r'<link rel="canonical" href="https://riksdagsmonitor\.com/news/\d{4}-\d{2}-\d{2}-committee-reports-en\.html">',
        f'<link rel="canonical" href="https://riksdagsmonitor.com/news/{date}-committee-reports-{lang_code}.html">',
        content
    )
    
    # Fix og:url
    content = re.sub(
        r'<meta property="og:url" content="https://riksdagsmonitor\.com/news/\d{4}-\d{2}-\d{2}-committee-reports-en\.html">',
        f'<meta property="og:url" content="https://riksdagsmonitor.com/news/{date}-committee-reports-{lang_code}.html">',
        content
    )
    
    # Fix og:locale
    content = re.sub(
        r'<meta property="og:locale" content="en_US">',
        f'<meta property="og:locale" content="{locale}">',
        content
    )
    
    # Fix inLanguage in schema.org NewsArticle
    content = re.sub(
        r'"inLanguage": "en"',
        f'"inLanguage": "{lang_code}"',
        content
    )
    
    # Fix @id in mainEntityOfPage (schema.org)
    content = re.sub(
        r'"@id": "https://riksdagsmonitor\.com/news/\d{4}-\d{2}-\d{2}-committee-reports-en\.html"',
        f'"@id": "https://riksdagsmonitor.com/news/{date}-committee-reports-{lang_code}.html"',
        content
    )
    
    # Fix BreadcrumbList item URL (schema.org)
    content = re.sub(
        r'("position": 3,[^}]*"item": )"https://riksdagsmonitor\.com/news/\d{4}-\d{2}-\d{2}-committee-reports-en\.html"',
        f'\\1"https://riksdagsmonitor.com/news/{date}-committee-reports-{lang_code}.html"',
        content
    )
    
    # Check if changes were made
    if content == original_content:
        print(f"ℹ️  No changes needed for {file_path.name}")
        return False
    
    # Write back
    try:
        file_path.write_text(content, encoding='utf-8')
        print(f"✅ Fixed metadata in {file_path.name}")
        return True
    except Exception as e:
        print(f"❌ Error writing {file_path.name}: {e}")
        return False

def main():
    """Process all committee reports files."""
    news_dir = Path("news")
    
    if not news_dir.exists():
        print(f"❌ News directory not found: {news_dir}")
        return
    
    # Find all committee reports files (non-English)
    pattern = r'\d{4}-\d{2}-(16|17|18)-committee-reports-(sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html'
    files = [f for f in news_dir.glob("*-committee-reports-*.html") 
             if re.match(pattern, f.name)]
    
    files.sort()
    
    print("=" * 80)
    print(f"FIXING METADATA IN {len(files)} COMMITTEE REPORTS FILES")
    print("=" * 80)
    print()
    
    fixed_count = 0
    for file_path in files:
        if fix_file_metadata(file_path):
            fixed_count += 1
    
    print()
    print("=" * 80)
    print(f"SUMMARY: Fixed {fixed_count}/{len(files)} files")
    print("=" * 80)

if __name__ == "__main__":
    main()
