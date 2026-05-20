#!/usr/bin/env python3
"""
Script to synchronize dashboard HTML files across all languages.
Ensures all 14 dashboard files have consistent structure and enhanced font support.
"""

import re
from pathlib import Path

# Language configurations
# Note: 'no' is used as the key for Norwegian to match existing filename (index_no.html)
# while 'hreflang_code' uses 'nb' to match ISO 639-1 standard for Norwegian Bokmål.
# Future enhancement: Consider renaming file to index_nb.html for full ISO 639-1 compliance.
LANGUAGES = {
    'sv': {'locale': 'sv_SE', 'hreflang_code': 'sv'},
    'da': {'locale': 'da_DK', 'hreflang_code': 'da'},
    'no': {'locale': 'nb_NO', 'hreflang_code': 'nb'},  # File uses 'no', hreflang uses 'nb'
    'fi': {'locale': 'fi_FI', 'hreflang_code': 'fi'},
    'de': {'locale': 'de_DE', 'hreflang_code': 'de'},
    'fr': {'locale': 'fr_FR', 'hreflang_code': 'fr'},
    'es': {'locale': 'es_ES', 'hreflang_code': 'es'},
    'nl': {'locale': 'nl_NL', 'hreflang_code': 'nl'},
    'ar': {'locale': 'ar_SA', 'hreflang_code': 'ar', 'dir': 'rtl'},
    'he': {'locale': 'he_IL', 'hreflang_code': 'he', 'dir': 'rtl'},
    'ja': {'locale': 'ja_JP', 'hreflang_code': 'ja'},
    'ko': {'locale': 'ko_KR', 'hreflang_code': 'ko'},
    'zh': {'locale': 'zh_CN', 'hreflang_code': 'zh'}
}

# Fonts removed (2026-05-19): we no longer load Google Fonts on any page.
# The site uses a system-ui font stack (San Francisco / Segoe UI / Roboto)
# defined in styles.css, which renders well on every platform with zero
# network cost and zero font-swap CLS. CJK / RTL languages fall back to
# the user's locally installed CJK/RTL fonts.
ENHANCED_FONTS = ''

def update_file(lang_code):
    """Update a single dashboard file for the given language."""
    filepath = Path(f'dashboard/index_{lang_code}.html')
    
    if not filepath.exists():
        print(f"Warning: {filepath} not found")
        return
    
    print(f"Processing {filepath}...")
    content = filepath.read_text(encoding='utf-8')
    
    # 1. Add manifest link after canonical (if not present)
    if '<link rel="manifest"' not in content:
        content = content.replace(
            f'<link rel="canonical" href="https://riksdagsmonitor.com/dashboard/index_{lang_code}.html">',
            f'<link rel="canonical" href="https://riksdagsmonitor.com/dashboard/index_{lang_code}.html">\n<link rel="manifest" href="../site.webmanifest">'
        )
    
    # 2. Add missing meta tags (if not already present)
    if '<meta name="application-name"' not in content:
        # Find the author meta tag and add after it
        content = content.replace(
            '<meta name="author" content="James Pether Sörling, CISSP, CISM">',
            '<meta name="author" content="James Pether Sörling, CISSP, CISM">\n<meta name="application-name" content="Riksdagsmonitor">'
        )
    
    # 3. Enhance meta robots tag
    content = re.sub(
        r'<meta name="robots" content="index, follow">',
        '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">',
        content
    )
    
    # 4. Update font imports to include CJK fonts
    old_font_pattern = r'<link href="https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&family=Share\+Tech\+Mono&display=swap" rel="stylesheet">'
    if re.search(old_font_pattern, content):
        content = re.sub(old_font_pattern, ENHANCED_FONTS, content)
    
    # 5. Fix hreflang for Norwegian (should be 'nb' not 'no')
    content = content.replace(
        '<link rel="alternate" hreflang="no" href="https://riksdagsmonitor.com/dashboard/index_no.html">',
        '<link rel="alternate" hreflang="nb" href="https://riksdagsmonitor.com/dashboard/index_no.html">'
    )
    
    # 6. Enhance Open Graph meta tags
    lang_info = LANGUAGES[lang_code]
    
    # Add missing OG properties if needed
    if '<meta property="og:image:width"' not in content:
        content = re.sub(
            r'(<meta property="og:image" content="https://hack23\.com/cia-icon-140\.webp">)',
            r'\1\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">',
            content
        )
    
    # Add missing Twitter properties
    if '<meta name="twitter:site"' not in content:
        # Find last twitter meta and add after
        twitter_last = content.rfind('<meta name="twitter:image"')
        if twitter_last != -1:
            end_pos = content.find('>', twitter_last) + 1
            content = (content[:end_pos] + 
                      '\n<meta name="twitter:site" content="@riksdagsmonitor">' +
                      '\n<meta name="twitter:creator" content="@jamessorling">' +
                      '\n<meta name="twitter:domain" content="riksdagsmonitor.com">' +
                      content[end_pos:])
    
    # 7. Enhance Twitter card to summary_large_image
    content = content.replace(
        '<meta name="twitter:card" content="summary">',
        '<meta name="twitter:card" content="summary_large_image">'
    )
    
    # 8. Enhance JSON-LD structured data (make it more comprehensive)
    # Find the JSON-LD section and check if it has breadcrumb
    if '"@type": "WebPage"' in content and '"@type": "BreadcrumbList"' not in content:
        # Need to enhance JSON-LD - this is complex, so we'll do it manually in a separate pass
        pass
    
    # 9. Update footer to enhanced version (keep language-specific text but use English structure)
    # This is the most complex part - we need to preserve translations but adopt English footer structure
    # For now, let's just ensure the footer has role="contentinfo"
    content = content.replace('<footer>', '<footer role="contentinfo">')
    
    # Write back
    filepath.write_text(content, encoding='utf-8')
    print(f"✓ Updated {filepath}")

def main():
    """Update all non-English dashboard files."""
    print("Updating dashboard HTML files with i18n enhancements...\n")
    
    for lang_code in LANGUAGES.keys():
        update_file(lang_code)
    
    print("\n✅ All files updated!")
    print("\nNext steps:")
    print("1. Update JavaScript files to import i18n-translations.js")
    print("2. Manually review JSON-LD structured data")
    print("3. Manually update footers with enhanced structure")
    print("4. Run HTML validation")

if __name__ == '__main__':
    main()
