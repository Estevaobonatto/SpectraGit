import { Outlet, useParams, useLocation } from 'react-router-dom';
import { useRepository } from '@/hooks/useRepositories';
import { RepoHeader } from '@/components/layout/RepoHeader';
import { RepoTabs } from '@/components/layout/RepoTabs';
import { RepoSidebar } from '@/components/repo/RepoSidebar';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';

export default function RepositoryLayout() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const location = useLocation();
  const { data: repository, isLoading, error } = useRepository(owner!, repo!);

  if (isLoading) return <PageLoader />;

  if (error || !repository) {
    return (
      <Alert variant="error" title="Repository not found">
        The repository <strong>{owner}/{repo}</strong> does not exist or you don't have access.
      </Alert>
    );
  }

  const isSettings = location.pathname.endsWith('/settings');
  const isCollaborators = location.pathname.endsWith('/collaborators');
  const hideSidebar = isSettings || isCollaborators;

  return (
    <div className="space-y-4">
      <RepoHeader repo={repository} />
      <RepoTabs />
      <div className={`grid grid-cols-1 gap-8 pt-2 ${!hideSidebar ? 'lg:grid-cols-[1fr_280px]' : ''}`}>
        <div className="min-w-0">
          <Outlet context={{ repository }} />
        </div>
        {!hideSidebar && <RepoSidebar repo={repository} />}
      </div>
    </div>
  );
}
