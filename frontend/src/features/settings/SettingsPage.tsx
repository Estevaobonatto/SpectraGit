import { lazy, Suspense } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Settings, Key, Monitor, Link2, Bell, AlertTriangle, KeyRound, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageLoader } from '@/components/ui/spinner';
import { motion } from 'motion/react';

const ProfileSection = lazy(() => import('./sections/ProfileSection'));
const SSHKeysSection = lazy(() => import('./sections/SSHKeysSection'));
const TokensSection = lazy(() => import('./sections/TokensSection'));
const SessionsSection = lazy(() => import('./sections/SessionsSection'));
const ConnectedAccountsSection = lazy(() => import('./sections/ConnectedAccountsSection'));
const NotificationsSection = lazy(() => import('./sections/NotificationsSection'));
const DangerZoneSection = lazy(() => import('./sections/DangerZoneSection'));
const ProfileCustomizationSection = lazy(() => import('./sections/ProfileCustomizationSection'));

const NAV_ITEMS = [
  { to: '/settings', label: 'Profile', icon: Settings, end: true },
  { to: '/settings/customization', label: 'Profile Customization', icon: Palette },
  { to: '/settings/ssh-keys', label: 'SSH Keys', icon: Key },
  { to: '/settings/tokens', label: 'Access Tokens', icon: KeyRound },
  { to: '/settings/sessions', label: 'Sessions', icon: Monitor },
  { to: '/settings/accounts', label: 'Connected Accounts', icon: Link2 },
  { to: '/settings/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings/danger-zone', label: 'Danger Zone', icon: AlertTriangle },
];

export function SettingsLayout() {
  return (
    <motion.div
      className="mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary mb-6">
        <Settings className="h-6 w-6" />
        Settings
      </h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-52 shrink-0">
          <ul className="space-y-1 sticky top-20">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </motion.div>
  );
}

// Individual route components (used by router)
export function SettingsProfilePage() {
  return <Suspense fallback={<PageLoader />}><ProfileSection /></Suspense>;
}

export function SettingsSSHKeysPage() {
  return <Suspense fallback={<PageLoader />}><SSHKeysSection /></Suspense>;
}

export function SettingsTokensPage() {
  return <Suspense fallback={<PageLoader />}><TokensSection /></Suspense>;
}

export function SettingsSessionsPage() {
  return <Suspense fallback={<PageLoader />}><SessionsSection /></Suspense>;
}

export function SettingsAccountsPage() {
  return <Suspense fallback={<PageLoader />}><ConnectedAccountsSection /></Suspense>;
}

export function SettingsNotificationsPage() {
  return <Suspense fallback={<PageLoader />}><NotificationsSection /></Suspense>;
}

export function SettingsProfileCustomizationPage() {
  return <Suspense fallback={<PageLoader />}><ProfileCustomizationSection /></Suspense>;
}

export function SettingsDangerZonePage() {
  return <Suspense fallback={<PageLoader />}><DangerZoneSection /></Suspense>;
}

// Default export kept for backward compat with lazy import in router
export default function SettingsPage() {
  return <Navigate to="/settings" replace />;
}
