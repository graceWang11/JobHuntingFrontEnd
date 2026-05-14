import { useEffect, useState } from 'react';
import {
  fetchEmailStatus,
  subscribeEmailFeed,
  type EmailEvent,
  type EmailStatus,
} from './email';

function applyEvent(prev: EmailStatus, e: EmailEvent): EmailStatus {
  switch (e.type) {
    case 'email.sent':
      return {
        ...prev,
        outbound: {
          ...prev.outbound,
          sentTotal: prev.outbound.sentTotal + 1,
          sentToday: prev.outbound.sentToday + 1,
          lastSentAt: e.sentAt,
          inFlight: Math.max(0, prev.outbound.inFlight - 1),
        },
      };
    case 'email.reply':
      return {
        ...prev,
        inbound: {
          ...prev.inbound,
          threadsTotal: prev.inbound.threadsTotal + 1,
          unread: prev.inbound.unread + 1,
          repliesToday: prev.inbound.repliesToday + 1,
          latestThreads: [
            {
              threadId: e.threadId,
              jobId: e.jobId,
              from: e.from,
              subject: e.subject,
              snippet: e.snippet,
              receivedAt: e.receivedAt,
              unread: true,
            },
            ...prev.inbound.latestThreads.slice(0, 4),
          ],
        },
      };
    case 'followup.scheduled':
      return {
        ...prev,
        followUps: {
          scheduledTotal: prev.followUps.scheduledTotal + 1,
          items: [
            {
              id: e.id,
              jobId: e.jobId,
              to: e.to,
              scheduledFor: e.scheduledFor,
              template: e.template,
            },
            ...prev.followUps.items,
          ].slice(0, 6),
        },
      };
    case 'followup.fired':
      return {
        ...prev,
        followUps: {
          scheduledTotal: Math.max(0, prev.followUps.scheduledTotal - 1),
          items: prev.followUps.items.filter((f) => f.id !== e.id),
        },
        outbound: {
          ...prev.outbound,
          sentTotal: prev.outbound.sentTotal + 1,
          sentToday: prev.outbound.sentToday + 1,
          lastSentAt: new Date().toISOString(),
        },
      };
    case 'followup.cancelled':
      return {
        ...prev,
        followUps: {
          scheduledTotal: Math.max(0, prev.followUps.scheduledTotal - 1),
          items: prev.followUps.items.filter((f) => f.id !== e.id),
        },
      };
  }
}

export function useEmailFeed() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchEmailStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeEmailFeed((event) => {
      setStatus((prev) => (prev ? applyEvent(prev, event) : prev));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { status, loading };
}
