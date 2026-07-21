/* ============================================================================
   Pixel by Keshet — Google Analytics 4
   ----------------------------------------------------------------------------
   This is the ONLY place the measurement ID lives. Every page loads this file,
   so changing the ID here changes it everywhere — do not paste gtag snippets
   into individual pages.

   To activate: create a GA4 property, then replace the empty string below with
   the measurement ID (looks like "G-ABC123XYZ").

   While MEASUREMENT_ID is empty this script does nothing at all — no network
   requests, no cookies. It is safe to ship in that state.

   Both xvision.co.il and dds.xvision.co.il intentionally share one property.
   cookie_domain below keeps the session alive across the subdomain, so a visit
   that starts on the marketing site and continues into the CMS reads as one
   user journey instead of two unrelated sessions with a self-referral.
   ========================================================================== */
(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-FFEM6G123R';

  // Guard against a half-finished setup: accept only a well-formed GA4 id, and
  // reject the XXXX placeholder shape. Note the placeholder test looks for a
  // RUN of X's — a real id may legitimately contain a single X (G-ABC123XYZ),
  // so testing for any 'X' would silently disable valid ids.
  if (!/^G-[A-Z0-9]{6,15}$/.test(MEASUREMENT_ID) || /XXXX/.test(MEASUREMENT_ID)) {
    return;
  }

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    cookie_domain: '.xvision.co.il',
    send_page_view: true
  });
})();
