import { Window } from 'happy-dom';
const w = new Window({ url: 'https://riksdagsmonitor.com/dashboards/committees.html' });
const d = w.document;
d.body.innerHTML = '<div id="committee-dashboard"></div><div id="committeeNetwork"></div><div id="productivityMatrix"></div><div id="committeeComparisonChart"></div><div id="decisionEffectivenessChart"></div><div id="seasonalPatternsChart"></div><div id="committeeLastUpdated"></div>';
globalThis.window = w;
globalThis.document = d;
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.performance = w.performance;
class IO { constructor(cb) { this.cb = cb; this.targets = new Set(); } observe(el) { this.targets.add(el); setTimeout(() => this.cb([{ isIntersecting: true, target: el }], this), 50); } unobserve(el) { this.targets.delete(el); } disconnect(){ this.targets.clear(); } }
globalThis.IntersectionObserver = IO;
globalThis.fetch = async (u) => ({ ok: true, status: 200, text: async () => 'risk_level,period_count,percentage\nCRITICAL,1,1\n' });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
const errs = [];
process.on('unhandledRejection', (e) => { errs.push('UNHANDLED: ' + (e?.message || e)); console.log('UNHANDLED:', e?.message || e); if(e?.stack) console.log(e.stack.split('\n').slice(0,8).join('\n')); });
const origErr = console.error.bind(console);
console.error = (...a) => { errs.push('ERR: '+ a.map(x=>String(x?.message||x)).join(' ')); origErr('[err]', ...a); };
try {
  await import('./livejs/main-DMWlYJKW.js');
  await new Promise(r => setTimeout(r, 3000));
} catch (e) {
  console.log('TOP ERROR:', e.message);
  console.log(e.stack);
}
console.log('---summary---');
errs.forEach(e => console.log(e));
