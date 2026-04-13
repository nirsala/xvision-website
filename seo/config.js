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

  // מילות מפתח יעד
  keywords: [
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
