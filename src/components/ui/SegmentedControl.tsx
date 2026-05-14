import { cn } from '../../lib/cn';

interface Option<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string | number> {
  options: Option<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn('neu-inset rounded-2xl p-1.5 inline-flex gap-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition',
              active
                ? 'bg-accent-grad text-white shadow-[0_6px_18px_rgba(124,92,255,0.45)]'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
