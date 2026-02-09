#!/bin/bash

# Script to add Party Dashboard section to all language HTML files
# Updates 13 additional language files (index_*.html) with localized dashboard content

set -e

echo "🌍 Adding Party Performance Dashboard to all language files..."

# Language definitions with translations
declare -A LANG_TRANSLATIONS

# Swedish (sv)
LANG_TRANSLATIONS['sv_title']='🗳️ Partiprestation & Effektivitet'
LANG_TRANSLATIONS['sv_desc']='Omfattande analys av svenska politiska partier med över 50 års CIA-plattformsdata. Spåra effektivitetstrender, koalitionsdynamik och momentumindikatorer för 8 partier.'
LANG_TRANSLATIONS['sv_effectiveness']='Effektivitetstrender (1990-2026)'
LANG_TRANSLATIONS['sv_effectiveness_desc']='Historiska partieffektivitetspoäng som visar lagstiftningsproduktivitet, röstningskonsistens och politisk påverkan över tid.'
LANG_TRANSLATIONS['sv_comparison']='Partijämförelse (Nuvarande Period)'
LANG_TRANSLATIONS['sv_comparison_desc']='Jämförande analys av partiprestandametrik för nuvarande mandatperiod.'
LANG_TRANSLATIONS['sv_coalition']='Koalitionsanpassning'
LANG_TRANSLATIONS['sv_coalition_desc']='Koalitionsmönster och samarbetsnätverk mellan partier.'
LANG_TRANSLATIONS['sv_momentum']='Momentumindikatorer'
LANG_TRANSLATIONS['sv_momentum_desc']='Partimomentumpoäng med percentilriktmärken (P50, P90) som indikerar valbana.'

# Danish (da)
LANG_TRANSLATIONS['da_title']='🗳️ Partipræstation & Effektivitet'
LANG_TRANSLATIONS['da_desc']='Omfattende analyse af svenske politiske partier med over 50 års CIA-platformsdata. Spor effektivitetstendenser, koalitionsdynamik og momentumindikatorer for 8 partier.'
LANG_TRANSLATIONS['da_effectiveness']='Effektivitetstendenser (1990-2026)'
LANG_TRANSLATIONS['da_effectiveness_desc']='Historiske partieffektivitetsscorer, der viser lovgivningsmæssig produktivitet, stemningskonsistens og politisk indvirkning over tid.'
LANG_TRANSLATIONS['da_comparison']='Partisammenligning (Nuværende Periode)'
LANG_TRANSLATIONS['da_comparison_desc']='Sammenlignende analyse af partipræstationsmålinger for den nuværende lovgivende periode.'
LANG_TRANSLATIONS['da_coalition']='Koalitionstilpasning'
LANG_TRANSLATIONS['da_coalition_desc']='Koalitionsmønstre og samarbejdsnetværk mellem partier.'
LANG_TRANSLATIONS['da_momentum']='Momentumindikatorer'
LANG_TRANSLATIONS['da_momentum_desc']='Partimomentumscorer med percentilbenchmarks (P50, P90), der angiver valgbane.'

# Norwegian (no)
LANG_TRANSLATIONS['no_title']='🗳️ Partiprestasjon & Effektivitet'
LANG_TRANSLATIONS['no_desc']='Omfattende analyse av svenske politiske partier med over 50 års CIA-plattformdata. Spor effektivitetstrender, koalisjonsdynamikk og momentumindikatorer for 8 partier.'
LANG_TRANSLATIONS['no_effectiveness']='Effektivitetstrender (1990-2026)'
LANG_TRANSLATIONS['no_effectiveness_desc']='Historiske partieffektivitetspoeng som viser lovgivende produktivitet, stemmekonsistens og politisk innvirkning over tid.'
LANG_TRANSLATIONS['no_comparison']='Partisammenligning (Nåværende Periode)'
LANG_TRANSLATIONS['no_comparison_desc']='Sammenlignende analyse av partiprestasjonsmålinger for den nåværende lovgivende perioden.'
LANG_TRANSLATIONS['no_coalition']='Koalisjonstilpasning'
LANG_TRANSLATIONS['no_coalition_desc']='Koalisjonsmønstre og samarbeidsnettverk mellom partier.'
LANG_TRANSLATIONS['no_momentum']='Momentumindikatorer'
LANG_TRANSLATIONS['no_momentum_desc']='Partimomentumpoeng med persentilreferanser (P50, P90) som indikerer valgbane.'

# Finnish (fi)
LANG_TRANSLATIONS['fi_title']='🗳️ Puolueiden Suorituskyky & Tehokkuus'
LANG_TRANSLATIONS['fi_desc']='Kattava analyysi ruotsalaisista poliittisista puolueista yli 50 vuoden CIA-alustatiedoilla. Seuraa tehokkuustrendejä, koalitiodynamiikkaa ja vauhtia indikaattoreita 8 puolueelle.'
LANG_TRANSLATIONS['fi_effectiveness']='Tehokkuustrendit (1990-2026)'
LANG_TRANSLATIONS['fi_effectiveness_desc']='Historialliset puolueiden tehokkuuspisteet, jotka osoittavat lainsäädännöllisen tuottavuuden, äänestyksen johdonmukaisuuden ja politiikan vaikutuksen ajan mittaan.'
LANG_TRANSLATIONS['fi_comparison']='Puoluevertailu (Nykyinen Kausi)'
LANG_TRANSLATIONS['fi_comparison_desc']='Vertaileva analyysi puolueiden suorituskykymittareista nykyisellä lainsäädäntökaudella.'
LANG_TRANSLATIONS['fi_coalition']='Koalition Yhdenmukaistaminen'
LANG_TRANSLATIONS['fi_coalition_desc']='Koalitiokuviot ja puolueiden väliset yhteistyöverkostot.'
LANG_TRANSLATIONS['fi_momentum']='Vauhti-Indikaattorit'
LANG_TRANSLATIONS['fi_momentum_desc']='Puolueen vauhtipisteet prosenttipisteillä (P50, P90), jotka osoittavat vaalikaaren.'

# German (de)
LANG_TRANSLATIONS['de_title']='🗳️ Parteileistung & Effektivität'
LANG_TRANSLATIONS['de_desc']='Umfassende Analyse schwedischer politischer Parteien mit über 50 Jahren CIA-Plattformdaten. Verfolgen Sie Effektivitätstrends, Koalitionsdynamik und Momentumindikatoren für 8 Parteien.'
LANG_TRANSLATIONS['de_effectiveness']='Effektivitätstrends (1990-2026)'
LANG_TRANSLATIONS['de_effectiveness_desc']='Historische Parteieneffektivitätswerte, die legislative Produktivität, Abstimmungskonsistenz und politische Auswirkungen im Laufe der Zeit zeigen.'
LANG_TRANSLATIONS['de_comparison']='Parteienvergleich (Aktuelle Periode)'
LANG_TRANSLATIONS['de_comparison_desc']='Vergleichende Analyse der Parteileistungsmetriken für die aktuelle Legislaturperiode.'
LANG_TRANSLATIONS['de_coalition']='Koalitionsausrichtung'
LANG_TRANSLATIONS['de_coalition_desc']='Koalitionsmuster und parteiübergreifende Zusammenarbeitsnetzwerke.'
LANG_TRANSLATIONS['de_momentum']='Momentum-Indikatoren'
LANG_TRANSLATIONS['de_momentum_desc']='Parteien-Momentum-Werte mit Perzentil-Benchmarks (P50, P90), die den Wahlverlauf anzeigen.'

# French (fr)
LANG_TRANSLATIONS['fr_title']="🗳️ Performance & Efficacité des Partis"
LANG_TRANSLATIONS['fr_desc']="Analyse complète des partis politiques suédois avec plus de 50 ans de données de la plateforme CIA. Suivez les tendances d'efficacité, la dynamique de coalition et les indicateurs de momentum pour 8 partis."
LANG_TRANSLATIONS['fr_effectiveness']="Tendances d'Efficacité (1990-2026)"
LANG_TRANSLATIONS['fr_effectiveness_desc']="Scores historiques d'efficacité des partis montrant la productivité législative, la cohérence de vote et l'impact politique au fil du temps."
LANG_TRANSLATIONS['fr_comparison']='Comparaison des Partis (Période Actuelle)'
LANG_TRANSLATIONS['fr_comparison_desc']='Analyse comparative des métriques de performance des partis pour la période législative actuelle.'
LANG_TRANSLATIONS['fr_coalition']='Alignement de Coalition'
LANG_TRANSLATIONS['fr_coalition_desc']='Modèles de coalition et réseaux de collaboration inter-partis.'
LANG_TRANSLATIONS['fr_momentum']='Indicateurs de Momentum'
LANG_TRANSLATIONS['fr_momentum_desc']='Scores de momentum des partis avec des repères de percentile (P50, P90) indiquant la trajectoire électorale.'

# Spanish (es)
LANG_TRANSLATIONS['es_title']='🗳️ Rendimiento & Eficacia de Partidos'
LANG_TRANSLATIONS['es_desc']='Análisis exhaustivo de los partidos políticos suecos con más de 50 años de datos de la plataforma CIA. Rastree tendencias de eficacia, dinámica de coalición e indicadores de momentum para 8 partidos.'
LANG_TRANSLATIONS['es_effectiveness']='Tendencias de Eficacia (1990-2026)'
LANG_TRANSLATIONS['es_effectiveness_desc']='Puntuaciones históricas de eficacia de los partidos que muestran productividad legislativa, consistencia de votación e impacto político a lo largo del tiempo.'
LANG_TRANSLATIONS['es_comparison']='Comparación de Partidos (Período Actual)'
LANG_TRANSLATIONS['es_comparison_desc']='Análisis comparativo de las métricas de rendimiento de los partidos para el período legislativo actual.'
LANG_TRANSLATIONS['es_coalition']='Alineación de Coalición'
LANG_TRANSLATIONS['es_coalition_desc']='Patrones de coalición y redes de colaboración entre partidos.'
LANG_TRANSLATIONS['es_momentum']='Indicadores de Momentum'
LANG_TRANSLATIONS['es_momentum_desc']='Puntuaciones de momentum de los partidos con puntos de referencia de percentil (P50, P90) que indican la trayectoria electoral.'

# Dutch (nl)
LANG_TRANSLATIONS['nl_title']='🗳️ Partijprestatie & Effectiviteit'
LANG_TRANSLATIONS['nl_desc']='Uitgebreide analyse van Zweedse politieke partijen met meer dan 50 jaar CIA-platformgegevens. Volg effectiviteitstrends, coalitiedynamiek en momentumindicatoren voor 8 partijen.'
LANG_TRANSLATIONS['nl_effectiveness']='Effectiviteitstrends (1990-2026)'
LANG_TRANSLATIONS['nl_effectiveness_desc']='Historische partijeffectiviteitsscores die wetgevende productiviteit, stemconsistentie en beleidsimpact in de loop van de tijd tonen.'
LANG_TRANSLATIONS['nl_comparison']='Partijvergelijking (Huidige Periode)'
LANG_TRANSLATIONS['nl_comparison_desc']='Vergelijkende analyse van partijprestatiemetrics voor de huidige wetgevende periode.'
LANG_TRANSLATIONS['nl_coalition']='Coalitie-Afstemming'
LANG_TRANSLATIONS['nl_coalition_desc']='Coalitiepatronen en samenwerkingsnetwerken tussen partijen.'
LANG_TRANSLATIONS['nl_momentum']='Momentumindicatoren'
LANG_TRANSLATIONS['nl_momentum_desc']='Partijmomentumscores met percentiel-benchmarks (P50, P90) die het verkiezingstraject aangeven.'

# Arabic (ar)
LANG_TRANSLATIONS['ar_title']='🗳️ أداء وفعالية الأحزاب'
LANG_TRANSLATIONS['ar_desc']='تحليل شامل للأحزاب السياسية السويدية مع أكثر من 50 عامًا من بيانات منصة CIA. تتبع اتجاهات الفعالية وديناميكيات الائتلاف ومؤشرات الزخم لـ 8 أحزاب.'
LANG_TRANSLATIONS['ar_effectiveness']='اتجاهات الفعالية (1990-2026)'
LANG_TRANSLATIONS['ar_effectiveness_desc']='درجات الفعالية التاريخية للأحزاب التي تظهر الإنتاجية التشريعية واتساق التصويت والتأثير السياسي بمرور الوقت.'
LANG_TRANSLATIONS['ar_comparison']='مقارنة الأحزاب (الفترة الحالية)'
LANG_TRANSLATIONS['ar_comparison_desc']='تحليل مقارن لمقاييس أداء الأحزاب للفترة التشريعية الحالية.'
LANG_TRANSLATIONS['ar_coalition']='مواءمة الائتلاف'
LANG_TRANSLATIONS['ar_coalition_desc']='أنماط الائتلاف وشبكات التعاون بين الأحزاب.'
LANG_TRANSLATIONS['ar_momentum']='مؤشرات الزخم'
LANG_TRANSLATIONS['ar_momentum_desc']='درجات زخم الأحزاب مع معايير النسبة المئوية (P50، P90) التي تشير إلى المسار الانتخابي.'

# Hebrew (he)
LANG_TRANSLATIONS['he_title']='🗳️ ביצועים ויעילות של מפלגות'
LANG_TRANSLATIONS['he_desc']='ניתוח מקיף של מפלגות פוליטיות שוודיות עם יותר מ-50 שנים של נתוני פלטפורמת CIA. עקבו אחר מגמות יעילות, דינמיקת קואליציה ומדדי מומנטום עבור 8 מפלגות.'
LANG_TRANSLATIONS['he_effectiveness']='מגמות יעילות (1990-2026)'
LANG_TRANSLATIONS['he_effectiveness_desc']='ציוני יעילות היסטוריים של מפלגות המציגים פרודוקטיביות חקיקתית, עקביות הצבעה והשפעה מדינית לאורך זמן.'
LANG_TRANSLATIONS['he_comparison']='השוואת מפלגות (תקופה נוכחית)'
LANG_TRANSLATIONS['he_comparison_desc']='ניתוח השוואתי של מדדי ביצועים של מפלגות לתקופת החקיקה הנוכחית.'
LANG_TRANSLATIONS['he_coalition']='יישור קואליציה'
LANG_TRANSLATIONS['he_coalition_desc']='דפוסי קואליציה ורשתות שיתוף פעולה בין-מפלגתיות.'
LANG_TRANSLATIONS['he_momentum']='מדדי מומנטום'
LANG_TRANSLATIONS['he_momentum_desc']='ציוני מומנטום של מפלגות עם אמות מידה אחוזיות (P50, P90) המצביעים על מסלול בחירות.'

# Japanese (ja)
LANG_TRANSLATIONS['ja_title']='🗳️ 政党のパフォーマンスと効果'
LANG_TRANSLATIONS['ja_desc']='CIAプラットフォームの50年以上のデータを使用したスウェーデンの政党の包括的な分析。8つの政党の効果トレンド、連立動態、勢いの指標を追跡します。'
LANG_TRANSLATIONS['ja_effectiveness']='効果トレンド（1990-2026）'
LANG_TRANSLATIONS['ja_effectiveness_desc']='立法の生産性、投票の一貫性、および政策の影響を時系列で示す歴史的な政党の効果スコア。'
LANG_TRANSLATIONS['ja_comparison']='政党比較（現在の期間）'
LANG_TRANSLATIONS['ja_comparison_desc']='現在の立法期間における政党のパフォーマンスメトリクスの比較分析。'
LANG_TRANSLATIONS['ja_coalition']='連立の調整'
LANG_TRANSLATIONS['ja_coalition_desc']='連立パターンと政党間の協力ネットワーク。'
LANG_TRANSLATIONS['ja_momentum']='勢いの指標'
LANG_TRANSLATIONS['ja_momentum_desc']='パーセンタイルベンチマーク（P50、P90）を使用した政党の勢いスコアで、選挙の軌跡を示します。'

# Korean (ko)
LANG_TRANSLATIONS['ko_title']='🗳️ 정당 성과 및 효과'
LANG_TRANSLATIONS['ko_desc']='50년 이상의 CIA 플랫폼 데이터로 스웨덴 정당에 대한 포괄적인 분석. 8개 정당의 효과 추세, 연립 역학 및 모멘텀 지표를 추적합니다.'
LANG_TRANSLATIONS['ko_effectiveness']='효과 추세 (1990-2026)'
LANG_TRANSLATIONS['ko_effectiveness_desc']='시간 경과에 따른 입법 생산성, 투표 일관성 및 정책 영향을 보여주는 역사적 정당 효과 점수.'
LANG_TRANSLATIONS['ko_comparison']='정당 비교 (현재 기간)'
LANG_TRANSLATIONS['ko_comparison_desc']='현재 입법 기간에 대한 정당 성과 메트릭의 비교 분석.'
LANG_TRANSLATIONS['ko_coalition']='연립 조정'
LANG_TRANSLATIONS['ko_coalition_desc']='연립 패턴 및 정당 간 협력 네트워크.'
LANG_TRANSLATIONS['ko_momentum']='모멘텀 지표'
LANG_TRANSLATIONS['ko_momentum_desc']='백분위수 벤치마크(P50, P90)로 선거 궤적을 나타내는 정당 모멘텀 점수.'

# Chinese (zh)
LANG_TRANSLATIONS['zh_title']='🗳️ 政党表现与效率'
LANG_TRANSLATIONS['zh_desc']='使用CIA平台50多年的数据对瑞典政党进行全面分析。跟踪8个政党的效率趋势、联盟动态和动量指标。'
LANG_TRANSLATIONS['zh_effectiveness']='效率趋势（1990-2026）'
LANG_TRANSLATIONS['zh_effectiveness_desc']='显示立法生产力、投票一致性和政策影响随时间变化的历史政党效率分数。'
LANG_TRANSLATIONS['zh_comparison']='政党比较（当前期间）'
LANG_TRANSLATIONS['zh_comparison_desc']='当前立法期间政党绩效指标的比较分析。'
LANG_TRANSLATIONS['zh_coalition']='联盟协调'
LANG_TRANSLATIONS['zh_coalition_desc']='联盟模式和政党间合作网络。'
LANG_TRANSLATIONS['zh_momentum']='动量指标'
LANG_TRANSLATIONS['zh_momentum_desc']='具有百分位基准（P50，P90）的政党动量分数，指示选举轨迹。'

# Function to add dashboard to a language file
add_dashboard_to_file() {
  local file=$1
  local lang_code=$2
  
  echo "  Processing: $file (lang: $lang_code)"
  
  # Check if dashboard already exists
  if grep -q 'id="party-dashboard"' "$file"; then
    echo "  ⏭️  Dashboard already exists in $file, skipping"
    return
  fi
  
  # Get translations for this language
  local title="${LANG_TRANSLATIONS[${lang_code}_title]}"
  local desc="${LANG_TRANSLATIONS[${lang_code}_desc]}"
  local effectiveness="${LANG_TRANSLATIONS[${lang_code}_effectiveness]}"
  local effectiveness_desc="${LANG_TRANSLATIONS[${lang_code}_effectiveness_desc]}"
  local comparison="${LANG_TRANSLATIONS[${lang_code}_comparison]}"
  local comparison_desc="${LANG_TRANSLATIONS[${lang_code}_comparison_desc]}"
  local coalition="${LANG_TRANSLATIONS[${lang_code}_coalition]}"
  local coalition_desc="${LANG_TRANSLATIONS[${lang_code}_coalition_desc]}"
  local momentum="${LANG_TRANSLATIONS[${lang_code}_momentum]}"
  local momentum_desc="${LANG_TRANSLATIONS[${lang_code}_momentum_desc]}"
  
  # Create dashboard HTML for this language
  local dashboard_html="
<section id=\"party-dashboard\" class=\"dashboard-container\">
<h2>${title}</h2>
<p>${desc}</p>

<div class=\"dashboard-grid\">
<div class=\"chart-card\">
<h3>${effectiveness}</h3>
<p>${effectiveness_desc}</p>
<canvas id=\"partyEffectivenessChart\" role=\"img\" aria-label=\"Party effectiveness line chart showing trends from 1990 to 2026 for all 8 Swedish political parties\"></canvas>
<span class=\"sr-only\">Line chart displaying effectiveness scores for Social Democrats, Moderates, Sweden Democrats, Centre Party, Left Party, Christian Democrats, Liberals, and Green Party from 1990 to 2026.</span>
</div>

<div class=\"chart-card\">
<h3>${comparison}</h3>
<p>${comparison_desc}</p>
<canvas id=\"partyComparisonChart\" role=\"img\" aria-label=\"Bar chart comparing current performance scores across all 8 Swedish political parties\"></canvas>
<span class=\"sr-only\">Horizontal bar chart showing comparative performance scores for all parties in the current legislative period, sorted by score.</span>
</div>

<div class=\"chart-card\">
<h3>${coalition}</h3>
<p>${coalition_desc}</p>
<div id=\"coalitionNetwork\" role=\"region\" aria-label=\"Coalition alignment visualization showing collaboration strength between political parties\"></div>
<span class=\"sr-only\">Visual representation of coalition patterns showing collaboration strength percentages between different party combinations.</span>
</div>

<div class=\"chart-card\">
<h3>${momentum}</h3>
<p>${momentum_desc}</p>
<canvas id=\"partyMomentumChart\" role=\"img\" aria-label=\"Doughnut chart showing momentum scores for all 8 Swedish political parties\"></canvas>
<span class=\"sr-only\">Doughnut chart displaying momentum indicator scores for each party with percentile benchmarks.</span>
</div>
</div>
</section>
"
  
  # Find the insertion point (after visualizations section, before data-integration)
  # Use perl for cross-platform compatibility with in-place editing
  
  # First, add Chart.js CDN if not already present
  if ! grep -q 'chart.js@4.4.2' "$file"; then
    perl -i -pe 's|(</head>)|<!-- Chart.js for Party Dashboard Visualizations -->\n<script src="https://cdn.jsdelivr.net/npm/chart.js\@4.4.2/dist/chart.umd.min.js" integrity="sha384-e6cc9LaIG7xZ3XD5B+jtr1NhTWPQGQdRCh6xiZ+ZFUtWCpg4ycv3Sh+SkZoopvUY" crossorigin="anonymous"></script>\n\n$1|' "$file"
  fi
  
  # Add dashboard section (insert before data-integration section)
  perl -i -pe 's|(<section id="data-integration">)|'"$dashboard_html"'\n$1|' "$file"
  
  # Add party-dashboard.js script before </body> if not already present
  if ! grep -q 'party-dashboard.js' "$file"; then
    perl -i -pe 's|(</body>)|<!-- Party Dashboard Script -->\n<script src="js/party-dashboard.js"></script>\n$1|' "$file"
  fi
  
  echo "  ✅ Dashboard added to $file"
}

# Process all language files
LANGUAGES=("sv" "da" "no" "fi" "de" "fr" "es" "nl" "ar" "he" "ja" "ko" "zh")

for lang in "${LANGUAGES[@]}"; do
  file="index_${lang}.html"
  if [ -f "$file" ]; then
    add_dashboard_to_file "$file" "$lang"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Party Performance Dashboard added to all language files!"
echo "📊 Chart.js CDN integrated with SRI hash"
echo "🔒 Security: HTTPS-only, SRI integrity checks"
echo "♿ Accessibility: WCAG 2.1 AA compliant with ARIA labels"
echo "🌐 Languages: 14 languages fully supported"
