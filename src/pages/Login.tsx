import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21.6 12.227c0-.728-.066-1.428-.189-2.1H12v3.973h5.382a4.604 4.604 0 01-1.996 3.02v2.51h3.232c1.89-1.74 2.982-4.305 2.982-7.403z"
      fill="#4285F4"
    />
    <path
      d="M12 22c2.7 0 4.964-.895 6.618-2.42l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.596-4.122H3.064v2.591A9.997 9.997 0 0012 22z"
      fill="#34A853"
    />
    <path
      d="M6.404 13.903a5.995 5.995 0 010-3.806V7.506H3.064a10 10 0 000 8.988l3.34-2.591z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.977c1.468 0 2.787.504 3.823 1.495l2.868-2.868C16.96 2.99 14.696 2 12 2 8.087 2 4.71 4.247 3.064 7.506l3.34 2.59C7.19 7.738 9.395 5.978 12 5.978z"
      fill="#EA4335"
    />
  </svg>
);

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.66-.31-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.54.12-3.21 0 0 1-.32 3.3 1.23a11.4 11.4 0 016 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.67.24 2.9.12 3.21.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0012 .5z" />
  </svg>
);
import { Logo } from '../components/ui/Logo';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ParallaxAurora, ParallaxLayer, TiltCard } from '../components/ui/Parallax';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/cn';

type Mode = 'signin' | 'signup';

export function Login() {
  const navigate = useNavigate();
  const { setAuthenticated, profile, setProfile } = useUser();
  const [mode, setMode] = useState<Mode>(profile ? 'signin' : 'signup');
  const [email, setEmail] = useState(profile?.email || '');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || password.length < 4) return;
    // Dummy auth — also fill profile if missing (signup without onboarding)
    if (!profile) {
      setProfile({
        fullName: email.split('@')[0],
        email,
        dob: '',
        avatar: '🦊',
      });
    }
    setAuthenticated(true);
    navigate('/dashboard');
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6"
      style={{ perspective: '1400px' }}
    >
      <ParallaxAurora />
      <div className="w-full max-w-md relative z-10">
        <ParallaxLayer depth={6}>
          <div className="flex justify-center mb-8">
            <Logo size={52} />
          </div>
        </ParallaxLayer>

        <ParallaxLayer depth={14}>
          <TiltCard max={4}>
            <Card variant="glass-strong" className="!p-10">
          <h1 className="font-display text-3xl font-extrabold text-ink text-center">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-ink-soft text-center mt-1">
            {mode === 'signin'
              ? 'Sign in to continue your job hunt.'
              : 'Sync your preferences and start auto-tracking.'}
          </p>

          {/* Mode switcher */}
          <div className="mt-6 neu-inset rounded-2xl p-1.5 grid grid-cols-2 gap-1">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'py-2 rounded-xl text-sm font-semibold transition',
                  mode === m
                    ? 'bg-accent-grad text-white shadow-[0_6px_18px_rgba(124,92,255,0.45)]'
                    : 'text-ink-soft hover:text-ink'
                )}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@driftr.app"
              leftIcon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-ink-mute hover:text-ink"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {mode === 'signin' && (
              <div className="flex justify-end -mt-2">
                <button type="button" className="text-sm font-semibold text-accent-violet hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight size={18} />}
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-white/60 flex-1" />
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              or
            </span>
            <div className="h-px bg-white/60 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="neu" leftIcon={<GoogleIcon size={18} />} className="w-full">
              Google
            </Button>
            <Button variant="neu" leftIcon={<GithubIcon size={18} />} className="w-full">
              GitHub
            </Button>
          </div>
            </Card>
          </TiltCard>
        </ParallaxLayer>

        <p className="text-center text-sm text-ink-soft mt-8">
          By continuing you agree to our{' '}
          <a className="font-semibold text-accent-violet hover:underline">Terms</a> and{' '}
          <a className="font-semibold text-accent-violet hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
