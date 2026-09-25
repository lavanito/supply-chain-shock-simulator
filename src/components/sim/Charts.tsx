import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList,
} from "recharts";
import type { ChainResult } from "@/model/chainSolver";
import { pct } from "@/lib/chain";

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };
const tipStyle = {
  contentStyle: {
    background: "var(--popover)", border: "1px solid var(--border)",
    borderRadius: 6, color: "var(--popover-foreground)", fontSize: 13,
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600 },
};
const pctFmt = (v: number) => `${pct(v / 100)} percent`;

export const TERM_LABELS = {
  own: "employment per unit of output rises",
  down: "output falls: stages downstream buy less",
  household: "output falls: households buy less",
} as const;

export function EmploymentChart({ names, r }: { names: string[]; r: ChainResult }) {
  const data = names.map((name, i) => ({ name, v: +(r.l[i]! * 100).toFixed(4) }));
  const h = Math.max(300, 90 * names.length + 90);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 56, left: 8, bottom: 28 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number" {...axis} tickFormatter={(v) => `${v}`}
          domain={[(min: number) => Math.min(0, Math.floor(min)), (max: number) => Math.max(0, Math.ceil(max))]}
          label={{ value: "Change in employment, percent", position: "insideBottom", offset: -18, fill: "var(--foreground)", fontSize: 13 }}
        />
        <YAxis type="category" dataKey="name" width={130} {...axis} tick={{ fill: "var(--foreground)", fontSize: 13 }} />
        <ReferenceLine x={0} stroke="var(--foreground)" />
        <Tooltip {...tipStyle} cursor={{ fill: "var(--muted)" }} formatter={(v: number) => [pctFmt(v), "Employment"]} />
        <Bar dataKey="v" radius={3} maxBarSize={48} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.name} fill={d.v < 0 ? "var(--fall)" : "var(--rise)"} />)}
          <LabelList dataKey="v" position="right" formatter={(v: number) => pct(v / 100)} fill="var(--foreground)" fontSize={13} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DecompositionChart({ names, r }: { names: string[]; r: ChainResult }) {
  const data = names.map((name, i) => ({
    name,
    own: r.terms[i]!.own * 100,
    down: r.terms[i]!.down * 100,
    household: r.terms[i]!.household * 100,
    total: r.terms[i]!.total * 100,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, 80 * names.length + 120)}>
      <ComposedChart data={data} layout="vertical" stackOffset="sign" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" {...axis} />
        <YAxis type="category" dataKey="name" width={130} {...axis} tick={{ fill: "var(--foreground)", fontSize: 13 }} />
        <ReferenceLine x={0} stroke="var(--foreground)" />
        <Tooltip {...tipStyle} cursor={{ fill: "var(--muted)" }} formatter={(v: number, n: string) => [pctFmt(v), n]} />
        <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
        <Bar dataKey="own" name={TERM_LABELS.own} stackId="t" fill="var(--rise)" maxBarSize={36} isAnimationActive={false} />
        <Bar dataKey="down" name={TERM_LABELS.down} stackId="t" fill="var(--fall)" maxBarSize={36} isAnimationActive={false} />
        <Bar dataKey="household" name={TERM_LABELS.household} stackId="t" fill="var(--fall-soft)" maxBarSize={36} isAnimationActive={false} />
        <Line
          dataKey="total" name="total change in employment" stroke="none" isAnimationActive={false}
          dot={{ r: 6, fill: "var(--foreground)", stroke: "var(--background)", strokeWidth: 2 }}
          activeDot={false} legendType="circle"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function PricePathChart({ names, r }: { names: string[]; r: ChainResult }) {
  const data = r.p.map((v, i) => ({
    name: i === 0 ? "Restricted input" : names[i - 1],
    v: v * 100,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 24, right: 32, left: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" {...axis} tick={{ fill: "var(--foreground)", fontSize: 12 }} interval={0} padding={{ left: 40, right: 60 }} />
        <YAxis {...axis} width={40} label={{ value: "Price change, percent", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 12, dy: 60 }} />
        <Tooltip {...tipStyle} formatter={(v: number) => [pctFmt(v), "Price"]} />
        <Line type="linear" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--primary)" }} isAnimationActive={false}>
          <LabelList dataKey="v" position="top" offset={10} formatter={(v: number) => pct(v / 100)} fill="var(--foreground)" fontSize={12} />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}
