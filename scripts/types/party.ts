/**
 * @module Types/Party
 * @description Swedish political party types for entity normalization.
 */

/** Canonical party codes for the eight Riksdag parties */
export type PartyCode = 'S' | 'M' | 'SD' | 'V' | 'MP' | 'C' | 'L' | 'KD';

/** Map from party code to known name variants */
export type PartyVariantMap = Record<PartyCode, readonly string[]>;
