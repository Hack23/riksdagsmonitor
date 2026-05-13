import { chromium } from 'playwright';
const url = process.argv[2] || 'https://riksdagsmonitor.com/dashboard/index.html';
const browser = await chromium.launch();
const page = await browser.newPage();
const scripts = [];
page.on('response', async resp => {
  const ct = resp.headers()['content-type'] || '';
  if (ct.includes('javascript') || ct.includes('module')) {
    scripts.push({ url: resp.url(), status: resp.status() });
  }
});
page.on('pageerror', e => console.log('PAGEERR:', e.message));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
console.log('\nLoaded JS:');
scripts.forEach(s => console.log(s.status, s.url));
await browser.close();
