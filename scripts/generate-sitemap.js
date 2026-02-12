import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://riksdagsmonitor.com';
const NEWS_DIR = path.join(__dirname, '../news');
const ROOT_DIR = path.join(__dirname, '..');

function getFiles(dir, extension) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(file => file.endsWith(extension));
}

function generateSitemap() {
    const newsFiles = getFiles(NEWS_DIR, '.html');
    const rootFiles = getFiles(ROOT_DIR, '.html').filter(f => 
        f.startsWith('index') || 
        f.startsWith('sitemap') || 
        f === 'politician-dashboard.html'
    );

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Add root files
    rootFiles.forEach(file => {
        const priority = file === 'index.html' ? '1.0' : '0.8';
        xml += '  <url>\n    <loc>' + BASE_URL + '/' + file + '</loc>\n    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n    <priority>' + priority + '</priority>\n  </url>\n';
    });

    // Add news files
    newsFiles.forEach(file => {
        const isEnglish = file.endsWith('-en.html');
        const alternateFile = isEnglish ? file.replace('-en.html', '-sv.html') : file.replace('-sv.html', '-en.html');
        
        xml += '  <url>\n    <loc>' + BASE_URL + '/news/' + file + '</loc>\n    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n    <priority>0.7</priority>\n';
        
        if (newsFiles.includes(alternateFile)) {
            const lang = isEnglish ? 'sv' : 'en';
            xml += '    <xhtml:link rel="alternate" hreflang="' + lang + '" href="' + BASE_URL + '/news/' + alternateFile + '" />\n';
            // Self-referencing hreflang
            const selfLang = isEnglish ? 'en' : 'sv';
            xml += '    <xhtml:link rel="alternate" hreflang="' + selfLang + '" href="' + BASE_URL + '/news/' + file + '" />\n';
        }
        
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), xml);
    console.log('Sitemap generated with ' + (rootFiles.length + newsFiles.length) + ' URLs');
}

generateSitemap();
