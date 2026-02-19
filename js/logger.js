/**
 * @module Logger
 * @category Utilities - Logging
 *
 * @description
 * Debug logger utility gated behind `?debug` URL parameter.
 * In production, only warnings and errors are emitted.
 * Enable debug output by appending `?debug` to the page URL.
 *
 * @example
 * // Enable debug logging:
 * // https://riksdagsmonitor.com/?debug
 *
 * import { logger } from './logger.js';
 * logger.debug('Loading CSV:', filename);
 * logger.error('Failed to load:', error);
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const DEBUG = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('debug');

/**
 * Structured logger with debug gating.
 * debug/info messages are suppressed unless ?debug is present in the URL.
 */
export const logger = {
  /**
   * Log a debug message (only visible with ?debug URL parameter).
   * @param {...*} args - Arguments to log
   */
  debug(...args) {
    if (DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log an info message (only visible with ?debug URL parameter).
   * @param {...*} args - Arguments to log
   */
  info(...args) {
    if (DEBUG) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Log a warning (always visible).
   * @param {...*} args - Arguments to log
   */
  warn(...args) {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log an error (always visible).
   * @param {...*} args - Arguments to log
   */
  error(...args) {
    console.error('[ERROR]', ...args);
  }
};
