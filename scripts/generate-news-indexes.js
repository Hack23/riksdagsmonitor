import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.join(__dirname, '../news');
const TEMPLATE_PATH = path.join(__dirname, '../index.html'); // Fallback or base
const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

// Cyberpunk theme constants
const THEME = {
    cyan: '#00d9ff',
    magenta: '#ff006e',
    yellow: '#ffbe0b',
    dark: '#0a0e27',
    text: '#e0e0e0'
};

function parseArticle(filename) {
    const content = fs.readFileSync(path.join(NEWS_DIR, filename), 'utf8');
    
    const getMeta = (prop) => {
        const match = content.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`));
        return match ? match[1] : '';
    };

    return {
        filename,
        title: getMeta('og:title'),
        description: getMeta('og:description'),
        date: getMeta('article:published_time'),
        tags: getMeta('article:tag').split(',').map(t => t.trim()).filter(Boolean),
        lang: filename.endsWith('-sv.html') ? 'sv' : 'en'
    };
}

function generateCard(article) {
    return `
    <article class="news-card" onclick="window.location.href='news/${article.filename}'">
        <div class="card-date">${article.date}</div>
        <h3>${article.title}</h3>
        <p>${article.description}</p>
        <div class="tags">
            ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
    </article>
    `;
}

function generateIndexHTML(lang, articles) {
    const isRtl = ['ar', 'he'].includes(lang);
    const direction = isRtl ? 'rtl' : 'ltr';
    const langArticles = articles.filter(a => a.lang === (lang === 'sv' ? 'sv' : 'en')); // Fallback to EN for others

    // Basic HTML structure matching the project style
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${direction}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riksdagsmonitor News - ${lang.toUpperCase()}</title>
    <link rel="stylesheet" href="../styles.css">
    <style>
        .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        .news-card {
            background: rgba(10, 14, 39, 0.8);
            border: 1px solid var(--primary-cyan, #00d9ff);
            padding: 20px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .news-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 0 15px var(--primary-cyan, #00d9ff);
        }
        .card-date {
            color: var(--primary-yellow, #ffbe0b);
            font-size: 0.8em;
            margin-bottom: 10px;
        }
        .tags {
            margin-top: 15px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .tag {
            background: rgba(0, 217, 255, 0.1);
            border: 1px solid var(--primary-cyan, #00d9ff);
            padding: 2px 8px;
            font-size: 0.8em;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <header>
        <nav>
            <a href="../index.html">Home</a>
            <h1>News Archive</h1>
        </nav>
    </header>
    <main>
        <div class="news-grid">
            ${langArticles.map(generateCard).join('')}
        </div>
    </main>
</body>
</html>`;
}

function main() {
    if (!fs.existsSync(NEWS_DIR)) {
        console.log('No news directory found.');
        return;
    }

    const files = fs.readdirSync(NEWS_DIR).filter(f => f.endsWith('.html') && !f.startsWith('index'));
    const articles = files.map(parseArticle).sort((a, b) => new Date(b.date) - new Date(a.date));

    LANGUAGES.forEach(lang => {
        const html = generateIndexHTML(lang, articles);
        fs.writeFileSync(path.join(NEWS_DIR, `index_${lang}.html`), html);
        if (lang === 'en') fs.writeFileSync(path.join(NEWS_DIR, 'index.html'), html);
    });

    console.log(`Generated indexes for ${LANGUAGES.length} languages.`);
}

main();
