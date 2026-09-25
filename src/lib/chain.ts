import { PRESETS, type PresetId } from "@/model/presets";

export interface Stage {
  name: string;
  theta: number;
  sigma: number;
  eps: number; // finite value remembered for the slider
  elastic: boolean; // true => Infinity
}

export interface ChainState {
  stages: Stage[];
  thetaH: number;
  sigmaH: number;
  lam: number;
  shock: number;
}

export const LIMITS = {
  theta: [0.05, 0.95],
  sigma: [0, 3],
  eps: [0, 20],
  thetaH: [0.02, 0.6],
  sigmaH: [0, 3],
  lam: [0, 1],
  shock: [0, 0.5],
} as const;

export const defaultStage = (i: number): Stage => ({
  name: `Stage ${i + 1}`,
  theta: 0.5,
  sigma: 0.3,
  eps: 5,
  elastic: true,
});

export function fromPreset(id: PresetId): ChainState {
  const c = PRESETS[id].config;
  return {
    stages: c.names.map((name, i) => ({
      name,
      theta: c.theta[i]!,
      sigma: c.sigma[i]!,
      eps: Number.isFinite(c.eps[i]) ? c.eps[i]! : 5,
      elastic: !Number.isFinite(c.eps[i]),
    })),
    thetaH: c.thetaH,
    sigmaH: c.sigmaH,
    lam: c.lam,
    shock: c.shock,
  };
}

export const defaultState = (): ChainState => ({
  stages: [0, 1, 2].map(defaultStage),
  thetaH: 0.15,
  sigmaH: 0.5 / 0.85,
  lam: 0.15,
  shock: 0.2,
});

export const clamp = (v: number, [lo, hi]: readonly [number, number]) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

/** Final guard: whatever reaches solveChain is inside the model's domain. */
export function toModelInput(s: ChainState) {
  return {
    theta: s.stages.map((st) => clamp(st.theta, LIMITS.theta)),
    sigma: s.stages.map((st) => clamp(st.sigma, LIMITS.sigma)),
    eps: s.stages.map((st) => (st.elastic ? Infinity : clamp(st.eps, LIMITS.eps))),
    thetaH: clamp(s.thetaH, LIMITS.thetaH),
    sigmaH: clamp(s.sigmaH, LIMITS.sigmaH),
    lam: clamp(s.lam, LIMITS.lam),
    shock: clamp(s.shock, LIMITS.shock),
  };
}

/** Signed percent, two decimals, from a proportional change. */
export function pct(x: number) {
  const v = x * 100;
  if (Math.abs(v) < 0.005) return "0.00";
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;
}
