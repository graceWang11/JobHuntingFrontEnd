import { cn } from '../../lib/cn';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 40, showText = true }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div
        className="rounded-2xl bg-accent-grad shadow-[0_8px_24px_rgba(124,92,255,0.5)] flex items-center justify-center"
        style={{ height: size, width: size }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none">
          <path
            d="M5 14c2-6 8-9 14-7-1 6-5 11-11 12-2 .3-3-1.5-3-5z"
            fill="white"
            opacity="0.95"
          />
          <circle cx="14" cy="10" r="1.5" fill="#7c5cff" />
        </svg>
      </div>
      {showText && (
        <span className="font-display font-extrabold text-2xl tracking-tight text-ink">
          Driftr
        </span>
      )}
    </div>
  );
}
