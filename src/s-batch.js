// ---------- Пакетные прогоны: сценарии × погоды × стратегии × наборы людей (ФТ-12)
const WX_DIRS = [0, 45, 90, 135, 180, 225, 270, 315], WX_CLS = [['B', 3, 'B · день, 3 м/с'], ['D', 3, 'D · 3 м/с'], ['F', 1.5, 'F · ночь, 1,5 м/с']];
const WR = { 0: .12, 45: .12, 90: .18, 135: .14, 180: .10, 225: .08, 270: .12, 315: .14 }, WS = { B: .25, D: .5, F: .25 };
const MET = { cloud: 'Через облако', exp2: 'Доза AEGL-2', inc: 'Не выйдут сами', u15: 'Неучтённые 15 мин', u30: 'Неучтённые 30 мин' };
const qtl = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))] };
// исполнитель пакетов живёт вне экрана: пакет считается, даже если уйти на другую страницу
const Batch = {
  subs: new Set(), cur: null,
  init() { Store.s.batches.forEach(b => { if (b.status === 'считается' || b.status === 'в очереди') { b.status = 'прерван'; b.note = 'вкладка была закрыта во время расчёта' } }) },
  async start(spec) {
    const bt = await API.call('POST', '/batches', spec); const jobs = [];
    spec.scen.forEach(sc => spec.weathers.forEach(w => spec.strats.forEach(st => { for (let k = 0; k < spec.seeds; k++) { const P = Scen.params(sc); if (w) { P.wind = { from: w.from, u: w.u, cls: w.cls }; P.windChanges = [] } P.seed = P.seed + k * 101; jobs.push({ sc, st, w, seed: P.seed, P }) } })));
    bt.status = 'считается'; bt.started = Date.now(); bt.done = 0; bt.results = []; bt.workers = Pool.n; Store.save(true); this.cur = bt; this.emit();
    await Promise.all(jobs.map(j => Pool.run({ P: j.P, strat: simStrat(j.st), want: { ps: true } }, { label: `${j.sc} · ${stratName(j.st)}${j.w ? ` · ${U.dirShort(j.w.from)} ${j.w.cls}` : ''}` }).then(r => {
      const f = r.f; bt.results.push({ sc: j.sc, st: j.st, from: j.w ? j.w.from : null, cls: j.w ? j.w.cls : null, u: j.w ? j.w.u : null, seed: j.seed, ps: r.ps, f: { t95: f.t95, p10: +f.p10.toFixed(3), u15: f.u15, u30: f.u30, cloud: f.cloud, exp2: f.exp2, inc: f.inc, maxq: f.maxq } }); bt.done++; this.emit(); if (bt.done % 6 === 0) Store.save(true);
    }).catch(() => { bt.done++; bt.failed = (bt.failed || 0) + 1; this.emit() })));
    bt.status = 'готов'; bt.ms = Date.now() - bt.started; bt.doneAt = U.stamp(); this.cur = null; Store.audit('Пакет выполнен', bt.id, `${bt.n} вариантов, ${bt.workers} вычислителей, ${Math.round(bt.ms / 1000)} с`); Store.save(); this.emit(); UI.toast(`Пакет ${bt.id} готов: ${bt.n} вариантов за ${Math.round(bt.ms / 1000)} с`, { action: 'Итоги', onAction: () => location.hash = '#/batch/' + bt.id });
  },
  emit() { this.subs.forEach(f => f()); Shell.renderNavCounts() },
  // итоги любого пакета в одном виде: [{sc, st, from, cls, ps, f}]
  rows(bt) { if (bt.src === 'wx') return ['SC1', 'SC2'].flatMap(sc => PRE.wx[sc].flatMap(r => ['asis', 'fixed'].map(st => ({ sc, st, from: r.from, cls: r.cls, u: r.u, ps: r.ps, f: r[st] })))); if (bt.src === 'seeds') return Object.entries(PRE.seeds).flatMap(([sc, o]) => Object.entries(o).flatMap(([st, arr]) => arr.map((f, i) => ({ sc, st, seed: i, f })))); return bt.results || [] },
};
function heatTable(rows, st, met, mx) {
  const get = (d, c) => { const r = rows.filter(x => x.st === st && x.from === d && x.cls === c); return r.length ? qtl(r.map(x => x.f[met]), .5) : null };
  return `<div class="tbox"><table class="t heat"><thead><tr><th>Ветер, откуда</th>${WX_CLS.map(c => `<th class="n">${c[2]}</th>`).join('')}</tr></thead><tbody>${WX_DIRS.map(d => `<tr><td>${U.dirName(d)} <span class="muted">${Math.round(WR[d] * 100)}%</span></td>${WX_CLS.map(([c]) => { const v = get(d, c); const a = v == null ? 0 : Math.min(.85, v / Math.max(1, mx)); return `<td class="n" style="background:color-mix(in srgb,var(--negative) ${Math.round(a * 62)}%,transparent);${a > .55 ? 'color:#fff;font-weight:600' : ''}">${v == null ? '<span class="dash">—</span>' : nf(v)}</td>` }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
Screens.batch = {
  render(el, args) {
    const S = Store.s; const id = args[0];
    if (id === 'new') return this.form(el);
    const bt = id ? S.batches.find(b => b.id === id) : null;
    if (bt) return this.result(el, bt);
    const list = () => `<div class="tbox"><table class="t"><thead><tr><th>Пакет</th><th class="n">Вариантов</th><th>Статус</th><th class="n">Создан</th><th class="n t-hide-sm">Готов</th><th class="t-hide-sm">Кто</th></tr></thead><tbody>${S.batches.map(b => `<tr class="click" data-id="${b.id}"><td><span class="mono">${b.id}</span><span class="s2">${esc(b.name)}</span></td><td class="n">${nf(b.n)}</td><td>${b.status === 'готов' ? UI.pill('ok', 'готов') : b.status === 'прерван' ? UI.pill('bad', 'прерван') : UI.pill('info', `${b.done || 0} из ${b.n}`)}</td><td class="n muted">${esc(b.created)}</td><td class="n muted t-hide-sm">${esc(b.done && b.doneAt ? b.doneAt : b.doneAt || (b.status === 'готов' ? b.done : '—'))}</td><td class="t-hide-sm">${esc(b.by)}</td></tr>`).join('')}</tbody></table></div>`;
    el.innerHTML = `<div class="page">${UI.title({ crumb: '<a href="#/overview">Проект</a> / Пакетные прогоны', h1: 'Пакетные прогоны', sub: `Сценарии × погоды из метеоархива × стратегии × наборы людей. В промышленной версии пакет считают Celery-вычислители за ночь (не менее 200 вариантов); здесь — ${Pool.n} вычислителей браузера.`, actions: UI.lockBtn('batch', `<a class="btn primary" href="#/batch/new">${ic('plus')}Новый пакет</a>`) })}
      <div id="bLive"></div><section class="card" id="batchHeat"><div class="card-h"><h2>Пакеты проекта</h2><span class="meta">${S.batches.length} пакетов, ${nf(S.batches.reduce((a, b) => a + b.n, 0))} вариантов</span></div><div class="card-b" id="bList">${list()}</div></section></div>`;
    const bind = () => $$('tr[data-id]', el).forEach(r => r.onclick = () => location.hash = '#/batch/' + r.dataset.id);
    const live = () => { const b = Batch.cur; $('#bLive').innerHTML = b ? Screens.batch.liveHtml(b) : ''; $('#bList').innerHTML = list(); bind() };
    bind(); live(); let tm = 0; const sub = () => { if (tm) return; tm = setTimeout(() => { tm = 0; live() }, 250) }; Batch.subs.add(sub);
    return () => Batch.subs.delete(sub);
  },
  liveHtml(b) { const st = Pool.state(); const el = (Date.now() - b.started) / 1000; const eta = b.done ? el / b.done * (b.n - b.done) : null; return `<section class="card"><div class="card-h"><h2>${esc(b.id)} считается</h2><span class="meta">${nf(b.done)} из ${nf(b.n)} · прошло ${Math.round(el)} с${eta != null ? ' · осталось около ' + Math.ceil(eta) + ' с' : ''}</span></div><div class="card-b"><div class="progress"><i style="width:${100 * b.done / b.n}%"></i></div><div class="workers">${st.map((w, i) => `<div class="wk"><b>Вычислитель ${i + 1}</b><span class="note">${w.busy ? esc(w.meta && w.meta.label || 'прогон') : 'свободен'}</span></div>`).join('')}</div><div class="actions"><a class="link" href="#/batch/${b.id}">Смотреть итоги по мере расчёта</a></div></div></section>` },
  form(el) {
    const S = Store.s; const st = { scen: ['SC1'], wx: 'archive', strats: ['asis', 'fixed'], seeds: 1 };
    el.innerHTML = `<div class="page">${UI.title({ crumb: '<a href="#/batch">Пакетные прогоны</a> / Новый', h1: 'Новый пакет', sub: 'Одни и те же люди проходят через все погоды и стратегии; меняется только то, что вы выбрали.' })}
      <div class="row-rail" style="grid-template-columns:minmax(0,1fr) 360px"><section class="card"><div class="card-b" style="gap:20px">
        <div class="field"><span class="lab">Сценарии</span><div class="actions">${Scen.all().map(s => `<label class="chk"><input type="checkbox" data-sc="${s.id}" ${st.scen.includes(s.id) ? 'checked' : ''}>${esc(s.name)}</label>`).join('')}</div></div>
        <div class="field"><span class="lab">Погоды</span><label class="chk"><input type="radio" name="wx" value="archive" checked>Метеоархив: 8 направлений × 3 класса устойчивости — 24 погоды</label><label class="chk"><input type="radio" name="wx" value="rose">Роза ветров: 8 направлений, класс D, 3 м/с</label><label class="chk"><input type="radio" name="wx" value="scen">Погода из сценария</label><span class="hint">Роза ветров синтетическая; в пилоте — многолетние данные метеостанции НПЗ или Казгидромета.</span></div>
        <div class="field"><span class="lab">Стратегии</span><div class="actions"><label class="chk"><input type="checkbox" data-st="asis" checked>ПЛА как написан</label><label class="chk"><input type="checkbox" data-st="fixed" checked>ПЛА с правками</label>${S.strategies.map(s => `<label class="chk"><input type="checkbox" data-st="${s.id}">${esc(s.name)}</label>`).join('')}</div><span class="hint">ИИ-штаб в пакет не входит: на каждой погоде он должен перерешивать, это ход до 30 секунд на точку решения.</span></div>
        <div class="field"><span class="lab">Наборы людей</span>${UI.seg('bSeeds', [[1, '1 набор'], [3, '3 набора'], [5, '5 наборов']], 1)}<span class="hint">Разные seed: другие люди, наряды и время реакции. Даёт разброс, а не одну цифру.</span></div>
      </div></section>
      <aside class="stack"><section class="card"><div class="card-h"><h2>Объём</h2></div><div class="card-b"><div id="bCount"></div>${UI.lockBtn('batch', `<button class="btn primary" type="button" id="bGo">${ic('play')}Запустить пакет</button>`)}<p class="note">Пакет продолжит считаться, если перейти на другой экран. Закрытие вкладки прерывает расчёт.</p></div></section></aside></div></div>`;
    const weathers = () => st.wx === 'archive' ? WX_DIRS.flatMap(d => WX_CLS.map(([c, u]) => ({ from: d, cls: c, u }))) : st.wx === 'rose' ? WX_DIRS.map(d => ({ from: d, cls: 'D', u: 3 })) : [null];
    const count = () => { const n = st.scen.length * weathers().length * st.strats.length * st.seeds; const sec = n * 1.4 / Pool.n; $('#bCount').innerHTML = `<div class="score tnum">${nf(n)}</div><p class="note">вариантов: ${st.scen.length} × ${weathers().length} × ${st.strats.length} × ${st.seeds}. Около ${sec < 90 ? Math.ceil(sec) + ' с' : Math.ceil(sec / 60) + ' мин'} на ${Pool.n} вычислителях; на целевом сервере 200 вариантов — за ночь с запасом.</p>${n > 400 ? '<div class="notice">Больше 400 вариантов — это ночной пакет для кластера. В браузере лучше разбить на части.</div>' : ''}`; const go = $('#bGo'); if (go) go.disabled = !n || n > 600 };
    $$('[data-sc]', el).forEach(c => c.onchange = () => { st.scen = $$('[data-sc]', el).filter(x => x.checked).map(x => x.dataset.sc); count() });
    $$('[data-st]', el).forEach(c => c.onchange = () => { st.strats = $$('[data-st]', el).filter(x => x.checked).map(x => x.dataset.st); count() });
    $$('[name=wx]', el).forEach(c => c.onchange = () => { st.wx = c.value; count() }); UI.bindSeg(el, 'bSeeds', v => { st.seeds = +v; count() }); count();
    const go = $('#bGo'); if (go) go.onclick = () => { if (Batch.cur) { UI.toast('Дождитесь окончания текущего пакета'); return } const w = weathers(); const n = st.scen.length * w.length * st.strats.length * st.seeds; Batch.start({ name: `${st.scen.map(s => SC_SHORT[s] || s).join(', ')} × ${w[0] ? w.length + ' погод' : 'погода сценария'} × ${st.strats.length} стр.${st.seeds > 1 ? ' × ' + st.seeds + ' наборов' : ''}`, n, scen: st.scen, weathers: w, strats: st.strats, seeds: st.seeds, wx: st.wx }); setTimeout(() => location.hash = '#/batch', 300) };
  },
  result(el, bt) {
    const S = Store.s; let tm = 0;
    const draw = () => {
      const rows = Batch.rows(bt); const scs = [...new Set(rows.map(r => r.sc))]; const sts = [...new Set(rows.map(r => r.st))];
      if (!this._v || this._v.id !== bt.id) this._v = { id: bt.id, sc: scs[0], met: 'cloud', a: sts[0], b: sts[1] || sts[0] }; const v = this._v;
      const head = UI.title({ crumb: '<a href="#/batch">Пакетные прогоны</a> / ' + bt.id, h1: esc(bt.name), sub: `${nf(bt.n)} вариантов · ${bt.status === 'готов' ? 'готов ' + esc(bt.doneAt || bt.done) : bt.status} · ${bt.workers || Pool.n} вычислителей · запустил ${esc(bt.by)}`, actions: `<a class="btn" href="#/reports/batch/${bt.id}">${ic('reports')}Отчёт по всем погодам</a>` });
      if (!rows.length) { el.innerHTML = `<div class="page">${head}<div class="empty">Итоги появятся по мере расчёта.</div></div>`; return }
      const isSeeds = rows.every(r => r.from == null);
      if (isSeeds) {
        el.innerHTML = `<div class="page">${head}<section class="card" id="batchHeat"><div class="card-h"><h2>Разброс по наборам людей</h2><span class="meta">медиана и 10-й–90-й процентили</span></div><div class="card-b"><div class="tbox"><table class="t"><thead><tr><th>Сценарий</th><th>Стратегия</th><th class="n">Неучтённые 15 мин</th><th class="n">Неучтённые 30 мин</th><th class="n">Через облако</th><th class="n">Не выйдут сами</th></tr></thead><tbody>
          ${scs.flatMap(sc => sts.filter(s => rows.some(r => r.sc === sc && r.st === s)).map((s, i) => { const R = rows.filter(r => r.sc === sc && r.st === s).map(r => r.f); const c = k => { const a = R.map(x => x[k]).filter(x => x != null); return a.length ? `${nf(qtl(a, .5))}<span class="s2">${nf(qtl(a, .1))}–${nf(qtl(a, .9))}</span>` : '—' }; return `<tr><td>${i ? '' : esc((Scen.get(sc) || {}).name || sc)}</td><td><i class="swl" style="border-color:var(--s-${s});margin-right:6px"></i>${stratName(s)}</td><td class="n">${c('u15')}</td><td class="n">${c('u30')}</td><td class="n">${c('cloud')}</td><td class="n">${c('inc')}</td></tr>` })).join('')}</tbody></table></div>
          ${scs.map(sc => { const A = rows.filter(r => r.sc === sc && r.st === 'asis').map(r => r.f), F = rows.filter(r => r.sc === sc && r.st === 'fixed').map(r => r.f); if (!A.length || A.length !== F.length) return ''; const w = A.filter((a, i) => F[i].exp2 <= a.exp2 && F[i].u15 <= a.u15).length; return `<p class="note">${esc((Scen.get(sc) || {}).name || sc)}: в ${w} из ${A.length} наборов людей «ПЛА с правками» не хуже исходного одновременно по дозе и по неучтённым на 15-й минуте.</p>` }).join('')}</div></section></div>`; return;
      }
      const R = rows.filter(r => r.sc === v.sc); const mx = Math.max(1, ...R.map(r => r.f[v.met]));
      const ev = st => R.filter(r => r.st === st).reduce((a, r) => a + (WR[r.from] || 0) * (WS[r.cls] || 0) * r.f[v.met], 0) / Math.max(.0001, R.filter(r => r.st === st).reduce((a, r) => a + (WR[r.from] || 0) * (WS[r.cls] || 0), 0));
      const worst = R.filter(r => r.st === v.a).sort((x, y) => y.f[v.met] - x.f[v.met])[0];
      const wx = [...new Map(R.filter(r => r.st === v.a).map(r => [r.from + r.cls, r])).values()];
      const psF = L.MUSTER.map(m => [m.id, wx.reduce((a, r) => a + (r.ps && r.ps[m.id] >= 41 ? (WR[r.from] || 0) * (WS[r.cls] || 0) : 0), 0)]).filter(x => x[1] > 0);
      const bad = wx.map(r => { const b = R.find(x => x.st === v.b && x.from === r.from && x.cls === r.cls); return b && b.f[v.met] > Math.max(30, r.f[v.met] * 1.5) ? { r, b } : null }).filter(Boolean);
      el.innerHTML = `<div class="page">${head}
        <div class="actions"><span class="note">Сценарий:</span>${UI.seg('rSc', scs.map(s => [s, SC_SHORT[s] || s]), v.sc)}<span class="note">Показатель:</span>${UI.seg('rMet', Object.entries(MET), v.met)}</div>
        ${bt.src === 'wx' || bt.src === 'seeds' ? Musters.note('Этот пакет посчитан для исходной расстановки; запустите новый пакет, чтобы сравнить.') : ''}
        ${bt.status === 'считается' ? `<div class="notice info">${ic('batch')}<span>Пакет считается: ${bt.done} из ${bt.n}. Таблицы обновляются по мере готовности.</span></div>` : ''}
        ${UI.kpis([{ l: 'Ожидаемое по розе ветров', v: `${nf(ev(v.a))} → ${nf(ev(v.b))}`, c: `${stratName(v.a)} → ${stratName(v.b)}` }, { l: 'Худшая погода для «' + stratName(v.a) + '»', v: worst ? `${U.dirShort(worst.from)} · ${worst.cls}` : '—', c: worst ? `${nf(worst.f[v.met])} против ${nf((R.find(x => x.st === v.b && x.from === worst.from && x.cls === worst.cls) || { f: {} }).f[v.met])}` : '' }, { l: 'ПС в облаке на 10-й минуте', v: psF.length ? psF.map(x => x[0]).join(', ') : 'нет', c: psF.length ? psF.map(x => `${x[0]} — ${Math.round(x[1] * 100)}% погод`).join('; ') : 'ни при одной погоде', cls: psF.length ? 'bad' : '' }])}
        <section class="card" id="batchHeat"><div class="card-h"><h2>${MET[v.met]} по погодам</h2><div class="actions"><select class="sel sm" id="rA" style="width:auto">${sts.map(s => `<option value="${s}" ${s === v.a ? 'selected' : ''}>${stratName(s)}</option>`).join('')}</select><span class="note">против</span><select class="sel sm" id="rB" style="width:auto">${sts.map(s => `<option value="${s}" ${s === v.b ? 'selected' : ''}>${stratName(s)}</option>`).join('')}</select></div></div>
        <div class="card-b"><div class="row2"><div><h3 style="margin-bottom:6px">${stratName(v.a)}</h3>${heatTable(R, v.a, v.met, mx)}</div><div><h3 style="margin-bottom:6px">${stratName(v.b)}</h3>${heatTable(R, v.b, v.met, mx)}</div></div>
        ${bad.length ? `<div class="notice">${ic('flag')}<span><b>Перебор нашёл слабое место и у «${stratName(v.b)}».</b> При ветре ${[...new Set(bad.map(x => U.dirName(x.r.from)))].join(', ')} она хуже: ${bad.slice(0, 4).map(x => `${U.dirShort(x.r.from)}·${x.r.cls}: ${nf(x.b.f[v.met])} против ${nf(x.r.f[v.met])}`).join('; ')}. Правило «ПС по флюгеру» исключает слишком узкий сектор — пункт оказывается на краю облака. Правку нужно доработать: исключать сектор ±45° и проверять по датчику у ПС.</span></div>` : ''}
        <p class="note">Проценты у направлений — доля времени по розе ветров. Классы по Пасквиллу: B — солнечный день, сильное перемешивание; D — облачно или ветрено; F — ясная ночь, облако узкое и концентрированное.</p></div></section></div>`;
      UI.bindSeg(el, 'rSc', x => { v.sc = x; draw() }); UI.bindSeg(el, 'rMet', x => { v.met = x; draw() }); $('#rA').onchange = e => { v.a = e.target.value; draw() }; $('#rB').onchange = e => { v.b = e.target.value; draw() };
    };
    draw(); const sub = () => { if (tm || bt.status !== 'считается') { if (bt.status === 'готов' && !tm) { tm = setTimeout(() => { tm = 0; draw() }, 50) } return } tm = setTimeout(() => { tm = 0; draw() }, 900) }; Batch.subs.add(sub);
    return () => Batch.subs.delete(sub);
  },
};
