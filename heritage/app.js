(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* text size (for older readers) */
  const setSize = size => {
    if (size === 'large') document.documentElement.dataset.size = 'large';
    else delete document.documentElement.dataset.size;
    $$('.ts-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === size)));
  };
  setSize(store.get('sa-size') === 'large' ? 'large' : 'normal');
  $$('.ts-btn').forEach(b => b.addEventListener('click', () => { setSize(b.dataset.size); store.set('sa-size', b.dataset.size); }));

  /* reveal + gold rule, staggered within each section */
  const items = $$('.reveal, .rule');
  $$('section, footer').forEach(sec => { $$('.reveal', sec).forEach((el, i) => el.style.setProperty('--i', Math.min(i % 6, 5))); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('in'));

  /* timeline gold line grows with scroll */
  const tl = $('.timeline');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (tl && !reduce) {
    let ticking = false;
    const upd = () => {
      const r = tl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      tl.style.setProperty('--tl', p.toFixed(3));
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* demo ribbon steps aside while reading down, returns on scroll up or at the ends */
  const ribbon = $('.ribbon');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, nearEnd = y + innerHeight > document.documentElement.scrollHeight - 400;
    if (y > lastY + 4 && y > 300 && !nearEnd) ribbon.classList.add('away');
    if (y < lastY - 4 || nearEnd || y < 300) ribbon.classList.remove('away');
    lastY = y;
  }, { passive: true });

  /* active nav state */
  const navLinks = $$('.mainnav a');
  if ('IntersectionObserver' in window) {
    const secIo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) secIo.observe(s); });
  }

  /* full menu */
  const menu = $('#menu'), menuBtn = $('.menu-btn');
  const openMenu = () => { menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('.menu-close').focus(); };
  const closeMenu = (focusBtn = true) => { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; if (focusBtn) menuBtn.focus(); };
  menuBtn.addEventListener('click', openMenu);
  $('.menu-close').addEventListener('click', () => closeMenu());
  $$('#menu a').forEach(a => a.addEventListener('click', () => closeMenu(false)));

  /* give modal */
  const modal = $('#give');
  let lastFocus = null;
  const openGive = () => {
    lastFocus = document.activeElement;
    if (!menu.hidden) closeMenu(false);
    modal.hidden = false; document.body.style.overflow = 'hidden';
    $('.give-form').hidden = false; $('.give-done').hidden = true;
    setTimeout(() => $('#g-amt').focus(), 30);
  };
  const closeGive = () => { modal.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
  $$('.give-open').forEach(b => b.addEventListener('click', openGive));
  $$('[data-close]', modal).forEach(b => b.addEventListener('click', closeGive));
  const amt = $('#g-amt');
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.toggle('on', x === c));
    amt.value = c.dataset.amt;
  }));
  amt.addEventListener('input', () => {
    amt.value = amt.value.replace(/[^\d.]/g, '');
    $$('.chip').forEach(x => x.classList.toggle('on', x.dataset.amt === amt.value));
  });
  $('.give-form').addEventListener('submit', e => {
    e.preventDefault();
    const v = parseFloat(amt.value);
    if (!(v > 0)) { amt.focus(); amt.style.borderBottomColor = 'var(--burgundy)'; return; }
    amt.style.borderBottomColor = '';
    const freq = $('input[name="freq"]:checked').value;
    const fund = $('#g-fund').value;
    $('.give-sum').textContent = `$${v.toFixed(2).replace(/\.00$/, '')} to the ${fund}, ${freq.toLowerCase()}.`;
    $('.give-form').hidden = true;
    const done = $('.give-done'); done.hidden = false; done.classList.add('show'); done.focus();
  });
  $('.give-again').addEventListener('click', () => { $('.give-done').hidden = true; $('.give-form').hidden = false; amt.focus(); });

  /* Escape + focus trap */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (!modal.hidden) closeGive(); else if (!menu.hidden) closeMenu(); }
    if (e.key === 'Tab') {
      const box = !modal.hidden ? $('.give-dialog') : (!menu.hidden ? menu : null);
      if (!box) return;
      const f = $$('a[href], button, input, select, textarea', box).filter(x => !x.closest('[hidden]') && x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* forms: demo submit with thank-you states */
  const nextSunday = () => {
    const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return d.toISOString().slice(0, 10);
  };
  const dateIn = $('#nf-date');
  if (dateIn) { dateIn.value = nextSunday(); dateIn.min = new Date().toISOString().slice(0, 10); }

  const handle = (form, validate, after) => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = validate(form);
      const err = $('.form-error', form);
      $$('[aria-invalid]', form).forEach(x => x.removeAttribute('aria-invalid'));
      if (bad.length) { bad.forEach(x => x.setAttribute('aria-invalid', 'true')); err.hidden = false; bad[0].focus(); return; }
      err.hidden = true;
      const card = form.parentElement, thanks = $('.thanks', card);
      after(form, thanks);
      form.hidden = true; thanks.hidden = false; thanks.classList.add('show'); thanks.focus();
    });
  };
  handle($('.newform'), f => {
    const bad = [];
    if (!f.name.value.trim()) bad.push(f.name);
    if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) bad.push(f.email);
    return bad;
  }, (f, t) => {
    const first = f.name.value.trim().split(/\s+/)[0];
    $('.thanks-name', t).textContent = first;
    let when = 'Sunday';
    if (f.date.value) {
      const d = new Date(f.date.value + 'T12:00:00');
      when = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    const kids = f.kids.value === 'yes' ? ' Someone from our Kids team will help you check in your children.' : '';
    $('.thanks-msg', t).textContent = `We have you down for the ${f.service.value} service on ${when}. A greeter will look for you at the front doors.${kids}`;
  });
  handle($('.prayform'), f => f.request.value.trim() ? [] : [f.request], () => {});

  /* sermon player placeholder */
  const msg = $('.player-msg');
  $('.play').addEventListener('click', () => { msg.hidden = false; $('.player-close').focus(); });
  $('.player-close').addEventListener('click', () => { msg.hidden = true; $('.play').focus(); });

  /* print bulletin */
  $('.print-btn').addEventListener('click', () => window.print());

  /* add to calendar (.ics) */
  $$('.ics').forEach(b => b.addEventListener('click', () => {
    const [start, end, title, loc] = b.closest('[data-ics]').dataset.ics.split('|');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//St Andrews Demo//EN', 'BEGIN:VEVENT',
      `UID:${start}-${Math.random().toString(36).slice(2)}@standrews.example`,
      `DTSTART;TZID=America/New_York:${start}`, `DTEND;TZID=America/New_York:${end}`,
      `SUMMARY:${title}`, `LOCATION:${loc}, St. Andrew's Fellowship Church, 450 Lakeview Avenue, Winter Park FL`,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    const old = b.textContent; b.textContent = 'Added'; setTimeout(() => (b.textContent = old), 1800);
  }));

  /* countdown to next Sunday 8:30 AM Eastern */
  const cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
  const nyParts = now => {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short', hourCycle: 'h23' });
    const o = {}; f.formatToParts(now).forEach(p => (o[p.type] = p.value));
    return o;
  };
  const target = () => {
    const now = new Date(), p = nyParts(now);
    const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    const offset = wall - Math.floor(now.getTime() / 1000) * 1000;
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    const mins = +p.hour * 60 + +p.minute;
    let add = (7 - dow) % 7;
    if (add === 0 && mins >= 8 * 60 + 30) add = 7;
    const t = Date.UTC(+p.year, +p.month - 1, +p.day + add, 8, 30, 0) - offset;
    const live = dow === 0 && mins >= 8 * 60 + 30 && mins < 14 * 60;
    return { t, live };
  };
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const { t, live } = target();
    let s = Math.max(0, Math.floor((t - Date.now()) / 1000));
    cd.d.textContent = Math.floor(s / 86400); s %= 86400;
    cd.h.textContent = pad(Math.floor(s / 3600)); s %= 3600;
    cd.m.textContent = pad(Math.floor(s / 60));
    cd.s.textContent = pad(s % 60);
    const when = new Date(t).toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' });
    $('#live-when').textContent = live ? 'We are live now. Join the stream on YouTube.' : `${when} at 8:30 AM Eastern`;
  };
  tick(); setInterval(tick, 1000);
})();
