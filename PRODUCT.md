# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Single self-contained HTML file (HTML + CSS + JS inline, fonts embedded, no network calls), as the user asked. Built from `src/` by `build.js`. The in-browser "backend" is a mock API layer over the real simulation engine, run in Web Workers.

## Users

- Primary: инженер ПБиОТ (owner of the site model) and разработчик ПЛА at a KMG-group refinery, at a desk in the corporate network, 2–4 weeks before a turnaround. Long working sessions.
- Secondary: руководитель ремонта (reviews bottlenecks, approves measures), участники штаба — РЛА, ГСО, учёт, подрядчики (tabletop trainer), представитель подрядчика (briefing "куда идти"), администратор.
- First audience of this prototype: the jury of the KMG contest «Лучшие инновационные идеи и практики в области ОЗТОС». They must grasp the working cycle and the headline finding within minutes.

## Product Purpose

S1 «Цифровой полигон эвакуации НПЗ в остановочный ремонт»: checks the plan of accident response (ПЛА) before the accident by running the evacuation of 1 500–2 000 people (mostly contractors) through hundreds of weather and fencing variants, with an H₂S cloud or a pool fire and an AI incident staff. Output: bottlenecks, PLA edits with the contribution of each, and a trainer for the staff. Success for the MVP: the model reproduces a real drill within 15% and finds at least 3 real bottlenecks.

## Positioning

The only tool that couples three things for a turnaround site: the cloud drifting with the wind, every person by their work permit (in a vessel, on scaffolding, novice contractor), and the decisions of the staff. Same people, same weather, different rules — the contribution of each PLA edit is measured, not argued.

## Operating Context

Working cycle: площадка (genplan, fences with dates) → люди (e-PTW, СКУД, depersonalised) → сценарии (source, wind, stability class, wind shift, siren failure, isolation time) → симуляция → ИИ-штаб at minutes 2, 5, 9, 14, 20 → сравнение стратегий → сверка с учением → отчёт (PDF/DOCX, RU/KZ). Terms: ПЛА, ПС (пункт сбора), РЛА, ГСО, e-PTW, СКУД, AEGL-2/3, класс устойчивости по Пасквиллу, городок подрядчиков, КПП, отсечка.

## Capabilities and Constraints

- All FR from the ТЗ (ФТ-01…ФТ-21; Could items shown as planned).
- On-prem only, no cloud APIs; local LLM (Qwen3-class on vLLM); RU interface, reports RU and KZ.
- Personal data: only zone, time, organisation, work type; no ФИО/ИИН/photo in the system.
- Reproducibility: one seed gives one result; strategies compared on the same people.
- The AI staff never decides on a real accident: it is a trainer and a generator of options.
- Every report carries a limitations block: models used, last calibration date, discrepancy with the drill.

## Evidence on Hand

- The working demo engine (sim + staff) and its precomputed data: 4 scenarios × strategies, 24 weathers for 2 sources, 20 seeds per strategy, staff decisions recorded by Claude agents on 19.10.2026, JuPedSim validation (v1.4.2), synthetic drill 14.05.2026.
- Everything — site, people, contractors, permits, weather, drill — is synthetic and must be labelled so. No real refinery, customers, or results may be implied.

## Product Principles

1. The numbers come from the model, never typed in: every figure on screen is computed or recorded by the engine.
2. Compare, don't predict: the product shows differences between variants on the same people, with the limitations stated beside them.
3. The human leads: AI staff output is a proposal with its reasoning, validated against a closed command list.
4. Privacy by construction: depersonalise at import, prove it with an audit.

## Accessibility & Inclusion

Corporate desktop browsers, projector demos. WCAG AA contrast, keyboard navigation, reduced-motion support.
