import fs from 'node:fs';
import { parse } from '@babel/parser';
const src = fs.readFileSync('/tmp/papa-cdn.js','utf8');
try {
  parse(src, { sourceType: 'module', errorRecovery: false });
  console.log('OK');
} catch (e) {
  console.log('ERR:', e.message);
  if (e.loc) console.log('at:', e.loc);
}
