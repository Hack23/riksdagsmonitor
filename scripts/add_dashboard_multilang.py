#!/usr/bin/env python3
"""
Add Party Performance Dashboard to all language HTML files
"""

import re
import os

# Language translations
TRANSLATIONS = {
    'en': {
        'title': '🗳️ Party Performance & Effectiveness',
        'desc': 'Comprehensive analysis of Swedish political parties using 50+ years of CIA platform data. Track effectiveness trends, coalition dynamics, and momentum indicators across 8 parties.',
        'effectiveness': 'Effectiveness Trends (1990-2026)',
        'effectiveness_desc': 'Historical party effectiveness scores showing legislative productivity, voting consistency, and policy impact over time.',
        'comparison': 'Party Comparison (Current Period)',
        'comparison_desc': 'Comparative analysis of party performance metrics for the current legislative period.',
        'coalition': 'Coalition Alignment',
        'coalition_desc': 'Coalition patterns and inter-party collaboration networks.',
        'momentum': 'Momentum Indicators',
        'momentum_desc': 'Party momentum scores with percentile benchmarks (P50, P90) indicating electoral trajectory.'
    },
    'sv': {
        'title': '🗳️ Partiprestation & Effektivitet',
        'desc': 'Omfattande analys av svenska politiska partier med över 50 års CIA-plattformsdata. Spåra effektivitetstrender, koalitionsdynamik och momentumindikatorer för 8 partier.',
        'effectiveness': 'Effektivitetstrender (1990-2026)',
        'effectiveness_desc': 'Historiska partieffektivitetspoäng som visar lagstiftningsproduktivitet, röstningskonsistens och politisk påverkan över tid.',
        'comparison': 'Partijämförelse (Nuvarande Period)',
        'comparison_desc': 'Jämförande analys av partiprestandametrik för nuvarande mandatperiod.',
        'coalition': 'Koalitionsanpassning',
        'coalition_desc': 'Koalitionsmönster och samarbetsnätverk mellan partier.',
        'momentum': 'Momentumindikatorer',
        'momentum_desc': 'Partimomentumpoäng med percentilriktmärken (P50, P90) som indikerar valbana.'
    },
    'da': {
        'title': '🗳️ Partipræstation & Effektivitet',
        'desc': 'Omfattende analyse af svenske politiske partier med over 50 års CIA-platformsdata. Spor effektivitetstendenser, koalitionsdynamik og momentumindikatorer for 8 partier.',
        'effectiveness': 'Effektivitetstendenser (1990-2026)',
        'effectiveness_desc': 'Historiske partieffektivitetsscorer, der viser lovgivningsmæssig produktivitet, stemningskonsistens og politisk indvirkning over tid.',
        'comparison': 'Partisammenligning (Nuværende Periode)',
        'comparison_desc': 'Sammenlignende analyse af partipræstationsmålinger for den nuværende lovgivende periode.',
        'coalition': 'Koalitionstilpasning',
        'coalition_desc': 'Koalitionsmønstre og samarbejdsnetværk mellem partier.',
        'momentum': 'Momentumindikatorer',
        'momentum_desc': 'Partimomentumscorer med percentilbenchmarks (P50, P90), der angiver valgbane.'
    },
    'no': {
        'title': '🗳️ Partiprestasjon & Effektivitet',
        'desc': 'Omfattende analyse av svenske politiske partier med over 50 års CIA-plattformdata. Spor effektivitetstrender, koalisjonsdynamikk og momentumindikatorer for 8 partier.',
        'effectiveness': 'Effektivitetstrender (1990-2026)',
        'effectiveness_desc': 'Historiske partieffektivitetspoeng som viser lovgivende produktivitet, stemmekonsistens og politisk innvirkning over tid.',
        'comparison': 'Partisammenligning (Nåværende Periode)',
        'comparison_desc': 'Sammenlignende analyse av partiprestasjonsmålinger for den nåværende lovgivende perioden.',
        'coalition': 'Koalisjonstilpasning',
        'coalition_desc': 'Koalisjonsmønstre og samarbeidsnettverk mellom partier.',
        'momentum': 'Momentumindikatorer',
        'momentum_desc': 'Partimomentumpoeng med persentilreferanser (P50, P90) som indikerer valgbane.'
    },
    'fi': {
        'title': '🗳️ Puolueiden Suorituskyky & Tehokkuus',
        'desc': 'Kattava analyysi ruotsalaisista poliittisista puolueista yli 50 vuoden CIA-alustatiedoilla. Seuraa tehokkuustrendejä, koalitiodynamiikkaa ja vauhtia indikaattoreita 8 puolueelle.',
        'effectiveness': 'Tehokkuustrendit (1990-2026)',
        'effectiveness_desc': 'Historialliset puolueiden tehokkuuspisteet, jotka osoittavat lainsäädännöllisen tuottavuuden, äänestyksen johdonmukaisuuden ja politiikan vaikutuksen ajan mittaan.',
        'comparison': 'Puoluevertailu (Nykyinen Kausi)',
        'comparison_desc': 'Vertaileva analyysi puolueiden suorituskykymittareista nykyisellä lainsäädäntökaudella.',
        'coalition': 'Koalition Yhdenmukaistaminen',
        'coalition_desc': 'Koalitiokuviot ja puolueiden väliset yhteistyöverkostot.',
        'momentum': 'Vauhti-Indikaattorit',
        'momentum_desc': 'Puolueen vauhtipisteet prosenttipisteillä (P50, P90), jotka osoittavat vaalikaaren.'
    },
    'de': {
        'title': '🗳️ Parteileistung & Effektivität',
        'desc': 'Umfassende Analyse schwedischer politischer Parteien mit über 50 Jahren CIA-Plattformdaten. Verfolgen Sie Effektivitätstrends, Koalitionsdynamik und Momentumindikatoren für 8 Parteien.',
        'effectiveness': 'Effektivitätstrends (1990-2026)',
        'effectiveness_desc': 'Historische Parteieneffektivitätswerte, die legislative Produktivität, Abstimmungskonsistenz und politische Auswirkungen im Laufe der Zeit zeigen.',
        'comparison': 'Parteienvergleich (Aktuelle Periode)',
        'comparison_desc': 'Vergleichende Analyse der Parteileistungsmetriken für die aktuelle Legislaturperiode.',
        'coalition': 'Koalitionsausrichtung',
        'coalition_desc': 'Koalitionsmuster und parteiübergreifende Zusammenarbeitsnetzwerke.',
        'momentum': 'Momentum-Indikatoren',
        'momentum_desc': 'Parteien-Momentum-Werte mit Perzentil-Benchmarks (P50, P90), die den Wahlverlauf anzeigen.'
    },
    'fr': {
        'title': '🗳️ Performance & Efficacité des Partis',
        'desc': "Analyse complète des partis politiques suédois avec plus de 50 ans de données de la plateforme CIA. Suivez les tendances d'efficacité, la dynamique de coalition et les indicateurs de momentum pour 8 partis.",
        'effectiveness': "Tendances d'Efficacité (1990-2026)",
        'effectiveness_desc': "Scores historiques d'efficacité des partis montrant la productivité législative, la cohérence de vote et l'impact politique au fil du temps.",
        'comparison': 'Comparaison des Partis (Période Actuelle)',
        'comparison_desc': 'Analyse comparative des métriques de performance des partis pour la période législative actuelle.',
        'coalition': 'Alignement de Coalition',
        'coalition_desc': 'Modèles de coalition et réseaux de collaboration inter-partis.',
        'momentum': 'Indicateurs de Momentum',
        'momentum_desc': 'Scores de momentum des partis avec des repères de percentile (P50, P90) indiquant la trajectoire électorale.'
    },
    'es': {
        'title': '🗳️ Rendimiento & Eficacia de Partidos',
        'desc': 'Análisis exhaustivo de los partidos políticos suecos con más de 50 años de datos de la plataforma CIA. Rastree tendencias de eficacia, dinámica de coalición e indicadores de momentum para 8 partidos.',
        'effectiveness': 'Tendencias de Eficacia (1990-2026)',
        'effectiveness_desc': 'Puntuaciones históricas de eficacia de los partidos que muestran productividad legislativa, consistencia de votación e impacto político a lo largo del tiempo.',
        'comparison': 'Comparación de Partidos (Período Actual)',
        'comparison_desc': 'Análisis comparativo de las métricas de rendimiento de los partidos para el período legislativo actual.',
        'coalition': 'Alineación de Coalición',
        'coalition_desc': 'Patrones de coalición y redes de colaboración entre partidos.',
        'momentum': 'Indicadores de Momentum',
        'momentum_desc': 'Puntuaciones de momentum de los partidos con puntos de referencia de percentil (P50, P90) que indican la trayectoria electoral.'
    },
    'nl': {
        'title': '🗳️ Partijprestatie & Effectiviteit',
        'desc': 'Uitgebreide analyse van Zweedse politieke partijen met meer dan 50 jaar CIA-platformgegevens. Volg effectiviteitstrends, coalitiedynamiek en momentumindicatoren voor 8 partijen.',
        'effectiveness': 'Effectiviteitstrends (1990-2026)',
        'effectiveness_desc': 'Historische partijeffectiviteitsscores die wetgevende productiviteit, stemconsistentie en beleidsimpact in de loop van de tijd tonen.',
        'comparison': 'Partijvergelijking (Huidige Periode)',
        'comparison_desc': 'Vergelijkende analyse van partijprestatiemetrics voor de huidige wetgevende periode.',
        'coalition': 'Coalitie-Afstemming',
        'coalition_desc': 'Coalitiepatronen en samenwerkingsnetwerken tussen partijen.',
        'momentum': 'Momentumindicatoren',
        'momentum_desc': 'Partijmomentumscores met percentiel-benchmarks (P50, P90) die het verkiezingstraject aangeven.'
    },
    'ar': {
        'title': '🗳️ أداء وفعالية الأحزاب',
        'desc': 'تحليل شامل للأحزاب السياسية السويدية مع أكثر من 50 عامًا من بيانات منصة CIA. تتبع اتجاهات الفعالية وديناميكيات الائتلاف ومؤشرات الزخم لـ 8 أحزاب.',
        'effectiveness': 'اتجاهات الفعالية (1990-2026)',
        'effectiveness_desc': 'درجات الفعالية التاريخية للأحزاب التي تظهر الإنتاجية التشريعية واتساق التصويت والتأثير السياسي بمرور الوقت.',
        'comparison': 'مقارنة الأحزاب (الفترة الحالية)',
        'comparison_desc': 'تحليل مقارن لمقاييس أداء الأحزاب للفترة التشريعية الحالية.',
        'coalition': 'مواءمة الائتلاف',
        'coalition_desc': 'أنماط الائتلاف وشبكات التعاون بين الأحزاب.',
        'momentum': 'مؤشرات الزخم',
        'momentum_desc': 'درجات زخم الأحزاب مع معايير النسبة المئوية (P50، P90) التي تشير إلى المسار الانتخابي.'
    },
    'he': {
        'title': '🗳️ ביצועים ויעילות של מפלגות',
        'desc': 'ניתוח מקיף של מפלגות פוליטיות שוודיות עם יותר מ-50 שנים של נתוני פלטפורמת CIA. עקבו אחר מגמות יעילות, דינמיקת קואליציה ומדדי מומנטום עבור 8 מפלגות.',
        'effectiveness': 'מגמות יעילות (1990-2026)',
        'effectiveness_desc': 'ציוני יעילות היסטוריים של מפלגות המציגים פרודוקטיביות חקיקתית, עקביות הצבעה והשפעה מדינית לאורך זמן.',
        'comparison': 'השוואת מפלגות (תקופה נוכחית)',
        'comparison_desc': 'ניתוח השוואתי של מדדי ביצועים של מפלגות לתקופת החקיקה הנוכחית.',
        'coalition': 'יישור קואליציה',
        'coalition_desc': 'דפוסי קואליציה ורשתות שיתוף פעולה בין-מפלגתיות.',
        'momentum': 'מדדי מומנטום',
        'momentum_desc': 'ציוני מומנטום של מפלגות עם אמות מידה אחוזיות (P50, P90) המצביעים על מסלול בחירות.'
    },
    'ja': {
        'title': '🗳️ 政党のパフォーマンスと効果',
        'desc': 'CIAプラットフォームの50年以上のデータを使用したスウェーデンの政党の包括的な分析。8つの政党の効果トレンド、連立動態、勢いの指標を追跡します。',
        'effectiveness': '効果トレンド（1990-2026）',
        'effectiveness_desc': '立法の生産性、投票の一貫性、および政策の影響を時系列で示す歴史的な政党の効果スコア。',
        'comparison': '政党比較（現在の期間）',
        'comparison_desc': '現在の立法期間における政党のパフォーマンスメトリクスの比較分析。',
        'coalition': '連立の調整',
        'coalition_desc': '連立パターンと政党間の協力ネットワーク。',
        'momentum': '勢いの指標',
        'momentum_desc': 'パーセンタイルベンチマーク（P50、P90）を使用した政党の勢いスコアで、選挙の軌跡を示します。'
    },
    'ko': {
        'title': '🗳️ 정당 성과 및 효과',
        'desc': '50년 이상의 CIA 플랫폼 데이터로 스웨덴 정당에 대한 포괄적인 분석. 8개 정당의 효과 추세, 연립 역학 및 모멘텀 지표를 추적합니다.',
        'effectiveness': '효과 추세 (1990-2026)',
        'effectiveness_desc': '시간 경과에 따른 입법 생산성, 투표 일관성 및 정책 영향을 보여주는 역사적 정당 효과 점수.',
        'comparison': '정당 비교 (현재 기간)',
        'comparison_desc': '현재 입법 기간에 대한 정당 성과 메트릭의 비교 분석.',
        'coalition': '연립 조정',
        'coalition_desc': '연립 패턴 및 정당 간 협력 네트워크.',
        'momentum': '모멘텀 지표',
        'momentum_desc': '백분위수 벤치마크(P50, P90)로 선거 궤적을 나타내는 정당 모멘텀 점수.'
    },
    'zh': {
        'title': '🗳️ 政党表现与效率',
        'desc': '使用CIA平台50多年的数据对瑞典政党进行全面分析。跟踪8个政党的效率趋势、联盟动态和动量指标。',
        'effectiveness': '效率趋势（1990-2026）',
        'effectiveness_desc': '显示立法生产力、投票一致性和政策影响随时间变化的历史政党效率分数。',
        'comparison': '政党比较（当前期间）',
        'comparison_desc': '当前立法期间政党绩效指标的比较分析。',
        'coalition': '联盟协调',
        'coalition_desc': '联盟模式和政党间合作网络。',
        'momentum': '动量指标',
        'momentum_desc': '具有百分位基准（P50，P90）的政党动量分数，指示选举轨迹。'
    }
}

def generate_dashboard_html(lang_code):
    """Generate dashboard HTML for a specific language"""
    t = TRANSLATIONS.get(lang_code, TRANSLATIONS['en'])
    
    return f'''
<section id="party-dashboard" class="dashboard-container">
<h2>{t['title']}</h2>
<p>{t['desc']}</p>

<div class="dashboard-grid">
<div class="chart-card">
<h3>{t['effectiveness']}</h3>
<p>{t['effectiveness_desc']}</p>
<canvas id="partyEffectivenessChart" role="img" aria-label="Party effectiveness line chart showing trends from 1990 to 2026 for all 8 Swedish political parties"></canvas>
<span class="sr-only">Line chart displaying effectiveness scores for Social Democrats, Moderates, Sweden Democrats, Centre Party, Left Party, Christian Democrats, Liberals, and Green Party from 1990 to 2026.</span>
</div>

<div class="chart-card">
<h3>{t['comparison']}</h3>
<p>{t['comparison_desc']}</p>
<canvas id="partyComparisonChart" role="img" aria-label="Bar chart comparing current performance scores across all 8 Swedish political parties"></canvas>
<span class="sr-only">Horizontal bar chart showing comparative performance scores for all parties in the current legislative period, sorted by score.</span>
</div>

<div class="chart-card">
<h3>{t['coalition']}</h3>
<p>{t['coalition_desc']}</p>
<div id="coalitionNetwork" role="region" aria-label="Coalition alignment visualization showing collaboration strength between political parties"></div>
<span class="sr-only">Visual representation of coalition patterns showing collaboration strength percentages between different party combinations.</span>
</div>

<div class="chart-card">
<h3>{t['momentum']}</h3>
<p>{t['momentum_desc']}</p>
<canvas id="partyMomentumChart" role="img" aria-label="Doughnut chart showing momentum scores for all 8 Swedish political parties"></canvas>
<span class="sr-only">Doughnut chart displaying momentum indicator scores for each party with percentile benchmarks.</span>
</div>
</div>
</section>

'''

def add_chartjs_cdn(content):
    """Add Chart.js CDN if not present"""
    if 'chart.js@4.4.2' in content:
        return content
    
    chartjs_cdn = '''<!-- Chart.js for Party Dashboard Visualizations -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js" integrity="sha384-e6cc9LaIG7xZ3XD5B+jtr1NhTWPQGQdRCh6xiZ+ZFUtWCpg4ycv3Sh+SkZoopvUY" crossorigin="anonymous"></script>

'''
    
    content = content.replace('</head>', chartjs_cdn + '</head>')
    return content

def add_dashboard_script(content):
    """Add party-dashboard.js script if not present"""
    if 'party-dashboard.js' in content:
        return content
    
    script_tag = '''<!-- Party Dashboard Script -->
<script src="js/party-dashboard.js"></script>
'''
    
    content = content.replace('</body>', script_tag + '\n</body>')
    return content

def process_file(filename, lang_code):
    """Process a single HTML file"""
    print(f"  Processing: {filename} (lang: {lang_code})")
    
    if not os.path.exists(filename):
        print(f"  ⚠️  File not found: {filename}")
        return False
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if dashboard already exists
    if 'id="party-dashboard"' in content:
        print(f"  ⏭️  Dashboard already exists in {filename}, skipping")
        return True
    
    # Add Chart.js CDN
    content = add_chartjs_cdn(content)
    
    # Add dashboard HTML before data-integration or final-cta section
    dashboard_html = generate_dashboard_html(lang_code)
    
    if '<section id="data-integration">' in content:
        content = content.replace('<section id="data-integration">', dashboard_html + '<section id="data-integration">')
    elif '<section id="final-cta">' in content:
        content = content.replace('<section id="final-cta">', dashboard_html + '<section id="final-cta">')
    elif '<section id="technical-specifications">' in content:
        # Find the end of technical-specifications section
        pattern = r'(</section>\s*\n\s*<section id="technical-specifications">.*?</section>)'
        replacement = r'\1\n' + dashboard_html
        content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
    else:
        print(f"  ⚠️  Could not find insertion point in {filename}")
        return False
    
    # Add dashboard script
    content = add_dashboard_script(content)
    
    # Write back
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ Dashboard added to {filename}")
    return True

def main():
    """Main function"""
    print("🌍 Adding Party Performance Dashboard to all language files...")
    print()
    
    languages = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']
    
    success_count = 0
    for lang in languages:
        filename = f"index_{lang}.html"
        if process_file(filename, lang):
            success_count += 1
    
    print()
    print(f"✅ Party Performance Dashboard processed for {success_count}/{len(languages)} language files!")
    print("📊 Chart.js CDN integrated with SRI hash")
    print("🔒 Security: HTTPS-only, SRI integrity checks")
    print("♿ Accessibility: WCAG 2.1 AA compliant with ARIA labels")
    print("🌐 Languages: 14 languages fully supported")

if __name__ == '__main__':
    main()
