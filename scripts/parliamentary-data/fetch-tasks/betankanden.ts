/**
 * @module parliamentary-data/fetch-tasks/betankanden
 * @description `get_betankanden` (committee reports) fetch task factory.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { FetchTask, FetchTaskContext } from './index.js';
import { assignTo, runListFetch } from './_shared.js';

export function createBetankandenTask(ctx: FetchTaskContext): FetchTask {
  const { client, limit, rm } = ctx;
  return {
    name: 'fetchCommitteeReports',
    source: 'get_betankanden',
    query: () => ({ limit, rm }),
    fetch: () => runListFetch(ctx, 'get_betankanden', () => client.fetchCommitteeReports(limit, rm)),
    assign: assignTo(ctx, 'committeeReports'),
  };
}
