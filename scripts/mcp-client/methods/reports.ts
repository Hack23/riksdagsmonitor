/**
 * @module mcp-client/methods/reports
 * @description Committee reports, propositions, motions, written questions
 * and interpellations — all the "latest N from this riksmöte" style tools.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPTransportClient } from '../transport/jsonrpc.js';

export async function fetchCommitteeReports(
  transport: MCPTransportClient,
  limit = 10,
  rm: string | null = null,
  organ: string | null = null,
): Promise<unknown[]> {
  const params: Record<string, unknown> = { limit };
  if (rm) params['rm'] = rm;
  if (organ) params['organ'] = organ;

  const response = await transport.request('get_betankanden', params);
  return (response['dokument'] ?? response['reports'] ?? []) as unknown[];
}

export async function fetchPropositions(
  transport: MCPTransportClient,
  limit = 10,
  rm: string | null = null,
): Promise<unknown[]> {
  const params: Record<string, unknown> = { limit };
  if (rm) params['rm'] = rm;

  const response = await transport.request('get_propositioner', params);
  return (response['dokument'] ?? response['propositions'] ?? []) as unknown[];
}

export async function fetchMotions(
  transport: MCPTransportClient,
  limit = 10,
  rm: string | null = null,
): Promise<unknown[]> {
  const params: Record<string, unknown> = { limit };
  if (rm) params['rm'] = rm;

  const response = await transport.request('get_motioner', params);
  return (response['dokument'] ?? response['motions'] ?? []) as unknown[];
}

export async function fetchWrittenQuestions(
  transport: MCPTransportClient,
  params: { limit?: number; rm?: string } = {},
): Promise<unknown[]> {
  const reqParams: Record<string, unknown> = { limit: params.limit ?? 20 };
  if (params.rm) reqParams['rm'] = params.rm;
  const response = await transport.request('get_fragor', reqParams);
  return (response['dokument'] ?? response['questions'] ?? []) as unknown[];
}

export async function fetchInterpellations(
  transport: MCPTransportClient,
  params: { limit?: number; rm?: string } = {},
): Promise<unknown[]> {
  const reqParams: Record<string, unknown> = { limit: params.limit ?? 15 };
  if (params.rm) reqParams['rm'] = params.rm;
  const response = await transport.request('get_interpellationer', reqParams);
  return (response['dokument'] ?? response['interpellations'] ?? []) as unknown[];
}
