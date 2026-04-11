/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicShell } from '@/components/layout/PublicShell';
import { ProtectedRoute, PublicOnlyRoute, OptionalAuthRoute, AdminRoute } from './guards';
import { PageLoader } from '@/components/ui/spinner';

// Self-hosted: setup wizard + admin panel
const SetupWizardPage = lazy(() => import('@/features/setup/SetupWizardPage'));
const AdminLayout = lazy(() => import('@/features/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('@/features/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/features/admin/AdminUsersPage'));
const AdminSettingsPage = lazy(() => import('@/features/admin/AdminSettingsPage'));
const AdminHealthPage = lazy(() => import('@/features/admin/AdminHealthPage'));

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const OAuthCallbackPage = lazy(() => import('@/features/auth/OAuthCallbackPage'));
const HomePage = lazy(() => import('@/features/home/HomePage'));
const ExplorePage = lazy(() => import('@/features/explore/ExplorePage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const RepositoryListPage = lazy(() => import('@/features/repositories/RepositoryListPage'));
const RepositoryNewPage = lazy(() => import('@/features/repositories/RepositoryNewPage'));
const RepositoryLayout = lazy(() => import('@/features/repositories/RepositoryLayout'));
const CodeBrowserPage = lazy(() => import('@/features/repositories/CodeBrowserPage'));
const FileViewerPage = lazy(() => import('@/features/repositories/FileViewerPage'));
const CommitListPage = lazy(() => import('@/features/commits/CommitListPage'));
const CommitDetailPage = lazy(() => import('@/features/commits/CommitDetailPage'));
const BranchListPage = lazy(() => import('@/features/branches/BranchListPage'));
const TagListPage = lazy(() => import('@/features/tags/TagListPage'));
const ReleaseListPage = lazy(() => import('@/features/releases/ReleaseListPage'));
const ReleaseDetailPage = lazy(() => import('@/features/releases/ReleaseDetailPage'));
const IssueListPage = lazy(() => import('@/features/issues/IssueListPage'));
const IssueDetailPage = lazy(() => import('@/features/issues/IssueDetailPage'));
const IssueNewPage = lazy(() => import('@/features/issues/IssueNewPage'));
const PullRequestListPage = lazy(() => import('@/features/pull-requests/PullRequestListPage'));
const PullRequestDetailPage = lazy(() => import('@/features/pull-requests/PullRequestDetailPage'));
const PullRequestNewPage = lazy(() => import('@/features/pull-requests/PullRequestNewPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));
const OrganizationListPage = lazy(() => import('@/features/organizations/OrganizationListPage'));
const OrganizationNewPage = lazy(() => import('@/features/organizations/OrganizationNewPage'));
const OrganizationDetailPage = lazy(() => import('@/features/organizations/OrganizationDetailPage'));
const GitHubIntegrationPage = lazy(() => import('@/features/github-sync/GitHubIntegrationPage'));
const RepositorySettingsPage = lazy(() => import('@/features/repositories/RepositorySettingsPage'));
const ActivityFeedPage = lazy(() => import('@/features/activity/ActivityFeedPage'));
const ProfilePage = lazy(() => import('@/features/settings/ProfilePage'));

// Settings layout & sub-pages
const SettingsLayoutModule = import('@/features/settings/SettingsPage');
const SettingsLayout = lazy(() => SettingsLayoutModule.then((m) => ({ default: m.SettingsLayout })));
const SettingsProfilePage = lazy(() => SettingsLayoutModule.then((m) => ({ default: m.SettingsProfilePage })));
const SettingsSSHKeysPage = lazy(() => SettingsLayoutModule.then((m) => ({ default: m.SettingsSSHKeysPage })));
const SettingsTokensPage = lazy(() => SettingsLayoutModule.then((m) => ({ default: m.SettingsTokensPage })));
const SettingsSessionsPage = lazy(() => SettingsLayoutModule.then((m) => ({ default: m.SettingsSessionsPage })));
const SettingsAccountsPage = lazy(() => SettingsLayoutModule.then((m) => ({ default: m.SettingsAccountsPage })));
const SettingsNotificationsPage = lazy(() => SettingsLayoutModule.then((m) => ({ default: m.SettingsNotificationsPage })));
const SettingsDangerZonePage = lazy(() => SettingsLayoutModule.then((m) => ({ default: m.SettingsDangerZonePage })));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

/** Inline guard: protects a single route element, redirecting guests to /login */
function AuthRequired({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function AdminRequired({ children }: { children: React.ReactNode }) {
  return <AdminRoute>{children}</AdminRoute>;
}

export const router = createBrowserRouter([
  /* ---------- First-time setup wizard (unauthenticated) ---------- */
  {
    path: '/setup',
    element: <SuspenseWrapper><SetupWizardPage /></SuspenseWrapper>,
  },

  /* ---------- Admin panel (SYSTEM_ADMIN only) ---------- */
  {
    path: '/admin',
    element: (
      <AdminRequired>
        <SuspenseWrapper><AdminLayout /></SuspenseWrapper>
      </AdminRequired>
    ),
    children: [
      { index: true, element: <SuspenseWrapper><AdminDashboardPage /></SuspenseWrapper> },
      { path: 'users', element: <SuspenseWrapper><AdminUsersPage /></SuspenseWrapper> },
      { path: 'settings', element: <SuspenseWrapper><AdminSettingsPage /></SuspenseWrapper> },
      { path: 'health', element: <SuspenseWrapper><AdminHealthPage /></SuspenseWrapper> },
    ],
  },

  /* ---------- Auth pages ---------- */
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <SuspenseWrapper><LoginPage /></SuspenseWrapper>
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/auth/callback/:provider',
    element: <SuspenseWrapper><OAuthCallbackPage /></SuspenseWrapper>,
  },

  /* ---------- Main shell (guest + logged-in, navbar auto-switches) ---------- */
  {
    path: '/',
    element: (
      <OptionalAuthRoute>
        <PublicShell />
      </OptionalAuthRoute>
    ),
    children: [
      /* --- Open to everyone --- */
      {
        index: true,
        element: <SuspenseWrapper><HomePage /></SuspenseWrapper>,
      },
      {
        path: 'explore',
        element: <SuspenseWrapper><ExplorePage /></SuspenseWrapper>,
      },

      /* --- Auth-required pages --- */
      {
        path: 'dashboard',
        element: <AuthRequired><SuspenseWrapper><DashboardPage /></SuspenseWrapper></AuthRequired>,
      },
      {
        path: 'repositories',
        element: <AuthRequired><SuspenseWrapper><RepositoryListPage /></SuspenseWrapper></AuthRequired>,
      },
      {
        path: 'repositories/new',
        element: <AuthRequired><SuspenseWrapper><RepositoryNewPage /></SuspenseWrapper></AuthRequired>,
      },
      {
        path: 'notifications',
        element: <AuthRequired><SuspenseWrapper><NotificationsPage /></SuspenseWrapper></AuthRequired>,
      },
      {
        path: 'organizations',
        element: <AuthRequired><SuspenseWrapper><OrganizationListPage /></SuspenseWrapper></AuthRequired>,
      },
      {
        path: 'organizations/new',
        element: <AuthRequired><SuspenseWrapper><OrganizationNewPage /></SuspenseWrapper></AuthRequired>,
      },
      {
        path: 'orgs/:orgName',
        element: <AuthRequired><SuspenseWrapper><OrganizationDetailPage /></SuspenseWrapper></AuthRequired>,
      },
      {
        path: 'integrations/github',
        element: <AuthRequired><SuspenseWrapper><GitHubIntegrationPage /></SuspenseWrapper></AuthRequired>,
      },
      {
        path: 'settings',
        element: <AuthRequired><SuspenseWrapper><SettingsLayout /></SuspenseWrapper></AuthRequired>,
        children: [
          { index: true, element: <SuspenseWrapper><SettingsProfilePage /></SuspenseWrapper> },
          { path: 'ssh-keys', element: <SuspenseWrapper><SettingsSSHKeysPage /></SuspenseWrapper> },
          { path: 'tokens', element: <SuspenseWrapper><SettingsTokensPage /></SuspenseWrapper> },
          { path: 'sessions', element: <SuspenseWrapper><SettingsSessionsPage /></SuspenseWrapper> },
          { path: 'accounts', element: <SuspenseWrapper><SettingsAccountsPage /></SuspenseWrapper> },
          { path: 'notifications', element: <SuspenseWrapper><SettingsNotificationsPage /></SuspenseWrapper> },
          { path: 'danger-zone', element: <SuspenseWrapper><SettingsDangerZonePage /></SuspenseWrapper> },
        ],
      },

      /* --- Public repo views --- */
      {
        path: ':owner/:repo',
        element: <SuspenseWrapper><RepositoryLayout /></SuspenseWrapper>,
        children: [
          {
            index: true,
            element: <SuspenseWrapper><CodeBrowserPage /></SuspenseWrapper>,
          },
          {
            path: 'tree/:branch/*',
            element: <SuspenseWrapper><CodeBrowserPage /></SuspenseWrapper>,
          },
          {
            path: 'blob/:branch/*',
            element: <SuspenseWrapper><FileViewerPage /></SuspenseWrapper>,
          },
          {
            path: 'issues',
            element: <SuspenseWrapper><IssueListPage /></SuspenseWrapper>,
          },
          {
            path: 'issues/new',
            element: <AuthRequired><SuspenseWrapper><IssueNewPage /></SuspenseWrapper></AuthRequired>,
          },
          {
            path: 'issues/:number',
            element: <SuspenseWrapper><IssueDetailPage /></SuspenseWrapper>,
          },
          {
            path: 'pulls',
            element: <SuspenseWrapper><PullRequestListPage /></SuspenseWrapper>,
          },
          {
            path: 'pulls/new',
            element: <AuthRequired><SuspenseWrapper><PullRequestNewPage /></SuspenseWrapper></AuthRequired>,
          },
          {
            path: 'pulls/:number',
            element: <SuspenseWrapper><PullRequestDetailPage /></SuspenseWrapper>,
          },
          {
            path: 'commits',
            element: <SuspenseWrapper><CommitListPage /></SuspenseWrapper>,
          },
          {
            path: 'commits/:sha',
            element: <SuspenseWrapper><CommitDetailPage /></SuspenseWrapper>,
          },
          {
            path: 'branches',
            element: <SuspenseWrapper><BranchListPage /></SuspenseWrapper>,
          },
          {
            path: 'tags',
            element: <SuspenseWrapper><TagListPage /></SuspenseWrapper>,
          },
          {
            path: 'releases',
            element: <SuspenseWrapper><ReleaseListPage /></SuspenseWrapper>,
          },
          {
            path: 'releases/:releaseId',
            element: <SuspenseWrapper><ReleaseDetailPage /></SuspenseWrapper>,
          },
          {
            path: 'activity',
            element: <SuspenseWrapper><ActivityFeedPage /></SuspenseWrapper>,
          },
          {
            path: 'settings',
            element: <AuthRequired><SuspenseWrapper><RepositorySettingsPage /></SuspenseWrapper></AuthRequired>,
          },
        ],
      },

      /* --- Public profile --- */
      {
        path: ':owner',
        element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper>,
      },
    ],
  },
]);
