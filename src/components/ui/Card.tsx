import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'neu' | 'glass' | 'glass-strong' | 'neu-inset';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  children?: ReactNode;
}

export function Card({ variant = 'neu', className, children, ...rest }: CardProps) {
  const variantClass = {
    neu: 'neu',
    'neu-inset': 'neu-inset',
    glass: 'glass',
    'glass-strong': 'glass-strong',
  }[variant];

  return (
    <div className={cn(variantClass, 'rounded-3xl p-6', className)} {...rest}>
      {children}
    </div>
  );
}
