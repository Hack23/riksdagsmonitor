import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://riksdagsmonitor.com';
const langs = ['', '_sv', '_da', '_no', '_fi', '_de', '_fr', '_es', '_nl', '_ar', '_he', '_ja', '_ko', '_zh'];
const dashboards = [
  '/dashboard/index',
  '/dashboards/election-cycle',
  '/dashboards/parties',
  '/dashboards/committees',
  '/dashboards/coalitions',
  '/dashboards/seasonal-patterns',
  '/dashboards/pre-election',
  '/dashboards/anomaly-detection',
  '/dashboards/ministers',
  '/dashboards/risk',
];

const onlyEnglish = process.env.ONLY_EN === '1';
const usedLangs = onlyEnglish ? [''] : langs;

const browser = await chromium.launch();
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });

const results = [];
let total = 0, withErrors = 0;
for (const d of dashboards) {
  for (const l of usedLangs) {
    const url = `${BASE}${d}${l}.html`;
    const page = await ctx.newPage();
    const errors = [];
    const failed = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', e => errors.push(`PAGEERR: ${e.message}`));
    page.on('requestfailed', req => failed.push(`${req.failure()?.errorText} ${req.url()}`));
    page.on('response', resp => { if (resp.status() >= 400) failed.push(`${resp.status()} ${resp.url()}`); });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
    } catch (e) {
      errors.push(`NAV: ${e.message}`);
    }
    total++;
    if (errors.length || failed.length) withErrors++;
    if (errors.length || failed.length) {
      results.push({ url, errors, failed });
    }
    await page.close();
  }
}
await browser.close();

console.log(`\n=== Summary: ${withErrors}/${total} pages had errors ===\n`);
for (const r of results) {
  console.log(`\n--- ${r.url} ---`);
  for (const e of r.errors.slice(0, 10)) console.log(`  ERR: ${e}`);
  for (const f of r.failed.slice(0, 10)) console.log(`  REQ: ${f}`);
}
