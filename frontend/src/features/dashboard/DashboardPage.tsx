import { Link } from 'react-router-dom';
import { BookOpen, Plus, GitFork, Lock, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '@/stores/auth.store';
import { useRepositories } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: repoData, isLoading } = useRepositories({ limit: 10 });

  if (isLoading) return <PageLoader />;

  const repos = repoData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatarUrl} alt={user?.displayName ?? user?.username ?? ''} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.displayName ?? user?.username}</h1>
            <p className="text-sm text-text-secondary">Here's what's happening with your repositories</p>
          </div>
        </div>
        <Button asChild>
          <Link to="/repositories/new">
            <Plus className="h-4 w-4" />
            New repository
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-500" />
            Your repositories
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/repositories">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {repos.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No repositories yet"
              description="Create your first repository to get started."
              action={
                <Button asChild>
                  <Link to="/repositories/new">
                    <Plus className="h-4 w-4" />
                    Create repository
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {repos.map((repo, index) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Link
                    to={`/${user?.username}/${repo.slug}`}
                    className="flex items-center justify-between py-3 transition-colors hover:bg-surface-hover -mx-5 px-5 first:-mt-1"
                  >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="h-4 w-4 shrink-0 text-text-tertiary" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary-600 truncate">{repo.name}</span>
                        <Badge variant={repo.visibility === 'PUBLIC' ? 'outline' : 'secondary'} className="text-[10px] px-1.5">
                          {repo.visibility === 'PUBLIC' ? <Globe className="mr-0.5 h-2.5 w-2.5" /> : <Lock className="mr-0.5 h-2.5 w-2.5" />}
                          {repo.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                        </Badge>
                        {repo.isFork && (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            <GitFork className="mr-0.5 h-2.5 w-2.5" /> Fork
                          </Badge>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-text-secondary truncate mt-0.5">{repo.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-text-tertiary ml-4">
                    {formatRelativeTime(repo.updatedAt)}
                  </span>
                </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
