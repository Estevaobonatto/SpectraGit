import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Globe,
  Lock,
  GitFork,
  TrendingUp,
  Sparkles,
  Users,
  Zap,
  Eye,
  X,
  ChevronDown,
  User as UserIcon,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { repositoriesService } from '@/services/repositories.service';
import { usersService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Repository, User } from '@/types';

type Tab = 'trending' | 'new' | 'people';
type Timeframe = 'week' | 'month' | 'all';

const SORT_MAP: Record<Exclude<Tab, 'people'>, 'trending' | 'recent'> = {
  trending: 'trending',
  new: 'recent',
};

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  week: 'This week',
  month: 'This month',
  all: 'All time',
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572a5',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  'C#': '#239120',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#fa7343',
  Kotlin: '#a97bff',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Vue: '#41b883',
};

function getLanguageColor(lang: string) {
  return LANGUAGE_COLORS[lang] ?? '#6b7280';
}

function LanguageChip({
  language,
  selected,
  onClick,
}: {
  language: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        selected
          ? 'bg-primary-50 border-primary-400 text-primary-700'
          : 'bg-surface border-border text-text-secondary hover:border-primary-300 hover:text-text-primary',
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getLanguageColor(language) }} />
      {language}
    </button>
  );
}

function RepoCard({ repo, index }: { repo: Repository; index: number }) {
  const ownerName =
    repo.ownerUser?.username ?? repo.ownerOrg?.name ?? (repo.owner as any)?.username ?? '';
  const pulse = repo.pulseCount ?? 0;
  const watches = repo.watchCount ?? 0;
  const forks = repo.forkCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link to={`/${ownerName}/${repo.slug}`} className="block h-full">
        <Card className="h-full transition-colors hover:border-primary-200 hover:bg-surface-hover">
          <CardContent className="pt-4 pb-3 space-y-2.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {repo.ownerUser?.avatarUrl ? (
                  <img
                    src={repo.ownerUser.avatarUrl}
                    alt={ownerName}
                    className="h-5 w-5 rounded-full shrink-0 object-cover"
                  />
                ) : repo.ownerOrg?.avatarUrl ? (
                  <img
                    src={repo.ownerOrg.avatarUrl}
                    alt={ownerName}
                    className="h-5 w-5 rounded-full shrink-0 object-cover"
                  />
                ) : (
                  <BookOpen className="h-4 w-4 shrink-0 text-primary-500" />
                )}
                <span className="font-semibold text-primary-600 truncate text-sm">
                  {ownerName && <span className="text-text-tertiary font-normal">{ownerName}/</span>}
                  {repo.name}
                </span>
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

            {/* Description */}
            {repo.description && (
              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                {repo.description}
              </p>
            )}

            {/* Topics */}
            {repo.topics && repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {repo.topics.slice(0, 4).map((topic) => (
                  <span
                    key={topic}
                    className="px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] rounded-full border border-primary-100"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 text-xs text-text-tertiary pt-0.5">
              {repo.language && (
                <span className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  />
                  {repo.language}
                </span>
              )}
              {pulse > 0 && (
                <span className="flex items-center gap-0.5">
                  <Zap className="h-3 w-3" />
                  {pulse}
                </span>
              )}
              {watches > 0 && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {watches}
                </span>
              )}
              {forks > 0 && (
                <span className="flex items-center gap-0.5">
                  <GitFork className="h-3 w-3" />
                  {forks}
                </span>
              )}
              <span className="ml-auto">{formatRelativeTime(repo.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function UserCard({ user, index }: { user: User & { totalPulses?: number }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link to={`/${user.username}`} className="block h-full">
        <Card className="h-full transition-colors hover:border-primary-200 hover:bg-surface-hover">
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="h-10 w-10 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                <UserIcon className="h-5 w-5 text-text-tertiary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-text-primary truncate">
                {user.displayName ?? user.username}
              </p>
              <p className="text-xs text-primary-600 truncate">@{user.username}</p>
              {user.bio && (
                <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                  {user.bio}
                </p>
              )}
              {user.location && (
                <p className="text-xs text-text-tertiary mt-0.5">{user.location}</p>
              )}
              {user.totalPulses !== undefined && user.totalPulses > 0 && (
                <p className="flex items-center gap-1 text-xs text-amber-600 mt-1 font-medium">
                  <Zap className="h-3 w-3" />
                  {user.totalPulses} pulse{user.totalPulses !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function ExplorePage() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [accumulatedRepos, setAccumulatedRepos] = useState<Repository[]>([]);
  const [peopleTimeframe, setPeopleTimeframe] = useState<Timeframe>('week');
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const prevTabRef = useRef(activeTab);
  const prevSearchRef = useRef(debouncedSearch);
  const prevLangRef = useRef(selectedLanguage);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page + accumulated list on filter change
  useEffect(() => {
    const tabChanged = prevTabRef.current !== activeTab;
    const searchChanged = prevSearchRef.current !== debouncedSearch;
    const langChanged = prevLangRef.current !== selectedLanguage;

    if (tabChanged || searchChanged || langChanged) {
      setPage(1);
      setAccumulatedRepos([]);
      prevTabRef.current = activeTab;
      prevSearchRef.current = debouncedSearch;
      prevLangRef.current = selectedLanguage;
    }
  }, [activeTab, debouncedSearch, selectedLanguage]);

  const isRepoTab = activeTab !== 'people';

  const repoQuery = useQuery({
    queryKey: ['explore-repos', activeTab, debouncedSearch, page],
    queryFn: () =>
      repositoriesService.list({
        repoSort: SORT_MAP[activeTab as Exclude<Tab, 'people'>],
        q: debouncedSearch || undefined,
        page,
        limit: 20,
      }),
    enabled: isRepoTab,
  });

  const peopleQuery = useQuery({
    queryKey: ['explore-people', debouncedSearch],
    queryFn: () => usersService.search(debouncedSearch || '', 20),
    enabled: !isRepoTab && !!debouncedSearch,
  });

  const popularPeopleQuery = useQuery({
    queryKey: ['explore-popular-people', peopleTimeframe],
    queryFn: () => usersService.getPopular(peopleTimeframe, 20),
    enabled: !isRepoTab && !debouncedSearch,
  });

  // Accumulate repo pages
  useEffect(() => {
    if (repoQuery.data?.data && isRepoTab) {
      if (page === 1) {
        setAccumulatedRepos(repoQuery.data.data);
      } else {
        setAccumulatedRepos((prev) => [...prev, ...repoQuery.data.data]);
      }
    }
  }, [repoQuery.data, page, isRepoTab]);

  // Client-side language filter on top of accumulated repos
  const displayedRepos = selectedLanguage
    ? accumulatedRepos.filter((r) => r.language === selectedLanguage)
    : accumulatedRepos;

  // Extract unique languages from current accumulated repos for chips
  const availableLanguages = Array.from(
    new Set(accumulatedRepos.map((r) => r.language).filter(Boolean) as string[]),
  ).sort();

  const totalPages = repoQuery.data?.meta?.totalPages ?? 1;
  const hasMore = page < totalPages;

  const isLoading = isRepoTab ? (page === 1 && repoQuery.isLoading) : debouncedSearch ? peopleQuery.isLoading : popularPeopleQuery.isLoading;
  const isLoadingMore = repoQuery.isFetching && page > 1;

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSelectedLanguage(null);
    setSearchQuery('');
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Explore SpectraGit
          </h1>
          <p className="mt-2 text-text-secondary max-w-lg mx-auto">
            Discover projects, people, and inspiration from the community.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative max-w-md mx-auto"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'people' ? 'Search people by username...' : 'Search repositories...'}
            className="pl-9 pr-9 h-10 text-sm bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>

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
            to create repositories and collaborate.
          </motion.p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => handleTabChange('trending')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'trending'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border',
          )}
        >
          <TrendingUp className="h-4 w-4" />
          Trending
        </button>
        <button
          onClick={() => handleTabChange('new')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'new'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border',
          )}
        >
          <Sparkles className="h-4 w-4" />
          New &amp; Noteworthy
        </button>
        {isAuthenticated && (
          <button
            onClick={() => handleTabChange('people')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'people'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border',
            )}
          >
            <Users className="h-4 w-4" />
            People
          </button>
        )}
      </div>

      {/* Language Filter Chips (repo tabs only) */}
      <AnimatePresence>
        {isRepoTab && availableLanguages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            <button
              onClick={() => setSelectedLanguage(null)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                !selectedLanguage
                  ? 'bg-primary-50 border-primary-400 text-primary-700'
                  : 'bg-surface border-border text-text-secondary hover:border-primary-300 hover:text-text-primary',
              )}
            >
              All
            </button>
            {availableLanguages.map((lang) => (
              <LanguageChip
                key={lang}
                language={lang}
                selected={selectedLanguage === lang}
                onClick={() => setSelectedLanguage(selectedLanguage === lang ? null : lang)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <PageLoader />
      ) : activeTab === 'people' ? (
        /* People tab */
        !debouncedSearch ? (
          /* Popular users (default) */
          <>
            {/* Timeframe selector */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Most popular developers by repository pulses
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowTimeframeMenu((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-text-tertiary" />
                  {TIMEFRAME_LABELS[peopleTimeframe]}
                  <ChevronDown className="h-3 w-3 text-text-tertiary" />
                </button>
                <AnimatePresence>
                  {showTimeframeMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 z-10 bg-background border border-border rounded-md shadow-lg overflow-hidden min-w-[130px]"
                    >
                      {(['week', 'month', 'all'] as Timeframe[]).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => { setPeopleTimeframe(tf); setShowTimeframeMenu(false); }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-xs hover:bg-surface-hover transition-colors',
                            tf === peopleTimeframe ? 'text-primary-700 font-medium' : 'text-text-secondary',
                          )}
                        >
                          {TIMEFRAME_LABELS[tf]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {popularPeopleQuery.isLoading ? (
              <PageLoader />
            ) : (popularPeopleQuery.data ?? []).length === 0 ? (
              <EmptyState
                icon={Users}
                title="No popular users yet"
                description="Be the first to pulse public repositories!"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(popularPeopleQuery.data ?? []).map((user, index) => (
                  <UserCard key={user.id} user={user as any} index={index} />
                ))}
              </div>
            )}
          </>
        ) : (peopleQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description={`No users matching "${debouncedSearch}".`}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(peopleQuery.data ?? []).map((user, index) => (
              <UserCard key={user.id} user={user} index={index} />
            ))}
          </div>
        )
      ) : (
        /* Repo tabs */
        displayedRepos.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={debouncedSearch ? 'No matching repositories' : 'No public repositories yet'}
            description={
              debouncedSearch
                ? 'Try a different search term.'
                : 'Be the first to create a public repository!'
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {displayedRepos.map((repo, index) => (
                <RepoCard key={repo.id} repo={repo} index={index} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoadingMore}
                  className="gap-2"
                >
                  {isLoadingMore ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Load more
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
