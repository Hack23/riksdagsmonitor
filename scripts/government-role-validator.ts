/**
 * @module government-role-validator
 * @description Validates government role attributions against the CIA platform's
 * authoritative government role member data (view_riksdagen_goverment_role_member_sample.csv).
 *
 * ROOT CAUSE PREVENTION: Agentic workflows previously hallucinated government titles
 * (e.g. calling Lotta Edholm "Deputy Prime Minister" when she is gymnasie-, högskole-
 * och forskningsminister, and the actual Vice statsminister is Ebba Busch (KD)).
 * This module provides a validation layer that cross-references names against
 * known government roles from the CIA data export.
 *
 * The CSV is downloaded from:
 * https://raw.githubusercontent.com/Hack23/cia/refs/heads/master/service.data.impl/sample-data/view_riksdagen_goverment_role_member_sample.csv
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** A single government role record from the CIA data export. */
export interface GovernmentRoleMember {
  readonly roleId: string;
  readonly department: string;
  readonly roleCode: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly personId: string;
  readonly party: string;
  readonly active: boolean;
}

/** Result of validating a name + claimed role against known data. */
export interface RoleValidationResult {
  readonly valid: boolean;
  readonly name: string;
  readonly claimedRole: string;
  readonly actualRoles: readonly GovernmentRoleMember[];
  readonly suggestion: string;
}

const CSV_RELATIVE_PATH = 'cia-data/view_riksdagen_goverment_role_member_sample.csv';

/** Parse the CSV into GovernmentRoleMember records. */
function parseCSV(csvText: string): GovernmentRoleMember[] {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  // Skip header
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      roleId: cols[0] ?? '',
      department: cols[1] ?? '',
      roleCode: cols[2] ?? '',
      firstName: cols[3] ?? '',
      lastName: cols[4] ?? '',
      fromDate: cols[5] ?? '',
      toDate: cols[6] ?? '',
      personId: cols[7] ?? '',
      party: cols[8] ?? '',
      active: cols[10] === 't',
    };
  });
}

/** Normalise a name for fuzzy comparison (lowercase, trim, collapse whitespace). */
function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Load and cache the government role member data.
 * Uses the local CSV in cia-data/ as the authoritative source.
 */
let cachedMembers: GovernmentRoleMember[] | null = null;

export function loadGovernmentRoleMembers(repoRoot?: string): GovernmentRoleMember[] {
  if (cachedMembers) return cachedMembers;
  const root = repoRoot ?? resolve(import.meta.dirname ?? '.', '..');
  const csvPath = resolve(root, CSV_RELATIVE_PATH);
  try {
    const csvText = readFileSync(csvPath, 'utf-8');
    cachedMembers = parseCSV(csvText);
    return cachedMembers;
  } catch {
    // Graceful fallback — return empty if file not found
    console.warn(`[government-role-validator] Could not load ${csvPath}; role validation disabled.`);
    cachedMembers = [];
    return cachedMembers;
  }
}

/** Clear the cache (useful for testing). */
export function clearCache(): void {
  cachedMembers = null;
}

/**
 * Find all government roles for a person by last name (and optionally first name).
 * Returns roles sorted by most recent first.
 */
export function findRolesForPerson(
  lastName: string,
  firstName?: string,
  repoRoot?: string,
): GovernmentRoleMember[] {
  const members = loadGovernmentRoleMembers(repoRoot);
  const normLast = normaliseName(lastName);
  const normFirst = firstName ? normaliseName(firstName) : undefined;

  return members
    .filter(m => {
      if (normaliseName(m.lastName) !== normLast) return false;
      if (normFirst && normaliseName(m.firstName) !== normFirst) return false;
      return true;
    })
    .sort((a, b) => b.fromDate.localeCompare(a.fromDate));
}

/**
 * Get the current (most recent active, or most recent) role for a person.
 */
export function getCurrentRole(
  lastName: string,
  firstName?: string,
  repoRoot?: string,
): GovernmentRoleMember | undefined {
  const roles = findRolesForPerson(lastName, firstName, repoRoot);
  // Prefer active roles
  const active = roles.find(r => r.active);
  return active ?? roles[0];
}

/**
 * Validate whether a claimed government role title is correct for a person.
 * Returns a validation result with the actual role and a correction suggestion.
 *
 * @param fullName - Full name of the person (e.g. "Lotta Edholm")
 * @param claimedRole - The role attributed in the article (e.g. "Deputy Prime Minister")
 * @param repoRoot - Optional repository root path
 */
export function validateGovernmentRole(
  fullName: string,
  claimedRole: string,
  repoRoot?: string,
): RoleValidationResult {
  const parts = fullName.trim().split(/\s+/);
  const lastName = parts.pop() ?? '';
  const firstName = parts.join(' ') || undefined;
  const roles = findRolesForPerson(lastName, firstName, repoRoot);

  if (roles.length === 0) {
    return {
      valid: false,
      name: fullName,
      claimedRole,
      actualRoles: [],
      suggestion: `No government role records found for "${fullName}" in CIA data. Verify the name and role manually.`,
    };
  }

  const currentRole = roles.find(r => r.active) ?? roles[0];
  const claimedLower = claimedRole.toLowerCase();

  // Check if claimed role matches the actual role code or department
  const roleCodeLower = currentRole.roleCode.toLowerCase();
  const departmentLower = currentRole.department.toLowerCase();

  // Known title mappings for common roles
  const deputyPMTerms = ['deputy prime minister', 'vice statsminister', 'vice premier',
    'vicepremier', 'viceministerpräsident', 'vice-première ministre', 'viceprimera ministra',
    'varapääministeri', 'visestatsminister', 'vicestatsminister',
    'نائبة رئيس الوزراء', 'סגנית ראש הממשלה', '副首相', '부총리'];

  const isClaimingDeputyPM = deputyPMTerms.some(term => claimedLower.includes(term));

  // If claiming Deputy PM, the role_code should be "Statsminister" or explicitly Vice statsminister
  if (isClaimingDeputyPM && roleCodeLower !== 'statsminister') {
    return {
      valid: false,
      name: fullName,
      claimedRole,
      actualRoles: roles,
      suggestion: `"${fullName}" is ${currentRole.roleCode} at ${currentRole.department} (${currentRole.party}), NOT Deputy Prime Minister. ` +
        `Check if the actual Vice statsminister should be cited instead.`,
    };
  }

  // Check if claimed role roughly matches known role
  const matchesRole = claimedLower.includes(roleCodeLower) ||
    roleCodeLower.includes(claimedLower) ||
    claimedLower.includes(departmentLower);

  return {
    valid: matchesRole || !isClaimingDeputyPM,
    name: fullName,
    claimedRole,
    actualRoles: roles,
    suggestion: matchesRole
      ? `Role verified: "${fullName}" is ${currentRole.roleCode} at ${currentRole.department} (${currentRole.party}).`
      : `"${fullName}" is recorded as ${currentRole.roleCode} at ${currentRole.department} (${currentRole.party}). Claimed role "${claimedRole}" may need verification.`,
  };
}

/**
 * Get a formatted role description for a person suitable for article text.
 * Returns the most current role in "RoleCode FirstName LastName (Party)" format.
 */
export function getFormattedRole(
  lastName: string,
  firstName?: string,
  repoRoot?: string,
): string | undefined {
  const role = getCurrentRole(lastName, firstName, repoRoot);
  if (!role) return undefined;
  return `${role.roleCode} ${role.firstName} ${role.lastName} (${role.party})`;
}
