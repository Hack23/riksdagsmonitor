#!/usr/bin/env python3
"""
Fix Article Navigation: Language Switcher + Back-to-News Top Nav

This script ensures ALL news articles have:
1. A language switcher nav (14 languages) after <body>
2. An article-top-nav div with a localized back-to-news link before the article

It auto-discovers all articles in the news/ directory and processes them
idempotently — safe to run multiple times.

Usage:
    python3 scripts/fix-article-navigation.py
    python3 scripts/fix-article-navigation.py --dry-run
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

# ── Language configuration ───────────────────────────────────────────────
LANGUAGES = ["en", "sv", "da", "no", "fi", "de", "fr", "es", "nl", "ar", "he", "ja", "ko", "zh"]

LANG_DISPLAY = {
    "en": ("🇬🇧", "English"),
    "sv": ("🇸🇪", "Svenska"),
    "da": ("🇩🇰", "Dansk"),
    "no": ("🇳🇴", "Norsk"),
    "fi": ("🇫🇮", "Suomi"),
    "de": ("🇩🇪", "Deutsch"),
    "fr": ("🇫🇷", "Français"),
    "es": ("🇪🇸", "Español"),
    "nl": ("🇳🇱", "Nederlands"),
    "ar": ("🇸🇦", "العربية"),
    "he": ("🇮🇱", "עברית"),
    "ja": ("🇯🇵", "日本語"),
    "ko": ("🇰🇷", "한국어"),
    "zh": ("🇨🇳", "中文"),
}

LANG_SWITCHER_ARIA = {
    "en": "Language", "sv": "Språk", "da": "Sprog", "no": "Språk",
    "fi": "Kieli", "de": "Sprache", "fr": "Langue", "es": "Idioma",
    "nl": "Taal", "ar": "اللغة", "he": "שפה", "ja": "言語",
    "ko": "언어", "zh": "语言",
}

BACK_TO_NEWS = {
    "en": "Back to News", "sv": "Tillbaka till nyheter",
    "da": "Tilbage til nyheder", "no": "Tilbake til nyheter",
    "fi": "Takaisin uutisiin", "de": "Zurück zu Nachrichten",
    "fr": "Retour aux actualités", "es": "Volver a noticias",
    "nl": "Terug naar nieuws", "ar": "العودة إلى الأخبار",
    "he": "חזרה לחדשות", "ja": "ニュースに戻る",
    "ko": "뉴스로 돌아가기", "zh": "返回新闻",
}

# ── Helpers ───────────────────────────────────────────────────────────────

def extract_lang(filename):
    """Extract language code from article filename."""
    name = filename.replace('.html', '')
    for lang in LANGUAGES:
        if name.endswith(f'-{lang}'):
            return lang
    return None


def extract_base(filename):
    """Extract base slug (without lang suffix) from article filename."""
    name = filename.replace('.html', '')
    for lang in LANGUAGES:
        if name.endswith(f'-{lang}'):
            return name[:-len(f'-{lang}')]
    return None


def news_index_for(lang):
    """Return the news index filename for a language."""
    if lang == 'en':
        return 'index.html'
    return f'index_{lang}.html'


def generate_language_switcher(base_slug, current_lang):
    """Generate language switcher HTML matching template.ts output."""
    aria = LANG_SWITCHER_ARIA.get(current_lang, "Language")
    lines = [f'  <nav class="language-switcher" role="navigation" aria-label="{aria}">']
    for lang in LANGUAGES:
        flag, name = LANG_DISPLAY[lang]
        active = ' active' if lang == current_lang else ''
        aria_current = ' aria-current="page"' if lang == current_lang else ''
        lines.append(
            f'    <a href="{base_slug}-{lang}.html" class="lang-link{active}" '
            f'hreflang="{lang}"{aria_current}>{flag} {name}</a>'
        )
    lines.append('  </nav>')
    return '\n'.join(lines)


def generate_top_nav(lang):
    """Generate article-top-nav div matching template.ts output."""
    label = BACK_TO_NEWS.get(lang, BACK_TO_NEWS["en"])
    index = news_index_for(lang)
    return (
        f'\n<div class="article-top-nav">\n'
        f'  <a href="{index}" class="back-to-news">\n'
        f'    \u2190 {label}\n'
        f'  </a>\n'
        f'</div>\n'
    )


# ── Processing ────────────────────────────────────────────────────────────

def process_article(filepath, base_slug, lang, dry_run=False):
    """
    Ensure an article has both language-switcher and article-top-nav.
    Returns a tuple (added_switcher, added_topnav).
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    added_switcher = False
    added_topnav = False

    # ── 1. Language switcher ──────────────────────────────────────────
    has_switcher = 'language-switcher' in content
    if not has_switcher:
        switcher_html = generate_language_switcher(base_slug, lang)
        # Insert after <body> tag
        content = re.sub(
            r'(<body>)',
            r'\1\n' + switcher_html,
            content,
            count=1,
        )
        added_switcher = True
    else:
        # Update existing switcher to have all 14 languages
        new_switcher = generate_language_switcher(base_slug, lang)
        content = re.sub(
            r'<nav class="language-switcher"[^>]*>.*?</nav>',
            new_switcher,
            content,
            flags=re.DOTALL,
            count=1,
        )

    # ── 2. article-top-nav ────────────────────────────────────────────
    has_topnav = 'article-top-nav' in content
    if not has_topnav:
        top_nav_html = generate_top_nav(lang)
        # Insert before the article/div.news-article element
        # Try: before <article class="news-article"> or <div class="news-article">
        inserted = False

        # Pattern A: insert after closing </nav> of language-switcher
        if '</nav>' in content:
            # Find the LAST </nav> that belongs to the language-switcher
            # Insert top-nav right after it
            nav_pattern = r'(</nav>)(\s*)(<(?:article|div)\s+class="(?:news-article|container)")'
            match = re.search(nav_pattern, content, re.DOTALL)
            if match:
                content = content[:match.end(1)] + top_nav_html + match.group(2) + match.group(3) + content[match.end():]
                inserted = True

        # Pattern B: insert directly before <article class="news-article"> or <article class="container">
        if not inserted:
            article_pattern = r'(<(?:article|div)\s+class="(?:news-article|container)")'
            match = re.search(article_pattern, content)
            if match:
                content = content[:match.start()] + top_nav_html + '\n' + content[match.start():]
                inserted = True

        if inserted:
            added_topnav = True

    # ── Write if changed ──────────────────────────────────────────────
    if content != original and not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    return added_switcher, added_topnav


def discover_articles(news_dir):
    """Discover all article files grouped by base slug."""
    articles = defaultdict(dict)  # base_slug -> {lang: filepath}
    for html_file in sorted(news_dir.glob('*.html')):
        if html_file.name.startswith('index'):
            continue
        lang = extract_lang(html_file.name)
        base = extract_base(html_file.name)
        if lang and base:
            articles[base][lang] = html_file
    return articles


def main():
    dry_run = '--dry-run' in sys.argv
    if dry_run:
        print("=== DRY RUN — no files will be modified ===\n")

    # Resolve news directory relative to this script
    script_dir = Path(__file__).resolve().parent
    news_dir = script_dir.parent / 'news'

    if not news_dir.exists():
        print(f"ERROR: news directory not found at {news_dir}")
        sys.exit(1)

    print("=== Fix Article Navigation ===")
    print(f"News directory: {news_dir}\n")

    articles = discover_articles(news_dir)
    print(f"Discovered {len(articles)} unique article slugs\n")

    total = 0
    switchers_added = 0
    topnavs_added = 0

    for base_slug in sorted(articles.keys()):
        lang_files = articles[base_slug]
        for lang in LANGUAGES:
            if lang not in lang_files:
                continue
            filepath = lang_files[lang]
            total += 1
            s, t = process_article(filepath, base_slug, lang, dry_run=dry_run)
            if s:
                switchers_added += 1
            if t:
                topnavs_added += 1

    print("=== Summary ===")
    print(f"Total files processed: {total}")
    print(f"Language switchers added/updated: {switchers_added}")
    print(f"Top nav (article-top-nav) added: {topnavs_added}")
    if dry_run:
        print("\n(Dry run — no files were modified)")
    print("\n✓ Done!")


if __name__ == '__main__':
    main()
