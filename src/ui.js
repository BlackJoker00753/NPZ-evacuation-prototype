// ---------- ядро интерфейса: иконки, компоненты, роутер, оболочка, карта
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = U.esc, nf = U.nf, mmss = U.mmss;
const chem = s => String(s).replace(/₂/g, '<sub>2</sub>');
const ICONS = {
  overview: 'M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z',
  site: 'M1.75 4.25 6 2.5l4 1.75 4.25-1.75v9.25L10 13.5l-4-1.75-4.25 1.75zM6 2.5v9.25M10 4.25v9.25',
  people: 'M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 13.5c.6-2.4 2.3-3.8 4.5-3.8s3.9 1.4 4.5 3.8M11 3a2.3 2.3 0 0 1 0 4.4M12.5 9.9c1 .6 1.7 1.8 2 3.6',
  scen: 'M2 6h7.5a2 2 0 1 0-2-2M2 9.5h10a2 2 0 1 1-2 2M2 13h5',
  pla: 'M4 1.5h5.5L13 5v9.5H4zM9.5 1.5V5H13M6.5 9.75l1.5 1.5 3-3',
  sim: 'M4.5 2.75v10.5L13 8z',
  batch: 'M8 1.5 14.5 5 8 8.5 1.5 5zM1.5 8 8 11.5 14.5 8M1.5 11 8 14.5 14.5 11',
  staff: 'M2.5 3h11v7.5H8l-3 2.5v-2.5H2.5zM5.5 6.75h0M8 6.75h0M10.5 6.75h0',
  trainer: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 8h0',
  drill: 'M8 14.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8 6v3.25l2 1.25M6.5 1.5h3',
  reports: 'M4 1.5h5.5L13 5v9.5H4zM9.5 1.5V5H13M6 8.5h5M6 11h5',
  brief: 'M8 1.5v13M8 3h5l1.5 1.75L13 6.5H8M8 8H3L1.5 9.75 3 11.5h5',
  admin: 'M2.5 4h7M12.5 4h1M2.5 8h2M7.5 8h6M2.5 12h7M12.5 12h1M11 2.5v3M6 6.5v3M11 10.5v3',
  tour: 'M3 14.5V2h8.5l-1.5 3 1.5 3H3',
  moon: 'M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z',
  sun: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1',
  lock: 'M4.5 7.5h7v6h-7zM6 7.5V5.5a2 2 0 0 1 4 0v2',
  plus: 'M8 3v10M3 8h10', minus: 'M3 8h10', fit: 'M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10',
  down: 'M8 2v8.5M4.5 7 8 10.5 11.5 7M2.5 13.5h11', up: 'M8 10.5V2M4.5 5.5 8 2l3.5 3.5M2.5 13.5h11',
  check: 'M3 8.5 6.5 12 13 4.5', x: 'M4 4l8 8M12 4l-8 8', chev: 'M6 3.5 10.5 8 6 12.5', play: 'M4.5 2.75v10.5L13 8z', pause: 'M5.5 3v10M10.5 3v10',
  reset: 'M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5V5H5', ext: 'M9 2.5h4.5V7M13.5 2.5 7.5 8.5M11.5 9.5v4h-9v-9h4', search: 'M7 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.5 10.5l3 3',
  wind: 'M1.5 6h8a2 2 0 1 0-2-2M1.5 10h11a2 2 0 1 1-2 2', pin: 'M8 14.5s5-4.6 5-8.5a5 5 0 0 0-10 0c0 3.9 5 8.5 5 8.5zM8 7.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z',
  copy: 'M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3', print: 'M4 6V1.5h8V6M4 11.5H2.5V6h11v5.5H12M4 9.5h8v5H4z', file: 'M4 1.5h5.5L13 5v9.5H4zM9.5 1.5V5H13',
  shield: 'M8 1.5 13.5 3.5V8c0 3.2-2.4 5.5-5.5 6.5C4.9 13.5 2.5 11.2 2.5 8V3.5z', db: 'M8 5.5c3 0 5.5-.9 5.5-2s-2.5-2-5.5-2-5.5.9-5.5 2 2.5 2 5.5 2zM2.5 3.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2',
  plug: 'M5.5 1.5v3M10.5 1.5v3M3.5 4.5h9v3a4.5 4.5 0 0 1-9 0zM8 12v2.5', key: 'M10 9.5a3.5 3.5 0 1 0-3.4-2.6L1.5 12v2h2l.5-1h1.5v-1.5H7l1.1-1.1c.6.1 1.2.1 1.9.1z', user: 'M8 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 14.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5',
  flag: 'M3 14.5V2h8.5l-1.5 3 1.5 3H3', layers: 'M8 1.5 14.5 5 8 8.5 1.5 5zM1.5 8 8 11.5 14.5 8', bolt: 'M9 1.5 3 9h4.5L7 14.5 13 7H8.5z',
};
const ic = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true"><path d="${ICONS[n] || ''}"/></svg>`;
const STRAT_COL = id => `var(--s-${id === 'live' || id === 'human' ? 'human' : (id.startsWith('ST-') ? 'fixed' : id)})`;

const UI = {
  toast(msg, o = {}) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span>${msg}</span>` + (o.action ? `<button class="link" type="button">${esc(o.action)}</button>` : ''); if (o.action) t.querySelector('button').onclick = () => { o.onAction(); t.remove() }; $('#toasts').appendChild(t); setTimeout(() => t.remove(), o.ms || 4200) },
  layer: () => $('#layer'),
  scrim(on, close) { const s = $('#scrim'); s.hidden = !on; s.onclick = on ? close : null },
  drawer({ title, body, foot, wide }) {
    const d = document.createElement('div'); d.className = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); if (wide) d.style.width = 'min(760px,calc(100vw - 16px))';
    d.innerHTML = `<div class="drawer-h"><h2>${title}</h2><button class="icon-btn" type="button" aria-label="Закрыть">${ic('x')}</button></div><div class="drawer-b"></div>${foot ? '<div class="drawer-f"></div>' : ''}`;
    const close = () => { d.remove(); UI.scrim(false); document.removeEventListener('keydown', k) }; const k = e => { if (e.key === 'Escape') close() };
    d.querySelector('.drawer-h button').onclick = close; document.addEventListener('keydown', k); UI.scrim(true, close); UI.layer().appendChild(d);
    if (typeof body === 'function') body(d.querySelector('.drawer-b'), close); else d.querySelector('.drawer-b').innerHTML = body;
    if (foot) foot(d.querySelector('.drawer-f'), close); setTimeout(() => (d.querySelector('.drawer-b [autofocus]') || d.querySelector('.drawer-h button')).focus(), 30); return { el: d, close };
  },
  confirm(text, ok = 'Подтвердить', danger) { return new Promise(res => { const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'alertdialog'); m.innerHTML = `<div class="drawer-b"><p class="lead">${text}</p></div><div class="drawer-f"><button class="btn" type="button" data-v="0">Отмена</button><button class="btn ${danger ? 'danger' : 'primary'}" type="button" data-v="1">${ok}</button></div>`; const done = v => { m.remove(); UI.scrim(false); res(v) }; m.onclick = e => { const b = e.target.closest('[data-v]'); if (b) done(b.dataset.v === '1') }; UI.scrim(true, () => done(false)); UI.layer().appendChild(m); m.querySelector('[data-v="1"]').focus() }) },
  menu(anchor, items, o = {}) {
    UI.closeMenu(); const m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu');
    m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : it.head ? `<div class="mh">${esc(it.head)}</div>` : `<button type="button" role="menuitem" data-i="${i}" ${it.disabled ? 'disabled' : ''}>${it.icon ? ic(it.icon) : it.check != null ? (it.check ? ic('check') : '<span></span>') : '<span></span>'}<b style="font-weight:${it.check ? 600 : 400}">${esc(it.label)}</b><span>${esc(it.note || '')}</span></button>`).join('');
    document.body.appendChild(m); const r = anchor.getBoundingClientRect(); const w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(innerWidth - w - 8, o.right ? r.right - w : r.left)) + 'px'; m.style.top = (r.bottom + 6 + h > innerHeight ? r.top - h - 6 : r.bottom + 6) + 'px';
    m.onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; UI.closeMenu(); items[+b.dataset.i].run() };
    setTimeout(() => { document.addEventListener('pointerdown', UI._mclose = e => { if (!m.contains(e.target)) UI.closeMenu() }); document.addEventListener('keydown', UI._mkey = e => { if (e.key === 'Escape') UI.closeMenu() }) }, 0);
    UI._menu = m; m.querySelector('button')?.focus();
  },
  closeMenu() { if (UI._menu) { UI._menu.remove(); UI._menu = null; document.removeEventListener('pointerdown', UI._mclose); document.removeEventListener('keydown', UI._mkey) } },
  title({ crumb, h1, sub, actions = '' }) { return `<div class="title-row"><div class="tt">${crumb ? `<div class="crumb">${crumb}</div>` : ''}<h1>${chem(h1)}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>` },
  kpis(items, cls = '') { return `<div class="kpis ${cls}" style="--n:${items.length}">${items.map(k => `<div class="${k.cls || ''}"><span class="l">${k.l}</span><b>${k.v}</b>${k.c ? `<span class="c">${k.c}</span>` : ''}</div>`).join('')}</div>` },
  seg(id, opts, val) { return `<div class="seg" id="${id}" role="group">${opts.map(([v, l, dis]) => `<button type="button" data-v="${esc(v)}" aria-pressed="${String(v) === String(val)}" ${dis ? 'disabled' : ''}>${l}</button>`).join('')}</div>` },
  bindSeg(root, id, fn) { const s = $('#' + id, root); if (!s) return; s.onclick = e => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; $$('button', s).forEach(x => x.setAttribute('aria-pressed', x === b)); fn(b.dataset.v) } },
  tabs(id, opts, val) { return `<div class="tabs" id="${id}" role="tablist">${opts.map(([v, l, c]) => `<button type="button" role="tab" data-v="${v}" aria-selected="${v === val}">${l}${c != null ? `<span class="c">${c}</span>` : ''}</button>`).join('')}</div>` },
  bindTabs(root, id, fn) { const s = $('#' + id, root); if (!s) return; s.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; $$('[role=tab]', s).forEach(x => x.setAttribute('aria-selected', x === b)); fn(b.dataset.v) } },
  pill(cls, t) { return `<span class="pill ${cls}">${t}</span>` },
  lockBtn(perm, html) { return can(perm) ? html : html.replace('<button', `<button disabled title="Нужна роль с правом «${perm}»"`) },
  locked(el, need) { el.innerHTML = `<div class="page">${UI.title({ h1: 'Недоступно для роли «' + ROLES[Store.s.user.role].name + '»', sub: 'Права роли заданы в разделе «Пользователи, роли» ТЗ. ' + need })}<div class="empty"><span>Смените роль в меню пользователя справа вверху, чтобы посмотреть экран.</span><button class="btn sm" type="button" id="lkRole">Сменить роль</button></div></div>`; $('#lkRole').onclick = e => Shell.roleMenu(e.currentTarget) },
  drop(el, { label, hint, accept, onFile, sample }) {
    el.className = 'drop'; el.innerHTML = `<div class="dt"><b>${label}</b><span>${hint}</span></div><div class="actions">${sample ? `<button class="btn sm ghost" type="button" data-s>${ic('down')}Образец</button>` : ''}<label class="btn sm">${ic('up')}Выбрать файл<input type="file" accept="${accept}" hidden></label></div>`;
    const inp = $('input', el); inp.onchange = () => inp.files[0] && onFile(inp.files[0]);
    el.ondragover = e => { e.preventDefault(); el.classList.add('over') }; el.ondragleave = () => el.classList.remove('over'); el.ondrop = e => { e.preventDefault(); el.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) onFile(f) };
    if (sample) $('[data-s]', el).onclick = () => U.download(sample.name, sample.make(), sample.type);
  },
  line(el, o) { return Charts.line(el, Object.assign({ format: v => nf(v) }, o)) },
};

// ---------- подложка «как со спутника»: только картинка под расчётной геометрией, сама геометрия не меняется
const Ortho = {
  img: null, views: new Set(), user: false,
  cfg: { on: true, dx: 0, dy: 0, sc: 1, veil: .14 },
  init() { try { const c = localStorage.getItem('s1.ortho.cfg'); if (c) Object.assign(this.cfg, JSON.parse(c)) } catch (e) { } let src = null; try { src = localStorage.getItem('s1.ortho') } catch (e) { } this.user = !!src; this.load(src || (typeof ORTHO_DEFAULT !== 'undefined' ? ORTHO_DEFAULT : null)) },
  load(src) { if (!src) { this.img = null; this.redraw(); return } const im = new Image(); im.onload = () => { this.img = im; this.redraw() }; im.src = src },
  async set(file) {
    const url = await U.readDataURL(file); const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Это не изображение')); i.src = url });
    const cv = document.createElement('canvas'); const w = Math.min(2048, im.naturalWidth); cv.width = w; cv.height = Math.round(w * im.naturalHeight / im.naturalWidth); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    const jpg = cv.toDataURL('image/jpeg', .86); let stored = true; try { localStorage.setItem('s1.ortho', jpg) } catch (e) { stored = false }
    this.user = true; this.load(jpg); return { w: cv.width, h: cv.height, kb: Math.round(jpg.length * .75 / 1024), stored };
  },
  clear() { try { localStorage.removeItem('s1.ortho') } catch (e) { } this.user = false; this.load(typeof ORTHO_DEFAULT !== 'undefined' ? ORTHO_DEFAULT : null) },
  save() { try { localStorage.setItem('s1.ortho.cfg', JSON.stringify(this.cfg)) } catch (e) { } this.redraw() },
  redraw() { this.views.forEach(v => { v.dirty = true; v.draw() }) },
  // схема-ориентир 1536×1024: площадка 640×420 м по центру, 2,4 пикселя на метр
  rect() { const w = 640 * this.cfg.sc, h = w * this.img.naturalHeight / this.img.naturalWidth, cx = 320 + this.cfg.dx, cy = 210 + this.cfg.dy; return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2] },
  active(v) { return !!(this.img && this.cfg.on && v.layers.ortho !== false) },
};

// ---------- карта площадки
class MapView {
  constructor(host, o = {}) {
    this.o = o; this.host = host; host.classList.add('mapwrap'); host.innerHTML = `<canvas aria-label="${esc(o.label || 'Карта площадки НПЗ')}" role="img"></canvas><div class="map-tip"></div>${o.tools !== false ? `<div class="map-tools no-print"><button type="button" data-z="in" aria-label="Приблизить">${ic('plus')}</button><button type="button" data-z="out" aria-label="Отдалить">${ic('minus')}</button><button type="button" data-z="fit" aria-label="Вся площадка">${ic('fit')}</button></div>` : ''}${o.clock ? '<div class="map-clock">0:00</div>' : ''}`;
    this.cv = $('canvas', host); this.cx = this.cv.getContext('2d'); this.tip = $('.map-tip', host); this.clockEl = $('.map-clock', host);
    this.layers = Object.assign({ plume: true, people: true, heat: false, sensors: false, labels: true, graph: false, closures: true }, o.layers || {});
    this.k = 1; this.ox = 0; this.oy = 0; this.S = 1; this.st = document.createElement('canvas'); this.pl = document.createElement('canvas'); this.plT = -99; this.dirty = true; this.flashes = []; this.marks = [];
    this.readCols(); this.ro = new ResizeObserver(() => this.size()); this.ro.observe(this.cv); this.bind();
    $$('[data-z]', host).forEach(b => b.onclick = () => { const r = this.cv.width / 2, c = this.cv.height / 2; if (b.dataset.z === 'fit') { this.k = 1; this.ox = 0; this.oy = 0 } else this.zoomAt(r, c, b.dataset.z === 'in' ? 1.4 : 1 / 1.4); this.dirty = true; this.draw() });
    Shell.onTheme.add(this._th = () => { this.readCols(); this.draw() }); Ortho.views.add(this);
  }
  destroy() { this.ro.disconnect(); Shell.onTheme.delete(this._th); Ortho.views.delete(this) }
  readCols() { const cs = getComputedStyle(document.documentElement); this.C = {}; ['map', 'unit', 'unit-line', 'tank', 'build', 'rack', 'camp', 'text', 'muted', 'border', 'surface', 'negative', 'positive', 'warning', 'accent', 'fence', 'p-wait', 'p-move', 'p-queue', 'p-reg', 'p-shel', 'p-camp', 'p-inc', 'p-left', 'chart-2'].forEach(k => this.C[k] = cs.getPropertyValue('--' + k).trim()); this.dark = document.documentElement.dataset.theme === 'dark'; this.dirty = true }
  size() { const w = this.cv.clientWidth || 900, dpr = Math.min(2, devicePixelRatio || 1); const H = this.o.aspect ? w * this.o.aspect : w * L.H / L.W; this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(H * dpr); this.S = Math.min(this.cv.width / L.W, this.cv.height / L.H); this.bx = (this.cv.width - L.W * this.S) / 2; this.by = (this.cv.height - L.H * this.S) / 2; this.st.width = this.cv.width; this.st.height = this.cv.height; this.dirty = true; this.draw() }
  X(x) { return this.ox + this.bx * this.k + x * this.S * this.k } Y(y) { return this.oy + this.by * this.k + (L.H - y) * this.S * this.k } get s() { return this.S * this.k }
  inv(px, py) { return [(px - this.ox - this.bx * this.k) / this.s, L.H - (py - this.oy - this.by * this.k) / this.s] }
  zoomAt(px, py, f) { const k2 = Math.max(1, Math.min(5, this.k * f)); const ff = k2 / this.k; this.ox = px - (px - this.ox) * ff; this.oy = py - (py - this.oy) * ff; this.k = k2; this.clamp() }
  clamp() { const W = this.cv.width, H = this.cv.height; this.ox = Math.min(0, Math.max(W - W * this.k, this.ox)); this.oy = Math.min(0, Math.max(H - H * this.k, this.oy)); if (this.k === 1) { this.ox = 0; this.oy = 0 } }
  bind() {
    const cv = this.cv; let drag = null; const px = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height] };
    cv.addEventListener('wheel', e => { if (!e.ctrlKey && !this.o.wheel && this.k === 1 && e.deltaY > 0) return; e.preventDefault(); const [x, y] = px(e); this.zoomAt(x, y, e.deltaY < 0 ? 1.15 : 1 / 1.15); this.dirty = true; this.draw() }, { passive: false });
    cv.addEventListener('pointerdown', e => { const p = px(e); let mus = null; if (this.o.dragMuster) { const o = this.pick(p); if (o && o.kind === 'muster') mus = { id: o.id, x0: o.obj.x, y0: o.obj.y } } drag = { p, ox: this.ox, oy: this.oy, moved: false, mus }; try { cv.setPointerCapture(e.pointerId) } catch (err) { } if (mus) { cv.classList.add('dragging'); this.tip.style.opacity = 0 } });
    cv.addEventListener('pointermove', e => { const p = px(e); if (drag) { const dx = p[0] - drag.p[0], dy = p[1] - drag.p[1]; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; if (drag.mus && drag.moved) { const [x, y] = this.inv(...p); const m = L.MUSTER.find(m => m.id === drag.mus.id); m.x = Math.round(Math.max(0, Math.min(L.W, x))); m.y = Math.round(Math.max(0, Math.min(L.H, y))); this.dragBad = Musters.why(m.x, m.y); this.draw(); return } if (drag.moved && this.k > 1) { cv.classList.add('dragging'); this.ox = drag.ox + dx; this.oy = drag.oy + dy; this.clamp(); this.dirty = true; this.draw() } return } this.hover(p, e) });
    cv.addEventListener('pointerup', e => { cv.classList.remove('dragging'); if (drag && drag.mus && drag.moved) { const m = L.MUSTER.find(m => m.id === drag.mus.id); const bad = Musters.why(m.x, m.y); this.dragBad = null; if (bad) { m.x = drag.mus.x0; m.y = drag.mus.y0; this.draw(); UI.toast(esc(m.id) + ' не перенесён: ' + bad) } else this.o.dragMuster(m.id, m.x, m.y); drag = null; return } if (drag && !drag.moved && this.o.onPick) { const o = this.pick(px(e)); if (o) this.o.onPick(o) } drag = null });
    cv.addEventListener('pointerleave', () => { this.tip.style.opacity = 0 });
    cv.addEventListener('dblclick', () => { this.k = 1; this.ox = 0; this.oy = 0; this.dirty = true; this.draw() });
  }
  pick([px, py]) {
    const [x, y] = this.inv(px, py); const sim = this.sim; const tol = 14 / this.k;
    const m = L.MUSTER.find(m => Math.hypot(m.x - x, m.y - y) < tol); if (m) return { kind: 'muster', id: m.id, obj: m };
    const cl = L.CLOSURES.find(c => (c.fence || [c.cells.r]).some(r => x >= r[0] - 6 && x <= r[2] + 6 && y >= r[1] - 6 && y <= r[3] + 6)); if (cl) return { kind: 'closure', id: cl.id, obj: cl };
    const b = L.BUILD.find(b => x >= b.r[0] && x <= b.r[2] && y >= b.r[1] && y <= b.r[3]); if (b) return { kind: 'building', id: b.id, obj: b };
    const z = Object.entries(L.ZONES).find(([k, v]) => k !== 'OP' && k !== 'ADM' && x >= v.r[0] && x <= v.r[2] && y >= v.r[1] && y <= v.r[3]); if (z) return { kind: 'zone', id: z[0], obj: z[1] };
    return null;
  }
  hover(p, e) {
    const o = this.pick(p); const sim = this.sim; if (!o) { this.tip.style.opacity = 0; this.cv.classList.remove('pick'); return }
    if (this.o.onPick || (this.o.dragMuster && o.kind === 'muster')) this.cv.classList.add(this.o.dragMuster && o.kind === 'muster' ? 'move' : 'pick'); else this.cv.classList.remove('move');
    let h = ''; const [x, y] = this.inv(...p);
    if (o.kind === 'muster') { const open = sim ? sim.musterOpen[o.id] : true; const g = sim && sim.C ? Math.round(sim.C(o.obj.x, o.obj.y)) : null; h = `<b>${esc(o.obj.name)}</b>${this.o.dragMuster ? '<br><span style="opacity:.7">перетащите, чтобы перенести</span>' : ''}<br>${open ? 'открыт' : 'закрыт'}${sim && sim.regCount ? ` · отметились ${sim.regCount[o.id]} · в очереди ${sim.queue[o.id].length}` : ''}${g != null ? `<br>${sim.fire ? 'CO' : 'H₂S'} у пункта: ${g} ppm` : ''}${!sim || !sim.regCount ? `<br>зоны по ПЛА: ${Object.keys(Store.s.plaMap).filter(z => Store.s.plaMap[z] === o.id).map(ZN).join(', ') || '—'}` : ''}` }
    else if (o.kind === 'closure') { const c = Store.s.closures.find(c => c.id === o.id); const closed = this.closedList().includes(o.id); h = `<b>${esc(o.id)}</b> · ${closed ? 'закрыт' : 'открыт'}<br>${esc(o.obj.name)}<br>действует ${U.dateRu(c.from)}–${U.dateRu(c.to)}${this.o.onPick ? '<br><span style="opacity:.7">нажмите, чтобы переключить</span>' : ''}` }
    else if (o.kind === 'zone') { const n = sim && sim.ppl ? sim.ppl.filter(q => q.zone === o.id).length : null; h = `<b>${esc(o.obj.name)}</b>${n != null ? `<br>людей по нарядам: ${n}` : ''}<br>ПС по ПЛА: ${Store.s.plaMap[o.id] || '—'}` }
    else if (o.kind === 'building') h = `<b>${esc(o.obj.name)}</b><br>коэффициент укрытия ${o.obj.shelter}`;
    if (sim && sim.C && this.layers.plume) { const c = sim.C(x, y); if (c >= 1) h += `<br>${sim.fire ? 'CO в дыму' : 'H₂S'} здесь: ${Math.round(c)} ppm` }
    this.tip.innerHTML = h; const r = this.cv.getBoundingClientRect(); const tx = e.clientX - r.left + 14, ty = e.clientY - r.top + 14; this.tip.style.left = Math.min(tx, r.width - this.tip.offsetWidth - 6) + 'px'; this.tip.style.top = Math.min(ty, r.height - this.tip.offsetHeight - 6) + 'px'; this.tip.style.opacity = 1;
  }
  closedList() { return this.sim ? this.sim.closed : (this.closed || []) }
  rect(c, r) { c.fillRect(this.X(r[0]), this.Y(r[3]), (r[2] - r[0]) * this.s, (r[3] - r[1]) * this.s) }
  drawStatic() {
    const c = this.st.getContext('2d'), C = this.C, s = this.s; c.clearRect(0, 0, this.st.width, this.st.height); c.fillStyle = C.map; c.fillRect(0, 0, this.st.width, this.st.height);
    const ph = Ortho.active(this); this.ph = ph;
    if (ph) { const r = Ortho.rect(); c.fillStyle = '#23241f'; c.fillRect(0, 0, this.st.width, this.st.height); c.imageSmoothingQuality = 'high'; c.drawImage(Ortho.img, this.X(r[0]), this.Y(r[3]), (r[2] - r[0]) * s, (r[3] - r[1]) * s); c.fillStyle = `rgba(10,12,10,${Math.min(.7, Ortho.cfg.veil + (this.dark ? .22 : 0))})`; c.fillRect(0, 0, this.st.width, this.st.height) }
    c.strokeStyle = C.border; c.lineWidth = 1; c.strokeRect(this.X(1), this.Y(L.H - 1), (L.W - 2) * s, (L.H - 2) * s);
    // дороги — пустые полосы; городок, резервуарный парк, установки, здания, эстакады
    if (!ph) {
    c.fillStyle = C.camp; this.rect(c, L.CAMP.r); c.fillStyle = C.tank; this.rect(c, L.TANKFARM);
    L.TANKS.forEach(([x, y]) => { c.beginPath(); c.arc(this.X(x), this.Y(y), 18 * s, 0, 7); c.fillStyle = C.map; c.fill(); c.strokeStyle = C['unit-line']; c.lineWidth = Math.max(1, s * .8); c.stroke() });
    L.UNITS.forEach(u => { c.fillStyle = C.unit; this.rect(c, u.r); c.strokeStyle = C['unit-line']; c.lineWidth = Math.max(1, s * .7); c.strokeRect(this.X(u.r[0]), this.Y(u.r[3]), (u.r[2] - u.r[0]) * s, (u.r[3] - u.r[1]) * s) });
    c.fillStyle = C.build; L.BUILD.forEach(b => this.rect(c, b.r));
    c.fillStyle = C.rack; L.RACKS.forEach(rk => { const segs = []; let a = rk.axis === 'x' ? rk.r[0] : rk.r[1]; rk.gaps.forEach(g => { segs.push([a, g[0]]); a = g[1] }); segs.push([a, rk.axis === 'x' ? rk.r[2] : rk.r[3]]); segs.forEach(([s0, s1]) => this.rect(c, rk.axis === 'x' ? [s0, rk.r[1], s1, rk.r[3]] : [rk.r[0], s0, rk.r[2], s1])) });
    L.KPP.forEach(k => { c.fillStyle = C.text; c.fillRect(this.X(k.x) - s * 3, this.Y(k.y) - s * 3, s * 6, s * 6) });
    }
    if (this.layers.closures) { const closed = this.closedList(); L.CLOSURES.forEach(cl => { const on = closed.includes(cl.id); (cl.fence || [cl.cells.r]).forEach(r => { c.strokeStyle = on ? C.fence : C.muted; c.globalAlpha = on ? 1 : .55; c.lineWidth = Math.max(1.5, s * (on ? 1.4 : .8)); c.setLineDash(on ? [s * 3, s * 2] : [s * 1.5, s * 2.5]); c.strokeRect(this.X(r[0]), this.Y(r[3]), Math.max(s * 2, (r[2] - r[0]) * s), Math.max(s * 2, (r[3] - r[1]) * s)); c.globalAlpha = 1 }) }); c.setLineDash([]) }
    if (this.layers.labels) {
      c.fillStyle = ph ? '#f3f3ef' : C.muted; if (ph) { c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 4 } c.font = `500 ${Math.max(11, s * 6.4)}px "IBM Plex Sans",sans-serif`; c.textBaseline = 'top'; const narrow = this.cv.clientWidth < 640; const SH_ = { AVT: 'АВТ-3', REF: 'Л-35', HDS: 'ЛЧ-24', CLAUS: 'Клаус', GFU: 'ГФУ' };
      L.UNITS.forEach(u => c.fillText(narrow ? SH_[u.id] : u.name, this.X(u.r[0]) + s * 3, this.Y(u.r[3]) + s * 3));
      if (!narrow) { c.fillText(L.CAMP.name, this.X(L.CAMP.r[0]) + s * 3, this.Y(L.CAMP.r[3]) + s * 3); c.fillText('Резервуарный парк', this.X(L.TANKFARM[0]) + s * 3, this.Y(L.TANKFARM[3]) - s * 10); c.fillText('Админкорпус', this.X(30), this.Y(400) - s * 9); c.fillText('Операторная', this.X(288), this.Y(168) + s * 2) }
      c.font = `${Math.max(10, s * 5.2)}px "IBM Plex Sans",sans-serif`; c.fillText('Э-1', this.X(104), this.Y(213)); c.fillText('Э-2', this.X(386), this.Y(413)); L.KPP.forEach(k => c.fillText(k.id, this.X(k.x) + s * 5, this.Y(k.y) - s * 9));
      if (this.closedList().length && this.layers.closures) { c.fillStyle = C.fence; c.font = `500 ${Math.max(10, s * 5)}px "IBM Plex Sans",sans-serif`; L.CLOSURES.forEach(cl => { if (!this.closedList().includes(cl.id)) return; const r = (cl.fence || [cl.cells.r])[0]; c.fillText(cl.id, this.X(r[2]) + s * 2, this.Y(r[3]) - s * 7) }) }
    }
    c.shadowBlur = 0; c.shadowColor = 'transparent'; this.dirty = false;
  }
  plume() {
    const sim = this.sim, gw = 320, gh = 210; this.pl.width = gw; this.pl.height = gh; const pc = this.pl.getContext('2d'); const img = pc.createImageData(gw, gh); const D = img.data;
    const ramp = sim.fire ? (v => v < 3 ? null : v < 50 ? [120, 120, 120, 55] : v < 420 ? [90, 90, 90, 100] : v < 1700 ? [60, 60, 60, 140] : [30, 30, 30, 170]) : (v => v < .75 ? null : v < 10 ? [232, 196, 60, 62] : v < 41 ? [238, 140, 40, 110] : v < 76 ? [222, 70, 40, 145] : [176, 20, 32, 175]);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const v = sim.C((i + .5) * 2, L.H - (j + .5) * 2); const col = ramp(v); if (!col) continue; const o = (j * gw + i) * 4; D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = this.dark && sim.fire ? col[3] * 1.2 : col[3] }
    pc.putImageData(img, 0, 0); this.plT = sim.t;
  }
  flash(x, y, label) { this.flashes.push({ x, y, n: 0, label }); const go = () => { this.draw(); if (this.flashes.length) requestAnimationFrame(go) }; go() }
  draw() {
    if (!this.cv.width) return; const cx = this.cx, C = this.C, s = this.s, sim = this.sim;
    if (this.dirty || this._cl !== this.closedList().join()) { this._cl = this.closedList().join(); this.drawStatic() }
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(this.st, 0, 0);
    if (sim && sim.hot && this.layers.heat) { let mx = 0; for (let k = 0; k < sim.hot.length; k++) if (sim.hot[k] > mx) mx = sim.hot[k]; if (mx > 0) for (let k = 0; k < sim.hot.length; k++) { const v = sim.hot[k]; if (v < 3) continue; const i = k % L.GW, j = Math.floor(k / L.GW); cx.fillStyle = `rgba(194,124,0,${Math.min(.8, .15 + v / mx)})`; cx.fillRect(this.X(i * L.CELL), this.Y((j + 1) * L.CELL), L.CELL * s, L.CELL * s) } }
    if (sim && sim.C && this.layers.plume && sim.P.source) { if (Math.abs(sim.t - this.plT) >= 2 || this._plk !== this.k + ':' + this.ox) { this.plume(); this._plk = this.k + ':' + this.ox } cx.imageSmoothingEnabled = true; cx.drawImage(this.pl, this.X(0), this.Y(L.H), L.W * s, L.H * s) }
    if (sim && sim.fire && sim.heatRadius) { const f = sim.P.fire; [[4, C.warning], [12.5, C.negative]].forEach(([q, col]) => { const rr = sim.heatRadius(q); if (rr < 1) return; cx.beginPath(); cx.arc(this.X(f.x), this.Y(f.y), rr * s, 0, 7); cx.fillStyle = q === 4 ? 'rgba(240,140,40,.16)' : 'rgba(220,40,30,.22)'; cx.fill(); cx.setLineDash([s * 3, s * 2]); cx.strokeStyle = col; cx.lineWidth = Math.max(1.5, s); cx.stroke(); cx.setLineDash([]) }) }
    if (this.marks.length) this.marks.forEach(m => { cx.strokeStyle = m.col || C.accent; cx.lineWidth = Math.max(2, s * 1.2); cx.beginPath(); cx.arc(this.X(m.x), this.Y(m.y), (m.r || 14) * s, 0, 7); cx.stroke(); if (m.label) { cx.font = `600 ${Math.max(11, s * 6)}px "IBM Plex Sans",sans-serif`; cx.fillStyle = m.col || C.accent; cx.textBaseline = 'middle'; cx.fillText(m.label, this.X(m.x) + ((m.r || 14) + 4) * s, this.Y(m.y)) } });
    if (sim && sim.P && sim.P.source && sim.P.source.x != null) { const sx = this.X(sim.P.source.x), sy = this.Y(sim.P.source.y), u = Math.max(5, s * 6); cx.fillStyle = C.negative; cx.beginPath(); cx.moveTo(sx, sy - u * 1.15); cx.lineTo(sx + u, sy + u * .7); cx.lineTo(sx - u, sy + u * .7); cx.closePath(); cx.fill(); cx.fillStyle = '#fff'; cx.font = `700 ${u * 1.1}px "IBM Plex Sans",sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('!', sx, sy + u * .05); cx.textAlign = 'left' }
    if (sim && sim.ppl && this.layers.people) { const cols = [this.ph ? '#f2f2ec' : C['p-wait'], null, C['p-move'], C['p-queue'], C['p-reg'], C['p-shel'], C['p-camp'], C['p-inc'], C['p-left']]; const r = Math.max(1.5, s * (this.ph ? 1.25 : 1.05)); for (let st = 0; st < 9; st++) { if (st === 1 || st === 5) continue; cx.fillStyle = cols[st]; for (const p of sim.ppl) { if (p.state !== st) continue; if (st === 7) { cx.fillRect(this.X(p.x) - r * 1.5, this.Y(p.y) - r * 1.5, r * 3, r * 3); continue } if (st === 8) { cx.globalAlpha = .55 } cx.fillRect(this.X(p.x) - r, this.Y(p.y) - r, r * 2, r * 2); if (this.ph) { cx.strokeStyle = 'rgba(0,0,0,.6)'; cx.lineWidth = 1; cx.strokeRect(this.X(p.x) - r - .5, this.Y(p.y) - r - .5, r * 2 + 1, r * 2 + 1) } cx.globalAlpha = 1 } } }
    // пункты сбора
    cx.font = `600 ${Math.max(11, s * 6.2)}px "IBM Plex Sans",sans-serif`; cx.textBaseline = 'middle';
    L.MUSTER.forEach(mm => { const open = sim ? sim.musterOpen[mm.id] : (this.open ? this.open[mm.id] !== false : !mm.reserve); const gas = sim && sim.C ? sim.C(mm.x, mm.y) : 0; const n = sim && sim.regCount ? sim.regCount[mm.id] + sim.queue[mm.id].length : 0; const R = Math.max(7, s * 7.5);
      cx.beginPath(); cx.arc(this.X(mm.x), this.Y(mm.y), R, 0, 7); cx.fillStyle = open ? C.surface : C.border; cx.fill(); cx.lineWidth = Math.max(2, s * 1.5); cx.strokeStyle = gas > 10 ? C.negative : open ? C.positive : C.muted; cx.stroke(); const home = L.MUSTER_HOME.find(h => h.id === mm.id); if (home && (home.x !== mm.x || home.y !== mm.y) && this.o.showHome) { cx.setLineDash([3, 3]); cx.strokeStyle = C.muted; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(this.X(home.x), this.Y(home.y)); cx.lineTo(this.X(mm.x), this.Y(mm.y)); cx.stroke(); cx.beginPath(); cx.arc(this.X(home.x), this.Y(home.y), R * .45, 0, 7); cx.stroke(); cx.setLineDash([]) } if (this.dragBad !== undefined && this.dragBad !== null && this.cv.classList.contains('dragging')) { cx.lineWidth = Math.max(3, s * 2); cx.strokeStyle = C.negative; cx.beginPath(); cx.arc(this.X(mm.x), this.Y(mm.y), R + 3, 0, 7); cx.stroke() }
      if (!open) { cx.strokeStyle = C.muted; cx.beginPath(); cx.moveTo(this.X(mm.x) - R * .6, this.Y(mm.y) - R * .6); cx.lineTo(this.X(mm.x) + R * .6, this.Y(mm.y) + R * .6); cx.moveTo(this.X(mm.x) + R * .6, this.Y(mm.y) - R * .6); cx.lineTo(this.X(mm.x) - R * .6, this.Y(mm.y) + R * .6); cx.stroke() }
      const right = mm.x > 560; cx.textAlign = right ? 'right' : 'left'; cx.fillStyle = C.text; const lab = mm.id + (n ? ' · ' + n : ''); const lx = right ? this.X(mm.x) - R - 5 : this.X(mm.x) + R + 5; if (this.ph) cx.fillStyle = '#ffffff'; cx.lineWidth = 3; cx.strokeStyle = this.ph ? 'rgba(0,0,0,.75)' : C.map; cx.strokeText(lab, lx, this.Y(mm.y)); cx.fillText(lab, lx, this.Y(mm.y)); cx.textAlign = 'left' });
    if (sim && sim.C && this.layers.sensors) { cx.font = `${Math.max(10, s * 5)}px "IBM Plex Sans",sans-serif`; L.SENSORS.filter(x => !x[0].startsWith('ГЗ у')).forEach(([n, x, y]) => { const v = Math.round(sim.C(x, y)); cx.fillStyle = v > 10 ? C.negative : C.muted; cx.fillRect(this.X(x) - s * 2, this.Y(y) - s * 2, s * 4, s * 4); cx.fillText(n + (v ? ' · ' + v : ''), this.X(x) + s * 3, this.Y(y) - s * 4) }) }
    // ветер
    if (sim && sim.P && sim.P.wind) { const w = L.windAt(sim.P, sim.t || 0); const th = (w.from + 180) * Math.PI / 180; const ax = this.X(470), ay = this.Y(392), len = Math.max(14, s * 13); cx.strokeStyle = this.ph ? '#fff' : C.text; cx.fillStyle = this.ph ? '#fff' : C.text; cx.lineWidth = Math.max(2, s * 1.3); const ex = ax + Math.sin(th) * len, ey = ay - Math.cos(th) * len, sx = ax - Math.sin(th) * len, sy = ay + Math.cos(th) * len; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(ex, ey); cx.stroke(); cx.beginPath(); cx.moveTo(ex, ey); cx.lineTo(ex - Math.sin(th - .5) * len * .45, ey + Math.cos(th - .5) * len * .45); cx.lineTo(ex - Math.sin(th + .5) * len * .45, ey + Math.cos(th + .5) * len * .45); cx.closePath(); cx.fill(); cx.font = `500 ${Math.max(11, s * 5.8)}px "IBM Plex Sans",sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'top'; cx.fillText(`ветер ${U.dirShort(w.from)}, ${String(w.u).replace('.', ',')} м/с`, ax, ay + len + 6); cx.textAlign = 'left' }
    // вспышки «показать на карте»
    this.flashes = this.flashes.filter(f => { f.n++; cx.strokeStyle = C.accent; cx.lineWidth = Math.max(2, s * 1.5); cx.globalAlpha = Math.max(0, 1 - f.n / 70); cx.beginPath(); cx.arc(this.X(f.x), this.Y(f.y), s * (14 + (f.n % 24) * .8), 0, 7); cx.stroke(); cx.globalAlpha = 1; if (f.label) { cx.font = `600 ${Math.max(12, s * 6.5)}px "IBM Plex Sans",sans-serif`; cx.fillStyle = C.text; cx.fillText(f.label, this.X(f.x) + s * 20, this.Y(f.y) - s * 18) } return f.n < 90 });
    if (this.clockEl && sim) this.clockEl.textContent = mmss(sim.t);
    if (this.o.after) this.o.after(cx, this);
  }
}
const LEGEND_PEOPLE = () => `<span class="leg"><i style="background:var(--p-wait)"></i>не начали</span><span class="leg"><i style="background:var(--p-move)"></i>идут</span><span class="leg"><i style="background:var(--p-queue)"></i>очередь на ПС</span><span class="leg"><i style="background:var(--p-reg)"></i>отметились</span><span class="leg"><i style="background:var(--p-camp)"></i>в городке</span><span class="leg"><i style="background:var(--p-inc)"></i>не выйдут сами</span>`;

// ---------- оболочка и роутер
const NAV = [
  { g: null, items: [['overview', 'Обзор проекта', 'overview']] },
  { g: 'Подготовка', items: [['site', 'Площадка', 'site', 'site'], ['population', 'Население', 'people', 'pop'], ['scenarios', 'Сценарии аварий', 'scen', 'scen'], ['pla', 'ПЛА и меры', 'pla']] },
  { g: 'Расчёт', items: [['sim', 'Симуляция', 'sim'], ['batch', 'Пакетные прогоны', 'batch'], ['staff', 'ИИ-штаб', 'staff']] },
  { g: 'Учения', items: [['trainer', 'Тренажёр штаба', 'trainer'], ['drill', 'Сверка с учением', 'drill']] },
  { g: 'Результаты', items: [['reports', 'Отчёты', 'reports'], ['briefing', 'Инструктаж подрядчиков', 'brief']] },
];
// какие экраны открыты роли (остальные показаны с замком)
const ACCESS = { eng: '*', pla: '*', boss: ['overview', 'site', 'population', 'scenarios', 'pla', 'sim', 'batch', 'staff', 'drill', 'reports', 'briefing'], staff: ['overview', 'trainer', 'staff', 'sim'], contr: ['overview', 'briefing'], admin: ['overview', 'admin'] };
const allowed = id => { const a = ACCESS[Store.s.user.role]; return a === '*' ? id !== 'admin' || false : a.includes(id) };
const Screens = {};
const Shell = {
  cur: null, onTheme: new Set(), cleanup: null,
  init() {
    this.renderNav(); this.renderTop();
    window.addEventListener('hashchange', () => this.route());
    $('#menuBtn').onclick = () => this.side(true); $('#searchBtn').onclick = () => Palette.open();
    $('#themeBtn').onclick = () => this.setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    $('#userBtn').onclick = e => this.roleMenu(e.currentTarget, true);
    $('#llmBtn').onclick = () => location.hash = '#/admin/integrations';
    $('#projBtn').onclick = e => UI.menu(e.currentTarget, [{ head: 'Проекты площадки' }, { label: 'Ремонт АВТ-3 · 2026', note: 'текущий', check: true, run: () => { } }, { label: 'Учение ГФУ · весна 2027', note: 'черновик', check: false, run: () => UI.toast('Проект «Учение ГФУ» в демо не наполнен') }, '-', { label: 'Площадка v' + Store.s.site.version + ' · история версий', icon: 'site', run: () => location.hash = '#/site' }]);
    document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); Palette.open() } });
    Store.on(() => { this.renderNav(); this.renderTop() }); API.subs.add(() => { }); Pool.listeners.add(() => this.renderNavCounts());
    this.route();
  },
  side(open) { $('#side').classList.toggle('open', open); UI.scrim(open, () => this.side(false)) },
  setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('s1.theme', t) } catch (e) { } this.renderTop(); this.onTheme.forEach(f => f()); if (this.cur) this.rerender() },
  rerender() { const v = this.cur; if (Screens[v.id] && Screens[v.id].retheme) Screens[v.id].retheme(); else this.route(true) },
  renderNav() {
    const cur = (location.hash.match(/^#\/([^/]+)/) || [])[1] || 'overview';
    $('#nav').innerHTML = NAV.map(g => (g.g ? `<div class="nav-g">${g.g}</div>` : '') + g.items.map(([id, label, icon]) => { const ok = allowed(id); return `<a href="#/${id}" data-id="${id}" ${cur === id ? 'aria-current="page"' : ''} class="${ok ? '' : 'locked'}">${ic(icon)}<span>${label}</span>${ok ? `<span class="cnt" data-cnt="${id}"></span>` : `<span class="lk">${ic('lock')}</span>`}</a>` }).join('')).join('');
    $('#sideFoot').innerHTML = `<div class="nav"><a href="#/admin" data-id="admin" ${cur === 'admin' ? 'aria-current="page"' : ''} class="${allowed('admin') || Store.s.user.role === 'eng' ? '' : 'locked'}">${ic('admin')}<span>Администрирование</span></a><a href="#" id="tourBtn">${ic('tour')}<span>Демо-тур для жюри</span></a></div>`;
    $('#tourBtn').onclick = e => { e.preventDefault(); this.side(false); Tour.start() };
    $$('#nav a, #sideFoot a').forEach(a => a.addEventListener('click', () => this.side(false)));
    this.renderNavCounts(); requestAnimationFrame(() => $$('.nav a[aria-current] span:not(.cnt):not(.lk)').forEach(s => s.parentElement.style.setProperty('--lw', s.offsetWidth + 'px')));
  },
  renderNavCounts() { const S = Store.s; const set = (id, v, hot) => { const e = $(`[data-cnt="${id}"]`); if (e) { e.textContent = v || ''; e.classList.toggle('hot', !!hot) } }; const run = S.batches.filter(b => b.status === 'считается' || b.status === 'в очереди').length; set('batch', run ? run + ' в работе' : ''); const rev = Object.values(S.approvals).filter(a => a.st === 'review').length; set('pla', Store.s.user.role === 'boss' && rev ? rev + ' на согласовании' : '', Store.s.user.role === 'boss') },
  renderTop() {
    const dark = document.documentElement.dataset.theme === 'dark'; $('#themeBtn').innerHTML = ic(dark ? 'sun' : 'moon'); $('#themeBtn').setAttribute('aria-label', dark ? 'Светлая тема' : 'Тёмная тема'); $('#themeBtn').title = dark ? 'Светлая тема' : 'Тёмная тема «ситуационный центр»';
    const m = Store.s.settings.llm; $('#llmBtn').innerHTML = `<span class="dot ${m.mode === 'off' ? 'off' : m.mode === 'endpoint' ? 'ok' : 'warn'}"></span><span class="lbl">${esc(Agent.label())}</span>`;
    const u = Store.me(); const hue = { eng: 190, pla: 150, boss: 30, staff: 210, contr: 20, admin: 260 - 60 }[u.role] || 190;
    $('#userBtn').innerHTML = `<span class="ava" style="background:hsl(${hue} 45% ${dark ? 25 : 90}%);color:hsl(${hue} 50% ${dark ? 85 : 25}%)">${esc(u.name.split(' ').pop()[0] + u.name[0])}</span><span class="user-t"><b>${esc(u.name)}</b><span>${esc(ROLES[u.role].name)}</span></span>${ic('chev')}`;
  },
  roleMenu(anchor, right) { UI.menu(anchor, [{ head: 'Войти под ролью (SSO, демо)' }, ...Object.entries(ROLES).map(([id, r]) => ({ label: r.name, note: r.note, check: Store.s.user.role === id, run: () => { Store.s.user.role = id; Store.audit('Вход', 'SSO Keycloak', 'роль: ' + r.name); Store.save(); UI.toast('Вы вошли как «' + r.name + '»'); this.route(true) } })), '-', { label: 'Сбросить демо-данные', icon: 'reset', run: async () => { if (await UI.confirm('Вернуть проект к исходному состоянию? Ваши прогоны, пакеты и изменения будут удалены из браузера.', 'Сбросить', true)) { Store.reset(); location.hash = '#/overview'; this.route(true); UI.toast('Демо-данные восстановлены') } } }], { right }) },
  route(force) {
    const h = location.hash || '#/overview'; const parts = h.slice(2).split('/'); const id = parts[0] || 'overview';
    if (!force && this.cur && this.cur.h === h) return;
    if (this.cleanup) { try { this.cleanup() } catch (e) { } this.cleanup = null }
    UI.closeMenu(); this.cur = { id, h, args: parts.slice(1) }; this.renderNav();
    const el = $('#view'); const scr = Screens[id] || Screens.overview;
    const navItem = NAV.flatMap(g => g.items).find(i => i[0] === id); $('#topTitle').textContent = navItem ? navItem[1] : id === 'admin' ? 'Администрирование' : '';
    document.title = (navItem ? navItem[1] : id === 'admin' ? 'Администрирование' : 'Обзор') + ' · Полигон эвакуации НПЗ';
    const ok = id === 'admin' ? (Store.s.user.role === 'admin' || Store.s.user.role === 'eng') : allowed(id);
    if (!ok) { UI.locked(el, scr.need || ''); return }
    el.scrollTop = 0; Musters.apply(); const r = scr.render(el, this.cur.args); if (typeof r === 'function') this.cleanup = r;
  },
};

// ---------- палитра команд (Ctrl K)
const Palette = {
  open() {
    if ($('.palette')) return; const p = document.createElement('div'); p.className = 'palette'; p.setAttribute('role', 'dialog');
    const items = [...NAV.flatMap(g => g.items).map(([id, l, icn]) => ({ l, k: 'экран', icn, go: () => location.hash = '#/' + id })), { l: 'Администрирование', k: 'экран', icn: 'admin', go: () => location.hash = '#/admin' },
    ...Scen.all().map(s => ({ l: 'Открыть прогон: ' + s.name, k: s.id, icn: 'sim', go: () => location.hash = '#/sim/' + s.id + '/asis' })),
    { l: 'Новый пакетный прогон', k: 'действие', icn: 'batch', go: () => location.hash = '#/batch/new' }, { l: 'Начать настольное учение', k: 'действие', icn: 'trainer', go: () => location.hash = '#/trainer' }, { l: 'Подобрать параметры по учению', k: 'действие', icn: 'drill', go: () => location.hash = '#/drill' }, { l: 'Выпустить отчёт', k: 'действие', icn: 'reports', go: () => location.hash = '#/reports' }, { l: 'Проверить связность графа путей', k: 'действие', icn: 'site', go: () => location.hash = '#/site/graph' }, { l: 'Недели ремонта: как меняется риск', k: 'действие', icn: 'site', go: () => location.hash = '#/site/weeks' }, { l: 'Демо-тур для жюри', k: 'действие', icn: 'tour', go: () => Tour.start() }, { l: 'Переключить тему', k: 'действие', icn: 'moon', go: () => $('#themeBtn').click() }, { l: 'Журнал аудита', k: 'экран', icn: 'shield', go: () => location.hash = '#/admin/audit' }];
    p.innerHTML = `<input type="text" placeholder="Экран, сценарий или действие" aria-label="Поиск"><div class="res" role="listbox"></div>`;
    const inp = $('input', p), res = $('.res', p); let sel = 0, list = items;
    const draw = () => { const q = inp.value.trim().toLowerCase(); list = items.filter(i => !q || i.l.toLowerCase().includes(q) || i.k.toLowerCase().includes(q)).slice(0, 12); sel = Math.min(sel, list.length - 1); res.innerHTML = list.map((i, n) => `<button type="button" role="option" data-n="${n}" aria-selected="${n === sel}">${ic(i.icn)}<span>${esc(i.l)}</span><span class="k">${esc(i.k)}</span></button>`).join('') || '<p class="note" style="padding:10px">Ничего не найдено.</p>' };
    const close = () => { p.remove(); UI.scrim(false) }; const go = n => { const it = list[n]; close(); if (it) it.go() };
    inp.oninput = () => { sel = 0; draw() }; inp.onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(list.length - 1, sel + 1); draw(); e.preventDefault() } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault() } else if (e.key === 'Enter') go(sel); else if (e.key === 'Escape') close() };
    res.onclick = e => { const b = e.target.closest('[data-n]'); if (b) go(+b.dataset.n) };
    UI.scrim(true, close); UI.layer().appendChild(p); draw(); inp.focus();
  },
};

// ---------- демо-тур по рабочему циклу
const Tour = {
  steps: [
    { h: '#/overview', sel: '#ovFinding', t: 'Главный вывод', p: 'На синтетической площадке 1 600 человек. ПЛА «как написан» на 30-й минуте не досчитывается 210 человек, с семью правками — 24, с правками и ИИ-штабом — 7. Все цифры посчитаны движком симуляции, а не введены вручную.' },
    { h: '#/site', sel: '#siteMap', t: '1 · Площадка', p: 'Генплан с ограждениями ремонта и датами их действия. Красный пунктир — закрытые участки. Нажмите на ограждение, чтобы снять его, и система пересчитает граф путей.' },
    { h: '#/site/graph', sel: '#graphTable', t: 'Проверка связности', p: 'Система сама находит зоны с единственным выходом. Ограждение АВТ-3 оставляет один выход шириной 6 м — это первое узкое место ПЛА.' },
    { h: '#/population', sel: '#popKpis', t: '2 · Люди', p: 'Население собирается из нарядов e-PTW и СКУД. ФИО и ИИН отбрасываются при импорте, табельные номера заменяются хешем.' },
    { h: '#/scenarios/SC3', sel: '#scPreview', t: '3 · Сценарий', p: 'Источник, ветер, класс устойчивости и смена ветра. Превью показывает облако на выбранной минуте и дальность зон AEGL-2 и AEGL-3.' },
    { h: '#/sim/SC1/asis', sel: '#simMap', t: '4 · Симуляция', p: 'Нажмите «Пуск». Облако идёт на ПС-3, закреплённый за Клаусом по ПЛА: люди сами приходят в газ. Внизу — минутная полоса с событиями и решениями штаба.' },
    { h: '#/pla', sel: '#measTable', t: '5 · Правки ПЛА', p: 'Каждая мера считается отдельно на тех же людях и погоде. Видно, какие окупаются, а какие без других мер вредят.' },
    { h: '#/batch', sel: '#batchHeat', t: '6 · Все погоды', p: 'Пакет перебирает 8 направлений ветра и 3 класса устойчивости. Расчёт идёт по-настоящему: на этой странице можно запустить свой пакет — его считают вычислители браузера.' },
    { h: '#/staff', sel: '#staffJournal', t: '7 · ИИ-штаб', p: 'В точках 2, 5, 9, 14 и 20 минут агенты РЛА, ГСО, учёта и подрядчиков получают доклады и отдают команды только из закрытого списка. Чужие команды отбрасываются и пишутся в журнал.' },
    { h: '#/trainer', sel: '#trStart', t: '8 · Тренажёр', p: 'Штаб садится на место агентов: доклады приходят по ходу модели, команды отдаются тем же списком. После учения — разбор против ПЛА и ИИ-штаба.' },
    { h: '#/drill', sel: '#drillTable', t: '9 · Сверка с учением', p: 'Модель принимается, только если воспроизводит хронометраж учения с расхождением не более 15%. Подбор параметров считается здесь же.' },
    { h: '#/reports', sel: '#repPreview', t: '10 · Отчёт', p: 'PDF или DOCX на русском или казахском: узкие места, правки с вкладом, итоги по погодам и обязательный блок ограничений модели.' },
  ],
  start(i = 0) { this.i = i; this.show() },
  stop() { $('.tour')?.remove(); $('.tour-ring')?.remove() },
  async show() {
    this.stop(); const s = this.steps[this.i]; if (!s) return; if (location.hash !== s.h) { location.hash = s.h; await U.sleep(450) }
    let el = $(s.sel); for (let n = 0; !el && n < 10; n++) { await U.sleep(150); el = $(s.sel) }
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); await U.sleep(320);
    const ring = document.createElement('div'); ring.className = 'tour-ring'; const box = document.createElement('div'); box.className = 'tour'; box.setAttribute('role', 'dialog');
    box.innerHTML = `<h3>${s.t}</h3><p>${s.p}</p><div class="tf"><span>${this.i + 1} из ${this.steps.length}</span><div class="actions"><button class="btn sm" type="button" data-a="x">Закрыть</button>${this.i ? '<button class="btn sm" type="button" data-a="b">Назад</button>' : ''}<button class="btn sm primary" type="button" data-a="n">${this.i === this.steps.length - 1 ? 'Готово' : 'Дальше'}</button></div></div>`;
    document.body.append(ring, box);
    const place = () => { if (!el) { box.style.left = '50%'; box.style.top = '30%'; box.style.transform = 'translateX(-50%)'; ring.style.display = 'none'; return } const r = el.getBoundingClientRect(); const pad = 6; Object.assign(ring.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: Math.min(r.height, innerHeight - 40) + pad * 2 + 'px' }); const bw = box.offsetWidth, bh = box.offsetHeight; let top = r.bottom + 14; if (top + bh > innerHeight - 10) top = Math.max(10, r.top - bh - 14); if (top < 10 || r.height > innerHeight * .6) top = innerHeight - bh - 20; box.style.top = top + 'px'; box.style.left = Math.max(10, Math.min(innerWidth - bw - 10, r.left)) + 'px' };
    place(); this._p = place; addEventListener('resize', place); $('#view').addEventListener('scroll', place, { passive: true });
    box.onclick = e => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return; removeEventListener('resize', place); if (a === 'x') return this.stop(); if (a === 'b') this.i--; else this.i++; if (this.i >= this.steps.length) { this.stop(); UI.toast('Тур закончен. Все экраны доступны из меню слева.'); return } this.show() };
    box.querySelector('[data-a="n"]').focus();
  },
};
