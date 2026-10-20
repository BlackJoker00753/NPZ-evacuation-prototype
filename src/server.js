// «Бэкенд» прототипа: хранилище проекта, API по маршрутам ТЗ, пул вычислителей (Web Workers),
// агент штаба, проверка связности, импорт/экспорт файлов. Всё работает в браузере, без сети.
const L = SIMLIB, SH = SHTAB;
const VER = { core: 'core 0.9.3', staff: 'staff-prompt v4', web: 'web 0.9.3', schema: 'cmd-schema v2' };
const TEND = 1800, DPTS = SH.DPTS;

// ---------- утилиты
const U = {
  esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  nf: (n, d = 0) => n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }),
  pct: (v, d = 0) => v == null ? '—' : (v * 100).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%',
  mmss: t => { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') },
  sleep: ms => new Promise(r => setTimeout(r, ms)),
  clone: o => JSON.parse(JSON.stringify(o)),
  hash(str, seed = 0x811c9dc5) { let h = seed >>> 0; str = String(str); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16).padStart(8, '0') },
  stamp(d = new Date()) { const p = n => String(n).padStart(2, '0'); return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}` },
  dateRu(iso) { if (!iso) return '—'; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}.${m}.${y}` },
  plural(n, a, b, c) { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c },
  download(name, data, type = 'text/plain;charset=utf-8') { const blob = data instanceof Blob ? data : new Blob([data], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 500) },
  readDataURL: f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f) }),
  readFile: (f, as = 'text') => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; as === 'buf' ? r.readAsArrayBuffer(f) : r.readAsText(f, 'utf-8') }),
  dirName: d => ['северный', 'северо-восточный', 'восточный', 'юго-восточный', 'южный', 'юго-западный', 'западный', 'северо-западный'][Math.round(((d % 360) + 360) % 360 / 45) % 8],
  dirShort: d => ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'][Math.round(((d % 360) + 360) % 360 / 45) % 8],
};
const ZN = z => (L.ZONES[z] || {}).name || z;

// ---------- роли и права (раздел «Пользователи, роли и сценарии» ТЗ)
const ROLES = {
  eng: { name: 'Инженер ПБиОТ', note: 'владелец модели', perms: ['site', 'pop', 'scen', 'pla', 'run', 'batch', 'report', 'drill', 'trainer', 'brief'] },
  pla: { name: 'Разработчик ПЛА', note: 'правила и меры', perms: ['pla', 'scen', 'run', 'batch', 'report', 'brief'] },
  boss: { name: 'Руководитель ремонта', note: 'просмотр и согласование', perms: ['approve', 'report.view'] },
  staff: { name: 'Участник штаба', note: 'тренажёр', perms: ['trainer'] },
  contr: { name: 'Представитель подрядчика', note: 'свои зоны', perms: ['brief.own'] },
  admin: { name: 'Администратор', note: 'учётные записи и аудит', perms: ['admin'] },
};
const can = p => { const r = ROLES[Store.s.user.role]; return !!r && (r.perms.includes(p) || (p === 'report.view' && r.perms.includes('report'))) };

// ---------- исходное состояние проекта (синтетика)
function seedState() {
  const closuresDates = { 'П-2': ['2026-11-02', '2026-11-22', 'Леса для ремонта эстакады Э-1'], 'АВТ-З': ['2026-11-02', '2026-12-13', 'Ограждение ремонтной зоны АВТ-3'], 'АВТ-С': ['2026-11-02', '2026-12-13', 'Ограждение ремонтной зоны АВТ-3'], 'АВТ-В': ['2026-11-02', '2026-12-13', 'Ограждение ремонтной зоны АВТ-3'], 'АВТ-Ю': ['2026-11-02', '2026-12-13', 'Ограждение АВТ-3, один выход 6 м'], 'П-6': ['2026-11-09', '2026-12-06', 'Склад материалов у Э-2'] };
  const runs = [], add = (id, sc, st, at, by) => { const f = PRE[sc].runs[st].f; runs.push({ id, sc, st, seed: SCEN.find(x => x.id === sc).P.seed, at, by, code: VER.core, params: U.hash(sc + st + 'v3'), status: 'готов', f, src: 'архив' }) };
  let n = 131; const days = ['2026-10-12 14:20', '2026-10-13 09:05', '2026-10-14 16:42', '2026-10-15 11:18', '2026-10-16 10:02', '2026-10-17 15:31', '2026-10-19 09:47'];
  ['SC1', 'SC2', 'SC3', 'SC4'].forEach((sc, i) => ['asis', 'fixed', 'shtab', 'fixshtab'].forEach((st, j) => add('RUN-0' + (n++), sc, st, days[(i * 2 + j) % days.length], j % 2 ? 'Д. Ахметова' : 'А. Сейткали')));
  add('RUN-0' + (n++), 'SC3', 'roles', '2026-10-19 11:24', 'А. Сейткали');
  return {
    v: 3,
    user: { role: 'eng' },
    users: [
      { id: 'u1', name: 'А. Сейткали', role: 'eng', org: 'НПЗ «Демо», служба ПБиОТ', last: '20.10.2026 08:52', on: true },
      { id: 'u2', name: 'Д. Ахметова', role: 'pla', org: 'НПЗ «Демо», служба ПБиОТ', last: '19.10.2026 17:10', on: true },
      { id: 'u3', name: 'Р. Жумабаев', role: 'boss', org: 'Штаб ремонта АВТ-3', last: '17.10.2026 12:30', on: true },
      { id: 'u4', name: 'Е. Кудайбергенов', role: 'staff', org: 'Начальник смены (РЛА)', last: '12.10.2026 10:00', on: true },
      { id: 'u5', name: 'М. Оспанов', role: 'staff', org: 'Газоспасательная служба', last: '12.10.2026 10:00', on: true },
      { id: 'u6', name: 'Н. Тлеубаев', role: 'contr', org: 'ТОО «Монтаж-Демо»', last: '16.10.2026 09:14', on: true, zones: ['AVT', 'RACK'] },
      { id: 'u7', name: 'И. Ким', role: 'admin', org: 'ДИТ ДЗО', last: '20.10.2026 08:10', on: true },
    ],
    project: { id: 'PRJ-2026-03', name: 'Ремонт АВТ-3 · 2026', site: 'НПЗ «Демо»', mvpStart: '2026-08-03', repairStart: '2026-11-02', repairWeeks: 6 },
    site: { id: 'SITE-01', name: 'НПЗ «Демо», южная площадка', version: 3, crs: 'Местная СК площадки, метры', cell: 2, source: 'genplan_npz_demo_v3.dxf', imported: '12.08.2026 10:41', by: 'А. Сейткали', size: '640 × 420 м', history: [{ v: 1, at: '05.08.2026', note: 'Генплан из PDF, оцифровка вручную' }, { v: 2, at: '07.08.2026', note: 'Ширины проходов под эстакадами по замерам' }, { v: 3, at: '12.08.2026', note: 'DXF от ПТО, ограждения ремонта АВТ-3' }] },
    closures: L.CLOSURES.map(c => ({ id: c.id, name: c.name, from: closuresDates[c.id][0], to: closuresDates[c.id][1], why: closuresDates[c.id][2] })),
    plaMap: { ...L.PLA_MAP },
    pla: { alarmT: 45, regRate: 0.6, reserve: false, tiso: 15, version: 'ПЛА-2024 ред. 3', doc: 'PLA_NPZ_demo_2024_r3.docx' },
    population: { source: 'eptw_turnaround_2025-04.csv · skud_2025-04.csv', imported: '19.08.2026 15:02', rows: 1601, hour: 10, zoneCounts: null, removed: ['ФИО', 'ИИН'], hashed: ['Табельный №'] },
    custom: [],
    strategies: [],
    runs,
    batches: [
      { id: 'B-0007', name: 'Клаус и АВТ-3 × 24 погоды × 2 стратегии', created: '18.10.2026 22:00', done: '19.10.2026 02:14', n: 96, status: 'готов', src: 'wx', by: 'А. Сейткали', workers: 6 },
      { id: 'B-0008', name: '4 сценария × 4 стратегии × 20 наборов людей', created: '19.10.2026 22:00', done: '20.10.2026 03:41', n: 320, status: 'готов', src: 'seeds', by: 'А. Сейткали', workers: 6 },
    ],
    drills: [{ id: 'DR-01', date: '14.05.2026', name: 'Учебная тревога, южная площадка', src: 'Архив СКУД и хронометраж ПС-1…ПС-4', rows: PRE._drill.rows.map(r => ({ metric: r[0], fact: r[1], time: r[3] })) }],
    calib: { rtMed: 55, regMul: 1, at: '28.08.2026', by: 'А. Сейткали', maxErr: 0.10, drill: 'DR-01' },
    approvals: { wind: { st: 'ok', by: 'Р. Жумабаев', at: '14.10.2026' }, ereg: { st: 'ok', by: 'Р. Жумабаев', at: '14.10.2026' }, camp: { st: 'ok', by: 'Р. Жумабаев', at: '15.10.2026' }, exits: { st: 'review' }, alert: { st: 'review' }, hoods: { st: 'review' }, iso: { st: 'review' } },
    trainer: [],
    reports: [],
    audit: [
      { t: '12.08.2026 10:41', who: 'А. Сейткали', act: 'Импорт генплана', obj: 'SITE-01 v3', det: 'genplan_npz_demo_v3.dxf, 14 слоёв, граф 33 600 клеток' },
      { t: '19.08.2026 15:02', who: 'А. Сейткали', act: 'Импорт населения', obj: 'e-PTW + СКУД', det: 'удалено: ФИО, ИИН; хешировано: табельный №; 1 601 агент' },
      { t: '28.08.2026 11:20', who: 'А. Сейткали', act: 'Калибровка', obj: 'DR-01', det: 'медиана реакции 55 с, отметка 0,6 чел/с, макс. расхождение 10%' },
      { t: '14.10.2026 12:05', who: 'Р. Жумабаев', act: 'Согласование мер', obj: 'ПЛА-2024 ред. 3', det: 'ПС по ветру, электронная отметка' },
      { t: '19.10.2026 02:14', who: 'система', act: 'Пакет выполнен', obj: 'B-0007', det: '96 вариантов, 6 вычислителей, 3 ч 52 мин' },
      { t: '20.10.2026 03:41', who: 'система', act: 'Пакет выполнен', obj: 'B-0008', det: '320 вариантов, 6 вычислителей, 5 ч 41 мин' },
    ],
    settings: { llm: { mode: 'emulator', endpoint: 'http://llm.npz.local:8000/v1', model: 'Qwen3-32B-Instruct' }, backupAt: '20.10.2026 03:00' },
    seq: { run: n, batch: 9, report: 1, trainer: 1, scen: 5 },
  };
}

// ---------- хранилище
const Store = {
  key: 's1.db.v3', s: null, subs: new Set(),
  init() { try { const raw = localStorage.getItem(this.key); this.s = raw ? JSON.parse(raw) : null } catch (e) { this.s = null } if (!this.s || this.s.v !== 3) this.s = seedState(); this.save(true) },
  save(silent) { try { localStorage.setItem(this.key, JSON.stringify(this.s)) } catch (e) { } if (!silent) this.subs.forEach(f => f()) },
  reset() { this.s = seedState(); this.save() },
  on(f) { this.subs.add(f); return () => this.subs.delete(f) },
  me() { return this.s.users.find(u => u.role === this.s.user.role) || this.s.users[0] },
  audit(act, obj, det) { const u = this.me(); this.s.audit.unshift({ t: U.stamp(), who: u.name, role: ROLES[u.role].name, act, obj, det }); this.s.audit = this.s.audit.slice(0, 400) },
  next(k, pad, prefix) { const n = this.s.seq[k]++; return prefix + String(n).padStart(pad, '0') },
};

// ---------- пункты сбора: расстановка площадки и своя у сценария
const Musters = {
  site() { return Store.s.musterPos || {} },
  of(scId) { const sc = Scen.get(scId); return Object.assign({}, this.site(), (sc && sc.P.musterPos) || {}) },
  apply(pos) { L.setMusters(pos || this.site()) },
  moved(pos) { pos = pos || this.site(); return Object.keys(pos).some(id => { const h = L.MUSTER_HOME.find(m => m.id === id); return h && (Math.abs(h.x - pos[id].x) > .5 || Math.abs(h.y - pos[id].y) > .5) }) },
  // куда можно поставить ПС: проходимая клетка вне установок, зданий и резервуарного парка, не у края площадки
  grid: null,
  why(x, y) {
    if (x < 8 || y < 8 || x > L.W - 8 || y > L.H - 8) return 'слишком близко к границе площадки';
    const inR = r => x >= r[0] - 4 && x <= r[2] + 4 && y >= r[1] - 4 && y <= r[3] + 4;
    const u = L.UNITS.find(u => inR(u.r)); if (u) return 'внутри установки «' + u.name + '»';
    if (inR(L.TANKFARM)) return 'в резервуарном парке';
    const b = L.BUILD.find(b => inR(b.r)); if (b) return 'в здании «' + b.name + '»';
    this.grid = this.grid || L.buildGrid([]); if (!this.grid.walk[Math.floor(y / L.CELL) * L.GW + Math.floor(x / L.CELL)]) return 'на эстакаде или непроходимом участке';
    return null;
  },
  note(where) { return this.moved() ? `<div class="notice info">${ic('pin')}<span><b>Пункты сбора перенесены.</b> ${where || 'Готовые итоги демо посчитаны для исходной расстановки.'} Новые прогоны, пакеты и вклад мер считаются с вашей.</span></div>` : '' },
};

// ---------- сценарии: готовые + свои
const Scen = {
  all() { return SCEN.map(s => ({ ...s, builtin: true })).concat(Store.s.custom) },
  get(id) { return this.all().find(s => s.id === id) },
  // параметры с учётом правил ПЛА проекта, закрепления и калибровки
  params(id, over) { const sc = this.get(id); const P = U.clone(sc.P); const mp = Musters.of(id); if (Object.keys(mp).length) P.musterPos = mp; else delete P.musterPos; P.plaMap = { ...Store.s.plaMap }; P.rtMed = Store.s.calib.rtMed; P.regMul = Store.s.calib.regMul; const pl = Store.s.pla; if (pl.regRate !== 0.6 || pl.reserve) P.sOver = Object.assign(pl.reserve ? { reserve: true } : {}, pl.regRate !== 0.6 ? { regRate: pl.regRate } : {}); if (pl.tiso !== 15 && P.tiso == null) P.tiso = pl.tiso * 60; if (pl.alarmT !== 45) P.alarmT = pl.alarmT; if (Store.s.population.zoneCounts && !over?.keepPeople) { P.zoneCounts = { ...Store.s.population.zoneCounts }; P.people = Object.values(P.zoneCounts).reduce((a, b) => a + b, 0) + 164 } return Object.assign(P, over || {}) },
  hazardText(P) { return P.hazard === 'fire' ? `пожар ${P.fire.hrr} МВт` : `H₂S ${String(P.Q).replace('.', ',')} кг/с` },
};
const STRATS = [
  { id: 'asis', name: 'ПЛА как написан', sub: 'правила, без штаба', staff: 'none' },
  { id: 'fixed', name: 'ПЛА с правками', sub: '7 мер, без штаба', staff: 'none' },
  { id: 'shtab', name: 'Штаб-агенты', sub: 'поверх ПЛА как написан', staff: 'single' },
  { id: 'fixshtab', name: 'Правки + штаб', sub: 'штаб поверх правок', staff: 'single' },
  { id: 'roles', name: 'Штаб из ролей', sub: 'неполная информация', staff: 'roles' },
];
const stratName = id => (STRATS.find(s => s.id === id) || Store.s.strategies.find(s => s.id === id) || { name: id }).name;
// записанные решения штаба (агенты Claude, 19.10.2026)
function recDecisions(scId, st) { const kind = st === 'fixshtab' ? 'fix' : st; const src = ((REC[kind] || {})[scId]) || []; return src.map((r, i) => ({ t: DPTS[i] + 45, k: i, actions: SH.clean(r.resp, L), resp: r.resp, prompt: r.prompt, roles: r.roles, src: 'rec' })) }
const hasRec = (scId, st) => recDecisions(scId, st).length >= 5;
function simStrat(st) { return st === 'fixed' || st === 'fixshtab' ? st : st === 'asis' ? 'asis' : st === 'roles' || st === 'shtab' ? 'shtab' : (Store.s.strategies.find(x => x.id === st) ? { measures: Store.s.strategies.find(x => x.id === st).measures } : 'asis') }

// ---------- сводка прогона (та же функция работает в вычислителе)
const SUMMARIZE_SRC = `function summarize(s,want){want=want||{};const smp=s.samples.map(a=>[a.t,+a.pct.toFixed(4),a.unacc,a.cloud,a.exp2,a.inc,a.queued,a.notStarted]);const at=T=>s.samples.find(a=>a.t>=T)||s.samples[s.samples.length-1];const m=s.metrics();const q=s.queues();const tq=x=>{const a=s.samples.find(a=>a.pct>=x);return a?a.t:null};
const out={f:{t95:tq(.95),t50:tq(.5),t80:tq(.8),p10:at(600).pct,u15:at(900).unacc,u30:m.unacc,cloud:m.cloud,exp2:m.exp2,inc:m.inc,maxq:q.length?q[0].max:0,maxqId:q.length?q[0].id:null,left:m.left,camp:m.camp,listN:s.listN,ppl:s.ppl.length},bn:s.bottlenecks(6),q};
if(want.samples)out.s=smp; if(want.ps){out.ps={};SIMLIB.MUSTER.forEach(mm=>{out.ps[mm.id]=Math.round(SIMLIB.conc(s.P,600,s.tiso,mm.x,mm.y))})} if(want.events)out.events=s.events.slice(0,200); return out}`;
const summarize = new Function('SIMLIB', SUMMARIZE_SRC + ';return summarize')(SIMLIB);
function execJob(job) { const s = new L.Sim(job.P, job.strat, job.decisions || []); s.runTo(job.T || TEND); return summarize(s, job.want) }

// ---------- пул вычислителей (в промышленной версии — Celery + Redis)
const Pool = {
  ws: [], q: [], live: new Map(), n: 0, seq: 0, ok: false, listeners: new Set(),
  init() {
    const n = Math.max(2, Math.min(6, (navigator.hardwareConcurrency || 4) - 1));
    try {
      const src = document.getElementById('src-engine').textContent + '\n' + SUMMARIZE_SRC + `\nonmessage=e=>{if(e.data==='ping'){postMessage('pong');return}const {id,job}=e.data;try{const s=new SIMLIB.Sim(job.P,job.strat,job.decisions||[]);s.runTo(job.T||1800);postMessage({id,ok:true,r:summarize(s,job.want)})}catch(err){postMessage({id,ok:false,err:String(err&&err.message||err)})}}`;
      const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      for (let i = 0; i < n; i++) { const w = new Worker(url); w.idx = i; w.busy = null; w.onmessage = e => { if (e.data === 'pong') { w.alive = true; return } this.done(w, e.data) }; w.onerror = () => this.fallback(); this.ws.push(w) }
      this.ok = true; this.n = n;
      // рукопожатие: если вычислители не ответили (например, файл открыт с диска в строгом браузере), считаем в основном потоке
      this.ready = new Promise(res => { this.ws[0].postMessage('ping'); const t0 = Date.now(); const chk = () => { if (this.ws[0] && this.ws[0].alive) res(true); else if (Date.now() - t0 > 2500) { this.fallback(); res(false) } else setTimeout(chk, 50) }; chk() });
    } catch (e) { this.ok = false; this.n = 1; this.ready = Promise.resolve(false) }
  },
  fallback() { if (!this.ok) return; this.ok = false; this.n = 1; const back = [...this.live.values()]; this.live.clear(); this.ws.forEach(w => { try { w.terminate() } catch (e) { } w.busy = null }); this.q.unshift(...back); this.emit(); this.pump() },
  run(job, meta) { return new Promise((res, rej) => { const id = ++this.seq; this.q.push({ id, job, meta, res, rej }); (this.ready || Promise.resolve()).then(() => this.pump()) }) },
  pump() {
    if (!this.ok) { if (this._mt) return; const it = this.q.shift(); if (!it) return; this._mt = true; this.emit(); setTimeout(() => { try { it.res(execJob(it.job)) } catch (e) { it.rej(e) } this._mt = false; this.emit(); this.pump() }, 16); return }
    for (const w of this.ws) { if (w.busy || !this.q.length) continue; const it = this.q.shift(); w.busy = it; it.t0 = performance.now(); this.live.set(it.id, it); w.postMessage({ id: it.id, job: it.job }) }
    this.emit();
  },
  done(w, msg) { const it = this.live.get(msg.id); this.live.delete(msg.id); w.busy = null; if (it) { it.ms = performance.now() - it.t0; msg.ok ? it.res(Object.assign(msg.r, { ms: it.ms })) : it.rej(new Error(msg.err)) } this.pump() },
  cancel() { this.q.splice(0).forEach(it => it.rej(new Error('cancelled'))) },
  emit() { this.listeners.forEach(f => f()) },
  state() { return this.ok ? this.ws.map(w => ({ busy: !!w.busy, meta: w.busy && w.busy.meta })) : [{ busy: !!this._mt, meta: null }] },
};

// ---------- агент штаба
// Демо-агент на правилах повторяет формат ответа локальной LLM (Qwen3 на vLLM): доклады ролей,
// решение РЛА и команды только из закрытого списка, у каждой — обоснование. Подключение настоящей
// модели — в «Администрировании» (OpenAI-совместимый адрес vLLM внутри контура).
const Agent = {
  label() { const m = Store.s.settings.llm; return m.mode === 'endpoint' ? `${m.model} · vLLM` : m.mode === 'off' ? 'LLM отключена' : 'Демо-агент (эмулятор LLM)' },
  async decide(sim, sc, prev, opt = {}) {
    const t0 = performance.now(), mode = Store.s.settings.llm.mode, k = opt.k ?? 0;
    const prompt = opt.roles ? SH.rlaPrompt(sim, sc, L, prev, SH.noisy(sim, k, L), {}) : SH.prompt(sim, sc, L, prev);
    if (mode === 'off') return { resp: null, actions: [], prompt, ms: 0, err: 'LLM недоступна: решения по правилам ПЛА', model: this.label() };
    if (mode === 'endpoint') {
      try {
        const m = Store.s.settings.llm, ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 30000);
        const r = await fetch(m.endpoint.replace(/\/$/, '') + '/chat/completions', { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: m.model, temperature: 0.2, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }) });
        clearTimeout(to); const j = await r.json(); const txt = j.choices[0].message.content; const resp = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
        const actions = SH.clean(resp, L); return { resp, actions, rejected: (resp.actions || []).filter(a => !actions.includes(a)), prompt, ms: performance.now() - t0, model: this.label() };
      } catch (e) { return { resp: null, actions: [], prompt, ms: performance.now() - t0, err: 'LLM недоступна (' + (e.name === 'AbortError' ? 'тайм-аут 30 с' : 'нет ответа') + '): симуляция идёт по правилам ПЛА', model: this.label() } }
    }
    const resp = this.rules(sim, sc, prev, opt);
    await U.sleep(opt.fast ? 60 : 700 + Math.round(Math.random() * 900));
    const actions = SH.clean(resp, L);
    return { resp, actions, rejected: (resp.actions || []).filter(a => !actions.includes(a)), prompt, ms: performance.now() - t0, model: this.label() };
  },
  rules(sim, sc, prev, opt) {
    const t = sim.t, fire = sim.fire, R = opt.roles ? SH.noisy(sim, opt.k || 0, L) : sim.sitrep(), m = R.m;
    const done = new Set(prev.flatMap(d => (d.actions || []).map(a => a.type + ':' + (a.id || a.zone || a.building || ''))));
    const gas = mm => sim.C(mm.x, mm.y), heat = mm => sim.Qh(mm.x, mm.y, t);
    const bad = mm => gas(mm) > (fire ? 100 : 10) || heat(mm) > 2;
    const clean = (ex) => L.MUSTER.filter(mm => sim.musterOpen[mm.id] && !bad(mm) && gas(mm) < (fire ? 50 : 3) && !(ex || []).includes(mm.id));
    const nearest = (x, y, ex) => { let b = null, bd = 1e9; clean(ex).forEach(mm => { const d = Math.hypot(mm.x - x, mm.y - y); if (d < bd) { bd = d; b = mm } }); return b };
    const acts = [], why = [], closing = [];
    const sens = R.sens.filter(([n, v]) => !n.startsWith('ГЗ у') && typeof v === 'number' && v > (fire ? 50 : 10)).sort((a, b) => b[1] - a[1]);
    // 1. пункты сбора в облаке или в зоне жара
    L.MUSTER.forEach(mm => { if (!sim.musterOpen[mm.id] || !bad(mm)) return; const to = nearest(mm.x, mm.y, [mm.id]); closing.push(mm.id); acts.push({ type: 'muster_close', id: mm.id, to: to ? to.id : undefined, why: `у ${mm.id} ${Math.round(gas(mm))} ppm${heat(mm) > 2 ? ', жар ' + heat(mm).toFixed(1) + ' кВт/м²' : ''} — люди стоят в опасной зоне` }) });
    // 2. резервный пункт
    if (closing.length && !sim.musterOpen['ПС-6'] && !bad(L.MUSTER[5]) && !done.has('muster_open:ПС-6')) acts.push({ type: 'muster_open', id: 'ПС-6', why: 'закрыт пункт сбора, нужен резервный вне облака; регистраторы прибудут через 3 мин' });
    // 3. зоны, чей пункт закрыт или загазован
    Object.keys(sim.zoneTarget).filter(z => z !== 'OP' && z !== 'ADM').forEach(z => { const tg = sim.zoneTarget[z]; const mm = L.MUSTER.find(x => x.id === tg); const left = R.byZone[z] || 0; if (!mm || left < 8) return; if (closing.includes(tg)) return; if (sim.musterOpen[tg] && !bad(mm)) return; const Z = L.ZONES[z].r, to = nearest((Z[0] + Z[2]) / 2, (Z[1] + Z[3]) / 2, closing); if (to && !done.has('redirect:' + z)) acts.push({ type: 'redirect', zone: z, to: to.id, why: `${ZN(z)}: около ${left} человек идут на ${tg}, а он ${sim.musterOpen[tg] ? 'в опасной зоне' : 'закрыт'}` }) });
    // 4. отсечка
    if (sim.tiso > t + 200 && !done.has('isolate:')) acts.push({ type: 'isolate', why: fire ? 'горение продолжается, перекрыть подачу продукта и начать пенную атаку' : `утечка продолжается, по оценке операторов отсечение к ${U.mmss(sim.tiso)}` });
    // 5. городок подрядчиков
    const campN = sim.ppl.filter(p => p.state === 6 && !p.reg).length;
    if (campN > 5 && t >= 240 && !done.has('camp_check:')) acts.push({ type: 'camp_check', why: `в городке около ${Math.round(campN / 5) * 5} человек не отметились на ПС` });
    // 6. пострадавшие
    const inc = {}; sim.ppl.forEach(p => { if (p.state === 7) inc[p.zone] = (inc[p.zone] || 0) + 1 });
    const iz = Object.entries(inc).sort((a, b) => b[1] - a[1])[0];
    if (iz && !done.has('gso:' + iz[0])) acts.push({ type: 'gso', zone: iz[0], why: `сообщения о ${iz[1]} пострадавших в зоне ${ZN(iz[0])}` });
    // 7. невышедшие из аппаратов и с лесов
    const stuck = sim.ppl.filter(p => p.state === 0 && (p.zone === 'AVT' || p.zone === 'RACK')).length;
    if (stuck > 10 && t >= 280 && !done.has('announce:')) acts.push({ type: 'announce', text: 'Всем покинуть аппараты и леса, идти на пункт сбора поперёк ветра', why: `по докладам бригадиров не вышли около ${Math.round(stuck / 5) * 5} человек` });
    // 8. выброс внутри ограждения АВТ-3 — второй выход
    if (sim.P.source.x < 240 && sim.P.source.y > 210 && sim.closed.includes('АВТ-З') && !done.has('open_passage:АВТ-З')) acts.push({ type: 'open_passage', id: 'АВТ-З', why: 'единственный выход из ограждения АВТ-3 под облаком, снять западное ограждение' });
    const A = acts.slice(0, 5);
    const rumor = R.reports.find(x => /пахнет газом/.test(x));
    const wind = R.wind, src = sim.P.source;
    const reports = {
      'РЛА': `${fire ? 'Пожар' : 'Выброс'} у ${src.name.split(',')[0]}, ветер ${U.dirName(wind.from)} ${String(wind.u).replace('.', ',')} м/с${closing.length ? `; ${closing.join(', ')} в опасной зоне` : '; пункты сбора вне облака'}. ${sim.tiso > t ? 'Источник не отсечён.' : 'Источник отсечён.'}`,
      'ГСО': (sens.length ? `Высокие показания: ${sens.slice(0, 3).map(([n, v]) => `${n} ${v} ppm`).join(', ')}.` : 'Датчики вне облака в норме.') + (iz ? ` Пострадавшие в зоне ${ZN(iz[0])}: ${iz[1]}.` : ' Сообщений о пострадавших нет.') + (rumor ? ' Сообщение «пахнет газом» датчиком не подтверждено, людей не переводим.' : ''),
      'Учёт': `Отметились ${U.nf(m.regL)} из ${U.nf(sim.listN)}, не отметились ${U.nf(m.unacc)}. ${R.queues.filter(q => /очереди [1-9]/.test(q)).slice(0, 2).map(q => q.split(':')[0] + ' — очередь').join(', ') || 'Очередей нет'}.`,
      'Подрядчики': `${campN > 5 ? `В городке около ${Math.round(campN / 5) * 5} человек.` : 'В городке людей почти нет.'} ${stuck > 5 ? `Не вышли из аппаратов и с лесов около ${Math.round(stuck / 5) * 5}.` : 'Бригады вышли.'}`,
    };
    const decision = A.length ? A.map(a => actLabel(a)).join('; ') + '.' : 'Обстановка идёт по плану, новых команд не отдаю.';
    const proposals = opt.roles ? { 'ГСО': A.filter(a => ['muster_close', 'gso', 'isolate'].includes(a.type)).slice(0, 3), 'Учёт': A.filter(a => ['camp_check', 'redirect', 'muster_open'].includes(a.type)).slice(0, 3), 'Подрядчики': A.filter(a => ['announce', 'open_passage', 'redirect'].includes(a.type)).slice(0, 3) } : undefined;
    return { reports, assessment: reports['РЛА'], decision, actions: A, proposals };
  },
};
function actLabel(a) { switch (a.type) { case 'muster_close': return `Закрыть ${a.id}${a.to ? ', людей на ' + a.to : ''}`; case 'muster_open': return 'Открыть ' + a.id; case 'redirect': return `${ZN(a.zone)} → ${a.to}`; case 'shelter': return 'Укрыться: ' + (a.building === 'ADM' ? 'админкорпус' : 'операторная'); case 'isolate': return 'Отсечь источник'; case 'gso': return 'ГСО в зону ' + ZN(a.zone); case 'camp_check': return 'Обзвонить городок'; case 'open_passage': return 'Снять ограждение ' + a.id; case 'announce': return 'Громкая связь' + (a.text ? ': «' + a.text + '»' : ''); default: return a.type } }
const CMD_TYPES = [
  ['muster_close', 'Закрыть пункт сбора', ['id', 'to']], ['muster_open', 'Открыть пункт сбора', ['id']], ['redirect', 'Перенаправить зону', ['zone', 'to']], ['isolate', 'Отсечь источник', []], ['gso', 'Направить звено ГСО', ['zone']], ['camp_check', 'Обзвонить городок', []], ['open_passage', 'Снять ограждение', ['id']], ['shelter', 'Укрыться в здании', ['building']], ['announce', 'Громкая связь', ['text']]];

// ---------- проверка связности (ФТ-03)
const Graph = {
  cache: new Map(),
  check(closed, plaMap) {
    const key = closed.slice().sort().join(',') + '|' + JSON.stringify(plaMap || Store.s.plaMap) + '|' + L.MUSTER.map(m => m.x + ',' + m.y).join(';'); if (this.cache.has(key)) return this.cache.get(key);
    const G = L.buildGrid(closed), GW = L.GW, GH = L.GH, C = L.CELL;
    const F = {}; L.MUSTER.forEach(m => F[m.id] = L.field(G, m.x, m.y));
    const zones = []; const PM = plaMap || Store.s.plaMap;
    ['AVT', 'REF', 'HDS', 'CLAUS', 'GFU', 'RACK', 'CAMP'].forEach(z => {
      const r = L.ZONES[z].r, e = 12; const R = [Math.max(2, r[0] - e), Math.max(2, r[1] - e), Math.min(L.W - 4, r[2] + e), Math.min(L.H - 4, r[3] + e)];
      const i0 = Math.floor(R[0] / C), i1 = Math.floor(R[2] / C), j0 = Math.floor(R[1] / C), j1 = Math.floor(R[3] / C);
      const seen = new Uint8Array(GW * GH), qu = [];
      for (let j = Math.floor(r[1] / C); j <= Math.floor(r[3] / C); j++) for (let i = Math.floor(r[0] / C); i <= Math.floor(r[2] / C); i++) { const k = j * GW + i; if (G.walk[k]) { seen[k] = 1; qu.push(k) } }
      // заливка только внутри области; клетка границы считается выходом, если к ней примыкает залитая клетка
      while (qu.length) { const k = qu.pop(), i = k % GW, j = (k - i) / GW; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni <= i0 || ni >= i1 || nj <= j0 || nj >= j1) continue; const nk = nj * GW + ni; if (!seen[nk] && G.walk[nk]) { seen[nk] = 1; qu.push(nk) } } }
      const per = []; for (let i = i0; i <= i1; i++) per.push(j0 * GW + i); for (let j = j0 + 1; j <= j1; j++) per.push(j * GW + i1); for (let i = i1 - 1; i >= i0; i--) per.push(j1 * GW + i); for (let j = j1 - 1; j > j0; j--) per.push(j * GW + i0);
      const near = k => { const i = k % GW, j = (k - i) / GW; return G.walk[k] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => { const ni = i + di, nj = j + dj; return ni > i0 && ni < i1 && nj > j0 && nj < j1 && seen[nj * GW + ni] }) };
      const hit = per.map(near); const segs = []; let cur = 0;
      const startAt = hit.findIndex(h => !h);
      if (startAt < 0) segs.push(per.length); else { for (let n = 0; n < per.length; n++) { const h = hit[(startAt + n) % per.length]; if (h) cur++; else if (cur) { segs.push(cur); cur = 0 } } if (cur) segs.push(cur) }
      const cover = hit.filter(Boolean).length / per.length;
      const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2; let kc = Math.floor(cy / C) * GW + Math.floor(cx / C);
      if (!G.walk[kc]) { outer: for (let rr = 1; rr < 12; rr++) for (let dj = -rr; dj <= rr; dj++) for (let di = -rr; di <= rr; di++) { const k2 = kc + dj * GW + di; if (G.walk[k2]) { kc = k2; break outer } } }
      const ps = PM[z]; const d = ps && F[ps] ? F[ps][kc] : Infinity;
      const widths = segs.map(n => n * C).sort((a, b) => a - b);
      zones.push({ z, name: ZN(z), exits: cover > 0.6 ? null : segs.length, widths, open: cover > 0.6, cover, ps, route: isFinite(d) ? Math.round(d) : null, minutes: isFinite(d) ? d / 1.3 / 60 : null });
    });
    const musters = L.MUSTER.map(m => { const reach = Object.keys(L.ZONES).filter(z => { const r = L.ZONES[z].r; const k = Math.floor((r[1] + r[3]) / 2 / C) * GW + Math.floor((r[0] + r[2]) / 2 / C); return isFinite(F[m.id][k]) || !G.walk[k] }).length; return { id: m.id, name: m.name, reserve: !!m.reserve, zones: Object.keys(PM).filter(z => PM[z] === m.id).map(ZN), reachable: reach >= Object.keys(L.ZONES).length - 2 } });
    const passages = L.RACKS.flatMap(rk => rk.gaps.map((g, i) => { const nm = rk.axis === 'x' ? `${rk.name}, проход у x≈${Math.round((g[0] + g[1]) / 2)}` : `${rk.name}, проход у y≈${Math.round((g[0] + g[1]) / 2)}`; const cl = L.CLOSURES.find(c => c.cells && (rk.axis === 'x' ? (c.cells.r[0] <= g[0] + 2 && c.cells.r[2] >= g[1] - 2 && c.cells.r[1] < rk.r[3]) : (c.cells.r[1] <= g[0] + 2 && c.cells.r[3] >= g[1] - 2))); return { name: nm, width: g[1] - g[0], closed: cl && closed.includes(cl.id) ? cl.id : null } }));
    const res = { zones, musters, passages, single: zones.filter(z => z.exits === 1), cells: GW * GH, walk: G.walk.reduce((a, b) => a + b, 0) };
    this.cache.set(key, res); return res;
  },
};

// ---------- закрытия по датам ремонта (ФТ-19)
const Weeks = {
  list() { const s = new Date(Store.s.project.repairStart + 'T00:00:00'); const out = [{ n: 0, label: 'До остановки', from: new Date(s.getTime() - 7 * 864e5) }]; for (let i = 0; i < Store.s.project.repairWeeks; i++) out.push({ n: i + 1, label: 'Неделя ' + (i + 1), from: new Date(s.getTime() + i * 7 * 864e5) }); out.forEach(w => { w.mid = new Date(w.from.getTime() + 3 * 864e5); w.iso = w.mid.toISOString().slice(0, 10); w.closed = Store.s.closures.filter(c => c.from <= w.iso && c.to >= w.iso).map(c => c.id); w.range = U.dateRu(w.from.toISOString()) }); return out },
};

// ---------- памятка «куда идти при каком ветре» (ФТ-18)
const Brief = {
  cache: null,
  compute() {
    const key = JSON.stringify(Store.s.plaMap) + Store.s.closures.map(c => c.id).join() + JSON.stringify(Musters.site());
    if (this.cache && this.cache.key === key) return this.cache.res;
    const P = Scen.params('SC1'); P.closures = L.CLOSURES.map(c => c.id).filter(id => id !== 'АВТ-З' && id !== 'П-2');
    const s = new L.Sim(P, 'fixed', []); const dirs = [0, 45, 90, 135, 180, 225, 270, 315]; const res = {};
    ['AVT', 'REF', 'HDS', 'CLAUS', 'GFU', 'RACK', 'CAMP'].forEach(z => { const r = L.ZONES[z].r; s.P.source = { x: (r[0] + r[2]) / 2, y: (r[1] + r[3]) / 2, h: 3, t0: 0 }; res[z] = dirs.map(d => { s.P.wind = { from: d, u: 2, cls: 'D' }; s.P.windChanges = []; const T = s.initialTargets(); const main = T[z]; const ex = (() => { let best = null, bd = 1e9; const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2; const k = Math.floor(cy / L.CELL) * L.GW + Math.floor(cx / L.CELL); L.MUSTER.forEach(m => { if (m.id === main || s.inPlumeSector(m.x, m.y) || !s.musterOpen[m.id]) return; const dd = s.fields[m.id][k]; if (dd < bd) { bd = dd; best = m.id } }); return best })(); return { from: d, ps: main, alt: ex, pla: Store.s.plaMap[z], conflict: s.inPlumeSector(...(m => [m.x, m.y])(L.MUSTER.find(m => m.id === Store.s.plaMap[z]) || L.MUSTER[0])) } }) });
    this.cache = { key, res }; return res;
  },
};
const KZ = {
  short: ['С', 'СШ', 'Ш', 'ОШ', 'О', 'ОБ', 'Б', 'СБ'],
  dir: ['солтүстіктен', 'солтүстік-шығыстан', 'шығыстан', 'оңтүстік-шығыстан', 'оңтүстіктен', 'оңтүстік-батыстан', 'батыстан', 'солтүстік-батыстан'],
  t: { 'Куда идти при выбросе на вашей установке': 'Өз қондырғыңызда шығарынды болса, қайда бару керек', 'Ветер дует': 'Жел соғады', 'Пункт сбора': 'Жиналу пункті', 'Запасной': 'Қосалқы', 'Идите поперёк ветра, не через облако. Отметьтесь на пункте сбора по пропуску.': 'Желге көлденең жүріңіз, бұлт арқылы өтпеңіз. Жиналу пунктінде рұқсатнамамен белгіленіңіз.', 'Не уходите в городок подрядчиков: там вас не досчитаются.': 'Мердігерлер қалашығына кетпеңіз: онда сізді есепке алмайды.', 'Зона': 'Аймақ' },
};

// ---------- импорт файлов
const Files = {
  parseCSV(txt) { txt = txt.replace(/^﻿/, ''); const lines = txt.split(/\r?\n/).filter(l => l.trim()); if (!lines.length) return { head: [], rows: [] }; const d = [';', '\t', ','].map(c => [c, (lines[0].match(new RegExp('\\' + c, 'g')) || []).length]).sort((a, b) => b[1] - a[1])[0][0]; const split = l => l.split(d).map(x => x.trim().replace(/^"|"$/g, '')); return { delim: d, head: split(lines[0]), rows: lines.slice(1).map(split) } },
  // e-PTW: обезличивание при импорте — ФИО и ИИН отбрасываются, табельный номер заменяется хешем
  eptw(txt) {
    const { head, rows } = this.parseCSV(txt); const H = head.map(h => h.toLowerCase());
    const col = re => H.findIndex(h => re.test(h));
    const c = { zone: col(/зона|участок|zone/), org: col(/организац|подряд|org/), work: col(/вид работ|работ|work/), size: col(/числен|кол-?во|size/), from: col(/начал|с\b|from/), to: col(/оконч|по\b|to/), fio: col(/ф\.?и\.?о|фамил|name/), iin: col(/иин|iin/), tab: col(/таб|персон/), permit: col(/наряд|permit|нд/) };
    if (c.zone < 0) throw new Error('В файле нет столбца «Зона». Нужны столбцы: Зона; Организация; Вид работ.');
    const ZM = { 'АВТ-3': 'AVT', 'АВТ': 'AVT', 'AVT': 'AVT', 'РИФОРМИНГ': 'REF', 'Л-35': 'REF', 'REF': 'REF', 'ЛЧ-24': 'HDS', 'ГИДРООЧИСТКА': 'HDS', 'HDS': 'HDS', 'КЛАУС': 'CLAUS', 'CLAUS': 'CLAUS', 'ГФУ': 'GFU', 'GFU': 'GFU', 'ЭСТАКАДА': 'RACK', 'ЭСТАКАДА Э-1': 'RACK', 'RACK': 'RACK', 'ГОРОДОК': 'CAMP', 'CAMP': 'CAMP' };
    const removed = [], hashed = []; if (c.fio >= 0) removed.push(head[c.fio]); if (c.iin >= 0) removed.push(head[c.iin]); if (c.tab >= 0) hashed.push(head[c.tab]);
    const zc = {}, orgs = {}, works = {}, bad = []; let people = 0; const groups = {};
    rows.forEach((r, i) => { const z = ZM[(r[c.zone] || '').trim().toUpperCase()]; if (!z) { bad.push(i + 2); return } const n = c.size >= 0 ? Math.max(1, parseInt(r[c.size], 10) || 1) : 1; zc[z] = (zc[z] || 0) + n; people += n; const o = c.org >= 0 ? r[c.org] : '—'; orgs[o] = (orgs[o] || 0) + n; const w = c.work >= 0 ? r[c.work] : '—'; works[w] = (works[w] || 0) + n; const g = (c.permit >= 0 ? r[c.permit] : 'НД') + '|' + z + '|' + o + '|' + w; groups[g] = groups[g] || { id_hash: U.hash(g, 7), zone: z, org: o, work: w, size: 0 }; groups[g].size += n });
    const sample = rows.slice(0, 6).map(r => head.map((h, i) => i === c.fio || i === c.iin ? null : i === c.tab ? 'h:' + U.hash(r[i], 13) : r[i]).filter(v => v !== null));
    return { head: head.filter((h, i) => i !== c.fio && i !== c.iin).map((h, i) => h), rows: rows.length, people, zc, orgs, works, groups: Object.values(groups), removed, hashed, bad, sample };
  },
  skud(txt) { const { head, rows } = this.parseCSV(txt); const H = head.map(h => h.toLowerCase()); const ci = H.findIndex(h => /направ|dir/.test(h)), cp = H.findIndex(h => /пропуск|карта|card/.test(h)); const inside = new Set(); rows.forEach(r => { const id = r[cp]; if (/вход|in/i.test(r[ci])) inside.add(id); else inside.delete(id) }); return { rows: rows.length, present: inside.size } },
  dxf(txt) { const lines = txt.split(/\r?\n/); const layers = {}; let ent = null, inEnt = false; for (let i = 0; i < lines.length - 1; i += 2) { const code = lines[i].trim(), val = lines[i + 1].trim(); if (code === '0') { if (val === 'SECTION') inEnt = false; if (val === 'ENTITIES') { } ent = val } if (code === '2' && val === 'ENTITIES') inEnt = true; if (inEnt && code === '8' && ent) { layers[val] = layers[val] || {}; layers[val][ent] = (layers[val][ent] || 0) + 1 } } return layers },
  geojson(txt) { const j = JSON.parse(txt); const fs = j.type === 'FeatureCollection' ? j.features : [j]; const by = {}; fs.forEach(f => { const k = (f.properties && (f.properties.layer || f.properties.kind)) || f.geometry.type; by[k] = (by[k] || 0) + 1 }); return { n: fs.length, by, crs: j.crs ? (j.crs.properties || {}).name : 'не указана', features: fs } },
  // выгрузки-образцы, чтобы импорт можно было проверить своими руками
  sampleEptw() {
    const P = Scen.params('SC1'); const s = new L.Sim(P, 'asis', []); const F = ['Ахметов', 'Байжанов', 'Ким', 'Сулейменов', 'Нурланов', 'Иванов', 'Есенов', 'Жаксылыков', 'Петренко', 'Касымов', 'Абенов', 'Ли'];
    const ZR = { AVT: 'АВТ-3', REF: 'Риформинг', HDS: 'ЛЧ-24', CLAUS: 'Клаус', GFU: 'ГФУ', RACK: 'Эстакада', CAMP: 'Городок' };
    let out = 'Наряд;ФИО;ИИН;Табельный №;Организация;Зона;Вид работ;Численность;Начало;Окончание\n';
    s.permits.forEach((p, i) => { const r = L.rng(100 + i); out += [p.id, F[Math.floor(r() * F.length)] + ' ' + 'АБВГДЕЖКМНС'[Math.floor(r() * 11)] + '.' + 'АБВГДЕЖКМНС'[Math.floor(r() * 11)] + '.', String(800000000000 + Math.floor(r() * 99999999999)), 'T' + String(10000 + Math.floor(r() * 89999)), p.contractor, ZR[p.zone], p.work, p.size, '08:00', '20:00'].join(';') + '\n' });
    return out;
  },
  sampleDrill() { return 'Показатель;Факт;Ед.\n' + Store.s.drills[0].rows.map(r => `${r.metric};${r.fact};${r.time ? 'с' : 'чел'}`).join('\n') },
  siteGeoJSON() {
    const rect = (r, props) => ({ type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [[[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]], [r[0], r[1]]]] } });
    const pt = (x, y, props) => ({ type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [x, y] } });
    const f = [];
    L.UNITS.forEach(u => f.push(rect(u.r, { layer: 'units', id: u.id, name: u.name })));
    L.BUILD.forEach(b => f.push(rect(b.r, { layer: 'buildings', id: b.id, name: b.name, shelter_factor: b.shelter })));
    f.push(rect(L.TANKFARM, { layer: 'obstacles', kind: 'резервуарный парк' })); f.push(rect(L.CAMP.r, { layer: 'camp', name: L.CAMP.name }));
    L.RACKS.forEach(rk => f.push(rect(rk.r, { layer: 'racks', id: rk.id, name: rk.name, gaps: rk.gaps })));
    Store.s.closures.forEach(c => { const cl = L.CLOSURES.find(x => x.id === c.id); (cl.fence || [cl.cells.r]).forEach(r => f.push(rect(r, { layer: 'closures', id: c.id, name: c.name, valid_from: c.from, valid_to: c.to }))) });
    L.MUSTER.forEach(m => f.push(pt(m.x, m.y, { layer: 'muster', id: m.id, name: m.name, reserve: !!m.reserve })));
    L.KPP.forEach(k => f.push(pt(k.x, k.y, { layer: 'exits', id: k.id, kind: 'КПП' })));
    Object.entries(L.ZONES).forEach(([z, v]) => f.push(rect(v.r, { layer: 'zones', id: z, name: v.name, pla_muster_id: Store.s.plaMap[z] })));
    return JSON.stringify({ type: 'FeatureCollection', name: 'npz_demo_site_v' + Store.s.site.version, crs: { type: 'name', properties: { name: 'local:site-metres' } }, features: f }, null, 1);
  },
  sampleDXF() { let o = '0\nSECTION\n2\nENTITIES\n'; const ent = (t, l, n) => { for (let i = 0; i < n; i++) o += `0\n${t}\n8\n${l}\n10\n${i}\n20\n${i}\n` }; ent('LWPOLYLINE', 'UNITS', 5); ent('LWPOLYLINE', 'BUILDINGS', 2); ent('CIRCLE', 'TANKS', 6); ent('LWPOLYLINE', 'RACKS', 2); ent('LINE', 'FENCE_TURNAROUND', 6); ent('POINT', 'MUSTER', 6); ent('TEXT', 'LABELS', 24); ent('LWPOLYLINE', 'ROADS', 11); o += '0\nENDSEC\n0\nEOF\n'; return o },
};

// ---------- DOCX без библиотек: минимальный пакет OOXML (zip без сжатия)
const Docx = {
  crcT: (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })(),
  crc(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = this.crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0 },
  zip(files) { const enc = new TextEncoder(), parts = [], cen = []; let off = 0; for (const [name, str] of files) { const nb = enc.encode(name), db = enc.encode(str), crc = this.crc(db); const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, crc, true); h.setUint32(18, db.length, true); h.setUint32(22, db.length, true); h.setUint16(26, nb.length, true); parts.push(new Uint8Array(h.buffer), nb, db); const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true); c.setUint32(20, db.length, true); c.setUint32(24, db.length, true); c.setUint16(28, nb.length, true); c.setUint32(42, off, true); cen.push(new Uint8Array(c.buffer), nb); off += 30 + nb.length + db.length } const cs = cen.reduce((a, b) => a + b.length, 0); const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true); return new Blob([...parts, ...cen, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }) },
  // blocks: [{h:1|2,text}|{p:text,small?}|{table:[[...]],head:true}]
  build(blocks) {
    const x = s => U.esc(s);
    const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${o.b ? '<w:b/>' : ''}<w:sz w:val="${o.sz || 20}"/>${o.c ? `<w:color w:val="${o.c}"/>` : ''}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
    const para = (t, o = {}) => `<w:p><w:pPr><w:spacing w:after="${o.after ?? 100}"/></w:pPr>${run(t, o)}</w:p>`;
    const body = blocks.map(b => { if (b.h) return para(b.text, { b: true, sz: b.h === 1 ? 32 : 24, after: 120 }); if (b.p != null) return para(b.p, { sz: b.small ? 16 : 20, c: b.small ? '555555' : null }); if (b.table) return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:color="BBBBBB"/>`).join('')}</w:tblBorders></w:tblPr>${b.table.map((row, i) => `<w:tr>${row.map(cell => `<w:tc><w:p>${run(cell, { b: i === 0 && b.head, sz: 18 })}</w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>${para('', { after: 60 })}`; return '' }).join('');
    return this.zip([
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1418" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`],
    ]);
  },
};

// ---------- API (маршруты из раздела «API» ТЗ)
const API = {
  log: [], subs: new Set(),
  async call(method, path, body) {
    const t0 = performance.now(); let status = 200, res;
    try { res = await this.route(method, path, body) } catch (e) { status = e.status || 500; res = { error: e.message } }
    const ms = Math.round(performance.now() - t0);
    this.log.unshift({ t: new Date().toLocaleTimeString('ru-RU'), method, path, status, ms, size: JSON.stringify(res || {}).length }); this.log = this.log.slice(0, 200); this.subs.forEach(f => f());
    if (status >= 400) { const e = new Error(res.error); e.status = status; throw e } return res;
  },
  async route(m, p, b) {
    const S = Store.s, lat = (a, z) => U.sleep(a + Math.random() * (z - a));
    let mt;
    if (m === 'POST' && p === '/sites') { await lat(500, 900); S.site.version++; S.site.source = b.file; S.site.imported = U.stamp(); S.site.by = Store.me().name; S.site.history.push({ v: S.site.version, at: U.stamp().slice(0, 10), note: b.note }); Store.audit('Импорт генплана', 'SITE-01 v' + S.site.version, b.file + ' · ' + b.note); Store.save(); return S.site }
    if ((mt = p.match(/^\/sites\/[^/]+\/closures$/)) && m === 'POST') { await lat(150, 300); const c = S.closures.find(x => x.id === b.id); if (!c) throw Object.assign(new Error('Нет ограждения ' + b.id), { status: 404 }); Object.assign(c, b.patch); Store.audit('Ограждение', b.id, `действует ${U.dateRu(c.from)}–${U.dateRu(c.to)}`); Store.save(); return c }
    if ((mt = p.match(/^\/sites\/[^/]+\/graph-check/)) && m === 'GET') { await lat(120, 260); return Graph.check(b && b.closed || [], b && b.plaMap) }
    if ((mt = p.match(/^\/sites\/[^/]+\/population$/)) && m === 'POST') { await lat(600, 1100); Object.assign(S.population, b, { imported: U.stamp() }); Store.audit('Импорт населения', b.source, `удалено: ${(b.removed || []).join(', ') || '—'}; хешировано: ${(b.hashed || []).join(', ') || '—'}; ${U.nf(b.rows)} чел.`); Store.save(); return S.population }
    if (p === '/scenarios' && m === 'GET') { await lat(80, 160); return Scen.all() }
    if (p === '/scenarios' && m === 'POST') { await lat(200, 400); const ex = S.custom.find(x => x.id === b.id); if (ex) Object.assign(ex, b); else { b.id = 'SC' + S.seq.scen++; S.custom.push(b) } Store.audit(ex ? 'Сценарий изменён' : 'Сценарий создан', b.id, b.name); Store.save(); return b }
    if (p === '/runs' && m === 'POST') { const run = { id: Store.next('run', 4, 'RUN-'), sc: b.sc, st: b.st, seed: b.P.seed, at: U.stamp(), by: Store.me().name, code: VER.core, params: U.hash(JSON.stringify(b.P) + JSON.stringify(b.st)), status: 'считается', src: b.src || 'карта' }; S.runs.unshift(run); Store.save(); return run }
    if ((mt = p.match(/^\/runs\/([^/]+)$/)) && m === 'PATCH') { const r = S.runs.find(x => x.id === mt[1]); Object.assign(r, b); if (b.status === 'готов') Store.audit('Прогон', r.id, `${Scen.get(r.sc)?.name || r.sc} · ${stratName(r.st)} · seed ${r.seed} · неучтённые ${r.f ? r.f.u30 : '—'}`); Store.save(); return r }
    if ((mt = p.match(/^\/runs\/([^/]+)$/)) && m === 'GET') { await lat(60, 120); const r = S.runs.find(x => x.id === mt[1]); if (!r) throw Object.assign(new Error('Прогон не найден'), { status: 404 }); return r }
    if (p === '/batches' && m === 'POST') { await lat(150, 300); const bt = Object.assign({ id: Store.next('batch', 4, 'B-'), created: U.stamp(), status: 'в очереди', by: Store.me().name, src: 'live', results: [] }, b); S.batches.unshift(bt); Store.audit('Пакет запущен', bt.id, bt.name + ' · ' + bt.n + ' вариантов'); Store.save(); return bt }
    if ((mt = p.match(/^\/batches\/([^/]+)\/summary$/)) && m === 'GET') { await lat(80, 200); return S.batches.find(x => x.id === mt[1]) }
    if (p === '/drills' && m === 'POST') { await lat(300, 600); S.drills[0].rows = b.rows; S.drills[0].src = b.src; Store.audit('Хронометраж учения', 'DR-01', b.src); Store.save(); return S.drills[0] }
    if ((mt = p.match(/^\/drills\/([^/]+)\/calibrate$/)) && m === 'POST') { await lat(200, 400); Object.assign(S.calib, b, { at: U.stamp().slice(0, 10), by: Store.me().name }); Store.audit('Калибровка', mt[1], `медиана реакции ${b.rtMed} с, отметка ×${String(b.regMul).replace('.', ',')}, макс. расхождение ${Math.round(b.maxErr * 100)}%`); Store.save(); return S.calib }
    if (p === '/trainer/sessions' && m === 'POST') { await lat(150, 300); const ss = Object.assign({ id: Store.next('trainer', 3, 'TR-'), at: U.stamp(), by: Store.me().name, cmds: [] }, b); S.trainer.unshift(ss); Store.audit('Настольное учение', ss.id, 'начато: ' + (Scen.get(ss.sc) || {}).name); Store.save(); return ss }
    if ((mt = p.match(/^\/trainer\/sessions\/([^/]+)\/commands$/)) && m === 'POST') { await lat(80, 160); const ss = S.trainer.find(x => x.id === mt[1]); ss.cmds.push(b); Store.audit('Команда штаба (человек)', ss.id, U.mmss(b.t) + ' · ' + b.actions.map(actLabel).join('; ')); Store.save(); return ss }
    if ((mt = p.match(/^\/trainer\/sessions\/([^/]+)$/)) && m === 'PATCH') { const ss = S.trainer.find(x => x.id === mt[1]); Object.assign(ss, b); Store.save(); return ss }
    if ((mt = p.match(/^\/reports\/(run|batch|scenario)\/([^?]+)/)) && m === 'GET') { await lat(400, 800); const fmt = (p.match(/format=(\w+)/) || [])[1] || 'pdf'; const r = { id: Store.next('report', 3, 'R-'), kind: mt[1], obj: mt[2], fmt, lang: (p.match(/lang=(\w+)/) || [])[1] || 'ru', at: U.stamp(), by: Store.me().name }; S.reports.unshift(r); Store.audit('Отчёт выпущен', r.id, `${mt[1]} ${mt[2]} · ${fmt.toUpperCase()} · ${r.lang === 'kk' ? 'казахский' : 'русский'}`); Store.save(); return r }
    if (p === '/approvals' && m === 'POST') { await lat(150, 300); S.approvals[b.id] = { st: b.st, by: Store.me().name, at: U.stamp().slice(0, 10), note: b.note }; Store.audit(b.st === 'ok' ? 'Мера согласована' : 'Мера возвращена', b.id, b.note || ''); Store.save(); return S.approvals[b.id] }
    if (p === '/pla' && m === 'PUT') { await lat(150, 300); S.plaMap = { ...b.plaMap }; Object.assign(S.pla, b.pla || {}); Graph.cache.clear(); Brief.cache = null; Store.audit('Правила ПЛА', S.pla.version, b.note || 'закрепление зон за ПС'); Store.save(); return S.pla }
    if ((mt = p.match(/^\/sites\/[^/]+\/musters$/)) && m === 'PUT') { await lat(150, 300); S.musterPos = b.pos && Object.keys(b.pos).length ? b.pos : undefined; Graph.cache.clear(); Brief.cache = null; Store.audit('Пункты сбора', 'SITE-01 v' + S.site.version, b.note || 'расстановка изменена'); Store.save(); return S.musterPos || {} }
    if (p === '/strategies' && m === 'POST') { await lat(120, 240); const st = { id: 'ST-' + (S.strategies.length + 1), name: b.name, measures: b.measures, staff: 'none', sub: b.measures.length + ' ' + U.plural(b.measures.length, 'мера', 'меры', 'мер') }; S.strategies.push(st); Store.audit('Стратегия создана', st.id, st.name + ': ' + b.measures.join(', ')); Store.save(); return st }
    throw Object.assign(new Error('Маршрут не найден: ' + m + ' ' + p), { status: 404 });
  },
};
