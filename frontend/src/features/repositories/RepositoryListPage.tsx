import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Search, Globe, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useRepositories } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';

export default function RepositoryListPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const { data: repoData, isLoading } = useRepositories();

  if (isLoading) return <PageLoader />;

  const repos = (repoData?.data ?? []).filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Repositories</h1>
        <Button asChild>
          <Link to="/repositories/new">
            <Plus className="h-4 w-4" />
            New
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a repository..."
          className="pl-9"
        />
      </div>

      {repos.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No repositories found"
          description={search ? 'Try a different search term.' : 'Create your first repository to get started.'}
          action={
            !search && (
              <Button asChild>
                <Link to="/repositories/new">
                  <Plus className="h-4 w-4" />
                  New repository
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
          {repos.map((repo) => (
            <Link
              key={repo.id}
              to={`/${user?.username}/${repo.slug}`}
              className="flex items-center justify-between p-4 transition-colors hover:bg-surface-hover"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary-600">{repo.name}</span>
                  <Badge variant={repo.visibility === 'PUBLIC' ? 'outline' : 'secondary'} className="text-[10px]">
                    {repo.visibility === 'PUBLIC' ? <Globe className="mr-0.5 h-2.5 w-2.5" /> : <Lock className="mr-0.5 h-2.5 w-2.5" />}
                    {repo.visibility.toLowerCase()}
                  </Badge>
                </div>
                {repo.description && (
                  <p className="mt-1 text-sm text-text-secondary truncate">{repo.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-xs text-text-tertiary">
                  {repo.language && <span>{repo.language}</span>}
                  <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
