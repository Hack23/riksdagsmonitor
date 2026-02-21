/**
 * @module Shared/Logger
 * @description Debug logger gated by ?debug URL parameter.
 * Only logs when debug mode is enabled to keep production console clean.

 *
 * @intelligence Intelligence operations monitoring — conditional debug logging (?debug URL parameter) for production diagnostics without exposing operational details. Supports incident analysis and performance investigation.
 *
 * @business Operational cost reduction — debug-gated logging keeps production console clean, reducing noise in error monitoring. Enables field debugging for support teams without code changes or redeployment.
 *
 * @marketing Developer experience feature — debug mode is demonstrable in technical blog posts and documentation. Positions the platform as developer-friendly for open-source community engagement.
 * */

const isDebug = typeof window !== 'undefined' &&
  new URLSearchParams(window.location?.search).has('debug');

export const logger = {
  debug(...args: unknown[]): void {
    if (isDebug) console.debug('[RDM]', ...args);
  },
  info(...args: unknown[]): void {
    if (isDebug) console.info('[RDM]', ...args);
  },
  warn(...args: unknown[]): void {
    console.warn('[RDM]', ...args);
  },
  error(...args: unknown[]): void {
    console.error('[RDM]', ...args);
  },
};
