import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Globe,
  Lock,
  GitFork,
  Zap,
  Eye,
  AlertCircle,
  GitPullRequest,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  TrendingUp,
  Star,
  FolderGit,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/stores/auth.store';
import { useRepositories } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { Avatar } from '@/components/ui/avatar';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Repository } from '@/types';

type FilterType = 'all' | 'public' | 'private' | 'forks';
type SortOption = 'updated' | 'recent' | 'trending' | 'name';
type ViewMode = 'grid' | 'list';

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'All',
  public: 'Public',
  private: 'Private',
  forks: 'Forks',
};

const SORT_LABELS: Record<SortOption, string> = {
  updated: 'Last updated',
  recent: 'Recently created',
  trending: 'Most pulsed',
  name: 'Name',
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

/* ─── Stats Cards ────────────────────────────────────────── */

function StatPill({
  icon: Icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
        active
          ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
          : 'bg-surface border-border text-text-secondary hover:border-primary-200 hover:text-text-primary',
      )}
    >
      <Icon className={cn('h-4 w-4', active ? 'text-primary-600' : 'text-text-tertiary')} />
      <span>{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </button>
  );
}

/* ─── Repo Card (Grid) ───────────────────────────────────── */

function RepoCard({ repo, index }: { repo: Repository; index: number }) {
  const ownerName = repo.ownerUser?.username ?? repo.ownerOrg?.name ?? '';
  const pulseCount = (repo as any).pulseCount ?? 0;
  const watchCount = (repo as any).watchCount ?? 0;
  const forkCount = (repo as any).forkCount ?? 0;
  const issueCount = (repo as any).issueCount ?? 0;
  const prCount = (repo as any).pullRequestCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link to={`/${ownerName}/${repo.slug}`} className="block h-full">
        <Card className="h-full hover:border-primary-200 hover:bg-surface-hover transition-colors group">
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {repo.ownerUser?.avatarUrl ? (
                  <img
                    src={repo.ownerUser.avatarUrl}
                    alt={ownerName}
                    className="h-6 w-6 rounded-full shrink-0 object-cover"
                  />
                ) : repo.ownerOrg?.avatarUrl ? (
                  <img
                    src={repo.ownerOrg.avatarUrl}
                    alt={ownerName}
                    className="h-6 w-6 rounded-full shrink-0 object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                    <BookOpen className="h-3.5 w-3.5 text-primary-500" />
                  </div>
                )}
                <span className="font-semibold text-primary-600 truncate text-sm group-hover:text-primary-700 transition-colors">
                  {repo.name}
                </span>
              </div>
              <Badge
                variant={repo.visibility === 'PUBLIC' ? 'outline' : 'secondary'}
                className="text-[10px] px-1.5 shrink-0"
              >
                {repo.visibility === 'PUBLIC' ? (
                  <Globe className="mr-0.5 h-2.5 w-2.5" />
                ) : (
                  <Lock className="mr-0.5 h-2.5 w-2.5" />
                )}
                {repo.visibility === 'PUBLIC' ? 'Public' : 'Private'}
              </Badge>
            </div>

            {/* Description */}
            {repo.description ? (
              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{repo.description}</p>
            ) : (
              <p className="text-xs text-text-tertiary italic">No description</p>
            )}

            {/* Topics */}
            {repo.topics && repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {repo.topics.slice(0, 3).map((topic) => (
                  <span
                    key={topic}
                    className="px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] rounded-full border border-primary-100"
                  >
                    {topic}
                  </span>
                ))}
                {repo.topics.length > 3 && (
                  <span className="px-1.5 py-0.5 text-text-tertiary text-[10px]">+{repo.topics.length - 3}</span>
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-[11px] text-text-tertiary pt-1">
              {repo.language && (
                <span className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  />
                  {repo.language}
                </span>
              )}
              {issueCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <AlertCircle className="h-3 w-3" />
                  {issueCount}
                </span>
              )}
              {prCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <GitPullRequest className="h-3 w-3" />
                  {prCount}
                </span>
              )}
              {pulseCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <Zap className="h-3 w-3" />
                  {pulseCount}
                </span>
              )}
              {watchCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {watchCount}
                </span>
              )}
              {forkCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <GitFork className="h-3 w-3" />
                  {forkCount}
                </span>
              )}
              <span className="ml-auto flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(repo.updatedAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

/* ─── Repo Row (List) ────────────────────────────────────── */

function RepoRow({ repo, index }: { repo: Repository; index: number }) {
  const ownerName = repo.ownerUser?.username ?? repo.ownerOrg?.name ?? '';
  const issueCount = (repo as any).issueCount ?? 0;
  const prCount = (repo as any).pullRequestCount ?? 0;
  const pulseCount = (repo as any).pulseCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
    >
      <Link
        to={`/${ownerName}/${repo.slug}`}
        className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background hover:bg-surface-hover transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {repo.ownerUser?.avatarUrl ? (
            <img
              src={repo.ownerUser.avatarUrl}
              alt={ownerName}
              className="h-7 w-7 rounded-full shrink-0 object-cover"
            />
          ) : repo.ownerOrg?.avatarUrl ? (
            <img
              src={repo.ownerOrg.avatarUrl}
              alt={ownerName}
              className="h-7 w-7 rounded-full shrink-0 object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-primary-500" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-primary-600 text-sm truncate group-hover:text-primary-700 transition-colors">
                {repo.name}
              </span>
              <Badge
                variant={repo.visibility === 'PUBLIC' ? 'outline' : 'secondary'}
                className="text-[10px] px-1.5 shrink-0"
              >
                {repo.visibility === 'PUBLIC' ? (
                  <Globe className="mr-0.5 h-2.5 w-2.5" />
                ) : (
                  <Lock className="mr-0.5 h-2.5 w-2.5" />
                )}
                {repo.visibility === 'PUBLIC' ? 'Public' : 'Private'}
              </Badge>
              {repo.isFork && (
                <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                  <GitFork className="mr-0.5 h-2.5 w-2.5" />
                  Fork
                </Badge>
              )}
            </div>
            {repo.description && (
              <p className="text-xs text-text-secondary truncate">{repo.description}</p>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-text-tertiary shrink-0">
          {repo.language && (
            <span className="flex items-center gap-1 w-20">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getLanguageColor(repo.language) }}
              />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-0.5 w-14 justify-end">
            <AlertCircle className="h-3 w-3" />
            {issueCount}
          </span>
          <span className="flex items-center gap-0.5 w-14 justify-end">
            <GitPullRequest className="h-3 w-3" />
            {prCount}
          </span>
          <span className="flex items-center gap-0.5 w-14 justify-end">
            <Zap className="h-3 w-3" />
            {pulseCount}
          </span>
          <span className="w-24 text-right text-text-tertiary">
            {formatRelativeTime(repo.updatedAt)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */

export default function RepositoryListPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortOption>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { data: repoData, isLoading } = useRepositories({ scope: 'mine' });

  const allRepos = repoData?.data ?? [];

  const stats = useMemo(() => {
    const total = allRepos.length;
    const publicCount = allRepos.filter((r) => r.visibility === 'PUBLIC').length;
    const privateCount = allRepos.filter((r) => r.visibility === 'PRIVATE').length;
    const forkCount = allRepos.filter((r) => r.isFork).length;
    return { total, public: publicCount, private: privateCount, forks: forkCount };
  }, [allRepos]);

  const filteredRepos = useMemo(() => {
    let result = allRepos;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.topics.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Type filter
    if (filter === 'public') result = result.filter((r) => r.visibility === 'PUBLIC');
    if (filter === 'private') result = result.filter((r) => r.visibility === 'PRIVATE');
    if (filter === 'forks') result = result.filter((r) => r.isFork);

    // Sort
    const sorted = [...result];
    switch (sort) {
      case 'recent':
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case 'trending':
        sorted.sort((a, b) => ((b as any).pulseCount ?? 0) - ((a as any).pulseCount ?? 0));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'updated':
      default:
        sorted.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
        break;
    }

    return sorted;
  }, [allRepos, search, filter, sort]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Repositories</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage and explore your {stats.total} repositories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/integrations/github">
              <GitFork className="h-4 w-4 mr-1.5" />
              Import
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/repositories/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New repository
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Pills */}
      <div className="flex flex-wrap gap-2">
        <StatPill
          icon={FolderGit}
          label="All"
          value={stats.total}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <StatPill
          icon={Globe}
          label="Public"
          value={stats.public}
          active={filter === 'public'}
          onClick={() => setFilter('public')}
        />
        <StatPill
          icon={Lock}
          label="Private"
          value={stats.private}
          active={filter === 'private'}
          onClick={() => setFilter('private')}
        />
        <StatPill
          icon={GitFork}
          label="Forks"
          value={stats.forks}
          active={filter === 'forks'}
          onClick={() => setFilter('forks')}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a repository..."
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sort */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowSortMenu((v) => !v)}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_LABELS[sort]}
              <ChevronDown className="h-3 w-3" />
            </Button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-10 bg-background border border-border rounded-md shadow-lg overflow-hidden min-w-[160px]"
                >
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSort(key);
                        setShowSortMenu(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs hover:bg-surface-hover transition-colors flex items-center gap-2',
                        sort === key ? 'text-primary-700 font-medium' : 'text-text-secondary',
                      )}
                    >
                      {key === 'updated' && <Clock className="h-3 w-3" />}
                      {key === 'recent' && <Star className="h-3 w-3" />}
                      {key === 'trending' && <TrendingUp className="h-3 w-3" />}
                      {key === 'name' && <SlidersHorizontal className="h-3 w-3" />}
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-surface">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'grid' ? 'bg-background shadow-sm text-primary-700' : 'text-text-tertiary hover:text-text-primary',
              )}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list' ? 'bg-background shadow-sm text-primary-700' : 'text-text-tertiary hover:text-text-primary',
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-xs text-text-secondary">
          Showing {filteredRepos.length} of {stats.total} repositories
        </p>
      )}

      {/* Content */}
      {filteredRepos.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No repositories found"
          description={
            search || filter !== 'all'
              ? 'Try adjusting your filters or search term.'
              : 'Create your first repository to get started.'
          }
          action={
            !search && filter === 'all' ? (
              <Button asChild size="sm">
                <Link to="/repositories/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  New repository
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRepos.map((repo, index) => (
            <RepoCard key={repo.id} repo={repo} index={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRepos.map((repo, index) => (
            <RepoRow key={repo.id} repo={repo} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
