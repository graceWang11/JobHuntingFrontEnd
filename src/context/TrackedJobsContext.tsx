import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchTracked,
  trackJob,
  untrackJob,
  type TrackedJob,
} from '../lib/tracked';
import type { ApplicationStatus, Job } from '../lib/types';

interface TrackedJobsContextValue {
  tracked: TrackedJob[];
  byId: Map<string, TrackedJob>;
  loading: boolean;
  setStatus: (jobId: string, status: ApplicationStatus, job: Job) => Promise<void>;
  remove: (jobId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const TrackedJobsContext = createContext<TrackedJobsContextValue | null>(null);

export function TrackedJobsProvider({ children }: { children: ReactNode }) {
  const [tracked, setTracked] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchTracked();
      setTracked(rows);
    } catch {
      // Network or 401 — leave the existing list in place so the UI doesn't blank.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setStatus = useCallback(
    async (jobId: string, status: ApplicationStatus, job: Job) => {
      // Optimistic upsert
      const nowIso = new Date().toISOString();
      setTracked((prev) => {
        const existing = prev.find((t) => t.jobId === jobId);
        if (existing) {
          return prev.map((t) =>
            t.jobId === jobId ? { ...t, status, job, updatedAt: nowIso } : t,
          );
        }
        return [
          { jobId, status, trackedAt: nowIso, updatedAt: nowIso, job },
          ...prev,
        ];
      });
      try {
        const saved = await trackJob(jobId, status, job);
        setTracked((prev) => prev.map((t) => (t.jobId === jobId ? saved : t)));
      } catch {
        // Roll back by refetching the truth.
        refresh();
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (jobId: string) => {
      // Optimistic removal
      setTracked((prev) => prev.filter((t) => t.jobId !== jobId));
      try {
        await untrackJob(jobId);
      } catch {
        refresh();
      }
    },
    [refresh],
  );

  const byId = useMemo(() => {
    const m = new Map<string, TrackedJob>();
    for (const t of tracked) m.set(t.jobId, t);
    return m;
  }, [tracked]);

  const value: TrackedJobsContextValue = useMemo(
    () => ({ tracked, byId, loading, setStatus, remove, refresh }),
    [tracked, byId, loading, setStatus, remove, refresh],
  );

  return (
    <TrackedJobsContext.Provider value={value}>{children}</TrackedJobsContext.Provider>
  );
}

export function useTrackedJobs() {
  const ctx = useContext(TrackedJobsContext);
  if (!ctx) throw new Error('useTrackedJobs must be used inside TrackedJobsProvider');
  return ctx;
}
