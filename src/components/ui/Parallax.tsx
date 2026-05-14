import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { useParallaxStyle, useTilt } from '../../lib/useParallax';
import { cn } from '../../lib/cn';

interface ParallaxLayerProps extends HTMLAttributes<HTMLDivElement> {
  depth?: number;
  rotate?: number;
  children?: ReactNode;
  style?: CSSProperties;
}

/**
 * Translates with global mouse position. Negative depth moves opposite to pointer (background feel).
 * Pass depth ~4-10 for foreground cards, 20-40 for hero blobs.
 */
export function ParallaxLayer({
  depth = 10,
  rotate = 0,
  className,
  style,
  children,
  ...rest
}: ParallaxLayerProps) {
  const pStyle = useParallaxStyle({ depth, rotate });
  return (
    <div className={className} style={{ ...pStyle, ...style }} {...rest}>
      {children}
    </div>
  );
}

interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  children?: ReactNode;
}

/**
 * 3D tilt that responds to pointer inside the card itself.
 */
export function TiltCard({ max = 6, className, children, ...rest }: TiltCardProps) {
  const { ref, style } = useTilt({ max });
  return (
    <div ref={ref} style={style} className={cn('transform-gpu', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * Layered animated aurora background using the parallax pointer.
 */
export function ParallaxAurora() {
  const a = useParallaxStyle({ depth: 32 });
  const b = useParallaxStyle({ depth: 50 });
  const c = useParallaxStyle({ depth: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      <div
        className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(124,92,255,0.55), transparent 60%)',
          filter: 'blur(60px)',
          ...a,
        }}
      />
      <div
        className="absolute -top-20 right-[-10%] h-[460px] w-[460px] rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(255,110,199,0.5), transparent 60%)',
          filter: 'blur(70px)',
          ...b,
        }}
      />
      <div
        className="absolute bottom-[-12%] right-[-10%] h-[520px] w-[520px] rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(92,200,255,0.5), transparent 60%)',
          filter: 'blur(70px)',
          ...c,
        }}
      />
      <div
        className="absolute bottom-[-14%] left-[-8%] h-[420px] w-[420px] rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(255,184,108,0.45), transparent 60%)',
          filter: 'blur(60px)',
          ...a,
        }}
      />
    </div>
  );
}
