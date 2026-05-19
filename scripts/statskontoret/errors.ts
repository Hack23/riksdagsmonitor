/**
 * @module scripts/statskontoret/errors
 * @description Typed error class for the Statskontoret client.
 *
 * `kind` lets callers distinguish transport, parsing, contract and CLI
 * failures without brittle message matching.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Typed error thrown by the Statskontoret client and parsers.
 */
export class StatskontoretError extends Error {
  readonly kind: 'http' | 'workbook' | 'contract' | 'cli';

  constructor(
    message: string,
    kind: StatskontoretError['kind'] = 'contract',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'StatskontoretError';
    this.kind = kind;
  }
}
