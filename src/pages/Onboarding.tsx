import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  User as UserIcon,
  FileText,
  SlidersHorizontal,
  Check,
  Upload,
  Building2,
  Home,
  Plane,
  Briefcase,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Card } from '../components/ui/Card';
import { ParallaxAurora, ParallaxLayer, TiltCard } from '../components/ui/Parallax';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Chip } from '../components/ui/Chip';
import { TagInput } from '../components/ui/TagInput';
import { Toggle } from '../components/ui/Toggle';
import { RangeSlider } from '../components/ui/RangeSlider';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Progress } from '../components/ui/Progress';
import { LocationPicker } from '../components/ui/LocationPicker';
import { useUser, DEFAULT_PREFERENCES } from '../context/UserContext';
import { POPULAR_LOCATIONS, POPULAR_ROLES } from '../data/locations';
import { parseResumeSkills } from '../lib/resume';
import type { ExperienceLevel, JobType, UserPreferences } from '../lib/types';
import { cn } from '../lib/cn';

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { icon: Sparkles, title: 'Welcome' },
  { icon: UserIcon, title: 'About You' },
  { icon: FileText, title: 'Resume' },
  { icon: SlidersHorizontal, title: 'Preferences' },
  { icon: Check, title: 'Done' },
];

const JOB_TYPE_OPTS: { value: JobType; label: string; icon: React.ReactNode }[] = [
  { value: 'remote', label: 'Remote', icon: <Home size={16} /> },
  { value: 'hybrid', label: 'Hybrid', icon: <Plane size={16} /> },
  { value: 'onsite', label: 'On-site', icon: <Building2 size={16} /> },
];

const EXPERIENCE_OPTS: { value: ExperienceLevel; label: string }[] = [
  { value: 'intern', label: 'Intern' },
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Staff' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { setProfile, setPreferences, completeOnboarding, setAuthenticated } = useUser();

  const [step, setStep] = useState<Step>(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [avatar, setAvatar] = useState('🦊');

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [parsingResume, setParsingResume] = useState(false);

  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  const totalSteps = STEPS.length;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const canNext = useMemo(() => {
    if (step === 1) return fullName.trim().length > 1 && email.includes('@') && dob;
    return true;
  }, [step, fullName, email, dob]);

  const next = () => setStep((s) => (Math.min(s + 1, totalSteps - 1) as Step));
  const back = () => setStep((s) => (Math.max(s - 1, 0) as Step));

  const onResume = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setResumeFile(f);
  };

  const clearResume = () => {
    setPrefs((p) => ({
      ...p,
      keywords: p.keywords.filter((k) => !extractedSkills.includes(k)),
    }));
    setResumeFile(null);
    setExtractedSkills([]);
  };

  useEffect(() => {
    if (!resumeFile) return;
    let cancelled = false;
    setParsingResume(true);
    parseResumeSkills(resumeFile)
      .then((res) => {
        if (cancelled) return;
        setExtractedSkills(res.skills);
        setPrefs((p) => ({
          ...p,
          keywords: Array.from(new Set([...p.keywords, ...res.skills])),
        }));
      })
      .finally(() => {
        if (!cancelled) setParsingResume(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resumeFile]);

  const toggleSkill = (skill: string) => {
    setPrefs((p) => ({
      ...p,
      keywords: p.keywords.includes(skill)
        ? p.keywords.filter((x) => x !== skill)
        : [...p.keywords, skill],
    }));
  };

  const addSkill = (skill: string) => {
    const v = skill.trim();
    if (!v) return;
    setExtractedSkills((s) => (s.includes(v) ? s : [...s, v]));
    setPrefs((p) => ({
      ...p,
      keywords: p.keywords.includes(v) ? p.keywords : [...p.keywords, v],
    }));
  };

  const removeSkill = (skill: string) => {
    setExtractedSkills((s) => s.filter((x) => x !== skill));
    setPrefs((p) => ({ ...p, keywords: p.keywords.filter((x) => x !== skill) }));
  };

  const finish = () => {
    setProfile({
      fullName,
      email,
      dob,
      avatar,
      resumeFileName: resumeFile?.name,
      resumeUploadedAt: resumeFile ? new Date().toISOString() : undefined,
      headline: prefs.desiredRoles[0] || 'Job seeker',
    });
    setPreferences(prefs);
    completeOnboarding();
    setAuthenticated(true);
    navigate('/dashboard');
  };

  const togglePrefList = <K extends keyof UserPreferences>(key: K, item: string) => {
    setPrefs((p) => {
      const list = p[key] as unknown as string[];
      const has = list.includes(item);
      return {
        ...p,
        [key]: has ? list.filter((x) => x !== item) : [...list, item],
      } as UserPreferences;
    });
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 md:p-12"
      style={{ perspective: '1400px' }}
    >
      <ParallaxAurora />
      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <ParallaxLayer depth={6}>
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <span className="text-sm text-ink-soft font-semibold">
              Step {step + 1} of {totalSteps}
            </span>
          </div>
        </ParallaxLayer>

        {/* Stepper */}
        <ParallaxLayer depth={10}>
          <Card variant="glass" className="!p-5 mb-5">
          <div className="flex items-center gap-2 md:gap-4 mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.title} className="flex items-center flex-1">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-2xl grid place-items-center transition shrink-0',
                      isActive
                        ? 'bg-accent-grad text-white shadow-[0_8px_24px_rgba(124,92,255,0.5)]'
                        : isDone
                          ? 'neu-sm text-accent-violet'
                          : 'neu-sm text-ink-mute'
                    )}
                  >
                    {isDone ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-1 mx-2 rounded-full',
                        i < step ? 'bg-accent-grad' : 'bg-white/40'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
            <Progress value={progressPct} />
          </Card>
        </ParallaxLayer>

        {/* Step body */}
        <ParallaxLayer depth={16}>
          <TiltCard max={3}>
            <Card variant="glass-strong" className="!p-10 md:!p-14 min-h-[480px]">
          {step === 0 && <StepWelcome />}
          {step === 1 && (
            <StepAbout
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              dob={dob}
              setDob={setDob}
              avatar={avatar}
              setAvatar={setAvatar}
            />
          )}
          {step === 2 && (
            <StepResume
              file={resumeFile}
              onUpload={onResume}
              onClear={clearResume}
              parsing={parsingResume}
              extractedSkills={extractedSkills}
              selectedSkills={prefs.keywords}
              onToggleSkill={toggleSkill}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
            />
          )}
          {step === 3 && (
            <StepPreferences
              prefs={prefs}
              setPrefs={setPrefs}
              togglePrefList={togglePrefList}
            />
          )}
          {step === 4 && (
            <StepDone fullName={fullName} avatar={avatar} />
          )}
            </Card>
          </TiltCard>
        </ParallaxLayer>

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back
          </Button>

          {step < totalSteps - 1 ? (
            <Button
              variant="primary"
              onClick={next}
              disabled={!canNext}
              rightIcon={<ArrowRight size={16} />}
            >
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={finish} rightIcon={<ArrowRight size={16} />}>
              Create account & see matches
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepWelcome() {
  return (
    <div className="text-center max-w-xl mx-auto py-6">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-grad shadow-[0_18px_50px_rgba(124,92,255,0.45)] mb-6">
        <Sparkles size={36} className="text-white" />
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-extrabold text-ink leading-tight">
        Welcome to <span className="text-grad">Driftr</span>
      </h1>
      <p className="mt-4 text-ink-soft leading-relaxed">
        Your AI-powered job hunting companion. We'll set up your profile in under 60 seconds,
        then quietly scout the right roles across the web — filtered exactly the way you want.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 text-left">
        <Feature icon={<Briefcase size={18} />} title="Auto-discover" body="We crawl, you choose." />
        <Feature icon={<SlidersHorizontal size={18} />} title="Tune anytime" body="Dynamic filters, your call." />
        <Feature icon={<Sparkles size={18} />} title="Track it all" body="One pipeline, zero chaos." />
      </div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="neu rounded-2xl p-4">
      <div className="h-9 w-9 grid place-items-center rounded-xl bg-accent-grad text-white mb-3">
        {icon}
      </div>
      <div className="font-semibold text-ink">{title}</div>
      <div className="text-sm text-ink-mute mt-0.5">{body}</div>
    </div>
  );
}

const AVATARS = ['🦊', '🐼', '🦋', '🐯', '🦄', '🐙', '🐨', '🦉', '🐳', '🦔'];

interface StepAboutProps {
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  dob: string;
  setDob: (v: string) => void;
  avatar: string;
  setAvatar: (v: string) => void;
}
function StepAbout(props: StepAboutProps) {
  const { fullName, setFullName, email, setEmail, dob, setDob, avatar, setAvatar } = props;
  return (
    <div>
      <h2 className="font-display text-3xl font-extrabold text-ink">A little about you</h2>
      <p className="text-ink-soft mt-1">This helps us personalize your matches.</p>

      <div className="mt-6">
        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
          Pick your avatar
        </span>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={cn(
                'h-12 w-12 rounded-2xl grid place-items-center text-2xl transition',
                avatar === a
                  ? 'bg-accent-grad shadow-[0_8px_24px_rgba(124,92,255,0.45)] scale-110'
                  : 'neu-sm hover:-translate-y-[2px]'
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
          placeholder="Ada Lovelace"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="ada@countess.io"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Date of birth"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          hint="Used for age-eligibility on certain roles. Never shared."
        />
      </div>
    </div>
  );
}

interface StepResumeProps {
  file: File | null;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  parsing: boolean;
  extractedSkills: string[];
  selectedSkills: string[];
  onToggleSkill: (skill: string) => void;
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
}
function StepResume({
  file,
  onUpload,
  onClear,
  parsing,
  extractedSkills,
  selectedSkills,
  onToggleSkill,
  onAddSkill,
  onRemoveSkill,
}: StepResumeProps) {
  return (
    <div>
      <h2 className="font-display text-3xl font-extrabold text-ink">Upload your resume</h2>
      <p className="text-ink-soft mt-1">
        We'll parse it to auto-extract skills and prefill your filters. PDF or DOCX up to 10MB.
      </p>

      <label
        className={cn(
          'mt-6 flex flex-col items-center justify-center text-center cursor-pointer rounded-3xl py-14 px-6 transition',
          file ? 'neu' : 'neu-inset hover:-translate-y-[1px]'
        )}
      >
        <input type="file" accept=".pdf,.doc,.docx" onChange={onUpload} className="hidden" />
        {file ? (
          <>
            <div className="h-16 w-16 grid place-items-center rounded-2xl bg-accent-grad text-white mb-4">
              <FileText size={28} />
            </div>
            <div className="font-bold text-ink text-lg">{file.name}</div>
            <div className="text-sm text-ink-mute mt-1">
              {(file.size / 1024).toFixed(1)} KB · uploaded just now
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClear();
              }}
              className="mt-4 text-sm font-semibold text-accent-rose hover:underline"
            >
              Replace file
            </button>
          </>
        ) : (
          <>
            <div className="h-16 w-16 grid place-items-center rounded-2xl neu-sm text-accent-violet mb-4">
              <Upload size={28} />
            </div>
            <div className="font-bold text-ink text-lg">Drop your resume here</div>
            <div className="text-sm text-ink-mute mt-1">or click to browse files</div>
          </>
        )}
      </label>

      {file && (
        <SkillsReview
          parsing={parsing}
          extractedSkills={extractedSkills}
          selectedSkills={selectedSkills}
          onToggle={onToggleSkill}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
        />
      )}

      {!file && (
        <div className="mt-4 glass rounded-2xl p-4 text-sm text-ink-soft">
          <strong className="text-ink">Tip:</strong> You can always update your resume later from
          Preferences. Skipping is fine — we'll use the filters you choose next.
        </div>
      )}
    </div>
  );
}

interface SkillsReviewProps {
  parsing: boolean;
  extractedSkills: string[];
  selectedSkills: string[];
  onToggle: (skill: string) => void;
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
}
function SkillsReview({
  parsing,
  extractedSkills,
  selectedSkills,
  onToggle,
  onAdd,
  onRemove,
}: SkillsReviewProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    }
  };

  return (
    <div className="mt-6 neu rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-ink">Skills from your resume</div>
          <div className="text-xs text-ink-mute mt-0.5">
            Tap a skill to toggle it. Add anything we missed.
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
          No skills detected yet. Add them manually below.
        </div>
      )}

      {extractedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extractedSkills.map((s) => {
            const active = selectedSkills.includes(s);
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
                  onClick={() => onToggle(s)}
                  className="cursor-pointer"
                >
                  {s}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(s)}
                  className="opacity-70 hover:opacity-100"
                  aria-label={`Remove ${s}`}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative flex items-center mt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder="Add a skill (e.g. Kubernetes)"
          className="input-neu pr-24"
        />
        {draft.trim() && (
          <button
            type="button"
            onClick={commit}
            className="absolute right-2 chip-active inline-flex items-center gap-1 !text-[11px] !py-1.5 !px-3 cursor-pointer"
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>

      <div className="text-xs text-ink-mute mt-3">
        {extractedSkills.filter((s) => selectedSkills.includes(s)).length} of{' '}
        {extractedSkills.length} resume skill
        {extractedSkills.length === 1 ? '' : 's'} added · also editable in Preferences.
      </div>
    </div>
  );
}

interface StepPreferencesProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  togglePrefList: <K extends keyof UserPreferences>(key: K, item: string) => void;
}
function StepPreferences({ prefs, setPrefs, togglePrefList }: StepPreferencesProps) {
  return (
    <div>
      <h2 className="font-display text-3xl font-extrabold text-ink">Set your job filters</h2>
      <p className="text-ink-soft mt-1">
        These power your dynamic feed. Tweak anytime in Preferences.
      </p>

      {/* Job type */}
      <div className="mt-6">
        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
          Job type
        </span>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPE_OPTS.map((o) => (
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
          Experience level
        </span>
        <SegmentedControl
          options={EXPERIENCE_OPTS}
          value={prefs.experienceLevel}
          onChange={(v) => setPrefs((p) => ({ ...p, experienceLevel: v }))}
        />
      </div>

      {/* Locations */}
      <div className="mt-6">
        <LocationPicker
          label="Preferred locations"
          values={prefs.locations}
          onChange={(next) => setPrefs((p) => ({ ...p, locations: next }))}
          suggestions={POPULAR_LOCATIONS}
          hint="Search popular cities or type any custom location and press Enter"
        />
      </div>

      {/* Roles */}
      <div className="mt-6">
        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
          Desired roles
        </span>
        <div className="flex flex-wrap gap-2 mb-3">
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
          onChange={(v) => setPrefs((p) => ({ ...p, keywords: v }))}
          placeholder="React, TypeScript, Figma…"
          hint="Press Enter to add"
        />
      </div>

      {/* Salary range */}
      <div className="mt-6">
        <RangeSlider
          label="Target salary (USD)"
          min={40000}
          max={400000}
          step={5000}
          valueMin={prefs.minSalary}
          valueMax={prefs.maxSalary}
          onChange={({ min, max }) => setPrefs((p) => ({ ...p, minSalary: min, maxSalary: max }))}
          format={(n) => `$${(n / 1000).toFixed(0)}k`}
        />
      </div>

      {/* Visa + relocate */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="neu rounded-2xl p-4">
          <Toggle
            checked={prefs.visaSponsorship}
            onChange={(v) => setPrefs((p) => ({ ...p, visaSponsorship: v }))}
            label="Need visa sponsorship"
            description="We'll only show roles that sponsor."
          />
        </div>
        <div className="neu rounded-2xl p-4">
          <Toggle
            checked={prefs.willingToRelocate}
            onChange={(v) => setPrefs((p) => ({ ...p, willingToRelocate: v }))}
            label="Willing to relocate"
            description="Open to moving for the right offer."
          />
        </div>
      </div>
    </div>
  );
}

function StepDone({ fullName, avatar }: { fullName: string; avatar: string }) {
  return (
    <div className="text-center max-w-md mx-auto py-6">
      <div className="text-7xl mb-4 animate-float inline-block">{avatar}</div>
      <h2 className="font-display text-3xl font-extrabold text-ink">
        You're all set{fullName ? `, ${fullName.split(' ')[0]}` : ''}!
      </h2>
      <p className="mt-3 text-ink-soft leading-relaxed">
        We've saved your preferences. Next, create your account so we can sync your job pipeline
        across devices and start the automated scout.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 text-left">
        <Stat label="Sources" value="42+" />
        <Stat label="Match" value="94%" />
        <Stat label="Setup" value="Done" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="neu rounded-2xl p-4">
      <div className="font-display font-extrabold text-xl text-grad">{value}</div>
      <div className="text-xs text-ink-mute font-semibold uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
