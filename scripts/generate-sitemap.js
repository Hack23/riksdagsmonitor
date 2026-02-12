import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '../');
const NEWS_DIR = path.join(__dirname, '../news');
const BASE_URL = 'https://riksdagsmonitor.com';

function main() {
    let urls = [];

    // Add root pages
    if (fs.existsSync(ROOT_DIR)) {
        const rootFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.html'));
        rootFiles.forEach(f => {
            urls.push({
                loc: `${BASE_URL}/${f}`,
                lastmod: new Date().toISOString().split('T')[0],
                priority: f === 'index.html' ? '1.0' : '0.8'
            });
        });
    }

    // Add news pages
    if (fs.existsSync(NEWS_DIR)) {
        const newsFiles = fs.readdirSync(NEWS_DIR).filter(f => f.endsWith('.html'));
        newsFiles.forEach(f => {
            urls.push({
                loc: `${BASE_URL}/news/${f}`,
                lastmod: new Date().toISOString().split('T')[0],
                priority: f.startsWith('index') ? '0.7' : '0.6'
            });
        });
    }

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapContent);
    console.log(`Generated sitemap with ${urls.length} URLs.`);
}

main();
