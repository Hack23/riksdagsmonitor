/**
 * @module parliamentary-data/fetch-tasks/interpellationer
 * @description `get_interpellationer` fetch task factory.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { FetchTask, FetchTaskContext } from './index.js';
import { assignTo, runListFetch } from './_shared.js';

export function createInterpellationerTask(ctx: FetchTaskContext): FetchTask {
  const { client, limit, rm } = ctx;
  return {
    name: 'fetchInterpellations',
    source: 'get_interpellationer',
    query: () => ({ limit, rm }),
    fetch: () => {
      const query = { limit, ...(rm ? { rm } : {}) };
      return runListFetch(ctx, 'get_interpellationer', () => client.fetchInterpellations(query));
    },
    assign: assignTo(ctx, 'interpellations'),
  };
}
