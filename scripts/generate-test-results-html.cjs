/**
 * Generate HTML report from Vitest JSON test results
 *
 * Reads vitest-results.json and produces a styled index.html
 * with pass/fail stats and expandable test suite details.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join('docs', 'test-results', 'vitest-results.json');
const outputPath = path.join('docs', 'test-results', 'index.html');

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
  if (!fs.existsSync(inputPath)) {
    console.log('No vitest-results.json found, skipping HTML generation');
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const passed = data.numPassedTests || 0;
  const failed = data.numFailedTests || 0;
  const total = data.numTotalTests || 0;

  const validResults = (data.testResults || []).filter(
    r => typeof r.endTime === 'number' && typeof r.startTime === 'number'
  );
  const duration = (validResults.reduce((a, r) => a + (r.endTime - r.startTime), 0) / 1000).toFixed(2);

  const suites = (data.testResults || []).map(r => {
    const name = escapeHtml(r.name.replace(/.*[\\/]/, ''));
    const status = r.status === 'passed' ? '✅' : '❌';
    const tests = (r.assertionResults || []).map(t => {
      const testStatus = t.status === 'passed' ? '✅' : '❌';
      return '<li>' + testStatus + ' ' + escapeHtml(t.fullName) + '</li>';
    }).join('');
    return '<details><summary>' + status + ' ' + name + '</summary><ul>' + tests + '</ul></details>';
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Unit Test Results</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:"Segoe UI",sans-serif;line-height:1.6;color:#e0e0e0;background:linear-gradient(135deg,#0a0e27,#1a1e3d);min-height:100vh;padding:2rem}
    .container{max-width:900px;margin:0 auto}
    h1{color:#00d9ff;margin-bottom:1rem}
    h2{color:#ffbe0b;margin:1.5rem 0 .5rem}
    .stats{display:flex;gap:2rem;margin:1rem 0;flex-wrap:wrap}
    .stat{background:rgba(26,30,61,.6);border:1px solid rgba(0,217,255,.3);border-radius:8px;padding:1rem 1.5rem}
    .stat .num{font-size:2rem;font-weight:bold}
    .pass{color:#00ff88}.fail{color:#ff006e}.total{color:#00d9ff}
    details{background:rgba(26,30,61,.4);border:1px solid rgba(0,217,255,.2);border-radius:4px;margin:.5rem 0;padding:.5rem 1rem}
    summary{cursor:pointer;font-weight:bold}
    ul{margin:.5rem 0 .5rem 1.5rem}
    li{margin:.25rem 0}
    a{color:#00d9ff}
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Unit Test Results</h1>
    <div class="stats">
      <div class="stat"><div class="num pass">${passed}</div>Passed</div>
      <div class="stat"><div class="num fail">${failed}</div>Failed</div>
      <div class="stat"><div class="num total">${total}</div>Total</div>
      <div class="stat"><div class="num total">${duration}s</div>Duration</div>
    </div>
    <h2>Test Suites</h2>
    ${suites}
    <p style="margin-top:2rem"><a href="../index.html">← Back to Documentation Hub</a></p>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log('✅ Unit test results HTML generated at', outputPath);
} catch (error) {
  console.error('Failed to generate unit test results HTML:', error.message);
  process.exit(1);
}
