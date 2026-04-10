import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute, PublicOnlyRoute } from './guards';
import { PageLoader } from '@/components/ui/spinner';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const OAuthCallbackPage = lazy(() => import('@/features/auth/OAuthCallbackPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const RepositoryListPage = lazy(() => import('@/features/repositories/RepositoryListPage'));
const RepositoryNewPage = lazy(() => import('@/features/repositories/RepositoryNewPage'));
const RepositoryLayout = lazy(() => import('@/features/repositories/RepositoryLayout'));
const CodeBrowserPage = lazy(() => import('@/features/repositories/CodeBrowserPage'));
const FileViewerPage = lazy(() => import('@/features/repositories/FileViewerPage'));
const CommitListPage = lazy(() => import('@/features/commits/CommitListPage'));
const CommitDetailPage = lazy(() => import('@/features/commits/CommitDetailPage'));
const BranchListPage = lazy(() => import('@/features/branches/BranchListPage'));
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
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const ProfilePage = lazy(() => import('@/features/settings/ProfilePage'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
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
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper>,
      },
      {
        path: 'repositories',
        element: <SuspenseWrapper><RepositoryListPage /></SuspenseWrapper>,
      },
      {
        path: 'repositories/new',
        element: <SuspenseWrapper><RepositoryNewPage /></SuspenseWrapper>,
      },
      {
        path: 'notifications',
        element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper>,
      },
      {
        path: 'organizations',
        element: <SuspenseWrapper><OrganizationListPage /></SuspenseWrapper>,
      },
      {
        path: 'organizations/new',
        element: <SuspenseWrapper><OrganizationNewPage /></SuspenseWrapper>,
      },
      {
        path: 'orgs/:orgName',
        element: <SuspenseWrapper><OrganizationDetailPage /></SuspenseWrapper>,
      },
      {
        path: 'integrations/github',
        element: <SuspenseWrapper><GitHubIntegrationPage /></SuspenseWrapper>,
      },
      {
        path: 'settings',
        element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper>,
      },
      {
        path: ':owner',
        element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper>,
      },
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
            element: <SuspenseWrapper><IssueNewPage /></SuspenseWrapper>,
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
            element: <SuspenseWrapper><PullRequestNewPage /></SuspenseWrapper>,
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
            path: 'settings',
            element: <Navigate to={`settings`} replace />,
          },
        ],
      },
    ],
  },
]);
