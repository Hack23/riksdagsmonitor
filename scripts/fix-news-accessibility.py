#!/usr/bin/env python3
"""
WCAG 2.1 AA Accessibility Fix for News Articles
Adds skip-to-main-content links, <main> landmark, and aria-labels to news articles.

Changes applied to each article (if not already present):
1. <a href="#main-content" class="skip-link"> after <body> tag
2. <main id="main-content"> wrapping the <article> element
3. aria-label on <nav class="article-navigation"> (language-specific)
"""

import os
import re
import sys
from pathlib import Path

SKIP_LINK_TEXT = {
    'en': 'Skip to main content',
    'sv': 'Hoppa till huvudinnehåll',
    'da': 'Gå til hovedindhold',
    'no': 'Hopp til hovedinnhold',
    'fi': 'Siirry pääsisältöön',
    'de': 'Zum Hauptinhalt springen',
    'fr': 'Aller au contenu principal',
    'es': 'Ir al contenido principal',
    'nl': 'Ga naar de hoofdinhoud',
    'ar': 'انتقل إلى المحتوى الرئيسي',
    'he': 'עבור לתוכן הראשי',
    'ja': 'メインコンテンツへスキップ',
    'ko': '주요 콘텐츠로 건너뛰기',
    'zh': '跳到主要内容',
}

ARTICLE_NAV_LABEL = {
    'en': 'Article navigation',
    'sv': 'Artikelnavigering',
    'da': 'Artikelnavigation',
    'no': 'Artikkelnavigasjon',
    'fi': 'Artikkelin navigaatio',
    'de': 'Artikelnavigation',
    'fr': "Navigation de l'article",
    'es': 'Navegación del artículo',
    'nl': 'Artikelnavigatie',
    'ar': 'التنقل في المقالة',
    'he': 'ניווט כתבה',
    'ja': '記事のナビゲーション',
    'ko': '기사 탐색',
    'zh': '文章导航',
}


def get_lang(content):
    """Extract the language code from <html lang="...">."""
    match = re.search(r'<html[^>]+lang=["\']([a-z]{2})["\']', content, re.IGNORECASE)
    if match:
        return match.group(1).lower()
    return 'en'


def fix_accessibility(content, lang):
    """Apply all WCAG 2.1 AA fixes to article content."""
    changed = False

    # 1. Add skip link after <body> tag (if not already present)
    if 'class="skip-link"' not in content and 'skip-link' not in content:
        skip_text = SKIP_LINK_TEXT.get(lang, SKIP_LINK_TEXT['en'])
        skip_link = f'<a href="#main-content" class="skip-link">{skip_text}</a>\n  '
        # Insert right after <body> tag (which may have attributes)
        content, n = re.subn(
            r'(<body[^>]*>)\s*\n',
            r'\1\n  ' + skip_link,
            content,
            count=1
        )
        if n:
            changed = True

    # 2a. If <main> exists without id, add id="main-content"
    if '<main' in content and 'id="main-content"' not in content:
        content, n = re.subn(r'<main>', '<main id="main-content">', content, count=1)
        if n:
            changed = True

    # 2b. Add <main id="main-content"> wrapper around <article> (if not present)
    if 'id="main-content"' not in content and '<main' not in content:
        # Add <main id="main-content"> before <article
        content, n1 = re.subn(
            r'(\n)([ \t]*)(<article\b)',
            r'\1\2<main id="main-content">\n\2\3',
            content,
            count=1
        )
        # Add </main> after </article>
        content, n2 = re.subn(
            r'(</article>)(\s*\n)',
            r'\1\2</main>\n',
            content,
            count=1
        )
        if n1 and n2:
            changed = True

    # 3. Add aria-label to <nav class="article-navigation"> (if missing)
    nav_label = ARTICLE_NAV_LABEL.get(lang, ARTICLE_NAV_LABEL['en'])
    if '<nav class="article-navigation"' in content and \
            'article-navigation"' in content and \
            'aria-label' not in re.search(r'<nav class="article-navigation"[^>]*>', content, re.S).group(0) \
            if re.search(r'<nav class="article-navigation"[^>]*>', content, re.S) else True:
        content, n = re.subn(
            r'<nav class="article-navigation"',
            f'<nav class="article-navigation" aria-label="{nav_label}"',
            content,
            count=1
        )
        if n:
            changed = True

    return content, changed


def process_file(filepath):
    """Process a single HTML file and return (changed, error)."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
    except Exception as e:
        return False, str(e)

    lang = get_lang(original)
    content, changed = fix_accessibility(original, lang)

    if changed:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        except Exception as e:
            return False, str(e)

    return changed, None


def main():
    repo_root = Path(__file__).parent.parent
    news_dir = repo_root / 'news'

    if not news_dir.exists():
        print(f"ERROR: news directory not found at {news_dir}", file=sys.stderr)
        sys.exit(1)

    # Get all non-index HTML files in news/
    html_files = sorted([
        f for f in news_dir.glob('*.html')
        if not f.name.startswith('index')
    ])

    print(f"Processing {len(html_files)} news article files...")
    changed_count = 0
    error_count = 0

    for filepath in html_files:
        changed, error = process_file(filepath)
        if error:
            print(f"  ERROR {filepath.name}: {error}", file=sys.stderr)
            error_count += 1
        elif changed:
            changed_count += 1

    print(f"\nDone: {changed_count} files updated, {error_count} errors")
    if error_count:
        sys.exit(1)


if __name__ == '__main__':
    main()
