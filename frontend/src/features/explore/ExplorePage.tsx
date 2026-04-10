import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Globe, Lock, GitFork, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { repositoriesService } from '@/services/repositories.service';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { cn, formatRelativeTime } from '@/lib/utils';

type Tab = 'popular' | 'discover';

export default function ExplorePage() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: repoData, isLoading } = useQuery({
    queryKey: ['public-repositories', activeTab],
    queryFn: () => repositoriesService.list({ limit: 20 }),
  });

  const repos = repoData?.data ?? [];

  const filteredRepos = searchQuery.trim()
    ? repos.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : repos;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Explore public repositories
          </h1>
          <p className="mt-2 text-text-secondary max-w-lg mx-auto">
            Discover projects, browse code, and find inspiration from the SpectraGit community.
          </p>
        </motion.div>

        {/* Search */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative max-w-md mx-auto"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories..."
            className="pl-9 h-10 text-sm bg-background"
          />
        </motion.form>

        {!isAuthenticated && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-text-tertiary"
          >
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Sign in
            </Link>{' '}
            to create your own repositories and collaborate.
          </motion.p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('popular')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'popular'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border',
          )}
        >
          <TrendingUp className="h-4 w-4" />
          Popular
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'discover'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border',
          )}
        >
          <Sparkles className="h-4 w-4" />
          Discover
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader />
      ) : filteredRepos.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchQuery ? 'No matching repositories' : 'No public repositories yet'}
          description={
            searchQuery
              ? 'Try a different search term.'
              : 'Be the first to create a public repository!'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRepos.map((repo, index) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link
                to={`/${repo.ownerUser?.username ?? repo.ownerOrg?.name ?? repo.owner?.username}/${repo.slug}`}
                className="block"
              >
                <Card className="h-full transition-colors hover:border-primary-200 hover:bg-surface-hover">
                  <CardContent className="pt-5 pb-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="h-4 w-4 shrink-0 text-primary-500" />
                        <span className="font-semibold text-primary-600 truncate">{repo.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                        {repo.visibility === 'PUBLIC' ? (
                          <Globe className="mr-0.5 h-2.5 w-2.5" />
                        ) : (
                          <Lock className="mr-0.5 h-2.5 w-2.5" />
                        )}
                        {repo.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                      </Badge>
                    </div>

                    {repo.description && (
                      <p className="text-xs text-text-secondary line-clamp-2">{repo.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-text-tertiary pt-1">
                      {(repo.ownerUser?.username ?? repo.ownerOrg?.name ?? repo.owner?.username) && (
                        <span>{repo.ownerUser?.username ?? repo.ownerOrg?.name ?? repo.owner?.username}</span>
                      )}
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary-400" />
                          {repo.language}
                        </span>
                      )}
                      {repo.isFork && (
                        <span className="flex items-center gap-0.5">
                          <GitFork className="h-3 w-3" /> Fork
                        </span>
                      )}
                      <span className="ml-auto">{formatRelativeTime(repo.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
