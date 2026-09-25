import { useEffect, useId, useState } from "react";
import { Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  label: string;
  symbol?: string;
  tip: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Why values are limited, shown when a typed value is clamped. */
  rangeReason: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  /** Display multiplier, e.g. 100 to show a share as percent. */
  scale?: number;
  suffix?: string;
}

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={text}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

export function NumberControl({
  label, symbol, tip, value, min, max, step, rangeReason, onChange, disabled, scale = 1, suffix,
}: Props) {
  const id = useId();
  const [draft, setDraft] = useState(fmt(value * scale));
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => setDraft(fmt(value * scale)), [value, scale]);

  function commit(raw: string) {
    const typed = parseFloat(raw);
    if (!Number.isFinite(typed)) {
      setDraft(fmt(value * scale));
      return;
    }
    const v = typed / scale;
    const c = Math.min(max, Math.max(min, v));
    setNote(c !== v ? `Held at ${fmt(c * scale)}${suffix ?? ""}: ${rangeReason}` : null);
    onChange(c);
    setDraft(fmt(c * scale));
  }

  return (
    <div className={disabled ? "opacity-50" : undefined}>
      <div className="mb-1.5 flex items-start gap-1.5">
        <label htmlFor={id} className="text-sm leading-snug">
          {label}
          {symbol && <span className="text-muted-foreground"> ({symbol})</span>}
        </label>
        <InfoTip text={tip} />
      </div>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          disabled={!!disabled}
          onValueChange={([v]) => {
            setNote(null);
            onChange(v!);
          }}
          aria-label={label}
          className="flex-1"
        />
        <div className="flex items-center gap-1">
          <Input
            id={id}
            inputMode="decimal"
            value={draft}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
            className="h-9 w-20 text-right tabular-nums"
          />
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      {note && <p className="mt-1.5 text-xs text-muted-foreground" role="status">{note}</p>}
    </div>
  );
}

function fmt(v: number) {
  return String(+v.toFixed(3));
}
