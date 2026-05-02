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
  const isIssues = location.pathname.includes('/issues');
  const isPulls = location.pathname.includes('/pulls');
  const isWiki = location.pathname.includes('/wiki');
  const hideSidebar = isSettings || isCollaborators || isIssues || isPulls || isWiki;

  return (
    <div className="space-y-4">
      <RepoHeader repo={repository} />
      <div className="grid grid-cols-1 gap-8 pt-2 lg:grid-cols-[248px_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-20 lg:self-start max-h-[55vh] overflow-y-auto scrollbar-thin lg:max-h-[calc(100dvh-6rem)]">
          <div className="rounded-xl border border-border bg-surface p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <RepoTabs />
          </div>
        </aside>
        <div className="min-w-0">
          <div className={`grid grid-cols-1 gap-8 ${!hideSidebar ? 'xl:grid-cols-[1fr_300px] xl:gap-10' : ''}`}>
            <div className="min-w-0">
              <Outlet context={{ repository }} />
            </div>
            {!hideSidebar && <RepoSidebar repo={repository} />}
          </div>
        </div>
      </div>
    </div>
  );
}
