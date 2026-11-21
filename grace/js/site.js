(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header state + active nav */
  var head = $('.site-head');
  var onScroll = function () { head.classList.toggle('scrolled', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var navLinks = $$('.main-nav a');
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['visit', 'watch', 'ministries', 'events', 'give', 'prayer', 'staff', 'location'].forEach(function (id) { var el = document.getElementById(id); if (el) secIO.observe(el); });
  }

  /* menu */
  var menuBtn = $('.menu-btn'), menu = $('#menu');
  var setMenu = function (open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (open) { var first = $('a', menu); if (first) first.focus({ preventScroll: true }); }
  };
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  document.addEventListener('click', function (e) { if (!menu.hidden && !e.target.closest('.site-head')) setMenu(false); });

  /* soft clip reveal */
  var reveals = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ministries connector line sits at the oval middle */
  var minRow = $('.min-row');
  var placeLine = function () { var o = $('.oval', minRow); if (o) minRow.style.setProperty('--oval-h', o.offsetHeight + 'px'); };
  placeLine();
  window.addEventListener('resize', placeLine);

  /* time in Orlando */
  var TZ = 'America/New_York';
  var fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23', weekday: 'short' });
  var DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var orlandoNow = function () {
    var p = {};
    fmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second, dow: DOW[p.weekday] };
  };

  /* next-Sunday dates for the visit form */
  var dateSel = $('#visit-date');
  (function fillDates() {
    var n = orlandoNow();
    var ahead = (7 - n.dow) % 7;
    if (ahead === 0 && n.h >= 11) ahead = 7;
    var opts = { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' };
    for (var i = 0; i < 4; i++) {
      var dt = new Date(Date.UTC(n.y, n.mo - 1, n.d + ahead + i * 7));
      var o = document.createElement('option');
      o.value = dt.toISOString().slice(0, 10);
      o.textContent = (i === 0 ? 'This Sunday, ' : '') + dt.toLocaleDateString('en-US', opts);
      dateSel.appendChild(o);
    }
  })();

  /* live stream countdown to the next 9:00 AM Sunday service */
  var live = $('.live'), units = {};
  $$('#count [data-u]').forEach(function (b) { units[b.dataset.u] = b; });
  var pad = function (v) { return (v < 10 ? '0' : '') + v; };
  var tickCount = function () {
    var n = orlandoNow();
    var nowMs = Date.UTC(n.y, n.mo - 1, n.d, n.h, n.mi, n.s);
    var mins = n.h * 60 + n.mi;
    if (n.dow === 0 && mins >= 540 && mins < 735) {
      live.classList.add('on');
      $('.live-label', live).textContent = 'We are live right now';
      $('#count').hidden = true;
      return;
    }
    live.classList.remove('on');
    $('#count').hidden = false;
    $('.live-label', live).textContent = 'Next live stream in';
    var ahead = (7 - n.dow) % 7;
    if (ahead === 0 && mins >= 540) ahead = 7;
    var target = Date.UTC(n.y, n.mo - 1, n.d + ahead, 9, 0, 0);
    var diff = Math.max(0, Math.floor((target - nowMs) / 1000));
    units.d.textContent = Math.floor(diff / 86400);
    units.h.textContent = pad(Math.floor(diff % 86400 / 3600));
    units.m.textContent = pad(Math.floor(diff % 3600 / 60));
    units.s.textContent = pad(diff % 60);
  };
  tickCount();
  setInterval(tickCount, 1000);

  /* demo sermon player */
  var player = $('#player'), timer = null, t = 0, LEN = 38 * 60 + 12;
  var fill = $('.bar-fill', player), tEl = $('[data-t]', player);
  var draw = function () { fill.style.width = (t / LEN * 100) + '%'; tEl.textContent = Math.floor(t / 60) + ':' + pad(Math.floor(t % 60)); };
  var run = function () { clearInterval(timer); player.classList.remove('paused'); timer = setInterval(function () { t = Math.min(LEN, t + 1); draw(); }, 1000); };
  var pause = function () { clearInterval(timer); player.classList.add('paused'); };
  $('.poster', player).addEventListener('click', function () {
    if (!player.classList.contains('on')) { player.classList.add('on'); run(); return; }
    if (player.classList.contains('paused')) run(); else pause();
  });
  $('[data-toggle]', player).addEventListener('click', function () { if (player.classList.contains('paused')) run(); else pause(); });

  /* forms */
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
  var swap = function (card, show) {
    var form = $('form', card), ty = $('.thanks', card);
    form.hidden = show; ty.hidden = !show;
    if (show) ty.focus({ preventScroll: true });
  };
  $$('.form-card').forEach(function (card) {
    var reset = $('[data-reset]', card);
    if (reset) reset.addEventListener('click', function () { swap(card, false); var f = $('input, textarea', card); if (f) f.focus(); });
  });

  var newForm = $('.newform');
  newForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = newForm.elements.name.value.trim(), email = newForm.elements.email.value.trim();
    var err = $('.form-err', newForm);
    newForm.elements.name.closest('.field').classList.toggle('bad', !name);
    newForm.elements.email.closest('.field').classList.toggle('bad', !emailOk(email));
    if (!name || !emailOk(email)) { err.hidden = false; return; }
    err.hidden = true;
    var card = newForm.closest('.form-card');
    var first = name.split(/\s+/)[0];
    var dateTxt = dateSel.options[dateSel.selectedIndex].textContent.replace('This Sunday, ', '');
    var kids = newForm.elements.kids.value === 'yes';
    $('[data-name]', card).textContent = first;
    $('[data-msg]', card).textContent = 'We have you down for ' + dateTxt + ' at ' + newForm.elements.service.value + '. Look for Linh at the welcome table by the front doors' + (kids ? '. She will walk you and your kids straight to check-in.' : '. She will save you a seat and grab you a coffee.') + ' A short confirmation is on its way to ' + email + '.';
    swap(card, true);
  });

  var prayForm = $('.prayform');
  prayForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var req = prayForm.elements.req.value.trim(), err = $('.form-err', prayForm);
    prayForm.elements.req.closest('.field').classList.toggle('bad', !req);
    if (!req) { err.hidden = false; return; }
    err.hidden = true;
    var card = prayForm.closest('.form-card');
    swap(card, true);
    prayForm.reset();
  });

  /* Tithely-style giving modal */
  var modal = $('#give-modal'), gForm = $('.gm-form', modal), gThanks = $('.gm-thanks', modal);
  var amt = $('#gm-amt'), chips = $$('.gm-chips button', modal);
  var money = function (v) { return '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var value = function () { var v = parseFloat(String(amt.value).replace(/[^0-9.]/g, '')); return isFinite(v) ? v : 0; };
  var update = function () {
    var v = value();
    amt.style.width = (Math.max(2, String(amt.value).length) + 0.8) + "ch";
    var fee = gForm.elements.cover.checked && v > 0 ? Math.round((v * 0.029 + 0.3) * 100) / 100 : 0;
    $('[data-fee]', modal).textContent = money(v > 0 ? Math.round((v * 0.029 + 0.3) * 100) / 100 : 0);
    var f = gForm.elements.freq.value;
    $('[data-total]', modal).textContent = money(v + fee) + (f === 'weekly' ? ' weekly' : f === 'monthly' ? ' monthly' : '');
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(+c.dataset.amt === v)); });
  };
  chips.forEach(function (c) { c.addEventListener('click', function () { amt.value = c.dataset.amt; update(); }); });
  amt.addEventListener('input', update);
  gForm.addEventListener('change', update);
  var openGive = function () {
    gForm.hidden = false; gThanks.hidden = true; $('.form-err', gForm).hidden = true;
    update();
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  };
  $$('[data-give]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); setMenu(false); openGive(); }); });
  $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', function () { modal.close ? modal.close() : modal.removeAttribute('open'); }); });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
  gForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = value();
    if (v < 1) { $('.form-err', gForm).hidden = false; amt.focus(); return; }
    var f = gForm.elements.freq.value, fund = gForm.elements.fund.value;
    $('[data-msg]', gThanks).textContent = $('[data-total]', modal).textContent.replace(/ (weekly|monthly)$/, '') + (f === 'once' ? ' one time' : ' ' + f) + ' to ' + (fund === 'Missions' ? '' : 'the ') + fund + '.';
    gForm.hidden = true; gThanks.hidden = false; gThanks.focus();
  });
})();
