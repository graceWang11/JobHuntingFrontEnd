import { useEffect, useState, type ChangeEvent } from 'react';
import {
  User as UserIcon,
  FileText,
  SlidersHorizontal,
  Home,
  Plane,
  Building2,
  Upload,
  Trash2,
  Check,
  Save,
  Loader2,
  Sparkles,
  Link2,
  Unlink,
  Mail,
} from 'lucide-react';

const LinkedInIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
  </svg>
);
import { Card } from '../components/ui/Card';
import { ParallaxLayer, TiltCard } from '../components/ui/Parallax';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Toggle } from '../components/ui/Toggle';
import { RangeSlider } from '../components/ui/RangeSlider';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { TagInput } from '../components/ui/TagInput';
import { LocationPicker } from '../components/ui/LocationPicker';
import { Avatar } from '../components/ui/Avatar';
import { useUser } from '../context/UserContext';
import { POPULAR_LOCATIONS, POPULAR_ROLES } from '../data/locations';
import { parseResumeSkills } from '../lib/resume';
import { connectGoogle, connectLinkedIn, disconnect } from '../lib/integrations';
import type { ExperienceLevel, JobType, UserPreferences } from '../lib/types';
import { cn } from '../lib/cn';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'preferences', label: 'Job preferences', icon: SlidersHorizontal },
  { id: 'connections', label: 'Connections', icon: Link2 },
] as const;

const JOB_TYPES: { value: JobType; label: string; icon: React.ReactNode }[] = [
  { value: 'remote', label: 'Remote', icon: <Home size={14} /> },
  { value: 'hybrid', label: 'Hybrid', icon: <Plane size={14} /> },
  { value: 'onsite', label: 'On-site', icon: <Building2 size={14} /> },
];

const EXPERIENCE: { value: ExperienceLevel; label: string }[] = [
  { value: 'intern', label: 'Intern' },
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
];

const AUTO_REFRESH_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 360, label: '6h' },
];

const AVATARS = ['🦊', '🐼', '🦋', '🐯', '🦄', '🐙', '🐨', '🦉', '🐳', '🦔'];

export function Settings() {
  const { profile, preferences, setProfile, setPreferences } = useUser();

  const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>('profile');
  const [draft, setDraft] = useState(profile || {
    fullName: '',
    email: '',
    dob: '',
    avatar: '🦊',
  });
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [resumeName, setResumeName] = useState<string | undefined>(profile?.resumeFileName);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<'google' | 'linkedin' | null>(null);

  const togglePrefList = <K extends keyof UserPreferences>(key: K, item: string) => {
    setPrefs((p) => {
      const list = p[key] as unknown as string[];
      return {
        ...p,
        [key]: list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
      } as UserPreferences;
    });
  };

  const save = () => {
    setProfile({
      ...draft,
      avatarImage: draft.avatarImage,
      resumeFileName: resumeName,
      resumeUploadedAt: resumeName ? new Date().toISOString() : undefined,
    });
    setPreferences(prefs);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const onAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((d) => ({ ...d, avatarImage: reader.result as string }));
      }
    };
    reader.readAsDataURL(f);
  };

  const clearAvatarImage = () => setDraft((d) => ({ ...d, avatarImage: undefined }));

  const toggleConnection = async (provider: 'google' | 'linkedin') => {
    const current = draft.connections?.[provider];
    setLinkingProvider(provider);
    try {
      const res = current
        ? await disconnect(provider)
        : provider === 'google'
          ? await connectGoogle()
          : await connectLinkedIn();
      setDraft((d) => ({
        ...d,
        connections: { ...(d.connections || {}), [provider]: res.connected },
      }));
    } finally {
      setLinkingProvider(null);
    }
  };

  const onResume = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setResumeName(f.name);
      setResumeFile(f);
    }
  };

  const clearResume = () => {
    setResumeName(undefined);
    setResumeFile(null);
    setExtractedSkills([]);
  };

  useEffect(() => {
    if (!resumeFile) return;
    let cancelled = false;
    setParsing(true);
    parseResumeSkills(resumeFile)
      .then((res) => {
        if (cancelled) return;
        setExtractedSkills(res.skills);
        setPrefs((p) => {
          const mergedKeywords = Array.from(new Set([...p.keywords, ...res.skills]));
          // Push merged keywords to context immediately so /jobs auto-refetches
          // against the latest resume skills without waiting for a Save click.
          setPreferences({ keywords: mergedKeywords });
          return { ...p, keywords: mergedKeywords };
        });
      })
      .finally(() => {
        if (!cancelled) setParsing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resumeFile, setPreferences]);

  const toggleKeyword = (skill: string) => {
    setPrefs((p) => ({
      ...p,
      keywords: p.keywords.includes(skill)
        ? p.keywords.filter((x) => x !== skill)
        : [...p.keywords, skill],
    }));
  };

  const removeExtracted = (skill: string) => {
    setExtractedSkills((s) => s.filter((x) => x !== skill));
    setPrefs((p) => ({ ...p, keywords: p.keywords.filter((x) => x !== skill) }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8" style={{ perspective: '1200px' }}>
      {/* Section nav */}
      <ParallaxLayer depth={8} className="h-fit lg:sticky lg:top-8">
        <Card variant="glass" className="!p-4">
        <div className="flex lg:flex-col gap-2 overflow-x-auto scrollbar-hidden">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition whitespace-nowrap',
                  active
                    ? 'bg-accent-grad text-white shadow-[0_8px_22px_rgba(124,92,255,0.45)]'
                    : 'text-ink-soft hover:bg-white/40'
                )}
              >
                <Icon size={16} /> {s.label}
              </button>
            );
          })}
        </div>
        </Card>
      </ParallaxLayer>

      <div className="space-y-8">
        {/* Profile */}
        {section === 'profile' && (
          <ParallaxLayer depth={12}>
            <TiltCard max={3}>
              <Card className="!p-8">
            <div className="flex items-center gap-4">
              <Avatar
                emoji={draft.avatar}
                image={draft.avatarImage}
                name={draft.fullName}
                size="xl"
              />
              <div>
                <h2 className="font-display text-2xl font-extrabold text-ink">Your profile</h2>
                <p className="text-ink-mute text-sm">Visible only to you (and recruiters you contact).</p>
              </div>
            </div>

            <div className="mt-6">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
                Avatar
              </span>

              <div className="flex items-center gap-3 mb-4">
                <label className="btn-neu cursor-pointer !py-2.5 !text-sm inline-flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarUpload}
                    className="hidden"
                  />
                  <Upload size={14} />
                  {draft.avatarImage ? 'Replace photo' : 'Upload a photo'}
                </label>
                {draft.avatarImage && (
                  <button
                    type="button"
                    onClick={clearAvatarImage}
                    className="text-sm font-semibold text-accent-rose hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Remove photo
                  </button>
                )}
              </div>

              <div className="text-xs text-ink-mute mb-2">
                {draft.avatarImage ? 'Custom photo overrides the emoji below.' : 'Or pick an emoji:'}
              </div>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setDraft({ ...draft, avatar: a })}
                    className={cn(
                      'h-12 w-12 rounded-2xl grid place-items-center text-2xl transition',
                      draft.avatar === a
                        ? 'bg-accent-grad shadow-[0_8px_24px_rgba(124,92,255,0.45)] scale-110'
                        : 'neu-sm hover:-translate-y-[2px]',
                      draft.avatarImage && 'opacity-60'
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <Input
                label="Full name"
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
              <Input
                label="Date of birth"
                type="date"
                value={draft.dob}
                onChange={(e) => setDraft({ ...draft, dob: e.target.value })}
              />
              <Input
                label="Headline"
                placeholder="e.g. Senior Frontend Engineer"
                value={draft.headline || ''}
                onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
              />
            </div>
              </Card>
            </TiltCard>
          </ParallaxLayer>
        )}

        {/* Resume */}
        {section === 'resume' && (
          <ParallaxLayer depth={12}>
            <TiltCard max={3}>
              <Card className="!p-8">
            <h2 className="font-display text-2xl font-extrabold text-ink">Resume</h2>
            <p className="text-ink-mute text-sm">
              Used to score job matches. Re-upload anytime — only the latest is kept.
            </p>

            {resumeName ? (
              <div className="mt-6 neu rounded-3xl p-5 flex items-center gap-4">
                <div className="h-14 w-14 grid place-items-center rounded-2xl bg-accent-grad text-white">
                  <FileText size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-ink truncate">{resumeName}</div>
                  <div className="text-sm text-ink-mute mt-0.5">
                    Uploaded · ready for matching
                  </div>
                </div>
                <label className="btn-neu cursor-pointer !py-2.5 !text-sm">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={onResume}
                    className="hidden"
                  />
                  Replace
                </label>
                <button
                  onClick={clearResume}
                  className="h-11 w-11 grid place-items-center rounded-2xl neu-sm text-accent-rose"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <label className="mt-6 flex flex-col items-center justify-center text-center cursor-pointer rounded-3xl py-14 px-6 neu-inset hover:-translate-y-[1px] transition">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={onResume}
                  className="hidden"
                />
                <div className="h-16 w-16 grid place-items-center rounded-2xl neu-sm text-accent-violet mb-4">
                  <Upload size={28} />
                </div>
                <div className="font-bold text-ink text-lg">Upload a resume</div>
                <div className="text-sm text-ink-mute mt-1">PDF or DOCX, up to 10MB</div>
              </label>
            )}

            {(resumeFile || parsing || extractedSkills.length > 0) && (
              <div className="mt-6 neu rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-accent-violet" />
                    <div>
                      <div className="font-bold text-ink">Skills detected</div>
                      <div className="text-xs text-ink-mute mt-0.5">
                        Tap to add or remove from your job filters.
                      </div>
                    </div>
                  </div>
                  {parsing && (
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-violet">
                      <Loader2 size={14} className="animate-spin" />
                      Parsing…
                    </div>
                  )}
                </div>

                {!parsing && extractedSkills.length === 0 && (
                  <div className="text-sm text-ink-mute">
                    No skills detected. You can still add them in Job preferences.
                  </div>
                )}

                {extractedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map((s) => {
                      const active = prefs.keywords.includes(s);
                      return (
                        <span
                          key={s}
                          className={cn(
                            'inline-flex items-center gap-1.5 !text-xs rounded-full transition',
                            active ? 'chip-active' : 'chip'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleKeyword(s)}
                            className="cursor-pointer"
                          >
                            {active ? <Check size={12} className="inline mr-1" /> : null}
                            {s}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExtracted(s)}
                            className="opacity-70 hover:opacity-100"
                            aria-label={`Remove ${s}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
              </Card>
            </TiltCard>
          </ParallaxLayer>
        )}

        {/* Preferences */}
        {section === 'preferences' && (
          <ParallaxLayer depth={12}>
            <Card className="!p-8">
            <h2 className="font-display text-2xl font-extrabold text-ink">Job preferences</h2>
            <p className="text-ink-mute text-sm">
              These power your auto-scout. Changes apply to new searches immediately.
            </p>

            {/* Job type */}
            <div className="mt-6">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
                Job type
              </span>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((o) => (
                  <Chip
                    key={o.value}
                    active={prefs.jobTypes.includes(o.value)}
                    onClick={() => togglePrefList('jobTypes', o.value)}
                    leftIcon={o.icon}
                    className="!text-sm !px-4 !py-2"
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="mt-6">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
                Experience
              </span>
              <SegmentedControl
                options={EXPERIENCE}
                value={prefs.experienceLevel}
                onChange={(v) => setPrefs({ ...prefs, experienceLevel: v })}
              />
            </div>

            {/* Locations */}
            <div className="mt-6">
              <LocationPicker
                label="Locations"
                values={prefs.locations}
                onChange={(next) => setPrefs({ ...prefs, locations: next })}
                suggestions={POPULAR_LOCATIONS}
                hint="Search or type any custom location and press Enter"
              />
            </div>

            {/* Roles */}
            <div className="mt-6">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
                Desired roles
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_ROLES.map((r) => (
                  <Chip
                    key={r}
                    active={prefs.desiredRoles.includes(r)}
                    onClick={() => togglePrefList('desiredRoles', r)}
                    className="!text-xs"
                  >
                    {r}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="mt-6">
              <TagInput
                label="Skills / keywords"
                values={prefs.keywords}
                onChange={(v) => setPrefs({ ...prefs, keywords: v })}
                placeholder="Type a skill and press Enter"
              />
            </div>

            {/* Salary */}
            <div className="mt-6">
              <RangeSlider
                label="Target salary (USD)"
                min={40000}
                max={400000}
                step={5000}
                valueMin={prefs.minSalary}
                valueMax={prefs.maxSalary}
                onChange={({ min, max }) => setPrefs({ ...prefs, minSalary: min, maxSalary: max })}
                format={(n) => `$${(n / 1000).toFixed(0)}k`}
              />
            </div>

            {/* Visa */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="neu rounded-2xl p-4">
                <Toggle
                  checked={prefs.visaSponsorship}
                  onChange={(v) => setPrefs({ ...prefs, visaSponsorship: v })}
                  label="Need visa sponsorship"
                  description="Only roles that sponsor"
                />
              </div>
              <div className="neu rounded-2xl p-4">
                <Toggle
                  checked={prefs.willingToRelocate}
                  onChange={(v) => setPrefs({ ...prefs, willingToRelocate: v })}
                  label="Open to relocation"
                  description="Roles outside saved locations"
                />
              </div>
            </div>

            {/* Auto-refresh */}
            <div className="mt-6">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
                Auto-refresh jobs
              </span>
              <SegmentedControl
                options={AUTO_REFRESH_OPTIONS}
                value={prefs.autoRefreshMinutes ?? 0}
                onChange={(v) => setPrefs({ ...prefs, autoRefreshMinutes: v })}
              />
              <p className="text-xs text-ink-mute mt-2">
                How often the Jobs page should re-run matching against the latest pipeline output.
              </p>
            </div>
            </Card>
          </ParallaxLayer>
        )}

        {/* Connections */}
        {section === 'connections' && (
          <ParallaxLayer depth={12}>
            <TiltCard max={3}>
              <Card className="!p-8">
                <h2 className="font-display text-2xl font-extrabold text-ink">Connections</h2>
                <p className="text-ink-mute text-sm">
                  Link your accounts so Driftr can sync calendars, inbox, and your professional
                  profile. Disconnect anytime.
                </p>

                <div className="mt-6 space-y-4">
                  <ConnectionRow
                    title="Google"
                    description="Sync Gmail for outreach + Calendar for interview holds."
                    icon={<Mail size={20} />}
                    iconBg="bg-gradient-to-br from-accent-peach to-accent-pink"
                    connected={!!draft.connections?.google}
                    loading={linkingProvider === 'google'}
                    onClick={() => toggleConnection('google')}
                  />
                  <ConnectionRow
                    title="LinkedIn"
                    description="Import your headline, experience, and saved jobs."
                    icon={<LinkedInIcon size={20} />}
                    iconBg="bg-gradient-to-br from-accent-sky to-accent-violet"
                    connected={!!draft.connections?.linkedin}
                    loading={linkingProvider === 'linkedin'}
                    onClick={() => toggleConnection('linkedin')}
                  />
                </div>

                <div className="mt-6 glass rounded-2xl p-4 text-sm text-ink-soft">
                  <strong className="text-ink">Heads up:</strong> linking is a stub right now —
                  the OAuth flow plugs into the backend once it's live.
                </div>
              </Card>
            </TiltCard>
          </ParallaxLayer>
        )}

        {/* Save bar */}
        <div className="glass-strong rounded-3xl p-5 flex items-center justify-between sticky bottom-6">
          <div className="text-sm text-ink-soft">
            Changes are local until you save. They'll sync once your backend is connected.
          </div>
          <Button
            variant="primary"
            onClick={save}
            leftIcon={savedFlash ? <Check size={16} /> : <Save size={16} />}
          >
            {savedFlash ? 'Saved' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConnectionRowProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  connected: boolean;
  loading: boolean;
  onClick: () => void;
}
function ConnectionRow({
  title,
  description,
  icon,
  iconBg,
  connected,
  loading,
  onClick,
}: ConnectionRowProps) {
  return (
    <div className="neu rounded-3xl p-5 flex items-center gap-4">
      <div
        className={cn(
          'h-14 w-14 grid place-items-center rounded-2xl text-white shadow-[0_8px_22px_rgba(124,92,255,0.4)]',
          iconBg
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-bold text-ink">{title}</div>
          {connected && (
            <span className="chip-active !text-[10px] inline-flex items-center gap-1">
              <Check size={10} />
              Connected
            </span>
          )}
        </div>
        <div className="text-sm text-ink-mute mt-0.5">{description}</div>
      </div>
      <Button
        variant={connected ? 'neu' : 'primary'}
        size="sm"
        onClick={onClick}
        disabled={loading}
        leftIcon={
          loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : connected ? (
            <Unlink size={14} />
          ) : (
            <Link2 size={14} />
          )
        }
      >
        {loading ? 'Working…' : connected ? 'Disconnect' : 'Connect'}
      </Button>
    </div>
  );
}
