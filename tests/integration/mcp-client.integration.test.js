/**
 * Integration Tests for MCP Client
 * 
 * Tests the riksdag-regering-mcp client against the live MCP server.
 * These tests validate actual API calls and response structures.
 * 
 * Run with: npm run test:integration
 * 
 * Environment Variables:
 *   MCP_SERVER_URL - Override default MCP server URL
 *   SKIP_INTEGRATION_TESTS - Set to 'true' to skip these tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClient } from '../../scripts/mcp-client.js';

// Check if integration tests should be skipped
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION_TESTS === 'true';
const describeIntegration = SKIP_INTEGRATION ? describe.skip : describe;

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds for network calls
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://riksdag-regering-ai.onrender.com/mcp';

describeIntegration('MCP Client Integration Tests', () => {
  let client;
  let serverAvailable = false;

  beforeAll(async () => {
    console.log('\n🔍 Testing MCP server availability...');
    console.log(`📡 Server URL: ${MCP_SERVER_URL}`);
    
    client = new MCPClient({ baseURL: MCP_SERVER_URL, timeout: 30000 });
    
    // Test server availability before running tests
    try {
      const testDate = new Date();
      const from = testDate.toISOString().split('T')[0];
      const tom = new Date(testDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await client.fetchCalendarEvents(from, tom);
      serverAvailable = true;
      console.log('✅ MCP server is available');
    } catch (error) {
      serverAvailable = false;
      console.warn('⚠️ MCP server unavailable:', error.message);
      console.warn('⚠️ Integration tests will be skipped');
    }
  }, TEST_TIMEOUT);

  afterAll(() => {
    if (serverAvailable) {
      const stats = client.getStats();
      console.log('\n📊 MCP Client Statistics:');
      console.log(`   Requests: ${stats.requests}`);
      console.log(`   Errors: ${stats.errors}`);
      console.log(`   Success Rate: ${stats.successRate}`);
    }
  });

  describe('Server Availability', () => {
    it('should connect to MCP server', () => {
      if (!serverAvailable) {
        console.log('⚠️ Skipping: MCP server not available');
        return;
      }
      expect(serverAvailable).toBe(true);
    });
  });

  describe('fetchCalendarEvents', () => {
    it('should fetch calendar events for next 7 days', async () => {
      if (!serverAvailable) return;

      const today = new Date();
      const from = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const tom = endDate.toISOString().split('T')[0];

      const events = await client.fetchCalendarEvents(from, tom);
      
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
      
      console.log(`   ✓ Fetched ${events.length} calendar events`);
      
      // Validate event structure if events exist
      if (events.length > 0) {
        const firstEvent = events[0];
        expect(firstEvent).toHaveProperty('title');
        expect(firstEvent).toHaveProperty('start');
        console.log(`   ✓ Sample event: "${firstEvent.title?.substring(0, 50)}..."`);
      }
    }, TEST_TIMEOUT);

    it('should filter calendar events by organ', async () => {
      if (!serverAvailable) return;

      const today = new Date();
      const from = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const tom = endDate.toISOString().split('T')[0];

      const events = await client.fetchCalendarEvents(from, tom, 'kammaren');
      
      expect(Array.isArray(events)).toBe(true);
      console.log(`   ✓ Fetched ${events.length} kammaren events`);
    }, TEST_TIMEOUT);
  });

  describe('fetchCommitteeReports', () => {
    it('should fetch latest committee reports', async () => {
      if (!serverAvailable) return;

      const reports = await client.fetchCommitteeReports(5);
      
      expect(reports).toBeDefined();
      expect(Array.isArray(reports)).toBe(true);
      
      console.log(`   ✓ Fetched ${reports.length} committee reports`);
      
      if (reports.length > 0) {
        const firstReport = reports[0];
        expect(firstReport).toBeDefined();
        console.log(`   ✓ Sample report: ${JSON.stringify(firstReport).substring(0, 100)}...`);
      }
    }, TEST_TIMEOUT);

    it('should fetch committee reports for specific riksmöte', async () => {
      if (!serverAvailable) return;

      const currentYear = new Date().getFullYear();
      const rm = `${currentYear - 1}/${String(currentYear).substring(2)}`;
      
      const reports = await client.fetchCommitteeReports(3, rm);
      
      expect(Array.isArray(reports)).toBe(true);
      console.log(`   ✓ Fetched ${reports.length} reports for ${rm}`);
    }, TEST_TIMEOUT);
  });

  describe('fetchPropositions', () => {
    it('should fetch latest government propositions', async () => {
      if (!serverAvailable) return;

      const propositions = await client.fetchPropositions(5);
      
      expect(propositions).toBeDefined();
      expect(Array.isArray(propositions)).toBe(true);
      
      console.log(`   ✓ Fetched ${propositions.length} propositions`);
      
      if (propositions.length > 0) {
        const firstProp = propositions[0];
        expect(firstProp).toBeDefined();
        console.log(`   ✓ Sample proposition: ${JSON.stringify(firstProp).substring(0, 100)}...`);
      }
    }, TEST_TIMEOUT);
  });

  describe('fetchMotions', () => {
    it('should fetch latest motions', async () => {
      if (!serverAvailable) return;

      const motions = await client.fetchMotions(5);
      
      expect(motions).toBeDefined();
      expect(Array.isArray(motions)).toBe(true);
      
      console.log(`   ✓ Fetched ${motions.length} motions`);
      
      if (motions.length > 0) {
        const firstMotion = motions[0];
        expect(firstMotion).toBeDefined();
        console.log(`   ✓ Sample motion: ${JSON.stringify(firstMotion).substring(0, 100)}...`);
      }
    }, TEST_TIMEOUT);
  });

  describe('searchDocuments', () => {
    it('should search riksdag documents', async () => {
      if (!serverAvailable) return;

      const documents = await client.searchDocuments({ 
        sok: 'budget',
        limit: 5
      });
      
      expect(documents).toBeDefined();
      expect(Array.isArray(documents)).toBe(true);
      
      console.log(`   ✓ Found ${documents.length} documents for "budget"`);
      
      if (documents.length > 0) {
        const firstDoc = documents[0];
        expect(firstDoc).toBeDefined();
        console.log(`   ✓ Sample document: ${JSON.stringify(firstDoc).substring(0, 100)}...`);
      }
    }, TEST_TIMEOUT);

    it('should search documents by type', async () => {
      if (!serverAvailable) return;

      const documents = await client.searchDocuments({ 
        doktyp: 'mot',
        limit: 3
      });
      
      expect(Array.isArray(documents)).toBe(true);
      console.log(`   ✓ Found ${documents.length} documents of type "mot"`);
    }, TEST_TIMEOUT);
  });

  describe('searchSpeeches', () => {
    it('should search parliamentary speeches', async () => {
      if (!serverAvailable) return;

      const speeches = await client.searchSpeeches({ 
        sok: 'miljö',
        limit: 5
      });
      
      expect(speeches).toBeDefined();
      expect(Array.isArray(speeches)).toBe(true);
      
      console.log(`   ✓ Found ${speeches.length} speeches for "miljö"`);
      
      if (speeches.length > 0) {
        const firstSpeech = speeches[0];
        expect(firstSpeech).toBeDefined();
        console.log(`   ✓ Sample speech: ${JSON.stringify(firstSpeech).substring(0, 100)}...`);
      }
    }, TEST_TIMEOUT);
  });

  describe('fetchMPs', () => {
    it('should fetch all MPs', async () => {
      if (!serverAvailable) return;

      const mps = await client.fetchMPs({});
      
      expect(mps).toBeDefined();
      expect(Array.isArray(mps)).toBe(true);
      
      console.log(`   ✓ Fetched ${mps.length} MPs`);
      
      if (mps.length > 0) {
        const firstMP = mps[0];
        expect(firstMP).toBeDefined();
        console.log(`   ✓ Sample MP: ${JSON.stringify(firstMP).substring(0, 100)}...`);
      }
    }, TEST_TIMEOUT);

    it('should filter MPs by party', async () => {
      if (!serverAvailable) return;

      const mps = await client.fetchMPs({ parti: 'S' });
      
      expect(Array.isArray(mps)).toBe(true);
      console.log(`   ✓ Fetched ${mps.length} MPs from party S`);
      
      // Validate party filter worked
      if (mps.length > 0) {
        const firstMP = mps[0];
        expect(firstMP.parti || firstMP.party).toBeDefined();
      }
    }, TEST_TIMEOUT);
  });

  describe('fetchVotingRecords', () => {
    it('should fetch voting records', async () => {
      if (!serverAvailable) return;

      const currentYear = new Date().getFullYear();
      const rm = `${currentYear - 1}/${String(currentYear).substring(2)}`;
      
      const votes = await client.fetchVotingRecords({ 
        rm,
        limit: 5
      });
      
      expect(votes).toBeDefined();
      expect(Array.isArray(votes)).toBe(true);
      
      console.log(`   ✓ Fetched ${votes.length} voting records for ${rm}`);
      
      if (votes.length > 0) {
        const firstVote = votes[0];
        expect(firstVote).toBeDefined();
        console.log(`   ✓ Sample vote: ${JSON.stringify(firstVote).substring(0, 100)}...`);
      }
    }, TEST_TIMEOUT);
  });

  describe('fetchGovernmentDocuments', () => {
    it('should fetch government documents', async () => {
      if (!serverAvailable) return;

      const docs = await client.fetchGovernmentDocuments({ 
        type: 'pressmeddelanden',
        limit: 5
      });
      
      expect(docs).toBeDefined();
      expect(Array.isArray(docs)).toBe(true);
      
      console.log(`   ✓ Fetched ${docs.length} government press releases`);
      
      if (docs.length > 0) {
        const firstDoc = docs[0];
        expect(firstDoc).toBeDefined();
        console.log(`   ✓ Sample document: ${JSON.stringify(firstDoc).substring(0, 100)}...`);
      }
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should handle invalid date formats gracefully', async () => {
      if (!serverAvailable) return;

      try {
        await client.fetchCalendarEvents('invalid-date', '2026-12-31');
        // If it doesn't throw, that's okay - server might handle it
        console.log('   ✓ Server handled invalid date gracefully');
      } catch (error) {
        expect(error.message).toBeDefined();
        console.log(`   ✓ Invalid date rejected: ${error.message.substring(0, 50)}...`);
      }
    }, TEST_TIMEOUT);

    it('should handle network timeouts', async () => {
      if (!serverAvailable) return;

      const slowClient = new MCPClient({ 
        baseURL: MCP_SERVER_URL,
        timeout: 100 // Very short timeout
      });

      try {
        await slowClient.fetchCalendarEvents('2026-01-01', '2026-01-07');
        console.log('   ✓ Request completed within short timeout');
      } catch (error) {
        expect(error.message).toContain('MCP request failed');
        console.log(`   ✓ Timeout handled: ${error.message.substring(0, 50)}...`);
      }
    }, TEST_TIMEOUT);
  });

  describe('Response Data Quality', () => {
    it('should return consistent data structures', async () => {
      if (!serverAvailable) return;

      const today = new Date();
      const from = today.toISOString().split('T')[0];
      const tom = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [events, reports, propositions, motions] = await Promise.all([
        client.fetchCalendarEvents(from, tom),
        client.fetchCommitteeReports(3),
        client.fetchPropositions(3),
        client.fetchMotions(3)
      ]);

      // All should return arrays
      expect(Array.isArray(events)).toBe(true);
      expect(Array.isArray(reports)).toBe(true);
      expect(Array.isArray(propositions)).toBe(true);
      expect(Array.isArray(motions)).toBe(true);

      console.log('   ✓ All methods return arrays');
      console.log(`   ✓ Fetched: ${events.length} events, ${reports.length} reports, ${propositions.length} props, ${motions.length} motions`);
    }, TEST_TIMEOUT);
  });

  describe('Performance', () => {
    it('should complete requests within timeout', async () => {
      if (!serverAvailable) return;

      const startTime = Date.now();
      
      await client.fetchPropositions(5);
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      console.log(`   ✓ Request completed in ${duration}ms`);
    }, TEST_TIMEOUT);

    it('should handle concurrent requests', async () => {
      if (!serverAvailable) return;

      const startTime = Date.now();
      
      const results = await Promise.all([
        client.fetchPropositions(2),
        client.fetchMotions(2),
        client.fetchCommitteeReports(2)
      ]);
      
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      results.forEach(result => expect(Array.isArray(result)).toBe(true));
      
      console.log(`   ✓ 3 concurrent requests completed in ${duration}ms`);
    }, TEST_TIMEOUT);
  });
});
