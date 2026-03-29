// ═══════════════════════════════════════════
//  AUTO PUBLISHER — git commit + push
//  מפרסם שינויים ל-GitHub Pages אוטומטית
// ═══════════════════════════════════════════

const { execSync } = require('child_process');
const cfg = require('./config');

function run(cmd) {
  return execSync(cmd, { cwd: cfg.site.dir, encoding: 'utf8' }).trim();
}

function publish(message = 'seo: daily content update') {
  try {
    const status = run('git status --porcelain');
    if (!status) {
      console.log('[publisher] אין שינויים לפרסום');
      return false;
    }

    run('git add -A');
    run(`git commit -m "${message}"`);
    run('git push origin main');

    console.log('[publisher] פורסם ל-GitHub Pages בהצלחה');
    return true;
  } catch (e) {
    console.error('[publisher] שגיאה בפרסום:', e.message);
    return false;
  }
}

module.exports = { publish };
