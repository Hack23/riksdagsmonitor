#!/usr/bin/env node
/**
 * Update Website Statistics from CIA Production Database
 * 
 * Updates riksdagsmonitor HTML files with accurate statistics from CIA production database.
 * 
 * Strategy:
 * - person_data (2494) = All historical politicians since 1971 (50+ years)
 * - Current MPs = 349 (standard Swedish Riksdag size)
 * - Update descriptions to clarify: "349 current MPs, 2494 historical politicians tracked"
 * 
 * ISMS Compliance:
 * - ISO 27001:2022 A.5.33 - Protection of records (data integrity, source attribution)
 * - ISO 27001:2022 A.8.3 - Information lifecycle management (automated updates)
 * - ISO 27001:2022 A.8.10 - Information deletion (proper retention policies)
 * - NIST CSF 2.0 PR.DS-5 - Data integrity (validation checks)
 * - CIS Control 3.14 - Data integrity validation (automated verification)
 * - GDPR Article 6(1)(e) - Public interest processing (political transparency)
 * 
 * Note: Processes only public government data (Swedish Offentlighetsprincipen),
 * journalist/OSINT platform covering public officials in official capacity.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATS_FILE = path.join(__dirname, '..', 'cia-data', 'production-stats.json');
const INDEX_FILES = [
  'index.html',
  'index_sv.html',
  'index_da.html',
  'index_no.html',
  'index_fi.html',
  'index_de.html',
  'index_fr.html',
  'index_es.html',
  'index_nl.html',
  'index_ar.html',
  'index_he.html',
  'index_ja.html',
  'index_ko.html',
  'index_zh.html'
];

/**
 * Load production statistics
 * @returns {Object} Statistics data
 */
function loadStats() {
  try {
    const data = fs.readFileSync(STATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Failed to load stats: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Update HTML file with new statistics
 * @param {string} filePath - Path to HTML file
 * @param {Object} stats - Statistics data
 * @returns {Object} Update summary
 */
function updateHTMLFile(filePath, stats) {
  const { counts } = stats;
  
  // Current MPs (official Riksdag size)
  const currentMPs = 349;
  
  // Historical politicians (all persons in CIA database)
  const historicalPoliticians = counts.total_persons;
  
  // Total votes (raw number - stats-loader.js will format at runtime)
  const totalVotes = counts.total_votes;
  
  // Total documents (raw number - stats-loader.js will format at runtime)
  const totalDocuments = counts.total_documents;
  
  // Rule violations (raw number - stats-loader.js will format at runtime)
  const ruleViolations = counts.total_rule_violations;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changeCount = 0;
    
    // Language-specific descriptions (only update if explicitly defined)
    const descriptions = {
      'index.html': {
        heroDescription: `Real-time monitoring · Coalition predictions · Systematic transparency. 45 risk rules tracking ${currentMPs} MPs (${historicalPoliticians} historical politicians in database).`,
        twitterDescription: `Real-time monitoring of ${currentMPs} MPs across 8 parties · Coalition predictions with 45 risk rules · Election forecasting · Track Swedish politics 24/7 · ${historicalPoliticians} historical politicians tracked`,
        schemaDescription: `Swedish Election 2026 live intelligence platform with CIA OSINT monitoring of ${currentMPs} MPs across 8 parties. Real-time coalition predictions, 45 risk rules, and comprehensive parliamentary analysis. Database includes ${historicalPoliticians} historical politicians (1971-2024).`,
        eventDescription: `Swedish Parliamentary Election scheduled for 13 September 2026. Live intelligence platform monitoring ${currentMPs} MPs across 8 parties with CIA OSINT capabilities, coalition predictions, and comprehensive risk assessment. Track voting patterns, committee activities, and political transparency in real-time. Historical database: ${historicalPoliticians} politicians tracked since 1971.`,
        aboutText: `Riksdagsmonitor is a comprehensive Swedish Parliament monitoring platform that provides real-time intelligence, election forecasting, and political transparency through CIA OSINT analysis. It tracks ${currentMPs} MPs across 8 parties with 45 risk rules and comprehensive parliamentary analysis. Historical database includes ${historicalPoliticians} politicians from 1971-2024.`,
        mpTrackingText: `Riksdagsmonitor tracks all ${currentMPs} Members of Parliament (MPs) in the Swedish Riksdag, monitoring their voting patterns, attendance, committee work, and debate performance in real-time. Historical database includes ${historicalPoliticians} politicians tracked since 1971.`,
        dashboardDescription: `Comprehensive intelligence analysis using 45 risk rules across ${currentMPs} MPs with statistical anomaly detection (P90/P99 thresholds). Historical analysis includes ${historicalPoliticians} politicians (1971-2024).`,
        riskHeatMapTitle: `Risk Level Heat Map (45 Rules × ${currentMPs} MPs)`,
        featureListMPs: `${currentMPs} MPs tracked (${historicalPoliticians} historical)`,
        organizationText: `Riksdagsmonitor is a live intelligence platform for Swedish Parliament monitoring using CIA OSINT capabilities, tracking ${currentMPs} MPs with 45 risk rules across 4 domains: Politician-level (20 rules), Party-level (12 rules), Committee-level (8 rules), and Ministry-level (5 rules). Historical database: ${historicalPoliticians} politicians (1971-2024).`,
        electionText: `The Swedish Parliamentary Election 2026 is scheduled for September 13, 2026 (second Sunday in September). This is a nationwide election to determine the composition of the Riksdag (Swedish Parliament) with ${currentMPs} seats. Riksdagsmonitor tracks current and historical politicians (${historicalPoliticians} total since 1971).`,
        monitoringText: `The platform monitors all ${currentMPs} members of the Swedish Parliament (Riksdag) across 8 political parties: Social Democrats (S), Moderates (M), Sweden Democrats (SD), Centre Party (C), Left Party (V), Christian Democrats (KD), Liberals (L), and Green Party (MP). Historical database includes ${historicalPoliticians} politicians tracked since 1971.`
      },
      'index_sv.html': {
        heroDescription: `Realtidsövervakning · Koalitionsprognoser · Systematisk transparens. 45 riskregler spårar ${currentMPs} riksdagsledamöter (${historicalPoliticians} historiska politiker i databasen).`,
        twitterDescription: `Realtidsövervakning av ${currentMPs} riksdagsledamöter över 8 partier · Koalitionsprognoser med 45 riskregler · Valprognos · Spåra svensk politik 24/7 · ${historicalPoliticians} historiska politiker spårade`,
        schemaDescription: `Svenska valet 2026 live underrättelseplattform med CIA OSINT-övervakning av ${currentMPs} riksdagsledamöter över 8 partier. Realtidskoalitionsprognoser, 45 riskregler och omfattande parlamentarisk analys. Databasen inkluderar ${historicalPoliticians} historiska politiker (1971-2024).`
      }
      // Note: Other languages (da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh) preserve existing translations
      // Only update if explicitly defined above to avoid overwriting localized content
    };
    
    const lang = path.basename(filePath);
    const desc = descriptions[lang]; // No fallback - only update if explicitly defined
    
    // Update meta description (only if language has explicit translation)
    const ogDescPattern = /<meta property="og:description" content="[^"]*">/;
    if (ogDescPattern.test(content) && desc && desc.heroDescription) {
      content = content.replace(ogDescPattern, `<meta property="og:description" content="${desc.heroDescription}">`);
      changeCount++;
    }
    
    // Update Twitter description (only if language has explicit translation)
    const twitterDescPattern = /<meta name="twitter:description" content="[^"]*">/;
    if (twitterDescPattern.test(content) && desc && desc.twitterDescription) {
      content = content.replace(twitterDescPattern, `<meta name="twitter:description" content="${desc.twitterDescription}">`);
      changeCount++;
    }
    
    // Update stats counter
    const statsCounterPattern = /<span class="number" id="stat-mps">\d+<\/span>/;
    if (statsCounterPattern.test(content)) {
      content = content.replace(statsCounterPattern, `<span class="number" id="stat-mps">${currentMPs}</span>`);
      changeCount++;
    }
    
    // Update coalition formation text
    const coalitionPattern = /Formation: October 2022 \| Status: Active \| Majority: 176 seats \(of \d+ total\)/;
    if (coalitionPattern.test(content)) {
      content = content.replace(coalitionPattern, `Formation: October 2022 | Status: Active | Majority: 176 seats (of ${currentMPs} total)`);
      changeCount++;
    }
    
    // Update dashboard description
    const dashboardDescPattern = /Comprehensive intelligence analysis using 45 risk rules(?: \(detecting <span[^>]*>\d+<\/span> violations\))? across \d+ MPs with statistical anomaly detection \(P90\/P99 thresholds\)(?:[^<]*)?(?:<span[^>]*>\d+<\/span>[^.]*)?/;
    if (dashboardDescPattern.test(content) && desc && desc.dashboardDescription) {
      content = content.replace(dashboardDescPattern, desc.dashboardDescription);
      changeCount++;
    }
    
    // Update risk heat map title
    const riskHeatMapTitlePattern = /<h3>Risk Level Heat Map \(45 Rules × \d+ MPs\)<\/h3>/;
    if (riskHeatMapTitlePattern.test(content) && desc && desc.riskHeatMapTitle) {
      content = content.replace(riskHeatMapTitlePattern, `<h3>${desc.riskHeatMapTitle}</h3>`);
      changeCount++;
    }
    
    // Update risk heat map aria-label
    const riskHeatMapAriaPattern = /aria-label="Risk assessment heat map showing 45 rules by \d+ MPs"/;
    if (riskHeatMapAriaPattern.test(content)) {
      content = content.replace(riskHeatMapAriaPattern, `aria-label="Risk assessment heat map showing 45 rules by ${currentMPs} MPs"`);
      changeCount++;
    }
    
    // Update feature list
    const featureListPattern = /<li>\d+ MPs tracked( automatically)?<\/li>/;
    if (featureListPattern.test(content) && desc.featureListMPs) {
      content = content.replace(featureListPattern, `<li>${desc.featureListMPs} automatically</li>`);
      changeCount++;
    }
    
    // Update Schema.org descriptions
    if (desc && desc.schemaDescription) {
      const schemaDescPattern1 = /"description": "Swedish Election 2026 live intelligence platform with CIA OSINT monitoring of \d+ MPs[^"]*"/g;
      content = content.replace(schemaDescPattern1, `"description": "${desc.schemaDescription}"`);
      changeCount++;
    }
    
    if (desc && desc.eventDescription) {
      const schemaDescPattern2 = /"description": "Swedish Parliamentary Election scheduled for 13 September 2026[^"]*"/g;
      content = content.replace(schemaDescPattern2, `"description": "${desc.eventDescription}"`);
      changeCount++;
    }
    
    if (desc.aboutText) {
      const aboutTextPattern = /"text": "Riksdagsmonitor is a comprehensive Swedish Parliament monitoring platform[^"]*"/g;
      content = content.replace(aboutTextPattern, `"text": "${desc.aboutText}"`);
      changeCount++;
    }
    
    if (desc.mpTrackingText) {
      const mpTrackingPattern = /"text": "Riksdagsmonitor tracks all \d+ Members of Parliament[^"]*"/g;
      content = content.replace(mpTrackingPattern, `"text": "${desc.mpTrackingText}"`);
      changeCount++;
    }
    
    if (desc.organizationText) {
      const orgTextPattern = /"text": "Riksdagsmonitor is a live intelligence platform for Swedish Parliament monitoring using CIA OSINT capabilities, tracking \d+ MPs[^"]*"/g;
      content = content.replace(orgTextPattern, `"text": "${desc.organizationText}"`);
      changeCount++;
    }
    
    if (desc.electionText) {
      const electionTextPattern = /"text": "The Swedish Parliamentary Election 2026 is scheduled for September 13, 2026[^"]*"/g;
      content = content.replace(electionTextPattern, `"text": "${desc.electionText}"`);
      changeCount++;
    }
    
    if (desc.monitoringText) {
      const monitoringTextPattern = /"text": "The platform monitors all \d+ members of the Swedish Parliament[^"]*"/g;
      content = content.replace(monitoringTextPattern, `"text": "${desc.monitoringText}"`);
      changeCount++;
    }
    
    // Update JavaScript heat map generation (keep at 349 for current MPs, add comment if not present)
    // Make idempotent by checking for existing comment
    const heatMapLoopPattern = /for \(let mpIdx = 0; mpIdx < \d+; mpIdx\+\+\) \{(?: \/\/ Current MPs)*/;
    if (heatMapLoopPattern.test(content)) {
      content = content.replace(
        heatMapLoopPattern,
        `for (let mpIdx = 0; mpIdx < ${currentMPs}; mpIdx++) { // Current MPs`
      );
      changeCount++;
    }
    
    const heatMapHeightPattern = /const height = \d+ \* cellHeight \+ margin\.top \+ margin\.bottom;(?: \/\/ Current MPs)*/;
    if (heatMapHeightPattern.test(content)) {
      content = content.replace(
        heatMapHeightPattern,
        `const height = ${currentMPs} * cellHeight + margin.top + margin.bottom; // Current MPs`
      );
      changeCount++;
    }
    
    const heatMapRangePattern = /\.range\(\[0, \d+ \* cellHeight\]\)(?: \/\/ Current MPs)*/;
    if (heatMapRangePattern.test(content)) {
      content = content.replace(
        heatMapRangePattern,
        `.range([0, ${currentMPs} * cellHeight]) // Current MPs`
      );
      changeCount++;
    }
    
    const heatMapTranslatePattern = /\.translateExtent\(\[\[0, 0\], \[45 \* cellWidth, \d+ \* cellHeight\]\]\)(?: \/\/ Current MPs)*/;
    if (heatMapTranslatePattern.test(content)) {
      content = content.replace(
        heatMapTranslatePattern,
        `.translateExtent([[0, 0], [45 * cellWidth, ${currentMPs} * cellHeight]]) // Current MPs`
      );
      changeCount++;
    }
    
    // Add CIA database stats comment at the top of the statistics section
    const statsCommentPattern = /<!-- Statistics Section -->/;
    if (statsCommentPattern.test(content)) {
      const comment = `<!-- Statistics Section -->
    <!-- CIA Production Database Stats (as of ${stats.metadata.last_updated}):
         - Current MPs: ${currentMPs}
         - Historical Politicians: ${historicalPoliticians} (1971-2024)
         - Total Votes: ${totalVotes}
         - Total Documents: ${totalDocuments}
         - Rule Violations: ${ruleViolations}
         Source: https://github.com/Hack23/cia/blob/master/service.data.impl/sample-data/extraction_summary_report.csv
    -->`;
      content = content.replace(statsCommentPattern, comment);
      changeCount++;
    }
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { file: path.basename(filePath), changes: changeCount, updated: true };
    }
    
    return { file: path.basename(filePath), changes: 0, updated: false };
    
  } catch (err) {
    console.error(`Failed to update ${filePath}: ${err.message}`);
    return { file: path.basename(filePath), changes: 0, updated: false, error: err.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('Update Website Statistics from CIA Production Database');
  console.log('='.repeat(80));
  console.log();
  
  // Load statistics
  console.log(`Loading statistics from: ${STATS_FILE}`);
  const stats = loadStats();
  console.log('✅ Statistics loaded');
  console.log();
  
  console.log('Key Statistics:');
  console.log(`  Current MPs: 349 (official Riksdag size)`);
  console.log(`  Historical Politicians: ${stats.counts.total_persons.toLocaleString()} (1971-2024)`);
  console.log(`  Total Votes: ${stats.counts.total_votes.toLocaleString()}`);
  console.log(`  Total Documents: ${stats.counts.total_documents.toLocaleString()}`);
  console.log(`  Rule Violations: ${stats.counts.total_rule_violations.toLocaleString()}`);
  console.log(`  Last Updated: ${stats.metadata.last_updated}`);
  console.log();
  
  // Update HTML files
  console.log(`Updating ${INDEX_FILES.length} language files...`);
  console.log();
  
  const results = [];
  for (const file of INDEX_FILES) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const result = updateHTMLFile(filePath, stats);
      results.push(result);
      
      if (result.updated) {
        console.log(`✅ ${result.file}: ${result.changes} changes`);
      } else if (result.error) {
        console.log(`❌ ${result.file}: ${result.error}`);
      } else {
        console.log(`⏭️  ${result.file}: No changes needed`);
      }
    } else {
      console.log(`⚠️  ${file}: File not found`);
    }
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  
  const updatedCount = results.filter(r => r.updated).length;
  const totalChanges = results.reduce((sum, r) => sum + r.changes, 0);
  
  console.log(`Files updated: ${updatedCount}/${INDEX_FILES.length}`);
  console.log(`Total changes: ${totalChanges}`);
  console.log();
  
  if (updatedCount > 0) {
    console.log('✅ Website statistics updated successfully');
    console.log();
    console.log('Next steps:');
    console.log('  1. Review changes with: git diff');
    console.log('  2. Validate HTML: npm run htmlhint');
    console.log('  3. Test locally: npm run dev');
    console.log('  4. Commit changes: git commit -am "Update statistics from CIA production database"');
  } else {
    console.log('ℹ️  No files needed updating');
  }
  
  console.log();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { main as updateStats, updateHTMLFile };
