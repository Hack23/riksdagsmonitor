import { chromium } from 'playwright';
const url = process.argv[2] || 'https://riksdagsmonitor.com/dashboard/index.html';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const client = await page.context().newCDPSession(page);
await client.send('Runtime.enable');
client.on('Runtime.exceptionThrown', e => {
  console.log('EXC:', JSON.stringify(e.exceptionDetails, null, 2));
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
await browser.close();
