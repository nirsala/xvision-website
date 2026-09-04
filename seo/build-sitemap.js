// ═══════════════════════════════════════════
//  SITEMAP BUILDER — מקור אמת יחיד
//  בונה את sitemap.xml מחדש מהקבצים שבדיסק.
//
//  למה לא למזג טקסטואלית: `sitemap.xml merge=union` ב-.gitattributes
//  ייצר XML לא תקין כששתי משימות דחפו במקביל — שלושה תגי </urlset>
//  ו-24 כפילויות. גוגל דוחה קובץ כזה במלואו. בנייה מחדש היא
//  דטרמיניסטית ולא ניתנת לשבירה ע"י merge.
// ═══════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const cfg = require('./config');

const ROOT = cfg.site.dir;
const BASE = cfg.site.url;

// דפים שלעולם לא נכנסים למפה
const EXCLUDE = new Set(['404.html']);

// ── lastmod: תאריך הקומיט האחרון של הקובץ, לא mtime ──────────────
// mtime של קובץ בקלון טרי הוא תאריך ה-checkout, כך שכל ריצה ב-CI
// סימנה את כל 166 הכתובות כאילו השתנו היום. זה אות שווא לגוגל ומחייב
// תיקון ידני אחרי כל בנייה. תאריך הקומיט האחרון הוא הנתון האמיתי.
// מפה אחת מ-git log לכל הקבצים; נפילה חזרה ל-mtime אם git לא זמין.
const gitDates = (() => {
  const map = new Map();
  try {
    const out = execFileSync(
      'git',
      // core.quotepath=false — אחרת git מחזיר נתיבים בעברית כ-escape
      // אוקטלי ("\327\236...") והחיפוש לפי שם הקובץ האמיתי לא מוצא כלום.
      ['-c', 'core.quotepath=false', 'log', '--name-only', '--format=%x00%cs', '--diff-filter=d'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );
    let date = null;
    for (const line of out.split('\n')) {
      if (line.startsWith('\0')) { date = line.slice(1).trim(); continue; }
      const file = line.trim();
      if (file && date && !map.has(file)) map.set(file, date);
    }
  } catch {
    // git לא זמין (למשל בנייה מחוץ לריפו) — נשתמש ב-mtime
  }

  // קבצים שנערכו ועוד לא נכנסו לקומיט: תאריך הקומיט האחרון שלהם ישן,
  // אבל התוכן כן השתנה היום. מסמנים אותם בתאריך של היום כדי שהמפה
  // תהיה נכונה גם כשבונים אותה לפני ה-commit.
  try {
    const today = new Date().toISOString().split('T')[0];
    const dirty = execFileSync('git',
      ['-c', 'core.quotepath=false', 'status', '--porcelain', '--untracked-files=all'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    for (const line of dirty.split('\n')) {
      const file = line.slice(3).trim();
      if (file && !file.includes(' -> ')) map.set(file, today);
    }
  } catch {
    // אין git — נשארים עם מה שיש
  }

  return map;
})();

// ── רשת ביטחון אחרונה: התאריכים שכבר פורסמו במפה הקודמת ──────────
// אם ה-git log לא זמין (קלון רדוד, בנייה מחוץ לריפו), הנפילה ל-mtime
// מסמנת את כל הקבצים כאילו נערכו היום — בדיוק אות השווא שהבנייה הזו
// נועדה למנוע. במקרה כזה עדיף לשמר את התאריך שכבר פורסם לגוגל.
const publishedDates = (() => {
  const map = new Map();
  try {
    const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
      map.set(m[1], m[2]);
    }
  } catch {
    // אין מפה קודמת — בנייה ראשונה
  }
  return map;
})();

function lastmodFor(relPath, loc) {
  const fromGit = gitDates.get(relPath);
  if (fromGit) return fromGit;
  const published = publishedDates.get(loc);
  if (published) return published;
  return fs.statSync(path.join(ROOT, relPath)).mtime.toISOString().split('T')[0];
}

// עדיפויות — כל מה שלא מופיע כאן מקבל את ברירת המחדל לפי התיקייה
const PRIORITY = {
  'index.html': '1.0',
  'products.html': '0.9',
  'שילוט-דיגיטלי-לעסקים.html': '0.9',
  'cms.html': '0.9',
  'מחירים.html': '0.8',
  'מחירי-מסכי-led.html': '0.8',
};
const DEFAULT_ROOT_PRIORITY = '0.8';
const DEFAULT_BLOG_PRIORITY = '0.7';

function isNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

/** דף נכנס למפה רק אם הוא קיים, אינדוקסבילי, ויש בו גוף תוכן אמיתי. */
function shouldInclude(absPath) {
  const html = fs.readFileSync(absPath, 'utf8');
  if (isNoindex(html)) return false;

  // שער איכות: דף בלי h1 או כמעט בלי טקסט הוא פלט שבור של מחולל,
  // ואסור שיגיע למפה גם אם הקובץ קיים.
  const body = html.slice(html.indexOf('<body'));
  const text = body
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim();
  const words = text ? text.split(/\s+/).length : 0;
  if (!/<h1[\s>]/i.test(html) || words < 120) return false;

  return true;
}

function collect() {
  const urls = [];
  const seen = new Set();

  const add = (relPath, priority) => {
    const loc = relPath === 'index.html'
      ? `${BASE}/`
      : `${BASE}/${relPath.split('/').map(encodeURIComponent).join('/')}`;
    if (seen.has(loc)) return;
    seen.add(loc);
    urls.push({ loc, lastmod: lastmodFor(relPath, loc), priority });
  };

  // דף הבית תמיד ראשון
  if (fs.existsSync(path.join(ROOT, 'index.html'))) add('index.html', PRIORITY['index.html']);

  for (const f of fs.readdirSync(ROOT).sort()) {
    if (!f.endsWith('.html') || EXCLUDE.has(f) || f === 'index.html') continue;
    if (!shouldInclude(path.join(ROOT, f))) continue;
    add(f, PRIORITY[f] || DEFAULT_ROOT_PRIORITY);
  }

  // עמודי index של תיקיות מתפרסמים ככתובת ספרייה (blog/, contact/) ולא כ-index.html,
  // אחרת הם נושרים מהמפה למרות שהם דפים אמיתיים. הרשימה נגזרת מהדיסק ולא מקובעת
  // בקוד, כדי שתיקייה חדשה לא תיפול מהמפה בשקט. shouldInclude עדיין מסנן לפי איכות.
  const PAGE_DIR_EXCLUDE = new Set(['assets', 'seo']);
  const pageDirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !PAGE_DIR_EXCLUDE.has(d.name))
    .map(d => d.name)
    .sort();

  for (const dir of pageDirs) {
    const indexPath = path.join(ROOT, dir, 'index.html');
    if (fs.existsSync(indexPath) && shouldInclude(indexPath)) {
      const loc = `${BASE}/${dir}/`;
      if (!seen.has(loc)) {
        seen.add(loc);
        urls.push({
          loc,
          lastmod: lastmodFor(`${dir}/index.html`, loc),
          priority: '0.8',
        });
      }
    }
  }

  const blogDir = path.join(ROOT, 'blog');
  if (fs.existsSync(blogDir)) {
    for (const f of fs.readdirSync(blogDir).sort()) {
      if (!f.endsWith('.html') || EXCLUDE.has(f)) continue;
      // index.html כבר נוסף ככתובת ספרייה; products.html הוא כפילות של השורש
      if (f === 'index.html' || f === 'products.html') continue;
      if (!shouldInclude(path.join(blogDir, f))) continue;
      add(`blog/${f}`, DEFAULT_BLOG_PRIORITY);
    }
  }

  // דפי landing באנגלית בתוך en/ — index.html כבר נוסף ככתובת ספרייה (/en/) למעלה
  const enDir = path.join(ROOT, 'en');
  if (fs.existsSync(enDir)) {
    for (const f of fs.readdirSync(enDir).sort()) {
      if (!f.endsWith('.html') || EXCLUDE.has(f) || f === 'index.html') continue;
      if (!shouldInclude(path.join(enDir, f))) continue;
      add(`en/${f}`, '0.7');
    }
  }

  return urls;
}

function buildSitemap() {
  const urls = collect();

  const body = urls
    .map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  // בדיקת שפיות לפני כתיבה — עדיף להשאיר מפה ישנה מאשר לכתוב מפה שבורה
  const closingTags = (xml.match(/<\/urlset>/g) || []).length;
  if (closingTags !== 1) throw new Error(`sitemap פגום: ${closingTags} תגי </urlset>`);
  if (urls.length === 0) throw new Error('sitemap ריק — לא נכתב');

  const outPath = path.join(ROOT, 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`[build-sitemap] נכתבו ${urls.length} כתובות ל-sitemap.xml`);
  return urls.length;
}

if (require.main === module) buildSitemap();

module.exports = { buildSitemap };
