// Backend seam for the email-activity feature.
//
// When VITE_USE_REAL_EMAIL=true, calls hit the live backend:
//   GET    /api/email/status               -> EmailStatus
//   GET    /api/email/stream               -> SSE (named events in the EmailEvent union)
//   POST   /api/email/followups            -> ScheduledFollowUp
//   DELETE /api/email/followups/{id}       -> { id }
//   POST   /api/email/threads/{id}/read    -> { threadId }
//
// Otherwise the mocks below run so the UI works offline.

import { API_BASE_URL, apiFetch, envFlag } from './apiFetch';
import type { ApplicationStatus, TrackedJob, TrackedSource } from './types';

const USE_REAL = envFlag('VITE_USE_REAL_EMAIL');

export interface EmailThread {
  threadId: string;
  jobId?: string;
  from: { name: string; email: string };
  subject: string;
  snippet: string;
  receivedAt: string; // ISO
  unread: boolean;
}

export interface ScheduledFollowUp {
  id: string;
  jobId?: string;
  to: { name: string; email: string };
  scheduledFor: string; // ISO
  template: string;
}

export interface EmailStatus {
  outbound: {
    sentTotal: number;
    sentToday: number;
    lastSentAt: string | null;
    inFlight: number;
  };
  inbound: {
    threadsTotal: number;
    unread: number;
    repliesToday: number;
    latestThreads: EmailThread[];
  };
  followUps: {
    scheduledTotal: number;
    items: ScheduledFollowUp[];
  };
}

export type EmailEvent =
  | { type: 'email.sent'; messageId: string; jobId?: string; to: string; sentAt: string }
  | {
      type: 'email.reply';
      threadId: string;
      jobId?: string;
      from: { name: string; email: string };
      subject: string;
      snippet: string;
      receivedAt: string;
    }
  | {
      type: 'followup.scheduled';
      id: string;
      jobId?: string;
      to: { name: string; email: string };
      scheduledFor: string;
      template: string;
    }
  | { type: 'followup.fired'; id: string; messageId: string }
  | { type: 'followup.cancelled'; id: string; reason: 'user' | 'reply-received' | 'job-closed' }
  // Tracking events — emitted when the classifier (or a manual action) changes
  // a tracked-job row. Consumed by useTrackedFeed, not useEmailFeed.
  | {
      type: 'tracked.status.changed';
      jobId: string;
      previousStatus: ApplicationStatus;
      status: ApplicationStatus;
      source: TrackedSource;
      evidenceThreadId?: string;
      interviewAt?: string;
      /** Full row, when the backend ships it inline. Optional — consumers should
       *  tolerate its absence and either re-fetch or patch from the other fields. */
      row?: TrackedJob;
      /** For the auto-detect toast: human-readable sender of the email that
       *  triggered the change. */
      evidenceSender?: string;
    }
  | {
      type: 'tracked.stale';
      jobId: string;
      daysSinceApplied: number;
      row?: TrackedJob;
    };

const nowIso = () => new Date().toISOString();
const addMin = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
const subMin = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export async function fetchEmailStatus(): Promise<EmailStatus> {
  if (USE_REAL) return apiFetch<EmailStatus>('/api/email/status');
  await new Promise((r) => setTimeout(r, 250));
  return {
    outbound: {
      sentTotal: 47,
      sentToday: 6,
      lastSentAt: subMin(14),
      inFlight: 2,
    },
    inbound: {
      threadsTotal: 23,
      unread: 3,
      repliesToday: 4,
      latestThreads: [
        {
          threadId: 't1',
          jobId: 'j1',
          from: { name: 'Mira Chen', email: 'mira@lumenlabs.co' },
          subject: 'Re: Senior Frontend Engineer at Lumen Labs',
          snippet: 'Thanks for reaching out! Could you grab 30 min next Tuesday…',
          receivedAt: subMin(32),
          unread: true,
        },
        {
          threadId: 't2',
          jobId: 'j2',
          from: { name: 'Northwind Recruiting', email: 'hello@northwind.team' },
          subject: 'Product Designer — screening',
          snippet: 'Quick portfolio review before we move forward…',
          receivedAt: subMin(180),
          unread: true,
        },
        {
          threadId: 't3',
          from: { name: 'Bramble Talent', email: 'jobs@bramble.dev' },
          subject: 'Re: Full Stack role',
          snippet: 'We loved your background — sending you a take-home shortly.',
          receivedAt: subMin(420),
          unread: false,
        },
      ],
    },
    followUps: {
      scheduledTotal: 5,
      items: [
        {
          id: 'f1',
          jobId: 'j3',
          to: { name: 'Bramble Talent', email: 'jobs@bramble.dev' },
          scheduledFor: addMin(60 * 18),
          template: 'second-touch',
        },
        {
          id: 'f2',
          jobId: 'j4',
          to: { name: 'Polaris Mint', email: 'careers@polaris.mint' },
          scheduledFor: addMin(60 * 36),
          template: 'thank-you',
        },
        {
          id: 'f3',
          to: { name: 'Stripe Recruiting', email: 'recruit@stripe.com' },
          scheduledFor: addMin(60 * 72),
          template: 'second-touch',
        },
      ],
    },
  };
}

// Mock event stream. Backend will replace this with an SSE subscription:
//
//   const src = new EventSource('/api/email/stream');
//   src.addEventListener('email.sent', (e) => onEvent({ type: 'email.sent', ...JSON.parse(e.data) }));
//   src.addEventListener('email.reply', ...);
//   ...
//   return () => src.close();
export function subscribeEmailFeed(onEvent: (e: EmailEvent) => void): () => void {
  if (USE_REAL) {
    const src = new EventSource(`${API_BASE_URL}/api/email/stream`, { withCredentials: true });
    const wrap =
      <T extends EmailEvent['type']>(type: T) =>
      (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data);
          onEvent({ type, ...data } as EmailEvent);
        } catch {
          // ignore malformed payloads
        }
      };
    src.addEventListener('email.sent', wrap('email.sent'));
    src.addEventListener('email.reply', wrap('email.reply'));
    src.addEventListener('followup.scheduled', wrap('followup.scheduled'));
    src.addEventListener('followup.fired', wrap('followup.fired'));
    src.addEventListener('followup.cancelled', wrap('followup.cancelled'));
    src.addEventListener('tracked.status.changed', wrap('tracked.status.changed'));
    src.addEventListener('tracked.stale', wrap('tracked.stale'));
    return () => src.close();
  }
  let i = 0;
  const handle = window.setInterval(() => {
    i += 1;
    if (i % 3 === 0) {
      onEvent({
        type: 'email.sent',
        messageId: `m-${Date.now()}`,
        to: 'recruiter@somewhere.io',
        sentAt: nowIso(),
      });
    } else if (i % 3 === 1) {
      onEvent({
        type: 'email.reply',
        threadId: `t-${Date.now()}`,
        from: { name: 'New Recruiter', email: 'new@startup.io' },
        subject: 'Re: your application',
        snippet: 'Got a moment to chat this week?',
        receivedAt: nowIso(),
      });
    } else {
      onEvent({
        type: 'followup.fired',
        id: `f-${Date.now()}`,
        messageId: `m-${Date.now()}`,
      });
    }
  }, 12_000);
  return () => window.clearInterval(handle);
}

// Action stubs — replace bodies with real fetch() calls.
export async function scheduleFollowUp(input: Omit<ScheduledFollowUp, 'id'>): Promise<ScheduledFollowUp> {
  if (USE_REAL) {
    return apiFetch<ScheduledFollowUp>('/api/email/followups', { method: 'POST', json: input });
  }
  await new Promise((r) => setTimeout(r, 200));
  return { id: `f-${Date.now()}`, ...input };
}

export async function cancelFollowUp(id: string): Promise<{ id: string }> {
  if (USE_REAL) {
    return apiFetch<{ id: string }>(`/api/email/followups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
  await new Promise((r) => setTimeout(r, 150));
  return { id };
}

export async function markThreadRead(threadId: string): Promise<{ threadId: string }> {
  if (USE_REAL) {
    return apiFetch<{ threadId: string }>(
      `/api/email/threads/${encodeURIComponent(threadId)}/read`,
      { method: 'POST' },
    );
  }
  await new Promise((r) => setTimeout(r, 100));
  return { threadId };
}
