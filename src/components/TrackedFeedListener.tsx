// Invisible component that bridges SSE tracked.* events to the toast layer.
// Mounted once inside RequireAuth + TrackedJobsProvider + ToastProvider so the
// useTrackedFeed subscription owns the only listener for tracked.status.changed.

import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTrackedJobs } from '../context/TrackedJobsContext';
import { useTrackedFeed } from '../lib/useTrackedFeed';

const HUMAN_STATUS: Record<string, string> = {
  saved: 'Saved',
  interested: 'Interested',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export function TrackedFeedListener() {
  const { enqueue } = useToast();
  const { byId } = useTrackedJobs();
  const navigate = useNavigate();

  useTrackedFeed({
    onAutoDetect: (n) => {
      const row = byId.get(n.jobId);
      const company = row?.job.company ?? 'a tracked job';
      const sender = n.evidenceSender || 'inbox';
      const status = HUMAN_STATUS[n.status] ?? n.status;
      enqueue({
        title: `Auto-detected: ${status}`,
        body: `${company} · based on email from ${sender}`,
        tone: n.status === 'rejected' ? 'warn' : 'success',
        onClick: () => {
          // Land on /tracked with the row pre-expanded; Tracked.tsx reads the
          // query param on mount.
          navigate(`/tracked?expand=${encodeURIComponent(n.jobId)}`);
        },
      });
    },
  });

  return null;
}
