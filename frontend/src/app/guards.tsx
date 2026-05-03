import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { PageLoader } from '@/components/ui/spinner';
import { useSetupStatus } from '@/hooks/useAdmin';
import { IS_SELF_HOSTED } from '@/lib/config';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  // Wait for token validation to complete before redirecting.
  if (!isInitialized) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/** Renders children for any visitor (logged-in or guest). Waits for auth init. */
export function OptionalAuthRoute({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

/**
 * Redirects unauthenticated users to /login, then checks if the instance
 * requires first-time setup — if so, redirects to /setup.
 * Passes through once setup is confirmed complete.
 */
export function SetupGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();
  const { data, isLoading } = useSetupStatus();

  if (!isInitialized || isLoading) {
    return <PageLoader />;
  }

  // SaaS instances have no setup wizard — pass through directly.
  if (!IS_SELF_HOSTED) {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // Setup not complete → send everyone (including guests) to /setup
  if (data && !data.isSetupComplete) {
    return <Navigate to="/setup" replace />;
  }

  // Setup complete: normal auth check
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Restricts a route to SYSTEM_ADMIN users only.
 * Assumes the user is already authenticated (nest inside ProtectedRoute or SetupGuard).
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin panel is only available in self-hosted mode.
  if (!IS_SELF_HOSTED) {
    return <Navigate to="/" replace />;
  }

  // @ts-expect-error systemRole added by self-hosted extension
  if (user?.systemRole !== 'SYSTEM_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
