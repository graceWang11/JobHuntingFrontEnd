import { useEffect, useRef, useState } from 'react';

interface PointerPos {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

let listenerCount = 0;
let sharedPos: PointerPos = { x: 0, y: 0 };
let target: PointerPos = { x: 0, y: 0 };
let rafId: number | null = null;
const subscribers = new Set<(p: PointerPos) => void>();

function ensureListener() {
  if (listenerCount === 0) {
    const onMove = (e: MouseEvent) => {
      target = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
      if (rafId == null) rafId = requestAnimationFrame(tick);
    };
    const tick = () => {
      // Ease toward target
      sharedPos.x += (target.x - sharedPos.x) * 0.08;
      sharedPos.y += (target.y - sharedPos.y) * 0.08;
      subscribers.forEach((s) => s(sharedPos));
      if (Math.abs(target.x - sharedPos.x) > 0.001 || Math.abs(target.y - sharedPos.y) > 0.001) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    (window as unknown as { __driftrPointer?: () => void }).__driftrPointer = () => {
      window.removeEventListener('mousemove', onMove);
    };
  }
  listenerCount += 1;
}

function releaseListener() {
  listenerCount -= 1;
  if (listenerCount <= 0) {
    listenerCount = 0;
    const cleanup = (window as unknown as { __driftrPointer?: () => void }).__driftrPointer;
    cleanup?.();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export function useParallaxPointer(): PointerPos {
  const [pos, setPos] = useState<PointerPos>({ x: 0, y: 0 });

  useEffect(() => {
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) return;

    ensureListener();
    const sub = (p: PointerPos) => setPos({ x: p.x, y: p.y });
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
      releaseListener();
    };
  }, []);

  return pos;
}

interface UseParallaxStyleOptions {
  depth?: number; // 1-30 px shift at extremes
  rotate?: number; // 0-12 deg
  scaleOnHover?: boolean;
}

export function useParallaxStyle({ depth = 12, rotate = 0 }: UseParallaxStyleOptions = {}) {
  const pos = useParallaxPointer();
  return {
    transform: `translate3d(${(-pos.x * depth).toFixed(2)}px, ${(-pos.y * depth).toFixed(2)}px, 0) ${
      rotate ? `rotateX(${(pos.y * rotate).toFixed(2)}deg) rotateY(${(-pos.x * rotate).toFixed(2)}deg)` : ''
    }`,
    transition: 'transform 120ms linear',
    willChange: 'transform',
  } as React.CSSProperties;
}

// Element-tilt: tilts relative to element center (not page)
export function useTilt({ max = 8 }: { max?: number } = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) return;

    let frame = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setStyle({
          transform: `perspective(900px) rotateX(${(-dy * max).toFixed(2)}deg) rotateY(${(dx * max).toFixed(2)}deg) translateZ(0)`,
          transition: 'transform 120ms ease-out',
          willChange: 'transform',
        });
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      setStyle({
        transform: 'perspective(900px) rotateX(0) rotateY(0)',
        transition: 'transform 400ms cubic-bezier(.2,.8,.2,1)',
      });
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, [max]);

  return { ref, style } as const;
}
