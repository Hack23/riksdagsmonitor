import { readFileSync, writeFileSync } from 'node:fs';
import { Window } from './node_modules/happy-dom/lib/index.js';
import { execSync } from 'node:child_process';

const w = new Window();
globalThis.window = w;
globalThis.document = w.document;
globalThis.DOMPurify = { sanitize: (s)=>s, addHook: ()=>{} };

const mermaid = (await import('./node_modules/mermaid/dist/mermaid.core.mjs')).default;
mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });

const out = execSync("grep -rl '^```mermaid' analysis --include=*.md", { maxBuffer: 200 * 1024 * 1024 }).toString();
const files = out.trim().split('\n').filter(Boolean);

const broken = [];
const stats = { totalFiles: files.length, totalBlocks: 0, brokenBlocks: 0, brokenFiles: 0 };

function extractMermaidBlocks(body) {
  const blocks = [];
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```mermaid[\t ]*$/.test(line)) {
      const startLine = i + 1;
      const bodyLines = [];
      let consumedClose = false;
      let j = i + 1;
      for (; j < lines.length; j++) {
        const cur = lines[j];
        if (/^```[\t ]*$/.test(cur)) { consumedClose = true; break; }
        if (/^```/.test(cur)) break;
        bodyLines.push(cur);
      }
      blocks.push({ startLine, body: bodyLines.join('\n'), unclosed: !consumedClose });
      i = consumedClose ? j + 1 : j;
      continue;
    }
    i++;
  }
  return blocks;
}

let processed = 0;
for (const file of files) {
  let body;
  try { body = readFileSync(file, 'utf8'); } catch { continue; }
  const blocks = extractMermaidBlocks(body);
  stats.totalBlocks += blocks.length;
  let fileBrokenN = 0;
  for (const b of blocks) {
    let err = null;
    let errMsg = null;
    if (b.unclosed) err = 'unclosed-fence';
    else {
      try {
        await mermaid.parse(b.body);
      } catch (e) {
        err = 'parse-failed';
        errMsg = String(e?.message || e).split('\n')[0].slice(0, 300);
      }
    }
    if (err) {
      stats.brokenBlocks++;
      fileBrokenN++;
      broken.push({ file, startLine: b.startLine, err, errMsg, sample: b.body.split('\n').slice(0, 4).join(' | ').slice(0, 250) });
    }
  }
  if (fileBrokenN) stats.brokenFiles++;
  processed++;
  if (processed % 500 === 0) process.stderr.write(`processed ${processed}/${files.length}, broken: ${stats.brokenBlocks}\n`);
}

writeFileSync('/tmp/mermaid-broken.json', JSON.stringify({ stats, broken }, null, 2));
console.log('STATS', JSON.stringify(stats));
