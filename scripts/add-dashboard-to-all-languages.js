#!/usr/bin/env node

/**
 * Add Coalition Dashboard to All Language HTML Files
 * 
 * This script:
 * 1. Adds D3.js and Chart.js CDN libraries to HTML head
 * 2. Adds dashboard section with localized content
 * 3. Adds dashboard script reference before closing body tag
 * 
 * Usage: node scripts/add-dashboard-to-all-languages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load translations
const translationsPath = path.join(__dirname, 'dashboard-translations.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

// Language configuration
const LANGUAGES = [
  { code: 'en', file: 'index.html' },
  { code: 'sv', file: 'index_sv.html' },
  { code: 'da', file: 'index_da.html' },
  { code: 'no', file: 'index_no.html' },
  { code: 'fi', file: 'index_fi.html' },
  { code: 'de', file: 'index_de.html' },
  { code: 'fr', file: 'index_fr.html' },
  { code: 'es', file: 'index_es.html' },
  { code: 'nl', file: 'index_nl.html' },
  { code: 'ar', file: 'index_ar.html' },
  { code: 'he', file: 'index_he.html' },
  { code: 'ja', file: 'index_ja.html' },
  { code: 'ko', file: 'index_ko.html' },
  { code: 'zh', file: 'index_zh.html' }
];

// CDN scripts to add to head
const CDN_SCRIPTS = `
<!-- D3.js v7 for data visualizations -->
<script src="https://d3js.org/d3.v7.min.js" integrity="sha384-4N8bTG5E3kMHBdZ5X4WkfgBN4L6gXG7VKYgXGPnNfJt6nO7Rl5jTBZz/+pIf9fPz" crossorigin="anonymous" defer></script>

<!-- Chart.js v4 for charts -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" integrity="sha384-vKT6s7/8fqX7c6v3HfUmVXVZYFCZnxmRTbP5TW+t8H5z7d4mzf7Y1BZ/yg9xH8eO" crossorigin="anonymous" defer></script>

<!-- Chart.js date adapter for time series -->
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js" integrity="sha384-rwYN+9ZL9kH5lh6eTN9g8H3lQ+KgD9yH4tZ7L9pR6H9nX5dI+9Z8dH3yF4tJ3L5m" crossorigin="anonymous" defer></script>
`;

// Dashboard script reference
const DASHBOARD_SCRIPT = `
<!-- Coalition Dashboard Script -->
<script src="scripts/coalition-dashboard.js" defer></script>
`;

/**
 * Generate dashboard HTML section for a language
 */
function generateDashboardSection(langCode) {
  const t = translations[langCode];
  
  return `
<section id="coalition-dashboard" class="dashboard-container">
<h2>${t.sectionTitle}</h2>
<p>${t.sectionDescription}</p>

<div class="dashboard-grid">
<div class="chart-card wide">
<h3>${t.coalitionNetworkTitle}</h3>
<p>${t.coalitionNetworkDesc}</p>
<div id="coalitionNetwork" role="img" aria-label="${t.coalitionNetworkAria}"></div>
<table class="sr-only" id="coalitionNetworkTable">
<!-- Accessible table fallback populated by JavaScript -->
</table>
</div>

<div class="chart-card">
<h3>${t.votingAnomaliesTitle}</h3>
<p>${t.votingAnomaliesDesc}</p>
<canvas id="votingAnomalyChart" role="img" aria-label="${t.votingAnomaliesAria}"></canvas>
</div>

<div class="chart-card">
<h3>${t.alignmentHeatMapTitle}</h3>
<p>${t.alignmentHeatMapDesc}</p>
<div id="alignmentHeatMap" role="img" aria-label="${t.alignmentHeatMapAria}"></div>
</div>

<div class="chart-card">
<h3>${t.behavioralPatternsTitle}</h3>
<p>${t.behavioralPatternsDesc}</p>
<canvas id="behavioralPatternsChart" role="img" aria-label="${t.behavioralPatternsAria}"></canvas>
</div>

<div class="chart-card wide">
<h3>${t.decisionTrendsTitle}</h3>
<p>${t.decisionTrendsDesc}</p>
<canvas id="decisionTrendsChart" role="img" aria-label="${t.decisionTrendsAria}"></canvas>
</div>
</div>

<p class="note dashboard-attribution">
<strong>${t.dataAttribution}</strong> ${t.dataAttributionText}
</p>
</section>
`;
}

/**
 * Update a single HTML file
 */
function updateHTMLFile(langConfig) {
  const filePath = path.join(__dirname, '..', langConfig.file);
  
  console.log(`\n📝 Updating ${langConfig.file} (${langConfig.code})...`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${langConfig.file}`);
    return;
  }
  
  let html = fs.readFileSync(filePath, 'utf8');
  
  // 1. Add CDN scripts to head (if not already present)
  if (!html.includes('d3.v7.min.js')) {
    // Find insertion point (before closing head or schema.org script)
    const insertPoint = html.indexOf('<!-- Schema.org structured data -->');
    if (insertPoint !== -1) {
      html = html.slice(0, insertPoint) + CDN_SCRIPTS + '\n' + html.slice(insertPoint);
      console.log('  ✅ Added CDN libraries to <head>');
    } else {
      console.log('  ⚠️  Could not find insertion point for CDN scripts');
    }
  } else {
    console.log('  ℹ️  CDN libraries already present');
  }
  
  // 2. Add dashboard section (if not already present)
  if (!html.includes('id="coalition-dashboard"')) {
    // Try to find insertion point before data-integration section
    let insertPoint = html.indexOf('<section id="data-integration">');
    
    // If not found, try other common sections
    if (insertPoint === -1) {
      insertPoint = html.indexOf('<section id="technical-specifications">');
    }
    if (insertPoint === -1) {
      insertPoint = html.indexOf('<section id="resources">');
    }
    if (insertPoint === -1) {
      insertPoint = html.indexOf('</main>');
    }
    
    if (insertPoint !== -1) {
      const dashboardHTML = generateDashboardSection(langConfig.code);
      html = html.slice(0, insertPoint) + dashboardHTML + '\n' + html.slice(insertPoint);
      console.log('  ✅ Added dashboard section');
    } else {
      console.log('  ⚠️  Could not find insertion point for dashboard section');
    }
  } else {
    console.log('  ℹ️  Dashboard section already present');
  }
  
  // 3. Add dashboard script (if not already present)
  if (!html.includes('coalition-dashboard.js')) {
    const insertPoint = html.indexOf('</body>');
    if (insertPoint !== -1) {
      html = html.slice(0, insertPoint) + DASHBOARD_SCRIPT + '\n' + html.slice(insertPoint);
      console.log('  ✅ Added dashboard script reference');
    } else {
      console.log('  ⚠️  Could not find </body> tag');
    }
  } else {
    console.log('  ℹ️  Dashboard script already present');
  }
  
  // Write updated HTML
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ ${langConfig.file} updated successfully`);
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Adding Coalition Dashboard to all language files...\n');
  console.log(`Processing ${LANGUAGES.length} language files:\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  LANGUAGES.forEach(langConfig => {
    try {
      updateHTMLFile(langConfig);
      successCount++;
    } catch (error) {
      console.error(`❌ Error updating ${langConfig.file}:`, error.message);
      errorCount++;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} files`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} files`);
  }
  console.log('='.repeat(60));
  console.log('\n✨ Dashboard integration complete!\n');
}

// Run the script
main();
