#!/usr/bin/env python3
"""
Update news index files and sitemap.xml with current article metadata.

This script:
1. Extracts metadata from all news articles (titles, descriptions, dates)
2. Updates all 14 language-specific index files with current metadata
3. Generates complete sitemap.xml including docs/api and docs/coverage HTML files
"""

import re
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
import html
from collections import defaultdict

# Language codes and their properties
LANGUAGES = {
    'en': {'name': 'English', 'priority': 1.0, 'hreflang': 'en', 'title_suffix': 'News - Riksdagsmonitor', 'back_text': '← Back to News'},
    'sv': {'name': 'Swedish', 'priority': 0.9, 'hreflang': 'sv', 'title_suffix': 'Nyheter - Riksdagsmonitor', 'back_text': '← Tillbaka till nyheter'},
    'da': {'name': 'Danish', 'priority': 0.7, 'hreflang': 'da', 'title_suffix': 'Nyheder - Riksdagsmonitor', 'back_text': '← Tilbage til nyheder'},
    'no': {'name': 'Norwegian', 'priority': 0.7, 'hreflang': 'no', 'title_suffix': 'Nyheter - Riksdagsmonitor', 'back_text': '← Tilbake til nyheter'},
    'fi': {'name': 'Finnish', 'priority': 0.7, 'hreflang': 'fi', 'title_suffix': 'Uutiset - Riksdagsmonitor', 'back_text': '← Takaisin uutisiin'},
    'de': {'name': 'German', 'priority': 0.6, 'hreflang': 'de', 'title_suffix': 'Nachrichten - Riksdagsmonitor', 'back_text': '← Zurück zu Nachrichten'},
    'fr': {'name': 'French', 'priority': 0.6, 'hreflang': 'fr', 'title_suffix': 'Actualités - Riksdagsmonitor', 'back_text': '← Retour aux actualités'},
    'es': {'name': 'Spanish', 'priority': 0.6, 'hreflang': 'es', 'title_suffix': 'Noticias - Riksdagsmonitor', 'back_text': '← Volver a noticias'},
    'nl': {'name': 'Dutch', 'priority': 0.6, 'hreflang': 'nl', 'title_suffix': 'Nieuws - Riksdagsmonitor', 'back_text': '← Terug naar nieuws'},
    'ar': {'name': 'Arabic', 'priority': 0.6, 'hreflang': 'ar', 'title_suffix': 'أخبار - Riksdagsmonitor', 'back_text': '→ العودة إلى الأخبار'},
    'he': {'name': 'Hebrew', 'priority': 0.6, 'hreflang': 'he', 'title_suffix': 'חדשות - Riksdagsmonitor', 'back_text': '→ חזרה לחדשות'},
    'ja': {'name': 'Japanese', 'priority': 0.6, 'hreflang': 'ja', 'title_suffix': 'ニュース - Riksdagsmonitor', 'back_text': '← ニュースに戻る'},
    'ko': {'name': 'Korean', 'priority': 0.6, 'hreflang': 'ko', 'title_suffix': '뉴스 - Riksdagsmonitor', 'back_text': '← 뉴스로 돌아가기'},
    'zh': {'name': 'Chinese', 'priority': 0.6, 'hreflang': 'zh', 'title_suffix': '新闻 - Riksdagsmonitor', 'back_text': '← 返回新闻'}
}


class ArticleMetadata:
    """Extract and store article metadata."""
    
    def __init__(self, filepath: Path):
        self.filepath = filepath
        self.filename = filepath.name
        self.title = ""
        self.description = ""
        self.date = ""
        self.lang = self._extract_lang()
        self._extract_metadata()
    
    def _extract_lang(self) -> str:
        """Extract language code from filename."""
        match = re.search(r'-([a-z]{2})\.html$', self.filename)
        return match.group(1) if match else 'en'
    
    def _extract_metadata(self):
        """Extract title, description, and date from HTML file."""
        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract title
            title_match = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
            if title_match:
                self.title = html.unescape(title_match.group(1).strip())
            
            # Extract description
            desc_match = re.search(r'<meta name="description" content="(.*?)"', content, re.DOTALL)
            if desc_match:
                self.description = html.unescape(desc_match.group(1).strip())
            
            # Extract date from filename (YYYY-MM-DD format)
            date_match = re.search(r'(\d{4}-\d{2}-\d{2})', self.filename)
            if date_match:
                self.date = date_match.group(1)
        
        except Exception as e:
            print(f"Error reading {self.filepath}: {e}")
    
    def to_schema_item(self, position: int) -> dict:
        """Convert to Schema.org ListItem format."""
        return {
            'position': position,
            'headline': self.title,
            'url': f'https://riksdagsmonitor.com/news/{self.filename}',
            'datePublished': self.date,
            'description': self.description[:150] if len(self.description) > 150 else self.description,
            'lang': self.lang
        }


def extract_all_articles() -> Dict[str, List[ArticleMetadata]]:
    """Extract metadata from all news articles, grouped by language."""
    news_dir = Path('news')
    articles_by_lang = defaultdict(list)
    
    # Get all article HTML files (excluding index files)
    article_files = [f for f in news_dir.glob('*.html') if not f.name.startswith('index')]
    
    print(f"Found {len(article_files)} article files")
    
    for filepath in article_files:
        article = ArticleMetadata(filepath)
        if article.title:  # Only include if we successfully extracted metadata
            articles_by_lang[article.lang].append(article)
    
    # Sort articles by date (newest first) within each language
    for lang in articles_by_lang:
        articles_by_lang[lang].sort(key=lambda a: a.date, reverse=True)
    
    return articles_by_lang


def generate_index_html(lang: str, articles: List[ArticleMetadata]) -> str:
    """Generate complete index.html for a specific language."""
    lang_info = LANGUAGES.get(lang, LANGUAGES['en'])
    index_file = 'index.html' if lang == 'en' else f'index_{lang}.html'
    
    # Generate hreflang links
    hreflang_links = []
    for l, info in LANGUAGES.items():
        link_file = 'index.html' if l == 'en' else f'index_{l}.html'
        hreflang_links.append(f'  <link rel="alternate" hreflang="{info["hreflang"]}" href="https://riksdagsmonitor.com/news/{link_file}">')
    hreflang_links.append(f'  <link rel="alternate" hreflang="x-default" href="https://riksdagsmonitor.com/news/index.html">')
    
    # Generate Schema.org ItemList
    schema_items = []
    for i, article in enumerate(articles, 1):
        desc_escaped = html.escape(article.description[:150] if len(article.description) > 150 else article.description)
        schema_items.append(f'''      {{
        "@type": "ListItem",
        "position": {i},
        "item": {{
          "@type": "NewsArticle",
          "headline": "{html.escape(article.title)}",
          "url": "https://riksdagsmonitor.com/news/{article.filename}",
          "datePublished": "{article.date}",
          "description": "{desc_escaped}",
          "inLanguage": "{article.lang}",
          "author": {{
            "@type": "Organization",
            "name": "Riksdagsmonitor"
          }},
          "publisher": {{
            "@type": "Organization",
            "name": "Hack23 AB",
            "logo": {{
              "@type": "ImageObject",
              "url": "https://hack23.com/cia-icon-140.webp"
            }}
          }},
          "articleSection": "News",
          "about": {{
            "@type": "GovernmentOrganization",
            "name": "Riksdag",
            "alternateName": "Swedish Parliament",
            "url": "https://www.riksdagen.se/"
          }}
        }}
      }}''')
    
    # Generate article list HTML
    article_list_html = []
    for article in articles:
        desc_truncated = article.description[:200] + '...' if len(article.description) > 200 else article.description
        article_list_html.append(f'''        <article class="news-item">
          <h2><a href="{article.filename}">{html.escape(article.title)}</a></h2>
          <p class="date">{article.date}</p>
          <p class="description">{html.escape(desc_truncated)}</p>
        </article>''')
    
    # Localized page descriptions
    page_descriptions = {
        'en': "Latest news and analysis from Sweden's Riksdag. The Economist-style political journalism covering parliament, government, and agencies with systematic transparency.",
        'sv': "Senaste nyheterna och analyser från Sveriges Riksdag. Politisk journalistik i The Economist-stil som täcker riksdag, regering och myndigheter med systematisk transparens.",
        'da': "Seneste nyheder og analyser fra Sveriges Riksdag. Politisk journalistik i The Economist-stil, der dækker parlament, regering og agenturer med systematisk gennemsigtighed.",
        'no': "Siste nyheter og analyser fra Sveriges Riksdag. Politisk journalistikk i The Economist-stil som dekker parlament, regjering og etater med systematisk åpenhet.",
        'fi': "Uusimmat uutiset ja analyysit Ruotsin valtiopäivistä. The Economist-tyylinen poliittinen journalismi, joka kattaa parlamentin, hallituksen ja virastot järjestelmällisellä läpinäkyvyydellä.",
        'de': "Neueste Nachrichten und Analysen aus Schwedens Riksdag. Politischer Journalismus im Economist-Stil über Parlament, Regierung und Behörden mit systematischer Transparenz.",
        'fr': "Dernières actualités et analyses du Riksdag suédois. Journalisme politique style The Economist couvrant le parlement, le gouvernement et les agences avec transparence systématique.",
        'es': "Últimas noticias y análisis del Riksdag de Suecia. Periodismo político estilo The Economist cubriendo parlamento, gobierno y agencias con transparencia sistemática.",
        'nl': "Laatste nieuws en analyses van Zwedens Riksdag. Politieke journalistiek in The Economist-stijl over parlement, regering en agentschappen met systematische transparantie.",
        'ar': "آخر الأخبار والتحليلات من البرلمان السويدي. صحافة سياسية بأسلوب The Economist تغطي البرلمان والحكومة والوكالات بشفافية منهجية.",
        'he': "חדשות ואנליזות אחרונות מהפרלמנט השוודי. עיתונות פוליטית בסגנון The Economist המכסה פרלמנט, ממשלה וסוכנויות עם שקיפות שיטתית.",
        'ja': "スウェーデン国会の最新ニュースと分析。議会、政府、機関を体系的な透明性でカバーするエコノミスト・スタイルの政治ジャーナリズム。",
        'ko': "스웨덴 국회의 최신 뉴스와 분석. 체계적인 투명성으로 의회, 정부, 기관을 다루는 이코노미스트 스타일의 정치 저널리즘.",
        'zh': "瑞典议会的最新新闻和分析。以《经济学人》风格的政治新闻报道议会、政府和机构，具有系统透明度。"
    }
    
    page_desc = page_descriptions.get(lang, page_descriptions['en'])
    
    html_content = f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{lang_info["title_suffix"]}</title>
  <meta name="description" content="{page_desc}">
  <meta name="keywords" content="riksdag news, swedish parliament, government bills, committee reports, propositions, motions, parliamentary votes, political analysis, Sweden Democrats, Social Democrats, Moderaterna, coalition politics, transparency, democracy">
  <meta name="author" content="James Pether Sörling, CISSP, CISM">
  <link rel="canonical" href="https://riksdagsmonitor.com/news/{index_file}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="{lang_info['title_suffix']}">
  <meta property="og:description" content="{page_desc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://riksdagsmonitor.com/news/{index_file}">
  <meta property="og:image" content="https://hack23.com/cia-icon-140.webp">
  <meta property="og:site_name" content="Riksdagsmonitor">
  <meta property="og:locale" content="{lang}_{'SE' if lang in ['sv', 'en'] else lang.upper()}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{lang_info['title_suffix']}">
  <meta name="twitter:description" content="{page_desc}">
  <meta name="twitter:image" content="https://hack23.com/cia-icon-140.webp">
  
  <!-- Hreflang -->
{chr(10).join(hreflang_links)}
  
  <!-- Schema.org ItemList structured data for article aggregation -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "{lang_info['title_suffix'].split(' - ')[0]}",
    "description": "{page_desc}",
    "numberOfItems": {len(articles)},
    "itemListElement": [
{(',' + chr(10)).join(schema_items)}
    ]
  }}
  </script>
  
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <header>
    <div class="container">
      <h1><a href="../index{'_' + lang if lang != 'en' else ''}.html">Riksdagsmonitor</a></h1>
      <p class="tagline">Transparency & Intelligence in Swedish Politics</p>
    </div>
  </header>
  
  <nav>
    <div class="container">
      <ul>
        <li><a href="../index{'_' + lang if lang != 'en' else ''}.html">Home</a></li>
        <li><a href="index{'_' + lang if lang != 'en' else ''}.html" class="active">News</a></li>
      </ul>
    </div>
  </nav>
  
  <main>
    <div class="container">
      <section class="news-list">
        <h1>{lang_info['title_suffix'].split(' - ')[0]}</h1>
        <p class="intro">{page_desc}</p>
        
{chr(10).join(article_list_html)}
      </section>
    </div>
  </main>
  
  <footer>
    <div class="container">
      <p>&copy; 2026 <a href="https://hack23.com">Hack23 AB</a>. All rights reserved.</p>
      <p>Data sources: <a href="https://data.riksdagen.se/">Riksdag Open Data</a> | <a href="https://www.regeringen.se/">Government of Sweden</a></p>
    </div>
  </footer>
</body>
</html>'''
    
    return html_content


def update_all_indexes(articles_by_lang: Dict[str, List[ArticleMetadata]]):
    """Update all language-specific index files."""
    news_dir = Path('news')
    updated_files = []
    
    for lang in LANGUAGES.keys():
        articles = articles_by_lang.get(lang, [])
        if not articles:
            print(f"Warning: No articles found for language '{lang}'")
            continue
        
        index_file = news_dir / ('index.html' if lang == 'en' else f'index_{lang}.html')
        html_content = generate_index_html(lang, articles)
        
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        updated_files.append(str(index_file))
        print(f"Updated {index_file} with {len(articles)} articles")
    
    return updated_files


def generate_sitemap():
    """Generate complete sitemap.xml including all HTML files."""
    print("\nGenerating sitemap.xml...")
    
    # Find all HTML files
    all_html_files = []
    
    # Add root index files
    for lang, info in LANGUAGES.items():
        filename = 'index.html' if lang == 'en' else f'index_{lang}.html'
        all_html_files.append(('root', filename, info['priority']))
    
    # Add news index files
    for lang, info in LANGUAGES.items():
        filename = 'index.html' if lang == 'en' else f'index_{lang}.html'
        all_html_files.append(('news', filename, info['priority'] * 0.9))
    
    # Add news articles
    news_dir = Path('news')
    article_files = [f for f in news_dir.glob('*.html') if not f.name.startswith('index')]
    for filepath in sorted(article_files, reverse=True):  # Newest first
        # Extract date to determine priority (newer = higher)
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', filepath.name)
        if date_match:
            date_str = date_match.group(1)
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            days_old = (datetime.now() - date_obj).days
            # Priority decreases with age: 0.8 for newest, down to 0.4 for old
            priority = max(0.4, 0.8 - (days_old / 365) * 0.4)
        else:
            priority = 0.5
        
        all_html_files.append(('news', filepath.name, priority))
    
    # Add docs/api HTML files
    docs_api_dir = Path('docs/api')
    if docs_api_dir.exists():
        for filepath in docs_api_dir.glob('**/*.html'):
            relative_path = filepath.relative_to('docs')
            all_html_files.append(('docs', str(relative_path), 0.5))
    
    # Add docs/coverage HTML files
    docs_coverage_dir = Path('docs/coverage')
    if docs_coverage_dir.exists():
        for filepath in docs_coverage_dir.glob('**/*.html'):
            relative_path = filepath.relative_to('docs')
            all_html_files.append(('docs', str(relative_path), 0.4))
    
    # Add docs/index.html if exists
    docs_index = Path('docs/index.html')
    if docs_index.exists():
        all_html_files.append(('docs', 'index.html', 0.7))
    
    # Generate XML
    now = datetime.utcnow().isoformat() + 'Z'
    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    xml_lines.append('        xmlns:xhtml="http://www.w3.org/1999/xhtml">')
    
    # Add main index with hreflang
    xml_lines.append('<url>')
    xml_lines.append('  <loc>https://riksdagsmonitor.com/index.html</loc>')
    xml_lines.append(f'  <lastmod>{now}</lastmod>')
    xml_lines.append('  <changefreq>daily</changefreq>')
    xml_lines.append('  <priority>1.0</priority>')
    for lang, info in LANGUAGES.items():
        filename = 'index.html' if lang == 'en' else f'index_{lang}.html'
        xml_lines.append(f'  <xhtml:link rel="alternate" hreflang="{info["hreflang"]}" href="https://riksdagsmonitor.com/{filename}"/>')
    xml_lines.append('</url>')
    
    # Add all other files
    for category, filename, priority in all_html_files:
        if category == 'root':
            url = f'https://riksdagsmonitor.com/{filename}'
        elif category == 'news':
            url = f'https://riksdagsmonitor.com/news/{filename}'
        elif category == 'docs':
            url = f'https://riksdagsmonitor.com/docs/{filename}'
        else:
            url = f'https://riksdagsmonitor.com/{filename}'
        
        xml_lines.append('<url>')
        xml_lines.append(f'  <loc>{url}</loc>')
        xml_lines.append(f'  <lastmod>{now}</lastmod>')
        
        # Set changefreq based on category
        if 'index' in filename:
            changefreq = 'daily'
        elif category == 'news':
            changefreq = 'weekly'
        else:
            changefreq = 'monthly'
        
        xml_lines.append(f'  <changefreq>{changefreq}</changefreq>')
        xml_lines.append(f'  <priority>{priority:.1f}</priority>')
        xml_lines.append('</url>')
    
    xml_lines.append('</urlset>')
    
    # Write sitemap
    sitemap_content = '\n'.join(xml_lines)
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(sitemap_content)
    
    print(f"Generated sitemap.xml with {len(all_html_files)} URLs")
    return len(all_html_files)


def main():
    """Main execution function."""
    print("=" * 80)
    print("UPDATE NEWS INDEXES AND SITEMAP")
    print("=" * 80)
    
    # Task 1: Extract article metadata and update indexes
    print("\n### Task 1: Updating news index files ###\n")
    articles_by_lang = extract_all_articles()
    
    print(f"\nExtracted metadata from articles:")
    for lang, articles in sorted(articles_by_lang.items()):
        print(f"  {lang}: {len(articles)} articles")
    
    print("\nUpdating index files...")
    updated_files = update_all_indexes(articles_by_lang)
    print(f"\nUpdated {len(updated_files)} index files")
    
    # Task 2: Generate complete sitemap
    print("\n### Task 2: Generating complete sitemap.xml ###\n")
    url_count = generate_sitemap()
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✓ Updated {len(updated_files)} news index files")
    print(f"✓ Generated sitemap.xml with {url_count} URLs")
    print("\nAll tasks completed successfully!")


if __name__ == '__main__':
    main()
