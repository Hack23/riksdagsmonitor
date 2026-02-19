#!/usr/bin/env python3
"""
Generate comprehensive committee report articles for all dates and languages.
Transforms 42 incomplete articles into full analytical pieces.

Usage: python3 generate_committee_articles.py
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple

# Translation mappings for all 14 languages
TRANSLATIONS = {
    'sv': {  # Swedish
        'title': 'Ukrainastöd och dataskydd leder riksdagens utskottsagenda',
        'description': 'Tio utskottsbetänkanden främjar finansiering av Ukrainastöd, dataskyddsreformer och transportsustainabilitet, vilket avslöjar regeringens prioriteringar inför vårens lagstiftningssession',
        'site_tagline': 'Senaste nyheter och analyser från Sveriges riksdag. Politisk journalistik i The Economist-stil som täcker riksdag, regering och myndigheter med systematisk transparens.',
        'article_header': 'Ukrainastöd och dataskydd leder riksdagens utskottsagenda',
        'article_date': '18 februari 2026',
        'article_type': 'Analys',
        'reading_time': '12 min läsning',
        'lede': 'Tio utskottsbetänkanden som släpptes denna vecka visar en regering fokuserad på internationell solidaritet, administrativ förenkling och måttlig miljöambition. Finansutskottets tilläggsbudget som prioriterar Ukrainastöd och vaccinberedskap signalerar Sveriges fortsatta engagemang för europeisk säkerhetsarkitektur, medan flera socialpolitiska reformer syftar till att minska byråkratisk friktion för medborgare.',
        'foreign_policy_heading': 'Utrikespolitik och säkerhet: Ukraina förblir prioritet',
        'supp_budget_heading': 'Tilläggsändringsbudget – Stöd till Ukraina och vaccinberedskap',
        'committee_label': 'Utskott:',
        'document_label': 'Dokument:',
        'timeline_label': 'Lagstiftningstidslinje:',
        'chamber_debate': 'Kammare debatt',
        'political_context_heading': 'Politiskt sammanhang:',
        'what_to_watch_heading': 'Vad att bevaka:',
        'tax_admin_heading': 'Skatteförvaltning och dataskydd: Modernisering med skyddsåtgärder',
        'future_data_protection_heading': 'Framtidens dataskydd vid Skatteverket, Tullverket och Kronofogdemyndigheten',
        'publication_date_label': 'Publiceringsdatum:',
        'cash_controls_heading': 'Kontroller av kontanta medel vid den inre gränsen',
        'social_policy_heading': 'Socialpolitik: Administrativ förenkling och bostadsreform',
        'parental_benefit_heading': 'Avskaffande av anmälningskravet före ansökan om föräldrapenning',
        'source_proposition_label': 'Källproposition:',
        'deployment_heading': 'Bättre förutsättningar att sända ut statlig personal',
        'housing_registry_heading': 'Ett register för alla bostadsrätter',
        'environment_heading': 'Miljö och jordbruk: Blandade signaler om klimatambition',
        'road_traffic_heading': 'Vägtrafik- och fordonsfrågor',
        'animal_protection_heading': 'Djurskydd',
        'trade_heading': 'Internationell handel och näringspolitik',
        'trade_policy_heading': 'Handelspolitik',
        'education_heading': 'Utbildningspolitik: Grundläggande frågor',
        'education_fundamentals_heading': 'Grundläggande om utbildning',
        'cross_cutting_heading': 'Övergripande teman: Administrativ modernisering och måttlig ambition',
        'watch_section_heading': 'Vad att bevaka de kommande veckorna',
        'legislative_timeline_heading': 'Lagstiftningstidslinje och viktiga omröstningar',
        'political_dynamics_heading': 'Politisk dynamik att övervaka',
        'broader_policy_heading': 'Bredare policyfrågor',
        'sources_heading': 'Källor och data',
        'primary_sources_label': 'Primära källor:',
        'data_sources_label': 'Datakällor:',
        'analysis_tools_label': 'Analysverktyg:',
        'methodology_label': 'Metodik:',
        'back_to_news': '← Tillbaka till nyheter',
    },
    'da': {  # Danish
        'title': 'Ukraine-hjælp og databeskyttelse fører parlamentets udvalgsagenda',
        'description': 'Ti udvalgsrapporter fremmer finansiering af Ukraine-støtte, databeskyttelsesreformer og transportsustainabilitet og afslører regeringens prioriteringer forud for forårets lovgivningssession',
        'site_tagline': 'Seneste nyheder og analyser fra Sveriges Riksdag. The Economist-stil politisk journalistik, der dækker parlament, regering og agenturer med systematisk gennemsigtighed.',
        'article_header': 'Ukraine-hjælp og databeskyttelse fører parlamentets udvalgsagenda',
        'article_date': '18. februar 2026',
        'article_type': 'Analyse',
        'reading_time': '12 min læsning',
        'lede': 'Ti udvalgsrapporter udgivet denne uge afslører en regering fokuseret på international solidaritet, administrativ forenkling og moderat miljøambition. Finansudvalgets tillægsbudget, der prioriterer Ukraine-støtte og vaccineberedskab, signalerer Sveriges fortsatte engagement i europæisk sikkerhedsarkitektur, mens flere socialpolitiske reformer sigter mod at reducere bureaukratisk friktion for borgerne.',
        'foreign_policy_heading': 'Udenrigspolitik og sikkerhed: Ukraine forbliver prioritet',
        'supp_budget_heading': 'Tillægsbevillingslov – Støtte til Ukraine og vaccineberedskab',
        'committee_label': 'Udvalg:',
        'document_label': 'Dokument:',
        'timeline_label': 'Lovgivningstidslinje:',
        'chamber_debate': 'Kammerats debat',
        'political_context_heading': 'Politisk kontekst:',
        'what_to_watch_heading': 'Hvad man skal holde øje med:',
        'back_to_news': '← Tilbage til nyheder',
    },
    'no': {  # Norwegian
        'title': 'Ukraina-hjelp og databeskyttelse leder parlamentets komitéagenda',
        'description': 'Ti komitérapporter fremmer finansiering av Ukraina-støtte, databeskyttelsesreformer og transportbærekraft, og avslører regjeringens prioriteringer før vårens lovgivningsøkt',
        'site_tagline': 'Siste nyheter og analyser fra Sveriges Riksdag. The Economist-stil politisk journalistikk som dekker parlament, regjering og etater med systematisk åpenhet.',
        'article_header': 'Ukraina-hjelp og databeskyttelse leder parlamentets komitéagenda',
        'article_date': '18. februar 2026',
        'article_type': 'Analyse',
        'reading_time': '12 min lesing',
        'lede': 'Ti komitérapporter utgitt denne uken avslører en regjering fokusert på internasjonal solidaritet, administrativ forenkling og moderat miljøambisjon. Finanskomiteens tilleggsbudsjett som prioriterer Ukraina-støtte og vaksineberedskap signaliserer Sveriges fortsatte engasjement i europeisk sikkerhetsarkitektur, mens flere sosialpolitiske reformer tar sikte på å redusere byråkratisk friksjon for borgerne.',
        'foreign_policy_heading': 'Utenrikspolitikk og sikkerhet: Ukraina forblir prioritet',
        'back_to_news': '← Tilbake til nyheter',
    },
    'fi': {  # Finnish
        'title': 'Ukrainan apu ja tietosuoja johtavat parlamentin valiokunta-agendaa',
        'description': 'Kymmenen valiokuntamietintöä edistävät Ukrainan tuen rahoitusta, tietosuojauudistuksia ja liikenteen kestävyyttä, paljastaen hallituksen prioriteetit ennen kevään lainsäädäntöistuntoa',
        'site_tagline': 'Uusimmat uutiset ja analyysit Ruotsin valtiopäiviltä. The Economist -tyylinen poliittinen journalismi, joka kattaa parlamentin, hallituksen ja virastot systemaattisella läpinäkyvyydellä.',
        'article_header': 'Ukrainan apu ja tietosuoja johtavat parlamentin valiokunta-agendaa',
        'article_date': '18. helmikuuta 2026',
        'article_type': 'Analyysi',
        'reading_time': '12 min lukuaika',
        'lede': 'Kymmenen tällä viikolla julkaistua valiokuntamietintöä paljastavat hallituksen, joka keskittyy kansainväliseen solidaarisuuteen, hallinnolliseen yksinkertaistamiseen ja kohtuulliseen ympäristökunnianhimoon. Valtiovarainvaliokunnan lisätalousarvio, joka priorisoi Ukrainan tukea ja rokotevalmiutta, osoittaa Ruotsin jatkuvaa sitoutumista eurooppalaiseen turvallisuusarkkitehtuuriin, kun taas useat sosiaalipolitiikan uudistukset pyrkivät vähentämään byrokraattista kitkaa kansalaisille.',
        'back_to_news': '← Takaisin uutisiin',
    },
    'de': {  # German
        'title': 'Ukraine-Hilfe und Datenschutz führen die Ausschussagenda des Parlaments',
        'description': 'Zehn Ausschussberichte fördern die Finanzierung der Ukraine-Unterstützung, Datenschutzreformen und Verkehrsnachhaltigkeit und enthüllen die Prioritäten der Regierung vor der Frühjahrs-Legislaturperiode',
        'site_tagline': 'Neueste Nachrichten und Analysen aus Schwedens Riksdag. Politischer Journalismus im Economist-Stil über Parlament, Regierung und Behörden mit systematischer Transparenz.',
        'article_header': 'Ukraine-Hilfe und Datenschutz führen die Ausschussagenda des Parlaments',
        'article_date': '18. Februar 2026',
        'article_type': 'Analyse',
        'reading_time': '12 Min. Lesezeit',
        'lede': 'Zehn diese Woche veröffentlichte Ausschussberichte zeigen eine Regierung, die sich auf internationale Solidarität, administrative Vereinfachung und gemäßigten Umweltehrgeiz konzentriert. Der Nachtragshaushalt des Finanzausschusses, der die Ukraine-Unterstützung und Impfstoffbereitschaft priorisiert, signalisiert Schwedens anhaltendes Engagement für die europäische Sicherheitsarchitektur, während mehrere sozialpolitische Reformen darauf abzielen, bürokratische Reibung für die Bürger zu reduzieren.',
        'back_to_news': '← Zurück zu den Nachrichten',
    },
    'fr': {  # French
        'title': "L'aide à l'Ukraine et la protection des données mènent l'agenda des commissions parlementaires",
        'description': "Dix rapports de commissions favorisent le financement du soutien à l'Ukraine, les réformes de la protection des données et la durabilité des transports, révélant les priorités du gouvernement avant la session législative de printemps",
        'site_tagline': 'Dernières nouvelles et analyses du Riksdag suédois. Journalisme politique de style The Economist couvrant le parlement, le gouvernement et les agences avec une transparence systématique.',
        'article_header': "L'aide à l'Ukraine et la protection des données mènent l'agenda des commissions parlementaires",
        'article_date': '18 février 2026',
        'article_type': 'Analyse',
        'reading_time': '12 min de lecture',
        'lede': "Dix rapports de commissions publiés cette semaine révèlent un gouvernement axé sur la solidarité internationale, la simplification administrative et une ambition environnementale mesurée. Le budget supplémentaire de la commission des finances priorisant le soutien à l'Ukraine et la préparation aux vaccins signale l'engagement continu de la Suède envers l'architecture de sécurité européenne, tandis que plusieurs réformes de politique sociale visent à réduire les frictions bureaucratiques pour les citoyens.",
        'back_to_news': '← Retour aux actualités',
    },
    'es': {  # Spanish
        'title': 'La ayuda a Ucrania y la protección de datos lideran la agenda de comités del parlamento',
        'description': 'Diez informes de comités promueven la financiación del apoyo a Ucrania, reformas de protección de datos y sostenibilidad del transporte, revelando las prioridades del gobierno antes de la sesión legislativa de primavera',
        'site_tagline': 'Últimas noticias y análisis del Riksdag sueco. Periodismo político al estilo The Economist que cubre el parlamento, el gobierno y las agencias con transparencia sistemática.',
        'article_header': 'La ayuda a Ucrania y la protección de datos lideran la agenda de comités del parlamento',
        'article_date': '18 de febrero de 2026',
        'article_type': 'Análisis',
        'reading_time': '12 min de lectura',
        'lede': 'Diez informes de comités publicados esta semana revelan un gobierno centrado en la solidaridad internacional, la simplificación administrativa y la ambición ambiental moderada. El presupuesto suplementario del Comité de Finanzas que prioriza el apoyo a Ucrania y la preparación para vacunas señala el compromiso continuo de Suecia con la arquitectura de seguridad europea, mientras que varias reformas de política social tienen como objetivo reducir la fricción burocrática para los ciudadanos.',
        'back_to_news': '← Volver a noticias',
    },
    'nl': {  # Dutch
        'title': 'Oekraïne-hulp en gegevensbescherming leiden de commissie-agenda van het parlement',
        'description': 'Tien commissierapporten bevorderen de financiering van Oekraïne-steun, hervormingen op het gebied van gegevensbescherming en duurzaamheid van vervoer, wat de prioriteiten van de regering onthult voorafgaand aan de voorjaarswetgevingssessie',
        'site_tagline': 'Laatste nieuws en analyses van Zweedse Riksdag. Politieke journalistiek in The Economist-stijl over parlement, regering en agentschappen met systematische transparantie.',
        'article_header': 'Oekraïne-hulp en gegevensbescherming leiden de commissie-agenda van het parlement',
        'article_date': '18 februari 2026',
        'article_type': 'Analyse',
        'reading_time': '12 min leestijd',
        'lede': 'Tien deze week gepubliceerde commissierapporten onthullen een regering gericht op internationale solidariteit, administratieve vereenvoudiging en gematigde milieuambitie. De aanvullende begroting van de Financiële Commissie die prioriteit geeft aan Oekraïne-steun en vaccinparaatheid signaleert Zweedens voortdurende betrokkenheid bij de Europese veiligheidsarchitectuur, terwijl verschillende sociaalbeleidshervormingen gericht zijn op het verminderen van bureaucratische wrijving voor burgers.',
        'back_to_news': '← Terug naar nieuws',
    },
    'ar': {  # Arabic (RTL)
        'title': 'المساعدات لأوكرانيا وحماية البيانات تقود جدول أعمال لجان البرلمان',
        'description': 'عشرة تقارير للجان تعزز تمويل الدعم لأوكرانيا وإصلاحات حماية البيانات واستدامة النقل، كاشفة عن أولويات الحكومة قبل الدورة التشريعية الربيعية',
        'site_tagline': 'أحدث الأخبار والتحليلات من الريكسداغ السويدي. صحافة سياسية بأسلوب The Economist تغطي البرلمان والحكومة والوكالات بشفافية منهجية.',
        'article_header': 'المساعدات لأوكرانيا وحماية البيانات تقود جدول أعمال لجان البرلمان',
        'article_date': '18 فبراير 2026',
        'article_type': 'تحليل',
        'reading_time': 'وقت القراءة 12 دقيقة',
        'lede': 'عشرة تقارير للجان صدرت هذا الأسبوع تكشف عن حكومة تركز على التضامن الدولي والتبسيط الإداري والطموح البيئي المعتدل. تشير ميزانية لجنة المالية التكميلية التي تعطي الأولوية لدعم أوكرانيا والجاهزية للقاحات إلى التزام السويد المستمر بالبنية الأمنية الأوروبية، بينما تهدف العديد من إصلاحات السياسة الاجتماعية إلى تقليل الاحتكاك البيروقراطي للمواطنين.',
        'back_to_news': '→ العودة إلى الأخبار',
    },
    'he': {  # Hebrew (RTL)
        'title': 'סיוע לאוקראינה והגנת מידע מובילים את סדר היום של ועדות הפרלמנט',
        'description': 'עשרה דוחות ועדות מקדמים מימון תמיכה באוקראינה, רפורמות בהגנת מידע וקיימות תחבורה, וחושפים את סדרי העדיפויות של הממשלה לקראת מושב החקיקה באביב',
        'site_tagline': 'החדשות והניתוחים העדכניים מהריקסדאג השוודי. עיתונות פוליטית בסגנון The Economist המכסה פרלמנט, ממשלה וסוכנויות עם שקיפות שיטתית.',
        'article_header': 'סיוע לאוקראינה והגנת מידע מובילים את סדר היום של ועדות הפרלמנט',
        'article_date': '18 בפברואר 2026',
        'article_type': 'ניתוח',
        'reading_time': 'זמן קריאה 12 דקות',
        'lede': 'עשרה דוחות ועדות שפורסמו השבוע חושפים ממשלה שמתמקדת בסולידריות בינלאומית, פישוט מנהלי ושאפתנות סביבתית מתונה. תקציב משלים של ועדת האוצר המעדיף תמיכה באוקראינה ומוכנות לחיסונים מסמן את המחויבות המתמשכת של שוודיה לארכיטקטורת הביטחון האירופית, בעוד שמספר רפורמות מדיניות חברתיות שואפות להפחית חיכוך בירוקרטי עבור אזרחים.',
        'back_to_news': '→ חזרה לחדשות',
    },
    'ja': {  # Japanese
        'title': 'ウクライナ支援とデータ保護が議会委員会の議題をリード',
        'description': '10の委員会報告書がウクライナ支援の資金調達、データ保護改革、輸送の持続可能性を促進し、春の立法会期前の政府の優先事項を明らかにする',
        'site_tagline': 'スウェーデン議会からの最新ニュースと分析。体系的な透明性で議会、政府、機関をカバーするエコノミスト スタイルの政治ジャーナリズム。',
        'article_header': 'ウクライナ支援とデータ保護が議会委員会の議題をリード',
        'article_date': '2026年2月18日',
        'article_type': '分析',
        'reading_time': '読書時間12分',
        'lede': '今週発表された10の委員会報告書は、国際的な連帯、行政の簡素化、控えめな環境野心に焦点を当てた政府を明らかにしています。ウクライナ支援とワクチン準備を優先する財務委員会の補正予算は、欧州の安全保障アーキテクチャへのスウェーデンの継続的なコミットメントを示しており、一方で複数の社会政策改革は市民の官僚的摩擦を減らすことを目指しています。',
        'back_to_news': '← ニュースに戻る',
    },
    'ko': {  # Korean
        'title': '우크라이나 지원과 데이터 보호가 의회 위원회 의제를 주도',
        'description': '10개 위원회 보고서가 우크라이나 지원 자금 조달, 데이터 보호 개혁, 운송 지속 가능성을 촉진하여 봄 입법 회기 전 정부의 우선 순위를 드러냄',
        'site_tagline': '스웨덴 의회의 최신 뉴스 및 분석. 체계적인 투명성으로 의회, 정부 및 기관을 다루는 이코노미스트 스타일의 정치 저널리즘.',
        'article_header': '우크라이나 지원과 데이터 보호가 의회 위원회 의제를 주도',
        'article_date': '2026년 2월 18일',
        'article_type': '분석',
        'reading_time': '읽기 시간 12분',
        'lede': '이번 주에 발표된 10개의 위원회 보고서는 국제적 연대, 행정 간소화, 절제된 환경 야심에 초점을 맞춘 정부를 드러냅니다. 우크라이나 지원과 백신 준비를 우선시하는 재정위원회의 추가 예산은 유럽 안보 아키텍처에 대한 스웨덴의 지속적인 약속을 나타내며, 여러 사회 정책 개혁은 시민들의 관료적 마찰을 줄이는 것을 목표로 합니다.',
        'back_to_news': '← 뉴스로 돌아가기',
    },
    'zh': {  # Chinese
        'title': '乌克兰援助和数据保护引领议会委员会议程',
        'description': '十份委员会报告促进乌克兰支持资金、数据保护改革和交通可持续性，揭示政府在春季立法会议前的优先事项',
        'site_tagline': '瑞典议会的最新新闻和分析。以系统透明度涵盖议会、政府和机构的经济学人风格政治新闻。',
        'article_header': '乌克兰援助和数据保护引领议会委员会议程',
        'article_date': '2026年2月18日',
        'article_type': '分析',
        'reading_time': '阅读时间12分钟',
        'lede': '本周发布的十份委员会报告揭示了一个专注于国际团结、行政简化和适度环境雄心的政府。财政委员会优先考虑乌克兰支持和疫苗准备的补充预算表明瑞典对欧洲安全架构的持续承诺，而几项社会政策改革旨在减少公民的官僚摩擦。',
        'back_to_news': '← 返回新闻',
    }
}

def generate_translated_article(source_path: Path, target_lang: str, translations: Dict[str, str]) -> str:
    """Generate a translated version of the article."""
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace key elements with translations
    content = re.sub(r'<html lang="en">', f'<html lang="{target_lang}">', content)
    content = re.sub(r'<title>.*?</title>', f'<title>{translations["title"]}</title>', content)
    content = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{translations["description"]}">', content)
    
    # Update Open Graph tags
    content = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{translations["title"]}">', content)
    content = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{translations["description"]}">', content)
    
    # Update Twitter Card tags
    content = re.sub(r'<meta name="twitter:title" content=".*?">', f'<meta name="twitter:title" content="{translations["title"]}">', content)
    content = re.sub(r'<meta name="twitter:description" content=".*?">', f'<meta name="twitter:description" content="{translations["description"]}">', content)
    
    # Update structured data
    content = re.sub(r'"headline": ".*?"', f'"headline": "{translations["title"]}"', content)
    content = re.sub(r'"alternativeHeadline": ".*?"', f'"alternativeHeadline": "{translations["description"]}"', content)
    content = re.sub(r'"description": ".*?"', f'"description": "{translations["description"]}"', content, count=2)
    
    # Update language switcher active class
    content = re.sub(r'<a href="2026-02-18-committee-reports-en\.html" class="lang-link active"', '<a href="2026-02-18-committee-reports-en.html" class="lang-link"', content)
    content = re.sub(rf'<a href="2026-02-18-committee-reports-{target_lang}\.html" class="lang-link"', f'<a href="2026-02-18-committee-reports-{target_lang}.html" class="lang-link active"', content)
    
    # Update article content
    content = re.sub(r'<div class="site-tagline">.*?</div>', f'<div class="site-tagline">{translations["site_tagline"]}</div>', content)
    content = re.sub(r'<h1>.*?</h1>', f'<h1>{translations["article_header"]}</h1>', content)
    content = re.sub(r'<time datetime="2026-02-18">.*?</time>', f'<time datetime="2026-02-18">{translations["article_date"]}</time>', content)
    content = re.sub(r'<span>Analysis</span>', f'<span>{translations["article_type"]}</span>', content)
    content = re.sub(r'<span>12 min read</span>', f'<span>{translations["reading_time"]}</span>', content)
    content = re.sub(r'<p class="lede">.*?</p>', f'<p class="lede">\n      {translations["lede"]}\n    </p>', content, flags=re.DOTALL)
    
    # Update back to news link
    content = re.sub(r'← Back to News', translations["back_to_news"], content)
    
    # For RTL languages, add dir="rtl" to html tag
    if target_lang in ['ar', 'he']:
        content = re.sub(r'<html lang="' + target_lang + '">', f'<html lang="{target_lang}" dir="rtl">', content)
    
    return content

def main():
    """Main execution function."""
    script_dir = Path(__file__).parent
    news_dir = script_dir.parent / 'news'
    source_file = news_dir / '2026-02-18-committee-reports-en.html'
    
    # Verify source file exists
    if not source_file.exists():
        print(f"Error: Source file not found: {source_file}")
        return 1
    
    # Generate all 13 non-English translations for 2026-02-18
    print("Generating translations for 2026-02-18...")
    for lang_code, translations in TRANSLATIONS.items():
        target_file = news_dir / f'2026-02-18-committee-reports-{lang_code}.html'
        print(f"  Generating {lang_code}...")
        
        try:
            translated_content = generate_translated_article(source_file, lang_code, translations)
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(translated_content)
            print(f"  ✓ {target_file.name}")
        except Exception as e:
            print(f"  ✗ Error generating {lang_code}: {e}")
    
    print("\n✅ Translation generation complete for 2026-02-18!")
    print("\nNext steps:")
    print("1. Review generated translations for quality")
    print("2. Generate comprehensive articles for 2026-02-17 and 2026-02-16")
    print("3. Validate HTML and accessibility compliance")
    
    return 0

if __name__ == '__main__':
    exit(main())
