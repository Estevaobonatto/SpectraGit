import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen,
  Scale,
  GitBranch,
  Tag,
  Zap,
  GitFork,
  Eye,
  Users,
  CircleDot,
  GitPullRequest,
  Package,
  Globe,
  Hash,
} from 'lucide-react';
import { useRepoStats } from '@/hooks/useRepositories';
import { useReleases } from '@/hooks/useReleases';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Repository } from '@/types';

// GitHub-like language colors
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Ruby: '#701516', Java: '#b07219', Kotlin: '#A97BFF', Go: '#00ADD8',
  Rust: '#dea584', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600',
  Swift: '#F05138', 'Objective-C': '#438eff', PHP: '#4F5D95',
  Scala: '#c22d40', Clojure: '#db5855', Elixir: '#6e4a7e',
  Haskell: '#5e5086', Lua: '#000080', R: '#198CE7', Dart: '#00B4AB',
  Vue: '#41b883', Svelte: '#ff3e00', CSS: '#563d7c', SCSS: '#c6538c',
  Less: '#1d365d', HTML: '#e34c26', XML: '#0060ac', JSON: '#292929',
  YAML: '#cb171e', TOML: '#9c4221', Markdown: '#083fa1', SQL: '#e38c00',
  Shell: '#89e051', PowerShell: '#012456', Dockerfile: '#384d54',
  Prisma: '#0c344b', GraphQL: '#e10098', 'Protocol Buffers': '#d4af37',
  HCL: '#844FBA', Zig: '#ec915c', Nim: '#ffc200', Perl: '#0298c3',
  Erlang: '#B83998', Batch: '#C1F12E',
};

interface RepoSidebarProps {
  repo: Repository;
}

export function RepoSidebar({ repo }: RepoSidebarProps) {
  const { owner } = useParams<{ owner: string }>();
  const { data: stats, isLoading } = useRepoStats(owner!, repo.slug);
  const { data: releases } = useReleases(owner!, repo.slug);

  const latestRelease = useMemo(() => {
    if (!releases || releases.length === 0) return null;
    return releases.find((r) => !r.isDraft) ?? null;
  }, [releases]);

  const languageEntries = useMemo(() => {
    if (!stats?.languages) return [];
    const total = Object.values(stats.languages).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(stats.languages)
      .sort(([, a], [, b]) => b - a)
      .map(([lang, bytes]) => ({
        lang,
        bytes,
        percent: ((bytes / total) * 100),
        color: LANG_COLORS[lang] || '#8b8b8b',
      }));
  }, [stats]);

  const topContributors = useMemo(() => {
    if (!stats?.contributors) return [];
    return stats.contributors.slice(0, 10);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-[var(--radius-md)] bg-surface-hover" />
        ))}
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
      className="w-full"
    >
      <Tabs defaultValue="about">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
        </TabsList>

        {/* ── About Tab ─────────────────────── */}
        <TabsContent value="about">
          <div className="space-y-5">
            {/* Description */}
            {repo.description && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {repo.description}
              </p>
            )}

            {/* Website */}
            {repo.website && (
              <a
                href={repo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 transition-colors truncate"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{repo.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}

            {/* Topics */}
            {repo.topics && repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors cursor-default"
                  >
                    <Hash className="h-2.5 w-2.5" />
                    {topic}
                  </span>
                ))}
              </div>
            )}

            {/* Resources */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Resources
              </h4>
              <div className="space-y-1.5">
                <Link
                  to={`/${owner}/${repo.slug}`}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary-500 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Readme
                </Link>
                <Link
                  to={`/${owner}/${repo.slug}`}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary-500 transition-colors"
                >
                  <Scale className="h-3.5 w-3.5" />
                  License
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Activity
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <StatItem icon={Zap} label="Pulses" value={repo.pulseCount ?? 0} />
                <StatItem icon={GitFork} label="Forks" value={repo.forkCount ?? 0} />
                <StatItem icon={Eye} label="Watchers" value={repo.watchCount ?? 0} />
                <StatItem
                  icon={GitBranch}
                  label="Branches"
                  value={stats?.branchCount ?? 0}
                  to={`/${owner}/${repo.slug}/branches`}
                />
                <StatItem icon={Tag} label="Tags" value={stats?.tagCount ?? 0} />
                {repo.hasIssuesEnabled !== false && (
                  <StatItem
                    icon={CircleDot}
                    label="Issues"
                    value={stats?.openIssueCount ?? 0}
                    to={`/${owner}/${repo.slug}/issues`}
                  />
                )}
                {repo.hasPRsEnabled !== false && (
                  <StatItem
                    icon={GitPullRequest}
                    label="Pull Requests"
                    value={stats?.openPrCount ?? 0}
                    to={`/${owner}/${repo.slug}/pull-requests`}
                  />
                )}
                <StatItem icon={Users} label="Contributors" value={stats?.contributors?.length ?? 0} />
              </div>
            </div>

            {/* Latest Release */}
            {latestRelease && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Latest Release
                </h4>
                <Link
                  to={`/${owner}/${repo.slug}/releases/${latestRelease.id}`}
                  className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-border p-2.5 hover:bg-surface-hover transition-colors group"
                >
                  <Package className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary group-hover:text-primary-500 transition-colors truncate">
                      {latestRelease.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Tag className="h-3 w-3 text-text-tertiary" />
                      <code className="text-xs text-text-tertiary">{latestRelease.tag.name}</code>
                      {latestRelease.isPrerelease && (
                        <Badge variant="warning" className="text-[10px] px-1 py-0">pre</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Language bar (compact) */}
            {languageEntries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Languages
                </h4>
                <LanguageBar entries={languageEntries} />
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {languageEntries.slice(0, 5).map(({ lang, percent, color }) => (
                    <span key={lang} className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {lang}
                      <span className="text-text-tertiary">{percent.toFixed(1)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Contributors Tab ──────────────── */}
        <TabsContent value="contributors">
          <div className="space-y-3">
            <p className="text-xs text-text-tertiary">
              {stats?.contributors.length ?? 0} contributor{(stats?.contributors.length ?? 0) !== 1 ? 's' : ''}
            </p>
            {topContributors.length === 0 ? (
              <p className="text-sm text-text-tertiary">No contributors yet.</p>
            ) : (
              <div className="space-y-2">
                {topContributors.map((c) => (
                  <div key={c.email} className="flex items-center gap-3">
                    <Avatar alt={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                      <p className="text-xs text-text-tertiary truncate">{c.email}</p>
                    </div>
                    <span className="text-xs text-text-tertiary whitespace-nowrap">
                      {c.commits} commit{c.commits !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Languages Tab ─────────────────── */}
        <TabsContent value="languages">
          <div className="space-y-3">
            {languageEntries.length === 0 ? (
              <p className="text-sm text-text-tertiary">No language data available.</p>
            ) : (
              <>
                <LanguageBar entries={languageEntries} />
                <div className="space-y-2">
                  {languageEntries.map(({ lang, percent, color, bytes }) => (
                    <div key={lang} className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium text-text-primary flex-1">{lang}</span>
                      <span className="text-xs text-text-tertiary">
                        {percent.toFixed(1)}%
                      </span>
                      <span className="text-xs text-text-tertiary w-16 text-right">
                        {formatBytes(bytes)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.aside>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */

function StatItem({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  to?: string;
}) {
  const content = (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border px-3 py-2 transition-colors hover:bg-surface-hover">
      <Icon className="h-3.5 w-3.5 text-text-tertiary" />
      <span className="text-sm font-semibold text-text-primary">{value}</span>
      <span className="text-xs text-text-tertiary">{label}</span>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}

function LanguageBar({ entries }: { entries: { lang: string; percent: number; color: string }[] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-hover">
          {entries.map(({ lang, percent, color }) => (
            <motion.div
              key={lang}
              className="h-full"
              style={{ backgroundColor: color, width: `${percent}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            />
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          {entries.slice(0, 5).map(({ lang, percent }) => (
            <div key={lang} className="text-xs">
              {lang}: {percent.toFixed(1)}%
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
