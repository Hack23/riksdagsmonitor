/**
 * @module Shared/Logger
 * @description Debug logger gated by ?debug URL parameter.
 * Only logs when debug mode is enabled to keep production console clean.
 */

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
