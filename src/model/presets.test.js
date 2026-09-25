/**
 * Checks the wiring between the preset buttons and the model: each preset,
 * exactly as the app loads it, must reproduce the published figures.
 * Run with:  node presets.test.js
 * Exits non-zero if any number moves.
 *
 * The paper prints two decimals, so each figure is compared as the string
 * toFixed(2) produces — literally "what the paper prints" — with no
 * tolerance and no boundary cases.
 */
import { solveChain } from './chainSolver.js';
import { PRESETS } from './presets.js';

let fails = 0, checks = 0;
// "-0.00" is "0.00": a tiny negative rounds to zero, and the paper prints zero.
// Number(...) drops the sign; everything else is untouched.
const pc = (x) => Number((x * 100).toFixed(2)).toFixed(2);
function eq(label, got, want) {
  const g = Array.isArray(got) ? got : [got], w = Array.isArray(want) ? want : [want];
  const ok = g.length === w.length && g.every((v, i) => v === w[i]);
  checks++; if (!ok) fails++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(46)} ${JSON.stringify(g)}`);
}
const run = (id) => { const { names, ...c } = PRESETS[id].config; return solveChain(c); };

console.log('\nFood chain');
let r = run('food');
eq('employment, percent', r.l.map(pc), ['-2.21', '-1.03', '-0.32']);
eq('shelf price, percent', pc(r.pS), '2.76');
eq('factor prices, percent', r.w.map(pc), ['0.41', '0.41', '0.41']);

console.log('\nHospitality');
r = run('hospitality');
eq('employment, percent', r.l.map(pc), ['-4.60', '-3.41', '-2.69']);
eq('shelf price, percent', pc(r.pS), '2.51');

console.log('\nOil or tariff');
r = run('oil');
eq('employment, percent', r.l.map(pc), ['-6.17', '-5.60', '-5.25']);
eq('shelf price, percent', pc(r.pS), '11.54');
eq('cost of living, percent', pc(r.cpi), '10.38');

console.log('\nFlexible pay');
r = run('flexible-pay');
eq('employment, percent', r.l.map(pc), ['-2.04', '-0.84', '-0.12']);
eq('shelf price, percent', pc(r.pS), '2.40');

console.log('\nFixed supply');
r = run('fixed-supply');
eq('employment, percent', r.l.map(pc), ['0.00', '0.00', '0.00']);
eq('factor prices, percent', r.w.map(pc), ['-6.46', '-1.16', '-0.11']);
eq('shelf price, percent', pc(r.pS), '0.95');

console.log(`\n${checks} checks, ${fails} failures`);
if (fails) process.exit(1);
console.log('Every preset reproduces its published figures.');
