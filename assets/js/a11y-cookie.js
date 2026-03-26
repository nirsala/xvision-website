// ══════════════════════════════════════════
// COOKIE CONSENT
// ══════════════════════════════════════════
(function(){
  var banner = document.getElementById('cookie-banner');
  var accept = document.getElementById('cookie-accept');
  var decline = document.getElementById('cookie-decline');
  if(!banner) return;
  if(!localStorage.getItem('pixel_cookie_consent')){
    setTimeout(function(){ banner.classList.add('show'); }, 800);
  }
  accept.addEventListener('click', function(){
    localStorage.setItem('pixel_cookie_consent','accepted');
    banner.classList.remove('show');
    setTimeout(function(){ banner.style.display='none'; }, 400);
  });
  decline.addEventListener('click', function(){
    localStorage.setItem('pixel_cookie_consent','declined');
    banner.classList.remove('show');
    setTimeout(function(){ banner.style.display='none'; }, 400);
  });
})();

// ══════════════════════════════════════════
// ACCESSIBILITY WIDGET
// ══════════════════════════════════════════
(function(){
  var toggle  = document.getElementById('a11y-toggle');
  var panel   = document.getElementById('a11y-panel');
  var body    = document.body;
  if(!toggle || !panel) return;

  var fontSize = parseInt(localStorage.getItem('a11y_font') || '0');
  var saved    = JSON.parse(localStorage.getItem('a11y_state') || '{}');

  // Restore saved state
  if(saved.contrast) body.classList.add('a11y-high-contrast');
  if(saved.gray)     body.classList.add('a11y-grayscale');
  if(saved.links)    body.classList.add('a11y-highlight-links');
  if(saved.anim)     body.classList.add('a11y-no-anim');
  if(fontSize)       body.style.fontSize = (16 + fontSize * 2) + 'px';

  function updateBtn(id, active){
    var btn = document.getElementById(id);
    if(!btn) return;
    btn.setAttribute('aria-pressed', active);
    btn.classList.toggle('active', active);
    btn.textContent = active ? 'כבה' : 'הפעל';
  }
  updateBtn('a11y-contrast', !!saved.contrast);
  updateBtn('a11y-gray',     !!saved.gray);
  updateBtn('a11y-links',    !!saved.links);
  updateBtn('a11y-anim',     !!saved.anim);

  function saveState(){
    localStorage.setItem('a11y_state', JSON.stringify({
      contrast: body.classList.contains('a11y-high-contrast'),
      gray:     body.classList.contains('a11y-grayscale'),
      links:    body.classList.contains('a11y-highlight-links'),
      anim:     body.classList.contains('a11y-no-anim'),
    }));
  }

  // Toggle panel open/close
  toggle.addEventListener('click', function(){
    var open = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    if(open){ var firstBtn = panel.querySelector('button'); if(firstBtn) firstBtn.focus(); }
  });

  // Close on outside click
  document.addEventListener('click', function(e){
    var widget = document.getElementById('a11y-widget');
    if(widget && !widget.contains(e.target)){
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && panel.classList.contains('open')){
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.focus();
    }
  });

  // Font size
  var fontInc = document.getElementById('a11y-font-inc');
  var fontDec = document.getElementById('a11y-font-dec');
  if(fontInc) fontInc.addEventListener('click', function(){
    if(fontSize < 4) fontSize++;
    body.style.fontSize = (16 + fontSize * 2) + 'px';
    localStorage.setItem('a11y_font', fontSize);
  });
  if(fontDec) fontDec.addEventListener('click', function(){
    if(fontSize > -2) fontSize--;
    body.style.fontSize = (16 + fontSize * 2) + 'px';
    localStorage.setItem('a11y_font', fontSize);
  });

  // Toggle class helper
  function makeToggle(btnId, cls){
    var btn = document.getElementById(btnId);
    if(!btn) return;
    btn.addEventListener('click', function(){
      var active = body.classList.toggle(cls);
      this.setAttribute('aria-pressed', active);
      this.classList.toggle('active', active);
      this.textContent = active ? 'כבה' : 'הפעל';
      saveState();
    });
  }
  makeToggle('a11y-contrast', 'a11y-high-contrast');
  makeToggle('a11y-gray',     'a11y-grayscale');
  makeToggle('a11y-links',    'a11y-highlight-links');
  makeToggle('a11y-anim',     'a11y-no-anim');

  // Reset all
  var resetBtn = document.getElementById('a11y-reset');
  if(resetBtn) resetBtn.addEventListener('click', function(){
    body.classList.remove('a11y-high-contrast','a11y-grayscale','a11y-highlight-links','a11y-no-anim');
    body.style.fontSize = '';
    fontSize = 0;
    localStorage.removeItem('a11y_state');
    localStorage.removeItem('a11y_font');
    updateBtn('a11y-contrast', false);
    updateBtn('a11y-gray',     false);
    updateBtn('a11y-links',    false);
    updateBtn('a11y-anim',     false);
  });
})();
