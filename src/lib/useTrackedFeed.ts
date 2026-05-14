// SSE consumer that only handles tracked.* events. Kept separate from
// useEmailFeed so the email widget's rerenders don't cascade into the tracking
// widgets and vice versa.
//
// The hook itself does no UI — it merges server pushes into TrackedJobsContext
// and optionally forwards an auto-detect notification upward (the toast layer
// owns the actual rendering).

import { useEffect } from 'react';
import { subscribeEmailFeed, type EmailEvent } from './email';
import { useTrackedJobs } from '../context/TrackedJobsContext';
import type { ApplicationStatus, TrackedJob, TrackedSource } from './types';

export interface AutoDetectNotice {
  jobId: string;
  previousStatus: ApplicationStatus;
  status: ApplicationStatus;
  source: TrackedSource;
  evidenceThreadId?: string;
  evidenceSender?: string;
}

interface UseTrackedFeedOptions {
  /** Fired once per auto-detected status change (source === 'email'). The
   *  consumer is expected to enqueue a toast and, on click, expand the row. */
  onAutoDetect?: (notice: AutoDetectNotice) => void;
}

export function useTrackedFeed({ onAutoDetect }: UseTrackedFeedOptions = {}) {
  const { applyPush, refresh, patch } = useTrackedJobs();

  useEffect(() => {
    const unsubscribe = subscribeEmailFeed((event: EmailEvent) => {
      if (event.type === 'tracked.status.changed') {
        // Prefer the inline row when the backend ships it (cheaper).
        if (event.row) {
          applyPush(event.row as TrackedJob);
        } else {
          // Otherwise patch what we know optimistically; refresh in the
          // background to pull any derived fields (daysSinceApplied, isStale).
          patch(event.jobId, {
            status: event.status,
            interviewAt: event.interviewAt ?? null,
          });
          refresh();
        }
        if (event.source === 'email' && onAutoDetect) {
          onAutoDetect({
            jobId: event.jobId,
            previousStatus: event.previousStatus,
            status: event.status,
            source: event.source,
            evidenceThreadId: event.evidenceThreadId,
            evidenceSender: event.evidenceSender,
          });
        }
        return;
      }
      if (event.type === 'tracked.stale') {
        if (event.row) {
          applyPush(event.row as TrackedJob);
        } else {
          // No inline row — refresh so daysSinceApplied + isStale come from
          // the server, not a client-side heuristic.
          refresh();
        }
        return;
      }
      // All other event types are handled by useEmailFeed.
    });
    return () => unsubscribe();
  }, [applyPush, patch, refresh, onAutoDetect]);
}
