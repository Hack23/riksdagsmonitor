import { generateArticleHTML } from './scripts/article-template.js';
import fs from 'fs';

const sampleData = {
  slug: '2026-02-14-sample-no-embedded-css-en.html',
  title: 'Parliament Returns: Budget Debate and Foreign Policy Focus',
  subtitle: 'Latest news and analysis from Sweden\'s Riksdag. The Economist-style political journalism covering parliament, government, and agencies with systematic transparency.',
  date: '2026-02-14',
  type: 'prospective',
  readTime: '6 min read',
  lang: 'en',
  content: `
    <h2>Why This Matters</h2>
    <p>Sweden\'s parliament reconvenes this week with a packed agenda that will test the minority government\'s ability to navigate coalition politics while maintaining fiscal discipline and a coherent foreign policy stance.</p>

    <h2>Key Developments</h2>
    <p>The annual budget debate will dominate proceedings, with opposition parties challenging the government\'s spending priorities. Finance Minister Elisabeth Svantesson must defend controversial tax proposals while addressing rising inflation concerns.</p>

    <h3>Foreign Policy Implications</h3>
    <p>Wednesday\'s foreign policy debate comes at a crucial time, with Sweden\'s NATO membership requiring careful coordination with alliance partners on defense spending and strategic commitments.</p>

    <div class="context-box">
      <h3>Background</h3>
      <p>This is the first full parliamentary week since the winter recess. The government faces increasing pressure from both left and right opposition parties on economic policy.</p>
    </div>

    <h2>What to Expect</h2>
    <ul>
      <li>Budget committee hearing on Thursday with testimony from central bank governor</li>
      <li>PM question time focusing on healthcare reforms</li>
      <li>Three new legislative proposals from the Environment Ministry</li>
    </ul>
  `,
  events: [
    {
      date: '2026-02-17',
      dayName: 'Monday',
      dayNumber: '17',
      dayLabel: 'February 17',
      isToday: false,
      items: [
        { time: '10:00', title: 'Budget Committee Hearing' },
        { time: '14:00', title: 'Chamber Question Time' }
      ]
    },
    {
      date: '2026-02-18',
      dayName: 'Tuesday',
      dayNumber: '18',
      dayLabel: 'February 18',
      isToday: false,
      items: [
        { time: '09:00', title: 'Finance Committee Meeting' },
        { time: '13:00', title: 'Debate on Tax Proposals' }
      ]
    },
    {
      date: '2026-02-19',
      dayName: 'Wednesday',
      dayNumber: '19',
      dayLabel: 'February 19',
      isToday: false,
      items: [
        { time: '10:00', title: 'Foreign Policy Debate' },
        { time: '15:00', title: 'PM Question Time' }
      ]
    }
  ],
  watchPoints: [
    {
      title: 'Budget Committee Testimony',
      description: 'Central bank governor expected to provide inflation outlook that could influence fiscal policy debates'
    },
    {
      title: 'Coalition Dynamics',
      description: 'Watch for signs of tension within the four-party coalition on defense spending priorities'
    },
    {
      title: 'Opposition Strategy',
      description: 'Social Democrats may introduce alternative budget proposals to test government support'
    }
  ],
  sources: ['riksdag-regering-mcp', 'Riksdagen Calendar API', 'Swedish Parliament Documents'],
  keywords: ['parliament', 'riksdag', 'budget', 'foreign policy', 'sweden', 'government'],
  topics: ['parliament', 'budget', 'foreign-policy', 'coalition-politics'],
  tags: ['Budget Debate', 'Foreign Policy', 'Coalition Politics', 'PM Question Time']
};

const html = generateArticleHTML(sampleData);

// Write to news directory
fs.writeFileSync('news/2026-02-14-sample-no-embedded-css-en.html', html);
console.log('✅ Sample article generated: news/2026-02-14-sample-no-embedded-css-en.html');
console.log('📊 File size:', html.length, 'bytes');
console.log('🎨 Uses styles.css:', html.includes('href="../styles.css"'));
console.log('🚫 No embedded CSS:', !html.includes('<style>'));
