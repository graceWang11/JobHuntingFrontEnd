import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  MapPin,
  Home,
  Building2,
  Plane,
  Filter,
  Heart,
  Send,
  X,
  CalendarClock,
  ShieldCheck,
  DollarSign,
  Sparkles,
  Bookmark,
  ChevronDown,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"/>
    </svg>
  );
}
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { ParallaxLayer } from '../components/ui/Parallax';
import { Toggle } from '../components/ui/Toggle';
import { RangeSlider } from '../components/ui/RangeSlider';
import { Progress } from '../components/ui/Progress';
import { TagInput } from '../components/ui/TagInput';
import { useUser } from '../context/UserContext';
import { useTrackedJobs } from '../context/TrackedJobsContext';
import { fetchMatchedJobs } from '../lib/jobs';
import { POPULAR_LOCATIONS } from '../data/locations';
import type { ApplicationStatus, Job, JobType } from '../lib/types';
import { cn } from '../lib/cn';

type Sort = 'match' | 'newest' | 'salary';

const JOB_TYPE_META: Record<JobType, { label: string; icon: React.ReactNode }> = {
  remote: { label: 'Remote', icon: <Home size={14} /> },
  hybrid: { label: 'Hybrid', icon: <Plane size={14} /> },
  onsite: { label: 'On-site', icon: <Building2 size={14} /> },
};

// Window-attached key so an HMR-replaced module instance can find and clear
// the interval its predecessor registered. Plain module-scoped state isn't
// enough — Vite swaps the whole module, and the old closure's cleanup is
// only guaranteed to run for React's normal unmount path, not for HMR.
const AUTO_REFRESH_INTERVAL_KEY = '__driftrJobsAutoRefreshIntervalId__';
type AutoRefreshGlobals = { [AUTO_REFRESH_INTERVAL_KEY]?: number | null };

export function Jobs() {
  const { preferences, setPreferences } = useUser();
  const { byId: trackedById, setStatus: setTrackedStatus, remove: removeTracked } = useTrackedJobs();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('match');
  const [showFilters, setShowFilters] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sequence-tracked loader so a slow in-flight fetch can't overwrite the
  // results of a newer one (e.g. fast manual Refresh after a slow auto tick).
  const requestSeqRef = useRef(0);
  const loadJobs = useCallback(
    (refresh: boolean) => {
      const seq = ++requestSeqRef.current;
      setLoadingMatches(true);
      return fetchMatchedJobs(
        { preferences, resumeSkills: preferences.keywords },
        { refresh },
      )
        .then((next) => {
          if (requestSeqRef.current === seq) {
            setJobs(next);
            setLastRefreshedAt(new Date());
          }
        })
        .finally(() => {
          if (requestSeqRef.current === seq) setLoadingMatches(false);
        });
    },
    [preferences],
  );

  useEffect(() => {
    loadJobs(false);
  }, [loadJobs]);

  // Always-fresh ref to loadJobs so the interval callback never closes over
  // a stale `preferences`. Lets the scheduled-tick effect depend only on the
  // interval length, not on the loader's identity — so changing keywords or
  // location doesn't kick the timer back to t=0 each time.
  const loadJobsRef = useRef(loadJobs);
  useEffect(() => {
    loadJobsRef.current = loadJobs;
  }, [loadJobs]);

  // Scheduled re-runs. preferences.autoRefreshMinutes === 0 disables.
  // Hardened against HMR module swaps via the window-attached key above.
  useEffect(() => {
    const w = window as Window & AutoRefreshGlobals;
    // Clear any leftover interval from a stale (HMR-replaced) module instance.
    const prev = w[AUTO_REFRESH_INTERVAL_KEY];
    if (typeof prev === 'number') {
      window.clearInterval(prev);
      w[AUTO_REFRESH_INTERVAL_KEY] = null;
    }
    const minutes = preferences.autoRefreshMinutes;
    if (!minutes || minutes <= 0) return;
    const id = window.setInterval(() => {
      loadJobsRef.current(true);
    }, minutes * 60_000);
    w[AUTO_REFRESH_INTERVAL_KEY] = id;
    return () => {
      window.clearInterval(id);
      if (w[AUTO_REFRESH_INTERVAL_KEY] === id) w[AUTO_REFRESH_INTERVAL_KEY] = null;
    };
  }, [preferences.autoRefreshMinutes]);

  const filtered = useMemo(() => {
    let arr: Job[] = jobs;
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    // visaSponsorship is intentionally not a hard filter: the backend already
    // drops citizenship-only / clearance-required roles upstream, and most
    // listings don't mention sponsorship at all. Filtering on the boolean
    // would hide most surviving listings. The flag still influences matchScore.

    if (sort === 'match') arr = [...arr].sort((a, b) => b.matchScore - a.matchScore);
    if (sort === 'newest') arr = [...arr].sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
    if (sort === 'salary') arr = [...arr].sort((a, b) => b.salaryMax - a.salaryMax);

    return arr;
  }, [query, sort, jobs]);

  const handleSetStatus = (job: Job, next: ApplicationStatus | null) => {
    if (next === null) removeTracked(job.id);
    else setTrackedStatus(job.id, next, job);
  };

  const toggleJobType = (t: JobType) => {
    setPreferences({
      jobTypes: preferences.jobTypes.includes(t)
        ? preferences.jobTypes.filter((x) => x !== t)
        : [...preferences.jobTypes, t],
    });
  };

  const toggleLocation = (l: string) => {
    setPreferences({
      locations: preferences.locations.includes(l)
        ? preferences.locations.filter((x) => x !== l)
        : [...preferences.locations, l],
    });
  };

  return (
    <div className="space-y-10" style={{ perspective: '1200px' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold text-ink">All jobs</h1>
          <p className="text-ink-mute">
            {loadingMatches && jobs.length === 0 ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Matching against your resume…
              </span>
            ) : (
              <>
                <span className="font-bold text-grad">{filtered.length}</span> matches from your
                automated scout
                {lastRefreshedAt && (
                  <span className="ml-2 text-ink-mute/80">
                    · updated {formatRefreshed(lastRefreshedAt)}
                  </span>
                )}
                {preferences.autoRefreshMinutes > 0 && (
                  <span className="ml-2 text-ink-mute/80">
                    · auto-refresh every {preferences.autoRefreshMinutes}m
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="neu-inset rounded-2xl p-1.5 flex gap-1">
            {(['match', 'newest', 'salary'] as Sort[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  'px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition',
                  sort === s
                    ? 'bg-accent-grad text-white shadow-[0_4px_14px_rgba(124,92,255,0.45)]'
                    : 'text-ink-soft hover:text-ink'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <Button
            variant="neu"
            size="sm"
            leftIcon={
              <RefreshCw
                size={14}
                className={cn(loadingMatches && 'animate-spin')}
              />
            }
            onClick={() => loadJobs(true)}
            disabled={loadingMatches}
          >
            Refresh
          </Button>
          <Button
            variant="neu"
            size="sm"
            leftIcon={<Filter size={14} />}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters
            <ChevronDown
              size={14}
              className={cn('transition', showFilters && 'rotate-180')}
            />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute"
        />
        <input
          placeholder="Search title, company, tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-neu pl-12"
        />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <ParallaxLayer depth={6}>
          <Card variant="glass" className="!p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-7">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2">
                Job type
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(JOB_TYPE_META) as JobType[]).map((t) => (
                  <Chip
                    key={t}
                    active={preferences.jobTypes.includes(t)}
                    onClick={() => toggleJobType(t)}
                    leftIcon={JOB_TYPE_META[t].icon}
                    className="!text-sm !px-3 !py-1.5"
                  >
                    {JOB_TYPE_META[t].label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2">
                Visa & relocation
              </div>
              <div className="neu rounded-2xl p-3 space-y-3">
                <Toggle
                  checked={preferences.visaSponsorship}
                  onChange={(v) => setPreferences({ visaSponsorship: v })}
                  label="Needs sponsorship"
                />
                <Toggle
                  checked={preferences.willingToRelocate}
                  onChange={(v) => setPreferences({ willingToRelocate: v })}
                  label="Willing to relocate"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <RangeSlider
                label="Salary range (USD)"
                min={40000}
                max={400000}
                step={5000}
                valueMin={preferences.minSalary}
                valueMax={preferences.maxSalary}
                onChange={({ min, max }) =>
                  setPreferences({ minSalary: min, maxSalary: max })
                }
                format={(n) => `$${(n / 1000).toFixed(0)}k`}
              />
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2">
                Locations
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_LOCATIONS.map((l) => (
                  <Chip
                    key={l}
                    active={preferences.locations.includes(l)}
                    onClick={() => toggleLocation(l)}
                    leftIcon={<MapPin size={12} />}
                    className="!text-xs"
                  >
                    {l}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <TagInput
                label="Keywords"
                values={preferences.keywords}
                onChange={(v) => setPreferences({ keywords: v })}
                placeholder="React, GraphQL, …"
                hint="We'll only show jobs with at least one matching tag"
              />
            </div>
          </div>
          </Card>
        </ParallaxLayer>
      )}

      {/* Job list — single column, click a row to expand its full detail inline */}
      <div className="space-y-4">
        {loadingMatches && jobs.length === 0 && (
          <Card variant="glass" className="text-center py-14">
            <Loader2 size={32} className="animate-spin mx-auto text-accent-violet" />
            <h3 className="font-display font-bold text-xl text-ink mt-3">Matching jobs…</h3>
            <p className="text-ink-mute mt-1">Pulling fresh listings from your scout.</p>
          </Card>
        )}
        {!loadingMatches && filtered.length === 0 && (
          <Card variant="glass" className="text-center py-14">
            <div className="text-5xl mb-3">🪺</div>
            <h3 className="font-display font-bold text-xl text-ink">No matches</h3>
            <p className="text-ink-mute mt-1">
              Loosen your filters or remove a keyword to expand the search.
            </p>
          </Card>
        )}
        {filtered.map((j, i) => {
          const t = trackedById.get(j.id);
          return (
            <ParallaxLayer key={j.id} depth={4 + (i % 4) * 3}>
              <JobRow
                job={j}
                expanded={selectedId === j.id}
                status={t?.status ?? null}
                onToggle={() => setSelectedId(selectedId === j.id ? null : j.id)}
                onSetStatus={(next) => handleSetStatus(j, next)}
              />
            </ParallaxLayer>
          );
        })}
      </div>
    </div>
  );
}

const STAGE_OPTIONS: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: 'Not tracked' },
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
];

const STAGE_TONE: Record<ApplicationStatus, string> = {
  saved: 'text-accent-sky',
  applied: 'text-grad',
  screening: 'text-accent-pink',
  interview: 'text-accent-peach',
  offer: 'text-accent-mint',
  rejected: 'text-accent-rose',
};

export function JobRow({
  job,
  expanded,
  status,
  onToggle,
  onSetStatus,
}: {
  job: Job;
  expanded: boolean;
  status: ApplicationStatus | null;
  onToggle: () => void;
  onSetStatus: (next: ApplicationStatus | null) => void;
}) {
  const saved = status === 'saved';
  const applied = status === 'applied';
  const toggleStatus = (next: ApplicationStatus) => {
    onSetStatus(status === next ? null : next);
  };

  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'rounded-3xl p-5 cursor-pointer transition group',
        expanded ? 'glass-strong ring-2 ring-accent-violet/40' : 'glass hover:bg-white/55'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 grid place-items-center text-3xl rounded-2xl neu-sm shrink-0">
          {job.companyEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-ink truncate">{job.title}</h3>
              <div className="text-sm text-ink-mute mt-0.5 truncate">
                {job.company} · {job.location}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="font-display font-extrabold text-lg text-grad">
                  {job.matchScore}%
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-mute">
                  match
                </div>
              </div>
              <ChevronDown
                size={18}
                className={cn(
                  'text-ink-mute transition-transform duration-200',
                  expanded && 'rotate-180'
                )}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Chip leftIcon={JOB_TYPE_META[job.type].icon} className="!text-[10px]">
              {JOB_TYPE_META[job.type].label}
            </Chip>
            <Chip leftIcon={<DollarSign size={11} />} className="!text-[10px]">
              ${(job.salaryMin / 1000).toFixed(0)}k–${(job.salaryMax / 1000).toFixed(0)}k
            </Chip>
            {job.visaSponsorship && (
              <Chip leftIcon={<ShieldCheck size={11} />} className="!text-[10px]">
                Sponsors visa
              </Chip>
            )}
            <Chip leftIcon={<CalendarClock size={11} />} className="!text-[10px]">
              {timeAgo(job.postedAt)}
            </Chip>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant={applied ? 'glass' : 'primary'}
              leftIcon={<Send size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                toggleStatus('applied');
              }}
            >
              {applied ? 'Applied' : 'Apply'}
            </Button>
            <Button
              size="sm"
              variant="neu"
              leftIcon={
                saved ? (
                  <Heart size={14} className="fill-accent-pink stroke-accent-pink" />
                ) : (
                  <Bookmark size={14} />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                toggleStatus('saved');
              }}
            >
              {saved ? 'Saved' : 'Save'}
            </Button>

            <div
              className="relative ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              <select
                value={status ?? ''}
                onChange={(e) => {
                  const v = e.target.value as ApplicationStatus | '';
                  onSetStatus(v === '' ? null : v);
                }}
                aria-label="Application stage"
                className={cn(
                  'appearance-none neu-sm rounded-xl pl-3 pr-7 py-2 text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-violet/40',
                  status ? STAGE_TONE[status] : 'text-ink-mute',
                )}
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink-mute"
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (status) onSetStatus(null);
              }}
              className="ml-auto h-9 w-9 grid place-items-center rounded-xl neu-sm text-ink-mute hover:text-accent-rose"
              title={status ? 'Untrack' : 'Dismiss'}
            >
              <X size={14} />
            </button>
          </div>

          {expanded && (
            <div
              className="mt-5 pt-5 border-t border-white/40"
              onClick={(e) => e.stopPropagation()}
            >
              <JobDetail job={job} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobDetail({ job }: { job: Job }) {
  const [message, setMessage] = useState(job.outreachMessage ?? '');
  const [copied, setCopied] = useState(false);

  // Reset the textarea when the expanded job changes.
  useEffect(() => {
    setMessage(job.outreachMessage ?? '');
    setCopied(false);
  }, [job.id, job.outreachMessage]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // navigator.clipboard requires HTTPS or localhost; ignore silently here.
    }
  };

  const hasContacts = !!job.recruiterContacts && job.recruiterContacts.length > 0;
  const hasRecruiterBlock = hasContacts || !!job.recruiterSearchUrl;

  return (
    <div>
      <div className="neu rounded-2xl p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Match</div>
        <div className="flex items-center justify-between mt-1">
          <div className="font-display text-3xl font-extrabold text-grad">{job.matchScore}%</div>
          <Sparkles size={20} className="text-accent-violet" />
        </div>
        <Progress value={job.matchScore} className="mt-2" />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <Mini label="Salary" value={`$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`} />
        <Mini label="Type" value={JOB_TYPE_META[job.type].label} />
        <Mini label="Location" value={job.location} />
        <Mini label="Source" value={job.source} />
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2">
          About the role
        </div>
        <p className="text-sm text-ink-soft leading-relaxed">{job.description}</p>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2">
          Tech & skills
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </div>

      {job.visaSponsorship && (
        <div className="mt-4 glass rounded-2xl p-3 flex items-center gap-2 text-sm text-ink-soft">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>
            <strong className="text-ink">Visa sponsorship offered</strong> for qualified candidates.
          </span>
        </div>
      )}

      {hasRecruiterBlock && (
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2">
            Recruiters
          </div>
          {hasContacts ? (
            <div className="space-y-2">
              {job.recruiterContacts!.map((c) => (
                <a
                  key={c.linkedinUrl}
                  href={c.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block neu rounded-2xl p-3 hover:bg-white/55 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 grid place-items-center rounded-xl bg-[#0a66c2] text-white shrink-0">
                      <LinkedInIcon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink truncate">
                        {c.name || 'LinkedIn profile'}
                      </div>
                      {c.title && (
                        <div className="text-xs text-ink-mute truncate">{c.title}</div>
                      )}
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-ink-mute group-hover:text-accent-violet shrink-0"
                    />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <a
              href={job.recruiterSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block neu rounded-2xl p-3 hover:bg-white/55 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 grid place-items-center rounded-xl bg-[#0a66c2] text-white shrink-0">
                  <LinkedInIcon size={16} />
                </div>
                <div className="min-w-0 flex-1 text-sm font-semibold text-ink">
                  Search recruiters on LinkedIn
                </div>
                <ExternalLink
                  size={14}
                  className="text-ink-mute group-hover:text-accent-violet shrink-0"
                />
              </div>
            </a>
          )}
        </div>
      )}

      {(job.outreachMessage || hasContacts) && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
              Outreach message
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-accent-violet transition"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Hi {recruiter}, I'd love to discuss the role…"
            className="w-full neu-inset rounded-2xl p-3 text-sm text-ink resize-none focus:outline-none"
          />
          <p className="text-[10px] text-ink-mute mt-1.5">
            LinkedIn requires you to message from your own session — open a recruiter above, then paste this in.
          </p>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="neu rounded-2xl p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="text-sm font-semibold text-ink mt-1 truncate">{value}</div>
    </div>
  );
}

function formatRefreshed(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return '1d ago';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
