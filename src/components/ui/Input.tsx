import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  hint?: string;
  error?: string;
}

export function Input({
  label,
  leftIcon,
  rightIcon,
  hint,
  error,
  className,
  ...rest
}: InputProps) {
  return (
    <label className="block w-full">
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2">
          {label}
        </span>
      )}
      <div className={cn('relative flex items-center', className)}>
        {leftIcon && (
          <span className="absolute left-4 text-ink-mute pointer-events-none">{leftIcon}</span>
        )}
        <input
          className={cn(
            'input-neu',
            leftIcon && 'pl-12',
            rightIcon && 'pr-12',
            error && 'ring-2 ring-accent-rose/60'
          )}
          {...rest}
        />
        {rightIcon && <span className="absolute right-4 text-ink-mute">{rightIcon}</span>}
      </div>
      {(hint || error) && (
        <span
          className={cn(
            'block mt-1.5 text-xs',
            error ? 'text-accent-rose' : 'text-ink-mute'
          )}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
}
