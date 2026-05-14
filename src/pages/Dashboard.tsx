import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Briefcase,
  CalendarCheck,
  Trophy,
  ArrowUpRight,
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Mail,
  Inbox,
  Send,
  CalendarClock,
  Dot,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Chip } from '../components/ui/Chip';
import { ParallaxLayer, TiltCard } from '../components/ui/Parallax';
import { useUser } from '../context/UserContext';
import { useTrackedJobs } from '../context/TrackedJobsContext';
import { fetchMatchedJobs } from '../lib/jobs';
import { useEmailFeed } from '../lib/useEmailFeed';
import { cn } from '../lib/cn';
import type { ApplicationStatus, Job } from '../lib/types';
import type { EmailStatus } from '../lib/email';

export function Dashboard() {
  const { preferences } = useUser();
  const { tracked } = useTrackedJobs();

  const applied = tracked.filter((t) => t.status !== 'saved').length;
  const interviews = tracked.filter((t) => t.status === 'interview').length;
  const offers = tracked.filter((t) => t.status === 'offer').length;
  const responseRate = applied
    ? Math.round(
        (tracked.filter((t) => ['screening', 'interview', 'offer'].includes(t.status)).length / applied) * 100,
      )
    : 0;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const appliedThisWeek = tracked.filter(
    (t) => t.status !== 'saved' && +new Date(t.updatedAt) >= weekAgo,
  ).length;
  const latestOffer = tracked
    .filter((t) => t.status === 'offer')
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];

  const [recent, setRecent] = useState<Job[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const { status: emailStatus, loading: emailLoading } = useEmailFeed();

  useEffect(() => {
    let cancelled = false;
    setLoadingMatches(true);
    fetchMatchedJobs({
      preferences,
      resumeSkills: preferences.keywords,
      limit: 4,
    })
      .then((jobs) => {
        if (!cancelled) setRecent(jobs);
      })
      .finally(() => {
        if (!cancelled) setLoadingMatches(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preferences]);

  const PIPELINE: { key: ApplicationStatus; label: string; tone: 'mint' | 'sky' | 'peach' | 'pink' | 'grad' }[] = [
    { key: 'saved', label: 'Saved', tone: 'sky' },
    { key: 'applied', label: 'Applied', tone: 'grad' },
    { key: 'screening', label: 'Screening', tone: 'pink' },
    { key: 'interview', label: 'Interview', tone: 'peach' },
    { key: 'offer', label: 'Offer', tone: 'mint' },
  ];

  return (
    <div className="space-y-12" style={{ perspective: '1200px' }}>
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ParallaxLayer depth={6}>
          <TiltCard max={5}>
            <StatCard
              icon={<Briefcase size={22} />}
              label="Applications"
              value={String(applied)}
              delta={appliedThisWeek > 0 ? `+${appliedThisWeek} this week` : undefined}
              tone="grad"
            />
          </TiltCard>
        </ParallaxLayer>
        <ParallaxLayer depth={9}>
          <TiltCard max={5}>
            <StatCard
              icon={<CalendarCheck size={22} />}
              label="Interviews"
              value={String(interviews)}
              tone="pink"
            />
          </TiltCard>
        </ParallaxLayer>
        <ParallaxLayer depth={12}>
          <TiltCard max={5}>
            <StatCard
              icon={<Trophy size={22} />}
              label="Offers"
              value={String(offers)}
              delta={latestOffer ? `🎉 ${latestOffer.job.company}` : undefined}
              tone="peach"
            />
          </TiltCard>
        </ParallaxLayer>
        <ParallaxLayer depth={15}>
          <TiltCard max={5}>
            <StatCard
              icon={<TrendingUp size={22} />}
              label="Response rate"
              value={`${responseRate}%`}
              tone="mint"
            />
          </TiltCard>
        </ParallaxLayer>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Pipeline */}
        <ParallaxLayer depth={5} className="xl:col-span-2">
          <Card className="!p-8">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Your pipeline</h2>
                <p className="text-sm text-ink-mute mt-1">Snapshot of where every application stands.</p>
              </div>
              <Link to="/jobs">
                <Button variant="glass" size="sm" rightIcon={<ArrowUpRight size={14} />}>
                  View all
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {PIPELINE.map(({ key, label, tone }, i) => {
                const items = tracked.filter((t) => t.status === key);
                return (
                  <ParallaxLayer key={key} depth={8 + i * 2}>
                    <div className="neu-inset rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                          {label}
                        </div>
                        <div className="text-xs font-bold text-ink">{items.length}</div>
                      </div>
                      <Progress value={Math.min(100, items.length * 25)} tone={tone} />
                      <div className="mt-4 space-y-2">
                        {items.slice(0, 2).map((t) => (
                          <div key={t.jobId} className="glass rounded-xl p-2.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span>{t.job.companyEmoji || '💼'}</span>
                              <span className="font-semibold text-ink truncate">{t.job.company}</span>
                            </div>
                            <div className="text-ink-mute truncate mt-0.5">{t.job.title}</div>
                          </div>
                        ))}
                        {items.length === 0 && (
                          <div className="text-xs text-ink-mute italic">empty</div>
                        )}
                      </div>
                    </div>
                  </ParallaxLayer>
                );
              })}
            </div>
          </Card>
        </ParallaxLayer>

        {/* Automation status */}
        <ParallaxLayer depth={14}>
          <TiltCard max={4}>
            <Card variant="glass-strong" className="!p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 grid place-items-center rounded-2xl bg-accent-grad text-white shadow-[0_8px_24px_rgba(124,92,255,0.45)]">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Auto-scout</h2>
                  <p className="text-xs text-ink-mute">Background agent running</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>

              <div className="space-y-4">
                <Row icon={<CheckCircle2 size={16} className="text-emerald-500" />} label="LinkedIn" value="48 new" />
                <Row icon={<CheckCircle2 size={16} className="text-emerald-500" />} label="Wellfound" value="12 new" />
                <Row icon={<CheckCircle2 size={16} className="text-emerald-500" />} label="Greenhouse boards" value="27 new" />
                <Row icon={<Clock size={16} className="text-accent-violet" />} label="Lever (in queue)" value="—" />
                <Row icon={<Circle size={16} className="text-ink-mute" />} label="Indeed" value="paused" />
              </div>

              <div className="mt-7 glass rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-ink-soft font-semibold">
                  <Sparkles size={14} className="text-accent-violet" />
                  Next sweep in 14 min
                </div>
              </div>
            </Card>
          </TiltCard>
        </ParallaxLayer>
      </div>

      {/* Inbox & outreach */}
      <ParallaxLayer depth={8}>
        <EmailActivity status={emailStatus} loading={emailLoading} />
      </ParallaxLayer>

      {/* Recent + filter snapshot */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <ParallaxLayer depth={7} className="xl:col-span-2">
          <Card className="!p-8">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Fresh from your scout</h2>
                <p className="text-sm text-ink-mute mt-1">
                  {loadingMatches ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Matching against your resume…
                    </span>
                  ) : (
                    'Top picks matching your filters'
                  )}
                </p>
              </div>
              <Link to="/jobs">
                <Button variant="glass" size="sm" rightIcon={<ArrowUpRight size={14} />}>
                  Browse jobs
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recent.map((j, i) => (
                <ParallaxLayer key={j.id} depth={4 + i * 2}>
                  <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/60 transition">
                    <div className="h-14 w-14 grid place-items-center text-2xl rounded-2xl neu-sm shrink-0">
                      {j.companyEmoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink truncate">{j.title}</span>
                        <span className="chip !text-[10px]">{j.type}</span>
                      </div>
                      <div className="text-sm text-ink-mute mt-1">
                        {j.company} · {j.location}
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end shrink-0">
                      <div className="text-sm font-bold text-grad">{j.matchScore}%</div>
                      <div className="text-xs text-ink-mute">match</div>
                    </div>
                    <Link to="/jobs">
                      <Button variant="primary" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </ParallaxLayer>
              ))}
            </div>
          </Card>
        </ParallaxLayer>

        <ParallaxLayer depth={12}>
          <TiltCard max={4}>
            <Card className="!p-8">
              <h2 className="font-display text-2xl font-bold text-ink">Active filters</h2>
              <p className="text-sm text-ink-mute mt-1">
                What your auto-scout is hunting for.
              </p>

              <div className="mt-6 space-y-5">
                <FilterRow title="Job type">
                  {preferences.jobTypes.map((t) => (
                    <Chip key={t} active className="capitalize">
                      {t}
                    </Chip>
                  ))}
                </FilterRow>
                <FilterRow title="Locations">
                  {preferences.locations.slice(0, 4).map((l) => (
                    <Chip key={l}>{l}</Chip>
                  ))}
                  {preferences.locations.length > 4 && (
                    <Chip>+{preferences.locations.length - 4}</Chip>
                  )}
                </FilterRow>
                <FilterRow title="Roles">
                  {preferences.desiredRoles.map((r) => (
                    <Chip key={r}>{r}</Chip>
                  ))}
                </FilterRow>
                <FilterRow title="Keywords">
                  {preferences.keywords.slice(0, 6).map((k) => (
                    <Chip key={k}>{k}</Chip>
                  ))}
                </FilterRow>
                <div className="neu-inset rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                      Salary
                    </div>
                    <div className="font-bold text-ink mt-0.5">
                      ${(preferences.minSalary / 1000).toFixed(0)}k — $
                      {(preferences.maxSalary / 1000).toFixed(0)}k
                    </div>
                  </div>
                  {preferences.visaSponsorship && (
                    <span className="chip-active !text-[10px]">Visa sponsored</span>
                  )}
                </div>
              </div>

              <Link to="/settings" className="block">
                <Button variant="neu" className="w-full mt-7">
                  Edit preferences
                </Button>
              </Link>
            </Card>
          </TiltCard>
        </ParallaxLayer>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  tone: 'grad' | 'mint' | 'pink' | 'peach';
}) {
  const grad = {
    grad: 'bg-accent-grad',
    mint: 'bg-gradient-to-br from-accent-mint to-accent-sky',
    pink: 'bg-gradient-to-br from-accent-pink to-accent-violet',
    peach: 'bg-gradient-to-br from-accent-peach to-accent-pink',
  }[tone];

  return (
    <Card className="!p-7">
      <div className="flex items-center justify-between mb-5">
        <div
          className={cn(
            'h-12 w-12 grid place-items-center rounded-2xl text-white shadow-[0_10px_24px_rgba(124,92,255,0.4)]',
            grad
          )}
        >
          {icon}
        </div>
        {delta && <span className="chip !text-[10px]">{delta}</span>}
      </div>
      <div className="font-display font-extrabold text-4xl text-ink leading-none">{value}</div>
      <div className="text-xs uppercase tracking-wider font-semibold text-ink-mute mt-3">
        {label}
      </div>
    </Card>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <span className="text-sm font-semibold text-ink truncate">{label}</span>
      </div>
      <span className="text-xs font-bold text-ink-soft">{value}</span>
    </div>
  );
}

function FilterRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2.5">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diffMin = Math.round((Date.parse(iso) - Date.now()) / 60_000);
  if (Math.abs(diffMin) < 60) return RELATIVE_TIME.format(diffMin, 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 48) return RELATIVE_TIME.format(diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  return RELATIVE_TIME.format(diffDay, 'day');
}

function EmailActivity({
  status,
  loading,
}: {
  status: EmailStatus | null;
  loading: boolean;
}) {
  return (
    <Card className="!p-8">
      <div className="flex items-center gap-3 mb-7">
        <div className="h-12 w-12 grid place-items-center rounded-2xl bg-accent-grad text-white shadow-[0_8px_24px_rgba(124,92,255,0.45)]">
          <Mail size={20} />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-ink">Inbox &amp; outreach</h2>
          <p className="text-sm text-ink-mute mt-0.5">
            Live activity from your connected email — updates stream in as the agent works.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {loading ? 'CONNECTING' : 'LIVE'}
        </span>
      </div>

      {!status ? (
        <div className="text-sm text-ink-mute inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Loading email activity…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Outbound */}
          <div className="neu-inset rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
              <Send size={14} />
              Outbound
            </div>
            <div className="font-display font-extrabold text-3xl text-ink leading-none">
              {status.outbound.sentToday}
            </div>
            <div className="text-xs text-ink-mute mt-1">
              sent today · {status.outbound.sentTotal} all-time
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-ink-soft">
              <div className="flex items-center justify-between">
                <span>In flight</span>
                <span className="font-semibold text-ink">{status.outbound.inFlight}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last sent</span>
                <span className="font-semibold text-ink">
                  {relativeTime(status.outbound.lastSentAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Inbound */}
          <div className="neu-inset rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
              <Inbox size={14} />
              Inbound replies
            </div>
            <div className="font-display font-extrabold text-3xl text-ink leading-none">
              {status.inbound.unread}
              <span className="text-base text-ink-mute font-bold"> unread</span>
            </div>
            <div className="text-xs text-ink-mute mt-1">
              {status.inbound.repliesToday} replied today · {status.inbound.threadsTotal} threads
            </div>
            <div className="mt-4 space-y-2.5">
              {status.inbound.latestThreads.slice(0, 3).map((t) => (
                <div key={t.threadId} className="glass rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    {t.unread && (
                      <Dot size={20} className="text-accent-violet shrink-0 -mx-1.5" />
                    )}
                    <span className="font-semibold text-ink truncate">{t.from.name}</span>
                    <span className="ml-auto text-ink-mute text-[10px] shrink-0">
                      {relativeTime(t.receivedAt)}
                    </span>
                  </div>
                  <div className="text-xs text-ink-mute truncate mt-0.5">{t.subject}</div>
                </div>
              ))}
              {status.inbound.latestThreads.length === 0 && (
                <div className="text-xs text-ink-mute italic">no replies yet</div>
              )}
            </div>
          </div>

          {/* Follow-ups */}
          <div className="neu-inset rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
              <CalendarClock size={14} />
              Scheduled follow-ups
            </div>
            <div className="font-display font-extrabold text-3xl text-ink leading-none">
              {status.followUps.scheduledTotal}
            </div>
            <div className="text-xs text-ink-mute mt-1">in queue</div>
            <div className="mt-4 space-y-2.5">
              {status.followUps.items.slice(0, 3).map((f) => (
                <div key={f.id} className="glass rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-ink truncate">{f.to.name}</span>
                    <span className="ml-auto text-ink-mute text-[10px] shrink-0">
                      {relativeTime(f.scheduledFor)}
                    </span>
                  </div>
                  <div className="text-xs text-ink-mute truncate mt-0.5">
                    {f.template.replace(/-/g, ' ')}
                  </div>
                </div>
              ))}
              {status.followUps.items.length === 0 && (
                <div className="text-xs text-ink-mute italic">queue empty</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
