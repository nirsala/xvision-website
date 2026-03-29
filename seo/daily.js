#!/usr/bin/env node
// ═══════════════════════════════════════════
//  SEO DAILY RUNNER
//  הרץ כל יום בשעה 08:00
//  cron: 0 8 * * * node /Users/nirsala/xvision-website/seo/daily.js
// ═══════════════════════════════════════════

const { generateArticle } = require('./content-gen');
const { pingAll }         = require('./indexing');
const { publish }         = require('./publisher');

const TODAY = new Date().toLocaleDateString('he-IL', {
  weekday:'long', year:'numeric', month:'long', day:'numeric'
});

async function run() {
  console.log('\n══════════════════════════════════════');
  console.log(` SEO DAILY — ${TODAY}`);
  console.log('══════════════════════════════════════\n');

  // 1. ייצור מאמר SEO יומי
  console.log('📝 שלב 1: ייצור תוכן SEO...');
  let article = null;
  try {
    article = await generateArticle();
  } catch (e) {
    console.error('[daily] שגיאה בייצור תוכן:', e.message);
  }

  // 2. פרסום ל-GitHub
  console.log('\n🚀 שלב 2: פרסום ל-GitHub Pages...');
  const date = new Date().toISOString().split('T')[0];
  const commitMsg = article
    ? `seo: מאמר יומי — ${article.title} (${date})`
    : `seo: עדכון יומי (${date})`;
  publish(commitMsg);

  // 3. אינדוקס גוגל + בינג
  console.log('\n🔍 שלב 3: שליחה לאינדוקס...');
  const extraUrls = article ? [`/blog/${article.slug}.html`] : [];
  await pingAll(extraUrls);

  // 4. דוח סיכום
  console.log('\n══════════════════════════════════════');
  console.log(' סיכום יומי:');
  console.log(`  ✅ תאריך: ${TODAY}`);
  if (article) {
    console.log(`  ✅ מאמר: ${article.title}`);
    console.log(`  ✅ מילת מפתח: ${article.keyword}`);
    console.log(`  ✅ קובץ: blog/${article.slug}.html`);
  }
  console.log('  ✅ פורסם ל-GitHub Pages');
  console.log('  ✅ נשלח לאינדוקס Bing + Google Sitemap');
  console.log('══════════════════════════════════════\n');
}

run().catch(e => {
  console.error('[daily] שגיאה קריטית:', e);
  process.exit(1);
});
