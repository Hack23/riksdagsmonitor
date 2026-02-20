/**
 * Generate HTML report from Cypress E2E test log output
 *
 * Reads e2e-output.log and produces a styled index.html
 * with test status summary and full log output.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const fs = require('fs');
const path = require('path');

const logPath = path.join('docs', 'cypress', 'e2e-output.log');
const outputPath = path.join('docs', 'cypress', 'index.html');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

try {
  if (!fs.existsSync(logPath)) {
    console.log('No e2e-output.log found, skipping HTML generation');
    process.exit(0);
  }

  const log = fs.readFileSync(logPath, 'utf8');
  const escaped = escapeHtml(log);
  const passMatch = log.match(/All specs passed!|(\d+) passing/);
  const failMatch = log.match(/(\d+) failing/);
  const status = failMatch ? '❌ Some tests failed' : (passMatch ? '✅ All tests passed' : 'ℹ️ Test results');
  const hasScreenshots = fs.existsSync(path.join('docs', 'cypress', 'screenshots'));
  const screenshotLinks = hasScreenshots ? '<h2>Screenshots</h2><p>Available in <a href="screenshots/">screenshots/</a></p>' : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>E2E Test Results</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:"Segoe UI",sans-serif;line-height:1.6;color:#e0e0e0;background:linear-gradient(135deg,#0a0e27,#1a1e3d);min-height:100vh;padding:2rem}
    .container{max-width:900px;margin:0 auto}
    h1{color:#00d9ff;margin-bottom:1rem}
    h2{color:#ffbe0b;margin:1.5rem 0 .5rem}
    .status{font-size:1.3rem;margin:1rem 0}
    pre{background:rgba(0,0,0,.4);border:1px solid rgba(0,217,255,.2);border-radius:8px;padding:1.5rem;overflow-x:auto;font-size:.85rem;max-height:600px;overflow-y:auto}
    a{color:#00d9ff}
  </style>
</head>
<body>
  <div class="container">
    <h1>🎭 E2E Test Results (Cypress)</h1>
    <p class="status">${status}</p>
    ${screenshotLinks}
    <h2>Test Output</h2>
    <pre>${escaped}</pre>
    <p style="margin-top:2rem"><a href="../index.html">← Back to Documentation Hub</a></p>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log('✅ E2E test results HTML generated at', outputPath);
} catch (error) {
  console.error('Failed to generate E2E test results HTML:', error.message);
  process.exit(1);
}
