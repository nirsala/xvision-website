// ═══════════════════════════════════════════
//  BLOG INDEX BUILDER — מקור אמת יחיד לרשימת המאמרים
//  בונה מחדש את רשת הכרטיסים ב-blog/index.html מהקבצים שבדיסק.
//
//  למה הוא קיים: blog/index.html נערך ידנית, ולכן מאמרים שנוצרו
//  ע"י המשימות המתוזמנות מעולם לא נוספו אליו. ב-2026-07-21 נמצאו
//  113 מתוך 165 מאמרים ללא שום קישור פנימי — דפי יתומים שגוגל
//  סורק פחות ומדרג נמוך יותר. בנייה מחדש מהדיסק מונעת את זה לתמיד.
//
//  שומר על ה-head, ה-nav, ה-hero והפוטר של הדף — מחליף רק את
//  הבלוק שבין <div class="grid"> לסגירה שלו.
// ═══════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const INDEX = path.join(BLOG, 'index.html');
const FALLBACK_IMG = 'https://xvision.co.il/assets/images/led-module.jpg';

const EXCLUDE = new Set(['index.html']);

function isNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

/** אותו שער איכות של build-sitemap.js — דף בלי h1 או כמעט בלי טקסט הוא פלט שבור. */
function shouldInclude(html) {
  if (isNoindex(html)) return false;
  const body = html.slice(html.indexOf('<body'));
  const text = body
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim();
  const words = text ? text.split(/\s+/).length : 0;
  return /<h1[\s>]/i.test(html) && words >= 120;
}

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** תאריך: קודם JSON-LD (הכי אמין), אחר כך תבנית תאריך בשם הקובץ, ולבסוף זמן הקובץ. */
function extractDate(html, file, absPath) {
  const ld = html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  if (ld) return ld[1];
  const fromName = file.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (fromName) return `${fromName[1]}-${fromName[2]}-${fromName[3]}`;
  return fs.statSync(absPath).mtime.toISOString().slice(0, 10);
}

function extractTitle(html) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return decodeEntities(strip(h1[1]));
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t ? decodeEntities(strip(t[1])).split('|')[0].trim() : '';
}

function extractTag(html) {
  const m = html.match(/class="article-meta-tag"[^>]*>([\s\S]*?)<\/span>/i)
        || html.match(/class="card-tag"[^>]*>([\s\S]*?)<\/div>/i);
  return m ? decodeEntities(strip(m[1])) : '';
}

function extractImage(html) {
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : FALLBACK_IMG;
}

// ── תאריך עדכון: ה-lastmod שב-sitemap.xml (תאריך הקומיט האחרון, מתוקן לקלון רדוד) ──
// הוראת ניר 10.11.2026: דף /blog/ ממוין לפי תאריך העדכון, מהחדש לישן, ולא לפי datePublished —
// אחרת המאמרים האוטומטיים מאוגוסט נשארים בראש והפוסטים שעודכנו החודש קבורים למטה.
// לכן build-sitemap.js רץ לפני הסקריפט הזה. נפילה: dateModified ב-JSON-LD, ואז datePublished.
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const lastmods = (() => {
  const map = new Map();
  try {
    const xml = fs.readFileSync(SITEMAP, 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) map.set(m[1], m[2]);
  } catch {
    // אין sitemap — נשתמש בנפילה
  }
  return map;
})();

function extractUpdated(html, file, published) {
  const loc = 'https://xvision.co.il/blog/' + encodeURIComponent(file).replace(/%2F/g, '/');
  const fromMap = lastmods.get(loc) || lastmods.get('https://xvision.co.il/blog/' + file);
  if (fromMap) return fromMap.slice(0, 10);
  const mod = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  return mod ? mod[1] : published;
}

// מאמרים אוטומטיים ישנים (led-article-N) — בסוף הרשימה עד הכרעת מאיה/רון (הוראת רון 10.11).
const isAutoArticle = (f) => /^(led|cms)-article-/.test(f);

const fmtDate = (d) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

function collect() {
  return fs.readdirSync(BLOG)
    .filter((f) => f.endsWith('.html') && !EXCLUDE.has(f))
    .map((f) => {
      const abs = path.join(BLOG, f);
      const html = fs.readFileSync(abs, 'utf8');
      if (!shouldInclude(html)) return null;
      const title = extractTitle(html);
      if (!title) return null;
      const date = extractDate(html, f, abs);
      return { file: f, title, tag: extractTag(html), date, updated: extractUpdated(html, f, date), img: extractImage(html) };
    })
    .filter(Boolean)
    // מאמרים אוטומטיים בסוף; בתוך כל קבוצה עדכון חדש→ישן; שובר שוויון לפי שם (פלט דטרמיניסטי)
    .sort((a, b) =>
      (isAutoArticle(a.file) - isAutoArticle(b.file)) ||
      b.updated.localeCompare(a.updated) ||
      a.file.localeCompare(b.file));
}

function card(a) {
  const href = `/blog/${a.file}`;
  const tag = a.tag ? `\n        <div class="card-tag">${escapeAttr(a.tag)}</div>` : '';
  return `    <article class="card">
      <a href="${href}"><img src="${escapeAttr(a.img)}" alt="${escapeAttr(a.title)}" class="card-img" loading="lazy"/></a>
      <div class="card-body">${tag}
        <h2><a href="${href}">${escapeAttr(a.title)}</a></h2>
        <div class="card-meta"><time datetime="${a.updated}">עודכן ${fmtDate(a.updated)}</time></div>
      </div>
    </article>`;
}

function build() {
  const articles = collect();
  const html = fs.readFileSync(INDEX, 'utf8');

  const open = html.indexOf('<div class="grid">');
  if (open === -1) throw new Error('לא נמצא <div class="grid"> ב-blog/index.html');
  const lastCard = html.lastIndexOf('</article>');
  if (lastCard === -1 || lastCard < open) throw new Error('לא נמצאו כרטיסים ברשת');
  const close = html.indexOf('</div>', lastCard);
  if (close === -1) throw new Error('לא נמצאה סגירת הרשת');

  const grid = `<div class="grid">\n\n${articles.map(card).join('\n')}\n`;
  const out = html.slice(0, open) + grid + html.slice(close);
  fs.writeFileSync(INDEX, out, 'utf8');

  console.log(`[build-blog-index] ${articles.length} מאמרים נכתבו ל-blog/index.html`);
  const skipped = fs.readdirSync(BLOG).filter((f) => f.endsWith('.html') && !EXCLUDE.has(f)).length - articles.length;
  if (skipped > 0) console.log(`[build-blog-index] ${skipped} דפים דולגו (noindex / בלי h1 / מתחת ל-120 מילים)`);
  return articles.length;
}

if (require.main === module) build();
module.exports = { build, collect };
