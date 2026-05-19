/**
 * @module parliamentary-data/fetch-tasks/anforanden
 * @description `search_anforanden` (speeches) fetch task factory.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { FetchTask, FetchTaskContext } from './index.js';
import { assignTo, runListFetch } from './_shared.js';

export function createAnforandenTask(ctx: FetchTaskContext): FetchTask {
  const { client, limit, rm } = ctx;
  return {
    name: 'searchSpeeches',
    source: 'search_anforanden',
    query: () => ({ limit, rm }),
    fetch: () => {
      const query = { limit, ...(rm ? { rm } : {}) };
      return runListFetch(ctx, 'search_anforanden', () => client.searchSpeeches(query));
    },
    assign: assignTo(ctx, 'speeches'),
  };
}
