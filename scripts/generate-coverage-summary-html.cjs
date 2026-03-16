/**
 * Generate HTML coverage summary dashboard
 *
 * Reads coverage-final.json and produces a high-level coverage dashboard
 * with per-directory breakdown, threshold indicators, and sortable tables.
 * This complements the detailed istanbul HTML report in docs/coverage/.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const fs = require('fs');
const path = require('path');

const coveragePath = path.join('docs', 'coverage', 'coverage-final.json');
const outputPath = path.join('docs', 'coverage', 'summary.html');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function pct(covered, total) {
  if (total === 0) return 100;
  return Math.round((covered / total) * 10000) / 100;
}

function thresholdClass(val, target) {
  if (val >= target) return 'good';
  if (val >= target * 0.7) return 'warn';
  return 'bad';
}

function colorForPct(val) {
  if (val >= 70) return 'var(--green)';
  if (val >= 40) return 'var(--yellow)';
  return 'var(--red)';
}

try {
  if (!fs.existsSync(coveragePath)) {
    console.log('No coverage-final.json found, skipping coverage summary HTML generation');
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  const files = Object.entries(data);

  // Thresholds from vitest.config.js
  const thresholds = { lines: 25, functions: 20, branches: 25, statements: 25 };
  const targets = { lines: 70, functions: 70, branches: 60, statements: 70 };

  // Aggregate totals
  let totalStmts = 0, coveredStmts = 0;
  let totalBranches = 0, coveredBranches = 0;
  let totalFns = 0, coveredFns = 0;
  let totalLines = 0, coveredLines = 0;

  // Per-directory aggregation
  const dirs = {};

  for (const [filePath, fileCov] of files) {
    const s = fileCov.s || {};
    const b = fileCov.b || {};
    const f = fileCov.f || {};

    const stmtEntries = Object.values(s);
    const fStmts = stmtEntries.length;
    const fCovStmts = stmtEntries.filter(v => v > 0).length;

    const branchEntries = Object.values(b).flat();
    const fBranches = branchEntries.length;
    const fCovBranches = branchEntries.filter(v => v > 0).length;

    const fnEntries = Object.values(f);
    const fFns = fnEntries.length;
    const fCovFns = fnEntries.filter(v => v > 0).length;

    // Lines from statementMap
    const lineSet = new Set();
    const coveredLineSet = new Set();
    const stmtMap = fileCov.statementMap || {};
    for (const [key, loc] of Object.entries(stmtMap)) {
      if (loc && loc.start) {
        lineSet.add(loc.start.line);
        if (s[key] > 0) coveredLineSet.add(loc.start.line);
      }
    }
    const fLines = lineSet.size;
    const fCovLines = coveredLineSet.size;

    totalStmts += fStmts; coveredStmts += fCovStmts;
    totalBranches += fBranches; coveredBranches += fCovBranches;
    totalFns += fFns; coveredFns += fCovFns;
    totalLines += fLines; coveredLines += fCovLines;

    // Directory grouping
    const relPath = filePath.replace(/.*[\\/](src|scripts|js|dashboard)[\\/]/, '$1/');
    const parts = relPath.split('/');
    const dir = parts.length > 1 ? parts.slice(0, 2).join('/') : parts[0];

    if (!dirs[dir]) dirs[dir] = { stmts: 0, covStmts: 0, branches: 0, covBranches: 0, fns: 0, covFns: 0, lines: 0, covLines: 0, files: 0 };
    dirs[dir].stmts += fStmts;
    dirs[dir].covStmts += fCovStmts;
    dirs[dir].branches += fBranches;
    dirs[dir].covBranches += fCovBranches;
    dirs[dir].fns += fFns;
    dirs[dir].covFns += fCovFns;
    dirs[dir].lines += fLines;
    dirs[dir].covLines += fCovLines;
    dirs[dir].files++;
  }

  const overallLines = pct(coveredLines, totalLines);
  const overallStmts = pct(coveredStmts, totalStmts);
  const overallBranches = pct(coveredBranches, totalBranches);
  const overallFns = pct(coveredFns, totalFns);

  // Directory rows sorted by line coverage ascending (worst first)
  const dirEntries = Object.entries(dirs).sort((a, b) => {
    return pct(a[1].covLines, a[1].lines) - pct(b[1].covLines, b[1].lines);
  });

  const dirRows = dirEntries.map(([dir, d]) => {
    const lp = pct(d.covLines, d.lines);
    const sp = pct(d.covStmts, d.stmts);
    const bp = pct(d.covBranches, d.branches);
    const fp = pct(d.covFns, d.fns);
    return '<tr>' +
      '<td>' + escapeHtml(dir) + '</td>' +
      '<td>' + d.files + '</td>' +
      '<td><span style="color:' + colorForPct(lp) + '">' + lp.toFixed(1) + '%</span></td>' +
      '<td><span style="color:' + colorForPct(sp) + '">' + sp.toFixed(1) + '%</span></td>' +
      '<td><span style="color:' + colorForPct(bp) + '">' + bp.toFixed(1) + '%</span></td>' +
      '<td><span style="color:' + colorForPct(fp) + '">' + fp.toFixed(1) + '%</span></td>' +
    '</tr>';
  }).join('');

  function gaugeHtml(label, val, threshold, target) {
    const cls = thresholdClass(val, target);
    const barColor = cls === 'good' ? 'var(--green)' : cls === 'warn' ? 'var(--yellow)' : 'var(--red)';
    return '<div class="gauge">' +
      '<div class="gauge-label">' + label + '</div>' +
      '<div class="gauge-bar"><div class="gauge-fill" style="width:' + Math.min(val, 100) + '%;background:' + barColor + '"></div>' +
      '<div class="gauge-threshold" style="left:' + threshold + '%"></div>' +
      '<div class="gauge-target" style="left:' + target + '%"></div></div>' +
      '<div class="gauge-value" style="color:' + barColor + '">' + val.toFixed(1) + '%</div>' +
      '<div class="gauge-meta">Min: ' + threshold + '% · Target: ' + target + '%</div>' +
    '</div>';
  }

  const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
    '  <title>Coverage Summary — Riksdagsmonitor</title>\n' +
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
    '    .stat .num{font-size:2rem;font-weight:700;color:var(--cyan)}\n' +
    '    .stat .label{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}\n' +
    '    .gauges{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;margin:2rem 0}\n' +
    '    .gauge{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1.5rem}\n' +
    '    .gauge-label{font-weight:700;font-size:1rem;margin-bottom:.5rem}\n' +
    '    .gauge-bar{position:relative;height:20px;background:rgba(0,0,0,.3);border-radius:10px;overflow:visible;margin:.5rem 0}\n' +
    '    .gauge-fill{height:100%;border-radius:10px;transition:width .3s}\n' +
    '    .gauge-threshold{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--yellow);border-radius:1px}\n' +
    '    .gauge-target{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--green);border-radius:1px}\n' +
    '    .gauge-value{font-size:1.8rem;font-weight:700;margin-top:.25rem}\n' +
    '    .gauge-meta{font-size:.75rem;color:var(--muted)}\n' +
    '    table.data-table{width:100%;border-collapse:collapse;font-size:.85rem;background:var(--card);border:1px solid var(--border);border-radius:6px;overflow:hidden}\n' +
    '    table.data-table th{text-align:left;padding:.6rem 1rem;background:rgba(0,0,0,.2);color:var(--cyan);font-size:.75rem;text-transform:uppercase;cursor:pointer}\n' +
    '    table.data-table th:hover{color:var(--yellow)}\n' +
    '    table.data-table td{padding:.5rem 1rem;border-top:1px solid rgba(255,255,255,.05)}\n' +
    '    a{color:var(--cyan)}\n' +
    '    .links{display:flex;gap:1rem;flex-wrap:wrap;margin:1rem 0}\n' +
    '    .links a{padding:.5rem 1rem;background:var(--card);border:1px solid var(--border);border-radius:6px;text-decoration:none;transition:all .2s}\n' +
    '    .links a:hover{border-color:var(--cyan);background:rgba(0,217,255,.1)}\n' +
    '    .back-link{margin-top:2rem;display:inline-block}\n' +
    '  </style>\n</head>\n<body>\n  <div class="container">\n' +
    '    <h1>📊 Coverage Summary Dashboard</h1>\n' +
    '    <p class="meta">' + files.length + ' files analysed · Generated: ' + new Date().toISOString() + '</p>\n' +
    '    <div class="stats">\n' +
    '      <div class="stat"><div class="num">' + files.length + '</div><div class="label">Files</div></div>\n' +
    '      <div class="stat"><div class="num">' + overallLines.toFixed(1) + '%</div><div class="label">Lines</div></div>\n' +
    '      <div class="stat"><div class="num">' + overallStmts.toFixed(1) + '%</div><div class="label">Statements</div></div>\n' +
    '      <div class="stat"><div class="num">' + overallBranches.toFixed(1) + '%</div><div class="label">Branches</div></div>\n' +
    '      <div class="stat"><div class="num">' + overallFns.toFixed(1) + '%</div><div class="label">Functions</div></div>\n' +
    '    </div>\n' +
    '    <h2>🎯 Threshold Gauges</h2>\n' +
    '    <div class="gauges">\n' +
    gaugeHtml('Lines', overallLines, thresholds.lines, targets.lines) + '\n' +
    gaugeHtml('Statements', overallStmts, thresholds.statements, targets.statements) + '\n' +
    gaugeHtml('Branches', overallBranches, thresholds.branches, targets.branches) + '\n' +
    gaugeHtml('Functions', overallFns, thresholds.functions, targets.functions) + '\n' +
    '    </div>\n' +
    '    <h2>📁 Per-Directory Breakdown (' + dirEntries.length + ' directories)</h2>\n' +
    '    <table class="data-table"><thead><tr><th>Directory</th><th>Files</th><th>Lines</th><th>Statements</th><th>Branches</th><th>Functions</th></tr></thead><tbody>' + dirRows + '</tbody></table>\n' +
    '    <h2>🔗 Detailed Reports</h2>\n' +
    '    <div class="links">\n' +
    '      <a href="index.html">📊 Istanbul HTML Report</a>\n' +
    '      <a href="lcov-report/index.html">📋 LCOV Report</a>\n' +
    '      <a href="coverage-final.json">📄 coverage-final.json</a>\n' +
    '      <a href="../index.html">🏠 Documentation Hub</a>\n' +
    '    </div>\n' +
    '    <a href="../index.html" class="back-link">← Back to Documentation Hub</a>\n' +
    '  </div>\n' +
    '</body>\n</html>';

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log('✅ Coverage summary HTML generated at', outputPath,
    '(Lines: ' + overallLines.toFixed(1) + '%, ' + files.length + ' files)');
} catch (error) {
  console.error('Failed to generate coverage summary HTML:', error.message);
  process.exit(1);
}
