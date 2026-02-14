import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  
  const filePath = join(__dirname, 'news', 'sample-economist-style.html');
  await page.goto(`file://${filePath}`);
  
  await page.screenshot({ 
    path: 'economist-style-article.png', 
    fullPage: true 
  });
  
  console.log('✅ Screenshot saved: economist-style-article.png');
  
  await browser.close();
})();
