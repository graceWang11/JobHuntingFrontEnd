import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Bookmark, Settings, LogOut, Sparkles } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/cn';
import { useUser } from '../../context/UserContext';
import { Avatar } from '../ui/Avatar';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/tracked', label: 'Saved & applied', icon: Bookmark },
  { to: '/settings', label: 'Preferences', icon: Settings },
];

export function Sidebar() {
  const { profile, signOut } = useUser();

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 p-6 gap-6 h-screen sticky top-0">
      <Logo />

      <nav className="flex flex-col gap-2 mt-4">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition no-tap-highlight',
                isActive
                  ? 'bg-accent-grad text-white shadow-[0_10px_28px_rgba(124,92,255,0.45)]'
                  : 'text-ink-soft hover:bg-white/40'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'h-9 w-9 rounded-xl grid place-items-center transition',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'neu-sm text-ink-soft group-hover:text-ink'
                  )}
                >
                  <Icon size={18} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade card */}
      <div className="glass rounded-3xl p-5 mt-2">
        <div className="flex items-center gap-2 text-ink">
          <Sparkles size={18} className="text-accent-violet" />
          <span className="font-bold">Driftr Pro</span>
        </div>
        <p className="text-sm text-ink-soft mt-2 leading-relaxed">
          Auto-apply, unlimited tracking, and AI cover letters.
        </p>
        <button className="btn-primary w-full mt-4 !py-2.5 text-sm">Upgrade</button>
      </div>

      {/* Profile footer */}
      <div className="mt-auto neu rounded-3xl p-4 flex items-center gap-3">
        <Avatar
          emoji={profile?.avatar}
          image={profile?.avatarImage}
          name={profile?.fullName}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink truncate">
            {profile?.fullName || 'Guest'}
          </div>
          <div className="text-xs text-ink-mute truncate">
            {profile?.email || 'not signed in'}
          </div>
        </div>
        <button
          onClick={signOut}
          className="h-10 w-10 grid place-items-center rounded-xl neu-sm text-ink-soft hover:text-accent-rose transition"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
