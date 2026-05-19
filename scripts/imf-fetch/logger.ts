/**
 * @module scripts/imf-fetch/logger
 * @description Structured CLI logger for `imf-fetch.ts`.
 *
 * Emits one-line JSON per event to stderr so agentic workflows can
 * parse it. stdout is reserved for the data payload (the CLI contract).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export type ImfCliLogLevel = 'info' | 'warn' | 'error';
export type ImfCliFailureClassification = 'transient' | 'permanent';

export interface ImfCliLogEvent {
  readonly timestamp: string;
  readonly level: ImfCliLogLevel;
  readonly command: 'weo';
  readonly event: string;
  readonly country: string;
  readonly indicator: string;
  readonly message: string;
  readonly attempt?: number;
  readonly maxAttempts?: number;
  readonly transport?: 'datamapper' | 'sdmx' | 'direct-datamapper' | 'cache';
  readonly classification?: ImfCliFailureClassification;
}

export function defaultCliLogger(event: ImfCliLogEvent): void {
  process.stderr.write(`${JSON.stringify(event)}\n`);
}

interface CliLogEventContext {
  readonly country: string;
  readonly indicator: string;
}

export function createCliLogEvent(
  options: CliLogEventContext,
  level: ImfCliLogLevel,
  event: string,
  message: string,
  extra: Partial<
    Omit<ImfCliLogEvent, 'timestamp' | 'level' | 'command' | 'event' | 'message' | 'country' | 'indicator'>
  > = {},
): ImfCliLogEvent {
  return {
    timestamp: new Date().toISOString(),
    level,
    command: 'weo',
    event,
    country: options.country,
    indicator: options.indicator,
    message,
    ...extra,
  };
}
