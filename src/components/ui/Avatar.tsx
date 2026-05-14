import { cn } from '../../lib/cn';

interface AvatarProps {
  emoji?: string;
  image?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const sizeMap = {
  sm: 'h-9 w-9 text-base',
  md: 'h-12 w-12 text-xl',
  lg: 'h-16 w-16 text-2xl',
  xl: 'h-24 w-24 text-4xl',
};

export function Avatar({
  emoji,
  image,
  name,
  size = 'md',
  className,
  ring = true,
}: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full neu-sm font-bold text-ink overflow-hidden',
        ring && 'ring-2 ring-white/70',
        sizeMap[size],
        className
      )}
    >
      {image ? (
        <img src={image} alt={name || 'avatar'} className="h-full w-full object-cover" />
      ) : (
        emoji || initials || '👤'
      )}
    </div>
  );
}
