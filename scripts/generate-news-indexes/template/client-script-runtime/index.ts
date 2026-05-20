/**
 * @module generate-news-indexes/template/client-script-runtime
 * @description Entry point that assembles the inline `<script>` body from
 * focused fragments. Each fragment is a string of plain JavaScript shipped
 * verbatim into the rendered news-index HTML. The order matters: helpers
 * first, then state + render, then filter chrome, then pagination/URL,
 * then the search dispatcher + event wiring at the bottom (so every
 * referenced function is hoisted / declared into scope by then).
 *
 * This file is the CSP-relevant entry — keeping it ≤ 150 lines lets it be
 * audited as a single review unit per `Secure_Development_Policy.md`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { HELPER_FUNCTIONS } from './helpers.js';
import { RENDERING } from './rendering.js';
import { FILTERING } from './filtering.js';
import { SORTING } from './sorting.js';
import { SEARCH } from './search.js';

/** Pure-literal client runtime body (see module doc). */
export const CLIENT_RUNTIME_BODY = `${HELPER_FUNCTIONS}${RENDERING}${FILTERING}${SORTING}${SEARCH}`;
