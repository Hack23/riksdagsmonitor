/**
 * Politician Career & Productivity Analytics Dashboard
 * Loads CIA data and creates interactive visualizations
 */

// CIA GitHub raw content base URL
const CIA_DATA_BASE_URL = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data';

// Data cache
const dataCache = {
  top10Productive: null,
  top10Influential: null,
  top10RisingStars: null,
  top10Controversial: null,
  careerTrajectory: null,
  productivity: null,
  experienceDistribution: null
};

/**
 * Fetch CSV data from CIA repository
 * @param {string} filename - CSV filename
 * @returns {Promise<Array>} Parsed CSV data
 */
async function fetchCIAData(filename) {
  try {
    const response = await fetch(`${CIA_DATA_BASE_URL}/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
    }
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error(`Error fetching ${filename}:`, error);
    throw error;
  }
}

/**
 * Parse CSV text to array of objects
 * @param {string} csvText - CSV text content
 * @returns {Array<Object>} Parsed data
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }
  
  return data;
}

/**
 * Parse a single CSV line handling quoted fields
 * @param {string} line - CSV line
 * @returns {Array<string>} Parsed values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

/**
 * Render Top 10 list
 * @param {string} containerId - Container element ID
 * @param {Array} data - Top 10 data
 * @param {string} scoreLabel - Label for score column
 */
function renderTop10List(containerId, data, scoreLabel = 'Score') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="error-message">No data available</div>';
    return;
  }
  
  const ul = document.createElement('ul');
  ul.className = 'top10-list';
  ul.setAttribute('role', 'list');
  
  data.slice(0, 10).forEach((item, index) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');
    
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = `${index + 1}`;
    rank.setAttribute('aria-label', `Rank ${index + 1}`);
    
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.name || item.politician || 'Unknown';
    
    const party = document.createElement('span');
    party.className = 'party';
    party.textContent = item.party || '';
    
    const score = document.createElement('span');
    score.className = 'score';
    score.textContent = item.score || item.value || '0';
    score.setAttribute('aria-label', `${scoreLabel}: ${item.score || item.value || '0'}`);
    
    li.appendChild(rank);
    li.appendChild(name);
    if (item.party) li.appendChild(party);
    li.appendChild(score);
    
    ul.appendChild(li);
  });
  
  container.innerHTML = '';
  container.appendChild(ul);
}

/**
 * Create career trajectory line chart
 * @param {Array} data - Career trajectory data
 */
function createCareerTrajectoryChart(data) {
  const canvas = document.getElementById('career-trajectory-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Sample data structure - in production, parse from CIA CSV
  const chartData = {
    labels: ['2000', '2005', '2010', '2015', '2020', '2025'],
    datasets: [
      {
        label: 'Average Career Level',
        data: [2.5, 3.2, 3.8, 4.1, 4.5, 4.8],
        borderColor: '#00d9ff',
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'P75 Career Level',
        data: [3.5, 4.2, 4.8, 5.1, 5.5, 5.8],
        borderColor: '#ff006e',
        backgroundColor: 'rgba(255, 0, 110, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(26, 30, 61, 0.95)',
          titleColor: '#00d9ff',
          bodyColor: '#e0e0e0',
          borderColor: '#00d9ff',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          },
          grid: {
            color: 'rgba(0, 217, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          },
          grid: {
            color: 'rgba(0, 217, 255, 0.1)'
          }
        }
      }
    }
  });
}

/**
 * Create productivity vs influence scatter chart
 * @param {Array} data - Productivity data
 */
function createProductivityInfluenceChart(data) {
  const canvas = document.getElementById('productivity-influence-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Sample data - in production, parse from CIA CSV
  const chartData = {
    datasets: [{
      label: 'MPs',
      data: Array.from({length: 50}, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 20 + 5
      })),
      backgroundColor: 'rgba(0, 217, 255, 0.5)',
      borderColor: '#00d9ff',
      borderWidth: 1
    }]
  };
  
  new Chart(ctx, {
    type: 'bubble',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(26, 30, 61, 0.95)',
          titleColor: '#00d9ff',
          bodyColor: '#e0e0e0',
          borderColor: '#00d9ff',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return [
                `Productivity: ${context.parsed.x.toFixed(1)}`,
                `Influence: ${context.parsed.y.toFixed(1)}`,
                `Experience: ${context.raw.r.toFixed(0)} years`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Productivity Score',
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          },
          ticks: {
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          },
          grid: {
            color: 'rgba(0, 217, 255, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Influence Score',
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          },
          ticks: {
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          },
          grid: {
            color: 'rgba(0, 217, 255, 0.1)'
          }
        }
      }
    }
  });
}

/**
 * Create experience distribution bar chart
 * @param {Array} data - Experience distribution data
 */
function createExperienceDistributionChart(data) {
  const canvas = document.getElementById('experience-distribution-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Sample data - in production, parse from CIA CSV
  const chartData = {
    labels: ['0-2 years', '3-5 years', '6-10 years', '11-15 years', '16-20 years', '20+ years'],
    datasets: [{
      label: 'Number of MPs',
      data: [45, 78, 95, 67, 42, 22],
      backgroundColor: [
        'rgba(0, 217, 255, 0.7)',
        'rgba(0, 217, 255, 0.6)',
        'rgba(0, 217, 255, 0.5)',
        'rgba(255, 0, 110, 0.5)',
        'rgba(255, 0, 110, 0.6)',
        'rgba(255, 0, 110, 0.7)'
      ],
      borderColor: [
        '#00d9ff',
        '#00d9ff',
        '#00d9ff',
        '#ff006e',
        '#ff006e',
        '#ff006e'
      ],
      borderWidth: 2
    }]
  };
  
  new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(26, 30, 61, 0.95)',
          titleColor: '#00d9ff',
          bodyColor: '#e0e0e0',
          borderColor: '#00d9ff',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          },
          grid: {
            color: 'rgba(0, 217, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: '#e0e0e0',
            font: {
              family: "'Inter', sans-serif"
            }
          },
          grid: {
            color: 'rgba(0, 217, 255, 0.1)'
          }
        }
      }
    }
  });
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
  try {
    // Generate sample data for Top 10 lists
    // In production, these would be loaded from CIA CSV files
    const sampleTop10Productive = Array.from({length: 10}, (_, i) => ({
      name: `MP ${i + 1}`,
      party: ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'][Math.floor(Math.random() * 8)],
      score: (100 - i * 5).toString()
    }));
    
    const sampleTop10Influential = Array.from({length: 10}, (_, i) => ({
      name: `MP ${i + 11}`,
      party: ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'][Math.floor(Math.random() * 8)],
      score: (95 - i * 4).toString()
    }));
    
    const sampleTop10RisingStars = Array.from({length: 10}, (_, i) => ({
      name: `MP ${i + 21}`,
      party: ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'][Math.floor(Math.random() * 8)],
      score: (90 - i * 3).toString()
    }));
    
    const sampleTop10Controversial = Array.from({length: 10}, (_, i) => ({
      name: `MP ${i + 31}`,
      party: ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'][Math.floor(Math.random() * 8)],
      score: (85 - i * 2).toString()
    }));
    
    // Render Top 10 lists
    renderTop10List('top10-productive-container', sampleTop10Productive, 'Documents');
    renderTop10List('top10-influential-container', sampleTop10Influential, 'Influence');
    renderTop10List('top10-rising-stars-container', sampleTop10RisingStars, 'Growth');
    renderTop10List('top10-controversial-container', sampleTop10Controversial, 'Controversy');
    
    // Create charts
    createCareerTrajectoryChart([]);
    createProductivityInfluenceChart([]);
    createExperienceDistributionChart([]);
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showError('Failed to load dashboard data. Please try again later.');
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const containers = [
    'top10-productive-container',
    'top10-influential-container',
    'top10-rising-stars-container',
    'top10-controversial-container'
  ];
  
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = `<div class="error-message">${message}</div>`;
    }
  });
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadDashboardData);
} else {
  loadDashboardData();
}
