---
name: S1 · Полигон эвакуации НПЗ
description: Рабочий инструмент инженера ПБиОТ и тренажёр штаба — светлый «лист в раме» и тёмный «ситуационный центр»
colors:
  frame: "#f1f4f2"
  surface: "#ffffff"
  raised: "#f6f8f7"
  active: "#e6ebe8"
  border: "#e2e7e4"
  rule: "#edf0ee"
  control: "#c8cfcb"
  ink: "#131416"
  muted: "#565c59"
  accent: "#1b6c80"
  primary: "#16191a"
  positive: "#1e7b4f"
  negative: "#c4242a"
  warning: "#92400e"
  strategy-asis: "#8f9692"
  strategy-fixed: "#1b6c80"
  strategy-staff: "#2f70bb"
  strategy-fixstaff: "#131416"
  strategy-human: "#a86f0c"
  map-ground: "#eef1ec"
  map-unit: "#d8ded6"
  fence: "#c4242a"
  person-moving: "#1f6fb2"
  person-queue: "#c27c00"
  person-registered: "#2f7a3b"
  person-camp: "#a0522d"
  person-incapacitated: "#c4242a"
  dark-ground: "#171719"
  dark-surface: "#131217"
  dark-raised: "#1d1c21"
  dark-border: "#26252a"
  dark-ink: "#f4f4f5"
  dark-muted: "#a2a4aa"
  dark-accent: "#4a8ad6"
typography:
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  section:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.2
  kpi:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  note:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
  id:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
  clock:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "26px"
    fontWeight: 400
rounded:
  chip: "4px"
  control: "6px"
  card: "8px"
  sheet: "16px"
spacing:
  gap: "16px"
  pad: "24px"
  control: "32px"
  row: "44px"
  sidebar: "232px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 13px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "32px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
  pill-positive:
    backgroundColor: "#dcfae5"
    textColor: "#04250e"
    rounded: "999px"
    height: "20px"
  pill-negative:
    backgroundColor: "#ffedea"
    textColor: "#831c1e"
    rounded: "999px"
    height: "20px"
  nav-item-active:
    backgroundColor: "{colors.active}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "32px"
---

# Design System: S1 · Полигон эвакуации НПЗ

## Overview

Operate-mode product for a refinery turnaround: the evacuation is a measured experiment, and the site map with the drifting cloud and 1 600 people is the product's object. Two themes from one markup. Light is the working default — a green-grey L-frame (sidebar and 48px top bar on one tint, no rule between) holding a white sheet inset 8px with 16px corners; depth comes from that single tone step. Dark is the "situation room" — true near-black ground, cards a step darker, every selection a 1px accent line. Colour lives on data, state and the cloud; the chrome stays neutral. The signature element is the minute strip: a 30-minute track where staff decision points (diamonds at 2, 5, 9, 14, 20 min) and events sit at their minute, shared by the simulation player, the staff journal and the trainer.

## Colors

- **Frame and sheet.** `frame` is a low-chroma green-grey taken from the industrial site; the sheet and cards are `surface` white. Lines in three steps: `border` for panels, `rule` for rows, `control` for inputs.
- **Accent** `accent` (petrol teal) goes on the main data series (ПЛА с правками), the 2px tab underline weight is ink, and on links. It is never a fill on chrome.
- **Strategies** keep one colour everywhere: as written — grey, with fixes — teal, AI staff — blue, fixes + staff — ink (light) / blue (dark), people in the trainer — amber. A chart carries at most four of them.
- **Hazard ramp** is reserved for the cloud: amber under 10 ppm, orange to AEGL-2 (41), red to AEGL-3 (76), deep red above; smoke is grey. Fences are dashed `fence` red.
- **People states** on the map: not started grey, moving blue, queue amber, registered green, in camp sienna, incapacitated red squares.
- **Status pills** use pale tint + dark ink of the same hue; red is only on the failing fact.
- Dark theme swaps to the `dark-*` set; the main data series becomes near-white and the accent becomes `dark-accent` blue.

## Typography

One family, IBM Plex Sans (embedded, Cyrillic), weights 400/500/600. Scale: 12 labels, 13 notes, 14 body and cells, 15–16 card titles, 22 title (24/700 in dark), KPI values 24–28 at 500 (400 in dark). Tabular figures on every number. IBM Plex Mono has one job: IDs, seeds, hashes and the simulation clock. Sentence case everywhere; the only uppercase is in units like ПС, АВТ.

## Layout

Sidebar 232px, top bar 48px, sheet padding 24px, one gap of 16px between every block. Overview and analytics use `1fr + 360–420px` rails; the player uses `1fr + 340px`. Tables right-align figures; narrow tables pair side by side. At ≤1100px the sidebar becomes an off-canvas drawer and every multi-column grid stacks; at ≤760px KPI strips become 2-up grids and segmented controls wrap.

## Elevation & Depth

Flat. Separation is a tone step plus a 1px border, never both a border and a shadow. Shadows exist only on what floats: drawer, modal, menu, toast, tour card, the open mobile sidebar.

## Shapes

Tight radii: chips 4, controls 6, cards 8, sheet 16 (light). Dark: cards 6, controls fully round, sheet square. Map markers: muster points are rings, the source a red triangle, incapacitated people squares.

## Components

- **KPI strip**: one container split by 1px dividers, grey 13px label above a 24–28px value, a 12px caption naming the baseline. No icons, no sparklines.
- **Segmented control**: raised track with a white selected pill (light); in dark the selected option is a 1px accent underline.
- **Tabs**: underline on a full-width 1px rule, ink 2px in light, accent 1px in dark.
- **Map view**: canvas with zoom/pan tools, hover tooltips, flash rings for "show on map"; layers: cloud, sensors, crowding, labels.
- **Decision card**: header band in `raised`, four role columns, decision line, action chips (pale info tint), rejected chips struck through, collapsible prompt and JSON.
- **Heat table**: weather direction × stability class, cells tinted by the negative colour proportional to the value.
- **Drop zone**: dashed control-colour border with a "Sample" ghost button and a file button.

## Do's and Don'ts

- Do put every number on screen from the engine or the recorded data; label synthetic data.
- Do state the baseline of every comparison (same people, same weather).
- Do keep the limitations block in every report.
- Don't add eyebrow labels, side stripes, gradients, glass, icon tiles or emoji.
- Don't colour chrome; colour belongs to data, state and the cloud.
- Don't let an AI-staff command bypass the closed command list.
