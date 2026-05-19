/**
 * @module scripts/validators/article/walker
 * @description Recursive `article.md` walker used by the validator CLI
 *              when no explicit path is supplied.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 151–164. Logic is
 *              byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export async function walk(dir: string, name: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    const st = await stat(full);
    if (st.isDirectory()) {
      out.push(...(await walk(full, name)));
    } else if (entry === name) {
      out.push(full);
    }
  }
  return out;
}
