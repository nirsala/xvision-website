// ═══════════════════════════════════════════
//  SEO DAILY SYSTEM — CONFIGURATION
// ═══════════════════════════════════════════

module.exports = {
  site: {
    name: 'Pixel by Keshet',
    url: 'https://xvision.co.il',
    dir: '/Users/nirsala/xvision-website',
    language: 'he',
    location: 'פתח תקווה, ישראל',
  },

  // מילות מפתח יעד (עודכן עם ניתוח מתחרים)
  keywords: [
    // ── קיימות ──
    'מסכי LED לעסקים',
    'שילוט דיגיטלי',
    'מסכי LED פנימיים',
    'מסכי LED חיצוניים',
    'מסכי LED לחנויות',
    'שילוט דיגיטלי למסעדות',
    'מסכי LED לובי',
    'ניהול תוכן מסכים',
    'התקנת מסכי LED',
    'pixel led ישראל',
    // ── חדשות ממתחרים ──
    'מסכי LED לאולמות אירועים',
    'מסכי LED לקניונים',
    'מסכי LED לאצטדיונים',
    'מסכי LED לתיאטרון והיכלי תרבות',
    'מסכי LED לבתים פרטיים',
    'רצפת LED וידאו',
    'מסכי LED גמישים',
    'מסכי LED שקופים',
    'שילוט דיגיטלי לפרסום חיצוני',
    'מסכי LED לגני אירועים',
    'מסכי ענק בהתאמה אישית',
    'שילוט דיגיטלי לחדרי כושר',
    'מסכי LED לחברות ומשרדים',
  ],

  // דפי האתר לאינדוקס יומי
  pages: [
    '/',
    '/products.html',
    '/cms.html',
    '/pool.html',
  ],

  // שליחת דוח יומי במייל
  email: {
    enabled: false,          // שנה ל-true אחרי הגדרת SMTP
    to: 'your@email.com',   // ← שנה לכתובת שלך
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',           // ← Gmail שלך
    smtpPass: '',           // ← App Password של Gmail
  },

  // Claude API לייצור תוכן
  claudeApiKey: process.env.ANTHROPIC_API_KEY || '',

  // Google Indexing API (service account JSON path)
  googleServiceAccount: process.env.GOOGLE_SA_PATH || '',
};
