import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UserPreferences, UserProfile } from '../lib/types';

const STORAGE_KEY = 'driftr.user.v1';

interface PersistedState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  jobTypes: ['remote', 'hybrid'],
  locations: ['Adelaide', 'Melbourne'],
  visaSponsorship: false,
  workAuthorization: 'citizen',
  experienceLevel: 'entry',
  desiredRoles: ['Frontend Engineer'],
  keywords: ['React', 'TypeScript', 'Design Systems'],
  minSalary: 100000,
  maxSalary: 200000,
  willingToRelocate: false,
  remoteOnly: false,
  autoRefreshMinutes: 0,
};

const DEFAULT_STATE: PersistedState = {
  profile: null,
  preferences: DEFAULT_PREFERENCES,
  isAuthenticated: false,
  onboardingComplete: false,
};

interface UserContextValue extends PersistedState {
  setProfile: (p: UserProfile) => void;
  setPreferences: (next: Partial<UserPreferences>) => void;
  setAuthenticated: (v: boolean) => void;
  completeOnboarding: () => void;
  signOut: () => void;
  resetAll: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function loadState(): PersistedState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      preferences: { ...DEFAULT_PREFERENCES, ...(parsed.preferences || {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value: UserContextValue = useMemo(
    () => ({
      ...state,
      setProfile: (p) => setState((s) => ({ ...s, profile: p })),
      setPreferences: (next) =>
        setState((s) => ({ ...s, preferences: { ...s.preferences, ...next } })),
      setAuthenticated: (v) => setState((s) => ({ ...s, isAuthenticated: v })),
      completeOnboarding: () => setState((s) => ({ ...s, onboardingComplete: true })),
      signOut: () => setState((s) => ({ ...s, isAuthenticated: false })),
      resetAll: () => setState(DEFAULT_STATE),
    }),
    [state]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
