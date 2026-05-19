/**
 * @module scripts/statskontoret/internal/text
 * @description Internal shared text/number/XML helpers used across the
 * Statskontoret submodules (extractors, parsers, domain filters).
 *
 * Not part of the public re-export surface — callers must continue importing
 * the high-level symbols from `scripts/statskontoret-client.js`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { decodeHtmlEntities } from '../../html-utils.js';

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

export function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function decodeHtml(value: string): string {
  return decodeHtmlEntities(value).replace(/\u00a0/g, ' ');
}

export function decodeXml(value: string): string {
  return decodeHtml(value);
}

export function parseStatskontoretSwedishNumber(value: string): number | undefined {
  const compact = value.replace(/\s/g, '');
  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseStatskontoretOptionalInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildRecordLookup(record: Record<string, string>): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [key, value] of Object.entries(record)) {
    lookup.set(normalizeKey(key), value);
  }
  return lookup;
}

export function findField(
  lookup: ReadonlyMap<string, string>,
  candidates: readonly string[],
): string | undefined {
  const normalizedCandidates = candidates.map(normalizeKey);
  for (const candidate of normalizedCandidates) {
    const exact = lookup.get(candidate);
    if (exact !== undefined) return exact;
  }
  for (const [key, value] of lookup.entries()) {
    if (normalizedCandidates.some((candidate) => key.includes(candidate))) return value;
  }
  return undefined;
}

export function parseXmlAttributes(input: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const attrRe = /([\w:-]+)=["']([^"']*)["']/g;
  for (const match of input.matchAll(attrRe)) {
    attrs.set(match[1], decodeXml(match[2] ?? ''));
  }
  return attrs;
}

export function firstXmlTagValue(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml);
  return match ? decodeXml(match[1] ?? '') : undefined;
}

export function extractTextNodes(xml: string): string {
  const parts: string[] = [];
  const textRe = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
  for (const match of xml.matchAll(textRe)) {
    parts.push(decodeXml(match[1] ?? ''));
  }
  return parts.join('');
}
