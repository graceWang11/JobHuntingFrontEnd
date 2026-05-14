import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';

export interface ToastInput {
  /** Short title (bold). */
  title: string;
  /** Optional secondary line. */
  body?: string;
  /** Auto-dismiss after this many ms. Defaults to 6000. Set to 0 to stay open. */
  durationMs?: number;
  /** Invoked when the user clicks the toast. The toast is dismissed before
   *  the handler runs. */
  onClick?: () => void;
  /** Tone affects the left edge accent. */
  tone?: 'info' | 'success' | 'warn';
}

interface Toast extends ToastInput {
  id: string;
}

interface ToastContextValue {
  enqueue: (t: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_RING: Record<NonNullable<ToastInput['tone']>, string> = {
  info: 'ring-accent-violet/30',
  success: 'ring-emerald-300',
  warn: 'ring-accent-peach/60',
};

const TONE_BAR: Record<NonNullable<ToastInput['tone']>, string> = {
  info: 'bg-accent-violet',
  success: 'bg-emerald-500',
  warn: 'bg-accent-peach',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seqRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const enqueue = useCallback(
    (t: ToastInput) => {
      const id = `t-${++seqRef.current}`;
      const tone = t.tone ?? 'info';
      const toast: Toast = { ...t, tone, id };
      setToasts((prev) => [...prev, toast]);
      const duration = t.durationMs ?? 6000;
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ enqueue, dismiss }), [enqueue, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              dismiss(t.id);
              t.onClick?.();
            }}
            className={cn(
              'pointer-events-auto group max-w-sm text-left rounded-2xl glass-strong shadow-lg',
              'ring-1 transition hover:scale-[1.02]',
              TONE_RING[t.tone ?? 'info'],
            )}
          >
            <div className="flex">
              <div className={cn('w-1 rounded-l-2xl', TONE_BAR[t.tone ?? 'info'])} />
              <div className="px-4 py-3 flex-1">
                <div className="font-semibold text-ink text-sm">{t.title}</div>
                {t.body && (
                  <div className="text-xs text-ink-mute mt-0.5">{t.body}</div>
                )}
                {t.onClick && (
                  <div className="text-[10px] uppercase tracking-wider font-bold text-accent-violet mt-1 opacity-0 group-hover:opacity-100 transition">
                    Click to open
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
