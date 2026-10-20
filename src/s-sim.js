// ---------- Симуляция: карта с воспроизведением, минутная полоса, показатели, журнал (ФТ-07, 08, 09, 15)
const SIM_STRATS = scId => { const sc = Scen.get(scId); const b = sc && sc.builtin; return [
  ['asis', 'ПЛА как написан'], ['fixed', 'ПЛА с правками'],
  ['shtab', 'Штаб-агенты', !b || !hasRec(scId, 'shtab')], ['fixshtab', 'Правки + штаб', !b || !hasRec(scId, 'fixshtab')], ...(hasRec(scId, 'roles') ? [['roles', 'Штаб из ролей']] : []),
  ['agent', 'Штаб вживую'], ...Store.s.strategies.map(s => [s.id, esc(s.name)])] };
function metricsCells(sim, m) {
  const fire = sim.fire, pct = Math.round(m.pct * 100);
  return `<div class="w ${pct >= 95 ? 'ok' : ''}"><b>${pct}% · ${nf(m.regL)} из ${nf(sim.listN)}</b><span>отметились на ПС по спискам нарядов${m.unlReg ? ` · ещё ${m.unlReg} не из списков` : ''}</span><div class="bar8" style="margin-top:6px"><i style="width:${pct}%"></i></div></div>
  <div class="${m.unacc > 50 && sim.t > 600 ? 'bad' : ''}"><b>${nf(m.unacc)}</b><span>неучтённые по спискам</span></div><div><b>${nf(m.notStarted)}</b><span>ещё не начали выход</span></div>
  <div><b>${nf(m.moving)}</b><span>в пути</span></div><div><b>${nf(m.queued)}</b><span>в очереди на отметку</span></div>
  <div class="${m.cloud ? 'bad' : ''}"><b>${nf(m.cloud)}</b><span>${fire ? 'прошли через жар или дым' : 'прошли через облако, пик выше 41 ppm'}</span></div><div class="${m.exp2 ? 'bad' : ''}"><b>${nf(m.exp2)}</b><span>${fire ? 'доза выше порога ожога' : 'доза выше AEGL-2'}</span></div>
  <div class="${m.inc ? 'bad' : ''}"><b>${nf(m.inc)}</b><span>не выйдут сами</span></div><div><b>${nf(m.camp + (m.left || 0))}</b><span>в городке или ушли через КПП, не отметились</span></div>`;
}
function feedHtml(sim, decs) {
  const items = []; (decs || []).forEach(d => { if (d.t - 45 <= sim.t) items.push({ t: d.t - 45, d }) }); let incN = 0, incT = 0;
  sim.events.forEach(e => { if (e.kind === 'штаб') return; if (e.kind === 'пострадавший') { incN++; incT = e.t; return } items.push({ t: e.t, e }) });
  if (incN) items.push({ t: incT, e: { kind: 'пострадавший', text: `Не могут выйти сами: ${incN} (последний — ${mmss(incT)})` } });
  if (sim._thinking) items.push({ t: sim.t, think: true });
  items.sort((a, b) => b.t - a.t);
  return items.length ? items.slice(0, 16).map(it => it.think ? `<div class="fi sh"><span class="tm">${mmss(it.t)}</span><span><span class="k">штаб · ${esc(Agent.label())}</span><br>получил доклад, принимает решение…</span></div>` : it.d ? `<div class="fi sh"><span class="tm">${mmss(it.t)}</span><span><span class="k">штаб${it.d.src === 'rec' ? ' · записан' : ' · ' + esc(it.d.model || '')}${it.d.ms ? ' · ' + (it.d.ms / 1000).toFixed(1).replace('.', ',') + ' с' : ''}</span><br>${esc((it.d.resp && it.d.resp.decision) || it.d.err || 'без команд')}${it.d.actions.length ? `<ul>${it.d.actions.map(a => `<li>${esc(actLabel(a))}</li>`).join('')}</ul>` : ''}</span></div>` : `<div class="fi ${it.e.kind === 'пострадавший' || it.e.kind === 'люди' ? 'bad' : it.e.kind === 'ГСО' || it.e.kind === 'учёт' ? 'ok' : ''}"><span class="tm">${mmss(it.t)}</span><span><span class="k">${esc(it.e.kind)}</span><br>${esc(it.e.text)}</span></div>`).join('') : '<p class="note">Пока тихо. Нажмите «Пуск».</p>';
}
function stripHtml(sim, decs, staff) {
  const pos = t => (100 * t / TEND).toFixed(2) + '%';
  const marks = staff ? DPTS.map((t, i) => `<span class="mk" style="left:${pos(t)}"><span>${t / 60} мин</span><i></i></span>`).join('') : '';
  const ev = sim.events.filter(e => e.kind !== 'штаб').slice(0, 120).map(e => `<span class="ev ${e.kind === 'пострадавший' || e.kind === 'люди' ? 'bad' : e.kind === 'ГСО' || e.kind === 'учёт' ? 'ok' : ''}" style="left:${pos(e.t)}" title="${mmss(e.t)} · ${esc(e.text)}"></span>`).join('');
  return `<span class="tr"></span><span class="fill" style="width:${pos(sim.t)}"></span>${ev}${marks}<span class="head" style="left:${pos(sim.t)}"></span><span class="ticks">${[0, 5, 10, 15, 20, 25, 30].map(m => `<span>${m}</span>`).join('')}</span>`;
}
Screens.sim = {
  retheme() { },
  render(el, args) {
    let scId = args[0] && Scen.get(args[0]) ? args[0] : 'SC1'; let st = args[1] || 'asis'; if (!SIM_STRATS(scId).some(s => s[0] === st && !s[2])) st = 'asis';
    const sc = Scen.get(scId); const staffMode = ['shtab', 'fixshtab', 'roles', 'agent'].includes(st);
    let sim, playing = false, speed = 30, last = 0, acc = 0, decs = [], run = null, busy = false, raf = 0, dead = false;
    const P0 = Scen.params(scId);
    el.innerHTML = `<div class="page">
      ${UI.title({ crumb: '<a href="#/overview">Проект</a> / Симуляция', h1: esc(sc.name), sub: `${esc(sc.sub || '')} · seed ${P0.seed} · одни и те же люди во всех стратегиях`, actions: `<select class="sel" id="simSc" aria-label="Сценарий" style="width:auto">${Scen.all().map(s => `<option value="${s.id}" ${s.id === scId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>${staffMode ? `<a class="btn" href="#/staff/${scId}/${st === 'agent' ? 'live' : st}">${ic('staff')}Журнал штаба</a>` : ''}<a class="btn" href="#/reports/${scId}">${ic('reports')}Отчёт</a>` })}
      <div class="actions"><span class="note">Как действуют:</span>${UI.seg('simSt', SIM_STRATS(scId).map(([v, l, d]) => [v, `<span style="display:inline-flex;align-items:center;gap:6px"><i class="sw" style="background:${STRAT_COL(v === 'agent' ? 'live' : v)}"></i>${l}</span>`, d]), st)}</div>
      ${st === 'agent' ? `<div class="notice info">${ic('staff')}<span><b>Штаб вживую.</b> В точках 2, 5, 9, 14 и 20 минут симуляция останавливается, штаб получает доклад и отдаёт команды из закрытого списка. Модель: ${esc(Agent.label())} — переключается в <a class="link" href="#/admin/integrations">интеграциях</a>. Перемотка вперёд в этом режиме отключена.</span></div>` : ''}
      <div class="player">
        <section class="card" id="simCard"><div class="card-b" style="padding:12px">
          <div id="simMap"></div>
          <div class="transport" style="justify-content:space-between;margin-top:10px"><div class="transport"><button class="btn primary" type="button" id="bPlay">${ic('play')}Пуск</button><button class="btn" type="button" id="bReset">${ic('reset')}Сначала</button>${UI.seg('spSeg', [[10, '×10'], [30, '×30'], [90, '×90']], speed)}<span class="note t-hide-sm">пробел — пуск и пауза, стрелки — перемотка</span></div><span class="clock" id="clk">0:00<small>из 30:00</small></span></div>
          <div class="strip" id="simStrip" role="slider" aria-label="Перемотка модельного времени" aria-valuemin="0" aria-valuemax="1800" tabindex="0"></div>
          <div class="mapbar" style="border:0;padding:4px 0 0"><label class="chk"><input type="checkbox" data-ly="plume" checked>облако, дым, жар</label><label class="chk"><input type="checkbox" data-ly="sensors">датчики</label><label class="chk"><input type="checkbox" data-ly="heat">скопления</label><label class="chk"><input type="checkbox" data-ly="labels" checked>подписи</label>${Ortho.img ? `<label class="chk"><input type="checkbox" data-ly="ortho" ${Ortho.cfg.on ? 'checked' : ''}>снимок</label>` : ''}<span style="flex:1"></span>${LEGEND_PEOPLE()}</div>
        </div></section>
        <aside class="stack">
          <div class="mk-kpi" id="simKpi"></div>
          <section class="card"><div class="card-h"><h2>${staffMode ? 'Штаб и события' : 'События'}</h2></div><div class="card-b"><div class="feed" id="simFeed"></div></div></section>
          <section class="card"><div class="card-h"><h2>Паспорт прогона</h2><span class="meta" id="runId">не сохранён</span></div><div class="card-b"><dl class="kv">
            <dt>Seed</dt><dd class="mono">${P0.seed}</dd><dt>Параметры</dt><dd class="mono">${U.hash(JSON.stringify(P0) + st)}</dd><dt>Код модели</dt><dd>${VER.core}</dd><dt>Площадка</dt><dd>v${Store.s.site.version}</dd><dt>Калибровка</dt><dd>${esc(Store.s.calib.at)}</dd><dt>Штаб</dt><dd>${st === 'agent' ? esc(Agent.label()) : staffMode ? 'записан 19.10.2026' : 'нет'}</dd></dl></div></section>
        </aside>
      </div>
      <div class="row2"><section class="card"><div class="card-h"><h2>Те же люди, другие действия</h2><span class="meta">итоги на 30-й минуте</span></div><div class="card-b" id="simCmp"></div></section>
        <section class="card"><div class="card-h"><h2>Узкие места этого прогона</h2><span class="meta" id="bnMeta"></span></div><div class="card-b"><div id="simBn"></div></div></section></div>
    </div>`;
    const mv = new MapView($('#simMap'), { clock: true, label: 'Карта площадки с людьми и облаком', layers: { plume: true, people: true } });
    const reset = () => {
      playing = false; busy = false; asked.clear(); const P = Scen.params(scId);
      decs = ['shtab', 'fixshtab', 'roles'].includes(st) ? recDecisions(scId, st) : [];
      const strat = st === 'agent' ? 'shtab' : ['shtab', 'roles'].includes(st) ? 'shtab' : simStrat(st);
      sim = new L.Sim(P, strat, decs.map(d => ({ t: d.t, actions: d.actions }))); run = null; mv.sim = sim; mv.plT = -99; mv.dirty = true; mv.draw(); side(true); setPlay();
    };
    const setPlay = () => { const b = $('#bPlay'); b.disabled = busy; b.innerHTML = busy ? `${ic('staff')}Штаб думает…` : playing ? `${ic('pause')}Пауза` : sim.t >= TEND ? `${ic('reset')}Ещё раз` : `${ic('play')}${sim.t > 0 ? 'Дальше' : 'Пуск'}` };
    let lastSide = 0;
    const side = (force) => { const now = performance.now(); if (!force && now - lastSide < 220) return; lastSide = now; const m = sim.metrics(); $('#simKpi').innerHTML = metricsCells(sim, m); $('#simFeed').innerHTML = feedHtml(sim, decs); $('#simStrip').innerHTML = stripHtml(sim, decs, staffMode); $('#clk').innerHTML = `${mmss(sim.t)}<small>из 30:00</small>`; $('#simStrip').setAttribute('aria-valuenow', Math.round(sim.t)); bn() };
    const bn = () => { const b = sim.bottlenecks(5), q = sim.queues().slice(0, 4); $('#bnMeta').textContent = `на ${mmss(sim.t)}`; $('#simBn').innerHTML = (b.length || q.length) ? `<div>${b.map((x, i) => `<button class="it-btn" type="button" data-x="${x.x}" data-y="${x.y}" data-n="${esc(x.name)}"><b class="tnum">${i + 1}</b><span>${esc(x.name)}<span class="note" style="display:block">скопление выше 1 чел/м²</span></span><span class="r">${nf(x.v)} чел·с</span></button>`).join('')}${q.map(x => { const m = L.MUSTER.find(mm => mm.id === x.id); return `<button class="it-btn" type="button" data-x="${m.x}" data-y="${m.y}" data-n="${x.id}"><b class="tnum">${x.id.replace('ПС-', '')}</b><span>${x.id}: очередь на отметку до ${nf(x.max)}<span class="note" style="display:block">отметились ${nf(x.reg)}</span></span><span class="r">очередь</span></button>` }).join('')}</div>` : `<p class="note">${sim.t < 60 ? 'Запустите симуляцию: узкие места появятся по ходу.' : 'Скоплений на проходах нет.'}</p>`; $$('#simBn [data-x]').forEach(b => b.onclick = () => { mv.flash(+b.dataset.x, +b.dataset.y, b.dataset.n); $('#simMap').scrollIntoView({ block: 'center', behavior: 'smooth' }) }) };
    const cmp = () => { const pre = PRE[scId]; if (!pre) { $('#simCmp').innerHTML = `<p class="note">Для своего сценария сравнение считается в пакете: <a class="link" href="#/batch/new">новый пакетный прогон</a> или <a class="link" href="#/pla">вклад мер</a>.</p>`; return }
      const ids = ['asis', 'fixed', 'shtab', 'fixshtab', 'roles'].filter(id => pre.runs[id]); const fire = sc.P.hazard === 'fire';
      const rng = (id, k) => { const S = PRE.seeds[scId] && PRE.seeds[scId][id]; if (!S) return ''; const v = S.map(x => x[k]).filter(x => x != null).sort((a, b) => a - b); if (v.length < S.length) return ''; return `<span class="s2">${nf(v[2])}–${nf(v[17])}</span>` };
      const rows = [['Неучтённые на 15-й мин', 'u15'], ['Неучтённые на 30-й мин', 'u30'], [fire ? 'Через жар или дым' : 'Через облако', 'cloud'], [fire ? 'Доза ожога' : 'Доза AEGL-2', 'exp2'], ['Не выйдут сами', 'inc'], ['Наибольшая очередь', 'maxq']];
      $('#simCmp').innerHTML = Musters.note('Таблица — из пакета демо для исходной расстановки; карта и паспорт прогона — с вашей.') + `<div class="tbox"><table class="t"><thead><tr><th>Показатель</th>${ids.map(id => `<th class="n" style="${id === st ? 'color:var(--text);font-weight:600' : ''}"><i class="swl" style="border-color:var(--s-${id});margin-right:6px"></i>${stratName(id)}</th>`).join('')}</tr></thead><tbody>${rows.map(([l, k]) => { const vals = ids.map(id => pre.runs[id].f[k]); const best = Math.min(...vals); return `<tr><td>${l}</td>${ids.map((id, i) => `<td class="n ${vals[i] === best ? 'better' : ''}">${nf(vals[i])}${rng(id, k)}</td>`).join('')}</tr>` }).join('')}</tbody></table></div><p class="note">Мелко — разброс по 20 наборам людей (10-й–90-й процентили), пакет B-0008.</p>` };
    const loop = now => {
      if (!playing || dead) return; const dt = Math.min(.1, (now - last) / 1000); last = now; acc += dt * speed; let n = 0;
      while (acc >= sim.dt && n < 14 && sim.t < TEND) { if (st === 'agent' && needAsk()) { acc = 0; ask(); break } sim.step(); acc -= sim.dt; n++ }
      mv.draw(); side();
      if (sim.t >= TEND) { playing = false; side(true); setPlay(); finish(); return }
      raf = requestAnimationFrame(loop);
    };
    const asked = new Set(); const needAsk = () => DPTS.some(t => sim.t >= t && !asked.has(t));
    const ask = async () => { const k = DPTS.findIndex(t => sim.t >= t && !asked.has(t)); asked.add(DPTS[k]); busy = true; playing = false; sim._thinking = true; setPlay(); side(true);
      const prev = decs.map(d => ({ t: d.t, actions: d.actions })); const r = await Agent.decide(sim, sc, prev, { k }); if (dead) return; sim._thinking = false;
      const d = { t: sim.t + 45, k, actions: r.actions, resp: r.resp, prompt: r.prompt, rejected: r.rejected, ms: r.ms, model: r.model, err: r.err, src: 'live' }; decs.push(d); sim.decisions.push({ t: d.t, actions: d.actions }); sim.decisions.sort((a, b) => a.t - b.t);
      busy = false; playing = true; setPlay(); side(true); last = performance.now(); raf = requestAnimationFrame(loop) };
    const start = async () => { if (!run) { run = await API.call('POST', '/runs', { sc: scId, st, P: sim.P, src: 'карта' }); $('#runId').innerHTML = `<span class="mono">${run.id}</span>` } };
    const finish = async () => { if (!run) return; const f = summarize(sim, {}).f; const rec = { status: 'готов', f }; if (st === 'agent') rec.dec = decs.map(d => ({ t: d.t, k: d.k, actions: d.actions, resp: d.resp, rejected: d.rejected, ms: d.ms, model: d.model, err: d.err, prompt: d.prompt })); await API.call('PATCH', '/runs/' + run.id, rec); UI.toast(`Прогон ${run.id} сохранён: неучтённых ${nf(f.u30)}`, { action: 'Отчёт', onAction: () => location.hash = '#/reports/' + scId }) };
    const seek = T => { if (st === 'agent') { UI.toast('В режиме «Штаб вживую» перемотка отключена: штаб должен получить каждый доклад'); return } const was = playing; playing = false; if (T < sim.t) { const keepRun = run; reset(); run = keepRun } sim.runTo(Math.min(TEND, T)); mv.plT = -99; mv.draw(); side(true); setPlay(); if (was) { playing = true; last = performance.now(); raf = requestAnimationFrame(loop) } };
    $('#bPlay').onclick = async () => { if (busy) return; if (sim.t >= TEND) { reset(); return } playing = !playing; setPlay(); if (playing) { await start(); last = performance.now(); raf = requestAnimationFrame(loop) } };
    $('#bReset').onclick = () => reset();
    UI.bindSeg(el, 'spSeg', v => speed = +v);
    UI.bindSeg(el, 'simSt', v => location.hash = `#/sim/${scId}/${v}`);
    $('#simSc').onchange = e => location.hash = `#/sim/${e.target.value}/asis`;
    const strip = $('#simStrip'); strip.onclick = e => { const r = strip.getBoundingClientRect(); seek(Math.round((e.clientX - r.left) / r.width * TEND / 15) * 15) };
    strip.onkeydown = e => { if (e.key === 'ArrowRight') seek(sim.t + 30); if (e.key === 'ArrowLeft') seek(Math.max(0, sim.t - 30)) };
    $$('[data-ly]', el).forEach(c => c.onchange = () => { mv.layers[c.dataset.ly] = c.checked; mv.plT = -99; mv.dirty = true; mv.draw() });
    const key = e => { if (e.target.closest('input,select,textarea')) return; if (e.code === 'Space') { e.preventDefault(); $('#bPlay').click() } }; document.addEventListener('keydown', key);
    reset(); mv.size(); cmp();
    return () => { dead = true; playing = false; cancelAnimationFrame(raf); mv.destroy(); document.removeEventListener('keydown', key) };
  },
};
