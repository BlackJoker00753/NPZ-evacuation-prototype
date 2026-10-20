// ---------- Обзор проекта: выдержит ли ПЛА остановочный ремонт?
const SC_SHORT = { SC1: 'Утечка на Клаусе', SC2: 'Выброс на АВТ-3', SC3: 'Смена ветра', SC4: 'Пожар у эстакады' };
function finding(scId) {
  const R = id => PRE[scId].runs[id] && PRE[scId].runs[id].f; const a = R('asis'), f = R('fixed'), fs = R('fixshtab'), s = R('shtab'); const fire = SCEN.find(x => x.id === scId).P.hazard === 'fire';
  const sev = fire ? 'опасная тепловая доза' : 'доза выше AEGL-3';
  const txt = {
    SC1: `ПС-3, закреплённый за Клаусом, оказывается под ветром: через облако проходят <b>${nf(a.cloud)}</b> человек. Семь правок ПЛА снижают неучтённых на 30-й минуте с <b>${nf(a.u30)}</b> до <b>${nf(f.u30)}</b>, правки со штабом — до <b>${nf(fs.u30)}</b>.`,
    SC2: `Единственный выход из ограждения АВТ-3 попадает в шлейф: ${sev} у <b>${nf(a.inc)}</b> человек. Штаб снимает ограждение, но поздно (${nf(s.inc)}); решает сделанное заранее — с правками <b>${nf(f.inc)}</b>.`,
    SC3: `На 8-й минуте ветер меняется на южный, ПС-4, выбранный «по ветру», оказывается в облаке: правила с правками дают ${sev} у <b>${nf(f.inc)}</b> человек. Штаб видит газ у ПС-4 и уводит людей: <b>${nf(fs.inc)}</b>.`,
    SC4: `По ПЛА люди ГФУ идут мимо очага: ${sev} у <b>${nf(a.inc)}</b>. Правки и штаб ускоряют учёт (неучтённые ${nf(a.u30)} → ${nf(fs.u30)}), но тяжёлых не убавляют (<b>${nf(fs.inc)}</b>): меры против газа не решают задачу пожара.`,
  }[scId];
  return txt;
}
Screens.overview = {
  render(el) {
    let sc = 'SC1'; const S = Store.s;
    const g = Graph.check(L.CLOSURES.map(c => c.id));
    const approved = Object.values(S.approvals).filter(a => a.st === 'ok').length;
    const drillErr = Math.round(S.calib.maxErr * 100);
    const week = Math.floor((new Date('2026-10-20') - new Date(S.project.mvpStart)) / 864e5 / 7) + 1;
    const myRuns = S.runs.length, liveBatches = S.batches.length;
    const steps = [
      ['site', 'Площадка', `v${S.site.version}, ${S.closures.length} ограждений с датами; зон с одним выходом: ${g.single.length}`, 'done'],
      ['population', 'Люди на площадке', `${nf(S.population.rows)} агентов из e-PTW и СКУД, ФИО в базе: 0`, 'done'],
      ['scenarios', 'Сценарии аварий', `${SCEN.length} готовых${S.custom.length ? ' и ' + S.custom.length + ' своих' : ''}: H₂S, смена ветра, пожар`, 'done'],
      ['pla', 'ПЛА и меры', `согласовано ${approved} из ${L.MEASURES.length} правок`, approved < L.MEASURES.length ? 'now' : 'done'],
      ['batch', 'Прогоны и пакеты', `${nf(myRuns)} прогонов, ${liveBatches} пакетов, 416 вариантов погоды и людей`, 'done'],
      ['staff', 'ИИ-штаб', `${Object.values(REC).reduce((a, k) => a + Object.values(k).reduce((b, x) => b + x.length, 0), 0)} точек решения в журнале, 100% команд прошли схему`, 'done'],
      ['drill', 'Сверка с учением', `макс. расхождение ${drillErr}% при пороге 15%`, drillErr <= 15 ? 'done' : 'now'],
      ['reports', 'Отчёт для ПБиОТ', S.reports.length ? `выпущено ${S.reports.length}, последний ${S.reports[0].at}` : 'не выпущен', S.reports.length ? 'done' : ''],
    ];
    const bn = [
      { x: 68, y: 298, t: 'Очередь на отметку у ПС-1', d: `до ${nf(PRE.SC1.runs.asis.q[0].max)} человек по бумажным спискам`, k: 'учёт' },
      { x: 624, y: 200, t: 'ПС-3 под ветром от Клауса', d: `через облако прошли ${nf(PRE.SC1.runs.asis.f.cloud)} человек`, k: 'облако' },
      { x: 175, y: 214, t: 'Один выход из ограждения АВТ-3', d: `ширина ${wTxt(g.zones.find(z => z.z === 'AVT').widths[0])} на ${nf(Math.round(1600 * .44))} человек зоны`, k: 'выход' },
      { x: 550, y: 40, t: 'Городок подрядчиков', d: `инструктаж и обзвон: −${nf(PRE.SC1.runs.asis.f.u15 - PRE.SC1.measures.camp.u15)} неучтённых на 15-й минуте`, k: 'учёт' },
      { x: 248, y: 200, t: 'Проход П-2 под эстакадой закрыт лесами', d: 'риформинг и АВТ-3 идут через соседние проходы', k: 'проход' },
    ];
    el.innerHTML = `<div class="page">
      ${UI.title({ crumb: `${esc(S.project.site)} · остановка ${U.dateRu(S.project.repairStart)} · неделя MVP ${week} из 16`, h1: esc(S.project.name), actions: `<button class="btn" type="button" id="ovTour">${ic('tour')}Демо-тур</button><a class="btn primary" href="#/sim/SC1/asis" id="ovOpen">${ic('play')}Открыть прогон</a>` })}
      <div class="row-rail">
        <div class="stack">
          <section class="card" id="ovFinding" aria-labelledby="ovH">
            <div class="card-h"><h2 id="ovH">Неучтённые по спискам нарядов, человек из 1 600</h2>${UI.seg('ovSc', SCEN.map(s => [s.id, SC_SHORT[s.id]]), sc)}</div>
            <div class="card-b">
              <p class="finding" id="ovText"></p>${Musters.note('Кривые и итоги на этой странице посчитаны для исходной расстановки.')}
              <div class="split" style="grid-template-columns:minmax(0,300px) minmax(0,1fr);align-items:center">
                <div class="tbox"><table class="t" id="ovLeg"></table></div>
                <div><div id="ovChart"></div><p class="note" id="ovNote"></p></div>
              </div>
            </div>
          </section>
          <section class="card" aria-labelledby="bnH">
            <div class="card-h"><h2 id="bnH">Узкие места ПЛА в ремонт</h2><a class="link" href="#/site/graph">Проверка связности</a></div>
            <div class="card-b"><div class="split" style="grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)"><div id="ovMap"></div><div class="list" id="ovBn"></div></div></div>
          </section>
        </div>
        <aside class="stack">
          <section class="card" aria-labelledby="cyH"><div class="card-h"><h2 id="cyH">Рабочий цикл</h2><span class="meta">${steps.filter(s => s[3] === 'done').length} из ${steps.length}</span></div>
            <div class="card-b"><div class="steps">${steps.map(([id, t, d, st]) => `<a class="step ${st}" href="#/${id}"><span class="st"></span><span><b>${t}</b><span>${d}</span></span></a>`).join('')}</div></div></section>
          <section class="card" aria-labelledby="gtH"><div class="card-h"><h2 id="gtH">Ворота MVP</h2><span class="meta">неделя ${week} из 16</span></div>
            <div class="card-b">
              <div class="gates" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i class="${i < week - 1 ? 'd' : i === week - 1 ? 'c' : ''}"></i>`).join('')}</div>
              <div class="list">
                <div><span>Ворота 0 · данные</span><span>${UI.pill('ok', 'нед. 3 · пройдены')}</span></div>
                <div><span>Ворота 1 · ядро</span><span>${UI.pill('ok', 'нед. 9 · пройдены')}</span></div>
                <div><span>Ворота 2 · учение</span><span>${UI.pill('info', 'нед. 14 · через ' + (14 - week) + ' нед.')}</span></div>
                <div><span>Ворота 3 · решение</span><span>${UI.pill('', 'нед. 16')}</span></div>
              </div>
            </div></section>
        </aside>
      </div>
      <div class="row2">
        <section class="card" aria-labelledby="t30H"><div class="card-h"><h2 id="t30H">Итоги на 30-й минуте</h2><span class="meta">ПЛА как написан → с правками → правки + штаб</span></div>
          <div class="card-b"><div class="tbox"><table class="t"><thead><tr><th>Сценарий</th><th class="n">Неучтённые</th><th class="n">Тяжёлая доза</th></tr></thead><tbody>
          ${SCEN.map(s => { const R = id => PRE[s.id].runs[id].f; return `<tr class="click" data-sc="${s.id}"><td>${esc(s.name)}<span class="s2">${esc(s.sub)}</span></td><td class="n">${nf(R('asis').u30)} → ${nf(R('fixed').u30)} → <b>${nf(R('fixshtab').u30)}</b></td><td class="n">${nf(R('asis').inc)} → ${nf(R('fixed').inc)} → <b class="${R('fixshtab').inc > R('asis').inc ? 'worse' : ''}">${nf(R('fixshtab').inc)}</b></td></tr>` }).join('')}
          </tbody></table></div><p class="note">Тяжёлая доза — выше AEGL-3 для H₂S, при пожаре — опасная тепловая. Синтетическая площадка: порядок разницы, а не прогноз для реального НПЗ.</p></div></section>
        <section class="card" aria-labelledby="rrH"><div class="card-h"><h2 id="rrH">Последние прогоны</h2><a class="link" href="#/sim">Все прогоны</a></div>
          <div class="card-b"><div class="tbox"><table class="t"><thead><tr><th>Прогон</th><th>Стратегия</th><th class="n">Неучтённые</th><th class="n t-hide-sm">Когда</th></tr></thead><tbody>
          ${S.runs.slice(0, 6).map(r => `<tr class="click" data-run="${r.sc}/${r.st}"><td><span class="mono">${r.id}</span><span class="s2">${esc((Scen.get(r.sc) || {}).name || r.sc)}</span></td><td>${esc(stratName(r.st))}</td><td class="n">${r.f ? nf(r.f.u30) : '<span class="dash">—</span>'}</td><td class="n t-hide-sm muted">${esc(r.at)}</td></tr>`).join('')}
          </tbody></table></div></div></section>
      </div>
    </div>`;
    const draw = () => {
      const ids = ['asis', 'fixed', 'fixshtab']; const runs = PRE[sc].runs;
      $('#ovText').innerHTML = finding(sc);
      const lab = runs.asis.s.map(a => mmss(Math.floor(a[0]))); const xAt = lab.map((_, i) => i).filter(i => i % 20 === 0);
      Charts.line($('#ovChart'), { labels: lab, xAt, height: 230, format: v => nf(v), series: ids.map(id => ({ name: stratName(id), values: runs[id].s.map(a => a[2]), colour: getComputedStyle(document.documentElement).getPropertyValue('--s-' + id).trim() })), annotations: DPTS.map((t, i) => ({ at: Math.round(t / 15), label: i ? `${t / 60}` : 'штаб: 2', short: `${t / 60}` })) });
      const f = id => runs[id].f;
      $('#ovLeg').innerHTML = `<thead><tr><th>Стратегия</th><th class="n">30 мин</th><th class="n">В облаке</th></tr></thead><tbody>${ids.map(id => `<tr><td><span style="display:inline-flex;gap:8px;align-items:center"><i class="swl" style="border-color:var(--s-${id})"></i>${stratName(id)}</span></td><td class="n"><b style="font-size:16px;font-weight:${id === 'fixshtab' ? 600 : 500}">${nf(f(id).u30)}</b></td><td class="n">${nf(f(id).cloud)}</td></tr>`).join('')}</tbody>`;
      $('#ovNote').textContent = 'Метки над графиком — минуты, в которые штаб получает доклад и отдаёт команды. Одни и те же люди, наряды и погода во всех трёх кривых.';
    };
    UI.bindSeg(el, 'ovSc', v => { sc = v; draw() }); draw();
    const mv = new MapView($('#ovMap'), { tools: false, layers: { plume: false, people: false } }); mv.closed = L.CLOSURES.map(c => c.id);
    mv.marks = bn.map((b, i) => ({ x: b.x, y: b.y, r: 13, label: String(i + 1), col: getComputedStyle(document.documentElement).getPropertyValue('--negative').trim() })); mv.size();
    $('#ovBn').innerHTML = bn.map((b, i) => `<button class="it-btn" type="button" data-i="${i}"><b class="tnum" style="color:var(--negative)">${i + 1}</b><span><span style="display:block;font-weight:500">${b.t}</span><span class="note">${b.d}</span></span><span class="r">${b.k}</span></button>`).join('');
    $('#ovBn').onclick = e => { const b = e.target.closest('[data-i]'); if (b) { const it = bn[+b.dataset.i]; mv.flash(it.x, it.y) } };
    $$('[data-sc]', el).forEach(r => r.onclick = () => location.hash = '#/sim/' + r.dataset.sc + '/fixshtab');
    $$('[data-run]', el).forEach(r => r.onclick = () => location.hash = '#/sim/' + r.dataset.run);
    $('#ovTour').onclick = () => Tour.start();
    return () => mv.destroy();
  },
};
