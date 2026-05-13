import { minify } from 'minify';
import fs from 'node:fs';
try {
  const out = await minify('/tmp/papa-orig.js');
  fs.writeFileSync('/tmp/papa-min.js', out);
  console.log('OK, len:', out.length, 'type:', typeof out);
} catch (err) {
  console.log('CAUGHT:', err.message);
}
