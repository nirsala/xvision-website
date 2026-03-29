// ═══════════════════════════════════════════
//  SEO CONTENT GENERATOR — Claude API
//  מייצר מאמר SEO ביומי ומפרסם לאתר
// ═══════════════════════════════════════════

const fs   = require('fs');
const path = require('path');
const cfg  = require('./config');

const BLOG_DIR = path.join(cfg.site.dir, 'blog');

// נושאים לסבב שבועי (7 נושאים ← כל יום אחר)
const TOPICS = [
  { title: 'מסכי LED לחנויות קמעונאיות — המדריך המלא', keyword: 'מסכי LED לחנויות' },
  { title: '5 סיבות למה כל מסעדה צריכה שילוט דיגיטלי', keyword: 'שילוט דיגיטלי למסעדות' },
  { title: 'מסכי LED חיצוניים — כל מה שצריך לדעת', keyword: 'מסכי LED חיצוניים' },
  { title: 'מערכת ניהול תוכן למסכים — איך זה עובד?', keyword: 'ניהול תוכן מסכים' },
  { title: 'מסכי לובי — חוויית כניסה שתרשים כל מבקר', keyword: 'מסכי LED לובי' },
  { title: 'מסכי בריכה עמידים לחוץ — המדריך לבחירה', keyword: 'מסכי LED לבריכה' },
  { title: 'כמה עולה מסך LED לעסק? מחיר, גדלים ואפשרויות', keyword: 'מסכי LED לעסקים' },
];

async function generateArticle() {
  if (!cfg.claudeApiKey) {
    console.log('[content-gen] ANTHROPIC_API_KEY לא מוגדר — מדלג על ייצור תוכן');
    return null;
  }

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const topic = TOPICS[dayOfYear % TOPICS.length];
  const dateStr = new Date().toISOString().split('T')[0];
  const slug = topic.title.replace(/[^א-תa-zA-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50);

  console.log(`[content-gen] מייצר מאמר: ${topic.title}`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': cfg.claudeApiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `כתוב מאמר SEO באורך 600-800 מילים בעברית בנושא: "${topic.title}"
מילת המפתח הראשית: "${topic.keyword}"

הנחיות:
- כותרת H1 ב-HTML
- 3-4 כותרות H2
- פסקאות קצרות וקריאות
- כלול את מילת המפתח 4-5 פעמים באופן טבעי
- הוסף שאלה ותשובה (FAQ) בסוף — 2 שאלות
- כתוב HTML בלבד (ללא markdown)
- הקהל: בעלי עסקים ישראלים
- אזכר את "Pixel by Keshet" פעם אחת כספק מוביל`
      }]
    })
  });

  const data = await response.json();
  const content = data.content?.[0]?.text || '';

  // יצירת HTML מלא לדף הבלוג
  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${topic.title} | Pixel by Keshet</title>
<meta name="description" content="${topic.title} — מידע מקצועי מבית Pixel by Keshet, המומחים למסכי LED ושילוט דיגיטלי לעסקים."/>
<meta name="keywords" content="${topic.keyword}, מסכי LED, שילוט דיגיטלי, Pixel by Keshet"/>
<link rel="canonical" href="${cfg.site.url}/blog/${slug}.html"/>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","headline":"${topic.title}","datePublished":"${dateStr}","author":{"@type":"Organization","name":"Pixel by Keshet"},"publisher":{"@type":"Organization","name":"Pixel by Keshet","logo":{"@type":"ImageObject","url":"${cfg.site.url}/assets/logo/pixel-logo-transparent.png"}}}
</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Heebo',sans-serif;background:#0a0e18;color:#e8eaf0;direction:rtl;padding:40px 20px;max-width:780px;margin:0 auto;line-height:1.8}
h1{font-size:2rem;margin-bottom:24px;color:#fff}
h2{font-size:1.3rem;margin:32px 0 12px;color:#fff}
p{margin-bottom:16px;color:rgba(255,255,255,.78)}
a{color:#d71d43}
.back{display:inline-block;margin-bottom:32px;color:#d71d43;text-decoration:none;font-size:14px}
</style>
</head>
<body>
<a href="../index.html" class="back">← חזרה לאתר</a>
${content}
<p style="margin-top:40px;font-size:12px;color:rgba(255,255,255,.4)">פורסם: ${dateStr} | Pixel by Keshet</p>
</body>
</html>`;

  // שמירת הקובץ
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
  const filePath = path.join(BLOG_DIR, `${slug}.html`);
  fs.writeFileSync(filePath, html, 'utf8');

  // עדכון sitemap
  updateSitemap(`${cfg.site.url}/blog/${slug}.html`, dateStr);

  console.log(`[content-gen] נשמר: blog/${slug}.html`);
  return { slug, title: topic.title, keyword: topic.keyword, filePath };
}

function updateSitemap(newUrl, date) {
  const sitemapPath = path.join(cfg.site.dir, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (sitemap.includes(newUrl)) return; // כבר קיים

  const entry = `  <url><loc>${newUrl}</loc><lastmod>${date}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
  sitemap = sitemap.replace('</urlset>', `${entry}\n</urlset>`);
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log('[content-gen] sitemap עודכן');
}

module.exports = { generateArticle };
