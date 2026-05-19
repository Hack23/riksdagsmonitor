/**
 * @module parliamentary-data/fetch-tasks/motioner
 * @description `get_motioner` fetch task factory.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { FetchTask, FetchTaskContext } from './index.js';
import { assignTo, runListFetch } from './_shared.js';

export function createMotionerTask(ctx: FetchTaskContext): FetchTask {
  const { client, limit, rm } = ctx;
  return {
    name: 'fetchMotions',
    source: 'get_motioner',
    query: () => ({ limit, rm }),
    fetch: () => runListFetch(ctx, 'get_motioner', () => client.fetchMotions(limit, rm)),
    assign: assignTo(ctx, 'motions'),
  };
}
