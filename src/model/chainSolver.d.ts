export interface ChainInput {
  theta: number[];
  sigma: number[];
  eps: number[];
  thetaH: number;
  sigmaH: number;
  lam: number;
  shock?: number;
}
export interface ChainTerm { own: number; down: number; household: number; total: number }
export interface ChainResult {
  p: number[]; w: number[]; r: number[]; alpha: number[]; y: number[]; l: number[];
  y0: number; alphaH: number; eta: number; cpi: number; pS: number;
  terms: ChainTerm[]; Omega: number[]; OmegaTilde: number; S: number;
}
export function solveChain(input: ChainInput): ChainResult;
export function employmentRecursion(
  theta: number[], thetaH: number, alpha: number[], alphaH: number,
): { stages: number[]; household: number };
export function lastStageClosedForm(
  sigmaS: number, sigmaH: number, thetaH: number, epsS: number, pS: number, lam: number,
): number;
