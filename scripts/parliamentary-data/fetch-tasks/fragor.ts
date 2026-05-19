/**
 * @module parliamentary-data/fetch-tasks/fragor
 * @description `get_fragor` (written questions) fetch task factory.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { FetchTask, FetchTaskContext } from './index.js';
import { assignTo, runListFetch } from './_shared.js';

export function createFragorTask(ctx: FetchTaskContext): FetchTask {
  const { client, limit, rm } = ctx;
  return {
    name: 'fetchWrittenQuestions',
    source: 'get_fragor',
    query: () => ({ limit, rm }),
    fetch: () => {
      const query = { limit, ...(rm ? { rm } : {}) };
      return runListFetch(ctx, 'get_fragor', () => client.fetchWrittenQuestions(query));
    },
    assign: assignTo(ctx, 'questions'),
  };
}
