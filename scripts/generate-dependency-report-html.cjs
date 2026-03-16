/**
 * Generate HTML dependency report from npm dependency tree
 *
 * Reads dependency-tree.json and dependency-tree.txt and produces
 * an interactive HTML page with package counts, search, and tree viewer.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join('docs', 'dependencies', 'dependency-tree.json');
const txtPath = path.join('docs', 'dependencies', 'dependency-tree.txt');
const outputPath = path.join('docs', 'dependencies', 'index.html');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

try {
  let treeText = '';
  let jsonData = null;
  let totalDeps = 0;
  let directDeps = 0;
  let devDeps = 0;
  let depList = [];
  let projectName = 'riksdagsmonitor';
  let projectVersion = '';

  if (fs.existsSync(txtPath)) {
    treeText = fs.readFileSync(txtPath, 'utf8');
    // Count unique packages from the text tree (use Set to avoid duplicates)
    const pkgMatches = treeText.match(/[├└│─┬]─\s+(\S+@)\S+/g);
    if (pkgMatches) {
      const uniquePkgs = new Set(pkgMatches.map(m => m.replace(/[├└│─┬]─\s+/, '').replace(/@[^@]+$/, '')));
      totalDeps = uniquePkgs.size;
    }
  }

  if (fs.existsSync(jsonPath)) {
    jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    projectName = jsonData.name || 'riksdagsmonitor';
    projectVersion = jsonData.version || '';

    // Count direct dependencies
    if (jsonData.dependencies) {
      const deps = jsonData.dependencies;
      const entries = Object.entries(deps);
      directDeps = entries.length;

      // Build flat dep list for the table
      for (const [name, info] of entries) {
        const ver = (typeof info === 'object' && info.version) ? info.version : (typeof info === 'string' ? info : '');
        const isDev = info && info.dev === true;
        if (isDev) devDeps++;
        depList.push({ name, version: ver, dev: isDev });
      }
      depList.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  const productionDeps = directDeps - devDeps;

  const depTableRows = depList.slice(0, 200).map(d => {
    const badge = d.dev
      ? '<span class="badge dev">dev</span>'
      : '<span class="badge prod">prod</span>';
    return '<tr><td>' + escapeHtml(d.name) + '</td><td>' + escapeHtml(d.version) + '</td><td>' + badge + '</td></tr>';
  }).join('');

  const escapedTree = escapeHtml(treeText);

  const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
    '  <title>Dependency Report — Riksdagsmonitor</title>\n' +
    '  <style>\n' +
    '    :root{--bg:#0a0e27;--bg2:#1a1e3d;--cyan:#00d9ff;--green:#00ff88;--red:#ff006e;--yellow:#ffbe0b;--text:#e0e0e0;--muted:#808080;--card:rgba(26,30,61,.6);--border:rgba(0,217,255,.3)}\n' +
    '    *{margin:0;padding:0;box-sizing:border-box}\n' +
    '    body{font-family:"Segoe UI",sans-serif;line-height:1.6;color:var(--text);background:linear-gradient(135deg,var(--bg),var(--bg2));min-height:100vh;padding:2rem}\n' +
    '    .container{max-width:1200px;margin:0 auto}\n' +
    '    h1{color:var(--cyan);font-size:2.2rem;margin-bottom:.5rem;text-shadow:0 0 10px rgba(0,217,255,.5)}\n' +
    '    h2{color:var(--yellow);margin:2rem 0 1rem;font-size:1.4rem}\n' +
    '    .meta{color:var(--muted);font-size:.9rem;margin-bottom:2rem}\n' +
    '    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin:1.5rem 0}\n' +
    '    .stat{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;text-align:center}\n' +
    '    .stat .num{font-size:2rem;font-weight:700;color:var(--cyan)}\n' +
    '    .stat .label{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}\n' +
    '    .search{margin:1rem 0}\n' +
    '    .search input{background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:6px;padding:.6rem 1rem;color:var(--text);font-size:.95rem;width:100%;max-width:400px}\n' +
    '    .search input:focus{outline:none;border-color:var(--cyan);box-shadow:0 0 8px rgba(0,217,255,.3)}\n' +
    '    table.data-table{width:100%;border-collapse:collapse;font-size:.85rem;background:var(--card);border:1px solid var(--border);border-radius:6px;overflow:hidden}\n' +
    '    table.data-table th{text-align:left;padding:.6rem 1rem;background:rgba(0,0,0,.2);color:var(--cyan);font-size:.75rem;text-transform:uppercase}\n' +
    '    table.data-table td{padding:.5rem 1rem;border-top:1px solid rgba(255,255,255,.05)}\n' +
    '    .badge{display:inline-block;padding:.15rem .5rem;border-radius:3px;font-size:.7rem;font-weight:700;text-transform:uppercase}\n' +
    '    .badge.prod{background:rgba(0,255,136,.15);color:var(--green);border:1px solid rgba(0,255,136,.3)}\n' +
    '    .badge.dev{background:rgba(255,190,11,.15);color:var(--yellow);border:1px solid rgba(255,190,11,.3)}\n' +
    '    pre.tree{background:rgba(0,0,0,.4);border:1px solid rgba(0,217,255,.2);border-radius:8px;padding:1.5rem;overflow-x:auto;font-size:.75rem;max-height:600px;overflow-y:auto;white-space:pre;tab-size:2}\n' +
    '    a{color:var(--cyan)}\n' +
    '    .back-link{margin-top:2rem;display:inline-block}\n' +
    '    .hidden{display:none !important}\n' +
    '  </style>\n</head>\n<body>\n  <div class="container">\n' +
    '    <h1>📦 Dependency Report</h1>\n' +
    '    <p class="meta">' + escapeHtml(projectName) + (projectVersion ? ' v' + escapeHtml(projectVersion) : '') + '</p>\n' +
    '    <div class="stats">\n' +
    '      <div class="stat"><div class="num">' + directDeps + '</div><div class="label">Direct Dependencies</div></div>\n' +
    '      <div class="stat"><div class="num">' + productionDeps + '</div><div class="label">Production</div></div>\n' +
    '      <div class="stat"><div class="num">' + devDeps + '</div><div class="label">Dev Dependencies</div></div>\n' +
    '      <div class="stat"><div class="num">' + totalDeps + '</div><div class="label">Total (with transitive)</div></div>\n' +
    '    </div>\n' +
    (depList.length > 0 ? (
      '    <h2>📋 Direct Dependencies</h2>\n' +
      '    <div class="search"><input type="text" id="depSearch" placeholder="Search packages..." aria-label="Search dependencies"></div>\n' +
      '    <table class="data-table" id="depTable"><thead><tr><th>Package</th><th>Version</th><th>Type</th></tr></thead><tbody>' + depTableRows + '</tbody></table>\n'
    ) : '') +
    (treeText ? (
      '    <h2>🌳 Full Dependency Tree</h2>\n' +
      '    <details><summary>Expand tree (' + totalDeps + ' packages)</summary>\n' +
      '      <pre class="tree">' + escapedTree + '</pre>\n' +
      '    </details>\n'
    ) : '') +
    '    <p style="margin-top:1rem"><a href="dependency-tree.json">📄 dependency-tree.json</a> · <a href="dependency-tree.txt">📄 dependency-tree.txt</a></p>\n' +
    '    <a href="../index.html" class="back-link">← Back to Documentation Hub</a>\n' +
    '  </div>\n' +
    '  <script>\n' +
    '    (function(){\n' +
    '      var search=document.getElementById("depSearch");\n' +
    '      if(!search)return;\n' +
    '      var rows=document.querySelectorAll("#depTable tbody tr");\n' +
    '      search.addEventListener("input",function(){\n' +
    '        var q=search.value.toLowerCase();\n' +
    '        rows.forEach(function(r){\n' +
    '          var text=r.textContent.toLowerCase();\n' +
    '          r.style.display=(!q||text.indexOf(q)!==-1)?"":"none";\n' +
    '        });\n' +
    '      });\n' +
    '    })();\n' +
    '  </script>\n' +
    '</body>\n</html>';

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log('✅ Dependency report HTML generated at', outputPath,
    '(' + directDeps + ' direct, ' + totalDeps + ' total)');
} catch (error) {
  console.error('Failed to generate dependency report HTML:', error.message);
  process.exit(1);
}
