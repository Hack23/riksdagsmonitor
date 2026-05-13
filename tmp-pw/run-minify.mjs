import { minify } from 'minify';
import fs from 'node:fs';
const out = await minify('/tmp/papa-orig.js');
fs.writeFileSync('/tmp/papa-min.js', out);
console.log('len before:', fs.readFileSync('/tmp/papa-orig.js','utf8').length, 'after:', out.length);
