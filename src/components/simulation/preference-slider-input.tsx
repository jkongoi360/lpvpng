"use client";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface Props {
  label: string;
  percentage: number;
  firstPrefVotes: number;
  onChange: (percentage: number) => void;
}

export function PreferenceSliderInput({
  label,
  percentage,
  firstPrefVotes,
  onChange,
}: Props) {
  const voteCount = Math.round((percentage / 100) * firstPrefVotes);

  function handleSliderChange(value: number | readonly number[]) {
    const v = Array.isArray(value) ? value[0] : value;
    onChange(v);
  }

  function handleNumberChange(num: number) {
    if (firstPrefVotes <= 0) {
      onChange(0);
      return;
    }
    const pct = Math.min(100, Math.max(0, (num / firstPrefVotes) * 100));
    onChange(Math.round(pct * 10) / 10);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-600 min-w-0 truncate w-28 shrink-0">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <Slider
          value={[percentage]}
          onValueChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
        />
      </div>
      <span className="text-xs text-zinc-500 w-10 text-right shrink-0 tabular-nums">
        {Math.round(percentage)}%
      </span>
      <Input
        type="number"
        min={0}
        max={firstPrefVotes}
        className="w-24 text-sm shrink-0"
        value={voteCount || ""}
        onChange={(e) =>
          handleNumberChange(Math.max(0, Number(e.target.value) || 0))
        }
        placeholder="votes"
      />
    </div>
  );
}
