import fs from 'node:fs';
import vm from 'node:vm';
const src = fs.readFileSync('/tmp/papa-cdn.js','utf8').replace(/^import [^;]+;/, '// ');
try {
  new vm.SourceTextModule(src, { identifier: 'papa.js' });
  console.log('OK');
} catch (e) {
  console.log('ERR:', e.message);
  if (e.stack) console.log(e.stack.split('\n').slice(0,3).join('\n'));
}
