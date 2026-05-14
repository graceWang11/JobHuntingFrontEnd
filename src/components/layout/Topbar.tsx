import { Search, Bell, Menu } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useUser } from '../../context/UserContext';

interface TopbarProps {
  onOpenMobileNav?: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const { profile } = useUser();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex items-center gap-3 mb-8">
      <button
        onClick={onOpenMobileNav}
        className="lg:hidden h-11 w-11 grid place-items-center rounded-2xl neu-sm text-ink-soft"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:flex flex-col">
        <div className="text-xs text-ink-mute font-semibold uppercase tracking-wider">
          {today}
        </div>
        <div className="font-display font-extrabold text-2xl text-ink">
          Hey {profile?.fullName?.split(' ')[0] || 'there'} 👋
        </div>
      </div>

      <div className="flex-1 max-w-xl ml-auto">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute"
          />
          <input
            placeholder="Search jobs, companies, tags…"
            className="input-neu pl-12"
          />
        </div>
      </div>

      <button className="h-11 w-11 grid place-items-center rounded-2xl neu-sm text-ink-soft relative hover:text-ink">
        <Bell size={18} />
        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-accent-pink ring-2 ring-base" />
      </button>

      <Avatar
        emoji={profile?.avatar}
        image={profile?.avatarImage}
        name={profile?.fullName}
        size="md"
      />
    </header>
  );
}
