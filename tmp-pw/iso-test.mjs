import { chromium } from 'playwright';
import fs from 'node:fs';
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script type="module">
${fs.readFileSync('/tmp/papa-cdn.js','utf8').replace(/^import [^;]+;\n*/gm,'// import stripped\n')}
</script>
</body></html>`;
fs.writeFileSync('/tmp/papa-test.html', html);
const browser = await chromium.launch();
const page = await browser.newPage();
const client = await page.context().newCDPSession(page);
await client.send('Runtime.enable');
client.on('Runtime.exceptionThrown', e => {
  console.log('EXC line:', e.exceptionDetails.lineNumber, 'col:', e.exceptionDetails.columnNumber);
  console.log('text:', e.exceptionDetails.text, e.exceptionDetails.exception?.description);
});
await page.goto('file:///tmp/papa-test.html');
await page.waitForTimeout(2000);
await browser.close();
