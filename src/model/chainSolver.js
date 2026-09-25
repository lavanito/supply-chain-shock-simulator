/**
 * Sequential production chain: S producing stages plus the household.
 * Direct port of chain_solver.py. No dependencies.
 *
 * All variables are proportional (log) changes. Multiply by 100 for percent.
 *
 *   theta[s]  share of stage-s revenue paid for the intermediate input, 0 < theta < 1
 *   sigma[s]  elasticity of substitution at stage s, >= 0
 *   eps[s]    elasticity of supply of stage-s own inputs, 0..Infinity
 *   thetaH    household budget share of the good
 *   sigmaH    household elasticity of substitution    -> eta = sigmaH * (1 - thetaH)
 *   lam       share of the consumer basket whose price moves, times indexation, 0..1
 *   shock     rise in the restricted input's price, e.g. 0.20 for +20%
 */

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) throw new Error('singular system');
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      if (f === 0) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / M[i][i]);
}

const nu = (e) => (!isFinite(e) ? 0 : 1 / Math.max(e, 1e-12));

export function solveChain({ theta, sigma, eps, thetaH, sigmaH, lam, shock = 0.20 }) {
  const S = theta.length;
  if (sigma.length !== S || eps.length !== S)
    throw new Error('theta, sigma and eps must have the same length');
  if (theta.some((t) => t <= 0 || t >= 1))
    throw new Error('each theta must lie strictly between 0 and 1');
  if (lam < 0 || lam > 1) throw new Error('lambda must lie between 0 and 1');

  const eta = sigmaH * (1 - thetaH);
  const n = 3 * S;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  const P = (s) => s - 1, W = (s) => S + s - 1, Y = (s) => 2 * S + s - 1;
  let r = 0;

  for (let s = 1; s <= S; s++) {                 // unit cost
    A[r][P(s)] = 1;
    A[r][W(s)] = -(1 - theta[s - 1]);
    if (s === 1) b[r] = theta[0] * shock;
    else A[r][P(s - 1)] = -theta[s - 1];
    r++;
  }
  for (let s = 1; s <= S; s++) {                 // wage rule / supply curve
    const k = s - 1, v = nu(eps[k]);
    A[r][W(s)] = 1 + v * sigma[k];
    A[r][Y(s)] = -v;
    A[r][P(s)] -= v * sigma[k];
    A[r][P(S)] -= lam;
    r++;
  }
  for (let s = 2; s <= S; s++) {                 // intermediate demand
    A[r][Y(s - 1)] = 1;
    A[r][Y(s)] = -1;
    A[r][P(s)] = -sigma[s - 1];
    A[r][P(s - 1)] = sigma[s - 1];
    r++;
  }
  A[r][Y(S)] = 1;                                // household demand
  A[r][P(S)] = eta;

  const x = solveLinear(A, b);
  const pIn = x.slice(0, S), w = x.slice(S, 2 * S), y = x.slice(2 * S);
  const p = [shock, ...pIn];
  const rr = p.slice(0, S).map((v, i) => v - w[i]);
  const alpha = rr.map((v, i) => sigma[i] * v);
  const l = y.map((v, i) => v + theta[i] * alpha[i]);
  const pS = p[S];
  const alphaH = sigmaH * pS;
  const y0 = y[0] - (1 - theta[0]) * alpha[0];

  // the three terms, for every stage
  const terms = l.map((_, k) => {
    const own = theta[k] * alpha[k];
    let down = 0;
    for (let j = k + 1; j < S; j++) down -= (1 - theta[j]) * alpha[j];
    return { own, down, household: -eta * pS, total: own + down - eta * pS };
  });

  // cumulative cost shares
  const Omega = [];
  let acc = 1;
  for (let s = 0; s < S; s++) { acc *= theta[s]; Omega.push(acc); }
  const OmS = Omega[S - 1];
  const OmegaTilde = OmS / (1 - lam * (1 - OmS));

  return { p, w, r: rr, alpha, y, l, y0, alphaH, eta, cpi: lam * pS, pS,
           terms, Omega, OmegaTilde, S };
}

/** Employment recursion, from the household upstream. Holds for any wage rule. */
export function employmentRecursion(theta, thetaH, alpha, alphaH) {
  const S = theta.length;
  const l = new Array(S + 2).fill(0);
  l[S + 1] = thetaH * alphaH;
  let next = alphaH;
  for (let k = S; k >= 1; k--) {
    l[k] = l[k + 1] + theta[k - 1] * alpha[k - 1] - next;
    next = alpha[k - 1];
  }
  return { stages: l.slice(1, S + 1), household: l[S + 1] };
}

/** The last producing stage, closed form at any supply elasticity. */
export function lastStageClosedForm(sigmaS, sigmaH, thetaH, epsS, pS, lam) {
  const eta = sigmaH * (1 - thetaH);
  const scale = !isFinite(epsS) ? 1 : epsS / (epsS + sigmaS);
  return pS * (sigmaS * (1 - lam) - eta) * scale;
}
