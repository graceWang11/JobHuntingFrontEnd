import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { TrackedJobsProvider } from './context/TrackedJobsContext';
import { AppShell } from './components/layout/AppShell';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Jobs } from './pages/Jobs';
import { Tracked } from './pages/Tracked';
import { Settings } from './pages/Settings';

function Root() {
  const { onboardingComplete, isAuthenticated } = useUser();
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingComplete } = useUser();
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <TrackedJobsProvider>
                  <AppShell />
                </TrackedJobsProvider>
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/tracked" element={<Tracked />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
