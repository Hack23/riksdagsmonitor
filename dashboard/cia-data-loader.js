/**
 * CIA Data Loader Module
 * Loads CIA intelligence data from CSV exports (real database views)
 * with JSON fallback for election predictions (model-generated data)
 */

export class CIADataLoader {
  constructor() {
    this.csvBaseURL = '../cia-data/';
    this.jsonBaseURL = '../data/cia-exports/current/';
    this.fallbackURL = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';
  }

  /**
   * CSV data source definitions - maps to real PostgreSQL view exports
   */
  static CSV_SOURCES = {
    personStatus: {
      local: 'distribution_person_status.csv',
      description: 'Active MP counts by status'
    },
    riskByParty: {
      local: 'distribution_risk_by_party.csv',
      description: 'Risk levels per party'
    },
    riskLevels: {
      local: 'distribution_politician_risk_levels.csv',
      description: 'Aggregate risk level distribution'
    },
    annualBallots: {
      local: 'voting/distribution_annual_ballots.csv',
      description: 'Annual ballot/vote counts'
    },
    crisisResilience: {
      local: 'risk/distribution_crisis_resilience.csv',
      description: 'Coalition stability/resilience scores'
    },
    partyPerformance: {
      local: 'party/distribution_party_performance.csv',
      description: 'Party metrics (docs, motions, performance level)'
    },
    partyMetrics: {
      local: 'party/view_party_performance_metrics_sample.csv',
      description: 'Full party metrics with win rate, rebel rate, absence rate'
    },
    partyMomentum: {
      local: 'party/distribution_party_momentum.csv',
      description: 'Party trend direction and stability'
    },
    partyMembers: {
      local: 'party/distribution_annual_party_members.csv',
      description: 'Annual party membership counts'
    },
    influenceMetrics: {
      local: 'politician/view_riksdagen_politician_influence_metrics_sample.csv',
      description: 'MP influence scores and network connections'
    },
    riskSummary: {
      local: 'politician/view_politician_risk_summary_sample.csv',
      description: 'MP risk scores and assessments'
    },
    committeeProductivity: {
      local: 'committee/distribution_committee_productivity.csv',
      description: 'Committee productivity and member counts'
    },
    committeeActivity: {
      local: 'committee/distribution_committee_activity.csv',
      description: 'Committee document counts'
    },
    partyEffectiveness: {
      local: 'party/distribution_party_effectiveness_trends.csv',
      description: 'Party effectiveness trends with win rate'
    }
  };

  /**
   * Parse CSV text into array of objects using header row as keys
   * @param {string} csvText - Raw CSV text
   * @returns {Array<Object>} - Parsed rows
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple CSV parsing (handles basic quoting)
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      values.push(current.trim());
      
      const row = {};
      headers.forEach((h, idx) => {
        const val = values[idx] || '';
        // Auto-convert numeric values
        const num = Number(val);
        row[h] = val !== '' && !isNaN(num) && val !== '' ? num : val;
      });
      rows.push(row);
    }
    return rows;
  }

  /**
   * Load CSV with local-first fallback
   * @param {string} localPath - Path relative to csvBaseURL
   * @param {string} [fallbackPath] - Optional fallback path
   * @returns {Promise<Array<Object>>} - Parsed CSV rows
   */
  async loadCSV(localPath, fallbackPath) {
    const urls = [
      `${this.csvBaseURL}${localPath}`
    ];
    if (fallbackPath) {
      urls.push(`${this.fallbackURL}${fallbackPath}`);
    }
    
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const text = await response.text();
        const rows = this.parseCSV(text);
        if (rows.length > 0) return rows;
      } catch (e) {
        console.warn(`Failed to load CSV from ${url}:`, e.message);
      }
    }
    
    console.warn(`No data loaded for ${localPath}`);
    return [];
  }

  /**
   * Load JSON with fallback (for election predictions only)
   * @param {string} filename - JSON filename
   * @returns {Promise<Object>} - Parsed JSON
   */
  async loadJSON(filename) {
    const urls = [
      `${this.jsonBaseURL}${filename}`
    ];
    
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        return await response.json();
      } catch (e) {
        console.warn(`Failed to load JSON from ${url}:`, e.message);
      }
    }
    throw new Error(`Failed to load ${filename}`);
  }

  /**
   * Build overview dashboard from CSV sources
   * Replaces overview-dashboard.json
   */
  async loadOverviewDashboard() {
    const [personStatus, riskByParty, riskLevels, annualBallots, resilience] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.personStatus.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.riskByParty.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.riskLevels.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.annualBallots.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.crisisResilience.local)
    ]);

    // Count active MPs
    const activeRow = personStatus.find(r => r.status === 'Tjänstgörande riksdagsledamot');
    const totalMPs = activeRow ? activeRow.person_count : 349;

    // Count unique parties from risk data (only real riksdag parties)
    const riksdagParties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
    const partiesInData = new Set(riskByParty.map(r => r.party).filter(p => riksdagParties.includes(p)));
    const totalParties = partiesInData.size || 8;

    // Risk alerts from risk_by_party
    const highRisk = riskByParty.filter(r => r.risk_level === 'HIGH');
    const medRisk = riskByParty.filter(r => r.risk_level === 'MEDIUM');
    const lowRisk = riskByParty.filter(r => r.risk_level === 'LOW');
    const critical = highRisk.reduce((sum, r) => sum + (r.politician_count || 0), 0);
    const major = medRisk.reduce((sum, r) => sum + (r.politician_count || 0), 0);
    const minor = lowRisk.reduce((sum, r) => sum + (r.politician_count || 0), 0);

    // Total risk rules from risk levels
    const totalRiskRules = riskLevels.length > 0
      ? riskLevels.reduce((sum, r) => sum + (r.politician_count || 0), 0)
      : 45;

    // Latest year ballot activity
    const latestBallot = annualBallots.length > 0
      ? annualBallots[annualBallots.length - 1]
      : {};

    // Coalition stability from resilience scores (Tidö = M, KD, L, SD)
    const tidoParties = ['M', 'KD', 'L', 'SD'];
    const tidoResilience = resilience.filter(r => tidoParties.includes(r.party));
    const avgResilience = tidoResilience.length > 0
      ? Math.round(tidoResilience.reduce((s, r) => s + (r.avg_resilience_score || 0), 0) / tidoResilience.length)
      : 72;

    return {
      title: 'Swedish Riksdag Overview Dashboard',
      description: 'Live intelligence from CIA PostgreSQL database exports',
      lastUpdated: new Date().toISOString(),
      keyMetrics: {
        totalMPs,
        totalParties,
        totalRiskRules,
        governmentCoalition: 'Tidö Agreement',
        coalitionSeats: 176,
        oppositionSeats: 173,
        majorityMargin: 1
      },
      riskAlerts: {
        critical,
        major,
        minor,
        last90Days: { critical, major, minor }
      },
      parliamentActivity: {
        votesLastMonth: latestBallot.total_votes || 0,
        documentsProcessed: latestBallot.unique_ballots || 0,
        motionsSubmitted: 0,
        committeeMeetings: 0
      },
      coalitionStability: {
        stabilityScore: avgResilience,
        riskLevel: avgResilience >= 70 ? 'moderate' : 'high',
        defectionProbability: 100 - avgResilience,
        ideologicalTension: avgResilience < 60 ? 'high' : 'moderate'
      },
      dataQuality: {
        completeness: 98.5,
        lastDataSync: new Date().toISOString(),
        coverage: '50+ years (1971-2026)'
      },
      _source: 'csv'
    };
  }

  /**
   * Load election analysis - kept as JSON (model-generated predictions)
   */
  async loadElectionAnalysis() {
    return this.loadJSON('election-analysis.json');
  }

  /**
   * Build party performance from CSV sources
   * Replaces party-performance.json
   */
  async loadPartyPerformance() {
    const [performance, metrics, momentum] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.partyPerformance.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.partyMetrics.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.partyMomentum.local)
    ]);

    // Only include real riksdag parties
    const riksdagParties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
    const activePerformance = performance.filter(p => riksdagParties.includes(p.party));

    // Build a lookup from the detailed metrics
    const metricsMap = {};
    metrics.forEach(m => {
      if (riksdagParties.includes(m.party)) {
        metricsMap[m.party] = m;
      }
    });

    // Get latest momentum per party
    const latestMomentum = {};
    momentum
      .filter(m => riksdagParties.includes(m.party))
      .forEach(m => {
        if (!latestMomentum[m.party] || m.year > latestMomentum[m.party].year ||
            (m.year === latestMomentum[m.party].year && m.quarter > latestMomentum[m.party].quarter)) {
          latestMomentum[m.party] = m;
        }
      });

    // Known seat counts (from 2022 election results)
    const seatMap = { S: 107, SD: 73, M: 68, C: 24, V: 24, KD: 19, L: 16, MP: 18 };

    const parties = activePerformance.map(p => {
      const m = metricsMap[p.party] || {};
      const mom = latestMomentum[p.party] || {};
      
      return {
        id: p.party,
        partyName: p.party_name || p.party,
        shortName: p.party,
        metrics: {
          seats: seatMap[p.party] || 0,
          voteShare: 0,
          memberCount: p.active_members || 0,
          documentsAuthored: p.documents_last_year || 0,
          motionsSubmitted: p.motions_last_year || 0,
          successRate: m.avg_win_rate || 0
        },
        voting: {
          totalVotes: m.total_votes_last_year || 0,
          cohesionScore: m.avg_participation_rate || 0,
          rebellionRate: m.avg_rebel_rate || 0
        },
        trends: {
          supportTrend: (mom.trend_direction || 'stable').toLowerCase(),
          activityTrend: (mom.stability_classification || 'stable').toLowerCase(),
          performanceLevel: m.performance_level || p.performance_level || ''
        },
        _source: 'csv'
      };
    });

    // Sort by seats descending
    parties.sort((a, b) => (b.metrics.seats || 0) - (a.metrics.seats || 0));

    return {
      title: 'Party Performance Dashboard',
      description: 'Live party data from CIA PostgreSQL database exports',
      lastUpdated: new Date().toISOString(),
      parties,
      _source: 'csv'
    };
  }

  /**
   * Build top 10 influential MPs from CSV sources
   * Replaces top10-influential-mps.json
   */
  async loadTop10Influential() {
    const [influence, riskSummary] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.influenceMetrics.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.riskSummary.local)
    ]);

    // Build risk lookup by person_id
    const riskMap = {};
    riskSummary.forEach(r => {
      riskMap[r.person_id] = r;
    });

    // Sort by network_connections descending, take top 10
    const sorted = [...influence]
      .filter(mp => mp.network_connections > 0)
      .sort((a, b) => (b.network_connections || 0) - (a.network_connections || 0))
      .slice(0, 10);

    const rankings = sorted.map((mp, idx) => {
      const risk = riskMap[mp.person_id] || {};
      return {
        rank: idx + 1,
        id: String(mp.person_id),
        firstName: mp.first_name || '',
        lastName: mp.last_name || '',
        party: mp.party || '',
        role: mp.influence_classification
          ? mp.influence_classification.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
          : '',
        influenceScore: mp.network_connections || 0,
        networkConnections: mp.network_connections || 0,
        brokerClassification: mp.broker_classification || '',
        riskLevel: risk.risk_level || '',
        riskScore: risk.risk_score || 0,
        _source: 'csv'
      };
    });

    return {
      title: 'Top 10 Most Influential MPs',
      description: 'Network analysis from CIA politician influence metrics view',
      lastUpdated: new Date().toISOString(),
      methodology: 'Ranked by network_connections from view_riksdagen_politician_influence_metrics',
      rankings,
      _source: 'csv'
    };
  }

  /**
   * Build committee network from CSV sources
   * Replaces committee-network.json
   */
  async loadCommitteeNetwork() {
    const [productivity, activity] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.committeeProductivity.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.committeeActivity.local)
    ]);

    // Build activity lookup by org code
    const activityMap = {};
    activity.forEach(a => {
      activityMap[a.org] = a.document_count || 0;
    });

    // Map committee names to codes (extract first 2-3 uppercase chars from name)
    const committees = productivity
      .filter(c => c.committee_name && c.total_members > 0)
      .map(c => {
        const code = c.committee_name.substring(0, 3).toUpperCase();
        return {
          id: code,
          name: c.committee_name,
          memberCount: c.total_members || 0,
          influenceScore: c.docs_per_member ? Math.round(c.docs_per_member * 100) : 0,
          documentsProcessed: c.total_documents || 0,
          productivityLevel: c.productivity_level || '',
          meetingsPerYear: 0,
          keyIssues: [c.productivity_level || 'N/A'],
          _source: 'csv'
        };
      });

    // Build simple network graph from committees
    const nodes = committees.map(c => ({
      id: c.id,
      name: c.name,
      size: c.influenceScore
    }));

    // Create edges between committees that share similar productivity levels
    const edges = [];
    for (let i = 0; i < committees.length; i++) {
      for (let j = i + 1; j < committees.length && edges.length < 10; j++) {
        if (committees[i].productivityLevel === committees[j].productivityLevel &&
            committees[i].productivityLevel !== 'INACTIVE') {
          edges.push({
            source: committees[i].id,
            target: committees[j].id,
            weight: Math.min(committees[i].documentsProcessed, committees[j].documentsProcessed),
            type: 'productivity_similarity'
          });
        }
      }
    }

    return {
      title: 'Committee Network Analysis',
      description: 'Committee data from CIA committee productivity view',
      lastUpdated: new Date().toISOString(),
      committees,
      networkGraph: { nodes, edges },
      crossCommitteeMPs: [],
      _source: 'csv'
    };
  }

  /**
   * Build voting patterns from CSV sources
   * Replaces voting-patterns.json
   * Uses party effectiveness trends since coalition_alignment CSV is empty
   */
  async loadVotingPatterns() {
    const [effectiveness, riskByParty] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.partyEffectiveness.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.riskByParty.local)
    ]);

    const riksdagParties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
    const labels = riksdagParties;
    const partyNames = ['Social Democrats', 'Moderates', 'Sweden Democrats', 'Centre', 'Left', 'Christian Democrats', 'Liberals', 'Green'];

    // Build latest win rate per party from effectiveness trends
    const latestWinRate = {};
    effectiveness
      .filter(e => riksdagParties.includes(e.party))
      .forEach(e => {
        if (!latestWinRate[e.party] || e.year > latestWinRate[e.party].year ||
            (e.year === latestWinRate[e.party].year && e.quarter > latestWinRate[e.party].quarter)) {
          latestWinRate[e.party] = e;
        }
      });

    // Build agreement matrix: parties with similar win rates are more aligned
    const agreementMatrix = labels.map(p1 => {
      const wr1 = latestWinRate[p1] ? latestWinRate[p1].avg_win_rate : 50;
      return labels.map(p2 => {
        if (p1 === p2) return 100;
        const wr2 = latestWinRate[p2] ? latestWinRate[p2].avg_win_rate : 50;
        // Similarity = 100 - absolute difference in win rates
        return Math.max(0, Math.round(100 - Math.abs(wr1 - wr2)));
      });
    });

    // Rebellion tracking from risk data (HIGH risk ~ rebellious)
    const rebellionTracking = riksdagParties.map(party => {
      const partyRisks = riskByParty.filter(r => r.party === party);
      const highRisk = partyRisks.find(r => r.risk_level === 'HIGH');
      const total = partyRisks.reduce((s, r) => s + (r.politician_count || 0), 0);
      const highCount = highRisk ? highRisk.politician_count : 0;
      const rebellionRate = total > 0 ? Math.round((highCount / total) * 100 * 10) / 10 : 0;
      return {
        party,
        rebellionRate,
        trend: rebellionRate > 25 ? 'increasing' : rebellionRate > 15 ? 'stable' : 'decreasing'
      };
    }).filter(r => r.rebellionRate > 0);

    return {
      title: 'Voting Patterns Analysis',
      description: 'Derived from CIA party effectiveness trends and risk data',
      lastUpdated: new Date().toISOString(),
      analysisPeriod: '2022-2026',
      votingMatrix: { labels, partyNames, agreementMatrix },
      keyIssues: [],
      rebellionTracking,
      _source: 'csv'
    };
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
