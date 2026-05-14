import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ParallaxAurora } from '../ui/Parallax';

export function AppShell() {
  return (
    <div className="relative flex min-h-screen">
      {/* Spatial background — moves with mouse */}
      <div className="fixed inset-0 -z-10">
        <ParallaxAurora />
      </div>

      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-10 lg:px-14 lg:py-12">
        <Topbar />
        <div className="space-y-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
