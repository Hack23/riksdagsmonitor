#!/usr/bin/env node

const fs = require('fs');

const filePath = process.argv[2];
const thresholdRaw = process.env.MULTIDIM_THRESHOLD;
const thresholdParsed = parseInt(thresholdRaw, 10);
const threshold = Number.isInteger(thresholdParsed) && thresholdParsed >= 1 ? thresholdParsed : 60;

try {
  const scores = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const entries = Object.values(scores);
  if (entries.length === 0) {
    console.log('NO_ARTICLES');
    process.exit(0);
  }

  const overallScores = entries
    .filter(e => e.multidimensional && typeof e.multidimensional.overallScore === 'number')
    .map(e => e.multidimensional.overallScore);
  if (overallScores.length === 0) {
    console.log('NO_MULTIDIM');
    process.exit(0);
  }

  const avg = Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length);
  const passed = overallScores.filter(s => s >= threshold).length;
  const critical = entries.filter(e => e.multidimensional && !e.multidimensional.passesThreshold).length;
  console.log(`${avg}|${passed}|${overallScores.length}|${critical}`);
} catch (e) {
  console.log(`ERROR:${e.message}`);
}
