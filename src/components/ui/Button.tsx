import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'neu' | 'glass' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = 'neu',
  size = 'md',
  className,
  children,
  leftIcon,
  rightIcon,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold transition no-tap-highlight select-none disabled:opacity-50 disabled:pointer-events-none';

  const variantClass = {
    primary:
      'rounded-2xl text-white bg-accent-grad hover:brightness-110 active:brightness-95 shadow-[0_10px_30px_rgba(124,92,255,0.45)]',
    neu: 'btn-neu',
    glass: 'btn-glass',
    ghost: 'rounded-2xl text-ink-soft hover:bg-white/40 hover:text-ink',
    danger:
      'rounded-2xl text-white bg-gradient-to-br from-accent-rose to-accent-pink hover:brightness-110 shadow-[0_8px_24px_rgba(255,122,122,0.4)]',
  }[variant];

  const sizeClass = {
    sm: 'text-sm px-3 py-2 rounded-xl',
    md: 'text-sm px-5 py-3',
    lg: 'text-base px-7 py-4',
    icon: 'h-11 w-11 p-0',
  }[size];

  return (
    <button className={cn(base, variantClass, sizeClass, className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
