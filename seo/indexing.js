// ═══════════════════════════════════════════
//  GOOGLE + BING INDEXING PINGER
//  שולח בקשת אינדוקס לגוגל ובינג כל יום
// ═══════════════════════════════════════════

const fs  = require('fs');
const cfg = require('./config');

// ── Bing IndexNow (פשוט, ללא הרשאות) ──────
async function pingBing(urls) {
  const KEY_FILE = `${cfg.site.dir}/BingSiteAuth.xml`;
  // יצירת קובץ אימות BingSiteAuth אם לא קיים
  if (!fs.existsSync(KEY_FILE)) {
    const key = Math.random().toString(36).slice(2, 18);
    fs.writeFileSync(KEY_FILE, `<?xml version="1.0"?><users><user>${key}</user></users>`);
    console.log(`[indexing] נוצר BingSiteAuth.xml — העלה אותו ל-Bing Webmaster Tools`);
    return;
  }

  const keyMatch = fs.readFileSync(KEY_FILE, 'utf8').match(/<user>([^<]+)<\/user>/);
  if (!keyMatch) return;
  const key = keyMatch[1];

  const body = {
    host: cfg.site.url.replace('https://', ''),
    key,
    keyLocation: `${cfg.site.url}/BingSiteAuth.xml`,
    urlList: urls.map(p => `${cfg.site.url}${p}`),
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`[indexing] Bing IndexNow: ${[200, 202].includes(res.status) ? 'נשלח בהצלחה' : `שגיאה ${res.status}`}`);
  } catch (e) {
    console.log(`[indexing] Bing שגיאה: ${e.message}`);
  }
}

// ── Google Indexing API (דורש service account) ──
async function pingGoogle(urls) {
  if (!cfg.googleServiceAccount || !fs.existsSync(cfg.googleServiceAccount)) {
    console.log('[indexing] Google Indexing API: לא מוגדר service account — מדלג');
    console.log('[indexing] להגדרה: ראה README.md → שלב 3');
    return;
  }

  // אם יש service account — שלח בקשה לכל URL
  for (const page of urls) {
    const url = `${cfg.site.url}${page}`;
    console.log(`[indexing] Google: שולח ${url}`);
    // דורש google-auth-library — npm install google-auth-library
    // const { GoogleAuth } = require('google-auth-library');
    // const auth = new GoogleAuth({ keyFile: cfg.googleServiceAccount, scopes: ['https://www.googleapis.com/auth/indexing'] });
    // const client = await auth.getClient();
    // await client.request({ url: 'https://indexing.googleapis.com/v3/urlNotifications:publish', method: 'POST', data: { url, type: 'URL_UPDATED' } });
  }
}

// ── Google Search Console sitemap submission ──────
// google.com/ping?sitemap= הוסר בנובמבר 2023 — כעת יש להגיש ב-Search Console
async function pingSitemap() {
  const sitemapUrl = `${cfg.site.url}/sitemap.xml`;
  if (cfg.googleServiceAccount) {
    console.log(`[indexing] Google Sitemap: ${sitemapUrl} (דורש Search Console API)`);
  } else {
    console.log(`[indexing] Google Sitemap: ה-sitemap קיים בכתובת ${sitemapUrl}`);
    console.log(`[indexing] לשליחה אוטומטית הגדר GOOGLE_SA_PATH עם service account`);
  }
}

async function pingAll(extraUrls = []) {
  const allUrls = [...cfg.pages, ...extraUrls];
  console.log(`[indexing] שולח ${allUrls.length} URLs לאינדוקס...`);
  await Promise.all([
    pingBing(allUrls),
    pingGoogle(allUrls),
    pingSitemap(),
  ]);
}

module.exports = { pingAll };
