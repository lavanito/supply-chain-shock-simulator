import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import { solveChain } from "@/model/chainSolver";
import { PRESETS, PRESET_IDS, type PresetId } from "@/model/presets";
import {
  LIMITS, clamp, defaultStage, defaultState, fromPreset, pct, toModelInput,
  type ChainState, type Stage,
} from "@/lib/chain";
import { NumberControl, InfoTip } from "@/components/sim/NumberControl";
import { EmploymentChart, DecompositionChart, PricePathChart } from "@/components/sim/Charts";
import { ThemeToggle } from "@/components/sim/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const searchSchema = z.object({
  preset: z.enum(["food", "hospitality", "oil", "flexible-pay", "fixed-supply"]).optional().catch(undefined),
});

const TITLE = "Supply Chain Shock Simulator: where employment falls, and why";
const DESC =
  "Build a production chain, raise the price of a restricted input, and see the percentage change in employment at every stage. A verified model from Mahadeva (2026).";

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Simulator,
});

const SHORT: Record<PresetId, string> = {
  food: "Food chain",
  hospitality: "Hospitality",
  oil: "Oil or tariff",
  "flexible-pay": "Flexible pay",
  "fixed-supply": "Fixed supply",
};

const MODEL_REPO = "https://github.com/lavanito/supply-chain-model";

function Simulator() {
  const { preset } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [state, setState] = useState<ChainState>(() => (preset ? fromPreset(preset) : defaultState()));

  const input = useMemo(() => toModelInput(state), [state]);
  const r = useMemo(() => solveChain(input), [input]);
  const names = state.stages.map((s, i) => s.name.trim() || `Stage ${i + 1}`);
  const S = names.length;

  function edit(fn: (s: ChainState) => ChainState) {
    setState(fn);
    if (preset) navigate({ search: {}, replace: true });
  }
  function loadPreset(id: PresetId) {
    setState(fromPreset(id));
    navigate({ search: { preset: id }, replace: true });
  }
  const setStage = (i: number, patch: Partial<Stage>) =>
    edit((s) => ({ ...s, stages: s.stages.map((st, j) => (j === i ? { ...st, ...patch } : st)) }));
  const setCount = (n: number) =>
    edit((s) => ({
      ...s,
      stages: Array.from({ length: n }, (_, i) => s.stages[i] ?? defaultStage(i)),
    }));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen">
        <header className="border-b">
          <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-6 sm:px-6">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Supply Chain Shock Simulator</h1>
              <p className="mt-2 text-base text-muted-foreground">
                Build a production chain, raise the price of a restricted input, and see which stages lose jobs.
              </p>
              <p className="mt-3 border-l-2 border-primary pl-3 text-sm">
                <a href={MODEL_REPO} target="_blank" rel="noreferrer" className="underline decoration-primary/50 underline-offset-2 hover:decoration-primary">
                  The same model runs in Python and JavaScript and agrees to 1.1e-15 over 4,000 random chains, and a test
                  file reproduces 38 of the paper's published figures and fails if any of them moves.
                </a>
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <section aria-label="Scenarios" className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
              Load a scenario
            </h2>
            <div className="flex flex-wrap gap-2">
              {PRESET_IDS.map((id) => (
                <Button
                  key={id}
                  variant={preset === id ? "default" : "outline"}
                  size="sm"
                  onClick={() => loadPreset(id)}
                  title={PRESETS[id].label}
                  aria-pressed={preset === id}
                >
                  {SHORT[id]}
                </Button>
              ))}
            </div>
            {preset && <p className="mt-2 text-sm text-muted-foreground">{PRESETS[preset].label}</p>}
          </section>

          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <Controls state={state} eta={r.eta} setStage={setStage} setCount={setCount} edit={edit} />

            <div className="min-w-0 space-y-6 lg:order-none">
              <section className="grid gap-3 sm:grid-cols-3" aria-label="Headline figures">
                <Tile label={`Employment at ${names[0]!}`} sub="most upstream stage" value={r.l[0]!} />
                <Tile label={`Employment at ${names[S - 1]!}`} sub="final stage" value={r.l[S - 1]!} />
                <Tile label="Price at the shelf" sub="what households pay" value={r.pS} />
              </section>

              <Panel title="Change in employment at each stage">
                <EmploymentChart names={names} r={r} />
                <p className="mt-2 text-sm text-muted-foreground">
                  These are percentage changes. The stages are not the same size, so a smaller percentage at a larger
                  stage can still be more workers.
                </p>
              </Panel>

              <HowItWorks />

              <Panel title="Why employment changes: the three parts">
                <DecompositionChart names={names} r={r} />
                <p className="mt-1 text-xs text-muted-foreground">Each part is in percent of that stage's own employment. The dot marks the total.</p>
              </Panel>

              <Panel title="How the price rise passes down the chain">
                <PricePathChart names={names} r={r} />
              </Panel>

              <Panel title="Every stage, in percent">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm tabular-nums">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Stage</th>
                        <th className="py-2 pr-4 text-right font-medium">Price</th>
                        <th className="py-2 pr-4 text-right font-medium">Factor price (pay and equipment)</th>
                        <th className="py-2 pr-4 text-right font-medium">Output</th>
                        <th className="py-2 text-right font-medium">Employment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {names.map((n, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4">{n}</td>
                          <td className="py-2 pr-4 text-right">{pct(r.p[i + 1]!)}</td>
                          <td className="py-2 pr-4 text-right">{pct(r.w[i]!)}</td>
                          <td className="py-2 pr-4 text-right">{pct(r.y[i]!)}</td>
                          <td className="py-2 text-right font-medium">{pct(r.l[i]!)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cost of living: {pct(r.cpi)} percent. All figures are percentage changes of that stage's own level.
                  </p>
                </div>
              </Panel>
            </div>
          </div>
        </main>

        <footer className="mt-10 border-t">
          <div className="mx-auto max-w-7xl space-y-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
            <p>
              Model and figures from Mahadeva (2026),{" "}
              <a className="underline underline-offset-2 hover:text-foreground" href="https://doi.org/10.5281/zenodo.22836880" target="_blank" rel="noreferrer">
                <em>Supply restrictions: where employment falls, and why</em>, DOI 10.5281/zenodo.22836880
              </a>
            </p>
            <p>
              <a className="underline underline-offset-2 hover:text-foreground" href={MODEL_REPO} target="_blank" rel="noreferrer">
                The model's code and tests on GitHub
              </a>
            </p>
            <p>
              Interface built with Lovable. The model is imported unchanged from github.com/lavanito/supply-chain-model,
              where it is tested against every figure in the paper.
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

function Tile({ label, sub, value }: { label: string; sub: string; value: number }) {
  const tone = Math.abs(value) < 5e-5 ? "text-foreground" : value < 0 ? "text-fall" : "text-rise";
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="truncate text-sm font-medium" title={label}>{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${tone}`}>
        {pct(value)} <span className="text-base font-normal text-foreground">percent</span>
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left font-medium">
        How this works
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-4 pb-4 text-sm leading-relaxed">
        <p>Employment per unit of output rises, because each stage switches away from the dearer input towards its own workers and equipment.</p>
        <p>Output falls because the stages downstream buy less, and output also falls because households buy less at the higher shelf price.</p>
        <p>The first part is positive and the other two are negative, and the further upstream a stage is, the larger the second part.</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Controls({
  state, eta, setStage, setCount, edit,
}: {
  state: ChainState;
  eta: number;
  setStage: (i: number, p: Partial<Stage>) => void;
  setCount: (n: number) => void;
  edit: (fn: (s: ChainState) => ChainState) => void;
}) {
  const S = state.stages.length;
  const thetaWhy = "the cost share must lie strictly between 0 and 1, so it is kept within 0.05 to 0.95.";
  return (
    <aside className="space-y-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1" aria-label="Settings">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-sm">Number of stages in the chain</span>
          <InfoTip text="How many producing stages sit between the restricted input and the household." />
          <span className="ml-auto font-semibold tabular-nums">{S}</span>
        </div>
        <Slider value={[S]} min={1} max={5} step={1} onValueChange={([v]) => setCount(v!)} aria-label="Number of stages" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {state.stages.map((st, i) => (
          <div key={i} className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {i === 0 ? "Upstream" : i === S - 1 ? "Final stage" : `Stage ${i + 1}`}
              </span>
            </div>
            <Input value={st.name} onChange={(e) => setStage(i, { name: e.target.value })} aria-label={`Name of stage ${i + 1}`} className="font-medium" />
            <NumberControl
              label="Share of this stage's costs spent on the input it buys" symbol="θ"
              tip="The fraction of this stage's revenue paid for the intermediate input coming from upstream."
              value={st.theta} min={LIMITS.theta[0]} max={LIMITS.theta[1]} step={0.01}
              rangeReason={thetaWhy} onChange={(v) => setStage(i, { theta: v })}
            />
            <NumberControl
              label="How readily this stage switches away from the input it buys" symbol="σ"
              tip="The elasticity of substitution: zero means fixed recipes, higher means it swaps the input for its own workers and equipment more easily."
              value={st.sigma} min={LIMITS.sigma[0]} max={LIMITS.sigma[1]} step={0.01}
              rangeReason="this cannot be negative, and the control runs from 0 to 3."
              onChange={(v) => setStage(i, { sigma: v })}
            />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={st.elastic} onCheckedChange={(c) => setStage(i, { elastic: c === true })} />
                Workers and equipment in perfectly elastic supply
                <InfoTip text="Ticked means this stage can hire or shed any amount at unchanged pay, so pay moves only with the cost of living." />
              </label>
              <NumberControl
                label="How readily this stage's own workers and equipment come and go" symbol="ε"
                tip="The elasticity of supply of the stage's own inputs: zero means jobs are fixed and pay takes the whole shock."
                value={clamp(st.eps, LIMITS.eps)} min={LIMITS.eps[0]} max={LIMITS.eps[1]} step={0.1}
                rangeReason="this cannot be negative; above 20, tick perfectly elastic instead."
                onChange={(v) => setStage(i, { eps: v })} disabled={st.elastic}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <h3 className="text-lg font-semibold">Households</h3>
        <NumberControl
          label="Share of household budgets spent on this good" symbol="θH"
          tip="The fraction of household spending that goes on the good at the end of the chain."
          value={state.thetaH} min={LIMITS.thetaH[0]} max={LIMITS.thetaH[1]} step={0.01}
          rangeReason="the control runs from 0.02 to 0.60."
          onChange={(v) => edit((s) => ({ ...s, thetaH: v }))}
        />
        <NumberControl
          label="How readily households switch to other goods" symbol="σH"
          tip="The household elasticity of substitution between this good and everything else."
          value={state.sigmaH} min={LIMITS.sigmaH[0]} max={LIMITS.sigmaH[1]} step={0.001}
          rangeReason="this cannot be negative, and the control runs from 0 to 3."
          onChange={(v) => edit((s) => ({ ...s, sigmaH: v }))}
        />
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm">
          How much household demand falls per 1 percent on the price (η)
          <InfoTip text="Worked out from the two settings above; it is not set directly." />
          <span className="ml-auto font-semibold tabular-nums">{eta.toFixed(3)}</span>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <h3 className="text-lg font-semibold">Pay and the shock</h3>
        <NumberControl
          label="How far pay follows the cost of living" symbol="λ"
          tip="The share of the consumer basket whose price moves, times how fully pay is indexed to it."
          value={state.lam} min={LIMITS.lam[0]} max={LIMITS.lam[1]} step={0.01}
          rangeReason="this must lie between 0 and 1."
          onChange={(v) => edit((s) => ({ ...s, lam: v }))}
        />
        <NumberControl
          label="Rise in the restricted input's price"
          tip="How much dearer the restricted input becomes, for example because of a visa cap or a tariff."
          value={state.shock} min={LIMITS.shock[0]} max={LIMITS.shock[1]} step={0.005} scale={100} suffix="%"
          rangeReason="the control runs from 0 to 50 percent."
          onChange={(v) => edit((s) => ({ ...s, shock: v }))}
        />
      </div>
    </aside>
  );
}
