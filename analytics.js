/* ============================================================================
   Pixel by Keshet — Google Analytics 4 + הסכמה לעוגיות (Consent Mode v2)
   ----------------------------------------------------------------------------
   זה המקום היחיד שבו מוגדר מזהה המדידה ונטען gtag. אין להדביק קטעי gtag בדפים.
   משותף ל-xvision.co.il ול-dds.xvision.co.il (אותו נכס GA4).

   ברירת המחדל: כל סוגי האחסון "denied". רק לחיצה על "אני מסכים/ה" מעדכנת את
   analytics_storage ל-granted. "דחה" משאיר denied. הבחירה נשמרת ב-localStorage
   (pixel_cookie_consent = accepted / declined) ומוחלת בביקור חוזר.
   הבאנר נבנה מכאן בכל דף שעוד לא נבחר בו; "הגדרות עוגיות" בכותרת התחתונה
   (או כל קישור ל-#cookie-settings) פותח אותו מחדש.
   פיקסלים שיווקיים (אם יתווספו): לטעון רק בתוך onGranted למטה.
   ========================================================================== */
(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-FFEM6G123R';
  var KEY = 'pixel_cookie_consent';
  var PRIVACY_URL = '/מדיניות-פרטיות.html';

  function readChoice() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function saveChoice(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) { /* פרטי/חסום — הבחירה תחול רק בדף הזה */ }
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  // 1) ברירת מחדל — לפני טעינת gtag
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  var granted = false;
  function onGranted() {
    if (granted) return;
    granted = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    // מקום לפיקסלים שיווקיים עתידיים — רק כאן, אחרי הסכמה.
  }
  if (readChoice() === 'accepted') onGranted();

  var validId = /^G-[A-Z0-9]{6,15}$/.test(MEASUREMENT_ID) && !/XXXX/.test(MEASUREMENT_ID);
  if (validId) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID, { cookie_domain: '.xvision.co.il', send_page_view: true });

    // אירועי המרה: וואטסאפ וטלפון
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me"], a[href^="tel:"]') : null;
      if (!a) return;
      gtag('event', a.href.indexOf('wa.me') > -1 ? 'whatsapp_click' : 'phone_click', {
        link_url: a.href,
        page_path: location.pathname
      });
    }, true);
  }

  // 2) באנר
  var CSS =
    '#pk-consent{position:fixed;inset-inline:16px;bottom:16px;z-index:2147483000;max-width:640px;margin:0 auto;' +
    'background:#14161c;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:16px 18px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.35);font:15px/1.6 Heebo,Assistant,Arial,sans-serif;direction:rtl;text-align:right}' +
    '#pk-consent[hidden]{display:none}' +
    '#pk-consent p{margin:0 0 12px}' +
    '#pk-consent a{color:#ff6b86;text-decoration:underline}' +
    '#pk-consent .pk-btns{display:flex;gap:10px}' +
    '#pk-consent button{flex:1 1 0;min-height:44px;border-radius:10px;font-weight:600;font-size:15px;font-family:inherit;cursor:pointer;' +
    'background:#fff;color:#14161c;border:2px solid #fff}' +
    '#pk-consent button:focus-visible{outline:3px solid #ff6b86;outline-offset:2px}' +
    '.pk-cookie-settings{display:inline-block;margin:8px 0;color:inherit;text-decoration:underline;cursor:pointer;font-size:.9em}';

  var banner = null;
  function closeBanner() { if (banner) banner.hidden = true; }
  function openBanner() {
    if (!banner) build();
    if (!banner) return;
    banner.hidden = false;
    var b = banner.querySelector('button');
    if (b) b.focus();
  }
  function build() {
    if (!document.body) return;
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    banner = document.createElement('div');
    banner.id = 'pk-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'הסכמה לשימוש בעוגיות');
    banner.hidden = true;
    banner.innerHTML =
      '<p>אנחנו משתמשים בעוגיות הכרחיות, ובאישורך גם בעוגיות למדידת תנועה. ' +
      '<a href="' + PRIVACY_URL + '">מדיניות פרטיות</a></p>' +
      '<div class="pk-btns">' +
      '<button type="button" data-c="accepted">אני מסכים/ה</button>' +
      '<button type="button" data-c="declined">דחה</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute ? e.target.getAttribute('data-c') : null;
      if (!v) return;
      saveChoice(v);
      if (v === 'accepted') onGranted();
      else if (granted) {
        granted = false;
        gtag('consent', 'update', { analytics_storage: 'denied' });
      }
      closeBanner();
    });
    banner.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBanner(); });
    document.body.appendChild(banner);
  }
  function addFooterLink() {
    var foots = document.getElementsByTagName('footer');
    if (!foots.length || document.querySelector('.pk-cookie-settings')) return;
    var a = document.createElement('a');
    a.href = '#cookie-settings';
    a.className = 'pk-cookie-settings';
    a.textContent = 'הגדרות עוגיות';
    var wrap = document.createElement('p');
    wrap.style.margin = '0';
    wrap.appendChild(a);
    foots[foots.length - 1].appendChild(wrap);
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href="#cookie-settings"]') : null;
    if (!a) return;
    e.preventDefault();
    openBanner();
  });
  window.pixelCookieSettings = openBanner;

  function init() {
    build();
    addFooterLink();
    var c = readChoice();
    if (c !== 'accepted' && c !== 'declined') banner && (banner.hidden = false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
