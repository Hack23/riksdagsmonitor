/**
 * @module Analytics/CoalitionIntelligence/Data
 * @description Data fetching and caching logic for the Coalition Intelligence Dashboard.
 * Handles CSV loading from CIA data files, data caching, and initialization.
 *
 * Contains: PARTIES config, parseCSV, fetchCSV, initDashboard, fetchCoalitionData,
 * fetchBehavioralData, fetchDecisionData, fetchAnomalyData, fetchAnnualVotesData.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

declare const d3: any;
import type {
  PartyConfig, PartyNode, CoalitionLink, VotingAnomaly,
  AnnualVoteEntry, DataCache, DataFiles, DataConfig,
  CoalitionAlignment, BehavioralPatterns, AnnualVotes,
} from './types.js';

(function(): void {
'use strict';

// Swedish party configuration
const PARTIES: Record<string, PartyConfig> = {
  'S': { name: 'Socialdemokraterna', color: '#E8112d', fullName: 'Social Democrats' },
  'M': { name: 'Moderaterna', color: '#52BDEC', fullName: 'Moderates' },
  'SD': { name: 'Sverigedemokraterna', color: '#DDDD00', fullName: 'Sweden Democrats' },
  'V': { name: 'Vänsterpartiet', color: '#DA291C', fullName: 'Left Party' },
  'MP': { name: 'Miljöpartiet', color: '#83CF39', fullName: 'Green Party' },
  'C': { name: 'Centerpartiet', color: '#009933', fullName: 'Centre Party' },
  'L': { name: 'Liberalerna', color: '#006AB3', fullName: 'Liberals' },
  'KD': { name: 'Kristdemokraterna', color: '#000077', fullName: 'Christian Democrats' }
};

// Data cache
let dataCache: DataCache = {
  coalitionAlignment: null,
  behavioralPatterns: null,
  decisionPatterns: null,
  votingAnomalies: null,
  annualVotes: null
};

// Remote base URL for CIA CSV data
const REMOTE_BASE_URL: string = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';

// Data source configuration with local-first + remote fallback
const DATA_CONFIG: DataConfig = {
  files: {
    coalition: [
      'cia-data/party/distribution_coalition_alignment.csv',
      REMOTE_BASE_URL + 'distribution_coalition_alignment.csv'
    ],
    behavioral: [
      'cia-data/parties/distribution_behavioral_patterns_by_party.csv',
      REMOTE_BASE_URL + 'distribution_behavioral_patterns_by_party.csv'
    ],
    decision: [
      'cia-data/parties/distribution_decision_patterns_by_party.csv',
      REMOTE_BASE_URL + 'distribution_decision_patterns_by_party.csv'
    ],
    anomalyClassification: [
      'cia-data/voting/distribution_voting_anomaly_classification.csv',
      REMOTE_BASE_URL + 'distribution_voting_anomaly_classification.csv'
    ],
    anomalyByParty: [
      'cia-data/anomaly/distribution_anomaly_by_party.csv',
      REMOTE_BASE_URL + 'distribution_anomaly_by_party.csv'
    ],
    annualVotes: [
      'cia-data/voting/distribution_annual_party_votes.csv',
      REMOTE_BASE_URL + 'distribution_annual_party_votes.csv'
    ],
    decisionTrends: [
      'cia-data/voting/distribution_decision_trends.csv',
      REMOTE_BASE_URL + 'distribution_decision_trends.csv'
    ],
    partyMomentum: [
      'cia-data/distribution_party_momentum.csv',
      REMOTE_BASE_URL + 'distribution_party_momentum.csv'
    ]
  },
  useMockData: false // Set to true to force mock data
};

/**
 * Parse CSV text into array of objects
 * Uses D3's built-in CSV parser which properly handles quoted fields
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of objects with header keys
 */
function parseCSV(csvText: string): d3.DSVRowString<string>[] {
  try {
    // Use D3's csvParse which handles quoted fields, escaped quotes, etc.
    return d3.csvParse(csvText);
  } catch (error: unknown) {
    console.error('CSV parsing error:', error);
    return [];
  }
}

/**
 * Fetch CSV file with local-first fallback to remote
 * @param {Array<string>} urls - Array of [localUrl, remoteUrl]
 * @returns {Array|null} Parsed CSV data or null
 */
async function fetchCSV(urls: string | string[]): Promise<d3.DSVRowString<string>[] | null> {
  const urlList: string[] = Array.isArray(urls) ? urls : [urls];
  for (const url of urlList) {
    try {
      const response: Response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text: string = await response.text();
      const data: d3.DSVRowString<string>[] = parseCSV(text);
      if (data && data.length > 0) {
        console.log(`  Loaded from: ${url} (${data.length} rows)`);
        return data;
      }
    } catch (error: unknown) {
      console.warn(`  Failed: ${url} - ${(error as Error).message}`);
    }
  }
  return null;
}

/**
 * Initialize the dashboard
 */
async function initDashboard(): Promise<void> {
  try {
    console.log('🚀 Initializing Coalition & Voting Pattern Dashboard...');
    
    // Show loading state
    showLoadingState();
    
    // Fetch all data in parallel
    await Promise.all([
      fetchCoalitionData(),
      fetchBehavioralData(),
      fetchDecisionData(),
      fetchAnomalyData(),
      fetchAnnualVotesData()
    ]);
    
    // Render all visualizations
    renderCoalitionNetwork();
    renderAlignmentHeatMap();
    renderVotingAnomalyChart();
    renderBehavioralPatternsChart();
    renderDecisionTrendsChart();
    
    // Hide loading state
    hideLoadingState();
    
    console.log('✅ Dashboard initialized successfully');
  } catch (error: unknown) {
    console.error('❌ Dashboard initialization failed:', error);
    showErrorState((error as Error).message);
  }
}

/**
 * Fetch coalition alignment data from CIA Platform
 */
async function fetchCoalitionData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) {
      dataCache.coalitionAlignment = generateMockCoalitionData();
      console.log('✅ Coalition data loaded (mock)');
      return;
    }

    // Try to load real CSV data
    const csvData: d3.DSVRowString<string>[] | null = await fetchCSV(DATA_CONFIG.files.coalition);
    
    if (csvData && csvData.length > 0) {
      // Transform CSV data into coalition alignment format
      const alignment: CoalitionAlignment = {};
      
      csvData.forEach((row: d3.DSVRowString<string>) => {
        const party1: string = row.party1;
        const party2: string = row.party2;
        const alignmentRate: number = parseFloat(row.alignment_rate);
        
        if (!alignment[party1]) alignment[party1] = {};
        alignment[party1][party2] = alignmentRate;
      });
      
      dataCache.coalitionAlignment = alignment;
      console.log('✅ Coalition data loaded from CSV');
    } else {
      // Fallback to mock data
      dataCache.coalitionAlignment = generateMockCoalitionData();
      console.log('⚠️ Coalition data loaded (mock fallback)');
    }
  } catch (error: unknown) {
    console.error('Failed to fetch coalition data:', error);
    dataCache.coalitionAlignment = generateMockCoalitionData();
    console.log('⚠️ Coalition data loaded (mock fallback due to error)');
  }
}

/**
 * Fetch behavioral patterns data
 */
async function fetchBehavioralData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) {
      dataCache.behavioralPatterns = generateMockBehavioralData();
      console.log('✅ Behavioral data loaded (mock)');
      return;
    }

    // Try to load real CSV data
    const csvData: d3.DSVRowString<string>[] | null = await fetchCSV(DATA_CONFIG.files.behavioral);
    
    if (csvData && csvData.length > 0) {
      // Transform CSV data into behavioral patterns format
      const patterns: BehavioralPatterns = {};
      
      // Aggregate by party, calculate consistency based on behavioral assessment
      const partyData: Record<string, { total: number; standardBehavior: number }> = {};
      csvData.forEach((row: d3.DSVRowString<string>) => {
        const party: string = row.party;
        if (party === '-') return; // Skip aggregate rows
        
        if (!partyData[party]) {
          partyData[party] = { total: 0, standardBehavior: 0 };
        }
        
        const count: number = parseInt(row.politician_count) || 0;
        partyData[party].total += count;
        
        // Standard behavior counts as high consistency
        if (row.behavioral_assessment === 'STANDARD_BEHAVIOR') {
          partyData[party].standardBehavior += count;
        }
      });
      
      // Calculate consistency percentages
      Object.keys(partyData).forEach((party: string) => {
        if (partyData[party].total > 0) {
          const consistency: number = (partyData[party].standardBehavior / partyData[party].total) * 100;
          // Normalize to 75-100 range for visualization
          patterns[party] = Math.max(75, Math.min(100, consistency || 80));
        }
      });
      
      dataCache.behavioralPatterns = patterns;
      console.log('✅ Behavioral data loaded from CSV');
    } else {
      dataCache.behavioralPatterns = generateMockBehavioralData();
      console.log('⚠️ Behavioral data loaded (mock fallback)');
    }
  } catch (error: unknown) {
    console.error('Failed to fetch behavioral data:', error);
    dataCache.behavioralPatterns = generateMockBehavioralData();
    console.log('⚠️ Behavioral data loaded (mock fallback due to error)');
  }
}

/**
 * Fetch decision patterns data
 */
async function fetchDecisionData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) {
      dataCache.decisionPatterns = generateMockDecisionData();
      console.log('✅ Decision data loaded (mock)');
      return;
    }

    // Try to load real CSV data (not currently used in visualizations)
    const csvData: d3.DSVRowString<string>[] | null = await fetchCSV(DATA_CONFIG.files.decision);
    
    if (csvData && csvData.length > 0) {
      dataCache.decisionPatterns = csvData;
      console.log('✅ Decision data loaded from CSV');
    } else {
      dataCache.decisionPatterns = generateMockDecisionData();
      console.log('⚠️ Decision data loaded (mock fallback)');
    }
  } catch (error: unknown) {
    console.error('Failed to fetch decision data:', error);
    dataCache.decisionPatterns = generateMockDecisionData();
    console.log('⚠️ Decision data loaded (mock fallback due to error)');
  }
}

/**
 * Fetch voting anomaly data
 */
async function fetchAnomalyData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) {
      dataCache.votingAnomalies = generateMockAnomalyData();
      console.log('✅ Anomaly data loaded (mock)');
      return;
    }

    // Try to load real CSV data
    const csvData: d3.DSVRowString<string>[] | null = await fetchCSV(DATA_CONFIG.files.anomalyByParty);
    
    if (csvData && csvData.length > 0) {
      // Transform CSV data into anomaly format
      const anomalies: VotingAnomaly[] = [];
      
      // Generate anomaly entries from party anomaly data
      csvData.forEach((row: d3.DSVRowString<string>) => {
        const party: string = row.party;
        if (party === '-' || !party) return; // Skip aggregate rows
        
        const avgRebellions: number = parseFloat(row.avg_rebellions) || 0;
        const count: number = parseInt(row.politician_count) || 1;
        const classification: string = row.anomaly_classification || 'EXPECTED_BEHAVIOR';
        
        if (avgRebellions > 0 && count > 0) {
          // Create a single representative anomaly entry per party
          const deviation: number = Math.min(6, avgRebellions);
          anomalies.push({
            party: party,
            date: '2024-06-15',
            deviation: deviation,
            severity: classification === 'HIGH_REBELLION_RATE' ? 'critical' : 
                      deviation > 2.5 ? 'major' : 'minor'
          });
        }
      });
      
      dataCache.votingAnomalies = anomalies;
      console.log('✅ Anomaly data loaded from CSV');
    } else {
      dataCache.votingAnomalies = generateMockAnomalyData();
      console.log('⚠️ Anomaly data loaded (mock fallback)');
    }
  } catch (error: unknown) {
    console.error('Failed to fetch anomaly data:', error);
    dataCache.votingAnomalies = generateMockAnomalyData();
    console.log('⚠️ Anomaly data loaded (mock fallback due to error)');
  }
}

/**
 * Fetch annual votes data
 */
async function fetchAnnualVotesData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) {
      dataCache.annualVotes = generateMockAnnualVotesData();
      console.log('✅ Annual votes data loaded (mock)');
      return;
    }

    // Try to load real CSV data
    const csvData: d3.DSVRowString<string>[] | null = await fetchCSV(DATA_CONFIG.files.annualVotes);
    
    if (csvData && csvData.length > 0) {
      // Transform CSV data into annual votes format
      const annualData: AnnualVotes = {};
      
      csvData.forEach((row: d3.DSVRowString<string>) => {
        const year: number = parseInt(row.year);
        const party: string = row.party;
        const voteCount: number = parseInt(row.vote_count) || 0;
        
        if (!annualData[party]) {
          annualData[party] = [];
        }
        
        annualData[party].push({
          year: year,
          votes: voteCount
        });
      });
      
      // Sort by year for each party
      Object.keys(annualData).forEach((party: string) => {
        annualData[party].sort((a: AnnualVoteEntry, b: AnnualVoteEntry) => a.year - b.year);
      });
      
      dataCache.annualVotes = annualData;
      console.log('✅ Annual votes data loaded from CSV');
    } else {
      dataCache.annualVotes = generateMockAnnualVotesData();
      console.log('⚠️ Annual votes data loaded (mock fallback)');
    }
  } catch (error: unknown) {
    console.error('Failed to fetch annual votes data:', error);
    dataCache.annualVotes = generateMockAnnualVotesData();
    console.log('⚠️ Annual votes data loaded (mock fallback due to error)');
  }
}

})();

