// Локальный сервер только для разработки: node serve.js → http://localhost:8790/evakuaciya-npz.html
const http = require('http'), fs = require('fs'), path = require('path');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
http.createServer((req, res) => {
  const p = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'evakuaciya-npz.html');
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end('404'); return } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d) });
}).listen(8790, () => console.log('http://localhost:8790/evakuaciya-npz.html'));
