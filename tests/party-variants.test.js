import { describe, it, expect, afterEach, vi } from 'vitest';
import { PARTY_VARIANTS, extractPartyMentions } from '../scripts/party-variants.js';

describe('party-variants', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PARTY_VARIANTS', () => {
    it('should have all 8 Swedish parliamentary parties', () => {
      const expectedParties = ['S', 'M', 'SD', 'V', 'MP', 'C', 'L', 'KD'];
      const actualParties = Object.keys(PARTY_VARIANTS);
      
      expect(actualParties.sort()).toEqual(expectedParties.sort());
    });

    it('should have canonical code and variants for each party', () => {
      Object.entries(PARTY_VARIANTS).forEach(([code, variants]) => {
        expect(Array.isArray(variants)).toBe(true);
        expect(variants.length).toBeGreaterThan(0);
        // Code should be included in variants
        expect(variants).toContain(code);
      });
    });

    it('should have correct Socialdemokraterna variants', () => {
      expect(PARTY_VARIANTS.S).toEqual(['Socialdemokraterna', 'S']);
    });

    it('should have correct Moderaterna variants', () => {
      expect(PARTY_VARIANTS.M).toEqual(['Moderaterna', 'M']);
    });

    it('should have correct Sverigedemokraterna variants', () => {
      expect(PARTY_VARIANTS.SD).toEqual(['Sverigedemokraterna', 'SD']);
    });

    it('should have correct Vänsterpartiet variants', () => {
      expect(PARTY_VARIANTS.V).toEqual(['Vänsterpartiet', 'V']);
    });

    it('should have correct Miljöpartiet variants', () => {
      expect(PARTY_VARIANTS.MP).toEqual(['Miljöpartiet', 'MP']);
    });

    it('should have correct Centerpartiet variants', () => {
      expect(PARTY_VARIANTS.C).toEqual(['Centerpartiet', 'C']);
    });

    it('should have correct Liberalerna variants', () => {
      expect(PARTY_VARIANTS.L).toEqual(['Liberalerna', 'L']);
    });

    it('should have correct Kristdemokraterna variants', () => {
      expect(PARTY_VARIANTS.KD).toEqual(['Kristdemokraterna', 'KD']);
    });

    it('should have unique variants within each party', () => {
      Object.entries(PARTY_VARIANTS).forEach(([code, variants]) => {
        const uniqueVariants = [...new Set(variants)];
        expect(variants.length).toBe(uniqueVariants.length);
      });
    });
  });

  describe('extractPartyMentions', () => {
    describe('Single party detection', () => {
      it('should detect Socialdemokraterna by full name', () => {
        const html = '<p>Socialdemokraterna presenterade sitt förslag.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('S')).toBe(true);
      });

      it('should detect Socialdemokraterna by abbreviation', () => {
        const html = '<p>S presenterade sitt förslag.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('S')).toBe(true);
      });

      it('should detect Moderaterna by full name', () => {
        const html = '<p>Moderaterna röstade mot förslaget.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('M')).toBe(true);
      });

      it('should detect Sverigedemokraterna', () => {
        const html = '<p>Sverigedemokraterna lade fram ett ändringsförslag.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('SD')).toBe(true);
      });

      it('should detect Vänsterpartiet', () => {
        const html = '<p>Vänsterpartiet kritiserade regeringen.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('V')).toBe(true);
      });

      it('should detect Miljöpartiet', () => {
        const html = '<p>Miljöpartiet betonade klimatfrågan.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('MP')).toBe(true);
      });

      it('should detect MP abbreviation after HTML tag', () => {
        const html = '<p>MP röstade för förslaget.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('MP')).toBe(true);
      });

      it('should detect SD abbreviation after HTML tag', () => {
        const html = '<p>SD lade fram ett ändringsförslag.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('SD')).toBe(true);
      });

      it('should detect KD abbreviation after HTML tag', () => {
        const html = '<p>KD lade fram ett alternativ.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('KD')).toBe(true);
      });

      it('should detect Centerpartiet', () => {
        const html = '<p>Centerpartiet föreslog en kompromiss.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('C')).toBe(true);
      });

      it('should detect Liberalerna', () => {
        const html = '<p>Liberalerna stödde förslaget.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('L')).toBe(true);
      });

      it('should detect Kristdemokraterna', () => {
        const html = '<p>Kristdemokraterna lade fram ett alternativ.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('KD')).toBe(true);
      });
    });

    describe('Multiple parties detection', () => {
      it('should detect two parties', () => {
        const html = '<p>Socialdemokraterna och Moderaterna enades om budgeten.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(2);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
      });

      it('should detect three parties', () => {
        const html = '<p>S, M och SD röstade för förslaget.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(3);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
        expect(parties.has('SD')).toBe(true);
      });

      it('should detect all eight parties', () => {
        const html = `
          <p>Socialdemokraterna, Moderaterna, Sverigedemokraterna, Vänsterpartiet,
          Miljöpartiet, Centerpartiet, Liberalerna och Kristdemokraterna deltog i debatten.</p>
        `;
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(8);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
        expect(parties.has('SD')).toBe(true);
        expect(parties.has('V')).toBe(true);
        expect(parties.has('MP')).toBe(true);
        expect(parties.has('C')).toBe(true);
        expect(parties.has('L')).toBe(true);
        expect(parties.has('KD')).toBe(true);
      });

      it('should detect mix of full names and abbreviations', () => {
        const html = '<p>Socialdemokraterna och M enades. SD och Vänsterpartiet var emot.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(4);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
        expect(parties.has('SD')).toBe(true);
        expect(parties.has('V')).toBe(true);
      });
    });

    describe('No double-counting', () => {
      it('should count party once when both full name and abbreviation appear', () => {
        const html = '<p>Socialdemokraterna (S) röstade för förslaget.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('S')).toBe(true);
      });

      it('should count party once when full name appears multiple times', () => {
        const html = '<p>Socialdemokraterna kritiserade förslaget. Socialdemokraterna föreslog ett alternativ.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('S')).toBe(true);
      });

      it('should count party once when abbreviation appears multiple times', () => {
        const html = '<p>M röstade för. M stödde också ändringsförslaget.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('M')).toBe(true);
      });

      it('should prevent double-counting in complex scenario', () => {
        const html = `
          <p>Socialdemokraterna (S) och Moderaterna enades. 
          S bekräftade sitt stöd. Moderaterna (M) röstade också för.</p>
        `;
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(2);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
      });
    });

    describe('Case-insensitive matching', () => {
      it('should detect lowercase party names', () => {
        const html = '<p>socialdemokraterna röstade för förslaget.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('S')).toBe(true);
      });

      it('should detect uppercase party abbreviations', () => {
        const html = '<p>S RÖSTADE FÖR FÖRSLAGET.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('S')).toBe(true);
      });

      it('should detect mixed case party names', () => {
        const html = '<p>SoCiAlDeMoKrAtErNa och MoDeRaTErNa röstade för.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(2);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
      });
    });

    describe('Word boundary matching', () => {
      it('should match full word "S" not partial "SD"', () => {
        const html = '<p>S röstade för men SD röstade emot.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(2);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('SD')).toBe(true);
      });

      it('should match full word "M" not partial "MP"', () => {
        const html = '<p>M och MP hade olika åsikter.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(2);
        expect(parties.has('M')).toBe(true);
        expect(parties.has('MP')).toBe(true);
      });

      it('should not match party name as substring of another word', () => {
        const html = '<p>Demokratisering av samhället diskuterades.</p>';
        const parties = extractPartyMentions(html);
        
        // Should not match "demokrat" from Kristdemokraterna or Socialdemokraterna
        expect(parties.size).toBe(0);
      });

      it('should match party name with punctuation', () => {
        const html = '<p>Socialdemokraterna, Moderaterna och Centerpartiet.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(3);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
        expect(parties.has('C')).toBe(true);
      });

      it('should match party name at start of sentence', () => {
        const html = '<p>Socialdemokraterna röstade för.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('S')).toBe(true);
      });

      it('should match party name at end of sentence', () => {
        const html = '<p>Förslaget stöddes av Socialdemokraterna.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(1);
        expect(parties.has('S')).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should return empty Set for empty string', () => {
        const parties = extractPartyMentions('');
        
        expect(parties.size).toBe(0);
        expect(parties instanceof Set).toBe(true);
      });

      it('should return empty Set for null input', () => {
        const parties = extractPartyMentions(null);
        
        expect(parties.size).toBe(0);
        expect(parties instanceof Set).toBe(true);
      });

      it('should return empty Set for undefined input', () => {
        const parties = extractPartyMentions(undefined);
        
        expect(parties.size).toBe(0);
        expect(parties instanceof Set).toBe(true);
      });

      it('should return empty Set for text without party mentions', () => {
        const html = '<p>Detta är en artikel om något helt annat.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(0);
      });

      it('should handle HTML with tags and attributes', () => {
        const html = '<div class="article"><p><strong>Socialdemokraterna</strong> och <em>Moderaterna</em> enades.</p></div>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(2);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
      });

      it('should handle HTML entities', () => {
        const html = '<p>Socialdemokraterna &amp; Moderaterna</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(2);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
      });

      it('should handle newlines and multiple spaces', () => {
        const html = `
          <p>Socialdemokraterna
          
          och    Moderaterna</p>
        `;
        const parties = extractPartyMentions(html);
        
        expect(parties.size).toBe(2);
        expect(parties.has('S')).toBe(true);
        expect(parties.has('M')).toBe(true);
      });
    });

    describe('Returns Set', () => {
      it('should return a Set instance', () => {
        const html = '<p>Socialdemokraterna röstade för.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties instanceof Set).toBe(true);
      });

      it('should return canonical codes not variants', () => {
        const html = '<p>Socialdemokraterna (S) röstade för.</p>';
        const parties = extractPartyMentions(html);
        
        expect(parties.has('S')).toBe(true);
        expect(parties.has('Socialdemokraterna')).toBe(false);
      });

      it('should be iterable', () => {
        const html = '<p>S, M och SD röstade för.</p>';
        const parties = extractPartyMentions(html);
        const partyArray = Array.from(parties);
        
        expect(partyArray.length).toBe(3);
        expect(partyArray).toContain('S');
        expect(partyArray).toContain('M');
        expect(partyArray).toContain('SD');
      });
    });
  });
});
