/**
 * Self-test: reproduces the published figures from the working note
 *   Mahadeva (2026), DOI 10.5281/zenodo.22836881
 * Run with:  node chainSolver.test.js
 * Exits non-zero if any number moves.
 */
import { solveChain, employmentRecursion, lastStageClosedForm } from './chainSolver.js';

let fails = 0, checks = 0;
const pc = (x) => +(x * 100).toFixed(4);
// the note prints two decimals, so the bound is a shade over half the last digit
function eq(label, got, want, tol = 5.1e-3) {
  const g = Array.isArray(got) ? got : [got], w = Array.isArray(want) ? want : [want];
  const ok = g.length === w.length && g.every((v, i) => Math.abs(v - w[i]) <= tol);
  checks++; if (!ok) fails++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(46)} ${JSON.stringify(g.map(v => +v.toFixed(4)))}`);
}

const BASE = { theta: [0.40, 0.60, 0.50], sigma: [0.15, 0.30, 0.45],
               eps: [Infinity, Infinity, Infinity],
               thetaH: 0.15, sigmaH: 0.50 / 0.85, lam: 0.15, shock: 0.20 };

console.log('\nThe calibration of Section 5');
const s = solveChain(BASE);
eq('eta',                          s.eta, 0.5);
eq('prices, percent',              s.p.map(pc), [20.00, 8.25, 5.12, 2.76]);
eq('cost of living, percent',      pc(s.cpi), 0.41);
eq('factor prices, percent',       s.w.map(pc), [0.41, 0.41, 0.41]);
eq('output, percent',              s.y.map(pc), [-3.38, -2.44, -1.38]);
eq('EMPLOYMENT, percent',          s.l.map(pc), [-2.21, -1.03, -0.32]);
eq('input mix alpha, percent',     s.alpha.map(pc), [2.94, 2.35, 2.12]);
eq('cumulative cost shares',       s.Omega, [0.400, 0.240, 0.120], 5e-4);
eq('effective share Omega~',       s.OmegaTilde, 0.138, 5e-4);

console.log('\nThe three terms, and the recursion');
eq('employment per unit of output', s.terms.map(t => pc(t.own)), [1.18, 1.41, 1.06]);
eq('output lost: stages downstream', s.terms.map(t => pc(t.down)), [-2.00, -1.06, 0.00]);
eq('output lost: households',        s.terms.map(t => pc(t.household)), [-1.38, -1.38, -1.38]);
eq('three terms sum to employment',  s.terms.map(t => pc(t.total)), [-2.21, -1.03, -0.32]);
const rec = employmentRecursion(BASE.theta, BASE.thetaH, s.alpha, s.alphaH);
eq('recursion gives the same',       rec.stages.map(pc), [-2.21, -1.03, -0.32]);
eq('household entry l_4, percent',   pc(rec.household), 0.24);
eq('last stage closed form, percent',
   pc(lastStageClosedForm(BASE.sigma[2], BASE.sigmaH, BASE.thetaH, Infinity, s.pS, BASE.lam)), -0.32);

console.log('\nThe supply elasticity, Section 5.4');
for (const [e, shelf, l] of [[Infinity, 2.76, [-2.21, -1.03, -0.32]],
                             [5,   2.60, [-2.06, -0.92, -0.28]],
                             [2,   2.41, [-1.87, -0.80, -0.23]],
                             [1,   2.18, [-1.63, -0.64, -0.18]],
                             [0.5, 1.88, [-1.30, -0.46, -0.12]],
                             [0.2, 1.49, [-0.81, -0.24, -0.05]],
                             [0,   0.95, [ 0.00,  0.00,  0.00]]]) {
  const q = solveChain({ ...BASE, eps: [e, e, e] });
  eq(`eps = ${e}: shelf and employment`, [pc(q.pS), ...q.l.map(pc)], [shelf, ...l]);
}

console.log('\nIndexation, Section 6');
for (const [lam, share, shelf, cpi, l] of [
  [0.00, 0.120,  2.40,  0.00, [-2.04, -0.84, -0.12]],
  [0.15, 0.138,  2.76,  0.41, [-2.21, -1.03, -0.32]],
  [0.30, 0.163,  3.26,  0.98, [-2.43, -1.29, -0.60]],
  [0.50, 0.214,  4.29,  2.14, [-2.89, -1.82, -1.18]],
  [0.70, 0.313,  6.25,  4.38, [-3.78, -2.84, -2.28]],
  [0.90, 0.577, 11.54, 10.38, [-6.17, -5.60, -5.25]]]) {
  const q = solveChain({ ...BASE, lam });
  eq(`lambda = ${lam.toFixed(2)}: effective share`, q.OmegaTilde, share, 5.1e-4);
  eq(`lambda = ${lam.toFixed(2)}: shelf, cpi, employment`,
     [pc(q.pS), pc(q.cpi), ...q.l.map(pc)], [shelf, cpi, ...l]);
}

console.log('\nHospitality, Section 5.3');
const h = solveChain({ ...BASE, thetaH: 0.05, sigmaH: 1.5 / 0.95, lam: 0.05 });
eq('eta', h.eta, 1.5);
eq('employment, percent', h.l.map(pc), [-4.60, -3.41, -2.69]);
eq('shelf price, percent', pc(h.pS), 2.51);

console.log(`\n${checks} checks, ${fails} failures`);
if (fails) process.exit(1);
console.log('The JavaScript model reproduces every published figure.');
