#!/usr/bin/env python3
"""
build-dashboard-pages.py

Slim down each `index{,_<lang>}.html` by extracting the 9 large dashboard
`<section>` blocks into dedicated standalone pages under `dashboards/`,
and replace the removed sections with a localised tile-grid hub that
links to the new pages.

Why this approach: every existing `index_<lang>.html` already contains
fully translated dashboard markup AND a translated chrome (header /
language switcher / footer).  We slice these out and re-wrap each
section in a per-language standalone page — preserving every existing
translation with zero new translation work.

Result for each language:
    dashboards/election-cycle.html      (or dashboards/election-cycle_<lang>.html)
    dashboards/parties.html
    dashboards/committees.html
    dashboards/coalitions.html
    dashboards/seasonal-patterns.html
    dashboards/pre-election.html
    dashboards/anomaly-detection.html
    dashboards/ministers.html
    dashboards/risk.html

Run from the repo root:

    python3 scripts/build-dashboard-pages.py

The script is **idempotent**: it always rewrites from a fresh source
copy stored under `scripts/build-dashboard-pages.snapshot/` on first
run.  Subsequent runs skip the snapshot step so edits to the snapshot
become the source of truth.

Author: Hack23 AB / Riksdagsmonitor
License: Apache-2.0
"""

from __future__ import annotations

import html
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ────────────────────────────────────────────────────────────────────────────
# Configuration
# ────────────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
DASHBOARDS_DIR = ROOT / 'dashboards'
SNAPSHOT_DIR = ROOT / 'scripts' / 'build-dashboard-pages.snapshot'

# Filename language codes used in this repo (no = Norwegian Bokmål file)
LANGS: List[str] = [
    'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
    'ar', 'he', 'ja', 'ko', 'zh',
]

# hreflang code per filename code
HREFLANG: Dict[str, str] = {
    'en': 'en', 'sv': 'sv', 'da': 'da', 'no': 'nb', 'fi': 'fi',
    'de': 'de', 'fr': 'fr', 'es': 'es', 'nl': 'nl', 'ar': 'ar',
    'he': 'he', 'ja': 'ja', 'ko': 'ko', 'zh': 'zh',
}

# RTL languages
RTL_LANGS = {'ar', 'he'}


@dataclass(frozen=True)
class Dashboard:
    """One dashboard: source <section id> → target slug + emoji + classification."""
    section_id: str        # id attribute on the source <section>
    slug: str              # filename slug used under dashboards/
    emoji: str             # a single emoji used in cards & headings
    keywords_en: str       # English SEO keywords for this dashboard topic


# Order matches the in-page order of index.html.  Slugs are stable
# URLs and are NOT translated (URLs stay English for SEO + linkability).
DASHBOARDS: List[Dashboard] = [
    Dashboard('election-cycle-dashboard', 'election-cycle', '🗳️',
              'election cycle, Swedish elections, performance timeline, decision effectiveness, risk forecasting'),
    Dashboard('party-dashboard', 'parties', '🏛️',
              'party performance, party effectiveness, coalition alignment, momentum indicators, 8 Swedish parties'),
    Dashboard('committee-dashboard', 'committees', '👥',
              'committee performance, committee network, productivity heatmap, decision effectiveness, parliamentary committees'),
    Dashboard('coalition-dashboard', 'coalitions', '🤝',
              'coalition analysis, voting patterns, coalition stability, Tidö agreement, parliamentary coalitions'),
    Dashboard('seasonal-patterns-dashboard', 'seasonal-patterns', '📅',
              'seasonal patterns, quarterly activity, anomaly timeline, parliamentary calendar, activity classification'),
    Dashboard('pre-election-dashboard', 'pre-election', '⚠️',
              'pre-election monitoring, early warning, baseline deviation, party performance shifts, election year comparison'),
    Dashboard('anomaly-detection-dashboard', 'anomaly-detection', '🚨',
              'anomaly detection, early warning system, z-score, severity heatmap, behavioral anomalies'),
    Dashboard('ministry-dashboard', 'ministers', '🎖️',
              'government ministers, ministry performance, minister risk, influence rankings, cabinet analysis'),
    Dashboard('risk-dashboard', 'risk', '⚠️',
              'risk assessment, 45 risk rules, anomaly detection, MP risk scoring, parliamentary risk analytics'),
]


# Per-language UI strings used by this script.  Only the small set of
# *new* labels we introduce (page navigation, breadcrumb leaf, hub
# heading).  Section headings & content are preserved verbatim from
# the source per-language index.
@dataclass(frozen=True)
class L10n:
    home_label: str          # "Home", "Hem"…  (breadcrumb)
    dashboards_label: str    # "Dashboards", "Paneler" — breadcrumb parent
    hub_heading: str         # "Political Intelligence Dashboards"
    hub_intro: str           # short intro paragraph for the hub on the home page
    open_label: str          # "Open dashboard →"
    back_to_home: str        # "← Back to home"
    related_heading: str     # "More dashboards"


L10N: Dict[str, L10n] = {
    'en': L10n('Home', 'Dashboards',
               'Political Intelligence Dashboards',
               'Nine specialised dashboards covering election cycles, party performance, committees, coalitions, seasonal patterns, pre-election monitoring, anomaly detection, ministers and risk — built on Citizen Intelligence Agency OSINT data and the Swedish Riksdag open data API.',
               'Open dashboard →', '← Back to home', 'More dashboards'),
    'sv': L10n('Hem', 'Paneler',
               'Politiska underrättelsepaneler',
               'Nio specialiserade paneler som täcker valcykler, partiprestanda, utskott, koalitioner, säsongsmönster, övervakning före val, anomalidetektion, ministrar och risk — byggda på Citizen Intelligence Agency OSINT-data och Sveriges Riksdags öppna data-API.',
               'Öppna panel →', '← Tillbaka till startsidan', 'Fler paneler'),
    'da': L10n('Hjem', 'Paneler',
               'Politiske efterretningspaneler',
               'Ni specialiserede paneler, der dækker valgcyklusser, partipræstation, udvalg, koalitioner, sæsonmønstre, overvågning før valg, anomalidetektion, ministre og risiko — bygget på Citizen Intelligence Agency OSINT-data og det svenske Riksdags åbne data-API.',
               'Åbn panel →', '← Tilbage til forsiden', 'Flere paneler'),
    'no': L10n('Hjem', 'Dashbord',
               'Politiske etterretningsdashbord',
               'Ni spesialiserte dashbord som dekker valgsykluser, partienes prestasjoner, komiteer, koalisjoner, sesongmønstre, overvåkning før valg, anomalideteksjon, ministre og risiko — bygd på Citizen Intelligence Agency OSINT-data og det svenske Riksdagens åpne data-API.',
               'Åpne dashbord →', '← Tilbake til forsiden', 'Flere dashbord'),
    'fi': L10n('Etusivu', 'Paneelit',
               'Poliittiset tiedustelupaneelit',
               'Yhdeksän erikoistunutta paneelia, jotka kattavat vaalisyklit, puolueiden suoriutumisen, valiokunnat, koalitiot, kausivaihtelut, vaalia edeltävän seurannan, poikkeamien havaitsemisen, ministerit ja riskit — perustuen Citizen Intelligence Agency OSINT-dataan ja Ruotsin valtiopäivien avoimeen dataan.',
               'Avaa paneeli →', '← Takaisin etusivulle', 'Lisää paneeleita'),
    'de': L10n('Startseite', 'Dashboards',
               'Politische Intelligence-Dashboards',
               'Neun spezialisierte Dashboards zu Wahlzyklen, Parteileistung, Ausschüssen, Koalitionen, saisonalen Mustern, Vorwahlüberwachung, Anomalieerkennung, Ministern und Risiko — basierend auf Citizen Intelligence Agency OSINT-Daten und der Open-Data-API des Schwedischen Reichstags.',
               'Dashboard öffnen →', '← Zurück zur Startseite', 'Weitere Dashboards'),
    'fr': L10n('Accueil', 'Tableaux de bord',
               'Tableaux de bord du renseignement politique',
               'Neuf tableaux de bord spécialisés couvrant les cycles électoraux, la performance des partis, les commissions, les coalitions, les schémas saisonniers, la surveillance pré-électorale, la détection d’anomalies, les ministres et le risque — fondés sur les données OSINT de Citizen Intelligence Agency et l’API ouverte du Riksdag suédois.',
               'Ouvrir le tableau de bord →', '← Retour à l’accueil', 'Autres tableaux de bord'),
    'es': L10n('Inicio', 'Paneles',
               'Paneles de inteligencia política',
               'Nueve paneles especializados que cubren ciclos electorales, rendimiento de los partidos, comisiones, coaliciones, patrones estacionales, monitoreo pre-electoral, detección de anomalías, ministros y riesgo — basados en datos OSINT de Citizen Intelligence Agency y la API abierta del Riksdag sueco.',
               'Abrir panel →', '← Volver al inicio', 'Más paneles'),
    'nl': L10n('Home', 'Dashboards',
               'Politieke inlichtingen-dashboards',
               'Negen gespecialiseerde dashboards voor verkiezingscycli, partijprestaties, commissies, coalities, seizoenpatronen, pre-electorale monitoring, anomaliedetectie, ministers en risico — gebouwd op Citizen Intelligence Agency OSINT-data en de open-data-API van de Zweedse Riksdag.',
               'Open dashboard →', '← Terug naar de startpagina', 'Meer dashboards'),
    'ar': L10n('الرئيسية', 'لوحات المعلومات',
               'لوحات معلومات الاستخبارات السياسية',
               'تسع لوحات معلومات متخصصة تغطي الدورات الانتخابية وأداء الأحزاب واللجان والائتلافات والأنماط الموسمية والرصد قبل الانتخابات واكتشاف الشذوذ والوزراء والمخاطر — مبنية على بيانات OSINT من Citizen Intelligence Agency وواجهة بيانات الريكسداج السويدي المفتوحة.',
               'افتح اللوحة ←', '→ العودة إلى الصفحة الرئيسية', 'مزيد من اللوحات'),
    'he': L10n('בית', 'לוחות מחוונים',
               'לוחות מחוונים של מודיעין פוליטי',
               'תשעה לוחות מחוונים מתמחים המכסים מחזורי בחירות, ביצועי מפלגות, ועדות, קואליציות, דפוסים עונתיים, ניטור לפני בחירות, זיהוי חריגות, שרים וסיכון — בנויים על נתוני OSINT של Citizen Intelligence Agency ועל ה-API הפתוח של ה-Riksdag השוודי.',
               'פתח לוח מחוונים ←', '→ חזרה לדף הבית', 'לוחות מחוונים נוספים'),
    'ja': L10n('ホーム', 'ダッシュボード',
               '政治インテリジェンス・ダッシュボード',
               '選挙サイクル、政党のパフォーマンス、委員会、連立、季節パターン、選挙前モニタリング、異常検知、大臣、リスクを網羅する 9 つの専門ダッシュボード — Citizen Intelligence Agency の OSINT データとスウェーデン国会のオープンデータ API に基づいています。',
               'ダッシュボードを開く →', '← ホームへ戻る', '他のダッシュボード'),
    'ko': L10n('홈', '대시보드',
               '정치 인텔리전스 대시보드',
               '선거 주기, 정당 성과, 위원회, 연립, 계절 패턴, 선거 전 모니터링, 이상 탐지, 장관, 위험을 다루는 9 개의 전문 대시보드 — Citizen Intelligence Agency OSINT 데이터와 스웨덴 국회 공개 데이터 API를 기반으로 구축되었습니다.',
               '대시보드 열기 →', '← 홈으로 돌아가기', '더 많은 대시보드'),
    'zh': L10n('首页', '仪表板',
               '政治情报仪表板',
               '九个专业仪表板，涵盖选举周期、政党表现、委员会、联盟、季节性模式、选前监控、异常检测、部长和风险 — 基于 Citizen Intelligence Agency OSINT 数据和瑞典国会开放数据 API 构建。',
               '打开仪表板 →', '← 返回首页', '更多仪表板'),
}


# ────────────────────────────────────────────────────────────────────────────
# Snapshot / source isolation
# ────────────────────────────────────────────────────────────────────────────

def index_path(lang: str) -> Path:
    """Path to the source index file for `lang` (e.g. index.html / index_sv.html)."""
    return ROOT / ('index.html' if lang == 'en' else f'index_{lang}.html')


def snapshot_path(lang: str) -> Path:
    return SNAPSHOT_DIR / index_path(lang).name


def ensure_snapshot() -> None:
    """Save a one-shot snapshot of the source index*.html files.

    Once snapshots exist this script always reads from them, so the
    transformation is fully repeatable: rerun and you get the same output.
    To re-baseline, delete `scripts/build-dashboard-pages.snapshot/` and
    rerun (the next run snapshots the current index*.html files).
    """
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    for lang in LANGS:
        src = index_path(lang)
        dst = snapshot_path(lang)
        if not dst.exists() and src.exists():
            shutil.copy2(src, dst)
            print(f'  snapshot saved: {dst.relative_to(ROOT)}')


# ────────────────────────────────────────────────────────────────────────────
# Section extraction (regex-based — fast, deterministic, zero deps)
# ────────────────────────────────────────────────────────────────────────────

def _section_regex(section_id: str) -> re.Pattern[str]:
    """Match `<section id="ID" ...> ... </section>` with simple nesting:
    <section> blocks in this repo do not nest, so a non-greedy match
    against the closing `</section>` is safe.
    """
    return re.compile(
        r'<section\b[^>]*\bid="' + re.escape(section_id) + r'"[^>]*>.*?</section>\s*',
        re.DOTALL,
    )


def extract_section(html: str, section_id: str) -> Optional[str]:
    """Return the full `<section>...</section>` HTML for `section_id`."""
    m = _section_regex(section_id).search(html)
    return m.group(0).rstrip() if m else None


def remove_sections(html: str, section_ids: List[str]) -> str:
    """Strip every listed section in `html`, leaving an empty line in its place."""
    for sid in section_ids:
        html = _section_regex(sid).sub('', html)
    # collapse runs of blank lines that the deletions left behind
    html = re.sub(r'\n{3,}', '\n\n', html)
    return html


def first_h2_text(section_html: str) -> str:
    """Return the inner text of the first <h2> in a section as plain text.

    The returned value is HTML-unescaped so that callers can safely re-escape
    it via ``_html_safe`` (or embed it in JSON-LD via ``_json_safe``) without
    double-escaping ampersands like ``Risk Assessment & Anomaly Detection``.
    """
    m = re.search(r'<h2[^>]*>(.*?)</h2>', section_html, re.DOTALL)
    if not m:
        return ''
    raw = m.group(1)
    # strip <span aria-hidden="true">…</span> wrappers but keep their text
    raw = re.sub(r'<span[^>]*>(.*?)</span>', r'\1', raw, flags=re.DOTALL)
    raw = re.sub(r'<[^>]+>', '', raw)            # any other tags
    return html.unescape(' '.join(raw.split()))


def first_p_text(section_html: str) -> str:
    """Return the inner text of the first <p> right after the section's <h2>.

    Used to seed each dashboard page's <meta name="description">. The text is
    HTML-unescaped (see ``first_h2_text``) so re-escaping by callers does not
    produce ``&amp;amp;``.
    """
    m = re.search(
        r'<h2[^>]*>.*?</h2>\s*<p[^>]*>(.*?)</p>',
        section_html, re.DOTALL,
    )
    if not m:
        return ''
    raw = re.sub(r'<[^>]+>', '', m.group(1))
    return html.unescape(' '.join(raw.split()))


# ────────────────────────────────────────────────────────────────────────────
# Path / URL rewrites for dashboards/ subdirectory
# ────────────────────────────────────────────────────────────────────────────

# Single-pass token replacements applied to chrome HTML when it moves
# from the repo root into the `dashboards/` subdirectory.  Order matters:
# longer/more-specific replacements come first.
PATH_REWRITES: List[Tuple[str, str]] = [
    ('href="news/index.html"', 'href="../news/index.html"'),
    ('href="dashboard/index.html"', 'href="../dashboard/index.html"'),
    ('href="politician-dashboard.html"', 'href="../politician-dashboard.html"'),
    ('href="political-intelligence.html"', 'href="../political-intelligence.html"'),
    ('href="sitemap.html"', 'href="../sitemap.html"'),
    ('href="index.html"', 'href="../index.html"'),
    ('src="images/', 'src="../images/'),
    ('href="images/', 'href="../images/'),
    ('href="styles.css"', 'href="../styles.css"'),
    ('src="js/', 'src="../js/'),
    ('href="site.webmanifest"', 'href="../site.webmanifest"'),
]

# Per-language index links inside the language switcher / footer language grid.
# We rewrite `href="index.html"` -> `href="../index.html"` (English) and
# `href="index_<xx>.html"` -> `href="../index_<xx>.html"`.
LANG_INDEX_RE = re.compile(r'href="index_([a-z]+)\.html"')


def rewrite_paths_for_subdir(html: str) -> str:
    """Adjust relative paths so they resolve when loaded from /dashboards/."""
    for old, new in PATH_REWRITES:
        html = html.replace(old, new)
    html = LANG_INDEX_RE.sub(r'href="../index_\1.html"', html)
    return html


# ────────────────────────────────────────────────────────────────────────────
# Chrome (head + header + footer) extraction from a source index file
# ────────────────────────────────────────────────────────────────────────────

@dataclass
class Chrome:
    head_open: str       # everything from <!DOCTYPE> down to (not incl.) </head>
    body_open: str       # opening <body> tag (incl. attrs)
    skip_link: str
    header_html: str     # entire <header>…</header>
    breadcrumb_html: str # the breadcrumb <nav>
    footer_html: str     # entire <footer>…</footer>
    back_to_top: str     # back-to-top button
    tail_scripts: str    # closing scripts (main.ts, mermaid bootstrap…)


HEAD_RE = re.compile(r'<!DOCTYPE.*?</head>', re.DOTALL)
BODY_OPEN_RE = re.compile(r'<body[^>]*>')
HEADER_RE = re.compile(r'<header>.*?</header>', re.DOTALL)
BREADCRUMB_RE = re.compile(
    # The breadcrumb <nav> aria-label is translated per language, so we
    # match the structural <ol class="breadcrumb"> instead.
    r'<nav aria-label="[^"]*">\s*<ol class="breadcrumb">.*?</nav>',
    re.DOTALL,
)
FOOTER_RE = re.compile(r'<footer[^>]*>.*?</footer>', re.DOTALL)
SKIP_LINK_RE = re.compile(r'<a href="#main-content" class="skip-to-content">.*?</a>')
BACK_TO_TOP_RE = re.compile(r'<button id="back-to-top".*?</button>', re.DOTALL)
# Capture EVERYTHING from the "Main application entry point" comment up to
# (but not including) the closing `</body>` tag. This must include both:
#
#   1. The `<script type="module" src="/src/browser/main.ts">` entry tag, and
#   2. The follow-up `<script>(function(){ inject(...) })()</script>` bootstrap
#      that imperatively loads `/js/lib/mermaid-init.mjs`, `/js/back-to-top.js`
#      and `/js/theme-toggle.js` (Vite must NOT bundle these, which is why
#      they're injected at runtime rather than referenced as `<script src=…>`).
#
# A previous regex (`(<!-- Main application entry point -->.*?</script>\s*)+`)
# matched only the first `<script>` block, so the 9 × 14 = 126 generated
# dashboard HTML pages never shipped the bootstrap — the theme-toggle button
# rendered but had no click handler, and back-to-top was inert. Now the regex
# captures all sibling `<script>` blocks (and any comments between them) by
# anchoring on the closing `</body>` boundary instead of counting them.
TAIL_SCRIPTS_RE = re.compile(
    r'<!-- Main application entry point -->.*?(?=\s*</body>)', re.DOTALL,
)


def extract_chrome(html: str) -> Chrome:
    head = HEAD_RE.search(html)
    body_open = BODY_OPEN_RE.search(html)
    header = HEADER_RE.search(html)
    breadcrumb = BREADCRUMB_RE.search(html)
    footer = FOOTER_RE.search(html)
    skip = SKIP_LINK_RE.search(html)
    btt = BACK_TO_TOP_RE.search(html)
    tail = TAIL_SCRIPTS_RE.search(html)
    if not (head and body_open and header and breadcrumb and footer):
        raise RuntimeError('Could not extract chrome from source index')
    return Chrome(
        head_open=head.group(0).rsplit('</head>', 1)[0],   # drop closing tag
        body_open=body_open.group(0),
        skip_link=skip.group(0) if skip else '<a href="#main-content" class="skip-to-content">Skip to main content</a>',
        header_html=header.group(0),
        breadcrumb_html=breadcrumb.group(0),
        footer_html=footer.group(0),
        back_to_top=btt.group(0) if btt else '',
        tail_scripts=tail.group(0) if tail else '',
    )


# ────────────────────────────────────────────────────────────────────────────
# Per-language SEO meta from existing index file
# ────────────────────────────────────────────────────────────────────────────

@dataclass
class IndexMeta:
    title: str           # current <title>
    description: str     # current <meta name="description"> content
    keywords: str        # current <meta name="keywords"> content
    site_name: str       # og:site_name (always "Riksdagsmonitor")


def extract_meta(html: str) -> IndexMeta:
    def _content(name: str, *, attr: str = 'name') -> str:
        m = re.search(
            r'<meta\s+' + attr + r'="' + re.escape(name) + r'"\s+content="([^"]*)"',
            html,
        )
        return m.group(1) if m else ''

    title_m = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
    return IndexMeta(
        title=title_m.group(1).strip() if title_m else 'Riksdagsmonitor',
        description=_content('description'),
        keywords=_content('keywords'),
        site_name=_content('og:site_name', attr='property') or 'Riksdagsmonitor',
    )


# ────────────────────────────────────────────────────────────────────────────
# Build a single dashboard page
# ────────────────────────────────────────────────────────────────────────────

def build_dashboard_page(
    *, lang: str, dashboard: Dashboard, section_html: str,
    chrome: Chrome, meta: IndexMeta, l10n: L10n,
    other_dashboards_h2: Dict[str, str],
) -> str:
    """Assemble the full HTML of `dashboards/<slug>[_<lang>].html`."""
    hreflang_code = HREFLANG[lang]
    is_rtl = lang in RTL_LANGS
    dir_attr = 'rtl' if is_rtl else 'ltr'
    file_basename = (
        f'{dashboard.slug}.html' if lang == 'en'
        else f'{dashboard.slug}_{lang}.html'
    )
    canonical_url = f'https://riksdagsmonitor.com/dashboards/{file_basename}'

    # Localised page title & description, derived from the section content.
    section_h2 = first_h2_text(section_html) or dashboard.slug
    section_p = first_p_text(section_html)
    page_title = f'{section_h2} | {meta.site_name}'
    page_description = (section_p or section_h2)[:300]

    # Rebuild head: drop the original <head> body since meta varies and
    # redo it from scratch with dashboard-specific values, then append the
    # invariant resource links extracted from the chrome head.
    fonts_block = _extract_fonts_block(chrome.head_open)
    favicons_block = _extract_favicons_block(chrome.head_open)
    csp_block = _extract_csp_block(chrome.head_open)
    theme_init_block = _extract_theme_init_block(chrome.head_open)

    # hreflang chain across all 14 langs for THIS dashboard
    hreflang_links = '\n'.join(
        f'<link rel="alternate" hreflang="{HREFLANG[l]}" '
        f'href="https://riksdagsmonitor.com/dashboards/'
        f'{dashboard.slug if l == "en" else dashboard.slug + "_" + l}.html">'
        for l in LANGS
    )
    hreflang_links += (
        '\n<link rel="alternate" hreflang="x-default" '
        f'href="https://riksdagsmonitor.com/dashboards/{dashboard.slug}.html">'
    )

    # Schema.org JSON-LD: WebPage + BreadcrumbList + Dataset reference
    jsonld = f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "WebPage",
      "@id": "{canonical_url}#webpage",
      "name": "{_json_safe(page_title)}",
      "description": "{_json_safe(page_description)}",
      "url": "{canonical_url}",
      "inLanguage": "{hreflang_code}",
      "isPartOf": {{
        "@type": "WebSite",
        "name": "Riksdagsmonitor",
        "url": "https://riksdagsmonitor.com"
      }},
      "about": [
        {{ "@type": "Thing", "name": "Swedish Riksdag" }},
        {{ "@type": "Thing", "name": "Political Intelligence" }},
        {{ "@type": "Thing", "name": "{_json_safe(section_h2)}" }}
      ],
      "publisher": {{
        "@type": "Organization",
        "name": "Hack23 AB",
        "url": "https://www.hack23.com",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://riksdagsmonitor.com/images/android-chrome-512x512.png"
        }}
      }},
      "breadcrumb": {{ "@id": "{canonical_url}#breadcrumb" }}
    }},
    {{
      "@type": "BreadcrumbList",
      "@id": "{canonical_url}#breadcrumb",
      "itemListElement": [
        {{ "@type": "ListItem", "position": 1, "name": "{_json_safe(l10n.home_label)}", "item": "https://riksdagsmonitor.com/" }},
        {{ "@type": "ListItem", "position": 2, "name": "{_json_safe(l10n.dashboards_label)}", "item": "https://riksdagsmonitor.com/dashboard/index.html" }},
        {{ "@type": "ListItem", "position": 3, "name": "{_json_safe(section_h2)}", "item": "{canonical_url}" }}
      ]
    }},
    {{
      "@type": "Dataset",
      "name": "{_json_safe(section_h2)}",
      "description": "{_json_safe(page_description)}",
      "creator": {{ "@type": "Organization", "name": "Citizen Intelligence Agency" }},
      "publisher": {{ "@type": "Organization", "name": "Hack23 AB" }},
      "license": "https://www.apache.org/licenses/LICENSE-2.0",
      "isAccessibleForFree": true,
      "keywords": "{_json_safe((dashboard.keywords_en if lang == 'en' else meta.keywords) + ', Swedish Riksdag, OSINT, parliament')}"
    }}
  ]
}}
</script>'''

    # Rewrite paths in chrome (header, footer, breadcrumb) so they resolve
    # from /dashboards/.  Header lang-switcher links also need to point at
    # this same dashboard slug per language.
    header_html = rewrite_paths_for_subdir(chrome.header_html)
    header_html = _rewrite_lang_switcher_for_dashboard(
        header_html, dashboard.slug, current_lang=lang,
    )
    footer_html = rewrite_paths_for_subdir(chrome.footer_html)
    footer_html = _rewrite_lang_switcher_for_dashboard(
        footer_html, dashboard.slug, current_lang=lang,
    )

    # Custom breadcrumb for this dashboard page (Home → Dashboards → <name>)
    breadcrumb_home_href = '../index.html' if lang == 'en' else f'../index_{lang}.html'
    breadcrumb_hub_href = (
        '../dashboard/index.html' if lang == 'en'
        else f'../dashboard/index_{lang}.html'
    )
    breadcrumb_html = f'''<nav aria-label="Breadcrumb">
<ol class="breadcrumb">
<li class="breadcrumb-item">
<a href="{breadcrumb_home_href}">{_html_safe(l10n.home_label)}</a>
</li>
<li class="breadcrumb-item">
<a href="{breadcrumb_hub_href}">{_html_safe(l10n.dashboards_label)}</a>
</li>
<li class="breadcrumb-item" aria-current="page">
{_html_safe(section_h2)}
</li>
</ol>
</nav>'''

    # "Related dashboards" tile grid at bottom — links to the other 8.
    related_tiles = '\n'.join(
        _related_card(d, lang, other_dashboards_h2.get(d.section_id, d.slug))
        for d in DASHBOARDS if d.section_id != dashboard.section_id
    )

    # Tail scripts — same as index, paths absolute so no rewrite needed
    tail_scripts = chrome.tail_scripts.replace(
        'src="/src/browser/main.ts"', 'src="/src/browser/main.ts"',
    )

    return f'''<!DOCTYPE html>
<html lang="{hreflang_code}" dir="{dir_attr}">
<head>
<title>{_html_safe(page_title)}</title>
<meta charset="UTF-8">
{csp_block}
{theme_init_block}
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../styles.css">
<link rel="canonical" href="{canonical_url}">
<link rel="manifest" href="../site.webmanifest">
<meta name="description" content="{_html_safe(page_description)}">
<meta name="keywords" content="{_html_safe((dashboard.keywords_en + ', ' + meta.keywords) if lang == 'en' else meta.keywords)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta name="author" content="James Pether Sörling, CISSP, CISM">
<meta name="application-name" content="Riksdagsmonitor">
<meta name="theme-color" content="#0a0e27">
<meta name="color-scheme" content="dark light">

<!-- hreflang chain across all 14 languages -->
{hreflang_links}

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical_url}">
<meta property="og:site_name" content="{_html_safe(meta.site_name)}">
<meta property="og:title" content="{_html_safe(page_title)}">
<meta property="og:description" content="{_html_safe(page_description)}">
<meta property="og:image" content="https://riksdagsmonitor.com/images/og-image.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{_html_safe(page_title)}">
<meta property="og:locale" content="{_og_locale(lang)}">
{_og_locale_alternates_block(lang)}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{_html_safe(page_title)}">
<meta name="twitter:description" content="{_html_safe(page_description)}">
<meta name="twitter:image" content="https://riksdagsmonitor.com/images/og-image.webp">
<meta name="twitter:image:alt" content="{_html_safe(page_title)}">
<meta name="twitter:site" content="@riksdagsmonitor">
<meta name="twitter:creator" content="@jamessorling">

{favicons_block}
{fonts_block}

{jsonld}
</head>
<body class="rm-dashboard-page rm-dashboard-{dashboard.slug}">
{chrome.skip_link}
{breadcrumb_html}

{header_html}

<main id="main-content" role="main">
<nav class="dashboard-page-back" aria-label="{_html_safe(l10n.back_to_home)}">
<a href="{breadcrumb_home_href}" class="back-link">{_html_safe(l10n.back_to_home)}</a>
</nav>

{section_html}

<aside class="dashboard-related" aria-labelledby="related-dashboards-heading">
<h2 id="related-dashboards-heading">{dashboard.emoji} {_html_safe(l10n.related_heading)}</h2>
<div class="dashboard-tile-grid">
{related_tiles}
</div>
</aside>
</main>

{footer_html}

{chrome.back_to_top}

{tail_scripts}
</body>
</html>
'''


def _related_card(d: Dashboard, lang: str, label: str) -> str:
    href = (
        f'{d.slug}.html' if lang == 'en'
        else f'{d.slug}_{lang}.html'
    )
    return (
        f'<a href="{href}" class="dashboard-tile" '
        f'data-rm-dashboard-slug="{d.slug}">'
        f'<span class="dashboard-tile-icon" aria-hidden="true">{d.emoji}</span>'
        f'<span class="dashboard-tile-label">{_html_safe(label)}</span>'
        '</a>'
    )


# ────────────────────────────────────────────────────────────────────────────
# Hub markup that replaces the 9 sections inside index_<lang>.html
# ────────────────────────────────────────────────────────────────────────────

def hub_markup(*, lang: str, l10n: L10n,
               translated_h2: Dict[str, str]) -> str:
    """Return the new <section> that replaces the 9 dashboard sections in index."""
    cards = '\n'.join(
        _hub_card(d, lang, translated_h2.get(d.section_id, d.slug), l10n)
        for d in DASHBOARDS
    )
    return f'''<section id="political-intelligence-dashboards" class="dashboard-hub" aria-labelledby="dashboard-hub-heading">
<h2 id="dashboard-hub-heading">📊 {_html_safe(l10n.hub_heading)}</h2>
<p class="dashboard-hub-intro">{_html_safe(l10n.hub_intro)}</p>
<div class="dashboard-tile-grid dashboard-tile-grid--hub">
{cards}
</div>
</section>'''


def _hub_card(d: Dashboard, lang: str, label: str, l10n: L10n) -> str:
    href = (
        f'dashboards/{d.slug}.html' if lang == 'en'
        else f'dashboards/{d.slug}_{lang}.html'
    )
    return (
        f'<a href="{href}" class="dashboard-tile dashboard-tile--hub" '
        f'data-rm-dashboard-slug="{d.slug}">'
        f'<span class="dashboard-tile-icon" aria-hidden="true">{d.emoji}</span>'
        '<span class="dashboard-tile-body">'
        f'<span class="dashboard-tile-label">{_html_safe(label)}</span>'
        f'<span class="dashboard-tile-cta" aria-hidden="true">{_html_safe(l10n.open_label)}</span>'
        '</span>'
        '</a>'
    )


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

def _html_safe(s: str) -> str:
    return (
        s.replace('&', '&amp;')
         .replace('<', '&lt;')
         .replace('>', '&gt;')
         .replace('"', '&quot;')
    )


def _json_safe(s: str) -> str:
    return s.replace('\\', '\\\\').replace('"', '\\"')


def _og_locale(lang: str) -> str:
    return {
        'en': 'en_US', 'sv': 'sv_SE', 'da': 'da_DK', 'no': 'nb_NO',
        'fi': 'fi_FI', 'de': 'de_DE', 'fr': 'fr_FR', 'es': 'es_ES',
        'nl': 'nl_NL', 'ar': 'ar_SA', 'he': 'he_IL', 'ja': 'ja_JP',
        'ko': 'ko_KR', 'zh': 'zh_CN',
    }[lang]


def _og_locale_alternates_block(lang: str) -> str:
    """Emit `og:locale:alternate` tags for the other 13 hreflang siblings.

    Open Graph requires `og:locale` for the page itself plus one
    `og:locale:alternate` per sibling language so Facebook / LinkedIn can
    pick the best-fit preview at share time. Dashboards previously
    shipped only the primary `og:locale` — search engines collapsed all
    14 hreflang siblings into near-identical OG previews.
    """
    others = [l for l in LANGS if l != lang]
    return '\n'.join(
        f'<meta property="og:locale:alternate" content="{_og_locale(l)}">'
        for l in others
    )


def _extract_csp_block(head_html: str) -> str:
    m = re.search(r'<meta http-equiv="Content-Security-Policy"[^>]*>', head_html)
    return m.group(0) if m else ''


def _extract_theme_init_block(head_html: str) -> str:
    m = re.search(r'<script>\(function\(\){var key=\'riksdagsmonitor-theme\';.*?}\(\)\);</script>', head_html, re.DOTALL)
    return m.group(0) if m else ''


def _extract_favicons_block(head_html: str) -> str:
    """Return the favicon <link> set.  Excludes `rel="manifest"` because we
    emit a relative-path manifest link explicitly above this block.
    Icon hrefs already start with `/images/` (site-root absolute) so they
    work unchanged from the dashboards/ subdirectory.
    """
    lines = re.findall(
        r'<link\b[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>', head_html,
    )
    return '\n'.join(lines)


def _extract_fonts_block(head_html: str) -> str:
    parts: List[str] = []
    for pat in [
        r'<link rel="dns-prefetch"[^>]*>',
        r'<link rel="preconnect"[^>]*>',
        r'<link[^>]*fonts\.googleapis[^>]*>',
        r'<noscript><link[^>]*fonts\.googleapis[^>]*></noscript>',
    ]:
        parts.extend(re.findall(pat, head_html))
    return '\n'.join(parts)


# Lang-switcher rewriter for dashboard pages.  In each <a href="../index_xx.html"
# lang="xx"> entry we want to redirect to the same-slug dashboard in that
# language (../dashboards/<slug>_<xx>.html) and update aria-current/active
# to match the current dashboard page's language.
def _rewrite_lang_switcher_for_dashboard(
    html: str, slug: str, *, current_lang: str,
) -> str:
    def repl(match: re.Match[str]) -> str:
        lang_code = match.group(1)
        if lang_code == 'en':
            new_href = f'{slug}.html'
        else:
            new_href = f'{slug}_{lang_code}.html'
        is_current = (lang_code == current_lang)
        active = ' aria-current="page" class="active"' if is_current else ''
        # We only have href + lang in the captured "tail"; rebuild it from the
        # match to keep the rest of the attributes pristine but strip stale
        # active/aria-current from non-current items.
        tail = match.group(2)
        # remove any existing aria-current and active class
        tail = re.sub(r'\s+aria-current="page"', '', tail)
        tail = re.sub(r'\s+class="active"', '', tail)
        return f'href="../dashboards/{new_href}" lang="{lang_code}" hreflang="{HREFLANG[lang_code]}"{tail}{active}'

    # Match: href="../index_<xx>.html" lang="<xx>" hreflang="..." [other attrs ...]
    # Keep the tail of attributes intact.
    pattern = re.compile(
        r'href="\.\./index(?:_([a-z]+))?\.html"\s+lang="[a-z]+"\s+hreflang="[a-z]+"((?:\s+[a-z-]+="[^"]*")*)'
    )

    def outer_repl(m: re.Match[str]) -> str:
        lang_code = m.group(1) or 'en'
        if lang_code == 'en':
            new_href = f'{slug}.html'
        else:
            new_href = f'{slug}_{lang_code}.html'
        is_current = (lang_code == current_lang)
        tail = m.group(2)
        tail = re.sub(r'\s+aria-current="page"', '', tail)
        tail = re.sub(r'\s+class="active"', '', tail)
        if is_current:
            tail += ' aria-current="page" class="active"'
        return (
            f'href="../dashboards/{new_href}" lang="{lang_code}" '
            f'hreflang="{HREFLANG[lang_code]}"{tail}'
        )

    return pattern.sub(outer_repl, html)


# ────────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────────

def main() -> int:
    print('🏗️  build-dashboard-pages.py — slicing index*.html → dashboards/*.html\n')

    ensure_snapshot()
    DASHBOARDS_DIR.mkdir(exist_ok=True)

    # Pass 1: extract all sections per language so we know each dashboard's
    # translated <h2> for use in tile labels & related-dashboards lists.
    section_cache: Dict[Tuple[str, str], str] = {}
    h2_cache: Dict[Tuple[str, str], str] = {}
    chromes: Dict[str, Chrome] = {}
    metas: Dict[str, IndexMeta] = {}

    for lang in LANGS:
        snap = snapshot_path(lang)
        if not snap.exists():
            print(f'⚠️  missing snapshot for {lang}: {snap}')
            continue
        src_html = snap.read_text(encoding='utf-8')
        chromes[lang] = extract_chrome(src_html)
        metas[lang] = extract_meta(src_html)
        for d in DASHBOARDS:
            sect = extract_section(src_html, d.section_id)
            if sect is None:
                print(f'⚠️  {lang}: section #{d.section_id} not found')
                continue
            section_cache[(lang, d.section_id)] = sect
            h2_cache[(lang, d.section_id)] = first_h2_text(sect)

    # Pass 2: write each dashboard page per language
    written = 0
    for lang in LANGS:
        if lang not in chromes:
            continue
        l10n = L10N[lang]
        meta = metas[lang]
        chrome = chromes[lang]
        # build per-language map of section_id -> translated h2 (used by
        # related-dashboards list on each page)
        translated_h2 = {
            d.section_id: h2_cache.get((lang, d.section_id), d.slug)
            for d in DASHBOARDS
        }
        for d in DASHBOARDS:
            sect = section_cache.get((lang, d.section_id))
            if not sect:
                continue
            html = build_dashboard_page(
                lang=lang, dashboard=d, section_html=sect,
                chrome=chrome, meta=meta, l10n=l10n,
                other_dashboards_h2=translated_h2,
            )
            out_name = (
                f'{d.slug}.html' if lang == 'en' else f'{d.slug}_{lang}.html'
            )
            out_path = DASHBOARDS_DIR / out_name
            out_path.write_text(html, encoding='utf-8')
            written += 1

    print(f'\n✅ wrote {written} dashboard pages → {DASHBOARDS_DIR.relative_to(ROOT)}/')

    # Pass 3: rewrite each index_<lang>.html removing the 9 sections and
    # inserting the localised hub.
    rewritten = 0
    for lang in LANGS:
        snap = snapshot_path(lang)
        if not snap.exists():
            continue
        l10n = L10N[lang]
        translated_h2 = {
            d.section_id: h2_cache.get((lang, d.section_id), d.slug)
            for d in DASHBOARDS
        }
        src_html = snap.read_text(encoding='utf-8')
        slimmed = remove_sections(
            src_html, [d.section_id for d in DASHBOARDS],
        )
        hub = hub_markup(lang=lang, l10n=l10n, translated_h2=translated_h2)
        # Inject hub immediately after </section> of #coalition-status,
        # which is the only section we keep in the upper area of <main>.
        # Robust across all 14 languages because we anchor on a stable id.
        coalition_close_re = re.compile(
            r'(<section id="coalition-status">.*?</section>)',
            re.DOTALL,
        )
        injected, n = coalition_close_re.subn(
            lambda m: m.group(1) + '\n\n' + hub + '\n',
            slimmed, count=1,
        )
        # safety net: if coalition-status is missing for some reason, append before </main>
        if n == 0:
            injected = slimmed.replace('</main>', hub + '\n</main>', 1)
        index_path(lang).write_text(injected, encoding='utf-8')
        rewritten += 1

    print(f'✅ rewrote {rewritten} index files (slimmed + hub injected)\n')

    # Pass 4: inject "Specialised political-intelligence dashboards" tile
    # section into the top of each dashboard/index_<lang>.html.  Idempotent:
    # if the marker already exists we replace it; otherwise we insert
    # immediately after the `<main class="cia-dashboard"` opening tag so
    # the tiles are the first thing the user sees on the hub page.
    DASHBOARD_HUB_MARKER = 'rm-specialised-dashboards'
    dashboard_dir = ROOT / 'dashboard'
    hub_inject = 0
    for lang in LANGS:
        f = dashboard_dir / ('index.html' if lang == 'en' else f'index_{lang}.html')
        if not f.exists():
            continue
        l10n = L10N[lang]
        # tiles point to ../dashboards/<slug>[_<lang>].html (sibling dir)
        cards = '\n'.join(
            _hub_card_for_dashboard_hub(d, lang, label, l10n)
            for d, label in [
                (d, h2_cache.get((lang, d.section_id), d.slug))
                for d in DASHBOARDS
            ]
        )
        new_section = (
            f'<section id="{DASHBOARD_HUB_MARKER}" '
            'class="specialised-dashboards" '
            'aria-labelledby="specialised-dashboards-heading">\n'
            f'<h2 id="specialised-dashboards-heading">📊 {_html_safe(l10n.hub_heading)}</h2>\n'
            f'<p class="specialised-dashboards-intro">{_html_safe(l10n.hub_intro)}</p>\n'
            '<div class="dashboard-tile-grid dashboard-tile-grid--hub">\n'
            f'{cards}\n'
            '</div>\n'
            '</section>'
        )
        html = f.read_text(encoding='utf-8')
        # Remove any stale prior copy
        existing = re.compile(
            r'<section id="' + DASHBOARD_HUB_MARKER + r'".*?</section>\s*',
            re.DOTALL,
        )
        html = existing.sub('', html)
        # Insert immediately after the cia-dashboard <main> opening
        anchor = re.search(r'<main class="cia-dashboard"[^>]*>\s*', html)
        if anchor:
            insert_at = anchor.end()
            html = html[:insert_at] + new_section + '\n\n' + html[insert_at:]
            f.write_text(html, encoding='utf-8')
            hub_inject += 1
    print(f'✅ patched {hub_inject} dashboard/index files (hub tiles inserted)\n')

    return 0


def _hub_card_for_dashboard_hub(d: Dashboard, lang: str, label: str, l10n: L10n) -> str:
    """Tile card pointing from /dashboard/ → /dashboards/<slug>[_<lang>].html."""
    href = (
        f'../dashboards/{d.slug}.html' if lang == 'en'
        else f'../dashboards/{d.slug}_{lang}.html'
    )
    return (
        f'<a href="{href}" class="dashboard-tile dashboard-tile--hub" '
        f'data-rm-dashboard-slug="{d.slug}">'
        f'<span class="dashboard-tile-icon" aria-hidden="true">{d.emoji}</span>'
        '<span class="dashboard-tile-body">'
        f'<span class="dashboard-tile-label">{_html_safe(label)}</span>'
        f'<span class="dashboard-tile-cta" aria-hidden="true">{_html_safe(l10n.open_label)}</span>'
        '</span>'
        '</a>'
    )


if __name__ == '__main__':
    raise SystemExit(main())
