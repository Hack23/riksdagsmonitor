#!/usr/bin/env python3
"""
scripts/cleanup-html-consistency.py

Idempotent one-time normalization for ALL committed HTML files in the
riksdagsmonitor repository.  Processed files are marked with
``data-rm-normalized="v1"`` on the ``<body>`` element so re-runs are safe.

Fixes applied to news/*.html
------------------------------
A. Script refs   — back-to-top.ts → ../js/back-to-top.js defer
B. Script refs   — back-to-top.js (wrong path) → ../js/back-to-top.js defer
C. Script refs   — remove non-existent ../js/news-article.js
D. Script refs   — absolute /js/lib/… → relative ../js/lib/…
E. Script refs   — add defer to theme-toggle.js if missing
F. CSS            — strip <style> blocks from <body> (keep head ones)
G. Favicon        — fix ../riksdagsmonitor-logo.png → /images/favicon-32x32.png
H. Header         — inject/replace <header role="banner"> (nav + theme toggle)
I. Lang switcher  — inject top <nav class="language-switcher"> after header
J. Site footer    — inject/normalize <footer role="contentinfo"> after </article>

Fixes applied to root index*.html, dashboard/*.html, politician-dashboard*.html
----------------------------------------------------------------------
A–E only (script refs & defer attribute).

Author : Hack23 AB
License: Apache-2.0
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

NORMALIZATION_MARKER = "v9"

# Language metadata shared with article-template/constants.ts
LANG_META: dict[str, tuple[str, str, str]] = {
    # code: (flag, display_name, hreflang)
    "en": ("🇬🇧", "English",    "en"),
    "sv": ("🇸🇪", "Svenska",    "sv"),
    "da": ("🇩🇰", "Dansk",      "da"),
    "no": ("🇳🇴", "Norsk",      "nb"),   # BCP-47: nb not no
    "fi": ("🇫🇮", "Suomi",      "fi"),
    "de": ("🇩🇪", "Deutsch",    "de"),
    "fr": ("🇫🇷", "Français",   "fr"),
    "es": ("🇪🇸", "Español",    "es"),
    "nl": ("🇳🇱", "Nederlands", "nl"),
    "ar": ("🇸🇦", "العربية",   "ar"),
    "he": ("🇮🇱", "עברית",      "he"),
    "ja": ("🇯🇵", "日本語",     "ja"),
    "ko": ("🇰🇷", "한국어",     "ko"),
    "zh": ("🇨🇳", "中文",       "zh"),
}

LANG_SWITCHER_ARIA: dict[str, str] = {
    "en": "Language versions",
    "sv": "Språkversioner",
    "da": "Sprogversioner",
    "no": "Språkversjoner",
    "fi": "Kieliversiot",
    "de": "Sprachversionen",
    "fr": "Versions linguistiques",
    "es": "Versiones de idioma",
    "nl": "Taalversies",
    "ar": "إصدارات اللغة",
    "he": "גרסאות שפה",
    "ja": "言語バージョン",
    "ko": "언어 버전",
    "zh": "语言版本",
}

ALL_LANG_CODES = list(LANG_META.keys())

# ---------------------------------------------------------------------------
# Pre-generate site chrome (header + footer) for all 14 languages
# ---------------------------------------------------------------------------

def load_site_chrome(repo_root: Path) -> dict[str, dict[str, str]]:
    """Call dump-site-chrome.ts once and return a mapping lang → {header, footer}."""
    print("Generating site chrome from TypeScript helpers …", flush=True)
    result = subprocess.run(
        ["npx", "tsx", "scripts/dump-site-chrome.ts"],
        cwd=str(repo_root),
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


# ---------------------------------------------------------------------------
# Language detection helpers
# ---------------------------------------------------------------------------

def detect_lang(filepath: Path) -> str:
    """Return language code from filename suffix, default 'en'."""
    stem = filepath.stem          # e.g. 2026-04-18-breaking-1705-en
    for code in ALL_LANG_CODES:
        if stem.endswith(f"-{code}"):
            return code
    return "en"


def base_slug_from_path(filepath: Path) -> str:
    """Return the slug without language suffix, e.g. 2026-04-18-breaking-1705."""
    name = filepath.stem          # no .html
    lang = detect_lang(filepath)
    if name.endswith(f"-{lang}"):
        return name[: -(len(lang) + 1)]
    return name


def discover_sibling_languages(filepath: Path) -> list[str]:
    """Return list of languages for which a sibling article file exists."""
    base = base_slug_from_path(filepath)
    news_dir = filepath.parent
    return [
        code
        for code in ALL_LANG_CODES
        if (news_dir / f"{base}-{code}.html").exists()
    ]


# ---------------------------------------------------------------------------
# Language-switcher HTML generator
# ---------------------------------------------------------------------------

def build_language_switcher(base_slug: str, current_lang: str,
                             available_langs: list[str]) -> str:
    aria = LANG_SWITCHER_ARIA.get(current_lang, LANG_SWITCHER_ARIA["en"])
    links: list[str] = []
    for code in ALL_LANG_CODES:
        if code not in available_langs:
            continue
        flag, name, hreflang = LANG_META[code]
        active_cls = " active" if code == current_lang else ""
        aria_current = ' aria-current="page"' if code == current_lang else ""
        href = f"{base_slug}-{code}.html"
        # lang="bcp47" tells screen-readers to use the correct voice for the
        # native language name (e.g. "العربية", "中文"), independent of the
        # page's outer <html lang>. hreflang is SEO-only.
        links.append(
            f'    <a href="{href}" class="lang-link{active_cls}"'
            f' hreflang="{hreflang}" lang="{hreflang}"{aria_current}>{flag} {name}</a>'
        )
    inner = "\n".join(links)
    return (
        f'  <nav class="language-switcher" role="navigation" aria-label="{aria}">\n'
        f"{inner}\n"
        f"  </nav>"
    )


# ---------------------------------------------------------------------------
# BeautifulSoup helpers
# ---------------------------------------------------------------------------

_BS_PARSER = "lxml"


def parse(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, _BS_PARSER)


def is_already_normalized(soup: BeautifulSoup) -> bool:
    body = soup.find("body")
    # Accept only the current marker version; v1 files need a re-pass for back-to-top
    return (
        isinstance(body, Tag)
        and body.get("data-rm-normalized") == NORMALIZATION_MARKER
    )


def mark_normalized(soup: BeautifulSoup) -> None:
    body = soup.find("body")
    if isinstance(body, Tag):
        body["data-rm-normalized"] = NORMALIZATION_MARKER


def has_site_header(soup: BeautifulSoup) -> bool:
    """True if the page has <header role="banner"> or <header class="site-header">."""
    return bool(
        soup.find("header", attrs={"role": "banner"})
        or soup.find("header", attrs={"class": re.compile(r"\bsite-header\b")})
    )


def has_language_switcher(soup: BeautifulSoup) -> bool:
    return bool(
        soup.find("nav", attrs={"class": re.compile(r"\blanguage-switcher\b")})
    )


def has_site_footer(soup: BeautifulSoup) -> bool:
    """True if the page already has a full <footer role="contentinfo"> or <footer class="site-footer">."""
    return bool(
        soup.find("footer", attrs={"role": "contentinfo"})
        or soup.find("footer", attrs={"class": re.compile(r"\bsite-footer\b")})
    )


# ---------------------------------------------------------------------------
# Structural injection helpers (work on the raw HTML string, not BS4)
# Reason: BS4 / lxml may alter complex multi-kilobyte HTML attributes
# (chart configs, JSON-LD) in ways that corrupt them.  We use regex
# insertion for structural elements, reserving BS4 for detection only.
# ---------------------------------------------------------------------------

# Regex: finds the opening <body …> tag (captures everything up to the >)
_BODY_OPEN_RE = re.compile(r"(<body\b[^>]*>)", re.IGNORECASE)

# Regex: finds the closing </body> tag
_BODY_CLOSE_RE = re.compile(r"(</body\s*>)", re.IGNORECASE)

# Regex: remove the standalone floating theme-toggle button that precedes
# the language-switcher in old-style articles.  The button is outside any
# header and its entire element is replaced by the new <header>.
_FLOATING_THEME_BTN_RE = re.compile(
    r"\s*<button\s[^>]*id=[\"']theme-toggle[\"'][^>]*>.*?</button>",
    re.DOTALL | re.IGNORECASE,
)

# Strip <style> blocks from <body> (not from <head>)
# Strategy: split on </head> and only strip from the body portion.
_STYLE_IN_BODY_RE = re.compile(r"<style\b[^>]*>.*?</style>", re.DOTALL | re.IGNORECASE)

# Fix broken script references
# NOTE: the trailing `(?:\s*</script>)?` is critical — some sources ship the
# bad script as `<script src="…/back-to-top.ts"></script>` (paired tag) and
# some as `<script src="…/back-to-top.ts" />` (self-closing). Consuming the
# closing tag when present prevents a stray `</script>` from being left
# behind after substitution.
_BACK_TO_TOP_TS_RE = re.compile(
    r'<script\b[^>]*\bsrc=["\'](?:\.\./)?scripts/back-to-top\.ts["\'][^>]*/?>(?:\s*</script>)?',
    re.IGNORECASE,
)
_BACK_TO_TOP_WRONG_RE = re.compile(
    r'<script\b[^>]*\bsrc=["\'](?:\.\./)?scripts/back-to-top\.js["\'][^>]*/?>(?:\s*</script>)?',
    re.IGNORECASE,
)
_NEWS_ARTICLE_JS_RE = re.compile(
    r'<script\b[^>]*\bsrc=["\'][^"\']*news-article\.js["\'][^>]*/?>(?:\s*</script>)?',
    re.IGNORECASE,
)
# Absolute /js/lib/ → relative ../js/lib/
_ABS_JS_LIB_RE = re.compile(r'src=["\']/(js/lib/[^"\']+)["\']', re.IGNORECASE)

# Add defer to theme-toggle.js if it doesn't have it
_THEME_TOGGLE_NO_DEFER_RE = re.compile(
    r'(<script\b[^>]*\bsrc=["\'][^"\']*theme-toggle\.js["\'])(\s*>)',
    re.IGNORECASE,
)

# Fix ../riksdagsmonitor-logo.png favicon link (points to deleted file)
_PNG_FAVICON_RE = re.compile(
    r'<link\b[^>]*\bhref=["\'](?:\.\./)?riksdagsmonitor-logo\.png["\'][^>]*/?>',
    re.IGNORECASE,
)
_PNG_FAVICON_REPLACEMENT = (
    '<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">'
)

# JSON-LD logo URL fix: riksdagsmonitor-logo.png → android-chrome-512x512.png
_JSONLD_PNG_LOGO_RE = re.compile(
    r'"url"\s*:\s*"https://riksdagsmonitor\.com/riksdagsmonitor-logo\.png"',
    re.IGNORECASE,
)
_JSONLD_PNG_LOGO_REPLACEMENT = '"url": "https://riksdagsmonitor.com/images/android-chrome-512x512.png"'

# Language-switcher removal (we'll re-inject the correct one)
_LANG_SWITCHER_RE = re.compile(
    r'\s*<nav\b[^>]*class=["\'][^"\']*\blanguage-switcher\b[^"\']*["\'][^>]*>.*?</nav>',
    re.DOTALL | re.IGNORECASE,
)

# Site-footer variants that need replacing
_SITE_FOOTER_VARIANTS_RE = re.compile(
    r'<footer\b[^>]*class=["\'][^"\']*\b(?:site-footer|news-footer)\b[^"\']*["\'][^>]*>.*?</footer>',
    re.DOTALL | re.IGNORECASE,
)
_BARE_FOOTER_RE = re.compile(
    r'<footer\s*>',
    re.IGNORECASE,
)
_INLINE_STYLE_FOOTER_RE = re.compile(
    r'<footer\b[^>]*\bstyle=["\'][^"\']*["\'][^>]*>.*?</footer>',
    re.DOTALL | re.IGNORECASE,
)

# Root-page fixes (PR-A): absolute /js/theme-toggle.js → relative js/theme-toggle.js
# (root-page relative path — no "../" prefix because root pages sit at repo root).
_ABS_THEME_TOGGLE_RE = re.compile(
    r'(<script\b[^>]*\bsrc=["\'])/(js/theme-toggle\.js)(["\'])',
    re.IGNORECASE,
)

# Obsolete HTML5 `type="text/css"` on <link rel="stylesheet"> — harmless
# but noisy and inconsistent. Strip it (HTML5 makes it the default).
_OBSOLETE_CSS_TYPE_RE = re.compile(
    r'(<link\b[^>]*\brel=["\']stylesheet["\'][^>]*)\s+type=["\']text/css["\']',
    re.IGNORECASE,
)

# Inject lang="bcp47" on language-switcher <a> tags that are missing it
# (companion to hreflang). Matches both article (../js/) and root pages
# (../index_xx.html or index_xx.html).
#
# The negative lookahead consumes up to the next `<` to guard against both
# the case where `lang=` appears BEFORE `hreflang=` on the same tag and
# AFTER it. Regex alone cannot do a look-both-ways check, so we instead
# match the ENTIRE opening <a> tag and transform only if it has no
# lang= attribute. See `_inject_lang_on_switcher_anchors()`.
_SWITCHER_ANCHOR_RE = re.compile(
    r'<a\b([^>]*\bhreflang=["\']([^"\']+)["\'][^>]*)>',
    re.IGNORECASE,
)


def _inject_lang_on_switcher_anchors(html: str) -> str:
    """Add ``lang="bcp47"`` to any ``<a>`` tag carrying ``hreflang=``
    (assumed to be a language-switcher link) that does not already
    have a ``lang=`` attribute anywhere in its opening tag.

    This helps screen-readers pronounce native-script language names
    (e.g. ``العربية``, ``中文``) in the correct voice rather than the
    surrounding page's ``<html lang>`` voice.
    """
    def _replace(match: re.Match[str]) -> str:
        attrs = match.group(1)
        hreflang_val = match.group(2)
        # If this tag already has a lang= attribute, leave it alone.
        if re.search(r'\blang=["\']', attrs):
            return match.group(0)
        return f'<a{attrs} lang="{hreflang_val}">'

    return _SWITCHER_ANCHOR_RE.sub(_replace, html)


def _apply_regex_fixes(html: str, *, is_news: bool, js_prefix: str = "../") -> str:
    """Apply all regex-level fixes to raw HTML text.

    Args:
        html:       raw HTML source
        is_news:    True for news articles (adds language-switcher prep);
                    False for root/dashboard/politician-dashboard pages.
        js_prefix:  Path prefix for local <script src=…> references.
                    "../" for pages in a subdirectory (news/, dashboard/),
                    ""    for root-level pages (index*.html, politician-dashboard*.html).
                    Only honoured when is_news=False — news articles are
                    hard-coded to "../js/" by the other regexes.
    """

    # A. Fix back-to-top.ts → ../js/back-to-top.js
    html = _BACK_TO_TOP_TS_RE.sub(
        '<script src="../js/back-to-top.js" defer></script>', html
    )

    # B. Fix wrong scripts/back-to-top.js path
    html = _BACK_TO_TOP_WRONG_RE.sub(
        '<script src="../js/back-to-top.js" defer></script>', html
    )

    # C. Remove non-existent news-article.js
    html = _NEWS_ARTICLE_JS_RE.sub("", html)

    # D. Fix absolute /js/lib/ → relative ../js/lib/
    html = _ABS_JS_LIB_RE.sub(r'src="../\1"', html)

    # D2. Root/dashboard-only: /js/theme-toggle.js → <prefix>js/theme-toggle.js
    # Root pages sit at repo root (prefix=""), dashboard/ at one level below
    # (prefix="../").
    if not is_news:
        html = _ABS_THEME_TOGGLE_RE.sub(
            lambda m: f'{m.group(1)}{js_prefix}{m.group(2)}{m.group(3)}',
            html,
        )

    # D3. Strip obsolete `type="text/css"` from <link rel="stylesheet">.
    # HTML5 makes `type="text/css"` the default; the attribute is tolerated
    # but adds noise and makes diffs inconsistent across the corpus.
    html = _OBSOLETE_CSS_TYPE_RE.sub(r'\1', html)

    # D4. Inject lang="bcp47" on language-switcher <a> tags that only have
    # hreflang="bcp47". This helps screen-readers pronounce the native
    # language name (e.g. "العربية") using the correct voice.
    html = _inject_lang_on_switcher_anchors(html)

    # E. Add defer to theme-toggle.js if missing
    def _add_defer_to_theme_toggle(m: re.Match[str]) -> str:
        full_tag = m.group(0)
        if "defer" in full_tag.lower():
            return full_tag
        return m.group(1) + " defer" + m.group(2)
    html = _THEME_TOGGLE_NO_DEFER_RE.sub(_add_defer_to_theme_toggle, html)

    if not is_news:
        # Root/dashboard/politician-dashboard pages: ensure back-to-top.js
        # is loaded. Button markup already exists (`<button id="back-to-top">`)
        # but the script was never loaded on these page types, leaving the
        # button dead. Inject before theme-toggle.js (if present) so both
        # land together, else before </body>.
        if "back-to-top.js" not in html:
            inject = f'<script src="{js_prefix}js/back-to-top.js" defer></script>'
            if "theme-toggle.js" in html:
                html = re.sub(
                    r'(<script\b[^>]*\bsrc=["\'][^"\']*theme-toggle\.js["\'][^>]*>)',
                    inject + r'\n\1',
                    html,
                    count=1,
                    flags=re.IGNORECASE,
                )
            else:
                html = re.sub(
                    r'(</body>)',
                    inject + r'\n\1',
                    html,
                    count=1,
                    flags=re.IGNORECASE,
                )
        return html

    # E2. Ensure back-to-top.js is present
    if "back-to-top.js" not in html:
        # Prefer injecting before theme-toggle.js; fall back to before </body>
        if "theme-toggle.js" in html:
            html = re.sub(
                r'(<script\b[^>]*\bsrc=["\'][^"\']*theme-toggle\.js["\'][^>]*>)',
                r'<script src="../js/back-to-top.js" defer></script>\n\1',
                html,
                count=1,
                flags=re.IGNORECASE,
            )
        else:
            html = re.sub(
                r'(</body>)',
                r'<script src="../js/back-to-top.js" defer></script>\n\1',
                html,
                count=1,
                flags=re.IGNORECASE,
            )

    # F. Strip <style> blocks from <body> only
    # Split on </head> boundary so we don't touch head styles
    head_end = html.lower().find("</head>")
    if head_end != -1:
        after_head = html[head_end:]
        after_head_cleaned = _STYLE_IN_BODY_RE.sub("", after_head)
        html = html[:head_end] + after_head_cleaned

    # G. Fix ../riksdagsmonitor-logo.png favicon
    html = _PNG_FAVICON_RE.sub(_PNG_FAVICON_REPLACEMENT, html)

    # G2. Fix JSON-LD logo URL
    html = _JSONLD_PNG_LOGO_RE.sub(_JSONLD_PNG_LOGO_REPLACEMENT, html)

    # G2b. Fix any other absolute-URL PNG logo references (OG/JSON-LD)
    html = re.sub(
        r'https://riksdagsmonitor\.com/riksdagsmonitor(?:news)?(?:-logo)?(?:news2)?\.png',
        'https://riksdagsmonitor.com/images/android-chrome-512x512.png',
        html,
        flags=re.IGNORECASE,
    )

    # G3. Fix ../riksdagsmonitor-logo.png img src → ../images/riksdagsmonitor-logo.webp
    html = re.sub(
        r'src=["\'](?:\.\./)riksdagsmonitor-logo\.png["\']',
        'src="../images/riksdagsmonitor-logo.webp"',
        html,
        flags=re.IGNORECASE,
    )
    # G4. Fix ../riksdagsmonitornews-logo.png img src → ../images/riksdagsmonitornews-logo.webp
    html = re.sub(
        r'src=["\'](?:\.\./)riksdagsmonitornews-logo\.png["\']',
        'src="../images/riksdagsmonitornews-logo.webp"',
        html,
        flags=re.IGNORECASE,
    )

    # ── HTML hygiene passes (idempotent; fix bugs introduced by earlier
    # normalization runs that shipped to the corpus):
    #
    #   H1. Collapse `</script></script>` (stray double-close left behind
    #       by an earlier regex that substituted `<script src="…">` with
    #       `<script …></script>` but didn't consume the original `</script>`).
    #
    #   H2. Normalise `role='xxx'` → `role="xxx"` on `<footer>`/`<header>`/
    #       `<nav>` landmark elements (HTMLHint `attr-value-double-quotes`).
    #
    #   H3. Deduplicate `lang="..."` attributes inside language-switcher
    #       `<a>` tags (authored markup sometimes emits `lang=` before
    #       `hreflang=`; an earlier version of the lang-injection pass
    #       added a second `lang=` AFTER `hreflang=`).
    # ─────────────────────────────────────────────────────────────────────
    html = re.sub(r'</script>\s*</script>', '</script>', html)
    # H1b. Stray unpaired `</script>` that appears directly after `</footer>`
    # and immediately before another `<script>` tag (byproduct of an older
    # normalization pass that removed the opening <script …> but left the
    # closing tag orphaned).
    html = re.sub(r'(</footer>\s*)</script>(\s*<script\b)', r'\1\2', html, flags=re.IGNORECASE)
    html = re.sub(
        r"(<(?:footer|header|nav|section|main|aside|article)\b[^>]*?\brole=)'([^']+)'",
        r'\1"\2"',
        html,
        flags=re.IGNORECASE,
    )

    def _dedup_lang_in_anchor(m: re.Match[str]) -> str:
        tag = m.group(0)
        # Find all lang="..." occurrences; keep the first, remove the rest.
        lang_matches = list(re.finditer(r'\s+lang=["\'][^"\']*["\']', tag))
        if len(lang_matches) <= 1:
            return tag
        # Remove every match after the first (walk in reverse to preserve offsets).
        for dup in reversed(lang_matches[1:]):
            tag = tag[:dup.start()] + tag[dup.end():]
        return tag

    html = re.sub(r'<a\b[^>]*\blang=["\'][^"\']*["\'][^>]*>', _dedup_lang_in_anchor, html, flags=re.IGNORECASE)

    return html


# ---------------------------------------------------------------------------
# Full normalization of a news article
# ---------------------------------------------------------------------------

def _find_body_open_end(html: str) -> int:
    """Return the index immediately after the closing '>' of <body ...>."""
    m = _BODY_OPEN_RE.search(html)
    if not m:
        return -1
    return m.end()


def normalize_news_article(
    html: str,
    filepath: Path,
    site_chrome: dict[str, dict[str, str]],
) -> tuple[str, list[str]]:
    """
    Normalize a single news article HTML string.
    Returns (new_html, list_of_applied_fix_labels).
    """
    changes: list[str] = []

    # ── A–G: regex fixes ────────────────────────────────────────────────
    new_html = _apply_regex_fixes(html, is_news=True)
    if new_html != html:
        changes.append("script-refs/style/favicon")
    html = new_html

    # Detect language
    lang = detect_lang(filepath)
    chrome = site_chrome.get(lang, site_chrome["en"])
    header_html: str = chrome["header"]
    footer_html: str = chrome["footer"]

    # ── H: <header role="banner"> ────────────────────────────────────────
    soup_probe = parse(html)
    if not has_site_header(soup_probe):
        # Remove the floating theme toggle button (if present) before inserting header
        html_no_btn = _FLOATING_THEME_BTN_RE.sub("", html, count=1)
        # Insert header right after <body …>
        body_end = _find_body_open_end(html_no_btn)
        if body_end != -1:
            html = (
                html_no_btn[:body_end]
                + "\n"
                + header_html
                + html_no_btn[body_end:]
            )
        changes.append("header-injected")
    else:
        # Standardize: if header has class="site-header" instead of role="banner"
        if not soup_probe.find("header", attrs={"role": "banner"}):
            html = re.sub(
                r'<header\b[^>]*class=["\'][^"\']*\bsite-header\b[^"\']*["\']',
                lambda m: m.group(0).rstrip(">") + ' role="banner"',
                html,
                count=1,
                flags=re.IGNORECASE,
            )
            changes.append("header-role-banner-added")

    # ── I: language switcher ─────────────────────────────────────────────
    # Always regenerate: remove the existing one (wherever it is) then inject
    # after </header>, ensuring it is always at the top of the page body.
    base_slug = base_slug_from_path(filepath)
    available = discover_sibling_languages(filepath)
    new_switcher = build_language_switcher(base_slug, lang, available)

    # Step 1: Remove all existing language-switcher navs
    html = _LANG_SWITCHER_RE.sub("", html)

    # Step 2: Insert new switcher after </header>
    header_close = html.find("</header>")
    if header_close != -1:
        insert_pos = header_close + len("</header>")
        html = (
            html[:insert_pos]
            + "\n"
            + new_switcher
            + html[insert_pos:]
        )
        changes.append("lang-switcher-repositioned")
    else:
        body_end = _find_body_open_end(html)
        if body_end != -1:
            html = (
                html[:body_end]
                + "\n"
                + new_switcher
                + html[body_end:]
            )
            changes.append("lang-switcher-injected")

    # ── J: <footer role="contentinfo"> ───────────────────────────────────
    soup_probe2 = parse(html)
    if not has_site_footer(soup_probe2):
        # Remove non-canonical footer variants before inserting
        html_no_bad_footer = _SITE_FOOTER_VARIANTS_RE.sub("", html)
        html_no_bad_footer = _BARE_FOOTER_RE.sub("<footer role='contentinfo'>", html_no_bad_footer)
        html_no_bad_footer = _INLINE_STYLE_FOOTER_RE.sub("", html_no_bad_footer)

        # Insert after </article> if present, else before </body>
        article_close = html_no_bad_footer.rfind("</article>")
        if article_close != -1:
            insert_pos = article_close + len("</article>")
            html = (
                html_no_bad_footer[:insert_pos]
                + "\n\n"
                + footer_html
                + html_no_bad_footer[insert_pos:]
            )
        else:
            # Fallback: before </body>
            body_close = _BODY_CLOSE_RE.search(html_no_bad_footer)
            if body_close:
                html = (
                    html_no_bad_footer[: body_close.start()]
                    + "\n\n"
                    + footer_html
                    + "\n"
                    + html_no_bad_footer[body_close.start():]
                )
            else:
                html = html_no_bad_footer + "\n\n" + footer_html + "\n</body>\n</html>"
        changes.append("site-footer-injected")
    else:
        # Replace non-canonical site-footer variants (class="site-footer") with
        # the canonical role="contentinfo" version IF it lacks the role attribute.
        has_role_footer = bool(
            re.search(r'<footer\b[^>]*\brole=["\']contentinfo["\']', html, re.IGNORECASE)
        )
        if not has_role_footer:
            # It has class="site-footer" but no role — add the role
            html = re.sub(
                r'(<footer\b[^>]*class=["\'][^"\']*\bsite-footer\b[^"\']*["\'])',
                lambda m: m.group(1).rstrip(">") + ' role="contentinfo"',
                html,
                count=1,
                flags=re.IGNORECASE,
            )
            changes.append("site-footer-role-added")

    # ── Mark normalized ──────────────────────────────────────────────────
    # Replace an existing marker OR add the marker to a clean <body>.
    #
    # We look for ANY prior version of the marker (including duplicates that
    # may have been introduced by an earlier bug where the regex only matched
    # v1–v5 while the current version had already moved past v5). The cleanup
    # replaces the entire run of one-or-more adjacent `data-rm-normalized="vN"`
    # attributes with a single fresh marker.
    dup_re = re.compile(r'(?:\s+data-rm-normalized="v\d+")+')
    if dup_re.search(html):
        html = dup_re.sub(
            f' data-rm-normalized="{NORMALIZATION_MARKER}"',
            html,
        )
    else:
        html = _BODY_OPEN_RE.sub(
            lambda m: m.group(1).replace(">", f' data-rm-normalized="{NORMALIZATION_MARKER}">'),
            html,
            count=1,
        )

    return html, changes


# ---------------------------------------------------------------------------
# Root-page fix (index*.html, dashboard/*.html, politician-dashboard*.html)
# ---------------------------------------------------------------------------

def normalize_root_page(html: str, filepath: Path) -> tuple[str, list[str]]:
    """Apply script-ref + a11y fixes to root/dashboard/politician-dashboard pages.

    Dashboard pages live in `dashboard/` so they need `../js/` prefix;
    root-level pages (index*.html, politician-dashboard*.html) need
    plain `js/`.
    """
    # Determine js prefix from depth relative to repo root.
    # dashboard/index_sv.html → parent name "dashboard" → "../"
    # index_sv.html            → parent is repo root       → ""
    js_prefix = "../" if filepath.parent.name == "dashboard" else ""
    new_html = _apply_regex_fixes(html, is_news=False, js_prefix=js_prefix)
    changes: list[str] = []
    if new_html != html:
        changes.append("script-refs")
    return new_html, changes


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    repo_root = Path(__file__).parent.parent.resolve()

    # Load site chrome (calls npx tsx once)
    try:
        site_chrome = load_site_chrome(repo_root)
    except subprocess.CalledProcessError as exc:
        print(f"ERROR: failed to generate site chrome: {exc}", file=sys.stderr)
        sys.exit(1)

    # Counters
    total = skipped = fixed_news = fixed_root = 0
    change_counts: dict[str, int] = {}

    news_dir = repo_root / "news"
    news_files = sorted(
        f for f in news_dir.glob("*.html")
        # Skip generated news/index*.html (not committed, built at deploy time)
        if not f.name.startswith("index")
    )

    root_files = (
        sorted(repo_root.glob("index*.html"))
        + sorted(repo_root.glob("dashboard/*.html"))
        + sorted(repo_root.glob("politician-dashboard*.html"))
    )
    # Exclude already-generated index files in dashboard/ subdirs
    root_files = [f for f in root_files if not f.name.startswith("index_") or
                  f.parent == repo_root or f.parent.name == "dashboard"]

    print(f"Processing {len(news_files)} news articles + {len(root_files)} root/dashboard pages …\n")

    # ── Process news articles ────────────────────────────────────────────
    for filepath in news_files:
        total += 1
        html = filepath.read_text(encoding="utf-8")

        if is_already_normalized(parse(html)):
            skipped += 1
            continue

        new_html, changes = normalize_news_article(html, filepath, site_chrome)

        if new_html != html or changes:
            filepath.write_text(new_html, encoding="utf-8")
            fixed_news += 1
            for c in changes:
                change_counts[c] = change_counts.get(c, 0) + 1
            if os.environ.get("RM_VERBOSE"):
                print(f"  ✓ {filepath.name}: {', '.join(changes)}")
        else:
            skipped += 1

    # ── Process root / dashboard pages ──────────────────────────────────
    for filepath in root_files:
        total += 1
        html = filepath.read_text(encoding="utf-8")
        new_html, changes = normalize_root_page(html, filepath)
        if new_html != html:
            filepath.write_text(new_html, encoding="utf-8")
            fixed_root += 1
            for c in changes:
                change_counts[c] = change_counts.get(c, 0) + 1

    # ── Summary ─────────────────────────────────────────────────────────
    print("\n=== Summary ===")
    print(f"Total files examined : {total}")
    print(f"Already normalized   : {skipped}")
    print(f"News articles fixed  : {fixed_news}")
    print(f"Root/dashboard fixed : {fixed_root}")
    print("\nFix breakdown:")
    for fix, count in sorted(change_counts.items(), key=lambda x: -x[1]):
        print(f"  {fix:35s} {count:>6}")
    print("\n✓ Done!")


if __name__ == "__main__":
    main()
