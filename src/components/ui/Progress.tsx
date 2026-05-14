import { cn } from '../../lib/cn';

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  tone?: 'grad' | 'mint' | 'sky' | 'peach' | 'pink';
}

const toneClass = {
  grad: 'bg-accent-grad',
  mint: 'bg-gradient-to-r from-accent-mint to-accent-sky',
  sky: 'bg-gradient-to-r from-accent-sky to-accent-violet',
  peach: 'bg-gradient-to-r from-accent-peach to-accent-pink',
  pink: 'bg-gradient-to-r from-accent-pink to-accent-violet',
};

export function Progress({ value, className, showLabel, tone = 'grad' }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full', className)}>
      <div className="neu-inset-sm rounded-full h-3 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', toneClass[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs font-semibold text-ink-soft text-right">{clamped}%</div>
      )}
    </div>
  );
}
