// Backend seam for tracked-job state (interested / applied / pipeline).
//
// When VITE_USE_REAL_TRACKED_JOBS=true, calls hit the live backend:
//   GET    /api/tracked-jobs                                  -> TrackedJob[]
//   POST   /api/tracked-jobs       { jobId, status? }         -> TrackedJob
//   PATCH  /api/tracked-jobs/{id}  { status?, interviewAt?,
//                                    interviewLocation? }     -> TrackedJob
//   DELETE /api/tracked-jobs/{id}                             -> { jobId }
//
// Otherwise the mocks below run so the UI works offline. Mock store lives
// in-memory only — refresh wipes it (intentional; same pattern as email.ts).

import { apiFetch, envFlag } from './apiFetch';
import type { ApplicationStatus, Job, TrackedJob } from './types';

const USE_REAL = envFlag('VITE_USE_REAL_TRACKED_JOBS');

// ── Mock store (only used when USE_REAL is false) ────────────────────────────

const _mockStore = new Map<string, TrackedJob>();

function _nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function _mockUpsert(
  jobId: string,
  status: ApplicationStatus,
  job: Job,
): TrackedJob {
  const existing = _mockStore.get(jobId);
  const now = _nowIso();
  const next: TrackedJob = {
    jobId,
    status,
    trackedAt: existing?.trackedAt ?? now,
    updatedAt: now,
    appliedAt:
      status === 'applied' || status === 'screening' || status === 'interview' || status === 'offer'
        ? existing?.appliedAt ?? now
        : existing?.appliedAt ?? null,
    interviewAt: existing?.interviewAt ?? null,
    interviewLocation: existing?.interviewLocation ?? null,
    lastEvidenceThreadId: existing?.lastEvidenceThreadId ?? null,
    isStale: existing?.isStale ?? false,
    daysSinceApplied: existing?.daysSinceApplied ?? null,
    source: existing?.source ?? 'manual',
    job,
  };
  _mockStore.set(jobId, next);
  return next;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function listTrackedJobs(): Promise<TrackedJob[]> {
  if (USE_REAL) return apiFetch<TrackedJob[]>('/api/tracked-jobs');
  await new Promise((r) => setTimeout(r, 50));
  return Array.from(_mockStore.values()).sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  );
}

export interface TrackJobInput {
  jobId: string;
  status?: ApplicationStatus;
  // Job snapshot is required for mocks (so the row has metadata to render);
  // backend may ignore it once the row already exists server-side, but it's
  // cheap to send and keeps the seam symmetric with the upsert semantics.
  job: Job;
}

export async function trackJob({
  jobId,
  status = 'interested',
  job,
}: TrackJobInput): Promise<TrackedJob> {
  if (USE_REAL) {
    return apiFetch<TrackedJob>('/api/tracked-jobs', {
      method: 'POST',
      json: { jobId, status, job },
    });
  }
  await new Promise((r) => setTimeout(r, 50));
  return _mockUpsert(jobId, status, job);
}

export interface PatchTrackedJobBody {
  status?: ApplicationStatus;
  interviewAt?: string | null;
  interviewLocation?: string | null;
}

export async function patchTrackedJob(
  jobId: string,
  body: PatchTrackedJobBody,
): Promise<TrackedJob> {
  if (USE_REAL) {
    return apiFetch<TrackedJob>(`/api/tracked-jobs/${encodeURIComponent(jobId)}`, {
      method: 'PATCH',
      json: body,
    });
  }
  await new Promise((r) => setTimeout(r, 50));
  const existing = _mockStore.get(jobId);
  if (!existing) throw new Error(`mock: no tracked job ${jobId} to patch`);
  const next: TrackedJob = {
    ...existing,
    status: body.status ?? existing.status,
    interviewAt: body.interviewAt === undefined ? existing.interviewAt : body.interviewAt,
    interviewLocation:
      body.interviewLocation === undefined ? existing.interviewLocation : body.interviewLocation,
    updatedAt: _nowIso(),
  };
  _mockStore.set(jobId, next);
  return next;
}

export async function untrackJob(jobId: string): Promise<{ jobId: string }> {
  if (USE_REAL) {
    return apiFetch<{ jobId: string }>(
      `/api/tracked-jobs/${encodeURIComponent(jobId)}`,
      { method: 'DELETE' },
    );
  }
  await new Promise((r) => setTimeout(r, 50));
  _mockStore.delete(jobId);
  return { jobId };
}
