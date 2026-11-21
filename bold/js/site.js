(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const CAMPUS = {
    orlando: {
      name: 'Orlando campus',
      times: '9:00 · 10:30 · 12:00',
      address: '1800 N Mills Ave, Orlando, FL 32803',
      parking: 'Guest spots are in the front row off Mills Ave. Turn on your hazards and a parking volunteer will wave you in.',
      schedule: [['Sunday', '9:00 AM · 10:30 AM · 12:00 PM'], ['Students', 'Wednesday 7:00 PM'], ['Kids', 'Every Sunday service'], ['Prayer room', 'Sundays 8:30 AM']],
      slots: ['9:00 AM', '10:30 AM', '12:00 PM'],
      lastEnd: [13, 15],
      map: 'img/map-orlando.webp',
      mapAlt: 'Map of the Orlando campus area near Mills 50',
      dir: 'https://www.google.com/maps/search/?api=1&query=28.5530,-81.3650'
    },
    nona: {
      name: 'Lake Nona campus',
      times: '10:00 AM',
      address: '6900 Tavistock Lakes Blvd, Orlando, FL 32827',
      parking: 'Park on level 1 of the Town Center garage. Our team waits at the elevator with coffee and directions.',
      schedule: [['Sunday', '10:00 AM'], ['Students', 'Wed 7:00 PM at Orlando'], ['Kids', 'Every Sunday service'], ['Prayer room', 'Sundays 9:30 AM']],
      slots: ['10:00 AM'],
      lastEnd: [11, 15],
      map: 'img/map-nona.webp',
      mapAlt: 'Map of the Lake Nona campus area',
      dir: 'https://www.google.com/maps/search/?api=1&query=28.3925,-81.2470'
    }
  };
  let campus = 'orlando';

  function setCampus(c, animate = true) {
    campus = c; const d = CAMPUS[c];
    $$('.campus-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.campus === c)));
    $$('[data-c]').forEach(el => {
      const k = el.dataset.c;
      if (k === 'schedule') el.innerHTML = d.schedule.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
      else el.textContent = d[k];
      if (animate && !reduce) { el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip'); }
    });
    const img = $('#mapImg');
    if (img && !img.src.endsWith(d.map)) {
      img.classList.add('fade');
      setTimeout(() => { img.src = d.map; img.alt = d.mapAlt; img.onload = () => img.classList.remove('fade'); }, reduce ? 0 : 200);
    }
    $('#dirLink').href = d.dir;
    const sel = $('#nfCampus'); if (sel && sel.value !== c) sel.value = c;
    fillVisitOptions();
  }
  document.addEventListener('click', e => { const b = e.target.closest('.campus-switch button'); if (b) setCampus(b.dataset.campus); });

  function nyNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { y: +p.year, m: +p.month, d: +p.day, H: +p.hour % 24, M: +p.minute, S: +p.second, wd };
  }
  function nextStream() {
    const n = nyNow(); const now = Date.UTC(n.y, n.m - 1, n.d, n.H, n.M, n.S);
    if (n.wd === 0) {
      const start = Date.UTC(n.y, n.m - 1, n.d, 9, 0, 0), end = Date.UTC(n.y, n.m - 1, n.d, 13, 15, 0);
      if (now >= start && now < end) return { live: true };
      if (now < start) return { ms: start - now };
    }
    const delta = (7 - n.wd) % 7 || 7;
    return { ms: Date.UTC(n.y, n.m - 1, n.d + delta, 9, 0, 0) - now };
  }
  const pad = v => String(v).padStart(2, '0');
  function tick() {
    const r = nextStream(), chip = $('#liveChip'), cd = $('.cd');
    if (r.live) {
      chip.classList.add('on'); chip.querySelector('.live-lbl').textContent = 'Live now'; $('#liveT').textContent = 'Watch';
      cd.classList.add('live-now'); $('#cdLabel').textContent = 'We are live right now from Orlando';
      return;
    }
    chip.classList.remove('on'); cd.classList.remove('live-now');
    const t = Math.max(0, Math.floor(r.ms / 1000)), D = Math.floor(t / 86400), H = Math.floor(t % 86400 / 3600), M = Math.floor(t % 3600 / 60), S = t % 60;
    chip.querySelector('.live-lbl').textContent = 'Live in';
    $('#liveT').textContent = D > 0 ? `${D}d ${pad(H)}:${pad(M)}:${pad(S)}` : `${pad(H)}:${pad(M)}:${pad(S)}`;
    const box = { d: D, h: pad(H), m: pad(M), s: pad(S) };
    $$('#cdBoxes b').forEach(b => { const v = String(box[b.dataset.u]); if (b.textContent !== v) b.textContent = v; });
      }
  tick(); setInterval(tick, 1000);

  function upcomingSundays(count) {
    const n = nyNow(), out = [];
    const end = CAMPUS[campus].lastEnd; const nowMin = n.H * 60 + n.M;
    let start = (7 - n.wd) % 7; if (start === 0 && nowMin >= end[0] * 60 + end[1]) start = 7;
    for (let i = 0; i < count; i++) {
      const dt = new Date(Date.UTC(n.y, n.m - 1, n.d + start + i * 7, 12));
      out.push({ v: dt.toISOString().slice(0, 10), l: dt.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }) + (start + i * 7 === 0 ? ' (today)' : '') });
    }
    return out;
  }
  function fillVisitOptions() {
    const ds = $('#nfDate'), ts = $('#nfTime'); if (!ds) return;
    const keepD = ds.value, keepT = ts.value;
    ds.innerHTML = upcomingSundays(4).map(o => `<option value="${o.v}">${o.l}</option>`).join('');
    if ([...ds.options].some(o => o.value === keepD)) ds.value = keepD;
    ts.innerHTML = CAMPUS[campus].slots.map(s => `<option>${s}</option>`).join('');
    if ([...ts.options].some(o => o.value === keepT)) ts.value = keepT;
  }
  $('#nfCampus').addEventListener('change', e => setCampus(e.target.value));

  const top = $('#top');
  const onScroll = () => top.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { menu.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('open'))); top.classList.add('solid'); }
    else { menu.classList.remove('open'); menu.hidden = true; onScroll(); }
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a, [data-give]')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });

  const vid = $('#heroVid'), vt = $('#vidToggle');
  function setVid(paused) { vt.setAttribute('aria-pressed', String(paused)); vt.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video'); paused ? vid.pause() : vid.play().catch(() => {}); }
  const saveData = navigator.connection && navigator.connection.saveData;
  let userPaused = reduce || !!saveData;
  if (userPaused) setVid(true);
  const loadVid = () => { if (vid.src) return; vid.src = vid.dataset.src; if (!userPaused) vid.play().catch(() => {}); };
  if (!userPaused) { if (document.readyState === 'complete') setTimeout(loadVid, 200); else addEventListener('load', () => setTimeout(loadVid, 200)); }
  vt.addEventListener('click', () => { userPaused = vt.getAttribute('aria-pressed') !== 'true'; if (!userPaused) loadVid(); setVid(userPaused); });
  new IntersectionObserver(es => es.forEach(e => $('#ribbon').classList.toggle('away', e.isIntersecting)), { threshold: .35 }).observe($('.hero'));
  new IntersectionObserver(es => es.forEach(e => { if (userPaused || !vid.src) return; e.isIntersecting ? vid.play().catch(() => {}) : vid.pause(); }), { threshold: .05 }).observe($('.hero'));

  const heroEls = $$('.hero .kin, .hero .kin-up');
  const heroIn = () => heroEls.forEach(el => el.classList.add('in'));
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 700))]).then(() => requestAnimationFrame(heroIn)); else heroIn();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .25, rootMargin: '0px 0px -8% 0px' });
  $$('.kin, .kin-up').filter(el => !el.closest('.hero')).forEach(el => io.observe(el));

  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count; if (reduce) return;
    const t0 = performance.now(), dur = 1300;
    (function f(t) { const p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 4))); el.textContent = v.toLocaleString('en-US'); if (p < 1) requestAnimationFrame(f); })(t0);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => { if (!reduce) el.textContent = '0'; cio.observe(el); });

  const navLinks = $$('.links a');
  const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navLinks.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id))); }), { rootMargin: '-45% 0px -50% 0px' });
  ['visit', 'watch', 'ministries', 'events', 'about'].forEach(id => sio.observe(document.getElementById(id)));

  const V = [
    { t: "A Kingdom That Can't Be Moved", s: 'Unshaken · Wk 3', k: 'Unshaken', spk: 'Marcus Reed', date: 'Nov 15, 2026 · Orlando campus', dur: '41:12', img: 'img/sermon.webp', pos: '50% 20%' },
    { t: 'Run With Endurance', s: 'Unshaken · Wk 2', k: 'Unshaken', spk: 'Marcus Reed', date: 'Nov 8, 2026 · Orlando campus', dur: '38:47', img: 'img/ev-worship.webp', pos: '50% 50%' },
    { t: 'Eyes Up', s: 'Unshaken · Wk 1', k: 'Unshaken', spk: 'Dev Raman', date: 'Nov 1, 2026 · Lake Nona campus', dur: '36:05', img: 'img/band.webp', pos: '60% 50%' },
    { t: 'Neighbors, Not Projects', s: 'Ordinary Saints · Wk 4', k: 'Ordinary Saints', spk: 'Sara Haddad', date: 'Oct 25, 2026 · Orlando campus', dur: '34:20', img: 'img/groups.webp', pos: '50% 50%' },
    { t: 'Faithful in the Small', s: 'Ordinary Saints · Wk 3', k: 'Ordinary Saints', spk: 'Marcus Reed', date: 'Oct 18, 2026 · Orlando campus', dur: '40:02', img: 'img/ev-serve.webp', pos: '50% 40%' },
    { t: 'Who Told You That?', s: 'Students · Wednesday', k: 'Students', spk: 'Jordan Okafor', date: 'Oct 14, 2026 · Orlando campus', dur: '27:31', img: 'img/students.webp', pos: '50% 40%' }
  ];
  let cur = 0, playing = false;
  function noise(c) { const x = c.getContext('2d'), d = x.createImageData(c.width, c.height); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); }
  function runNoise(c, ms) { const t0 = performance.now(); (function f() { noise(c); if (performance.now() - t0 < ms) requestAnimationFrame(f); })(); }
  function renderList() {
    $('#upnext').innerHTML = `<p class="un-k">Recent messages</p>` + V.map((v, i) => `<button class="item" data-i="${i}" aria-current="${i === cur}"><span class="th"><img src="${v.img}" alt="" loading="lazy" style="object-position:${v.pos}"><em>${v.k}</em><span class="d">${v.dur}</span><span class="np">NOW PLAYING</span></span><span><span class="t">${v.t}</span><span class="m">${v.s} · ${v.spk}</span></span></button>`).join('');
  }
  function info(i) {
    const v = V[i];
    $('#vTitle').textContent = v.t; $('#vSpk').textContent = v.spk; $('#vDate').textContent = v.date;
    $('#poSeries').textContent = v.s.toUpperCase(); $('#poTitle').textContent = v.t; $('#poDur').textContent = v.dur;
    const pi = $('#poster img'); pi.src = v.img; pi.style.objectPosition = v.pos;
    $('#amb').style.backgroundImage = `url(${v.img})`;
    $$('.item').forEach(b => b.setAttribute('aria-current', String(+b.dataset.i === i)));
  }
  function flash(label) {
    if (reduce) return;
    const st = $('#pst'); st.classList.remove('go'); void st.offsetWidth; noise(st); st.classList.add('go'); runNoise(st, 320);
    const osd = $('#osd'); osd.textContent = label; osd.classList.add('show'); clearTimeout(flash.t); flash.t = setTimeout(() => osd.classList.remove('show'), 1700);
  }
  function play(i) {
    cur = i; info(i);
    flash(`CH ${pad(i + 1)} ▶`);
    const pv = $('#pv');
    if (!pv.src) pv.src = 'video/hero.mp4';
    pv.hidden = false; $('#poster').hidden = true; playing = true;
    pv.play().catch(() => {});
    const note = $('#demoNote'); note.hidden = false; clearTimeout(play.t); play.t = setTimeout(() => note.hidden = true, 3200);
  }
  renderList(); info(0);
  $('#poster').addEventListener('click', () => play(cur));
  $('#upnext').addEventListener('click', e => { const b = e.target.closest('.item'); if (!b) return; play(+b.dataset.i); if (innerWidth < 1000) $('#player').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
  new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && playing) $('#pv').pause(); }), { threshold: 0 }).observe($('#player'));

  const items = $$('.mlist li'), float = $('#mFloat');
  function toggleM(li, force) {
    const open = force ?? !li.classList.contains('open');
    li.classList.toggle('open', open); li.querySelector('.mrow').setAttribute('aria-expanded', String(open));
  }
  items.forEach(li => li.querySelector('.mrow').addEventListener('click', () => { items.forEach(o => o !== li && toggleM(o, false)); toggleM(li); float.classList.remove('show'); }));
  toggleM(items[0], true);
  if (fine && !reduce) {
    let fx = 0, fy = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => { fx += (tx - fx) * .18; fy += (ty - fy) * .18; float.style.transform = `translate3d(${fx}px, ${fy}px, 0) translate(-50%, -50%) rotate(-4deg)`; raf = Math.abs(tx - fx) + Math.abs(ty - fy) > .5 ? requestAnimationFrame(loop) : 0; };
    items.forEach(li => {
      const row = li.querySelector('.mrow');
      row.addEventListener('mouseenter', e => { if (li.classList.contains('open')) return; float.src = li.querySelector('img').src; fx = tx = e.clientX + 250; fy = ty = e.clientY; float.classList.add('show'); });
      row.addEventListener('mousemove', e => { if (li.classList.contains('open')) { float.classList.remove('show'); return; } tx = e.clientX + 250; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
      row.addEventListener('mouseleave', () => float.classList.remove('show'));
    });
  }
  $$('[data-open]').forEach(a => a.addEventListener('click', () => { const li = $(`.mlist li[data-m="${a.dataset.open}"]`); items.forEach(o => toggleM(o, o === li)); }));

  const vf = $('#visitForm');
  vf.addEventListener('submit', e => {
    e.preventDefault();
    const name = vf.name.value.trim(), email = vf.email.value.trim(), err = $('#visitErr');
    vf.name.setAttribute('aria-invalid', String(!name)); vf.email.setAttribute('aria-invalid', String(!/^\S+@\S+\.\S+$/.test(email)));
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = !name ? 'Please add your name.' : 'Please add a valid email so we can send directions.'; (!name ? vf.name : vf.email).focus(); return; }
    err.textContent = '';
    const kids = vf.kids.value === 'yes', d = CAMPUS[campus], dl = $('#nfDate').selectedOptions[0].textContent.replace(' (today)', '');
    $('#thName').textContent = name.split(' ')[0];
    $('#thLine').textContent = `${dl} at ${vf.time.value}, ${d.name}. We'll email ${email} directions and a parking map${kids ? ', and our Kids team will have your check-in tags ready' : ''}.`;
    const th = $('#visitThanks'); th.hidden = false; th.focus();
  });
  $('#visitReset').addEventListener('click', () => { vf.reset(); setCampus(campus, false); $('#visitThanks').hidden = true; vf.name.focus(); });

  const pf = $('#prayerForm');
  pf.addEventListener('submit', e => {
    e.preventDefault();
    const r = pf.req.value.trim(), err = $('#prErr');
    pf.req.setAttribute('aria-invalid', String(!r));
    if (!r) { err.textContent = 'Write a few words so our team knows how to pray.'; pf.req.focus(); return; }
    err.textContent = ''; const th = $('#prThanks'); th.hidden = false; th.focus();
  });
  $('#prReset').addEventListener('click', () => { pf.reset(); $('#prThanks').hidden = true; pf.req.focus(); });

  const gm = $('#giveModal'), amt = $('#gmAmt');
  const money = v => '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function amount() { return parseFloat(amt.value.replace(/[^0-9.]/g, '')) || 0; }
  function calc() {
    const a = amount(), fee = a > 0 ? Math.round((a * 0.029 + 0.3) * 100) / 100 : 0, total = a + ($('#gmFees').checked ? fee : 0);
    $('#gmFee').textContent = money(fee); $('#gmTotal').textContent = money(total);
    $$('.gm-chips button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.amt === a)));
    return { a, fee, total };
  }
  function openGive() {
    $('#gmStep1').hidden = false; $('#gmStep2').hidden = true; $('#gmErr').textContent = '';
    if (typeof gm.showModal === 'function') gm.showModal(); else gm.setAttribute('open', '');
    calc(); amt.focus(); amt.select();
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-give]')) { e.preventDefault(); openGive(); } });
  $('#gmClose').addEventListener('click', () => gm.close());
  gm.addEventListener('click', e => { if (e.target === gm) gm.close(); });
  amt.addEventListener('input', () => { amt.value = amt.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 9); calc(); });
  $$('.gm-chips button').forEach(b => b.addEventListener('click', () => { amt.value = b.dataset.amt; calc(); }));
  $('#gmFees').addEventListener('change', calc);
  $('#gmGo').addEventListener('click', () => {
    const { a, total } = calc();
    if (a < 1) { $('#gmErr').textContent = 'Enter an amount of at least $1.'; amt.focus(); return; }
    const freq = $('input[name="freq"]:checked').value;
    $('#gmSummary').textContent = `${money(total)} to ${$('#gmFund').value}, ${freq.toLowerCase()}.`;
    $('#gmStep1').hidden = true; const s2 = $('#gmStep2'); s2.hidden = false; s2.focus();
  });
  $('#gmAgain').addEventListener('click', () => gm.close());

  setCampus('orlando', false);
})();
