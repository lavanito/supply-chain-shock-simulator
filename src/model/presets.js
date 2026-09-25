/**
 * The five one-click scenarios. Both the app and presets.test.js import this
 * file, so the test checks exactly what the buttons load.
 */

const NAMES = ['Harvesting', 'Processing and packing', 'Retail and food service'];

const FOOD = {
  names: NAMES,
  theta: [0.40, 0.60, 0.50],
  sigma: [0.15, 0.30, 0.45],
  eps: [Infinity, Infinity, Infinity],
  thetaH: 0.15,
  sigmaH: 0.50 / 0.85,
  lam: 0.15,
  shock: 0.20,
};

export const PRESETS = {
  food: { label: 'US food chain (H-2B visa cap)', config: FOOD },
  hospitality: {
    label: 'Hospitality',
    config: { ...FOOD, thetaH: 0.05, sigmaH: 1.5 / 0.95, lam: 0.05 },
  },
  oil: { label: 'An input used everywhere (oil, a tariff)', config: { ...FOOD, lam: 0.90 } },
  'flexible-pay': { label: 'Pay fully flexible', config: { ...FOOD, lam: 0 } },
  'fixed-supply': { label: 'Jobs protected, pay takes it', config: { ...FOOD, eps: [0, 0, 0] } },
};

export const PRESET_IDS = ['food', 'hospitality', 'oil', 'flexible-pay', 'fixed-supply'];
