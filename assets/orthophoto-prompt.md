# Подложка «как со спутника» для S1 — как сгенерировать в ChatGPT

1. Откройте ChatGPT с генерацией изображений и прикрепите файл `layout-guide.png` из этой папки (1536×1024).
2. Вставьте промпт ниже целиком (на английском модель точнее держит раскладку).
3. Формат: горизонтальный, 1536×1024. Если результат «поплыл» — попросите: «keep every block exactly where it is in the reference, regenerate».
4. Готовую картинку загрузите в прототипе: «Площадка» → «Генплан и ограждения» → карточка «Подложка-снимок» → «Загрузить снимок». Сдвиг и масштаб подгоняются ползунками.
5. Чтобы снимок был внутри файла по умолчанию, положите его сюда как `orthophoto.jpg` и пересоберите: `node build.js`.

## Промпт

```
Create a photorealistic nadir satellite orthophoto (straight top-down, zero perspective, no tilt) of a FICTIONAL oil refinery in the dry steppe of western Kazakhstan, autumn, overcast midday light with soft short shadows. Use the attached image as an exact layout map: keep every block in the same position, size and orientation, 1536×1024 landscape, the full image is the site (about 640 × 420 metres, north is up).

Colour key of the attached map, render each as real industrial surfaces seen from above:
- Light beige background = bare compacted steppe ground and gravel with sparse dry grass.
- Medium grey strips = asphalt plant roads with faint lane markings and kerbs, a few parked white service pickups.
- Grey-blue rectangles = refinery process units: dense steel structures, distillation columns seen from the top as circles, heat exchangers, pipe manifolds, small cooling fans, concrete pads with stains. The large unit at upper-left of the row is under turnaround maintenance: scaffolding, a mobile crane, stacked materials, red-white temporary fencing around its edge.
- Dark brown-black thin bars = elevated pipe racks carrying many parallel pipes; keep the gaps between bar segments open as walkways and road crossings.
- Tan rectangle with six white circles = tank farm: six large white floating-roof storage tanks inside a sand-coloured bund wall.
- Dark slate rectangles = buildings with flat roofs: an administration and laboratory building (upper-left) and a small control room (centre, below the long pipe rack).
- Pale blue-white rectangle (lower-right) = contractor camp: rows of white and blue portable container cabins, a small parking lot.
- Small red squares = security gate checkpoints with barrier arms.

Style: high-resolution commercial satellite imagery look, 30 cm per pixel, realistic colour, slight haze, no clouds. Strictly no text, no labels, no logos, no watermarks, no map legend, no grid, no compass, no people in focus. Do not add buildings or tanks that are not in the map. Keep road and walkway widths as in the map so pedestrians could walk between the units.
```

## Если нужна тёмная «ночная» версия для тёмной темы

Добавьте в конец промпта: `Night-time version: dark ground, warm sodium lights on units and roads, glowing tank farm perimeter lights, everything else unchanged.`
