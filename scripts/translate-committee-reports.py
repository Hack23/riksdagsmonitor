#!/usr/bin/env python3
"""
Translate committee reports articles into 13 languages.
This script assists with translating the ~4,000-word committee reports
while maintaining political terminology accuracy and metadata correctness.

CRITICAL: This is a PR blocker - 39 files need professional translations.
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple

# Language metadata configuration
LANGUAGE_CONFIGS = {
    "sv": {"locale": "sv_SE", "name": "Svenska", "flag": "🇸🇪", "rtl": False},
    "da": {"locale": "da_DK", "name": "Dansk", "flag": "🇩🇰", "rtl": False},
    "no": {"locale": "nb_NO", "name": "Norsk", "flag": "🇳🇴", "rtl": False},
    "fi": {"locale": "fi_FI", "name": "Suomi", "flag": "🇫🇮", "rtl": False},
    "de": {"locale": "de_DE", "name": "Deutsch", "flag": "🇩🇪", "rtl": False},
    "fr": {"locale": "fr_FR", "name": "Français", "flag": "🇫🇷", "rtl": False},
    "es": {"locale": "es_ES", "name": "Español", "flag": "🇪🇸", "rtl": False},
    "nl": {"locale": "nl_NL", "name": "Nederlands", "flag": "🇳🇱", "rtl": False},
    "ar": {"locale": "ar_SA", "name": "العربية", "flag": "🇸🇦", "rtl": True},
    "he": {"locale": "he_IL", "name": "עברית", "flag": "🇮🇱", "rtl": True},
    "ja": {"locale": "ja_JP", "name": "日本語", "flag": "🇯🇵", "rtl": False},
    "ko": {"locale": "ko_KR", "name": "한국어", "flag": "🇰🇷", "rtl": False},
    "zh": {"locale": "zh_CN", "name": "中文", "flag": "🇨🇳", "rtl": False},
}

def extract_article_sections(html_content: str) -> Dict[str, str]:
    """
    Extract key sections from the HTML article for translation.
    Returns a dict with section names and their content.
    """
    sections = {}
    
    # Extract metadata
    sections['meta_description'] = re.search(
        r'<meta name="description" content="([^"]+)"', html_content
    ).group(1) if re.search(r'<meta name="description" content="([^"]+)"', html_content) else ""
    
    sections['og_title'] = re.search(
        r'<meta property="og:title" content="([^"]+)"', html_content
    ).group(1) if re.search(r'<meta property="og:title" content="([^"]+)"', html_content) else ""
    
    sections['og_description'] = re.search(
        r'<meta property="og:description" content="([^"]+)"', html_content
    ).group(1) if re.search(r'<meta property="og:description" content="([^"]+)"', html_content) else ""
    
    # Extract site tagline
    sections['site_tagline'] = re.search(
        r'<div class="site-tagline">([^<]+)</div>', html_content
    ).group(1) if re.search(r'<div class="site-tagline">([^<]+)</div>', html_content) else ""
    
    # Extract article title (h1)
    sections['h1_title'] = re.search(
        r'<h1>([^<]+)</h1>', html_content
    ).group(1) if re.search(r'<h1>([^<]+)</h1>', html_content) else ""
    
    # Extract article meta (date, type, reading time)
    sections['article_meta'] = re.search(
        r'<time datetime="[^"]+">([^<]+)</time>[^<]*<span class="separator">•</span>[^<]*<span>([^<]+)</span>[^<]*<span class="separator">•</span>[^<]*<span>([^<]+)</span>',
        html_content
    )
    
    # Extract lead paragraph (already translated in non-English versions)
    sections['lede'] = re.search(
        r'<p class="lede">\s*([^<]+?)\s*</p>', html_content, re.DOTALL
    ).group(1).strip() if re.search(r'<p class="lede">\s*([^<]+?)\s*</p>', html_content, re.DOTALL) else ""
    
    # Extract main article body (everything after lede paragraph)
    lede_end = html_content.find('</p>', html_content.find('<p class="lede">'))
    article_end = html_content.find('</div>', html_content.find('<div class="article-content">'))
    if lede_end != -1 and article_end != -1:
        sections['article_body'] = html_content[lede_end + 4:article_end].strip()
    
    return sections

def fix_metadata(html_content: str, lang_code: str, date: str) -> str:
    """
    Fix all metadata fields to point to the correct language version.
    """
    config = LANGUAGE_CONFIGS[lang_code]
    locale = config['locale']
    
    # Fix canonical URL
    html_content = re.sub(
        r'<link rel="canonical" href="https://riksdagsmonitor.com/news/\d{4}-\d{2}-\d{2}-committee-reports-en\.html">',
        f'<link rel="canonical" href="https://riksdagsmonitor.com/news/{date}-committee-reports-{lang_code}.html">',
        html_content
    )
    
    # Fix og:url
    html_content = re.sub(
        r'<meta property="og:url" content="https://riksdagsmonitor.com/news/\d{4}-\d{2}-\d{2}-committee-reports-en\.html">',
        f'<meta property="og:url" content="https://riksdagsmonitor.com/news/{date}-committee-reports-{lang_code}.html">',
        html_content
    )
    
    # Fix og:locale
    html_content = re.sub(
        r'<meta property="og:locale" content="en_US">',
        f'<meta property="og:locale" content="{locale}">',
        html_content
    )
    
    # Fix inLanguage in schema.org
    html_content = re.sub(
        r'"inLanguage": "en"',
        f'"inLanguage": "{lang_code}"',
        html_content
    )
    
    # Fix @id in mainEntityOfPage
    html_content = re.sub(
        r'"@id": "https://riksdagsmonitor.com/news/\d{4}-\d{2}-\d{2}-committee-reports-en\.html"',
        f'"@id": "https://riksdagsmonitor.com/news/{date}-committee-reports-{lang_code}.html"',
        html_content
    )
    
    # Fix BreadcrumbList item URL
    html_content = re.sub(
        r'"item": "https://riksdagsmonitor.com/news/\d{4}-\d{2}-\d{2}-committee-reports-en\.html"',
        f'"item": "https://riksdagsmonitor.com/news/{date}-committee-reports-{lang_code}.html"',
        html_content
    )
    
    return html_content

def print_translation_stats():
    """Print statistics about what needs to be translated."""
    dates = ["2026-02-16", "2026-02-17", "2026-02-18"]
    langs = list(LANGUAGE_CONFIGS.keys())
    
    print("=" * 80)
    print("COMMITTEE REPORTS TRANSLATION TASK")
    print("=" * 80)
    print(f"\nDates to translate: {len(dates)}")
    print(f"Languages per date: {len(langs)}")
    print(f"Total files: {len(dates) * len(langs)}")
    print(f"\nLanguages: {', '.join(langs)}")
    print(f"\nEstimated words per article: ~4,000")
    print(f"Total words to translate: ~{len(dates) * len(langs) * 4000:,}")
    print("\n" + "=" * 80)
    print("\nREQUIREMENTS:")
    print("- Professional political journalism translation")
    print("- Use TRANSLATION_GUIDE.md terminology")
    print("- Maintain The Economist formal analytical style")
    print("- Fix all metadata (canonical, og:locale, inLanguage)")
    print("- Preserve HTML structure exactly")
    print("- Keep RTL attribute for Arabic/Hebrew")
    print("=" * 80)

def main():
    print_translation_stats()
    
    # Show example of what needs fixing for one file
    example_file = Path("news/2026-02-18-committee-reports-sv.html")
    if example_file.exists():
        content = example_file.read_text(encoding='utf-8')
        print("\nEXAMPLE METADATA ISSUES (2026-02-18-committee-reports-sv.html):")
        print("-" * 80)
        
        # Check canonical
        canonical = re.search(r'<link rel="canonical" href="([^"]+)"', content)
        if canonical:
            print(f"❌ Canonical URL: {canonical.group(1)}")
            print(f"   Should be: https://riksdagsmonitor.com/news/2026-02-18-committee-reports-sv.html")
        
        # Check og:locale
        og_locale = re.search(r'<meta property="og:locale" content="([^"]+)"', content)
        if og_locale:
            print(f"❌ og:locale: {og_locale.group(1)}")
            print(f"   Should be: sv_SE")
        
        # Check inLanguage
        in_language = re.search(r'"inLanguage": "([^"]+)"', content)
        if in_language:
            print(f"❌ inLanguage: {in_language.group(1)}")
            print(f"   Should be: sv")
        
        # Check if article body is in English
        article_body_sample = content[content.find('<h2>'):content.find('<h2>') + 200]
        print(f"\n❌ Article body sample:\n{article_body_sample}")
        print("   Should be: Swedish translation")
        print("-" * 80)

if __name__ == "__main__":
    main()
