/**
 * Shared HTML utility functions
 * 
 * Common helpers used across news generation scripts to avoid duplication.
 * Provides safe HTML escaping and other shared utilities.
 */

/**
 * Escape HTML special characters for safe inclusion in HTML/JSON-LD.
 * Prevents XSS by converting &, <, >, ", ' to their HTML entity equivalents.
 * 
 * @param {string} text - Raw text to escape
 * @returns {string} Escaped text safe for HTML insertion
 */
export function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
