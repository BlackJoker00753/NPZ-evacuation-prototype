# Hyperframes Composition Brief: S1 · Цифровой полигон эвакуации НПЗ

## Objective
Живой демо-показ прототипа S1 (около минуты) с русской озвучкой и субтитрами для конкурса КМГ ОЗТОС.

## Output
- Composition directory: `evac/brag-output/composition/`
- Rendered video: `evac/brag-output/brag.mp4`
- Format: landscape — 1920x1080, 30 fps
- Duration: 66 s (запрос пользователя «около минуты» с озвучкой; стандартное окно brag 15–25 с сознательно превышено)

## Source Material
- Project root: `evac/` (src/*.js, README.md, PRODUCT.md, DESIGN.md)
- Product name: S1 · Цифровой полигон эвакуации НПЗ
- Strongest claim (из движка, PRE.SC1): неучтённые на 30-й минуте 210 → 24 → 7
- Real UI: клипы, снятые покадрово из прототипа (`work/clips/*.mp4`), и снимки экранов (`work/stills/*.jpg`)
- Copy that must appear verbatim: «ПЛА как написан», «ПЛА с правками», «210», «24», «7», «Правки ПЛА — до аварии, а не после.»

## Creative Direction
- Tone preset: polished (хук — cinematic)
- Creative direction: живой показ ситуационного центра
- Hook: «Остановочный ремонт на НПЗ» и счётчик 1 600 над снимком площадки
- Outro: «Правки ПЛА — до аварии, а не после.» → белое поле, логотип КМГ
- Avoid: generic SaaS language, abstract filler, шутки

## Visual Identity
- Background #0c0d10, тёмный UI прототипа #171719; текст #f4f4f5 / #a2a4aa; акцент #2bb3e8 (голубой КМГ); опасность #f0566f
- Font: IBM Plex Sans 400/500/600/700 из прототипа (локальные woff2)

## Storyboard
См. `brag-plan.md`: 8 сцен, тайминг от озвучки (`work/vo/timing.json`, сдвиг +0,6 с).

## Audio
- Voiceover: `assets/voiceover.mp3` (edge-tts ru-RU-DmitryNeural; Kokoro не говорит по-русски) — ведущий трек
- Music: `assets/music/bed.mp3` (happy-beats vol-12, 110 BPM), лента громкости: 0,13 под голосом, подъём на логотипе, затухание 2 с
- SFX: impactSoft_medium_001 (счётчик 1 600), mouseclick1 + drop_001 (перенос ПС), impactBell_heavy_000 (24), impactSoft_medium_003 (логотип)
- Audio-reactive: не используется — голос важнее; решение задокументировано
- Beat sync: не используется — темп задаёт голос

## Hyperframes Instructions
Монолитная композиция `index.html`, один paused-таймлайн `main`, видео без вложенных timed-обёрток, у каждого `<audio>` есть id, шрифты локальные. Гейт — `npx hyperframes check`.
