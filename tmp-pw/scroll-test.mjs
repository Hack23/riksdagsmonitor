import { chromium } from 'playwright';
const urls = [
  'https://riksdagsmonitor.com/dashboards/election-cycle.html',
  'https://riksdagsmonitor.com/dashboards/parties.html',
  'https://riksdagsmonitor.com/dashboards/committees.html',
  'https://riksdagsmonitor.com/dashboards/coalitions.html',
  'https://riksdagsmonitor.com/dashboards/seasonal-patterns.html',
  'https://riksdagsmonitor.com/dashboards/pre-election.html',
  'https://riksdagsmonitor.com/dashboards/anomaly-detection.html',
  'https://riksdagsmonitor.com/dashboards/ministers.html',
  'https://riksdagsmonitor.com/dashboards/risk.html',
];
const browser = await chromium.launch();
for (const url of urls) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`PAGEERR: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`CONS: ${m.text()}`); });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
  console.log(`\n${url}: ${errors.length} errors`);
  errors.slice(0,5).forEach(e => console.log('  ', e));
  await page.close();
}
await browser.close();
