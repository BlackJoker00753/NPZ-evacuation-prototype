// ---------- запуск
window.__e = [];
addEventListener('error', e => window.__e.push(e.message + ' @' + (e.lineno || '')));
addEventListener('unhandledrejection', e => window.__e.push('promise: ' + (e.reason && e.reason.message || e.reason)));
Store.init(); Ortho.init(); Batch.init(); Pool.init(); Shell.init();
