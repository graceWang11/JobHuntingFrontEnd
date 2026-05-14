import { useId } from 'react';

interface RangeSliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (next: { min: number; max: number }) => void;
  format?: (n: number) => string;
}

export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  format = (n) => `${n}`,
}: RangeSliderProps) {
  const id = useId();
  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute">
            {label}
          </span>
          <span className="text-sm font-semibold text-ink">
            {format(valueMin)} — {format(valueMax)}
          </span>
        </div>
      )}
      <div className="relative h-9 select-none">
        {/* Track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full neu-inset-sm" />
        {/* Active range */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-accent-grad shadow-[0_4px_14px_rgba(124,92,255,0.45)]"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        <input
          id={`${id}-min`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(e) =>
            onChange({ min: Math.min(Number(e.target.value), valueMax), max: valueMax })
          }
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
        />
        <input
          id={`${id}-max`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(e) =>
            onChange({ min: valueMin, max: Math.max(Number(e.target.value), valueMin) })
          }
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
        />
      </div>
      <style>{`
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          height: 22px;
          width: 22px;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(31, 38, 135, 0.35), 0 0 0 3px rgba(124, 92, 255, 0.5);
          cursor: grab;
          border: none;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 22px;
          width: 22px;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(31, 38, 135, 0.35), 0 0 0 3px rgba(124, 92, 255, 0.5);
          cursor: grab;
          border: none;
        }
        .range-thumb::-webkit-slider-runnable-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
