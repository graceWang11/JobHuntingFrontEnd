import { cn } from '../../lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && <div className="font-semibold text-ink">{label}</div>}
          {description && (
            <div className="text-sm text-ink-mute mt-0.5">{description}</div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-8 w-14 rounded-full transition flex-shrink-0',
          checked ? 'bg-accent-grad shadow-[0_6px_18px_rgba(124,92,255,0.4)]' : 'neu-inset-sm'
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            'absolute top-1 h-6 w-6 rounded-full bg-white transition shadow-md',
            checked ? 'left-7' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}
