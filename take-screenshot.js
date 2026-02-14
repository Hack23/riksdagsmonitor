import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to the sample article
  await page.goto('http://localhost:8080/news/2026-02-14-sample-no-embedded-css-en.html');
  
  // Wait for content to load
  await page.waitForLoadState('networkidle');
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'news-article-screenshot.png', 
    fullPage: true 
  });
  
  console.log('✅ Screenshot saved: news-article-screenshot.png');
  
  await browser.close();
  process.exit(0);
})();
