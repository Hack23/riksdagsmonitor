#!/usr/bin/env python3
"""
Committee Dashboard Multi-Language Update Script

DEPRECATED: As of PR #56, the committee dashboard is only in index.html (English).
The 13 translated language files do NOT include the dashboard section or scripts.

This script is DEPRECATED and should NOT be run without explicit confirmation.
If you need to add dashboard to all languages, use this as a reference but verify
the workflow first.

WARNING: This script uses brittle string replacements (exact <meta name="application-name">
match and raw </body> replacement) and will silently fail if HTML formatting differs.
Consider using stable insertion markers or an HTML parser for reliable insertions.

Usage: python3 update-all-languages.py --confirm-update-all
"""

import sys
from pathlib import Path

# Check for confirmation flag
if '--confirm-update-all' not in sys.argv:
    print("=" * 70)
    print("ERROR: This script is DEPRECATED")
    print("=" * 70)
    print()
    print("As of PR #56, the committee dashboard exists ONLY in index.html (English).")
    print("The 13 translated language files do NOT include dashboard sections.")
    print()
    print("This script will modify all 14 HTML files, which contradicts current workflow.")
    print()
    print("If you really want to run this script, use:")
    print("  python3 update-all-languages.py --confirm-update-all")
    print()
    print("Otherwise, manually update only the files you need.")
    print("=" * 70)
    sys.exit(1)

# Language-specific translations for the committee dashboard
TRANSLATIONS = {
    'en': {
        'title': '🏛️ Committee Performance & Network Analytics',
        'network_title': 'Committee Network Diagram',
        'network_desc': 'Interactive visualization of committee relationships and productivity. Drag nodes to explore connections.',
        'matrix_title': 'Productivity Matrix (2020-2026)',
        'matrix_desc': 'Heat map showing committee productivity scores over time. Hover over cells for detailed information.',
        'comparison_title': 'Committee Comparison',
        'comparison_desc': 'Compare productivity scores across all 15 committees.',
        'effectiveness_title': 'Decision Effectiveness',
        'effectiveness_desc': 'Track decision outcomes (approved, rejected, pending) over time.',
        'seasonal_title': 'Seasonal Activity Patterns',
        'seasonal_desc': 'Quarterly activity trends showing how committee work varies across the year.',
        'attribution': '📊 Data powered by',
        'updated': 'Updated:',
        'loading': 'Loading...'
    },
    'sv': {
        'title': '🏛️ Utskottsprestation & Nätverksanalys',
        'network_title': 'Utskottens nätverksdiagram',
        'network_desc': 'Interaktiv visualisering av utskottens relationer och produktivitet. Dra noder för att utforska kopplingar.',
        'matrix_title': 'Produktivitetsmatris (2020-2026)',
        'matrix_desc': 'Värmekarta som visar utskottens produktivitetspoäng över tid. Hovra över celler för detaljerad information.',
        'comparison_title': 'Utskottsjämförelse',
        'comparison_desc': 'Jämför produktivitetspoäng över alla 15 utskott.',
        'effectiveness_title': 'Beslutseffektivitet',
        'effectiveness_desc': 'Följ beslutsutfall (godkända, avvisade, väntande) över tid.',
        'seasonal_title': 'Säsongsmönster för aktivitet',
        'seasonal_desc': 'Kvartalsvisa aktivitetstrender som visar hur utskottsarbetet varierar under året.',
        'attribution': '📊 Data från',
        'updated': 'Uppdaterad:',
        'loading': 'Laddar...'
    },
    'da': {
        'title': '🏛️ Udvalgsydelse & Netværksanalyse',
        'network_title': 'Udvalgsnetværksdiagram',
        'network_desc': 'Interaktiv visualisering af udvalgsrelationer og produktivitet. Træk noder for at udforske forbindelser.',
        'matrix_title': 'Produktivitetsmatrix (2020-2026)',
        'matrix_desc': 'Varmekort, der viser udvalgs produktivitetsscorer over tid. Hold musen over celler for detaljerede oplysninger.',
        'comparison_title': 'Udvalgsammenligning',
        'comparison_desc': 'Sammenlign produktivitetsscorer på tværs af alle 15 udvalg.',
        'effectiveness_title': 'Beslutningseffektivitet',
        'effectiveness_desc': 'Spor beslutningsresultater (godkendt, afvist, afventende) over tid.',
        'seasonal_title': 'Sæsonmæssige aktivitetsmønstre',
        'seasonal_desc': 'Kvartalsvise aktivitetstendenser, der viser, hvordan udvalgsarbejdet varierer gennem året.',
        'attribution': '📊 Data fra',
        'updated': 'Opdateret:',
        'loading': 'Indlæser...'
    },
    'no': {
        'title': '🏛️ Komitéytelse & Nettverksanalyse',
        'network_title': 'Komitéens nettverksdiagram',
        'network_desc': 'Interaktiv visualisering av komitérelasjoner og produktivitet. Dra noder for å utforske forbindelser.',
        'matrix_title': 'Produktivitetsmatrise (2020-2026)',
        'matrix_desc': 'Varmekart som viser komitéens produktivitetspoeng over tid. Hold musepekeren over celler for detaljert informasjon.',
        'comparison_title': 'Komitésammenligning',
        'comparison_desc': 'Sammenlign produktivitetspoeng på tvers av alle 15 komiteer.',
        'effectiveness_title': 'Beslutningseffektivitet',
        'effectiveness_desc': 'Spor beslutningsresultater (godkjent, avvist, avventer) over tid.',
        'seasonal_title': 'Sesongmessige aktivitetsmønstre',
        'seasonal_desc': 'Kvartalsvise aktivitetstrender som viser hvordan komitéarbeidet varierer gjennom året.',
        'attribution': '📊 Data fra',
        'updated': 'Oppdatert:',
        'loading': 'Laster...'
    },
    'fi': {
        'title': '🏛️ Valiokuntien suorituskyky & Verkostoanalyysi',
        'network_title': 'Valiokuntien verkkokaavio',
        'network_desc': 'Interaktiivinen visualisointi valiokuntien suhteista ja tuottavuudesta. Vedä solmuja tutkiaksesi yhteyksiä.',
        'matrix_title': 'Tuottavuusmatriisi (2020-2026)',
        'matrix_desc': 'Lämpökartta, joka näyttää valiokuntien tuottavuuspisteet ajan mittaan. Vie hiiri solujen päälle saadaksesi yksityiskohtaista tietoa.',
        'comparison_title': 'Valiokuntien vertailu',
        'comparison_desc': 'Vertaile tuottavuuspisteitä kaikissa 15 valiokunnassa.',
        'effectiveness_title': 'Päätöksenteon tehokkuus',
        'effectiveness_desc': 'Seuraa päätöstuloksia (hyväksytty, hylätty, odottaa) ajan mittaan.',
        'seasonal_title': 'Kausittaiset toimintamallit',
        'seasonal_desc': 'Neljännesvuosittaiset toimintatrendit, jotka näyttävät, miten valiokuntien työ vaihtelee vuoden aikana.',
        'attribution': '📊 Data:',
        'updated': 'Päivitetty:',
        'loading': 'Ladataan...'
    },
    'de': {
        'title': '🏛️ Ausschussleistung & Netzwerkanalyse',
        'network_title': 'Ausschussnetzwerkdiagramm',
        'network_desc': 'Interaktive Visualisierung von Ausschussbeziehungen und Produktivität. Ziehen Sie Knoten, um Verbindungen zu erkunden.',
        'matrix_title': 'Produktivitätsmatrix (2020-2026)',
        'matrix_desc': 'Heatmap, die Ausschussproduktivitätswerte im Zeitverlauf zeigt. Bewegen Sie den Mauszeiger über Zellen für detaillierte Informationen.',
        'comparison_title': 'Ausschussvergleich',
        'comparison_desc': 'Vergleichen Sie Produktivitätswerte über alle 15 Ausschüsse hinweg.',
        'effectiveness_title': 'Entscheidungseffektivität',
        'effectiveness_desc': 'Verfolgen Sie Entscheidungsergebnisse (genehmigt, abgelehnt, ausstehend) im Zeitverlauf.',
        'seasonal_title': 'Saisonale Aktivitätsmuster',
        'seasonal_desc': 'Vierteljährliche Aktivitätstrends zeigen, wie sich die Ausschussarbeit im Laufe des Jahres verändert.',
        'attribution': '📊 Daten von',
        'updated': 'Aktualisiert:',
        'loading': 'Wird geladen...'
    },
    'fr': {
        'title': '🏛️ Performance des Comités & Analyse de Réseau',
        'network_title': 'Diagramme de réseau des comités',
        'network_desc': 'Visualisation interactive des relations et de la productivité des comités. Faites glisser les nœuds pour explorer les connexions.',
        'matrix_title': 'Matrice de productivité (2020-2026)',
        'matrix_desc': 'Carte thermique montrant les scores de productivité des comités au fil du temps. Survolez les cellules pour des informations détaillées.',
        'comparison_title': 'Comparaison des comités',
        'comparison_desc': 'Comparez les scores de productivité des 15 comités.',
        'effectiveness_title': 'Efficacité des décisions',
        'effectiveness_desc': 'Suivez les résultats des décisions (approuvé, rejeté, en attente) au fil du temps.',
        'seasonal_title': 'Modèles d\'activité saisonniers',
        'seasonal_desc': 'Tendances d\'activité trimestrielles montrant comment le travail des comités varie au cours de l\'année.',
        'attribution': '📊 Données de',
        'updated': 'Mis à jour:',
        'loading': 'Chargement...'
    },
    'es': {
        'title': '🏛️ Rendimiento de Comités & Análisis de Redes',
        'network_title': 'Diagrama de red de comités',
        'network_desc': 'Visualización interactiva de las relaciones y productividad de los comités. Arrastra nodos para explorar conexiones.',
        'matrix_title': 'Matriz de productividad (2020-2026)',
        'matrix_desc': 'Mapa de calor que muestra las puntuaciones de productividad de los comités a lo largo del tiempo. Pasa el cursor sobre las celdas para información detallada.',
        'comparison_title': 'Comparación de comités',
        'comparison_desc': 'Compara las puntuaciones de productividad de los 15 comités.',
        'effectiveness_title': 'Efectividad de decisiones',
        'effectiveness_desc': 'Rastrea los resultados de las decisiones (aprobado, rechazado, pendiente) a lo largo del tiempo.',
        'seasonal_title': 'Patrones de actividad estacionales',
        'seasonal_desc': 'Tendencias de actividad trimestrales que muestran cómo varía el trabajo del comité durante el año.',
        'attribution': '📊 Datos de',
        'updated': 'Actualizado:',
        'loading': 'Cargando...'
    },
    'nl': {
        'title': '🏛️ Commissie Prestaties & Netwerkanalyse',
        'network_title': 'Commissie netwerkdiagram',
        'network_desc': 'Interactieve visualisatie van commissierelaties en productiviteit. Sleep knooppunten om verbindingen te verkennen.',
        'matrix_title': 'Productiviteitsmatrix (2020-2026)',
        'matrix_desc': 'Heatmap met productiviteitsscores van commissies in de tijd. Beweeg de muis over cellen voor gedetailleerde informatie.',
        'comparison_title': 'Commissievergelijking',
        'comparison_desc': 'Vergelijk productiviteitsscores over alle 15 commissies.',
        'effectiveness_title': 'Besluitvormingseffectiviteit',
        'effectiveness_desc': 'Volg besluitvormingsresultaten (goedgekeurd, afgewezen, in afwachting) in de tijd.',
        'seasonal_title': 'Seizoensgebonden activiteitspatronen',
        'seasonal_desc': 'Driemaandelijkse activiteitstrends die laten zien hoe het werk van de commissie varieert gedurende het jaar.',
        'attribution': '📊 Gegevens van',
        'updated': 'Bijgewerkt:',
        'loading': 'Laden...'
    },
    'ar': {
        'title': '🏛️ أداء اللجان وتحليل الشبكة',
        'network_title': 'مخطط شبكة اللجان',
        'network_desc': 'تصور تفاعلي لعلاقات اللجان وإنتاجيتها. اسحب العقد لاستكشاف الروابط.',
        'matrix_title': 'مصفوفة الإنتاجية (2020-2026)',
        'matrix_desc': 'خريطة حرارية تعرض درجات إنتاجية اللجان مع مرور الوقت. مرر المؤشر فوق الخلايا للحصول على معلومات مفصلة.',
        'comparison_title': 'مقارنة اللجان',
        'comparison_desc': 'قارن درجات الإنتاجية عبر جميع اللجان الـ 15.',
        'effectiveness_title': 'فعالية القرارات',
        'effectiveness_desc': 'تتبع نتائج القرارات (موافق عليها، مرفوضة، معلقة) مع مرور الوقت.',
        'seasonal_title': 'أنماط النشاط الموسمية',
        'seasonal_desc': 'اتجاهات النشاط الربع سنوية التي تُظهر كيف يختلف عمل اللجان على مدار العام.',
        'attribution': '📊 البيانات من',
        'updated': 'محدث:',
        'loading': 'جار التحميل...'
    },
    'he': {
        'title': '🏛️ ביצועי ועדות וניתוח רשת',
        'network_title': 'תרשים רשת הוועדות',
        'network_desc': 'הדמיה אינטראקטיבית של יחסי ועדות ופרודוקטיביות. גרור צמתים כדי לחקור קשרים.',
        'matrix_title': 'מטריצת פרודוקטיביות (2020-2026)',
        'matrix_desc': 'מפת חום המציגה ציוני פרודוקטיביות של ועדות לאורך זמן. העבר את העכבר מעל תאים למידע מפורט.',
        'comparison_title': 'השוואת ועדות',
        'comparison_desc': 'השווה ציוני פרודוקטיביות על פני כל 15 הוועדות.',
        'effectiveness_title': 'אפקטיביות החלטות',
        'effectiveness_desc': 'עקוב אחר תוצאות החלטות (אושרו, נדחו, ממתינות) לאורך זמן.',
        'seasonal_title': 'דפוסי פעילות עונתיים',
        'seasonal_desc': 'מגמות פעילות רבעוניות המראות כיצד משתנה עבודת הוועדות במהלך השנה.',
        'attribution': '📊 נתונים מ',
        'updated': 'עודכן:',
        'loading': 'טוען...'
    },
    'ja': {
        'title': '🏛️ 委員会のパフォーマンスとネットワーク分析',
        'network_title': '委員会ネットワーク図',
        'network_desc': '委員会の関係と生産性のインタラクティブな可視化。ノードをドラッグして接続を探索します。',
        'matrix_title': '生産性マトリックス (2020-2026)',
        'matrix_desc': '時間の経過とともに委員会の生産性スコアを示すヒートマップ。詳細情報についてはセルにカーソルを合わせてください。',
        'comparison_title': '委員会の比較',
        'comparison_desc': '15の委員会すべての生産性スコアを比較します。',
        'effectiveness_title': '決定の有効性',
        'effectiveness_desc': '時間の経過とともに決定結果（承認、拒否、保留中）を追跡します。',
        'seasonal_title': '季節的活動パターン',
        'seasonal_desc': '年間を通じて委員会の活動がどのように変化するかを示す四半期ごとの活動傾向。',
        'attribution': '📊 データ提供元:',
        'updated': '更新日:',
        'loading': '読み込み中...'
    },
    'ko': {
        'title': '🏛️ 위원회 성과 및 네트워크 분석',
        'network_title': '위원회 네트워크 다이어그램',
        'network_desc': '위원회 관계 및 생산성의 대화형 시각화. 노드를 드래그하여 연결을 탐색하세요.',
        'matrix_title': '생산성 매트릭스 (2020-2026)',
        'matrix_desc': '시간 경과에 따른 위원회 생산성 점수를 보여주는 히트맵. 자세한 정보를 보려면 셀 위로 마우스를 가져가세요.',
        'comparison_title': '위원회 비교',
        'comparison_desc': '모든 15개 위원회의 생산성 점수를 비교합니다.',
        'effectiveness_title': '결정 효율성',
        'effectiveness_desc': '시간 경과에 따른 결정 결과(승인, 거부, 보류)를 추적합니다.',
        'seasonal_title': '계절별 활동 패턴',
        'seasonal_desc': '연중 위원회 작업이 어떻게 변하는지 보여주는 분기별 활동 추세.',
        'attribution': '📊 데이터 제공:',
        'updated': '업데이트:',
        'loading': '로딩 중...'
    },
    'zh': {
        'title': '🏛️ 委员会绩效与网络分析',
        'network_title': '委员会网络图',
        'network_desc': '委员会关系和生产力的交互式可视化。拖动节点以探索连接。',
        'matrix_title': '生产力矩阵 (2020-2026)',
        'matrix_desc': '显示委员会生产力分数随时间变化的热图。将鼠标悬停在单元格上以获取详细信息。',
        'comparison_title': '委员会比较',
        'comparison_desc': '比较所有15个委员会的生产力分数。',
        'effectiveness_title': '决策有效性',
        'effectiveness_desc': '跟踪决策结果（批准、拒绝、待定）随时间的变化。',
        'seasonal_title': '季节性活动模式',
        'seasonal_desc': '季度活动趋势显示委员会工作在一年中的变化情况。',
        'attribution': '📊 数据来源:',
        'updated': '更新时间:',
        'loading': '加载中...'
    }
}

# CDN Libraries to add
CDN_LIBRARIES = '''
<!-- D3.js v7 for network diagrams and heat maps -->
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js" integrity="sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i" crossorigin="anonymous"></script>

<!-- Chart.js v4 for bar, line, and stacked charts -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" integrity="sha384-9nhczxUqK87bcKHh20fSQcTGD4qq5GhayNYSYWqwBkINBhOfQLg/P5HG5lF1urn4" crossorigin="anonymous"></script>

<!-- Papa Parse v5 for CSV parsing -->
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js" integrity="sha384-D/t0ZMqQW31H3az8ktEiNb39wyKnS82iFY52QPACM+IjKW3jDUhyIgh2PApRqJZs" crossorigin="anonymous"></script>
'''

# Committee Dashboard Script
DASHBOARD_SCRIPT = '\n<!-- Committee Dashboard JavaScript -->\n<script src="scripts/committees-dashboard.js"></script>\n'


def generate_dashboard_html(lang_code):
    """Generate dashboard HTML for a specific language"""
    trans = TRANSLATIONS.get(lang_code, TRANSLATIONS['en'])
    
    return f'''<section id="committee-dashboard" class="dashboard-container">
<h2>{trans['title']}</h2>

<div class="dashboard-grid">
<!-- Network Diagram (Full Width) -->
<div class="chart-card wide">
<h3>{trans['network_title']}</h3>
<p>{trans['network_desc']}</p>
<div id="committeeNetwork" role="img" aria-label="Committee network connections diagram showing relationships between 15 Swedish Riksdag committees"></div>
<table class="sr-only" id="committeeNetworkTable" aria-label="Committee network connections data table">
<!-- Accessible fallback table populated by JavaScript -->
</table>
</div>

<!-- Productivity Heat Map (Full Width) -->
<div class="chart-card wide">
<h3>{trans['matrix_title']}</h3>
<p>{trans['matrix_desc']}</p>
<div id="productivityMatrix" role="img" aria-label="Committee productivity matrix showing performance over time from 2020 to 2026"></div>
<table class="sr-only" id="productivityMatrixTable" aria-label="Committee productivity matrix data table">
<!-- Accessible fallback table populated by JavaScript -->
</table>
</div>

<!-- Committee Comparison -->
<div class="chart-card">
<h3>{trans['comparison_title']}</h3>
<p>{trans['comparison_desc']}</p>
<canvas id="committeeComparisonChart" role="img" aria-label="Bar chart comparing productivity scores across committees"></canvas>
</div>

<!-- Decision Effectiveness -->
<div class="chart-card">
<h3>{trans['effectiveness_title']}</h3>
<p>{trans['effectiveness_desc']}</p>
<canvas id="decisionEffectivenessChart" role="img" aria-label="Stacked bar chart showing decision effectiveness over years"></canvas>
</div>

<!-- Seasonal Patterns (Full Width) -->
<div class="chart-card wide">
<h3>{trans['seasonal_title']}</h3>
<p>{trans['seasonal_desc']}</p>
<canvas id="seasonalPatternsChart" role="img" aria-label="Line chart displaying seasonal activity patterns by quarter"></canvas>
</div>
</div>

<div class="dashboard-attribution">
<p><small>{trans['attribution']} <a href="https://www.hack23.com/cia" target="_blank" rel="noopener noreferrer">CIA Platform</a> | {trans['updated']} <span id="lastUpdated">{trans['loading']}</span></small></p>
</div>
</section>

'''


def update_html_file(filepath, lang_code):
    """Update a single HTML file with committee dashboard"""
    print(f"Processing {filepath}...")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has committee dashboard
        if 'committee-dashboard' in content:
            print(f"  ✓ {filepath} already has committee dashboard, skipping")
            return
        
        # Add CDN libraries after fonts (before </head>)
        if 'D3.js v7' not in content:
            content = content.replace(
                '<meta name="application-name" content="Riksdagsmonitor">',
                CDN_LIBRARIES + '\n<meta name="application-name" content="Riksdagsmonitor">'
            )
        
        # Add dashboard section before data-integration section
        dashboard_html = generate_dashboard_html(lang_code)
        if 'id="data-integration"' in content:
            content = content.replace(
                '<section id="data-integration">',
                dashboard_html + '\n<section id="data-integration">'
            )
        
        # Add dashboard script before </body>
        if 'committees-dashboard.js' not in content:
            content = content.replace('</body>', DASHBOARD_SCRIPT + '</body>')
        
        # Write updated content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ {filepath} updated successfully")
        
    except Exception as e:
        print(f"  ✗ Error updating {filepath}: {e}")


def main():
    """Main function to update all language files"""
    repo_root = Path(__file__).parent.parent
    
    # Language code mapping
    lang_files = {
        'en': 'index.html',
        'sv': 'index_sv.html',
        'da': 'index_da.html',
        'no': 'index_no.html',
        'fi': 'index_fi.html',
        'de': 'index_de.html',
        'fr': 'index_fr.html',
        'es': 'index_es.html',
        'nl': 'index_nl.html',
        'ar': 'index_ar.html',
        'he': 'index_he.html',
        'ja': 'index_ja.html',
        'ko': 'index_ko.html',
        'zh': 'index_zh.html'
    }
    
    print("=" * 70)
    print("WARNING: Updating all 14 language files with Committee Dashboard")
    print("=" * 70)
    print()
    print("This will modify:")
    for lang_code, filename in lang_files.items():
        print(f"  - {filename}")
    print()
    print("Current workflow: Dashboard should ONLY be in index.html (English).")
    print("You confirmed with --confirm-update-all flag. Proceeding...")
    print("=" * 70)
    print()
    
    for lang_code, filename in lang_files.items():
        filepath = repo_root / filename
        if filepath.exists():
            update_html_file(filepath, lang_code)
        else:
            print(f"  ✗ {filename} not found, skipping")
    
    print()
    print("=" * 60)
    print("Update complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
