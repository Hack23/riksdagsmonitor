import { minify } from 'minify';
import fs from 'node:fs';
try {
  const out = await minify('/tmp/papa-vite.js');
  fs.writeFileSync('/tmp/papa-vite-min.js', out);
  console.log('OK len:', out.length);
} catch (err) {
  console.log('CAUGHT:', err.message);
}
