import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  listTrackedJobs,
  patchTrackedJob,
  trackJob,
  untrackJob,
} from '../lib/trackedJobs';
import type { ApplicationStatus, Job, TrackedJob } from '../lib/types';

interface PatchInput {
  status?: ApplicationStatus;
  interviewAt?: string | null;
  interviewLocation?: string | null;
}

interface TrackedJobsContextValue {
  tracked: TrackedJob[];
  byId: Map<string, TrackedJob>;
  loading: boolean;
  /** Idempotent upsert. Sends POST when the row is new, PATCH when only the
   *  status changes on an existing row. */
  setStatus: (jobId: string, status: ApplicationStatus, job: Job) => Promise<void>;
  /** Partial update for non-status fields (interview details). PATCH only. */
  patch: (jobId: string, body: PatchInput) => Promise<void>;
  /** DELETE the tracked row. */
  remove: (jobId: string) => Promise<void>;
  /** Re-pull from the server (cancels in-flight on remount). */
  refresh: () => Promise<void>;
  /** SSE entry point: merge a server-pushed row into local state without
   *  triggering a refetch. Used by useTrackedFeed. */
  applyPush: (row: TrackedJob) => void;
}

const TrackedJobsContext = createContext<TrackedJobsContextValue | null>(null);

export function TrackedJobsProvider({ children }: { children: ReactNode }) {
  const [tracked, setTracked] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  // Sequence guard so a stale list response can't overwrite a fresh one.
  const fetchSeqRef = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    try {
      const rows = await listTrackedJobs();
      if (fetchSeqRef.current === seq) setTracked(rows);
    } catch {
      // Leave the existing list in place so a transient network blip
      // doesn't blank the UI.
    } finally {
      if (fetchSeqRef.current === seq) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const _replaceRow = useCallback((next: TrackedJob) => {
    setTracked((prev) => {
      const i = prev.findIndex((t) => t.jobId === next.jobId);
      if (i === -1) return [next, ...prev];
      const copy = prev.slice();
      copy[i] = next;
      return copy;
    });
  }, []);

  const _removeRow = useCallback((jobId: string) => {
    setTracked((prev) => prev.filter((t) => t.jobId !== jobId));
  }, []);

  const setStatus = useCallback(
    async (jobId: string, status: ApplicationStatus, job: Job) => {
      const existing = tracked.find((t) => t.jobId === jobId);
      const nowIso = new Date().toISOString();
      // Optimistic upsert
      const optimistic: TrackedJob = existing
        ? { ...existing, status, updatedAt: nowIso, job, source: 'manual' }
        : {
            jobId,
            status,
            trackedAt: nowIso,
            updatedAt: nowIso,
            appliedAt: null,
            interviewAt: null,
            interviewLocation: null,
            lastEvidenceThreadId: null,
            isStale: false,
            daysSinceApplied: null,
            source: 'manual',
            job,
          };
      _replaceRow(optimistic);
      try {
        const server = existing
          ? await patchTrackedJob(jobId, { status })
          : await trackJob({ jobId, status, job });
        _replaceRow(server);
      } catch {
        // Roll back via authoritative refetch.
        refresh();
      }
    },
    [tracked, refresh, _replaceRow],
  );

  const patch = useCallback(
    async (jobId: string, body: PatchInput) => {
      const existing = tracked.find((t) => t.jobId === jobId);
      if (!existing) return;
      const optimistic: TrackedJob = {
        ...existing,
        status: body.status ?? existing.status,
        interviewAt: body.interviewAt === undefined ? existing.interviewAt : body.interviewAt,
        interviewLocation:
          body.interviewLocation === undefined
            ? existing.interviewLocation
            : body.interviewLocation,
        updatedAt: new Date().toISOString(),
      };
      _replaceRow(optimistic);
      try {
        const server = await patchTrackedJob(jobId, body);
        _replaceRow(server);
      } catch {
        refresh();
      }
    },
    [tracked, refresh, _replaceRow],
  );

  const remove = useCallback(
    async (jobId: string) => {
      _removeRow(jobId);
      try {
        await untrackJob(jobId);
      } catch {
        refresh();
      }
    },
    [refresh, _removeRow],
  );

  const applyPush = useCallback(
    (row: TrackedJob) => {
      _replaceRow(row);
    },
    [_replaceRow],
  );

  const byId = useMemo(() => {
    const m = new Map<string, TrackedJob>();
    for (const t of tracked) m.set(t.jobId, t);
    return m;
  }, [tracked]);

  const value: TrackedJobsContextValue = useMemo(
    () => ({ tracked, byId, loading, setStatus, patch, remove, refresh, applyPush }),
    [tracked, byId, loading, setStatus, patch, remove, refresh, applyPush],
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
