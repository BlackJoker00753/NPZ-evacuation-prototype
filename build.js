// Сборка: всё из src/ в один самодостаточный HTML (шрифты, стили, движок, данные, код экранов).
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const order = ['data.js', 'charts.js', 'server.js', 'ui.js', 's-overview.js', 's-site.js', 's-population.js', 's-scenarios.js', 's-pla.js', 's-sim.js', 's-batch.js', 's-staff.js', 's-trainer.js', 's-drill.js', 's-reports.js', 's-admin.js', 'main.js']
  .filter(f => fs.existsSync(path.join(__dirname, 'src', f)));
const safe = s => s.replace(/<\/script/gi, '<\/script');
const asset = (f, mime) => { const p = path.join(__dirname, 'assets', f); return fs.existsSync(p) ? `data:${mime};base64,` + fs.readFileSync(p).toString('base64') : null };
const promptMd = fs.existsSync(path.join(__dirname, 'assets', 'orthophoto-prompt.md')) ? fs.readFileSync(path.join(__dirname, 'assets', 'orthophoto-prompt.md'), 'utf8') : '';
const orthoPrompt = (promptMd.match(/## Промпт\s*```\s*([\s\S]*?)```/) || [])[1] || '';
const ortho = asset('orthophoto.jpg', 'image/jpeg') || asset('orthophoto.png', 'image/png');
const assetsJs = `const ORTHO_DEFAULT = ${JSON.stringify(ortho)};\nconst GUIDE_PNG = ${JSON.stringify(asset('layout-guide.png', 'image/png'))};\nconst ORTHO_PROMPT = ${JSON.stringify(orthoPrompt.trim())};\n`;
const html = src('template.html')
  .replace('/*FONTS*/', () => src('fonts.css'))
  .replace('/*STYLE*/', () => src('style.css'))
  .replace('/*ENGINE*/', () => safe(src('engine.js')))
  .replace('/*SCRIPTS*/', () => '/* ---- assets ---- */\n' + assetsJs + order.map(f => `/* ---- ${f} ---- */\n` + safe(src(f))).join('\n'));
const out = path.join(__dirname, 'evakuaciya-npz.html');
fs.writeFileSync(out, html);
// для хостинга (Render, GitHub Pages): тот же файл как public/index.html
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
// презентация: deck.src.html + шрифты → presentation/index.html, затем копия в public/presentation (без черновых файлов)
const deckDir = path.join(__dirname, 'presentation');
if (fs.existsSync(path.join(deckDir, 'deck.src.html'))) {
  const deck = fs.readFileSync(path.join(deckDir, 'deck.src.html'), 'utf8').replace('/*FONTS*/', () => fs.readFileSync(path.join(deckDir, 'assets', 'fonts.css'), 'utf8'));
  fs.writeFileSync(path.join(deckDir, 'index.html'), deck);
  fs.rmSync(path.join(__dirname, 'public', 'presentation'), { recursive: true, force: true });
  fs.cpSync(deckDir, path.join(__dirname, 'public', 'presentation'), { recursive: true, filter: p => { const rel = path.relative(deckDir, p).split(path.sep); return !rel.includes('shots') && !p.endsWith('.mjs') && !p.endsWith('deck.src.html') } });
}
console.log('built', path.basename(out), (html.length / 1024).toFixed(0) + ' KB:', order.join(', '), ortho ? '+ orthophoto' : '(без снимка)');
