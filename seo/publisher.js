// ═══════════════════════════════════════════
//  AUTO PUBLISHER — git commit + push
//  מפרסם שינויים ל-GitHub Pages אוטומטית
// ═══════════════════════════════════════════

const { execSync } = require('child_process');
const cfg = require('./config');
const { buildSitemap } = require('./build-sitemap');

function run(cmd) {
  return execSync(cmd, { cwd: cfg.site.dir, encoding: 'utf8' }).trim();
}

/** מריץ פקודה ומחזיר הצלחה/כישלון לפי קוד היציאה, בלי לזרוק. */
function tryRun(cmd) {
  try {
    run(cmd);
    return true;
  } catch {
    return false;
  }
}

const MAX_ATTEMPTS = 5;

function publish(message = 'seo: daily content update') {
  try {
    // ה-sitemap הוא תוצר שנבנה מהקבצים, לא קובץ שעורכים או ממזגים.
    buildSitemap();

    if (!run('git status --porcelain')) {
      console.log('[publisher] אין שינויים לפרסום');
      return false;
    }

    run('git add -A');
    run(`git commit -m "${message.replace(/"/g, "'")}"`);

    // משימות אחרות דוחפות לאותו repo במקביל. ההצלחה נקבעת לפי קוד היציאה
    // של git push בלבד — בדיקת מחרוזת בפלט מדווחת הצלחה גם על push שנכשל,
    // ואז מאמר שלם נעלם בלי שאיש ישים לב.
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (tryRun('git push origin main')) {
        console.log('[publisher] פורסם ל-GitHub Pages בהצלחה');
        return true;
      }

      console.log(`[publisher] push נכשל (ניסיון ${attempt}/${MAX_ATTEMPTS}) — מושך ומנסה שוב`);

      if (tryRun('git pull --no-edit --no-rebase origin main')) {
        // המיזוג הצליח, אך ייתכן שהביא דפים חדשים ממשימה אחרת.
        buildSitemap();
      } else {
        // קונפליקט מיזוג. sitemap.xml הוא תוצר — פותרים בבנייה מחדש.
        tryRun('git checkout --ours sitemap.xml');
        buildSitemap();
        tryRun('git add -A');
        if (!tryRun('git commit --no-edit')) {
          console.error('[publisher] קונפליקט מיזוג שלא ניתן לפתרון אוטומטי');
          return false;
        }
      }

      if (run('git status --porcelain')) {
        tryRun('git add -A');
        tryRun('git commit -m "seo: rebuild sitemap after merge"');
      }
    }

    console.error(`[publisher] הפרסום נכשל אחרי ${MAX_ATTEMPTS} ניסיונות — הקומיט נשאר מקומי`);
    return false;
  } catch (e) {
    console.error('[publisher] שגיאה בפרסום:', e.message);
    return false;
  }
}

module.exports = { publish };
