/**
 * @module parliamentary-data/fetch-tasks/propositioner
 * @description `get_propositioner` fetch task factory.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { FetchTask, FetchTaskContext } from './index.js';
import { assignTo, runListFetch } from './_shared.js';

export function createPropositionerTask(ctx: FetchTaskContext): FetchTask {
  const { client, limit, rm } = ctx;
  return {
    name: 'fetchPropositions',
    source: 'get_propositioner',
    query: () => ({ limit, rm }),
    fetch: () => runListFetch(ctx, 'get_propositioner', () => client.fetchPropositions(limit, rm)),
    assign: assignTo(ctx, 'propositions'),
  };
}
