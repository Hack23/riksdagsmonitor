/**
 * @module imf/config/auth
 * @description IMF Data SDMX subscription key resolver.
 *
 * **This file is the sole reader of `IMF_SDMX_SUBSCRIPTION_KEY` in
 * the codebase.** Any other module that needs the key MUST call
 * {@link resolveSdmxSubscriptionKey} — never read `process.env`
 * directly. Enforced by the static-source scan in
 * `tests/imf/refactor-invariants.test.ts` ("IMF SDMX subscription key
 * auth boundary").
 *
 * `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY` is intentionally **not** read
 * by any code in this repository — it is the cold rotation key,
 * stored only (see `analysis/imf/agentic-integration.md §"Pre-warm
 * gate" → "Key rotation"`).
 *
 * Rationale: keeps the auth surface minimal per the
 * `Authentication-and-Credentials-for-Agentic-Workflows` skill, and
 * makes key rotation (primary → secondary) a localised change.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Resolve the IMF SDMX subscription key.
 *
 * Resolution order:
 *  1. Explicit `override` (constructor / CLI argument)
 *  2. `process.env.IMF_SDMX_SUBSCRIPTION_KEY` (primary, required)
 *  3. Empty string — caller sends no `Ocp-Apim-Subscription-Key`
 *     header, which IMF Azure APIM masks as HTTP 404 on `/data/...`
 *     endpoints. The {@link ImfHttpError} message disambiguates.
 *
 * `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY` is intentionally **not** read
 * here. It is the cold rotation key, stored only — see
 * `analysis/imf/agentic-integration.md §"Pre-warm gate" → "Key rotation"`.
 *
 * @param override Optional explicit key (test fixtures / programmatic).
 * @returns Empty string when no key configured; never throws.
 */
export function resolveSdmxSubscriptionKey(override?: string): string {
  if (override !== undefined) return override;
  return process.env['IMF_SDMX_SUBSCRIPTION_KEY'] ?? '';
}
