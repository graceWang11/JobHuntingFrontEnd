import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  leftIcon?: ReactNode;
  className?: string;
}

export function Chip({ active, onClick, children, leftIcon, className }: ChipProps) {
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        active ? 'chip-active' : 'chip',
        'inline-flex items-center gap-1.5 transition',
        onClick && 'cursor-pointer hover:-translate-y-[1px]',
        className
      )}
    >
      {leftIcon}
      {children}
    </Comp>
  );
}
