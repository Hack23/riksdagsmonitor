/**
 * Generate extensive HTML report from Vitest JSON test results
 *
 * Reads vitest-results.json and produces a rich, interactive index.html
 * with pass/fail/skip stats, duration breakdown, per-suite detail tables,
 * search/filter, slowest-test rankings, and a visual progress bar.
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
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtMs(ms) {
  if (ms == null) return '-';
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(2) + 's';
}

try {
  if (!fs.existsSync(inputPath)) {
    console.log('No vitest-results.json found, skipping HTML generation');
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const passed = data.numPassedTests || 0;
  const failed = data.numFailedTests || 0;
  const pending = data.numPendingTests || 0;
  const todo = data.numTodoTests || 0;
  const total = data.numTotalTests || 0;
  const suitesPassed = data.numPassedTestSuites || 0;
  const suitesFailed = data.numFailedTestSuites || 0;
  const suitesPending = data.numPendingTestSuites || 0;
  const suitesTotal = data.numTotalTestSuites || 0;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

  const results = data.testResults || [];
  const validResults = results.filter(
    r => typeof r.endTime === 'number' && typeof r.startTime === 'number'
  );
  const totalDurationMs = validResults.reduce((a, r) => a + (r.endTime - r.startTime), 0);
  const startTime = data.startTime ? new Date(data.startTime).toISOString() : 'N/A';

  /* ── Per-suite rows ── */
  const suiteRows = results.map(r => {
    const shortName = escapeHtml(r.name.replace(/.*[\\/]/, ''));
    const fullPath = escapeHtml(r.name);
    const dur = (typeof r.endTime === 'number' && typeof r.startTime === 'number')
      ? (r.endTime - r.startTime) : 0;
    const assertions = r.assertionResults || [];
    const sp = assertions.filter(t => t.status === 'passed').length;
    const sf = assertions.filter(t => t.status === 'failed').length;
    const sk = assertions.filter(t => t.status === 'pending' || t.status === 'todo').length;
    const statusIcon = r.status === 'passed' ? '✅' : (r.status === 'failed' ? '❌' : '⏭️');
    const statusClass = r.status === 'passed' ? 'pass' : (r.status === 'failed' ? 'fail' : 'skip');

    const testRows = assertions.map(t => {
      const ti = t.status === 'passed' ? '✅' : (t.status === 'failed' ? '❌' : '⏭️');
      const tc = t.status === 'passed' ? 'pass' : (t.status === 'failed' ? 'fail' : 'skip');
      const tdur = typeof t.duration === 'number' ? fmtMs(t.duration) : '-';
      const failMsg = (t.failureMessages || []).map(escapeHtml).join('\n');
      const failHtml = failMsg
        ? '<tr><td colspan="4"><div class="failure"><pre>' + failMsg + '</pre></div></td></tr>'
        : '';
      return '<tr class="' + tc + '"><td>' + ti + '</td><td>' + escapeHtml(t.title) + '</td><td>' + tdur + '</td><td>' + escapeHtml(t.status) + '</td></tr>' + failHtml;
    }).join('');

    return '<details class="suite ' + statusClass + '" data-name="' + fullPath.toLowerCase() + '">' +
      '<summary>' +
        '<span class="suite-status">' + statusIcon + '</span>' +
        '<span class="suite-name">' + shortName + '</span>' +
        '<span class="suite-meta">' + sp + '✅ ' + (sf > 0 ? sf + '❌ ' : '') + (sk > 0 ? sk + '⏭️ ' : '') + '· ' + fmtMs(dur) + '</span>' +
      '</summary>' +
      '<p class="suite-path">' + fullPath + '</p>' +
      '<table class="test-table"><thead><tr><th></th><th>Test</th><th>Duration</th><th>Status</th></tr></thead><tbody>' + testRows + '</tbody></table>' +
    '</details>';
  }).join('\n');

  /* ── Slowest suites ── */
  const slowest = [...validResults]
    .sort((a, b) => (b.endTime - b.startTime) - (a.endTime - a.startTime))
    .slice(0, 10);
  const slowestRows = slowest.map(r => {
    const dur = r.endTime - r.startTime;
    const name = escapeHtml(r.name.replace(/.*[\\/]/, ''));
    return '<tr><td>' + name + '</td><td>' + fmtMs(dur) + '</td></tr>';
  }).join('');

  /* ── Slowest individual tests ── */
  const allTests = results.flatMap(r =>
    (r.assertionResults || []).map(t => ({
      title: t.title, suite: r.name.replace(/.*[\\/]/, ''),
      duration: t.duration, status: t.status,
      fullName: t.fullName, failureMessages: t.failureMessages
    }))
  );
  const slowestTests = [...allTests]
    .filter(t => typeof t.duration === 'number')
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 15);
  const slowestTestRows = slowestTests.map(t =>
    '<tr><td>' + escapeHtml(t.title) + '</td><td>' + escapeHtml(t.suite) + '</td><td>' + fmtMs(t.duration) + '</td></tr>'
  ).join('');

  /* ── Failed tests ── */
  const failedTests = allTests.filter(t => t.status === 'failed');
  const failedSection = failedTests.length > 0
    ? '<h2>❌ Failed Tests (' + failedTests.length + ')</h2><div class="failed-tests">' +
      failedTests.map(t => {
        const failMsg = (t.failureMessages || []).map(escapeHtml).join('\n');
        return '<div class="failed-test"><h3>' + escapeHtml(t.fullName || t.title) + '</h3>' +
          '<p class="suite-path">Suite: ' + escapeHtml(t.suite) + '</p>' +
          '<pre class="failure">' + failMsg + '</pre></div>';
      }).join('') + '</div>'
    : '';

  const passBarPct = total > 0 ? (passed / total * 100).toFixed(1) : '0';
  const failBarPct = total > 0 ? (failed / total * 100).toFixed(1) : '0';
  const skipBarPct = total > 0 ? ((pending + todo) / total * 100).toFixed(1) : '0';

  const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
    '  <title>Unit Test Results — Riksdagsmonitor</title>\n' +
    '  <style>\n' +
    '    :root{--bg:#0a0e27;--bg2:#1a1e3d;--cyan:#00d9ff;--green:#00ff88;--red:#ff006e;--yellow:#ffbe0b;--text:#e0e0e0;--muted:#808080;--card:rgba(26,30,61,.6);--border:rgba(0,217,255,.3)}\n' +
    '    *{margin:0;padding:0;box-sizing:border-box}\n' +
    '    body{font-family:"Segoe UI",sans-serif;line-height:1.6;color:var(--text);background:linear-gradient(135deg,var(--bg),var(--bg2));min-height:100vh;padding:2rem}\n' +
    '    .container{max-width:1200px;margin:0 auto}\n' +
    '    h1{color:var(--cyan);font-size:2.2rem;margin-bottom:.5rem;text-shadow:0 0 10px rgba(0,217,255,.5)}\n' +
    '    h2{color:var(--yellow);margin:2rem 0 1rem;font-size:1.4rem}\n' +
    '    .meta{color:var(--muted);font-size:.9rem;margin-bottom:2rem}\n' +
    '    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin:1.5rem 0}\n' +
    '    .stat{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;text-align:center}\n' +
    '    .stat .num{font-size:2rem;font-weight:700}\n' +
    '    .stat .label{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}\n' +
    '    .pass .num{color:var(--green)}.fail .num{color:var(--red)}.skip .num{color:var(--yellow)}.total .num{color:var(--cyan)}\n' +
    '    .progress-bar{height:28px;border-radius:14px;overflow:hidden;background:rgba(0,0,0,.3);margin:1rem 0;display:flex}\n' +
    '    .progress-bar .seg{display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#0a0e27;min-width:2%}\n' +
    '    .seg-pass{background:var(--green)}.seg-fail{background:var(--red)}.seg-skip{background:var(--yellow)}\n' +
    '    .search{margin:1rem 0;display:flex;gap:1rem;flex-wrap:wrap;align-items:center}\n' +
    '    .search input{background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:6px;padding:.6rem 1rem;color:var(--text);font-size:.95rem;flex:1;min-width:200px}\n' +
    '    .search input:focus{outline:none;border-color:var(--cyan);box-shadow:0 0 8px rgba(0,217,255,.3)}\n' +
    '    .search select{background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:6px;padding:.6rem 1rem;color:var(--text);font-size:.95rem}\n' +
    '    .search .count{color:var(--muted);font-size:.85rem}\n' +
    '    details.suite{background:var(--card);border:1px solid var(--border);border-radius:6px;margin:.5rem 0;overflow:hidden}\n' +
    '    details.suite[open]{border-color:var(--cyan)}\n' +
    '    details.suite.fail{border-color:rgba(255,0,110,.4)}\n' +
    '    summary{cursor:pointer;padding:.75rem 1rem;display:flex;align-items:center;gap:.75rem;font-weight:600}\n' +
    '    summary:hover{background:rgba(0,217,255,.05)}\n' +
    '    .suite-status{font-size:1.1rem;flex-shrink:0}\n' +
    '    .suite-name{flex:1}\n' +
    '    .suite-meta{font-size:.8rem;color:var(--muted);white-space:nowrap}\n' +
    '    .suite-path{padding:.25rem 1rem .5rem;font-size:.75rem;color:var(--muted);font-family:monospace;word-break:break-all}\n' +
    '    .test-table{width:100%;border-collapse:collapse;font-size:.85rem}\n' +
    '    .test-table th{text-align:left;padding:.4rem .75rem;border-bottom:1px solid var(--border);color:var(--muted);font-size:.75rem;text-transform:uppercase}\n' +
    '    .test-table td{padding:.4rem .75rem;border-bottom:1px solid rgba(255,255,255,.05)}\n' +
    '    .test-table tr.pass td:first-child{color:var(--green)}\n' +
    '    .test-table tr.fail td:first-child{color:var(--red)}\n' +
    '    .test-table tr.skip td:first-child{color:var(--yellow)}\n' +
    '    table.data-table{width:100%;border-collapse:collapse;font-size:.85rem;background:var(--card);border:1px solid var(--border);border-radius:6px;overflow:hidden}\n' +
    '    table.data-table th{text-align:left;padding:.6rem 1rem;background:rgba(0,0,0,.2);color:var(--cyan);font-size:.75rem;text-transform:uppercase}\n' +
    '    table.data-table td{padding:.5rem 1rem;border-top:1px solid rgba(255,255,255,.05)}\n' +
    '    .failure pre,.failed-test pre{background:rgba(255,0,110,.1);border:1px solid rgba(255,0,110,.3);border-radius:4px;padding:1rem;font-size:.8rem;overflow-x:auto;max-height:300px;overflow-y:auto;white-space:pre-wrap;word-break:break-word}\n' +
    '    .failed-test{background:var(--card);border:1px solid rgba(255,0,110,.4);border-radius:8px;padding:1.5rem;margin:.75rem 0}\n' +
    '    .failed-test h3{color:var(--red);font-size:1rem;margin-bottom:.5rem}\n' +
    '    a{color:var(--cyan)}\n' +
    '    .back-link{margin-top:2rem;display:inline-block}\n' +
    '    .hidden{display:none !important}\n' +
    '  </style>\n</head>\n<body>\n  <div class="container">\n' +
    '    <h1>🧪 Unit Test Results</h1>\n' +
    '    <p class="meta">Generated: ' + new Date().toISOString() + ' · Vitest run started: ' + startTime + '</p>\n' +
    '    <div class="stats">\n' +
    '      <div class="stat pass"><div class="num">' + passed + '</div><div class="label">Passed</div></div>\n' +
    '      <div class="stat fail"><div class="num">' + failed + '</div><div class="label">Failed</div></div>\n' +
    '      <div class="stat skip"><div class="num">' + (pending + todo) + '</div><div class="label">Skipped</div></div>\n' +
    '      <div class="stat total"><div class="num">' + total + '</div><div class="label">Total</div></div>\n' +
    '      <div class="stat total"><div class="num">' + passRate + '%</div><div class="label">Pass Rate</div></div>\n' +
    '      <div class="stat total"><div class="num">' + fmtMs(totalDurationMs) + '</div><div class="label">Duration</div></div>\n' +
    '    </div>\n' +
    '    <div class="progress-bar">\n' +
    (passed > 0 ? '      <div class="seg seg-pass" style="width:' + passBarPct + '%">' + passed + '</div>\n' : '') +
    (failed > 0 ? '      <div class="seg seg-fail" style="width:' + failBarPct + '%">' + failed + '</div>\n' : '') +
    ((pending + todo) > 0 ? '      <div class="seg seg-skip" style="width:' + skipBarPct + '%">' + (pending + todo) + '</div>\n' : '') +
    '    </div>\n' +
    '    <div class="stats">\n' +
    '      <div class="stat pass"><div class="num">' + suitesPassed + '</div><div class="label">Suites Passed</div></div>\n' +
    '      <div class="stat fail"><div class="num">' + suitesFailed + '</div><div class="label">Suites Failed</div></div>\n' +
    '      <div class="stat skip"><div class="num">' + suitesPending + '</div><div class="label">Suites Pending</div></div>\n' +
    '      <div class="stat total"><div class="num">' + suitesTotal + '</div><div class="label">Total Suites</div></div>\n' +
    '    </div>\n' +
    failedSection + '\n' +
    '    <h2>⏱️ Slowest Test Suites</h2>\n' +
    '    <table class="data-table"><thead><tr><th>Suite</th><th>Duration</th></tr></thead><tbody>' + slowestRows + '</tbody></table>\n' +
    '    <h2>🐢 Slowest Individual Tests</h2>\n' +
    '    <table class="data-table"><thead><tr><th>Test</th><th>Suite</th><th>Duration</th></tr></thead><tbody>' + slowestTestRows + '</tbody></table>\n' +
    '    <h2>📋 All Test Suites (' + suitesTotal + ')</h2>\n' +
    '    <div class="search">\n' +
    '      <input type="text" id="suiteSearch" placeholder="Search suites..." aria-label="Search test suites">\n' +
    '      <select id="statusFilter" aria-label="Filter by status">\n' +
    '        <option value="all">All statuses</option>\n' +
    '        <option value="passed">✅ Passed</option>\n' +
    '        <option value="failed">❌ Failed</option>\n' +
    '        <option value="pending">⏭️ Pending</option>\n' +
    '      </select>\n' +
    '      <span class="count" id="visibleCount">' + suitesTotal + ' suites</span>\n' +
    '    </div>\n' +
    suiteRows + '\n' +
    '    <a href="../index.html" class="back-link">← Back to Documentation Hub</a>\n' +
    '  </div>\n' +
    '  <script>\n' +
    '    (function(){\n' +
    '      var search=document.getElementById("suiteSearch");\n' +
    '      var filter=document.getElementById("statusFilter");\n' +
    '      var count=document.getElementById("visibleCount");\n' +
    '      var suites=document.querySelectorAll("details.suite");\n' +
    '      function applyFilter(){\n' +
    '        var q=search.value.toLowerCase();\n' +
    '        var s=filter.value;\n' +
    '        var visible=0;\n' +
    '        suites.forEach(function(el){\n' +
    '          var name=el.getAttribute("data-name")||"";\n' +
    '          var matchName=!q||name.indexOf(q)!==-1;\n' +
    '          var matchStatus=s==="all"||(s==="passed"&&el.classList.contains("pass"))||(s==="failed"&&el.classList.contains("fail"))||(s==="pending"&&el.classList.contains("skip"));\n' +
    '          if(matchName&&matchStatus){el.classList.remove("hidden");visible++;}else{el.classList.add("hidden");}\n' +
    '        });\n' +
    '        count.textContent=visible+" suite"+(visible!==1?"s":"");\n' +
    '      }\n' +
    '      search.addEventListener("input",applyFilter);\n' +
    '      filter.addEventListener("change",applyFilter);\n' +
    '    })();\n' +
    '  </script>\n' +
    '</body>\n</html>';

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log('✅ Unit test results HTML generated at', outputPath, '(' + total + ' tests, ' + suitesTotal + ' suites)');
} catch (error) {
  console.error('Failed to generate unit test results HTML:', error.message);
  process.exit(1);
}
