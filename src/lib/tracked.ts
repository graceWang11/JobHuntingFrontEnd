// Backend seam for saved/applied/pipeline tracking.
//
// All calls hit:
//   GET    /api/jobs/tracked            -> TrackedJob[]
//   PUT    /api/jobs/tracked/{job_id}   -> TrackedJob (upsert, body includes job snapshot)
//   DELETE /api/jobs/tracked/{job_id}   -> { jobId, removed }
//
// The backend snapshots the Job object on PUT so a tracked listing keeps its
// metadata (title, recruiters, description) even after the source CSV rotates.

import { apiFetch } from './apiFetch';
import type { ApplicationStatus, Job } from './types';

export interface TrackedJob {
  jobId: string;
  status: ApplicationStatus;
  trackedAt: string;
  updatedAt: string;
  job: Job;
}

export function fetchTracked(): Promise<TrackedJob[]> {
  return apiFetch<TrackedJob[]>('/api/jobs/tracked');
}

export function trackJob(
  jobId: string,
  status: ApplicationStatus,
  job: Job,
): Promise<TrackedJob> {
  return apiFetch<TrackedJob>(`/api/jobs/tracked/${encodeURIComponent(jobId)}`, {
    method: 'PUT',
    json: { status, job },
  });
}

export function untrackJob(jobId: string): Promise<{ jobId: string; removed: boolean }> {
  return apiFetch<{ jobId: string; removed: boolean }>(
    `/api/jobs/tracked/${encodeURIComponent(jobId)}`,
    { method: 'DELETE' },
  );
}
