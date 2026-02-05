/**
 * CIA Data Loader Module
 * Loads CIA intelligence exports from local cache or fallback to API
 */

export class CIADataLoader {
  constructor() {
    this.baseURL = '../data/cia-exports/current/';
    this.fallbackURL = 'https://www.hack23.com/cia/api/';
  }

  /**
   * Load data with fallback strategy
   * @param {string} filename - CIA export filename
   * @returns {Promise<Object>} - Parsed JSON data
   */
  async loadWithFallback(filename) {
    try {
      // Try local cache first
      const response = await fetch(`${this.baseURL}${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to load ${filename} from cache, trying fallback:`, error);
      
      // Fallback to CIA API (note: in production, would need actual API endpoint)
      try {
        const response = await fetch(`${this.fallbackURL}${filename}`);
        if (!response.ok) {
          throw new Error(`Fallback also failed! status: ${response.status}`);
        }
        return await response.json();
      } catch (fallbackError) {
        console.error(`Both primary and fallback failed for ${filename}:`, fallbackError);
        throw new Error(`Failed to load ${filename}: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Load overview dashboard data
   * @returns {Promise<Object>}
   */
  async loadOverviewDashboard() {
    return this.loadWithFallback('overview-dashboard.json');
  }

  /**
   * Load election 2026 analysis
   * @returns {Promise<Object>}
   */
  async loadElectionAnalysis() {
    return this.loadWithFallback('election-analysis.json');
  }

  /**
   * Load party performance data
   * @returns {Promise<Object>}
   */
  async loadPartyPerformance() {
    return this.loadWithFallback('party-performance.json');
  }

  /**
   * Load top 10 influential MPs
   * @returns {Promise<Object>}
   */
  async loadTop10Influential() {
    return this.loadWithFallback('top10-influential-mps.json');
  }

  /**
   * Load committee network data
   * @returns {Promise<Object>}
   */
  async loadCommitteeNetwork() {
    return this.loadWithFallback('committee-network.json');
  }

  /**
   * Load voting patterns data
   * @returns {Promise<Object>}
   */
  async loadVotingPatterns() {
    return this.loadWithFallback('voting-patterns.json');
  }

  /**
   * Load all data in parallel
   * @returns {Promise<Object>} - Object with all data
   */
  async loadAll() {
    const [overview, election, partyPerf, top10, committees, votingPatterns] = 
      await Promise.all([
        this.loadOverviewDashboard(),
        this.loadElectionAnalysis(),
        this.loadPartyPerformance(),
        this.loadTop10Influential(),
        this.loadCommitteeNetwork(),
        this.loadVotingPatterns()
      ]);

    return {
      overview,
      election,
      partyPerf,
      top10,
      committees,
      votingPatterns
    };
  }
}
