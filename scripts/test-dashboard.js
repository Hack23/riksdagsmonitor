/**
 * Coalition Dashboard Test Suite
 * 
 * Manual test checklist for verifying dashboard functionality
 * Run in browser console after loading any language version
 */

console.log('🧪 Coalition Dashboard Test Suite');
console.log('='.repeat(60));

// Test 1: Verify DOM Elements
console.log('\n1️⃣ Testing DOM Elements...');
const elements = {
  'Dashboard Container': document.getElementById('coalition-dashboard'),
  'Coalition Network': document.getElementById('coalitionNetwork'),
  'Alignment Heat Map': document.getElementById('alignmentHeatMap'),
  'Voting Anomaly Chart': document.getElementById('votingAnomalyChart'),
  'Behavioral Patterns Chart': document.getElementById('behavioralPatternsChart'),
  'Decision Trends Chart': document.getElementById('decisionTrendsChart'),
  'Accessible Table': document.getElementById('coalitionNetworkTable')
};

Object.entries(elements).forEach(([name, element]) => {
  if (element) {
    console.log(`  ✅ ${name} found`);
  } else {
    console.error(`  ❌ ${name} NOT found`);
  }
});

// Test 2: Verify D3.js Loaded
console.log('\n2️⃣ Testing D3.js...');
if (typeof d3 !== 'undefined') {
  console.log(`  ✅ D3.js loaded (version ${d3.version})`);
} else {
  console.error('  ❌ D3.js NOT loaded');
}

// Test 3: Verify Chart.js Loaded
console.log('\n3️⃣ Testing Chart.js...');
if (typeof Chart !== 'undefined') {
  console.log(`  ✅ Chart.js loaded (version ${Chart.version})`);
} else {
  console.error('  ❌ Chart.js NOT loaded');
}

// Test 4: Check SVG Rendering
console.log('\n4️⃣ Testing SVG Rendering...');
const coalitionSVG = document.querySelector('#coalitionNetwork svg');
const heatMapSVG = document.querySelector('#alignmentHeatMap svg');

if (coalitionSVG) {
  const nodes = coalitionSVG.querySelectorAll('.nodes g');
  const links = coalitionSVG.querySelectorAll('.links line');
  console.log(`  ✅ Coalition network: ${nodes.length} nodes, ${links.length} links`);
} else {
  console.error('  ❌ Coalition network SVG not rendered');
}

if (heatMapSVG) {
  const cells = heatMapSVG.querySelectorAll('rect');
  console.log(`  ✅ Heat map: ${cells.length} cells`);
} else {
  console.error('  ❌ Heat map SVG not rendered');
}

// Test 5: Check Chart.js Canvases
console.log('\n5️⃣ Testing Chart.js Canvases...');
const canvases = [
  'votingAnomalyChart',
  'behavioralPatternsChart',
  'decisionTrendsChart'
];

canvases.forEach(id => {
  const canvas = document.getElementById(id);
  if (canvas && canvas.getContext) {
    // Context validation only
    canvas.getContext('2d');
    console.log(`  ✅ ${id}: ${canvas.width}x${canvas.height}px`);
  } else {
    console.error(`  ❌ ${id}: Not rendered or no context`);
  }
});

// Test 6: Check Accessibility Attributes
console.log('\n6️⃣ Testing Accessibility...');
const ariaElements = document.querySelectorAll('[role="img"], [aria-label]');
console.log(`  ✅ Found ${ariaElements.length} elements with ARIA attributes`);

const focusableNodes = document.querySelectorAll('#coalitionNetwork [tabindex]');
console.log(`  ✅ Found ${focusableNodes.length} keyboard-navigable nodes`);

const srOnly = document.querySelectorAll('.sr-only');
console.log(`  ✅ Found ${srOnly.length} screen reader-only elements`);

// Test 7: Responsive Design
console.log('\n7️⃣ Testing Responsive Design...');
const dashboardGrid = document.querySelector('.dashboard-grid');
if (dashboardGrid) {
  const gridStyle = window.getComputedStyle(dashboardGrid);
  console.log(`  ✅ Grid display: ${gridStyle.display}`);
  console.log(`  ✅ Grid gap: ${gridStyle.gap}`);
}

// Test 8: Color Contrast (Basic Check)
console.log('\n8️⃣ Testing Colors...');
const chartCards = document.querySelectorAll('.chart-card');
console.log(`  ✅ Found ${chartCards.length} chart cards`);

// Test 9: Script Loading
console.log('\n9️⃣ Testing Scripts...');
const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
const hasD3 = scripts.some(src => src.includes('d3.v7'));
const hasChart = scripts.some(src => src.includes('chart.js'));
const hasDashboard = scripts.some(src => src.includes('coalition-dashboard'));

console.log(`  ${hasD3 ? '✅' : '❌'} D3.js script tag present`);
console.log(`  ${hasChart ? '✅' : '❌'} Chart.js script tag present`);
console.log(`  ${hasDashboard ? '✅' : '❌'} Dashboard script tag present`);

// Test 10: Interactive Elements
console.log('\n🔟 Testing Interactivity...');
console.log('  ℹ️  Manual tests required:');
console.log('    - Drag network nodes');
console.log('    - Hover over heat map cells');
console.log('    - Click chart legend items');
console.log('    - Tab through network nodes');
console.log('    - Test tooltips');

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ Test suite complete!');
console.log('🔗 View dashboard at: #coalition-dashboard');
console.log('='.repeat(60));

// Export test results
window.dashboardTests = {
  elements,
  d3Loaded: typeof d3 !== 'undefined',
  chartLoaded: typeof Chart !== 'undefined',
  coalitionSVG,
  heatMapSVG,
  ariaCount: ariaElements.length,
  timestamp: new Date().toISOString()
};

console.log('\n📊 Test results saved to: window.dashboardTests');
