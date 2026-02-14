import { generateArticleHTML } from './scripts/article-template.js';

const mockArticleData = {
  slug: '2026-02-14-test-article-en.html',
  title: 'Test Article: No Embedded CSS',
  subtitle: 'Testing that articles use styles.css only',
  date: '2026-02-14',
  type: 'prospective',
  readTime: '3 min read',
  lang: 'en',
  content: '<h2>Test Content</h2><p>This article should not have embedded CSS.</p>',
  events: [],
  watchPoints: [],
  sources: ['riksdag-regering-mcp'],
  keywords: ['test'],
  topics: ['test'],
  tags: ['Test']
};

const html = generateArticleHTML(mockArticleData);

// Check for embedded styles
const hasEmbeddedStyle = html.includes('<style>');
const hasStylesLink = html.includes('href="../styles.css"');

console.log('✅ Generated HTML length:', html.length);
console.log(hasEmbeddedStyle ? '❌ FAIL: Has embedded <style> tag' : '✅ PASS: No embedded <style> tag');
console.log(hasStylesLink ? '✅ PASS: Links to ../styles.css' : '❌ FAIL: Missing styles.css link');

if (!hasEmbeddedStyle && hasStylesLink) {
  console.log('\n🎉 SUCCESS: Article uses styles.css only!');
  process.exit(0);
} else {
  console.log('\n❌ FAILURE: Article still has embedded CSS or missing link');
  process.exit(1);
}
