// Backend seam for job matching.
//
// When VITE_USE_REAL_JOBS=true, calls hit POST /api/jobs/match
// (?refresh=1 bypasses the backend cache). Otherwise the in-memory
// DUMMY_JOBS dataset is sorted client-side as a fallback.

import { DUMMY_JOBS } from '../data/jobs';
import { apiFetch, envFlag } from './apiFetch';
import type { Job, UserPreferences } from './types';

const USE_REAL = envFlag('VITE_USE_REAL_JOBS');

export interface JobMatchRequest {
  preferences: UserPreferences;
  resumeSkills: string[];
  limit?: number;
}

export interface JobMatchResponse {
  cachedAt: string;
  fresh: boolean;
  jobs: Job[];
}

export async function fetchMatchedJobs(
  req: JobMatchRequest,
  opts: { refresh?: boolean } = {},
): Promise<Job[]> {
  if (USE_REAL) {
    const qs = opts.refresh ? '?refresh=1' : '';
    const res = await apiFetch<JobMatchResponse>(`/api/jobs/match${qs}`, {
      method: 'POST',
      json: req,
    });
    return res.jobs;
  }
  await new Promise((r) => setTimeout(r, 300));
  return [...DUMMY_JOBS]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, req.limit ?? 8);
}

// Variant exposing the cache metadata for "updated 12 min ago" UIs and
// the manual-refresh button on /jobs.
export async function fetchMatchedJobsWithMeta(
  req: JobMatchRequest,
  opts: { refresh?: boolean } = {},
): Promise<JobMatchResponse> {
  if (USE_REAL) {
    const qs = opts.refresh ? '?refresh=1' : '';
    return apiFetch<JobMatchResponse>(`/api/jobs/match${qs}`, {
      method: 'POST',
      json: req,
    });
  }
  await new Promise((r) => setTimeout(r, 300));
  const jobs = [...DUMMY_JOBS]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, req.limit ?? 8);
  return { cachedAt: new Date().toISOString(), fresh: !!opts.refresh, jobs };
}
