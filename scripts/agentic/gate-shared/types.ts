/**
 * @module scripts/agentic/gate-shared/types
 * @description Re-exports the gate-check result types from the artifact
 *              inventory so individual gate-check modules can import them
 *              from the shared bounded context without reaching across
 *              into the artifact catalogue file.
 *
 * @see scripts/agentic/artifact-inventory.ts — canonical type definitions
 * @author Hack23 AB
 * @license Apache-2.0
 */

export type {
  GateCheckResult,
  GateValidationResult,
} from '../artifact-inventory.js';
