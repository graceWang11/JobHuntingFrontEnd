import { useMemo, useState } from 'react';
import { Bookmark, Send, ListChecks, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ParallaxLayer } from '../components/ui/Parallax';
import { useTrackedJobs } from '../context/TrackedJobsContext';
import { JobRow } from './Jobs';
import type { ApplicationStatus } from '../lib/types';

type Tab = 'saved' | 'applied' | 'pipeline';

const TABS: { value: Tab; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'pipeline', label: 'Pipeline' },
];

const PIPELINE_STATUSES: ApplicationStatus[] = ['applied', 'screening', 'interview', 'offer'];

export function Tracked() {
  const { tracked, loading, setStatus, remove } = useTrackedJobs();
  const [tab, setTab] = useState<Tab>('saved');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const out: Record<ApplicationStatus, typeof tracked> = {
      saved: [],
      applied: [],
      screening: [],
      interview: [],
      offer: [],
      rejected: [],
    };
    for (const t of tracked) out[t.status].push(t);
    return out;
  }, [tracked]);

  const visible = useMemo(() => {
    if (tab === 'saved') return byStatus.saved;
    if (tab === 'applied') return byStatus.applied;
    // Pipeline: anything past 'saved'.
    return PIPELINE_STATUSES.flatMap((s) => byStatus[s]);
  }, [tab, byStatus]);

  const counts = {
    saved: byStatus.saved.length,
    applied: byStatus.applied.length,
    pipeline: PIPELINE_STATUSES.reduce((n, s) => n + byStatus[s].length, 0),
  };

  return (
    <div className="space-y-10" style={{ perspective: '1200px' }}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold text-ink">Saved & applied</h1>
          <p className="text-ink-mute">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Loading your tracked jobs…
              </span>
            ) : (
              <>
                <span className="font-bold text-grad">{counts.saved}</span> saved ·{' '}
                <span className="font-bold text-grad">{counts.applied}</span> applied ·{' '}
                <span className="font-bold text-grad">{counts.pipeline}</span> in pipeline
              </>
            )}
          </p>
        </div>

        <SegmentedControl
          options={TABS.map((t) => ({
            value: t.value,
            label: `${t.label} (${counts[t.value]})`,
          }))}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setExpandedId(null);
          }}
        />
      </div>

      <div className="space-y-4">
        {!loading && visible.length === 0 && (
          <EmptyState tab={tab} />
        )}

        {visible.map((t, i) => (
          <ParallaxLayer key={t.jobId} depth={4 + (i % 4) * 3}>
            <JobRow
              job={t.job}
              expanded={expandedId === t.jobId}
              status={t.status}
              onToggle={() => setExpandedId(expandedId === t.jobId ? null : t.jobId)}
              onSetStatus={(next) => {
                if (next === null) remove(t.jobId);
                else setStatus(t.jobId, next, t.job);
              }}
            />
          </ParallaxLayer>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const icon =
    tab === 'saved' ? <Bookmark size={28} /> : tab === 'applied' ? <Send size={28} /> : <ListChecks size={28} />;
  const title =
    tab === 'saved' ? 'No saved jobs yet' : tab === 'applied' ? 'No applications yet' : 'Pipeline is empty';
  const hint =
    tab === 'saved'
      ? 'Click the bookmark on any job in the Jobs page to save it for later.'
      : tab === 'applied'
        ? 'Hit Apply on a job to start tracking it here.'
        : 'Move applications into screening, interview, or offer to see them here.';
  return (
    <Card variant="glass" className="text-center py-14">
      <div className="h-14 w-14 mx-auto rounded-2xl bg-accent-grad text-white grid place-items-center">
        {icon}
      </div>
      <h3 className="font-display font-bold text-xl text-ink mt-4">{title}</h3>
      <p className="text-ink-mute mt-1">{hint}</p>
    </Card>
  );
}
