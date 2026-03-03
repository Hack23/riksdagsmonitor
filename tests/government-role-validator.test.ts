/**
 * Unit Tests for Government Role Validator
 * Tests validation of government role attributions against CIA data.
 *
 * ROOT CAUSE PREVENTION: Ensures that agentic workflows cannot hallucinate
 * government titles (e.g. calling Lotta Edholm "Deputy Prime Minister"
 * when she is Statsråd at Utbildningsdepartementet).
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  loadGovernmentRoleMembers,
  findRolesForPerson,
  getCurrentRole,
  validateGovernmentRole,
  getFormattedRole,
  clearCache,
} from '../scripts/government-role-validator.js';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');

afterEach(() => {
  clearCache();
});

describe('Government Role Validator', () => {
  describe('loadGovernmentRoleMembers', () => {
    it('should load government role members from CIA CSV', () => {
      const members = loadGovernmentRoleMembers(REPO_ROOT);
      expect(members.length).toBeGreaterThan(0);
      // Check that records have expected fields
      const first = members[0];
      expect(first).toHaveProperty('roleId');
      expect(first).toHaveProperty('department');
      expect(first).toHaveProperty('roleCode');
      expect(first).toHaveProperty('firstName');
      expect(first).toHaveProperty('lastName');
      expect(first).toHaveProperty('party');
    });

    it('should gracefully return empty array if CSV not found', () => {
      const members = loadGovernmentRoleMembers('/nonexistent/path');
      expect(members).toEqual([]);
    });
  });

  describe('findRolesForPerson', () => {
    it('should find roles for Lotta Edholm', () => {
      const roles = findRolesForPerson('Edholm', 'Lotta', REPO_ROOT);
      expect(roles.length).toBeGreaterThan(0);
      expect(roles[0].firstName).toBe('Lotta');
      expect(roles[0].lastName).toBe('Edholm');
    });

    it('should find roles by last name only', () => {
      const roles = findRolesForPerson('Strömmer', undefined, REPO_ROOT);
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should return empty for unknown person', () => {
      const roles = findRolesForPerson('UnknownPerson123', undefined, REPO_ROOT);
      expect(roles).toEqual([]);
    });

    it('should return results sorted by most recent first', () => {
      const roles = findRolesForPerson('Edholm', 'Lotta', REPO_ROOT);
      if (roles.length > 1) {
        expect(roles[0].fromDate >= roles[1].fromDate).toBe(true);
      }
    });
  });

  describe('getCurrentRole', () => {
    it('should return a role for known politicians', () => {
      const role = getCurrentRole('Edholm', 'Lotta', REPO_ROOT);
      expect(role).toBeDefined();
      expect(role!.lastName).toBe('Edholm');
    });

    it('should return undefined for unknown politicians', () => {
      const role = getCurrentRole('Nobody123', 'Test', REPO_ROOT);
      expect(role).toBeUndefined();
    });
  });

  describe('validateGovernmentRole', () => {
    it('should reject Lotta Edholm as Deputy Prime Minister', () => {
      const result = validateGovernmentRole('Lotta Edholm', 'Deputy Prime Minister', REPO_ROOT);
      expect(result.valid).toBe(false);
      expect(result.suggestion).toContain('NOT Deputy Prime Minister');
    });

    it('should reject Lotta Edholm as vice statsminister', () => {
      const result = validateGovernmentRole('Lotta Edholm', 'vice statsminister', REPO_ROOT);
      expect(result.valid).toBe(false);
    });

    it('should flag unknown persons', () => {
      const result = validateGovernmentRole('Unknown Person', 'Minister', REPO_ROOT);
      expect(result.valid).toBe(false);
      expect(result.suggestion).toContain('No government role records found');
    });

    it('should handle multi-language Deputy PM terms', () => {
      // Japanese
      const ja = validateGovernmentRole('Lotta Edholm', '副首相', REPO_ROOT);
      expect(ja.valid).toBe(false);

      // Korean
      const ko = validateGovernmentRole('Lotta Edholm', '부총리', REPO_ROOT);
      expect(ko.valid).toBe(false);

      // Arabic
      const ar = validateGovernmentRole('Lotta Edholm', 'نائبة رئيس الوزراء', REPO_ROOT);
      expect(ar.valid).toBe(false);
    });
  });

  describe('getFormattedRole', () => {
    it('should return formatted role for known politician', () => {
      const formatted = getFormattedRole('Edholm', 'Lotta', REPO_ROOT);
      expect(formatted).toBeDefined();
      expect(formatted).toContain('Edholm');
      expect(formatted).toContain('L');
    });

    it('should return undefined for unknown politician', () => {
      const formatted = getFormattedRole('Nobody123', 'Test', REPO_ROOT);
      expect(formatted).toBeUndefined();
    });
  });
});
