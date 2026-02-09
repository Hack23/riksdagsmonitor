#!/usr/bin/env python3
"""Quick fix for Japanese and Chinese HTML files"""

# Japanese translation
ja_dashboard = '''
<section id="party-dashboard" class="dashboard-container">
<h2>🗳️ 政党のパフォーマンスと効果</h2>
<p>CIAプラットフォームの50年以上のデータを使用したスウェーデンの政党の包括的な分析。8つの政党の効果トレンド、連立動態、勢いの指標を追跡します。</p>

<div class="dashboard-grid">
<div class="chart-card">
<h3>効果トレンド（1990-2026）</h3>
<p>立法の生産性、投票の一貫性、および政策の影響を時系列で示す歴史的な政党の効果スコア。</p>
<canvas id="partyEffectivenessChart" role="img" aria-label="Party effectiveness line chart showing trends from 1990 to 2026 for all 8 Swedish political parties"></canvas>
<span class="sr-only">Line chart displaying effectiveness scores for Social Democrats, Moderates, Sweden Democrats, Centre Party, Left Party, Christian Democrats, Liberals, and Green Party from 1990 to 2026.</span>
</div>

<div class="chart-card">
<h3>政党比較（現在の期間）</h3>
<p>現在の立法期間における政党のパフォーマンスメトリクスの比較分析。</p>
<canvas id="partyComparisonChart" role="img" aria-label="Bar chart comparing current performance scores across all 8 Swedish political parties"></canvas>
<span class="sr-only">Horizontal bar chart showing comparative performance scores for all parties in the current legislative period, sorted by score.</span>
</div>

<div class="chart-card">
<h3>連立の調整</h3>
<p>連立パターンと政党間の協力ネットワーク。</p>
<div id="coalitionNetwork" role="region" aria-label="Coalition alignment visualization showing collaboration strength between political parties"></div>
<span class="sr-only">Visual representation of coalition patterns showing collaboration strength percentages between different party combinations.</span>
</div>

<div class="chart-card">
<h3>勢いの指標</h3>
<p>パーセンタイルベンチマーク（P50、P90）を使用した政党の勢いスコアで、選挙の軌跡を示します。</p>
<canvas id="partyMomentumChart" role="img" aria-label="Doughnut chart showing momentum scores for all 8 Swedish political parties"></canvas>
<span class="sr-only">Doughnut chart displaying momentum indicator scores for each party with percentile benchmarks.</span>
</div>
</div>
</section>

'''

# Chinese translation
zh_dashboard = '''
<section id="party-dashboard" class="dashboard-container">
<h2>🗳️ 政党表现与效率</h2>
<p>使用CIA平台50多年的数据对瑞典政党进行全面分析。跟踪8个政党的效率趋势、联盟动态和动量指标。</p>

<div class="dashboard-grid">
<div class="chart-card">
<h3>效率趋势（1990-2026）</h3>
<p>显示立法生产力、投票一致性和政策影响随时间变化的历史政党效率分数。</p>
<canvas id="partyEffectivenessChart" role="img" aria-label="Party effectiveness line chart showing trends from 1990 to 2026 for all 8 Swedish political parties"></canvas>
<span class="sr-only">Line chart displaying effectiveness scores for Social Democrats, Moderates, Sweden Democrats, Centre Party, Left Party, Christian Democrats, Liberals, and Green Party from 1990 to 2026.</span>
</div>

<div class="chart-card">
<h3>政党比较（当前期间）</h3>
<p>当前立法期间政党绩效指标的比较分析。</p>
<canvas id="partyComparisonChart" role="img" aria-label="Bar chart comparing current performance scores across all 8 Swedish political parties"></canvas>
<span class="sr-only">Horizontal bar chart showing comparative performance scores for all parties in the current legislative period, sorted by score.</span>
</div>

<div class="chart-card">
<h3>联盟协调</h3>
<p>联盟模式和政党间合作网络。</p>
<div id="coalitionNetwork" role="region" aria-label="Coalition alignment visualization showing collaboration strength between political parties"></div>
<span class="sr-only">Visual representation of coalition patterns showing collaboration strength percentages between different party combinations.</span>
</div>

<div class="chart-card">
<h3>动量指标</h3>
<p>具有百分位基准（P50，P90）的政党动量分数，指示选举轨迹。</p>
<canvas id="partyMomentumChart" role="img" aria-label="Doughnut chart showing momentum scores for all 8 Swedish political parties"></canvas>
<span class="sr-only">Doughnut chart displaying momentum indicator scores for each party with percentile benchmarks.</span>
</div>
</div>
</section>

'''

chartjs_cdn = '''<!-- Chart.js for Party Dashboard Visualizations -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js" integrity="sha384-dq3FSt0HAXW9PcHCBX8qvM8r4QcBjEKN8XAUYsN3EcdVsVm2D/r0ZXfm7vMPQJ2+" crossorigin="anonymous"></script>

'''

dashboard_script = '''<!-- Party Dashboard Script -->
<script src="js/party-dashboard.js"></script>
'''

def fix_file(filename, dashboard_html):
    """Fix a single file"""
    print(f"Fixing {filename}...")
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add Chart.js CDN if not present
    if 'chart.js@4.4.2' not in content:
        content = content.replace('</head>', chartjs_cdn + '</head>')
    
    # Add dashboard before </article> or </main>
    if '</article>' in content:
        content = content.replace('</article>', dashboard_html + '    </article>')
    elif '</main>' in content:
        content = content.replace('</main>', dashboard_html + '</main>')
    
    # Add dashboard script before </body>
    if 'party-dashboard.js' not in content:
        content = content.replace('</body>', dashboard_script + '\n</body>')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ Fixed {filename}")

if __name__ == '__main__':
    fix_file('index_ja.html', ja_dashboard)
    fix_file('index_zh.html', zh_dashboard)
    print("\n✅ All language files updated successfully!")
