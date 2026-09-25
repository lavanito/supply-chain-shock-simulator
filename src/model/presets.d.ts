import type { ChainInput } from "./chainSolver";

export type PresetId = "food" | "hospitality" | "oil" | "flexible-pay" | "fixed-supply";
export interface PresetConfig extends Required<ChainInput> { names: string[] }
export const PRESETS: Record<PresetId, { label: string; config: PresetConfig }>;
export const PRESET_IDS: PresetId[];
