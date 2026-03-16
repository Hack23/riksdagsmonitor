/**
 * Generate extensive HTML report from Cypress E2E test log output
 *
 * Reads e2e-output.log and produces a rich index.html with:
 * - Overall pass/fail status with spec-level breakdown
 * - Per-spec timing and test counts
 * - Screenshot gallery (if available)
 * - Structured results table
 * - Full log viewer with search
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const fs = require('fs');
const path = require('path');

const logPath = path.join('docs', 'cypress', 'e2e-output.log');
const outputPath = path.join('docs', 'cypress', 'index.html');
const screenshotsDir = path.join('docs', 'cypress', 'screenshots');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

try {
  if (!fs.existsSync(logPath)) {
    console.log('No e2e-output.log found, skipping HTML generation');
    process.exit(0);
  }

  const log = fs.readFileSync(logPath, 'utf8');
  const escaped = escapeHtml(log);

  /* ── Parse structured data from Cypress log ── */
  const passMatch = log.match(/All specs passed!/);
  const passingCountMatch = log.match(/(\d+)\s+passing/g);
  const failingCountMatch = log.match(/(\d+)\s+failing/g);
  const pendingCountMatch = log.match(/(\d+)\s+pending/g);

  let totalPassing = 0, totalFailing = 0, totalPending = 0;
  if (passingCountMatch) passingCountMatch.forEach(m => { totalPassing += parseInt(m, 10); });
  if (failingCountMatch) failingCountMatch.forEach(m => { totalFailing += parseInt(m, 10); });
  if (pendingCountMatch) pendingCountMatch.forEach(m => { totalPending += parseInt(m, 10); });
  const totalTests = totalPassing + totalFailing + totalPending;

  const overallStatus = totalFailing > 0 ? '❌ Some tests failed'
    : (passMatch || totalPassing > 0) ? '✅ All tests passed'
    : 'ℹ️ Test results';
  const statusClass = totalFailing > 0 ? 'fail' : 'pass';

  /* ── Parse spec-level results ── */
  // Cypress outputs lines like:  ✔  homepage.cy.js    00:12   3    3    -    -    -
  // Or the "Run Finished" table
  const specLines = [];
  const specRegex = /[✔✖│]\s+([a-zA-Z0-9_\-/.]+\.(?:cy|spec)\.\w+)\s+(\d+:\d+)\s+(\d+)\s+(\d+)\s+(\d+|-)\s+(\d+|-)\s+(\d+|-)/g;
  let specMatch;
  while ((specMatch = specRegex.exec(log)) !== null) {
    specLines.push({
      name: specMatch[1],
      duration: specMatch[2],
      tests: parseInt(specMatch[3], 10) || 0,
      passing: parseInt(specMatch[4], 10) || 0,
      failing: specMatch[5] === '-' ? 0 : parseInt(specMatch[5], 10) || 0,
      pending: specMatch[6] === '-' ? 0 : parseInt(specMatch[6], 10) || 0,
      skipped: specMatch[7] === '-' ? 0 : parseInt(specMatch[7], 10) || 0
    });
  }

  /* ── Spec duration parsing ── */
  const durationMatch = log.match(/(\d+:\d+)\s+(\d+)\s+(\d+)\s+(\d+|-)\s+(\d+|-)\s+(\d+|-)\s*$/m);
  const totalDuration = durationMatch ? durationMatch[1] : '-';

  const specTableRows = specLines.map(s => {
    const icon = s.failing > 0 ? '❌' : '✅';
    const cls = s.failing > 0 ? 'fail' : 'pass';
    return '<tr class="' + cls + '">' +
      '<td>' + icon + '</td>' +
      '<td>' + escapeHtml(s.name) + '</td>' +
      '<td>' + s.duration + '</td>' +
      '<td>' + s.tests + '</td>' +
      '<td class="pass-cell">' + s.passing + '</td>' +
      '<td class="fail-cell">' + s.failing + '</td>' +
      '<td>' + s.pending + '</td>' +
    '</tr>';
  }).join('');

  /* ── Screenshots ── */
  let screenshotHtml = '';
  if (fs.existsSync(screenshotsDir)) {
    const walkDir = (dir, prefix) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files = [];
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) files.push(...walkDir(full, prefix ? prefix + '/' + e.name : e.name));
        else if (/\.(png|jpg|jpeg|webp|gif)$/i.test(e.name)) {
          files.push({ rel: (prefix ? prefix + '/' : '') + e.name, name: e.name });
        }
      }
      return files;
    };
    const screenshots = walkDir(screenshotsDir, '');
    if (screenshots.length > 0) {
      screenshotHtml = '<h2>📸 Screenshots (' + screenshots.length + ')</h2>' +
        '<div class="screenshot-grid">' +
        screenshots.map(s =>
          '<div class="screenshot-card">' +
            '<a href="screenshots/' + escapeHtml(s.rel) + '" target="_blank">' +
              '<img src="screenshots/' + escapeHtml(s.rel) + '" alt="' + escapeHtml(s.name) + '" loading="lazy">' +
            '</a>' +
            '<p>' + escapeHtml(s.name) + '</p>' +
          '</div>'
        ).join('') +
        '</div>';
    }
  }

  const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
    '  <title>E2E Test Results — Riksdagsmonitor</title>\n' +
    '  <style>\n' +
    '    :root{--bg:#0a0e27;--bg2:#1a1e3d;--cyan:#00d9ff;--green:#00ff88;--red:#ff006e;--yellow:#ffbe0b;--text:#e0e0e0;--muted:#808080;--card:rgba(26,30,61,.6);--border:rgba(0,217,255,.3)}\n' +
    '    *{margin:0;padding:0;box-sizing:border-box}\n' +
    '    body{font-family:"Segoe UI",sans-serif;line-height:1.6;color:var(--text);background:linear-gradient(135deg,var(--bg),var(--bg2));min-height:100vh;padding:2rem}\n' +
    '    .container{max-width:1200px;margin:0 auto}\n' +
    '    h1{color:var(--cyan);font-size:2.2rem;margin-bottom:.5rem;text-shadow:0 0 10px rgba(0,217,255,.5)}\n' +
    '    h2{color:var(--yellow);margin:2rem 0 1rem;font-size:1.4rem}\n' +
    '    .meta{color:var(--muted);font-size:.9rem;margin-bottom:1rem}\n' +
    '    .status-banner{font-size:1.4rem;padding:1rem 1.5rem;border-radius:8px;margin:1rem 0 1.5rem;font-weight:700}\n' +
    '    .status-banner.pass{background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.4);color:var(--green)}\n' +
    '    .status-banner.fail{background:rgba(255,0,110,.1);border:1px solid rgba(255,0,110,.4);color:var(--red)}\n' +
    '    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin:1.5rem 0}\n' +
    '    .stat{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;text-align:center}\n' +
    '    .stat .num{font-size:2rem;font-weight:700}\n' +
    '    .stat .label{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}\n' +
    '    .pass .num,.pass-cell{color:var(--green)}.fail .num,.fail-cell{color:var(--red)}.total .num{color:var(--cyan)}\n' +
    '    table.data-table{width:100%;border-collapse:collapse;font-size:.85rem;background:var(--card);border:1px solid var(--border);border-radius:6px;overflow:hidden}\n' +
    '    table.data-table th{text-align:left;padding:.6rem 1rem;background:rgba(0,0,0,.2);color:var(--cyan);font-size:.75rem;text-transform:uppercase}\n' +
    '    table.data-table td{padding:.5rem 1rem;border-top:1px solid rgba(255,255,255,.05)}\n' +
    '    .screenshot-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem;margin:1rem 0}\n' +
    '    .screenshot-card{background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;transition:transform .2s}\n' +
    '    .screenshot-card:hover{transform:translateY(-3px);border-color:var(--cyan)}\n' +
    '    .screenshot-card img{width:100%;height:auto;display:block}\n' +
    '    .screenshot-card p{padding:.5rem;font-size:.75rem;color:var(--muted);word-break:break-all}\n' +
    '    .log-section{margin:2rem 0}\n' +
    '    .log-search{margin:.5rem 0;display:flex;gap:.5rem}\n' +
    '    .log-search input{background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:6px;padding:.5rem 1rem;color:var(--text);flex:1}\n' +
    '    .log-search input:focus{outline:none;border-color:var(--cyan)}\n' +
    '    pre.log{background:rgba(0,0,0,.4);border:1px solid rgba(0,217,255,.2);border-radius:8px;padding:1.5rem;overflow-x:auto;font-size:.8rem;max-height:800px;overflow-y:auto;white-space:pre-wrap;word-break:break-word}\n' +
    '    a{color:var(--cyan)}\n' +
    '    .back-link{margin-top:2rem;display:inline-block}\n' +
    '  </style>\n</head>\n<body>\n  <div class="container">\n' +
    '    <h1>🎭 E2E Test Results (Cypress)</h1>\n' +
    '    <p class="meta">Generated: ' + new Date().toISOString() + '</p>\n' +
    '    <div class="status-banner ' + statusClass + '">' + overallStatus + '</div>\n' +
    '    <div class="stats">\n' +
    '      <div class="stat pass"><div class="num">' + totalPassing + '</div><div class="label">Passing</div></div>\n' +
    '      <div class="stat fail"><div class="num">' + totalFailing + '</div><div class="label">Failing</div></div>\n' +
    '      <div class="stat total"><div class="num">' + totalPending + '</div><div class="label">Pending</div></div>\n' +
    '      <div class="stat total"><div class="num">' + totalTests + '</div><div class="label">Total Tests</div></div>\n' +
    '      <div class="stat total"><div class="num">' + specLines.length + '</div><div class="label">Spec Files</div></div>\n' +
    '    </div>\n' +
    (specLines.length > 0 ? (
      '    <h2>📁 Spec File Results</h2>\n' +
      '    <table class="data-table"><thead><tr><th></th><th>Spec File</th><th>Duration</th><th>Tests</th><th>Pass</th><th>Fail</th><th>Pending</th></tr></thead><tbody>' + specTableRows + '</tbody></table>\n'
    ) : '') +
    screenshotHtml + '\n' +
    '    <div class="log-section">\n' +
    '      <h2>📜 Full Test Output</h2>\n' +
    '      <div class="log-search"><input type="text" id="logSearch" placeholder="Search in log..." aria-label="Search log output"></div>\n' +
    '      <pre class="log" id="logOutput">' + escaped + '</pre>\n' +
    '    </div>\n' +
    '    <a href="../index.html" class="back-link">← Back to Documentation Hub</a>\n' +
    '  </div>\n' +
    '  <script>\n' +
    '    (function(){\n' +
    '      var search=document.getElementById("logSearch");\n' +
    '      var logEl=document.getElementById("logOutput");\n' +
    '      var original=logEl.innerHTML;\n' +
    '      search.addEventListener("input",function(){\n' +
    '        var q=search.value;\n' +
    '        if(!q){logEl.innerHTML=original;return;}\n' +
    '        var safe=q.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&");\n' +
    '        var re=new RegExp("("+safe+")","gi");\n' +
    '        logEl.innerHTML=original.replace(re,"<mark style=\\"background:#ffbe0b;color:#0a0e27\\">$1</mark>");\n' +
    '      });\n' +
    '    })();\n' +
    '  </script>\n' +
    '</body>\n</html>';

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log('✅ E2E test results HTML generated at', outputPath,
    '(' + totalPassing + ' passing, ' + totalFailing + ' failing, ' + specLines.length + ' specs)');
} catch (error) {
  console.error('Failed to generate E2E test results HTML:', error.message);
  process.exit(1);
}
