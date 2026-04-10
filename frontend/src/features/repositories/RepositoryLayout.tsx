import { Outlet, useParams } from 'react-router-dom';
import { useRepository } from '@/hooks/useRepositories';
import { RepoHeader } from '@/components/layout/RepoHeader';
import { RepoTabs } from '@/components/layout/RepoTabs';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';

export default function RepositoryLayout() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { data: repository, isLoading, error } = useRepository(owner!, repo!);

  if (isLoading) return <PageLoader />;

  if (error || !repository) {
    return (
      <Alert variant="error" title="Repository not found">
        The repository <strong>{owner}/{repo}</strong> does not exist or you don't have access.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <RepoHeader repo={repository} />
      <RepoTabs />
      <div className="pt-2">
        <Outlet context={{ repository }} />
      </div>
    </div>
  );
}
